import { useSuspenseQuery } from "@tanstack/react-query";
import { Layer, Source } from "@vis.gl/react-maplibre";
import type { Stop } from "../types.ts";

function StopsBackgroundLayer() {
  return (
    <Layer
      id="stops-marker-background"
      type="symbol"
      source="stops"
      layout={{
        "text-field": "■",
        "text-size": 24,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-anchor": "center",
        "text-justify": "center",
        "text-offset": [0, -0.1],
      }}
      paint={{
        "text-color": "dodgerblue",
      }}
    />
  );
}

function StopsForegroundLayer() {
  return (
    <Layer
      id="stops-marker-foreground"
      type="symbol"
      source="stops"
      layout={{
        "text-field": ["to-string", ["coalesce", ["get", "point_count"], 1]],
        "text-size": 14,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-anchor": "center",
        "text-justify": "center",
      }}
      paint={{
        "text-color": "white",
      }}
    />
  );
}

export default function StopsLayer() {
  const { data: stopsData } = useSuspenseQuery<Stop[]>({
    queryKey: ["stops"],
    queryFn: () => fetch("assets/data/stops.json").then((r) => r.json()),
  });

  const stopsDataFeature = {
    type: "FeatureCollection",
    features: stopsData.map((stop) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [stop.lon, stop.lat],
      },
      properties: { ...stop },
    })),
  };

  return (
    <Source
      id="stops"
      type="geojson"
      data={stopsDataFeature}
      cluster
      clusterMaxZoom={14}
      clusterRadius={30}
    >
      <StopsBackgroundLayer />
      <StopsForegroundLayer />
    </Source>
  );
}
