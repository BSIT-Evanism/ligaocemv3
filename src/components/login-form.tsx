'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { LinkLoader } from "./link-loader"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authClient.signIn.email({
        email,
        password,
      }, {
        onSuccess: () => {
          toast.success("Logged in successfully")
          router.push("/")
        },
        onError: (error) => {
          toast.error(error.error.message)
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-slate-600 text-sm">
          Enter your credentials to access your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-slate-700">Email</Label>
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-white/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Link href="#" className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            name="password"
            id="password"
            type="password"
            required
            className="bg-white/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
          />
        </div>
        <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
          Login
        </Button>
      </div>
      <div className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link prefetch={false} href="/register">
          <Button variant="link" className="text-emerald-600 hover:text-emerald-700 font-semibold p-0 h-auto">
            Register <LinkLoader />
          </Button>
        </Link>
      </div>
    </form>
  )
}
