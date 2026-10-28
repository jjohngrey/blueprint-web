const { Cam, fit, proj, poly, mk, disposer, pointer, rrect, hull, facing, rings, prism, solid, put, spring, stepS, register } = HL;
function mount({stage,svg}) {
  const bag=disposer(),C=Cam(38,0.5,1.9);
  fit(C,[[-70,0,0],[70,18,0],[-70,0,120],[70,18,120]],200,160);
  const P=proj(C),g=mk("g",{},svg),Q=(x,z)=>P(x,8,z);
  const front=facing(C);
  function block(x0,y0,x1,y1,z0,z1,r=1) {
    const [ring,inset]=rings(x0,y0,x1,y1,r,0.4);
    put(solid(g),prism(P,front,ring,inset,z0,z1));
    mk("path",{class:"nf lo",d:poly(ring.map(({u,v})=>P(u,v,z1)))},g);
  }
  for(const x of [-46,46]) {
    block(x-12,-7,x+12,20,0,4,2);
    block(x-3,2,x+3,8,4,43,0.8);
  }
  const board = rrect(-70,40,70,112,4,8);
  mk("path",{class:"sil",d:poly(hull(board.flatMap(({u,v})=>[P(u,0,v),Q(u,v)])))},g);
  mk("path",{class:"sil",d:poly(board.map(({u,v})=>Q(u,v)))},g);
  mk("path",{class:"nf hi",d:poly(rrect(-65,45,65,107,2.5,8).map(({u,v})=>Q(u,v)))},g);
  const flip=spring(0,{k:50,c:15}),screenGroup=mk("g",{},g);
  const face=mk("path",{class:"sil"},screenGroup);
  const cells=Array.from({length:4},()=>mk("path",{class:"nf lo"},screenGroup));
  function drawScreen() {
    const a=flip.x, reverse=Math.cos(a)<0;
    const S=(x,z)=> { const h=(reverse ? 152-z : z)-76; return P(x,9+h*Math.sin(a),76+h*Math.cos(a)); };
    face.setAttribute("d",poly(rrect(-63,46,63,106,2,6).map(({u,v})=>S(u,v))));
    const layouts=reverse ? [[-53,82,49,96],[-53,60,-8,74],[2,60,49,74],[-53,52,28,56]] : [[-53,62,-13,96],[-3,88,49,96],[-3,75,35,81],[-3,63,44,69]];
    layouts.forEach(([x0,z0,x1,z1],i)=>cells[i].setAttribute("d",poly(rrect(x0,z0,x1,z1,2,6).map(({u,v})=>S(u,v)))));
  }
  const animation=register(stage,dt=>{const moving=stepS(flip,dt);drawScreen();return moving;});
  bag.add(animation.unregister);
  bag.add(pointer(stage,{move:()=>{flip.t=Math.PI;animation.wake();},leave:()=>{flip.t=0;animation.wake();}}));
  drawScreen();
  bag.add(()=>svg.replaceChildren());return {destroy:bag.dispose};
}
hairline({name:"product-billboard",range:[0,1,2],mount});
