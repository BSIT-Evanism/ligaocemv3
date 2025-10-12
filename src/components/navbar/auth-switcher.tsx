import { auth } from "@/server/auth"
import { Button } from "../ui/button"
import Link from "next/link"
import { headers } from "next/headers"
import LogoutButton from "../logout-button"
import AccountManagementModal from "../account-management-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { ChevronDownIcon, UserIcon, SettingsIcon } from "lucide-react"

export async function AuthSwitcher() {

    const mainheaders = await headers()
    const user = await auth.api.getSession({
        headers: mainheaders
    })

    return (
        <div className="flex items-center space-x-4">
            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold">{user.user.name}</span>
                                <span className="text-xs text-slate-500 capitalize">{user.user.role}</span>
                            </div>
                            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-xl rounded-2xl">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <div className="text-sm font-semibold text-slate-900">{user.user.name}</div>
                            <div className="text-xs text-slate-500">{user.user.email}</div>
                        </div>
                        <div className="py-2">
                            <AccountManagementModal user={user.user} />
                            {user.user.role === "admin" && (
                                <>
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="flex items-center gap-3 w-full px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg mx-2">
                                            <SettingsIcon className="h-4 w-4" />
                                            <span className="font-medium">Admin Panel</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem asChild>
                                <LogoutButton />
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex items-center space-x-3">
                    <Link prefetch={false} href="/login">
                        <Button variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-6 py-2 rounded-xl transition-all duration-200 font-medium">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )


}