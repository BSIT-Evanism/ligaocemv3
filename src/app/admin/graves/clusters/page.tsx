"use client";

import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/Map"), { ssr: false });
import { ClusterForm } from "@/components/ClusterForm";
import { DeleteClusterDialog } from "@/components/DeleteClusterDialog";
import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

export default function ClustersPage() {
  const [polygon, setPolygon] = useState<[number, number][]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isAddingCluster, setIsAddingCluster] = useState(false);
  const [clearTempMarker, setClearTempMarker] = useState(false);

  // Fetch clusters using tRPC
  const { data: clusters = [], isLoading: clustersLoading } =
    api.clusters.listAll.useQuery();

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

  const handleMapClick = (coordinates: {
    latitude: number;
    longitude: number;
  }) => {
    if (isAddingCluster) {
      setSelectedCoordinates(coordinates);
    }
  };

  const handleClusterCreated = () => {
    setSelectedCoordinates(null);
    setIsAddingCluster(false);
    setClearTempMarker(true);
    setTimeout(() => setClearTempMarker(false), 100);
  };

  const handleCancelAddCluster = () => {
    setSelectedCoordinates(null);
    setIsAddingCluster(false);
    setClearTempMarker(true);
    setTimeout(() => setClearTempMarker(false), 100);
  };

  const handleNavigateToCluster = (latitude: number, longitude: number) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(googleMapsUrl, "_blank");
  };

  return (
    <div className="flex h-screen w-full gap-4">
      {/* Map - 50% left */}
      <div className="sticky top-20 h-[80vh] w-1/2 container rounded-md">
        <Map
          className="h-full w-full max-w-7xl"
          center={[13.235529662734809, 123.53030072913442]}
          zoom={16}
          maxZoom={19}
          enableAddMarkers={false}
          enableAddPolyline={false}
          polygon={polygon}
          polygonColor="#22c55e"
          clusters={clusters}
          enableAddClusters={isAddingCluster}
          onMapClickAction={handleMapClick}
          clearTempMarker={clearTempMarker}
        />

      </div>

      {/* Controls - 50% right */}

      <div className="w-1/2 space-y-4 p-4">
        <div className="flex gap-2">
          <Button
            onClick={() =>
              isAddingCluster
                ? handleCancelAddCluster()
                : setIsAddingCluster(true)
            }
            variant={isAddingCluster ? "destructive" : "default"}
          >
            {isAddingCluster ? "Cancel" : "Add Cluster"}
          </Button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isAddingCluster ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div
            className={`transition-transform duration-300 ease-in-out ${isAddingCluster
              ? "translate-y-0 transform"
              : "-translate-y-4 transform"
              }`}
          >
            <ClusterForm
              selectedCoordinates={selectedCoordinates}
              onClusterCreated={handleClusterCreated}
            />
          </div>
        </div>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Existing Clusters ({clusters.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            {clustersLoading ? (
              <p>Loading clusters...</p>
            ) : clusters.length === 0 ? (
              <p className="text-gray-500">
                No clusters found. Click &quot;Add Cluster&quot; to create
                one.
              </p>
            ) : (
              <div className="space-y-2">
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="group flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
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
                        {cluster.coordinates
                          ? `${cluster.coordinates.latitude.toFixed(6)}, ${cluster.coordinates.longitude.toFixed(6)}`
                          : "No coordinates"}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {cluster.coordinates && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleNavigateToCluster(
                              cluster.coordinates!.latitude,
                              cluster.coordinates!.longitude,
                            )
                          }
                          className="flex items-center gap-1"
                        >
                          <Navigation className="h-3 w-3" />
                          Navigate
                        </Button>
                      )}
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
  );
}
