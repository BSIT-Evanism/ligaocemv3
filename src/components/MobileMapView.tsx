"use client";

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Info, 
    List, 
    BookOpen, 
    MapPin, 
    Navigation, 
    Crosshair, 
    Navigation2, 
    MessageSquare, 
    User, 
    Clock, 
    Star 
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

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

interface MobileMapViewProps {
    center: [number, number];
    polygon: [number, number][];
    clusters: Cluster[];
    selected: Cluster | null;
    onClusterClick: (cluster: Cluster) => void;
    openClusterId: string | null;
    setOpenClusterId: (id: string | null) => void;
    activeTab: "info" | "graves" | "instructions";
    setActiveTab: (tab: "info" | "graves" | "instructions") => void;
    nestedOpen: boolean;
    setNestedOpen: (open: boolean) => void;
    nestedView: "info" | "graves" | "instructions";
    setNestedView: (view: "info" | "graves" | "instructions") => void;
    graves: Grave[];
    gravesLoading: boolean;
    instruction: { steps: InstructionStep[] } | null;
    instructionLoading: boolean;
    gravesSelected: Grave[];
    gravesSelectedLoading: boolean;
    instructionSelected: { steps: InstructionStep[] } | null;
    instructionSelectedLoading: boolean;
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

export default function MobileMapView({
    center,
    polygon,
    clusters,
    selected,
    onClusterClick,
    openClusterId,
    setOpenClusterId,
    activeTab,
    setActiveTab,
    nestedOpen,
    setNestedOpen,
    nestedView,
    setNestedView,
    graves,
    gravesLoading,
    instruction,
    instructionLoading,
    gravesSelected,
    gravesSelectedLoading,
    instructionSelected,
    instructionSelectedLoading,
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
}: MobileMapViewProps) {
    const { data: session } = useSession();

    return (
        <div className="h-full w-full flex flex-col">
            {/* Map Container */}
            <div className="flex-1 relative">
                <Map
                    className="h-full w-full"
                    center={center}
                    zoom={16}
                    maxZoom={19}
                    enableAddPolyline={false}
                    polygon={polygon}
                    polygonColor="#22c55e"
                    clusters={clusters}
                    onClusterClickAction={(c) => { onClusterClick(c); setOpenClusterId(c.id); }}
                />

                {/* Mobile Controls - Fixed Position */}
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                    <div className="flex gap-2 justify-center">
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
                                            <div className="grid grid-cols-1 gap-4">
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
                                                <div className="space-y-1">
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

            {/* Cluster Details Drawer */}
            <Drawer open={!!selected} onOpenChange={(o) => !o && onClusterClick(null as any)}>
                <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[40vh]">
                    <DrawerHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <DrawerTitle className="text-lg font-semibold">
                                    {selected ? selected.name : ""}
                                </DrawerTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Cluster #{selected?.clusterNumber}
                                </p>
                            </div>
                        </div>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setNestedView("info"); setNestedOpen(true); }}
                                className="flex flex-col items-center gap-1 h-auto py-3"
                            >
                                <Info className="h-4 w-4" />
                                <span className="text-xs">Main Info</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => { setNestedView("graves"); setNestedOpen(true); }}
                                className="flex flex-col items-center gap-1 h-auto py-3 bg-blue-600 hover:bg-blue-700"
                            >
                                <List className="h-4 w-4" />
                                <span className="text-xs">Graves</span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => { setNestedView("instructions"); setNestedOpen(true); }}
                                className="flex flex-col items-center gap-1 h-auto py-3"
                            >
                                <BookOpen className="h-4 w-4" />
                                <span className="text-xs">Instructions</span>
                            </Button>
                        </div>
                        {selected && (
                            <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium">Cluster #{selected.clusterNumber}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3"
                                        onClick={() => {
                                            if (!selected?.coordinates) return;
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.coordinates.latitude},${selected.coordinates.longitude}&travelmode=driving`;
                                            window.open(url, "_blank");
                                        }}
                                    >
                                        <Navigation className="h-4 w-4 mr-1" />
                                        Navigate
                                    </Button>
                                </div>
                                {selected.coordinates && (
                                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-background rounded px-2 py-1">
                                        {selected.coordinates.latitude.toFixed(6)}, {selected.coordinates.longitude.toFixed(6)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Nested drawer for mobile detailed views */}
            <Drawer open={nestedOpen} onOpenChange={setNestedOpen}>
                <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
                    <DrawerHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                {nestedView === "info" ? <Info className="w-5 h-5 text-blue-600" /> :
                                    nestedView === "graves" ? <List className="w-5 h-5 text-blue-600" /> :
                                        <BookOpen className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                                <DrawerTitle className="text-xl">
                                    {nestedView === "info" ? "Main Info" : nestedView === "graves" ? "Graves" : "Instructions"}
                                </DrawerTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selected ? selected.name : ""}
                                </p>
                            </div>
                        </div>
                    </DrawerHeader>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-y-auto px-4 pb-4">
                            {nestedView === "info" && (
                                <div className="space-y-4">
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <h3 className="font-semibold">Cluster Information</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <Label className="text-sm font-medium">Cluster Name</Label>
                                                <div className="text-lg font-semibold mt-1">{selected?.name}</div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Cluster Number</Label>
                                                <div className="text-base mt-1">#{selected?.clusterNumber}</div>
                                            </div>
                                            {selected?.coordinates && (
                                                <div>
                                                    <Label className="text-sm font-medium">Coordinates</Label>
                                                    <div className="text-sm font-mono bg-background rounded px-3 py-2 mt-1 border">
                                                        {selected.coordinates.latitude.toFixed(6)}, {selected.coordinates.longitude.toFixed(6)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {nestedView === "graves" && (
                                <div className="space-y-4">
                                    {gravesSelectedLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                <div className="text-sm text-muted-foreground">Loading graves...</div>
                                            </div>
                                        </div>
                                    ) : gravesSelected.length === 0 ? (
                                        <div className="text-center py-8">
                                            <List className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                            <h3 className="text-lg font-medium mb-2">No graves yet</h3>
                                            <p className="text-sm text-muted-foreground">This cluster doesn't have any graves yet.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {gravesSelected.map((g) => {
                                                const data = g.graveJson as Record<string, unknown>;
                                                return (
                                                    <li
                                                        key={g.id}
                                                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all duration-200"
                                                        onClick={() => onGraveClick(g)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                                <MapPin className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-lg text-gray-900 truncate">
                                                                    {readStringField(data, "deceasedName", "Unnamed")}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-sm text-gray-600">
                                                                        Plot {readStringField(data, "plotNumber")}
                                                                    </span>
                                                                    <Badge className={`text-xs px-2 py-1 ${getGraveTypeColor(readStringField(data, "graveType"))}`}>
                                                                        {readStringField(data, "graveType")}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            )}
                            {nestedView === "instructions" && (
                                <div className="space-y-4">
                                    {instructionSelectedLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                <div className="text-sm text-muted-foreground">Loading instructions...</div>
                                            </div>
                                        </div>
                                    ) : !instructionSelected ? (
                                        <div className="text-center py-8">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                            <h3 className="text-lg font-medium mb-2">No instructions yet</h3>
                                            <p className="text-sm text-muted-foreground">Instructions for this cluster are not available yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {instructionSelected.steps.map((s: InstructionStep) => (
                                                <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                                            <span className="text-sm font-bold text-blue-600">{s.step}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-base mb-2">Step {s.step}</h4>
                                                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                                                {s.instruction}
                                                            </div>
                                                            {s.imageUrl && (
                                                                <div className="mt-3">
                                                                    <img
                                                                        src={s.imageUrl as string}
                                                                        alt={`Step ${s.step}`}
                                                                        className="w-full h-auto max-h-64 rounded-lg border object-contain cursor-zoom-in"
                                                                        onClick={() => onImagePreview(s.imageUrl as string)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
