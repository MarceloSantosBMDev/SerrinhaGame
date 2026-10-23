/* ============================================================
   SPRITESHEET — carrega PNG, DETECTA os frames automaticamente
   e toca animações.

   Como funciona a detecção:
   1) flood-fill a partir das bordas marca tudo que é FUNDO
      (funciona com fundo transparente, preto ou xadrez)
   2) linhas 100% vazias separam as FAIXAS (bandas)
   3) colunas vazias dentro da faixa separam os FRAMES
   4) cada frame recebe bbox recortado (trim)
   ============================================================ */
const SpriteSheet = (function(){

  const cache = {};   // url -> sheet

  function load(url){
    if(cache[url]) return cache[url];
    const sheet = { url, ready:false, img:null, bands:[], frames:[], error:null };
    cache[url] = sheet;
    const img = new Image();
    img.onload = ()=>{
      try{
        sheet.img = img;
        analyze(sheet, img);
        sheet.ready = true;
      }catch(e){ sheet.error = e.message; }
    };
    img.onerror = ()=>{ sheet.error='não foi possível carregar '+url; };
    img.src = url;
    return sheet;
  }

  // ---- detecção de frames ----
  function analyze(sheet, img){
    const w=img.width, h=img.height;
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const cx=cv.getContext('2d', {willReadFrequently:true});
    cx.imageSmoothingEnabled=false;
    cx.drawImage(img,0,0);
    const data=cx.getImageData(0,0,w,h).data;

    // solid[i] = pixel faz parte de um sprite?
    const solid=new Uint8Array(w*h);
    for(let i=0;i<w*h;i++) solid[i]= data[i*4+3]>16 ? 1:0;   // alpha

    /* Estratégia depende da imagem:
       - COM transparência (PNG recortado): o alpha já define o sprite.
       - OPACA (fundo preto/branco): cresce o fundo a partir das bordas. */
    let transp=0;
    for(let i=0;i<w*h;i+=7) if(data[i*4+3]<=16) transp++;
    const hasAlpha = transp > (w*h/7)*0.05;
    if(hasAlpha){
      for(let i=0;i<w*h;i++) solid[i]= data[i*4+3]>16 ?1:0;
      return finish(sheet, solid, w, h);
    }

    /* 1) Remove BARRAS (letterbox) escuras uniformes no topo/base.
       Sem isso o preto entra na paleta de fundo e "come" o contorno
       preto do personagem, fatiando o sprite em pedaços. */
    const uniformDarkRow=(y)=>{
      const i0=y*w; const r=data[i0*4],g=data[i0*4+1],b=data[i0*4+2];
      if((r+g+b)/3 > 70) return false;                 // não é escura
      let n=0;
      for(let x=0;x<w;x++){ const i=y*w+x;
        if(Math.abs(data[i*4]-r)<=18&&Math.abs(data[i*4+1]-g)<=18&&Math.abs(data[i*4+2]-b)<=18) n++; }
      return n>=w*0.97;
    };
    let ty=0, by=h-1;
    while(ty<by && uniformDarkRow(ty)) ty++;
    while(by>ty && uniformDarkRow(by)) by--;
    // marca as barras como fundo desde já
    const barTop=ty, barBot=by;

    /* 2) Paleta de fundo = cores presentes nas BORDAS da área útil. */
    const pal=[];
    const addPal=(i)=>{
      const r=data[i*4],g=data[i*4+1],b=data[i*4+2];
      for(const c of pal) if(Math.abs(c[0]-r)<=18&&Math.abs(c[1]-g)<=18&&Math.abs(c[2]-b)<=18) return;
      if(pal.length<24) pal.push([r,g,b]);
    };
    for(let x=0;x<w;x+=2){ addPal(barTop*w+x); addPal(barBot*w+x); }
    for(let y=barTop;y<=barBot;y+=2){ addPal(y*w); addPal(y*w+w-1); }
    const isBg=(i)=>{
      if(data[i*4+3]<=16) return true;
      const r=data[i*4],g=data[i*4+1],b=data[i*4+2];
      for(const c of pal) if(Math.abs(c[0]-r)<=30&&Math.abs(c[1]-g)<=30&&Math.abs(c[2]-b)<=30) return true;
      return false;
    };
    const bg=new Uint8Array(w*h);
    const stack=[];
    const push=(x,y)=>{ if(x<0||y<barTop||x>=w||y>barBot) return;
      const i=y*w+x; if(bg[i]||!isBg(i)) return; bg[i]=1; stack.push(i); };
    // as barras já são fundo
    for(let y=0;y<barTop;y++) for(let x=0;x<w;x++) bg[y*w+x]=1;
    for(let y=barBot+1;y<h;y++) for(let x=0;x<w;x++) bg[y*w+x]=1;
    for(let x=0;x<w;x++){ push(x,barTop); push(x,barBot); }
    for(let y=barTop;y<=barBot;y++){ push(0,y); push(w-1,y); }
    while(stack.length){
      const i=stack.pop(); const x=i%w, y=(i/w)|0;
      push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1);
    }
    // pixel do sprite = não é fundo alcançável pelas bordas
    for(let i=0;i<w*h;i++) solid[i] = (!bg[i] && data[i*4+3]>16) ? 1 : 0;
    return finish(sheet, solid, w, h);
  }

  /* Segmenta por COMPONENTES CONECTADOS: cada sprite é um "borrão" de
     pixels ligados. Bem mais robusto que projeção por linhas/colunas
     (não corta o boneco na cintura nem funde fileiras coladas).
     Depois agrupa os borrões em fileiras pela sobreposição vertical. */
  function finish(sheet, solid, w, h){
    const lab=new Int32Array(w*h).fill(-1);
    const blobs=[];
    const st=[];
    for(let p=0;p<w*h;p++){
      if(!solid[p] || lab[p]>=0) continue;
      const id=blobs.length;
      let minX=w, maxX=0, minY=h, maxY=0, area=0;
      lab[p]=id; st.push(p);
      while(st.length){
        const i=st.pop(); const x=i%w, y=(i/w)|0;
        area++;
        if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
        if(x+1<w  && solid[i+1] && lab[i+1]<0){ lab[i+1]=id; st.push(i+1); }
        if(x-1>=0 && solid[i-1] && lab[i-1]<0){ lab[i-1]=id; st.push(i-1); }
        if(y+1<h  && solid[i+w] && lab[i+w]<0){ lab[i+w]=id; st.push(i+w); }
        if(y-1>=0 && solid[i-w] && lab[i-w]<0){ lab[i-w]=id; st.push(i-w); }
      }
      blobs.push({x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1, area});
    }
    if(!blobs.length){ sheet.bands=[]; sheet.frames=[]; return; }

    // descarta ruído/efeitos: borrões pequenos perto do maior
    const maxArea=blobs.reduce((m,b)=>Math.max(m,b.area),1);
    let keep=blobs.filter(b=> b.area>=maxArea*0.06 && b.w>=24 && b.h>=40 );
    if(!keep.length) keep=blobs.slice();

    /* Agrupa em fileiras por LACUNA vertical entre centros.
       (Faixas coladas/escalonadas quebravam o agrupamento por intervalo,
       misturando frames de fileiras diferentes.) */
    keep.sort((a,b)=> (a.y+a.h/2)-(b.y+b.h/2) );
    const hs=keep.map(b=>b.h).sort((a,b)=>a-b);
    const medH=hs[Math.floor(hs.length/2)]||40;
    const gap=Math.max(12, medH*0.55);
    const rows=[];
    let cur=null, lastCy=-1e9;
    keep.forEach(b=>{
      const cy=b.y+b.h/2;
      if(!cur || cy-lastCy>gap){ cur={items:[]}; rows.push(cur); }
      cur.items.push(b); lastCy=cy;
    });
    rows.forEach(r=> r.items.sort((a,b)=>a.x-b.x) );
    sheet.bands = rows.map(r=> r.items.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h})) );
    sheet.frames=[]; sheet.bands.forEach(b=>b.forEach(f=>sheet.frames.push(f)));
  }

  // (antigo) segmentação por projeção — mantido como referência
  function finishByProjection(sheet, solid, w, h){
    /* Faixas por HISTERESE: as fileiras da folha se separam por "vales"
       (nem sempre por linhas 100% vazias). Detecta o núcleo com limiar alto
       e expande com limiar baixo, para não cortar cabeça/pés. */
    const rowCount=new Int32Array(h);
    let maxRow=0;
    for(let y=0;y<h;y++){ let n=0; const off=y*w; for(let x=0;x<w;x++) if(solid[off+x]) n++; rowCount[y]=n; if(n>maxRow) maxRow=n; }
    const hi=Math.max(6, Math.round(maxRow*0.10));
    const lo=Math.max(2, Math.round(maxRow*0.012));
    const cores=[];
    let cy=-1;
    for(let y=0;y<h;y++){
      if(rowCount[y]>=hi && cy<0) cy=y;
      else if(rowCount[y]<hi && cy>=0){ if(y-cy>12) cores.push([cy,y-1]); cy=-1; }
    }
    if(cy>=0 && h-cy>12) cores.push([cy,h-1]);
    // ponto mais "vazio" entre dois núcleos = fronteira entre as fileiras
    const valley=(y1,y2)=>{ let bi=y1, bv=Infinity;
      for(let y=y1;y<=y2;y++) if(rowCount[y]<bv){ bv=rowCount[y]; bi=y; } return bi; };
    const bands=[];
    for(let i=0;i<cores.length;i++){
      const a=cores[i][0], b=cores[i][1];
      const up   = (i===0)? 0   : valley(cores[i-1][1], a);
      const down = (i===cores.length-1)? h-1 : valley(b, cores[i+1][0]);
      let s=a, e=b;
      while(s>up   && rowCount[s-1]>=lo) s--;      // expande sem passar do vale
      while(e<down && rowCount[e+1]>=lo) e++;
      bands.push([s,e]);
    }

    sheet.bands=[];
    bands.forEach(([by0,by1])=>{
      const colHas=new Uint8Array(w);
      for(let x=0;x<w;x++){ let n=0; for(let y=by0;y<=by1;y++) if(solid[y*w+x]) n++; colHas[x]= n>1?1:0; }
      const band=[];
      let x0=-1;
      for(let x=0;x<w;x++){
        if(colHas[x] && x0<0) x0=x;
        else if(!colHas[x] && x0>=0){ if(x-x0>5) band.push(trim(solid,w,x0,x-1,by0,by1)); x0=-1; }
      }
      if(x0>=0 && w-x0>5) band.push(trim(solid,w,x0,w-1,by0,by1));
      if(band.length) sheet.bands.push(band);
    });

    // remove faixas pequenas (título) e, dentro da faixa, efeitos/fragmentos soltos
    const tallest = sheet.bands.reduce((m,b)=>Math.max(m, ...b.map(f=>f.h)), 1);
    sheet.bands = sheet.bands.filter(b=> Math.max(...b.map(f=>f.h)) >= tallest*0.34 );
    sheet.bands = sheet.bands.map(b=>{
      const bh=Math.max(...b.map(f=>f.h)), bw=Math.max(...b.map(f=>f.w));
      return b.filter(f=> f.h >= bh*0.55 && f.w >= bw*0.30 );   // corta faíscas/ondas de FX
    }).filter(b=>b.length);
    sheet.frames=[]; sheet.bands.forEach(b=>b.forEach(f=>sheet.frames.push(f)));
  }

  function trim(solid,w,x0,x1,y0,y1){
    let minX=x1, maxX=x0, minY=y1, maxY=y0;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(solid[y*w+x]){
      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
    }
    return {x:minX, y:minY, w:Math.max(1,maxX-minX+1), h:Math.max(1,maxY-minY+1)};
  }

  /* Desenha um frame com os PÉS no ponto (x,y) usando ESCALA fixa
     (escala única por personagem mantém as proporções entre poses).
     facing<0 espelha horizontalmente. */
  function drawFrame(ctx, sheet, frame, x, y, facing, sc, flash, anchor){
    if(!sheet||!sheet.ready||!frame) return false;
    const dw = Math.round(frame.w*sc), dh = Math.round(frame.h*sc);
    // anchor = onde o LUTADOR está dentro do quadro (0..1). Útil quando o
    // quadro traz cenário/objeto junto (ex.: o carro do parry).
    const a = (anchor==null)? 0.5 : (facing<0 ? 1-anchor : anchor);
    const dx = Math.round(x - dw*a), dy = Math.round(y - dh);
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    if(facing<0){ ctx.translate(dx+dw,0); ctx.scale(-1,1); ctx.translate(-dx,0); }
    ctx.drawImage(sheet.img, frame.x,frame.y,frame.w,frame.h, dx,dy,dw,dh);
    if(flash){ // clarão branco ao levar dano
      ctx.globalCompositeOperation='source-atop';
      ctx.globalAlpha=0.85; ctx.fillStyle='#fff';
      ctx.fillRect(dx,dy,dw,dh);
    }
    ctx.restore();
    return true;
  }

  // pega frame por [banda, índice] com segurança
  function pick(sheet, band, idx){
    if(!sheet||!sheet.ready) return null;
    const b=sheet.bands[band]; if(!b||!b.length) return null;
    return b[Math.max(0,Math.min(b.length-1, idx|0))] || null;
  }

  // resumo (para conferir a detecção)
  function describe(sheet){
    if(!sheet) return 'sem sheet';
    if(sheet.error) return 'ERRO: '+sheet.error;
    if(!sheet.ready) return 'carregando...';
    return sheet.bands.map((b,i)=>'faixa '+i+': '+b.length+' frames ('+b.map(f=>f.w+'x'+f.h).join(', ')+')').join('\n');
  }

  return { load, drawFrame, pick, describe, cache };
})();
