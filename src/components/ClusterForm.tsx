"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ClusterFormProps {
    onClusterCreated?: () => void;
    selectedCoordinates?: { latitude: number; longitude: number } | null;
}

export function ClusterForm({ onClusterCreated, selectedCoordinates }: ClusterFormProps) {
    const [name, setName] = useState("");
    const [clusterNumber, setClusterNumber] = useState<number>(1);

    const utils = api.useUtils();
    const createCluster = api.clusters.create.useMutation({
        onSuccess: async () => {
            await utils.clusters.listAll.invalidate();
            setName("");
            setClusterNumber(1);
            toast.success(`Cluster "${name}" created successfully`);
            onClusterCreated?.();
        },
        onError: (error) => {
            toast.error(`Failed to create cluster: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCoordinates) {
            toast.error("Please select coordinates on the map first");
            return;
        }

        createCluster.mutate({
            name,
            clusterNumber,
            coordinates: selectedCoordinates,
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Create New Cluster</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Cluster Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter cluster name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="clusterNumber">Cluster Number</Label>
                        <Input
                            id="clusterNumber"
                            type="number"
                            placeholder="Enter cluster number"
                            value={clusterNumber}
                            onChange={(e) => setClusterNumber(Number(e.target.value))}
                            min="1"
                            required
                        />
                    </div>

                    {selectedCoordinates && (
                        <div className="text-sm text-gray-600">
                            <p>Selected coordinates:</p>
                            <p>Lat: {selectedCoordinates.latitude.toFixed(6)}</p>
                            <p>Lng: {selectedCoordinates.longitude.toFixed(6)}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={createCluster.isPending || !selectedCoordinates}
                    >
                        {createCluster.isPending ? "Creating..." : "Create Cluster"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
