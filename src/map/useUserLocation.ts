import { useEffect, useState } from "react";

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

export default function useUserLocation() {
  const [position, setPosition] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;

    let active = true;

    // Let the browser decide whether location is available for this origin.
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!active) return;
          setPosition({
            longitude: coords.longitude,
            latitude: coords.latitude,
          });
        },
        () => undefined,
        LOCATION_OPTIONS,
      );
    } catch {
      active = false;
    }

    return () => {
      // Ignore callbacks after unmount or StrictMode's effect cleanup.
      active = false;
    };
  }, []);

  return position;
}
