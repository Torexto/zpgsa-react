import { useQuery } from "@tanstack/react-query";
import MapLibre, {
  Layer,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
  type MapRef,
  Source,
} from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import { useCallback, useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { signal } from "@preact/signals-react";
import { useGeolocation } from "react-use";
import { getBusesQueryOptions, getStopInfoOptions } from "../lib/api.ts";
import { handleCluster } from "../lib/utils/map.ts";
import filterStopDetails from "./filterStopDetails.ts";
import {
  BusesLayer,
  BusPopup,
  RouteLayer,
  StopPopup,
  StopsLayer,
} from "./layers";
import type { Bus, Stop } from "./types.ts";

const clickableLayers = ["stops-marker-background", "buses-marker-background"];

// Map events
type Handler = (arg0: MapGeoJSONFeature) => void;
type HandlerRegistry = Record<string, Handler>;

export const mapClickHandlers: HandlerRegistry = {};
export const mapContextMenuHandlers: HandlerRegistry = {};

// Map loaders
type MapLoader = (arg0: MapLibreEvent) => void;
export const mapLoadedHandlers: MapLoader[] = [];

function getMarker(event: MapLayerMouseEvent) {
  const activeLayers = clickableLayers.filter(
    (layerId) => event.target.getLayer(layerId) !== undefined,
  );
  if (!activeLayers.length) return;

  const features = event.target.queryRenderedFeatures(event.point, {
    layers: clickableLayers,
  });
  if (!features.length) return;

  return features[0];
}

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
      zoom: 13,
    });
  }
};

const MapSignal = signal<MapRef | null>(null);

export const currentStop = signal<Stop | null>(null);
export const currentBusId = signal<string | null>(null);
export const currentRouteBusId = signal<string | null>(null);

export default function MapContainer() {
  const location = useGeolocation();

  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  const { data: busesData } = useQuery(getBusesQueryOptions());
  const busPopup =
    busesData?.find((bus) => bus.id === currentBusId.value) ?? null;
  const routeBus =
    (currentRouteBusId.value &&
      busesData?.find((bus) => bus.id === currentRouteBusId.value)) ||
    null;

  const {
    data: stopInfoData,
    isPending,
    error,
  } = useQuery(getStopInfoOptions());

  const handleStop = (feature: MapGeoJSONFeature) => {
    currentStop.value = feature.properties as Stop;
  };

  const handleBus = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    currentBusId.value = bus.id;
  };

  const handleStopContextMenu = (feature: MapGeoJSONFeature) => {
    const stop = feature.properties as Stop;
    window.open(stop.href);
  };

  const handleBusContextMenu = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    currentRouteBusId.value =
      currentRouteBusId.value !== bus.id ? bus.id : null;
  };

  const handleMapLoad = (event: MapLibreEvent) => {
    for (const handler of mapLoadedHandlers) {
      handler(event);
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    const clickedFeature = getMarker(event);
    if (!clickedFeature) return;

    if (clickedFeature.properties?.cluster) {
      handleCluster(clickedFeature, event);
      return;
    }

    const layerId = clickedFeature.layer.id;

    const handler = mapClickHandlers[layerId];

    if (handler) {
      handler(clickedFeature);
    }
  };

  const handleMapContextMenu = (event: MapLayerMouseEvent) => {
    const clickedFeature = getMarker(event);
    if (!clickedFeature) return;

    if (clickedFeature.properties?.cluster) {
      handleCluster(clickedFeature, event);
      return;
    }

    const layerId = clickedFeature.layer.id;

    const handler = mapContextMenuHandlers[layerId];

    if (handler) {
      handler(clickedFeature);
    }
  };

  const LONG_PRESS_MS = 500;
  const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  }, []);

  useEffect(() => cancelLongPress, [cancelLongPress]);

  const triggerContextMenuAction = (event: MapLayerTouchEvent) => {
    cancelLongPress();
    suppressNextClickRef.current = true;
    event.preventDefault();
    handleMapContextMenu(event as unknown as MapLayerMouseEvent);
  };

  const handleTouchStart = (event: MapLayerTouchEvent) => {
    const feature = getMarker(event as unknown as MapLayerMouseEvent);
    if (!feature) return;

    const touch = event.originalEvent.touches[0];
    if (!touch) return;

    cancelLongPress();
    longPressStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = window.setTimeout(
      () => triggerContextMenuAction(event),
      LONG_PRESS_MS,
    );
  };

  const handleTouchMove = (event: MapLayerTouchEvent) => {
    if (longPressTimerRef.current === null) return;

    const start = longPressStartRef.current;
    const touch = event.originalEvent.touches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_PX ** 2) {
      cancelLongPress();
    }
  };

  const handleTouchEndOrCancel = () => {
    cancelLongPress();
  };

  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const activeLayers = clickableLayers.filter(
      (layerId) => e.target.getLayer(layerId) !== undefined,
    );

    if (!activeLayers.length) return;

    const features = e.target.queryRenderedFeatures(e.point, {
      layers: activeLayers,
    });
    e.target.getCanvas().style.cursor = features.length ? "pointer" : "";
  };

  // Go to user location after map load
  useEffect(() => {
    if (!MapSignal.value || !location.latitude || !location.longitude) return;
    goToUserLocation(MapSignal.value, location.longitude, location.latitude);
  }, [location.latitude, location.longitude]);

  // Register event handlers
  mapClickHandlers["stops-marker-background"] = handleStop;
  mapClickHandlers["buses-marker-background"] = handleBus;

  mapContextMenuHandlers["stops-marker-background"] = handleStopContextMenu;
  mapContextMenuHandlers["buses-marker-background"] = handleBusContextMenu;

  // Register map loaders
  mapLoadedHandlers.push(loadBusIcon);

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
      onContextMenu={handleMapContextMenu}
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

      <RouteLayer bus={routeBus} />

      {currentStop.value && (
        <StopPopup
          stop={currentStop.value}
          onClose={() => (currentStop.value = null)}
          buses={
            !isPending && !error && stopInfoData
              ? filterStopDetails(stopInfoData[currentStop.value.id] ?? [])
              : []
          }
        />
      )}

      {busPopup && (
        <BusPopup bus={busPopup} onClose={() => (currentBusId.value = null)} />
      )}
    </MapLibre>
  );
}
