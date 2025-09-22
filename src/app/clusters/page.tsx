

import AuthWrapper from "@/components/auth/AuthWrapper";

export default function ClustersPage() {
    return (
        <AuthWrapper
            rolesRequired={["admin", "user"]}
            loading={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
        >
            {(session) => (
                <div className="container mx-auto p-6">
                    <h1 className="text-3xl font-bold mb-6">Clusters</h1>
                    <p className="text-muted-foreground mb-4">
                        This page is protected and requires authentication with admin or user role.
                    </p>
                    {session && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2">Welcome, {session.user?.name}!</h2>
                            <p className="text-sm text-gray-600">
                                Your role: <span className="font-medium">{session.user?.role ?? 'No role assigned'}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Email: {session.user?.email}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </AuthWrapper>
    );
}