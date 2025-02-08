import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { sha256, ErrorNotFound, sleep } from '@crypt.fyi/core';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
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
  IconBrandGithub,
  IconShare,
  IconFile,
  IconWebhook,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { clipboardCopy } from '@/lib/clipboardCopy';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import parseDuration from 'parse-duration';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from 'react-i18next';
import { useClient } from '@/context/client';

const VALID_FILE_TYPES = ['Files', 'text/plain', 'text/uri-list', 'text/html'];

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

function getTranslatedTtlOptions(t: (key: string, options?: Record<string, unknown>) => string) {
  return [
    {
      label: t('common.time.minute', { count: 5, defaultValue_other: '{{count}} minutes' }),
      value: 5 * MINUTE,
    },
    {
      label: t('common.time.minute', { count: 30, defaultValue_other: '{{count}} minutes' }),
      value: 30 * MINUTE,
    },
    { label: t('common.time.hour', { count: 1, defaultValue_one: '{{count}} hour' }), value: HOUR },
    {
      label: t('common.time.hour', { count: 4, defaultValue_other: '{{count}} hours' }),
      value: 4 * HOUR,
    },
    {
      label: t('common.time.hour', { count: 12, defaultValue_other: '{{count}} hours' }),
      value: 12 * HOUR,
    },
    { label: t('common.time.day', { count: 1, defaultValue_one: '{{count}} day' }), value: DAY },
    {
      label: t('common.time.day', { count: 3, defaultValue_other: '{{count}} days' }),
      value: 3 * DAY,
    },
    {
      label: t('common.time.day', { count: 7, defaultValue_other: '{{count}} days' }),
      value: 7 * DAY,
    },
  ] as const;
}

const DEFAULT_TTL = 30 * MINUTE;

const createFormSchema = (t: (key: string, options?: Record<string, unknown>) => string) =>
  z
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

          if (ips.length > config.MAX_IP_RESTRICTIONS) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_big,
              maximum: config.MAX_IP_RESTRICTIONS,
              type: 'array',
              inclusive: true,
              message: t('create.errors.tooManyIps', { max: config.MAX_IP_RESTRICTIONS }),
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
                message: t('create.errors.invalidIp', { ip: trimmed }),
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
      fc: z
        .number({ coerce: true })
        .min(1)
        .max(10)
        .optional()
        .describe('burn after n failed attempts'),
      whu: z.string().describe('webhook: url of the webhook').optional(),
      whn: z.string().max(50).describe('webhook: name of the secret').optional(),
      whr: z.boolean().default(true).describe('webhook: should the webhook be called on read'),
      whfpk: z
        .boolean()
        .default(false)
        .describe(
          'webhook: should the webhook be called for failure to read based on password or key',
        ),
      whfip: z
        .boolean()
        .default(false)
        .describe('webhook: should the webhook be called for failure to read based on ip address'),
      whb: z
        .boolean()
        .default(false)
        .describe('webhook: should the webhook be called for secret burn'),
    })
    .superRefine((data, ctx) => {
      if (data.c.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['c'],
          message: t('create.errors.contentRequired'),
        });
      }
      if (data.b && data.rc !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rc'],
          message: t('create.errors.readCountWithBurn'),
        });
      }
      if (data.whu && !(data.whr || data.whfpk || data.whfip || data.whb)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whu'],
          message: t('create.errors.webhookConfigInvalid'),
        });
      }
    });

