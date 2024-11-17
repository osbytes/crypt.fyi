import { config } from "@/config";
import { Loader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { decrypt } from "@/lib/encryption";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  invariant(id);
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  invariant(key);
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  const handlePasswordSubmit = async () => {
    try {
      const data = query.data as { c: string; p: boolean };
      const firstDecryption = await decrypt(data.c, password);
      const finalContent = await decrypt(firstDecryption, key);
      setDecryptedContent(finalContent);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  const query = useQuery({
    queryKey: ["view", id, key],
    queryFn: ({ signal }) =>
      fetch(`${config.API_URL}/vault/${id}`, {
        signal,
      }).then(async (res) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        switch (res.status) {
          case 200: {
            const result = await (res.json() as Promise<{
              c: string;
              p: boolean;
            }>);
            if (result.p) {
              setIsDialogOpen(true);
              return result;
            }

            try {
              return decrypt(result.c, key);
            } catch (error) {
              throw new DecryptError(error);
            }
          }
          case 404:
            throw new NotFoundError();
          default:
            throw new Error(`unexpected status code ${res.status}`);
        }
      }),
    retry: (_, error) => {
      return (
        !(error instanceof NotFoundError) && !(error instanceof DecryptError)
      );
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 0,
    enabled: !!id && !!key,
  });

  if (query.isLoading) {
    return <Loader />;
  }

  if (query.isError) {
    return (
      <Card className="p-4 max-w-3xl mx-auto mt-24">
        <p>{query.error.message}</p>
        <Link to="/">Back home</Link>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 max-w-3xl mx-auto mt-24">
        {typeof query.data === 'object' && query.data.p ? (
          decryptedContent || "Waiting for password..."
        ) : (
          typeof query.data === 'object' ? JSON.stringify(query.data) : query.data
        )}
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
            <Button onClick={handlePasswordSubmit}>Submit</Button>
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
