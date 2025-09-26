"use client";

import { useMapStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, MapPin, Plus } from "lucide-react";

export default function MapControls() {
    const { markers, addMarker, removeMarker, clearMarkers } = useMapStore();

    const handleAddRandomMarker = () => {
        // Add a random marker near the cemetery area
        const lat = 13.235 + (Math.random() - 0.5) * 0.01;
        const lng = 123.530 + (Math.random() - 0.5) * 0.01;
        addMarker([lat, lng]);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Map Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={handleAddRandomMarker} className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Marker
                        </Button>
                        <Button
                            onClick={clearMarkers}
                            variant="outline"
                            disabled={markers.length === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Markers ({markers.length})</h4>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {markers.map((marker, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                >
                                    <span>
                                        {marker[0].toFixed(6)}, {marker[1].toFixed(6)}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeMarker(index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {markers.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No markers added yet
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
