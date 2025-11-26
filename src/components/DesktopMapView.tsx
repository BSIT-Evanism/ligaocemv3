"use client";

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
    Info, 
    List, 
    BookOpen, 
    MapPin, 
    Crosshair, 
    Navigation2, 
    MessageSquare, 
    User, 
    Clock, 
    Star 
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

type Cluster = {
    id: string;
    name: string;
    clusterNumber: number;
    coordinates: { latitude: number; longitude: number } | null;
};

type Grave = {
    id: string;
    graveClusterId: string;
    graveJson: unknown;
    createdAt: Date;
    updatedAt: Date;
};

type InstructionStep = {
    id: string;
    step: number;
    instruction: string;
    imageUrl: string | null;
    imageCustomId: string | null;
};

interface DesktopMapViewProps {
    center: [number, number];
    polygon: [number, number][];
    clusters: Cluster[];
    selected: Cluster | null;
    onClusterClick: (cluster: Cluster) => void;
    openClusterId: string | null;
    setOpenClusterId: (id: string | null) => void;
    activeTab: "info" | "graves" | "instructions";
    setActiveTab: (tab: "info" | "graves" | "instructions") => void;
    graves: Grave[];
    gravesLoading: boolean;
    instruction: { steps: InstructionStep[] } | null;
    instructionLoading: boolean;
    onGraveClick: (grave: Grave) => void;
    onImagePreview: (src: string) => void;
    onRequestAndGoToMyLocation: () => void;
    onToggleFollowMe: () => void;
    followUser: boolean;
    requestDialogOpen: boolean;
    setRequestDialogOpen: (open: boolean) => void;
    requestDetails: string;
    setRequestDetails: (details: string) => void;
    selectedGraveForRequest: string | null;
    setSelectedGraveForRequest: (id: string | null) => void;
    priority: "low" | "medium" | "high";
    setPriority: (priority: "low" | "medium" | "high") => void;
    contactPhone: string;
    setContactPhone: (phone: string) => void;
    preferredContactTime: string;
    setPreferredContactTime: (time: string) => void;
    additionalNotes: string;
    setAdditionalNotes: (notes: string) => void;
    myRelatedGraves: Array<{
        id: string;
        graveJson: unknown;
        clusterName: string | null;
        clusterNumber: number | null;
    }>;
    onCreateRequest: () => void;
    createRequestMutation: {
        isPending: boolean;
    };
}

