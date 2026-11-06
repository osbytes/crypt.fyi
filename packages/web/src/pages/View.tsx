import { config } from '@/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { useState, useRef, FormEvent } from 'react';
import { Pill } from '@/components/ui/pill';
import { RevealInput } from '@/components/RevealInput';
import { StatusCard } from '@/components/StatusCard';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import {
  IconEyeOff,
  IconCopy,
  IconFlame,
  IconDownload,
  IconClock,
  IconLock,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { clipboardCopy } from '@/lib/clipboardCopy';
import { formatDistanceToNow } from 'date-fns';
import { Loader } from '@/components/ui/loader';
import {
  ErrorInvalidKeyAndOrPassword,
  ErrorNotFound,
  ErrorUnexpectedStatus,
  sleep,
} from '@crypt.fyi/core';
import { useTranslation } from 'react-i18next';
import { useClient } from '@/context/client';

export function ViewPage() {
  const { id } = useParams({ from: '/$id' });
  const search = useSearch({ from: '/$id' });

  // TanStack reuses this file-route component across vault IDs. Bound all
  // key-bearing local state to the public vault ID without keying on the hash.
  return <VaultView key={id} id={id} isPasswordSet={Boolean(search.p)} />;
}

interface VaultViewProps {
  id: string;
  isPasswordSet: boolean;
}

type KeySource = 'url' | 'manual' | 'none';

function VaultView({ id, isPasswordSet }: VaultViewProps) {
  const { t } = useTranslation();

  // Keep the raw key outside render state and React Query's cache identity.
  // location.hash already includes '#'; slice(1) is the fragment value.
  const initialKey = window.location.hash.slice(1).trim();
  const decryptionKeyRef = useRef(initialKey);
  const [keySource, setKeySource] = useState<KeySource>(() => (initialKey ? 'url' : 'none'));
  // Mirrored for mutation callbacks, which can close over a stale render.
  const keySourceRef = useRef(keySource);
  keySourceRef.current = keySource;

  const [password, setPassword] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasUserConfirmed, setHasUserConfirmed] = useState(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const hasDecryptionKey = keySource !== 'none';

  const { client } = useClient();

  const decryptMutation = useMutation({
    mutationKey: [id, 'decrypt'],
    mutationFn: async (submittedPassword: string) => {
      const key = decryptionKeyRef.current;
      if (!key) throw new Error('Decryption key is unavailable');
      return client.read(id, key, submittedPassword);
    },
    retry: () => false,
    gcTime: 0,
    onSuccess() {
      decryptionKeyRef.current = '';
      setPassword('');
      setCredentialError(null);
    },
    onError(error) {
      if (error instanceof ErrorInvalidKeyAndOrPassword) {
        if (!isPasswordSet && keySourceRef.current === 'manual') {
          decryptionKeyRef.current = '';
          keySourceRef.current = 'none';
          setKeySource('none');
          setHasUserConfirmed(false);
          setCredentialError(t('view.key.error'));
          return;
        }
        if (!isPasswordSet) {
          // Fragment key failed — surface the invalid-link recovery UI.
          return;
        }
        setCredentialError(t('view.password.error'));
      } else if (error instanceof ErrorNotFound) {
        decryptionKeyRef.current = '';
        setPassword('');
      } else {
        toast.error(error.message);
      }
    },
  });

  const existsQuery = useQuery({
    queryKey: [id, 'exists'],
    queryFn: async () => {
      await sleep(500, { enabled: config.IS_DEV });
      return client.exists(id);
    },
    retry: () => false,
    // Network stop: once content is in memory, skip further HEADs so a
    // post-burn false cannot race the UI. Remount re-enables (mutation gcTime: 0).
    enabled: !decryptMutation.data,
  });

  const submitCredentials = ({ key, nextPassword }: { key?: string; nextPassword?: string }) => {
    const normalizedKey = (key ?? decryptionKeyRef.current).trim();
    if (!normalizedKey) {
      setCredentialError(t('view.key.required'));
      return;
    }

    const submittedPassword = nextPassword ?? password;
    if (isPasswordSet && !submittedPassword) {
      setCredentialError(t('view.password.required'));
      return;
    }

    decryptMutation.reset();
    decryptionKeyRef.current = normalizedKey;
    if (key !== undefined) {
      keySourceRef.current = 'manual';
      setKeySource('manual');
    }
    setPassword(submittedPassword);
    setCredentialError(null);
    setHasUserConfirmed(true);
    decryptMutation.mutate(submittedPassword);
  };

  // Always confirm the vault exists before asking for a key, password, or view confirmation.
  if (existsQuery.isLoading) {
    return (
      <div className="py-24">
        <Loader />
      </div>
    );
  }

  const decryptError = decryptMutation.error;
  const isWrongFragmentKeyWithoutPassword =
    decryptError instanceof ErrorInvalidKeyAndOrPassword && !isPasswordSet && keySource === 'url';
  const isExistsRateLimited =
    existsQuery.error instanceof ErrorUnexpectedStatus && existsQuery.error.status === 429;
  const isDecryptRateLimited =
    decryptError instanceof ErrorUnexpectedStatus && decryptError.status === 429;
  const isRateLimited = isExistsRateLimited || isDecryptRateLimited;
  const existsFailed = existsQuery.isError && !isRateLimited;
  const unexpectedDecryptError =
    decryptError &&
    !(decryptError instanceof ErrorInvalidKeyAndOrPassword) &&
    !(decryptError instanceof ErrorNotFound) &&
    !(decryptError instanceof ErrorUnexpectedStatus && decryptError.status === 429);
  const isRetryPending = existsQuery.isFetching || decryptMutation.isPending;
  const retryFailedRequest = (retryExists: boolean) => {
    if (isRetryPending) {
      return;
    }
    if (retryExists) {
      void existsQuery.refetch();
      return;
    }
    if (decryptError) {
      decryptMutation.mutate(password);
    }
  };

  if (isRateLimited) {
    return (
      <StatusCard title={t('view.rateLimit.title')} description={t('view.rateLimit.description')}>
        <Button isLoading={isRetryPending} onClick={() => retryFailedRequest(isExistsRateLimited)}>
          {t('view.rateLimit.tryAgain')}
        </Button>
      </StatusCard>
    );
  }

  if (existsFailed || unexpectedDecryptError) {
    return (
      <StatusCard
        title={t('view.connectionError.title')}
        description={t('view.connectionError.description')}
      >
        <Button isLoading={isRetryPending} onClick={() => retryFailedRequest(existsFailed)}>
          {t('view.connectionError.tryAgain')}
        </Button>
      </StatusCard>
    );
  }

  if (isWrongFragmentKeyWithoutPassword) {
    return (
      <StatusCard
        title={t('view.invalidLink.title')}
        description={t('view.invalidLink.description')}
      >
        <Button asChild>
          <Link to="/new">{t('view.invalidLink.createNew')}</Link>
        </Button>
      </StatusCard>
    );
  }

  // Render guard: a false exists result must not replace content already decrypted
  // (e.g. burn-after-read). Complements enabled: !decryptMutation.data above.
  if (
    decryptError instanceof ErrorNotFound ||
    (existsQuery.data === false && !decryptMutation.data)
  ) {
    return (
      <StatusCard title={t('view.notFound.title')} description={t('view.notFound.description')}>
        <Button asChild>
          <Link to="/new">{t('view.notFound.createNew')}</Link>
        </Button>
      </StatusCard>
    );
  }

  // Key and/or password entry stays on-page — no modal.
  const showCredentialsForm = (!hasDecryptionKey || isPasswordSet) && !decryptMutation.data;
  if (showCredentialsForm) {
    return (
      <CredentialsForm
        showKeyField={keySource !== 'url'}
        showPasswordField={isPasswordSet}
        error={credentialError}
        isPending={decryptMutation.isPending}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          setCredentialError(null);
        }}
        onSubmit={submitCredentials}
      />
    );
  }

  // A fragment link still requires an explicit click before fetching a
  // non-password-protected secret. Submitting a manual key is that confirmation.
  if (!hasUserConfirmed && !isPasswordSet) {
    return (
      <StatusCard title={t('view.gate.title')} description={t('view.gate.description')}>
        <Button
          onClick={() => {
            setHasUserConfirmed(true);
            decryptMutation.mutate('');
          }}
          size="lg"
          className="w-full"
        >
          {t('view.actions.viewSecret')}
        </Button>
        <Pill tone="sealed">
          <IconLock aria-hidden />
          {t('view.gate.notice')}
        </Pill>
      </StatusCard>
    );
  }

  if (decryptMutation.isPending) {
    return (
      <div className="py-24">
        <Loader />
      </div>
    );
  }

  if (!decryptMutation.data) {
    return null;
  }

  const decryptedContent = decryptMutation.data.c;
  let fileData: { type: 'file'; name: string; content: string } | null = null;

  try {
    const parsed = JSON.parse(decryptedContent);
    if (parsed.type === 'file') {
      fileData = parsed;
    }
  } catch {
    // Not a JSON string, treat as regular text
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 sm:pt-8">
      {decryptMutation.data.burned ? (
        <div role="status" className="flex items-start gap-2 text-[13px] text-muted-foreground">
          <IconFlame className="mt-0.5 size-3.5 shrink-0 text-ember" aria-hidden />
          <p>{t('view.info.burnedAfterReading')}</p>
        </div>
      ) : (
        <Pill>
          <IconClock aria-hidden />
          {t('view.info.expiresIn', {
            time: formatDistanceToNow(
              new Date(decryptMutation.data.cd + decryptMutation.data.ttl),
              { addSuffix: true },
            ),
          })}
        </Pill>
      )}
      {fileData ? (
        <StatusFile
          title={t('view.content.fileShared')}
          label={t('view.content.downloadFile')}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = fileData.content;
            link.download = fileData.name;
            link.click();
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Concealed content stays out of paint entirely: blur can leak on screen shares. */}
          <pre
            className={cn(
              'whitespace-pre-wrap p-5 font-mono text-sm break-words sm:p-6',
              !isRevealed && 'sr-only select-none',
            )}
            aria-label={t('view.content.ariaLabel')}
          >
            {decryptedContent}
          </pre>
          {!isRevealed && (
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="flex w-full flex-col items-center gap-2 px-6 py-12 transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span aria-hidden className="font-mono text-sm tracking-widest text-muted-foreground">
                {'•'.repeat(24)}
              </span>
              <span className="font-semibold">{t('view.content.clickToReveal')}</span>
            </button>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t p-3">
            {isRevealed && (
              <Button variant="ghost" size="sm" onClick={() => setIsRevealed(false)}>
                <IconEyeOff />
                {t('view.content.hideContent')}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                clipboardCopy(decryptMutation.data.c);
                toast.success(t('view.content.copiedToClipboard'));
              }}
            >
              <IconCopy />
              {t('view.content.copyToClipboard')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatusFile({
  title,
  label,
  onDownload,
}: {
  title: string;
  label: string;
  onDownload: () => void;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <Button onClick={onDownload}>
        <IconDownload />
        {label}
      </Button>
    </Card>
  );
}

interface CredentialsFormProps {
  showKeyField: boolean;
  showPasswordField: boolean;
  error: string | null;
  isPending: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (values: { key?: string; nextPassword?: string }) => void;
}

function CredentialsForm({
  showKeyField,
  showPasswordField,
  error,
  isPending,
  password,
  onPasswordChange,
  onSubmit,
}: CredentialsFormProps) {
  const { t } = useTranslation();
  const keyInputRef = useRef<HTMLInputElement>(null);

  const bothRequired = showKeyField && showPasswordField;
  const title = bothRequired
    ? t('view.credentials.title')
    : showKeyField
      ? t('view.key.title')
      : t('view.password.title');
  const description = bothRequired
    ? t('view.credentials.description')
    : showKeyField
      ? t('view.key.description')
      : t('view.password.description');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      key: showKeyField ? keyInputRef.current?.value : undefined,
      nextPassword: showPasswordField ? password : undefined,
    });
  };

  return (
    <StatusCard title={title} description={<p id="credentials-description">{description}</p>}>
      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        {showKeyField && (
          <div className="space-y-2">
            <Label htmlFor="decryption-key">{t('view.key.label')}</Label>
            <RevealInput
              id="decryption-key"
              ref={keyInputRef}
              placeholder={t('view.key.placeholder')}
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="credentials-description"
              aria-invalid={Boolean(error)}
              aria-errormessage={error ? 'credentials-error' : undefined}
              disabled={isPending}
              autoFocus
              showLabel={t('view.key.show')}
              hideLabel={t('view.key.hide')}
            />
          </div>
        )}

        {showPasswordField && (
          <div className="space-y-2">
            <Label htmlFor="secret-password">{t('view.password.label')}</Label>
            <RevealInput
              id="secret-password"
              placeholder={t('view.password.placeholder')}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              autoComplete="off"
              autoFocus={!showKeyField}
              aria-describedby="credentials-description"
              aria-invalid={Boolean(error)}
              aria-errormessage={error ? 'credentials-error' : undefined}
              disabled={isPending}
              showLabel={t('view.password.show')}
              hideLabel={t('view.password.hide')}
            />
          </div>
        )}

        {error && (
          <p id="credentials-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
          {bothRequired ? t('view.credentials.submit') : t('view.key.submit')}
        </Button>
      </form>
    </StatusCard>
  );
}
