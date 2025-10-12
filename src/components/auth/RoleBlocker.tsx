import { getSession } from "@/server/helpers/auth-helper";
import Link from "next/link";

interface RoleBlockerProps {
    children?: React.ReactNode;
    rolesRequired?: string | string[];
    requireAuth?: boolean;
    /**
     * When true, renders a viewport-covering overlay that blocks the whole screen.
     * When false, renders a container-scoped overlay that blurs only the wrapped content.
     */
    fullScreen?: boolean;
    /** Destination for the redirect button when access is denied */
    redirectHref?: string;
    /** Optional custom title shown on the overlay */
    title?: string;
    /** Optional custom description shown on the overlay */
    description?: string;
    /** Optional CTA label for the redirect button */
    ctaLabel?: string;
    /** Optional className passed to the container when fullScreen is false */
    className?: string;
}

function isAuthorized(params: {
    session: Awaited<ReturnType<typeof getSession>> | null;
    rolesRequired?: string | string[];
    requireAuth?: boolean;
}) {
    const { session, rolesRequired, requireAuth } = params;

    if (requireAuth && !session) {
        return false;
    }

    if (rolesRequired) {
        const role = session?.user?.role ?? null;
        if (!role) return false;
        const required = Array.isArray(rolesRequired) ? rolesRequired : [rolesRequired];
        return required.includes(role);
    }

    return true;
}

export default async function RoleBlocker({
    children,
    rolesRequired,
    requireAuth = true,
    fullScreen = true,
    redirectHref = "/",
    title,
    description,
    ctaLabel = "Go back",
    className,
}: RoleBlockerProps) {
    const session = await getSession();
    const allowed = isAuthorized({ session, rolesRequired, requireAuth });

    if (allowed) {
        return <>{children}</>;
    }

    const content = (
        <div className="flex h-full w-full items-center justify-center">
            <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-white/70 p-6 text-center shadow-xl backdrop-blur-xl dark:bg-zinc-900/70">
                <div className="mb-3 flex items-center justify-center">
                    <svg className="h-10 w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h2 className="mb-1 text-lg font-semibold">
                    {title ?? (session ? "Insufficient permissions" : "Authentication required")}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    {description ?? (session
                        ? "You do not have the required role to access this content."
                        : "Please sign in to continue.")}
                </p>
                <div className="flex items-center justify-center gap-2">
                    {!session && (
                        <Link
                            href="/login"
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none"
                        >
                            Login
                        </Link>
                    )}
                    <Link
                        href={redirectHref}
                        className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                        {ctaLabel}
                    </Link>
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <>
                {children}
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
                    {content}
                </div>
            </>
        );
    }

    return (
        <div className={"relative " + (className ?? "")}>
            <div className="pointer-events-none select-none blur-sm">
                {children}
            </div>
            <div className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm">
                {content}
            </div>
        </div>
    );
}


