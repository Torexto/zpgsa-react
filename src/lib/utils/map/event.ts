import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";
import type { HandlerRegistry } from "../../../map/MapContainer.tsx";
import { handleCluster } from "./cluster.ts";
import { getMarker } from "./marker.ts";

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
