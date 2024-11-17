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

  const vaultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const key = await generateRandomString(20);
      let encrypted = await encrypt(data.c, key);
      if (data.p) {
        encrypted = await encrypt(encrypted, data.p);
      }

      return fetch(`${config.API_URL}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          c: encrypted,
          b: data.b,
          p: !!data.p,
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error("something went wrong");
        const result = await (res.json() as Promise<{
          id: string;
          dt: string;
        }>);
        const url = `${window.location.origin}/${result.id}?key=${key}`;
        await navigator.clipboard.writeText(url);
        toast.info("URL copied to clipboard");

        return {
          ...result,
          url,
          key,
        };
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await vaultMutation.mutateAsync(data);
  }

  const { isSubmitSuccessful } = form.formState;
  const { reset } = form;

  return (
    <>
      <div className="p-4 mb-8">
        <h1 className="text-2xl font-bold text-center">Phemvault</h1>
        <p className="text-center text-sm text-muted-foreground">
          Open-source tool to securely share secrets online with client-side
          end-to-end encryption, leaving the server with zero knowledge of the
          content
        </p>
      </div>
      <Card className="max-w-xl mx-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-4"
          >
            <FormField
              control={form.control}
              name="c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={vaultMutation.isPending || field.disabled}
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
                      disabled={vaultMutation.isPending || field.disabled}
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
                      disabled={vaultMutation.isPending || field.disabled}
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
                      disabled={vaultMutation.isPending || rest.disabled}
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
            <Button type="submit" isLoading={vaultMutation.isPending}>
              Submit
            </Button>
          </form>
        </Form>
      </Card>
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
            <DialogTitle>Secret created</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <>
              <p>{vaultMutation.data?.url}</p>
              <p>
                Your secret has been created. The URL has been copied to your
                clipboard.
              </p>
            </>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
