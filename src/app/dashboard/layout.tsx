import Link from "next/link";
import RoleBlocker from "@/components/auth/RoleBlocker";
import { LinkLoader } from "@/components/link-loader";
import { ActiveLinkIndicator } from "@/components/navbar/active-link-indicator";
import { AuthSwitcher } from "@/components/navbar/auth-switcher";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {


    return (
        <RoleBlocker requireAuth redirectHref="/">
            <div className="min-h-[calc(100vh-64px)] w-full">
                <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-14 items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-sm font-medium hover:underline ">
                                <LinkLoader fade>
                                    Dashboard
                                </LinkLoader>
                                <ActiveLinkIndicator href="/dashboard" />
                            </Link>
                            <Link href="/dashboard/requests" className="text-sm font-medium hover:underline ">
                                <LinkLoader fade>
                                    My Requests
                                </LinkLoader>
                                <ActiveLinkIndicator href="/dashboard/requests" />
                            </Link>
                            <Link href="/map" className="text-sm font-medium hover:underline ">
                                <LinkLoader fade>
                                    Map View
                                </LinkLoader>
                                <ActiveLinkIndicator href="/map" />
                            </Link>
                        </div>
                        {/* <div className="flex items-center gap-3">
                            <Link href="/map" className="text-sm hover:underline">
                                Public Map
                            </Link>
                            <Suspense fallback={
                                <Skeleton className="h-8 w-24" />
                            }>
                                <AuthSwitcher />
                            </Suspense>
                        </div> */}
                    </div>
                </header>
                <main className="container mx-auto px-4 py-4 md:py-6">
                    {children}
                </main>
            </div>
        </RoleBlocker>
    );
}


