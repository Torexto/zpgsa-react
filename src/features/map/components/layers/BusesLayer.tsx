import { computed, type Signal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import {
  Layer,
  type MapGeoJSONFeature,
  type MapInstance,
  type MapRef,
  Popup,
  Source,
} from "@vis.gl/react-maplibre";
import { useWindowSize } from "react-use";
import { getBusesQueryOptions } from "@/features/map/api";
import { mapStyle } from "@/features/map/components/MapContainer.tsx";
import type { Bus } from "@/features/map/types.ts";
import type {
  HandlerRegistry,
  MapLoader,
  ResourceLoaderRegistry,
} from "@/features/map/utils/map/event.ts";

const loadBusIcon = (map: MapRef | MapInstance) => {
  const imageUrl = "/assets/img/bus.png";

  return map.loadImage(imageUrl).then((image) => {
    if (!map.hasImage("bus-icon")) {
      map.addImage("bus-icon", image.data);
    }
  });
};

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

function BusBackgroundLayer({
  currentBusId,
}: {
  currentBusId: Signal<string | null>;
}) {
  const isLightTheme = mapStyle.value.theme === "light";

  return (
    <Layer
      id="buses-marker-background"
      type="circle"
      source="buses"
      paint={{
        "circle-color": [
          "case",
          ["==", ["get", "id"], currentBusId.value ?? ""],
          "#2caa32",
          [
            "match",
            ["get", "icon"],
            "bus-late",
            isLightTheme ? "#ff6600" : "#aa3300",
            "bus-ahead",
            isLightTheme ? "#ee0000" : "#990000",
            "bus-on-time",
            isLightTheme ? "#3388ee" : "#0050bb",
            isLightTheme ? "#3388ee" : "#0050bb",
          ],
        ],
        "circle-radius": 16,
        "circle-stroke-color": isLightTheme ? "#ffffff" : "#777777",
        "circle-stroke-width": 1,
        "circle-opacity": 1,
      }}
    />
  );
}

interface BusPopupProps {
  currentBusId: Signal<string | null>;
}

export function BusPopup({ currentBusId }: BusPopupProps) {
  const { width } = useWindowSize();
  const { data: buses } = useQuery(getBusesQueryOptions());

  const bus = computed(() => {
    return buses?.find((bus) => bus.id === currentBusId.value) ?? null;
  });

  if (!bus.value || !width) {
    return null;
  }

  const content = (
    <div>
      <div>
        Linia {bus.value.line} | {bus.value.label}
      </div>
      <div>{bus.value.destination}</div>
      <div>Odchyłka: {bus.value.deviation}</div>
    </div>
  );

  if (width > 768) {
    return (
      <Popup
        longitude={bus.value.lon}
        latitude={bus.value.lat}
        anchor="bottom"
        offset={15}
        onClose={() => (currentBusId.value = null)}
        closeOnClick={false}
      >
        {content}
      </Popup>
    );
  }

  return (
    <div className="w-full bg-gray-700 absolute bottom-0 left-0 p-3 text-gray-300 z-50 rounded-t-2xl text-[16px] flex flex-col gap-2">
      <div className="flex justify-center">
        <div className="bg-gray-300 w-1/3 h-1 rounded-full"></div>
      </div>
      {content}
    </div>
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
        "text-font": ["Noto Sans Regular"],
      }}
      paint={{
        "text-color": mapStyle.value.theme === "light" ? "#000000" : "#ffffff",
      }}
    />
  );
}

interface BusLayerProps {
  mapClickHandlers: Signal<HandlerRegistry>;
  mapSecondaryClickHandlers: Signal<HandlerRegistry>;
  mapResourceLoaderHandlers: Signal<ResourceLoaderRegistry>;
  mapLoaderHandlers: Signal<MapLoader[]>;
  currentBusId: Signal<string | null>;
  currentRouteBusId: Signal<string | null>;
}

export function BusesLayer({
  mapClickHandlers,
  mapSecondaryClickHandlers,
  mapResourceLoaderHandlers,
  mapLoaderHandlers,
  currentBusId,
  currentRouteBusId,
}: BusLayerProps) {
  const { data } = useQuery(getBusesQueryOptions());

  const handleBusClick = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    currentBusId.value = bus.id;
  };

  const handleBusSecondaryClick = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    currentRouteBusId.value =
      currentRouteBusId.value !== bus.id ? bus.id : null;
  };

  mapClickHandlers.value["buses-marker-background"] = handleBusClick;
  mapSecondaryClickHandlers.value["buses-marker-background"] =
    handleBusSecondaryClick;
  mapLoaderHandlers.value.push((event) => loadBusIcon(event.target));
  mapResourceLoaderHandlers.value["bus-icon"] = loadBusIcon;

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
      <BusBackgroundLayer currentBusId={currentBusId} />
      <BusForegroundLayer />
      <BusTextLayer />
    </Source>
  );
}
