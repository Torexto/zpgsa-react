import { computed, signal } from "@preact/signals-react";
import { useQuery } from "@tanstack/react-query";
import {
  Layer,
  type MapGeoJSONFeature,
  Popup,
  Source,
} from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import { getBusesQueryOptions } from "../../lib/api.ts";
import {
  mapClickHandlers,
  mapLoaderHandlers,
  mapSecondaryClickHandlers,
} from "../MapContainer.tsx";
import type { Bus } from "../types.ts";
import { currentRouteBusId } from "./RouteLayer.tsx";

const loadBusIcon = (event: MapLibreEvent) => {
  const map = event.target;

  const imageUrl = "/assets/img/bus.png";

  map.loadImage(imageUrl).then((image) => {
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

export function BusPopup() {
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
      }}
    />
  );
}

export const currentBusId = signal<string | null>(null);

const handleBusClick = (feature: MapGeoJSONFeature) => {
  const bus = feature.properties as Bus;
  currentBusId.value = bus.id;
};

const handleBusSecondaryClick = (feature: MapGeoJSONFeature) => {
  const bus = feature.properties as Bus;
  currentRouteBusId.value = currentRouteBusId.value !== bus.id ? bus.id : null;
};

export function BusesLayer() {
  const { data } = useQuery(getBusesQueryOptions());

  mapClickHandlers["buses-marker-background"] = handleBusClick;
  mapSecondaryClickHandlers["buses-marker-background"] =
    handleBusSecondaryClick;
  mapLoaderHandlers.push(loadBusIcon);

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
