import { useSignal } from "@preact/signals-react";
import { Compass, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { SearchModal } from "@/features/map/components/controls/Search.tsx";
import { mapSignal } from "@/features/map/components/MapContainer.tsx";
import type { MapStyle } from "@/features/map/types.ts";
import { flyToCurrentPosition } from "@/features/map/utils/map/geolocation.ts";
import { MapStylePicker } from "./MapStylePicker.tsx";
import "../../assets/controls.css";

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  label: string;
}

export function Button({ onClick, children, label }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="map-control-button"
    >
      {children}
    </button>
  );
}

export function MapControls({
  mapStyle,
  onMapStyleChange,
}: {
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
}) {
  const isSearchModalOpen = useSignal(false);
  const isStylePickerOpen = useSignal(false);

  return (
    <>
      {isSearchModalOpen.value && (
        <SearchModal
          map={mapSignal.value}
          isSearchModalOpen={isSearchModalOpen}
        />
      )}
      <div
        className="map-controls"
        data-style-picker-open={isStylePickerOpen.value}
      >
        <MapStylePicker
          isOpen={isStylePickerOpen}
          mapStyle={mapStyle}
          onMapStyleChange={onMapStyleChange}
        />

        <div
          className="map-controls__secondary"
          inert={isStylePickerOpen.value}
        >
          <Button
            label="Moja lokalizacja"
            onClick={() => flyToCurrentPosition(mapSignal.value)}
          >
            <Compass aria-hidden="true" />
          </Button>
          <Button
            label="Znajdź przystanek"
            onClick={() => (isSearchModalOpen.value = true)}
          >
            <Search aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}
