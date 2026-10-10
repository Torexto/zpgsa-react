import type { Signal } from "@preact/signals-react";
import { Check, Palette, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { mapStyle } from "@/features/map/components/MapContainer.tsx";
import type { MapStyle } from "@/features/map/types.ts";

export const mapStyles: MapStyle[] = [
  {
    id: "liberty",
    name: "Liberty",
    description: "Klasyczny i czytelny",
    theme: "light",
  },
  {
    id: "fiord",
    name: "Fiord",
    description: "Chłodne, spokojne kolory",
    theme: "dark",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Na wieczorne podróże",
    theme: "dark",
  },
  {
    id: "positron",
    name: "Positron",
    description: "Prosty i minimalistyczny",
    theme: "light",
  },
  {
    id: "bright",
    name: "Bright",
    description: "Jasny i kolorowy",
    theme: "light",
  },
];

interface MapStylePickerProps {
  isOpen: Signal<boolean>;
}

export function MapStylePicker({ isOpen }: MapStylePickerProps) {
  const panelId = useId();
  const headingId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (!isOpen.value) return;

    optionsRef.current
      ?.querySelector<HTMLInputElement>("input:checked")
      ?.focus({ preventScroll: true });

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        isOpen.value = false;
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        isOpen.value = false;
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return (
    <div className="map-style-picker" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="map-style-picker__trigger"
        aria-label="Zmień motyw mapy"
        title="Zmień motyw mapy"
        aria-expanded={isOpen.value}
        aria-controls={panelId}
        aria-haspopup="dialog"
        inert={isOpen.value}
        onClick={() => (isOpen.value = true)}
      >
        <Palette aria-hidden="true" />
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-labelledby={headingId}
        aria-hidden={!isOpen.value}
        inert={!isOpen.value}
        className="map-style-picker__panel"
      >
        <div className="map-style-picker__header">
          <h2 id={headingId}>Motyw mapy</h2>
          <button
            type="button"
            className="map-style-picker__close"
            aria-label="Zamknij wybór motywu"
            onClick={() => (isOpen.value = false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <fieldset ref={optionsRef} className="map-style-picker__options">
          <legend className="sr-only">Motyw mapy</legend>
          {mapStyles.map((style) => (
            <label
              key={style.id}
              className="map-style-picker__option"
              data-selected={mapStyle.value.id === style.id}
            >
              <input
                type="radio"
                name={panelId}
                value={style.id}
                checked={mapStyle.value.id === style.id}
                onChange={() => (mapStyle.value = style)}
                onClick={(event) => {
                  if (event.detail > 0) isOpen.value = false;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    mapStyle.value = style;
                    isOpen.value = false;
                  }
                }}
              />
              <span
                aria-hidden="true"
                className="map-style-picker__swatch"
                data-map-style={style.id}
              />
              <span className="map-style-picker__label">
                <span>{style.name}</span>
                <span className="map-style-picker__description">
                  {style.description}
                </span>
              </span>
              <span className="map-style-picker__check" aria-hidden="true">
                {mapStyle.value.id === style.id && (
                  <Check size={14} strokeWidth={3} />
                )}
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
