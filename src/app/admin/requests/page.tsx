'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Form from "next/form"
import { api } from "@/trpc/react"
import RequestsSkeleton from "@/components/requests/requests-skeleton"
import { Eye, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, ArrowUpDown, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User, Mail, Calendar, FileText, Phone, MapPin, Star, RefreshCw, Plus, Edit, Trash2, Search, SortAsc, SortDesc } from "lucide-react"
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
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status" | "name">("newest")
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected" | "overdue">("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Get tRPC utils for invalidations
    const utils = api.useUtils()

    const { data, isLoading, error, refetch } = api.requests.listAll.useQuery(
        {
            page: Math.max(1, currentPage), // Ensure page is at least 1
            limit: Math.max(1, Math.min(100, pageSize)), // Ensure limit is between 1-100
        },
        {
            suspense: false,
            retry: false,
            staleTime: 0,
            enabled: true, // Ensure query is enabled
        }
    )

    // Log errors for debugging
    if (error) {
        console.error("Requests listAll query error:", error);
    }

    // Debug logging
    console.log("Query params:", { page: currentPage, limit: pageSize });
    console.log("Query state:", { isLoading, error: !!error, hasData: !!data });

    const { data: requestDetails, isLoading: detailsLoading } = api.requests.getById.useQuery(
        { id: selectedRequest! },
        { enabled: !!selectedRequest }
    )

    const updateStatusMutation = api.requests.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Status updated successfully")
            setStatusUpdate({ status: "", remark: "" })
            // Invalidate related queries to update UI
            void utils.requests.listAll.invalidate()
            if (selectedRequest) {
                void utils.requests.getById.invalidate({ id: selectedRequest })
            }
        },
        onError: (error) => {
            toast.error(String((error as { message?: unknown })?.message ?? "An error occurred"))
        }
    })

    const addLogMutation = api.requests.addLog.useMutation({
        onSuccess: () => {
            toast.success("Log entry added")
            setLogEntry("")
            // Invalidate related queries to update UI
            void utils.requests.listAll.invalidate()
            if (selectedRequest) {
                void utils.requests.getById.invalidate({ id: selectedRequest })
            }
        },
        onError: (error) => {
            toast.error(String((error as { message?: unknown })?.message ?? "An error occurred"))
        }
    })

    const filtered = useMemo(() => {
        if (!data?.data) return []

        let filteredData = data.data

        // Apply search filter
        if (search) {
            filteredData = filteredData.filter(u =>
                (u.userName ?? "").toLowerCase().includes(search) ||
                (u.userEmail ?? "").toLowerCase().includes(search) ||
                u.requestDetails.toLowerCase().includes(search)
            )
        }

        // Apply status filter
        if (statusFilter !== "all") {
            if (statusFilter === "overdue") {
                // Consider requests overdue if they've been pending for more than 7 days
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

                filteredData = filteredData.filter(u => {
                    const createdAt = new Date(u.createdAt as unknown as string | number | Date)
                    return u.status === "pending" && createdAt < sevenDaysAgo
                })
            } else {
                filteredData = filteredData.filter(u => u.status === statusFilter)
            }
        }

        // Apply sorting
        filteredData = [...filteredData].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt as unknown as string | number | Date).getTime() -
                        new Date(a.createdAt as unknown as string | number | Date).getTime()
                case "oldest":
                    return new Date(a.createdAt as unknown as string | number | Date).getTime() -
                        new Date(b.createdAt as unknown as string | number | Date).getTime()
                case "status":
                    const statusOrder = { pending: 0, processing: 1, approved: 2, rejected: 3 }
                    const aStatus = statusOrder[a.status as keyof typeof statusOrder] ?? 4
                    const bStatus = statusOrder[b.status as keyof typeof statusOrder] ?? 4
                    return aStatus - bStatus
                case "name":
                    return (a.userName ?? "").localeCompare(b.userName ?? "")
                default:
                    return 0
            }
        })

        return filteredData
    }, [search, data, statusFilter, sortBy])

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

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize)
        setCurrentPage(1) // Reset to first page when changing page size
        // Invalidate to refresh data with new page size
        void utils.requests.listAll.invalidate()
    }

    const handleModalClose = () => {
        setSelectedRequest(null)
        setStatusUpdate({ status: "", remark: "" })
        setLogEntry("")
        // Refresh the requests list when modal closes
        void utils.requests.listAll.invalidate()
    }

    const pagination = data?.pagination

    // Invalidate queries when page or pageSize changes
    useEffect(() => {
        void utils.requests.listAll.invalidate()
    }, [currentPage, pageSize, utils])

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
        <div className="space-y-6 p-6">
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">User Requests</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage and review user requests for grave services
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Form action="/admin/requests" className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                name="search"
                                placeholder="Search by name, email, or request details..."
                                defaultValue={search}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" className="px-6">
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                    </Form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="status-filter" className="text-sm font-medium flex items-center gap-2">
                                <Filter className="w-4 h-4 text-blue-600" />
                                Filter by Status
                            </Label>
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            All Status
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-yellow-600" />
                                            Pending
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="processing">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-blue-600" />
                                            Processing
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            Approved
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-3 h-3 text-red-600" />
                                            Rejected
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="overdue">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-red-600" />
                                            Overdue
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sort Options */}
                        <div className="space-y-2">
                            <Label htmlFor="sort-by" className="text-sm font-medium flex items-center gap-2">
                                <ArrowUpDown className="w-4 h-4 text-blue-600" />
                                Sort by
                            </Label>
                            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">
                                        <div className="flex items-center gap-2">
                                            <SortDesc className="w-3 h-3" />
                                            Most Recent
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="oldest">
                                        <div className="flex items-center gap-2">
                                            <SortAsc className="w-3 h-3" />
                                            Oldest
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="status">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-3 h-3" />
                                            Status
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="name">
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3" />
                                            Name
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page Size */}
                        <div className="space-y-2">
                            <Label htmlFor="page-size" className="text-sm font-medium flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-blue-600" />
                                Per Page
                            </Label>
                            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 items</SelectItem>
                                    <SelectItem value="10">10 items</SelectItem>
                                    <SelectItem value="25">25 items</SelectItem>
                                    <SelectItem value="50">50 items</SelectItem>
                                    <SelectItem value="100">100 items</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results Count */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Results
                            </Label>
                            <div className="flex items-center justify-center h-10 px-3 bg-muted rounded-md">
                                <span className="text-sm font-medium">
                                    {pagination ? `${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}` : '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <ul className="divide-y divide-gray-200">
                        {filtered.map(request => {
                            const StatusIcon = (statusConfig[request.status as keyof typeof statusConfig]?.icon ?? Clock)

                            // Check if request is overdue (pending for more than 7 days)
                            const isOverdue = request.status === "pending" && (() => {
                                const sevenDaysAgo = new Date()
                                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                                const createdAt = new Date(request.createdAt as unknown as string | number | Date)
                                return createdAt < sevenDaysAgo
                            })()

                            return (
                                <li key={request.requestId} className={`hover:bg-muted/50 transition-all duration-200 ${isOverdue ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                                    <div className="flex items-start justify-between p-6">
                                        <div className="flex-1 space-y-3">
                                            {/* Header with user info and status */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-lg">{request.userName}</h3>
                                                        <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig[request.status as keyof typeof statusConfig]?.label ?? request.status}
                                                        </Badge>
                                                        {isOverdue && (
                                                            <Badge className="bg-red-100 text-red-800 animate-pulse">
                                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {request.userEmail}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {request.createdAt ? new Date(request.createdAt as unknown as string | number | Date).toLocaleDateString() : "-"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Request details */}
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-muted-foreground mb-1">Request Details</p>
                                                        <p className="text-sm leading-relaxed">{request.requestDetails}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional info if available */}
                                            {request.requestRelatedGrave && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>Related to grave plot</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Dialog onOpenChange={(open) => {
                                                if (!open) {
                                                    handleModalClose()
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedRequest(request.requestId)}
                                                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                                                    <DialogHeader className="pb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                                <FileText className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <DialogTitle className="text-xl">Request Details</DialogTitle>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    Review and manage request information
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogHeader>
                                                    {detailsLoading ? (
                                                        <div className="flex items-center justify-center h-64">Loading...</div>
                                                    ) : requestDetails ? (
                                                        <div className="flex flex-col flex-1 min-h-0">
                                                            {/* Status Stepper */}
                                                            <div className="flex-shrink-0 mb-4 px-1">
                                                                <RequestStepper
                                                                    status={requestDetails.status as "pending" | "processing" | "approved" | "rejected"}
                                                                    className="w-full"
                                                                />
                                                            </div>

                                                            {/* Two-column content with proper scrolling */}
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                                                                {/* Left: Details and status update */}
                                                                <div className="space-y-6 overflow-y-auto pr-2 min-h-0">
                                                                    {/* User Information Card */}
                                                                    <div className="bg-muted/30 rounded-lg p-4">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <User className="w-4 h-4 text-blue-600" />
                                                                            <h3 className="font-semibold">User Information</h3>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                                                    <User className="w-3 h-3" />
                                                                                    Name
                                                                                </Label>
                                                                                <div className="text-sm pl-5">{requestDetails.userName}</div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                                                    <Mail className="w-3 h-3" />
                                                                                    Email
                                                                                </Label>
                                                                                <div className="text-sm pl-5">{requestDetails.userEmail}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Request Status Card */}
                                                                    <div className="bg-muted/30 rounded-lg p-4">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <Star className="w-4 h-4 text-blue-600" />
                                                                            <h3 className="font-semibold">Request Status</h3>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm font-medium">Current Status</Label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge className={statusConfig[requestDetails.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                                                        {statusConfig[requestDetails.status as keyof typeof statusConfig]?.label ?? requestDetails.status}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    Created
                                                                                </Label>
                                                                                <div className="text-sm pl-5">{requestDetails.createdAt ? new Date(requestDetails.createdAt as unknown as string | number | Date).toLocaleString() : "-"}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Request Details Card */}
                                                                    <div className="bg-muted/30 rounded-lg p-4">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                                            <h3 className="font-semibold">Request Details</h3>
                                                                        </div>
                                                                        <div className="text-sm leading-relaxed p-3 bg-background rounded-md border">
                                                                            {requestDetails.requestDetails}
                                                                        </div>
                                                                    </div>

                                                                    {requestDetails.statusRemark && (
                                                                        <div className="bg-muted/30 rounded-lg p-4">
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                                                                <h3 className="font-semibold">Status Remark</h3>
                                                                            </div>
                                                                            <div className="text-sm leading-relaxed p-3 bg-background rounded-md border">
                                                                                {requestDetails.statusRemark}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Status Update Card */}
                                                                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                                        <div className="flex items-center gap-2 mb-4">
                                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                                            <h3 className="font-semibold text-blue-900">Update Status</h3>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            <div className="flex gap-3">
                                                                                <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}>
                                                                                    <SelectTrigger className="w-48">
                                                                                        <SelectValue placeholder="Select new status" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="pending">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Clock className="w-3 h-3 text-yellow-600" />
                                                                                                Pending
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                        <SelectItem value="processing">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <AlertCircle className="w-3 h-3 text-blue-600" />
                                                                                                Processing
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                        <SelectItem value="approved">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                                                                Approved
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                        <SelectItem value="rejected">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <XCircle className="w-3 h-3 text-red-600" />
                                                                                                Rejected
                                                                                            </div>
                                                                                        </SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <Button
                                                                                    onClick={handleStatusUpdate}
                                                                                    disabled={!statusUpdate.status || updateStatusMutation.isPending}
                                                                                    className="px-6 bg-blue-600 hover:bg-blue-700"
                                                                                >
                                                                                    <Edit className="w-4 h-4 mr-2" />
                                                                                    Update Status
                                                                                </Button>
                                                                            </div>
                                                                            <Input
                                                                                placeholder="Add a remark (optional)..."
                                                                                value={statusUpdate.remark}
                                                                                onChange={(e) => setStatusUpdate(prev => ({ ...prev, remark: e.target.value }))}
                                                                                className="w-full"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Right: Logs and add log */}
                                                                <div className="space-y-6 overflow-y-auto pr-2 min-h-0 flex flex-col">
                                                                    {/* Add Log Entry Card */}
                                                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex-shrink-0">
                                                                        <div className="flex items-center gap-2 mb-4">
                                                                            <Plus className="w-4 h-4 text-green-600" />
                                                                            <h3 className="font-semibold text-green-900">Add Log Entry</h3>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <Textarea
                                                                                placeholder="Add a log entry to track progress or updates..."
                                                                                value={logEntry}
                                                                                onChange={(e) => setLogEntry(e.target.value)}
                                                                                className="w-full resize-none"
                                                                                rows={3}
                                                                            />
                                                                            <Button
                                                                                onClick={handleAddLog}
                                                                                disabled={!logEntry.trim() || addLogMutation.isPending}
                                                                                className="w-full bg-green-600 hover:bg-green-700"
                                                                            >
                                                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                                                Add Log Entry
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Request Logs Card */}
                                                                    {requestDetails.logs && requestDetails.logs.length > 0 && (
                                                                        <div className="flex flex-col min-h-0 bg-muted/30 rounded-lg p-4">
                                                                            <div className="flex items-center gap-2 mb-4">
                                                                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                                                                <h3 className="font-semibold">Request Logs</h3>
                                                                                <Badge variant="secondary" className="ml-auto">
                                                                                    {requestDetails.logs.length} entries
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                                                                                {requestDetails.logs.map((log, index) => (
                                                                                    <div key={log.id} className="p-4 bg-background rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                                                                        <div className="flex items-start gap-3">
                                                                                            <div className="p-1.5 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                                                                                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="text-sm leading-relaxed mb-2">{log.log}</div>
                                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                                    <User className="w-3 h-3" />
                                                                                                    <span>{log.userName}</span>
                                                                                                    <span>•</span>
                                                                                                    <Calendar className="w-3 h-3" />
                                                                                                    <span>{log.createdAt ? new Date(log.createdAt as unknown as string | number | Date).toLocaleString() : "-"}</span>
                                                                                                </div>
                                                                                            </div>
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

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <Card className="shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                <span>
                                    Showing <span className="font-semibold text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-foreground">{pagination.total}</span> results
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(1)}
                                    disabled={!pagination.hasPrev}
                                    className="hover:bg-blue-50 hover:border-blue-200"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="hover:bg-blue-50 hover:border-blue-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {(() => {
                                        const pages = []
                                        const totalPages = pagination.totalPages
                                        const currentPage = pagination.page

                                        // Show first page
                                        if (currentPage > 3) {
                                            pages.push(
                                                <Button
                                                    key={1}
                                                    variant={currentPage === 1 ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(1)}
                                                >
                                                    1
                                                </Button>
                                            )
                                            if (currentPage > 4) {
                                                pages.push(<span key="ellipsis1" className="px-2">...</span>)
                                            }
                                        }

                                        // Show pages around current page
                                        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                                            pages.push(
                                                <Button
                                                    key={i}
                                                    variant={currentPage === i ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(i)}
                                                >
                                                    {i}
                                                </Button>
                                            )
                                        }

                                        // Show last page
                                        if (currentPage < totalPages - 2) {
                                            if (currentPage < totalPages - 3) {
                                                pages.push(<span key="ellipsis2" className="px-2">...</span>)
                                            }
                                            pages.push(
                                                <Button
                                                    key={totalPages}
                                                    variant={currentPage === totalPages ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </Button>
                                            )
                                        }

                                        return pages
                                    })()}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="hover:bg-blue-50 hover:border-blue-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.totalPages)}
                                    disabled={!pagination.hasNext}
                                    className="hover:bg-blue-50 hover:border-blue-200"
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}