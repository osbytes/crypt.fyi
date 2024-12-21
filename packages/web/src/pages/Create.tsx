import { formatDistance } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CreateVaultRequest,
  CreateVaultResponse,
  DeleteVaultRequest,
  generateRandomString,
} from '@crypt.fyi/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { config } from '@/config';
import { Card } from '@/components/ui/card';
import { sleep } from '@/lib/sleep';
import {
  IconLock,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconFlame,
  IconClock,
  IconQrcode,
  IconDownload,
  IconX,
  IconNetwork,
  IconChevronDown,
} from '@tabler/icons-react';
import { sha256 } from '@/lib/hash';
import { useRef, useState } from 'react';
import { clipboardCopy } from '@/lib/clipboardCopy';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import parseDuration from 'parse-duration';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEncryptionWorker } from '@/hooks/useEncryptionWorker';

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const MAX_IP_RESTRICTIONS = 3;

const formSchema = z
  .object({
    c: z.string().default('').describe('encrypted content'),
    b: z.boolean().default(true).describe('burn after reading'),
    p: z.string().default('').describe('password').optional(),
    ttl: z.number({ coerce: true }).default(HOUR).describe('time to live (TTL) in milliseconds'),
    ips: z
      .string()
      .default('')
      .describe('IP address or CIDR block restrictions')
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return true;
        const ips = val.split(',');

        if (ips.length > MAX_IP_RESTRICTIONS) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: MAX_IP_RESTRICTIONS,
            type: 'array',
            inclusive: true,
            message: `Too many IP restrictions (max ${MAX_IP_RESTRICTIONS})`,
          });
          return false;
        }

        for (const ip of ips) {
          const trimmed = ip.trim();
          const isValidIP = z.string().ip().safeParse(trimmed).success;
          const isValidCIDR = z
            .string()
            .regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/)
            .safeParse(trimmed).success;

          if (!isValidIP && !isValidCIDR) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Invalid IP address or CIDR block: ${trimmed}`,
            });
            return false;
          }
        }

        return true;
      }),
    rc: z
      .number({ coerce: true })
      .min(2)
      .max(10)
      .optional()
      .describe('maximum number of times the secret can be read'),
  })
  .superRefine((data, ctx) => {
    if (data.c.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['c'],
        message: 'Content is required',
      });
    }
    if (data.b && data.rc !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rc'],
        message: 'Read count cannot be used with burn after reading',
      });
    }
  });

const ttlOptions = [
  { label: '5 minutes', value: 5 * MINUTE },
  { label: '30 minutes', value: 30 * MINUTE },
  { label: '1 hour', value: HOUR },
  { label: '4 hours', value: 4 * HOUR },
  { label: '12 hours', value: 12 * HOUR },
  { label: '1 day', value: DAY },
  { label: '3 days', value: 3 * DAY },
  { label: '7 days', value: 7 * DAY },
];
const DEFAULT_TTL = 30 * MINUTE;

function findClosestTTL(duration: number): number {
  if (duration <= 0) return DEFAULT_TTL;

  return ttlOptions.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev - duration);
    const currDiff = Math.abs(curr.value - duration);
    return currDiff < prevDiff ? curr.value : prev;
  }, DEFAULT_TTL);
}

function svgToImage(svg: SVGElement): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = url;
  });
}

type DragState = 'none' | 'dragging' | 'invalid';

function getInitialValues() {
  const params = new URLSearchParams(window.location.search);
  const ttlParam = params.get('ttl');
  const burn = params.get('burn');

  let ttl = DEFAULT_TTL;
  if (ttlParam) {
    const parsed = parseDuration(ttlParam);
    if (parsed) {
      ttl = findClosestTTL(parsed);
    }
  }

  return {
    c: '',
    p: '',
    b: burn !== null ? burn === 'true' : true,
    ttl,
    ips: '',
    rc: undefined,
  };
}

export function CreatePage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

  const { encrypt } = useEncryptionWorker();
  const createMutation = useMutation({
    mutationFn: async (input: z.infer<typeof formSchema>) => {
      await sleep(500, { enabled: config.IS_DEV });
      const key = await generateRandomString(20);
      let encrypted = await encrypt(input.c, key);
      if (input.p) {
        encrypted = await encrypt(encrypted, input.p);
      }
      const h = await sha256(key + (input.p ?? ''));

      const result = await fetch(`${config.API_URL}/vault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          c: encrypted,
          h,
          b: input.b,
          ttl: input.ttl,
          ips: input.ips,
          rc: input.rc,
        } satisfies CreateVaultRequest),
      });

      if (!result.ok) throw new Error('something went wrong');

      const data = await (result.json() as Promise<CreateVaultResponse>);
      const searchParams = new URLSearchParams();
      searchParams.set('key', key);
      if (input.p) {
        searchParams.set('p', 'true');
      }
      const url = `${window.location.origin}/${data.id}?${searchParams.toString()}`;
      await clipboardCopy(url);
      toast.info('URL copied to clipboard');

      return {
        ...data,
        url,
        key,
      };
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      form.resetField('c');
      form.setValue('c', `${files[0].name} (file)`);
    }
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    let content = data.c;

    if (selectedFile) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.readAsDataURL(selectedFile);
      });

      content = JSON.stringify({
        type: 'file',
        name: selectedFile.name,
        content: base64,
      });
    }

    await createMutation.mutateAsync({
      ...data,
      c: content,
    });
  }

  const { isSubmitSuccessful } = form.formState;
  const { reset } = form;

  const deleteMutation = useMutation({
    mutationFn: async ({ id, dt }: { id: string; dt: string }) => {
      await sleep(500, { enabled: config.IS_DEV });
      const result = await fetch(`${config.API_URL}/vault/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dt } satisfies DeleteVaultRequest),
      });
      if (!result.ok) {
        if (result.status === 404) {
          setIsUrlMasked(true);
          reset();
          throw new Error('secret not found');
        }
        throw new Error(`unexpected status code ${result.status}`);
      }
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success('Secret deleted');
      setIsUrlMasked(true);
      reset();
    },
  });

  const [isUrlMasked, setIsUrlMasked] = useState(true);
  let maskedUrl = createMutation.data?.url;
  if (isUrlMasked && createMutation.data?.url) {
    const url = new URL(createMutation.data.url);
    const searchParams = new URLSearchParams(url.search);
    const key = searchParams.get('key');

    if (key) {
      searchParams.set('key', '*'.repeat(key.length));
    }

    maskedUrl = `${url.origin}/${'*'.repeat(createMutation.data.id.length)}?${searchParams.toString()}`;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const handleDownloadQR = async () => {
    const svg = qrCodeRef.current;
    if (!svg) return;

    try {
      const dataUrl = await svgToImage(svg);
      const link = document.createElement('a');
      const hash = await sha256(createMutation.data?.url ?? '');
      link.download = `crypt.fyi-qr-${hash.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error(`Failed to download QR code: ${error}`);
    }
  };

  const [dragState, setDragState] = useState<DragState>('none');

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setDragState('dragging');
    } else {
      setDragState('invalid');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState('none');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setDragState('dragging');
    } else {
      setDragState('invalid');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('none');

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  return (
    <div
      className="max-w-xl mx-auto relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {dragState !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 border-2 border-dashed rounded-lg z-50 flex items-center justify-center backdrop-blur-sm',
              dragState === 'dragging'
                ? 'border-primary bg-primary/5'
                : 'border-destructive bg-destructive/5',
            )}
          >
            <p
              className={cn(
                'text-2xl font-medium',
                dragState === 'dragging' ? 'text-primary' : 'text-destructive',
              )}
            >
              {dragState === 'dragging' ? 'Drop file here' : 'Invalid file type'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isSubmitSuccessful ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="c"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={createMutation.isPending || field.disabled || !!selectedFile}
                            placeholder="Enter your secret content here..."
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="flex items-center gap-2 text-[0.8rem] text-muted-foreground">
                          <p
                            className={cn(
                              'flex items-center justify-between cursor-pointer',
                              createMutation.isPending && 'pointer-events-none',
                            )}
                            aria-disabled={createMutation.isPending}
                            onClick={() =>
                              !createMutation.isPending && fileInputRef.current?.click()
                            }
                          >
                            {selectedFile ? (
                              <span className="flex items-center gap-2">
                                File selected: {selectedFile.name} (
                                {(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                            ) : (
                              'add a file by drag-n-drop or clicking here'
                            )}
                          </p>
                          {selectedFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              disabled={createMutation.isPending || field.disabled}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedFile(null);
                                form.resetField('c');
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                  fileInputRef.current.files = null;
                                }
                              }}
                            >
                              <IconX className="h-3 w-3" />
                            </Button>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              handleFiles(files);
                            }}
                            className="absolute inset-0 opacity-0 w-0 h-0"
                            disabled={createMutation.isPending || field.disabled}
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="p"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Optional (but recommended)"
                            {...field}
                            disabled={createMutation.isPending || field.disabled}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ttl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time to live</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(v) => {
                              field.onChange(Number(v));
                            }}
                            defaultValue={field.value?.toString()}
                            disabled={createMutation.isPending || field.disabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select expiration time" />
                            </SelectTrigger>
                            <SelectContent>
                              {ttlOptions.map(({ label, value }) => (
                                <SelectItem key={value} value={value.toString()}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="b"
                    render={({ field: { value, onChange, ...rest } }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            {...rest}
                            checked={value}
                            onCheckedChange={onChange}
                            disabled={createMutation.isPending || rest.disabled}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Burn after reading</FormLabel>
                          <FormDescription>
                            Guarantees only one recipient can access the secret
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Collapsible disabled={createMutation.isPending}>
                      <CollapsibleTrigger className="group flex w-full items-center justify-start gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <IconChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        advanced configuration
                      </CollapsibleTrigger>
                      <AnimatePresence initial={false}>
                        <CollapsibleContent asChild>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="space-y-4 pt-4">
                              <FormField
                                control={form.control}
                                name="ips"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>IP/CIDR allow-list</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        placeholder="192.168.1.1, 10.0.0.0/24, etc."
                                        {...field}
                                        disabled={createMutation.isPending || field.disabled}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Restrict access to specific IP addresses or CIDR blocks (comma
                                      separated)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="rc"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Read count</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Maximum number of times the secret can be read"
                                        {...field}
                                        onChange={(e) => {
                                          form.setValue('b', !e.target.value);
                                          // empty string is resulting in 0 for `rc` so convert to undefined
                                          field.onChange(e.target.value || undefined);
                                        }}
                                        disabled={createMutation.isPending || !!field.disabled}
                                        min={2}
                                        max={10}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      </AnimatePresence>
                    </Collapsible>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={createMutation.isPending}>
                      <IconLock />
                      Create
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <div className="space-y-4">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold mb-2">Secret Created!</h2>
                  <p className="text-muted-foreground text-sm mb-1">
                    Your secret has been created and the URL has been copied to your clipboard
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Share the URL{form.watch('p') && ` and password`} with the desired recipient
                  </p>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                  <Input
                    type={isUrlMasked ? 'password' : 'text'}
                    value={isUrlMasked ? maskedUrl : createMutation.data?.url}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsUrlMasked(!isUrlMasked)}
                  >
                    {isUrlMasked ? <IconEyeOff /> : <IconEye />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (createMutation.data?.url) {
                        clipboardCopy(createMutation.data.url);
                        toast.info('URL copied to clipboard');
                      }
                    }}
                  >
                    <IconCopy />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setIsQrDialogOpen(true)}>
                    <IconQrcode />
                  </Button>
                </div>

                <div className="flex justify-end flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUrlMasked(true);
                      reset();
                    }}
                  >
                    Create Another
                  </Button>
                  {createMutation.data && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (createMutation.data) {
                          deleteMutation.mutate({
                            id: createMutation.data.id,
                            dt: createMutation.data.dt,
                          });
                        }
                      }}
                      isLoading={deleteMutation.isPending}
                    >
                      Delete Secret
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-2 text-xs">
                  <IconClock className="text-muted-foreground size-4" />
                  <p className="text-muted-foreground">
                    Expires in: {formatDistance(form.watch('ttl'), 0)}
                  </p>
                  {form.watch('b') && (
                    <>
                      <IconFlame className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        Secret will be deleted after it is viewed
                      </p>
                    </>
                  )}
                  {form.watch('p') && (
                    <>
                      <IconLock className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">Password protected</p>
                    </>
                  )}
                  {form.watch('ips') && (
                    <>
                      <IconNetwork className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        IP restriction(s):{' '}
                        {form
                          .watch('ips')
                          ?.split(',')
                          .map((ip) => ip.trim())
                          .join(', ')}
                      </p>
                    </>
                  )}
                  {form.watch('rc') && (
                    <>
                      <IconEye className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">Read count: {form.watch('rc')}</p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Secret URL QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="qr-code p-4">
              {createMutation.data?.url && (
                <QRCodeSVG
                  ref={qrCodeRef}
                  value={createMutation.data.url}
                  size={256}
                  marginSize={4}
                  level="H"
                />
              )}
            </div>
            <div className="flex space-x-2">
              <Button title="Download QR Code" variant="outline" onClick={handleDownloadQR}>
                <IconDownload className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
