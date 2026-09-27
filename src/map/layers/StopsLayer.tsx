import { useSuspenseQuery } from "@tanstack/react-query";
import { Layer, Popup, Source } from "@vis.gl/react-maplibre";
import { useEffect } from "react";
import { getStopsQueryOptions } from "../../lib/api.ts";
import type { Stop, StopInfoBus } from "../types.ts";

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
        "text-size": 12,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-anchor": "center",
        "text-justify": "center",
        "text-font": ["sans-serif"],
        "text-offset": [0, 0.1],
      }}
      paint={{
        "text-color": "white",
      }}
    />
  );
}

export function StopPopup({
  stop,
  onClose,
  buses,
}: {
  stop: Stop;
  onClose: () => void;
  buses: StopInfoBus[];
}) {
  return (
    <Popup
      longitude={stop.lon}
      latitude={stop.lat}
      anchor="bottom"
      offset={15}
      onClose={onClose}
    >
      <div className="text-center font-bold text-[16px] pb-2">
        {stop.city} {stop.name} ({stop.id})
      </div>
      <div className="divide-y divide-white/20">
        {buses.map((bus, i) => (
          <div
            key={i}
            className="grid grid-cols-[max-content_1fr_max-content] gap-2 items-center whitespace-nowrap py-1 px-2 text-sm"
          >
            <div className="text-center w-8">{bus.line}</div>
            <div>{bus.destination}</div>
            <div>{bus.time}</div>
          </div>
        ))}
      </div>
    </Popup>
  );
}

export function StopsLayer() {
  const { data } = useSuspenseQuery(getStopsQueryOptions());

  const stopsDataFeature = {
    type: "FeatureCollection",
    features: (data || []).map((stop) => ({
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
