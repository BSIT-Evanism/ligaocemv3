
'use client'

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { GraveModal } from "@/components/GraveModal";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Search, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { unstable_ViewTransition as ViewTransition } from "react";

export default function GravesPage() {
    const [polygon, setPolygon] = useState<[number, number][]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [selectedClusterForAdd, setSelectedClusterForAdd] = useState<string>("")
    const [comboboxOpen, setComboboxOpen] = useState(false)

    // Fetch clusters using tRPC
    const { data: clusters = [], error: clustersError } = api.clusters.listAll.useQuery()

    // Fetch all graves
    const { data: allGraves = [], isLoading: gravesLoading, error: gravesError } = api.graves.listAll.useQuery()

    // Handle errors
    if (clustersError) {
        console.error("Error fetching clusters:", clustersError);
    }
    if (gravesError) {
        console.error("Error fetching graves:", gravesError);
    }

    // Group graves by cluster
    const gravesByCluster = useMemo(() => {
        if (!Array.isArray(allGraves)) return {};

        const grouped: Record<string, typeof allGraves> = {};

        allGraves.forEach((grave) => {
            const clusterId = grave.graveClusterId;
            grouped[clusterId] ??= [];
            grouped[clusterId].push(grave);
        });

        return grouped;
    }, [allGraves]);

    // Search and pagination logic
    const filteredGraves = useMemo(() => {
        if (!Array.isArray(allGraves)) return [];

        return allGraves.filter((grave) => {
            const graveData = grave.graveJson as Record<string, unknown>;
            const searchLower = searchTerm.toLowerCase();

            return (
                (graveData.deceasedName as string)?.toLowerCase().includes(searchLower) ||
                (graveData.plotNumber as string)?.toLowerCase().includes(searchLower) ||
                (graveData.graveType as string)?.toLowerCase().includes(searchLower) ||
                (graveData.notes as string)?.toLowerCase().includes(searchLower)
            );
        });
    }, [allGraves, searchTerm]);

    const totalPages = Math.ceil(filteredGraves.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedGraves = filteredGraves.slice(startIndex, endIndex);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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

    const deleteGrave = api.graves.delete.useMutation({
        onSuccess: async () => {
            await utils.graves.listAll.invalidate();
            toast.success("Grave deleted successfully");
        },
        onError: (error) => {
            toast.error(`Failed to delete grave: ${error?.message ?? "Unknown error"}`);
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


    const getGraveTypeColor = (graveType: string) => {
        const colors = {
            traditional: "bg-blue-100 text-blue-800",
            cremation: "bg-green-100 text-green-800",
            mausoleum: "bg-purple-100 text-purple-800",
            columbarium: "bg-orange-100 text-orange-800",
            memorial: "bg-gray-100 text-gray-800"
        };
        return colors[graveType as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="flex gap-4 w-full flex-1 min-h-0">
            {/* Map - 50% left */}
            <div className="flex-1 min-h-0 relative z-0">
                <ViewTransition name="main-map">
                    <Map
                        className="h-full w-full relative z-0"
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
                </ViewTransition>
            </div>

            {/* Graves List - 50% right */}
            <div className="w-1/2 min-h-0 p-4 space-y-4 relative z-10">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Graves</CardTitle>
                                <p className="text-sm text-gray-600">
                                    {filteredGraves.length} graves found
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-[200px] justify-between"
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
                                                            value={cluster.id}
                                                            onSelect={(currentValue) => {
                                                                setSelectedClusterForAdd(currentValue === selectedClusterForAdd ? "" : currentValue)
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
                                        clusterName={clusters.find(c => c.id === selectedClusterForAdd)?.name || ""}
                                        onGraveAdded={handleGraveAdded}
                                    />
                                )}
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
                        {gravesLoading ? (
                            <p>Loading graves...</p>
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
                                                <Badge variant="outline">
                                                    {clusterGraves.length} graves
                                                </Badge>
                                            </div>

                                            <div className="space-y-2">
                                                {clusterGraves.map((grave) => {
                                                    const graveData = grave.graveJson as Record<string, unknown>;
                                                    return (
                                                        <div key={grave.id} className="p-3 border rounded-lg bg-gray-50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{typeof graveData.deceasedName === 'string' ? graveData.deceasedName : ""}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        Plot {typeof graveData.plotNumber === 'string' ? graveData.plotNumber : ""} • {typeof graveData.birthDate === 'string' ? graveData.birthDate : ""} - {typeof graveData.deathDate === 'string' ? graveData.deathDate : ""}
                                                                    </div>
                                                                    {graveData.notes && typeof graveData.notes === 'string' && graveData.notes.trim() && (
                                                                        <div className="text-xs text-gray-400 mt-1">
                                                                            {graveData.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={getGraveTypeColor(typeof graveData.graveType === 'string' ? graveData.graveType : "")}>
                                                                        {typeof graveData.graveType === 'string' ? graveData.graveType : ""}
                                                                    </Badge>
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
                        ) : searchTerm ? (
                            <p className="text-gray-500 text-center py-8">
                                No graves found matching &quot;{searchTerm}&quot;
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
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredGraves.length)} of {filteredGraves.length} graves
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
            </div>
        </div>
    )
}