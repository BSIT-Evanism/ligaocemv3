import { create } from 'zustand'

type LatLngTuple = [number, number]

interface MapStore {
    markers: LatLngTuple[]
    addMarker: (marker: LatLngTuple) => void
    removeMarker: (index: number) => void
    clearMarkers: () => void
    setMarkers: (markers: LatLngTuple[]) => void
}

export const useMapStore = create<MapStore>((set) => ({
    markers: [],
    addMarker: (marker) => set((state) => ({ markers: [...state.markers, marker] })),
    removeMarker: (index) => set((state) => ({
        markers: state.markers.filter((_, i) => i !== index)
    })),
    clearMarkers: () => set({ markers: [] }),
    setMarkers: (markers) => set({ markers }),
}))
