import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  NearestFilter,
  NoColorSpace,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";

export type SwarmOptions = {
  count: number;
  /** CSS font-family for the glyphs; a monospace face. */
  fontFamily: string;
  /** Element whose pointer movement disturbs the swarm. */
  pointerTarget: HTMLElement;
  /** CSS colours: glyph ink, and the lead butterfly's accent. */
  ink: string;
  accent: string;
  /** Opacity of the ink; the lead is always drawn at full strength. */
  opacity: number;
  /** Area kept clear for the page's content, in clip space (-1 to 1, y up). */
  focus: { y: number; halfWidth: number; halfHeight: number };
};

const RAMP = [..." .·:-=+*#%@"];
// Glyph size sets the ASCII resolution: smaller glyphs, finer butterflies.
const FONT_SIZE = 8;
const LINE_HEIGHT = 9;
// Scene texels averaged into each glyph cell (roughly square for a monospace cell).
const SAMPLES_X = 4;
const SAMPLES_Y = 7;
const MAX_PIXEL_RATIO = 1.5;

const FOV = 35;
const CAMERA_Z = 16;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);

// A double helix that winds 1.3 times around the content on the way up.
const STRANDS = 2;
const TURNS = 1.3;
// The helix axis leans clockwise on screen, top to the right.
const TILT = Math.PI / 6;
// Helix extent in multiples of the visible half-height at z = 0. Both ends sit far enough out
// that, even leaning, a butterfly has left the frame before it is recycled.
const HELIX_BOTTOM = -1.35;
const HELIX_TOP = 1.75;
const ASCENT_SECONDS = 16;
const LEAD_ASCENT_SECONDS = 28;
const STRAND_PULL = 3;
const FLOW_SCALE = 0.28;
const FLOW_STRENGTH = 0.5;

const POINTER_RADIUS = 140;
const NEIGHBOR_RADIUS = 1.5;
const HOP_FALLOFF = 0.72;
const SPREAD_RATE = 7;
const CALM_RATE = 1.6;
const HASH_SIZE = 1024;

// Each wing quad runs from the body axis (x = 0) to the wing tip (x = 1), tail to head along y.
const WING_TAIL = -0.8;
const WING_HEAD = 1;
const WING_SPAN_SEGMENTS = 8;
const WING_CHORD_SEGMENTS = 10;
// Drawing styles in the wing texture: 0 is a line drawing, 1 a tonal fill.
const WING_STYLES = 2;
const WING_TEXELS = 256;

const wingVertexShader = /* glsl */ `
  attribute vec3 aFlap; // frequency, phase, phase gained while startled
  attribute vec3 aLook; // fade, lead, drawing style
  uniform float uTime;
  varying vec2 vWing;
  varying float vShade;
  varying float vLead;
  varying float vStyle;

  const float DOWNSTROKE = 0.4; // share of each beat spent on the quicker downstroke

  // Where the wing is in its beat (1 raised, 0 lowered) and how fast it is moving, normalised so
  // the downstroke peaks at -1. Both strokes ease in and out, so wings hang at each end and snap
  // through the middle.
  vec2 beat(float phase) {
    float t = fract(phase / 6.2831853);
    bool down = t < DOWNSTROKE;
    float x = down ? t / DOWNSTROKE : (t - DOWNSTROKE) / (1.0 - DOWNSTROKE);
    float eased = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    float rate = 16.0 * x * x * (1.0 - x) * (1.0 - x);
    return down ? vec2(1.0 - eased, -rate) : vec2(eased, rate * DOWNSTROKE / (1.0 - DOWNSTROKE));
  }

  void main() {
    float side = sign(position.x);
    float span = abs(position.x);
    // The hindwing trails the forewing, so each wing twists through the beat.
    float trail = 0.6 * smoothstep(0.25, -0.45, position.y);
    vec2 stroke = beat(uTime * aFlap.x + aFlap.y + aFlap.z - trail);
    float root = mix(-0.25, 1.25, stroke.x);
    // The wing bends against its own motion, so the tip lags the root: an arc of constant
    // curvature that follows the stroke, over a slight resting cup.
    float curl = 0.2 - 1.1 * stroke.y;
    float bend = 0.5 * curl * span;
    float chord = span * (abs(bend) < 1e-4 ? 1.0 : sin(bend) / bend);
    float angle = root + 2.0 * bend;
    vec3 local = vec3(side * chord * cos(root + bend), position.y, chord * sin(root + bend));
    vec3 wingNormal = vec3(-side * sin(angle), 0.0, cos(angle));

    mat4 modelView = modelViewMatrix * instanceMatrix;
    vec4 viewPosition = modelView * vec4(local, 1.0);
    vec3 viewNormal = normalize(mat3(modelView) * wingNormal);
    float facing = abs(dot(viewNormal, normalize(-viewPosition.xyz)));
    float haze = 1.0 - 0.7 * smoothstep(12.0, 28.0, -viewPosition.z);
    // Anything that projects small fades toward dust, whether it is small or just far away.
    float apparentSize = length(instanceMatrix[0].xyz) / max(-viewPosition.z, 1.0);
    float presence = mix(0.4, 1.0, smoothstep(0.006, 0.03, apparentSize));

    vShade = (0.55 + 0.45 * facing) * haze * presence * aLook.x;
    vLead = aLook.y;
    vStyle = aLook.z;
    vWing = vec2(span, position.y);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const wingFragmentShader = /* glsl */ `
  uniform sampler2D uWings;
  varying vec2 vWing;
  varying float vShade;
  varying float vLead;
  varying float vStyle;

  void main() {
    // Red is the drawing's tone, green its coverage; one column per style.
    vec2 uv = vec2((vWing.x + vStyle) / WING_STYLES, (vWing.y - WING_TAIL) / (WING_HEAD - WING_TAIL));
    vec2 wing = texture2D(uWings, uv).rg;
    if (wing.g < 0.5) discard;

    float level = wing.r * vShade;
    gl_FragColor = vec4(level, level * vLead, 0.0, 1.0);
  }
