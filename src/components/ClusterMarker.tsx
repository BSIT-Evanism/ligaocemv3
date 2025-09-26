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
                <div className="p-2">
                    <h3 className="font-bold text-lg">{clusterName}</h3>
                    <p className="text-sm text-gray-600">Cluster #{clusterNumber}</p>
                    <p className="text-xs text-gray-500">
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </p>
                </div>
            </Popup>
        </Marker>
    );
}
