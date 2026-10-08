import { signal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import { Layer, Source } from "@vis.gl/react-maplibre";
import {
  getBusesQueryOptions,
  getRoutesQueryOptions,
  getStopsQueryOptions,
} from "@/features/map/api";
import { buildRouteFeature } from "@/features/map/utils/map/route.ts";

export const currentRouteBusId = signal<string | null>(null);

export function RouteLayer() {
  const busId = currentRouteBusId.value;

  const { data: buses } = useQuery(getBusesQueryOptions());
  const { data: stops } = useQuery(getStopsQueryOptions());
  const { data: routes } = useQuery(getRoutesQueryOptions());

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
