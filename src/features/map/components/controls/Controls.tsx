import { Compass } from "lucide-react";
import type * as React from "react";
import { mapSignal } from "@/features/map/components/MapContainer.tsx";
import { flyToCurrentPosition } from "@/features/map/utils/map/geolocation.ts";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-16 h-16 bg-gray-700 flex items-center justify-center text-gray-300 rounded-3xl cursor-pointer"
    >
      {children}
    </button>
  );
}

export function MapControls() {
  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-3">
      <Button onClick={() => flyToCurrentPosition(mapSignal.value)}>
        <Compass />
      </Button>

      {/*<Button onClick={() => alert("Już niedługo")}>*/}
      {/*  <Search />*/}
      {/*</Button>*/}
    </div>
  );
}