function findClosestTTL(duration: number, options: ReadonlyArray<{ value: number }>): number {
  if (duration <= 0) return DEFAULT_TTL;

  return options.reduce((prev, curr) => {
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

function getInitialValues(ttlOptions: ReadonlyArray<{ value: number }>) {
  const params = new URLSearchParams(window.location.search);

  const ttlParam = params.get('ttl');
  const burn = params.get('burn');
  const ips = params.get('ips');
  const readCount = params.get('readCount');
  const failureCount = params.get('fc');
  const webhookUrl = params.get('webhookUrl');
  const webhookName = params.get('webhookName');
  const webhookBurn = params.get('webhookBurn') === 'true';
  const webhookFailPk = params.get('webhookFailPk') === 'true';
  const webhookFailIp = params.get('webhookFailIp') === 'true';

  let ttl = DEFAULT_TTL;
  if (ttlParam) {
    const parsed = parseDuration(ttlParam);
    if (parsed) {
      ttl = findClosestTTL(parsed, ttlOptions);
    }
  }

  let rc: number | undefined;
  if (readCount) {
    const parsed = parseInt(readCount, 10);
    if (!isNaN(parsed)) {
      rc = parsed;
    }
  }

  return {
    c: '',
    p: '',
    b: burn !== null ? burn === 'true' : true,
    ttl,
    ips: ips || '',
    rc,
    whu: webhookUrl || '',
    whn: webhookName || '',
    whr: true,
    whb: webhookBurn,
    whfpk: webhookFailPk,
    whfip: webhookFailIp,
    fc: failureCount ? parseInt(failureCount, 10) : undefined,
  };
}

type FormSchema = ReturnType<typeof createFormSchema>;
type FormData = z.infer<FormSchema>;
type FormDataWithoutContent = Omit<FormData, 'c'>;

function updateUrlWithFormState(formData: FormDataWithoutContent) {
  const params = new URLSearchParams();

  if (formData.ttl !== DEFAULT_TTL) {
    params.set('ttl', `${formData.ttl}ms`);
  }

  if (formData.b !== true) {
    params.set('burn', formData.b.toString());
  }

  if (formData.ips) {
    params.set('ips', formData.ips);
  }

  if (formData.rc !== undefined) {
    params.set('readCount', formData.rc.toString());
  }

  if (formData.fc !== undefined) {
    params.set('fc', formData.fc.toString());
  }

  if (formData.whu) {
    params.set('webhookUrl', formData.whu);
    if (formData.whn) params.set('webhookName', formData.whn);
    if (formData.whb) params.set('webhookBurn', 'true');
    if (formData.whfpk) params.set('webhookFailPk', 'true');
    if (formData.whfip) params.set('webhookFailIp', 'true');
  }

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

const handleContentDrop = async (
  dataTransfer: DataTransfer,
): Promise<{ content: string; filename?: string }> => {
  if (dataTransfer.files.length > 0) {
    const file = dataTransfer.files[0];
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });

    return {
      content: JSON.stringify({
        type: 'file',
        name: file.name,
        content: base64,
      }),
      filename: file.name,
    };
  }

  const uriList = dataTransfer.getData('text/uri-list');
  if (uriList) {
    return { content: uriList };
  }

  const text = dataTransfer.getData('text/plain');
  return { content: text };
};

export function CreatePage() {
  const { t } = useTranslation();
  const formSchema = React.useMemo(() => createFormSchema(t), [t]);
  const ttlOptions = React.useMemo(() => getTranslatedTtlOptions(t), [t]);

  const [isAdvancedConfigurationOpen, setIsAdvancedConfigurationOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(
      params.get('ips') ||
      params.get('readCount') ||
      params.get('webhookUrl') ||
      params.get('fa')
    );
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: React.useMemo(() => getInitialValues(ttlOptions), [ttlOptions]),
  });
  const { watch } = form;

  React.useEffect(() => {
    const subscription = watch((value) => {
      if (!value) return;

      const formState: FormDataWithoutContent = {
        b: value.b ?? true,
        ttl: value.ttl ?? DEFAULT_TTL,
        whr: value.whr ?? false,
        whfpk: value.whfpk ?? false,
        whfip: value.whfip ?? false,
        whb: value.whb ?? false,
        fc: value.fc ?? undefined,
      };

      if (value.p !== undefined) formState.p = value.p;
      if (value.ips) formState.ips = value.ips;
      if (value.rc !== undefined) formState.rc = value.rc;
      if (value.whu) formState.whu = value.whu;
      if (value.whn) formState.whn = value.whn;
      if (value.fc !== undefined) formState.fc = value.fc;
      updateUrlWithFormState(formState);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const { client } = useClient();

  const createMutation = useMutation({
    mutationFn: async (input: z.infer<typeof formSchema>) => {
      await sleep(500, { enabled: config.IS_DEV });
      const result = await client.create({
        ...input,
        p: input.p,
        wh: input.whu
          ? {
              u: input.whu,
              n: input.whn,
              r: input.whr,
              fpk: input.whfpk,
              fip: input.whfip,
              b: input.whb,
            }
          : undefined,
      });

      const searchParams = new URLSearchParams();
      searchParams.set('key', result.key);
      if (input.p) {
        searchParams.set('p', 'true');
      }
      const url = `${window.location.origin}/${result.id}?${searchParams.toString()}`;
      await clipboardCopy(url);
      toast.info(t('create.success.urlCopied'));

      return {
        ...result,
        url,
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
  const resetForNewSecret = () => {
    const currentValues = form.getValues();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.files = null;
    }

    form.reset();

    const { c: _, ...valuesToKeep } = currentValues;
    Object.entries(valuesToKeep).forEach(([field, value]) => {
      form.setValue(field as keyof FormData, value);
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ id, dt }: { id: string; dt: string }) => {
      await sleep(500, { enabled: config.IS_DEV });
      try {
        await client.delete(id, dt);
      } catch (error) {
        if (error instanceof ErrorNotFound) {
          setIsUrlMasked(true);
          resetForNewSecret();
        }
        throw error;
      }
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success('Secret deleted');
      setIsUrlMasked(true);
      resetForNewSecret();
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
      const hash = sha256(createMutation.data?.url ?? '');
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
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();

    const types = Array.from(e.dataTransfer.types);
    const hasValidType = VALID_FILE_TYPES.some((type) => types.includes(type));

    setDragState(hasValidType ? 'dragging' : 'invalid');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState('none');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState('none');

    try {
      const { content, filename } = await handleContentDrop(e.dataTransfer);

      if (filename) {
        setSelectedFile(new File([content], filename));
        form.setValue('c', `${filename} (file)`);
      } else {
        setSelectedFile(null);
        form.setValue('c', content);
      }
    } catch (error) {
      toast.error(
        `Failed to process dropped content${error instanceof Error ? `: ${error.message}` : ''}`,
      );
    }
  };

  return (
    <div
      className="max-w-xl mx-auto py-8 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
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
                        <FormLabel>{t('create.form.content.label')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={createMutation.isPending || field.disabled || !!selectedFile}
                            placeholder={t('create.form.content.placeholder')}
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
                            <IconFile size={18} className="mr-1" />
                            {selectedFile ? (
                              <span className="flex items-center gap-2">
                                {t('create.form.content.fileSelected', {
                                  name: selectedFile.name,
                                  size: (selectedFile.size / 1024).toFixed(1),
                                })}
                              </span>
                            ) : (
                              t('create.form.content.fileHint')
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
                        <FormLabel>{t('create.form.password.label')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('create.form.password.placeholder')}
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
                        <FormLabel>{t('create.form.ttl.label')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(v) => {
                              field.onChange(Number(v));
                            }}
                            defaultValue={field.value?.toString()}
                            disabled={createMutation.isPending || field.disabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('create.form.ttl.placeholder')} />
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
                          <FormLabel>{t('create.form.burn.label')}</FormLabel>
                          <FormDescription>{t('create.form.burn.description')}</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Collapsible
                      open={isAdvancedConfigurationOpen}
                      onOpenChange={setIsAdvancedConfigurationOpen}
                    >
                      <CollapsibleTrigger className="group flex w-full items-center justify-start gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <IconChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        {t('create.form.advanced.toggle')}
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
                                    <FormLabel>{t('create.form.advanced.ip.label')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        placeholder={t('create.form.advanced.ip.placeholder')}
                                        {...field}
                                        disabled={createMutation.isPending || field.disabled}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                      {t('create.form.advanced.ip.description')}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="rc"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('create.form.advanced.readCount.label')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => {
                                          form.setValue('b', !e.target.value);
                                          field.onChange(e.target.value || undefined);
                                        }}
                                        disabled={createMutation.isPending || !!field.disabled}
                                        min={2}
                                        max={10}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                      {t('create.form.advanced.readCount.description')}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="fc"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {t('create.form.advanced.failedAttempts.label')}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value ? Number(e.target.value) : undefined,
                                          )
                                        }
                                        disabled={createMutation.isPending || field.disabled}
                                        min={1}
                                        max={10}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                      {t('create.form.advanced.failedAttempts.description')}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="whu"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('create.form.advanced.webhook.label')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="url"
                                        placeholder={t('create.form.advanced.webhook.placeholder')}
                                        {...field}
                                        disabled={createMutation.isPending || field.disabled}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                      {t('create.form.advanced.webhook.description')}
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              {form.watch('whu') && (
                                <div className="px-4 flex flex-col gap-4">
                                  <FormField
                                    control={form.control}
                                    name="whn"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          {t('create.form.advanced.webhook.nameLabel')}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="text"
                                            placeholder={t(
                                              'create.form.advanced.webhook.namePlaceholder',
                                            )}
                                            {...field}
                                            disabled={createMutation.isPending || field.disabled}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          {t('create.form.advanced.webhook.nameDescription')}
                                        </FormDescription>
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex flex-wrap items-center gap-2">
                                    <FormField
                                      control={form.control}
                                      name="whr"
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
                                          <FormLabel>
                                            {t('create.form.advanced.webhook.read')}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="whfpk"
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
                                          <FormLabel>
                                            {t('create.form.advanced.webhook.failureToReadPK')}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="whfip"
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
                                          <FormLabel>
                                            {t('create.form.advanced.webhook.failureToReadIP')}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="whb"
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
                                          <FormLabel>
                                            {t('create.form.advanced.webhook.burn')}
                                          </FormLabel>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <pre className="text-xs text-wrap bg-card text-card-foreground">
                                    {getWebhookSchemaString({
                                      name: form.watch('whn'),
                                      read: form.watch('whr'),
                                      burn: form.watch('whb'),
                                      failureKeyPassword: form.watch('whfpk'),
                                      failureIpAddress: form.watch('whfip'),
                                    })}
                                  </pre>
                                </div>
                              )}{' '}
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      </AnimatePresence>
                    </Collapsible>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={createMutation.isPending}>
                      <IconLock />
                      {t('common.create')}
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
                  <h2 className="text-xl font-bold mb-2">{t('create.success.title')}</h2>
                  <p className="text-muted-foreground text-sm mb-1">
                    {t('create.success.description.main')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {form.watch('p') && t('create.success.description.password')}
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
                    onClick={async () => {
                      if (createMutation.data?.url) {
                        if ('share' in navigator) {
                          await navigator.share({
                            url: createMutation.data?.url,
                          });
                        } else {
                          await clipboardCopy(createMutation.data.url);
                          toast.info(t('create.success.urlCopied'));
                        }
                      }
                    }}
                  >
                    {'share' in navigator ? <IconShare /> : <IconCopy />}
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
                      resetForNewSecret();
                    }}
                  >
                    {t('create.success.createAnother')}
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
                      {t('create.success.deleteSecret')}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-2 text-xs">
                  <IconClock className="text-muted-foreground size-4" />
                  <p className="text-muted-foreground">
                    {t('create.success.info.expires', {
                      time:
                        ttlOptions.find((option) => option.value === form.watch('ttl'))?.label ??
                        '',
                    })}
                  </p>
                  {form.watch('b') && (
                    <>
                      <IconFlame className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.failureCountReading')}
                      </p>
                    </>
                  )}
                  {form.watch('p') && (
                    <>
                      <IconLock className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.passwordProtected')}
                      </p>
                    </>
                  )}
                  {form.watch('ips') && (
                    <>
                      <IconNetwork className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.ipRestrictions', {
                          ips: form
                            .watch('ips')
                            ?.split(',')
                            .map((ip) => ip.trim())
                            .join(', '),
                        })}
                      </p>
                    </>
                  )}
                  {form.watch('rc') && (
                    <>
                      <IconEye className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.readCount', { count: form.watch('rc') })}
                      </p>
                    </>
                  )}
                  {form.watch('whu') && (
                    <>
                      <IconWebhook className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.webhook', {
                          url: form.watch('whu'),
                          events: [
                            form.watch('whr') && 'read',
                            form.watch('whb') && 'burn',
                            form.watch('whfpk') && 'failure (key/password)',
                            form.watch('whfip') && 'failure (IP)',
                          ]
                            .filter(Boolean)
                            .join(', '),
                        })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
            <div className="mt-4 text-center">
              <a
                href={config.CRYPT_FYI_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconBrandGithub className="size-4" />
                {t('common.starOnGithub')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('create.success.qrCode.title')}</DialogTitle>
            <DialogDescription>{t('create.success.qrCode.description')}</DialogDescription>
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
              <Button title={t('common.download')} variant="outline" onClick={handleDownloadQR}>
                <IconDownload className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const getWebhookSchemaString = ({
  name,
  read,
  burn,
  failureKeyPassword,
  failureIpAddress,
}: {
  name?: string;
  read: boolean;
  burn: boolean;
  failureKeyPassword: boolean;
  failureIpAddress: boolean;
}) => `{${name ? `\n\t"name": "${name}",` : ''}
\t"event": ${[read && '"READ"', burn && '"BURN"', failureKeyPassword && '"FAILURE_KEY_PASSWORD"', failureIpAddress && '"FAILURE_IP_ADDRESS"'].filter(Boolean).join(' | ') || 'never'},
\t"id": string,
\t"dt": string,
\t"ts": number
}`;
