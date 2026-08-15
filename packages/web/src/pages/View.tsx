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
import {
  ErrorInvalidKeyAndOrPassword,
  ErrorNotFound,
  ErrorUnexpectedStatus,
  StreamClient,
  sleep,
} from '@crypt.fyi/core';
import { createPendingSaveSink } from '@/lib/saveSink';
import { useTranslation } from 'react-i18next';
import { useClient } from '@/context/client';

export function ViewPage() {
  const { id } = useParams({ from: '/$id' });
  const search = useSearch({ from: '/$id' });

  // Streamed payloads are written straight to disk and never held in the tab,
  // so they take a separate view rather than the in-page reveal.
  if (search.s) {
    return <StreamedVaultView key={id} id={id} isPasswordSet={Boolean(search.p)} />;
  }

  // TanStack reuses this file-route component across vault IDs. Bound all
  // key-bearing local state to the public vault ID without keying on the hash.
  return <VaultView key={id} id={id} isPasswordSet={Boolean(search.p)} />;
}

/**
 * A payload stored in object storage. It is downloaded as a stream and
 * decrypted frame by frame into a save sink, so a multi-gigabyte file never
 * has to fit in memory.
 */
function StreamedVaultView({ id, isPasswordSet }: VaultViewProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ burned: boolean } | null>(null);

  // Share links come in two forms: combined, with the key in the fragment, and
  // keyless, where the key is sent separately. Support both, as the inline view
  // does — otherwise a keyless streamed link is unopenable.
  const fragmentKey = typeof window === 'undefined' ? '' : window.location.hash.slice(1).trim();
  const [manualKey, setManualKey] = useState('');
  const key = fragmentKey || manualKey.trim();

  const download = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!key) {
      setError(t('view.key.error'));
      return;
    }

    // The save location must be chosen on this click: the picker needs the
    // transient user activation, which will not survive the fetch.
    let sink;
    try {
      sink = await createPendingSaveSink('secret');
    } catch {
      // The user dismissed the picker.
      return;
    }

    setProgress(0);
    try {
      const client = new StreamClient({
        apiUrl: config.API_URL,
        xClient: `@crypt.fyi/web:${config.GIT_HASH?.substring(0, 8) || config.VERSION}`,
      });

      const result = await client.readToSink(id, key, isPasswordSet ? password : undefined, {
        sink: sink.writable,
        onMetadata: (metadata) => sink.arm({ filename: metadata.name, size: metadata.size }),
        onProgress: ({ bytes, total }) => {
          if (total > 0) setProgress(Math.min(100, Math.round((bytes / total) * 100)));
        },
      });
      await sink.done;
      setOutcome({ burned: result.burned });
    } catch (caught) {
      await sink.abort(caught).catch(() => undefined);
      setProgress(null);
      if (caught instanceof ErrorInvalidKeyAndOrPassword) {
        // Only blame the password when there is one; otherwise the key is what
        // failed, and telling the user to check a password they never had is
        // just misleading.
        setError(isPasswordSet ? t('view.password.error') : t('view.key.error'));
      } else if (caught instanceof ErrorNotFound) {
        setError(t('view.notFound.description'));
      } else {
        setError(caught instanceof Error ? caught.message : String(caught));
      }
    }
  };

  if (outcome) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4">
        <Card className="space-y-3 p-8 text-center">
          <IconDownload className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t('view.content.downloadComplete')}</h1>
          {/* Only say it is destroyed when it actually was — read-count and
              non-burn secrets remain readable. */}
          <p className="text-sm text-muted-foreground">
            {outcome.burned ? t('view.info.burnedAfterReading') : t('view.content.stillAvailable')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <Card className="p-8">
        <form className="space-y-6" onSubmit={download}>
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold">{t('view.content.fileShared')}</h1>
            <p className="text-sm text-muted-foreground">{t('view.content.streamedDescription')}</p>
          </div>

          {!fragmentKey && (
            <div className="space-y-2">
              <Label htmlFor="secret-key">{t('view.key.label')}</Label>
              <Input
                id="secret-key"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={manualKey}
                onChange={(event) => setManualKey(event.target.value)}
                placeholder={t('view.key.placeholder')}
                required
                disabled={progress !== null}
              />
            </div>
          )}

          {isPasswordSet && (
            <div className="space-y-2">
              <Label htmlFor="secret-password">{t('view.password.label')}</Label>
              <Input
                id="secret-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('view.password.placeholder')}
                required
                disabled={progress !== null}
              />
            </div>
          )}

          {progress !== null && (
            <div
              className="flex items-center gap-3"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('view.content.downloadProgress')}
            >
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-center">
            <Button type="submit" size="lg" isLoading={progress !== null}>
              <IconDownload className="mr-2 h-5 w-5" />
              {t('view.content.downloadFile')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
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
    return <Loader />;
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
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.rateLimit.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.rateLimit.description')}</p>
          <Button
            isLoading={isRetryPending}
            onClick={() => retryFailedRequest(isExistsRateLimited)}
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
          <Button isLoading={isRetryPending} onClick={() => retryFailedRequest(existsFailed)}>
            {t('view.connectionError.tryAgain')}
          </Button>
        </Card>
      </div>
    );
  }

  if (isWrongFragmentKeyWithoutPassword) {
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

  // Render guard: a false exists result must not replace content already decrypted
  // (e.g. burn-after-read). Complements enabled: !decryptMutation.data above.
  if (
    decryptError instanceof ErrorNotFound ||
    (existsQuery.data === false && !decryptMutation.data)
  ) {
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
