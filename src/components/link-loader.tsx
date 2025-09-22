'use client'
import { Loader2Icon } from "lucide-react";
import { useLinkStatus } from "next/link";



export function LinkLoader() {
    const { pending } = useLinkStatus()

    return (
        pending && <Loader2Icon className="w-4 h-4 animate-spin text-black" />
    )
}