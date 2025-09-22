import AuthWrapper from "@/components/auth/AuthWrapper";

export default function ProtectedDemoPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8">AuthWrapper Demo</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Example 1: Redirect enabled (default behavior) */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Redirect Enabled (Default)</h2>
                        <p className="text-gray-600 mb-4">
                            This will redirect unauthenticated users to /login
                        </p>
                        <AuthWrapper redirect={true}>
                            {(session) => (
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <p className="text-green-800">
                                        ✅ You are logged in as: {session?.user?.name}
                                    </p>
                                </div>
                            )}
                        </AuthWrapper>
                    </div>

                    {/* Example 2: Fallback UI instead of redirect */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Fallback UI (No Redirect)</h2>
                        <p className="text-gray-600 mb-4">
                            This will show a fallback UI instead of redirecting
                        </p>
                        <AuthWrapper redirect={false}>
                            {(session) => (
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <p className="text-green-800">
                                        ✅ You are logged in as: {session?.user?.name}
                                    </p>
                                </div>
                            )}
                        </AuthWrapper>
                    </div>

                    {/* Example 3: Custom fallback UI */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Custom Fallback UI</h2>
                        <p className="text-gray-600 mb-4">
                            This shows a custom fallback message
                        </p>
                        <AuthWrapper
                            redirect={false}
                            fallback={
                                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                    <p className="text-yellow-800">
                                        🔒 Custom message: Please log in to access this content
                                    </p>
                                </div>
                            }
                        >
                            {(session) => (
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <p className="text-green-800">
                                        ✅ You are logged in as: {session?.user?.name}
                                    </p>
                                </div>
                            )}
                        </AuthWrapper>
                    </div>

                    {/* Example 4: Role-based with fallback */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Role-based with Fallback</h2>
                        <p className="text-gray-600 mb-4">
                            Requires admin role, shows fallback if not authorized
                        </p>
                        <AuthWrapper
                            rolesRequired={["admin"]}
                            redirect={false}
                            fallback={
                                <div className="bg-red-50 p-4 rounded border border-red-200">
                                    <p className="text-red-800">
                                        ❌ Admin access required
                                    </p>
                                </div>
                            }
                        >
                            {(session) => (
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <p className="text-green-800">
                                        ✅ Admin access granted for: {session?.user?.name}
                                    </p>
                                </div>
                            )}
                        </AuthWrapper>
                    </div>
                </div>
            </div>
        </div>
    );
}
