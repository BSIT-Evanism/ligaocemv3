"use server"
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "../auth";





export const getSession = cache(async () => {
    const mainheaders = await headers()
    const session = await auth.api.getSession({
        headers: mainheaders
    })
    return session
})