const {
  Cam, fit, hull, open, poly, proj, rad, seg, spring, stepS,
  disposer, mk, pointer, register,
} = HL;

function mount({ stage, svg, read }) {
  const bag = disposer(), radius = 46, needle = spring(155, { k: 45, c: 13 });
  const round = (r) => Array.from({ length: 96 }, (_, i) => {
    const a = i * Math.PI / 48;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const rim = round(radius), inner = round(radius - 1.5), unit = Math.SQRT1_2;
  const C = Cam(45, 0.5, 2.7);
  let last = NaN, at = null;

  function world(u, v, h = 4) {
    const depth = v * Math.sin(rad(9)) - h;
    return [(u + depth) * unit, (-u + depth) * unit, 48 + v * Math.cos(rad(9))];
  }

  fit(C, rim.flatMap(([u, v]) => [world(u, v, 0), world(u, v, 4)]), 200, 166);
  const P = proj(C), Q = (u, v, h) => P(...world(u, v, h));
  const group = mk("g", {}, svg), body = mk("path", { class: "sil" }, group);
  body.setAttribute("d", poly(hull(rim.flatMap(([u, v]) => [Q(u, v, 0), Q(u, v, 4)]))));
  mk("path", { class: "nf lo", d: open(inner.slice(48).map(([u, v]) => Q(u, v))) }, group);

  const arc = Array.from({ length: 49 }, (_, i) => {
    const a = Math.PI * (1 - i / 48);
    return Q(34 * Math.cos(a), 34 * Math.sin(a) - 3);
  });
  mk("path", { class: "nf lo", d: open(arc) }, group);
  const ticks = Array.from({length: 41}, (_,i) => i/40).map((t,i) => {
    const a = Math.PI * (1 - t), c = Math.cos(a), s = Math.sin(a);
    return seg(Q((i % 10 === 0 ? 28 : i % 5 === 0 ? 30 : 32.5) * c, (i % 10 === 0 ? 28 : i % 5 === 0 ? 30 : 32.5) * s - 3), Q(35.2 * c, 35.2 * s - 3));
  }).join("");
  mk("path", { class: "nf", d: ticks }, group);
  for (const r of [39,41,44]) mk("path",{class:"nf lo",d:poly(round(r).map(([u,v])=>Q(u,v)))},group);
  for (const [t,label] of [[0,"0"],[0.25,"25"],[0.5,"50"],[0.75,"75"],[1,"100"]]) {
    const a=Math.PI*(1-t),o=Q(23*Math.cos(a),23*Math.sin(a)-3),x=Q(23*Math.cos(a)+1,23*Math.sin(a)-3),y=Q(23*Math.cos(a),23*Math.sin(a)-4);
    const text=mk("text",{class:"card-lettering","font-size":4,"text-anchor":"middle",transform:`matrix(${x[0]-o[0]} ${x[1]-o[1]} ${y[0]-o[0]} ${y[1]-o[1]} ${o[0]} ${o[1]})`},group);
    text.textContent=label;
  }
  const hand = mk("path", { class: "sil hi" }, group);
  const hub = mk("path", { class: "sil" }, group);
  hub.setAttribute("d", poly(round(2.7).map(([u, v]) => Q(u, v - 3))));
  const center = Q(0, 0), left = Q(-radius, 0), top = Q(0, radius);

  function draw(nudge) {
    if (Number.isFinite(last) && Math.abs(last - nudge) < 0.0001) return;
    last = nudge;
    const a = rad(nudge);
    hand.setAttribute("d", poly([Q(-7*Math.cos(a)-1.4*Math.sin(a),-3-7*Math.sin(a)+1.4*Math.cos(a)),Q(29*Math.cos(a),-3+29*Math.sin(a)),Q(-7*Math.cos(a)+1.4*Math.sin(a),-3-7*Math.sin(a)-1.4*Math.cos(a))]));
  }

  const B = register(stage, (dt) => {
    const moving = stepS(needle, dt);
    draw(needle.x);
    return moving;
  });
  bag.add(B.unregister);

  function target() {
    const nx = at ? (at[0] - center[0]) / (center[0] - left[0]) : 2;
    const ny = at ? (at[1] - center[1]) / (center[1] - top[1]) : 2;
    const on = nx * nx + ny * ny <= 1.06;
    needle.t = on ? 12 : 155;
    read.textContent = on ? "dial" : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => { at = p; target(); }, leave: () => { at = null; target(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest"; B.wake();
  return { set: () => { target(); }, destroy: bag.dispose };
}

hairline({
  name: "feedback-token",
  means: "A quiet satisfaction dial rests at 87 percent; its needle gives a small bounded nudge toward the pointer.",
  rules: [1, 3, 4, 5, 7, 8, 9, 10],
  range: [2, 3.5, 5],
  tour: [[125, 161], [279, 151], [228, 107], null],
  mount,
});
