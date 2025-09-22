"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export default function Page({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const segments = pathname.split('/').filter(Boolean)
        const breadcrumbs = []

        // Always start with Admin as the root
        breadcrumbs.push({
            label: 'Admin',
            href: '/admin',
            isLast: segments.length === 1 && segments[0] === 'admin'
        })

        // Add other segments
        let currentPath = ''
        segments.forEach((segment, index) => {
            if (segment !== 'admin') {
                currentPath += `/${segment}`
                const isLast = index === segments.length - 1

                // Format segment name for display
                const label = segment
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')

                breadcrumbs.push({
                    label,
                    href: `/admin${currentPath}`,
                    isLast
                })
            }
        })

        return breadcrumbs
    }

    const breadcrumbs = generateBreadcrumbs()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((breadcrumb, index) => (
                                <div key={breadcrumb.href} className="flex items-center">
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {breadcrumb.isLast ? (
                                            <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={breadcrumb.href}>
                                                {breadcrumb.label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
