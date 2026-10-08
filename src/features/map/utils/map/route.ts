import type { Bus, Route, Stop } from "@/features/map/types.ts";

export function buildRouteFeature(
  bus: Bus,
  stops: Stop[] | undefined,
  routes: Record<string, Route> | undefined,
) {
  if (!stops || !routes) return null;

  const route = routes[bus.route]?.details ?? [];
  const currentIndex = route.indexOf(bus.latestRouteStop);
  const remaining = currentIndex === -1 ? route : route.slice(currentIndex + 1);

  const stopsById = new Map(stops.map((s) => [s.id, s]));
  const coordinates: [number, number][] = remaining
    .map((id) => stopsById.get(id))
    .filter((stop): stop is Stop => Boolean(stop))
    .map((stop) => [stop.lon, stop.lat] as [number, number]);

  const fullPath: [number, number][] = [[bus.lon, bus.lat], ...coordinates];

  if (fullPath.length < 2) return null;

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: fullPath,
    },
  };
}
