/* ============================================================
   OW PINTOR — monta os mapas do mundo aberto a partir de COMANDOS
   ------------------------------------------------------------
   Ninguém escreve mapa tile por tile. Cada região (js/mapas/*.js) é uma
   lista de chamadas: retângulo de terreno, estrada, rio, muralha, casa,
   praça, espalhar árvores… com um gerador de números de SEMENTE FIXA
   (mulberry32): a mesma semente sempre dá o mesmo mapa, e mexer numa
   região não mexe nas outras.

   O mapa gerado:
     terr  Uint8Array   terreno de cada célula (ids de OWArte.TERR)
     col   Uint8Array   colisão EXTRA por célula (1 = parede), além do
                        terreno que já é sólido (água, lava, muro)
     objs  []           objetos com âncora nos pés (x,y em px de mundo),
                        ordenados por Y na hora de desenhar
     chao  []           decalques desenhados DENTRO do chunk (faixa de
                        pedestre, tapete, rachadura…)
     portas, saidas, pontos, zonas, luzes
   Coordenadas dos comandos em TILES; o objeto guarda em px (tile×32).
   ============================================================ */
const OWPintor = (function(){
  const T = 32;

  function rng(semente){
    let a = semente>>>0;
    return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  }
  // ruído de valor 2D (bordas orgânicas de lago, costa, mancha)
  function ruido(semente){
    const h=(x,y)=>{ let n=(x*374761393+y*668265263+semente*982451653)|0; n=(n^(n>>>13))*1274126177|0; return ((n^(n>>>16))>>>0)/4294967296; };
    const sm=t=>t*t*(3-2*t);
    return function(x,y){
      const xi=Math.floor(x), yi=Math.floor(y), xf=sm(x-xi), yf=sm(y-yi);
      const a=h(xi,yi), b=h(xi+1,yi), c=h(xi,yi+1), d=h(xi+1,yi+1);
      return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;
    };
  }

  function novo(def){
    const w=def.w, h=def.h;
    const m = {
      id:def.id, nome:def.nome, w, h, semente:def.semente||1,
      terr:new Uint8Array(w*h), col:new Uint8Array(w*h),
      objs:[], chao:[], portas:[], saidas:[], pontos:{}, zonas:[], luzes:[], gatilhosMapa:[],
      ceu:def.ceu||'litoral', interior:!!def.interior, musica:def.musica||null,
      rand:rng(def.semente||1), noise:ruido(def.semente||1)
    };
    const dentro=(x,y)=>x>=0&&y>=0&&x<w&&y<h;
    const id=OWArte.tid;
    /* INTERIOR AUTOMÁTICO: região com `autoInteriores:true` → toda casa,
       prédio e construção sem `entra` ganha uma porta pra um interior
       gerado (js/mapas/interiores_auto.js), com id 'int:<região>:<x>:<y>'.
       `interior:false` no comando deixa a construção fechada. */
    function portaAuto(px_, py_, o, tipo, larg){
      if(o.entra || o.interior===false || !def.autoInteriores || typeof Interiores==='undefined') return;
      const idI='int:'+def.id+':'+px_+':'+py_;
      const ent=Interiores.registrar(idI, { tipo:o.interior||tipo, fora:def.id, porta:[px_,py_], nome:o.nomeLocal||null, larg, cor:o.telhado||o.cor, extra:o.interiorExtra||null,
        moradores:def.moradores||null, falasMoradores:def.falasMoradores||null });
      P.livre(px_,py_,1,1);
      m.portas.push({ x:px_, y:py_, para:[idI, ent[0], ent[1], 3], trava:o.travaInterior||null, nome:o.nomeLocal||null });
    }
    const P = {
      m,
      /* ---------- terreno ---------- */
      ret(x,y,ww,hh,t){ const v=id(t); for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) if(dentro(i,j)) m.terr[j*w+i]=v; return P; },
      celula(x,y,t){ if(dentro(x,y)) m.terr[y*w+x]=id(t); return P; },
      elipse(cx,cy,rx,ry,t){ const v=id(t); for(let j=Math.floor(cy-ry);j<=cy+ry;j++) for(let i=Math.floor(cx-rx);i<=cx+rx;i++){ const dx=(i+0.5-cx)/rx, dy=(j+0.5-cy)/ry; if(dx*dx+dy*dy<=1 && dentro(i,j)) m.terr[j*w+i]=v; } return P; },
      /* mancha orgânica: elipse com a borda mexida pelo ruído */
      mancha(cx,cy,rx,ry,t,irreg){ const v=id(t), ir=irreg==null?0.35:irreg;
        for(let j=Math.floor(cy-ry*1.5);j<=cy+ry*1.5;j++) for(let i=Math.floor(cx-rx*1.5);i<=cx+rx*1.5;i++){
          if(!dentro(i,j)) continue; const dx=(i+0.5-cx)/rx, dy=(j+0.5-cy)/ry; const d=Math.sqrt(dx*dx+dy*dy);
          if(d <= 1 + (m.noise(i*0.18,j*0.18)-0.5)*2*ir) m.terr[j*w+i]=v; }
        return P; },
      /* polígono (lista de [x,y] em tiles), com borda opcionalmente ruidosa */
      poligono(pts,t,ruidoAmp){ const v=id(t); let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9; pts.forEach(p=>{ mnx=Math.min(mnx,p[0]); mny=Math.min(mny,p[1]); mxx=Math.max(mxx,p[0]); mxy=Math.max(mxy,p[1]); });
        const amp=ruidoAmp||0;
        for(let j=Math.floor(mny-amp);j<=mxy+amp;j++) for(let i=Math.floor(mnx-amp);i<=mxx+amp;i++){
          if(!dentro(i,j)) continue;
          const ox = amp ? (m.noise(i*0.15,j*0.15)-0.5)*2*amp : 0, oy = amp ? (m.noise(j*0.15+40,i*0.15)-0.5)*2*amp : 0;
          if(dentroPoligono(i+0.5+ox, j+0.5+oy, pts)) m.terr[j*w+i]=v; }
        return P; },
      /* linha grossa (estrada, rio, trilha) por uma lista de pontos */
      linha(pts,larg,t,so,nao){ const v=id(t), r=larg/2, soV = so ? so.map(id) : null, naoV = nao ? nao.map(id) : null;
        for(let k=0;k<pts.length-1;k++){ const [x1,y1]=pts[k], [x2,y2]=pts[k+1];
          const passos=Math.ceil(Math.hypot(x2-x1,y2-y1)*2)+1;
          for(let s=0;s<=passos;s++){ const px=x1+(x2-x1)*s/passos, py=y1+(y2-y1)*s/passos;
            for(let j=Math.floor(py-r);j<=py+r;j++) for(let i=Math.floor(px-r);i<=px+r;i++){
              if(!dentro(i,j)) continue; if(Math.hypot(i+0.5-px,j+0.5-py)>r+0.15) continue;
              if(soV && soV.indexOf(m.terr[j*w+i])<0) continue; if(naoV && naoV.indexOf(m.terr[j*w+i])>=0) continue; m.terr[j*w+i]=v; } } }
        return P; },
      /* troca terreno A por B nas células a até `dist` de algum terreno C (ex.: areia em volta da água) */
      bordaDe(ondeT, perto, novoT, dist){ const a=id(ondeT), c=id(perto), n=id(novoT); const marcar=[];
        for(let j=0;j<h;j++) for(let i=0;i<w;i++){ if(m.terr[j*w+i]!==a) continue;
          let achou=false; for(let dj=-dist;dj<=dist&&!achou;dj++) for(let di=-dist;di<=dist;di++){ const x=i+di,y=j+dj; if(dentro(x,y)&&m.terr[y*w+x]===c&&di*di+dj*dj<=dist*dist+1){ achou=true; break; } }
          if(achou) marcar.push(j*w+i); }
        marcar.forEach(k=>m.terr[k]=n); return P; },
      substituir(t1,t2,x,y,ww,hh){ const a=id(t1), b=id(t2); for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) if(dentro(i,j)&&m.terr[j*w+i]===a) m.terr[j*w+i]=b; return P; },

      /* estrada de asfalto com calçada e faixa tracejada */
      estrada(pts,o){ o=o||{}; const larg=o.larg||3;
        // a calçada de uma rua nova nunca corta o asfalto de uma rua que já existe (cruzamento livre pro carro)
        if(o.calcada!==0) P.linha(pts, larg+2*(o.calcada||1), o.tipoCalcada||'calcada', null, ['asfalto','paralelepipedo']);
        P.linha(pts, larg, o.tipo||'asfalto');
        if(o.faixa!==false && (o.tipo||'asfalto')==='asfalto'){
          for(let k=0;k<pts.length-1;k++){ const [x1,y1]=pts[k],[x2,y2]=pts[k+1];
            const hor = Math.abs(x2-x1)>=Math.abs(y2-y1); const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
            for(let s=1;s<n;s+=2){ const x=x1+(x2-x1)*s/n, y=y1+(y2-y1)*s/n;
              m.chao.push({ faixa:hor?'h':'v', x:Math.floor(x)*T+(hor?4:15), y:Math.floor(y)*T+(hor?15:4) }); } } }
        return P; },
      trilha(pts,larg,t){ return P.linha(pts, larg||2, t||'terra'); },
      rio(pts,o){ o=o||{}; if(o.margem) P.linha(pts,(o.larg||4)+2*(o.margemLarg||1),o.margem); return P.linha(pts,o.larg||4,'agua'); },

      /* muralha: segmentos retos. Horizontal = topo + 2 de fachada ao sul;
         vertical = só o topo (2 de largura). `portoes`: [x,y] que ficam abertos. */
      muralha(pts,o){ o=o||{}; const portoes=o.portoes||[]; const abertos=new Set();
        const TOPO=o.topo||'muro_topo', FACE=o.face||'muro_face';     // `topo`/`face`: muralha roxa do reino
        portoes.forEach(([gx,gy,gw])=>{ for(let dy=-1;dy<=3;dy++) for(let dx=-Math.floor((gw||3)/2);dx<=Math.floor((gw||3)/2);dx++) abertos.add((gy+dy)*w+gx+dx); });
        const marcar=(i,j,t)=>{ if(!dentro(i,j)||abertos.has(j*w+i)) return; if(t===FACE && m.terr[j*w+i]===id(TOPO)) return; m.terr[j*w+i]=id(t); };
        for(let k=0;k<pts.length-1;k++){ const [x1,y1]=pts[k],[x2,y2]=pts[k+1];
          if(y1===y2){ for(let i=Math.min(x1,x2);i<=Math.max(x1,x2);i++){ marcar(i,y1,TOPO); marcar(i,y1+1,FACE); marcar(i,y1+2,FACE); } }
          else { for(let j=Math.min(y1,y2);j<=Math.max(y1,y2);j++){ marcar(x1,j,TOPO); marcar(x1+1,j,TOPO); } const yb=Math.max(y1,y2); marcar(x1,yb+1,FACE); marcar(x1+1,yb+1,FACE); marcar(x1,yb+2,FACE); marcar(x1+1,yb+2,FACE); }
        }
        if(o.arco!==false) portoes.forEach(([gx,gy])=>{ P.obj('arco_portao', gx, gy+2.6, { sempreCima:true, semCol:true }); });
        return P; },

      /* ---------- colisão ---------- */
      solido(x,y,ww,hh){ for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) if(dentro(i,j)) m.col[j*w+i]=1; return P; },
      livre(x,y,ww,hh){ for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) if(dentro(i,j)) m.col[j*w+i]=0; return P; },

      /* ---------- objetos ----------
         obj(nome, x, y, extra): x,y = tile dos PÉS (aceita fração). O nome é
         um sprite de OWArte (atlas ou peça desenhada). `extra` pode ter
         id, interagir (texto/cena), luz, sempreCima, semCol…            */
      obj(nome,x,y,extra){ const o=Object.assign({ tipo:'spr', nome, x:x*T+T/2, y:y*T+T-2 }, extra||{}); m.objs.push(o); return o; },
      cv(gerado,x,y,extra){ const o=Object.assign({ tipo:'cv', g:gerado, x:x*T+T/2, y:y*T+T-2 }, extra||{}); m.objs.push(o); return o; },

      /* casa: (x,y) = canto de cima-esquerda; ocupa w × (tel+par) tiles.
         `porta:{para:[area,x,y,dir]}` cria a entrada na célula da porta. */
      casa(x,y,o){ o=Object.assign({ w:4, tel:2, par:2 }, o||{}); const g=OWArte.casa(o); const H=o.tel+o.par;
        const ob=P.cv(g, x+o.w/2-0.5, y+H-1, { semCol:true, id:o.id, nomeLocal:o.nomeLocal });
        ob.x = x*T + o.w*T/2; ob.y = (y+H)*T;
        P.solido(x,y,o.w,H);
        const pc = o.porta!=null ? o.porta : Math.floor(o.w/2);
        if(o.entra){ P.livre(x+pc, y+H-1, 1, 1); m.portas.push({ x:x+pc, y:y+H-1, para:o.entra, trava:o.trava||null, nome:o.nomeLocal||null }); }
        else if(pc>=0) portaAuto(x+pc, y+H-1, o, o.placa ? 'loja' : 'casa', o.w);
        return ob; },
      predio(x,y,o){ o=Object.assign({ w:4, prof:2, alt:4 }, o||{}); const g=OWArte.predio(o); const H=o.prof+o.alt;
        const ob=P.cv(g,0,0,{ semCol:true, id:o.id }); ob.x=x*T+o.w*T/2; ob.y=(y+H)*T; P.solido(x,y,o.w,H);
        if(o.entra){ const pc=Math.floor(o.w/2); P.livre(x+pc,y+H-1,1,1); m.portas.push({ x:x+pc, y:y+H-1, para:o.entra, trava:o.trava||null, nome:o.nomeLocal||null }); }
        else portaAuto(x+Math.floor(o.w/2), y+H-1, o, 'predio', o.w);
        return ob; },
      grande(gerado,x,y,ww,hh,o){ o=o||{}; const ob=P.cv(gerado,0,0,Object.assign({ semCol:true },o)); ob.x=x*T+ww*T/2; ob.y=(y+hh)*T;
        const solH = o.solH!=null ? o.solH : hh; P.solido(x, y+hh-solH, ww, solH);
        const pc=o.portaX!=null?o.portaX:Math.floor(ww/2);
        if(o.entra){ P.livre(x+pc,y+hh-1,1,1); m.portas.push({ x:x+pc, y:y+hh-1, para:o.entra, trava:o.trava||null, nome:o.nomeLocal||null }); }
        else if(o.interior) portaAuto(x+pc, y+hh-1, o, o.interior, ww);
        return ob; },
      /* construção que é um SPRITE (galpão, quiosque…): ocupa `ww`×`solH`
         tiles sólidos com os pés em (x, y+hh) e porta no meio de baixo */
      edificio(nome,x,y,ww,hh,o){ o=o||{}; const ob=P.obj(nome,0,0,Object.assign({ semCol:true },o));
        const solH=o.solH!=null?o.solH:hh; P.solido(x,y+hh-solH,ww,solH);
        const pc=o.portaX!=null?o.portaX:Math.floor(ww/2);
        ob.x=(x+pc)*T+T/2; ob.y=(y+hh)*T-2;           // desenho centrado na porta (a porta do desenho fica no meio)
        if(o.entra){ P.livre(x+pc,y+hh-1,1,1); m.portas.push({ x:x+pc, y:y+hh-1, para:o.entra, trava:o.trava||null, nome:o.nomeLocal||null }); }
        else if(o.interior!==false) portaAuto(x+pc, y+hh-1, o, o.interior||'galpao', ww);
        return ob; },

      /* espalhar: sorteia objetos numa área, respeitando terreno e distância */
      espalhar(nomes,ret,o){ o=o||{}; const [rx,ry,rw,rh]=ret; const dens=o.dens||0.05, dist=o.dist||1.6;
        const so = o.so ? o.so.map(id) : null; const ocup=[];
        // gente do roteiro parada no mapa: nada nasce em cima dela
        const gente = typeof Missoes!=='undefined' && Missoes.npcsDaArea ? Missoes.npcsDaArea(def.id).concat(Missoes.inimigosDaArea(def.id)).map(n=>n.em) : [];
        const r = rng((o.semente||7)*7919 + rx*31 + ry*17);
        for(let j=ry;j<ry+rh;j++) for(let i=rx;i<rx+rw;i++){
          if(!dentro(i,j)) continue; if(r()>dens) continue;
          const t=m.terr[j*w+i]; if(OWArte.TERR[t].solido || m.col[j*w+i]) continue;
          if(so && so.indexOf(t)<0) continue;
          if(o.longe && o.longe(i,j)) continue;
          // nunca na frente de uma porta (a casa ficaria trancada por um barril)
          if(m.portas.some(d=>Math.abs(d.x-i)<=1 && j>d.y && j<=d.y+2)) continue;
          if(gente.some(e=>Math.abs(e[1]-i)<1.6 && Math.abs(e[2]-j)<1.6)) continue;
          const jx=i+(r()-0.5)*0.6, jy=j+(r()-0.5)*0.4;
          if(ocup.some(p=>Math.hypot(p[0]-jx,p[1]-jy)<dist)) continue;
          ocup.push([jx,jy]); const nome=Array.isArray(nomes)? nomes[Math.floor(r()*nomes.length)] : nomes;
          P.obj(nome, jx, jy, o.extra?Object.assign({},o.extra):null); }
        return P; },
      /* borda de floresta densa (árvore lado a lado) ao longo de um retângulo */
      floresta(ret,nomes,o){ o=o||{}; return P.espalhar(nomes, ret, Object.assign({ dens:0.55, dist:1.25 }, o)); },

      /* ---------- marcações ---------- */
      ponto(nome,x,y){ m.pontos[nome]=[x,y]; return P; },
      zona(nome,x,y,ww,hh){ m.zonas.push({ nome, x, y, w:ww, h:hh }); return P; },
      porta(x,y,para,o){ P.livre(x,y,1,1); m.portas.push(Object.assign({ x, y, para }, o||{})); return P; },
      saida(o){ m.saidas.push(o); return P; },
      luz(x,y,r,cor){ m.luzes.push({ x:x*T+T/2, y:y*T+T/2, r:(r||3)*T, cor:cor||'#ffcf7a' }); return P; },
      decal(nome,x,y){ m.chao.push({ nome, x:x*T, y:y*T }); return P; },
      rand:()=>m.rand()
    };
    return P;
  }

  function dentroPoligono(x,y,pts){ let d=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) d=!d; } return d; }

  return { novo, rng, ruido, T };
})();
