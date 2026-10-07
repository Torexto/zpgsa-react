import type {
  MapGeoJSONFeature,
  MapLayerMouseEvent,
} from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";
import { handleCluster } from "./cluster.ts";
import { getMarker } from "./marker.ts";

export type Handler = (arg0: MapGeoJSONFeature) => void;
export type HandlerRegistry = Record<string, Handler>;
export type MapLoader = (arg0: MapLibreEvent) => void;

export const handleMapMouseEvent = (
  event: MapLayerMouseEvent,
  handlers: HandlerRegistry,
) => {
  const clickedFeature = getMarker(event);
  if (!clickedFeature) return;

  if (clickedFeature.properties?.cluster) {
    handleCluster(clickedFeature, event);
    return;
  }

  const layerId = clickedFeature.layer.id;

  console.log(layerId);

  const handler = handlers[layerId];

  console.log(handler);

  if (handler) {
    handler(clickedFeature);
  }
};
