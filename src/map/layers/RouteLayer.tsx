import { signal } from "@preact/signals-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Layer, Source } from "@vis.gl/react-maplibre";
import {
  getBusesQueryOptions,
  getRoutesQueryOptions,
  getStopsQueryOptions,
} from "../../lib/api.ts";
import type { Bus, Route, Stop } from "../types.ts";

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

export const currentRouteBusId = signal<string | null>(null);

export function RouteLayer() {
  const busId = currentRouteBusId.value;

  const { data: buses } = useQuery(getBusesQueryOptions());
  const { data: stops } = useSuspenseQuery(getStopsQueryOptions());
  const { data: routes } = useSuspenseQuery(getRoutesQueryOptions());

  if (!buses) return null;

  const bus = (busId && buses.find((bus) => bus.id === busId)) || null;

  const feature = bus ? buildRouteFeature(bus, stops, routes) : null;

  const features = feature ? [feature] : [];

  return (
    <Source
      id="current-route-source"
      type="geojson"
      data={{ type: "FeatureCollection", features: features }}
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
