import type { MapRef } from "@vis.gl/react-maplibre";
import { Compass, MapPin } from "lucide-react";
import type * as React from "react";
import { useGeolocation } from "react-use";
import { goToUserLocation } from "./MapContainer.tsx";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-10 h-10 bg-gray-700 flex items-center justify-center text-gray-300 rounded-xl cursor-pointer"
    >
      {children}
    </button>
  );
}

interface MapControlsProps {
  map: MapRef | null;
}

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10000,
};

export function MapControls({ map }: MapControlsProps) {
  const geolocation = useGeolocation(geolocationOptions);

  if (!map) return null;

  const navigateToUserLocationHandler = () => {
    if (!geolocation.latitude || !geolocation.longitude) return;
    goToUserLocation(map, geolocation.longitude, geolocation.latitude);
  };
  const locateHandler = () => {
    alert(`${geolocation.latitude}, ${geolocation.longitude}`);
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-3">
      <Button onClick={navigateToUserLocationHandler}>
        <Compass />
      </Button>

      <Button onClick={locateHandler}>
        <MapPin />
      </Button>
    </div>
  );
}
