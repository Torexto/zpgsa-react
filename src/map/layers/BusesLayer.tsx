import { useSuspenseQuery } from "@tanstack/react-query";
import { Layer, Source } from "@vis.gl/react-maplibre";
import toBus from "../toBus.ts";
import type { Bus, ZpgsaBus } from "../types.ts";

async function fetchBuses() {
  return fetch("/api/buses")
    .then((res) => res.json())
    .then((data: ZpgsaBus[]) => data.map(toBus));
}

function BusForegroundLayer() {
  return (
    <Layer
      id="buses-marker-foreground"
      type="symbol"
      source="buses"
      layout={{
        "icon-image": "bus-icon",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      }}
    />
  );
}

function BusBackgroundLayer() {
  return (
    <Layer
      id="buses-marker-background"
      type="circle"
      source="buses"
      paint={{
        "circle-color": [
          "match",
          ["get", "icon"],
          "bus-late",
          "#ff6a00",
          "bus-ahead",
          "#e539",
          "bus-on-time",
          "#307fe2",
          "#307fe2",
        ],
        "circle-radius": 16,
        "circle-stroke-color": "white",
        "circle-stroke-width": 1,
      }}
    />
  );
}

function StopsTextLayer() {
  return (
    <Layer
      id="buses-marker-text"
      type="symbol"
      source="buses"
      layout={{
        "text-field": ["get", "line"],
        "text-offset": [0, 1.5],
        "text-size": 14,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      }}
    />
  );
}

export default function BusesLayer() {
  const { data: busesData } = useSuspenseQuery<Bus[]>({
    queryKey: ["buses"],
    queryFn: fetchBuses,
    refetchInterval: 3000,
  });

  return (
    <Source
      id="buses"
      type="geojson"
      data={{
        type: "FeatureCollection",
        features: busesData.map((bus) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [bus.lon, bus.lat],
          },
          properties: { ...bus },
        })),
      }}
    >
      <BusBackgroundLayer />
      <BusForegroundLayer />
      <StopsTextLayer />
    </Source>
  );
}
