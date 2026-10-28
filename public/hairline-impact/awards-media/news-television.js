const { Cam, fit, proj, facing, rrect, rings, prism, hull, poly, open, clamp, rad, spring, stepS, solid, put, mk, pointer, register, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, at = null;
  const C = Cam(37, 0.5, 2.6);
  fit(C, [[-47, -20, 0], [47, 22, 0], [-47, -20, 98], [47, 22, 98]], 200, 164);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const antennas = [-1, 1].map((sign) => ({
    x: sign * 10, rest: sign * 28, spring: spring(sign * 28, { k: 94, c: 16 }),
    rod: mk("path", { class: "sil" }, g), last: NaN,
  }));
  [-25, 25].forEach((x) => {
    const [ring, inner] = rings(x - 5.5, 7, x + 5.5, 19, 3.5, 1.1);
    put(solid(g), prism(P, front, ring, inner, 0, 9));
  });
  const cabinet = solid(g), screen = mk("path", { class: "sil hi" }, g), glass = mk("path", { class: "nf lo" }, g);
  const face = (shape, y) => shape.map((q) => P(q.u, y, q.v));
  const outline = rrect(-43, 8, 43, 64, 9, 12), inset = rrect(-41.2, 9.8, 41.2, 62.2, 7.2, 12);
  put(cabinet, { sil: poly(hull(face(outline, -16).concat(face(outline, 19)))), crease: poly(face(inset, 19)) });
  screen.setAttribute("d", poly(face(rrect(-35.5, 17, 35.5, 56, 8, 12), 19.5)));
  glass.setAttribute("d", poly(face(rrect(-32.8, 19.7, 32.8, 53.3, 5.3, 12), 19.7)));
  const rod = rrect(-1.3, 0, 1.3, 33, 1.3, 10);
  const tip = (a) => P(a.x + 30 * Math.sin(rad(a.rest)), -6, 63 + 30 * Math.cos(rad(a.rest)));
  const restTips = antennas.map(tip), center = P(0, 0, 45);
  function draw(a) {
    const s = Math.sin(rad(a.spring.x)), c = Math.cos(rad(a.spring.x));
    a.rod.setAttribute("d", poly(rod.map((q) => P(a.x + q.u * c + q.v * s, -6, 63 - q.u * s + q.v * c))));
    a.last = a.spring.x;
  }
  const board = register(stage, (dt) => {
    let moving = false;
    antennas.forEach((a) => {
      if (stepS(a.spring, dt)) moving = true;
      if (!Number.isFinite(a.last) || Math.abs(a.last - a.spring.x) > 0.0001) draw(a);
    });
    return moving;
  });
  bag.add(board.unregister);
  function target() {
    const active = at && Math.hypot((at[0] - center[0]) / 146, (at[1] - center[1]) / 135) < 1.12;
    const distances = restTips.map((p) => at ? Math.hypot(at[0] - p[0], at[1] - p[1]) : Infinity);
    const picked = active ? (distances[0] <= distances[1] ? 0 : 1) : -1;
    antennas.forEach((a, i) => {
      const falloff = active ? Math.exp(-distances[i] / 82) : 0;
      const direction = active ? clamp((at[0] - center[0]) / 68, -1, 1) : 0;
      a.spring.t = a.rest + direction * reach * falloff;
      a.rod.classList.toggle("hi", i === picked);
    });
    screen.classList.toggle("hi", picked < 0);
    read.textContent = picked < 0 ? "rest" : "antenna " + (picked + 1);
    board.wake();
  }
  bag.add(pointer(stage, { move: (p) => { at = p; target(); }, leave: () => { at = null; target(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  board.wake();
  return { set: (v) => { reach = v; target(); }, destroy: bag.dispose };
}

hairline({
  name: "news-television",
  means: "A small television's two antennas lean toward the pointer, with the closer rod answering more.",
  rules: [1, 3, 4, 6, 8, 9, 10],
  range: [7, 12, 17],
  tour: [[137, 91], [252, 91], [203, 57], null],
  mount,
});
