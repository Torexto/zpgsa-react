import MapLibre, {
  type MapLayerMouseEvent,
  type MapRef,
  Source,
} from "@vis.gl/react-maplibre";
import { type MapLibreEvent, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { signal } from "@preact/signals-react";
import {
  type HandlerRegistry,
  handleMapMouseEvent,
  type MapLoader,
} from "../utils/map/event.ts";
import { flyToCurrentPosition } from "../utils/map/geolocation.ts";
import {
  handleMouseMove,
  handleTouchEndOrCancel,
  handleTouchMove,
  handleTouchStart,
  touchAction,
} from "../utils/map/touch.ts";
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
import { mapStyles } from "@/features/map/components/controls/MapStylePicker.tsx";
import type { MapStyle } from "@/features/map/types.ts";

setWorkerUrl(workerUrl);

// Map events registry

export const mapClickHandlers: HandlerRegistry = {};
export const mapSecondaryClickHandlers: HandlerRegistry = {};

// Map loaders registry
export const mapLoaderHandlers: MapLoader[] = [];

// Map reference
export const mapSignal = signal<MapRef | null>(null);

// Map style
export const mapStyle = signal<MapStyle>(mapStyles[1]);

export function MapContainer() {
  const handleMapLoad = (event: MapLibreEvent) => {
    for (const handler of mapLoaderHandlers) {
      handler(event);
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    handleMapMouseEvent(event, mapClickHandlers);
  };

  const handleMapSecondaryClick = (event: MapLayerMouseEvent) => {
    handleMapMouseEvent(event, mapSecondaryClickHandlers);
  };

  touchAction.value = handleMapSecondaryClick;

  mapLoaderHandlers.push((event) => flyToCurrentPosition(event.target));

  return (
    <MapLibre
      ref={(instance) => {
        if (instance) {
          mapSignal.value = instance;
        }
      }}
      initialViewState={{
        longitude: 16.63,
        latitude: 50.71,
        zoom: 13,
      }}
      mapStyle={`https://tiles.openfreemap.org/styles/${mapStyle.value.id}`}
      attributionControl={false}
      style={{ width: "100vw", height: "100vh" }}
      onLoad={handleMapLoad}
      // Mouse events
      onClick={handleMapClick}
      onContextMenu={handleMapSecondaryClick}
      onMouseMove={handleMouseMove}
      // Touch events
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndOrCancel}
      onTouchCancel={handleTouchEndOrCancel}
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

      <BusesLayer />

      <RouteLayer />

      <StopPopup />

      <BusPopup />

      <MapControls />
    </MapLibre>
  );
}
