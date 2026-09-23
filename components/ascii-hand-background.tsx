"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 60;
const GLYPHS = [".", ":", "+", "*", "#", "@"];

type PointSource = {
  points: Uint16Array;
  width: number;
  height: number;
};

type Placement = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function AsciiHandBackground() {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const storyCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const staticCanvas = staticCanvasRef.current;
    const storyCanvas = storyCanvasRef.current;
    const staticContext = staticCanvas?.getContext("2d");
    const storyContext = storyCanvas?.getContext("2d");
    const heroSection = document.querySelector<HTMLElement>("[data-hero-section]");
    const storySection = document.querySelector<HTMLElement>("[data-story-section]");
    const impactSection = document.querySelector<HTMLElement>("[data-impact-section]");
    if (!staticCanvas || !storyCanvas || !staticContext || !storyContext || !heroSection || !storySection || !impactSection) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames: Array<PointSource | null> = Array(FRAME_COUNT).fill(null);
    let staticSource: PointSource | null = null;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    let baseWidth = 1;
    let baseHeight = 1;
    let pixelRatio = 1;
    let requestedFrame = 0;
    let renderRequest = 0;
    let idleTimer = 0;
    let idlePhase = 0;
    let pointerX = -1000;
    let pointerY = -1000;
    let staticPlacement: Placement = { x: 0, y: 62, scale: 1, opacity: 1 };
    let storyPlacement: Placement = { x: 12, y: 100, scale: 0.6, opacity: 0 };

    const seed = (x: number, y: number) => {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    const scheduleRender = () => {
      cancelAnimationFrame(renderRequest);
      renderRequest = requestAnimationFrame(() => render(true));
    };

    const readPlacements = () => {
      const heroRect = heroSection.getBoundingClientRect();
      const rect = storySection.getBoundingClientRect();
      const impactRect = impactSection.getBoundingClientRect();
      const enter = reducedMotion
        ? Number(rect.top <= viewportHeight * 0.55)
        : clamp((viewportHeight * 0.9 - rect.top) / (viewportHeight * 0.35));
      const remain = reducedMotion
        ? Number(rect.bottom > viewportHeight * 0.2)
        : clamp((rect.bottom - viewportHeight * 0.15) / (viewportHeight * 0.35));
      const storyOpacity = enter * remain;
      const heroVisibility = clamp(heroRect.bottom / (viewportHeight * 0.35));
      const impactVisibility = clamp((viewportHeight - impactRect.top) / (viewportHeight * 0.35))
        * clamp(impactRect.bottom / (viewportHeight * 0.35));
      const staticOpacity = Math.max(heroVisibility, impactVisibility) * (1 - storyOpacity);
      const storyDistance = Math.max(1, rect.height - viewportHeight);
      const storyProgress = reducedMotion ? 0 : clamp(-rect.top / storyDistance);
      const heroX = (viewportWidth - baseWidth) / 2;
      const dockedWidth = viewportWidth >= 768
        ? Math.min(viewportWidth * 0.48, 590)
        : baseWidth * 0.78;

      staticPlacement = {
        x: heroX,
        y: 62,
        scale: 1,
        opacity: staticOpacity,
      };
      storyPlacement = {
        x: viewportWidth >= 768 ? 12 : (viewportWidth - dockedWidth) / 2,
        y: viewportWidth >= 768 ? viewportHeight * 0.18 : viewportHeight * 0.12,
        scale: dockedWidth / baseWidth,
        opacity: storyOpacity,
      };
      requestedFrame = Math.round(storyProgress * (FRAME_COUNT - 1));
    };

    const drawLayer = (
      canvas: HTMLCanvasElement,
      context: CanvasRenderingContext2D,
      source: PointSource | null,
      placement: Placement,
    ) => {
      context.clearRect(0, 0, baseWidth, baseHeight);
      canvas.style.opacity = String(placement.opacity);
      canvas.style.transform = `translate3d(${placement.x}px, ${placement.y}px, 0) scale(${placement.scale})`;
      if (!source || placement.opacity <= 0) return;

      const fitScale = Math.min(baseWidth / source.width, baseHeight / source.height);
      const drawWidth = source.width * fitScale;
      const drawHeight = source.height * fitScale;
      const offsetX = (baseWidth - drawWidth) / 2;
      const offsetY = (baseHeight - drawHeight) / 2;
      const localPointerX = (pointerX - placement.x) / placement.scale;
      const localPointerY = (pointerY - placement.y) / placement.scale;
      const pointerRadius = 110 / Math.max(placement.scale, 0.2);

      context.font = "7px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";

      for (let index = 0; index < source.points.length; index += 2) {
        const sourceX = source.points[index];
        const sourceY = source.points[index + 1];
        let x = offsetX + sourceX * fitScale;
        let y = offsetY + sourceY * fitScale;
        if (!reducedMotion) {
          const horizontalWave = Math.sin(
            idlePhase + sourceY * 0.065 + sourceX * 0.012,
          );
          const verticalWave = Math.sin(
            idlePhase * 0.82 + sourceX * 0.055,
          );
          x += horizontalWave * 3.25;
          y += verticalWave * 2.25 + horizontalWave * 0.7;
        }
        const dx = x - localPointerX;
        const dy = y - localPointerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!reducedMotion && distance < pointerRadius && distance > 0.1) {
          const force = (1 - distance / pointerRadius) * 42;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }

        const variation = seed(sourceX, sourceY);
        context.globalAlpha = variation > 0.74 ? 0.2 : 0.075;
        context.fillStyle = variation > 0.74 ? "#0057ff" : "#000000";
        context.fillText(
          GLYPHS[Math.floor(variation * GLYPHS.length) % GLYPHS.length],
          x,
          y,
        );
      }
      context.globalAlpha = 1;
    };

    const render = (measurePlacements = false) => {
      if (measurePlacements) readPlacements();
      const storySource = frames[requestedFrame] ?? frames.find(Boolean) ?? null;
      drawLayer(staticCanvas, staticContext, staticSource, staticPlacement);
      drawLayer(storyCanvas, storyContext, storySource, storyPlacement);
    };

    const renderIdleMotion = () => {
      if (document.hidden || reducedMotion) return;
      if (staticPlacement.opacity <= 0 && storyPlacement.opacity <= 0) return;
      idlePhase += 0.14;
      render();
    };

    const configureCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      canvas.width = Math.round(baseWidth * pixelRatio);
      canvas.height = Math.round(baseHeight * pixelRatio);
      canvas.style.width = `${baseWidth}px`;
      canvas.style.height = `${baseHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      baseWidth = Math.min(viewportWidth * 0.78, 980);
      baseHeight = Math.min(viewportHeight * 0.72, 700);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      configureCanvas(staticCanvas, staticContext);
      configureCanvas(storyCanvas, storyContext);
      scheduleRender();
    };

    const readPoints = (sample: HTMLCanvasElement, threshold: number, density: number, step = 3): PointSource => {
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) return { points: new Uint16Array(), width: sample.width, height: sample.height };
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const coordinates: number[] = [];
      for (let y = 0; y < sample.height; y += step) {
        for (let x = 0; x < sample.width; x += step) {
          const pixel = (y * sample.width + x) * 4;
          const brightness = (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3;
          if (brightness > threshold && seed(x, y) > density) coordinates.push(x, y);
        }
      }
      return { points: Uint16Array.from(coordinates), width: sample.width, height: sample.height };
    };

    const loadFrame = (index: number) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const sample = document.createElement("canvas");
        const sampleContext = sample.getContext("2d");
        if (!sampleContext) return;
        sample.width = image.naturalWidth;
        sample.height = image.naturalHeight;
        sampleContext.drawImage(image, 0, 0);
        frames[index] = readPoints(sample, 110, 0.1);
        if (index === requestedFrame) scheduleRender();
      };
      image.src = `/butterfly-frames/${String(index).padStart(2, "0")}.webp`;
    };

    const loadStaticMask = () => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const sample = document.createElement("canvas");
        const sampleContext = sample.getContext("2d");
        if (!sampleContext) return;
        const sourceX = Math.round(image.naturalWidth * 0.04);
        const sourceY = Math.round(image.naturalHeight * 0.24);
        const sourceWidth = Math.round(image.naturalWidth * 0.92);
        const sourceHeight = Math.round(image.naturalHeight * 0.56);
        sample.width = 420;
        sample.height = Math.round(sample.width * (sourceHeight / sourceWidth));
        sampleContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sample.width, sample.height);
        staticSource = readPoints(sample, 205, 0.01, 2);
        scheduleRender();
      };
      image.src = "/butterfly-particle-mask.png";
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleRender();
    };

    const handlePointerLeave = () => {
      pointerX = -1000;
      pointerY = -1000;
      scheduleRender();
    };

    resize();
    loadStaticMask();
    for (let index = 0; index < FRAME_COUNT; index += 1) loadFrame(index);
    window.addEventListener("scroll", scheduleRender, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    if (!reducedMotion) idleTimer = window.setInterval(renderIdleMotion, 80);

    return () => {
      cancelAnimationFrame(renderRequest);
      window.clearInterval(idleTimer);
      window.removeEventListener("scroll", scheduleRender);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  const canvasClass = "pointer-events-none fixed left-0 top-0 z-0 origin-top-left will-change-transform";
  return (
    <>
      <canvas
        ref={staticCanvasRef}
        aria-hidden="true"
        className={canvasClass}
      />
      <canvas
        ref={storyCanvasRef}
        aria-hidden="true"
        className={canvasClass}
      />
    </>
  );
}
