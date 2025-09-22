
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, unstable_ViewTransition as ViewTransition } from "react";
import { Skeleton } from "../ui/skeleton";
import { AuthSwitcher } from "./auth-switcher";

export async function Navbar() {

    return (
        <header className="w-full px-6 py-4 border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">L</span>
                    </div>
                    <span className="text-xl font-semibold text-black">LSC</span>
                </div>
                <Suspense fallback={
                    <>
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </>
                }>
                    <AuthSwitcher />
                </Suspense>
            </div>
        </header>
    );
}
