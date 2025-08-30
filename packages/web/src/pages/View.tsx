import { config } from '@/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import invariant from 'tiny-invariant';
import { Card } from '@/components/ui/card';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

export function ViewPage() {
  const { t } = useTranslation();

  const { id } = useParams({ from: '/$id' });
  const search = useSearch({ from: '/$id' });
  const isPasswordSet = search.p;
  // TODO: Remove the search.key fallback once the `key` parameter is to no longer be supported.
  const key = window.location.hash.slice(1)?.trim() || search.key;
  invariant(key, '`key` is required in URL hash');

  useKeyInSearchParamsDeprecationToast();

  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(isPasswordSet);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasUserConfirmed, setHasUserConfirmed] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { client } = useClient();

  const existsQuery = useQuery({
    queryKey: [id, 'exists'],
    queryFn: async () => {
      await sleep(500, { enabled: config.IS_DEV });
      const exists = await client.exists(id);
      return exists;
    },
    retry: () => false,
    enabled: isPasswordSet,
  });

  const decryptMutation = useMutation({
    mutationKey: [id, key, password],
    mutationFn: async () => {
      const result = await client.read(id, key, password);
      return result;
    },
    retry: () => false,
    onSuccess() {
      setIsDialogOpen(false);
      setPasswordError(null);
    },
    onError(error) {
      if (error instanceof ErrorInvalidKeyAndOrPassword) {
        setPasswordError(t('view.password.error'));
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
      } else if (error instanceof ErrorNotFound) {
        setIsDialogOpen(false);
      } else {
        toast.error(error.message);
      }
    },
  });

  if (existsQuery.isLoading) {
    return <Loader />;
  }

  if (decryptMutation.error instanceof ErrorNotFound || (isPasswordSet && !existsQuery.data)) {
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
  } else if (
    decryptMutation.error &&
    !(decryptMutation.error instanceof ErrorInvalidKeyAndOrPassword)
  ) {
    throw decryptMutation.error;
  }

  // Show initial confirmation screen to require user input before fetching the secret
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
                role="textbox"
                aria-label="Secret content"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('view.password.title')}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              decryptMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Input
                ref={passwordInputRef}
                type="password"
                placeholder={t('view.password.placeholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
                required
                autoFocus
                className={cn(
                  'text-lg',
                  passwordError && 'border-destructive focus-visible:ring-destructive',
                )}
                disabled={decryptMutation.isPending}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <p className="text-sm text-muted-foreground">{t('view.password.description')}</p>
            </div>
            <div className="flex justify-end gap-3">
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

// Outdated clients may use the `key` parameter in the URL search parameters to generate the secret.
// This is deprecated and will be removed in the future.
// This hook shows a toast to the user to let them know that the secret sender may be using an
// outdated client to genereate the secret.
function useKeyInSearchParamsDeprecationToast() {
  const search = useSearch({ from: '/$id' });
  const searchKey = search.key;
  useEffect(() => {
    if (searchKey) {
      toast.warning(
        <div className="space-y-2">
          <p>
            Using <code>key</code> in the URL search parameters is deprecated. The secret sender may
            be using an outdated client to genereate the secret.
          </p>
          <p className="text-sm text-muted-foreground">
            <a
              href="https://github.com/osbytes/crypt.fyi/issues/100"
              target="_blank"
              rel="noopener noreferrer"
            >
              See crypt.fyi/issues/100
            </a>
          </p>
        </div>,
        {
          id: 'key-in-url-search-params-deprecated',
          closeButton: true,
          duration: Infinity,
        },
      );
    }
  }, [searchKey]);
}
