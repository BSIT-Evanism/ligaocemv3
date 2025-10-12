'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Form from "next/form"
import { api } from "@/trpc/react"
import RequestsSkeleton from "@/components/requests/requests-skeleton"
import { Eye, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { RequestStepper } from "@/components/ui/request-stepper"

const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
} as const;

export default function RequestsPage() {
    const searchParams = useSearchParams()
    const search = searchParams.get("search")?.toLowerCase() ?? ""
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [statusUpdate, setStatusUpdate] = useState({ status: "", remark: "" })
    const [logEntry, setLogEntry] = useState("")

    const { data, isLoading, error, refetch } = api.requests.listAll.useQuery(undefined, {
        suspense: false,
        retry: false,
        staleTime: 0,
    })

    const { data: requestDetails, isLoading: detailsLoading } = api.requests.getById.useQuery(
        { id: selectedRequest! },
        { enabled: !!selectedRequest }
    )

    const updateStatusMutation = api.requests.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated successfully")
            void refetch()
            setStatusUpdate({ status: "", remark: "" })
        },
        onError: (error) => {
            toast.error(String((error as { message?: unknown })?.message ?? "An error occurred"))
        }
    })

    const addLogMutation = api.requests.addLog.useMutation({
        onSuccess: () => {
            toast.success("Log entry added")
            void refetch()
            setLogEntry("")
        },
        onError: (error) => {
            toast.error(String((error as { message?: unknown })?.message ?? "An error occurred"))
        }
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

    const handleStatusUpdate = () => {
        if (!selectedRequest || !statusUpdate.status) return
        updateStatusMutation.mutate({
            requestId: selectedRequest,
            status: statusUpdate.status as "pending" | "approved" | "rejected" | "processing",
            remark: statusUpdate.remark || undefined
        })
    }

    const handleAddLog = () => {
        if (!selectedRequest || !logEntry.trim()) return
        addLogMutation.mutate({
            requestId: selectedRequest,
            log: logEntry
        })
    }

    if (isLoading) {
        return <RequestsSkeleton rows={6} />
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

            <Card>
                <CardContent className="p-0">
                    <ul className="divide-y">
                        {filtered.map(request => {
                            const StatusIcon = (statusConfig[request.status as keyof typeof statusConfig]?.icon ?? Clock)
                            return (
                                <li key={request.requestId} className="hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="font-medium">{request.userName}</div>
                                                <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {statusConfig[request.status as keyof typeof statusConfig]?.label ?? request.status}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                                            <div className="text-sm text-muted-foreground mt-1 max-w-[70%] truncate">
                                                {request.requestDetails}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {request.createdAt ? new Date(request.createdAt as unknown as string | number | Date).toLocaleDateString() : "-"}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedRequest(request.requestId)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Request Details</DialogTitle>
                                                    </DialogHeader>
                                                    {detailsLoading ? (
                                                        <div>Loading...</div>
                                                    ) : requestDetails ? (
                                                        <div className="space-y-6">
                                                            {/* Status Stepper */}
                                                            <RequestStepper
                                                                status={requestDetails.status as "pending" | "processing" | "approved" | "rejected"}
                                                                className="mb-6"
                                                            />

                                                            {/* Two-column content */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* Left: Details and status update */}
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <Label className="text-sm font-medium">User</Label>
                                                                            <div className="text-sm">{requestDetails.userName} ({requestDetails.userEmail})</div>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm font-medium">Status</Label>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge className={statusConfig[requestDetails.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                                    {statusConfig[requestDetails.status as keyof typeof statusConfig]?.label ?? requestDetails.status}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm font-medium">Created</Label>
                                                                            <div className="text-sm">{requestDetails.createdAt ? new Date(requestDetails.createdAt as unknown as string | number | Date).toLocaleString() : "-"}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm font-medium">Last Updated</Label>
                                                                            <div className="text-sm">{requestDetails.updatedAt ? new Date(requestDetails.updatedAt as unknown as string | number | Date).toLocaleString() : "-"}</div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-sm font-medium">Request Details</Label>
                                                                        <div className="text-sm p-3 bg-muted rounded-md mt-1">
                                                                            {requestDetails.requestDetails}
                                                                        </div>
                                                                    </div>

                                                                    {requestDetails.statusRemark && (
                                                                        <div>
                                                                            <Label className="text-sm font-medium">Status Remark</Label>
                                                                            <div className="text-sm p-3 bg-muted rounded-md mt-1">
                                                                                {requestDetails.statusRemark}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <Label className="text-sm font-medium">Update Status</Label>
                                                                        <div className="flex gap-2 mt-2">
                                                                            <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}>
                                                                                <SelectTrigger className="w-40">
                                                                                    <SelectValue placeholder="Select status" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="pending">Pending</SelectItem>
                                                                                    <SelectItem value="processing">Processing</SelectItem>
                                                                                    <SelectItem value="approved">Approved</SelectItem>
                                                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <Input
                                                                                placeholder="Remark (optional)"
                                                                                value={statusUpdate.remark}
                                                                                onChange={(e) => setStatusUpdate(prev => ({ ...prev, remark: e.target.value }))}
                                                                                className="flex-1"
                                                                            />
                                                                            <Button
                                                                                onClick={handleStatusUpdate}
                                                                                disabled={!statusUpdate.status || updateStatusMutation.isPending}
                                                                            >
                                                                                Update
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Right: Logs and add log */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <Label className="text-sm font-medium">Add Log Entry</Label>
                                                                        <div className="flex gap-2 mt-2">
                                                                            <Textarea
                                                                                placeholder="Add a log entry..."
                                                                                value={logEntry}
                                                                                onChange={(e) => setLogEntry(e.target.value)}
                                                                                className="flex-1"
                                                                                rows={2}
                                                                            />
                                                                            <Button
                                                                                onClick={handleAddLog}
                                                                                disabled={!logEntry.trim() || addLogMutation.isPending}
                                                                            >
                                                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                                                Add Log
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {requestDetails.logs && requestDetails.logs.length > 0 && (
                                                                        <div>
                                                                            <Label className="text-sm font-medium">Request Logs</Label>
                                                                            <div className="space-y-2 mt-2">
                                                                                {requestDetails.logs.map((log) => (
                                                                                    <div key={log.id} className="p-3 bg-muted rounded-md">
                                                                                        <div className="flex justify-between items-start">
                                                                                            <div className="text-sm">{log.log}</div>
                                                                                            <div className="text-xs text-muted-foreground ml-2">{log.userName} • {log.createdAt ? new Date(log.createdAt as unknown as string | number | Date).toLocaleString() : "-"}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>Error loading request details</div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                        {filtered.length === 0 && (
                            <li className="p-6 text-center text-muted-foreground">No results</li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}