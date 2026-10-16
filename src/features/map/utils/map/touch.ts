import type {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
} from "@vis.gl/react-maplibre";
import { useCallback, useEffect, useRef } from "react";
import { getMarker } from "./marker.ts";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;
const DEDUPE_MS = 300;

export function useLongPress(onLongPress: (event: MapLayerMouseEvent) => void) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const lastFiredAt = useRef(0);

  const onLongPressRef = useRef(onLongPress);
  useEffect(() => {
    onLongPressRef.current = onLongPress;
  });

  const fire = useCallback((event: MapLayerMouseEvent) => {
    const now = Date.now();
    if (now - lastFiredAt.current < DEDUPE_MS) return;
    lastFiredAt.current = now;
    onLongPressRef.current(event);
  }, []);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  // Don't fire after unmounting
  useEffect(() => cancel, [cancel]);

  const onTouchStart = useCallback(
    (event: MapLayerTouchEvent) => {
      if (!getMarker(event as unknown as MapLayerMouseEvent)) return;

      const touch = event.originalEvent.touches[0];
      if (!touch) return;

      cancel();
      start.current = { x: touch.clientX, y: touch.clientY };
      timer.current = window.setTimeout(() => {
        cancel();
        event.preventDefault();
        fire(event as unknown as MapLayerMouseEvent);
      }, LONG_PRESS_MS);
    },
    [cancel, fire],
  );

  const onTouchMove = useCallback(
    (event: MapLayerTouchEvent) => {
      if (timer.current === null || !start.current) return;

      const touch = event.originalEvent.touches[0];
      if (!touch) return;

      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_PX ** 2) cancel();
    },
    [cancel],
  );

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onContextMenu: fire,
  };
}

// Stateless, so it stays a plain function
export const handleMouseMove = (event: MapLayerMouseEvent) => {
  const layers = event.target.getLayersOrder();
  const features = event.target.queryRenderedFeatures(event.point, { layers });
  event.target.getCanvas().style.cursor = features.length ? "pointer" : "";
};
