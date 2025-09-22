'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { unstable_ViewTransition as ViewTransition } from "react";
import Link, { useLinkStatus } from "next/link"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { LinkLoader } from "./link-loader"

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"form">) {

    const router = useRouter();
    const { pending } = useLinkStatus()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            await authClient.signUp.email({
                email,
                password,
                name,
            }, {
                onSuccess: async () => {
                    router.push("/");
                },
                onError: (error) => {
                    toast.error(error.error.message);
                }
            })
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
            <ViewTransition name="auth-form">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Register your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to register your account
                    </p>
                </div>
            </ViewTransition>

            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input name="name" id="name" type="text" placeholder="John Doe" required />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input name="email" id="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="grid gap-3">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <Input name="password" id="password" type="password" required />
                </div>
                <ViewTransition name="login-button">
                    <Button type="submit" className="w-full">
                        Register
                    </Button>
                </ViewTransition>
            </div>
            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link prefetch={false} href="/login">
                    <Button variant="link">
                        Login <LinkLoader />
                    </Button>
                </Link>
            </div>
        </form>
    )
}
