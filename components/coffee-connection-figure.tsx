"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Plate, front, project, side, type Box3, type Vec3 } from "react-isokit";
import "./coffee-connection-figure.css";

const MUG = { x: -22, y: -22, z: 8, w: 44, d: 44, h: 32 } satisfies Box3;
const SAUCER = { x: -31, y: -31, z: 0, w: 62, d: 62, h: 3 } satisfies Box3;
const LEFT = project(-23.2, 23.2, 0);
const RIGHT = project(23.2, -23.2, 0);
const FIT = [
  [-71, 71, 0],
  [71, -71, 0],
  [0, 0, 99],
  [40, 40, 0],
] satisfies Vec3[];

function Mug({ position }: { position: "left" | "right" }) {
  return (
    <g className={`coffee-mug coffee-mug-${position}`} aria-hidden="true">
      <g transform={position === "left" ? front(-22, 22, 32) : side(22, 22, 32)}>
        <path
          className="coffee-handle"
          fillRule="evenodd"
          d={position === "left"
            ? "M-14 0H7V24H-14ZM-8 6V18H1V6Z"
            : "M37 0H58V24H37ZM43 6V18H52V6Z"}
        />
      </g>
      <Box
        {...MUG}
        r={1.5}
        top={
          <>
            <rect className={`coffee-rim ${position === "left" ? "ik-live" : ""}`} x={3} y={3} width={38} height={38} rx={1} />
            <rect className="coffee-surface" x={6} y={6} width={32} height={32} rx={0.5} />
            <g className="coffee-ripples">
              <rect x={15} y={15} width={14} height={14} rx={0.5} />
              <rect x={12} y={12} width={20} height={20} rx={0.5} />
            </g>
          </>
        }
      />
      <g className="coffee-steam">
        <path d="M-8 -62C-14 -69 -2 -73 -8 -81" />
        <path d="M8 -59C2 -67 14 -71 8 -79" />
      </g>
    </g>
  );
}

export function CoffeeConnectionFigure() {
  const [play, setPlay] = useState(0);
  const control = useRef<SVGGElement>(null);
  const replay = useCallback(() => setPlay((current) => current + 1), []);

  useEffect(() => {
    const card = control.current?.closest("article");
    if (!card) return;
    card.addEventListener("pointerenter", replay);
    return () => card.removeEventListener("pointerenter", replay);
  }, [replay]);

  return (
    <Plate
      className="coffee-connection-figure"
      label="Two angular coffee cups touching on square saucers"
      fit={FIT}
      aspect={1.65}
      pad={0.035}
      credit={false}
      data-play={play}
    >
      <g
        ref={control}
        className="coffee-connection-control"
        role="button"
        tabIndex={0}
        aria-label="Clink coffee cups"
        onClick={replay}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!event.repeat) replay();
          }
        }}
      >
        <g transform={`translate(${RIGHT[0]} ${RIGHT[1]})`}><Box {...SAUCER} r={2} /></g>
        <g transform={`translate(${LEFT[0]} ${LEFT[1]})`}><Box {...SAUCER} r={2} /></g>
        <g key={play} className="coffee-scene" data-playing={play > 0}>
          <g transform={`translate(${RIGHT[0]} ${RIGHT[1]})`}><Mug position="right" /></g>
          <g transform={`translate(${LEFT[0]} ${LEFT[1]})`}><Mug position="left" /></g>
          <path className="coffee-clink-mark" d="M0 -48V-55M-8 -47L-12 -52M8 -47L12 -52" aria-hidden="true" />
        </g>
        <rect className="coffee-focus-ring" x={-101} y={-90} width={202} height={127} rx={4} />
        <rect className="coffee-hit-area" x={-104} y={-94} width={208} height={135} />
      </g>
    </Plate>
  );
}
