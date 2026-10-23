/* ============================================================
   MOTOR DE SPRITES PIXEL-ART (do zero)
   - "Pixel puppet": humanoide montado por partes em design-pixels
   - Poses procedurais: idle, walk, jump, fall, crouch, block,
     punch (soco), kick (chute), special, hurt, ko, win
   - Cada personagem tem paleta + tipo de corpo + aura únicos
   ============================================================ */
const Sprites = (function(){

  // -------- utilitários de cor --------
  function hexToRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join(''); }
  function shade(hex, amt){ const [r,g,b]=hexToRgb(hex); return rgbToHex(r+amt,g+amt,b+amt); }

  // paleta a partir do personagem (compatível com chars antigos color/color2)
  function palette(c){
    if(c.palette) return c.palette;
    return { skin:'#f1c27d', hair:c.color2||'#3a2a1a', primary:c.color||'#8888ff',
             secondary:c.color2||'#444', shoe:'#2a2a3a', eye:'#141018', aura:c.color||'#ffffff' };
  }

  function bodyType(c){
    if(c.body) return c.body;
    const w=c.weight||1;
    return w>=1.3?'big' : w<=0.85?'slim' : 'normal';
  }

  // -------- esqueleto por pose (design-pixels, y para CIMA, origem = pés-centro) --------
  function skeleton(pose, t, atk, build){
    const big = build==='big', slim = build==='slim';
    const W = big?1.25:slim?0.85:1;     // largura geral
    let hipY=11, shoulderY=22, headY=23, lean=0, bob=0;
    let lead={x:5,y:13}, back={x:-5,y:13};          // mãos
    let leadFoot={x:4,y:0}, backFoot={x:-4,y:0};    // pés
    const ph = t*0.18;

    switch(pose){
      case 'idle':
        bob = Math.sin(t*0.06)*0.7;
        shoulderY+=bob; headY+=bob;
        lead={x:5,y:12+bob}; back={x:-5,y:12+bob};
        break;
      case 'walk': {
        const sw=Math.sin(ph);
        leadFoot={x:4+sw*5, y:Math.max(0,sw*3)};
        backFoot={x:-4-sw*5, y:Math.max(0,-sw*3)};
        lead={x:5-sw*3,y:12}; back={x:-5+sw*3,y:12};
        bob=Math.abs(sw)*0.8; shoulderY+=bob; headY+=bob;
        break; }
      case 'jump':
        leadFoot={x:5,y:6}; backFoot={x:-3,y:8};
        lead={x:7,y:21}; back={x:-7,y:20}; lean=1;
        break;
      case 'fall':
        leadFoot={x:6,y:2}; backFoot={x:-5,y:3};
        lead={x:8,y:18}; back={x:-7,y:16}; lean=-1;
        break;
      case 'crouch':
      case 'block':
        hipY=7; shoulderY=16; headY=17;
        leadFoot={x:6,y:0}; backFoot={x:-6,y:0};
        lead={x:7,y:13}; back={x:4,y:15}; lean=1;     // guarda à frente
        break;
      case 'punch': {
        const e=atk; // 0..1 extensão
        lead={x:6+e*9, y:18}; back={x:-5,y:12};
        lean=1+e*1.5;
        leadFoot={x:5,y:0}; backFoot={x:-5,y:0};
        break; }
      case 'kick': {
        const e=atk;
        leadFoot={x:5+e*10, y:4+e*5}; backFoot={x:-4,y:0};
        lead={x:-2,y:15}; back={x:-7,y:12};
        lean=-1-e*1.5; hipY=10;
        break; }
      case 'special': {
        const e=atk;
        lead={x:8+e*7,y:19}; back={x:4+e*5,y:17};
        leadFoot={x:6,y:0}; backFoot={x:-6,y:0};
        lean=-1+e*3; bob=Math.sin(t*0.4)*0.6;
        break; }
      case 'thrust': {            // estocada (lança / adaga / bastão)
        const e=atk;
        lead={x:5+e*10, y:16}; back={x:-4,y:13};
        lean=1+e*1.2;
        leadFoot={x:5+e*3,y:0}; backFoot={x:-6,y:0}; hipY=10.5;
        break; }
      case 'swing': {             // golpe descendente em arco (espada/machado/foice/marreta)
        const e=atk;             // 0=erguido atrás, 1=à frente embaixo
        const ang = Math.PI*(0.95 - e*0.95);   // ~171° -> ~0°
        lead={x:Math.cos(ang)*9 + 3, y:14 + Math.sin(ang)*9};
        back={x:-4,y:13};
        lean=-1.5 + e*3;
        leadFoot={x:5,y:0}; backFoot={x:-5,y:0};
        break; }
      case 'aim': {               // mira de arco
        const e=atk;
        lead={x:8,y:18}; back={x:3-e*2,y:16};
        lean=-1; leadFoot={x:5,y:0}; backFoot={x:-6,y:0};
        break; }
      case 'hurt':
        lean=-3; headY+=0.5;
        lead={x:1,y:11}; back={x:-9,y:16};
        leadFoot={x:3,y:0}; backFoot={x:-6,y:0};
        break;
      case 'ko':
        hipY=3; shoulderY=4; headY=4;
        lead={x:-10,y:3}; back={x:-12,y:5};
        leadFoot={x:9,y:1}; backFoot={x:6,y:3}; lean=-6;
        break;
      case 'win':
        lead={x:3,y:23}; back={x:-3,y:23}; bob=Math.sin(t*0.2)*1.2;
        shoulderY+=bob; headY+=bob;
        break;
    }
    return {hipY, shoulderY, headY, lean, lead, back, leadFoot, backFoot, W};
  }

  // comprimento (em design-pixels) de cada arma
  const WLEN = { sword:16, axe:12, hammer:11, spear:23, scythe:16, staff:18, holystaff:18, bow:6, daggers:9 };

  // -------- desenho --------
  function draw(ctx, char, o){
    const dir = (o.facing>=0)?1:-1;
    const s = o.scale||4;
    const ox = o.x, oy = o.y;             // pés-centro / linha do chão (tela)
    const pal = palette(char);
    const build = bodyType(char);
    const sk = skeleton(o.pose||'idle', o.t||0, (o.atk==null?1:o.atk), build);
    const flash = o.flash;

    // helpers de transformação (dp y-up -> tela)
    function rect(dx,dy,w,h,color){
      const sx = ox + dir*dx*s;
      const sy = oy - (dy+h)*s;
      const X = dir>0 ? sx : sx - w*s;
      ctx.fillStyle = flash? '#ffffff' : color;
      ctx.fillRect(Math.round(X), Math.round(sy), Math.ceil(w*s), Math.ceil(h*s));
    }
    function seg(x0,y0,x1,y1,thick,color){
      const steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));
      for(let i=0;i<=steps;i++){
        const x=x0+(x1-x0)*i/steps, y=y0+(y1-y0)*i/steps;
        rect(x-thick/2, y-thick/2, thick, thick, color);
      }
    }
    // membro com cotovelo/joelho dobrado
    function limb(x0,y0,x1,y1,bend,thick,color,tipColor){
      const mx=(x0+x1)/2, my=(y0+y1)/2;
      const dx=x1-x0, dy=y1-y0, len=Math.hypot(dx,dy)||1;
      const nx=-dy/len, ny=dx/len;          // normal
      const ex=mx+nx*bend, ey=my+ny*bend;   // ponto da articulação
      seg(x0,y0,ex,ey,thick,color);
      seg(ex,ey,x1,y1,thick,color);
      if(tipColor) rect(x1-thick/2, y1-thick/2, thick, thick, tipColor);
    }

    const W=sk.W, tW=6*W;
    const leadSh = {x:1.5, y:sk.shoulderY};
    const backSh = {x:-1.5, y:sk.shoulderY};
    const leadHip= {x:1.5, y:sk.hipY};
    const backHip= {x:-1.5, y:sk.hipY};
    const headCX = sk.lean;

    // tons de sombra/luz
    const dkPrimary=shade(pal.primary,-46), ltPrimary=shade(pal.primary,28);
    const dkSkin=shade(pal.skin,-34), ltSkin=shade(pal.skin,20);
    const dkShoe=shade(pal.shoe,-26);
    const OL = flash? '#ffffff' : '#120a1c';      // contorno

    // helpers com contorno
    function orect(dx,dy,w,h,color){ rect(dx-0.45,dy-0.45,w+0.9,h+0.9, OL); rect(dx,dy,w,h,color); }
    function odot(cx,cy,sz,color){ rect(cx-sz/2-0.45,cy-sz/2-0.45,sz+0.9,sz+0.9,OL); rect(cx-sz/2,cy-sz/2,sz,sz,color); }
    function olimb(x0,y0,x1,y1,bend,thick,color){ limb(x0,y0,x1,y1,bend,thick+1.1, OL); limb(x0,y0,x1,y1,bend,thick,color,null); }

    // aura / carga
    if(o.charge || o.pose==='special'){
      ctx.save(); ctx.globalAlpha=0.30;
      for(let i=0;i<5;i++){
        const a=(o.t*0.1)+i*1.4; const rad=10+Math.sin(o.t*0.2+i)*3;
        rect(Math.cos(a)*rad/1.2, 8+Math.sin(a)*rad, 2.4,2.4, pal.aura);
      }
      ctx.restore();
    }

    // ---- CAPA (atrás de tudo) ----
    if(char.sig==='cape'){
      const torsoH0=sk.shoulderY-sk.hipY;
      orect(-tW/2-1.4+headCX*0.3, sk.hipY-1, tW+2.8, torsoH0+3, shade(pal.aura,-34));
      rect(-tW/2-1+headCX*0.3, sk.shoulderY-2, tW+2, 1.6, shade(pal.aura,-8));
    }

    // ---- MEMBROS DE TRÁS ----
    olimb(backSh.x,backSh.y, sk.back.x,sk.back.y, dir*2, 3.0, dkPrimary);  odot(sk.back.x,sk.back.y,2.6,dkSkin);
    olimb(backHip.x,backHip.y, sk.backFoot.x,sk.backFoot.y, dir*-2.5, 3.8*W, dkPrimary);
    odot(sk.backFoot.x+(dir>0?1.0:-1.0), sk.backFoot.y+0.4, 4.0*W, dkShoe);

    // ---- TORSO detalhado ----
    const torsoH=sk.shoulderY-sk.hipY, txL=-tW/2+headCX*0.3;
    orect(txL, sk.hipY, tW, torsoH, pal.primary);
    rect(txL+0.8, sk.hipY+1.2, tW*0.34, torsoH-2.4, ltPrimary);       // brilho central
    rect(txL+tW-1.5, sk.hipY+0.6, 1.5, torsoH-1, dkPrimary);          // sombra lateral
    rect(txL, sk.hipY, tW, 1.9, pal.secondary);                        // cinto
    rect(txL+0.5, sk.hipY+0.4, tW-1, 0.7, shade(pal.secondary,34));    // brilho do cinto
    // emblema no peito
    odot(headCX*0.3, sk.hipY+torsoH*0.52, 3.0, pal.secondary);
    rect(headCX*0.3-0.7, sk.hipY+torsoH*0.52-0.7, 1.4, 1.4, ltPrimary);
    // ombreiras
    orect(backSh.x-2.3, sk.shoulderY-2.6, 4.4, 3.2, pal.secondary);
    orect(leadSh.x-2.3, sk.shoulderY-2.6, 4.7, 3.4, shade(pal.secondary,14));

    // ---- PERNA DA FRENTE (+ joelheira + bota) ----
    olimb(leadHip.x,leadHip.y, sk.leadFoot.x,sk.leadFoot.y, dir*2.5, 4.0*W, pal.primary);
    rect((leadHip.x+sk.leadFoot.x)/2-1, (leadHip.y+sk.leadFoot.y)/2-1, 2.2, 2.2, pal.secondary); // joelheira
    odot(sk.leadFoot.x+(dir>0?1.4:-1.4), sk.leadFoot.y+0.4, 4.6*W, pal.shoe);
    rect(sk.leadFoot.x-2.0+(dir>0?1.4:-1.4), sk.leadFoot.y+1.7, 4.4*W, 1.1, dkShoe);            // sola

    // ---- CABEÇA detalhada ----
    const hW=8.6*W, hH=8.6, hx=headCX-hW/2, hy=sk.shoulderY-0.6;
    orect(hx,hy,hW,hH, pal.skin);
    rect(hx+ (dir>0?0.8:hW*0.42), hy+hH*0.18, hW*0.46, hH*0.5, ltSkin);     // luz no rosto
    rect(dir>0? hx+hW-1.5 : hx, hy+0.8, 1.5, hH-1.6, dkSkin);               // sombra atrás
    // cabelo
    rect(hx-0.5, hy+hH-2.8, hW+1, 3.4, pal.hair);
    rect(hx-0.5, hy+hH-1.0, hW+1, 1.0, shade(pal.hair,26));                 // brilho
    rect(dir>0? hx-0.7 : hx+hW-1.7, hy+1.4, 2.2, hH-2.2, pal.hair);         // nuca
    rect(dir>0? hx-0.6 : hx+hW-1.0, hy+hH*0.42, 1.6, 2.2, dkSkin);          // orelha
    // rosto: 2 olhos, sobrancelhas, boca
    const attk=['punch','kick','swing','thrust','special','aim'].includes(o.pose);
    const ko=(o.pose==='ko'||o.pose==='hurt');
    const ex2=headCX + dir*1.0, ex1=headCX + dir*3.4;          // olho da frente / de trás
    if(ko){
      rect(ex2-1.1,hy+hH*0.40,2.4,2.4,pal.eye); rect(ex1-1.0,hy+hH*0.40,2.0,2.0,pal.eye); // X
      rect(headCX+dir*1.0, hy+hH*0.12, 3.0, 2.2, '#5a1414');                                // boca aberta
    } else {
      rect(ex2-1.0,hy+hH*0.40,2.0,2.0,'#fff'); rect(ex2-0.6+dir*0.3,hy+hH*0.42,1.2,1.6,pal.eye);
      rect(ex1-0.9,hy+hH*0.40,1.6,1.8,'#fff'); rect(ex1-0.5+dir*0.3,hy+hH*0.42,1.0,1.4,pal.eye);
      rect(ex2-1.2,hy+hH*0.66, 2.4,0.9, dkSkin); rect(ex1-1.1,hy+hH*0.66+(attk?0.6:0), 2.1,0.9, dkSkin); // sobrancelhas
      if(attk) rect(headCX+dir*1.2, hy+hH*0.16, 2.6,1.6, '#4a1414');        // grito
      else rect(headCX+dir*1.4, hy+hH*0.2, 1.9,0.9, dkSkin);               // boca
    }

    // ---- BRAÇO DA FRENTE (+ mão + punho) ----
    olimb(leadSh.x,leadSh.y, sk.lead.x,sk.lead.y, dir*2, 3.0, pal.primary);
    odot(sk.lead.x, sk.lead.y, 2.8, pal.skin);
    rect(sk.lead.x-1.4, sk.lead.y-1.5, 2.8, 1.3, pal.secondary);            // punho/luva

    // ---- ARMA ----
    if(char.weapon && o.pose!=='ko'){
      drawWeapon(char.weapon, leadSh, sk.lead);
    }
    function drawWeapon(wp, sh, hand){
      const dx=hand.x-sh.x, dy=hand.y-sh.y; const l0=Math.hypot(dx,dy)||1;
      const ux=dx/l0, uy=dy/l0;                 // direção do braço (forward)
      const px=-uy, py=ux;                        // perpendicular
      const L=WLEN[wp.type]||14;
      const tx=hand.x+ux*L, ty=hand.y+uy*L;       // ponta
      const col=wp.color||'#aaa', edge=wp.edge||'#fff', aura=wp.aura||edge;
      const glow=(o.charge||o.pose==='special');
      if(glow){ ctx.save(); ctx.shadowColor=aura; ctx.shadowBlur=10; }
      switch(wp.type){
        case 'sword':
          seg(hand.x,hand.y,tx,ty,2.4,col);
          seg(hand.x+ux*L*0.5,hand.y+uy*L*0.5,tx,ty,1.0,edge);
          seg(hand.x-px*2.6,hand.y-py*2.6, hand.x+px*2.6,hand.y+py*2.6, 1.8, '#8a6a2a');
          break;
        case 'axe':
          seg(hand.x,hand.y,tx,ty,2.0,'#5a3a1a');
          rect(tx-3,ty-2,5,4,col); rect(tx-3+ux,ty-2,5,2,edge);
          break;
        case 'hammer':
          seg(hand.x,hand.y,tx,ty,2.2,'#5a4028');
          rect(tx-3.2,ty-3.2,6.4,6.4,col); rect(tx-3.2,ty-3.2,6.4,2,edge);
          break;
        case 'spear':
          seg(hand.x-ux*7,hand.y-uy*7,tx,ty,1.6,'#7a5a2a');
          rect(tx-1.4+ux,ty-1.4+uy,3,3,edge);
          break;
        case 'scythe':
          seg(hand.x,hand.y,tx,ty,1.8,'#3a2a40');
          for(let i=0;i<=6;i++){ const a=i/6; const cx=tx+px*a*8-ux*Math.sin(a*Math.PI)*5, cy=ty+py*a*8-uy*Math.sin(a*Math.PI)*5; rect(cx-1.1,cy-1.1,2.4,2.4,edge); }
          break;
        case 'staff':
        case 'holystaff':
          seg(hand.x-ux*5,hand.y-uy*5,tx,ty,1.8,col);
          rect(tx-2,ty-2,4,4,aura); rect(tx-1,ty-1,2,2,'#fff');
          break;
        case 'bow':
          for(let i=-4;i<=4;i++){ const a=i/4; const cx=hand.x+px*a*8+ux*(1-Math.abs(a))*4, cy=hand.y+py*a*8+uy*(1-Math.abs(a))*4; rect(cx-1,cy-1,2,2,col); }
          seg(hand.x+px*8,hand.y+py*8, hand.x-px*8,hand.y-py*8, 0.8, edge);
          break;
        case 'daggers':
          seg(hand.x,hand.y,tx,ty,2.0,col); rect(tx-1,ty-1,2.2,2.2,edge);
          seg(sk.back.x,sk.back.y, sk.back.x+ux*L*0.8, sk.back.y+uy*L*0.8, 1.8, shade(col,-20));
          break;
        default:
          seg(hand.x,hand.y,tx,ty,2.0,col);
      }
      if(glow) ctx.restore();
    }

    // assinatura visual por personagem (faixa, capa, etc.)
    if(char.sig==='band'){ rect(hx-0.4, hy+hH-3.4, hW+0.8, 1.4, pal.aura); }
    if(char.sig==='horns'){ rect(hx-1, hy+hH-1, 2,3, pal.aura); rect(hx+hW-1, hy+hH-1, 2,3, pal.aura); }
    if(char.sig==='visor'){ rect(hx, hy+hH*0.42, hW, 2.2, pal.aura); }

    // overlay branco no flash
    if(o.koGlow){ ctx.save(); ctx.globalAlpha=0.5; rect(-tW,0,tW*2,sk.shoulderY+10,'#fff'); ctx.restore(); }
  }

  // sombra no chão
  function shadow(ctx, x, y, w, alpha){
    ctx.save(); ctx.fillStyle='rgba(0,0,0,'+(alpha||0.35)+')';
    ctx.beginPath(); ctx.ellipse(x,y,w,w*0.22,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }

  /* ---- DESENHO POR SPRITESHEET (com fallback procedural) ----
     o.targetH = altura desejada do personagem em pixels de tela
     o.animT   = frames decorridos da ação atual (para animações não-loop) */
  function sheetOf(char){
    if(!char.sheet || typeof SpriteSheet==='undefined') return null;
    const s=SpriteSheet.cache[char.sheet] || SpriteSheet.load(char.sheet);
    return (s && s.ready)? s : null;
  }

  /* ---- FORMAS (personagem que troca de sprite no meio da luta) ----
     char.forms = [{sheet, anims, scaleAdj}, ...] — a forma 0 é a base.
     Devolve uma "visão" do personagem já apontando para a sheet/anims da
     forma pedida. Cada visão guarda o próprio _baseH, senão a escala de
     uma forma vazaria para a outra e o personagem mudaria de tamanho ao
     transformar.                                                        */
  function formOf(char, idx){
    if(!char || !char.forms || !char.forms.length) return char;
    const i=Math.max(0, Math.min(idx|0, char.forms.length-1));
    const f=char.forms[i];
    if(!f._view){
      f._view=Object.create(char);                 // herda stats/paleta/skills
      f._view.sheet=f.sheet; f._view.anims=f.anims||char.anims;
      if(f.scaleAdj!=null) f._view.scaleAdj=f.scaleAdj;
      f._view._baseH=null;                         // altura própria desta forma
      f._view._formIdx=i;
    }
    return f._view;
  }

  /* ---- SKINS (visual escolhido pelo jogador, não muda no meio da luta
     como as formas) — mesma ideia do formOf: uma "visão" do personagem
     que aponta pra folha da skin, mantendo tudo mais (stats, skills,
     paleta de fallback) herdado do original. skinId nulo/'padrao' (ou
     sem `sheet` próprio) devolve o personagem original sem view nenhuma. */
  function skinOf(char, skinId){
    if(!char || !char.skins || !skinId || skinId==='padrao') return char;
    const s=char.skins.find(x=>x.id===skinId);
    if(!s || !s.sheet) return char;
    if(!s._view){
      s._view=Object.create(char);
      s._view.sheet=s.sheet; s._view.anims=Object.assign({}, char.anims, s.anims||{});
      if(s.scaleAdj!=null) s._view.scaleAdj=s.scaleAdj;
      s._view._baseH=null;
      s._view._skinId=s.id;
    }
    return s._view;
  }
  // altura de referência (frame idle) -> mantém a mesma escala em todas as poses
  /* Cada forma normaliza pela ALTURA DO PRÓPRIO IDLE. Assim toda forma
     desenha com a mesma altura de tela (targetH), mesmo que as folhas
     tenham escalas de desenho diferentes entre si.                     */
  function baseHeight(char, sheet){
    if(char._baseH) return char._baseH;
    const a=(char.anims&&char.anims.idle)||null;
    const fr=a? SpriteSheet.pick(sheet, a.band, (a.frames||[0])[0]) : (sheet.frames[0]||null);
    char._baseH = fr? fr.h : 100;
    return char._baseH;
  }
  /* `prog` (0–1, opcional): quem chama decide em que PONTO da animação
     ela está, em vez do relógio de fps. A batalha 3x3 usa isso pra
     espalhar a sequência inteira de um golpe pelo tempo exato dele — o
     quadro do impacto cai no impacto, não importa quantos quadros a
     sequência tenha. Só vale pra animação sem loop. */
  function frameFor(char, sheet, pose, t, animT, prog){
    const anims=char.anims||{};
    const a = anims[pose] || anims.idle;
    if(!a) return null;
    const seq=a.frames&&a.frames.length? a.frames : [0];
    let idx;
    if(a.loop===false && prog!=null){
      idx = Math.max(0, Math.min(seq.length-1, Math.floor(prog*seq.length)));
    } else if(a.loop===false){
      idx = Math.min(seq.length-1, Math.floor((animT||0)*(a.fps||12)/60));
    } else {
      idx = Math.floor(((t||0)*(a.fps||8)/60)) % seq.length;
    }
    /* cada passo de `frames` pode ser:
         3         -> quadro 3 da faixa `band`
         [7, 0]    -> quadro 0 da FAIXA 7
       Misturar faixas era impossível antes, e as poses boas de uma
       animação quase nunca moram todas na mesma faixa da folha (o
       descanso da Smergula usa a guarda da faixa 2 e a pose relaxada
       da faixa 7). Número continua funcionando igual. */
    const passo = seq[idx];
    /* `{x,y,w,h}` = retângulo DIRETO da folha, pra pose que o recorte
       automático não detecta (o nocaute deitado do Tupas tem 32px de
       altura e o detector descarta borrão com menos de 40). */
    /* `{folha:'assets/x.png', q:[faixa,quadro]}` = quadro de OUTRA folha
       (o Smergulão normal usa a moita e a bomba de fumaça da folha
       furtiva). O quadro volta marcado com `_folha` e quem desenha usa
       ela no lugar da folha do personagem. */
    /* `r:{x,y,w,h}` no lugar do `q` = retângulo direto da outra folha, e
       `esc` = escala extra do quadro, pra folha desenhada em OUTRA
       resolução (a 1ª folha da Prodocimo tem metade do tamanho das outras
       duas). Quem desenha multiplica a escala por `_esc`. */
    if(passo && typeof passo==='object' && passo.folha){
      const outra = SpriteSheet.load(passo.folha);
      const fo = !(outra && outra.ready) ? null
        : passo.r ? { x:passo.r.x, y:passo.r.y, w:passo.r.w, h:passo.r.h }
        : SpriteSheet.pick(outra, passo.q[0], passo.q[1]);
      return fo ? Object.assign({}, fo, { _folha:outra, _esc:passo.esc||1 }) : null;
    }
    let fr = (passo && typeof passo==='object' && !Array.isArray(passo))
      ? { x:passo.x, y:passo.y, w:passo.w, h:passo.h }
      : Array.isArray(passo)
      ? SpriteSheet.pick(sheet, passo[0], passo[1])
      : SpriteSheet.pick(sheet, a.band, passo);
    // recorte opcional [x,y,w,h] em frações — isola o lutador quando o
    // quadro original traz o oponente junto. `[faixa, quadro, recorte]`
    // recorta SÓ aquele passo (o idle do Careca alterna um quadro inteiro
    // com metade de um quadro que a folha grudou com outra pose).
    const recorte = (Array.isArray(passo) && passo[2]) || a.crop;
    if(fr && recorte){
      const c=recorte;
      fr={ x: fr.x + Math.round(fr.w*c[0]), y: fr.y + Math.round(fr.h*c[1]),
           w: Math.max(1,Math.round(fr.w*c[2])), h: Math.max(1,Math.round(fr.h*c[3])) };
    }
    return fr;
  }
  function drawChar(ctx, charOrig, o){
    const char=formOf(charOrig, o.form||0);     // troca de forma (ex.: Mecas ciborgue)
    const sheet=sheetOf(char);
    if(sheet && char.anims){
      const fr=frameFor(char, sheet, o.pose||'idle', o.t, o.animT);
      if(fr){
        // escala única por personagem (altura do idle) -> todos ficam do mesmo tamanho
        const sc=(o.targetH||110)*(char.scaleAdj||1)/baseHeight(char, sheet)*(fr._esc||1);
        const a=(char.anims[o.pose||'idle']||{}).anchor;
        if(SpriteSheet.drawFrame(ctx, fr._folha||sheet, fr, o.x, o.y, o.facing, sc, o.flash, a)) return true;
      }
    }
    draw(ctx, char, o);          // fallback: boneco procedural
    return false;
  }

  /* ---- render para o modo 3x3 (altura FIXA e pose livre) ----
     Diferente do renderTo, aqui a escala NÃO vem do tamanho do quadro
     atual: vem da altura do idle (baseHeight). Sem isso o lutador
     encolheria/cresceria a cada troca de pose no meio da animação.
     o = {pose, t, animT, form, flash, targetH, dir, dx, dy}          */
  /* CHÃO debaixo do lutador (diorama do 3x3, 1.33): sombra oval que
     encolhe quando ele sobe (pulo/comemoração) e, opcional, um ANEL
     pulsando — de quem é a vez, ou de quem dá pra mirar agora.
     `chao = { sombra:true, anel:'#cor'|null, pulso:0..1, sobe:px }` */
  function desenharChao(ctx, cx, cy, larg, chao){
    const sobe = Math.max(0, chao.sobe||0);
    const k = Math.max(0.45, 1 - sobe/(larg*2.2));
    if(chao.sombra!==false){
      ctx.save();
      ctx.globalAlpha = 0.42*k;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(cx, cy, larg*k, larg*0.26*k, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    if(chao.anel){
      const p = chao.pulso!=null ? chao.pulso : 0.5;
      const r = larg*(1.05 + p*0.12);
      ctx.save();
      ctx.strokeStyle = chao.anel; ctx.lineWidth = Math.max(2, Math.round(larg*0.07));
      ctx.globalAlpha = 0.55 + p*0.4;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r*0.28, 0, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 0.18 + p*0.12; ctx.fillStyle = chao.anel;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r*0.28, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function renderPose(canvas, charOrig, o){
    o=o||{};
    const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const char=formOf(charOrig, o.form||0);
    const sheet=sheetOf(char);
    const alvoH=o.targetH || (canvas.height-16);
    /* com chão desenhado, os pés sobem um tico pra sombra caber inteira
       dentro do quadro (senão a metade de baixo da elipse era cortada) */
    const piso = o.chao ? canvas.height - Math.max(4, Math.round(alvoH*0.085)) : canvas.height-3;
    const x=canvas.width/2 + (o.dx||0);
    const y=piso + (o.dy||0);
    // a sombra fica no CHÃO (sem o dy): quem pula deixa ela pra trás, menor
    if(o.chao) desenharChao(ctx, x, piso, alvoH*0.30, Object.assign({ sobe: -(o.dy||0) }, o.chao));
    if(sheet && char.anims){
      const fr=frameFor(char, sheet, o.pose||'idle', o.t, (o.animT==null? o.t : o.animT), o.prog);
      if(fr){
        const sc=alvoH*(char.scaleAdj||1)/baseHeight(char, sheet)*(fr._esc||1);
        const an=char.anims[o.pose||'idle']||char.anims.idle||{};
        /* `respira: N` (opcional, por anim): sobe e desce N px devagar.
           Pra pose de UM quadro só (a folha não tem um segundo idle) não
           ficar parada feito estátua. Só quem marca na anim sente. */
        const yy = an.respira ? y - Math.round((Math.sin((o.t||0)*0.07)+1)/2*an.respira) : y;
        if(SpriteSheet.drawFrame(ctx, fr._folha||sheet, fr, x, yy, o.dir||1, sc, o.flash, an.anchor)) return;
      }
    }
    draw(ctx, char, {x, y, facing:o.dir||1, scale:alvoH/34, pose:o.pose||'idle',
                     t:o.t||0, atk:(o.atk==null?1:o.atk), flash:o.flash});
  }

  /* ---- RETRATO (avatar de perfil) ----
     Recorta só a região do ROSTO a partir do quadro `idle`, em vez de
     desenhar o personagem inteiro. As folhas não têm um retrato marcado
     (só a folha de forma antiga tem uma faixa "0=retrato" que não é mais
     usada) — então o recorte é uma APROXIMAÇÃO por fração da caixa do
     quadro. `char.faceCrop = [x,y,w,h]` (frações 0–1) ajusta a mão nos
     casos em que o padrão erra (cabelo mais alto/baixo, corpo mais largo
     etc.); sem isso usa um padrão que funciona para a maioria do elenco
     (medido olhando cada personagem — ver CONTEXT.md). */
  /* Era [0.30,0.03,0.40,0.34] — perto demais: virava um close extremo
     que, sem marcação de rosto de verdade na folha, acertava metade da
     cara em muito personagem (ficava feio, sem cabelo/contexto pra
     reconhecer quem é). Alargado 1,6x mantendo o mesmo centro. */
  const FACE_CROP_PADRAO = [0.18, 0.00, 0.64, 0.54];
  function renderFace(canvas, charOrig, opts){
    opts=opts||{};
    const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const char=formOf(charOrig, 0);
    const sheet=sheetOf(char);
    if(!sheet || !char.anims || !char.anims.idle){
      // sem folha carregada ainda (ou personagem 100% procedural): melhor
      // desenhar o corpo pequeno do que deixar o quadrado vazio.
      draw(ctx, char, {x:canvas.width/2, y:canvas.height+8, facing:1,
                       scale:canvas.height/42, pose:'idle', t:0, atk:1});
      return false;
    }
    const a=char.anims.idle;
    const fr=SpriteSheet.pick(sheet, a.band, (a.frames||[0])[0]);
    if(!fr) return false;
    const rc = char.faceCrop || FACE_CROP_PADRAO;
    const sx=fr.x+fr.w*rc[0], sy=fr.y+fr.h*rc[1], sw=fr.w*rc[2], sh=fr.h*rc[3];
    // "cover": preenche o quadrado inteiro sem esticar a proporção
    const escala=Math.max(canvas.width/sw, canvas.height/sh);
    const dw=sw*escala, dh=sh*escala;
    ctx.drawImage(sheet.img, sx, sy, sw, sh, (canvas.width-dw)/2, (canvas.height-dh)/2, dw, dh);
    return true;
  }

  // render utilitário para telas (seleção/HUD)
  function renderTo(canvas, charOrig, pose, scale, t, form){
    const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const char=formOf(charOrig, form||0);
    const sheet=sheetOf(char);
    if(sheet && char.anims){
      const fr=frameFor(char, sheet, pose||'idle', t, t);
      if(fr){
        const sc=Math.min((canvas.height-8)/fr.h, (canvas.width-6)/fr.w);
        // mesma `respira` do renderPose: sem isso o idle de um quadro só
        // (Careca) ficava parado na montagem de time, no draft e no catálogo
        const an=char.anims[pose||'idle']||char.anims.idle||{};
        const yy=canvas.height-4 - (an.respira ? Math.round((Math.sin((t||0)*0.07)+1)/2*an.respira) : 0);
        SpriteSheet.drawFrame(ctx, sheet, fr, canvas.width/2, yy, 1, sc, false);
        return;
      }
    }
    draw(ctx, char, {x:canvas.width/2, y:canvas.height-6, facing:1, scale:scale||3, pose:pose||'idle', t:t||0, atk:1});
  }

  /* ---- FAIXA DOS OLHOS (cut-in da ultimate) ----
     `olhos:{ q:[faixa,quadro], r:[x,y,w,h], folha? }` no personagem ou na
     FORMA (a forma manda). r em frações do quadro q. Devolve o pedaço da
     folha pronto pra desenhar: { img, x, y, w, h } — ou null se a folha
     ainda não carregou / o personagem não tem recorte. */
  function olhosDe(charOrig, forma){
    if(!charOrig) return null;
    const fm = charOrig.forms ? charOrig.forms[Math.max(0, Math.min(forma||0, charOrig.forms.length-1))] : null;
    const o = (fm && fm.olhos) || charOrig.olhos;
    if(!o || typeof SpriteSheet==='undefined') return null;
    const sh = SpriteSheet.load(o.folha || (fm && fm.sheet) || charOrig.sheet);
    if(!sh || !sh.ready) return null;
    const fr = SpriteSheet.pick(sh, o.q[0], o.q[1]); if(!fr) return null;
    return { img:sh.img, x:Math.round(fr.x+fr.w*o.r[0]), y:Math.round(fr.y+fr.h*o.r[1]),
             w:Math.max(1,Math.round(fr.w*o.r[2])), h:Math.max(1,Math.round(fr.h*o.r[3])) };
  }

  return { draw, drawChar, shadow, renderTo, renderPose, renderFace, palette, shade, formOf, skinOf, olhosDe };
})();
