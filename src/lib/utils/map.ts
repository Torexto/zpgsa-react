import type {
  MapGeoJSONFeature,
  MapLayerMouseEvent,
} from "@vis.gl/react-maplibre";

export const handleCluster = (
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
