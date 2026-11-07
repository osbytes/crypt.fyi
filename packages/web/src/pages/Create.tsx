import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';
import { sha256, ErrorNotFound, sleep } from '@crypt.fyi/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, DragEvent } from 'react';
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
import { Label } from '@/components/ui/label';
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
  IconCoffee,
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
import { NumberInput } from '@/components/NumberInput';
import { RevealInput } from '@/components/RevealInput';
import { Pill } from '@/components/ui/pill';
import { Switch } from '@/components/ui/switch';
import { buildSecretLinks } from '@/lib/secretUrl';
import type { SecretLinks } from '@/lib/secretUrl';

const VALID_FILE_TYPES = ['Files', 'text/plain', 'text/uri-list', 'text/html'];
const MAX_FILE_SIZE = 1 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '1 MB';

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
      ttl: z.coerce.number().default(HOUR).describe('time to live (TTL) in milliseconds'),
      ips: z
        .string()
        .default('')
        .describe('IP address or CIDR block restrictions')
        .optional()
        .superRefine((val, ctx) => {
          if (!val) return;
          const ips = val.split(',');

          if (ips.length > config.MAX_IP_RESTRICTIONS) {
            ctx.addIssue({
              code: 'too_big',
              maximum: config.MAX_IP_RESTRICTIONS,
              type: 'array',
              inclusive: true,
              message: t('create.errors.tooManyIps', { max: config.MAX_IP_RESTRICTIONS }),
              origin: 'array',
            });
            return;
          }

          for (const ip of ips) {
            const trimmed = ip.trim();
            const isValidIP = z.union([z.ipv4(), z.ipv6()]).safeParse(trimmed).success;
            const isValidCIDR = z.union([z.cidrv4(), z.cidrv6()]).safeParse(trimmed).success;

            if (!isValidIP && !isValidCIDR) {
              ctx.addIssue({
                code: 'custom',
                message: t('create.errors.invalidIp', { ip: trimmed }),
              });
              return;
            }
          }
        }),
      rc: z
        .preprocess(
          (val) => (val === '' || val === undefined ? undefined : Number(val)),
          z.number().min(2).max(10).optional(),
        )
        .describe('maximum number of times the secret can be read'),
      fc: z
        .preprocess(
          (val) => (val === '' || val === undefined ? undefined : Number(val)),
          z.number().min(1).max(10).optional(),
        )
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
          code: 'custom',
          path: ['c'],
          message: t('create.errors.contentRequired'),
        });
      }
      if (data.b && data.rc !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['rc'],
          message: t('create.errors.readCountWithBurn'),
        });
      }
      if (data.whu && !(data.whr || data.whfpk || data.whfip || data.whb)) {
        ctx.addIssue({
          code: 'custom',
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
  const burn = params.get('b');
  const ips = params.get('ips');
  const readCount = params.get('rc');
  const failureCount = params.get('fc');
  const webhookUrl = params.get('whu');
  const webhookName = params.get('whn');
  const webhookBurn = params.get('whb') === 'true';
  const webhookFailPk = params.get('whfpk') === 'true';
  const webhookFailIp = params.get('whfip') === 'true';

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
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 10) {
      rc = parsed;
    }
  }

  let fc: number | undefined;
  if (failureCount) {
    const parsed = parseInt(failureCount, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      fc = parsed;
    }
  }

  return {
    c: '',
    p: '',
    b: burn !== null ? burn === 'true' : true,
    ttl,
    ips: ips || '',
    rc,
    fc,
    whu: webhookUrl || '',
    whn: webhookName || '',
    whr: true,
    whb: webhookBurn,
    whfpk: webhookFailPk,
    whfip: webhookFailIp,
  };
}

type FormValues = {
  c: string;
  b: boolean;
  ttl: number;
  whr: boolean;
  whfpk: boolean;
  whfip: boolean;
  whb: boolean;
  p?: string;
  ips?: string;
  rc?: number;
  fc?: number;
  whu?: string;
  whn?: string;
};

