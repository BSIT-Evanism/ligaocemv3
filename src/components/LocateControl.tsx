"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";

interface LocateControlProps {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright";
    setView?: boolean | "once" | "always" | "untilPan" | "untilPanOrZoom";
    flyTo?: boolean;
    keepCurrentZoomLevel?: boolean;
    initialZoomLevel?: false | number;
    drawCircle?: boolean;
    drawMarker?: boolean;
    showCompass?: boolean;
    showPopup?: boolean;
    strings?: {
        title?: string;
        text?: string;
        metersUnit?: string;
        feetUnit?: string;
        popup?: string;
        outsideMapBoundsMsg?: string;
    };
    locateOptions?: L.LocateOptions;
}

export default function LocateControl({
    position = "topleft",
    setView = "untilPanOrZoom",
    flyTo = true,
    keepCurrentZoomLevel = false,
    initialZoomLevel = false,
    drawCircle = true,
    drawMarker = true,
    showCompass = true,
    showPopup = true,
    strings = {},
    locateOptions = {},
}: LocateControlProps) {
    const map = useMap();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let locateControl: L.Control | null = null;

        const loadLocateControl = async () => {
            try {
                // Dynamically import the locate control plugin
                const locateModule = await import("leaflet.locatecontrol");

                // The plugin should extend L.control with the locate method
                // Check if the control is available after import
                if (typeof (L.control as any).locate === 'function') {
                    // Create the locate control with options
                    locateControl = (L.control as any).locate({
                        position,
                        setView,
                        flyTo,
                        keepCurrentZoomLevel,
                        initialZoomLevel,
                        drawCircle,
                        drawMarker,
                        showCompass,
                        showPopup,
                        strings: {
                            title: "Show my location",
                            text: "My location",
                            metersUnit: "m",
                            feetUnit: "ft",
                            popup: "You are within {distance} {unit} from this point",
                            outsideMapBoundsMsg: "You seem located outside the boundaries of the map",
                            ...strings,
                        },
                        locateOptions: {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0,
                            ...locateOptions,
                        },
                    });

                    // Add the control to the map
                    locateControl.addTo(map);
                    setIsLoaded(true);
                } else {
                    console.warn("Leaflet.Locate control is not available after import");
                    console.log("Available L.control methods:", Object.keys(L.control));
                }
            } catch (error) {
                console.error("Failed to load Leaflet.Locate control:", error);
            }
        };

        // Only load on client side
        if (typeof window !== 'undefined') {
            loadLocateControl();
        }

        // Cleanup function to remove the control when component unmounts
        return () => {
            if (locateControl) {
                map.removeControl(locateControl);
            }
        };
    }, [
        map,
        position,
        setView,
        flyTo,
        keepCurrentZoomLevel,
        initialZoomLevel,
        drawCircle,
        drawMarker,
        showCompass,
        showPopup,
        strings,
        locateOptions,
    ]);

    return null;
}
