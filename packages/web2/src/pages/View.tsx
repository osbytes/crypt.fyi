import { config } from "@/config";
import { Loader } from "@/components/ui/loader";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import invariant from "tiny-invariant";
import { decrypt } from "@/lib/encryption";
import { Card } from "@/components/ui/card";

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  invariant(id);
  const [searchParams] = useSearchParams();
  const key = searchParams.get("key");
  invariant(key);

  const query = useQuery({
    queryKey: ["view", id, key],
    queryFn: ({ signal }) =>
      fetch(`${config.API_URL}/vault/${id}`, {
        signal,
      }).then(async (res) => {
        switch (res.status) {
          case 200: {
            const result = await (res.json() as Promise<{
              c: string;
              p: boolean;
            }>);
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

  return <Card className="p-4 max-w-3xl mx-auto mt-24">{query.data}</Card>;
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
