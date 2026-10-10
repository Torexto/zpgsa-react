import type { Signal } from "@preact/signals-react";
import { Check, Palette, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { MapStyle } from "@/features/map/types.ts";

const mapStyles = [
  { id: "liberty", name: "Liberty", description: "Klasyczny i czytelny" },
  { id: "fiord", name: "Fiord", description: "Chłodne, spokojne kolory" },
  { id: "dark", name: "Dark", description: "Na wieczorne podróże" },
  { id: "positron", name: "Positron", description: "Prosty i minimalistyczny" },
  { id: "bright", name: "Bright", description: "Jasny i kolorowy" },
] satisfies { id: MapStyle; name: string; description: string }[];

interface MapStylePickerProps {
  isOpen: Signal<boolean>;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
}

export function MapStylePicker({
  isOpen,
  mapStyle,
  onMapStyleChange,
}: MapStylePickerProps) {
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
              data-selected={mapStyle === style.id}
            >
              <input
                type="radio"
                name={panelId}
                value={style.id}
                checked={mapStyle === style.id}
                onChange={() => onMapStyleChange(style.id)}
                onClick={(event) => {
                  if (event.detail > 0) isOpen.value = false;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onMapStyleChange(style.id);
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
                {mapStyle === style.id && <Check size={14} strokeWidth={3} />}
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
