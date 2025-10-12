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
import { Eye, MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Plus } from "lucide-react"
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
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create Request</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="request-details">Request Details *</Label>
                                    <Textarea
                                        id="request-details"
                                        placeholder="Describe your request..."
                                        value={requestDetails}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestDetails(e.target.value)}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="contact-phone">Contact Phone (Optional)</Label>
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

                                <div>
                                    <Label htmlFor="contact-time">Preferred Contact Time (Optional)</Label>
                                    <input
                                        id="contact-time"
                                        type="text"
                                        placeholder="e.g., Weekdays 9-5 PM, Evenings after 7 PM"
                                        value={preferredContactTime}
                                        onChange={(e) => setPreferredContactTime(e.target.value)}
                                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                {myRelatedGraves.length > 0 && (
                                    <div>
                                        <Label htmlFor="related-grave">Related Grave (Optional)</Label>
                                        <Select value={selectedGraveForRequest ?? "none"} onValueChange={(v: string) => setSelectedGraveForRequest(v === "none" ? null : v)}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select a grave" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {myRelatedGraves.map((grave) => {
                                                    const data = grave.graveJson as Record<string, unknown>;
                                                    return (
                                                        <SelectItem key={grave.id} value={grave.id}>
                                                            {readStringField(data, "deceasedName", "Unnamed")} - {readStringField(data, "plotNumber")} ({(grave.clusterName as string) ?? "Unknown Cluster"})
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="additional-notes"
                                        placeholder="Any additional information..."
                                        value={additionalNotes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCreateRequest}
                                        disabled={!requestDetails.trim() || createRequestMutation.isPending}
                                        className="flex-1"
                                    >
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
                        <div className="p-6 text-center text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                            <p className="text-sm mb-4">You haven&apos;t submitted any requests yet.</p>
                            {session && (
                                <Button onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create your first request
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {myRequests.map(request => {
                                const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock
                                return (
                                    <li key={request.requestId} className="hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusConfig[request.status as keyof typeof statusConfig]?.label ?? request.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1 max-w-[70%] truncate">
                                                    {request.requestDetails ?? ""}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Submitted {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "-"}
                                                </div>
                                                {request.statusRemark && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Remark: {request.statusRemark}
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
                                                        ) : selectedRequestDetails ? (
                                                            <div className="space-y-6">
                                                                {/* Status Stepper */}
                                                                <RequestStepper
                                                                    status={selectedRequestDetails.status as "pending" | "processing" | "approved" | "rejected"}
                                                                    className="mb-6"
                                                                />

                                                                {/* Two-column read-only content */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Left: Details */}
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <Label className="text-sm font-medium">Status</Label>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <Badge className={statusConfig[selectedRequestDetails.status as keyof typeof statusConfig]?.color ?? "bg-gray-100 text-gray-800"}>
                                                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                                                        {statusConfig[selectedRequestDetails.status as keyof typeof statusConfig]?.label ?? selectedRequestDetails.status}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-sm font-medium">Submitted</Label>
                                                                                <div className="text-sm mt-1">{selectedRequestDetails.createdAt ? new Date(selectedRequestDetails.createdAt).toLocaleString() : "-"}</div>
                                                                            </div>
                                                                            <div>
                                                                                <Label className="text-sm font-medium">Last Updated</Label>
                                                                                <div className="text-sm mt-1">{selectedRequestDetails.updatedAt ? new Date(selectedRequestDetails.updatedAt).toLocaleString() : "-"}</div>
                                                                            </div>
                                                                            {selectedRequestDetails.requestRelatedGrave && (
                                                                                <div>
                                                                                    <Label className="text-sm font-medium">Related Grave</Label>
                                                                                    <div className="text-sm mt-1">Grave ID: {selectedRequestDetails.requestRelatedGrave}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div>
                                                                            <Label className="text-sm font-medium">Request Details</Label>
                                                                            <div className="text-sm p-3 bg-muted rounded-md mt-1">
                                                                                {selectedRequestDetails.requestDetails ?? ""}
                                                                            </div>
                                                                        </div>

                                                                        {null}

                                                                        {selectedRequestDetails.statusRemark && (
                                                                            <div>
                                                                                <Label className="text-sm font-medium">Status Remark</Label>
                                                                                <div className="text-sm p-3 bg-muted rounded-md mt-1">
                                                                                    {selectedRequestDetails.statusRemark}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right: Logs */}
                                                                    <div className="space-y-4">
                                                                        {selectedRequestDetails.logs && selectedRequestDetails.logs.length > 0 && (
                                                                            <div>
                                                                                <Label className="text-sm font-medium">Request History</Label>
                                                                                <div className="space-y-2 mt-2">
                                                                                    {selectedRequestDetails.logs.map((log) => (
                                                                                        <div key={log.id} className="p-3 bg-muted rounded-md">
                                                                                            <div className="flex justify-between items-start">
                                                                                                <div className="text-sm">{log.log}</div>
                                                                                                <div className="text-xs text-muted-foreground ml-2">
                                                                                                    {log.userName} • {log.createdAt ? new Date(log.createdAt as unknown as string | number | Date).toLocaleString() : "-"}
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
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
