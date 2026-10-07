import type { MapRef } from "@vis.gl/react-maplibre";
import type { MapLibreEvent } from "maplibre-gl";

export const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10000,
};

export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error("Geolokalizacja nie jest wspierana w tej przeglądarce."),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      geolocationOptions,
    );
  });
};

export const flyToCurrentPosition = async (
  map: MapRef | MapLibreEvent["target"] | null,
) => {
  await getCurrentLocation()
    .then((position) => {
      map?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 15,
      });
    })
    .catch((error) => {
      console.error("Błąd podczas pobierania lokalizacji:", error);
    });
};