`;

const fullscreenVertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Reduces the scene to one value set per glyph cell: mean luminance (r), mean lead
// luminance (g) and peak luminance (b), which keeps thin outlines from washing out.
const cellFragmentShader = /* glsl */ `
  uniform sampler2D uScene;

  void main() {
    ivec2 origin = ivec2(gl_FragCoord.xy) * ivec2(SAMPLES_X, SAMPLES_Y);
    vec2 sum = vec2(0.0);
    float peak = 0.0;
    for (int y = 0; y < SAMPLES_Y; y++) {
      for (int x = 0; x < SAMPLES_X; x++) {
        vec2 texel = texelFetch(uScene, origin + ivec2(x, y), 0).rg;
        sum += texel;
        peak = max(peak, texel.r);
      }
    }
    gl_FragColor = vec4(sum / float(SAMPLES_X * SAMPLES_Y), peak, 1.0);
  }
`;

const asciiFragmentShader = /* glsl */ `
  uniform sampler2D uCells;
  uniform sampler2D uGlyphs;
  uniform vec2 uCell;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uOpacity;

  void main() {
    ivec2 size = ivec2(uCell);
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    ivec2 cell = pixel / size;
    vec3 data = texelFetch(uCells, cell, 0).rgb;

    // Peaks sharpen outlines in well-covered cells without promoting distant specks.
    float level = max(data.r, data.b * min(1.0, data.r * 4.0) * 0.85);
    float glyph = level < 0.04 ? 0.0 : min(ceil(pow(level, 0.8) * GLYPH_STEPS), GLYPH_STEPS);
    float ink = texelFetch(uGlyphs, ivec2(int(glyph) * size.x, 0) + pixel - cell * size, 0).r;
    float lead = step(0.5, data.g / max(data.r, 0.001));

    // Premultiplied, so the canvas composites straight over the page.
    float alpha = ink * mix(uOpacity, 1.0, lead);
    gl_FragColor = vec4(mix(uInk, uAccent, lead) * alpha, alpha);
  }
