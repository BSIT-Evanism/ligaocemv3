"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface GraveModalProps {
    clusterId: string;
    clusterName: string;
    onGraveAdded?: () => void;
}

export function GraveModal({ clusterId, clusterName, onGraveAdded }: GraveModalProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        deceasedName: "",
        birthDate: "",
        deathDate: "",
        graveType: "",
        plotNumber: "",
        notes: "",
        graveExpirationDate: "",
    });

    const utils = api.useUtils();
    const createGrave = api.graves.create.useMutation({
        onSuccess: async () => {
            await utils.graves.listByCluster.invalidate({ clusterId });
            setFormData({
                deceasedName: "",
                birthDate: "",
                deathDate: "",
                graveType: "",
                plotNumber: "",
                notes: "",
                graveExpirationDate: "",
            });
            setOpen(false);
            toast.success(`Grave added for ${formData.deceasedName} in ${clusterName}`);
            onGraveAdded?.();
        },
        onError: (error) => {
            toast.error(`Failed to add grave: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.deceasedName || !formData.graveType || !formData.plotNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        createGrave.mutate({
            clusterId,
            deceasedName: formData.deceasedName,
            birthDate: formData.birthDate || undefined,
            deathDate: formData.deathDate || undefined,
            graveType: formData.graveType,
            plotNumber: formData.plotNumber,
            notes: formData.notes || undefined,
            graveExpirationDate: formData.graveExpirationDate || undefined,
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Grave
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Grave to {clusterName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deceasedName">Deceased Name *</Label>
                            <Input
                                id="deceasedName"
                                type="text"
                                placeholder="Enter deceased name"
                                value={formData.deceasedName}
                                onChange={(e) => handleInputChange("deceasedName", e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plotNumber">Plot Number *</Label>
                            <Input
                                id="plotNumber"
                                type="text"
                                placeholder="Enter plot number"
                                value={formData.plotNumber}
                                onChange={(e) => handleInputChange("plotNumber", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deathDate">Death Date</Label>
                            <Input
                                id="deathDate"
                                type="date"
                                value={formData.deathDate}
                                onChange={(e) => handleInputChange("deathDate", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="graveType">Grave Type *</Label>
                        <Select value={formData.graveType} onValueChange={(value) => handleInputChange("graveType", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select grave type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="traditional">Traditional</SelectItem>
                                <SelectItem value="cremation">Cremation</SelectItem>
                                <SelectItem value="mausoleum">Mausoleum</SelectItem>
                                <SelectItem value="columbarium">Columbarium</SelectItem>
                                <SelectItem value="memorial">Memorial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                            id="notes"
                            type="text"
                            placeholder="Additional notes (optional)"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="graveExpirationDate">Grave Expiration Date</Label>
                        <Input
                            id="graveExpirationDate"
                            type="date"
                            value={formData.graveExpirationDate}
                            onChange={(e) => handleInputChange("graveExpirationDate", e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Optional: Set when this grave plot expires or needs renewal
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={createGrave.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createGrave.isPending}
                        >
                            {createGrave.isPending ? "Adding..." : "Add Grave"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
