import { auth } from "@/server/auth"
import { Button } from "../ui/button"
import Link from "next/link"
import { unstable_ViewTransition as ViewTransition } from "react"
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
                        <Button variant="ghost" className="text-gray-600 hover:text-black flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {user.user.name}
                            <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {user.user.email}
                        </div>
                        <DropdownMenuSeparator />
                        <AccountManagementModal user={user.user} />
                        {user.user.role === "admin" && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="flex items-center gap-2 w-full">
                                        <SettingsIcon className="h-4 w-4" />
                                        Admin Panel
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <LogoutButton />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <>
                    <Link prefetch={false} href="/login">
                        <ViewTransition name="login-button">
                            <Button variant="ghost" className="text-gray-600 hover:text-black">
                                Login
                            </Button>
                        </ViewTransition>
                    </Link>
                    <Link href="/register">
                        <ViewTransition name="signup-button">
                            <Button className="bg-black hover:bg-gray-800 text-white">
                                Sign Up
                            </Button>
                        </ViewTransition>
                    </Link>
                </>
            )}

        </div>
    )


}