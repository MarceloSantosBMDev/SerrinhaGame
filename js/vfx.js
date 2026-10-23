/* ============================================================
   VFX — animações elementais por skill (usa FX: shapes/partículas)
   VFX.play(element, kind, x, y, dir, color)
     element: fire|ice|lightning|earth|shadow|holy|poison|rage
     kind:    charge | hit | aoe | super | muzzle
   ============================================================ */
const VFX = (function(){
  const R=Math.random;
  const COLORS={ fire:'#ff7a00', ice:'#7df0ff', lightning:'#fff066', earth:'#caa66a',
                 shadow:'#a93bff', holy:'#dfffe9', poison:'#aaff00', rage:'#ff5e3b' };

  // ---- formas reutilizáveis ----
  function slash(x,y,dir,color,reach,life){
    reach=reach||74; life=life||9;
    FX.addShape(life,(ctx,age,prog)=>{
      ctx.translate(x,y); if(dir<0) ctx.scale(-1,1);
      ctx.globalAlpha=prog*0.95; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=16;
      const r=reach*(0.55+(1-prog)*0.7);
      ctx.beginPath(); ctx.arc(0,0,r,-1.15,0.55); ctx.arc(0,0,r*0.6,0.55,-1.15,true); ctx.closePath(); ctx.fill();
    });
  }
  function bolt(x,y,color,h,life){
    h=h||130; life=life||8;
    FX.addShape(life,(ctx,age,prog)=>{
      ctx.globalAlpha=prog; ctx.strokeStyle=color; ctx.lineWidth=3; ctx.shadowColor=color; ctx.shadowBlur=14;
      ctx.beginPath(); ctx.moveTo(x, y-h); let segs=7;
      for(let i=1;i<=segs;i++){ const px=x+(R()-0.5)*22*(1-i/segs), py=y-h+h*i/segs; ctx.lineTo(px,py); } ctx.stroke();
    });
  }
  function shockwave(x,y,color,r,life){
    r=r||150; life=life||16;
    FX.addShape(life,(ctx,age,prog)=>{
      ctx.globalAlpha=prog*0.8; ctx.strokeStyle=color; ctx.lineWidth=4+prog*3; ctx.shadowColor=color; ctx.shadowBlur=12;
      const rad=r*(1-prog); ctx.beginPath(); ctx.ellipse(x,y,rad,rad*0.32,0,0,Math.PI*2); ctx.stroke();
    });
  }
  function pillar(x,y,color,life){
    life=life||16;
    FX.addShape(life,(ctx,age,prog)=>{
      ctx.globalAlpha=prog*0.7; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=18;
      const w=34*(0.5+prog*0.6), grow=160*(1-prog);
      ctx.fillRect(x-w/2, y-grow-30, w, grow+40);
    });
    for(let i=0;i<12;i++) FX.emit(x+(R()-.5)*24, y, (R()-.5)*1.4, -2-R()*4, {color,life:26,size:3,g:-0.05});
  }
  function shards(x,y,color,n,life){
    n=n||6; life=life||14;
    FX.addShape(life,(ctx,age,prog)=>{
      ctx.globalAlpha=prog; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, d=(1-prog)*40+8;
        ctx.save(); ctx.translate(x+Math.cos(a)*d, y+Math.sin(a)*d); ctx.rotate(a+Math.PI/2);
        ctx.beginPath(); ctx.moveTo(0,-12*prog-5); ctx.lineTo(5,5); ctx.lineTo(-5,5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    });
  }
  function cloud(x,y,color,size,life){
    size=size||1; life=life||38;
    for(let i=0;i<14*size;i++) FX.emit(x+(R()-.5)*70*size, y+(R()-.5)*40, (R()-.5)*0.6, -0.3-R()*0.6, {color,life:38+R()*22,size:4+R()*4,g:-0.012});
    FX.addShape(life,(ctx,age,prog)=>{ ctx.globalAlpha=prog*0.22; ctx.fillStyle=color;
      for(let i=0;i<5;i++){ const a=age*0.09+i; ctx.beginPath(); ctx.arc(x+Math.cos(a)*30*size, y+Math.sin(a*1.3)*16, 18*size,0,Math.PI*2); ctx.fill(); } });
  }
  function embers(x,y,color,n){ n=n||14; for(let i=0;i<n;i++) FX.emit(x+(R()-.5)*44, y, (R()-.5)*2.2, -1-R()*3.5, {color,life:26+R()*16,size:2+R()*3,g:-0.04}); }
  function wisps(x,y,color,n){ n=n||12; for(let i=0;i<n;i++){ const a=R()*Math.PI*2; FX.emit(x,y,Math.cos(a)*2,Math.sin(a)*2-0.5,{color,life:24+R()*12,size:3,g:0.01}); } }
  function aura(x,y,color,big){
    const m=big?1.6:1;
    FX.addShape(20,(ctx,age,prog)=>{ ctx.globalAlpha=prog*0.8; ctx.strokeStyle=color; ctx.lineWidth=3; ctx.shadowColor=color; ctx.shadowBlur=14;
      const r=(10+(1-prog)*42)*m; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); });
    for(let i=0;i<12;i++){ const a=R()*Math.PI*2, d=46*m; FX.emit(x+Math.cos(a)*d, y+Math.sin(a)*d, -Math.cos(a)*1.6, -Math.sin(a)*1.6, {color,life:22,size:3,g:0}); }
  }
  function sparkles(x,y,color,n){ n=n||14; for(let i=0;i<n;i++) FX.emit(x+(R()-.5)*60, y+(R()-.5)*60, 0, -0.5-R(), {color,life:30,size:2+R()*2,g:-0.02}); }

  /* Carro (Corsa) — entra derrapando para o parry. (x,y)=chão */
  function car(x,y,dir,life){
    life=life||40;
    FX.addShape(life,(ctx,age,prog)=>{
      const W=160,H=42;
      const inSlide=Math.max(0,(prog-0.65)/0.35);        // entra deslizando
      ctx.translate(x + dir*inSlide*260, y);
      if(dir<0) ctx.scale(-1,1);
      ctx.globalAlpha=Math.min(1, prog*3);
      // sombra
      ctx.fillStyle='rgba(0,0,0,.38)';
      ctx.beginPath(); ctx.ellipse(0,-4,W*0.52,8,0,0,Math.PI*2); ctx.fill();
      // carroceria
      ctx.fillStyle='#dfe4ea'; ctx.fillRect(-W/2,-H-14,W,H);
      ctx.fillStyle='#b9c0c8'; ctx.fillRect(-W/2,-20,W,6);          // sombra inferior
      // teto (perfil hatch)
      ctx.fillStyle='#dfe4ea';
      ctx.beginPath();
      ctx.moveTo(-W*0.30,-H-14); ctx.lineTo(-W*0.14,-H-44);
      ctx.lineTo( W*0.20,-H-44); ctx.lineTo( W*0.36,-H-14); ctx.closePath(); ctx.fill();
      // vidros
      ctx.fillStyle='#5b7f9c';
      ctx.beginPath();
      ctx.moveTo(-W*0.26,-H-17); ctx.lineTo(-W*0.13,-H-40);
      ctx.lineTo( W*0.02,-H-40); ctx.lineTo( W*0.02,-H-17); ctx.closePath(); ctx.fill();
      ctx.fillRect(W*0.06,-H-40, W*0.13, 23);
      // porta aberta (o "escudo")
      ctx.fillStyle='#eef1f4'; ctx.fillRect(W*0.30,-H-30, 12, H+18);
      ctx.fillStyle='#5b7f9c'; ctx.fillRect(W*0.31,-H-27, 9, 16);
      // faróis + rodas
      ctx.fillStyle='#ffe9a8'; ctx.fillRect(W*0.44,-H-6,8,7);
      ctx.fillStyle='#c0392b'; ctx.fillRect(-W/2,-H-6,7,7);
      ctx.fillStyle='#1b1b1f';
      [-W*0.30, W*0.28].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,-8,13,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='#8a9099';
      [-W*0.30, W*0.28].forEach(wx=>{ ctx.beginPath(); ctx.arc(wx,-8,5,0,Math.PI*2); ctx.fill(); });
    });
    // fumaça do freio
    for(let i=0;i<16;i++) FX.emit(x-dir*(40+R()*90), y-R()*10, -dir*(1+R()*2), -R()*1.2,
      {color:'#d8d8e0', life:26+R()*16, size:4+R()*4, g:-0.02});
  }

  function play(element, kind, x, y, dir, color){
    const c = color || COLORS[element] || '#fff';
    if(kind==='charge'){ aura(x,y-30,c); return; }
    if(kind==='muzzle'){ FX.spark(x,y,c,10,5); embers(x,y,c,6); return; }

    const big = (kind==='super');
    switch(element){
      case 'fire':
        slash(x+dir*30,y,dir,c,big?110:74,big?12:9); embers(x+dir*30,y,c,big?26:14); FX.spark(x+dir*40,y,c,big?20:12,7);
        if(big) shockwave(x,y+40,c,150); break;
      case 'ice':
        shards(x+dir*24,y,c,big?10:6,big?18:14); FX.spark(x+dir*30,y,'#fff',10,5); if(big) shockwave(x,y+40,c,150); break;
      case 'lightning':
        bolt(x+dir*20,y+10,c,big?180:130,big?10:8); bolt(x+dir*40,y+10,c,110,7); FX.spark(x+dir*30,y,c,14,7); break;
      case 'earth':
        shockwave(x,y+44,c,big?230:150,big?22:16); for(let i=0;i<(big?16:10);i++) FX.emit(x+(R()-.5)*120, y+44, (R()-.5)*3, -3-R()*4, {color:c,life:30,size:3+R()*3,g:0.35,fade:false}); break;
      case 'shadow':
        slash(x+dir*30,y,dir,c,big?110:80,big?12:9); wisps(x+dir*20,y,c,big?20:12); break;
      case 'holy':
        pillar(x,y+30,c,big?22:16); sparkles(x,y,c,big?22:14); break;
      case 'poison':
        cloud(x+dir*20,y,c,big?1.6:1); break;
      case 'rage':
        slash(x+dir*30,y,dir,c,big?116:84,big?12:9); embers(x+dir*30,y,c,big?22:12); FX.spark(x+dir*40,y,c,14,8); break;
      default:
        slash(x+dir*30,y,dir,c,80); FX.spark(x+dir*30,y,c,12,6);
    }
  }

  return { play, COLORS, slash, bolt, shockwave, pillar, shards, cloud, embers, aura, sparkles, car };
})();
