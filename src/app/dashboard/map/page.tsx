"use client";

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// (removed unused Separator)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Info, List, BookOpen, MapPin, Navigation, Crosshair, Navigation2, MessageSquare } from "lucide-react";
import { useMapStore } from "@/lib/store";
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

// Types for rendering only

type InstructionStep = {
    id: string;
    step: number;
    instruction: string;
    imageUrl: string | null;
    imageCustomId: string | null;
};


export default function PublicMapPage() {
    const isMobile = useIsMobile();
    const { data: session } = useSession();
    const { data: clusters = [] } = api.public.clusters.useQuery();
    const [selected, setSelected] = useState<Cluster | null>(null);
    const [polygon, setPolygon] = useState<[number, number][]>([]);
    const [activeTab, setActiveTab] = useState<"info" | "graves" | "instructions">("info");
    const [openClusterId, setOpenClusterId] = useState<string | null>(null);
    const [nestedOpen, setNestedOpen] = useState(false);
    const [nestedView, setNestedView] = useState<"info" | "graves" | "instructions">("info");

    // Grave modal state
    const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null);
    const [graveModalOpen, setGraveModalOpen] = useState(false);

    // Request creation state
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestDetails, setRequestDetails] = useState("");
    const [selectedGraveForRequest, setSelectedGraveForRequest] = useState<string | null>(null);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [contactPhone, setContactPhone] = useState("");
    const [preferredContactTime, setPreferredContactTime] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");

    // Image preview state (basic fullscreen dialog)
    const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(null);
    const openImagePreview = (src: string) => setImagePreviewSrc(src);
    const closeImagePreview = () => setImagePreviewSrc(null);

    const { data: graves = [], isLoading: gravesLoading } = api.public.gravesByCluster.useQuery(
        { clusterId: openClusterId ?? "" },
        { enabled: !!openClusterId }
    );
    const { data: instruction, isLoading: instructionLoading } = api.public.instructionsByCluster.useQuery(
        { clusterId: openClusterId ?? "" },
        { enabled: !!openClusterId }
    );

    // Query for graves related to current user for request creation
    const { data: myRelatedGraves = [] } = api.graveRelations.getMyRelatedGraves.useQuery(undefined, {
        enabled: !!session
    });

    // Queries for the currently selected cluster (mobile nested drawer views)
    const { data: gravesSelected = [], isLoading: gravesSelectedLoading } = api.public.gravesByCluster.useQuery(
        { clusterId: selected?.id ?? "" },
        { enabled: nestedOpen && nestedView === "graves" && !!selected?.id }
    );
    const { data: instructionSelected, isLoading: instructionSelectedLoading } = api.public.instructionsByCluster.useQuery(
        { clusterId: selected?.id ?? "" },
        { enabled: nestedOpen && nestedView === "instructions" && !!selected?.id }
    );

    // Grave images query
    const { data: graveImages = [], isLoading: graveImagesLoading } = api.public.graveImages.useQuery(
        { graveId: selectedGrave?.id ?? "" },
        { enabled: !!selectedGrave?.id }
    );

    // Request creation mutation
    const createRequestMutation = api.requests.create.useMutation({
        onSuccess: () => {
            toast.success("Request submitted successfully");
            setRequestDialogOpen(false);
            setRequestDetails("");
            setSelectedGraveForRequest(null);
        },
        onError: (error) => {
            toast.error(String(error.message ?? "An error occurred"));
        }
    });

    const { addMarker, setFlyToTarget, setUserLocation, setFollowUser, followUser } = useMapStore();
    const [watchId, setWatchId] = useState<number | null>(null);
    const [orientation, setOrientation] = useState<number | null>(null);
    const lastLocRef = useRef<{ lat: number; lng: number; accuracy?: number } | null>(null);

    const requestAndGoToMyLocation = async () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by this browser.");
            return;
        }
        try {
            // Ask for permission and read location
            await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000,
                });
            }).then((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                addMarker([lat, lng]);
                setFlyToTarget([lat, lng]);
            });
        } catch (err) {
            console.error(err);
            alert("Unable to get your location. Please allow location permission.");
        }
    };

    const toggleFollowMe = async () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by this browser.");
            return;
        }
        if (followUser) {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
            if (typeof window !== "undefined") {
                window.removeEventListener("deviceorientation", handleDeviceOrientation);
            }
            setFollowUser(false);
            return;
        }
        // Start watching
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const acc = pos.coords.accuracy;
                lastLocRef.current = { lat, lng, accuracy: acc };
                setUserLocation({ lat, lng, accuracy: acc, heading: orientation });
            },
            (err) => {
                console.error(err);
                alert("Unable to track your location.");
            },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
        );
        setWatchId(id);
        if (typeof window !== "undefined") {
            try {
                const AnyDO = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<"granted" | "denied"> };
                if (typeof AnyDO?.requestPermission === "function") {
                    const res = await AnyDO.requestPermission();
                    if (res !== "granted") {
                        // Orientation permission denied; still follow location without heading
                        setFollowUser(true);
                        return;
                    }
                }
            } catch {
                // ignore permission errors; best-effort
            }
            window.addEventListener("deviceorientation", handleDeviceOrientation as EventListener);
        }
        setFollowUser(true);
    };

    const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
        // Use 'webkitCompassHeading' when available (iOS), otherwise 'alpha'
        const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
        const heading = typeof webkitHeading === "number" ? webkitHeading : (typeof e.alpha === "number" ? e.alpha : null);
        setOrientation(heading);
        const base = lastLocRef.current;
        if (base) {
            setUserLocation({ lat: base.lat, lng: base.lng, accuracy: base.accuracy, heading });
        }
    }, [setUserLocation]);

    const handleCreateRequest = () => {
        if (!requestDetails.trim()) {
            toast.error("Please provide request details");
            return;
        }

        createRequestMutation.mutate({
            requestDetails: requestDetails.trim(),
            requestRelatedGrave: selectedGraveForRequest ?? undefined,
            priority,
            contactPhone: contactPhone.trim() || undefined,
            preferredContactTime: preferredContactTime.trim() || undefined,
            additionalNotes: additionalNotes.trim() || undefined,
        });
    };

    useEffect(() => {
        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            if (typeof window !== "undefined") {
                window.removeEventListener("deviceorientation", handleDeviceOrientation);
            }
        };
    }, [watchId, handleDeviceOrientation]);

    // Close image preview on ESC
    useEffect(() => {
        if (!imagePreviewSrc) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeImagePreview();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [imagePreviewSrc]);

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

    const handleGraveClick = (grave: Grave) => {
        setSelectedGrave(grave);
        setGraveModalOpen(true);
    };

    const handleGoToGrave = () => {
        if (!selectedGrave) return;

        // Find the cluster for this grave
        const cluster = clusters.find(c => c.id === selectedGrave.graveClusterId);
        if (cluster?.coordinates) {
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cluster.coordinates.latitude},${cluster.coordinates.longitude}&travelmode=driving`;
            window.open(googleMapsUrl, "_blank");
            setGraveModalOpen(false);
        }
    };

    return (
        <div className="relative h-[calc(100vh-64px)] w-full md:h-[calc(100vh-250px)]">
            {isMobile ? (
                <div className="h-full w-full">
                    <Map
                        className=" h-[calc(100vh-250px)] w-full"
                        center={center}
                        zoom={16}
                        maxZoom={19}
                        enableAddPolyline={false}
                        polygon={polygon}
                        polygonColor="#22c55e"
                        clusters={clusters}
                        onClusterClickAction={(c) => { setSelected(c); setOpenClusterId(c.id); }}
                    />

                    <div className="pointer-events-none flex gap-2">
                        <button
                            type="button"
                            onClick={requestAndGoToMyLocation}
                            className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm shadow hover:bg-gray-50"
                            aria-label="Use my location"
                        >
                            <Crosshair className="mr-2 h-4 w-4" /> My location
                        </button>
                        <button
                            type="button"
                            onClick={toggleFollowMe}
                            className={`pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm shadow ${followUser ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}
                            aria-label="Follow me"
                        >
                            <Navigation2 className="mr-2 h-4 w-4" /> {followUser ? "Following" : "Follow me"}
                        </button>
                        {session && (
                            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm shadow hover:bg-gray-50"
                                        aria-label="Create request"
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" /> Request
                                    </button>
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
                                                        {myRelatedGraves.map((grave, idx) => {
                                                            const data = grave.graveJson as Record<string, unknown>;
                                                            return (
                                                                <SelectItem key={grave.id ?? String(idx)} value={(grave.id ?? "")}>
                                                                    {readStringField(data, "deceasedName", "Unnamed")} - {readStringField(data, "plotNumber")} ({grave.clusterName ?? "Unknown Cluster"})
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
                    <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[25vh]">
                            <DrawerHeader>
                                <DrawerTitle className="text-base font-semibold">
                                    {selected ? selected.name : ""}
                                </DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 pb-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setNestedView("info"); setNestedOpen(true); }}>
                                        <Info className="mr-2 h-4 w-4" /> Main Info
                                    </Button>
                                    <Button size="sm" onClick={() => { setNestedView("graves"); setNestedOpen(true); }}>
                                        <List className="mr-2 h-4 w-4" /> Graves
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => { setNestedView("instructions"); setNestedOpen(true); }}>
                                        <BookOpen className="mr-2 h-4 w-4" /> Instructions
                                    </Button>
                                </div>
                                {selected && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium">Cluster #{selected.clusterNumber}</span>
                                        {selected.coordinates && (
                                            <span className="ml-1">
                                                {selected.coordinates.latitude.toFixed(6)}, {selected.coordinates.longitude.toFixed(6)}
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto h-8 w-8"
                                            onClick={() => {
                                                if (!selected?.coordinates) return;
                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.coordinates.latitude},${selected.coordinates.longitude}&travelmode=driving`;
                                                window.open(url, "_blank");
                                            }}
                                        >
                                            <Navigation className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DrawerContent>
                    </Drawer>

                    {/* Nested drawer for mobile detailed views */}
                    <Drawer open={nestedOpen} onOpenChange={setNestedOpen}>
                        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[80vh]">
                            <DrawerHeader>
                                <DrawerTitle className="text-lg font-semibold">
                                    {nestedView === "info" ? "Main Info" : nestedView === "graves" ? "Graves" : "Instructions"}
                                    {selected ? ` • ${selected.name}` : ""}
                                </DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 pb-4">
                                {nestedView === "info" && (
                                    <div className="space-y-2">
                                        <div className="text-base font-medium">{selected?.name}</div>
                                        <div className="text-sm text-muted-foreground">Cluster #{selected?.clusterNumber}</div>
                                        {selected?.coordinates && (
                                            <div className="text-sm text-gray-600">
                                                {selected.coordinates.latitude.toFixed(6)}, {selected.coordinates.longitude.toFixed(6)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {nestedView === "graves" && (
                                    <div className="max-h-[66vh] overflow-auto pr-1 text-sm">
                                        {gravesSelectedLoading ? (
                                            <div className="py-2 text-muted-foreground">Loading graves...</div>
                                        ) : gravesSelected.length === 0 ? (
                                            <div className="py-2 text-muted-foreground">No graves yet.</div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {gravesSelected.map((g) => {
                                                    const data = g.graveJson as Record<string, unknown>;
                                                    return (
                                                        <li
                                                            key={g.id}
                                                            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50 hover:shadow-sm cursor-pointer transition-all duration-200 bg-white"
                                                            onClick={() => handleGraveClick(g)}
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
                                        )}
                                    </div>
                                )}
                                {nestedView === "instructions" && (
                                    <div className="max-h-[66vh] overflow-auto pr-1 text-sm">
                                        {instructionSelectedLoading ? (
                                            <div className="py-2 text-muted-foreground">Loading instructions...</div>
                                        ) : !instructionSelected ? (
                                            <div className="py-2 text-muted-foreground">No instructions yet.</div>
                                        ) : (
                                            <ol className="list-decimal space-y-2 pl-5">
                                                {instructionSelected.steps.map((s: InstructionStep) => (
                                                    <li key={s.id}>
                                                        <div className="font-medium text-base">Step {s.step}</div>
                                                        <div className="text-muted-foreground text-sm whitespace-pre-line rounded-md border p-3 bg-muted/30">{s.instruction}</div>
                                                        {s.imageUrl && (
                                                            <img
                                                                src={s.imageUrl as string}
                                                                alt={`Step ${s.step}`}
                                                                className="mt-3 h-auto max-h-48 w-full rounded-md border object-contain cursor-zoom-in"
                                                                onClick={() => openImagePreview(s.imageUrl as string)}
                                                            />
                                                        )}
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            ) : (
                <div className="h-full w-full gap-4 md:flex">
                    <div className="h-full w-1/2">
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
                            onClusterClickAction={(c) => setSelected(c as Cluster)}
                        />

                        <div className="pointer-events-none flex gap-2">
                            <button
                                type="button"
                                onClick={requestAndGoToMyLocation}
                                className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm shadow hover:bg-gray-50"
                                aria-label="Use my location"
                            >
                                <Crosshair className="mr-2 h-4 w-4" /> My location
                            </button>
                            <button
                                type="button"
                                onClick={toggleFollowMe}
                                className={`pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm shadow ${followUser ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}
                                aria-label="Follow me"
                            >
                                <Navigation2 className="mr-2 h-4 w-4" /> {followUser ? "Following" : "Follow me"}
                            </button>
                            {session && (
                                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            className="pointer-events-auto inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm shadow hover:bg-gray-50"
                                            aria-label="Create request"
                                        >
                                            <MessageSquare className="mr-2 h-4 w-4" /> Request
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Create Request</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="request-details-desktop">Request Details *</Label>
                                                <Textarea
                                                    id="request-details-desktop"
                                                    placeholder="Describe your request..."
                                                    value={requestDetails}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestDetails(e.target.value)}
                                                    rows={4}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="priority-desktop">Priority</Label>
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
                                                    <Label htmlFor="contact-phone-desktop">Contact Phone (Optional)</Label>
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

                                            <div>
                                                <Label htmlFor="contact-time-desktop">Preferred Contact Time (Optional)</Label>
                                                <input
                                                    id="contact-time-desktop"
                                                    type="text"
                                                    placeholder="e.g., Weekdays 9-5 PM, Evenings after 7 PM"
                                                    value={preferredContactTime}
                                                    onChange={(e) => setPreferredContactTime(e.target.value)}
                                                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>

                                            {myRelatedGraves.length > 0 && (
                                                <div>
                                                    <Label htmlFor="related-grave-desktop">Related Grave (Optional)</Label>
                                                    <Select value={selectedGraveForRequest ?? "none"} onValueChange={(v: string) => setSelectedGraveForRequest(v === "none" ? null : v)}>
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select a grave" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {myRelatedGraves.map((grave, idx) => {
                                                                const data = grave.graveJson as Record<string, unknown>;
                                                                return (
                                                                    <SelectItem key={grave.id ?? String(idx)} value={(grave.id ?? "")}>
                                                                        {readStringField(data, "deceasedName", "Unnamed")} - {readStringField(data, "plotNumber")} ({grave.clusterName ?? "Unknown Cluster"})
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <div>
                                                <Label htmlFor="additional-notes-desktop">Additional Notes (Optional)</Label>
                                                <Textarea
                                                    id="additional-notes-desktop"
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
                    <div className="h-full w-1/2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="text-xl">Clusters</CardTitle>
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
                                                                                    onClick={() => handleGraveClick(g)}
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
                                                                                        onClick={() => openImagePreview(s.imageUrl as string)}
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
            )}

            {/* Grave Details Modal */}
            <Dialog open={graveModalOpen} onOpenChange={setGraveModalOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="text-2xl font-bold text-slate-800">Grave Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {selectedGrave && (() => {
                            const graveData = selectedGrave.graveJson as Record<string, unknown> | null;
                            const getStringValue = (value: unknown): string => {
                                return typeof value === 'string' ? value : 'N/A';
                            };

                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Deceased Name</label>
                                            <p className="text-xl font-bold text-slate-800 mt-2">
                                                {getStringValue(graveData?.deceasedName)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Plot Number</label>
                                            <p className="text-xl font-semibold text-slate-800 mt-2">
                                                {getStringValue(graveData?.plotNumber)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Birth Date</label>
                                            <p className="text-lg font-medium text-slate-700 mt-2">
                                                {getStringValue(graveData?.birthDate)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Death Date</label>
                                            <p className="text-lg font-medium text-slate-700 mt-2">
                                                {getStringValue(graveData?.deathDate)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Grave Type</label>
                                            <div className="mt-2">
                                                <Badge className={`text-sm px-4 py-2 ${getGraveTypeColor(getStringValue(graveData?.graveType))}`}>
                                                    {getStringValue(graveData?.graveType)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Cluster</label>
                                            <p className="text-lg font-medium text-slate-700 mt-2">
                                                {clusters.find(c => c.id === selectedGrave.graveClusterId)?.name ?? 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const notes = graveData?.notes;
                                        if (notes && typeof notes === 'string' && notes.trim()) {
                                            return (
                                                <div className="bg-slate-50 rounded-xl p-5">
                                                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Notes</label>
                                                    <p className="text-lg font-medium text-slate-700 mt-2 leading-relaxed">
                                                        {notes}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex justify-between items-center">
                                            <div className="bg-slate-100 rounded-lg p-3">
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grave ID</label>
                                                <p className="text-sm font-mono text-slate-600 mt-1">{selectedGrave.id}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setGraveModalOpen(false)}
                                                    className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                                                >
                                                    Close
                                                </Button>
                                                <Button
                                                    onClick={handleGoToGrave}
                                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white font-semibold"
                                                >
                                                    <Navigation className="h-4 w-4 mr-2" />
                                                    Go to Grave
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grave Images */}
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-semibold text-slate-800">Images</h4>
                                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{(graveImages?.length ?? 0)} images</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {(graveImages ?? []).map((img) => (
                                                <div key={img.id} className="border border-slate-200 rounded-xl p-3 bg-white hover:shadow-md transition-shadow duration-200">
                                                    <img
                                                        src={img.imageUrl}
                                                        alt={img.imageAlt ?? ''}
                                                        className="w-full h-40 object-cover rounded-lg cursor-zoom-in"
                                                        onClick={() => openImagePreview(img.imageUrl)}
                                                    />
                                                </div>
                                            ))}
                                            {graveImagesLoading && (
                                                <div className="text-base text-slate-500 col-span-full text-center py-8 bg-slate-50 rounded-xl">
                                                    Loading images...
                                                </div>
                                            )}
                                            {!graveImagesLoading && (graveImages?.length ?? 0) === 0 && (
                                                <div className="text-base text-slate-500 col-span-full text-center py-8 bg-slate-50 rounded-xl">
                                                    No images available for this grave.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>

            {imagePreviewSrc && (
                <div
                    className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90"
                    onClick={closeImagePreview}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        aria-label="Close image preview"
                        className="absolute right-4 top-4 rounded bg-white/10 px-3 py-1.5 text-white backdrop-blur hover:bg-white/20"
                        onClick={(e) => { e.stopPropagation(); closeImagePreview(); }}
                    >
                        Close
                    </button>
                    <img
                        src={imagePreviewSrc as string}
                        alt="Preview"
                        className="max-h-[92vh] max-w-[92vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}



