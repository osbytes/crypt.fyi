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

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  invariant(id);
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  invariant(key);
  const isPasswordSet = searchParams.get("p") === "true";
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isPasswordSet);

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
            p: boolean;
          }>);

          try {
            const decrypted = isPasswordSet
              ? await decrypt(result.c, password).then((d) => decrypt(d, key))
              : await decrypt(result.c, key);
            return decrypted;
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
      <Card className="p-4 max-w-3xl mx-auto mt-24">
        <p>Not found</p>
        <Link to="/">Back home</Link>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 max-w-3xl mx-auto mt-24">
        <pre>{query.data ?? <Loader />}</pre>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button isLoading={query.isPending} onClick={() => query.mutate()}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
