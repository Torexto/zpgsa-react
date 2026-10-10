import { useEffect, useState } from "react";

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => setViewportHeight(viewport.height);

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return viewportHeight;
}
