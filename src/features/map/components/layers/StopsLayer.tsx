import { computed, type Signal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import {
  Layer,
  type MapGeoJSONFeature,
  Popup,
  Source,
} from "@vis.gl/react-maplibre";
import { useWindowSize } from "react-use";
import { getStopInfoOptions, getStopsQueryOptions } from "@/features/map/api";
import { BottomSheet } from "@/features/map/components/controls/BottomSheet.tsx";
import { mapStyle } from "@/features/map/components/MapContainer.tsx";
import type { Stop } from "@/features/map/types.ts";
import type { HandlerRegistry } from "@/features/map/utils/map/event.ts";
import filterStopInfo from "@/features/map/utils/map/filterStopDetails.ts";

function StopsBackgroundLayer({
  currentStop,
}: {
  currentStop: Signal<Stop | null>;
}) {
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
        "text-color": [
          "case",
          ["==", ["get", "id"], currentStop.value?.id ?? ""],
          "#2caa32",
          mapStyle.value.theme === "light" ? "#1e90ff" : "#0060bb",
        ],
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
        "text-color": "#ffffff",
      }}
    />
  );
}

interface StopPopupProps {
  currentStop: Signal<Stop | null>;
}

export function StopPopup({ currentStop }: StopPopupProps) {
  const { width } = useWindowSize();
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

  if (!currentStop.value) return null;

  const content = (
    <>
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
    </>
  );

  if (width > 768) {
    return (
      <Popup
        longitude={currentStop.value.lon}
        latitude={currentStop.value.lat}
        anchor="bottom"
        offset={15}
        onClose={() => (currentStop.value = null)}
        closeOnClick={false}
      >
        {content}
      </Popup>
    );
  }

  return (
    <BottomSheet defaultHeight={400} minHeight={200} maxHeight={800}>
      {content}
    </BottomSheet>
  );
}

interface StopLayerProps {
  currentStop: Signal<Stop | null>;
  mapClickHandlers: Signal<HandlerRegistry>;
  mapSecondaryClickHandlers: Signal<HandlerRegistry>;
}

export function StopsLayer({
  currentStop,
  mapClickHandlers,
  mapSecondaryClickHandlers,
}: StopLayerProps) {
  const { data } = useQuery(getStopsQueryOptions());

  const handleStopClick = (feature: MapGeoJSONFeature) => {
    const stop = feature.properties as Stop;
    if (currentStop.value?.id === stop.id) {
      currentStop.value = null;
      return;
    }
    currentStop.value = stop;
  };

  const handleStopSecondaryClick = (feature: MapGeoJSONFeature) => {
    const stop = feature.properties as Stop;
    window.open(stop.href);
  };

  // Register click handler for stop markers
  mapClickHandlers.value["stops-marker-background"] = handleStopClick;

  // Register secondary click handler for stop markers
  mapSecondaryClickHandlers.value["stops-marker-background"] =
    handleStopSecondaryClick;

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
      <StopsBackgroundLayer currentStop={currentStop} />
      <StopsForegroundLayer />
    </Source>
  );
}
