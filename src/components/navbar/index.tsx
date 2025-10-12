
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";
import { AuthSwitcher } from "./auth-switcher";

export async function Navbar() {

    return (
        <header className="w-full px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                        <span className="text-white font-bold text-xl">L</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">Ligao Smart Cemetery</span>
                        <span className="text-xs text-slate-500 font-medium">Modern Cemetery Management</span>
                    </div>
                </Link>
                <Suspense fallback={
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-3 w-[80px]" />
                        </div>
                    </div>
                }>
                    <AuthSwitcher />
                </Suspense>
            </div>
        </header>
    );
}
