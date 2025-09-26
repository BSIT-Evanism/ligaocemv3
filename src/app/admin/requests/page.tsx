'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Form from "next/form"
import { unstable_ViewTransition as ViewTransition } from "react";
import { api } from "@/trpc/react"
import RequestsSkeleton from "@/components/requests/requests-skeleton"

// removed unused mock data

export default function RequestsPage() {
    const searchParams = useSearchParams()
    const search = searchParams.get("search")?.toLowerCase() ?? ""

    const { data, isLoading, error } = api.requests.listAll.useQuery(undefined, {
        suspense: false,
        retry: false,
        staleTime: 0,
    })

    const filtered = useMemo(() => {
        if (!data) return []
        if (!search) return data
        return data.filter(u =>
            (u.userName ?? "").toLowerCase().includes(search) ||
            (u.userEmail ?? "").toLowerCase().includes(search) ||
            u.requestDetails.toLowerCase().includes(search)
        )
    }, [search, data])

    if (isLoading) {
        return (
            <RequestsSkeleton rows={6} />
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>User Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-destructive">{error.message}</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <ViewTransition name="requests-search">
                <Card>
                    <CardHeader>
                        <CardTitle>User Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form action="/admin/requests" className="flex gap-2">
                            <Input name="search" placeholder="Search by name, email, or request" defaultValue={search} />
                            <Button type="submit">Search</Button>
                        </Form>
                    </CardContent>
                </Card>
            </ViewTransition>
            <ViewTransition name="requests-list">
                <Card>
                    <CardContent className="p-0">
                        <ul className="divide-y">
                            {filtered.map(user => {
                                const href = { pathname: "/admin/requests", query: { search } }
                                return (
                                    <li key={user.requestId} className="hover:bg-muted/50 transition-colors">
                                        <Link prefetch={false} href={href} className="block p-4">
                                            <ViewTransition name={`user-${user.userId}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{user.userName}</div>
                                                        <div className="text-sm text-muted-foreground">{user.userEmail}</div>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground text-right max-w-[50%] truncate">
                                                        {user.requestDetails}
                                                    </div>
                                                </div>
                                            </ViewTransition>
                                        </Link>
                                    </li>
                                )
                            })}
                            {filtered.length === 0 && (
                                <li className="p-6 text-center text-muted-foreground">No results</li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </ViewTransition>
        </div>
    )
}