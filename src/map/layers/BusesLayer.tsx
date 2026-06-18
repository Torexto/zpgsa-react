import { useQuery } from "@tanstack/react-query";
import { Layer, Popup, Source } from "@vis.gl/react-maplibre";
import toBus from "../toBus.ts";
import type { Bus, ZpgsaBus } from "../types.ts";

async function fetchBuses(): Promise<Bus[]> {
  return fetch("/api/buses")
    .then((res) => res.json())
    .then((data: ZpgsaBus[]) => data.map(toBus));
}

export function getBusesQueryOptions() {
  return {
    queryKey: ["buses"],
    queryFn: fetchBuses,
    refetchInterval: 3000,
  };
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
        "circle-opacity": 1,
      }}
    />
  );
}

export function BusPopup({ bus, onClose }: { bus: Bus; onClose: () => void }) {
  return (
    <Popup
      longitude={bus.lon}
      latitude={bus.lat}
      anchor="bottom"
      offset={15}
      onClose={onClose}
    >
      <div>
        <div>
          Linia {bus.line} | {bus.label}
        </div>
        <div>{bus.destination}</div>
        <div>Odchyłka: {bus.deviation}</div>
      </div>
    </Popup>
  );
}

function BusTextLayer() {
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

export function BusesLayer() {
  const { data } = useQuery(getBusesQueryOptions());

  return (
    <Source
      id="buses"
      type="geojson"
      data={{
        type: "FeatureCollection",
        features: (data || []).map((bus) => ({
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
      <BusTextLayer />
    </Source>
  );
}
