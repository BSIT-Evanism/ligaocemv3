'use client'
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";



export function ActiveLinkIndicator({ href }: { href: string }) {
    const pathname = usePathname();

    return pathname === href && (
        <ViewTransition name="active-link-indicator">
            <div className={cn("w-full h-1 bg-black rounded-full")}>
            </div>
        </ViewTransition>
    )
}