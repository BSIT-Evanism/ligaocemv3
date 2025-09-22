import { auth } from "@/server/auth"
import { Button } from "../ui/button"
import Link from "next/link"
import { unstable_ViewTransition as ViewTransition } from "react"
import Form from "next/form"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import LogoutButton from "../logout-button"

export async function AuthSwitcher() {

    const mainheaders = await headers()
    const user = await auth.api.getSession({
        headers: mainheaders
    })

    return (
        <div className="flex items-center space-x-4">
            {user ? (
                <>
                    <Button variant="ghost" className="text-gray-600 hover:text-black">
                        {user.user.name}
                    </Button>
                    <LogoutButton />
                </>
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