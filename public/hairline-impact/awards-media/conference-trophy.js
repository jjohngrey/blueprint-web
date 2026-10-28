const {
  Cam, clamp, circ, facing, fillet, fit, hull, open, poly, prism, proj, rad, rings,
  spring, stepS, solid, put, disposer, mk, pointer, register,
} = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), turn = spring(-7), C = Cam(45, 0.5, 2.8);
  let reach = value, at = null, last = NaN;
  fit(C, [[-35, -24, 0], [35, 24, 0], [-35, 0, 79], [35, 0, 79]], 200, 166);
  const P = proj(C), front = facing(C), group = mk("g", {}, svg);
  const base = solid(group), tier = solid(group), stem = solid(group);
  const handles = [-1, 1].map(() => mk("path", { class: "sil" }, group));
  const bowl = solid(group), rim = mk("path", { class: "sil hi" }, group);
  const opening = mk("path", { class: "nf lo" }, group);
  const [foot, footInset] = rings(-21, -15, 21, 15, 3.5, 1.1);
  const [top, topInset] = rings(-14.5, -10, 14.5, 10, 2.5, 0.9);
  const circle = circ(1, 80), unit = Math.SQRT1_2;
  const loop = fillet([
    [18, 73], [29, 73], [35.5, 68], [36, 61], [32, 54], [25, 50], [7, 49],
    [8, 53], [24, 54], [29, 58], [31, 63], [29, 68], [18, 69],
  ], [1.6, 3, 3.5, 3.5, 3, 2.4, 1.5, 1.4, 2, 2.3, 2.8, 2.5, 1.2], 7);
  const profile = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    return [5 + 16.5 * Math.sin(t * Math.PI / 2), 43 + 36 * t];
  });

  function draw(a) {
    const s = Math.sin(rad(a)), c = Math.cos(rad(a));
    const Q = (x, y, z) => P(x * c - y * s, x * s + y * c, z);
    const visible = (q) => front({ ...q, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c });
    const ring = (r, z) => circle.map(({ u, v }) => Q(u * r, v * r, z));
    put(base, prism(Q, visible, foot, footInset, 0, 6));
    put(tier, prism(Q, visible, top, topInset, 6, 11));
    put(stem, {
      sil: poly(hull(ring(2.8, 11).concat(ring(2.8, 44)))),
      crease: "",
    });
    handles.forEach((el, i) => {
      const sign = i ? 1 : -1;
      el.setAttribute("d", poly(loop.map(([u, v]) => Q(sign * u * unit, -sign * u * unit, v))));
    });
    put(bowl, { sil: poly(hull(profile.flatMap(([r, z]) => ring(r, z)))), crease: "" });
    rim.setAttribute("d", poly(ring(21.5, 79)));
    opening.setAttribute("d", poly(ring(19.2, 79.3)));
  }

  const trophyTop = P(0, 0, 79)[1], trophyBottom = P(0, 0, 0)[1];
  const confettiCutoff = trophyTop + (trophyBottom - trophyTop) * 0.75;
  const confetti = mk("g", {class:"trophy-confetti"}, svg);
  const particles = Array.from({length:28},(_,i)=>({
    node:mk("path",{class:"nf hi",d:"M-2 -3L2 3",opacity:0},confetti),
    vx:(i%7-3)*64, vy:-190-(i%5)*15, delay:(i%4)*0.045,
    spin:(i%2 ? 1 : -1)*(130+i*11),
  }));
  let burst = -Infinity;
  const launch = () => { if(HL.reducedMotion()) return; burst=performance.now(); B.wake(); };
  const B = register(stage, (dt,now) => {
    const moving = stepS(turn, dt), elapsed=(now-burst)/1000;
    if (!Number.isFinite(last) || Math.abs(last - turn.x) > 0.0001) { draw(turn.x); last = turn.x; }
    particles.forEach(p=> {
      const t=elapsed-p.delay;
      const drag=(1-Math.exp(-2*t))/2;
      const x=200+p.vx*drag+Math.sin(t*4+p.spin)*Math.max(0,t)*2;
      const y=110+p.vy*drag+40*(t-(1-Math.exp(-1.4*t))/1.4);
      const visible=t>=0 && t<8 && y<confettiCutoff && !HL.reducedMotion();
      p.node.setAttribute("opacity",visible ? String(Math.min(1,Math.max(0,(confettiCutoff-y)/35), (8-t)/0.4)) : "0");
      if(!visible) return;
      p.node.setAttribute("transform",`translate(${x} ${y}) rotate(${p.spin*t}) scale(${0.55+Math.abs(Math.cos(t*6+p.spin))*0.45} 1)`);
    });
    return moving || elapsed<8.2;
  });
  bag.on(stage,"hairline-preview",launch);
  const card=stage.closest(".impact-card");
  if(card) { bag.on(card,"pointerenter",launch); bag.on(card,"focusin",launch); }
  bag.add(B.unregister);
  const center = P(0, 0, 45);

  function target() {
    const nx = at ? (at[0] - center[0]) / 112 : 2;
    const ny = at ? (at[1] - center[1]) / 110 : 2;
    const on = nx * nx + ny * ny < 1.1;
    turn.t = -7 + (on ? clamp(nx, -1, 1) * reach : 0);
    read.textContent = on ? "trophy" : "rest"; B.wake();
  }

  bag.add(pointer(stage, { move: (p) => { at = p; target(); }, leave: () => { at = null; target(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest"; B.wake();
  return { set: (v) => { reach = v; target(); }, destroy: bag.dispose };
}

hairline({
  name: "conference-trophy",
  means: "A slender handled cup on a tiered plinth turns gently toward the pointer.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [3, 5, 7],
  tour: [[119, 137], [280, 137], [214, 104], null],
  mount,
});
