
'use client'

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { GraveModal } from "@/components/GraveModal";
import { GraveEditModal } from "@/components/GraveEditModal";
import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "@/trpc/react";
import { useDebounce } from "@/hooks/use-debounce";
import { HighlightText } from "@/lib/search-highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Search, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Eye, BookOpen, Plus, X, Upload, Edit } from "lucide-react";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useUploadThing } from "@/lib/uploadthing";
import { ViewTransition } from "react"

type Grave = {
    id: string;
    graveClusterId: string;
    graveJson: unknown;
    graveExpirationDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export default function GravesPage() {
    const [polygon, setPolygon] = useState<[number, number][]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [selectedClusterForAdd, setSelectedClusterForAdd] = useState<string>("")
    const [comboboxOpen, setComboboxOpen] = useState(false)
    const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedCluster, setSelectedCluster] = useState<{ id: string, name: string, clusterNumber: number } | null>(null)
    const [instructionDrawerOpen, setInstructionDrawerOpen] = useState(false)
    const [instructions, setInstructions] = useState<Array<{
        id: string,
        step: number,
        title: string,
        description: string,
        imageUrl?: string,
        imageCustomId?: string
    }>>([])
    const [isLoadingInstructions, setIsLoadingInstructions] = useState(false)
    const [dirtySteps, setDirtySteps] = useState<Record<string, boolean>>({})
    const [savingStepId, setSavingStepId] = useState<string | null>(null)

    // Debounce search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    // Fetch clusters using tRPC
    const { data: clusters = [], error: clustersError } = api.clusters.listAll.useQuery()

    // Fetch graves with server-side search
    const { data: searchResults, isLoading: gravesLoading, error: gravesError } = api.search.graves.useQuery(
        {
            query: debouncedSearchTerm,
            limit: 1000, // Large limit to get all results for client-side pagination
            offset: 0,
        },
        {
            enabled: debouncedSearchTerm.length > 0,
            retry: false,
        }
    )

    // Fallback to all graves when no search term
    const { data: allGraves = [], isLoading: allGravesLoading, error: allGravesError } = api.graves.listAll.useQuery(
        undefined,
        {
            enabled: debouncedSearchTerm.length === 0,
        }
    )

    // Handle errors
    if (clustersError) {
        console.error("Error fetching clusters:", clustersError);
    }
    if (gravesError) {
        console.error("Error fetching graves:", gravesError);
    }
    if (allGravesError) {
        console.error("Error fetching all graves:", allGravesError);
    }

    // Determine which graves to use
    const graves = useMemo(() => {
        return debouncedSearchTerm.length > 0 ? (searchResults?.results ?? []) : allGraves
    }, [debouncedSearchTerm, searchResults, allGraves])
    const isLoading = debouncedSearchTerm.length > 0 ? gravesLoading : allGravesLoading

    // Group graves by cluster (removed unused variable)

    const totalPages = Math.ceil(graves.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGraves = graves.slice(startIndex, endIndex);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);

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
        ])
    }, [])

    const utils = api.useUtils();
    const graveImageInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgressIndex, setUploadProgressIndex] = useState<number>(0);

    // UploadThing hooks
    const { startUpload: startGraveImageUpload, isUploading: isGraveImageUploading } = useUploadThing("graveImageUploader", {
        onClientUploadComplete: (res) => {
            console.log("Grave image UploadThing response:", res);
            if (res && selectedGrave?.id) {
                // Upload all images to the grave
                res.forEach((file) => {
                    uploadGraveImage.mutate({
                        graveId: selectedGrave.id,
                        imageUrl: file.url, // Use 'url' instead of 'fileUrl'
                    });
                });
                toast.success("Images uploaded successfully");
                setUploadModalOpen(false);
                setSelectedUploadFiles([]);
                setUploadProgressIndex(0);
                setIsUploading(false); // Reset uploading state
            }
        },
        onUploadError: (error) => {
            toast.error(`Upload failed: ${error.message}`);
            setIsUploading(false);
        },
    });

    const { startUpload: startInstructionImageUpload, isUploading: isInstructionImageUploading } = useUploadThing("instructionImageUploader", {
        onClientUploadComplete: (res) => {
            console.log("UploadThing response:", res);
            if (res?.[0]) {
                const file = res[0];
                // Find the instruction step that was being uploaded to
                const stepId = (window as any).currentUploadingStepId;
                if (stepId) {
                    uploadStepImage.mutate({
                        stepId: stepId as string,
                        imageUrl: file.url, // Use 'url' instead of 'fileUrl'
                    });
                }
            }
        },
        onUploadError: (error) => {
            toast.error(`Upload failed: ${error.message}`);
        },
    });

    // Instructions tRPC mutations
    const addStep = api.instructions.addStep.useMutation({
        onSuccess: (newStep) => {
            if (newStep) {
                const [title, ...descriptionParts] = newStep.instruction.split('\n\n');
                const formattedStep = {
                    id: newStep.id,
                    step: newStep.step,
                    title: title ?? '',
                    description: descriptionParts.join('\n\n') ?? '',
                    imageUrl: newStep.imageUrl ?? undefined,
                    imageCustomId: newStep.imageCustomId ?? undefined
                };
                setInstructions(prev => [...prev, formattedStep]);
                toast.success("Step added successfully!");
            }
        },
        onError: (error) => {
            toast.error(`Failed to add step: ${error?.message ?? "Unknown error"}`);
        },
    });

    const updateStep = api.instructions.updateStep.useMutation({
        onSuccess: () => {
            toast.success("Step updated successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to update step: ${error?.message ?? "Unknown error"}`);
        },
    });

    const deleteStep = api.instructions.deleteStep.useMutation({
        onSuccess: (_, variables) => {
            setInstructions(prev => prev.filter(step => step.id !== variables.stepId));
            toast.success("Step deleted successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to delete step: ${error?.message ?? "Unknown error"}`);
        },
    });

    const uploadStepImage = api.instructions.uploadStepImage.useMutation({
        onSuccess: (updatedStep, variables) => {
            if (updatedStep) {
                setInstructions(prev => prev.map(step =>
                    step.id === variables.stepId
                        ? { ...step, imageUrl: updatedStep.imageUrl ?? undefined, imageCustomId: updatedStep.imageCustomId ?? undefined }
                        : step
                ));
                toast.success("Image uploaded successfully!");
            }
        },
        onError: (error) => {
            toast.error(`Failed to upload image: ${error?.message ?? "Unknown error"}`);
        },
    });

    const removeStepImage = api.instructions.removeStepImage.useMutation({
        onSuccess: (_, variables) => {
            setInstructions(prev => prev.map(step =>
                step.id === variables.stepId
                    ? { ...step, imageUrl: undefined, imageCustomId: undefined }
                    : step
            ));
            toast.success("Image removed successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to remove image: ${error?.message ?? "Unknown error"}`);
        },
    });

    // Note: deleteInstructions mutation was unused; removed to avoid linter warnings.

    const testSchema = api.instructions.testSchema.useQuery();

    const deleteGrave = api.graves.delete.useMutation({
        onSuccess: async () => {
            await utils.graves.listAll.invalidate();
            toast.success("Grave deleted successfully");
        },
        onError: (error) => {
            toast.error(`Failed to delete grave: ${error?.message ?? "Unknown error"}`);
        },
    });

    // Grave images
    const imagesQuery = api.graves.listImages.useQuery(
        { graveId: selectedGrave?.id ?? "" },
        { enabled: !!selectedGrave?.id }
    );
    const uploadGraveImage = api.graves.uploadImage.useMutation({
        onSuccess: async () => {
            await imagesQuery.refetch();
            toast.success("Grave image uploaded");
        },
        onError: (error) => {
            toast.error(`Failed to upload grave image: ${error?.message ?? "Unknown error"}`);
        },
    });
    const deleteGraveImageMut = api.graves.deleteImage.useMutation({
        onSuccess: async () => {
            await imagesQuery.refetch();
            toast.success("Grave image deleted");
        },
        onError: (error) => {
            toast.error(`Failed to delete grave image: ${error?.message ?? "Unknown error"}`);
        },
    });

    const handleDeleteGrave = (graveId: string) => {
        deleteGrave.mutate({ id: graveId });
    };

    const handleGraveAdded = async () => {
        // The modal will handle the success callback and refresh
        // The grave count will be updated automatically when the query refetches
        setSelectedClusterForAdd(""); // Reset selection after adding
        await utils.graves.listAll.invalidate();
    };

    const handleGraveUpdated = async () => {
        // Refresh all grave-related queries
        await utils.graves.listAll.invalidate();
        await utils.search.graves.invalidate();
    };

    const handleOpenDrawer = (grave: Grave) => {
        setSelectedGrave(grave);
        setDrawerOpen(true);
    };

    const handleOpenInstructionDrawer = async (cluster: { id: string, name: string, clusterNumber: number }) => {
        setSelectedCluster(cluster);
        setInstructionDrawerOpen(true);
        setIsLoadingInstructions(true);

        try {
            const existingInstructions = await utils.instructions.getByCluster.fetch({ clusterId: cluster.id });
            if (existingInstructions?.steps) {
                const formattedSteps: Array<{
                    id: string,
                    step: number,
                    title: string,
                    description: string,
                    imageUrl?: string,
                    imageCustomId?: string
                }> = existingInstructions.steps.map(step => {
                    const [title, ...descriptionParts] = step.instruction.split('\n\n');
                    return {
                        id: step.id,
                        step: step.step,
                        title: title ?? '',
                        description: descriptionParts.join('\n\n') ?? '',
                        imageUrl: step.imageUrl ?? undefined,
                        imageCustomId: step.imageCustomId ?? undefined
                    };
                });
                setInstructions(formattedSteps);
            } else {
                setInstructions([]);
            }
        } catch (error) {
            console.error('Error loading instructions:', error);
            setInstructions([]);
        } finally {
            setIsLoadingInstructions(false);
        }
    };

    const addInstructionStep = () => {
        if (!selectedCluster) return;

        addStep.mutate({
            clusterId: selectedCluster.id,
            title: '',
            description: ''
        });
    };

    const updateInstructionStep = (id: string, field: string, value: string) => {
        setInstructions(instructions.map(instruction =>
            instruction.id === id ? { ...instruction, [field]: value } : instruction
        ));
        // mark as dirty; save will be triggered by explicit button
        setDirtySteps(prev => ({ ...prev, [id]: true }));
    };

    const saveInstructionStep = (id: string) => {
        const step = instructions.find(s => s.id === id);
        if (!step) return;
        setSavingStepId(id);
        updateStep.mutate({
            stepId: id,
            title: step.title,
            description: step.description
        }, {
            onSuccess: () => {
                setDirtySteps(prev => ({ ...prev, [id]: false }));
                setSavingStepId(null);
            },
            onError: () => {
                setSavingStepId(null);
            }
        });
    };

    const deleteInstructionStep = (id: string) => {
        deleteStep.mutate({ stepId: id });
    };

    const handleImageUpload = async (id: string, file: File) => {
        console.log('Uploading image for step:', id, 'File:', file.name, 'Size:', file.size);

        // Store the step ID for the upload callback
        (window as any).currentUploadingStepId = id;

        try {
            await startInstructionImageUpload([file]);
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Upload failed");
        }
    };

    const handleGraveImageUpload = async (files: File[]) => {
        if (!selectedGrave?.id || files.length === 0) return;

        setIsUploading(true);
        try {
            await startGraveImageUpload(files);
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Upload failed");
            setIsUploading(false);
        }
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

    return (
        <div className="flex h-screen w-full gap-4 container">
            {/* Map - 50% left */}
            <div className="sticky top-20 h-[80vh] w-1/2">
                <Map
                    className="h-full w-full max-w-7xl "
                    center={[13.235529662734809, 123.53030072913442]}
                    zoom={16}
                    maxZoom={19}
                    enableAddPolyline={false}
                    polygon={polygon}
                    polygonColor="#22c55e"
                    clusters={clusters}
                    enableAddClusters={false}
                    enableAddMarkers={false}
                />
            </div>

            {/* Graves List - 50% right */}
            <div className="w-1/2 p-4 space-y-4">
                <ViewTransition name="right-card-island">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>All Graves</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        {Array.isArray(graves) ? graves.length : 0} graves found
                                    </p>
                                </div>
                                <div className="">
                                    <ButtonGroup>
                                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={comboboxOpen}
                                                // className="w-[200px] justify-between"
                                                >
                                                    {selectedClusterForAdd
                                                        ? clusters.find((cluster) => cluster.id === selectedClusterForAdd)?.name
                                                        : "Select cluster..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search clusters..." />
                                                    <CommandList>
                                                        <CommandEmpty>No cluster found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clusters.map((cluster) => (
                                                                <CommandItem
                                                                    key={cluster.id}
                                                                    value={cluster.name}
                                                                    onSelect={(currentValue) => {
                                                                        const selectedCluster = clusters.find(c => c.name === currentValue)
                                                                        setSelectedClusterForAdd(selectedCluster?.id === selectedClusterForAdd ? "" : selectedCluster?.id ?? "")
                                                                        setComboboxOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={`mr-2 h-4 w-4 ${selectedClusterForAdd === cluster.id ? "opacity-100" : "opacity-0"
                                                                            }`}
                                                                    />
                                                                    {cluster.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        {selectedClusterForAdd && (
                                            <GraveModal
                                                clusterId={selectedClusterForAdd}
                                                clusterName={clusters.find(c => c.id === selectedClusterForAdd)?.name ?? ""}
                                                onGraveAdded={handleGraveAdded}
                                            />
                                        )}
                                    </ButtonGroup>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search graves by name, plot, type, or notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Graves List Grouped by Cluster */}
                            {isLoading ? (
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b">
                                                <div>
                                                    <Skeleton className="h-5 w-48 mb-2" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-5 w-20" />
                                                    <Skeleton className="h-8 w-28" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {[...Array(5)].map((_, j) => (
                                                    <div key={j} className="p-3 border rounded-lg bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 space-y-2">
                                                                <Skeleton className="h-4 w-56" />
                                                                <Skeleton className="h-3 w-64" />
                                                                <Skeleton className="h-3 w-40" />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Skeleton className="h-5 w-20 rounded-full" />
                                                                <Skeleton className="h-8 w-8" />
                                                                <Skeleton className="h-8 w-8" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : Array.isArray(paginatedGraves) && paginatedGraves.length > 0 ? (
                                <div className="space-y-6">
                                    {Array.isArray(clusters) && clusters.map((cluster) => {
                                        const clusterGraves = paginatedGraves.filter(grave => grave.graveClusterId === cluster.id);

                                        if (clusterGraves.length === 0) return null;

                                        return (
                                            <div key={cluster.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{cluster.name}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            Cluster #{cluster.clusterNumber} • {clusterGraves.length} graves
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {clusterGraves.length} graves
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenInstructionDrawer(cluster)}
                                                            className="h-8 px-3"
                                                        >
                                                            <BookOpen className="h-4 w-4 mr-1" />
                                                            Instructions
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {clusterGraves.map((grave) => {
                                                        const graveData = grave.graveJson as Record<string, unknown>;
                                                        return (
                                                            <div key={grave.id} className="p-3 border rounded-lg bg-gray-50">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-medium">
                                                                            <HighlightText
                                                                                text={typeof graveData.deceasedName === 'string' ? graveData.deceasedName : ""}
                                                                                searchTerm={debouncedSearchTerm}
                                                                                highlightClassName="bg-yellow-200 font-semibold"
                                                                            />
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            Plot <HighlightText
                                                                                text={typeof graveData.plotNumber === 'string' ? graveData.plotNumber : ""}
                                                                                searchTerm={debouncedSearchTerm}
                                                                                highlightClassName="bg-yellow-200 font-semibold"
                                                                            />
                                                                            {" • "}
                                                                            {typeof graveData.birthDate === 'string' ? graveData.birthDate : ""}
                                                                            {" - "}
                                                                            {typeof graveData.deathDate === 'string' ? graveData.deathDate : ""}
                                                                        </div>
                                                                        {grave.graveExpirationDate && (
                                                                            <div className="text-xs text-orange-600 mt-1">
                                                                                Expires: {new Date(grave.graveExpirationDate).toLocaleDateString()}
                                                                            </div>
                                                                        )}
                                                                        {typeof graveData.notes === 'string' && graveData.notes.trim() && (
                                                                            <div className="text-xs text-gray-400 mt-1">
                                                                                <HighlightText
                                                                                    text={graveData.notes}
                                                                                    searchTerm={debouncedSearchTerm}
                                                                                    highlightClassName="bg-yellow-200 font-semibold"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className={getGraveTypeColor(typeof graveData.graveType === 'string' ? graveData.graveType : "")}>
                                                                            <HighlightText
                                                                                text={typeof graveData.graveType === 'string' ? graveData.graveType : ""}
                                                                                searchTerm={debouncedSearchTerm}
                                                                                highlightClassName="bg-yellow-100 font-semibold"
                                                                            />
                                                                        </Badge>
                                                                        <GraveEditModal
                                                                            graveId={grave.id}
                                                                            onGraveUpdated={handleGraveUpdated}
                                                                            trigger={
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0"
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                            }
                                                                        />
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0"
                                                                            onClick={() => handleOpenDrawer(grave)}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0"
                                                                            onClick={() => handleDeleteGrave(grave.id)}
                                                                            disabled={deleteGrave.isPending}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : debouncedSearchTerm ? (
                                <p className="text-gray-500 text-center py-8">
                                    No graves found matching &quot;{debouncedSearchTerm}&quot;
                                </p>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No graves found. Add some graves to get started.
                                </p>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        Showing {startIndex + 1} to {Math.min(endIndex, Array.isArray(graves) ? graves.length : 0)} of {Array.isArray(graves) ? graves.length : 0} graves
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ViewTransition>
            </div>

            {/* Grave Details Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Grave Details</DrawerTitle>
                        <DrawerDescription>
                            Detailed information about the selected grave
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                        {selectedGrave && (() => {
                            const graveData = selectedGrave.graveJson as Record<string, unknown> | null;
                            const getStringValue = (value: unknown): string => {
                                return typeof value === 'string' ? value : 'N/A';
                            };

                            return (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Deceased Name</label>
                                            <p className="text-lg font-semibold">
                                                {getStringValue(graveData?.deceasedName)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Plot Number</label>
                                            <p className="text-lg">
                                                {getStringValue(graveData?.plotNumber)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Birth Date</label>
                                            <p className="text-lg">
                                                {getStringValue(graveData?.birthDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Death Date</label>
                                            <p className="text-lg">
                                                {getStringValue(graveData?.deathDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Grave Type</label>
                                            <div className="mt-1">
                                                <Badge className={getGraveTypeColor(getStringValue(graveData?.graveType))}>
                                                    {getStringValue(graveData?.graveType)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Cluster</label>
                                            <p className="text-lg">
                                                {clusters.find(c => c.id === selectedGrave.graveClusterId)?.name ?? 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                                            <p className="text-lg">
                                                {selectedGrave.graveExpirationDate
                                                    ? new Date(selectedGrave.graveExpirationDate).toLocaleDateString()
                                                    : 'No expiration date set'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {(() => {
                                        const notes = graveData?.notes;
                                        if (notes && typeof notes === 'string' && notes.trim()) {
                                            return (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Notes</label>
                                                    <p className="text-lg mt-1 p-3 bg-gray-50 rounded-lg">
                                                        {notes}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Grave ID</label>
                                                <p className="text-sm font-mono text-gray-600">{selectedGrave.id}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setDrawerOpen(false)}
                                                >
                                                    Close
                                                </Button>
                                                <GraveEditModal
                                                    graveId={selectedGrave.id}
                                                    onGraveUpdated={() => {
                                                        handleGraveUpdated();
                                                        setDrawerOpen(false);
                                                    }}
                                                    trigger={
                                                        <Button variant="outline">
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Grave
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        handleDeleteGrave(selectedGrave.id);
                                                        setDrawerOpen(false);
                                                    }}
                                                    disabled={deleteGrave.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Grave
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grave Images */}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">Images</h4>
                                                <span className="text-sm text-gray-500">{(imagesQuery.data?.length ?? 0)}/3</span>
                                            </div>
                                            <div>
                                                <input
                                                    ref={graveImageInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files ?? []);
                                                        if (files.length > 0) void handleGraveImageUpload(files);
                                                    }}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setUploadModalOpen(true)}
                                                    disabled={(imagesQuery.data?.length ?? 0) >= 3 || isUploading}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload Image
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {(imagesQuery.data ?? []).map((img) => (
                                                <div key={img.id} className="border rounded-md p-2 bg-white">
                                                    <img src={img.imageUrl} alt={img.imageAlt ?? ''} className="w-full h-32 object-cover rounded" />
                                                    <div className="flex justify-end mt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600"
                                                            onClick={() => deleteGraveImageMut.mutate({ pictureId: img.id })}
                                                        >
                                                            <X className="h-4 w-4 mr-1" /> Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {imagesQuery.isLoading && (
                                                <div className="text-sm text-gray-500">Loading images...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Instruction Drawer */}
            <Drawer open={instructionDrawerOpen} onOpenChange={setInstructionDrawerOpen}>
                <DrawerContent className="h-[90vh]">
                    <DrawerHeader className="flex-shrink-0">
                        <DrawerTitle>Cluster Instructions</DrawerTitle>
                        <DrawerDescription>
                            Add step-by-step instructions with images for {selectedCluster?.name}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {selectedCluster && (
                            <div className="space-y-4 pb-4">
                                {isLoadingInstructions ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                        <p>Loading instructions...</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">{selectedCluster.name}</h3>
                                                <p className="text-sm text-gray-500">Cluster #{selectedCluster.clusterNumber}</p>
                                                {testSchema.data && (
                                                    <div className="text-xs mt-1">
                                                        <span className={`px-2 py-1 rounded ${testSchema.data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            Schema: {testSchema.data.success ? 'OK' : 'Error'}
                                                        </span>
                                                        {!testSchema.data.success && (
                                                            <span className="ml-2 text-red-600">{testSchema.data.error}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Button onClick={addInstructionStep} className="flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                Add Step
                                            </Button>
                                        </div>

                                        {instructions.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>No instructions added yet.</p>
                                                <p className="text-sm">Click &quot;Add Step&quot; to create your first instruction.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {instructions.map((instruction) => (
                                                    <div key={instruction.id} className="border rounded-lg p-4 bg-gray-50">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary">Step {instruction.step}</Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteInstructionStep(instruction.id)}
                                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-sm font-medium text-gray-700">Step Title</label>
                                                                <Input
                                                                    value={instruction.title}
                                                                    onChange={(e) => updateInstructionStep(instruction.id, 'title', e.target.value)}
                                                                    placeholder="Enter step title..."
                                                                    className="mt-1"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-700">Description</label>
                                                                <textarea
                                                                    value={instruction.description}
                                                                    onChange={(e) => updateInstructionStep(instruction.id, 'description', e.target.value)}
                                                                    placeholder="Enter step description..."
                                                                    className="mt-1 w-full p-2 border rounded-md resize-none"
                                                                    rows={3}
                                                                />
                                                            </div>

                                                            <div className="flex justify-end">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => saveInstructionStep(instruction.id)}
                                                                    disabled={!dirtySteps[instruction.id] || savingStepId === instruction.id}
                                                                >
                                                                    {savingStepId === instruction.id ? 'Saving...' : (dirtySteps[instruction.id] ? 'Save' : 'Saved')}
                                                                </Button>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-700">Image</label>
                                                                <div className="mt-1">
                                                                    {instruction.imageUrl ? (
                                                                        <div className="space-y-2">
                                                                            <img
                                                                                src={instruction.imageUrl}
                                                                                alt={`Step ${instruction.step}`}
                                                                                className="w-full max-w-md h-48 object-cover rounded-md border"
                                                                            />
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    removeStepImage.mutate({ stepId: instruction.id });
                                                                                }}
                                                                                className="text-red-500 hover:text-red-700"
                                                                            >
                                                                                <X className="h-4 w-4 mr-1" />
                                                                                Remove Image
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) void handleImageUpload(instruction.id, file);
                                                                                }}
                                                                                className="hidden"
                                                                                id={`image-upload-${instruction.id}`}
                                                                            />
                                                                            <label
                                                                                htmlFor={`image-upload-${instruction.id}`}
                                                                                className="cursor-pointer flex flex-col items-center gap-2"
                                                                            >
                                                                                <Upload className="h-8 w-8 text-gray-400" />
                                                                                <span className="text-sm text-gray-500">Click to upload image</span>
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t bg-white">
                        <div className="flex justify-between items-center p-4">
                            <div className="text-sm text-gray-500">
                                {instructions.length} step{instructions.length !== 1 ? 's' : ''} added
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setInstructionDrawerOpen(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Upload Images Modal */}
            <Dialog open={uploadModalOpen} onOpenChange={(open) => { if (!open && !isUploading) { setUploadModalOpen(open); setSelectedUploadFiles([]); setUploadProgressIndex(0); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Images</DialogTitle>
                        <DialogDescription>Select up to {(3 - (imagesQuery.data?.length ?? 0))} image(s) to upload.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                const currentCount = imagesQuery.data?.length ?? 0;
                                const remaining = Math.max(0, 3 - currentCount);
                                setSelectedUploadFiles(files.slice(0, remaining));
                            }}
                        />
                        {selectedUploadFiles.length > 0 && (
                            <div className="text-sm text-gray-600">
                                {selectedUploadFiles.length} file{selectedUploadFiles.length > 1 ? "s" : ""} selected
                            </div>
                        )}

                        {isUploading && (
                            <div className="text-sm text-gray-500">Uploading {uploadProgressIndex + 1} / {selectedUploadFiles.length}...</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => { if (!isUploading) { setUploadModalOpen(false); setSelectedUploadFiles([]); setUploadProgressIndex(0); } }}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!selectedGrave?.id || selectedUploadFiles.length === 0) return;
                                await handleGraveImageUpload(selectedUploadFiles);
                            }}
                            disabled={selectedUploadFiles.length === 0 || isUploading || isGraveImageUploading}
                        >
                            {isUploading || isGraveImageUploading ? "Uploading..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}