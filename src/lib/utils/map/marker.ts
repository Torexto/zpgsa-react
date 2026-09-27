import type { MapLayerMouseEvent } from "@vis.gl/react-maplibre";

export function getMarker(event: MapLayerMouseEvent) {
  const layers = event.target
    .getLayersOrder()
    .filter((layer) => layer.includes("background"));

  const features = event.target.queryRenderedFeatures(event.point, {
    layers,
  });

  if (!features.length) return;

  return features[0];
}
