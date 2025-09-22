'use client'

import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { authClient } from "@/lib/auth-client"





export default function LogoutButton() {

    const router = useRouter()

    async function handleLogout() {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/login")
                    }
                }
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Button variant="ghost" className="text-gray-600 hover:text-black" onClick={handleLogout}>
            Logout
        </Button>
    )
}