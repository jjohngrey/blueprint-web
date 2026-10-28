const { Cam, fit, proj, circ, rrect, hull, poly, open, clamp, rad, spring, stepS, solid, put, mk, pointer, register, disposer } = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer(), turn = spring(-9, { k: 84, c: 17 }), tilt = spring(0);
  let reach = value, at = null, last = NaN;
  const C = Cam(39, 0.5, 2.55);
  fit(C, [[-49, -30, 3], [42, 30, 3], [-49, -30, 88], [42, 30, 88]], 200, 164);
  const P = proj(C), g = mk("g", {}, svg);
  const grip = solid(g), body = solid(g), back = mk("path", { class: "sil" }, g);
  const lip = mk("path", { class: "sil hi" }, g), inside = mk("path", {}, g);
  const waves = [0,1,2].map(i=>mk("path",{class:"nf hi sound-wave",style:`--wave-delay:${i*170}ms`},g));
  const disc = circ(1, 72), pitch = rad(10);
  const gripShape = rrect(-11, 5, 1, 39, 4.5, 10);
  const gripInner = rrect(-9.3, 6.7, -0.7, 37.3, 3, 10);
  const center = P(-2, 0, 43);
  function draw(a) {
    const s = Math.sin(rad(a)), c = Math.cos(rad(a));
    const pitchUp=rad(tilt.x), cp=Math.cos(pitchUp),sp=Math.sin(pitchUp);
    const Q = (x,y,z) => { const xx=x*cp-(z-43)*sp,zz=43+x*sp+(z-43)*cp; return P(xx*c-y*s,xx*s+y*c,zz); };
    const ring = (x, z, r) => disc.map((q) => Q(x - q.v * r * Math.sin(pitch), q.u * r, z + q.v * r * Math.cos(pitch)));
    const face = (shape, y) => shape.map((q) => Q(q.u, y, q.v));
    put(grip, { sil: poly(hull(face(gripShape, -4).concat(face(gripShape, 6)))), crease: open(face(gripInner, 6)) });
    const rear = ring(-39, 45, 11), mouth = ring(31, 57, 28);
    put(body, { sil: poly(hull(rear.concat(mouth))), crease: "" });
    back.setAttribute("d", poly(ring(-39.4, 45, 10.4)));
    lip.setAttribute("d", poly(mouth));
    const mouthPoint=Q(34,0,57);
    waves.forEach((wave,i)=>wave.setAttribute("d",open(Array.from({length:33},(_,j)=> {
      const a=-1.1+j/32*2.2,r=18+i*10;
      return [mouthPoint[0]+28+r*Math.cos(a),mouthPoint[1]+r*Math.sin(a)];
    }))));
    inside.setAttribute("d", poly(ring(32, 57.15, 24.6)));
  }
  const board = register(stage, (dt) => {
    const moving = stepS(turn, dt), tilting = stepS(tilt,dt);
    if (tilting || !Number.isFinite(last) || Math.abs(last - turn.x) > 0.0001) { draw(turn.x); last = turn.x; }
    return moving || tilting;
  });
  bag.add(board.unregister);
  function target() {
    if (!at) { turn.t = -9; read.textContent = "rest"; }
    else {
      const dx = at[0] - center[0], dy = at[1] - center[1];
      const d = Math.hypot(dx / 139, dy / 114), active = d < 1.15;
      turn.t = -9 + (active ? clamp(dx / 105, -1, 1) * reach * clamp(1.35 - d * 0.35, 0, 1) : 0);
      read.textContent = active ? "megaphone" : "rest";
    }
    tilt.t = at ? 9 : 0;
    board.wake();
  }
  bag.add(pointer(stage, { move: (p) => { at = p; target(); }, leave: () => { at = null; target(); } }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  board.wake();
  return { set: (v) => { reach = v; target(); }, destroy: bag.dispose };
}

hairline({
  name: "social-megaphone",
  means: "A compact megaphone swivels its open mouth gently toward the pointer.",
  rules: [1, 3, 4, 6, 8, 9, 10],
  range: [5, 9, 13],
  tour: [[285, 131], [139, 153], [258, 192], null],
  mount,
});
