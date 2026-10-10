import { computed, signal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import {
  Layer,
  type MapGeoJSONFeature,
  Popup,
  Source,
} from "@vis.gl/react-maplibre";
import { getStopInfoOptions, getStopsQueryOptions } from "@/features/map/api";
import {
  mapClickHandlers,
  mapSecondaryClickHandlers,
} from "@/features/map/components/MapContainer.tsx";
import type { Stop } from "@/features/map/types.ts";
import filterStopInfo from "@/features/map/utils/map/filterStopDetails.ts";

function StopsBackgroundLayer() {
  return (
    <Layer
      id="stops-marker-background"
      type="symbol"
      source="stops"
      layout={{
        "text-field": "■",
        "text-size": 36,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-anchor": "center",
        "text-justify": "center",
        "text-font": ["Noto Sans Regular"],
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
        "text-font": ["Noto Sans Regular"],
      }}
      paint={{
        "text-color": "white",
      }}
    />
  );
}

export const currentStop = signal<Stop | null>(null);

const handleStopClick = (feature: MapGeoJSONFeature) => {
  currentStop.value = feature.properties as Stop;
};

const handleStopSecondaryClick = (feature: MapGeoJSONFeature) => {
  const stop = feature.properties as Stop;
  window.open(stop.href);
};

export function StopPopup() {
  const {
    data: stopInfoData,
    isPending,
    error,
  } = useQuery(getStopInfoOptions());

  // Filter stop info based on current stop
  const stopInfo = computed(() => {
    if (!stopInfoData || isPending || error) return null;
    if (!currentStop.value) return null;
    const info = stopInfoData[currentStop.value.id];
    return filterStopInfo(info ?? []);
  });

  // Register click handler for stop markers
  mapClickHandlers["stops-marker-background"] = handleStopClick;

  // Register secondary click handler for stop markers
  mapSecondaryClickHandlers["stops-marker-background"] =
    handleStopSecondaryClick;

  if (!currentStop.value) return null;

  return (
    <Popup
      longitude={currentStop.value.lon}
      latitude={currentStop.value.lat}
      anchor="bottom"
      offset={15}
      onClose={() => (currentStop.value = null)}
    >
      <div className="text-center font-bold text-[16px] pb-2">
        {currentStop.value.city} {currentStop.value.name} (
        {currentStop.value.id})
      </div>
      <div className="divide-y divide-white/20">
        {stopInfo.value?.map((bus, i) => (
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
  const { data } = useQuery(getStopsQueryOptions());

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
