import MapLibre, {
  type MapLayerMouseEvent,
  type MapRef,
  Source,
} from "@vis.gl/react-maplibre";
import { type MapLibreEvent, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { signal, useSignal } from "@preact/signals-react";
import {
  type HandlerRegistry,
  handleMapMouseEvent,
  type MapLoader,
  type ResourceLoaderRegistry,
} from "../utils/map/event.ts";
import { flyToCurrentPosition } from "../utils/map/geolocation.ts";
import { handleMouseMove, useLongPress } from "../utils/map/touch.ts";
import { MapControls } from "./controls/Controls.tsx";
import {
  BusesLayer,
  BusPopup,
  RouteLayer,
  StopPopup,
  StopsLayer,
} from "./layers";
import "../assets/index.css";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";
import { mapStyles } from "@/features/map/components/controls/MapStylePicker.tsx";
import type { MapStyle } from "@/features/map/types.ts";

setWorkerUrl(workerUrl);

const getMapStyle = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    const theme = mapStyles.find((style) => style.id === savedTheme);
    if (theme) {
      return theme;
    }
  }
  return mapStyles[0];
};

// Map style
export const mapStyle = signal<MapStyle>(getMapStyle());

mapStyle.subscribe(() => {
  localStorage.setItem("theme", mapStyle.value.id);
});

export function MapContainer() {
  // Map reference
  const mapRef = useRef<MapRef | null>(null);

  // Map events registry
  const mapClickHandlers = useSignal<HandlerRegistry>({});
  const mapSecondaryClickHandlers = useSignal<HandlerRegistry>({});

  // Map loaders registry
  const mapResourceLoaderHandlers = useSignal<ResourceLoaderRegistry>({});
  const mapLoaderHandlers = useSignal<MapLoader[]>([]);

  const currentBusId = useSignal<string | null>(null);
  const currentRouteBusId = useSignal<string | null>(null);

  const handleMapLoad = (event: MapLibreEvent) => {
    for (const handler of mapLoaderHandlers.value) {
      handler(event);
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    handleMapMouseEvent(event, mapClickHandlers.value);
  };

  const handleMapSecondaryClick = (event: MapLayerMouseEvent) => {
    handleMapMouseEvent(event, mapSecondaryClickHandlers.value);
  };

  const touchHandlers = useLongPress(handleMapSecondaryClick);

  mapLoaderHandlers.value.push((event) => flyToCurrentPosition(event.target));

  useEffect(() => {
    mapRef.current?.setMissingStyleImageResolver((id) => {
      const handler = mapResourceLoaderHandlers.value[id];
      if (handler && mapRef.current) {
        handler(mapRef.current);
      }
    });
  }, [mapResourceLoaderHandlers.value]);

  return (
    <MapLibre
      ref={mapRef}
      initialViewState={{
        longitude: 16.63,
        latitude: 50.71,
        zoom: 13,
      }}
      mapStyle={`https://tiles.openfreemap.org/styles/${mapStyle.value.id}`}
      attributionControl={false}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
      onLoad={handleMapLoad}
      // Mouse events
      onClick={handleMapClick}
      onContextMenu={touchHandlers.onContextMenu}
      onMouseMove={handleMouseMove}
      // Touch events
      onTouchStart={touchHandlers.onTouchStart}
      onTouchMove={touchHandlers.onTouchMove}
      onTouchEnd={touchHandlers.onTouchEnd}
      onTouchCancel={touchHandlers.onTouchCancel}
    >
      <Source
        id="osm-tiles"
        type="raster"
        tiles={["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]}
        tileSize={256}
        attribution="&copy; OpenStreetMap"
      >
        {/*<Layer id="osm-layer" type="raster" />*/}
      </Source>

      <StopsLayer />

      <BusesLayer
        mapClickHandlers={mapClickHandlers}
        mapSecondaryClickHandlers={mapSecondaryClickHandlers}
        mapResourceLoaderHandlers={mapResourceLoaderHandlers}
        mapLoaderHandlers={mapLoaderHandlers}
        currentBusId={currentBusId}
        currentRouteBusId={currentRouteBusId}
      />

      <RouteLayer currentRouteBusId={currentRouteBusId} />

      <StopPopup
        mapClickHandlers={mapClickHandlers}
        mapSecondaryClickHandlers={mapSecondaryClickHandlers}
      />

      <BusPopup currentBusId={currentBusId} />

      <MapControls mapRef={mapRef.current} />
    </MapLibre>
  );
}
