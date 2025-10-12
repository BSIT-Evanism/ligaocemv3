
'use client'

import { cn } from "@/lib/utils";



export default function RequestsLayout(props: LayoutProps<'/admin/requests'>) {

    return (
        <div className={cn("grid grid-cols-1 gap-4 md:gap-6")}>
            <div className={cn("md:col-span-2")}>
                {props.children}
            </div>
        </div>
    )
}