import { useSignal } from "@preact/signals-react";
import { Compass, Search } from "lucide-react";
import type { ReactNode } from "react";
import { SearchModal } from "@/features/map/components/controls/Search.tsx";
import { flyToCurrentPosition } from "@/features/map/utils/map/geolocation.ts";
import { MapStylePicker } from "./MapStylePicker.tsx";
import "../../assets/controls.css";
import type { MapRef } from "@vis.gl/react-maplibre";

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

export function MapControls({ mapRef }: { mapRef: MapRef | null }) {
  const isSearchModalOpen = useSignal(false);
  const isStylePickerOpen = useSignal(false);

  return (
    <>
      {isSearchModalOpen.value && (
        <SearchModal map={mapRef} isSearchModalOpen={isSearchModalOpen} />
      )}
      <div
        className="map-controls"
        data-style-picker-open={isStylePickerOpen.value}
      >
        <MapStylePicker isOpen={isStylePickerOpen} />

        <div
          className="map-controls__secondary"
          inert={isStylePickerOpen.value}
        >
          <Button
            label="Moja lokalizacja"
            onClick={() => flyToCurrentPosition(mapRef)}
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
