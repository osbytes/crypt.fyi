import { config } from '@/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { useState, useRef, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import {
  IconEye,
  IconEyeOff,
  IconCopy,
  IconFlame,
  IconDownload,
  IconClock,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { clipboardCopy } from '@/lib/clipboardCopy';
import { formatDistanceToNow } from 'date-fns';
import { Loader } from '@/components/ui/loader';
import { ErrorInvalidKeyAndOrPassword, ErrorNotFound, ErrorUnexpectedStatus, sleep } from '@crypt.fyi/core';
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

  const existsQuery = useQuery({
    queryKey: [id, 'exists'],
    queryFn: async () => {
      await sleep(500, { enabled: config.IS_DEV });
      return client.exists(id);
    },
    retry: () => false,
  });

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
    return <Loader />;
  }

  const decryptError = decryptMutation.error;
  const isWrongKeyWithoutPassword =
    decryptError instanceof ErrorInvalidKeyAndOrPassword && !isPasswordSet;
  const isRateLimited =
    (existsQuery.error instanceof ErrorUnexpectedStatus && existsQuery.error.status === 429) ||
    (decryptError instanceof ErrorUnexpectedStatus && decryptError.status === 429);
  const existsFailed = existsQuery.isError && !isRateLimited;
  const unexpectedDecryptError =
    decryptError &&
    !(decryptError instanceof ErrorInvalidKeyAndOrPassword) &&
    !(decryptError instanceof ErrorNotFound) &&
    !(decryptError instanceof ErrorUnexpectedStatus && decryptError.status === 429);

  if (isRateLimited) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.rateLimit.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.rateLimit.description')}</p>
          <Button
            onClick={() => {
              if (existsQuery.error) existsQuery.refetch();
              if (decryptError) decryptMutation.reset();
            }}
          >
            {t('view.rateLimit.tryAgain')}
          </Button>
        </Card>
      </div>
    );
  }

  if (existsFailed || unexpectedDecryptError) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.connectionError.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.connectionError.description')}</p>
          <Button
            onClick={() => {
              if (existsFailed) existsQuery.refetch();
              if (unexpectedDecryptError) decryptMutation.reset();
            }}
          >
            {t('view.connectionError.tryAgain')}
          </Button>
        </Card>
      </div>
    );
  }

  if (isWrongKeyWithoutPassword) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.invalidLink.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.invalidLink.description')}</p>
          <Button asChild>
            <Link to="/new">{t('view.invalidLink.createNew')}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (decryptError instanceof ErrorNotFound || existsQuery.data === false) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.notFound.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.notFound.description')}</p>
          <Button asChild>
            <Link to="/new">{t('view.notFound.createNew')}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Key and/or password entry stays on-page — no modal.
  const showCredentialsForm =
    (!hasDecryptionKey || isPasswordSet) && !decryptMutation.data;
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
      <div className="max-w-3xl mx-auto mt-8 flex flex-col items-center justify-center">
        <Button
          onClick={() => {
            setHasUserConfirmed(true);
            decryptMutation.mutate('');
          }}
          size="lg"
        >
          {t('view.actions.viewSecret')}
        </Button>
      </div>
    );
  }

  if (decryptMutation.isPending) {
    return <Loader />;
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
    <div className="max-w-3xl mx-auto p-4 py-8">
      <div className="flex justify-center gap-3 mb-6">
        {!fileData && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRevealed(!isRevealed)}
              title={isRevealed ? t('view.content.hideContent') : t('view.content.showContent')}
              className="hover:bg-muted"
            >
              {isRevealed ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                clipboardCopy(decryptMutation.data.c);
                toast.success(t('view.content.copiedToClipboard'));
              }}
              title={t('view.content.copyToClipboard')}
              className="hover:bg-muted"
            >
              <IconCopy className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      <div className="flex justify-center">
        {decryptMutation.data.burned ? (
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg p-2 mb-2">
            <IconFlame className="h-4 w-4" />
            <p className="text-xs">{t('view.info.burnedAfterReading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg p-2 mb-2">
            <IconClock className="h-4 w-4" />
            <p className="text-xs">
              {t('view.info.expiresIn', {
                time: formatDistanceToNow(
                  new Date(decryptMutation.data.cd + decryptMutation.data.ttl),
                  { addSuffix: true },
                ),
              })}
            </p>
          </div>
        )}
      </div>
      <Card className="p-6 relative">
        {fileData ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{t('view.content.fileShared')}</p>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = fileData.content;
                link.download = fileData.name;
                link.click();
              }}
            >
              <IconDownload className="h-5 w-5 mr-2" />
              {t('view.content.downloadFile')}
            </Button>
          </div>
        ) : (
          <>
            <pre
              className={cn(
                'text-wrap break-words whitespace-pre-wrap font-mono text-sm',
                !isRevealed && 'blur-md select-none',
              )}
              aria-label={t('view.content.ariaLabel')}
            >
              {decryptedContent}
            </pre>
            {!isRevealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">{t('view.content.clickToReveal')}</p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
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
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);

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
    <div className="max-w-3xl mx-auto mt-8">
      <Card className="p-8">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p id="credentials-description" className="text-muted-foreground mb-6">
          {description}
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {showKeyField && (
            <div className="space-y-2">
              <Label htmlFor="decryption-key">{t('view.key.label')}</Label>
              <div className="flex gap-2">
                <Input
                  id="decryption-key"
                  ref={keyInputRef}
                  type={isKeyRevealed ? 'text' : 'password'}
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
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                  aria-label={isKeyRevealed ? t('view.key.hide') : t('view.key.show')}
                  aria-pressed={isKeyRevealed}
                >
                  {isKeyRevealed ? <IconEyeOff /> : <IconEye />}
                </Button>
              </div>
            </div>
          )}

          {showPasswordField && (
            <div className="space-y-2">
              <Label htmlFor="secret-password">{t('view.password.label')}</Label>
              <div className="flex gap-2">
                <Input
                  id="secret-password"
                  type={isPasswordRevealed ? 'text' : 'password'}
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
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPasswordRevealed(!isPasswordRevealed)}
                  aria-label={
                    isPasswordRevealed ? t('view.password.hide') : t('view.password.show')
                  }
                  aria-pressed={isPasswordRevealed}
                >
                  {isPasswordRevealed ? <IconEyeOff /> : <IconEye />}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p id="credentials-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="submit" isLoading={isPending}>
              {bothRequired ? t('view.credentials.submit') : t('view.key.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
