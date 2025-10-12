'use client'
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";



export function ActiveLinkIndicator({ href }: { href: string }) {
    const pathname = usePathname();

    return pathname === href && (
        <div className={cn("w-full h-1 bg-black rounded-full")}>
        </div>
    )
}