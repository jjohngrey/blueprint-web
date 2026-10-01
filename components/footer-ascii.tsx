"use client";

import { useEffect, useRef } from "react";

const GLYPHS = [".", ":", "+", "*", "#", "@", "8", "x"];

export function FooterAscii() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const footer = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !footer || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let points = new Uint16Array();
    let sourceWidth = 1;
    let sourceHeight = 1;
    let width = 1;
    let height = 1;
    let pointerX = -1000;
    let pointerY = -1000;
    let frame = 0;

    const random = (x: number, y: number) => {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    const render = () => {
      context.clearRect(0, 0, width, height);
      if (!points.length) return;

      const availableWidth = Math.max(1, Math.min(width - 48, 1256));
      const availableHeight = Math.max(1, height - 96);
      const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
      const offsetX = (width - sourceWidth * scale) / 2;
      const offsetY = height - sourceHeight * scale;
      const radius = 90;
      context.font = "7px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#0057ff";

      for (let index = 0; index < points.length; index += 2) {
        const sourceX = points[index];
        const sourceY = points[index + 1];
        let x = offsetX + sourceX * scale;
        let y = offsetY + sourceY * scale;
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (!reducedMotion && distance < radius && distance > 0.1) {
          const force = (1 - distance / radius) * 38;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }
        const variation = random(sourceX, sourceY);
        context.globalAlpha = 0.16 + variation * 0.18;
        context.fillText(GLYPHS[Math.floor(variation * GLYPHS.length)], x, y);
      }
      context.globalAlpha = 1;
    };

    const scheduleRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };

    const resize = () => {
      const bounds = footer.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      scheduleRender();
    };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const sample = document.createElement("canvas");
      const sampleContext = sample.getContext("2d", { willReadFrequently: true });
      if (!sampleContext) return;
      sample.width = 560;
      sample.height = Math.round(sample.width * image.naturalHeight / image.naturalWidth);
      sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
      const coordinates: number[] = [];
      for (let y = 0; y < sample.height; y += 3) {
        for (let x = 0; x < sample.width; x += 3) {
          const pixel = (y * sample.width + x) * 4;
          const brightness = (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3;
          if (brightness > 34 && random(x, y) > 0.2) coordinates.push(x, y);
        }
      }
      sourceWidth = sample.width;
      sourceHeight = sample.height;
      points = Uint16Array.from(coordinates);
      scheduleRender();
    };
    image.src = "/footer-ascii-mask.svg";

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const bounds = canvas.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      scheduleRender();
    };
    const handlePointerLeave = () => {
      pointerX = -1000;
      pointerY = -1000;
      scheduleRender();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(footer);
    footer.addEventListener("pointermove", handlePointerMove, { passive: true });
    footer.addEventListener("pointerleave", handlePointerLeave);
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      footer.removeEventListener("pointermove", handlePointerMove);
      footer.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="footer-ascii-canvas" aria-hidden="true" />;
}
