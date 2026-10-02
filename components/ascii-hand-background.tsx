"use client";

import { useEffect, useRef } from "react";

const GLYPHS = [".", ":", "+", "*", "#", "@"];

export function AsciiHandBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    const position = positionRef.current;
    const wings = [leftRef.current, rightRef.current];
    const hero = background?.closest<HTMLElement>("[data-hero-section]");
    if (!background || !position || !hero || wings.some((wing) => !wing)) return;

    let disposed = false;
    let frame = 0;
    let visible = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      background.dataset.animating = String(visible && !document.hidden && !motion.matches);
      if (motion.matches) position.style.transform = "none";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    });
    observer.observe(background);
    document.addEventListener("visibilitychange", updateMotion);
    motion.addEventListener("change", updateMotion);

    // Rasterize once. Wing motion only transforms these two cached layers.
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) return;
      const sample = document.createElement("canvas");
      sample.width = 420;
      sample.height = 256;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, image.naturalWidth * 0.04, image.naturalHeight * 0.24,
        image.naturalWidth * 0.92, image.naturalHeight * 0.56, 0, 0, 420, 256);
      const pixels = context.getImageData(0, 0, 420, 256).data;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      wings.forEach((wing, side) => {
        if (!wing) return;
        wing.width = 210 * ratio;
        wing.height = 256 * ratio;
        const ink = wing.getContext("2d");
        if (!ink) return;
        ink.scale(ratio, ratio);
        ink.font = "3px ui-monospace, monospace";
        ink.textAlign = "center";
        ink.textBaseline = "middle";
        for (let y = 0; y < 256; y += 2) {
          for (let x = side * 210; x < (side + 1) * 210; x += 2) {
            const pixel = (y * 420 + x) * 4;
            if ((pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3 <= 205) continue;
            const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            const variation = value - Math.floor(value);
            ink.fillStyle = variation > 0.74 ? "rgba(0,87,255,0.26)" : "rgba(0,0,0,0.1)";
            ink.fillText(GLYPHS[Math.floor(variation * GLYPHS.length)], x - side * 210, y);
          }
        }
      });
    };
    image.src = "/butterfly-particle-mask.png";

    const move = (event: PointerEvent) => {
      if (motion.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = background.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 24;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16;
        position.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      position.style.transform = "none";
    };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerdown", move, { passive: true });
    hero.addEventListener("pointerleave", reset);
    hero.addEventListener("pointerup", reset);
    hero.addEventListener("pointercancel", reset);

    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateMotion);
      motion.removeEventListener("change", updateMotion);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerdown", move);
      hero.removeEventListener("pointerleave", reset);
      hero.removeEventListener("pointerup", reset);
      hero.removeEventListener("pointercancel", reset);
    };
  }, []);

  return (
    <div ref={backgroundRef} className="butterfly-background" aria-hidden="true">
      <div ref={positionRef} className="butterfly-position">
        <canvas ref={leftRef} className="butterfly-wing butterfly-wing-left" />
        <canvas ref={rightRef} className="butterfly-wing butterfly-wing-right" />
      </div>
    </div>
  );
}
