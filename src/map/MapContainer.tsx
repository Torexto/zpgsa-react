import { useQuery } from "@tanstack/react-query";
import MapLibre, {
  Layer,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
  Source,
} from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import filterStopDetails from "./filterStopDetails.ts";
import {
  BusesLayer,
  BusPopup,
  getBusesQueryOptions,
  RouteLayer,
  StopPopup,
  StopsLayer,
} from "./layers";
import type { Bus, Stop, StopInfoBus } from "./types.ts";

const clickableLayers = ["stops-marker-background", "buses-marker-background"];

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

export default function MapContainer() {
  const [stopPopup, setStopPopup] = useState<Stop | null>(null);
  const [busPopupId, setBusPopupId] = useState<string | null>(null);
  const [routeBusId, setRouteBusId] = useState<string | null>(null);

  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  const { data: busesData } = useQuery(getBusesQueryOptions());
  const busPopup = busesData?.find((bus) => bus.id === busPopupId) ?? null;
  const routeBus =
    (routeBusId && busesData?.find((bus) => bus.id === routeBusId)) || null;

  const {
    data: stopInfoData,
    isPending,
    error,
  } = useQuery<Record<string, StopInfoBus[]>>({
    queryKey: ["stops-info"],
    queryFn: () =>
      fetch("/assets/data/stop_details.json").then((r) => r.json()),
  });

  const handleMapLoad = useCallback((event: MapLibreEvent) => {
    const map = event.target;

    const imageUrl = "/assets/img/bus.png";

    map.loadImage(imageUrl).then((image) => {
      map.addImage("bus-icon", image.data);
    });
  }, []);

  const handleCluster = (
    feature: MapGeoJSONFeature,
    event: MapLayerMouseEvent,
  ) => {
    const coordinates = feature.geometry.coordinates;
    const zoom = event.target.getZoom();

    event.target.easeTo({
      center: coordinates,
      zoom: zoom + 2,
      duration: 400,
    });
  };

  const handleStop = (feature: MapGeoJSONFeature) => {
    const stop = feature.properties as Stop;
    setStopPopup(stop);
  };

  const handleBus = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    setBusPopupId(bus.id);
  };

  const handleStopContextMenu = (feature: MapGeoJSONFeature) => {
    const stop = feature.properties as Stop;
    window.open(stop.href);
  };

  const handleBusContextMenu = (feature: MapGeoJSONFeature) => {
    const bus = feature.properties as Bus;
    setRouteBusId((current) => (current === bus.id ? null : bus.id));
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

    if (layerId === "stops-marker-background") {
      handleStop(clickedFeature);
    } else if (layerId === "buses-marker-background") {
      handleBus(clickedFeature);
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

    if (layerId === "stops-marker-background") {
      handleStopContextMenu(clickedFeature);
    } else if (layerId === "buses-marker-background") {
      handleBusContextMenu(clickedFeature);
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

  // Clear any pending long-press timer on unmount.
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

  return (
    <MapLibre
      initialViewState={{
        longitude: 16.63,
        latitude: 50.71,
        zoom: 13,
      }}
      style={{ width: "100vw", height: "100vh" }}
      onMouseMove={(e) => {
        const activeLayers = clickableLayers.filter(
          (layerId) => e.target.getLayer(layerId) !== undefined,
        );

        if (!activeLayers.length) return;

        const features = e.target.queryRenderedFeatures(e.point, {
          layers: clickableLayers,
        });
        e.target.getCanvas().style.cursor = features.length ? "pointer" : "";
      }}
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

      <Suspense fallback={null}>
        <RouteLayer bus={routeBus} />
      </Suspense>

      {stopPopup && (
        <StopPopup
          stop={stopPopup}
          onClose={() => setStopPopup(null)}
          buses={
            !isPending && !error
              ? filterStopDetails(stopInfoData[stopPopup.id])
              : []
          }
        />
      )}

      {busPopup && (
        <BusPopup bus={busPopup} onClose={() => setBusPopupId(null)} />
      )}
    </MapLibre>
  );
}
