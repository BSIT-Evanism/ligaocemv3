'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import { api } from "@/trpc/react"
import { polygon } from "leaflet"
import { useEffect, useMemo, useState, ViewTransition } from "react"
import dynamic from "next/dynamic"
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
} as const;

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: myRequests = [], isLoading } = api.requests.listMyRequests.useQuery(undefined, {
    suspense: false,
    retry: false,
    staleTime: 0,
  })
  const { data: clusters = [] } = api.public.clusters.useQuery();

  const recentRequests = myRequests.slice(0, 3);
  const requestStats = {
    total: myRequests.length,
    pending: myRequests.filter(r => r.status === "pending").length,
    approved: myRequests.filter(r => r.status === "approved").length,
    rejected: myRequests.filter(r => r.status === "rejected").length,
    processing: myRequests.filter(r => r.status === "processing").length,
  };

  const [polygon, setPolygon] = useState<[number, number][]>([]);

  useEffect(() => {
    setPolygon([
      [13.2362395, 123.5303761],
      [13.2357754, 123.5298631],
      [13.2355377, 123.5296262],
      [13.2355087, 123.5298964],
      [13.2345901, 123.52977],
      [13.234786, 123.5300769],
      [13.2347919, 123.530205],
      [13.2348141, 123.5302901],
      [13.2348513, 123.5304327],
      [13.2348958, 123.530575],
      [13.2349364, 123.5307051],
      [13.2349799, 123.5308006],
      [13.2351778, 123.5307803],
      [13.2352233, 123.5305546],
      [13.2354738, 123.5305842],
      [13.2356533, 123.5305975],
      [13.2359356, 123.530886],
      [13.2362395, 123.5303761],
    ]);
  }, []);

  const center = useMemo(() => [13.235529662734809, 123.53030072913442] as [number, number], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="space-y-8 p-6">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {session?.user?.name ?? "User"}
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Here&apos;s what&apos;s happening with your requests and cemetery management.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Stats and Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Requests</CardTitle>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{requestStats.total}</div>
                  <p className="text-xs text-slate-500 mt-1">All time</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{requestStats.pending}</div>
                  <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{requestStats.approved}</div>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Processing</CardTitle>
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{requestStats.processing}</div>
                  <p className="text-xs text-slate-500 mt-1">In progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests Card */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Recent Requests</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">Your latest cemetery requests and updates</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/dashboard/requests">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-slate-200 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests yet</h3>
                    <p className="text-slate-500 mb-6">Create your first request to get started</p>
                    <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl">
                      <Link href="/map">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Request
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRequests.map((request) => {
                      const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock
                      return (
                        <div key={request.requestId} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-200/50 hover:bg-white/80 transition-all duration-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate mb-2">{request.requestDetails}</p>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[request.status as keyof typeof statusConfig]?.color || "bg-slate-100 text-slate-800"}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {myRequests.length > 3 && (
                      <Button asChild variant="outline" className="w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Link href="/dashboard/requests">
                          View all {myRequests.length} requests
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg h-[400px] lg:h-[600px] overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Cemetery Map</CardTitle>
                <p className="text-sm text-slate-500">Interactive view of cemetery clusters</p>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <ViewTransition name="right-card-island">
                  <Map
                    className="h-full w-full rounded-b-xl"
                    center={center}
                    zoom={16}
                    maxZoom={19}
                    enableAddPolyline={false}
                    polygon={polygon}
                    polygonColor="#22c55e"
                    clusters={clusters}
                    enableAddMarkers={false}
                  />
                </ViewTransition>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}