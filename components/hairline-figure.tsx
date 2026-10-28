"use client";

import { useEffect, useRef } from "react";
import type { HairlineVariant } from "@/lib/hairline/runtime";
import "./hairline-figure.css";

type HairlineFigureProps = {
  variant: HairlineVariant;
  className?: string;
};

export function HairlineFigure({ variant, className }: HairlineFigureProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;

    let cancelled = false;
    let destroy: (() => void) | undefined;

    void import("@/lib/hairline/runtime").then(({ mountHairline }) => {
      if (cancelled) return;
      destroy = mountHairline({ variant, stage, svg }).destroy;
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [variant]);

  return (
    <div
      ref={stageRef}
      className={className ? `hairline-figure ${className}` : "hairline-figure"}
      data-hairline-figure={variant}
      aria-hidden="true"
    >
      <svg ref={svgRef} viewBox="0 0 400 320" focusable="false" />
    </div>
  );
}
