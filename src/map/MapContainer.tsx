import MapLibre, {
  Layer,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapRef,
  Source,
} from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import { useEffect } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { signal } from "@preact/signals-react";
import { useGeolocation } from "react-use";
import { handleMapMouseEvent } from "../lib/utils/map/event.ts";
import {
  handleMouseMove,
  handleTouchEndOrCancel,
  handleTouchMove,
  handleTouchStart,
  suppressNextClick,
  touchAction,
} from "../lib/utils/map/touch.ts";
import {
  BusesLayer,
  BusPopup,
  RouteLayer,
  StopPopup,
  StopsLayer,
} from "./layers";

// Map events
export type Handler = (arg0: MapGeoJSONFeature) => void;
export type HandlerRegistry = Record<string, Handler>;

export const mapClickHandlers: HandlerRegistry = {};
export const mapSecondaryClickHandlers: HandlerRegistry = {};

// Map loaders
type MapLoader = (arg0: MapLibreEvent) => void;
export const mapLoadedHandlers: MapLoader[] = [];

const loadBusIcon = (event: MapLibreEvent) => {
  const map = event.target;

  const imageUrl = "/assets/img/bus.png";

  map.loadImage(imageUrl).then((image) => {
    if (!map.hasImage("bus-icon")) {
      map.addImage("bus-icon", image.data);
    }
  });
};

const goToUserLocation = (map: MapRef, longitude: number, latitude: number) => {
  if (latitude && longitude) {
    map.flyTo({
      center: [longitude, latitude],
      zoom: 15,
    });
  }
};

const MapSignal = signal<MapRef | null>(null);
const IsCenterOnUser = signal<boolean>(false);

export default function MapContainer() {
  const location = useGeolocation();

  const handleMapLoad = (event: MapLibreEvent) => {
    for (const handler of mapLoadedHandlers) {
      handler(event);
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (suppressNextClick.value) {
      suppressNextClick.value = false;
      return;
    }

    handleMapMouseEvent(event, mapClickHandlers);
  };

  const handleMapSecondaryClick = (event: MapLayerMouseEvent) => {
    handleMapMouseEvent(event, mapSecondaryClickHandlers);
  };

  // Go to user location after map load
  useEffect(() => {
    if (!MapSignal.value || !location.latitude || !location.longitude || IsCenterOnUser.value) return;
    goToUserLocation(MapSignal.value, location.longitude, location.latitude);
    IsCenterOnUser.value = true;
  }, [location.latitude, location.longitude]);

  // Register map loaders
  mapLoadedHandlers.push(loadBusIcon);

  touchAction.value = handleMapSecondaryClick;

  return (
    <MapLibre
      ref={(instance) => {
        if (instance) MapSignal.value = instance;
      }}
      initialViewState={{
        longitude: 16.63,
        latitude: 50.71,
        zoom: 13,
      }}
      style={{ width: "100vw", height: "100vh" }}
      onMouseMove={handleMouseMove}
      onClick={handleMapClick}
      onContextMenu={handleMapSecondaryClick}
      onLoad={handleMapLoad}
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
        <Layer id="osm-layer" type="raster" />
      </Source>

      <StopsLayer />

      <BusesLayer />

      <RouteLayer />

      <StopPopup />

      <BusPopup />
    </MapLibre>
  );
}
