import { config } from '@/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { ErrorInvalidKeyAndOrPassword, ErrorNotFound, sleep } from '@crypt.fyi/core';
import { useTranslation } from 'react-i18next';
import { useClient } from '@/context/client';
import { resolveDecryptionKey } from '@/lib/secretUrl';
import type { DecryptionKeySource } from '@/lib/secretUrl';
import { consumeLegacyQueryKey } from '@/lib/legacyKeyBootstrap';

export function ViewPage() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/$id' });
  const search = useSearch({ from: '/$id' });
  const isPasswordSet = Boolean(search.p);

  // Keep the raw key outside render state and React Query. It exists only in
  // the URL/entry control and this short-lived ref until decryption succeeds.
  const decryptionKeyRef = useRef('');
  const keySourceRef = useRef<DecryptionKeySource>('missing');
  const hadLegacyQueryKeyRef = useRef(false);
  const hasReadInitialKeyRef = useRef(false);
  if (!hasReadInitialKeyRef.current) {
    const legacyCapture = consumeLegacyQueryKey();
    const resolved = resolveDecryptionKey(window.location.hash, legacyCapture.legacyQueryKey);
    decryptionKeyRef.current = resolved.key;
    keySourceRef.current = resolved.source;
    hadLegacyQueryKeyRef.current = legacyCapture.hadLegacyQueryKey || resolved.hadLegacyQueryKey;
    hasReadInitialKeyRef.current = true;
  }

  const [hasDecryptionKey, setHasDecryptionKey] = useState(
    () => decryptionKeyRef.current.length > 0,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(
    () => isPasswordSet && decryptionKeyRef.current.length > 0,
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasUserConfirmed, setHasUserConfirmed] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [keyEntryError, setKeyEntryError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef('');

  const hadLegacyQueryKey = hadLegacyQueryKeyRef.current;
  useLegacyKeyWarning(hadLegacyQueryKey);

  const { client } = useClient();

  const existsQuery = useQuery({
    queryKey: [id, 'exists'],
    queryFn: async () => {
      await sleep(500, { enabled: config.IS_DEV });
      return client.exists(id);
    },
    retry: () => false,
    enabled: isPasswordSet && hasDecryptionKey,
  });
  useEffect(() => {
    if (existsQuery.data === false) {
      decryptionKeyRef.current = '';
      passwordRef.current = '';
    }
  }, [existsQuery.data]);

  const decryptMutation = useMutation({
    mutationKey: [id, 'decrypt'],
    mutationFn: async () => {
      const key = decryptionKeyRef.current;
      if (!key) {
        throw new Error('Decryption key is unavailable');
      }
      return client.read(id, key, passwordRef.current);
    },
    retry: () => false,
    gcTime: 0,
    onSuccess() {
      // JavaScript strings cannot be zeroed, but dropping our reference avoids
      // retaining an additional key copy after it is no longer needed.
      decryptionKeyRef.current = '';
      passwordRef.current = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
      setIsDialogOpen(false);
      setPasswordError(null);
    },
    onError(error) {
      if (error instanceof ErrorInvalidKeyAndOrPassword) {
        if (!isPasswordSet && keySourceRef.current === 'manual') {
          decryptionKeyRef.current = '';
          keySourceRef.current = 'missing';
          setHasDecryptionKey(false);
          setHasUserConfirmed(false);
          setKeyEntryError(t('view.key.error'));
          return;
        }
        if (!isPasswordSet) {
          decryptionKeyRef.current = '';
          return;
        }

        setPasswordError(t('view.password.error'));
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
      } else if (error instanceof ErrorNotFound) {
        decryptionKeyRef.current = '';
        passwordRef.current = '';
        setIsDialogOpen(false);
      }
    },
  });

  const promptForDifferentKey = (error: string | null = null) => {
    decryptionKeyRef.current = '';
    keySourceRef.current = 'missing';
    decryptMutation.reset();
    setHasDecryptionKey(false);
    setHasUserConfirmed(false);
    setIsDialogOpen(false);
    passwordRef.current = '';
    if (passwordInputRef.current) passwordInputRef.current.value = '';
    setPasswordError(null);
    setKeyEntryError(error);
  };

  const submitDecryptionKey = (key: string) => {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      setKeyEntryError(t('view.key.required'));
      return;
    }

    decryptMutation.reset();
    decryptionKeyRef.current = normalizedKey;
    keySourceRef.current = 'manual';
    setKeyEntryError(null);
    setHasDecryptionKey(true);
    setHasUserConfirmed(true);

    if (isPasswordSet) {
      setIsDialogOpen(true);
    } else {
      decryptMutation.mutate();
    }
  };

  if (!hasDecryptionKey) {
    return (
      <DecryptionKeyPrompt
        error={keyEntryError}
        isPending={decryptMutation.isPending}
        onSubmit={submitDecryptionKey}
      />
    );
  }

  if (existsQuery.isLoading) {
    return <Loader />;
  }

  const decryptError = decryptMutation.error;
  const isWrongKeyWithoutPassword =
    decryptError instanceof ErrorInvalidKeyAndOrPassword && !isPasswordSet;
  // A failed existence check (network/server error, not a definitive "false")
  // must not be reported as "not found".
  const existsFailed = isPasswordSet && existsQuery.isError;
  const unexpectedDecryptError =
    decryptError &&
    !(decryptError instanceof ErrorInvalidKeyAndOrPassword) &&
    !(decryptError instanceof ErrorNotFound);

  if (existsFailed || unexpectedDecryptError) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">{t('view.connectionError.title')}</h1>
          <p className="text-muted-foreground mb-6">{t('view.connectionError.description')}</p>
          <Button
            onClick={() => {
              if (existsFailed) {
                existsQuery.refetch();
              } else {
                decryptMutation.reset();
                decryptMutation.mutate();
              }
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
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => promptForDifferentKey()}>
              {t('view.key.change')}
            </Button>
            <Button asChild>
              <Link to="/new">{t('view.invalidLink.createNew')}</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (decryptError instanceof ErrorNotFound || (isPasswordSet && existsQuery.data === false)) {
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

  // A fragment link still requires an explicit click before fetching a
  // non-password-protected secret. Submitting a manual key is that confirmation.
  if (!hasUserConfirmed && !isPasswordSet) {
    return (
      <div className="max-w-3xl mx-auto mt-8 flex flex-col items-center justify-center">
        <Button
          onClick={() => {
            setHasUserConfirmed(true);
            decryptMutation.mutate();
          }}
          size="lg"
        >
          {t('view.actions.viewSecret')}
        </Button>
      </div>
    );
  }

  let content = null;
  if (decryptMutation.data) {
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

    content = (
      <>
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
        {decryptMutation.data && (
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
        )}
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
      </>
    );
  } else if (isPasswordSet) {
    content = (
      <Card className="p-6 text-center cursor-pointer" onClick={() => setIsDialogOpen(true)}>
        <p className="text-muted-foreground">{t('view.content.passwordProtected')}</p>
      </Card>
    );
  } else if (decryptMutation.isPending) {
    content = <Loader />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      {content}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            passwordRef.current = '';
            if (passwordInputRef.current) passwordInputRef.current.value = '';
            setPasswordError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('view.password.title')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              passwordRef.current = passwordInputRef.current?.value ?? '';
              decryptMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="secret-password">{t('view.password.title')}</Label>
              <Input
                id="secret-password"
                ref={passwordInputRef}
                type="password"
                placeholder={t('view.password.placeholder')}
                onChange={(event) => {
                  passwordRef.current = event.target.value;
                  setPasswordError(null);
                }}
                required
                autoComplete="off"
                autoFocus
                aria-describedby="password-description"
                aria-invalid={Boolean(passwordError)}
                aria-errormessage={passwordError ? 'password-error' : undefined}
                className={cn(
                  'text-lg',
                  passwordError && 'border-destructive focus-visible:ring-destructive',
                )}
                disabled={decryptMutation.isPending}
              />
              {passwordError && (
                <p id="password-error" role="alert" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
              <p id="password-description" className="text-sm text-muted-foreground">
                {t('view.password.description')}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => promptForDifferentKey()}>
                {t('view.key.change')}
              </Button>
              <Button type="submit" isLoading={decryptMutation.isPending}>
                {t('common.confirm')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DecryptionKeyPromptProps {
  error: string | null;
  isPending: boolean;
  onSubmit: (key: string) => void;
}

function DecryptionKeyPrompt({ error, isPending, onSubmit }: DecryptionKeyPromptProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card className="p-8">
        <h1 className="text-2xl font-semibold mb-2">{t('view.key.title')}</h1>
        <p id="decryption-key-description" className="text-muted-foreground mb-6">
          {t('view.key.description')}
        </p>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const input = inputRef.current;
            if (!input) return;

            const key = input.value;
            input.value = '';
            onSubmit(key);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="decryption-key">{t('view.key.label')}</Label>
            <div className="flex gap-2">
              <Input
                id="decryption-key"
                ref={inputRef}
                type={isKeyRevealed ? 'text' : 'password'}
                placeholder={t('view.key.placeholder')}
                required
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="decryption-key-description"
                aria-invalid={Boolean(error)}
                aria-errormessage={error ? 'decryption-key-error' : undefined}
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
            {error && (
              <p id="decryption-key-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isPending}>
              {t('view.key.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Outdated clients may put the key in the query string, where it can reach
// servers and logs. The value is captured only for compatibility, removed from
// browser history immediately, and never rendered in this warning.
function useLegacyKeyWarning(hadLegacyQueryKey: boolean) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!hadLegacyQueryKey) return;

    toast.warning(
      <div className="space-y-2">
        <p>{t('view.legacyKey.warning')}</p>
        <p className="text-sm text-muted-foreground">
          <a
            href="https://github.com/osbytes/crypt.fyi/issues/100"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('view.legacyKey.learnMore')}
          </a>
        </p>
      </div>,
      {
        id: 'key-in-url-search-params-deprecated',
        closeButton: true,
        duration: Infinity,
      },
    );
  }, [hadLegacyQueryKey, t]);
}
