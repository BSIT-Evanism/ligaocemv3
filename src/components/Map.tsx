"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
  Polygon,
  Circle,
  CircleMarker,
  useMap,
  LayersControl,
} from "react-leaflet";
import { useEffect, useMemo, useState, useRef } from "react";
import { Icon, type LeafletMouseEvent, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMapStore } from "@/lib/store";
import { ClusterMarker } from "./ClusterMarker";
import LocateControl from "./LocateControl";




type LatLngTuple = [number, number];

type Cluster = {
  id: string;
  name: string;
  clusterNumber: number;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
};

type MapProps = {
  center?: LatLngTuple;
  zoom?: number;
  className?: string;
  markers?: LatLngTuple[];
  onMarkersChangeAction?: (markers: LatLngTuple[]) => void;
  enableAddMarkers?: boolean;
  // Static geometry to render a closed area (e.g., cemetery boundary)
  polygon?: LatLngTuple[];
  polygonColor?: string;
  // Interactive path drawing via clicks
  polyline?: LatLngTuple[];
  enableAddPolyline?: boolean;
  onPolylineChangeAction?: (polyline: LatLngTuple[]) => void;
  // Auto-fit view to provided geometry
  fitToGeometry?: boolean;
  // Maximum zoom level for the map
  maxZoom?: number;
  // Enable layer controls for switching between satellite and streets
  enableLayerControls?: boolean;
  // Cluster functionality
  clusters?: Cluster[];
  enableAddClusters?: boolean;
  onClusterClickAction?: (cluster: Cluster) => void;
  onMapClickAction?: (coordinates: {
    latitude: number;
    longitude: number;
  }) => void;
  clearTempMarker?: boolean;
  // Locate control options
  enableLocateControl?: boolean;
  locateControlPosition?: "topleft" | "topright" | "bottomleft" | "bottomright";
};

// Configure default marker icons using bundled assets to avoid broken images
function configureDefaultMarker(): void {
  const defaultIconPrototype = Icon.Default.prototype as unknown as {
    _getIconUrl?: unknown;
  };
  delete defaultIconPrototype._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: (markerIcon2x as { src: string }).src,
    iconUrl: (markerIcon as { src: string }).src,
    shadowUrl: (markerShadow as { src: string }).src,
  });
}

