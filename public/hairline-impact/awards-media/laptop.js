const { Cam, fit, proj, poly, seg, mk, disposer, pointer, register, spring, stepS, rrect, hull } = HL;
function mount({ stage, svg }) {
  const bag = disposer(), lid = spring(100, { k: 45, c: 13 }), C = Cam(40, 0.5, 1.8);
  fit(C, [[-65,-40,0],[65,50,0],[-65,-40,95],[65,-40,95]],200,160);
  const P = proj(C), g = mk("g", {}, svg);
  const lidGroup = mk("g",{},g);
  const panelDepth = mk("path", {class:"sil"},lidGroup);
  const panel = mk("path", {class:"sil"},lidGroup), screen = mk("path", {class:"nf hi"},lidGroup);
  const content = mk("g", {},lidGroup);
  const placeholders = Array.from({length:4},()=>mk("path",{class:"nf lo"},content));
  const baseRing = rrect(-65, -40, 65, 50, 3, 8);
  mk("path", {class:"sil", d:poly(hull(baseRing.flatMap(({u,v}) => [P(u,v,0),P(u,v,5)])))},g);
  mk("path", {class:"nf", d:poly(baseRing.map(({u,v}) => P(u,v,5)))},g);
  mk("path", {class:"nf lo", d:seg(P(65,47,0),P(65,47,5))},g);
  const keyboardRows = [
    [8,8,8,8,8,8,8,8,8,8,8,10],
    [12,8,8,8,8,8,8,8,8,8,8,6],
    [14,8,8,8,8,8,8,8,8,8,14],
    [18,8,8,8,8,8,8,8,8,18],
    [11,11,11,43,11,11,11],
  ];
  keyboardRows.forEach((widths,row) => {
    const gap=1.8, total=widths.reduce((sum,w)=>sum+w,0)+gap*(widths.length-1);
    let left=-total/2;
    widths.forEach(width => {
      const y=-31+row*8.5, ring=rrect(left,y,left+width,y+6.5,1,4);
      mk("path",{class:"sil lo",d:poly(hull(ring.flatMap(({u,v})=>[P(u,v,5.2),P(u,v,6)])))},g);
      mk("path",{class:"nf lo",d:poly(ring.map(({u,v})=>P(u,v,6)))},g);
      left+=width+gap;
    });
  });
  mk("path",{class:"nf",d:poly(rrect(-19,20,19,42,2,6).map(({u,v})=>P(u,v,5.2)))},g);
  g.append(lidGroup);
  function draw() {
    const angle=lid.x*Math.PI/180, sn=Math.sin(angle),cs=Math.cos(angle);
    const Q=(x,z)=>P(x,-40+z*cs,7+z*sn);
    screen.setAttribute("opacity",lid.x>35 ? "1" : "0");
    content.setAttribute("opacity",lid.x>35 ? "1" : "0");
    const lidRing = rrect(-65,0,65,86,3,8);
    const face = lidRing.map(({u,v})=>Q(u,v));
    panelDepth.setAttribute("d",poly(hull(face.concat(lidRing.map(({u,v})=>P(u,-40+v*cs-2*sn,7+v*sn+2*cs))))));
    panel.setAttribute("d",poly(face));
    screen.setAttribute("d",poly(rrect(-59,8,59,79,2,8).map(({u,v})=>Q(u,v))));
    [[-49,24,-15,66],[-5,55,48,65],[-5,40,32,47],[-5,26,42,33]].forEach(([x0,z0,x1,z1],i)=>placeholders[i].setAttribute("d",poly(rrect(x0,z0,x1,z1,2,6).map(({u,v})=>Q(u,v)))));
  }
  const board=register(stage,dt=>{const moving=stepS(lid,dt);draw();return moving;});
  bag.add(board.unregister);bag.add(pointer(stage,{move:()=>{lid.t=8;board.wake();},leave:()=>{lid.t=100;board.wake();}}));
  bag.add(()=>svg.replaceChildren());draw();return {destroy:bag.dispose};
}
hairline({name:"custom-laptop",range:[5,10,15],mount});
