const {
  Cam, circ, facing, fillet, fit, proj, prism, solid, put,
  tdone, tset, tval, tween, disposer, mk, pointer, register, unproj,
} = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), TAU = Math.PI * 2, R = 64, TOP = 12.5;
  let lift = value, active = -1, angle = 114.66 * Math.PI / 180;
  const parts = [
    { name: "Science", percent: 36.3 }, { name: "Commerce", percent: 36.1 },
    { name: "Arts", percent: 10.9 }, { name: "Other", percent: 5.4 },
    { name: "Engineering", percent: 11.3 },
  ];
  parts.forEach((p) => {
    p.start = angle; p.end = angle += TAU * p.percent / 100; p.mid = (p.start + p.end) / 2;
    p.offset = p.name === "Other" ? 2.8 : 0; p.rest = p.name === "Other" ? 1.1 : 0;
    p.x = Math.cos(p.mid) * p.offset; p.y = Math.sin(p.mid) * p.offset;
  });
  const C = Cam(45, 0.5, 2.05);
  fit(C, [[-72, 0, 0], [72, 0, 0], [0, -72, 0], [0, 72, 0], [0, 0, 23]], 200, 166);
  const P = proj(C), front = facing(C), g = mk("g", {}, svg);
  const base = solid(g);
  put(base, prism(P, front, circ(70, 96), circ(68.6, 96), 0, 3.5));

  function wedge(p, inset) {
    const r = R - inset, span = p.end - p.start;
    const cut = inset ? Math.asin(inset / r) : 0, start = p.start + cut, end = p.end - cut;
    const apex = inset ? inset / Math.sin(span / 2) : 0;
    const vertices = [[Math.cos(p.mid) * apex, Math.sin(p.mid) * apex]];
    const steps = Math.ceil(span / (Math.PI / 50));
    for (let i = 0; i <= steps; i++) {
      const a = start + (end - start) * i / steps;
      vertices.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    const rounded = fillet(vertices, vertices.map(() => 0.65), 4);
    return rounded.map(([u, v], i) => {
      const prev = rounded[(i + rounded.length - 1) % rounded.length], next = rounded[(i + 1) % rounded.length];
      const du = next[0] - prev[0], dv = next[1] - prev[1], length = Math.hypot(du, dv);
      return { u: u + p.x, v: v + p.y, nu: dv / length, nv: -du / length };
    });
  }
  parts.forEach((p) => {
    p.ring = wedge(p, 0); p.inner = wedge(p, 1.1);
    p.body = solid(g); p.z = tween(p.rest); p.last = NaN;
  });
  parts.slice().sort((a, b) => Math.cos(a.mid) + Math.sin(a.mid) - Math.cos(b.mid) - Math.sin(b.mid))
    .forEach((p) => g.append(p.body.g));

  function draw(p, z) {
    if (z === p.last) return;
    put(p.body, prism(P, front, p.ring, p.inner, 4.5 + z, TOP + z));
    p.last = z;
  }
  parts.forEach((p) => { draw(p, p.rest); p.body.sil.classList.remove("hi"); });
  const B = register(stage, (_dt, now) => {
    let moving = false;
    parts.forEach((p) => { draw(p, tval(p.z, now)); if (!tdone(p.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  function choose(a, force = false) {
    if (a === active && !force) return;
    const now = performance.now(), origin = parts[a >= 0 ? a : active];
    active = a;
    const card = stage.closest(".impact-faculties");
    if (card) card.dataset.faculty = a < 0 ? "" : parts[a].name;
    parts.forEach((p, i) => {
      const d = origin ? Math.abs(Math.atan2(Math.sin(p.mid - origin.mid), Math.cos(p.mid - origin.mid))) : 0;
      const answer = a < 0 ? 0 : i === a ? lift : lift * 0.13 * Math.exp(-d / 1.05);
      tset(p.z, p.rest + answer, now, d * 25);
      p.body.sil.classList.toggle("faculty-slice-active", i === a);
      p.body.cr.classList.toggle("faculty-slice-active", i === a);
    });
    read.textContent = a < 0 ? "rest" : `${parts[a].name} ${parts[a].percent.toFixed(1)}%`;
    B.wake();
  }

  function hit([sx, sy]) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i], q = unproj(C, sx, sy, TOP + p.rest), x = q[0] - p.x, y = q[1] - p.y;
      let a = Math.atan2(y, x); while (a < p.start) a += TAU;
      if (Math.hypot(x, y) <= R + 3 && a <= p.end) return i;
    }
    return -1;
  }
  const card = stage.closest(".impact-faculties");
  card?.querySelectorAll("[data-faculty-label]").forEach(label => {
    const index = parts.findIndex(p => p.name === label.dataset.facultyLabel);
    bag.on(label, "pointerenter", () => choose(index));
    bag.on(label, "pointerleave", () => choose(-1));
    bag.on(label, "focus", () => choose(index));
    bag.on(label, "blur", () => choose(-1));
  });
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  return { set: (v) => { lift = v; choose(active, true); }, destroy: bag.dispose };
}

hairline({
  name: "faculty-pie",
  means: "Five faculty shares form a shallow pie; the nearest slice lifts while its neighbours answer with a smaller movement.",
  rules: [1, 3, 5, 8, 10],
  range: [3, 6, 9],
  tour: [[117, 155], [281, 159], [200, 188], null],
  mount,
});
