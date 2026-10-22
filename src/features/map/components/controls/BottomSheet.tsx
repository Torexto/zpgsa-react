import { useSignal } from "@preact/signals-react";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";
import { useWindowSize } from "react-use";

interface BottomSheetProps {
  children: ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  open?: boolean;
}

export function BottomSheet({
  children,
  defaultHeight = 320,
  minHeight = 100,
  maxHeight = 850,
  open = false,
}: BottomSheetProps) {
  const { height: screenHeight } = useWindowSize();

  maxHeight = Math.min(maxHeight, screenHeight);

  const height = useSignal(defaultHeight);
  const expanded = useSignal(open);

  const dragStart = useRef({
    y: 0,
    height: 0,
    pointerId: -1,
  });

  const dragging = useRef(false);

  const clamp = (value: number) =>
    Math.min(maxHeight, Math.max(minHeight, value));

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);

    dragging.current = true;
    dragStart.current = {
      y: event.clientY,
      height: height.value,
      pointerId: event.pointerId,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;

    const delta = dragStart.current.y - event.clientY;
    height.value = clamp(dragStart.current.height + delta);
  }

  function onPointerUp() {
    if (!dragging.current) return;

    dragging.current = false;

    const currentHeight = clamp(height.value);
    const points = [minHeight, Math.min(320, maxHeight), maxHeight];

    const nearest = points.reduce((prev, next) =>
      Math.abs(next - currentHeight) < Math.abs(prev - currentHeight)
        ? next
        : prev,
    );

    height.value = nearest;
    expanded.value = nearest === maxHeight;
  }

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col
        overflow-hidden rounded-t-2xl border border-white/10
        bg-gray-900/95 text-gray-100 shadow-2xl
        backdrop-blur-xl transition-transform duration-200 ease-out"
      style={{
        height: `min(${height}px, 100dvh)`,
        transition: dragging.current
          ? "none"
          : "height 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex shrink-0 cursor-grab touch-none flex-col
          items-center gap-3 px-4 pb-3 pt-3"
      >
        <div
          className="h-1.5 w-10 rounded-full bg-white/30
          transition-colors hover:bg-white/50"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {children}
      </div>
    </section>
  );
}
