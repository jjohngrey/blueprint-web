const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, rrect, seg,
  spring, stepS, solid, put, disposer, mk, pointer, register,
} = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), approach = spring(0), C = Cam(45, 0.5, 2.3);
  let reach = value, at = null, last = NaN;
  const [card, cardInset] = rings(-61, -25, 21, 25, 5, 1.1);
  const phone = rrect(-20, -39, 20, 39, 5.5, 11);
  const screen = rrect(-16.8, -34, 16.8, 33.8, 3.8, 10);

  function world(u, v, h, close = 0) {
    return [38 + v - close * 8, u - close, 15 - v * 0.35 + h - close * 6];
  }

  fit(C, card.flatMap(({ u, v }) => [[u, v, 0], [u, v, 2]]).concat(
    phone.flatMap(({ u, v }) => [world(u, v, 0), world(u, v, 4, 1)])), 200, 166);
  const P = proj(C), front = facing(C), group = mk("g", {}, svg);
  const plate = solid(group);
  put(plate, prism(P, front, card, cardInset, 0, 2));
  const origin = P(-54, -17, 2.3), axisX = P(-53, -17, 2.3), axisY = P(-54, -16, 2.3);
  const label = mk("g", { transform: `matrix(${axisX[0]-origin[0]} ${axisX[1]-origin[1]} ${axisY[0]-origin[0]} ${axisY[1]-origin[1]} ${origin[0]} ${origin[1]})` }, group);
  mk("text", { x: 0, y: 4, class: "card-lettering", "font-size": 3.8 }, label).textContent = "NFC";
  mk("path", { class: "nf", d: [1.5, 2.8, 4.1].map(r => open(Array.from({length: 20}, (_,i) => { const a = -0.8 + i/19*1.6; return P(-44 + r*Math.cos(a), -15 + r*Math.sin(a), 2.3); }))).join("") }, group);
  const body = mk("path", { class: "sil hi" }, group);
  const phoneFace = mk("path", { class: "sil phone-front" }, group);
  const buttons = mk("path", { class: "nf lo" }, group);
  const glass = mk("path", { class: "nf" }, group);
  const speaker = mk("path", { class: "nf lo" }, group);
  const signals = mk("path", { class: "nf hi" }, group);
  const center = P(...world(0, 0, 2));
  const rest = phone.map(({ u, v }) => P(...world(u, v, 2)));
  const bounds = {
    x0: Math.min(...rest.map(([x]) => x)), x1: Math.max(...rest.map(([x]) => x)),
    y0: Math.min(...rest.map(([, y]) => y)), y1: Math.max(...rest.map(([, y]) => y)),
  };

  function draw(close) {
    if (Number.isFinite(last) && Math.abs(last - close) < 0.0001) return;
    last = close;
    const Q = (u, v, h = 4) => P(...world(u, v, h, close));
    const face = phone.map(({ u, v }) => Q(u, v));
    body.setAttribute("d", poly(hull(face.concat(phone.map(({ u, v }) => Q(u, v, 0))))));
    phoneFace.setAttribute("d", poly(face));
    buttons.setAttribute("d", seg(Q(20, -15, 1.8), Q(20, -5, 1.8)) + seg(Q(20, 1, 1.8), Q(20, 7, 1.8)));
    glass.setAttribute("d", poly(screen.map(({ u, v }) => Q(u, v))));
    speaker.setAttribute("d", seg(Q(-4, -36.5), Q(4, -36.5)));
    signals.setAttribute("d", close < 0.42 ? "" : [6, 10].map((r) => open(Array.from({ length: 22 }, (_, i) => {
      const a = Math.PI * (-0.3 + i / 21 * 0.6);
      return Q(23 + r * Math.cos(a), -21 + r * Math.sin(a));
    }))).join(""));
    body.classList.toggle("hi", close < 0.42);
  }

  const B = register(stage, (dt) => {
    const moving = stepS(approach, dt);
    draw(approach.x); return moving;
  });
  bag.add(B.unregister);

  function target() {
    const nx = at ? (at[0] - center[0]) / ((bounds.x1 - bounds.x0) * 0.63) : 2;
    const ny = at ? (at[1] - center[1]) / ((bounds.y1 - bounds.y0) * 0.7) : 2;
    const d = Math.hypot(nx, ny), on = d < 1.15;
    approach.t = on ? clamp(1.15 - d * 0.42, 0, 1) * reach : 0;
    read.textContent = on ? "tap" : "rest"; B.wake();
  }

  bag.add(pointer(stage, { move: (p) => { at = p; target(); }, leave: () => { at = null; target(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest"; B.wake();
  return { set: (v) => { reach = v; target(); }, destroy: bag.dispose };
}

hairline({
  name: "nfc-tap",
  means: "A blank phone approaches an NFC card; two short signal arcs answer when the phone comes close.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [0.5, 0.8, 1],
  tour: [[272, 183], [235, 154], [198, 130], null],
  mount,
});
