"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
  Polygon,
  useMap,
  LayersControl,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { Icon, type LeafletMouseEvent, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMapStore } from "@/lib/store";
import { ClusterMarker } from "./ClusterMarker";

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
        enabled={enableAddMarkers && !enableAddClusters}
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
            {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          </Popup>
        </Marker>
      ))}
      {enableAddClusters && tempClusterMarker && (
        <Marker position={tempClusterMarker} icon={defaultIcon}>
          <Popup>
            Selected location: {tempClusterMarker[0].toFixed(6)},{" "}
            {tempClusterMarker[1].toFixed(6)}
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
        />
      )}
      {polygon && polygon.length > 2 && (
        <Polygon
          positions={polygon}
          pathOptions={{ color: polygonColor, weight: 2, fillOpacity: 0.2 }}
        />
      )}
    </MapContainer>
  );
}
