"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Box, Glow, Plate, front, type Box3, type Vec3 } from "react-isokit";
import "./partner-object-figure.css";

const LAPTOP_BASE = { x: -59, y: -26, z: 0, w: 118, d: 78, h: 6 } satisfies Box3;
const LAPTOP_LID = { x: LAPTOP_BASE.x, y: LAPTOP_BASE.y, z: LAPTOP_BASE.h, w: LAPTOP_BASE.w, d: 5, h: 84 } satisfies Box3;
const BILLBOARD = { x: -60, y: -4, z: 34, w: 120, d: 8, h: 72 } satisfies Box3;
const LAMP_ARM = { x: -2, y: -1, z: 106, w: 4, d: 14, h: 5 } satisfies Box3;
const LAMP_HOUSING = { x: -9, y: 9, z: 108, w: 18, d: 8, h: 4 } satisfies Box3;
const LAPTOP_FIT = [LAPTOP_BASE, LAPTOP_LID, [LAPTOP_LID.x, LAPTOP_LID.y + LAPTOP_LID.d, LAPTOP_LID.z + LAPTOP_LID.h + 22], [LAPTOP_LID.x + LAPTOP_LID.w, LAPTOP_LID.y + LAPTOP_LID.d, LAPTOP_LID.z + LAPTOP_LID.h + 22]] satisfies (Box3 | Vec3)[];
const BILLBOARD_FIT = [BILLBOARD, LAMP_ARM, LAMP_HOUSING, [-64, 12, 0], [64, 12, 0]] satisfies (Box3 | Vec3)[];

function ProductPreview() {
  return (
    <g className="object-preview">
      <rect className="object-preview-sheet ik-live" x={6} y={6} width={106} height={70} />
      <g className="object-interface object-interface-first">
        <rect className="object-accent" x={12} y={12} width={31} height={38} />
        <path className="object-white-line" d="m17 40 7-12 6 6 8-15" />
      </g>
      <g className="object-interface object-interface-second">
        <rect className="object-soft" x={50} y={12} width={55} height={10} />
        <rect className="object-detail-fill" x={50} y={30} width={35} height={3} />
        <rect className="object-detail-fill" x={50} y={40} width={48} height={2} />
      </g>
      <g className="object-interface object-interface-third">
        <rect className="object-soft" x={12} y={58} width={59} height={11} />
        <rect className="object-accent" x={81} y={57} width={24} height={13} />
      </g>
    </g>
  );
}

function Laptop() {
  return (
    <g aria-hidden="true">
      <Box {...LAPTOP_LID} r={1} front={<rect className="object-screen ik-live" x={6} y={6} width={106} height={70} />} />
      <Box {...LAPTOP_BASE} r={1} top={
        <>
          <rect className="object-keyboard" x={10} y={15} width={98} height={33} />
          {[0, 1, 2].map((row) => (
            <g key={row}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((column) => (
                <rect className="object-key" key={column} x={13 + column * 9.5} y={18 + row * 9} width={7} height={6} />
              ))}
            </g>
          ))}
          <rect className="object-key" x={40} y={53} width={38} height={16} />
        </>
      } />
      <g transform={front(LAPTOP_LID.x, LAPTOP_LID.y + LAPTOP_LID.d, LAPTOP_LID.z + LAPTOP_LID.h)}><ProductPreview /></g>
    </g>
  );
}

function ProjectPoster() {
  return (
    <>
      <rect className="object-preview-sheet" width={110} height={62} />
      <rect className="object-accent" x={6} y={6} width={48} height={50} />
      <path className="object-white-block" d="M6 48 41 6h13v14L24 56H6Z" />
      <rect className="object-soft" x={62} y={7} width={40} height={13} />
      <path className="object-chart" d="M63 51V33m12 18V26m12 25V39m12 12V23M60 54h44" />
    </>
  );
}

function Billboard({ playing }: { playing: boolean }) {
  const beamId = useId();
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--object-lamp)" stopOpacity={0.38} />
          <stop offset="100%" stopColor="var(--object-lamp)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[-44, 38].map((x) => (
        <g key={x}>
          <Box x={x - 8} y={-10} z={0} w={22} d={22} h={3} r={1} />
          <Box x={x} y={-2} z={3} w={6} d={6} h={35} r={0.5} />
        </g>
      ))}
      <Box {...BILLBOARD} r={1} front={
        <g transform="translate(5 5)">
          <svg width={110} height={62} viewBox="0 0 110 62" overflow="hidden">
            <rect className="object-screen" width={110} height={62} />
            <g className="object-poster-slide">
              <ProjectPoster />
            </g>
            <path className="object-lamp-beam" d="M38 0h8l53 62H1Z" fill={`url(#${beamId})`} />
          </svg>
          <rect className="object-poster-border ik-live" width={110} height={62} />
        </g>
      } />
      <Box {...LAMP_ARM} r={0.4} />
      <Box {...LAMP_HOUSING} r={0.5} front={
        <>
          <rect className="object-lamp-off" x={3} y={2} width={12} height={1.5} />
          <g className="object-lamp-light">
            <Glow on={playing}>
              <rect className="object-lamp-emitter" x={3} y={2} width={12} height={1.5} />
            </Glow>
          </g>
        </>
      } />
    </g>
  );
}

export function PartnerObjectFigure({ variant }: { variant: "laptop" | "billboard" }) {
  const [play, setPlay] = useState(0);
  const control = useRef<SVGGElement>(null);
  const replay = useCallback(() => setPlay((current) => current + 1), []);

  useEffect(() => {
    const card = control.current?.closest("article");
    if (!card) return;
    card.addEventListener("pointerenter", replay);
    card.addEventListener("click", replay);
    return () => {
      card.removeEventListener("pointerenter", replay);
      card.removeEventListener("click", replay);
    };
  }, [replay]);

  return (
    <Plate
      className="partner-object-figure"
      label={variant === "laptop" ? "An angular laptop with a floating product preview" : "An isometric project poster with an overhead lamp"}
      fit={variant === "laptop" ? LAPTOP_FIT : BILLBOARD_FIT}
      aspect={1.65}
      pad={0.035}
      credit={false}
      data-variant={variant}
      data-play={play}
    >
      <g
        ref={control}
        className="partner-object-control"
        role="button"
        tabIndex={0}
        aria-label={variant === "laptop" ? "Play product demo" : "Reveal project poster"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!event.repeat) replay();
          }
        }}
      >
        <g key={play} data-playing={play > 0}>
          {variant === "laptop" ? <Laptop /> : <Billboard playing={play > 0} />}
        </g>
        <rect className="object-focus-ring" x={-110} y={variant === "laptop" ? -108 : -116} width={220} height={150} rx={4} />
        <rect className="object-hit-area" x={-114} y={-120} width={228} height={166} />
      </g>
    </Plate>
  );
}
