import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { config } from "@/config";
import { encrypt, generateRandomString } from "@/lib/encryption";
import { Card } from "@/components/ui/card";
import { sleep } from "@/lib/sleep";
import {
  IconBrandGithub,
  IconLock,
  IconCopy,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { sha256 } from "@/lib/hash";
import { useState } from "react";

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

const formSchema = z
  .object({
    c: z.string().default("").describe("encrypted content"),
    b: z.boolean().default(true).describe("burn after reading"),
    p: z.string().default("").describe("password").optional(),
    ttl: z
      .number({ coerce: true })
      .default(HOUR)
      .describe("time to live (TTL) in milliseconds"),
  })
  .superRefine((data, ctx) => {
    if (data.c.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["c"],
        message: "Content is required",
      });
    }
  });

const ttlOptions = [
  { label: "5 minutes", value: 5 * MINUTE },
  { label: "1 hour", value: HOUR },
  { label: "1 day", value: DAY },
  { label: "1 week", value: WEEK },
  { label: "1 month", value: 30 * DAY },
];

export function CreatePage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      c: "",
      p: "",
      b: true,
      ttl: HOUR,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: z.infer<typeof formSchema>) => {
      await sleep(500, { enabled: config.IS_DEV });
      const key = await generateRandomString(20);
      let encrypted = await encrypt(input.c, key);
      if (input.p) {
        encrypted = await encrypt(encrypted, input.p);
      }
      const h = await sha256(key);

      const result = await fetch(`${config.API_URL}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          c: encrypted,
          h,
          b: input.b,
          p: !!input.p,
        }),
      });

      if (!result.ok) throw new Error("something went wrong");

      const data = await (result.json() as Promise<{
        id: string;
        dt: string;
      }>);
      const url = `${window.location.origin}/${data.id}?key=${key}`;
      await navigator.clipboard.writeText(url);
      toast.info("URL copied to clipboard");

      return {
        ...data,
        url,
        key,
      };
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await createMutation.mutateAsync(data);
  }

  const { isSubmitSuccessful } = form.formState;
  const { reset } = form;

  const deleteMutation = useMutation({
    mutationFn: async (body: { id: string; dt: string }) => {
      await sleep(500, { enabled: config.IS_DEV });
      const result = await fetch(`${config.API_URL}/vault/${body.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!result.ok) {
        if (result.status === 404) {
          reset();
          throw new Error("secret not found");
        }
        throw new Error(`unexpected status code ${result.status}`);
      }
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("Secret deleted");
      reset();
    },
  });

  const [isUrlMasked, setIsUrlMasked] = useState(true);
  let maskedUrl = createMutation.data?.url;
  if (createMutation.data) {
    maskedUrl = maskedUrl?.replace(
      createMutation.data.id,
      "*".repeat(createMutation.data.id.length),
    );
    maskedUrl = maskedUrl?.replace(
      createMutation.data.key,
      "*".repeat(createMutation.data.key.length),
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="space-y-2 p-4">
        <h1 className="text-xl font-bold text-center">Phemvault</h1>
        <p className="text-center text-sm text-muted-foreground">
          Securely share secrets with zero-knowledge{" "}
          <a
            href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
            target="_blank"
          >
            AES-256
          </a>{" "}
          <a
            href="https://en.wikipedia.org/wiki/End-to-end_encryption"
            target="_blank"
          >
            end-to-end encryption
          </a>
        </p>
      </div>
      <Card className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={createMutation.isPending || field.disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="p"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={createMutation.isPending || field.disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ttl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time to live</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                      disabled={createMutation.isPending || field.disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration time" />
                      </SelectTrigger>
                      <SelectContent>
                        {ttlOptions.map(({ label, value }) => (
                          <SelectItem key={value} value={value.toString()}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="b"
              render={({ field: { value, onChange, ...rest } }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      {...rest}
                      checked={value}
                      onCheckedChange={onChange}
                      disabled={createMutation.isPending || rest.disabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Burn after reading</FormLabel>
                    <FormDescription>
                      Delete the secret immediately after it is viewed
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" isLoading={createMutation.isPending}>
              <IconLock />
              Create
            </Button>
          </form>
        </Form>
      </Card>
      <div className="flex items-center justify-center space-x-2 p-4">
        <a href="https://github.com/dillonstreator/phemvault" target="_blank">
          <IconBrandGithub className="text-muted-foreground" />
        </a>
      </div>
      <Dialog
        open={isSubmitSuccessful}
        onOpenChange={(open) => {
          if (!open) {
            reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle asChild>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Secret created</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUrlMasked(!isUrlMasked)}
                  type="button"
                >
                  {isUrlMasked ? (
                    <IconEye size={16} />
                  ) : (
                    <IconEyeOff size={16} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (createMutation.data?.url) {
                      await navigator.clipboard.writeText(
                        createMutation.data.url,
                      );
                      toast.info("URL copied to clipboard");
                    }
                  }}
                  type="button"
                >
                  <IconCopy size={16} />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <>
              <pre className="text-muted-foreground text-wrap p-2 rounded bg-accent">
                {isUrlMasked ? maskedUrl : createMutation.data?.url}
              </pre>
              <p>
                Your secret has been created. The URL has been copied to your
                clipboard.
              </p>
              {createMutation.data && (
                <Button
                  variant="destructive"
                  isLoading={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate({
                      id: createMutation.data.id,
                      dt: createMutation.data.dt,
                    })
                  }
                >
                  Delete
                </Button>
              )}
            </>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
