/* ============================================================
   MUNDO — o motor do Modo História em mundo aberto (visto de cima)
   ------------------------------------------------------------
   - REGIÕES (js/mapas/*.js) se registram com `Mundo.regiao(id, def)` e
     só são GERADAS (pintadas pela semente) quando o jogador entra nelas.
     Ligam-se por SAÍDAS na borda e por PORTAS (interiores).
   - CHÃO em chunks de 16×16 tiles, pré-renderizados em 1:1 (512 px) e
     AMPLIADOS com zoom inteiro sem suavização — pixel nítido, pouca
     memória (cache com limite, descarta o menos usado). Água/lava
     animadas são desenhadas por cima, só nas células visíveis.
   - OBJETOS e PERSONAGENS: ordenados por Y (pés) a cada quadro, só os
     visíveis (baldes por chunk). Quem está mais embaixo fica na frente;
     copa de árvore e telhado cobrem o jogador "atrás" deles sozinhos.
   - Colisão: célula (terreno sólido + `col`) e caixas pequenas de
     objeto (tronco, não a copa) em baldes de 4×4 tiles.
   - Laço com dt real, preso a 1/30 s (aba em segundo plano não pode
     fazer ninguém atravessar parede).
   - Lutas: o 3x3 de sempre (`TurnUI.iniciarHistoria`). Ganhou → volta pro
     mesmo ponto. Perdeu → volta pro último ponto salvo.
   - O ROTEIRO (missões, NPCs, lutas, cenas) mora em js/missoes.js +
     js/roteiro_*.js; este arquivo só sabe andar, desenhar e perguntar.
   ============================================================ */
