import { config } from "@/config";
import { useMutation } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { decrypt } from "@/lib/encryption";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sleep } from "@/lib/sleep";
import { sha256 } from "@/lib/hash";
import { IconEye, IconEyeOff, IconCopy, IconFlame } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { clipboardCopy } from "@/lib/clipboardCopy";

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  invariant(id, "`id` is required in URL");
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  invariant(key, "`key` is required in URL query parameters");
  const isPasswordSet = searchParams.get("p") === "true";
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isPasswordSet);
  const [isRevealed, setIsRevealed] = useState(false);

  const query = useMutation({
    mutationKey: ["view", id, key, password],
    mutationFn: async () => {
      const h = await sha256(key + (isPasswordSet ? password : ""));
      const res = await fetch(`${config.API_URL}/vault/${id}?h=${h}`);
      await sleep(500, { enabled: config.IS_DEV });

      switch (res.status) {
        case 200: {
          const result = await (res.json() as Promise<{
            c: string;
            b: boolean;
          }>);

          try {
            const decrypted = isPasswordSet
              ? await decrypt(result.c, password).then((d) => decrypt(d, key))
              : await decrypt(result.c, key);
            return { value: decrypted, burned: result.b };
          } catch (error) {
            throw new DecryptError(error);
          }
        }
        case 400:
          throw new Error("invalid key and/or password");
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

  const sentRequest = useRef(false);
  useEffect(() => {
    if (sentRequest.current || isPasswordSet) {
      return;
    }
    sentRequest.current = true;

    query.mutate();
  }, [query, isPasswordSet]);

  if (query.error instanceof NotFoundError) {
    return (
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">Secret Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This secret may have expired or been deleted.
          </p>
          <Button asChild>
            <Link to="/">Create New Secret</Link>
          </Button>
        </Card>
      </div>
    );
  }

  let content = null;
  if (query.data) {
    content = (
      <>
        <div className="flex justify-center gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsRevealed(!isRevealed)}
            title={isRevealed ? "Hide content" : "Show content"}
            className="hover:bg-muted"
          >
            {isRevealed ? (
              <IconEyeOff className="h-5 w-5" />
            ) : (
              <IconEye className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              clipboardCopy(query.data.value);
              toast.success("Secret copied to clipboard");
            }}
            title="Copy to clipboard"
            className="hover:bg-muted"
          >
            <IconCopy className="h-5 w-5" />
          </Button>
        </div>
        {query.data.burned && (
          <div className="flex justify-center">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg p-2 mb-2">
              <IconFlame className="h-4 w-4" />
              <p className="text-xs">
                This secret was deleted after your viewing and is no longer
                available after leaving the page.
              </p>
            </div>
          </div>
        )}
        <Card className="p-6 relative">
          <pre
            className={cn(
              "text-wrap break-words whitespace-pre-wrap font-mono text-sm",
              !isRevealed && "blur-md select-none",
            )}
            role="textbox"
            aria-label="Secret content"
          >
            {query.data?.value}
          </pre>
          {!isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">
                Click the eye icon above to reveal the secret
              </p>
            </div>
          )}
        </Card>
      </>
    );
  } else if (isPasswordSet) {
    content = (
      <Card
        className="p-6 text-center cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <p className="text-muted-foreground">
          This secret is password protected. Click to enter password.
        </p>
      </Card>
    );
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
              query.mutate();
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
              />
              <p className="text-sm text-muted-foreground">
                This secret is protected with a password - request from the
                sender
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="submit" isLoading={query.isPending}>
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
    super("not found");
    this.name = "NotFoundError";
  }
}
class DecryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super("decrypt error");
    this.name = "DecryptError";
    this.error = error;
  }
}
