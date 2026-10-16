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
          mapStyle.value.theme === "light" ? "#ff6600" : "#aa3300",
          "bus-ahead",
          mapStyle.value.theme === "light" ? "#ee0000" : "#990000",
          "bus-on-time",
          mapStyle.value.theme === "light" ? "#3388ee" : "#0050bb",
          mapStyle.value.theme === "light" ? "#3388ee" : "#0050bb",
        ],
        "circle-radius": 16,
        "circle-stroke-color":
          mapStyle.value.theme === "light" ? "#ffffff" : "#777777",
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
  const { data: buses } = useQuery(getBusesQueryOptions());

  const bus = computed(() => {
    return buses?.find((bus) => bus.id === currentBusId.value) ?? null;
  });

  if (!bus.value) {
    return null;
  }

  return (
    <Popup
      longitude={bus.value.lon}
      latitude={bus.value.lat}
      anchor="bottom"
      offset={15}
      onClose={() => (currentBusId.value = null)}
    >
      <div>
        <div>
          Linia {bus.value.line} | {bus.value.label}
        </div>
        <div>{bus.value.destination}</div>
        <div>Odchyłka: {bus.value.deviation}</div>
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
      <BusBackgroundLayer />
      <BusForegroundLayer />
      <BusTextLayer />
    </Source>
  );
}
