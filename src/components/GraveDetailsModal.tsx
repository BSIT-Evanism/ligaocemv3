"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

type Grave = {
    id: string;
    graveClusterId: string;
    graveJson: unknown;
    createdAt: Date;
    updatedAt: Date;
};

type Cluster = {
    id: string;
    name: string;
    clusterNumber: number;
    coordinates: { latitude: number; longitude: number } | null;
};

type GraveImage = {
    id: string;
    imageUrl: string;
    imageAlt: string | null;
};

interface GraveDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedGrave: Grave | null;
    clusters: Cluster[];
    graveImages: GraveImage[];
    graveImagesLoading: boolean;
    onGoToGrave: () => void;
}

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

const getStringValue = (value: unknown): string => {
    return typeof value === 'string' ? value : 'N/A';
};

export default function GraveDetailsModal({
    open,
    onOpenChange,
    selectedGrave,
    clusters,
    graveImages,
    graveImagesLoading,
    onGoToGrave
}: GraveDetailsModalProps) {
    if (!selectedGrave) return null;

    const graveData = selectedGrave.graveJson as Record<string, unknown> | null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold text-slate-800">Grave Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Deceased Name</label>
                                <p className="text-xl font-bold text-slate-800 mt-2">
                                    {getStringValue(graveData?.deceasedName)}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Plot Number</label>
                                <p className="text-xl font-semibold text-slate-800 mt-2">
                                    {getStringValue(graveData?.plotNumber)}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Birth Date</label>
                                <p className="text-lg font-medium text-slate-700 mt-2">
                                    {getStringValue(graveData?.birthDate)}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Death Date</label>
                                <p className="text-lg font-medium text-slate-700 mt-2">
                                    {getStringValue(graveData?.deathDate)}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Grave Type</label>
                                <div className="mt-2">
                                    <Badge className={`text-sm px-4 py-2 ${getGraveTypeColor(getStringValue(graveData?.graveType))}`}>
                                        {getStringValue(graveData?.graveType)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-5">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Cluster</label>
                                <p className="text-lg font-medium text-slate-700 mt-2">
                                    {clusters.find(c => c.id === selectedGrave.graveClusterId)?.name ?? 'N/A'}
                                </p>
                            </div>
                        </div>

                        {(() => {
                            const notes = graveData?.notes;
                            if (notes && typeof notes === 'string' && notes.trim()) {
                                return (
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Notes</label>
                                        <p className="text-lg font-medium text-slate-700 mt-2 leading-relaxed">
                                            {notes}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <div className="bg-slate-100 rounded-lg p-3">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grave ID</label>
                                    <p className="text-sm font-mono text-slate-600 mt-1">{selectedGrave.id}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={onGoToGrave}
                                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white font-semibold"
                                    >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Go to Grave
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Grave Images */}
                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-lg font-semibold text-slate-800">Images</h4>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{(graveImages?.length ?? 0)} images</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(graveImages ?? []).map((img) => (
                                    <div key={img.id} className="border border-slate-200 rounded-xl p-3 bg-white hover:shadow-md transition-shadow duration-200">
                                        <img
                                            src={img.imageUrl}
                                            alt={img.imageAlt ?? ''}
                                            className="w-full h-40 object-cover rounded-lg cursor-zoom-in"
                                        />
                                    </div>
                                ))}
                                {graveImagesLoading && (
                                    <div className="text-base text-slate-500 col-span-full text-center py-8 bg-slate-50 rounded-xl">
                                        Loading images...
                                    </div>
                                )}
                                {!graveImagesLoading && (graveImages?.length ?? 0) === 0 && (
                                    <div className="text-base text-slate-500 col-span-full text-center py-8 bg-slate-50 rounded-xl">
                                        No images available for this grave.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
