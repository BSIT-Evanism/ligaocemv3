import { create } from 'zustand'

type LatLngTuple = [number, number]

interface MapStore {
    markers: LatLngTuple[]
    addMarker: (marker: LatLngTuple) => void
    removeMarker: (index: number) => void
    clearMarkers: () => void
    setMarkers: (markers: LatLngTuple[]) => void
    flyToTarget: LatLngTuple | null
    setFlyToTarget: (target: LatLngTuple | null) => void
    userLocation: {
        lat: number
        lng: number
        accuracy?: number
        heading?: number | null
    } | null
    setUserLocation: (
        loc:
            | MapStore['userLocation']
            | ((prev: MapStore['userLocation']) => MapStore['userLocation'])
    ) => void
    followUser: boolean
    setFollowUser: (follow: boolean) => void
}

export const useMapStore = create<MapStore>((set) => ({
    markers: [],
    addMarker: (marker) => set((state) => ({ markers: [...state.markers, marker] })),
    removeMarker: (index) => set((state) => ({
        markers: state.markers.filter((_, i) => i !== index)
    })),
    clearMarkers: () => set({ markers: [] }),
    setMarkers: (markers) => set({ markers }),
    flyToTarget: null,
    setFlyToTarget: (target) => set({ flyToTarget: target }),
    userLocation: null,
    setUserLocation: (loc) =>
        set((state) => ({
            userLocation:
                typeof loc === 'function'
                    ? (loc as (p: MapStore['userLocation']) => MapStore['userLocation'])(state.userLocation)
                    : loc,
        })),
    followUser: false,
    setFollowUser: (follow) => set({ followUser: follow }),
}))