function ClickToAddMarkers({
  onAdd,
  enabled = true,
}: {
  onAdd: (latlng: LatLngTuple) => void;
  enabled?: boolean;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!enabled) return;
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function ClickToAddClusters({
  onAdd,
  enabled = true,
}: {
  onAdd: (coordinates: { latitude: number; longitude: number }) => void;
  enabled?: boolean;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!enabled) return;
      onAdd({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function ClickToAddPolyline({
  onAdd,
  enabled = true,
}: {
  onAdd: (latlng: LatLngTuple) => void;
  enabled?: boolean;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!enabled) return;
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Ensure default marker icons are configured before any Marker is rendered
configureDefaultMarker();

export default function Map({
  center = [14.5995, 120.9842],
  zoom = 12,
  className,
  markers,
  onMarkersChangeAction,
  enableAddMarkers = true,
  polygon,
  polygonColor = "#3b82f6",
  polyline,
  enableAddPolyline = false,
  onPolylineChangeAction,
  fitToGeometry = true,
  maxZoom = 18,
  enableLayerControls = true,
  clusters = [],
  enableAddClusters = false,
  onClusterClickAction,
  onMapClickAction,
  clearTempMarker = false,
  enableLocateControl = true,
  locateControlPosition = "topleft",
}: MapProps) {
  const { markers: storeMarkers, addMarker } = useMapStore();
  const [tempClusterMarker, setTempClusterMarker] =
    useState<LatLngTuple | null>(null);

  const getAssetUrl = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (
      val &&
      typeof val === "object" &&
      "src" in (val as Record<string, unknown>)
    ) {
      return (val as { src: string }).src;
    }
    return "";
  };

  const defaultIcon = useMemo(
    () =>
      new Icon({
        iconRetinaUrl: getAssetUrl(markerIcon2x),
        iconUrl: getAssetUrl(markerIcon),
        shadowUrl: getAssetUrl(markerShadow),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    [],
  );

  const [localMarkers, setLocalMarkers] = useState<LatLngTuple[]>(
    () => markers ?? (center ? [center] : []),
  );
  const [localPolyline, setLocalPolyline] = useState<LatLngTuple[]>(
    () => polyline ?? [],
  );

  useEffect(() => {
    if (markers) setLocalMarkers(markers);
  }, [markers]);

  useEffect(() => {
    if (polyline) setLocalPolyline(polyline);
  }, [polyline]);

  useEffect(() => {
    if (clearTempMarker) {
      setTempClusterMarker(null);
    }
  }, [clearTempMarker]);

  const handleAdd = (latlng: LatLngTuple) => {
    addMarker(latlng);
    setLocalMarkers((prev) => {
      const next = [...prev, latlng];
      onMarkersChangeAction?.(next);
      return next;
    });
  };

  const handleAddPolyline = (latlng: LatLngTuple) => {
    setLocalPolyline((prev) => {
      const next = [...prev, latlng];
      onPolylineChangeAction?.(next);
      return next;
    });
  };

  const handleMapClick = (coordinates: {
    latitude: number;
    longitude: number;
  }) => {
    if (enableAddClusters) {
      setTempClusterMarker([coordinates.latitude, coordinates.longitude]);
      onMapClickAction?.(coordinates);
    }
  };

  function FitToGeometry({ enabled = true }: { enabled?: boolean }) {
    const map = useMap();
    useEffect(() => {
      if (!enabled) return;
      const pts: LatLngTuple[] = [];
      if (polygon?.length) pts.push(...polygon);
      if (localPolyline.length) pts.push(...localPolyline);
      if (localMarkers.length) pts.push(...localMarkers);
      if (pts.length === 0) return;
      const [firstLat, firstLng] = pts[0]!;
      const bounds = new LatLngBounds(
        [firstLat, firstLng],
        [firstLat, firstLng],
      );
      for (const [lat, lng] of pts) bounds.extend([lat, lng]);
      map.fitBounds(bounds, { padding: [16, 16] });
      // We intentionally omit pts from deps to avoid excessive recalcs
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, map, polygon, localPolyline, localMarkers]);
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxZoom={maxZoom}
      minZoom={1}
      zoomSnap={0.25}
      className={`${className ?? "h-[400px] w-full rounded-md"} leaflet-map-container rounded-md`}
    >
      {/* Subscribe to flyToTarget changes and animate the map to the target when set */}
      <FlyToTargetListener />
      {enableLayerControls ? (
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={maxZoom}
              maxNativeZoom={18}
              tileSize={512}
              zoomOffset={-1}
              attribution="Tiles &copy; Esri — Source: Esri, Earthstar Geographics"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Streets">
            <TileLayer
              url="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
              maxZoom={maxZoom}
              maxNativeZoom={18}
              tileSize={512}
              zoomOffset={-1}
              attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
      ) : (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={maxZoom}
          maxNativeZoom={18}
          tileSize={512}
          zoomOffset={-1}
          attribution="Tiles &copy; Esri — Source: Esri, Earthstar Geographics"
        />
      )}
      <ClickToAddMarkers
        onAdd={handleAdd}
        enabled={enableAddMarkers && !enableAddClusters && !enableAddPolyline}
      />
      <ClickToAddPolyline
        onAdd={handleAddPolyline}
        enabled={enableAddPolyline && !enableAddClusters}
      />
      <ClickToAddClusters onAdd={handleMapClick} enabled={enableAddClusters} />
      <FitToGeometry enabled={fitToGeometry} />
      {storeMarkers.map((pos, idx) => (
        <Marker
          key={`${pos[0]}-${pos[1]}-${idx}`}
          position={pos}
          icon={defaultIcon}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Marker #{idx + 1}</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-mono text-gray-900">{pos[0].toFixed(6)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitude:</span>
                    <span className="font-mono text-gray-900">{pos[1].toFixed(6)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precision:</span>
                    <span className="text-gray-900">~{pos[0].toFixed(6).split('.')[1]?.length || 0} decimal places</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Click to view details or edit location
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {enableAddClusters && tempClusterMarker && (
        <Marker position={tempClusterMarker} icon={defaultIcon}>
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <h3 className="font-semibold text-gray-900">New Cluster Location</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-mono text-gray-900">{tempClusterMarker[0].toFixed(6)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitude:</span>
                    <span className="font-mono text-gray-900">{tempClusterMarker[1].toFixed(6)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-orange-600 font-medium">Pending Creation</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    This location will be used for the new cluster
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}
      {clusters
        .filter((cluster) => cluster.coordinates)
        .map((cluster) => (
          <ClusterMarker
            key={cluster.id}
            position={[
              cluster.coordinates!.latitude,
              cluster.coordinates!.longitude,
            ]}
            clusterNumber={cluster.clusterNumber}
            clusterName={cluster.name}
            onClick={() => onClusterClickAction?.(cluster)}
          />
        ))}
      {localPolyline.length > 1 && (
        <Polyline
          positions={localPolyline}
          pathOptions={{ color: "#10b981", weight: 3 }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Path Route</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points:</span>
                    <span className="text-gray-900">{localPolyline.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="font-mono text-gray-900 text-xs">
                      {localPolyline[0]?.[0].toFixed(4)}°, {localPolyline[0]?.[1].toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="font-mono text-gray-900 text-xs">
                      {localPolyline[localPolyline.length - 1]?.[0].toFixed(4)}°, {localPolyline[localPolyline.length - 1]?.[1].toFixed(4)}°
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Interactive path with {localPolyline.length} waypoints
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Polyline>
      )}
      {polygon && polygon.length > 2 && (
        <Polygon
          positions={polygon}
          pathOptions={{ color: polygonColor, weight: 2, fillOpacity: 0.2 }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: polygonColor }}></div>
                  <h3 className="font-semibold text-gray-900">Area Boundary</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vertices:</span>
                    <span className="text-gray-900">{polygon.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-gray-900">Closed Polygon</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="text-gray-900" style={{ color: polygonColor }}>
                      {polygonColor}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Static boundary area with {polygon.length} corner points
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Polygon>
      )}
      <UserLocationLayer cemeteryCenter={center} />
      {enableLocateControl && (
        <LocateControl position={locateControlPosition} />
      )}
    </MapContainer>
  );
}

function FlyToTargetListener() {
  const map = useMap();
  const { flyToTarget, setFlyToTarget } = useMapStore();
  useEffect(() => {
    if (!flyToTarget) return;
    map.flyTo(flyToTarget, Math.max(map.getZoom(), 16));
    // clear after moving so subsequent clicks work
    setFlyToTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToTarget, map]);
  return null;
}

function UserLocationLayer({ cemeteryCenter }: { cemeteryCenter?: [number, number] }) {
  const map = useMap();
  const { userLocation, followUser } = useMapStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userLocation || !followUser) return;

    // Debounce rapid updates - only update if enough time has passed
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate < 2000) { // 2 seconds debounce
      return;
    }

    if (isAnimating) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Use provided cemetery center or fallback to a default
    const center = cemeteryCenter || [13.235529662734809, 123.53030072913442];
    const userPosition: [number, number] = [userLocation.lat, userLocation.lng];

    // Calculate distance between user and cemetery center
    const latDiff = Math.abs(userPosition[0] - center[0]);
    const lngDiff = Math.abs(userPosition[1] - center[1]);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Set animating flag to prevent rapid successive calls
    setIsAnimating(true);
    lastUpdateRef.current = now;

    // Use setTimeout to sequence the operation and prevent flickering
    timeoutRef.current = setTimeout(() => {
      try {
        // If user is very close to cemetery center, just focus on user with higher zoom
        if (distance < 0.001) { // ~100 meters
          map.setView(userPosition, Math.max(map.getZoom(), 18), { animate: true });
        } else {
          // Create bounds that include both the user location and cemetery center
          const bounds = new LatLngBounds(userPosition, center);

          // Fit the map to show both locations with some padding
          map.fitBounds(bounds, {
            padding: [20, 20],
            animate: true,
            duration: 1.0
          });
        }
      } catch (error) {
        console.warn('Error during map animation:', error);
      } finally {
        // Reset animating flag after a delay to allow for smooth transitions
        setTimeout(() => setIsAnimating(false), 2000);
      }
    }, 300); // Increased delay to prevent rapid successive calls

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userLocation, followUser, map, cemeteryCenter, isAnimating]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!userLocation) return null;
  const position: [number, number] = [userLocation.lat, userLocation.lng];
  const accuracy = userLocation.accuracy ?? 0;
  const heading = userLocation.heading ?? null;
  const speed = (userLocation as any).speed ?? null;
  const timestamp = (userLocation as any).timestamp ?? null;

  return (
    <>
      {/* Dot for precise position (pixel radius, no icon dependency) */}
      <CircleMarker
        center={position}
        radius={6}
        pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
      >
        <Popup>
          <div className="p-2 min-w-[220px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-gray-900">Your Location</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono text-gray-900">{position[0].toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono text-gray-900">{position[1].toFixed(6)}°</span>
                </div>
                {accuracy > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="text-gray-900">±{Math.round(accuracy)}m</span>
                  </div>
                )}
                {speed !== null && speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed:</span>
                    <span className="text-gray-900">{Math.round(speed * 3.6)} km/h</span>
                  </div>
                )}
                {heading !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heading:</span>
                    <span className="text-gray-900">{Math.round(heading)}°</span>
                  </div>
                )}
                {timestamp && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-900">{new Date(timestamp).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {accuracy > 0 ? `Location accuracy: ±${Math.round(accuracy)} meters` : 'High precision location'}
                </p>
              </div>
            </div>
          </div>
        </Popup>
      </CircleMarker>
      {/* Accuracy circle */}
      {accuracy > 0 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{ color: "#3b82f6", opacity: 0.3, fillOpacity: 0.1 }}
        />
      )}
      {/* Heading cone (approximate) */}
      {heading !== null && (
        <Polyline
          positions={[position, [
            position[0] + 0.0008 * Math.cos((heading * Math.PI) / 180),
            position[1] + 0.0008 * Math.sin((heading * Math.PI) / 180),
          ]]}
          pathOptions={{ color: "#ef4444", weight: 2 }}
        />
      )}
    </>
  );
}
