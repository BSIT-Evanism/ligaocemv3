"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

interface ClusterMarkerProps {
    position: [number, number];
    clusterNumber: number;
    clusterName: string;
    onClick?: () => void;
}

// Create a custom circle marker with number
const createClusterIcon = (clusterNumber: number, clusterName: string): DivIcon => {
    const iconHtml = `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 14px;
      cursor: pointer;
    ">
      ${clusterNumber}
    </div>
  `;

    return new DivIcon({
        html: iconHtml,
        className: "cluster-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
};

export function ClusterMarker({ position, clusterNumber, clusterName, onClick }: ClusterMarkerProps) {
    const icon = createClusterIcon(clusterNumber, clusterName);

    return (
        <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
            <Popup>
                <div className="p-2 min-w-[220px]">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h3 className="font-semibold text-gray-900">{clusterName}</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cluster ID:</span>
                                <span className="text-gray-900 font-mono">#{clusterNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Latitude:</span>
                                <span className="font-mono text-gray-900">{position[0].toFixed(6)}°</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Longitude:</span>
                                <span className="font-mono text-gray-900">{position[1].toFixed(6)}°</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="text-gray-900">Cemetery Cluster</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="text-green-600 font-medium">Active</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Click to view cluster details and manage graves
                            </p>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}
