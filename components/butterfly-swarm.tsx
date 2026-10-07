"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createSwarm } from "@/components/butterfly-swarm-engine";

const COMPACT_QUERY = "(max-width: 767px)";
const FULL_COUNT = 240;
const FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, monospace";
// The hero's content column (title down to the signup form) in the canvas's clip space; the
// helix bends around it.
const FOCUS = { y: -0.12, halfWidth: 0.62, halfHeight: 0.85 };

function subscribeToCompact(onChange: () => void) {
  const query = window.matchMedia(COMPACT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function ButterflySwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Phones get half the swarm, drawn lighter since the content there spans the full width.
  const compact = useSyncExternalStore(
    subscribeToCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  );
  const count = compact ? FULL_COUNT / 2 : FULL_COUNT;

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>("[data-hero-section]");
    if (!canvas || !hero) return;
    const theme = getComputedStyle(canvas);
    const swarm = createSwarm(canvas, {
      count,
      fontFamily: FONT_FAMILY,
      pointerTarget: hero,
      ink: theme.getPropertyValue("--foreground"),
      accent: theme.getPropertyValue("--highlight-color"),
      opacity: compact ? 0.3 : 0.45,
      focus: FOCUS,
    });
    return swarm.dispose;
  }, [compact, count]);

  return (
    <div className="butterfly-swarm" aria-hidden="true">
      <canvas ref={canvasRef} className="butterfly-swarm-canvas" />
    </div>
  );
}
