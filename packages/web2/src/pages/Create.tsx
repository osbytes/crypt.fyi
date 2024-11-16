import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7

const formSchema = z.object({
    c: z.string().default("").describe("encrypted content"),
    b: z.boolean().default(true).describe("burn after reading"),
    p: z.string().default("").describe("password").optional(),
    ttl: z
        .number({ coerce: true })
        .default(HOUR)
        .describe("time to live (TTL) in milliseconds"),
}).superRefine((data, ctx) => {
    if (data.c.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["c"],
            message: "Content is required",
        })
    }
})

const ttlOptions = [
    { label: "5 minutes", value: 5 * MINUTE },
    { label: "1 hour", value: HOUR },
    { label: "1 day", value: DAY },
    { label: "1 week", value: WEEK },
    { label: "1 month", value: 30 * DAY },
]

export function CreatePage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            c: "",
            p: "",
            b: true,
            ttl: HOUR,
        },
    })

    async function onSubmit(data: z.infer<typeof formSchema>) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log(data)
    }

    const { isSubmitSuccessful, isSubmitting } = form.formState
    const { reset } = form

    return (
        <>
            <h1 className="text-2xl font-bold text-center">Phemvault</h1>
            <p className="text-center text-sm text-muted-foreground">
                Open-source tool to securely share secrets online with client-side end-to-end encryption, leaving the server with zero knowledge of the content
            </p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 max-w-xl mx-auto">
                    <FormField
                        control={form.control}
                        name="c"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Secret content</FormLabel>
                                <FormControl>
                                    <Textarea {...field} disabled={isSubmitting || field.disabled} />
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
                                    <Input type="password" {...field} disabled={isSubmitting || field.disabled} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} disabled={isSubmitting || field.disabled}>
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
                                        disabled={isSubmitting || rest.disabled}
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
                    <Button type="submit" isLoading={isSubmitting}>Submit</Button>
                </form>
            </Form>
            <Dialog open={isSubmitSuccessful} onOpenChange={open => {
                if (!open) {
                    reset()
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Secret created</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Your secret has been created. The URL has been copied to your clipboard.
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </>
    )
}
