'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { api } from "@/trpc/react"
import { Eye, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Plus, User, Mail, Calendar, FileText, MapPin, Star, Edit } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"
import { RequestStepper } from "@/components/ui/request-stepper"

const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
} as const;

export default function UserRequestsPage() {
    const { data: session } = useSession();
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [requestDetails, setRequestDetails] = useState("")
    const [selectedGraveForRequest, setSelectedGraveForRequest] = useState<string | null>(null)
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
    const [contactPhone, setContactPhone] = useState("")
    const [preferredContactTime, setPreferredContactTime] = useState("")
    const [additionalNotes, setAdditionalNotes] = useState("")

    const { data: myRequests = [], isLoading, error, refetch } = api.requests.listMyRequests.useQuery(undefined, {
        suspense: false,
        retry: false,
        staleTime: 0,
    })

    const { data: selectedRequestDetails, isLoading: detailsLoading } = api.requests.getById.useQuery(
        { id: selectedRequest! },
        { enabled: !!selectedRequest }
    )

    const { data: myRelatedGraves = [] } = api.graveRelations.getMyRelatedGraves.useQuery()

    const createRequestMutation = api.requests.create.useMutation({
        onSuccess: () => {
            toast.success("Request submitted successfully")
            setCreateDialogOpen(false)
            setRequestDetails("")
            setSelectedGraveForRequest(null)
            setPriority("medium")
            setContactPhone("")
            setPreferredContactTime("")
            setAdditionalNotes("")
            void refetch()
        },
        onError: (error) => {
            toast.error(String(error.message ?? "An error occurred"))
        }
    })

    const readStringField = (obj: Record<string, unknown>, key: string, fallback = "-") => {
        const value = obj?.[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
        return fallback;
    };

    const handleCreateRequest = () => {
        if (!requestDetails.trim()) {
            toast.error("Please provide request details")
            return
        }

        createRequestMutation.mutate({
            requestDetails: requestDetails.trim(),
            requestRelatedGrave: selectedGraveForRequest ?? undefined,
            priority,
            contactPhone: contactPhone.trim() || undefined,
            preferredContactTime: preferredContactTime.trim() || undefined,
            additionalNotes: additionalNotes.trim() || undefined,
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>My Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>My Requests</CardTitle>
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Requests</h1>
                {session && (
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl">Create New Request</DialogTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Submit a request for grave services
                                        </p>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6">
                                {/* Request Details Card */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold">Request Details</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="request-details" className="text-sm font-medium">Description *</Label>
                                        <Textarea
                                            id="request-details"
                                            placeholder="Describe your request in detail..."
                                            value={requestDetails}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestDetails(e.target.value)}
                                            rows={4}
                                            className="mt-1 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Priority and Contact Card */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Star className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold">Priority & Contact</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="priority" className="text-sm font-medium">Priority Level</Label>
                                            <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                            Low
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            Medium
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="high">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                            High
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="contact-phone" className="text-sm font-medium flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                Contact Phone (Optional)
                                            </Label>
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                placeholder="+1 (555) 123-4567"
                                                value={contactPhone}
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-1">
                                        <Label htmlFor="contact-time" className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            Preferred Contact Time (Optional)
                                        </Label>
                                        <input
                                            id="contact-time"
                                            type="text"
                                            placeholder="e.g., Weekdays 9-5 PM, Evenings after 7 PM"
                                            value={preferredContactTime}
                                            onChange={(e) => setPreferredContactTime(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Related Grave Card */}
                                {myRelatedGraves.length > 0 && (
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <h3 className="font-semibold">Related Grave (Optional)</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="related-grave" className="text-sm font-medium">Select Grave</Label>
                                            <Select value={selectedGraveForRequest ?? "none"} onValueChange={(v: string) => setSelectedGraveForRequest(v === "none" ? null : v)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select a grave" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                            None
                                                        </div>
                                                    </SelectItem>
                                                    {myRelatedGraves.map((grave) => {
                                                        const data = grave.graveJson as Record<string, unknown>;
                                                        const graveId = String(grave.id ?? "");
                                                        return (
                                                            <SelectItem key={graveId} value={graveId}>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-3 h-3 text-blue-600" />
                                                                    {readStringField(data, "deceasedName", "Unnamed")} - {readStringField(data, "plotNumber")} ({String(grave.clusterName ?? "Unknown Cluster")})
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Notes Card */}
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold">Additional Notes (Optional)</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="additional-notes" className="text-sm font-medium">Extra Information</Label>
                                        <Textarea
                                            id="additional-notes"
                                            placeholder="Any additional information that might be helpful..."
                                            value={additionalNotes}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
                                            rows={3}
                                            className="mt-1 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-shrink-0 pt-4 border-t">
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCreateRequest}
                                        disabled={!requestDetails.trim() || createRequestMutation.isPending}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCreateDialogOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <Card>
                <CardContent className="p-0">
                    {myRequests.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 bg-blue-100 rounded-full">
                                    <MessageSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">No requests yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        You haven&apos;t submitted any requests yet. Create your first request to get started.
                                    </p>
                                </div>
                                {session && (
                                    <Button
                                        onClick={() => setCreateDialogOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create your first request
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {myRequests.map(request => {
                                const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock
                                return (
                                    <li key={request.requestId} className="hover:bg-muted/50 transition-all duration-200">
                                        <div className="flex items-start justify-between p-6">
                                            <div className="flex-1 space-y-3">
                                                {/* Header with status */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-blue-100 rounded-full">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {statusConfig[request.status as keyof typeof statusConfig]?.label ?? request.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Submitted {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Request details */}
                                                <div className="bg-muted/30 rounded-lg p-4">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-muted-foreground mb-1">Request Details</p>
                                                            <p className="text-sm leading-relaxed">{request.requestDetails ?? ""}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status remark if available */}
                                                {request.statusRemark && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <div className="flex items-start gap-2">
                                                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-blue-900 mb-1">Status Remark</p>
                                                                <p className="text-sm text-blue-800">{request.statusRemark}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedRequest(String(request.requestId))}
                                                            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
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
                                                                        Review your request information and status
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </DialogHeader>
                                                        {detailsLoading ? (
                                                            <div className="flex items-center justify-center h-64">
                                                                <div className="text-center">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                                    <div className="text-sm text-muted-foreground">Loading request details...</div>
                                                                </div>
                                                            </div>
                                                        ) : selectedRequestDetails ? (
                                                            <div className="flex flex-col flex-1 min-h-0">
                                                                {/* Status Stepper */}
                                                                <div className="flex-shrink-0 mb-4 px-1">
                                                                    <RequestStepper
                                                                        status={selectedRequestDetails.status as "pending" | "processing" | "approved" | "rejected"}
                                                                        className="w-full"
                                                                    />
                                                                </div>

                                                                {/* Two-column content with proper scrolling */}
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden">
                                                                    {/* Left: Details */}
                                                                    <div className="space-y-6 overflow-y-auto pr-2 min-h-0">
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
                                                                                        <Badge className={statusConfig[selectedRequestDetails.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                                                            {statusConfig[selectedRequestDetails.status as keyof typeof statusConfig]?.label ?? selectedRequestDetails.status}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-sm font-medium flex items-center gap-2">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        Submitted
                                                                                    </Label>
                                                                                    <div className="text-sm pl-5">{selectedRequestDetails.createdAt ? new Date(selectedRequestDetails.createdAt).toLocaleString() : "-"}</div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-sm font-medium flex items-center gap-2">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        Last Updated
                                                                                    </Label>
                                                                                    <div className="text-sm pl-5">{selectedRequestDetails.updatedAt ? new Date(selectedRequestDetails.updatedAt).toLocaleString() : "-"}</div>
                                                                                </div>
                                                                                {selectedRequestDetails.requestRelatedGrave && (
                                                                                    <div className="space-y-1">
                                                                                        <Label className="text-sm font-medium flex items-center gap-2">
                                                                                            <MapPin className="w-3 h-3" />
                                                                                            Related Grave
                                                                                        </Label>
                                                                                        <div className="text-sm pl-5">Grave ID: {selectedRequestDetails.requestRelatedGrave}</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Request Details Card */}
                                                                        <div className="bg-muted/30 rounded-lg p-4">
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                                <h3 className="font-semibold">Request Details</h3>
                                                                            </div>
                                                                            <div className="text-sm leading-relaxed p-3 bg-background rounded-md border">
                                                                                {selectedRequestDetails.requestDetails ?? ""}
                                                                            </div>
                                                                        </div>

                                                                        {selectedRequestDetails.statusRemark && (
                                                                            <div className="bg-muted/30 rounded-lg p-4">
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                                                    <h3 className="font-semibold">Status Remark</h3>
                                                                                </div>
                                                                                <div className="text-sm leading-relaxed p-3 bg-background rounded-md border">
                                                                                    {selectedRequestDetails.statusRemark}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right: Logs */}
                                                                    <div className="space-y-6 overflow-y-auto pr-2 min-h-0 flex flex-col">
                                                                        {/* Request Logs Card */}
                                                                        {selectedRequestDetails.logs && selectedRequestDetails.logs.length > 0 && (
                                                                            <div className="flex flex-col min-h-0 bg-muted/30 rounded-lg p-4">
                                                                                <div className="flex items-center gap-2 mb-4">
                                                                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                                                                    <h3 className="font-semibold">Request History</h3>
                                                                                    <Badge variant="secondary" className="ml-auto">
                                                                                        {selectedRequestDetails.logs.length} entries
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                                                                                    {selectedRequestDetails.logs.map((log) => (
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
                                                            <div className="flex items-center justify-center h-64">
                                                                <div className="text-center text-destructive">
                                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                                                    <div className="text-sm">Error loading request details</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
