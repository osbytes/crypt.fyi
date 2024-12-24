import { config } from '@/config';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import invariant from 'tiny-invariant';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button/button';
import { toast } from 'sonner';
import { sleep } from '@/lib/sleep';
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
import { useEncryptionWorker } from '@/hooks/useEncryptionWorker';
import { InvalidKeyAndOrPasswordError, sha256 } from '@crypt.fyi/core';

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  invariant(id, '`id` is required in URL');
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  invariant(key, '`key` is required in URL query parameters');
  const isPasswordSet = searchParams.get('p') === 'true';
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(isPasswordSet);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasUserConfirmed, setHasUserConfirmed] = useState(false);

  const { decrypt } = useEncryptionWorker();

  const existsQuery = useQuery({
    queryKey: [id, 'exists'],
    queryFn: async () => {
      const res = await fetch(`${config.API_URL}/vault/${id}/exists`);
      await sleep(500, { enabled: config.IS_DEV });
      if (!res.ok) {
        throw new Error(`unexpected status code ${res.status}`);
      }
      return res.json() as Promise<{ exists: boolean }>;
    },
    retry: () => false,
  });

  const decryptMutation = useMutation({
    mutationKey: [id, key, password],
    mutationFn: async () => {
      const h = sha256(key + (isPasswordSet ? password : ''));
      const res = await fetch(`${config.API_URL}/vault/${id}?h=${h}`);
      await sleep(500, { enabled: config.IS_DEV });

      switch (res.status) {
        case 200: {
          const result = await (res.json() as Promise<{
            c: string;
            b: boolean;
            cd: number;
            ttl: number;
          }>);

          const decrypted = isPasswordSet
            ? await decrypt(result.c, password).then((d) => decrypt(d, key))
            : await decrypt(result.c, key);
          return {
            value: decrypted,
            burned: result.b,
            cd: result.cd,
            ttl: result.ttl,
          };
        }
        case 400:
          throw new InvalidKeyAndOrPasswordError();
        case 404:
          setIsDialogOpen(false);
          throw new NotFoundError();
        default:
          throw new Error(`unexpected status code ${res.status}`);
      }
    },
    retry: () => false,
    onSuccess() {
      setIsDialogOpen(false);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  if (existsQuery.isLoading) {
    return <Loader />;
  }

  if (decryptMutation.error instanceof NotFoundError || !existsQuery.data?.exists) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">Secret Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This secret may have expired or been deleted.
          </p>
          <Button asChild>
            <Link to="/new">Create New Secret</Link>
          </Button>
        </Card>
      </div>
    );
  } else if (decryptMutation.error) {
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
          View Secret
        </Button>
      </div>
    );
  }

  let content = null;
  if (decryptMutation.data) {
    const decryptedContent = decryptMutation.data.value;
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
                title={isRevealed ? 'Hide content' : 'Show content'}
                className="hover:bg-muted"
              >
                {isRevealed ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  clipboardCopy(decryptMutation.data.value);
                  toast.success('Secret copied to clipboard');
                }}
                title="Copy to clipboard"
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
                <p className="text-xs">
                  This secret was deleted after your viewing and is no longer available after
                  leaving the page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg p-2 mb-2">
                <IconClock className="h-4 w-4" />
                <p className="text-xs">
                  Expires{' '}
                  {formatDistanceToNow(
                    new Date(decryptMutation.data.cd + decryptMutation.data.ttl),
                    {
                      addSuffix: true,
                    },
                  )}
                </p>
              </div>
            )}
          </div>
        )}
        <Card className="p-6 relative">
          {fileData ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">A file has been shared with you</p>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fileData.content;
                  link.download = fileData.name;
                  link.click();
                }}
              >
                <IconDownload className="h-5 w-5 mr-2" />
                Download File
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
                  <p className="text-muted-foreground">
                    Click the eye icon above to reveal the secret
                  </p>
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
        <p className="text-muted-foreground">
          This secret is password protected. Click to enter password.
        </p>
      </Card>
    );
  } else if (decryptMutation.isPending) {
    content = <Loader />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {content}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
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
                type="password"
                placeholder="Enter the password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="text-lg"
                disabled={decryptMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                This secret is protected with a password - request from the sender
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="submit" isLoading={decryptMutation.isPending}>
                Confirm
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

class NotFoundError extends Error {
  constructor() {
    super('not found');
    this.name = 'NotFoundError';
  }
}
