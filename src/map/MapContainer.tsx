import MapLibre, {
  Layer,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  Popup,
  Source,
} from "@vis.gl/react-maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

import { useQuery } from "@tanstack/react-query";
import type { MapLibreEvent } from "maplibre-gl";
import { Suspense, useCallback, useState } from "react";
import filterStopDetails from "./filterStopDetails.ts";
import BusesLayer from "./layers/BusesLayer.tsx";
import StopsLayer from "./layers/StopsLayer.tsx";
import type { Bus, Stop, StopInfoBus } from "./types.ts";

export const layers = ["stops-marker-background", "buses-marker-background"];

function StopPopup({
  stop,
  onClose,
  buses,
}: {
  stop: Stop;
  onClose: () => void;
  buses: StopInfoBus[];
}) {
  const filteredStopInfoBus = filterStopDetails(buses);

  return (
    <Popup
      longitude={stop.lon}
      latitude={stop.lat}
      anchor="bottom"
      offset={15}
      onClose={onClose}
    >
      <div className="text-center font-bold text-[16px] pb-2">
        {stop.city} {stop.name} ({stop.id})
      </div>
      <div className="divide-y divide-white/20">
        {filteredStopInfoBus.map((bus, i) => (
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

function BusPopup({ bus, onClose }: { bus: Bus; onClose: () => void }) {
  return (
    <Popup
      longitude={bus.lon}
      latitude={bus.lat}
      anchor="bottom"
      offset={15}
      onClose={onClose}
    >
      <div>
        <div>
          Linia {bus.line} | {bus.label}
        </div>
        <div>{bus.destination}</div>
        <div>Odchyłka: {bus.deviation}</div>
      </div>
    </Popup>
  );
}

export default function MapContainer() {
  const [stopPopup, setStopPopup] = useState<Stop | null>(null);
  const [busPopup, setBusPopup] = useState<Bus | null>(null);

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
    setBusPopup(bus);
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const activeLayers = layers.filter(
      (layerId) => event.target.getLayer(layerId) !== undefined,
    );

    if (!activeLayers.length) return;

    const features = event.target.queryRenderedFeatures(event.point, {
      layers,
    });

    if (!features.length) return;

    const clickedFeature = features[0];
    const layerId = clickedFeature.layer.id;

    if (clickedFeature.properties?.cluster) {
      handleCluster(clickedFeature, event);
      return;
    }

    if (layerId === "stops-marker-background") {
      handleStop(clickedFeature);
    } else if (layerId === "buses-marker-background") {
      handleBus(clickedFeature);
    }
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
        const activeLayers = layers.filter(
          (layerId) => e.target.getLayer(layerId) !== undefined,
        );

        if (!activeLayers.length) return;

        const features = e.target.queryRenderedFeatures(e.point, {
          layers,
        });
        e.target.getCanvas().style.cursor = features.length ? "pointer" : "";
      }}
      onClick={handleMapClick}
      onContextMenu={handleMapClick}
      onLoad={handleMapLoad}
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

      <Suspense fallback={null}>
        <StopsLayer />
      </Suspense>

      <Suspense fallback={null}>
        <BusesLayer />
      </Suspense>

      {stopPopup && (
        <StopPopup
          stop={stopPopup}
          onClose={() => setStopPopup(null)}
          buses={!isPending && !error ? stopInfoData[stopPopup.id] : []}
        />
      )}

      {busPopup && (
        <BusPopup bus={busPopup} onClose={() => setBusPopup(null)} />
      )}
    </MapLibre>
  );
}
