import { config } from "@/config";
import { Loader } from "@/components/ui/loader";
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
import { IconEye, IconEyeOff, IconCopy } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

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
      <Card className="p-4 max-w-3xl mx-auto">
        <p>Not found</p>
        <Link to="/">Back home</Link>
      </Card>
    );
  }

  let content = null;
  if (query.data) {
    content = (
      <>
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsRevealed(!isRevealed)}
            title={isRevealed ? "Hide content" : "Show content"}
          >
            {isRevealed ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(query.data.value);
              toast.success("Copied to clipboard");
            }}
            title="Copy to clipboard"
          >
            <IconCopy className="h-4 w-4" />
          </Button>
        </div>
        {query.data.burned && (
          <p className="text-xs text-center text-muted-foreground mb-2">
            This message was deleted after your reading
          </p>
        )}
        <Card className="p-4">
          <pre
            className={cn(" text-wrap", !isRevealed && "blur-md select-none")}
          >
            {query.data?.value}
          </pre>
        </Card>
      </>
    );
  } else if (query.isPending) {
    content = <Loader />;
  } else if (isPasswordSet) {
    content = (
      <p
        className="text-center text-muted-foreground cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        waiting for password...
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {content}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
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
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" isLoading={query.isPending}>
              Submit
            </Button>
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
