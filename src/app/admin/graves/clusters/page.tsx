'use client'

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { ClusterForm } from "@/components/ClusterForm";
import { DeleteClusterDialog } from "@/components/DeleteClusterDialog";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unstable_ViewTransition as ViewTransition } from "react";


export default function ClustersPage() {
    const [polygon, setPolygon] = useState<[number, number][]>([])
    const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
    const [isAddingCluster, setIsAddingCluster] = useState(false)
    const [clearTempMarker, setClearTempMarker] = useState(false)

    // Fetch clusters using tRPC
    const { data: clusters = [], isLoading: clustersLoading } = api.clusters.listAll.useQuery()

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

    const handleMapClick = (coordinates: { latitude: number; longitude: number }) => {
        if (isAddingCluster) {
            setSelectedCoordinates(coordinates)
        }
    }

    const handleClusterCreated = () => {
        setSelectedCoordinates(null)
        setIsAddingCluster(false)
        setClearTempMarker(true)
        setTimeout(() => setClearTempMarker(false), 100)
    }

    const handleCancelAddCluster = () => {
        setSelectedCoordinates(null)
        setIsAddingCluster(false)
        setClearTempMarker(true)
        setTimeout(() => setClearTempMarker(false), 100)
    }

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
                        enableAddClusters={isAddingCluster}
                        onMapClickAction={handleMapClick}
                        clearTempMarker={clearTempMarker}
                    />
                </ViewTransition>
            </div>

            {/* Controls - 50% right */}
            <div className="w-1/2 min-h-0 p-4 space-y-4 relative z-10">
                <div className="flex gap-2">
                    <Button
                        onClick={() => isAddingCluster ? handleCancelAddCluster() : setIsAddingCluster(true)}
                        variant={isAddingCluster ? "destructive" : "default"}
                    >
                        {isAddingCluster ? "Cancel" : "Add Cluster"}
                    </Button>
                </div>

                {isAddingCluster && (
                    <ClusterForm
                        selectedCoordinates={selectedCoordinates}
                        onClusterCreated={handleClusterCreated}
                    />
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Clusters ({clusters.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clustersLoading ? (
                            <p>Loading clusters...</p>
                        ) : clusters.length === 0 ? (
                            <p className="text-gray-500">No clusters found. Click &quot;Add Cluster&quot; to create one.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {clusters.map((cluster) => (
                                    <div
                                        key={cluster.id}
                                        className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => {
                                                // You could add functionality to center the map on this cluster
                                                console.log("Cluster clicked:", cluster);
                                            }}
                                        >
                                            <div className="font-medium">{cluster.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Cluster #{cluster.clusterNumber}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {cluster.coordinates ? `${cluster.coordinates.latitude.toFixed(6)}, ${cluster.coordinates.longitude.toFixed(6)}` : 'No coordinates'}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteClusterDialog
                                                clusterId={cluster.id}
                                                clusterName={cluster.name}
                                                onDeleted={() => {
                                                    console.log("Cluster deleted:", cluster.name);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}