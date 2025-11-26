
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"
import { useUsers } from "@/hooks/use-users"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { AlertTriangle, Clock, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
    const { data: clusters = [], isLoading: clustersLoading, error: clustersError } = api.clusters.listAll.useQuery()
    const { data: graves = [], isLoading: gravesLoading, error: gravesError } = api.graves.listAll.useQuery()
    const { data: requestsData, isLoading: requestsLoading, error: requestsError } = api.requests.listAll.useQuery()
    const requests = requestsData?.data ?? []
    const { data: expirationAlerts, isLoading: expirationLoading, error: expirationError } = api.graves.getExpirationAlerts.useQuery()

    const { total: usersTotal, isLoading: usersLoading, error: usersError } = useUsers({ limit: 1, offset: 0 })

    const requestsSparkline = useMemo(() => {
        const days = 7
        const counts: number[] = Array.from({ length: days }, () => 0)
        const now = new Date()
        for (const r of requests ?? []) {
            const created = new Date((r as { createdAt?: Date }).createdAt ?? 0)
            const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays < days) {
                const idx = days - 1 - diffDays
                counts[idx] = (counts[idx] ?? 0) + 1
            }
        }
        return { counts }
    }, [requests])

    const requestsChartData = useMemo(() => {
        const labels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        })
        return labels.map((label, i) => ({ day: label, requests: requestsSparkline.counts[i] ?? 0 }))
    }, [requestsSparkline])

    const requestsChartConfig: ChartConfig = {
        requests: {
            label: "Requests",
            color: "hsl(var(--chart-1))",
        },
    }

    const getErrorMessage = (e: unknown): string | null => {
        const maybe = e as { message?: unknown } | null
        return typeof maybe?.message === "string" ? maybe.message : null
    }
    const errorMessage = getErrorMessage(clustersError) ?? getErrorMessage(gravesError) ?? getErrorMessage(requestsError) ?? getErrorMessage(expirationError) ?? (usersError ?? null)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            {errorMessage && (
                <Alert>
                    <AlertDescription>
                        {errorMessage}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Clusters"
                    value={clusters.length}
                    loading={clustersLoading}
                />
                <MetricCard
                    title="Graves"
                    value={graves.length}
                    loading={gravesLoading}
                />
                <MetricCard
                    title="Requests"
                    value={requests.length}
                    loading={requestsLoading}
                />
                <MetricCard
                    title="Users"
                    value={usersTotal}
                    loading={usersLoading}
                />
            </div>

            {/* Expiration Alerts */}
            {expirationAlerts && (expirationAlerts.totalNearExpiration > 0 || expirationAlerts.totalExpired > 0) && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                            <AlertTriangle className="h-5 w-5" />
                            Grave Expiration Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {expirationAlerts.totalExpired > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {expirationAlerts.totalExpired} Expired
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-red-700">
                                        {expirationAlerts.totalExpired} grave{expirationAlerts.totalExpired !== 1 ? 's' : ''} have expired and may need attention.
                                    </p>
                                    <div className="space-y-1">
                                        {expirationAlerts.expired.slice(0, 3).map((grave) => {
                                            const graveData = grave.graveJson as Record<string, unknown>
                                            return (
                                                <div key={grave.id} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                                    <div className="font-medium">{graveData.deceasedName as string}</div>
                                                    <div className="text-red-500">
                                                        {grave.clusterName} - Plot {graveData.plotNumber as string}
                                                    </div>
                                                    <div className="text-red-400">
                                                        Expired: {grave.graveExpirationDate ? new Date(grave.graveExpirationDate).toLocaleDateString() : 'Unknown'}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {expirationAlerts.expired.length > 3 && (
                                            <div className="text-xs text-red-500">
                                                ...and {expirationAlerts.expired.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {expirationAlerts.totalNearExpiration > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1 border-orange-300 text-orange-700">
                                            <Clock className="h-3 w-3" />
                                            {expirationAlerts.totalNearExpiration} Near Expiration
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-orange-700">
                                        {expirationAlerts.totalNearExpiration} grave{expirationAlerts.totalNearExpiration !== 1 ? 's' : ''} will expire within 30 days.
                                    </p>
                                    <div className="space-y-1">
                                        {expirationAlerts.nearExpiration.slice(0, 3).map((grave) => {
                                            const graveData = grave.graveJson as Record<string, unknown>
                                            const expirationDate = grave.graveExpirationDate ? new Date(grave.graveExpirationDate) : null
                                            const daysUntilExpiration = expirationDate ? Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                                            return (
                                                <div key={grave.id} className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                                                    <div className="font-medium">{graveData.deceasedName as string}</div>
                                                    <div className="text-orange-500">
                                                        {grave.clusterName} - Plot {graveData.plotNumber as string}
                                                    </div>
                                                    <div className="text-orange-400">
                                                        Expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {expirationAlerts.nearExpiration.length > 3 && (
                                            <div className="text-xs text-orange-500">
                                                ...and {expirationAlerts.nearExpiration.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/graves">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Manage Graves
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Requests (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    {requestsLoading ? (
                        <Skeleton className="h-56 w-full" />
                    ) : (
                        <ChartContainer config={requestsChartConfig} className="min-h-[224px] w-full">
                            <BarChart accessibilityLayer data={requestsChartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function MetricCard(props: { title: string; value: number; loading?: boolean; footer?: React.ReactNode }) {
    const { title, value, loading, footer } = props
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <div className="text-3xl font-bold">{value ?? 0}</div>
                )}
                {footer}
            </CardContent>
        </Card>
    )
}