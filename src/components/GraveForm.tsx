"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface GraveFormProps {
    clusterId: string;
    clusterName: string;
    // @ts-expect-error - TODO: fix this
    onGraveAdded?: (grave) => void;
}

export function GraveForm({ clusterId, clusterName, onGraveAdded }: GraveFormProps) {
    const [formData, setFormData] = useState({
        deceasedName: "",
        birthDate: "",
        deathDate: "",
        graveType: "",
        plotNumber: "",
        notes: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.deceasedName || !formData.graveType || !formData.plotNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Create grave object
        const grave = {
            id: crypto.randomUUID(),
            clusterId,
            clusterName,
            ...formData,
            createdAt: new Date().toISOString(),
        };

        // Mock submission - in real app, this would call an API
        console.log("Adding grave:", grave);
        toast.success(`Grave added for ${formData.deceasedName} in ${clusterName}`);

        // Reset form
        setFormData({
            deceasedName: "",
            birthDate: "",
            deathDate: "",
            graveType: "",
            plotNumber: "",
            notes: "",
        });

        onGraveAdded?.(grave);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">Add Grave to {clusterName}</CardTitle>
            </CardHeader>
            <CardContent>
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

                    <Button type="submit" className="w-full">
                        Add Grave
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