`;

export function createSwarm(canvas: HTMLCanvasElement, options: SwarmOptions) {
  const { count, fontFamily, pointerTarget, focus } = options;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  } catch {
    return { dispose() {} };
  }
  renderer.setClearColor(0x000000, 0);
  // Climb progress level with the focus area; strands are phased to be at its sides there.
  const focusProgress = (focus.y - HELIX_BOTTOM) / (HELIX_TOP - HELIX_BOTTOM);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  const geometry = createWingGeometry();
  const flap = new InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage);
  const look = new InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage);
  geometry.setAttribute("aFlap", flap);
  geometry.setAttribute("aLook", look);
  const wings = createWingTexture(renderer.capabilities.getMaxAnisotropy());
  const wingMaterial = new ShaderMaterial({
    vertexShader: wingVertexShader,
    fragmentShader: wingFragmentShader,
    defines: {
      WING_STYLES: `(${WING_STYLES.toFixed(1)})`,
      WING_TAIL: `(${WING_TAIL.toFixed(1)})`,
      WING_HEAD: `(${WING_HEAD.toFixed(1)})`,
    },
    uniforms: { uTime: { value: 0 }, uWings: { value: wings } },
    side: DoubleSide,
  });
  const swarm = new InstancedMesh(geometry, wingMaterial, count);
  swarm.instanceMatrix.setUsage(DynamicDrawUsage);
  swarm.frustumCulled = false;
  const scene = new Scene();
  scene.add(swarm);

  const sceneTarget = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter });
  const cellTarget = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: false });
  const cellMaterial = new ShaderMaterial({
    vertexShader: fullscreenVertexShader,
    fragmentShader: cellFragmentShader,
    defines: { SAMPLES_X, SAMPLES_Y },
    uniforms: { uScene: { value: sceneTarget.texture } },
    depthTest: false,
    depthWrite: false,
  });
  const asciiMaterial = new ShaderMaterial({
    vertexShader: fullscreenVertexShader,
    fragmentShader: asciiFragmentShader,
    defines: { GLYPH_STEPS: `${RAMP.length - 1}.0` },
    uniforms: {
      uCells: { value: cellTarget.texture },
      uGlyphs: { value: null },
      uCell: { value: new Vector2(1, 1) },
      uInk: { value: parseColor(options.ink) },
      uAccent: { value: parseColor(options.accent) },
      uOpacity: { value: options.opacity },
    },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), cellMaterial);
  quad.frustumCulled = false;
  const quadScene = new Scene();
  quadScene.add(quad);
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Per-butterfly state. Index 0 is the lead: it climbs the outer edge of the first strand more
  // slowly than the rest and never fades.
  const position = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);
  const heading = new Float32Array(count * 3);
  const progress = new Float32Array(count);
  const pace = new Float32Array(count);
  const spin = new Float32Array(count);
  const reach = new Float32Array(count);
  const lift = new Float32Array(count);
  const bank = new Float32Array(count);
  const size = new Float32Array(count);
  const alarm = new Float32Array(count);
  const push = new Float32Array(count * 3);
  const incoming = new Float32Array(count);
  const incomingFrom = new Float32Array(count * 3);
  const heads = new Int32Array(HASH_SIZE);
  const next = new Int32Array(count);

  const target = new Vector3();
  const ahead = new Vector3();
  const flow = new Vector3();
  const pointer = { x: 0, y: 0, active: false };
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 1;
  let height = 1;
  let ratio = 1;
  let aspect = 1;
  let radiusX = 6;
  let radiusZ = 6;
  let bottom = -6;
  let top = 6;
  let tiltCos = 1;
  let tiltSin = 0;
  let sway = 0;
  let atlas: CanvasTexture | null = null;
  let atlasRatio = 0;
  let cellWidth = 1;
  let cellHeight = 1;
  let time = 0;
  let last = 0;
  let frame = 0;
  let visible = false;
  let ready = false;
  let populated = false;
  let disposed = false;

  const halfHeightAt = (z: number) => (CAMERA_Z - z) * TAN_HALF_FOV;

  // Pushes points sideways out of the focus area so the content stays legible.
  const clearFocus = (x: number, y: number, z: number) => {
    const halfHeight = halfHeightAt(z);
    const band = (y / halfHeight - focus.y) / focus.halfHeight;
    if (band * band >= 1 || halfHeight < 0.5) return x;
    const clearance = focus.halfWidth * halfHeight * aspect * Math.sqrt(1 - band * band);
    const distance = Math.abs(x);
    const cleared = (distance + clearance + Math.hypot(distance - clearance, clearance * 0.5)) / 2;
    return x + (Math.tanh(x / 0.35) * cleared - x) * (1 - band * band);
  };

  // A point on the butterfly's strand: a funnel that opens out from the bottom, leaning clockwise.
  const helix = (index: number, u: number, out: Vector3) => {
    const angle = spin[index] + u * TURNS * Math.PI * 2 + sway;
    const widening = 0.12 + 0.88 * smoothstep(0, 0.5, u);
    const x = Math.cos(angle) * radiusX * reach[index] * widening;
    const y = bottom + (top - bottom) * u + lift[index];
    const z = Math.sin(angle) * radiusZ * reach[index] * widening;
    const leanX = x * tiltCos + y * tiltSin;
    const leanY = y * tiltCos - x * tiltSin;
    return out.set(clearFocus(leanX, leanY, z), leanY, z);
  };

  const setMotion = (index: number, from: Vector3, to: Vector3, seconds: number) => {
    const o = index * 3;
    position[o] = from.x;
    position[o + 1] = from.y;
    position[o + 2] = from.z;
    const vx = (to.x - from.x) / seconds;
    const vy = (to.y - from.y) / seconds;
    const vz = (to.z - from.z) / seconds;
    const length = Math.hypot(vx, vy, vz) || 1;
    velocity[o] = vx;
    velocity[o + 1] = vy;
    velocity[o + 2] = vz;
    heading[o] = vx / length;
    heading[o + 1] = vy / length;
    heading[o + 2] = vz / length;
  };

  const spawn = (index: number, u: number) => {
    const lead = index === 0;
    progress[index] = u;
    pace[index] = 1 / (lead ? LEAD_ASCENT_SECONDS : ASCENT_SECONDS + Math.random() * 3);
    // Strands are phased to pass the focus area at the sides. Each butterfly keeps a fixed offset
    // from its strand's centre line, so the strands read as ribbons rather than lines.
    const strand = (index % STRANDS) / STRANDS;
    spin[index] = (strand - focusProgress * TURNS) * Math.PI * 2 + (lead ? 0 : jitter() * 0.08);
    reach[index] = lead ? 1.04 : 1 + jitter() * 0.08;
    lift[index] = lead ? 0 : jitter() * 0.3;
    // Roll about the body axis: some butterflies show their backs, most are seen side-on or in
    // three-quarter view, like a sheet of specimen drawings.
    bank[index] = lead ? 0.45 : (Math.random() * 2 - 1) * 1.25;
    if (lead) {
      size[index] = 0.5;
      flap.setXYZ(index, 10, 0, 0);
      look.setXYZ(index, 1, 1, 1);
    } else {
      // A few large butterflies, big enough for the drawing to read; the rest are small enough
      // to read as dust at depth.
      size[index] = Math.random() < 0.14 ? 0.42 + Math.random() * 0.2 : 0.07 + Math.random() ** 2 * 0.15;
      // Wingbeats in rad/s: about 1.6 Hz for the largest, up to 2.7 Hz for the smallest.
      flap.setXYZ(index, 10 + (0.62 - size[index]) * 9 + Math.random() * 2, Math.random() * Math.PI * 2, 0);
      look.setXYZ(index, 0, 0, Math.random() < 0.5 ? 0 : 1);
    }
    setMotion(index, helix(index, u, target), helix(index, u + pace[index] * 0.1, ahead), 0.1);
  };

  const populate = () => {
    spawn(0, focusProgress);
    for (let index = 1; index < count; index++) spawn(index, Math.random());
    populated = true;
  };

  const layout = () => {
    const halfHeight = CAMERA_Z * TAN_HALF_FOV;
    radiusX = Math.min(halfHeight * aspect * 0.7, 5.4);
    radiusZ = Math.min(Math.max(radiusX * 1.15, 4), 6.2);
    bottom = halfHeight * HELIX_BOTTOM;
    top = halfHeight * HELIX_TOP;
    // Portrait screens lean less, or the slant would carry the helix out of frame.
    const tilt = TILT * Math.min(1, aspect);
    tiltCos = Math.cos(tilt);
    tiltSin = Math.sin(tilt);
  };

  const buildAtlas = () => {
    const glyphs = document.createElement("canvas");
    const context = glyphs.getContext("2d");
    if (!context) return;
    const font = `${FONT_SIZE * ratio}px ${fontFamily}`;
    context.font = font;
    cellWidth = Math.max(1, Math.round(context.measureText("0").width));
    cellHeight = Math.max(1, Math.round(LINE_HEIGHT * ratio));
    glyphs.width = cellWidth * RAMP.length;
    glyphs.height = cellHeight;
    context.fillStyle = "#000";
    context.fillRect(0, 0, glyphs.width, glyphs.height);
    context.font = font;
    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    RAMP.forEach((glyph, index) => context.fillText(glyph, (index + 0.5) * cellWidth, cellHeight / 2));

    atlas?.dispose();
    atlas = new CanvasTexture(glyphs);
    atlas.minFilter = NearestFilter;
    atlas.magFilter = NearestFilter;
    atlas.generateMipmaps = false;
    atlas.colorSpace = NoColorSpace;
    atlasRatio = ratio;
    asciiMaterial.uniforms.uGlyphs.value = atlas;
    asciiMaterial.uniforms.uCell.value.set(cellWidth, cellHeight);
  };

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    if (!ready) return;
    if (ratio !== atlasRatio) buildAtlas();

    const columns = Math.ceil(Math.floor(width * ratio) / cellWidth);
    const rows = Math.ceil(Math.floor(height * ratio) / cellHeight);
    sceneTarget.setSize(columns * SAMPLES_X, rows * SAMPLES_Y);
    cellTarget.setSize(columns, rows);
    camera.aspect = (columns * cellWidth) / (rows * cellHeight);
    camera.updateProjectionMatrix();
    aspect = camera.aspect;
    layout();
    if (!populated) populate();
    if (!frame) {
      step(0);
      render();
    }
  };

  const render = () => {
    wingMaterial.uniforms.uTime.value = time;
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);
    quad.material = cellMaterial;
    renderer.setRenderTarget(cellTarget);
    renderer.render(quadScene, quadCamera);
    quad.material = asciiMaterial;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCamera);
  };

  const hashCell = (x: number, y: number, z: number) =>
    (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) & (HASH_SIZE - 1);
  const cellOf = (value: number) => Math.floor(value / NEIGHBOR_RADIUS);

  // Startles every butterfly under the cursor, pushing it away from the cursor's line of sight.
  const disturb = () => {
    for (let index = 0; index < count; index++) {
      const o = index * 3;
      const halfHeight = halfHeightAt(position[o + 2]);
      if (halfHeight < 0.2) continue;
      const halfWidth = halfHeight * aspect;
      const screenX = (position[o] / halfWidth * 0.5 + 0.5) * width;
      const screenY = (0.5 - position[o + 1] / halfHeight * 0.5) * height;
      const distance = Math.hypot(screenX - pointer.x, screenY - pointer.y);
      if (distance >= POINTER_RADIUS) continue;
      const strength = 1 - distance / POINTER_RADIUS;
      if (strength <= alarm[index]) continue;
      alarm[index] = strength;
      const dx = position[o] - ((pointer.x / width) * 2 - 1) * halfWidth;
      const dy = position[o + 1] - (1 - (pointer.y / height) * 2) * halfHeight;
      const length = Math.hypot(dx, dy, 0.3) || 1;
      push[o] = dx / length;
      push[o + 1] = dy / length;
      push[o + 2] = 0.3 / length;
    }
  };

  // Alarm hops from each startled butterfly to its neighbours, losing strength with every hop.
  const spread = (dt: number) => {
    heads.fill(-1);
    for (let index = 0; index < count; index++) {
      const o = index * 3;
      const key = hashCell(cellOf(position[o]), cellOf(position[o + 1]), cellOf(position[o + 2]));
      next[index] = heads[key];
      heads[key] = index;
    }

    incoming.fill(0);
    for (let index = 0; index < count; index++) {
      if (alarm[index] < 0.05) continue;
      const o = index * 3;
      const cx = cellOf(position[o]);
      const cy = cellOf(position[o + 1]);
      const cz = cellOf(position[o + 2]);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            for (let other = heads[hashCell(cx + dx, cy + dy, cz + dz)]; other !== -1; other = next[other]) {
              if (other === index) continue;
              const p = other * 3;
              const ox = position[p] - position[o];
              const oy = position[p + 1] - position[o + 1];
              const oz = position[p + 2] - position[o + 2];
              const distance = Math.hypot(ox, oy, oz);
              if (distance >= NEIGHBOR_RADIUS || distance < 1e-4) continue;
              const level = alarm[index] * HOP_FALLOFF * (1 - (0.35 * distance) / NEIGHBOR_RADIUS);
              if (level <= incoming[other]) continue;
              incoming[other] = level;
              incomingFrom[p] = ox / distance;
              incomingFrom[p + 1] = oy / distance;
              incomingFrom[p + 2] = oz / distance;
            }
          }
        }
      }
    }

    const rate = Math.min(1, dt * SPREAD_RATE);
    const calm = Math.exp(-dt * CALM_RATE);
    for (let index = 0; index < count; index++) {
      if (incoming[index] > alarm[index]) {
        const o = index * 3;
        alarm[index] += (incoming[index] - alarm[index]) * rate;
        const px = push[o] + incomingFrom[o];
        const py = push[o + 1] + incomingFrom[o + 1];
        const pz = push[o + 2] + incomingFrom[o + 2];
        const length = Math.hypot(px, py, pz) || 1;
        push[o] = px / length;
        push[o + 1] = py / length;
        push[o + 2] = pz / length;
      }
      alarm[index] *= calm;
    }
  };

  const step = (dt: number) => {
    if (dt > 0) {
      if (pointer.active) disturb();
      spread(dt);
    }
    const follow = 1 - Math.exp(-dt * 2.6);
    const turn = 1 - Math.exp(-dt * 5);
    const matrices = swarm.instanceMatrix.array;
    // The whole helix rocks slowly back and forth so the structure breathes without drifting.
    sway = 0.18 * Math.sin(time * 0.08);

    for (let index = 0; index < count; index++) {
      const o = index * 3;
      progress[index] += dt * pace[index];
      if (progress[index] >= 1) spawn(index, 0);
      const u = progress[index];
      helix(index, u, target);
      helix(index, u + pace[index] * 0.1, ahead);
      // The lead stays lit; the top and bottom of its climb are already out of frame.
      const fade = index === 0 ? 1 : smoothstep(0, 0.08, u) * (1 - smoothstep(0.8, 1, u));

      if (dt > 0) {
        curl(position[o] * FLOW_SCALE, position[o + 1] * FLOW_SCALE, position[o + 2] * FLOW_SCALE + time * 0.08, flow);
        const startle = alarm[index] * 4.5;
        for (let axis = 0; axis < 3; axis++) {
          const goal = target.getComponent(axis);
          const desired = (goal - position[o + axis]) * STRAND_PULL
            + (ahead.getComponent(axis) - goal) / 0.1
            + flow.getComponent(axis) * FLOW_STRENGTH
            + push[o + axis] * startle;
          velocity[o + axis] += (desired - velocity[o + axis]) * follow;
          position[o + axis] += velocity[o + axis] * dt;
        }
        const speed = Math.hypot(velocity[o], velocity[o + 1], velocity[o + 2]);
        if (speed > 0.01) {
          const hx = heading[o] + (velocity[o] / speed - heading[o]) * turn;
          const hy = heading[o + 1] + (velocity[o + 1] / speed - heading[o + 1]) * turn;
          const hz = heading[o + 2] + (velocity[o + 2] / speed - heading[o + 2]) * turn;
          const length = Math.hypot(hx, hy, hz) || 1;
          heading[o] = hx / length;
          heading[o + 1] = hy / length;
          heading[o + 2] = hz / length;
        }
        flap.setZ(index, flap.getZ(index) + dt * flap.getX(index) * alarm[index] * 1.6);
      }
      look.setX(index, fade);

      // Body along the heading, dorsal side turned toward the camera, then rolled by the butterfly's
      // bank plus a gentle sway. The heading's depth component is damped so butterflies crossing the
      // helix's sides don't turn nose-on.
      const flat = Math.hypot(heading[o], heading[o + 1], heading[o + 2] * 0.35) || 1;
      const fx = heading[o] / flat;
      const fy = heading[o + 1] / flat;
      const fz = (heading[o + 2] * 0.35) / flat;
      let rx = fy;
      let ry = -fx;
      let rz = 0;
      let length = Math.hypot(rx, ry);
      if (length < 0.1) {
        rx = 0;
        ry = fz;
        rz = -fy;
        length = Math.hypot(ry, rz) || 1;
      }
      rx /= length;
      ry /= length;
      rz /= length;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;
      const roll = bank[index] + 0.25 * Math.sin(time * 1.1 + flap.getY(index));
      const cos = Math.cos(roll);
      const sin = Math.sin(roll);

      const s = size[index];
      const m = index * 16;
      matrices[m] = (rx * cos + ux * sin) * s;
      matrices[m + 1] = (ry * cos + uy * sin) * s;
      matrices[m + 2] = (rz * cos + uz * sin) * s;
      matrices[m + 3] = 0;
      matrices[m + 4] = fx * s;
      matrices[m + 5] = fy * s;
      matrices[m + 6] = fz * s;
      matrices[m + 7] = 0;
      matrices[m + 8] = (ux * cos - rx * sin) * s;
      matrices[m + 9] = (uy * cos - ry * sin) * s;
      matrices[m + 10] = (uz * cos - rz * sin) * s;
      matrices[m + 11] = 0;
      matrices[m + 12] = position[o];
      matrices[m + 13] = position[o + 1];
      matrices[m + 14] = position[o + 2];
      matrices[m + 15] = 1;
    }
    swarm.instanceMatrix.needsUpdate = true;
    flap.needsUpdate = true;
    look.needsUpdate = true;
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    step(dt);
    render();
  };

  const sync = () => {
    const run = ready && visible && !document.hidden && !motion.matches;
    if (run && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (motion.matches) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  };
  const onPointerEnd = (event: PointerEvent) => {
    if (event.type === "pointerleave" || event.pointerType !== "mouse") pointer.active = false;
  };
  const onMotionChange = () => {
    pointer.active = false;
    sync();
    if (ready && !frame) render();
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const resizeObserver = new ResizeObserver(resize);
  intersection.observe(canvas);
  resizeObserver.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", onMotionChange);
  pointerTarget.addEventListener("pointermove", onPointer, { passive: true });
  pointerTarget.addEventListener("pointerdown", onPointer, { passive: true });
  pointerTarget.addEventListener("pointerleave", onPointerEnd);
  pointerTarget.addEventListener("pointerup", onPointerEnd);
  pointerTarget.addEventListener("pointercancel", onPointerEnd);

  // The atlas needs the font's real metrics, so wait for the face before the first frame.
  document.fonts
    .load(`${FONT_SIZE}px ${fontFamily}`)
    .catch(() => undefined)
    .then(() => {
      if (disposed) return;
      ready = true;
      resize();
      sync();
    });

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", onMotionChange);
      pointerTarget.removeEventListener("pointermove", onPointer);
      pointerTarget.removeEventListener("pointerdown", onPointer);
      pointerTarget.removeEventListener("pointerleave", onPointerEnd);
      pointerTarget.removeEventListener("pointerup", onPointerEnd);
      pointerTarget.removeEventListener("pointercancel", onPointerEnd);
      geometry.dispose();
      quad.geometry.dispose();
      wingMaterial.dispose();
      cellMaterial.dispose();
      asciiMaterial.dispose();
      sceneTarget.dispose();
      cellTarget.dispose();
      atlas?.dispose();
      wings.dispose();
      renderer.dispose();
    },
  };
}

function createWingGeometry() {
  // Two wings hinged on the body axis (local y). x spans each wing and z is the dorsal side.
  // Each wing is a grid so it can bend; the hinge column sits a hair off zero so every vertex
  // knows which wing it belongs to.
  const positions: number[] = [];
  const indices: number[] = [];
  for (const side of [-1, 1]) {
    const first = positions.length / 3;
    for (let row = 0; row <= WING_CHORD_SEGMENTS; row++) {
      const y = WING_TAIL + ((WING_HEAD - WING_TAIL) * row) / WING_CHORD_SEGMENTS;
      for (let column = 0; column <= WING_SPAN_SEGMENTS; column++) {
        positions.push(side * Math.max(column / WING_SPAN_SEGMENTS, 0.001), y, 0);
      }
    }
    for (let row = 0; row < WING_CHORD_SEGMENTS; row++) {
      for (let column = 0; column < WING_SPAN_SEGMENTS; column++) {
        const a = first + row * (WING_SPAN_SEGMENTS + 1) + column;
        const b = a + WING_SPAN_SEGMENTS + 1;
        indices.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  return geometry;
}

// Draws one wing per style, in wing space, with half the body and one antenna along the hinge so
// the two mirrored quads make a whole butterfly. Tone goes in red and coverage in green, both
// drawn additively so overlapping marks brighten rather than replace each other.
function createWingTexture(anisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WING_TEXELS * WING_STYLES;
  canvas.height = Math.ceil(WING_TEXELS * (WING_HEAD - WING_TAIL));
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.lineJoin = "round";
    for (let style = 0; style < WING_STYLES; style++) {
      context.save();
      context.setTransform(WING_TEXELS, 0, 0, -WING_TEXELS, style * WING_TEXELS, WING_TEXELS * WING_HEAD);
      context.beginPath();
      context.rect(0, WING_TAIL, 1, WING_HEAD - WING_TAIL);
      context.clip();
      drawWing(context, style === 1);
      context.restore();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function drawWing(context: CanvasRenderingContext2D, tonal: boolean) {
  const ink = (value: number) => `rgb(${value}, 0, 0)`;
  const coverage = "rgb(0, 255, 0)";
  const outline = 0.024;

  // Pointed forewing over a rounded hindwing.
  const forewing = new Path2D();
  forewing.moveTo(0.03, 0.3);
  forewing.bezierCurveTo(0.25, 0.5, 0.6, 0.74, 0.93, 0.8);
  forewing.bezierCurveTo(0.98, 0.64, 0.9, 0.36, 0.8, 0.17);
  forewing.bezierCurveTo(0.55, 0.11, 0.25, 0.07, 0.03, 0.1);
  forewing.closePath();
  const hindwing = new Path2D();
  hindwing.moveTo(0.03, 0.12);
  hindwing.bezierCurveTo(0.3, 0.17, 0.62, 0.14, 0.73, -0.03);
  hindwing.bezierCurveTo(0.81, -0.22, 0.67, -0.5, 0.44, -0.6);
  hindwing.bezierCurveTo(0.25, -0.66, 0.1, -0.5, 0.03, -0.3);
  hindwing.closePath();
  const wings = new Path2D();
  wings.addPath(forewing);
  wings.addPath(hindwing);

  const veins = new Path2D();
  for (const [x, y] of [[0.9, 0.74], [0.9, 0.56], [0.86, 0.4], [0.8, 0.25]]) {
    veins.moveTo(0.05, 0.2);
    veins.quadraticCurveTo(x * 0.5, y * 0.75, x, y);
  }
  for (const [x, y] of [[0.7, -0.06], [0.66, -0.27], [0.55, -0.47], [0.36, -0.6]]) {
    veins.moveTo(0.05, 0.06);
    veins.quadraticCurveTo(x * 0.5, y * 0.6, x, y);
  }
  const spots = new Path2D();
  for (const [x, y, r] of [[0.84, 0.5, 0.03], [0.8, 0.37, 0.028], [0.73, 0.25, 0.026], [0.48, -0.3, 0.055]]) {
    spots.moveTo(x + r, y);
    spots.arc(x, y, r, 0, Math.PI * 2);
  }

  // Head, thorax and a tapering abdomen, centred on the hinge; the clip keeps this wing's half.
  const body = new Path2D();
  body.moveTo(0.045, 0.42);
  body.ellipse(0, 0.42, 0.045, 0.045, 0, 0, Math.PI * 2);
  body.moveTo(0.06, 0.2);
  body.ellipse(0, 0.2, 0.06, 0.17, 0, 0, Math.PI * 2);
  body.moveTo(0.048, 0.05);
  body.bezierCurveTo(0.06, -0.25, 0.035, -0.55, 0.008, -0.74);
  body.lineTo(0, -0.74);
  body.lineTo(0, 0.05);
  body.closePath();
  const antenna = new Path2D();
  antenna.moveTo(0.015, 0.44);
  antenna.quadraticCurveTo(0.06, 0.8, 0.22, 0.95);
  const club = new Path2D();
  club.ellipse(0.22, 0.95, 0.026, 0.026, 0, 0, Math.PI * 2);

  context.fillStyle = coverage;
  context.strokeStyle = coverage;
  context.lineWidth = outline;
  context.fill(wings);
  context.stroke(forewing);
  context.stroke(hindwing);
  context.fill(body);
  context.fill(club);
  context.lineWidth = 0.016;
  context.stroke(antenna);

  // The tonal style shades from the wing root out, like a halftone; the line style leaves the
  // membrane almost empty so the outline and veins carry the drawing.
  if (tonal) {
    const shade = context.createRadialGradient(0.04, 0.15, 0, 0.04, 0.15, 0.95);
    shade.addColorStop(0, ink(225));
    shade.addColorStop(0.6, ink(140));
    shade.addColorStop(1, ink(80));
    context.fillStyle = shade;
  } else {
    context.fillStyle = ink(22);
  }
  context.fill(wings);
  context.save();
  context.clip(wings);
  context.strokeStyle = ink(tonal ? 60 : 170);
  context.lineWidth = 0.011;
  context.stroke(veins);
  context.fillStyle = ink(tonal ? 70 : 150);
  context.fill(spots);
  context.restore();

  context.strokeStyle = ink(255);
  context.lineWidth = outline;
  context.stroke(forewing);
  context.stroke(hindwing);
  context.fillStyle = ink(235);
  context.fill(body);
  context.fill(club);
  context.strokeStyle = ink(255);
  context.lineWidth = 0.016;
  context.stroke(antenna);
}

// Resolves any CSS colour to 0–1 sRGB channels by painting a pixel with it.
function parseColor(color: string) {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return new Vector3();
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return new Vector3(red / 255, green / 255, blue / 255);
}

// Roughly normal noise in [-1.5, 1.5], so most offsets stay small.
function jitter() {
  return Math.random() + Math.random() + Math.random() - 1.5;
}

function smoothstep(from: number, to: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

// Improved Perlin noise, used as the vector potential for the curl field below.
const PERMUTATION = (() => {
  const table = Array.from({ length: 256 }, (_, index) => index);
  let seed = 1337;
  for (let index = 255; index > 0; index--) {
    seed = (seed * 16807) % 2147483647;
    const swap = seed % (index + 1);
    [table[index], table[swap]] = [table[swap], table[index]];
  }
  return Uint8Array.from({ length: 512 }, (_, index) => table[index & 255]);
})();

function noise(x: number, y: number, z: number) {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const X = fx & 255;
  const Y = fy & 255;
  const Z = fz & 255;
  x -= fx;
  y -= fy;
  z -= fz;
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const P = PERMUTATION;
  const A = P[X] + Y;
  const AA = P[A] + Z;
  const AB = P[A + 1] + Z;
  const B = P[X + 1] + Y;
  const BA = P[B] + Z;
  const BB = P[B + 1] + Z;
  return lerp(w,
    lerp(v, lerp(u, grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z)),
      lerp(u, grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z))),
    lerp(v, lerp(u, grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1))));
}

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// Divergence-free flow: the curl of three decorrelated noise fields.
function curl(x: number, y: number, z: number, out: Vector3) {
  const e = 0.1;
  const potential = (component: number, px: number, py: number, pz: number) =>
    noise(px + component * 31.7, py + component * 17.3, pz + component * 47.1);
  const dzdy = potential(2, x, y + e, z) - potential(2, x, y - e, z);
  const dydz = potential(1, x, y, z + e) - potential(1, x, y, z - e);
  const dxdz = potential(0, x, y, z + e) - potential(0, x, y, z - e);
  const dzdx = potential(2, x + e, y, z) - potential(2, x - e, y, z);
  const dydx = potential(1, x + e, y, z) - potential(1, x - e, y, z);
  const dxdy = potential(0, x, y + e, z) - potential(0, x, y - e, z);
  return out.set(dzdy - dydz, dxdz - dzdx, dydx - dxdy).multiplyScalar(1 / (2 * e));
}
