"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface ClusterEditModalProps {
    clusterId: string;
    trigger?: React.ReactNode;
    onUpdated?: () => void;
}

export function ClusterEditModal({ clusterId, trigger, onUpdated }: ClusterEditModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [clusterNumber, setClusterNumber] = useState<number>(1);

    const utils = api.useUtils();

    const { data: cluster, isLoading } = api.clusters.getById.useQuery(
        { id: clusterId },
        { enabled: open && !!clusterId }
    );

    useEffect(() => {
        if (cluster) {
            setName(cluster.name ?? "");
            setClusterNumber(cluster.clusterNumber ?? 1);
        }
    }, [cluster]);

    const updateCluster = api.clusters.update.useMutation({
        onSuccess: async () => {
            await utils.clusters.listAll.invalidate();
            await utils.clusters.getById.invalidate({ id: clusterId });
            toast.success("Cluster updated successfully");
            setOpen(false);
            onUpdated?.();
        },
        onError: (error) => {
            toast.error(`Failed to update cluster: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!clusterId) return;
        updateCluster.mutate({ id: clusterId, name, clusterNumber });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Cluster</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="p-4 text-center">Loading cluster...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Cluster Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter cluster name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clusterNumber">Cluster Number</Label>
                            <Input
                                id="clusterNumber"
                                type="number"
                                value={clusterNumber}
                                onChange={(e) => setClusterNumber(Number(e.target.value))}
                                min={1}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={updateCluster.isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateCluster.isPending}>
                                {updateCluster.isPending ? "Updating..." : "Update Cluster"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}


