
'use client'

import { cn } from "@/lib/utils";
import { unstable_ViewTransition as ViewTransition } from "react";



export default function RequestsLayout(props: LayoutProps<'/admin/requests'>) {

    return (
        <div className={cn("grid grid-cols-1 gap-4 md:gap-6")}>
            <div className={cn("md:col-span-2")}>
                <ViewTransition name="requests-list-container">
                    {props.children}
                </ViewTransition>
            </div>
        </div>
    )
}