const readStringField = (obj: Record<string, unknown>, key: string, fallback = "-") => {
    const value = obj?.[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    return fallback;
};

const getGraveTypeColor = (graveType: string) => {
    const colors = {
        traditional: "bg-blue-100 text-blue-800",
        cremation: "bg-green-100 text-green-800",
        mausoleum: "bg-purple-100 text-purple-800",
        columbarium: "bg-orange-100 text-orange-800",
        memorial: "bg-gray-100 text-gray-800"
    };
    return colors[graveType as keyof typeof colors] ?? "bg-gray-100 text-gray-800";
};

export default function DesktopMapView({
    center,
    polygon,
    clusters,
    selected,
    onClusterClick,
    openClusterId,
    setOpenClusterId,
    activeTab,
    setActiveTab,
    graves,
    gravesLoading,
    instruction,
    instructionLoading,
    onGraveClick,
    onImagePreview,
    onRequestAndGoToMyLocation,
    onToggleFollowMe,
    followUser,
    requestDialogOpen,
    setRequestDialogOpen,
    requestDetails,
    setRequestDetails,
    selectedGraveForRequest,
    setSelectedGraveForRequest,
    priority,
    setPriority,
    contactPhone,
    setContactPhone,
    preferredContactTime,
    setPreferredContactTime,
    additionalNotes,
    setAdditionalNotes,
    myRelatedGraves,
    onCreateRequest,
    createRequestMutation
}: DesktopMapViewProps) {
    const { data: session } = useSession();

    return (
        <div className="h-full w-full flex flex-col lg:flex-row gap-4">
            {/* Map Section */}
            <div className="h-1/2 lg:h-full w-full lg:w-1/2 relative">
                <Map
                    className="h-full w-full"
                    center={center}
                    zoom={16}
                    maxZoom={19}
                    enableAddPolyline={false}
                    polygon={polygon}
                    polygonColor="#22c55e"
                    clusters={clusters}
                    enableAddMarkers={false}
                    enableLocateControl={true}
                    onClusterClickAction={(c) => onClusterClick(c as Cluster)}
                />

                {/* Desktop Controls - Fixed Position */}
                <div className="absolute bottom-4 left-4 pointer-events-none">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onRequestAndGoToMyLocation}
                            className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-lg border bg-white px-4 text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
                            aria-label="Use my location"
                        >
                            <Crosshair className="mr-2 h-4 w-4" /> My location
                        </button>
                        <button
                            type="button"
                            onClick={onToggleFollowMe}
                            className={`pointer-events-auto inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium shadow-lg transition-colors ${followUser ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"}`}
                            aria-label="Follow me"
                        >
                            <Navigation2 className="mr-2 h-4 w-4" /> {followUser ? "Following" : "Follow me"}
                        </button>
                        {session && (
                            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-lg border bg-white px-4 text-sm font-medium shadow-lg hover:bg-gray-50 transition-colors"
                                        aria-label="Create request"
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" /> Request
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
                                    <DialogHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <MessageSquare className="w-5 h-5 text-blue-600" />
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
                                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                                <h3 className="font-semibold">Request Details</h3>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="request-details-desktop" className="text-sm font-medium">Description *</Label>
                                                <Textarea
                                                    id="request-details-desktop"
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
                                                    <Label htmlFor="priority-desktop" className="text-sm font-medium">Priority Level</Label>
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
                                                    <Label htmlFor="contact-phone-desktop" className="text-sm font-medium flex items-center gap-2">
                                                        <User className="w-3 h-3" />
                                                        Contact Phone (Optional)
                                                    </Label>
                                                    <input
                                                        id="contact-phone-desktop"
                                                        type="tel"
                                                        placeholder="+1 (555) 123-4567"
                                                        value={contactPhone}
                                                        onChange={(e) => setContactPhone(e.target.value)}
                                                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-1">
                                                <Label htmlFor="contact-time-desktop" className="text-sm font-medium flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    Preferred Contact Time (Optional)
                                                </Label>
                                                <input
                                                    id="contact-time-desktop"
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
                                                    <Label htmlFor="related-grave-desktop" className="text-sm font-medium">Select Grave</Label>
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
                                                            {myRelatedGraves.map((grave, idx) => {
                                                                const data = grave.graveJson as Record<string, unknown>;
                                                                return (
                                                                    <SelectItem key={grave.id ?? String(idx)} value={(grave.id ?? "")}>
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
                                                <Label htmlFor="additional-notes-desktop" className="text-sm font-medium">Extra Information</Label>
                                                <Textarea
                                                    id="additional-notes-desktop"
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
                                                onClick={onCreateRequest}
                                                disabled={!requestDetails.trim() || createRequestMutation.isPending}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setRequestDialogOpen(false)}
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
                </div>
            </div>

            {/* Clusters Sidebar */}
            <div className="h-1/2 lg:h-full w-full lg:w-1/2">
                <Card className="h-full">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <List className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Clusters</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Explore cemetery clusters and graves
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-0 grow overflow-auto pr-1">
                        <Accordion type="single" collapsible value={openClusterId ?? undefined} onValueChange={(v) => setOpenClusterId(v || null)}>
                            {clusters.map((c) => (
                                <AccordionItem key={c.id} value={c.id}>
                                    <AccordionTrigger className="hover:bg-slate-50 rounded-lg px-4 py-3">
                                        <div className={`flex w-full items-center justify-between pr-2 ${selected?.id === c.id ? "bg-blue-50 rounded-md px-3 py-2" : ""}`}>
                                            <div className="text-lg font-semibold text-slate-800">{c.name}</div>
                                            <div className="text-slate-600 text-base font-medium">Cluster #{c.clusterNumber}</div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Tabs value={openClusterId === c.id ? activeTab : "info"} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                                            <TabsList className="mb-4 bg-slate-100 mt-2 p-1 rounded-lg w-full grid grid-cols-3">
                                                <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base py-3 px-4"><Info className="mr-2 h-5 w-5" /> Main Info</TabsTrigger>
                                                <TabsTrigger value="graves" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base py-3 px-4"><List className="mr-2 h-5 w-5" /> Graves</TabsTrigger>
                                                <TabsTrigger value="instructions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-base py-3 px-4"><BookOpen className="mr-2 h-5 w-5" /> Instructions</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="info">
                                                <div className="space-y-3 text-base">
                                                    <div className="text-slate-600 font-medium">Cluster #{c.clusterNumber}</div>
                                                    {c.coordinates && (
                                                        <div className="text-sm text-slate-500 font-mono bg-slate-50 p-2 rounded-lg">
                                                            {c.coordinates.latitude.toFixed(6)}, {c.coordinates.longitude.toFixed(6)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="graves">
                                                <div className="max-h-72 overflow-auto pr-1 text-sm">
                                                    {openClusterId === c.id ? (
                                                        gravesLoading ? (
                                                            <div className="py-2 text-muted-foreground">Loading graves...</div>
                                                        ) : graves.length === 0 ? (
                                                            <div className="py-2 text-muted-foreground">No graves yet.</div>
                                                        ) : (
                                                            <ul className="space-y-3">
                                                                {graves.map((g) => {
                                                                    const data = g.graveJson as Record<string, unknown>;
                                                                    return (
                                                                        <li
                                                                            key={g.id}
                                                                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50 hover:shadow-sm cursor-pointer transition-all duration-200 bg-white"
                                                                            onClick={() => onGraveClick(g)}
                                                                        >
                                                                            <div className="flex-1">
                                                                                <span className="font-semibold text-lg text-slate-800">{readStringField(data, "deceasedName", "Unnamed")}</span>
                                                                                <div className="text-slate-600 text-base mt-1 flex items-center gap-2">
                                                                                    <span>Plot {readStringField(data, "plotNumber")}</span>
                                                                                    <span>•</span>
                                                                                    <Badge className={`text-sm px-3 py-1 ${getGraveTypeColor(readStringField(data, "graveType"))}`}>
                                                                                        {readStringField(data, "graveType")}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        )
                                                    ) : (
                                                        <div className="py-2 text-muted-foreground">Open to load graves</div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="instructions">
                                                <div className="max-h-72 overflow-auto pr-1 text-sm">
                                                    {openClusterId === c.id ? (
                                                        instructionLoading ? (
                                                            <div className="py-2 text-muted-foreground">Loading instructions...</div>
                                                        ) : !instruction ? (
                                                            <div className="py-2 text-muted-foreground">No instructions yet.</div>
                                                        ) : (
                                                            <ol className="list-decimal space-y-2 pl-5">
                                                                {instruction.steps.map((s: InstructionStep) => (
                                                                    <li key={s.id}>
                                                                        <div className="font-medium text-base">Step {s.step}</div>
                                                                        <div className="text-muted-foreground text-sm whitespace-pre-line rounded-md border p-2 bg-muted/30">{s.instruction}</div>
                                                                        {s.imageUrl && (
                                                                            <img
                                                                                src={s.imageUrl as string}
                                                                                alt={`Step ${s.step}`}
                                                                                className="mt-2 h-auto max-h-48 w-full rounded border object-contain cursor-zoom-in"
                                                                                onClick={() => onImagePreview(s.imageUrl as string)}
                                                                            />
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        )
                                                    ) : (
                                                        <div className="py-2 text-muted-foreground">Open to load instructions</div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
