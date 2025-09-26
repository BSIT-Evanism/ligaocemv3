"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteClusterDialogProps {
    clusterId: string;
    clusterName: string;
    onDeleted?: () => void;
}

export function DeleteClusterDialog({ clusterId, clusterName, onDeleted }: DeleteClusterDialogProps) {
    const [open, setOpen] = useState(false);

    const utils = api.useUtils();
    const deleteCluster = api.clusters.delete.useMutation({
        onSuccess: async () => {
            await utils.clusters.listAll.invalidate();
            setOpen(false);
            toast.success(`Cluster "${clusterName}" deleted successfully`);
            onDeleted?.();
        },
        onError: (error) => {
            toast.error(`Failed to delete cluster: ${error.message}`);
        },
    });

    const handleDelete = () => {
        deleteCluster.mutate({ id: clusterId });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete cluster</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Cluster</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the cluster &quot;{clusterName}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteCluster.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteCluster.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteCluster.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