const Mundo = (function(){
  const T = 32, CH = 16, CHPX = CH*T;
  const REGIOES = {};
  const mapas = {};
  function regiao(id, def){ REGIOES[id] = Object.assign({ id }, def); }

  /* ---------------- estado ---------------- */
  let m = null;                 // mapa atual
  let cv, ctx, Z = 2, dpr = 1;
  let ativo = false, rafId = null, tUlt = 0, relogio = 0;
  const cam = { x:0, y:0 };
  const jog = { id:'mecas', x:0, y:0, dir:0, andando:false, passo:0, tPasso:0, vx:0, vy:0 };
  let seguidores = [];          // [{id, x, y, dir, andando, passo, tPasso}]
  let rastro = [];              // posições recentes do líder (pros seguidores)
  let npcs = [], inimigos = [];
  let pausa = 0;                // >0 = algo por cima (fala, painel, transição)
  let fala = null;              // balão de fala aberto
  let transicao = null;
  let zonaAtual = null, tZona = 0;
  let alvoInteracao = null;
  let horaForcada = null;
  const teclas = {}, borda = {};
  /* velocidade de cada um andando no mapa (1 = normal). O Cargas é o raio. */
  const VEL_PERSONAGEM = { cargas:1.4, serrinha_dog:1.25, mecas:1.05, careca:1.05, tupas:1.0, strong_smerg:0.95, hans_lambanca:1.0,
    matheus_limeira2:1.0, fat_mango:0.85, fat_smerg:0.8, smerg_normal:1.0, smergula:1.0, marcelao_black_jw:1.1 };
  const velDe = id => VEL_PERSONAGEM[id] || 1;
  /* VEÍCULOS: só andam no asfalto (`def.rodavel` troca a lista por região).
     Ficam guardados no save (`dados.veiculos[tipo] = {area,x,y,dir}`) e o
     motor põe o objeto deles na região certa a cada entrada. */
  const VEICULOS = {};
  function veiculo(tipo, d){ VEICULOS[tipo]=Object.assign({ tipo, vel:220 }, d); }
  let carro = null;              // { tipo, obj } enquanto o jogador dirige
  const toque = { ativo:false, id:null, ox:0, oy:0, dx:0, dy:0 };

  /* ---------------- regiões e mapas ---------------- */
  function mapa(id){
    if(mapas[id]) return mapas[id];
    // interior automático ('int:<região>:x:y') só existe depois que a região
    // de fora foi pintada (é ela que registra) — ex.: o save parou lá dentro
    if(!REGIOES[id] && String(id).indexOf('int:')===0){ const fora=id.split(':')[1]; if(REGIOES[fora]) mapa(fora); }
    const d = REGIOES[id]; if(!d) throw new Error('região desconhecida: '+id);
    const p = OWPintor.novo(d);
    d.pintar(p, Missoes.estado());
    // objetos que o ROTEIRO espalha (coletáveis, pistas, placas de missão)
    Missoes.objetosDaArea(id).forEach(o=>p.obj(o.nome, o.x, o.y, Object.assign({}, o.extra)));
    finalizar(p.m, d);
    return mapas[id] = p.m;
  }
  /* depois de pintar: resolve os sprites, monta colisão de objeto e baldes */
  function finalizar(mp, d){
    mp.def = d;
    mp.baldesCol = new Map();
    mp.baldesObj = new Map();
    mp.chunks = new Map(); mp.lru = [];
    mp.objs.forEach(o=>{
      if(o.tipo==='spr'){ const s=OWArte.sprite(o.nome); if(!s){ console.warn('sprite?', o.nome); o.s=null; return; } o.s=s; }
      else o.s = { im:o.g.cv, r:[0,0,o.g.cv.width,o.g.cv.height], a:o.g.a, col:o.g.col };
      const s=o.s;
      // um sprite mal definido não pode derrubar a região inteira
      if(!s || !s.a || !s.r || !s.im){ console.warn('OW: sprite incompleto', o.nome); o.s=null; return; }
      // `solidoT`: caixa em TILES (portão que fecha uma passagem inteira)
      if(o.solidoT){ const c=o.solidoT; o.caixa=[c[0]*T, c[1]*T, c[2]*T, c[3]*T]; addBalde(mp.baldesCol, o.caixa, o, 4*T); }
      else if(s.col && !o.semCol){ o.caixa=[o.x+s.col[0], o.y+s.col[1], s.col[2], s.col[3]]; addBalde(mp.baldesCol, o.caixa, o, 4*T); }
      o.topo = o.y - s.a[1]; o.esq = o.x - s.a[0]; o.w=s.r[2]; o.h=s.r[3];
      if(s.chao) o.chaoObj = true;
      const k = Math.floor(o.x/CHPX)+','+Math.floor(o.y/CHPX);
      if(!mp.baldesObj.has(k)) mp.baldesObj.set(k, []);
      mp.baldesObj.get(k).push(o);
      if(s.luz) mp.luzes.push({ x:o.x, y:o.y-20, r:3*T, cor:s.luz });
      if(o.nome==='poste' || o.nome==='lampiao') mp.luzes.push({ x:o.x, y:o.y-48, r:2.6*T, cor:'#ffe2a0', poste:true });
    });
  }
  function addBalde(mapB, cx, item, tam){
    const x0=Math.floor(cx[0]/tam), y0=Math.floor(cx[1]/tam), x1=Math.floor((cx[0]+cx[2])/tam), y1=Math.floor((cx[1]+cx[3])/tam);
    for(let j=y0;j<=y1;j++) for(let i=x0;i<=x1;i++){ const k=i+','+j; if(!mapB.has(k)) mapB.set(k,[]); mapB.get(k).push(item); }
  }

  /* ---------------- chunks do chão ---------------- */
  function chunk(cx, cy){
    const k=cx+','+cy;
    let c = m.chunks.get(k);
    if(c){ const i=m.lru.indexOf(k); if(i>=0){ m.lru.splice(i,1); m.lru.push(k); } return c; }
    const cvs = OWArte.tela(CHPX, CHPX), x = cvs.getContext('2d');
    const anim=[];
    for(let j=0;j<CH;j++) for(let i=0;i<CH;i++){
      const tx=cx*CH+i, ty=cy*CH+j; if(tx>=m.w||ty>=m.h) continue;
      OWArte.desenharTerreno(x, m, tx, ty, i*T, j*T);
      const t=OWArte.TERR[m.terr[ty*m.w+tx]]; if(t.anim) anim.push([tx,ty,t.anim]);
    }
    // decalques (faixa da rua, tapetes…) e objetos "de chão" (ponte, cachoeira)
    const x0=cx*CHPX, y0=cy*CHPX;
    m.chao.forEach(d=>{
      if(d.x<x0-64||d.y<y0-64||d.x>x0+CHPX||d.y>y0+CHPX) return;
      if(d.faixa){ x.fillStyle='#e9e4d0'; if(d.faixa==='h') x.fillRect(d.x-x0, d.y-y0, 24, 2); else x.fillRect(d.x-x0, d.y-y0, 2, 24); }
      else if(d.nome){ const s=OWArte.sprite(d.nome); if(s && s.im) x.drawImage(s.im, s.r[0], s.r[1], s.r[2], s.r[3], d.x-x0, d.y-y0, s.r[2], s.r[3]); }
    });
    c = { cv:cvs, anim };
    m.chunks.set(k, c); m.lru.push(k);
    while(m.lru.length>40){ const velho=m.lru.shift(); m.chunks.delete(velho); }
    return c;
  }

  /* ---------------- colisão ---------------- */
  function solidoCelula(tx, ty){
    if(tx<0||ty<0||tx>=m.w||ty>=m.h) return true;
    const i=ty*m.w+tx;
    return !!(OWArte.TERR[m.terr[i]].solido || m.col[i]);
  }
  function bate(x, y, w, h, ignorar){
    const x0=Math.floor(x/T), y0=Math.floor(y/T), x1=Math.floor((x+w-0.01)/T), y1=Math.floor((y+h-0.01)/T);
    for(let j=y0;j<=y1;j++) for(let i=x0;i<=x1;i++) if(solidoCelula(i,j)) return true;
    const tam=4*T, bx0=Math.floor(x/tam), by0=Math.floor(y/tam), bx1=Math.floor((x+w)/tam), by1=Math.floor((y+h)/tam);
    for(let j=by0;j<=by1;j++) for(let i=bx0;i<=bx1;i++){
      const l=m.baldesCol.get(i+','+j); if(!l) continue;
      for(const o of l){ if(o.oculto) continue; const c=o.caixa; if(x<c[0]+c[2] && x+w>c[0] && y<c[1]+c[3] && y+h>c[1]) return true; }
    }
    // NPCs parados também bloqueiam (dá pra conversar sem atravessar)
    for(const n of npcs){ if(n===ignorar || !n.visivel || n.fantasma) continue; if(Math.abs(n.x-(x+w/2))<12 && Math.abs(n.y-(y+h/2))<8) return true; }
    return false;
  }
  const caixaPes = (x,y)=>[x-7, y-7, 14, 8];
  function mover(ent, dx, dy, ignorar){
    let moveu=false;
    if(dx){ const c=caixaPes(ent.x+dx, ent.y); if(!bate(c[0],c[1],c[2],c[3], ignorar||ent)){ ent.x+=dx; moveu=true; } }
    if(dy){ const c=caixaPes(ent.x, ent.y+dy); if(!bate(c[0],c[1],c[2],c[3], ignorar||ent)){ ent.y+=dy; moveu=true; } }
    return moveu;
  }

  /* ---------------- entrada: teclado ---------------- */
  function teclaDown(e){
    if(!ativo) return;
    const k=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab'].includes(k)) e.preventDefault();
    if(!e.repeat) borda[k]=true;
    teclas[k]=true;
  }
  function teclaUp(e){ teclas[e.key.toLowerCase()]=false; }
  function apertou(...ks){ for(const k of ks) if(borda[k]){ borda[k]=false; return true; } return false; }
  function segurando(...ks){ for(const k of ks) if(teclas[k]) return true; return false; }
  function limparTeclas(){ for(const k in teclas) teclas[k]=false; for(const k in borda) delete borda[k]; }

  /* ---------------- entrada: toque (joystick que nasce onde o polegar toca) ---------------- */
  function ligarToque(){
    const area=document.getElementById('mundo-toque');
    const base=document.getElementById('mundo-joy'), bola=document.getElementById('mundo-joy-bola');
    if(!area || area._ligado) return; area._ligado=true;
    const R=48;
    area.addEventListener('touchstart', e=>{
      document.body.classList.add('mundo-tem-toque');
      for(const t of e.changedTouches){
        if(toque.ativo) break;
        toque.ativo=true; toque.id=t.identifier; toque.ox=t.clientX; toque.oy=t.clientY; toque.dx=0; toque.dy=0;
        base.style.left=(t.clientX-R)+'px'; base.style.top=(t.clientY-R)+'px'; base.hidden=false;
        bola.style.transform='translate(0px,0px)';
      }
      e.preventDefault();
    }, { passive:false });
    area.addEventListener('touchmove', e=>{
      for(const t of e.changedTouches){ if(t.identifier!==toque.id) continue;
        let dx=t.clientX-toque.ox, dy=t.clientY-toque.oy; const d=Math.hypot(dx,dy);
        if(d>R){ dx=dx/d*R; dy=dy/d*R; }
        toque.dx=dx/R; toque.dy=dy/R; bola.style.transform=`translate(${dx}px,${dy}px)`; }
      e.preventDefault();
    }, { passive:false });
    const fim=e=>{ for(const t of e.changedTouches){ if(t.identifier!==toque.id) continue; toque.ativo=false; toque.dx=toque.dy=0; base.hidden=true; } };
    area.addEventListener('touchend', fim); area.addEventListener('touchcancel', fim);
  }

  /* ---------------- tela ---------------- */
  function dimensionar(){
    if(!cv) return;
    dpr = Math.min(3, window.devicePixelRatio||1);
    const w=cv.clientWidth||window.innerWidth, h=cv.clientHeight||window.innerHeight;
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    // zoom INTEIRO: pelo menos ~12 tiles de largura (em pé, ~10) e ~8 de altura
    const retrato = h>w;
    const nx = retrato ? 10.5 : 13, ny = retrato ? 13 : 8.5;
    Z = zoomForcado || Math.max(1, Math.floor(Math.min(cv.width/(nx*T), cv.height/(ny*T))));
    ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
    const mini=document.getElementById('mundo-mini'); if(mini) mini._sujo=true;
  }

  /* ============================================================
     ABRIR / FECHAR
     ============================================================ */
  let carregado=false;
  function abrir(){
    if(typeof Historia!=='undefined' && Historia.pararCenaSeTiver) Historia.pararCenaSeTiver();
    goto('mundo');
    cv=document.getElementById('mundo-cv');
    if(!cv._ligado){
      cv._ligado=true;
      window.addEventListener('resize', dimensionar);
      window.addEventListener('keydown', teclaDown);
      window.addEventListener('keyup', teclaUp);
      window.addEventListener('blur', limparTeclas);
      ligarToque();
      document.getElementById('mundo-mini').addEventListener('click', ()=>alternarMini());
    }
    dimensionar();
    mostrarCarregando(true);
    OWArte.carregar().then(()=>{
      carregado=true;
      mostrarCarregando(false);
      const d=Missoes.carregar().dados;
      jog.id = d.lider || 'mecas';
      miniVisivel = d.minimapa!==false;
      // retomar ANTES de entrar: a primeira missão pode abrir uma cena na hora
      // (goto pra tela da cena) e um retomar depois puxaria de volta pro mapa
      retomar();
      entrarRegiao(d.area, d.x, d.y, d.dir, true);
      Missoes.aoAbrirMundo();
    });
  }
  function mostrarCarregando(s){ const el=document.getElementById('mundo-carregando'); if(el) el.hidden=!s; }
  function retomar(){
    if(document.getElementById('screen-mundo') && !document.getElementById('screen-mundo').classList.contains('active')) goto('mundo');
    ativo=true; limparTeclas(); dimensionar();
    tUlt=performance.now();
    if(!rafId) rafId=requestAnimationFrame(laco);
  }
  function suspender(){ ativo=false; limparTeclas(); }
  function sair(){ salvar(); suspender(); fecharFala(true); fecharPaineis(); goto('menu'); }

  /* ============================================================
     REGIÕES: entrar, sair, saídas, portas
     ============================================================ */
  /* ---------------- veículos no mapa ---------------- */
  const DIR_NOME=['baixo','esq','dir','cima'];
  function tirarDosBaldes(o){
    const k=Math.floor(o.x/CHPX)+','+Math.floor(o.y/CHPX), l=m.baldesObj.get(k); if(l){ const i=l.indexOf(o); if(i>=0) l.splice(i,1); }
    if(o.caixa){ m.baldesCol.forEach(lc=>{ const i=lc.indexOf(o); if(i>=0) lc.splice(i,1); }); o.caixa=null; }
  }
  function porNosBaldes(o){
    const s=o.s; o.topo=o.y-s.a[1]; o.esq=o.x-s.a[0]; o.w=s.r[2]; o.h=s.r[3];
    if(s.col){ o.caixa=[o.x+s.col[0], o.y+s.col[1], s.col[2], s.col[3]]; addBalde(m.baldesCol, o.caixa, o, 4*T); }
    const k=Math.floor(o.x/CHPX)+','+Math.floor(o.y/CHPX); if(!m.baldesObj.has(k)) m.baldesObj.set(k, []); m.baldesObj.get(k).push(o);
  }
  function spriteVeiculo(tipo, dir){
    const s=OWArte.sprite(tipo+'_'+DIR_NOME[dir]); if(!s || !s.im) return null;
    const w=s.r[2], h=s.r[3], hor=(dir===1||dir===2);
    return Object.assign({}, s, { a:[Math.round(w/2), h-2], col: hor ? [-Math.round(w/2)+4, -14, w-8, 13] : [-Math.round(w/2)+3, -Math.round(h*0.5), w-6, Math.round(h*0.5)-1] });
  }
  /* troca o desenho de um objeto do mapa atual (engrenagem girou, roda de número mudou) */
  function trocarSprite(id, nome){
    if(!m) return; const o=m.objs.find(x=>x.id===id); if(!o) return;
    const s=OWArte.sprite(nome); if(!s || !s.im) return;
    tirarDosBaldes(o); o.nome=nome; o.s=s; porNosBaldes(o);
  }
  /* põe no mapa atual os veículos que estão estacionados nele */
  function sincronizarVeiculos(){
    if(!m) return;
    m.objs.filter(o=>o.veiculo).forEach(o=>{ tirarDosBaldes(o); m.objs.splice(m.objs.indexOf(o),1); });
    const S=Missoes.S(), salvos=(S.dados.veiculos=S.dados.veiculos||{});
    Object.values(VEICULOS).forEach(v=>{
      const p=salvos[v.tipo] || { area:v.area, x:v.x, y:v.y, dir:v.dir||2 };
      if(p.area!==m.id || (carro && carro.tipo===v.tipo)) return;
      if(v.se && !v.se(S)) return;
      const s=spriteVeiculo(v.tipo, p.dir); if(!s) return;
      const o={ tipo:'spr', nome:v.tipo, veiculo:v.tipo, x:p.x, y:p.y, dir:p.dir, s, interagir:true, verbo:'🚗 '+v.nome.toUpperCase(), raio:58 };
      m.objs.push(o); porNosBaldes(o);
    });
  }
  const rodavelPadrao=['asfalto'];
  function rodavel(c){
    const lista=(m.def.rodavel||rodavelPadrao).map(OWArte.tid);
    const x0=Math.floor(c[0]/T), y0=Math.floor(c[1]/T), x1=Math.floor((c[0]+c[2]-0.01)/T), y1=Math.floor((c[1]+c[3]-0.01)/T);
    for(let j=y0;j<=y1;j++) for(let i=x0;i<=x1;i++){ if(i<0||j<0||i>=m.w||j>=m.h) return false; if(lista.indexOf(m.terr[j*m.w+i])<0 || m.col[j*m.w+i]) return false; }
    return true;
  }
  function caixaCarro(x,y,dir){ const s=spriteVeiculo(carro.tipo, dir); const c=s.col; return [x+c[0], y+c[1], c[2], c[3]]; }
  function carroCabe(x,y,dir){ const c=caixaCarro(x,y,dir); return rodavel(c) && !bate(c[0],c[1],c[2],c[3], jog); }
  function entrarNoCarro(o){
    const v=VEICULOS[o.veiculo]; const S=Missoes.S();
    if(v.pode && !v.pode(S)){ balao(v.trancado || 'Tá trancado.'); return; }
    tirarDosBaldes(o); m.objs.splice(m.objs.indexOf(o),1);
    carro={ tipo:o.veiculo }; jog.x=o.x; jog.y=o.y; jog.dir=o.dir;
    toast('🚗 '+v.nome+': só anda na rua. E (ou Ⓐ) pra descer.');
  }
  function sairDoCarro(silencioso){
    if(!carro) return;
    const tipo=carro.tipo, cx=jog.x, cy=jog.y, dir=jog.dir;
    const S=Missoes.S(); S.dados.veiculos=S.dados.veiculos||{}; S.dados.veiculos[tipo]={ area:m.id, x:cx, y:cy, dir };
    carro=null;
    // o jogador desce pro lado livre mais perto (de preferência a calçada)
    const ok=(x,y)=>{ const c=caixaPes(x,y); return !bate(c[0],c[1],c[2],c[3], jog); };
    const lados = (dir===1||dir===2) ? [[0,-1],[0,1],[-1,0],[1,0]] : [[-1,0],[1,0],[0,-1],[0,1]];
    let achou=false;
    for(let d=1; d<=4 && !achou; d++) for(const [ax,ay] of lados){ const x=cx+ax*d*T*0.75, y=cy+ay*d*T*0.75; if(ok(x,y)){ jog.x=x; jog.y=y; achou=true; break; } }
    sincronizarVeiculos();
    if(!achou) destravar(jog);
    rastro=rastro.map(()=>[jog.x,jog.y,jog.dir]); seguidores.forEach(s=>{ s.x=jog.x; s.y=jog.y; });
    if(!silencioso) toast('🚗 Estacionado.');
    salvar();
  }

  function entrarRegiao(area, tx, ty, dir, inicio){
    // de carro: segue dirigindo se a região nova tem estrada (`rodavel`); senão estaciona onde estava
    if(carro && !inicio && !(REGIOES[area] && REGIOES[area].rodavel)) sairDoCarro(true);
    m = mapa(area);
    jog.x = tx*T+T/2; jog.y = ty*T+T-4; jog.dir = dir!=null?dir:0;
    // se o ponto salvo ficou dentro de algo sólido (mapa mudou), procura o livre mais perto
    destravar(jog);
    rastro=[]; for(let i=0;i<80;i++) rastro.push([jog.x, jog.y, jog.dir]);
    seguidores = Missoes.estado().grupo.filter(id=>id!==jog.id).slice(0,3).map(id=>({ id, x:jog.x, y:jog.y, dir:jog.dir, andando:false, passo:0, tPasso:0 }));
    sincronizarVeiculos();
    criarEntidades();
    cam.x = jog.x - vistaW()/2; cam.y = jog.y - vistaH()/2; prenderCamera();
    zonaAtual=null;
    const mini=document.getElementById('mundo-mini'); if(mini){ mini._base=null; mini._sujo=true; }
    Missoes.aoEntrarArea(area, inicio);
    if(!inicio) salvar();
  }
  function destravar(e){
    const ok=(x,y)=>{ const c=caixaPes(x,y); return !bate(c[0],c[1],c[2],c[3], e); };
    if(ok(e.x,e.y)) return;
    for(let r=1;r<12;r++) for(let a=0;a<16;a++){ const x=e.x+Math.cos(a/16*Math.PI*2)*r*T/2, y=e.y+Math.sin(a/16*Math.PI*2)*r*T/2; if(ok(x,y)){ e.x=x; e.y=y; return; } }
  }
  function irPara(area, tx, ty, dir, depois){
    if(transicao) return;
    pausa++;
    const fade=document.getElementById('mundo-fade');
    transicao={ fase:0 };
    fade.classList.add('on');
    setTimeout(()=>{
      entrarRegiao(area, tx, ty, dir);
      setTimeout(()=>{ fade.classList.remove('on'); transicao=null; pausa=Math.max(0,pausa-1); if(depois) depois(); }, 60);
    }, 220);
  }
  function checarPortasESaidas(){
    const tx=Math.floor(jog.x/T), ty=Math.floor((jog.y-4)/T);
    for(const p of m.portas){
      if(p.x===tx && p.y===ty){
        if(p.trava && p.trava.se && !p.trava.se(Missoes.S())){ empurrar(); balao(p.trava.texto); return; }
        const [area,x,y,dir]=p.para; irPara(area,x,y,dir!=null?dir:(m.interior?0:3)); return;
      }
    }
    for(const s of m.saidas){
      let na=false;
      if(s.lado==='oeste' && jog.x<T*0.6 && ty>=s.de[0] && ty<=s.de[1]) na=true;
      if(s.lado==='leste' && jog.x>m.w*T-T*0.6 && ty>=s.de[0] && ty<=s.de[1]) na=true;
      if(s.lado==='norte' && jog.y<T*0.9 && tx>=s.de[0] && tx<=s.de[1]) na=true;
      if(s.lado==='sul' && jog.y>m.h*T-T*0.3 && tx>=s.de[0] && tx<=s.de[1]) na=true;
      if(!na) continue;
      const travada = s.trava && (!s.trava.se || !s.trava.se(Missoes.S()));
      if(travada || !REGIOES[s.para[0]]){ empurrar(); balao(s.trava ? s.trava.texto : 'Ainda não dá pra ir por aqui.'); return; }
      const [area,x,y,dir]=s.para; irPara(area,x,y,dir); return;
    }
  }
  let empurraoAte=0;
  function empurrar(){
    const v=[[0,-1],[-1,0],[1,0],[0,1]][jog.dir]; jog.x-=v[0]*T*0.5; jog.y-=v[1]*T*0.5; empurraoAte=performance.now()+400;
  }

  /* ---------------- NPCs e inimigos da região ---------------- */
  function criarEntidades(){
    const S=Missoes.S();
    npcs = Missoes.npcsDaArea(m.id).map(d=>{
      const [ , x, y ] = d.em;
      return { def:d, id:d.id, desenho:d.char||d.desenho||'cidadao:0', x:x*T+T/2, y:y*T+T-4, dir:d.dir!=null?d.dir:0, andando:false, passo:0, tPasso:0,
               casa:[x*T+T/2, y*T+T-4], alvo:null, espera:Math.random()*2, rotaI:0, visivel:true, fantasma:!!d.fantasma };
    });
    inimigos = Missoes.inimigosDaArea(m.id).map(d=>{
      const [ , x, y ] = d.em;
      return { def:d, id:d.id, desenho:d.desenho||d.char, x:x*T+T/2, y:y*T+T-4, dir:d.dir||0, andando:false, passo:0, tPasso:0,
               casa:[x*T+T/2, y*T+T-4], rotaI:0, espera:0, viu:0, visivel:true, perseguindo:false };
    });
    atualizarVisibilidade(S, true);
  }
  let tVis=0;
  function atualizarVisibilidade(S, ja){
    tVis-= 1; if(!ja && tVis>0) return; tVis=20;
    npcs.forEach(n=>{ n.visivel = !n.def.se || !!n.def.se(S); });
    inimigos.forEach(n=>{ n.visivel = (!n.def.se || !!n.def.se(S)) && !S.flag('venceu:'+n.id); });
    m.objs.forEach(o=>{ if(o.se) o.oculto = !o.se(S); });
  }
  function npcPorId(id){ return npcs.find(n=>n.id===id); }
  /* posição (em tiles) de um NPC visível — a seta da missão segue quem anda */
  function posNPC(id){ const n=npcPorId(id); if(!n || !n.visivel) return null; return { x:(n.x-T/2)/T, y:(n.y-T+4)/T }; }
  function recriarEntidadesSuave(){ tVis=0; }
  /* objetivo com vários objetos (investigar/coletar): o mais perto que falta, nesta região */
  function objetoMaisPerto(pred){
    if(!m) return null; let melhor=null, md=1e9;
    m.objs.forEach(o=>{ if(o.oculto || !pred(o)) return; const d=Math.hypot(o.x-jog.x, o.y-jog.y); if(d<md){ md=d; melhor=o; } });
    return melhor ? { x:(melhor.x-T/2)/T, y:(melhor.y-T+2)/T } : null;
  }

  /* ============================================================
     LAÇO
     ============================================================ */
  function laco(agora){
    rafId=requestAnimationFrame(laco);
    const tela=document.getElementById('screen-mundo');
    if(!ativo || !m || !tela || !tela.classList.contains('active')){ tUlt=agora; return; }
    let dt=(agora-tUlt)/1000; tUlt=agora; if(dt>1/30) dt=1/30; if(dt<0) dt=0;
    relogio+=dt;
    atualizar(dt);
    desenhar();
    for(const k in borda) delete borda[k];
  }

  function atualizar(dt){
    const S=Missoes.S();
    atualizarVisibilidade(S);
    // atalhos de painel (funcionam mesmo parado, menos no meio de fala/transição)
    if(!fala && !transicao){
      if(apertou('j')) { abrirPainel('diario'); return; }
      if(apertou('m')) { abrirPainel('mapa'); return; }
      if(apertou('escape')) { if(painelAberto()) fecharPaineis(); else abrirPainel('menu'); return; }
      if(apertou('tab')) alternarMini();
    }
    if(fala){ if(apertou('e',' ','enter')) avancarFala(); }
    if(pausa>0 || fala || painelAberto()){ jog.andando=false; seguidores.forEach(s=>s.andando=false); return; }

    // ---- jogador ----
    let ix=0, iy=0;
    if(segurando('arrowleft','a')) ix-=1; if(segurando('arrowright','d')) ix+=1;
    if(segurando('arrowup','w')) iy-=1;   if(segurando('arrowdown','s')) iy+=1;
    let correr=segurando('shift');
    if(toque.ativo && (Math.abs(toque.dx)>0.18 || Math.abs(toque.dy)>0.18)){ ix=toque.dx; iy=toque.dy; correr = Math.hypot(ix,iy)>0.92; }
    const mag=Math.hypot(ix,iy);
    if(carro){ dirigir(ix, iy, mag, correr, dt); }
    else if(mag>0.01 && performance.now()>empurraoAte){
      if(mag>1){ ix/=mag; iy/=mag; }
      const vel=(correr?150:92)*velDe(jog.id)*dt;
      if(Math.abs(ix)>Math.abs(iy)) jog.dir = ix<0?1:2; else jog.dir = iy<0?3:0;
      const ax=jog.x, ay=jog.y;
      mover(jog, ix*vel, iy*vel);
      jog.andando = (jog.x!==ax || jog.y!==ay);
      // deslizar na quina: empurrando reto contra um canto, escorrega pro lado livre
      if(!jog.andando && (ix===0||iy===0)){
        for(const s of [1,-1]){ const ox=iy?s*vel:0, oy=ix?s*vel:0; const c=caixaPes(jog.x+ox*3, jog.y+oy*3);
          if(!bate(c[0],c[1],c[2],c[3],jog)){ const c2=caixaPes(jog.x+ox*3+ix*vel*3, jog.y+oy*3+iy*vel*3); if(!bate(c2[0],c2[1],c2[2],c2[3],jog)){ mover(jog,ox,oy); jog.andando=true; break; } } }
      }
      animarPasso(jog, dt, correr?1.6:1);
      if(jog.andando){
        const u=rastro[rastro.length-1];
        if(Math.hypot(u[0]-jog.x,u[1]-jog.y)>=2){ rastro.push([jog.x,jog.y,jog.dir]); if(rastro.length>200) rastro.shift(); }
        checarPortasESaidas();
      }
    } else { jog.andando=false; jog.passo=0; }

    // ---- seguidores (fila no rastro do líder) ----
    seguidores.forEach((s,i)=>{
      const k=Math.max(0, rastro.length-1-(i+1)*12);
      const p=rastro[k];
      const ax=s.x, ay=s.y;
      s.x += (p[0]-s.x)*Math.min(1,dt*14); s.y += (p[1]-s.y)*Math.min(1,dt*14);
      s.andando = Math.hypot(s.x-ax, s.y-ay)>0.15;
      if(s.andando){ const dx=s.x-ax, dy=s.y-ay; s.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?1:2) : (dy<0?3:0); }
      animarPasso(s, dt, 1);
    });

    // ---- NPCs ----
    npcs.forEach(n=>{ if(n.visivel) andarNPC(n, dt); });
    // ---- inimigos ----
    for(const n of inimigos){ if(n.visivel && andarInimigo(n, dt)) return; }

    // ---- câmera ----
    const ax=jog.x - vistaW()/2, ay=jog.y-20 - vistaH()/2;
    cam.x += (ax-cam.x)*Math.min(1, dt*8); cam.y += (ay-cam.y)*Math.min(1, dt*8);
    prenderCamera();

    // ---- interação (dirigindo, o botão de ação é DESCER do carro) ----
    alvoInteracao = carro ? null : acharInteracao();
    pintarBotaoAcao();
    if(apertou('e',' ','enter')){ if(carro) sairDoCarro(); else interagir(); }
    if(apertou('p')) abrirPainel('start');

    // ---- missões: chegar em lugar, gatilhos de área ----
    Missoes.aoAndar(m.id, jog.x/T, (jog.y-4)/T);
    checarZona();
    // salvamento automático a cada 30 s de jogo andando
    tAutoSave+=dt; if(tAutoSave>30){ tAutoSave=0; salvar(); }
  }

  /* carro: vira pra direção do controle (só se couber virado), anda reto
     no eixo dominante e só onde o chão é rua. Encostar num inimigo também
     começa luta (o carro fica estacionado ali). */
  function dirigir(ix, iy, mag, correr, dt){
    jog.andando=false;
    if(mag<0.2) return;
    const v=VEICULOS[carro.tipo], vel=v.vel*(correr?1.25:1)*dt;
    let nd = Math.abs(ix)>Math.abs(iy) ? (ix<0?1:2) : (iy<0?3:0);
    if(nd!==jog.dir && carroCabe(jog.x, jog.y, nd)) jog.dir=nd;
    const vx=[0,-1,1,0][jog.dir], vy=[1,0,0,-1][jog.dir];
    // anda em passinhos (não atravessa meio-fio fino em velocidade alta)
    const passos=Math.max(1, Math.ceil(vel/6));
    for(let i=0;i<passos;i++){ const nx=jog.x+vx*vel/passos, ny=jog.y+vy*vel/passos; if(!carroCabe(nx,ny,jog.dir)) break; jog.x=nx; jog.y=ny; jog.andando=true; }
    if(jog.andando){ const u=rastro[rastro.length-1]; if(Math.hypot(u[0]-jog.x,u[1]-jog.y)>=2){ rastro.push([jog.x,jog.y,jog.dir]); if(rastro.length>200) rastro.shift(); } }
    // saída de região funciona de carro também (ele fica estacionado na borda)
    if(jog.andando){ const ty=Math.floor((jog.y-4)/T), tx=Math.floor(jog.x/T);
      for(const s of m.saidas){ let na=false;
        if(s.lado==='oeste' && jog.x<T*1.6 && ty>=s.de[0] && ty<=s.de[1]) na=true;
        if(s.lado==='leste' && jog.x>m.w*T-T*1.6 && ty>=s.de[0] && ty<=s.de[1]) na=true;
        if(s.lado==='norte' && jog.y<T*1.9 && tx>=s.de[0] && tx<=s.de[1]) na=true;
        if(s.lado==='sul' && jog.y>m.h*T-T*1.3 && tx>=s.de[0] && tx<=s.de[1]) na=true;
        if(na){ const trav=s.trava && (!s.trava.se || !s.trava.se(Missoes.S())); if(trav||!REGIOES[s.para[0]]){ balao(s.trava?s.trava.texto:'Ainda não dá pra ir por aqui.'); jog.x-=vx*T; jog.y-=vy*T; return; } const [area,x,y,dir]=s.para; irPara(area,x,y,dir); return; } } }
  }
  function desenharCarro(){
    const s=spriteVeiculo(carro.tipo, jog.dir); if(!s) return;
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(sx(jog.x), sy(jog.y-2), s.r[2]*0.45*Z, 5*Z, 0, 0, Math.PI*2); ctx.fill();
    const bob = jog.andando ? (((relogio*14)|0)&1) : 0;
    ctx.drawImage(s.im, s.r[0], s.r[1], s.r[2], s.r[3], sx(jog.x-s.a[0]), sy(jog.y-s.a[1]-bob), s.r[2]*Z, s.r[3]*Z);
  }

  let tAutoSave=0;
  function animarPasso(e, dt, vel){
    if(!e.andando){ e.passo=0; e.tPasso=0; return; }
    e.tPasso += dt*vel; if(e.tPasso>0.14){ e.tPasso=0; e.passo=(e.passo+1)&3; }
  }

  function andarNPC(n, dt){
    const d=n.def, anda=d.anda||{tipo:'parado'};
    if(fala && fala.npc===n){ n.andando=false; return; }
    if(anda.tipo==='parado'){ n.andando=false; return; }
    if(n.espera>0){ n.espera-=dt; n.andando=false; return; }
    if(!n.alvo){
      if(anda.tipo==='vagar'){ const r=(anda.r||3)*T; n.alvo=[n.casa[0]+(Math.random()*2-1)*r, n.casa[1]+(Math.random()*2-1)*r]; }
      else if(anda.tipo==='rota'){ const p=anda.pts[n.rotaI%anda.pts.length]; n.rotaI++; n.alvo=[p[0]*T+T/2, p[1]*T+T-4]; }
    }
    const dx=n.alvo[0]-n.x, dy=n.alvo[1]-n.y, dist=Math.hypot(dx,dy);
    if(dist<3){ n.alvo=null; n.espera=anda.espera!=null?anda.espera:(1+Math.random()*2.5); n.andando=false; return; }
    const v=(anda.vel||45)*dt;
    const ax=n.x, ay=n.y;
    mover(n, dx/dist*v, dy/dist*v, n);
    n.andando = Math.hypot(n.x-ax,n.y-ay)>0.05;
    if(!n.andando){ n.alvo=null; n.espera=0.8; }
    else n.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?1:2) : (dy<0?3:0);
    animarPasso(n, dt, 1);
  }

  /* inimigo visível: faz ronda; se VÊ o jogador (cone na direção que olha),
     mostra "!" e corre até ele. Encostou → luta. */
  function andarInimigo(n, dt){
    const d=n.def;
    const dxp=jog.x-n.x, dyp=jog.y-n.y, distp=Math.hypot(dxp,dyp);
    if(relogio<folgaAte){ n.perseguindo=false; n.andando=false; return false; }
    if(distp<20){ lutarCom(n); return true; }
    const visao=(d.visao!=null?d.visao:4)*T;
    if(!n.perseguindo && distp<visao){
      const v=[[0,1],[-1,0],[1,0],[0,-1]][n.dir];
      const cos=(dxp*v[0]+dyp*v[1])/(distp||1);
      if(cos>0.55 || distp<T*1.4){ n.perseguindo=true; n.viu=0.6; }
    }
    if(n.viu>0){ n.viu-=dt; n.andando=false; return false; }
    let alvo=null, vel=(d.vel||55);
    if(n.perseguindo){ alvo=[jog.x,jog.y]; vel=(d.velPerseguir||110); if(distp>visao*2.2){ n.perseguindo=false; } }
    else if(d.rota){ const p=d.rota[n.rotaI%d.rota.length]; alvo=[p[0]*T+T/2,p[1]*T+T-4]; }
    if(!alvo){ n.andando=false; return false; }
    const dx=alvo[0]-n.x, dy=alvo[1]-n.y, dist=Math.hypot(dx,dy);
    if(dist<3 && !n.perseguindo){ n.rotaI++; n.espera=0.6; return false; }
    if(n.espera>0){ n.espera-=dt; n.andando=false; return false; }
    const ax=n.x, ay=n.y;
    mover(n, dx/dist*vel*dt, dy/dist*vel*dt, n);
    n.andando = Math.hypot(n.x-ax,n.y-ay)>0.05;
    if(!n.andando && !n.perseguindo){ n.rotaI++; n.espera=0.5; }
    n.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?1:2) : (dy<0?3:0);
    animarPasso(n, dt, n.perseguindo?1.5:1);
    return false;
  }

  /* ============================================================
     INTERAÇÃO
     ============================================================ */
  function frente(){ const v=[[0,1],[-1,0],[1,0],[0,-1]][jog.dir]; return v; }
  function acharInteracao(){
    const v=frente(); let melhor=null, md=1e9;
    const avalia=(x,y,item,raio)=>{
      const dx=x-jog.x, dy=y-jog.y, d=Math.hypot(dx,dy); if(d>raio) return;
      const cos=(dx*v[0]+dy*v[1])/(d||1); if(d>38 && cos<0.35) return;
      const pen=d-(cos*12); if(pen<md){ md=pen; melhor=item; }
    };
    npcs.forEach(n=>{ if(n.visivel && !n.def.mudo) avalia(n.x, n.y, { tipo:'npc', n }, 46); });
    // objetos com "interagir" (terminal, placa, coletável)
    const k0=Math.floor(jog.x/CHPX), k1=Math.floor(jog.y/CHPX);
    for(let j=k1-1;j<=k1+1;j++) for(let i=k0-1;i<=k0+1;i++){
      const l=m.baldesObj.get(i+','+j); if(!l) continue;
      l.forEach(o=>{ if(o.oculto || !o.interagir) return; if(o.coletavel && Missoes.S().coletou(o.coletavel)) return; avalia(o.x, o.y-6, { tipo:'obj', o }, o.raio||46); });
    }
    return melhor;
  }
  function interagir(){
    const a=alvoInteracao; if(!a) return;
    if(a.tipo==='npc'){
      const n=a.n;
      // vira pro jogador
      const dx=jog.x-n.x, dy=jog.y-n.y; n.dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?1:2) : (dy<0?3:0); n.andando=false;
      if(n.def.luta && !n.def.amigo){ Missoes.falarCom(n.def, ()=>{}); return; }
      Missoes.falarCom(n.def, ()=>{});
    } else if(a.tipo==='obj'){
      if(a.o.veiculo) entrarNoCarro(a.o);
      else Missoes.interagirObjeto(a.o);
    }
  }
  function pintarBotaoAcao(){
    const b=document.getElementById('mundo-btn-a'), dica=document.getElementById('mundo-dica');
    let txt='Ⓐ';
    if(alvoInteracao){ txt = alvoInteracao.tipo==='npc' ? '💬 FALAR' : (alvoInteracao.o.verbo || '🔍 VER'); }
    if(carro) txt='🚗 DESCER';
    const tem=!!alvoInteracao || !!carro;
    if(b){ b.textContent=txt; b.classList.toggle('pronto', tem); }
    if(dica){ dica.hidden=!tem || !!fala; if(tem){ dica.textContent = 'E · '+txt.replace(/^\S+\s/,''); } }
  }
  function apertarA(){ if(fala){ avancarFala(); return; } borda['e']=true; }

  /* ---------------- lutas ---------------- */
  let folgaAte=0;     // depois de uma luta, ninguém encosta no grupo por uns segundos
  function lutarCom(n){
    const d=n.def;
    if(carro) sairDoCarro(true);
    n.perseguindo=false;
    // some JÁ (a visibilidade só é reavaliada de tempos em tempos): sem isso,
    // na volta da luta ele ainda estaria encostado e começaria tudo de novo
    n.visivel=false; n.x=n.casa[0]; n.y=n.casa[1];
    folgaAte=relogio+3;
    if(d.luta){ Missoes.lutar(d.luta, { inimigoId:n.id, aoVencer:()=>{ Missoes.S().setFlag('venceu:'+n.id, true); } }); }
  }
  /* chamado pelo Missoes: monta o 3x3 e devolve o controle no fim */
  function lutar(def, aoVencer, aoPerder){
    suspender();
    const S=Missoes.S();
    // quem segue mas não é lutador (o Cachorro Orelha, antes da maldição) fica fora do time
    const lutador = id => typeof Characters==='undefined' || !!Characters.byId(id);
    let time = def.time && def.time!=='grupo' ? def.time.slice() : [jog.id].concat(seguidores.map(s=>s.id)).filter(lutador);
    if(def.mais) def.mais.forEach(id=>{ if(time.indexOf(id)<0) time.push(id); });
    time = time.slice(0,3);
    const bonus=Missoes.bonusDeHistoria();
    const aliado = time.map((id,k)=>Object.assign(id==='mecas'?{forma:2}:{}, bonus.hp?{hpMais:bonus.hp}:{}, ((def.ajustes||{}).aliado||[])[k]||{}));
    // dificuldade do mundo aberto: vida e dano do lado inimigo ×k (tabela calibrada em missoes.js)
    const dif=Missoes.dificuldade(def.id);
    const inimigo = def.inimigos.map((id,k)=>{
      const a=Object.assign({}, ((def.ajustes||{}).inimigo||[])[k]||{});
      if(dif!==1){ a.hpMult=dif; a.danoMult=(a.danoMult||1)*dif; }
      return a;
    });
    const fazer=()=>TurnUI.iniciarHistoria(time, def.inimigos, {
      cenario:def.cenario||'telaviv', titulo:def.titulo||'Luta',
      ajustes:{ aliado, inimigo }, botEsperto:true,
      textoSair:'🗺 VOLTAR AO MAPA',
      aoFim:()=>{ goto('mundo'); folgaAte=relogio+3; retomar(); if(aoVencer) aoVencer(); },
      aoSair:()=>{ goto('mundo'); folgaAte=relogio+3; renascer(); retomar(); if(aoPerder) aoPerder(); }
    });
    if(def.antes && def.antes.length) Historia.tocarCena(def.antes, { legenda:def.titulo, cenario:def.cenario, aoFim:fazer });
    else fazer();
  }
  function renascer(){
    const S=Missoes.S(), s=S.dados.salvoEm;
    if(s){ entrarRegiao(s.area, s.x, s.y, 0); toast('💤 Você acordou no último ponto salvo.'); }
  }

  /* ============================================================
     FALA (balão no mapa)
     falas: lista no formato da história — N(texto) / D(id, texto, {nome})
     ou string solta (vira fala do NPC atual). Escolhas: {escolha:[{t, faz}]}
     ============================================================ */
  function falar(falas, opts, aoFim){
    opts=opts||{};
    const lista=(Array.isArray(falas)?falas:[falas]).map(f=> typeof f==='string' ? { quem:opts.quem||null, texto:f, nome:opts.nome, desenho:opts.desenho } : f);
    fala={ lista, i:-1, texto:'', revelado:0, inicio:0, aoFim, npc:opts.npc||null, opts };
    document.getElementById('mundo-fala').hidden=false;
    proximaFala();
  }
  function proximaFala(){
    fala.i++;
    if(fala.i>=fala.lista.length){ fecharFala(); return; }
    const f=fala.lista[fala.i];
    if(f.faz){ Missoes.fazer(f.faz, ()=>proximaFala()); return; }
    fala.atual=f; fala.texto=f.texto||''; fala.revelado=0; fala.inicio=performance.now();
    const c = f.quem && typeof Characters!=='undefined' && Characters.byId(f.quem);
    const nome = f.nome || (c ? c.name : (f.quem===false||!f.quem ? '' : ''));
    const el=document.getElementById('mundo-fala-nome'); el.textContent=nome; el.hidden=!nome;
    document.getElementById('mundo-fala').classList.toggle('narracao', !f.quem && !f.desenho);
    const esc=document.getElementById('mundo-fala-opcoes'); esc.innerHTML=''; esc.hidden=true;
    pintarFala();
    retrato(f);
  }
  function pintarFala(){ const el=document.getElementById('mundo-fala-texto'); if(el&&fala) el.textContent=fala.texto.slice(0,fala.revelado); }
  function avancarFala(){
    if(!fala) return;
    if(fala.revelado<fala.texto.length){ fala.revelado=fala.texto.length; pintarFala(); mostrarEscolhas(); return; }
    if(fala.atual && fala.atual.escolha) return;     // escolha: só pelos botões
    proximaFala();
  }
  function mostrarEscolhas(){
    const f=fala && fala.atual; if(!f || !f.escolha) return;
    const box=document.getElementById('mundo-fala-opcoes'); if(!box.hidden) return;
    box.innerHTML=''; box.hidden=false;
    f.escolha.forEach(op=>{ const b=document.createElement('button'); b.className='mundo-op'; b.textContent=op.t;
      b.onclick=(ev)=>{ ev.stopPropagation(); box.hidden=true; const resto=fala; fala.atual=null;
        if(op.faz) Missoes.fazer(op.faz, ()=>{ if(fala===resto) proximaFala(); }); else proximaFala(); };
      box.appendChild(b); });
  }
  function fecharFala(silencioso){
    if(!fala) return;
    const cb=fala.aoFim; fala=null;
    const el=document.getElementById('mundo-fala'); if(el) el.hidden=true;
    limparTeclas();
    if(!silencioso && cb) cb();
  }
  let retratoAtual=null;
  function retrato(f){
    const cvr=document.getElementById('mundo-fala-retrato');
    retratoAtual = (f.quem && typeof Characters!=='undefined' && Characters.byId(f.quem)) ? { char:Characters.byId(f.quem), forma:f.forma!=null?f.forma:(f.quem==='mecas'?2:0), pose:f.pose||'idle' }
                 : (f.desenho ? { desenho:f.desenho } : null);
    cvr.hidden=!retratoAtual;
  }
  function desenharRetrato(){
    if(!fala || !retratoAtual) return;
    const cvr=document.getElementById('mundo-fala-retrato'); if(!cvr || cvr.hidden) return;
    if(retratoAtual.char){
      Sprites.renderPose(cvr, retratoAtual.char, { pose:retratoAtual.pose, t:(relogio*60)|0, form:retratoAtual.forma, dir:1, targetH:cvr.height-12, dy:Math.sin(relogio*3.5)*2 });
    } else {
      const x=cvr.getContext('2d'); x.clearRect(0,0,cvr.width,cvr.height); x.imageSmoothingEnabled=false;
      const q=OWArte.quadro(retratoAtual.desenho, 0, 0, false); if(!q) return;
      const s=Math.min((cvr.height-16)/q.cv.height, (cvr.width-10)/q.cv.width);
      x.drawImage(q.cv, (cvr.width-q.cv.width*s)/2, cvr.height-8-q.cv.height*s, q.cv.width*s, q.cv.height*s);
    }
  }

  /* ---------------- avisos ---------------- */
  let toastFila=[], toastT=null;
  function toast(txt, tipo){
    toastFila.push({txt,tipo});
    if(!toastT) mostrarToast();
  }
  function mostrarToast(){
    const el=document.getElementById('mundo-toast'); const it=toastFila.shift();
    if(!it){ toastT=null; if(el) el.classList.remove('on'); return; }
    el.textContent=it.txt; el.className='mundo-toast on '+(it.tipo||'');
    toastT=setTimeout(()=>{ el.classList.remove('on'); toastT=setTimeout(mostrarToast, 260); }, 2600);
  }
  function balao(txt){ falar([{ quem:false, texto:txt }], {}, null); }

  function checarZona(){
    const tx=jog.x/T, ty=jog.y/T;
    const z=m.zonas.find(z=>tx>=z.x&&ty>=z.y&&tx<z.x+z.w&&ty<z.y+z.h);
    const nome = z ? z.nome : m.nome;
    if(nome!==zonaAtual){
      zonaAtual=nome;
      const el=document.getElementById('mundo-local'); if(el){ el.textContent=nome; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
    }
  }

  /* ============================================================
     DESENHO
     ============================================================ */
  const vistaW=()=>cv.width/Z, vistaH=()=>cv.height/Z;
  function prenderCamera(){
    const vw=vistaW(), vh=vistaH(), W=m.w*T, H=m.h*T;
    cam.x = vw>=W ? (W-vw)/2 : Math.max(0, Math.min(W-vw, cam.x));
    cam.y = vh>=H ? (H-vh)/2 : Math.max(0, Math.min(H-vh, cam.y));
  }
  // posição na tela em px do aparelho, presa à grade do zoom (nada treme)
  const sx = x => Math.round((x-cam.x)*Z);
  const sy = y => Math.round((y-cam.y)*Z);

  function desenhar(){
    const W=cv.width, H=cv.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle = m.interior ? '#07060c' : '#0b1a2a'; ctx.fillRect(0,0,W,H);
    const vw=vistaW(), vh=vistaH();
    const cx0=Math.max(0,Math.floor(cam.x/CHPX)), cy0=Math.max(0,Math.floor(cam.y/CHPX));
    const cx1=Math.min(Math.ceil(m.w/CH)-1, Math.floor((cam.x+vw)/CHPX)), cy1=Math.min(Math.ceil(m.h/CH)-1, Math.floor((cam.y+vh)/CHPX));
    const q=((relogio*4)|0)&3;
    for(let cy=cy0; cy<=cy1; cy++) for(let cx=cx0; cx<=cx1; cx++){
      const c=chunk(cx,cy);
      ctx.drawImage(c.cv, sx(cx*CHPX), sy(cy*CHPX), CHPX*Z, CHPX*Z);
      // água e lava cintilando (só o que está na tela)
      for(const a of c.anim){
        const px=a[0]*T, py=a[1]*T; if(px+T<cam.x||py+T<cam.y||px>cam.x+vw||py>cam.y+vh) continue;
        if(((a[0]*7+a[1]*3+q)&3)!==0 && a[2]==='agua') continue;
        ctx.drawImage(OWArte.brilho(a[2], (q+a[0]+a[1])&3), sx(px), sy(py), T*Z, T*Z);
      }
    }
    // marcador do objetivo NO CHÃO
    const alvo=Missoes.alvoNaArea(m.id);
    if(alvo){ const ax=alvo.x*T+T/2, ay=alvo.y*T+T/2; const p=0.6+Math.sin(relogio*5)*0.25;
      ctx.globalAlpha=p; ctx.fillStyle='#ffe066'; const r=6*Z; ctx.beginPath(); ctx.moveTo(sx(ax),sy(ay)-r); ctx.lineTo(sx(ax)+r,sy(ay)); ctx.lineTo(sx(ax),sy(ay)+r); ctx.lineTo(sx(ax)-r,sy(ay)); ctx.fill(); ctx.globalAlpha=1; }

    // ---- lista ordenada por Y ----
    const lista=[];
    const ox0=Math.floor((cam.x-256)/CHPX), ox1=Math.floor((cam.x+vw+256)/CHPX);
    const oy0=Math.floor((cam.y-64)/CHPX), oy1=Math.floor((cam.y+vh+520)/CHPX);
    const cima=[];
    for(let j=oy0;j<=oy1;j++) for(let i=ox0;i<=ox1;i++){
      const l=m.baldesObj.get(i+','+j); if(!l) continue;
      for(const o of l){
        if(o.oculto || !o.s) continue;
        if(o.esq>cam.x+vw || o.esq+o.w<cam.x || o.topo>cam.y+vh || o.topo+o.h<cam.y) continue;
        if(o.sempreCima) cima.push(o); else if(o.chaoObj) lista.push({ y:-1e9, o }); else lista.push({ y:o.y, o });
      }
    }
    // dirigindo: o grupo vai DENTRO do carro (some do mapa)
    const pessoas = carro ? [jog] : [jog].concat(seguidores);
    npcs.forEach(n=>{ if(n.visivel) pessoas.push(n); });
    inimigos.forEach(n=>{ if(n.visivel) pessoas.push(n); });
    // empate de Y: o líder vai por cima (com o grupo parado, todo mundo está no mesmo ponto)
    pessoas.forEach(p=>{ if(p.x>cam.x-64 && p.x<cam.x+vw+64 && p.y>cam.y-20 && p.y<cam.y+vh+90) lista.push({ y:p.y+(p===jog?0.5:0), p }); });
    lista.sort((a,b)=>a.y-b.y);
    for(const it of lista){ if(it.o) desenharObj(it.o); else if(carro && it.p===jog) desenharCarro(); else desenharPessoa(it.p); }
    for(const o of cima) desenharObj(o);
    // fumaça de chaminé (objeto com `fumaca:[dx,dy]` a partir dos pés)
    for(const it of lista){ const o=it.o; if(!o || !o.fumaca) continue;
      for(let i=0;i<4;i++){ const f=((relogio*0.45)+i/4)%1, r=(3+f*9)*Z;
        ctx.fillStyle=`rgba(200,200,205,${0.5*(1-f)})`; ctx.beginPath();
        ctx.arc(sx(o.x+o.fumaca[0]+Math.sin(relogio*1.3+i*2)*4+f*10), sy(o.y+o.fumaca[1]-f*46), r, 0, Math.PI*2); ctx.fill(); } }
    // gaivotas no litoral (vivo, mas barato: 6 traços em V)
    if(m.ceu==='litoral' && !m.interior){
      ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=Math.max(1,Z*0.75);
      for(let i=0;i<6;i++){
        const bx=((relogio*(26+i*5)+i*977)%(m.w*T+400))-200, by=((i*2113)%(m.h*T))+Math.sin(relogio*0.7+i)*30;
        if(bx<cam.x-20||bx>cam.x+vw+20||by<cam.y-20||by>cam.y+vh+20) continue;
        const asa=Math.sin(relogio*8+i)*2.5;
        ctx.beginPath(); ctx.moveTo(sx(bx-6),sy(by-asa)); ctx.lineTo(sx(bx),sy(by)); ctx.lineTo(sx(bx+6),sy(by-asa)); ctx.stroke();
      }
    }

    // ---- céu (dia/noite) e luzes ----
    desenharCeu();
    // ---- marcadores ! ? em cima das cabeças ----
    npcs.forEach(n=>{
      if(!n.visivel) return; const mk=Missoes.marcadorNPC(n.def); if(!mk) return;
      const q2=OWArte.quadro(n.desenho, n.dir, 0, false); const topo=n.y-(q2?q2.cv.height:50)-14+Math.sin(relogio*4)*2;
      balaoMarcador(sx(n.x), sy(topo), mk);
    });
    inimigos.forEach(n=>{ if(n.visivel && n.viu>0) balaoMarcador(sx(n.x), sy(n.y-70), '!', '#ff5a3a'); });
    if(alvoInteracao && !fala){ const a=alvoInteracao; const x=a.tipo==='npc'?a.n.x:a.o.x, y=(a.tipo==='npc'?a.n.y-62:a.o.topo-6);
      ctx.globalAlpha=0.8+Math.sin(relogio*6)*0.2; ctx.fillStyle='#fff'; const s=3*Z; ctx.beginPath(); ctx.moveTo(sx(x)-s,sy(y)-s); ctx.lineTo(sx(x)+s,sy(y)-s); ctx.lineTo(sx(x),sy(y)+s*0.6); ctx.fill(); ctx.globalAlpha=1; }
    // ---- seta do objetivo na borda ----
    setaObjetivo();
    desenharMini();
    desenharRetrato();
    atualizarTextoFala();
  }

  function desenharObj(o){
    const s=o.s;
    let fx=0;
    if(s.anim){ fx=(((relogio*s.anim.fps)|0)%s.anim.n)*s.anim.dx; }
    ctx.drawImage(s.im, s.r[0]+fx, s.r[1], s.r[2], s.r[3], sx(o.x-s.a[0]), sy(o.y-s.a[1]), s.r[2]*Z, s.r[3]*Z);
  }
  function desenharPessoa(p){
    const q=OWArte.quadro(p.desenho||p.id, p.dir, p.passo, p.andando);
    // sombra
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sx(p.x), sy(p.y-1), 9*Z, 3.5*Z, 0, 0, Math.PI*2); ctx.fill();
    if(!q) return;
    const bob = p.andando ? ((p.passo&1)? -1:0) : 0;
    ctx.drawImage(q.cv, sx(p.x-q.ax), sy(p.y-q.ay+bob), q.cv.width*Z, q.cv.height*Z);
  }
  function balaoMarcador(x, y, mk, cor){
    const s=Z*1.0;
    ctx.fillStyle='#000'; ctx.fillRect(x-7*s, y-9*s, 14*s, 16*s);
    ctx.fillStyle=cor || (mk==='!' ? '#ffe066' : '#7fe3ff'); ctx.fillRect(x-6*s, y-8*s, 12*s, 14*s);
    ctx.fillStyle='#000'; ctx.font=`bold ${Math.round(11*s)}px monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(mk, x, y-0.5*s);
  }

  /* ---------------- céu: ciclo de dia/noite ----------------
     Um dia inteiro = 24 minutos reais. Tel Aviv tem os RELÓGIOS parados
     em 03:33 — o sol, não (piada de NPC). Região/missão pode forçar a hora
     (`Mundo.hora(h)`), ex.: o apagão e a Cidade Velha à noite. */
  function horaAtual(){
    if(horaForcada!=null) return horaForcada;
    const f = m.def.hora ? m.def.hora(Missoes.S()) : null; if(f!=null) return f;
    return (9 + relogio/60) % 24;
  }
  const luzCache={};
  function luzSprite(r, cor){
    const k=r+cor; if(luzCache[k]) return luzCache[k];
    const c=OWArte.tela(r*2, r*2), x=c.getContext('2d');
    const g=x.createRadialGradient(r,r,0,r,r,r); g.addColorStop(0,cor); g.addColorStop(0.35,cor+'88'); g.addColorStop(1,cor+'00');
    x.fillStyle=g; x.fillRect(0,0,r*2,r*2); return luzCache[k]=c;
  }
  function desenharCeu(){
    if(m.interior && !m.def.escuro) return;
    const h=horaAtual();
    let a=0, cor='10,16,48';
    if(m.interior){ a=m.def.escuro; }
    else if(h>=6.5 && h<17) a=0;
    else if(h>=17 && h<19){ a=(h-17)/2*0.35; cor='70,30,60'; }
    else if(h>=19 || h<5){ a=0.58; }
    else if(h>=5 && h<6.5){ a=0.58*(1-(h-5)/1.5); cor='40,30,70'; }
    if(Missoes.S().flag('apagao') && !m.interior) a=Math.max(a,0.66);
    if(a<=0.01) return;
    ctx.fillStyle=`rgba(${cor},${a})`; ctx.fillRect(0,0,cv.width,cv.height);
    if(a>0.2){
      ctx.globalCompositeOperation='lighter';
      const vw=vistaW(), vh=vistaH();
      const apagao=Missoes.S().flag('apagao');
      for(const l of m.luzes){
        if(apagao && l.poste) continue;
        if(l.x<cam.x-l.r||l.y<cam.y-l.r||l.x>cam.x+vw+l.r||l.y>cam.y+vh+l.r) continue;
        const fl = 0.85+Math.sin(relogio*9+l.x)*0.06;
        ctx.globalAlpha=Math.min(1,a*1.1)*fl;
        const sp=luzSprite(32, l.cor);
        ctx.drawImage(sp, sx(l.x-l.r), sy(l.y-l.r), l.r*2*Z, l.r*2*Z);
      }
      // o próprio grupo tem uma luzinha (o visor do Mecas)
      ctx.globalAlpha=a*0.5; const sp=luzSprite(32,'#9fe8ff'); const r=2.2*T; ctx.drawImage(sp, sx(jog.x-r), sy(jog.y-30-r), r*2*Z, r*2*Z);
      ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    }
  }

  /* ---------------- seta e distância do objetivo marcado ---------------- */
  function setaObjetivo(){
    const box=document.getElementById('mundo-objetivo');
    const info=Missoes.objetivoMarcado();
    if(!info){ if(box) box.hidden=true; return; }
    if(box){ box.hidden=false; }
    const alvo=Missoes.alvoNaArea(m.id) || Missoes.saidaRumo(m.id);
    const tit=document.getElementById('mundo-obj-tit'), txt=document.getElementById('mundo-obj-txt'), dist=document.getElementById('mundo-obj-dist');
    if(tit) tit.textContent=info.titulo; if(txt) txt.textContent=info.obj;
    if(!alvo){ if(dist) dist.textContent=info.ondeTexto||''; return; }
    const ax=alvo.x*T+T/2, ay=alvo.y*T+T/2;
    const dx=ax-jog.x, dy=ay-(jog.y-16), d=Math.hypot(dx,dy);
    if(dist) dist.textContent = (alvo.saida?('→ '+alvo.saida+' · '):'')+Math.round(d/T)+' m';
    const px=sx(ax), py=sy(ay), W=cv.width, H=cv.height, mg=34*dpr;
    if(px>mg && py>mg && px<W-mg && py<H-mg) return;   // está na tela: o losango no chão basta
    const ang=Math.atan2(dy,dx), cx=W/2, cy=H/2;
    const k=Math.min((W/2-mg)/Math.abs(Math.cos(ang)||1e-6), (H/2-mg)/Math.abs(Math.sin(ang)||1e-6));
    const x=cx+Math.cos(ang)*k, y=cy+Math.sin(ang)*k, s=10*dpr;
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(s*1.6,0); ctx.lineTo(-s,-s*1.1); ctx.lineTo(-s*0.4,0); ctx.lineTo(-s,s*1.1); ctx.fill();
    ctx.fillStyle='#ffe066'; ctx.beginPath(); ctx.moveTo(s*1.2,0); ctx.lineTo(-s*0.7,-s*0.75); ctx.lineTo(-s*0.2,0); ctx.lineTo(-s*0.7,s*0.75); ctx.fill();
    ctx.restore();
  }

  /* ---------------- minimapa (região inteira, 1 px por tile, feito uma vez) ---------------- */
  let miniVisivel = true;
  function alternarMini(){ miniVisivel=!miniVisivel; const el=document.getElementById('mundo-mini'); if(el) el.classList.toggle('escondido', !miniVisivel); Missoes.S().dados.minimapa=miniVisivel; }
  let tMini=0;
  function desenharMini(){
    const el=document.getElementById('mundo-mini'); if(!el) return;
    if(!miniVisivel) return;
    tMini--; if(tMini>0 && !el._sujo) return; tMini=6; el._sujo=false;
    if(!el._base || el._base.mapa!==m){
      const b=OWArte.tela(m.w, m.h), x=b.getContext('2d'), d=x.createImageData(m.w,m.h);
      const cores=OWArte.TERR.map(t=>{ const c=t.cor||'#000'; return [parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)]; });
      for(let i=0;i<m.w*m.h;i++){ const c=m.col[i] ? [70,62,58] : cores[m.terr[i]]; d.data[i*4]=c[0]; d.data[i*4+1]=c[1]; d.data[i*4+2]=c[2]; d.data[i*4+3]=255; }
      x.putImageData(d,0,0);
      el._base={ mapa:m, cv:b };
    }
    const mx=el.getContext('2d'); const W=el.width, H=el.height;
    mx.imageSmoothingEnabled=false; mx.fillStyle='#000'; mx.fillRect(0,0,W,H);
    // janela de ~44 tiles em volta do jogador
    const vis=44, esc=W/vis, ox=jog.x/T-vis/2, oy=jog.y/T-vis/2*(H/W);
    mx.drawImage(el._base.cv, ox, oy, vis, vis*H/W, 0, 0, W, H);
    const pt=(tx,ty,cor,r)=>{ const x=(tx-ox)*esc, y=(ty-oy)*esc; if(x<0||y<0||x>W||y>H) return; mx.fillStyle='#000'; mx.fillRect(x-r-1,y-r-1,r*2+2,r*2+2); mx.fillStyle=cor; mx.fillRect(x-r,y-r,r*2,r*2); };
    npcs.forEach(n=>{ if(!n.visivel) return; const mk=Missoes.marcadorNPC(n.def); if(mk) pt(n.x/T,n.y/T, mk==='!'?'#ffe066':'#7fe3ff', 2); });
    inimigos.forEach(n=>{ if(n.visivel) pt(n.x/T,n.y/T,'#ff5a3a',1.5); });
    const alvo=Missoes.alvoNaArea(m.id); if(alvo) pt(alvo.x+0.5, alvo.y+0.5, '#ffe066', 3);
    pt(jog.x/T, jog.y/T, '#fff', 2.5);
  }

  /* texto da fala: máquina de escrever por TEMPO (aba em 2º plano não trava) */
  function atualizarTextoFala(){
    if(!fala) return;
    if(fala.revelado<fala.texto.length){
      const alvo=Math.floor((performance.now()-fala.inicio)/16);
      const novo=Math.max(fala.revelado, Math.min(fala.texto.length, alvo));
      if(novo!==fala.revelado){ fala.revelado=novo; pintarFala(); if(novo>=fala.texto.length) mostrarEscolhas(); }
    }
  }

  /* ============================================================
     PAINÉIS (diário, mapa-múndi, menu) — por cima do mundo
     ============================================================ */
  let painel=null;
  function painelAberto(){ return !!painel; }
  function abrirPainel(qual){
    fecharPaineis();
    painel=qual; limparTeclas();
    const el=document.getElementById('mundo-painel'); el.hidden=false; el.dataset.qual=qual;
    if(qual==='diario') Missoes.pintarDiario(el.querySelector('.mp-corpo'));
    else if(qual==='mapa') pintarMundi(el.querySelector('.mp-corpo'));
    else if(qual==='arquivo') Missoes.pintarArquivo(el.querySelector('.mp-corpo'));
    else if(qual==='creditos') Historia.pintarCreditos(el.querySelector('.mp-corpo'));
    else if(qual==='start') pintarStart(el.querySelector('.mp-corpo'));
    else pintarMenu(el.querySelector('.mp-corpo'));
    document.getElementById('mundo-painel-tit').textContent =
      { diario:'📜 DIÁRIO DE MISSÕES', mapa:'🗺 MAPA DO MUNDO', menu:'☰ MENU', arquivo:'📚 ARQUIVO', creditos:'✍ CRÉDITOS', start:'▶ START — ESCOLHA QUEM ANDA' }[qual];
  }
  /* START: escolhe quem do grupo o jogador controla no mapa (cada um anda
     num ritmo; o Cargas é o mais rápido) + os veículos já liberados. */
  function pintarStart(box){
    const S=Missoes.S(), grupo=S.grupo.filter(id=>typeof Characters==='undefined' || !!Characters.byId(id));
    const estrelas = v => '★'.repeat(Math.max(1,Math.round((v-0.6)*5))) ;
    let html='<div class="st-dica">Toque em quem você quer controlar. Os outros do grupo andam atrás.</div><div class="st-grade">';
    grupo.forEach(id=>{ const c=typeof Characters!=='undefined' && Characters.byId(id); const nome=c?c.name:id; const v=velDe(id);
      html+=`<button class="st-card ${id===jog.id?'on':''}" onclick="Mundo.escolherLider('${id}')"><canvas data-id="${id}" width="64" height="84"></canvas>
        <b>${esc(nome)}</b><i>Velocidade ${estrelas(v)}${id==='cargas'?' ⚡':''}</i>${id===jog.id?'<em>CONTROLANDO</em>':''}</button>`; });
    html+='</div>';
    const veics=Object.values(VEICULOS).filter(v=>(!v.pode || v.pode(S)) && (!v.se || v.se(S)));
    if(veics.length) html+='<div class="st-dica">🚗 Veículos liberados: '+veics.map(v=>'<b>'+esc(v.nome)+'</b> ('+esc(v.desc||'')+')').join(' · ')+'. Ande até o carro e aperte E. Carro só anda na rua.</div>';
    html+='<div class="st-dica">Teclado: <b>P</b> abre esta tela.</div>';
    box.innerHTML=html;
    box.querySelectorAll('canvas[data-id]').forEach(cv=>{ const x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
      const pintar=()=>{ const q=OWArte.quadro(cv.dataset.id, 0, 1, false); if(!q) return; x.clearRect(0,0,cv.width,cv.height); const s=Math.min((cv.height-4)/q.cv.height, (cv.width-4)/q.cv.width); x.drawImage(q.cv, (cv.width-q.cv.width*s)/2, cv.height-2-q.cv.height*s, q.cv.width*s, q.cv.height*s); };
      pintar(); setTimeout(pintar, 400); });
  }
  function escolherLider(id){
    const S=Missoes.S(); if(S.grupo.indexOf(id)<0) return;
    S.dados.lider=id; atualizarGrupo(); fecharPaineis(); salvar();
    const c=typeof Characters!=='undefined' && Characters.byId(id); toast('▶ Agora você controla: '+(c?c.name:id));
  }
  function fecharPaineis(){ painel=null; const el=document.getElementById('mundo-painel'); if(el) el.hidden=true; limparTeclas(); }
  function pintarMenu(box){
    const S=Missoes.S();
    const min=Math.floor((S.dados.tempoJogado||0)/60);
    box.innerHTML = `
      <div class="mm-linha">⏱ ${Math.floor(min/60)}h${String(min%60).padStart(2,'0')} jogadas · 📍 ${esc(zonaAtual||m.nome)}</div>
      <button class="btn-big" onclick="Mundo.abrirPainel('start')">▶ START — ESCOLHER PERSONAGEM (P)</button>
      <button class="btn-big" onclick="Mundo.abrirPainel('diario')">📜 DIÁRIO (J)</button>
      <button class="btn-big" onclick="Mundo.abrirPainel('mapa')">🗺 MAPA (M)</button>
      <button class="btn-big" onclick="Mundo.abrirPainel('arquivo')">📚 ARQUIVO</button>
      <button class="btn-big alt" onclick="Mundo.salvar(true)">💾 SALVAR AGORA</button>
      <button class="btn-big cond" onclick="Mundo.sair(); Historia.abrirMapa('condenacao')">⚖ TRIBUNAL DA RAINHA</button>
      <button class="btn-big alt2" onclick="Mundo.abrirPainel('creditos')">✍ CRÉDITOS</button>
      <button class="btn-big alt2" onclick="Mundo.sair()">🏠 VOLTAR À VILA</button>
      <div class="mm-dica">Teclado: setas/WASD andam · Shift corre · E fala/entra no carro · P troca de personagem · J diário · M mapa · Tab minimapa · Esc menu</div>`;
  }
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* mapa-múndi: o mapa.png com o jogador, missões e pontos de viagem */
  function pintarMundi(box){
    const S=Missoes.S();
    const reg=m.def.mundi ? m : (m.def.fora ? mapa(m.def.fora) : m);
    const pos = (()=>{ const d=reg.def.mundi; if(!d) return null; const fx = reg===m ? jog.x/T/m.w : (reg.pontos.saidaInterior? reg.pontos.saidaInterior[0]/reg.w : 0.5), fy = reg===m ? jog.y/T/m.h : 0.5;
      return [d.x + fx*d.w, d.y + fy*d.h]; })();
    let html = `<div class="mundi"><img src="modohistoria/mapa.png" alt="Mapa do mundo"><div class="mundi-pontos">`;
    Object.keys(REGIOES).forEach(id=>{ const d=REGIOES[id].mundi; if(!d) return;
      html += `<div class="mundi-reg" style="left:${d.x}%;top:${d.y}%;width:${d.w}%;height:${d.h}%"><span>${esc(REGIOES[id].nome)}</span></div>`; });
    Missoes.marcadoresMundi().forEach(k=>{ html += `<div class="mundi-mk ${k.marcada?'marcada':''}" style="left:${k.x}%;top:${k.y}%" title="${esc(k.titulo)}">${k.marcada?'◆':'!'}</div>`; });
    Missoes.pontosViagem().forEach(v=>{ html += `<button class="mundi-viagem ${v.pode?'':'off'}" style="left:${v.x}%;top:${v.y}%" onclick="Mundo.viajar('${v.id}')" title="${esc(v.nome)}">🚕<i>${esc(v.nome)}</i></button>`; });
    if(pos) html += `<div class="mundi-eu" style="left:${pos[0]}%;top:${pos[1]}%">📍</div>`;
    html += `</div></div><div class="mundi-legenda">📍 você · ◆ missão marcada · ! missão · 🚕 Táxi do Astra ${S.flag('astra_consertado')?'(toque pra viajar)':'— o Astra ainda está quebrado'}</div>`;
    box.innerHTML=html;
  }
  function viajar(id){
    const v=Missoes.pontosViagem().find(p=>p.id===id); if(!v) return;
    if(!v.pode){ toast('🚕 O Astra do Mameluco ainda está quebrado.'); return; }
    fecharPaineis(); toast('🚕 Táxi do Astra: '+v.nome);
    irPara(v.area, v.x, v.y, 0);
  }

  /* ---------------- salvar ---------------- */
  function salvar(manual){
    if(!m) return;
    if(carro){ const S=Missoes.S(); S.dados.veiculos=S.dados.veiculos||{}; S.dados.veiculos[carro.tipo]={ area:m.id, x:jog.x, y:jog.y, dir:jog.dir }; }
    Missoes.salvarPosicao(m.id, Math.floor(jog.x/T), Math.floor((jog.y-4)/T), jog.dir, jog.id);
    if(manual){ toast('💾 Jogo salvo.'); fecharPaineis(); }
  }

  /* ---------------- grupo ---------------- */
  function atualizarGrupo(){
    const S=Missoes.S();
    jog.id = S.dados.lider || jog.id;
    const ids=S.grupo.filter(id=>id!==jog.id).slice(0,3);
    const novos=ids.map(id=> seguidores.find(s=>s.id===id) || { id, x:jog.x, y:jog.y, dir:jog.dir, andando:false, passo:0, tPasso:0 });
    seguidores=novos;
  }
  /* coloca um NPC num lugar (roteiro), ou o jogador */
  function posicionar(quem, tx, ty, dir){
    if(quem==='jogador'){ jog.x=tx*T+T/2; jog.y=ty*T+T-4; if(dir!=null) jog.dir=dir; rastro=rastro.map(()=>[jog.x,jog.y,jog.dir]); seguidores.forEach(s=>{ s.x=jog.x; s.y=jog.y; }); return; }
    const n=npcPorId(quem); if(n){ n.x=tx*T+T/2; n.y=ty*T+T-4; n.casa=[n.x,n.y]; if(dir!=null) n.dir=dir; }
  }
  function hora(h){ horaForcada=h; }
  /* TESTE: roda a lógica em passos fixos (1/30 s), sem desenhar, com as
     teclas indicadas seguradas. O painel de navegador embutido estrangula o
     requestAnimationFrame; isso deixa testar andar/colisão/gatilhos rápido.
     Ex.: Mundo._simular(1.5, ['arrowleft']) */
  function _simular(seg, segurar){
    (segurar||[]).forEach(k=>teclas[k]=true);
    const n=Math.round(seg*30);
    for(let i=0;i<n;i++){ relogio+=1/30; atualizar(1/30); }
    (segurar||[]).forEach(k=>teclas[k]=false);
    return posicao();
  }
  function _apertar(k){ borda[k]=true; atualizar(1/30); }
  /* TESTE: a região inteira num canvas pequeno (chão + objetos), pra conferir o layout */
  function _previa(esc){
    esc=esc||0.25;
    const c=OWArte.tela(m.w*T*esc, m.h*T*esc), x=c.getContext('2d'); x.imageSmoothingEnabled=true;
    for(let cy=0; cy<Math.ceil(m.h/CH); cy++) for(let cx=0; cx<Math.ceil(m.w/CH); cx++){ const k=chunk(cx,cy); x.drawImage(k.cv, cx*CHPX*esc, cy*CHPX*esc, CHPX*esc, CHPX*esc); }
    m.objs.slice().sort((a,b)=>a.y-b.y).forEach(o=>{ if(!o.s||o.oculto) return; const s=o.s; x.drawImage(s.im, s.r[0], s.r[1], s.r[2], s.r[3], (o.x-s.a[0])*esc, (o.y-s.a[1])*esc, s.r[2]*esc, s.r[3]*esc); });
    npcs.forEach(n=>{ if(!n.visivel) return; x.fillStyle='#ff0'; x.fillRect(n.x*esc-2, n.y*esc-4, 4, 4); });
    inimigos.forEach(n=>{ if(!n.visivel) return; x.fillStyle='#f00'; x.fillRect(n.x*esc-2, n.y*esc-4, 4, 4); });
    x.fillStyle='#0ff'; x.fillRect(jog.x*esc-3, jog.y*esc-6, 6, 6);
    return c;
  }
  let zoomForcado=0;
  function _zoom(z){ zoomForcado=z||0; dimensionar(); }   // TESTE: ver mais do mapa num print
  function areaAtual(){ return m ? m.id : null; }
  function posicao(){ return { area:m&&m.id, x:jog.x/T, y:(jog.y-4)/T }; }
  function recriarEntidades(){ if(m) criarEntidades(); }
  function regenerar(id){ delete mapas[id]; }

  return {
    regiao, REGIOES, mapa, abrir, sair, retomar, suspender, falar, fecharFala, toast, balao, lutar, veiculo, VEICULOS, escolherLider, sairDoCarro, trocarSprite,
    get dirigindo(){ return carro ? carro.tipo : null; },
    abrirPainel, fecharPaineis, salvar, viajar, irPara, atualizarGrupo, posicionar, hora, apertarA,
    areaAtual, posicao, recriarEntidades, recriarEntidadesSuave, posNPC, objetoMaisPerto, regenerar, alternarMini, _simular, _apertar, _zoom, _previa,
    get jogador(){ return jog; }, get falando(){ return !!fala; }
  };
})();
