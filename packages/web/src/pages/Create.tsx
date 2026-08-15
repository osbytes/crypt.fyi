import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  sha256,
  ErrorNotFound,
  ErrorPayloadTooLarge,
  INLINE_PAYLOAD_MAX_BYTES,
  StreamClient,
  sleep,
} from '@crypt.fyi/core';
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
  IconShare,
  IconFile,
  IconWebhook,
  IconInfoCircle,
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
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { buildSecretLinks } from '@/lib/secretUrl';
import type { SecretLinks } from '@/lib/secretUrl';

const VALID_FILE_TYPES = ['Files', 'text/plain', 'text/uri-list', 'text/html'];
const MAX_FILE_SIZE = config.MAX_FILE_SIZE;
const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[unit]}`;
};
const MAX_FILE_SIZE_LABEL = formatBytes(MAX_FILE_SIZE);

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
      // Gated on the deployment's password policy (config.REQUIRE_PASSWORD).
      // When it's off we keep the field entirely unconstrained so an empty
      // password still produces a plain, non-password-protected link.
      p: config.REQUIRE_PASSWORD
        ? z
            .string()
            .min(
              config.PASSWORD_MIN_LENGTH,
              t('create.errors.passwordMinLength', { min: config.PASSWORD_MIN_LENGTH }),
            )
            .refine((val) => val !== '12345', t('create.errors.passwordTooSimple'))
            .describe('password')
        : z.string().default('').describe('password'),
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
  p: string;
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
        p: value.p ?? '',
        ttl: value.ttl ?? DEFAULT_TTL,
        whr: value.whr ?? false,
        whfpk: value.whfpk ?? false,
        whfip: value.whfip ?? false,
        whb: value.whb ?? false,
      };
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

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: async (input: FormValues) => {
      await sleep(500, { enabled: config.IS_DEV });

      const webhook = input.whu
        ? {
            u: input.whu,
            n: input.whn,
            r: input.whr,
            fpk: input.whfpk,
            fip: input.whfip,
            b: input.whb,
          }
        : undefined;

      // Anything past the inline threshold is framed and uploaded in parts to
      // object storage; the file is read from disk a frame at a time and never
      // held whole. Small secrets keep the original single-request path.
      const streamed = Boolean(selectedFile) && selectedFile!.size > INLINE_PAYLOAD_MAX_BYTES;

      let result: { id: string; dt: string; key: string };
      if (streamed && selectedFile) {
        const streamClient = new StreamClient({
          apiUrl: config.API_URL,
          keyLength: config.KEY_LENGTH,
          xClient: `@crypt.fyi/web:${config.GIT_HASH?.substring(0, 8) || config.VERSION}`,
        });
        setUploadProgress(0);
        result = await streamClient.create({
          content: selectedFile,
          metadata: { name: selectedFile.name, type: selectedFile.type || '' },
          password: input.p || undefined,
          b: input.b,
          ttl: input.ttl,
          ips: input.ips,
          rc: input.rc,
          fc: input.fc,
          wh: webhook,
          m: { encryption: { algorithm: 'ml-kem-768-stream' } },
          onProgress: ({ phase, bytes, total }) => {
            if (phase === 'uploading' && total > 0) {
              setUploadProgress(Math.min(100, Math.round((bytes / total) * 100)));
            }
          },
        });
      } else {
        result = await client.create({ ...input, p: input.p, wh: webhook });
      }

      createdLinksRef.current = buildSecretLinks({
        origin: window.location.origin,
        id: result.id,
        key: result.key,
        passwordProtected: Boolean(input.p),
        streamed,
      });
      createdDecryptionKeyRef.current = result.key;

      return {
        id: result.id,
        dt: result.dt,
      };
    },
    onError(error) {
      // A server-side size rejection surfaced as "unexpected status code 413",
      // which tells the user nothing they can act on.
      toast.error(
        error instanceof ErrorPayloadTooLarge ? t('create.errors.payloadTooLarge') : error.message,
      );
    },
    onSettled() {
      setUploadProgress(null);
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

    if (selectedFile && selectedFile.size > INLINE_PAYLOAD_MAX_BYTES) {
      // Read lazily by the stream client; `c` is unused on that path.
      await createMutation.mutateAsync({ ...data, c: content });
      return;
    }

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
      className="max-w-3xl w-full mx-auto py-8 px-4 relative self-start"
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
              'absolute inset-0 border-2 border-dashed rounded-lg z-50 flex items-center justify-center backdrop-blur-xs',
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4">
              <Form {...form}>
                <form
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      form.handleSubmit(onSubmit)(e);
                    }
                  }}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
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
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="flex items-center gap-2 text-[0.8rem] text-muted-foreground">
                          <p
                            role="button"
                            tabIndex={createMutation.isPending ? -1 : 0}
                            className={cn(
                              'flex items-center justify-between cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              createMutation.isPending && 'pointer-events-none',
                            )}
                            aria-disabled={createMutation.isPending}
                            onClick={() =>
                              !createMutation.isPending && fileInputRef.current?.click()
                            }
                            onKeyDown={(e) => {
                              if (
                                !createMutation.isPending &&
                                (e.key === 'Enter' || e.key === ' ')
                              ) {
                                e.preventDefault();
                                fileInputRef.current?.click();
                              }
                            }}
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
                              t('create.form.content.fileHint', { max: MAX_FILE_SIZE_LABEL })
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
                            placeholder={
                              config.REQUIRE_PASSWORD
                                ? t('create.form.password.placeholderRequired', {
                                    min: config.PASSWORD_MIN_LENGTH,
                                  })
                                : t('create.form.password.placeholder')
                            }
                            {...field}
                            disabled={createMutation.isPending || field.disabled}
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap gap-4">
                    <FormField
                      control={form.control}
                      name="b"
                      render={({ field: { value, onChange, ...rest } }) => (
                        <FormItem className="flex-1 min-w-[240px] flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t('create.form.burn.label')}</FormLabel>
                            <FormDescription>{t('create.form.burn.description')}</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-[240px]">
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
                  </div>
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
                              <div className="flex flex-wrap gap-4">
                                <FormField
                                  control={form.control}
                                  name="rc"
                                  render={({ field }) => (
                                    <FormItem className="flex-1 min-w-[240px] group">
                                      <FormLabel className="flex items-center gap-2">
                                        {t('create.form.advanced.readCount.label')}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <IconInfoCircle className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t('create.form.advanced.readCount.description')}
                                          </TooltipContent>
                                        </Tooltip>
                                      </FormLabel>
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
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="fc"
                                  render={({ field }) => (
                                    <FormItem className="flex-1 min-w-[240px] group">
                                      <FormLabel className="flex items-center gap-2">
                                        {t('create.form.advanced.failedAttempts.label')}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <IconInfoCircle className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t('create.form.advanced.failedAttempts.description')}
                                          </TooltipContent>
                                        </Tooltip>
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
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name="ips"
                                render={({ field }) => (
                                  <FormItem className="group">
                                    <FormLabel className="flex items-center gap-2">
                                      {t('create.form.advanced.ip.label')}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <IconInfoCircle className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {t('create.form.advanced.ip.description')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        placeholder={t('create.form.advanced.ip.placeholder')}
                                        {...field}
                                        disabled={createMutation.isPending || field.disabled}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="whu"
                                render={({ field }) => (
                                  <FormItem className="group">
                                    <FormLabel className="flex items-center gap-2">
                                      {t('create.form.advanced.webhook.label')}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <IconInfoCircle className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {t('create.form.advanced.webhook.description')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="url"
                                        placeholder={t('create.form.advanced.webhook.placeholder')}
                                        {...field}
                                        disabled={createMutation.isPending || field.disabled}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch('whu') && (
                                <div className="px-4 flex flex-col gap-4">
                                  <FormField
                                    control={form.control}
                                    name="whn"
                                    render={({ field }) => (
                                      <FormItem className="group">
                                        <FormLabel className="flex items-center gap-2">
                                          {t('create.form.advanced.webhook.nameLabel')}
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <IconInfoCircle className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              {t('create.form.advanced.webhook.nameDescription')}
                                            </TooltipContent>
                                          </Tooltip>
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
                  <div className="flex items-center justify-end gap-4">
                    {uploadProgress !== null && (
                      <div
                        className="flex flex-1 items-center gap-3"
                        role="progressbar"
                        aria-valuenow={uploadProgress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t('create.form.uploadProgress')}
                      >
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-[width] duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
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
                  <p className="text-muted-foreground text-sm mb-1">
                    {t('create.success.description.separateKey')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {form.watch('p') && t('create.success.description.password')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <Label htmlFor="combined-url">{t('create.success.combinedUrl')}</Label>
                    <div className="flex items-center gap-2">
                      <Input id="combined-url" value={displayedCombinedUrl ?? ''} readOnly />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCombinedUrlMasked(!isCombinedUrlMasked)}
                        title={
                          isCombinedUrlMasked
                            ? t('create.success.actions.showUrl')
                            : t('create.success.actions.hideUrl')
                        }
                        aria-label={
                          isCombinedUrlMasked
                            ? t('create.success.actions.showUrl')
                            : t('create.success.actions.hideUrl')
                        }
                        aria-pressed={!isCombinedUrlMasked}
                      >
                        {isCombinedUrlMasked ? <IconEyeOff /> : <IconEye />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title={t('create.success.actions.copyUrl')}
                        aria-label={t('create.success.actions.copyUrl')}
                        onClick={() => createdLinks && copyUrl(createdLinks.combinedUrl)}
                      >
                        <IconCopy />
                      </Button>
                      {canShare && (
                        <Button
                          variant="outline"
                          size="icon"
                          title={t('create.success.actions.shareUrl')}
                          aria-label={t('create.success.actions.shareUrl')}
                          onClick={() => createdLinks && shareUrl(createdLinks.combinedUrl)}
                        >
                          <IconShare />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsQrDialogOpen(true)}
                        title={t('create.success.actions.showQr')}
                        aria-label={t('create.success.actions.showQr')}
                      >
                        <IconQrcode />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="keyless-url">{t('create.success.keylessUrl')}</Label>
                      <div className="flex items-center gap-2">
                        <Input id="keyless-url" value={displayedKeylessUrl ?? ''} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsKeylessUrlMasked(!isKeylessUrlMasked)}
                          title={
                            isKeylessUrlMasked
                              ? t('create.success.actions.showUrl')
                              : t('create.success.actions.hideUrl')
                          }
                          aria-label={
                            isKeylessUrlMasked
                              ? t('create.success.actions.showUrl')
                              : t('create.success.actions.hideUrl')
                          }
                          aria-pressed={!isKeylessUrlMasked}
                        >
                          {isKeylessUrlMasked ? <IconEyeOff /> : <IconEye />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title={t('create.success.actions.copyUrl')}
                          aria-label={t('create.success.actions.copyUrl')}
                          onClick={() => createdLinks && copyUrl(createdLinks.keylessUrl)}
                        >
                          <IconCopy />
                        </Button>
                        {canShare && (
                          <Button
                            variant="outline"
                            size="icon"
                            title={t('create.success.actions.shareUrl')}
                            aria-label={t('create.success.actions.shareUrl')}
                            onClick={() => createdLinks && shareUrl(createdLinks.keylessUrl)}
                          >
                            <IconShare />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="decryption-key">{t('create.success.decryptionKey')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="decryption-key"
                          value={displayedDecryptionKey}
                          readOnly
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsKeyMasked(!isKeyMasked)}
                          title={
                            isKeyMasked
                              ? t('create.success.actions.showKey')
                              : t('create.success.actions.hideKey')
                          }
                          aria-label={
                            isKeyMasked
                              ? t('create.success.actions.showKey')
                              : t('create.success.actions.hideKey')
                          }
                          aria-pressed={!isKeyMasked}
                        >
                          {isKeyMasked ? <IconEyeOff /> : <IconEye />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title={t('create.success.actions.copyKey')}
                          aria-label={t('create.success.actions.copyKey')}
                          onClick={copyKey}
                        >
                          <IconCopy />
                        </Button>
                        {canShare && (
                          <Button
                            variant="outline"
                            size="icon"
                            title={t('create.success.actions.shareKey')}
                            aria-label={t('create.success.actions.shareKey')}
                            onClick={shareKey}
                          >
                            <IconShare />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end flex-wrap gap-2">
                  <Button variant="outline" onClick={resetForNewSecret}>
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
                      <p className="text-muted-foreground">{t('create.success.info.burn')}</p>
                    </>
                  )}
                  {form.watch('fc') && (
                    <>
                      <IconFlame className="text-muted-foreground size-4" />
                      <p className="text-muted-foreground">
                        {t('create.success.info.failureCount', {
                          count: form.watch('fc'),
                        })}
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
            <div className="flex space-x-2">
              <Button
                title={t('common.download')}
                aria-label={t('common.download')}
                variant="outline"
                onClick={handleDownloadQR}
              >
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
