import { Suspense } from "react";
import { getSession } from "@/server/helpers/auth-helper";
import { redirect as nextRedirect } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface SessionData {
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
        impersonatedBy?: string | null;
    };
    user: User;
}

/**
 * AuthWrapper - A server component that provides authentication and role-based access control
 * 
 * @example
 * // Basic authentication required with session access (redirects by default)
 * <AuthWrapper>
 *   {(session) => <ProtectedContent session={session} />}
 * </AuthWrapper>
 * 
 * @example
 * // Show fallback UI instead of redirecting (flexible size for widgets/islands)
 * <AuthWrapper redirect={false}>
 *   {(session) => <ProtectedContent session={session} />}
 * </AuthWrapper>
 * 
 * @example
 * // Custom loading skeleton and fallback UI
 * <AuthWrapper 
 *   loading={<div className="animate-pulse bg-gray-200 h-20 rounded"></div>}
 *   fallback={<div className="p-4 text-center">Please login</div>}
 *   redirect={false}
 * >
 *   {(session) => <ProtectedContent session={session} />}
 * </AuthWrapper>
 * 
 * @example
 * // Role-based access control with custom fallback
 * <AuthWrapper 
 *   rolesRequired={["admin"]} 
 *   redirect={false}
 *   fallback={<div className="p-2 text-sm text-red-600">Admin access required</div>}
 * >
 *   {(session) => <AdminPanel user={session.user} />}
 * </AuthWrapper>
 * 
 * @example
 * // Widget-sized component with custom loading
 * <div className="w-64 h-32">
 *   <AuthWrapper 
 *     loading={<div className="animate-pulse bg-gray-200 h-full rounded"></div>}
 *     fallback={<div className="p-2 text-xs">Login required</div>}
 *     redirect={false}
 *   >
 *     {(session) => <WidgetContent session={session} />}
 *   </AuthWrapper>
 * </div>
 */
interface AuthWrapperProps {
    children: (session: SessionData | null) => React.ReactNode;
    fallback?: React.ReactNode;
    loading?: React.ReactNode;
    rolesRequired?: string | string[];
    redirectTo?: string;
    requireAuth?: boolean;
    redirect?: boolean;
}

async function SuspenseWrapper({
    children,
    fallback,
    loading: _loading,
    rolesRequired,
    redirectTo = "/login",
    requireAuth = true,
    redirect = false
}: AuthWrapperProps) {
    const session = await getSession();

    // If authentication is required but user is not logged in
    if (requireAuth && !session) {
        if (redirect) {
            nextRedirect(redirectTo as "/login" | "/register" | "/");
        } else {
            // Return fallback UI instead of redirecting
            return <>{fallback}</>;
        }
    }

    // If user is logged in but role requirements are specified
    if (session && rolesRequired) {
        const userRole = session.user?.role;

        if (!userRole) {
            // User has no role, redirect if roles are required
            if (redirect) {
                nextRedirect(redirectTo as "/login" | "/register" | "/");
            } else {
                return <>{fallback}</>;
            }
        }

        const requiredRoles = Array.isArray(rolesRequired) ? rolesRequired : [rolesRequired];
        const hasRequiredRole = requiredRoles.includes(userRole ?? "");

        if (!hasRequiredRole) {
            // User doesn't have required role, redirect
            if (redirect) {
                nextRedirect(redirectTo as "/login" | "/register" | "/");
            } else {
                return <>{fallback}</>;
            }
        }
    }

    return <>{children(session)}</>;
}

export default function AuthWrapper({
    children,
    fallback,
    loading,
    rolesRequired,
    redirectTo = "/login",
    requireAuth = true,
    redirect = false
}: AuthWrapperProps) {
    // Default loading skeleton for Suspense
    const defaultLoading = (
        <div className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32 w-full"></div>
        </div>
    );

    // Default fallback UI for unauthenticated users (flexible size)
    const defaultFallback = (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
                <div className="mb-3">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Not logged in</h3>
                <p className="text-xs text-gray-600 mb-3">Please login to continue</p>
                <div className="flex gap-2">
                    <a
                        href="/login"
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                        Login
                    </a>
                    <a
                        href="/register"
                        className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                    >
                        Register
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <Suspense fallback={loading ?? defaultLoading}>
            <SuspenseWrapper
                rolesRequired={rolesRequired}
                redirectTo={redirectTo}
                requireAuth={requireAuth}
                redirect={redirect}
                fallback={fallback ?? defaultFallback}
            >
                {children}
            </SuspenseWrapper>
        </Suspense>
    );
}