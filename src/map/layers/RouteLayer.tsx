import { useSuspenseQuery } from "@tanstack/react-query";
import { Layer, Source } from "@vis.gl/react-maplibre";
import type { Bus, Route, Stop } from "../types.ts";

function fetchStops(): Promise<Stop[]> {
  return fetch("/assets/data/stops.json").then((r) => r.json());
}

function fetchRoutes(): Promise<Record<string, Route>> {
  return fetch("/assets/data/routes.json").then((r) => r.json());
}

function buildRouteFeature(
  bus: Bus,
  stops: Stop[],
  routes: Record<string, Route>,
) {
  const route = routes[bus.route]?.details ?? [];
  const currentIndex = route.indexOf(bus.latestRouteStop);
  const remaining = currentIndex === -1 ? route : route.slice(currentIndex + 1);

  const stopsById = new Map(stops.map((s) => [s.id, s]));
  const coordinates: [number, number][] = remaining
    .map((id) => stopsById.get(id))
    .filter((stop): stop is Stop => Boolean(stop))
    .map((stop) => [stop.lon, stop.lat] as [number, number]);

  // Start from the bus's current position so the line connects to it.
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

export function RouteLayer({ bus }: { bus: Bus | null }) {
  const { data: stops } = useSuspenseQuery<Stop[]>({
    queryKey: ["stops"],
    queryFn: fetchStops,
  });
  const { data: routes } = useSuspenseQuery<Record<string, Route>>({
    queryKey: ["routes"],
    queryFn: fetchRoutes,
  });

  if (!bus) return null;

  const feature = buildRouteFeature(bus, stops, routes);
  if (!feature) return null;

  return (
    <Source
      id="current-route-source"
      type="geojson"
      data={{ type: "FeatureCollection", features: [feature] }}
    >
      <Layer
        id="current-route-layer"
        type="line"
        source="current-route-source"
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": "red",
          "line-width": 4,
        }}
      />
    </Source>
  );
}
