import { signal } from "@preact/signals-react";
import type {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
} from "@vis.gl/react-maplibre";
import { getMarker } from "./marker.ts";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

const longPressStart = signal<{ x: number; y: number } | null>(null);
const longPressTimer = signal<number | null>(null);
export const suppressNextClick = signal<boolean>(false);
export const touchAction = signal<((arg0: MapLayerMouseEvent) => void) | null>(
  null,
);

const cancelLongPress = () => {
  if (longPressTimer.value !== null) {
    window.clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  longPressStart.value = null;
};

// useEffect(() => cancelLongPress, [cancelLongPress]);

const triggerContextMenuAction = (event: MapLayerTouchEvent) => {
  cancelLongPress();
  suppressNextClick.value = true;
  event.preventDefault();
  if (!touchAction.value) return;
  touchAction.value(event as unknown as MapLayerMouseEvent);
};

export const handleTouchStart = (event: MapLayerTouchEvent) => {
  const feature = getMarker(event as unknown as MapLayerMouseEvent);
  if (!feature) return;

  const touch = event.originalEvent.touches[0];
  if (!touch) return;

  cancelLongPress();
  longPressStart.value = { x: touch.clientX, y: touch.clientY };
  longPressTimer.value = window.setTimeout(
    () => triggerContextMenuAction(event),
    LONG_PRESS_MS,
  );
};

export const handleTouchMove = (event: MapLayerTouchEvent) => {
  if (longPressTimer.value === null) return;

  const start = longPressStart.value;
  const touch = event.originalEvent.touches[0];
  if (!start || !touch) return;

  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_PX ** 2) {
    cancelLongPress();
  }
};

export const handleTouchEndOrCancel = () => {
  cancelLongPress();
};

export const handleMouseMove = (event: MapLayerMouseEvent) => {
  const layers = event.target.getLayersOrder();

  const features = event.target.queryRenderedFeatures(event.point, {
    layers,
  });
  event.target.getCanvas().style.cursor = features.length ? "pointer" : "";
};
