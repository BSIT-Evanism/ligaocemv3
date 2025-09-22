import AuthWrapper from "@/components/auth/AuthWrapper";

export default function WidgetDemoPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-8">AuthWrapper Widget Demo</h1>
                <p className="text-gray-600 mb-8">
                    Demonstrating different sizes and use cases for AuthWrapper with separate loading and fallback states.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Small Widget */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Small Widget</h3>
                        <div className="h-24">
                            <AuthWrapper
                                redirect={false}
                                loading={
                                    <div className="animate-pulse bg-gray-200 h-full rounded"></div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-gray-50 rounded border">
                                        <span className="text-xs text-gray-600">Login required</span>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-green-50 rounded flex items-center justify-center">
                                        <span className="text-xs text-green-800">
                                            Welcome {session?.user?.name}
                                        </span>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>

                    {/* Medium Widget */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Medium Widget</h3>
                        <div className="h-32">
                            <AuthWrapper
                                redirect={false}
                                loading={
                                    <div className="animate-pulse bg-gray-200 h-full rounded"></div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-gray-50 rounded border">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-gray-900 mb-1">Not logged in</div>
                                            <div className="text-xs text-gray-600">Please login to view content</div>
                                        </div>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-blue-50 rounded p-3 flex flex-col justify-center">
                                        <div className="text-sm font-medium text-blue-900 mb-1">
                                            {session?.user?.name}
                                        </div>
                                        <div className="text-xs text-blue-700">
                                            Role: {session?.user?.role ?? 'No role'}
                                        </div>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>

                    {/* Large Widget */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Large Widget</h3>
                        <div className="h-48">
                            <AuthWrapper
                                redirect={false}
                                loading={
                                    <div className="animate-pulse bg-gray-200 h-full rounded"></div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-gray-50 rounded border">
                                        <div className="text-center">
                                            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <div className="text-sm font-medium text-gray-900 mb-1">Authentication Required</div>
                                            <div className="text-xs text-gray-600 mb-3">Please login to access this feature</div>
                                            <div className="flex gap-2 justify-center">
                                                <a href="/login" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                                    Login
                                                </a>
                                                <a href="/register" className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300">
                                                    Register
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-purple-50 rounded p-4 flex flex-col justify-center">
                                        <div className="text-lg font-semibold text-purple-900 mb-2">
                                            Welcome back!
                                        </div>
                                        <div className="text-sm text-purple-700 mb-2">
                                            {session?.user?.name} ({session?.user?.email})
                                        </div>
                                        <div className="text-xs text-purple-600">
                                            Role: {session?.user?.role ?? 'No role assigned'}
                                        </div>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>

                    {/* Role-based Widget */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Admin Widget</h3>
                        <div className="h-32">
                            <AuthWrapper
                                rolesRequired={["admin"]}
                                redirect={false}
                                loading={
                                    <div className="animate-pulse bg-gray-200 h-full rounded"></div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-red-50 rounded border border-red-200">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-red-900 mb-1">Admin Required</div>
                                            <div className="text-xs text-red-700">This feature requires admin access</div>
                                        </div>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-green-50 rounded p-3 flex flex-col justify-center">
                                        <div className="text-sm font-medium text-green-900 mb-1">
                                            Admin Panel
                                        </div>
                                        <div className="text-xs text-green-700">
                                            Welcome {session?.user?.name}
                                        </div>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>

                    {/* Custom Loading Widget */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-semibold mb-3">Custom Loading</h3>
                        <div className="h-32">
                            <AuthWrapper
                                redirect={false}
                                loading={
                                    <div className="h-full bg-gradient-to-r from-blue-200 to-purple-200 rounded flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                            <div className="text-xs text-blue-800">Loading...</div>
                                        </div>
                                    </div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-yellow-50 rounded border border-yellow-200">
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-yellow-900 mb-1">Access Denied</div>
                                            <div className="text-xs text-yellow-700">Please login to continue</div>
                                        </div>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-indigo-50 rounded p-3 flex flex-col justify-center">
                                        <div className="text-sm font-medium text-indigo-900 mb-1">
                                            Custom Styled
                                        </div>
                                        <div className="text-xs text-indigo-700">
                                            {session?.user?.name}
                                        </div>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>

                    {/* Full Width Widget */}
                    <div className="bg-white p-4 rounded-lg shadow md:col-span-2 lg:col-span-3">
                        <h3 className="font-semibold mb-3">Full Width Widget</h3>
                        <div className="h-24">
                            <AuthWrapper
                                redirect={false}
                                loading={
                                    <div className="animate-pulse bg-gray-200 h-full rounded"></div>
                                }
                                fallback={
                                    <div className="flex items-center justify-center h-full bg-gray-50 rounded border">
                                        <div className="flex items-center gap-4">
                                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Authentication Required</div>
                                                <div className="text-xs text-gray-600">Please login to access the full dashboard</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href="/login" className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                                    Login
                                                </a>
                                                <a href="/register" className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300">
                                                    Register
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                {(session) => (
                                    <div className="h-full bg-gradient-to-r from-green-50 to-blue-50 rounded p-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-semibold text-gray-900 mb-1">
                                                Welcome to your dashboard, {session?.user?.name}!
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                You have full access to all features
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {session?.user?.role ?? 'No role'}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {session?.user?.email}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </AuthWrapper>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
