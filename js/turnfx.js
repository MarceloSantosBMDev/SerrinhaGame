/* ============================================================
   EFEITOS VISUAIS DA BATALHA 3x3
   ------------------------------------------------------------
   Uma tela (canvas) TRANSPARENTE por cima de tudo, em coordenadas
   de janela. Como cada lutador é um <canvas> dentro do card, o
   impacto precisa ser desenhado FORA dele — senão o efeito ficaria
   preso na moldura e cortado no meio.

   Tudo é desenhado em QUADRADINHOS inteiros (nada de círculo liso)
   para combinar com a pixel-art do resto do jogo.

   1.33 — efeitos POR ELEMENTO (fogo, gelo, raio, água, veneno,
   sangue, sombra, energia, explosão, charme, lasanha, terra), projétil
   próprio de cada elemento, número de dano que "estoura", nocaute com
   a alma subindo, câmera que dá zoom no impacto da ultimate, anúncio
   de rodada/vitória, confete, ícones de status subindo e escudo.
   Quando não tem nada pra desenhar, o quadro não é nem limpo de novo
   (`sujo`) — a tela inteira parada não custa nada.
   ============================================================ */
const TurnFX = (function(){

  let cv=null, ctx=null, ligado=false;
  let parts=[];     // faíscas / cacos / gotas / brasas
  let textos=[];    // números de dano e rótulos
  let formas=[];    // arcos, anéis, projéteis (desenho por callback)
  let clarao=0, claraoMax=1, claraoCor='#fff';
  let sujo=false;   // algo foi desenhado desde a última limpeza?
  const MAX_PARTS=700;   // teto: golpe em área com efeito em 3 alvos não vira 2 mil partículas

  /* ---------- tela ---------- */
  function ensure(){
    if(cv) return cv;
    cv=document.createElement('canvas');
    cv.id='bt-fx'; cv.className='bt-fx';
    document.body.appendChild(cv);
    ctx=cv.getContext('2d');
    redimensionar();
    window.addEventListener('resize', redimensionar);
    return cv;
  }
  function redimensionar(){
    if(!cv) return;
    cv.width=Math.max(1, window.innerWidth);
    cv.height=Math.max(1, window.innerHeight);
    ctx.imageSmoothingEnabled=false;
    sujo=true;
  }
  function ativo(v){ ensure(); ligado=!!v; cv.style.display = v? 'block':'none'; if(!v) limpar(); }
  let passoFixo=0;
  function limpar(){ parts=[]; textos=[]; formas=[]; clarao=0; faixa=null; treme=null; cortina=null; seta=null;
    anuncios=[]; cam=null; placaGolpe=null; impactoQ=0;
    const palco=document.getElementById('bt-palco'); if(palco){ palco.style.transform=''; palco.style.transformOrigin=''; palco.style.filter=''; }
    for(const k in fixos) delete fixos[k];
    if(ctx&&cv) ctx.clearRect(0,0,cv.width,cv.height); sujo=false; }

  /* ---------- peças ---------- */
  // quadradinho alinhado à grade (o "pixel" do efeito)
  function px(x,y,tam,cor,alpha){
    ctx.globalAlpha = alpha==null?1:alpha;
    ctx.fillStyle=cor;
    ctx.fillRect(Math.round(x/2)*2, Math.round(y/2)*2, tam, tam);
  }
  function retang(x,y,w,h,cor,alpha){
    ctx.globalAlpha = alpha==null?1:alpha;
    ctx.fillStyle=cor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1,Math.round(w)), Math.max(1,Math.round(h)));
  }
  // disco "pixelado" (faixas horizontais), igual o do cenário
  function disco(x,y,r,cor,alpha){
    ctx.globalAlpha = alpha==null?1:alpha; ctx.fillStyle=cor;
    for(let dy=-r; dy<=r; dy+=2){
      const w=Math.sqrt(Math.max(0, r*r-dy*dy))*2;
      if(w>0) ctx.fillRect(Math.round(x-w/2), Math.round(y+dy), Math.round(w), 2);
    }
  }
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const escolhe=l=>l[(Math.random()*l.length)|0];

  /* forma da partícula: 0 quadrado · 1 gota · 2 coração · 3 bolha (oca)
     4 brasa (encolhe) · 5 lasca (losango) · 6 confete (gira) · 7 estrela */
  function faisca(x,y,cor,vx,vy,vida,tam,grav,forma,atrito){
    if(parts.length>=MAX_PARTS) parts.shift();
    parts.push({x,y,vx,vy,vida,max:vida,cor,tam:tam||4,grav:(grav==null?0.22:grav),forma:forma||0,
                atrito:(atrito==null?0.96:atrito), fase:Math.random()*6});
  }
  function desenhaParticula(p){
    const a=Math.min(1,p.vida/p.max*1.6), t=p.tam, x=p.x-t/2, y=p.y-t/2;
    switch(p.forma){
      case 1: px(x,y,t,p.cor,a); px(x+t*0.25,y-t*0.5,Math.max(2,t*0.5),p.cor,a*0.85); break;
      case 2: { const s=Math.max(2,t/2);
        px(x,y,s,p.cor,a); px(x+s,y,s,p.cor,a); px(x-s*0.5,y+s,s*3,p.cor,a); px(x,y+s*2,s*2,p.cor,a); break; }
      case 3: ctx.globalAlpha=a; ctx.strokeStyle=p.cor; ctx.lineWidth=2;
        ctx.strokeRect(Math.round(x), Math.round(y), t, t); px(x+1,y+1,2,'#ffffff',a*0.8); break;
      case 4: { const s=Math.max(2, Math.round(t*(p.vida/p.max))); px(p.x-s/2,p.y-s/2,s,p.cor,a); break; }
      case 5: px(x,y-t*0.5,Math.max(2,t*0.5),p.cor,a); px(x-t*0.25,y,t,p.cor,a); px(x,y+t*0.5,Math.max(2,t*0.5),p.cor,a); break;
      case 6: { const w=Math.max(2, Math.abs(Math.sin(p.fase+p.vida*0.25))*t); retang(p.x-w/2, p.y-t/2, w, t*0.6, p.cor, a); break; }
      case 7: px(x,y,t,p.cor,a); px(x-t,y,t,p.cor,a*0.6); px(x+t,y,t,p.cor,a*0.6); px(x,y-t,t,p.cor,a*0.6); px(x,y+t,t,p.cor,a*0.6); break;
      default: px(x,y,t,p.cor,a);
    }
  }

  /* ---------- efeitos públicos ---------- */

  /* pancada: estrela de faíscas + anel de choque + cacos */
  function impacto(x,y,cor,forca){
    ensure(); forca=forca||1;
    const n=Math.round(10+forca*10);
    for(let i=0;i<n;i++){
      const a=(Math.PI*2*i/n)+Math.random()*0.4;
      const v=(2.2+Math.random()*3.4)*forca;
      faisca(x,y,cor, Math.cos(a)*v, Math.sin(a)*v-1.2, 16+Math.random()*10, (Math.random()<0.3?6:4));
    }
    for(let i=0;i<5;i++) faisca(x,y,'#ffffff',(Math.random()-0.5)*7,(Math.random()-0.5)*7-1,10,4,0.1);
    anel(x,y,cor,10+forca*4, 16);
    // "clarão" de estrela: 4 braços que somem rápido
    formas.push({vida:9,max:9,fn:(p)=>{
      const r=(1-p)*34*forca+8;
      const t=Math.max(2,Math.round(8*p));
      px(x-r,y-t/2,r*0.5,cor,p); px(x+r*0.5,y-t/2,r*0.5,cor,p);
      px(x-t/2,y-r,t,cor,p);     px(x-t/2,y+r*0.5,t,cor,p);
    }});
    // miolo branco que estoura e some (dá o "ponto" exato do golpe)
    formas.push({vida:5,max:5,fn:(p)=>disco(x,y,Math.round(6+(1-p)*10*forca),'#ffffff',p*0.9)});
  }

  /* anel de choque quadriculado */
  function anel(x,y,cor,raio,vida){
    ensure();
    formas.push({vida:vida||14,max:vida||14,fn:(p)=>{
      const r=raio+(1-p)*38, n=18;
      for(let i=0;i<n;i++){
        const a=Math.PI*2*i/n;
        px(x+Math.cos(a)*r-2, y+Math.sin(a)*r*0.62-2, 4, cor, p*0.9);
      }
    }});
  }
  /* onda no CHÃO: anel achatado que corre pelo piso (pouso, golpe pesado, cura) */
  function ondaChao(x,y,cor,raio,vida){
    ensure(); vida=vida||18; raio=raio||30;
    formas.push({vida,max:vida,fn:(p)=>{
      const r=raio*(0.4+(1-p)*1.3), n=24;
      for(let i=0;i<n;i++){
        const a=Math.PI*2*i/n;
        px(x+Math.cos(a)*r-2, y+Math.sin(a)*r*0.26-1, (i%2?4:2), cor, p*0.85);
      }
    }});
  }

  /* corte em arco (golpe corpo a corpo): meia-lua grossa com miolo branco */
  function corte(x,y,cor,dir){
    ensure(); dir=dir||1;
    const inc=rnd(-0.5,0.5);
    formas.push({vida:11,max:11,fn:(p)=>{
      const r=26+(1-p)*30;
      for(let i=0;i<=14;i++){
        const a=-1.1+inc+(i/14)*2.0;
        const meio=1-Math.abs(i/14-0.5)*2;               // mais grosso no meio do arco
        const g=Math.round(2+meio*5*p);
        px(x+Math.cos(a)*r*dir-g/2, y+Math.sin(a)*r-g/2, g, cor, p);
        if(meio>0.4) px(x+Math.cos(a)*(r-3)*dir-1, y+Math.sin(a)*(r-3)-1, 2, '#ffffff', p);
      }
    }});
  }

  /* projétil pixelado viajando de A até B */
  function projetil(x0,y0,x1,y1,cor,vida){
    ensure(); vida=vida||16;
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p;                                  // 0 -> 1 ao longo do voo
      const x=x0+(x1-x0)*k, y=y0+(y1-y0)*k - Math.sin(k*Math.PI)*26;  // arco
      for(let i=0;i<5;i++){                          // rastro
        const kk=Math.max(0,k-i*0.05);
        const tx=x0+(x1-x0)*kk, ty=y0+(y1-y0)*kk - Math.sin(kk*Math.PI)*26;
        px(tx-2,ty-2, 6-i, cor, (1-i*0.18)*0.8);
      }
      px(x-4,y-4, 8, '#ffffff', 0.9);
      px(x-3,y-3, 6, cor, 1);
      if(f%3===0) faisca(x,y,cor,(Math.random()-0.5)*2,(Math.random()-0.5)*2,10,3,0.05);
    }});
  }

  /* ================= PROJÉTEIS POR ELEMENTO =================
     O golpe de longe agora tem a CARA do elemento: bola de fogo com
     brasa, lasca de gelo reta, raio em zigue-zague, feixe de energia,
     bolha d'água, gosma de veneno, orbe sombrio, bomba girando, coração. */
  function caminho(x0,y0,x1,y1,k,arco){ return { x:x0+(x1-x0)*k, y:y0+(y1-y0)*k - Math.sin(k*Math.PI)*arco }; }

  function bola(x0,y0,x1,y1,vida,o){
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p, c=caminho(x0,y0,x1,y1,k,o.arco||16);
      const tam=o.tam||8, osc=o.wobble? Math.sin(f*0.8)*1.5 : 0;
      // rastro
      for(let i=1;i<6;i++){
        const kk=Math.max(0,k-i*0.045), cc=caminho(x0,y0,x1,y1,kk,o.arco||16);
        disco(cc.x, cc.y, Math.max(2, tam-i*1.4), o.cor, (1-i/6)*0.55);
      }
      if(o.aura) disco(c.x, c.y, tam+5+Math.sin(f*0.5)*2, o.cor, 0.25);
      disco(c.x, c.y+osc, tam, o.cor, 1);
      disco(c.x-1, c.y-1+osc, Math.max(2,tam*0.5), o.nucleo, 1);
      if(f%2===0){
        if(o.rastro==='brasa') faisca(c.x, c.y, escolhe(['#ffe066','#ff7a3c','#ff4d1a']), rnd(-1,1), rnd(-1.6,-0.4), 16, 4, -0.05, 4);
        else if(o.rastro==='gota') faisca(c.x, c.y+tam*0.6, o.cor, rnd(-0.4,0.4), 0.6, 18, 3, 0.18, 1);
        else if(o.rastro==='fumo') faisca(c.x, c.y, o.cor, rnd(-0.8,0.8), rnd(-0.8,0.8), 16, 5, 0, 3);
      }
    }});
  }
  function lasca(x0,y0,x1,y1,vida){
    const ang=Math.atan2(y1-y0, x1-x0);
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p, c=caminho(x0,y0,x1,y1,k,4);
      for(let i=-5;i<=5;i++){                       // losango comprido apontado pro alvo
        const g=Math.max(2, 7-Math.abs(i)*1.2);
        px(c.x+Math.cos(ang)*i*3-g/2, c.y+Math.sin(ang)*i*3-g/2, g, i<2?'#e8fdff':'#7df0ff', 1);
      }
      if(f%2===0) faisca(c.x, c.y, '#bff6ff', rnd(-0.6,0.6), rnd(-0.6,0.6), 14, 3, 0.02, 7);
    }});
  }
  function zigue(x0,y0,x1,y1,salto){
    const pts=[{x:x0,y:y0}], n=7;
    for(let i=1;i<n;i++){
      const k=i/n;
      pts.push({ x:x0+(x1-x0)*k + rnd(-salto,salto), y:y0+(y1-y0)*k + rnd(-salto,salto) });
    }
    pts.push({x:x1,y:y1});
    return pts;
  }
  function linhaPx(pts, cor, g, alpha){
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1], passos=Math.max(1, Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
      for(let s=0;s<=passos;s++) px(a.x+(b.x-a.x)*s/passos - g/2, a.y+(b.y-a.y)*s/passos - g/2, g, cor, alpha);
    }
  }
  function raio(x0,y0,x1,y1,vida){
    let pts=null;
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=Math.min(1,(1-p)*1.6);                 // o raio CRESCE até o alvo e fica estalando
      if(!pts || f%2===0) pts=zigue(x0,y0,x0+(x1-x0)*k,y0+(y1-y0)*k, 12);
      if(f%3!==2){                                    // pisca
        linhaPx(pts, '#ffe066', 6, 0.35);
        linhaPx(pts, '#fff7c2', 3, 0.95);
      }
      if(f%3===0) faisca(pts[pts.length-1].x, pts[pts.length-1].y, '#ffe066', rnd(-2,2), rnd(-2,2), 10, 3, 0.05);
    }});
  }
  function feixe(x0,y0,x1,y1,cor,vida){
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=Math.min(1,(1-p)*2.2), g=Math.round(2+Math.sin(Math.min(1,(1-p)*1.4)*Math.PI)*7);
      const xe=x0+(x1-x0)*k, ye=y0+(y1-y0)*k;
      linhaPx([{x:x0,y:y0},{x:xe,y:ye}], cor, g+4, 0.35);
      linhaPx([{x:x0,y:y0},{x:xe,y:ye}], '#ffffff', Math.max(2,g), 0.9);
      disco(x0, y0, 5+g*0.5, cor, 0.6);
    }});
  }
  function bomba(x0,y0,x1,y1,vida){
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p, c=caminho(x0,y0,x1,y1,k,42);
      disco(c.x, c.y, 7, '#1a1420', 1);
      px(c.x-3, c.y-4, 3, '#5a5068', 1);
      const a=f*0.5;                                  // pavio girando com faísca
      const fx=c.x+Math.cos(a)*7, fy=c.y+Math.sin(a)*7;
      px(fx-2, fy-2, 4, '#ffe066', 1);
      if(f%2===0) faisca(fx, fy, escolhe(['#ffe066','#ff7a3c']), rnd(-1,1), rnd(-1.5,0), 10, 3, 0.05);
    }});
  }
  function coracaoVoa(x0,y0,x1,y1,vida,cor){
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p, c=caminho(x0,y0,x1,y1,k,30), s=4+Math.sin(f*0.4)*1;
      const x=c.x+Math.sin(f*0.35)*4, y=c.y;
      px(x-s,y-s,s,cor,1); px(x,y-s,s,cor,1); px(x-s*1.5,y,s*3,cor,1); px(x-s,y+s,s*2,cor,1); px(x-s*0.5,y+s*2,s,cor,1);
      if(f%3===0) faisca(x, y, '#ffd6ea', rnd(-0.6,0.6), rnd(-1,0), 14, 3, -0.02, 7);
    }});
  }
  function projetilElemental(tipo, x0,y0,x1,y1, cor, vida){
    ensure(); vida=vida||16;
    switch(tipo){
      case 'fogo':      return bola(x0,y0,x1,y1,vida,{ cor:'#ff7a3c', nucleo:'#fff3b0', rastro:'brasa', arco:18, tam:8 });
      case 'gelo':      return lasca(x0,y0,x1,y1,vida);
      case 'eletrico':  return raio(x0,y0,x1,y1,vida);
      case 'energia':   return feixe(x0,y0,x1,y1,'#5ad6ff',vida);
      case 'agua':      return bola(x0,y0,x1,y1,vida,{ cor:'#3bb8ff', nucleo:'#e2f6ff', rastro:'gota', arco:22, tam:8, wobble:true });
      case 'veneno':    return bola(x0,y0,x1,y1,vida,{ cor:'#6ad13a', nucleo:'#e6ffd0', rastro:'gota', arco:30, tam:7 });
      case 'sombrio':
      case 'maldito':   return bola(x0,y0,x1,y1,vida,{ cor:'#a24bff', nucleo:'#1a0628', rastro:'fumo', arco:14, tam:8, aura:true });
      case 'explosivo': return bomba(x0,y0,x1,y1,vida);
      case 'charme':    return coracaoVoa(x0,y0,x1,y1,vida,'#ff5fa2');
      case 'lasanha':   return bola(x0,y0,x1,y1,vida,{ cor:'#ffb83c', nucleo:'#ffe9a8', rastro:'gota', arco:24, tam:7 });
      case 'sangramento': return bola(x0,y0,x1,y1,vida,{ cor:'#ff4d6d', nucleo:'#ffd6dd', rastro:'gota', arco:12, tam:6 });
      default:          return projetil(x0,y0,x1,y1,cor,vida);
    }
  }

  /* ================= IMPACTO POR ELEMENTO =================
     Vai POR CIMA do impacto genérico: cada tipo de dano deixa a marca
     dele no alvo. `h` = altura do lutador na tela (escala o efeito). */
  function elemento(tipo, x, y, forca, h){
    ensure(); forca=forca||1; h=h||90;
    const e=h/90;
    switch(tipo){
      case 'fogo':
        for(let i=0;i<Math.round(16*forca);i++)
          faisca(x+rnd(-14,14)*e, y+rnd(-10,16)*e, escolhe(['#ffe066','#ff7a3c','#ff4d1a','#fff3b0']),
                 rnd(-1.6,1.6), rnd(-4,-1.2), rnd(20,36), escolhe([4,6]), -0.06, 4, 0.97);
        formas.push({vida:12,max:12,fn:p=>{ disco(x,y,Math.round((18+(1-p)*18)*e),'#ff7a3c',p*0.5); disco(x,y-4,Math.round((8+(1-p)*10)*e),'#ffe066',p*0.8); }});
        break;
      case 'gelo':
        for(let i=0;i<10;i++){ const a=Math.PI*2*i/10+rnd(-0.2,0.2), v=rnd(2.5,4.5)*forca;
          faisca(x,y,escolhe(['#e8fdff','#7df0ff','#bff6ff']), Math.cos(a)*v, Math.sin(a)*v-1, 22, 6, 0.16, 5); }
        for(let i=0;i<8;i++) faisca(x+rnd(-30,30)*e, y-rnd(10,40)*e, '#ffffff', rnd(-0.3,0.3), rnd(0.3,0.8), 40, 2, 0.0, 7, 1);
        formas.push({vida:14,max:14,fn:p=>{                       // cristal de gelo (estrela de 6 pontas)
          const r=(12+(1-p)*16)*e;
          for(let i=0;i<6;i++){ const a=i*Math.PI/3;
            linhaPx([{x,y},{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r}], '#bff6ff', 3, p*0.9); }
        }});
        break;
      case 'eletrico':
        formas.push({vida:12,max:12,fn:(p,f)=>{
          if(f%3===2) return;
          for(let i=0;i<4;i++){ const a=Math.PI*2*i/4+f*0.3+0.4, r=(26+rnd(0,22))*e*forca;
            const pts=zigue(x,y,x+Math.cos(a)*r,y+Math.sin(a)*r*0.8,6);
            linhaPx(pts,'#ffe066',4,0.45*p); linhaPx(pts,'#fff7c2',2,p); }
        }});
        for(let i=0;i<10;i++) faisca(x,y,escolhe(['#ffe066','#ffffff']), rnd(-4,4), rnd(-4,3), 12, 3, 0.1);
        break;
      case 'agua':
        for(let i=0;i<Math.round(16*forca);i++)
          faisca(x+rnd(-8,8), y+rnd(-6,6), escolhe(['#3bb8ff','#7dd8ff','#e2f6ff']), rnd(-3,3), rnd(-5.5,-2), rnd(22,32), escolhe([3,4,5]), 0.28, 1, 0.98);
        ondaChao(x, y+h*0.40, '#7dd8ff', 26*e, 20);
        formas.push({vida:10,max:10,fn:p=>disco(x,y,Math.round((10+(1-p)*16)*e),'#7dd8ff',p*0.45)});
        break;
      case 'veneno':
        for(let i=0;i<12;i++) faisca(x+rnd(-18,18)*e, y+rnd(-6,14)*e, escolhe(['#9cff5e','#6ad13a','#c8ff9e']), rnd(-0.5,0.5), rnd(-1.6,-0.5), rnd(26,40), escolhe([5,6,8]), -0.01, 3, 0.99);
        for(let i=0;i<6;i++) faisca(x,y,'#6ad13a', rnd(-2.5,2.5), rnd(-3,-0.5), 20, 4, 0.25, 1);
        break;
      case 'sangramento':
        for(let i=0;i<Math.round(14*forca);i++) faisca(x+rnd(-6,6), y+rnd(-6,6), escolhe(['#ff4d6d','#c4103a','#ff8a9a']), rnd(-3.5,3.5), rnd(-4,-0.5), rnd(18,28), escolhe([3,4,5]), 0.3, 1);
        formas.push({vida:10,max:10,fn:p=>{
          linhaPx([{x:x-22*e,y:y-18*e},{x:x+22*e,y:y+18*e}], '#ff4d6d', 4, p);
          linhaPx([{x:x-14*e,y:y-22*e},{x:x+18*e,y:y+10*e}], '#ffd6dd', 2, p);
        }});
        break;
      case 'sombrio':
      case 'maldito':
        for(let i=0;i<12;i++){ const a=Math.PI*2*i/12;
          formas.push({vida:24,max:24,fn:(p,f)=>{               // fumaça roxa girando PRA DENTRO (sugando)
            const r=(10+p*36)*e, aa=a+f*0.18;
            px(x+Math.cos(aa)*r-3, y+Math.sin(aa)*r*0.7-3, 6, i%2?'#a24bff':'#4a1f70', 0.25+p*0.6);
          }}); }
        formas.push({vida:14,max:14,fn:p=>disco(x,y,Math.round((8+(1-p)*24)*e),'#1a0628',p*0.55)});
        anel(x,y,'#c46bff',8,16);
        break;
      case 'energia':
        formas.push({vida:12,max:12,fn:p=>{
          const r=(14+(1-p)*40)*e, g=Math.max(2,Math.round(6*p));
          retang(x-r, y-g/2, r*2, g, '#5ad6ff', p*0.8); retang(x-g/2, y-r, g, r*2, '#5ad6ff', p*0.8);
          retang(x-r*0.7, y-1, r*1.4, 2, '#ffffff', p); retang(x-1, y-r*0.7, 2, r*1.4, '#ffffff', p);
        }});
        for(let i=0;i<10;i++) faisca(x,y,escolhe(['#5ad6ff','#bff6ff']), rnd(-3.5,3.5), rnd(-3.5,3.5), 16, 4, 0, 7);
        break;
      case 'explosivo':
        formas.push({vida:16,max:16,fn:p=>{
          const r=Math.round((12+(1-p)*42)*e*forca);
          disco(x,y,r,'#ff7a3c',p*0.55); disco(x,y,Math.round(r*0.62),'#ffb03c',p*0.8); disco(x,y,Math.round(r*0.3),'#fff3b0',p);
        }});
        for(let i=0;i<7;i++){ const ox=x+rnd(-24,24)*e, oy=y+rnd(-10,10)*e, vy=rnd(-1.2,-0.5);
          formas.push({vida:44,max:44,fn:(p,f)=>disco(ox+Math.sin(f*0.05+i)*4, oy+vy*f, Math.round((6+f*0.35)*e), '#5a5068', p*0.45)}); }
        for(let i=0;i<12;i++) faisca(x,y,escolhe(['#3a2a24','#5a4030','#ffb03c']), rnd(-5,5), rnd(-6,-1), rnd(22,34), escolhe([4,6]), 0.32);
        ondaChao(x, y+h*0.40, '#ffb03c', 34*e, 22);
        break;
      case 'charme':
        for(let i=0;i<9;i++) faisca(x+rnd(-20,20)*e, y+rnd(-10,10)*e, escolhe(['#ff5fa2','#ff9ecb','#ffd6ea']), rnd(-1,1), rnd(-2.4,-0.8), rnd(28,40), escolhe([8,10]), -0.02, 2, 0.98);
        break;
      case 'lasanha':
        for(let i=0;i<12;i++) faisca(x,y,escolhe(['#ffcf5a','#c8461e','#ffe9a8']), rnd(-3.5,3.5), rnd(-4,-1), rnd(20,30), escolhe([4,6]), 0.28, i%3?0:1);
        formas.push({vida:14,max:14,fn:p=>{                      // fios de queijo esticando
          for(let i=0;i<3;i++) linhaPx([{x:x-10+i*10,y:y-6},{x:x-14+i*12,y:y+(1-p)*26*e}], '#ffe066', 2, p);
        }});
        break;
      case 'terra':
        for(let i=0;i<12;i++) faisca(x+rnd(-10,10), y+rnd(0,16)*e, escolhe(['#8a6a3a','#caa66a','#5a4030']), rnd(-3.5,3.5), rnd(-5,-1.5), rnd(22,32), escolhe([4,6,8]), 0.35, 0);
        poeira(x, y+h*0.40, 1); poeira(x, y+h*0.40, -1);
        ondaChao(x, y+h*0.40, '#caa66a', 30*e, 20);
        break;
      default: // físico: linhas de impacto irradiando (o "POW" de quadrinho)
        formas.push({vida:8,max:8,fn:p=>{
          for(let i=0;i<8;i++){ const a=i*Math.PI/4+0.2, r0=(14+(1-p)*8)*e, r1=r0+(10+(1-p)*16)*e*forca;
            linhaPx([{x:x+Math.cos(a)*r0,y:y+Math.sin(a)*r0},{x:x+Math.cos(a)*r1,y:y+Math.sin(a)*r1}], '#ffffff', 2, p); }
        }});
    }
  }

  /* aura de concentração (buff, cura, terreno) */
  function aura(x,y,cor,vida){
    ensure(); vida=vida||26;
    formas.push({vida,max:vida,fn:(p,f)=>{
      for(let i=0;i<7;i++){
        const a=(f*0.14)+i*0.9;
        const r=26-(1-p)*16;
        px(x+Math.cos(a)*r-2, y+Math.sin(a)*r*0.5 - (1-p)*30, 4, cor, p);
      }
    }});
    for(let i=0;i<8;i++)
      faisca(x+(Math.random()-0.5)*40, y+16, cor, (Math.random()-0.5)*1.2, -1.6-Math.random()*1.6, 26, 4, -0.02);
  }

  /* SETAS subindo (buff) ou descendo (debuff) em cima de quem recebeu */
  function setas(x,y,cor,desce){
    ensure();
    for(let i=0;i<4;i++){
      const ox=x+(i-1.5)*14+rnd(-3,3), atraso=i*3, vy=desce? 0.9 : -1.1;
      formas.push({vida:34+atraso,max:34+atraso,fn:(p,f)=>{
        if(f<atraso) return;
        const yy=y+vy*(f-atraso)+(desce?-20:10), a=Math.min(1,p*2);
        const s=desce?-1:1;
        px(ox-1, yy-6*s, 3, cor, a);
        px(ox-4, yy-3*s, 3, cor, a); px(ox+2, yy-3*s, 3, cor, a);
        px(ox-1, yy-3*s, 3, cor, a); px(ox-1, yy, 3, cor, a); px(ox-1, yy+3*s, 3, cor, a);
      }});
    }
  }

  /* ESCUDO de quem defendeu: hexágono de luz que pisca em volta dele */
  function escudo(x,y,h,cor){
    ensure(); h=h||90; cor=cor||'#7df0ff';
    formas.push({vida:30,max:30,fn:(p,f)=>{
      const r=h*0.52*(1+(1-p)*0.08), a=(f%6<3?1:0.75)*Math.min(1,p*2.2);
      const pts=[]; for(let i=0;i<=6;i++){ const an=-Math.PI/2+i*Math.PI/3; pts.push({x:x+Math.cos(an)*r*0.72, y:y+Math.sin(an)*r}); }
      linhaPx(pts, cor, 3, a);
      retang(x-r*0.72, y-r, r*1.44, r*2, cor, a*0.08);
    }});
    for(let i=0;i<6;i++) faisca(x+rnd(-20,20), y+rnd(-30,20), '#ffffff', 0, -0.6, 20, 3, 0, 7);
  }

  /* linhas de VELOCIDADE atrás de quem está avançando */
  function rastroVelocidade(x,y,dir,cor,h){
    ensure(); h=h||90;
    for(let i=0;i<4;i++){
      const oy=y+rnd(-h*0.35,h*0.3), len=rnd(26,60), ox=x-dir*rnd(10,30);
      formas.push({vida:8,max:8,fn:p=>retang(dir>0? ox-len : ox, oy, len*p, 2, i%2?cor:'#ffffff', p*0.7)});
    }
  }

  /* NOCAUTE: clarão, estrelinhas girando e a ALMA subindo do corpo */
  function ko(x,y,h,cor){
    ensure(); h=h||90; cor=cor||'#ff4d6d';
    impacto(x,y,'#ffffff',1.5);
    anel(x,y,cor,14,20);
    ondaChao(x, y+h*0.4, cor, 40, 24);
    // alma: fantasminha branco subindo e balançando
    formas.push({vida:70,max:70,fn:(p,f)=>{
      const yy=y-10-f*1.1, xx=x+Math.sin(f*0.12)*8, a=Math.min(1,p*1.8)*0.85, s=3;
      px(xx-s*2,yy-s*3,s*4,'#e8f0ff',a); px(xx-s*3,yy-s,s*6,'#e8f0ff',a);
      px(xx-s*3,yy+s,s*2,'#e8f0ff',a); px(xx+s,yy+s,s*2,'#e8f0ff',a);
      px(xx-s,yy-s*2,s,'#1a0a2a',a); px(xx+s,yy-s*2,s,'#1a0a2a',a);
    }});
    // estrelinhas de tontura em volta da cabeça
    formas.push({vida:40,max:40,fn:(p,f)=>{
      for(let i=0;i<4;i++){ const a=f*0.2+i*Math.PI/2;
        px(x+Math.cos(a)*18-2, y-h*0.35+Math.sin(a)*5-2, 4, '#ffe066', p); }
    }});
  }

  /* ================= EFEITOS DE SPRITE (folha de efeitos) =================
     `fx` vem da skill (turndata.js): {folha, modo, quadros:[[faixa,quadro],...], alt}.
     · sprite(fx,x,y)              — toca os quadros em (x,y) (alvo ou origem)
     · spriteProjetil(fx,x0,y0,x1,y1) — o recorte VOA de A até B
     · fixo(chave, fx, x, y)       — fica desenhado TODO quadro até fixo(chave,null)
                                     (o redemoinho ativo girando em cima do alvo)
     Se a folha ainda não carregou, simplesmente não desenha (sem erro). */
  const fixos = {};
  function desenhaQuadro(fx, i, x, y, alpha, espelha){
    const sh = SpriteSheet.load(fx.folha);
    if(!sh.ready) return;
    const q = fx.quadros[i % fx.quadros.length];
    /* passo pode ser [faixa,quadro] (recorte automático) ou {x,y,w,h}
       direto na folha — pra peça pequena demais pro detector (as
       bolinhas de energia do topo da raio_sprites.png). */
    const fr = (q && !Array.isArray(q) && q.w) ? q : SpriteSheet.pick(sh, q[0], q[1]); if(!fr) return;
    const sc = (fx.alt||60) / fr.h, w=fr.w*sc, h=fr.h*sc;
    ctx.save();
    ctx.globalAlpha = alpha==null? 1 : alpha;
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(x), Math.round(y));
    if(espelha) ctx.scale(-1,1);
    ctx.drawImage(sh.img, fr.x, fr.y, fr.w, fr.h, Math.round(-w/2), Math.round(-h/2), Math.round(w), Math.round(h));
    ctx.restore();
  }
  function sprite(fx, x, y, vida){
    ensure(); if(!fx) return; vida=vida||30;
    formas.push({vida,max:vida,fn:(p,f)=>{
      const i = Math.min(fx.quadros.length-1, Math.floor((1-p)*fx.quadros.length));
      desenhaQuadro(fx, i, x, y, Math.min(1, p*3), false);
    }});
  }
  function spriteProjetil(fx, x0,y0,x1,y1, vida){
    ensure(); if(!fx) return; vida=vida||16;
    const vaiEsq = x1 < x0;
    formas.push({vida,max:vida,fn:(p,f)=>{
      const k=1-p;
      const x=x0+(x1-x0)*k, y=y0+(y1-y0)*k - Math.sin(k*Math.PI)*14;
      desenhaQuadro(fx, Math.floor(f/4), x, y, 1, vaiEsq);
    }});
  }
  function fixo(chave, fx, x, y){
    if(!fx){ delete fixos[chave]; return; }
    fixos[chave] = { fx, x, y };
  }

  /* ================= ENCENAÇÃO DOS GOLPES =================
     · banner(txt,cor)   — faixa com o NOME da ultimate cruzando a tela
     · tremer(forca,vida)— chacoalha o palco (não o HUD) no impacto
     · zoom(escala,vida) — a câmera dá um "soco" pra dentro no impacto
     · fantasma(canvas)  — vulto do lutador que fica pra trás na investida
     · carga(x,y,cor)    — energia girando e fechando em quem vai soltar
     · poeira(x,y)       — poeira levantando do chão (partida / pouso)  */
  let faixa=null;
  function banner(txt, cor){ ensure(); faixa={ txt, cor:cor||'#ffe066', vida:84, max:84 }; }
  function desenhaFaixa(){
    if(!faixa) return;
    faixa.vida--; if(faixa.vida<=0){ faixa=null; return; }
    const W=cv.width, y=Math.round(cv.height*0.30), h=46;
    const f=faixa.max-faixa.vida;                     // quadros desde o começo
    const entra=Math.min(1, f/10), sai=Math.min(1, faixa.vida/10);
    const off = (1-entra)*-W + (1-sai)*W;             // entra pela esquerda, sai pela direita
    ctx.globalAlpha=0.78*Math.min(entra,sai);
    ctx.fillStyle='#07040c'; ctx.fillRect(0, y-h/2, W, h);
    ctx.globalAlpha=Math.min(entra,sai);
    ctx.fillStyle=faixa.cor; ctx.fillRect(0, y-h/2, W, 3); ctx.fillRect(0, y+h/2-3, W, 3);
    // listras de velocidade dentro da faixa
    for(let i=0;i<14;i++){
      const lx=((i*137 + f*18) % (W+80)) - 40;
      ctx.globalAlpha=0.25*Math.min(entra,sai); ctx.fillRect(lx, y-h/2+8+(i%4)*8, 40, 2);
    }
    ctx.globalAlpha=Math.min(entra,sai);
    ctx.textAlign='center'; ctx.font="18px 'Press Start 2P', monospace";
    ctx.fillStyle='#000'; ctx.fillText(faixa.txt, W/2+off+3, y+9+3);
    ctx.fillStyle=faixa.cor; ctx.fillText(faixa.txt, W/2+off, y+9);
    ctx.globalAlpha=1;
  }

  /* CUT-IN da ULTIMATE: faixa inclinada atravessando a tela com os
     OLHOS de quem está soltando o golpe (recorte `olhos` do personagem,
     ver Sprites.olhosDe), ampliados em pixel art, linhas de velocidade
     na cor do golpe e o nome da ultimate numa plaquinha embaixo.
     `lado` = de que lado ele entra (1 = da esquerda, -1 = da direita). */
  let cortina=null;
  function cutin(olhos, cor, nome, lado){
    ensure();
    cortina={ olhos, cor:cor||'#ffe066', nome:nome||'', lado:lado||1, vida:100, max:100 };
    faixa=null;
  }
  function desenhaCutin(){
    if(!cortina) return;
    cortina.vida--; if(cortina.vida<=0){ cortina=null; return; }
    const W=cv.width, H=cv.height, f=cortina.max-cortina.vida, o=cortina.olhos;
    const entra=Math.min(1, f/9), sai=Math.min(1, cortina.vida/12), a=Math.min(entra, sai);
    const ease=k=>1-Math.pow(1-k,3);
    const bh=Math.round(Math.max(64, Math.min(140, H*0.19)));
    const cy=Math.round(H*0.30);
    const desl=(1-ease(entra))*W*-cortina.lado + (1-ease(sai))*W*cortina.lado;
    ctx.save();
    ctx.translate(Math.round(W/2+desl), cy);
    ctx.rotate(-0.07*cortina.lado);
    // faixa escura + bordas na cor do golpe
    ctx.globalAlpha=0.92*a; ctx.fillStyle='#07040c'; ctx.fillRect(-W, -bh/2, W*2, bh);
    ctx.globalAlpha=a; ctx.fillStyle=cortina.cor;
    ctx.fillRect(-W, -bh/2-5, W*2, 5); ctx.fillRect(-W, bh/2, W*2, 5);
    ctx.fillStyle='#ffffff'; ctx.fillRect(-W, -bh/2-7, W*2, 2); ctx.fillRect(-W, bh/2+5, W*2, 2);
    // os OLHOS, ampliados (pixel art), dando um zoom lento pra dentro
    if(o){
      let s=(bh*0.94)/o.h; if(o.w*s > W*0.92) s=(W*0.92)/o.w;
      s*= 1 + f*0.0018;
      const w=o.w*s, h=o.h*s;
      ctx.save();
      ctx.beginPath(); ctx.rect(-W, -bh/2, W*2, bh); ctx.clip();
      ctx.imageSmoothingEnabled=false; ctx.globalAlpha=a;
      ctx.drawImage(o.img, o.x, o.y, o.w, o.h, Math.round(-w/2), Math.round(-h/2), Math.round(w), Math.round(h));
      // clarão branco na entrada
      if(f<5){ ctx.globalAlpha=(1-f/5)*0.8; ctx.fillStyle='#fff'; ctx.fillRect(-w/2, -h/2, w, h); }
      // laterais esfumaçando na cor do golpe
      const g=ctx.createLinearGradient(-w/2-40, 0, w/2+40, 0);
      g.addColorStop(0, cortina.cor); g.addColorStop(0.18, 'rgba(0,0,0,0)'); g.addColorStop(0.82, 'rgba(0,0,0,0)'); g.addColorStop(1, cortina.cor);
      ctx.globalAlpha=0.45*a; ctx.fillStyle=g; ctx.fillRect(-w/2-40, -bh/2, w+80, bh);
      ctx.restore();
    }
    // linhas de velocidade atravessando a faixa
    for(let i=0;i<16;i++){
      const lx=(((i*173) + f*26*cortina.lado) % (W*2+200)) - W - 100;
      const ly=-bh/2+6+((i*37)%(bh-12));
      ctx.globalAlpha=(i%3===0?0.55:0.25)*a; ctx.fillStyle= i%2? cortina.cor : '#ffffff';
      ctx.fillRect(Math.round(lx), Math.round(ly), 60+(i%4)*24, 2);
    }
    ctx.restore();
    // plaquinha com o NOME da ultimate
    if(cortina.nome){
      ctx.save();
      ctx.globalAlpha=a; ctx.font="16px 'Press Start 2P', monospace"; ctx.textAlign='center';
      const tw=ctx.measureText(cortina.nome).width+28, ty=cy+bh/2+30, tx=Math.round(W/2+desl*0.6);
      ctx.fillStyle='#07040c'; ctx.fillRect(tx-tw/2, ty-22, tw, 32);
      ctx.fillStyle=cortina.cor; ctx.fillRect(tx-tw/2, ty-22, tw, 3); ctx.fillRect(tx-tw/2, ty+7, tw, 3);
      ctx.fillStyle='#000'; ctx.fillText(cortina.nome, tx+2, ty+2);
      ctx.fillStyle=cortina.cor; ctx.fillText(cortina.nome, tx, ty);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }

  /* ANÚNCIO no meio do palco: "⚔ LUTEM!", "RODADA 3", "VITÓRIA!".
     O texto entra GRANDE e assenta, com uma faixa riscando atrás. */
  let anuncios=[];
  function anuncio(txt, cor, sub, vida){
    ensure();
    const palco=document.getElementById('bt-palco');
    const r=palco ? palco.getBoundingClientRect() : { left:0, top:0, width:cv.width, height:cv.height };
    vida=vida||80;
    anuncios=[{ txt, cor:cor||'#ffe066', sub:sub||'', vida, max:vida, x:r.left+r.width/2, y:r.top+r.height*0.40, w:r.width }];
  }
  function desenhaAnuncios(){
    for(let i=anuncios.length-1;i>=0;i--){
      const an=anuncios[i];
      an.vida--; if(an.vida<=0){ anuncios.splice(i,1); continue; }
      const f=an.max-an.vida, entra=Math.min(1,f/8), sai=Math.min(1,an.vida/14), a=Math.min(entra,sai);
      const esc=1+Math.max(0,1-f/7)*1.3;                   // chega grande e assenta
      const tam=Math.round(Math.max(14, Math.min(34, an.w*0.045)));
      // faixa riscada atrás
      const fw=an.w*0.8*Math.min(1,f/6);
      ctx.globalAlpha=0.75*a; ctx.fillStyle='#07040c'; ctx.fillRect(Math.round(an.x-fw/2), Math.round(an.y-tam*1.1), Math.round(fw), Math.round(tam*2.2));
      ctx.globalAlpha=a; ctx.fillStyle=an.cor;
      ctx.fillRect(Math.round(an.x-fw/2), Math.round(an.y-tam*1.1), Math.round(fw), 3);
      ctx.fillRect(Math.round(an.x-fw/2), Math.round(an.y+tam*1.1-3), Math.round(fw), 3);
      ctx.save();
      ctx.translate(Math.round(an.x), Math.round(an.y));
      ctx.scale(esc, esc);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=tam+"px 'Press Start 2P', monospace";
      ctx.globalAlpha=a; ctx.fillStyle='#000'; ctx.fillText(an.txt, 3, 3);
      ctx.fillStyle=an.cor; ctx.fillText(an.txt, 0, 0);
      if(an.sub){ ctx.font=Math.round(tam*0.34)+"px 'Press Start 2P', monospace";
        ctx.fillStyle='#000'; ctx.fillText(an.sub, 2, tam*0.95+2); ctx.fillStyle='#e9dcff'; ctx.fillText(an.sub, 0, tam*0.95); }
      ctx.restore();
      ctx.textBaseline='alphabetic';
    }
    ctx.globalAlpha=1;
  }

  /* CONFETE da vitória: cai pelo palco inteiro, girando */
  function confete(){
    ensure();
    const palco=document.getElementById('bt-palco');
    const r=palco ? palco.getBoundingClientRect() : { left:0, top:0, width:cv.width, height:cv.height };
    const cores=['#ffe066','#ff5fa2','#5ad6ff','#9cff5e','#c46bff','#ff7a3c','#ffffff'];
    for(let i=0;i<110;i++)
      faisca(r.left+Math.random()*r.width, r.top-rnd(0,r.height*0.6), escolhe(cores),
             rnd(-0.8,0.8), rnd(0.6,2.2), rnd(120,200), escolhe([5,6,7]), 0.012, 6, 0.995);
  }

  /* SETA de "vez de quem": quiquinho em cima de quem vai agir */
  let seta=null;
  function marcarVez(x, y, cor){ seta = (x==null)? null : { x, y, cor:cor||'#ffe066' }; }
  let tSeta=0;
  function desenhaSeta(){
    if(!seta) return;
    tSeta++;
    const y=seta.y - Math.abs(Math.sin(tSeta*0.09))*8, x=seta.x;
    ctx.globalAlpha=0.95;
    px(x-8, y-14, 4, '#000'); px(x+4, y-14, 4, '#000');
    for(let i=0;i<5;i++) px(x-8+i*2, y-12+i*2, 4, seta.cor), px(x+4-i*2, y-12+i*2, 4, seta.cor);
    px(x-2, y-4, 4, '#fff');
    ctx.globalAlpha=1;
  }

  /* CURA: sinais de + verdes subindo de quem recebeu */
  function cura(x, y){
    ensure();
    for(let i=0;i<7;i++){
      const ox=x+(Math.random()-0.5)*44, oy=y+10+Math.random()*20, vy=-0.9-Math.random()*0.9, vida=30+Math.random()*14;
      formas.push({vida, max:vida, fn:(p,f2)=>{
        const yy=oy+vy*f2, a=Math.min(1,p*1.6);
        px(ox-1, yy-5, 3, '#7dff8a', a); px(ox-1, yy+1, 3, '#7dff8a', a);
        px(ox-4, yy-2, 3, '#7dff8a', a); px(ox+2, yy-2, 3, '#7dff8a', a); px(ox-1, yy-2, 3, '#eaffe8', a);
      }});
    }
    for(let i=0;i<6;i++) faisca(x+rnd(-24,24), y+rnd(-10,20), '#eaffe8', 0, rnd(-1.4,-0.6), 24, 3, -0.01, 7);
  }

  /* ---------- câmera: tremor + zoom de impacto (no #bt-palco) ---------- */
  let treme=null, cam=null;
  function tremer(forca, vida){
    if(treme && treme.forca>forca && treme.vida>4) return;   // tremor maior em andamento manda
    treme={ forca:forca||3, vida:vida||8, max:vida||8 };
  }
  /* zoom: "soco" de câmera pra dentro, centrado no ponto (x,y) da tela */
  function zoom(escala, vida, x, y){
    cam={ escala:escala||1.05, vida:vida||18, max:vida||18, x, y };
    const palco=document.getElementById('bt-palco');
    if(palco && x!=null){
      const r=palco.getBoundingClientRect();
      palco.style.transformOrigin = Math.round(x-r.left)+'px '+Math.round(y-r.top)+'px';
    }
  }
  function aplicaCamera(){
    const palco=document.getElementById('bt-palco'); if(!palco) return;
    let tx=0, ty=0, s=1;
    if(treme){
      treme.vida--;
      if(treme.vida<=0) treme=null;
      else { const k=treme.forca*(treme.vida/treme.max);
             tx=Math.round((Math.random()*2-1)*k); ty=Math.round((Math.random()*2-1)*k*0.6); }
    }
    if(cam){
      cam.vida--;
      if(cam.vida<=0) cam=null;
      else { const f=cam.max-cam.vida, entra=Math.min(1,f/3), sai=cam.vida/cam.max;
             s=1+(cam.escala-1)*Math.min(entra, sai*1.4); }
    }
    const tr = (tx||ty||s!==1) ? `translate(${tx}px, ${ty}px)`+(s!==1? ` scale(${s.toFixed(3)})` : '') : '';
    if(palco.style.transform!==tr) palco.style.transform=tr;
    // quadro de impacto: o palco em negativo por 2–3 quadros
    const fl = impactoQ>0 ? 'invert(1) contrast(1.6) saturate(0)' : '';
    if(impactoQ>0) impactoQ--;
    if(palco.style.filter!==fl) palco.style.filter=fl;
    if(!cam && !treme && palco.style.transformOrigin) palco.style.transformOrigin='';
  }

  function fantasma(el, cor){
    ensure(); if(!el || !el.width) return;
    const r=el.getBoundingClientRect();
    const copia=document.createElement('canvas'); copia.width=el.width; copia.height=el.height;
    const cc=copia.getContext('2d'); cc.drawImage(el,0,0);
    if(cor){ cc.globalCompositeOperation='source-atop'; cc.globalAlpha=0.45; cc.fillStyle=cor; cc.fillRect(0,0,copia.width,copia.height); }
    formas.push({vida:12,max:12,fn:(p)=>{
      ctx.globalAlpha=p*0.42; ctx.imageSmoothingEnabled=false;
      ctx.drawImage(copia, r.left, r.top, r.width, r.height);
    }});
  }

  function carga(x,y,cor,vida){
    ensure(); vida=vida||26;
    formas.push({vida,max:vida,fn:(p,f)=>{
      for(let i=0;i<12;i++){
        const a=i*(Math.PI*2/12)+f*0.16;
        const r=8+p*54;                                  // fecha no centro conforme acaba
        px(x+Math.cos(a)*r-2, y+Math.sin(a)*r*0.72-2, (i%3?4:6), cor, 0.35+(1-p)*0.65);
      }
      // raios de luz subindo do chão enquanto carrega
      if(f%3===0) faisca(x+rnd(-30,30), y+rnd(10,40), cor, 0, rnd(-3,-1.5), 18, escolhe([2,4]), 0, 0, 1);
    }});
  }

  function poeira(x,y,dir){
    ensure(); dir=dir||1;
    for(let i=0;i<9;i++)
      faisca(x+(Math.random()-0.5)*20, y, '#d8c8a8', -dir*(0.6+Math.random()*1.8), -0.4-Math.random()*1.4, 18+Math.random()*8, 4, 0.05);
  }

  /* número de dano / texto flutuante.
     opts: { pop:true (chega grande e assenta), forte:true (treme e ganha
     contorno — golpe que tirou um pedaço grande), vida, vy } */
  function texto(x,y,txt,cor,tam,opts){
    ensure(); opts=opts||{};
    textos.push({x,y,txt,cor,tam:tam||14,vida:opts.vida||44,max:opts.vida||44,vy:opts.vy!=null?opts.vy:-1.5,
                 pop:!!opts.pop, forte:!!opts.forte, vx:opts.vx||0});
  }
  function numero(x,y,valor,cor,tam,forte){
    texto(x,y,valor,cor,tam,{ pop:true, forte, vida:forte?58:48, vy:-1.7, vx:rnd(-0.35,0.35) });
  }

  /* ÍCONE DE STATUS que pegou no alvo (veneno, lento, atordoado...) */
  const STATUS = {
    veneno:{ ic:'☠', txt:'VENENO', cor:'#9cff5e' },  sangramento:{ ic:'🩸', txt:'SANGRANDO', cor:'#ff4d6d' },
    queimadura:{ ic:'🔥', txt:'QUEIMANDO', cor:'#ff7a3c' }, lento:{ ic:'❄', txt:'LENTO', cor:'#7df0ff' },
    confuso:{ ic:'😵', txt:'CONFUSO', cor:'#c46bff' }, atordoado:{ ic:'⚡', txt:'ATORDOADO!', cor:'#ffe066' },
    provocado:{ ic:'😤', txt:'PROVOCADO', cor:'#ffb03c' }, selado:{ ic:'🔇', txt:'SELADO', cor:'#ff4d6d' },
    semAtaque:{ ic:'☠', txt:'SEM ATAQUE', cor:'#ff4d6d' }, resistiu:{ ic:'🛡', txt:'RESISTIU', cor:'#ffe066' },
    tempo:{ ic:'⏱', txt:'-TEMPO', cor:'#7df0ff' }, roubado:{ ic:'🎭', txt:'ULT ROUBADA', cor:'#c46bff' },
    purificado:{ ic:'✨', txt:'PURIFICADO', cor:'#7dffc4' }, imune:{ ic:'🛡', txt:'IMUNE', cor:'#e9dcff' },
    furtado:{ ic:'🫳', txt:'BUFF FURTADO', cor:'#ff9ecb' },
    desintegrado:{ ic:'🌀', txt:'-1 DEFESA', cor:'#8a5cff' }, desfeito:{ ic:'🌀', txt:'BUFFS DESFEITOS', cor:'#8a5cff' },
    buff_forca:{ ic:'💪', txt:'+ATAQUE', cor:'#ffb03c' }, buff_blindagem:{ ic:'🛡', txt:'+DEFESA', cor:'#7df0ff' },
    buff_agilidade:{ ic:'💨', txt:'+VELOCIDADE', cor:'#7df0ff' }, buff_regeneracao:{ ic:'💚', txt:'REGENERANDO', cor:'#7dff8a' }
  };
  function efeitoStatus(x, y, chave, i){
    ensure();
    const s=STATUS[chave]; if(!s) return;
    texto(x, y-(i||0)*13, s.ic+' '+s.txt, s.cor, 9, { vida:62, vy:-0.75 });
    for(let k=0;k<5;k++) faisca(x+rnd(-14,14), y-(i||0)*13+4, s.cor, rnd(-1,1), rnd(-1.4,-0.4), 18, 3, 0, 7);
    if(chave.indexOf('buff_')===0) setas(x, y+30, s.cor, false);
    else if(chave==='lento' || chave==='semAtaque' || chave==='tempo' || chave==='furtado' || chave==='desintegrado' || chave==='desfeito') setas(x, y+10, s.cor, true);
  }

  /* clarão de tela (supers) */
  function flash(frames,cor){ ensure(); clarao=frames||8; claraoMax=clarao; claraoCor=cor||'#fff'; }

  /* ================= PEÇAS PRA GOLPES SOB MEDIDA (1.45) =================
     Usadas pelo js/turngolpes.js, onde cada golpe ganha a encenação que
     combina com o NOME dele (o pão voando, o Astra atropelando, o rifle
     atirando...). Aqui ficam só as peças genéricas de desenho. */

  // forma livre: fn(p, f) é chamada a cada quadro (p: 1→0, f: quadros desde o começo)
  function forma(vida, fn, fim){ ensure(); formas.push({vida, max:vida, fn, fim}); }

  /* imagem (canvas de pixel art do TurnGolpes ou PNG carregado) centrada
     em (x,y) com altura `alt`, girada `rot` e espelhada se `espelha` */
  function desenhaImg(img, x, y, alt, rot, alpha, espelha, larg){
    if(!img || (img.complete===false) || !img.width) return;
    const h=alt||img.height, w=larg || img.width*(h/img.height);
    ctx.save();
    ctx.globalAlpha=alpha==null? 1 : alpha;
    ctx.imageSmoothingEnabled=false;
    ctx.translate(Math.round(x), Math.round(y));
    if(rot) ctx.rotate(rot);
    if(espelha) ctx.scale(-1,1);
    ctx.drawImage(img, Math.round(-w/2), Math.round(-h/2), Math.round(w), Math.round(h));
    ctx.restore();
  }

  /* OBJETO solto: aparece em (x,y) e se mexe sozinho (cai, sobe, gira,
     cresce). o = { alt, vida, vx, vy, grav, rot, vrot, de, ate (escala
     inicial/final), alpha, espelha, atraso, fim } */
  function objeto(img, x, y, o){
    ensure(); o=o||{};
    const vida=(o.vida||30)+(o.atraso||0);
    let px0=x, py0=y, vx=o.vx||0, vy=o.vy||0, rot=o.rot||0;
    formas.push({vida, max:vida, fim:o.fim, fn:(p,f)=>{
      if(f<(o.atraso||0)) return;
      const ff=f-(o.atraso||0), vidaR=vida-(o.atraso||0), k=Math.min(1, ff/Math.max(1,vidaR));
      px0+=vx; py0+=vy; vy+=(o.grav||0); rot+=(o.vrot||0);
      const esc=(o.de==null?1:o.de)+((o.ate==null?1:o.ate)-(o.de==null?1:o.de))*(1-Math.pow(1-k,3));
      const a=(o.alpha==null?1:o.alpha)*Math.min(1, p*vida/Math.max(1, Math.min(8, vida*0.3)));
      desenhaImg(img, px0, py0, (o.alt||32)*esc, rot, a, o.espelha);
    }});
  }

  /* OBJETO VOANDO de A até B em `vida` quadros (chega no impacto).
     o = { alt, arco, giro (rad/quadro), volta (quadros voltando pra A
     depois de chegar — bumerangue), rastro (cor), fantasmas, espelha,
     pontos (lista de {x,y} intermediários: ricochete), fim } */
  function voa(img, x0,y0,x1,y1, vida, o){
    ensure(); o=o||{};
    const volta=o.volta||0, total=vida+volta, arco=o.arco==null?18:o.arco;
    const esp = o.espelha!=null ? o.espelha : (x1<x0);
    const pts=[{x:x0,y:y0}].concat(o.pontos||[], [{x:x1,y:y1}]);
    /* posição no caminho (0→1) pela DISTÂNCIA percorrida (velocidade
       constante — é assim que o turnui calcula a hora de cada alvo
       apanhar no golpe que varre o time), com arco em cada trecho */
    const L=[0]; for(let i=1;i<pts.length;i++) L.push(L[i-1]+Math.max(1,Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y)));
    const tot=L[L.length-1];
    const pos=k=>{
      const d=Math.max(0,Math.min(1,k))*tot; let i=0; while(i<pts.length-2 && L[i+1]<d) i++;
      const fr=Math.min(1,(d-L[i])/(L[i+1]-L[i]));
      const a=pts[i], b=pts[i+1], arc=(i===0? arco : arco*0.6);
      return { x:a.x+(b.x-a.x)*fr, y:a.y+(b.y-a.y)*fr - Math.sin(fr*Math.PI)*arc };
    };
    const hist=[];
    formas.push({vida:total, max:total, fim:o.fim, fn:(p,f)=>{
      let c;
      if(f<vida) c=pos(f/vida);
      else { // bumerangue voltando por um arco por baixo
        const k=(f-vida)/Math.max(1,volta);
        c={ x:x1+(x0-x1)*k, y:y1+(y0-y1)*k + Math.sin(k*Math.PI)*arco*1.4 };
      }
      hist.push(c); if(hist.length>8) hist.shift();
      const rot=(o.giro||0)*f*(esp?-1:1);
      if(o.rastro) for(let i=0;i<hist.length-1;i++) disco(hist[i].x, hist[i].y, Math.max(2, (o.alt||24)*0.18*(i/hist.length)), o.rastro, 0.35*(i/hist.length));
      if(o.fantasmas) for(let i=Math.max(0,hist.length-1-o.fantasmas);i<hist.length-1;i++)
        desenhaImg(img, hist[i].x, hist[i].y, o.alt||24, rot-(o.giro||0)*(hist.length-1-i), 0.25, esp);
      desenhaImg(img, c.x, c.y, o.alt||24, rot, 1, esp);
    }});
  }

  /* VEÍCULO (sprite visto de lado) cruzando o chão de x0 até x1 — o
     Astra atropelando, o Corsa chegando. Quica de leve, solta poeira e
     linhas de velocidade. imgs = { dir, esq } */
  function veiculo(imgs, x0, x1, yChao, alt, vida, o){
    ensure(); o=o||{};
    const vaiDir=x1>=x0, img=vaiDir? imgs.dir : imgs.esq;
    formas.push({vida, max:vida, fim:o.fim, fn:(p,f)=>{
      const k=f/vida, kk=o.freia? 1-Math.pow(1-k,2.4) : k;
      const x=x0+(x1-x0)*kk, y=yChao-alt*0.5-Math.abs(Math.sin(f*0.9))*1.5;
      const a=Math.min(1, f/3, (vida-f)/3+0.01);
      desenhaImg(img, x, y, alt, 0, o.some? a : 1, false);
      if(f%2===0) faisca(x-(vaiDir?1:-1)*alt*0.9, yChao-2, '#d8c8a8', (vaiDir?-1:1)*rnd(0.5,2), rnd(-1.2,-0.3), 16, 4, 0.04);
      if(f%3===0 && (1-kk)>0.15) rastroVelocidade(x-(vaiDir?1:-1)*alt*0.6, y, vaiDir?1:-1, '#ffffff', alt);
    }});
  }

  /* ONOMATOPEIA de quadrinho ("POW!", "CRUNCH!", "VRUUM!"): branca, com
     contorno grosso e sombra na cor do golpe, torta e estourando. */
  function onomato(txt, x, y, cor, tam){
    ensure(); tam=tam||16;
    const rot=rnd(-0.22,0.22), vida=34;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const pop=1+Math.max(0,1-f/5)*0.8, a=Math.min(1, p*3);
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y-f*0.4));
      ctx.rotate(rot); ctx.scale(pop,pop);
      ctx.font=tam+"px 'Press Start 2P', monospace"; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.globalAlpha=a;
      ctx.fillStyle=cor||'#ff4d6d'; ctx.fillText(txt, 4, 4);
      ctx.fillStyle='#000';
      for(const [dx,dy] of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,2],[-2,2],[2,-2]]) ctx.fillText(txt, dx, dy);
      ctx.fillStyle=f<3? (cor||'#ffe066') : '#ffffff'; ctx.fillText(txt, 0, 0);
      ctx.restore();
    }});
  }

  /* PLACA com o nome do golpe (todo golpe que não é ultimate — a
     ultimate tem o cut-in). Entra do lado de quem usou, no alto do palco. */
  let placaGolpe=null;
  function placa(txt, cor, lado){
    ensure();
    const palco=document.getElementById('bt-palco');
    const r=palco ? palco.getBoundingClientRect() : { left:0, top:0, width:cv.width, height:cv.height };
    placaGolpe={ txt, cor:cor||'#ffe066', lado:lado||1, vida:76, max:76, r };
  }
  function desenhaPlaca(){
    const pl=placaGolpe; if(!pl) return;
    pl.vida--; if(pl.vida<=0){ placaGolpe=null; return; }
    const f=pl.max-pl.vida, entra=Math.min(1,f/7), sai=Math.min(1,pl.vida/9), a=Math.min(entra,sai);
    const tam=Math.round(Math.max(9, Math.min(15, pl.r.width*0.022)));
    ctx.font=tam+"px 'Press Start 2P', monospace";
    const tw=ctx.measureText(pl.txt).width+tam*2.4, th=tam*2.3;
    const ease=1-Math.pow(1-entra,3);
    const x0 = pl.lado>0 ? pl.r.left+8 : pl.r.left+pl.r.width-8-tw;
    const x = x0 - pl.lado*(1-ease)*(tw+20), y=pl.r.top+8;
    ctx.globalAlpha=0.9*a; ctx.fillStyle='#07040c'; ctx.fillRect(Math.round(x), Math.round(y), Math.round(tw), Math.round(th));
    ctx.globalAlpha=a; ctx.fillStyle=pl.cor;
    ctx.fillRect(Math.round(pl.lado>0? x : x+tw-4), Math.round(y), 4, Math.round(th));
    ctx.fillRect(Math.round(x), Math.round(y+th-2), Math.round(tw), 2);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#000'; ctx.fillText(pl.txt, Math.round(x+tw/2)+2, Math.round(y+th/2)+2);
    ctx.fillStyle='#ffffff'; ctx.fillText(pl.txt, Math.round(x+tw/2), Math.round(y+th/2));
    ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
  }

  /* LINHAS DE FOCO (anime) fechando em quem solta a ultimate */
  function focoLinhas(x, y, cor, vida){
    ensure(); vida=vida||40;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const R0=Math.max(cv.width,cv.height), a=Math.min(1,(1-p)*4, p*3)*0.55;
      for(let i=0;i<40;i++){
        const an=i*Math.PI*2/40 + ((i*7919+f*3)%13)*0.012;
        const r0=90+((i*37+f*11)%70), r1=R0;
        ctx.globalAlpha=a*(i%3? 0.6 : 1);
        ctx.strokeStyle= i%4? '#ffffff' : cor;
        ctx.lineWidth= i%5? 2 : 4;
        ctx.beginPath(); ctx.moveTo(x+Math.cos(an)*r0, y+Math.sin(an)*r0); ctx.lineTo(x+Math.cos(an)*r1, y+Math.sin(an)*r1); ctx.stroke();
      }
    }});
  }

  /* QUADRO DE IMPACTO: por 2–3 quadros o palco inteiro vira negativo
     (o "impact frame" dos jogos de luta) — só na pancada que importa */
  let impactoQ=0;
  function quadroImpacto(n){ impactoQ=Math.max(impactoQ, n||2); }

  /* FEIXE GROSSO (rifle, canhão, raio gigante): cresce de A até B,
     segura e afina. `larg` = grossura no auge. */
  function feixeGrosso(x0,y0,x1,y1,cor,larg,vida){
    ensure(); vida=vida||20; larg=larg||14;
    const ang=Math.atan2(y1-y0,x1-x0), len=Math.hypot(x1-x0,y1-y0);
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1, f/5), g=larg*Math.sin(Math.min(1,p*1.6)*Math.PI/2)*(0.85+0.15*Math.sin(f*1.7));
      ctx.save(); ctx.translate(x0,y0); ctx.rotate(ang);
      ctx.globalAlpha=0.35; ctx.fillStyle=cor; ctx.fillRect(0, -g, len*k, g*2);
      ctx.globalAlpha=0.9; ctx.fillRect(0, -g*0.55, len*k, g*1.1);
      ctx.fillStyle='#ffffff'; ctx.fillRect(0, -g*0.22, len*k, Math.max(2,g*0.44));
      // anéis correndo pelo feixe
      ctx.globalAlpha=0.6; ctx.fillStyle='#ffffff';
      for(let i=0;i<5;i++){ const xx=((f*14+i*len/5)%Math.max(1,len*k)); ctx.fillRect(Math.round(xx), Math.round(-g), 3, Math.round(g*2)); }
      ctx.restore();
      disco(x0, y0, Math.round(g*1.2+4), cor, 0.7); disco(x0, y0, Math.round(g*0.6+2), '#ffffff', 0.9);
      if(k>=1){ disco(x1, y1, Math.round(g*1.4+6), cor, 0.6); if(f%2===0) faisca(x1,y1,escolhe([cor,'#ffffff']), rnd(-4,4), rnd(-4,3), 14, 4, 0.08); }
    }});
  }

  /* RACHADURA no chão correndo de x0 até x1 (terremoto, colapso) */
  function rachadura(x0, x1, y, cor, vida, chegada){
    ensure(); vida=vida||40; cor=cor||'#1a0f08'; chegada=chegada||10;
    const pts=[]; const n=14;
    for(let i=0;i<=n;i++) pts.push({ x:x0+(x1-x0)*i/n, y:y+(i===0||i===n? 0 : rnd(-5,5)) });
    const galhos=[]; for(let i=2;i<n;i+=3) galhos.push({ i, dx:rnd(-16,16), dy:rnd(-9,9) });
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1, f/chegada), m=Math.max(1, Math.round(n*k)), a=Math.min(1,p*3);
      const seg=pts.slice(0,m+1);
      linhaPx(seg, '#ff9a3c', 6, 0.25*a);
      linhaPx(seg, cor, 3, a);
      galhos.forEach(gl=>{ if(gl.i<=m) linhaPx([pts[gl.i], {x:pts[gl.i].x+gl.dx, y:pts[gl.i].y+gl.dy}], cor, 2, a); });
    }});
  }

  /* PILAR de luz/fogo/energia caindo do céu (ou subindo do chão) sobre (x, yChao) */
  function pilar(x, yChao, h, cor, vida, sobe){
    ensure(); vida=vida||26;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1,f/5), lg=Math.max(4, h*0.22*Math.sin(Math.min(1,p*1.5)*Math.PI/2));
      // do céu: o topo fica lá em cima e o pé desce até o chão; do chão: sobe
      const yTop = sobe ? yChao - h*1.6*k : -40;
      const base = sobe ? yChao : -40 + (yChao+40)*k;
      retang(x-lg, yTop, lg*2, base-yTop, cor, 0.35);
      retang(x-lg*0.55, yTop, lg*1.1, base-yTop, cor, 0.75);
      retang(x-lg*0.2, yTop, Math.max(2,lg*0.4), base-yTop, '#ffffff', 0.9);
      if(k>=1 && f%4===0) ondaChao(x, yChao, cor, lg*2, 10);
      if(f%2===0) faisca(x+rnd(-lg,lg), base-rnd(0,h), escolhe([cor,'#ffffff']), rnd(-0.5,0.5), rnd(-3,-1), 16, 3, 0, 7);
    }});
  }

  /* CÍRCULO MÁGICO girando no chão/no ar (selo, purificação, bênção, véu) */
  function circuloMagico(x, y, r, cor, vida, achatado){
    ensure(); vida=vida||40; const ach=achatado==null? 0.38 : achatado;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1,f/8), a=Math.min(1,p*3)*k, rr=r*(0.6+0.4*k), rot=f*0.05;
      for(let i=0;i<36;i++){ const an=i*Math.PI/18; px(x+Math.cos(an)*rr-1, y+Math.sin(an)*rr*ach-1, 3, cor, a); }
      for(let i=0;i<24;i++){ const an=i*Math.PI/12-rot; px(x+Math.cos(an)*rr*0.72-1, y+Math.sin(an)*rr*0.72*ach-1, 2, '#ffffff', a*0.8); }
      // estrela de 6 pontas (dois triângulos) girando
      for(let tri=0;tri<2;tri++){
        const v=[]; for(let i=0;i<=3;i++){ const an=rot+tri*Math.PI/3+i*Math.PI*2/3; v.push({x:x+Math.cos(an)*rr*0.7, y:y+Math.sin(an)*rr*0.7*ach}); }
        linhaPx(v, cor, 2, a);
      }
      // runas (quadradinhos) na borda
      for(let i=0;i<8;i++){ const an=i*Math.PI/4+rot*1.5; px(x+Math.cos(an)*rr*0.86-3, y+Math.sin(an)*rr*0.86*ach-3, 6, '#ffffff', a*0.6); }
    }});
  }

  /* REDEMOINHO / VÓRTICE girando (desmaterializar, portal, bizarrice) */
  function vortice(x, y, r, cor, vida, cor2){
    ensure(); vida=vida||34;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const a=Math.min(1,p*3, f/4);
      for(let br=0;br<3;br++) for(let i=0;i<22;i++){
        const kk=i/22, an=br*Math.PI*2/3 + kk*5 + f*0.25, rr=r*kk;
        px(x+Math.cos(an)*rr-2, y+Math.sin(an)*rr*0.7-2, 2+Math.round(kk*4), (i%3? cor : (cor2||'#ffffff')), a*(0.3+kk*0.7));
      }
    }});
  }

  /* GARRAS: três rasgos paralelos (garra sombria, corte espectral) */
  function garras(x, y, cor, dir, tam){
    ensure(); dir=dir||1; tam=tam||1;
    formas.push({vida:14, max:14, fn:(p,f)=>{
      const k=Math.min(1,f/3);
      for(let i=0;i<3;i++){
        const ox=(i-1)*12*tam, a0={x:x+ox-dir*24*tam, y:y-30*tam}, a1={x:x+ox+dir*20*tam, y:y+26*tam};
        const b={x:a0.x+(a1.x-a0.x)*k, y:a0.y+(a1.y-a0.y)*k};
        linhaPx([a0,b], cor, 6, 0.4*p); linhaPx([a0,b], '#ffffff', 2, p);
      }
    }});
  }

  /* MORDIDA: duas fileiras de dentes fechando no alvo */
  function mordida(x, y, cor, h){
    ensure(); const e=(h||90)/90;
    formas.push({vida:18, max:18, fn:(p,f)=>{
      const fecha=Math.min(1,f/5), ab=(1-fecha)*26*e+2, a=Math.min(1,p*2.5);
      const w=40*e;
      for(let lado=-1;lado<=1;lado+=2){
        const yy=y+lado*ab;
        retang(x-w/2, yy-lado*0-(lado<0?6*e:0), w, 6*e, cor||'#3a0a10', a*0.8);
        for(let i=0;i<6;i++){ const dx=x-w/2+i*w/6+2;
          for(let j=0;j<3;j++) px(dx+j, yy+(lado<0? j*2 : -j*2-2), 6-j*2, '#ffffff', a); }
      }
    }});
  }

  /* ONDA varrendo o chão de x0 até x1 (molho, lodo, água, sabão) */
  function onda(x0, x1, yChao, h, cor, vida, cor2, chegada){
    ensure(); vida=vida||30;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1, f/(chegada||vida*0.7)), xf=x0+(x1-x0)*k, dir=x1>=x0?1:-1, a=Math.min(1,p*3);
      const larg=Math.abs(x1-x0)*0.45;
      for(let i=0;i<30;i++){
        const kk=i/30, xx=xf-dir*kk*larg, alt=h*Math.sin((1-kk)*Math.PI*0.9)*(0.6+0.4*Math.sin(f*0.4+i));
        retang(xx-4, yChao-alt, 8, alt, i%4? cor : (cor2||'#ffffff'), a*(0.5+0.5*(1-kk)));
      }
      // crista espumando
      if(f%2===0) for(let i=0;i<3;i++) faisca(xf+rnd(-6,6), yChao-h*0.9, cor2||'#ffffff', dir*rnd(0.5,2), rnd(-2.5,-0.8), 18, 4, 0.2, 1);
    }});
  }

  /* NUVEM de gás/fumaça inchando em volta de (x,y) */
  function nuvem(x, y, r, cor, vida, cor2){
    ensure(); vida=vida||36;
    const bolas=[]; for(let i=0;i<9;i++) bolas.push({ ox:rnd(-r,r), oy:rnd(-r*0.6,r*0.5), rr:rnd(r*0.35,r*0.6), c:i%3? cor : (cor2||cor) });
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1,f/8), a=Math.min(1,p*2)*0.55;
      bolas.forEach((b,i)=>disco(x+b.ox*k+Math.sin(f*0.08+i)*3, y+b.oy*k-f*0.25, Math.round(b.rr*(0.5+0.5*k)), b.c, a));
    }});
  }

  /* CRISTAIS de gelo crescendo em volta do alvo (congelou) */
  function cristais(x, yChao, h, cor, vida){
    ensure(); vida=vida||46; cor=cor||'#7df0ff';
    const lst=[]; for(let i=0;i<7;i++) lst.push({ ox:(i-3)*h*0.11+rnd(-4,4), alt:h*rnd(0.35,0.8), lg:rnd(6,11), inc:rnd(-0.3,0.3) });
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1,f/7), a=Math.min(1,p*2.5);
      lst.forEach(c=>{
        const topo={x:x+c.ox+Math.sin(c.inc)*c.alt*k, y:yChao-c.alt*k};
        for(let j=0;j<=10;j++){ const kk=j/10, w=c.lg*(1-kk)+1;
          retang(x+c.ox+(topo.x-x-c.ox)*kk-w/2, yChao+(topo.y-yChao)*kk, w, 3, j<3? cor : '#e8fdff', a*0.85); }
      });
      retang(x-h*0.42, yChao-h*0.85*k, h*0.84, h*0.85*k, '#bff6ff', a*0.18);
    }});
  }

  /* ESPINHOS saindo do chão debaixo do alvo (rugido do abismo) */
  function espinhos(x, yChao, h, cor, vida){
    ensure(); vida=vida||30;
    const lst=[]; for(let i=0;i<5;i++) lst.push({ ox:(i-2)*h*0.14+rnd(-3,3), alt:h*rnd(0.4,0.75), inc:(i-2)*0.18 });
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=f<5? f/5 : 1, a=Math.min(1,p*2.5);
      lst.forEach(s=>{
        for(let j=0;j<=12;j++){ const kk=j/12, w=Math.max(2,12*(1-kk));
          retang(x+s.ox+Math.sin(s.inc)*s.alt*k*kk-w/2, yChao-s.alt*k*kk, w, 3, j>9? '#ffffff' : cor, a); }
      });
    }});
  }

  /* PORTAL: elipse em pé girando (dmaterelizador) */
  function portal(x, y, h, cor, vida){
    ensure(); vida=vida||40;
    formas.push({vida, max:vida, fn:(p,f)=>{
      const k=Math.min(1,f/6, p*vida/6), a=k;
      const rx=h*0.18*k, ry=h*0.5*k;
      ctx.save(); ctx.globalAlpha=a*0.35; ctx.fillStyle='#07040c';
      ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill(); ctx.restore();
      for(let i=0;i<30;i++){ const an=i*Math.PI/15+f*0.2;
        px(x+Math.cos(an)*rx-2, y+Math.sin(an)*ry-2, i%3?4:6, i%2? cor : '#ffffff', a); }
    }});
  }

  /* CUBINHOS se desfazendo (desmaterializar) */
  function cubinhos(x, y, h, cor, n){
    ensure(); n=n||22;
    for(let i=0;i<n;i++) faisca(x+rnd(-h*0.25,h*0.25), y+rnd(-h*0.4,h*0.35), escolhe([cor,'#ffffff','#2a1a4a']),
                                rnd(-1.2,1.2), rnd(-2.2,-0.4), rnd(26,44), escolhe([4,6,8]), -0.02, 0, 0.98);
  }

  /* TRANSIÇÃO de entrada na batalha: faixas diagonais pretas cobrem a
     tela e abrem pros lados, revelando o palco (a "cortina" dos jogos
     de luta). Desenhada por cima de tudo. */
  let transQ=0;
  const TRANS_MAX=34;
  function transicao(){ ensure(); transQ=TRANS_MAX; }
  function desenhaTransicao(){
    if(transQ<=0) return;
    transQ--;
    const W=cv.width, H=cv.height, f=TRANS_MAX-transQ, n=9, alt=H/n+2;
    ctx.globalAlpha=1;
    for(let i=0;i<n;i++){
      // cada faixa sai um pouquinho depois da anterior, alternando o lado
      const k=Math.max(0, Math.min(1, (f-6-i*1.6)/14)), e=k*k*(3-2*k), lado=i%2? 1 : -1;
      const x=lado*e*(W+H*0.5);
      ctx.save(); ctx.translate(x, 0); ctx.transform(1,0,-0.35,1,0,0);
      ctx.fillStyle='#07040c'; ctx.fillRect(-H, i*(H/n), W+H*2, alt);
      ctx.fillStyle='#ffe066'; ctx.fillRect(-H, i*(H/n)+alt-4, W+H*2, 2);
      ctx.restore();
    }
  }

  // primitivas pra quem desenha por fora (js/turngolpes.js)
  const desenho = { px, retang, disco, linhaPx, zigue, faisca, rnd, escolhe, desenhaImg, get ctx(){ return ctx; }, get cv(){ return cv; } };

  /* ---------- passo do quadro ---------- */
  function temAlgo(){
    return parts.length || textos.length || formas.length || faixa || cortina || seta || anuncios.length ||
           clarao>0 || Object.keys(fixos).length || placaGolpe || impactoQ>0 || transQ>0;
  }
  function passo(){
    if(!ligado||!ctx) return;
    aplicaCamera();
    // nada na tela: limpa UMA vez e para de redesenhar até ter efeito de novo
    if(!temAlgo()){ if(sujo){ ctx.clearRect(0,0,cv.width,cv.height); sujo=false; } return; }
    sujo=true;
    ctx.clearRect(0,0,cv.width,cv.height);
    // efeitos FIXOS (redemoinho ativo): giram no lugar — espelha a cada
    // poucos quadros pra dar a impressão de rotação com uma pose só
    passoFixo = (passoFixo+1) % 100000;
    for(const k in fixos){
      const o=fixos[k];
      // `fx.alpha` (opcional): efeito que fica POR CIMA do lutador (a gaiola
      // de raios do Cargas) precisa deixar ele aparecer por baixo
      const al = o.fx.alpha!=null ? o.fx.alpha*(0.8+0.2*Math.sin(passoFixo*0.2)) : 0.9;
      desenhaQuadro(o.fx, Math.floor(passoFixo/8), o.x, o.y, al, Math.floor(passoFixo/5)%2===1);
    }

    // formas
    for(let i=formas.length-1;i>=0;i--){
      const s=formas[i];
      s.vida--; if(s.vida<=0){ formas.splice(i,1); if(s.fim) s.fim(); continue; }
      ctx.save(); s.fn(s.vida/s.max, s.max-s.vida); ctx.restore();
    }
    // partículas
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=p.grav; p.vx*=p.atrito; p.vida--;
      if(p.forma===6) p.vx+=Math.sin(p.vida*0.08+p.fase)*0.04;   // confete balança caindo
      if(p.vida<=0){ parts.splice(i,1); continue; }
      desenhaParticula(p);
    }
    // textos
    ctx.textAlign='center';
    for(let i=textos.length-1;i>=0;i--){
      const tx=textos[i];
      tx.y+=tx.vy; tx.vy*=0.93; tx.x+=tx.vx; tx.vida--;
      if(tx.vida<=0){ textos.splice(i,1); continue; }
      const idade=tx.max-tx.vida;
      const a=Math.min(1, tx.vida/tx.max*2.2);
      let tam=tx.tam, ox=0;
      if(tx.pop) tam=Math.round(tx.tam*(1+Math.max(0,1-idade/6)*0.9));   // estoura grande e assenta
      if(tx.forte && idade<12) ox=(idade%2?2:-2);
      ctx.globalAlpha=a;
      ctx.font=tam+"px 'Press Start 2P', monospace";
      if(tx.forte){ ctx.fillStyle='#000'; for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]]) ctx.fillText(tx.txt, Math.round(tx.x)+dx+ox, Math.round(tx.y)+dy); }
      ctx.fillStyle='#000';  ctx.fillText(tx.txt, Math.round(tx.x)+3+ox, Math.round(tx.y)+3);
      ctx.fillStyle=tx.cor;  ctx.fillText(tx.txt, Math.round(tx.x)+ox,   Math.round(tx.y));
      if(tx.forte && idade<5){ ctx.globalAlpha=(1-idade/5)*0.8; ctx.fillStyle='#fff'; ctx.fillText(tx.txt, Math.round(tx.x)+ox, Math.round(tx.y)); }
    }
    ctx.globalAlpha=1;
    desenhaFaixa();
    desenhaPlaca();
    desenhaCutin();
    desenhaAnuncios();
    desenhaSeta();
    // clarão
    if(clarao>0){
      clarao--;
      ctx.globalAlpha=(clarao/claraoMax)*0.45;
      ctx.fillStyle=claraoCor; ctx.fillRect(0,0,cv.width,cv.height);
      ctx.globalAlpha=1;
    }
    desenhaTransicao();
  }

  return { ativo, limpar, passo, impacto, anel, ondaChao, corte, projetil, projetilElemental, elemento, aura,
           texto, numero, flash, sprite, spriteProjetil, fixo, banner, tremer, zoom, fantasma, carga, poeira,
           cutin, marcarVez, cura, setas, escudo, rastroVelocidade, ko, anuncio, confete, efeitoStatus,
           // 1.45 — peças dos golpes sob medida (js/turngolpes.js)
           forma, objeto, voa, veiculo, onomato, placa, focoLinhas, quadroImpacto, feixeGrosso, rachadura,
           pilar, circuloMagico, vortice, garras, mordida, onda, nuvem, cristais, espinhos, portal, cubinhos, desenho,
           transicao };
})();
