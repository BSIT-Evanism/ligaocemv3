'use client'
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useLinkStatus } from "next/link";



export function LinkLoader({ fade = false, children }: { fade?: boolean, children?: React.ReactNode }) {
    const { pending } = useLinkStatus()

    if (fade) {
        return (
            <span className={"animate-pulse"}>
                {children}
            </span>
        )
    }

    return (
        pending && <Loader2Icon className="w-4 h-4 animate-spin text-black" />
    )
}