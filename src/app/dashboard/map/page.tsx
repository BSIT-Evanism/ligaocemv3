"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMapStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import MobileMapView from "@/components/MobileMapView";
import DesktopMapView from "@/components/DesktopMapView";
import GraveDetailsModal from "@/components/GraveDetailsModal";
import ImagePreview from "@/components/ImagePreview";

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
    clusterInstructionsId: string;
    createdAt: Date;
    updatedAt: Date;
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

    // Image preview state
    const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(null);

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

    const openImagePreview = (src: string) => setImagePreviewSrc(src);
    const closeImagePreview = () => setImagePreviewSrc(null);

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

    // Transform myRelatedGraves to match component expectations
    const transformedMyRelatedGraves = useMemo(() => {
        return myRelatedGraves
            .filter(grave => grave.id !== null)
            .map(grave => ({
                id: grave.id!,
                graveJson: grave.graveJson,
                clusterName: grave.clusterName,
                clusterNumber: grave.clusterNumber
            }));
    }, [myRelatedGraves]);

    const commonProps = {
        center,
        polygon,
        clusters,
        selected,
        onClusterClick: setSelected,
        openClusterId,
        setOpenClusterId,
        activeTab,
        setActiveTab,
        graves,
        gravesLoading,
        instruction: instruction ? { steps: instruction.steps } : null,
        instructionLoading,
        onGraveClick: handleGraveClick,
        onImagePreview: openImagePreview,
        onRequestAndGoToMyLocation: requestAndGoToMyLocation,
        onToggleFollowMe: toggleFollowMe,
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
        myRelatedGraves: transformedMyRelatedGraves,
        onCreateRequest: handleCreateRequest,
        createRequestMutation
    };

    return (
        <div className="relative h-[calc(100vh-64px)] w-full">
            {isMobile ? (
                <MobileMapView
                    {...commonProps}
                    myRelatedGraves={transformedMyRelatedGraves}
                    nestedOpen={nestedOpen}
                    setNestedOpen={setNestedOpen}
                    nestedView={nestedView}
                    setNestedView={setNestedView}
                    gravesSelected={gravesSelected}
                    gravesSelectedLoading={gravesSelectedLoading}
                    instructionSelected={instructionSelected ? { steps: instructionSelected.steps } : null}
                    instructionSelectedLoading={instructionSelectedLoading}
                />
            ) : (
                <DesktopMapView {...commonProps} />
            )}

            <GraveDetailsModal
                open={graveModalOpen}
                onOpenChange={setGraveModalOpen}
                selectedGrave={selectedGrave}
                clusters={clusters}
                graveImages={graveImages}
                graveImagesLoading={graveImagesLoading}
                onGoToGrave={handleGoToGrave}
            />

            <ImagePreview
                src={imagePreviewSrc}
                onClose={closeImagePreview}
            />
        </div>
    );
}