function updateUrlWithFormState(formData: FormValues) {
  const params = new URLSearchParams();

  if (formData.ttl !== DEFAULT_TTL) {
    params.set('ttl', `${formData.ttl}ms`);
  }

  if (formData.b !== true) {
    params.set('b', formData.b.toString());
  }

  if (formData.ips) {
    params.set('ips', formData.ips);
  }

  if (formData.rc) {
    params.set('rc', formData.rc.toString());
  }

  if (formData.fc) {
    params.set('fc', formData.fc.toString());
  }

  if (formData.whu) {
    params.set('whu', formData.whu);
    if (formData.whn) params.set('whn', formData.whn);
    if (formData.whb) params.set('whb', 'true');
    if (formData.whfpk) params.set('whfpk', 'true');
    if (formData.whfip) params.set('whfip', 'true');
  }

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
}

const handleContentDrop = (dataTransfer: DataTransfer): File | string => {
  if (dataTransfer.files.length > 0) {
    return dataTransfer.files[0];
  }

  const uriList = dataTransfer.getData('text/uri-list');
  if (uriList) {
    return uriList;
  }

  const text = dataTransfer.getData('text/plain');
  return text;
};

export function CreatePage() {
  const { t } = useTranslation();
  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const ttlOptions = useMemo(() => getTranslatedTtlOptions(t), [t]);

  const [isAdvancedConfigurationOpen, setIsAdvancedConfigurationOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get('ips') || params.get('rc') || params.get('whu') || params.get('fc'));
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: useMemo(() => getInitialValues(ttlOptions), [ttlOptions]),
    // Validate only on submit so blurring an empty field (e.g. tabbing/clicking
    // away from the content textarea toward the file button) doesn't surface the
    // "content required" error and shift layout.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });
  const { watch } = form;

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    const subscription = watch((value) => {
      if (!value) return;

      const scrollPos = window.scrollY;
      const formState: FormValues = {
        c: value.c ?? '',
        b: value.b ?? true,
        ttl: value.ttl ?? DEFAULT_TTL,
        whr: value.whr ?? false,
        whfpk: value.whfpk ?? false,
        whfip: value.whfip ?? false,
        whb: value.whb ?? false,
      };

      if (value.p) formState.p = value.p;
      if (value.ips) formState.ips = value.ips;
      if (value.rc) formState.rc = value.rc;
      if (value.fc) formState.fc = value.fc;
      if (value.whu) formState.whu = value.whu;
      if (value.whn) formState.whn = value.whn;

      updateUrlWithFormState(formState);
      // Restore scroll position after URL update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const { client } = useClient();
  // Share URLs contain the raw key. Keep them out of React Query mutation data.
  const createdLinksRef = useRef<SecretLinks | null>(null);
  const createdDecryptionKeyRef = useRef('');

  const createMutation = useMutation({
    mutationFn: async (input: FormValues) => {
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

      createdLinksRef.current = buildSecretLinks({
        origin: window.location.origin,
        id: result.id,
        key: result.key,
        passwordProtected: Boolean(input.p),
      });
      createdDecryptionKeyRef.current = result.key;

      return {
        id: result.id,
        dt: result.dt,
      };
    },
    onError(error) {
      toast.error(error.message);
    },
    gcTime: 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('create.errors.fileSizeExceeded', { max: MAX_FILE_SIZE_LABEL }));
        setSelectedFile(null);
        form.resetField('c');
        return;
      }

      setSelectedFile(file);
      form.resetField('c');
      form.setValue('c', `${file.name} (file)`);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState('none');

    const content = handleContentDrop(e.dataTransfer);

    if (content instanceof File) {
      if (content.size > MAX_FILE_SIZE) {
        toast.error(t('create.errors.fileSizeExceeded', { max: MAX_FILE_SIZE_LABEL }));
        setSelectedFile(null);
        form.resetField('c');
        return;
      }

      setSelectedFile(content);
      form.setValue('c', `${content.name} (file)`);
    } else {
      setSelectedFile(null);
      form.setValue('c', content);
    }
  };

  async function onSubmit(data: FormValues) {
    let content = data.c;

    if (selectedFile) {
      try {
        const base64 = await new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            resolve(fileReader.result);
          };
          fileReader.onerror = () => {
            reject(new Error(t('create.errors.fileReadError')));
          };
          fileReader.onabort = () => {
            reject(new Error(t('create.errors.fileReadAborted')));
          };
          fileReader.readAsDataURL(selectedFile);
        });
        content = JSON.stringify({
          type: 'file',
          name: selectedFile.name,
          content: base64,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('create.errors.fileReadError'));
        throw error;
      }
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
      form.setValue(field as keyof FormValues, value);
    });
    setIsCombinedUrlMasked(true);
    setIsKeylessUrlMasked(true);
    setIsKeyMasked(true);
    setIsQrDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setShareMode('combined');
    createdLinksRef.current = null;
    createdDecryptionKeyRef.current = '';
    createMutation.reset();
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ id, dt }: { id: string; dt: string }) => {
      await sleep(500, { enabled: config.IS_DEV });
      try {
        await client.delete(id, dt);
      } catch (error) {
        if (error instanceof ErrorNotFound) {
          resetForNewSecret();
        }
        throw error;
      }
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success(t('create.success.secretDeleted'));
      resetForNewSecret();
    },
  });

  const [isCombinedUrlMasked, setIsCombinedUrlMasked] = useState(true);
  const [isKeylessUrlMasked, setIsKeylessUrlMasked] = useState(true);
  const [isKeyMasked, setIsKeyMasked] = useState(true);
  const [shareMode, setShareMode] = useState<'combined' | 'separate'>('combined');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const createdLinks = createdLinksRef.current;
  const createdId = createMutation.data?.id;
  const maskUrl = (value: string) => {
    if (!createdId) return value;
    const url = new URL(value);
    const key = url.hash.slice(1);
    return `${url.origin}/${'*'.repeat(createdId.length)}${url.search}${key ? `#${'*'.repeat(key.length)}` : ''}`;
  };
  const displayedCombinedUrl =
    isCombinedUrlMasked && createdLinks
      ? maskUrl(createdLinks.combinedUrl)
      : createdLinks?.combinedUrl;
  const displayedKeylessUrl =
    isKeylessUrlMasked && createdLinks
      ? maskUrl(createdLinks.keylessUrl)
      : createdLinks?.keylessUrl;
  const displayedDecryptionKey = isKeyMasked
    ? '*'.repeat(createdDecryptionKeyRef.current.length)
    : createdDecryptionKeyRef.current;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const handleDownloadQR = async () => {
    const svg = qrCodeRef.current;
    if (!svg) return;

    try {
      const dataUrl = await svgToImage(svg);
      const link = document.createElement('a');
      const hash = sha256(createdLinksRef.current?.qrUrl ?? '');
      link.download = `crypt.fyi-qr-${hash.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(t('create.success.qrDownloaded'));
    } catch (error) {
      toast.error(t('create.success.qrDownloadFailed', { error: String(error) }));
    }
  };

  const copyUrl = async (url: string) => {
    await clipboardCopy(url);
    toast.info(t('create.success.urlCopied'));
  };

  const copyKey = async () => {
    const key = createdDecryptionKeyRef.current;
    if (!key) return;
    await clipboardCopy(key);
    toast.info(t('create.success.keyCopied'));
  };

  const shareUrl = async (url: string) => {
    if (!('share' in navigator)) return;
    try {
      await navigator.share({ url });
    } catch {
      // Dismissing the native share sheet needs no follow-up.
    }
  };

  const shareKey = async () => {
    const key = createdDecryptionKeyRef.current;
    if (!key || !('share' in navigator)) return;
    try {
      await navigator.share({ text: key });
    } catch {
      // Dismissing the native share sheet needs no follow-up.
    }
  };

  const canShare = 'share' in navigator;

  const [dragState, setDragState] = useState<DragState>('none');

  const handleDragEnter = (e: DragEvent) => {
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();

    const types = Array.from(e.dataTransfer.types);
    const hasValidType = VALID_FILE_TYPES.some((type) => types.includes(type));

    setDragState(hasValidType ? 'dragging' : 'invalid');
  };

  const handleDragLeave = (e: DragEvent) => {
    if (form.formState.isSubmitSuccessful) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState('none');
    }
  };

  return (
    <div
      className="relative mx-auto max-w-5xl"
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
              'absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed backdrop-blur-xs',
              dragState === 'dragging'
                ? 'border-primary bg-primary/5'
                : 'border-destructive bg-destructive/5',
            )}
          >
            <p
              className={cn(
                'font-display text-2xl font-semibold',
                dragState === 'dragging' ? 'text-primary' : 'text-destructive',
              )}
            >
              {dragState === 'dragging'
                ? t('create.form.content.dropFile')
                : t('create.form.content.invalidFileType')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isSubmitSuccessful ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('common.newSecret')}
              </h1>
              <Pill tone="sealed">
                <IconLock aria-hidden />
                {t('create.encryptedHere')}
              </Pill>
            </div>
            <Form {...form}>
              <form
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6"
              >
                <FormField
                  control={form.control}
                  name="c"
                  render={({ field }) => (
                    <FormItem className="space-y-0 lg:sticky lg:top-6">
                      <Card className="flex flex-col p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                        <FormLabel className="px-2.5 pt-2.5">
                          {t('create.form.content.label')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={createMutation.isPending || field.disabled || !!selectedFile}
                            placeholder={t('create.form.content.placeholder')}
                            autoFocus
                            spellCheck={false}
                            className="min-h-28 resize-y sm:min-h-44 border-0 bg-transparent px-2.5 font-mono focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm lg:min-h-80"
                          />
                        </FormControl>
                        <div className="flex items-center gap-1 border-t px-1 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto min-h-9 min-w-0 whitespace-normal py-1.5 text-left font-medium"
                            title={t('create.form.content.fileHint')}
                            disabled={createMutation.isPending}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IconFile aria-hidden />
                            {selectedFile
                              ? t('create.form.content.fileSelected', {
                                  name: selectedFile.name,
                                  size: (selectedFile.size / 1024).toFixed(1),
                                })
                              : t('create.form.content.attach', { max: MAX_FILE_SIZE_LABEL })}
                          </Button>
                          {selectedFile && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 shrink-0"
                              aria-label={t('common.delete')}
                              disabled={createMutation.isPending || field.disabled}
                              onClick={() => {
                                setSelectedFile(null);
                                form.resetField('c');
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                  fileInputRef.current.files = null;
                                }
                              }}
                            >
                              <IconX aria-hidden />
                            </Button>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            tabIndex={-1}
                            aria-hidden
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              handleFiles(files);
                            }}
                            className="absolute h-0 w-0 opacity-0"
                            disabled={createMutation.isPending || field.disabled}
                          />
                        </div>
                      </Card>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-4">
                  <div className="space-y-4 rounded-xl border bg-card p-5">
                    <FormField
                      control={form.control}
                      name="b"
                      render={({ field: { value, onChange, ...rest } }) => (
                        <FormItem className="flex flex-row items-start justify-between gap-4 space-y-0">
                          <div className="space-y-1">
                            <FormLabel className="text-sm">{t('create.form.burn.label')}</FormLabel>
                            <FormDescription className="hidden sm:block">
                              {t('create.form.burn.description')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              {...rest}
                              checked={value}
                              onCheckedChange={(checked) => {
                                onChange(checked);
                                if (checked) {
                                  form.setValue('rc', undefined);
                                }
                              }}
                              disabled={createMutation.isPending || rest.disabled}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <hr />
                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 space-y-0">
                          <FormLabel>{t('create.form.ttl.label')}</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(v) => {
                                field.onChange(Number(v));
                              }}
                              defaultValue={field.value?.toString()}
                              disabled={createMutation.isPending || field.disabled}
                            >
                              <SelectTrigger className="w-40">
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
                      name="p"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('create.form.password.label')}</FormLabel>
                          <FormControl>
                            <RevealInput
                              placeholder={t('create.form.password.placeholder')}
                              {...field}
                              disabled={createMutation.isPending || field.disabled}
                              autoComplete="new-password"
                              showLabel={t('create.form.password.show')}
                              hideLabel={t('create.form.password.hide')}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Collapsible
                    open={isAdvancedConfigurationOpen}
                    onOpenChange={setIsAdvancedConfigurationOpen}
                    className="rounded-xl border bg-card"
                  >
                    <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-5 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                      <span className="inline-block first-letter:uppercase">
                        {t('create.form.advanced.toggle')}
                      </span>
                      <IconChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                        aria-hidden
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 border-t p-5">
                        <FormField
                          control={form.control}
                          name="rc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('create.form.advanced.readCount.label')}</FormLabel>
                              <FormControl>
                                <NumberInput
                                  {...field}
                                  onValueChange={(value) => {
                                    form.setValue('b', !value);
                                    field.onChange(value);
                                  }}
                                  disabled={createMutation.isPending || !!field.disabled}
                                  min={2}
                                  max={10}
                                />
                              </FormControl>
                              <FormDescription>
                                {t('create.form.advanced.readCount.description')}
                              </FormDescription>
                              <FormMessage />
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
                                <NumberInput
                                  {...field}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                  }}
                                  disabled={createMutation.isPending || field.disabled}
                                  min={1}
                                  max={10}
                                />
                              </FormControl>
                              <FormDescription>
                                {t('create.form.advanced.failedAttempts.description')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                              <FormDescription>
                                {t('create.form.advanced.ip.description')}
                              </FormDescription>
                              <FormMessage />
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
                              <FormDescription>
                                {t('create.form.advanced.webhook.description')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch('whu') && (
                          <div className="space-y-4 rounded-lg border p-4">
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
                            <div className="space-y-2.5">
                              {(
                                [
                                  ['whr', t('create.form.advanced.webhook.read')],
                                  ['whfpk', t('create.form.advanced.webhook.failureToReadPK')],
                                  ['whfip', t('create.form.advanced.webhook.failureToReadIP')],
                                  ['whb', t('create.form.advanced.webhook.burn')],
                                ] as const
                              ).map(([name, label]) => (
                                <FormField
                                  key={name}
                                  control={form.control}
                                  name={name}
                                  render={({ field: { value, onChange, ...rest } }) => (
                                    <FormItem className="flex flex-row items-center gap-2.5 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          {...rest}
                                          checked={value}
                                          onCheckedChange={onChange}
                                          disabled={createMutation.isPending || rest.disabled}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">{label}</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">
                              {getWebhookSchemaString({
                                name: form.watch('whn'),
                                read: form.watch('whr'),
                                burn: form.watch('whb'),
                                failureKeyPassword: form.watch('whfpk'),
                                failureIpAddress: form.watch('whfip'),
                              })}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Sticky so opening advanced options can never push the action off screen. */}
                <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t bg-background px-4 py-3 sm:mx-0 sm:px-0 lg:col-span-2">
                  <p className="hidden min-w-0 text-sm text-muted-foreground sm:block">
                    {[
                      t('create.success.info.expires', {
                        time:
                          ttlOptions.find((option) => option.value === form.watch('ttl'))?.label ??
                          '',
                      }),
                      form.watch('b') && t('create.success.info.burn'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto sm:min-w-48"
                    isLoading={createMutation.isPending}
                  >
                    <IconLock />
                    {t('common.create')}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-2xl space-y-5"
          >
            <div className="space-y-1.5">
              <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                <IconLock className="size-6 shrink-0 text-sealed" aria-hidden />
                {t('create.success.title')}
              </h2>
              <p className="text-muted-foreground">{t('create.success.tagline')}</p>
            </div>

            <Card className="space-y-5 p-4 sm:p-6">
              <div
                role="group"
                aria-label={t('create.success.description.main')}
                className="inline-flex max-w-full gap-0.5 rounded-lg border p-0.5"
              >
                {(
                  [
                    ['combined', t('create.success.oneLink')],
                    ['separate', t('create.success.separate')],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={shareMode === mode}
                    onClick={() => setShareMode(mode)}
                    className={cn(
                      'min-h-9 rounded-md px-3 py-1 text-[13px] font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                      shareMode === mode
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {shareMode === 'combined' ? (
                <div className="space-y-3">
                  <SecretField
                    id="combined-url"
                    label={t('create.success.combinedUrl')}
                    value={displayedCombinedUrl ?? ''}
                    isMasked={isCombinedUrlMasked}
                    onToggleMask={() => setIsCombinedUrlMasked(!isCombinedUrlMasked)}
                    showLabel={t('create.success.actions.showUrl')}
                    hideLabel={t('create.success.actions.hideUrl')}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-w-48 flex-1"
                      onClick={() => createdLinks && copyUrl(createdLinks.combinedUrl)}
                    >
                      <IconCopy />
                      {t('create.success.actions.copyUrl')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={() => setIsQrDialogOpen(true)}
                      aria-label={t('create.success.actions.showQr')}
                    >
                      <IconQrcode />
                      {t('create.success.qrLabel')}
                    </Button>
                    {canShare && (
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        aria-label={t('create.success.actions.shareUrl')}
                        onClick={() => createdLinks && shareUrl(createdLinks.combinedUrl)}
                      >
                        <IconShare />
                        {t('common.share')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {t('create.success.description.separateKey')}
                  </p>
                  <div className="space-y-3">
                    <SecretField
                      id="keyless-url"
                      label={t('create.success.keylessUrl')}
                      value={displayedKeylessUrl ?? ''}
                      isMasked={isKeylessUrlMasked}
                      onToggleMask={() => setIsKeylessUrlMasked(!isKeylessUrlMasked)}
                      showLabel={t('create.success.actions.showUrl')}
                      hideLabel={t('create.success.actions.hideUrl')}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="min-w-48 flex-1"
                        onClick={() => createdLinks && copyUrl(createdLinks.keylessUrl)}
                      >
                        <IconCopy />
                        {t('create.success.actions.copyUrl')}
                      </Button>
                      {canShare && (
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          aria-label={t('create.success.actions.shareUrl')}
                          onClick={() => createdLinks && shareUrl(createdLinks.keylessUrl)}
                        >
                          <IconShare />
                          {t('common.share')}
                        </Button>
                      )}
                    </div>
                  </div>
                  <hr />
                  <div className="space-y-3">
                    <SecretField
                      id="decryption-key"
                      label={t('create.success.decryptionKey')}
                      value={displayedDecryptionKey}
                      isMasked={isKeyMasked}
                      onToggleMask={() => setIsKeyMasked(!isKeyMasked)}
                      showLabel={t('create.success.actions.showKey')}
                      hideLabel={t('create.success.actions.hideKey')}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="min-w-48 flex-1" onClick={copyKey}>
                        <IconCopy />
                        {t('create.success.actions.copyKey')}
                      </Button>
                      {canShare && (
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          aria-label={t('create.success.actions.shareKey')}
                          onClick={shareKey}
                        >
                          <IconShare />
                          {t('common.share')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <hr />

              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                <SummaryItem icon={IconClock}>
                  {t('create.success.info.expires', {
                    time:
                      ttlOptions.find((option) => option.value === form.watch('ttl'))?.label ?? '',
                  })}
                </SummaryItem>
                {form.watch('b') && (
                  <SummaryItem icon={IconFlame} burn>
                    {t('create.success.info.burn')}
                  </SummaryItem>
                )}
                {form.watch('fc') && (
                  <SummaryItem icon={IconFlame} burn>
                    {t('create.success.info.failureCount', { count: form.watch('fc') })}
                  </SummaryItem>
                )}
                {form.watch('p') && (
                  <SummaryItem icon={IconLock}>
                    {t('create.success.info.passwordProtected')} ·{' '}
                    <span className="font-medium text-foreground">
                      {t('create.success.description.password')}
                    </span>
                  </SummaryItem>
                )}
                {form.watch('rc') && (
                  <SummaryItem icon={IconEye}>
                    {t('create.success.info.readCount', { count: form.watch('rc') })}
                  </SummaryItem>
                )}
                {form.watch('ips') && (
                  <SummaryItem icon={IconNetwork}>
                    {t('create.success.info.ipRestrictions', {
                      ips: form
                        .watch('ips')
                        ?.split(',')
                        .map((ip) => ip.trim())
                        .join(', '),
                    })}
                  </SummaryItem>
                )}
                {form.watch('whu') && (
                  <SummaryItem icon={IconWebhook}>
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
                  </SummaryItem>
                )}
              </ul>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {createMutation.data && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  isLoading={deleteMutation.isPending}
                >
                  {t('create.success.deleteSecret')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetForNewSecret}>
                {t('create.success.createAnother')}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <a
                href={config.CRYPT_FYI_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconBrandGithub className="size-4" aria-hidden />
                {t('common.starOnGithub')}
              </a>
              <a
                href={config.CRYPT_FYI_KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconCoffee className="size-4" aria-hidden />
                {t('common.supportOnKofi')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl tracking-tight">
              {t('create.success.confirmDelete.title')}
            </DialogTitle>
            <DialogDescription>{t('create.success.confirmDelete.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('create.success.confirmDelete.cancel')}
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                if (createMutation.data) {
                  deleteMutation.mutate({
                    id: createMutation.data.id,
                    dt: createMutation.data.dt,
                  });
                }
              }}
            >
              {t('create.success.deleteSecret')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl tracking-tight">
              {t('create.success.qrCode.title')}
            </DialogTitle>
            <DialogDescription>{t('create.success.qrCode.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {/* Scanners need dark-on-light, so the code stays white in both themes. */}
            <div className="qr-code rounded-lg bg-white">
              {createdLinks?.qrUrl && (
                <QRCodeSVG
                  ref={qrCodeRef}
                  value={createdLinks.qrUrl}
                  title={t('create.success.qrCode.title')}
                  size={256}
                  marginSize={4}
                  level="H"
                />
              )}
            </div>
            <Button variant="outline" onClick={handleDownloadQR}>
              <IconDownload />
              {t('common.download')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  burn = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  burn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0 items-start gap-1.5 break-words">
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', burn && 'text-ember')} aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function SecretField({
  id,
  label,
  value,
  isMasked,
  onToggleMask,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  isMasked: boolean;
  onToggleMask: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  const toggleLabel = isMasked ? showLabel : hideLabel;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          readOnly
          autoComplete="off"
          spellCheck={false}
          className="pr-11 font-mono text-[13px] md:text-[13px]"
        />
        <button
          type="button"
          onClick={onToggleMask}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-pressed={!isMasked}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isMasked ? (
            <IconEyeOff className="size-4" aria-hidden />
          ) : (
            <IconEye className="size-4" aria-hidden />
          )}
        </button>
      </div>
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
