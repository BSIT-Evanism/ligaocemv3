import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Overpass helpers
export type OverpassNode = {
  type: 'node'
  id: number
  lat: number
  lon: number
}

export type OverpassWay = {
  type: 'way'
  id: number
  nodes: number[]
}

export type OverpassResponse = {
  elements: Array<OverpassNode | OverpassWay>
}

export function overpassWayToCoords(resp: OverpassResponse, wayId: number): [number, number][] {
  const nodeMap = new Map<number, { lat: number; lon: number }>()
  for (const el of resp.elements) {
    if (el.type === 'node') nodeMap.set(el.id, { lat: el.lat, lon: el.lon })
  }
  const way = resp.elements.find((e): e is OverpassWay => e.type === 'way' && e.id === wayId)
  if (!way) return []
  const coords: [number, number][] = []
  for (const ref of way.nodes) {
    const n = nodeMap.get(ref)
    if (n) coords.push([n.lat, n.lon])
  }
  if (coords.length > 2) {
    const [fLat, fLon] = coords[0]
    const [lLat, lLon] = coords[coords.length - 1]
    if (fLat !== lLat || fLon !== lLon) coords.push([fLat, fLon])
  }
  return coords
}

export function parseOverpassToCoords(json: unknown, wayId: number): [number, number][] {
  const isOverpassResponse = (v: unknown): v is OverpassResponse => {
    return typeof v === 'object' && v !== null && Array.isArray((v as { elements?: unknown }).elements)
  }
  if (!isOverpassResponse(json)) return []
  return overpassWayToCoords(json, wayId)
}
