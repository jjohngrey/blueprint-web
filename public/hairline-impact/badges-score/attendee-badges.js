const {
  Cam, clamp, fit, hull, open, poly, proj, rad, rrect, run,
  tdone, tset, tval, tween, disposer, mk, pointer, register,
} = HL;

function inside([x, y], ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) hit = !hit;
  }
  return hit;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(), outline = rrect(-22.5, -7, 22.5, 64, 4.2, 9);
  const inset = rrect(-21.5, -6, 21.5, 63, 3.2, 9);
  const cards = Array.from({ length: 7 }, (_, i) => ({ angle: (i - 3) * 20 }));
  let reach = value, active = -1;
  const C = Cam(45, 0.5, 2.4), unit = Math.SQRT1_2;

  function world(u, v, h, angle, lift) {
    const s = Math.sin(rad(angle)), c = Math.cos(rad(angle));
    const x = u * c + v * s, z = -u * s + v * c;
    const depth = z * 0.12 - h;
    return [(x + depth) * unit, (-x + depth) * unit, z + 9 + lift];
  }

  fit(C, cards.flatMap((cd) => outline.flatMap(({ u, v }) =>
    [world(u, v, 0, cd.angle - 4, 0), world(u, v, 1, cd.angle + 4, 12)])), 200, 166);
  const P = proj(C), group = mk("g", {}, svg);
  cards.forEach((cd, i) => {
    cd.g = mk("g", {}, group);
    cd.sil = mk("path", { class: "sil" + (i === 6 ? " hi" : "") }, cd.g);
    cd.crease = mk("path", { class: "nf lo" }, cd.g);

    cd.label = mk("text", { class: "card-lettering", "font-size": 3.8 }, cd.g);
    cd.label.textContent = "NFC Card";
    cd.turn = tween(cd.angle); cd.lift = tween(0); cd.last = "";
    cd.hit = outline.map(({ u, v }) => P(...world(u, v, 1, cd.angle, 0)));
  });

  function draw(cd, angle, lift) {
    const stamp = `${angle.toFixed(4)},${lift.toFixed(4)}`;
    if (stamp === cd.last) return;
    cd.last = stamp;
    const Q = (u, v, h) => P(...world(u, v, h, angle, lift));
    const face = outline.map(({ u, v }) => Q(u, v, 1));
    cd.sil.setAttribute("d", poly(hull(face.concat(outline.map(({ u, v }) => Q(u, v, 0))))));
    const o = Q(-18, 4, 1.2), x = Q(-18, 5, 1.2), y = Q(-17, 4, 1.2);
    const t = Q(-18, 42, 1.2);
    cd.label.setAttribute("transform", `matrix(${x[0]-o[0]} ${x[1]-o[1]} ${y[0]-o[0]} ${y[1]-o[1]} ${t[0]} ${t[1]})`);
    cd.crease.setAttribute("d", open(run(inset, ({ u, v }) => u > 20 || v < -5).map(({ u, v }) => Q(u, v, 1))));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd) => {
      draw(cd, tval(cd.turn, now), tval(cd.lift, now));
      moving = !tdone(cd.turn, now) || !tdone(cd.lift, now) || moving;
    });
    return moving;
  });
  bag.add(B.unregister);

  function retarget(origin = active < 0 ? 6 : active) {
    const now = performance.now();
    cards.forEach((cd, i) => {
      const distance = Math.abs(i - origin), weight = distance === 0 ? 1 : distance === 1 ? 0.24 : 0.06;
      tset(cd.turn, cd.angle + (active < 0 ? 0 : clamp(i - active, -2, 2) * reach * 0.65), now, distance * 35);
      tset(cd.lift, active < 0 ? 0 : reach * weight, now, distance * 35);
      cd.sil.classList.toggle("hi", i === (active < 0 ? 6 : active));
    });
    B.wake();
  }

  function choose(a) {
    if (a === active) return;
    const origin = a < 0 ? active : a;
    active = a; read.textContent = a < 0 ? "rest" : `card ${a + 1}`;
    retarget(origin);
  }

  bag.add(pointer(stage, {
    move: (p) => {
      let a = -1;
      for (let i = cards.length - 1; i >= 0; i--) if (inside(p, cards[i].hit)) { a = i; break; }
      choose(a);
    },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest"; B.wake();
  return { set: (v) => { reach = v; retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "attendee-badges",
  means: "Seven plain cards share a pivot; the chosen card lifts and its neighbours spread gently away.",
  rules: [1, 2, 3, 4, 5, 6, 8, 9, 10],
  range: [5, 8, 11],
  tour: [[113, 148], [276, 139], [198, 113], null],
  mount,
});
