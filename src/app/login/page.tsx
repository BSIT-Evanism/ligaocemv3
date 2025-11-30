import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1642350371707-510555b9c478?q=80&w=2684&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Cemetery Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex size-10 items-center justify-center rounded-xl shadow-lg">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
              LSC
            </span>
          </Link>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-2xl">
          <LoginForm />
        </div>

        <div className="mt-8 text-center text-sm text-slate-200">
          &copy; {new Date().getFullYear()} Ligao Smart Cemetery. All rights reserved.
        </div>
      </div>
    </div>
  )
}
