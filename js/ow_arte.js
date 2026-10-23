/* ============================================================
   OW ARTE — a arte do MUNDO ABERTO do Modo História (visto de cima)
   ------------------------------------------------------------
   Três coisas moram aqui:
   1. TERRENOS: grama, terra, areia, água, lava… Os do pacote LPC vêm no
      formato "3×6" (retalho solto, cantos de dentro, 3×3 de bordas e uma
      fileira de preenchimento). A borda é montada em QUARTOS de tile
      (16×16), olhando os 8 vizinhos — ver `desenharTerreno`. Terreno de
      prioridade maior desenha a borda dele por cima do de prioridade
      menor (grama sobre terra, terra sobre areia, areia sobre água).
   2. SPRITES de objeto: recortes dos atlas (árvore, pedra, barril…) e
      peças DESENHADAS EM CÓDIGO pro que não existe nos pacotes
      (arranha-céu, cúpula dourada, Torre do Relógio, máquinas do lab).
      Cada sprite tem âncora nos PÉS (é por ela que se ordena por Y) e
      uma caixa de colisão menor que o desenho.
   3. PERSONAGENS: as folhas `assets/topdown/<id>_topdown.png` (grade 4×3:
      linha 0 baixo, 1 esquerda, 2 direita, 3 cima; coluna 1 = parado).
      Cada quadro é recortado pelo alfa e REDUZIDO UMA VEZ pro tamanho do
      jogo (cache em canvas) — nunca se redimensiona por quadro. Quem não
      tem folha (robô, cidadão, androide, cachorro) é desenhado em código
      no mesmo formato.
   Escala: 1 tile = 32 px de mundo; personagem ≈ 56 px (1,75 tile). O
   motor (overworld.js) amplia tudo junto, com zoom inteiro e sem
   suavização, então a proporção é a mesma no jogo inteiro.
   Créditos dos pacotes: modohistoria/assets/CREDITOS.md (tela Créditos).
   ============================================================ */
const OWArte = (function(){
  const T = 32;
  const B = 'modohistoria/assets/';
  const ARQ = {
    atlas:   B+'terreno/terrain_atlas.png',
    build:   B+'construcoes/build_atlas.png',
    misc:    B+'construcoes/obj_misk_atlas.png',
    arvV:    B+'vegetacao/trees-green.png',
    arvM:    B+'vegetacao/trees-brown.png',
    arvS:    B+'vegetacao/trees-dead.png',
    arvL:    B+'vegetacao/trees-orange.png',
    arvP:    B+'vegetacao/trees-pale.png',
    fruta:   B+'vegetacao/fruit-trees.png',
    asfalto: B+'cidade/terrains/base_road_tile.png',
    rachado: B+'cidade/terrains/cracked_road.png',
    bueiro:  B+'cidade/terrains/manhole_and_cover.png',
    lixo:    B+'cidade/decor/trash_bins.png',
    cones:   B+'cidade/decor/traffic_cones.png',
    sinal:   B+'cidade/decor/traffic_lights.png',
    pneus:   B+'cidade/decor/wheels_and_tires.png',
    tocha:   B+'fogo/tocha.png',
    fogueira:B+'fogo/fogueira.png',
    inside:  B+'tiles_lpc_base/inside.png',
    castfl:  B+'tiles_lpc_base/castlefloors.png',
    baus:    B+'tiles_lpc_base/chests.png',
    barril:  B+'tiles_lpc_base/barrel.png',
    placas:  B+'tiles_lpc_base/signs.png',
    cozinha: B+'tiles_lpc_base/kitchen.png',
    ruinas:  B+'ruinas_cavernas/cavern_ruins.png',
    cityin:  B+'interiores/city_inside.png',
    moveis:  B+'interiores/moveis_estofados.png',
    armarios:B+'tiles_lpc_base/cabinets.png',
    escadas: B+'interiores/escadas.png',
    castint: B+'interiores/castelo_interior.png',
    sinais:  B+'cidade/decor/traffic_signs_pictograms.png',
    hidra:   B+'cidade/decor/sign_poles.png'
  };
  const img = {};
  const prometido = {};
  function carregar(chaves){
    return Promise.all((chaves||Object.keys(ARQ)).map(k=>{
      if(prometido[k]) return prometido[k];
      return prometido[k] = new Promise(res=>{
        const im=new Image();
        im.onload=()=>{ img[k]=im; res(im); };
        im.onerror=()=>{ console.warn('OWArte: não carregou', ARQ[k]); res(null); };
        im.src=ARQ[k];
      });
    }));
  }

  const tela = (w,h)=>{ const c=document.createElement('canvas'); c.width=Math.max(1,Math.ceil(w)); c.height=Math.max(1,Math.ceil(h)); return c; };
  const hash = (x,y)=>{ let h=(x*374761393 + y*668265263)|0; h=(h^(h>>>13))*1274126177|0; return (h^(h>>>16))>>>0; };
  function px(c, x,y,w,h,cor){ c.fillStyle=cor; c.fillRect(x|0,y|0,w|0,h|0); }

  /* ============================================================
     1. TERRENOS
     `prio` decide quem desenha a borda por cima de quem. `lpc` = origem
     (coluna, linha em tiles) do bloco 3×6 no atlas. `solido`: 1 parede,
     2 água, 3 lava (o motor trata os três como "não passa").
     ============================================================ */
  const TERR = [
    { nome:'vazio', prio:0, cor:'#000', solido:1 },
    { nome:'agua',  prio:0, cor:'#2f6fa3', solido:2, anim:'agua' },
    { nome:'areia', prio:2, lpc:{img:'atlas', c:0,  r:9 }, cor:'#e7cf6a' },
    { nome:'terra', prio:4, lpc:{img:'atlas', c:15, r:0 }, cor:'#b88a52' },
    { nome:'grama', prio:6, lpc:{img:'atlas', c:21, r:0 }, cor:'#4f9a3a' },
    { nome:'asfalto', prio:9, gerado:'asfalto', cor:'#3d3d44' },
    { nome:'calcada', prio:10, gerado:'calcada', cor:'#9a9aa0' },
    { nome:'lava',  prio:0, cor:'#e2541b', solido:3, anim:'lava', gerado:'lava' },
    { nome:'pedra', prio:11, gerado:'pedra', cor:'#d8cdb0' },        // pedra de cantaria (Cidade Velha)
    { nome:'piso_lab', prio:12, gerado:'piso_lab', cor:'#c9d3d6' },
    { nome:'grama_escura', prio:7, lpc:{img:'atlas', c:6, r:24}, cor:'#2c5b2c' },
    { nome:'terra2', prio:5, lpc:{img:'atlas', c:18, r:0 }, cor:'#8a5a34' },
    { nome:'madeira', prio:13, gerado:'madeira', cor:'#8a5a32' },
    { nome:'muro_topo', prio:20, gerado:'muro_topo', cor:'#e9e1c8', solido:1 },
    { nome:'muro_face', prio:20, gerado:'muro_face', cor:'#d6ccb0', solido:1 },
    { nome:'parede_topo', prio:20, gerado:'parede_topo', cor:'#262a36', solido:1 },
    { nome:'parede_face', prio:20, gerado:'parede_face', cor:'#9fb5bf', solido:1 },
    { nome:'rocha_escura', prio:3, lpc:{img:'atlas', c:18, r:6}, cor:'#3a3434' },
    { nome:'grama_flor', prio:6, lpc:{img:'atlas', c:21, r:6}, cor:'#4f9a3a' },
    { nome:'piso_xadrez', prio:12, gerado:'piso_xadrez', cor:'#bbb' },
    { nome:'tapete', prio:14, gerado:'tapete', cor:'#8b2232' },
    { nome:'trilho', prio:9, gerado:'trilho', cor:'#5a4a3a' },
    { nome:'cais', prio:13, gerado:'cais', cor:'#7a5530' },
    { nome:'areia_molhada', prio:1, gerado:'areia_molhada', cor:'#c9b45f' },
    { nome:'sucata', prio:5, gerado:'sucata', cor:'#5d554d' },
    /* ---- interiores: alto da parede (escuro, morno) + face da parede em 2
       fileiras (_a = de cima, com sanca; _b = de baixo, com rodapé) ---- */
    { nome:'parede_topo_casa', prio:20, gerado:'parede_topo_casa', cor:'#2b2220', solido:1 },
    { nome:'pcreme_a', prio:20, gerado:'pcreme_a', cor:'#e9dcc0', solido:1 },
    { nome:'pcreme_b', prio:20, gerado:'pcreme_b', cor:'#e9dcc0', solido:1 },
    { nome:'pmadeira_a', prio:20, gerado:'pmadeira_a', cor:'#8a5a32', solido:1 },
    { nome:'pmadeira_b', prio:20, gerado:'pmadeira_b', cor:'#8a5a32', solido:1 },
    { nome:'ptijolo_a', prio:20, gerado:'ptijolo_a', cor:'#a4523a', solido:1 },
    { nome:'ptijolo_b', prio:20, gerado:'ptijolo_b', cor:'#a4523a', solido:1 },
    { nome:'pazulejo_a', prio:20, gerado:'pazulejo_a', cor:'#e8f0f2', solido:1 },
    { nome:'pazulejo_b', prio:20, gerado:'pazulejo_b', cor:'#e8f0f2', solido:1 },
    { nome:'ppedra_a', prio:20, gerado:'ppedra_a', cor:'#b9ad8c', solido:1 },
    { nome:'ppedra_b', prio:20, gerado:'ppedra_b', cor:'#b9ad8c', solido:1 },
    { nome:'pverde_a', prio:20, gerado:'pverde_a', cor:'#7fa88a', solido:1 },
    { nome:'pverde_b', prio:20, gerado:'pverde_b', cor:'#7fa88a', solido:1 },
    { nome:'prosa_a', prio:20, gerado:'prosa_a', cor:'#e8b9b9', solido:1 },
    { nome:'prosa_b', prio:20, gerado:'prosa_b', cor:'#e8b9b9', solido:1 },
    { nome:'pvidro_a', prio:20, gerado:'pvidro_a', cor:'#9fc7d8', solido:1 },
    { nome:'pvidro_b', prio:20, gerado:'pvidro_b', cor:'#9fc7d8', solido:1 },
    { nome:'piso_ladrilho', prio:12, gerado:'piso_ladrilho', cor:'#d9cfb8' },
    { nome:'piso_carpete', prio:12, gerado:'piso_carpete', cor:'#4a6a8a' },
    { nome:'piso_tabuas', prio:12, gerado:'piso_tabuas', cor:'#b07a48' },
    { nome:'piso_concreto', prio:12, gerado:'piso_concreto', cor:'#8e9194' },
    { nome:'piso_marmore', prio:12, gerado:'piso_marmore', cor:'#ece6da' },
    { nome:'piso_pedra_int', prio:12, gerado:'piso_pedra_int', cor:'#9a917c' },
    /* ---- exterior novo ---- */
    { nome:'paralelepipedo', prio:11, gerado:'paralelepipedo', cor:'#9a9488' },
    { nome:'gramado', prio:6, gerado:'gramado', cor:'#5aa844' },
    { nome:'horta', prio:5, gerado:'horta', cor:'#5a3a22' },
    /* ---- Smergulus Kingdom ---- */
    { nome:'cinzas', prio:3.5, gerado:'cinzas', cor:'#4a3f45' },
    { nome:'pedra_roxa', prio:11, gerado:'pedra_roxa', cor:'#5a4a6a' },
    { nome:'muro_roxo_topo', prio:20, gerado:'muro_roxo_topo', cor:'#4a3a5a', solido:1 },
    { nome:'muro_roxo_face', prio:20, gerado:'muro_roxo_face', cor:'#3a2a4a', solido:1 },
    { nome:'terra_batida', prio:4.5, gerado:'terra_batida', cor:'#6a5040' },
    { nome:'proxa_a', prio:20, gerado:'proxa_a', cor:'#4a3a5e', solido:1 },
    { nome:'proxa_b', prio:20, gerado:'proxa_b', cor:'#4a3a5e', solido:1 }
  ];
  const TID = {}; TERR.forEach((t,i)=>{ TID[t.nome]=i; t.id=i; });
  const tid = nome => { if(!(nome in TID)) throw new Error('terreno desconhecido: '+nome); return TID[nome]; };

  /* ---- preenchimentos desenhados em código (variações 0..3) ---- */
  const gerados = {};
  function gerado(nome, v){
    const k=nome+v; if(gerados[k]) return gerados[k];
    const c=tela(T,T), x=c.getContext('2d');
    const r=n=>{ const h=hash(v*31+n, n*7+v); return (h%1000)/1000; };
    if(nome==='asfalto'){
      // asfalto liso com pedrisco (o tile do pacote é rachado demais pra cidade inteira)
      px(x,0,0,T,T,'#45464d');
      for(let n=0;n<26;n++){ const h=hash(n*13+v*101, n*7+v); px(x,h%32,(h>>8)%32,1,1,(h>>16)%3?'#4f5058':'#3b3c42'); }
      if(v===3){ px(x,9,14,5,1,'#34353a'); px(x,13,15,4,1,'#34353a'); px(x,16,16,2,1,'#34353a'); }
    } else if(nome==='calcada'){
      px(x,0,0,T,T,'#a5a39c');
      for(let j=0;j<2;j++)for(let i=0;i<2;i++){ const s=['#b3b1a9','#aaa89f','#b8b6ae','#a9a69d'][(i+j*2+v)%4]; px(x,i*16+1,j*16+1,14,14,s); }
      px(x,0,0,T,1,'#8d8b84'); px(x,0,0,1,T,'#8d8b84');
      if(v===2){ px(x,20,6,3,1,'#8f8d86'); px(x,22,7,2,1,'#8f8d86'); }
    } else if(nome==='pedra'){
      px(x,0,0,T,T,'#cbbd98');
      const off=(v%2)*8;
      for(let j=0;j<4;j++){ const o=(j%2)*8+off; for(let i=-1;i<3;i++){ const xx=i*16+o; const s=['#e3d7b6','#ddd0ad','#e8dcbc','#d6c8a3'][(i+j+v+4)%4]; px(x,xx+1,j*8+1,15,7,s); } }
    } else if(nome==='piso_lab'){
      px(x,0,0,T,T,'#b9c6ca'); px(x,1,1,14,14,'#d3dde0'); px(x,17,17,14,14,'#d3dde0'); px(x,17,1,14,14,'#c6d2d6'); px(x,1,17,14,14,'#c6d2d6');
      if(v===1){ px(x,4,22,6,1,'#9fb0b5'); }
      if(v===3){ px(x,24,6,2,2,'#7fd8ff'); }
    } else if(nome==='piso_xadrez'){
      for(let j=0;j<2;j++)for(let i=0;i<2;i++) px(x,i*16,j*16,16,16,(i+j)%2?'#2b2b33':'#e6e3da');
    } else if(nome==='madeira'){
      px(x,0,0,T,T,'#7a4f2c');
      for(let j=0;j<4;j++){ px(x,0,j*8,T,7,['#8d5d35','#855731','#93623a','#8a5a33'][(j+v)%4]); px(x,((j*11+v*7)%28),j*8,1,7,'#5e3a1f'); }
    } else if(nome==='tapete'){
      px(x,0,0,T,T,'#8b2232'); px(x,0,4,T,2,'#d9a441'); px(x,0,26,T,2,'#d9a441'); px(x,14,13,4,4,'#d9a441');
    } else if(nome==='muro_topo'){
      px(x,0,0,T,T,'#efe7cf'); px(x,0,T-3,T,3,'#cfc4a5');
      px(x,2,2,12,10,'#f6f0dc'); px(x,18,2,12,10,'#f6f0dc'); px(x,0,14,T,1,'#d8ceb1');
      px(x,6,18,10,8,'#e2d8bd'); px(x,20,18,10,8,'#e7ddc2');
    } else if(nome==='muro_face'){
      px(x,0,0,T,T,'#d8ccab');
      for(let j=0;j<4;j++){ const o=(j%2)*10; for(let i=-1;i<3;i++){ const s=['#e6dbbe','#dfd3b4','#ebe1c6'][(i+j+v+3)%3]; px(x,i*20+o+1,j*8+1,18,6,s); } }
      px(x,0,0,T,2,'#bfb293');
    } else if(nome==='parede_topo'){
      px(x,0,0,T,T,'#2a2e3b'); px(x,0,0,T,2,'#3a4052'); px(x,0,T-2,T,2,'#1d202a');
    } else if(nome==='parede_face'){
      px(x,0,0,T,T,'#a9bec8'); px(x,0,0,T,4,'#eef3f4'); px(x,0,T-5,T,5,'#7d8f98');
      px(x,0,6,T,1,'#9cb1bb'); if(v%2) px(x,15,8,2,18,'#98acb6');
    } else if(nome==='lava'){
      px(x,0,0,T,T,'#c9361a');
      for(let n=0;n<7;n++){ const xx=r(n)*28|0, yy=r(n+9)*28|0; px(x,xx,yy,5,3,'#f07a24'); px(x,xx+1,yy+1,2,1,'#ffd04a'); }
    } else if(nome==='trilho'){
      px(x,0,0,T,T,'#6b5a48'); for(let j=0;j<4;j++) px(x,2,j*8+2,28,4,'#5a3d22'); px(x,7,0,3,T,'#8f8f96'); px(x,22,0,3,T,'#8f8f96');
    } else if(nome==='cais'){
      px(x,0,0,T,T,'#6b4626');
      for(let i=0;i<4;i++){ px(x,i*8,0,7,T,['#8a5d33','#80562f','#93653a','#875a31'][(i+v)%4]); }
      px(x,3,4,1,1,'#3b2412'); px(x,11,20,1,1,'#3b2412'); px(x,27,12,1,1,'#3b2412');
    } else if(nome==='areia_molhada'){
      px(x,0,0,T,T,'#cdb866'); for(let n=0;n<6;n++){ px(x,r(n)*30|0, r(n+3)*30|0, 3,1,'#b9a352'); }
    } else if(nome==='sucata'){
      px(x,0,0,T,T,'#5d554d');
      for(let n=0;n<10;n++){ const xx=r(n)*29|0, yy=r(n+5)*29|0; px(x,xx,yy,3,2,['#7a7068','#4a4440','#8a5a3a','#6d7378'][n%4]); }
    } else if(nome==='cal'){
      // parede caiada (Cidade Velha): reboco branco, manchinhas e rodapé de pedra
      px(x,0,0,T,T,'#f6f1e4');
      for(let n=0;n<7;n++){ const h=hash(n*17+v*5,n*3+v*11); px(x,h%30,(h>>8)%24,2,1,(h>>16)%2?'#e9e2d0':'#fffaf0'); }
      px(x,0,T-5,T,5,'#cbbd98'); px(x,0,T-5,T,1,'#b3a57f'); px(x,(v*9)%28,T-4,4,3,'#d9cdab');
    } else if(nome==='parede_topo_casa'){
      px(x,0,0,T,T,'#2e2522'); px(x,0,0,T,2,'#4a3c35'); px(x,0,T-2,T,2,'#1f1816');
    } else if(/^p(creme|madeira|tijolo|azulejo|pedra|verde|rosa|vidro|roxa)_[ab]$/.test(nome)){
      paredeInterna(x, nome.slice(1,-2), nome.slice(-1), v);
    } else if(nome==='piso_ladrilho'){
      px(x,0,0,T,T,'#bfb49a');
      for(let j=0;j<2;j++)for(let i=0;i<2;i++){ px(x,i*16+1,j*16+1,15,15,['#e2d8bf','#dcd1b6','#e6dcc4','#d8ccb0'][(i+j*2+v)%4]); px(x,i*16+1,j*16+1,15,1,'rgba(255,255,255,.35)'); }
    } else if(nome==='piso_carpete'){
      px(x,0,0,T,T,'#3f5f80');
      for(let j=0;j<T;j+=4) for(let i=(j/4)%2*2;i<T;i+=4) px(x,i,j,1,1,'#4d6f92');
      if(v===1) px(x,10,12,2,2,'#36536f');
    } else if(nome==='piso_tabuas'){
      px(x,0,0,T,T,'#9a6a3e');
      for(let j=0;j<4;j++){ px(x,0,j*8,T,7,['#b58250','#ad7a49','#bb8956','#a87646'][(j+v)%4]); px(x,((j*13+v*9)%30),j*8,1,7,'#7d5230'); px(x,0,j*8,T,1,'rgba(255,255,255,.12)'); }
    } else if(nome==='piso_concreto'){
      px(x,0,0,T,T,'#8e9194'); for(let n=0;n<14;n++){ const h=hash(n*29+v*7,n*3+v); px(x,h%31,(h>>8)%31,1,1,(h>>16)%2?'#9a9da0':'#7f8285'); }
      px(x,0,0,T,1,'#7a7d80'); px(x,0,0,1,T,'#7a7d80');
      if(v===2){ px(x,6,20,8,1,'#6f7275'); px(x,13,21,6,1,'#6f7275'); }
    } else if(nome==='piso_marmore'){
      px(x,0,0,T,T,'#e9e3d6'); px(x,0,0,T,1,'#cfc6b4'); px(x,0,0,1,T,'#cfc6b4');
      x.strokeStyle='rgba(150,140,125,.35)'; x.lineWidth=1; x.beginPath(); x.moveTo(3+v*5,2); x.bezierCurveTo(12,10,8+v*3,18,28,30-v*3); x.stroke();
      if((v&1)===0){ px(x,15,15,3,3,'#c9b98f'); }
    } else if(nome==='piso_pedra_int'){
      px(x,0,0,T,T,'#7d7563');
      const off=(v%2)*8; for(let j=0;j<2;j++){ const o=(j%2)*16+off; for(let i=-1;i<2;i++){ px(x,i*32+o+1,j*16+1,30,14,['#a39a83','#9a917a','#aaa18a'][(i+j+v+3)%3]); } }
    } else if(nome==='paralelepipedo'){
      px(x,0,0,T,T,'#6e6a62');
      for(let j=0;j<4;j++){ const o=(j%2)*5; for(let i=-1;i<4;i++){ const s=['#a29c8f','#9a9488','#aaa497','#938d81'][(i*3+j+v)&3]; px(x,i*10+o+1,j*8+1,8,6,s); px(x,i*10+o+1,j*8+1,8,1,'rgba(255,255,255,.18)'); } }
    } else if(nome==='gramado'){
      px(x,0,0,T,T,(v&1)?'#5aa844':'#61b04a');
      for(let n=0;n<8;n++){ const h=hash(n*11+v*5,n+v*13); px(x,h%30,(h>>8)%29,1,3,'#4a9338'); }
    } else if(nome==='cinzas'){
      px(x,0,0,T,T,'#463b42');
      for(let n=0;n<12;n++){ const h=hash(n*19+v*7,n*5+v); px(x,h%30,(h>>8)%30,2,1,['#54484f','#3a3036','#5e4a3a','#4e4248'][(h>>16)&3]); }
      if(v===1){ px(x,8,20,3,2,'#7a3a2a'); px(x,9,20,1,1,'#ff7a3c'); }        // brasinha
    } else if(nome==='pedra_roxa'){
      px(x,0,0,T,T,'#3e3048');
      const off=(v%2)*8; for(let j=0;j<4;j++){ const o=(j%2)*8+off; for(let i=-1;i<3;i++){ px(x,i*16+o+1,j*8+1,15,7,['#5e4a6e','#56446a','#644f74','#4f3f60'][(i+j+v+4)%4]); } }
    } else if(nome==='muro_roxo_topo'){
      px(x,0,0,T,T,'#5a4870'); px(x,0,T-3,T,3,'#3a2a4a'); px(x,2,2,12,10,'#6e5a86'); px(x,18,2,12,10,'#6e5a86'); px(x,0,14,T,1,'#4a3a5e');
    } else if(nome==='muro_roxo_face'){
      px(x,0,0,T,T,'#3a2a4a');
      for(let j=0;j<4;j++){ const o=(j%2)*10; for(let i=-1;i<3;i++) px(x,i*20+o+1,j*8+1,18,6,['#4a3a5e','#463656','#503f66'][(i+j+v+3)%3]); }
      px(x,0,0,T,2,'#2a1e36');
    } else if(nome==='terra_batida'){
      px(x,0,0,T,T,'#6a5040'); for(let n=0;n<9;n++){ const h=hash(n*23+v*3,n+v*17); px(x,h%30,(h>>8)%30,3,1,(h>>16)%2?'#5a4232':'#7a5e4a'); }
    } else if(nome==='horta'){
      px(x,0,0,T,T,'#5a3a22'); for(let j=2;j<T;j+=8){ px(x,0,j,T,3,'#4a2e1a'); px(x,0,j+3,T,1,'#7a5434'); }
    }
    return gerados[k]=c;
  }

  /* face da parede de interior. `fil` 'a' = fileira de cima (sanca no
     alto), 'b' = de baixo (lambri/rodapé, encosta no chão). */
  function paredeInterna(x, estilo, fil, v){
    const P = {
      creme:  { base:'#eadfc5', pad:'#e2d5b8', lambri:'#9a6a3e', lamb2:'#b07a48', sanca:'#fbf4e2' },
      madeira:{ base:'#8f5f36', pad:'#7f5230', lambri:'#5e3a1f', lamb2:'#6e4526', sanca:'#b07a48' },
      tijolo: { base:'#a4523a', pad:'#8a4430', lambri:'#5c5450', lamb2:'#6e6560', sanca:'#c97a5a' },
      azulejo:{ base:'#eef4f5', pad:'#cfdfe3', lambri:'#7fb3c4', lamb2:'#9cc6d4', sanca:'#ffffff' },
      pedra:  { base:'#bdb190', pad:'#a99d7c', lambri:'#7d7258', lamb2:'#8f846a', sanca:'#d9cfb2' },
      verde:  { base:'#86ad8f', pad:'#76a080', lambri:'#4e6a50', lamb2:'#5f7d60', sanca:'#e8efe0' },
      rosa:   { base:'#ecc3c0', pad:'#e2b0ad', lambri:'#8a5a5a', lamb2:'#a06a6a', sanca:'#fff0ee' },
      vidro:  { base:'#a9cfdd', pad:'#8fbccd', lambri:'#4f5960', lamb2:'#5f6a72', sanca:'#e6f4fa' },
      roxa:   { base:'#4a3a5e', pad:'#3e3050', lambri:'#2a1e36', lamb2:'#3a2a4a', sanca:'#7a5a9a' }
    }[estilo] || {};
    px(x,0,0,T,T,P.base);
    if(estilo==='tijolo'){ for(let j=0;j<4;j++){ const o=(j%2)*8; for(let i=-1;i<3;i++) px(x,i*16+o+1,j*8+1,14,6,['#b25e44','#a4523a','#b86a4e'][(i+j+v+3)%3]); } }
    else if(estilo==='roxa'){ for(let j=0;j<3;j++){ const o=(j%2)*10; for(let i=-1;i<3;i++) px(x,i*20+o+1,j*11+1,18,9,['#56446a','#4a3a5e','#5e4a72'][(i+j+v+3)%3]); } }
    else if(estilo==='pedra'){ for(let j=0;j<3;j++){ const o=(j%2)*10; for(let i=-1;i<3;i++) px(x,i*20+o+1,j*11+1,18,9,['#c6ba98','#b9ad8c','#cfc4a3'][(i+j+v+3)%3]); } }
    else if(estilo==='azulejo'){ for(let j=0;j<4;j++) for(let i=0;i<4;i++){ px(x,i*8,j*8,8,1,P.pad); px(x,i*8,j*8,1,8,P.pad); } }
    else if(estilo==='madeira'){ for(let i=0;i<4;i++){ px(x,i*8,0,1,T,'#6e4526'); px(x,i*8+1,0,1,T,'rgba(255,255,255,.08)'); } }
    else if(estilo==='vidro'){ px(x,0,0,T,T,'#3f6f86'); px(x,2,2,28,28,P.base); px(x,4,4,6,22,'rgba(255,255,255,.35)'); px(x,14,4,2,22,'rgba(255,255,255,.2)'); }
    else { for(let i=v%2*4;i<T;i+=8) px(x,i,0,2,T,P.pad); }          // papel de parede listrado
    if(fil==='a'){ px(x,0,0,T,4,P.sanca); px(x,0,4,T,1,'rgba(0,0,0,.18)'); }
    else {
      px(x,0,T-12,T,12,P.lambri); px(x,0,T-12,T,2,P.lamb2); for(let i=3;i<T;i+=10) px(x,i,T-9,6,6,P.lamb2);
      px(x,0,T-3,T,3,'rgba(0,0,0,.35)');
    }
  }

  /* desenha o terreno da célula (cx,cy) do mapa `m` em (dx,dy) do contexto */
  function desenharTerreno(ctx, m, cx, cy, dx, dy){
    const t = m.terr[cy*m.w+cx];
    const def = TERR[t];
    const viz = (ox,oy)=>{ const x=cx+ox, y=cy+oy; if(x<0||y<0||x>=m.w||y>=m.h) return t; return m.terr[y*m.w+x]; };
    const h = hash(cx,cy);
    if(!def.lpc){
      preencher(ctx, def, dx, dy, h);
      detalheChao(ctx, def.nome, dx, dy, h);
      return;
    }
    const p = def.prio;
    // mesma prioridade conta como "igual" (grama com flor ao lado de grama):
    // sem isso a borda não acha terreno por baixo e sobra um buraco PRETO
    const igual = v => v===t || TERR[v].prio>=p;
    const N=igual(viz(0,-1)), S=igual(viz(0,1)), W=igual(viz(-1,0)), E=igual(viz(1,0));
    const NW=igual(viz(-1,-1)), NE=igual(viz(1,-1)), SW=igual(viz(-1,1)), SE=igual(viz(1,1));
    if(N&&S&&W&&E&&NW&&NE&&SW&&SE){ preencher(ctx, def, dx, dy, h); detalheChao(ctx, def.nome, dx, dy, h); return; }
    // por baixo: o terreno de MENOR prioridade da vizinhança
    let baixo=-1, pb=1e9;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){ const v=viz(ox,oy); if(v!==t && TERR[v].prio<p && TERR[v].prio<pb){ pb=TERR[v].prio; baixo=v; } }
    if(baixo>=0) preencher(ctx, TERR[baixo], dx, dy, h);
    const L=def.lpc, im=img[L.img]; if(!im){ px(ctx,dx,dy,T,T,def.cor); return; }
    const X0=L.c*T, Y0=L.r*T, Xin=X0+T, Yout=Y0+2*T, Yfill=Y0+5*T;
    const quads=[[W,N,NW],[E,N,NE],[W,S,SW],[E,S,SE]];
    for(let q=0;q<4;q++){
      const qx=q&1, qy=q>>1, H=quads[q][0], V=quads[q][1], D=quads[q][2];
      let sx, sy;
      if(H&&V&&D){ sx=X0+(h%3)*T+qx*16; sy=Yfill+qy*16; }
      else if(H&&V){ sx=Xin+T-(qx?16:0); sy=Y0+T-(qy?16:0); }
      else { const col=H?1:(qx?2:0), lin=V?1:(qy?2:0); sx=X0+col*T+qx*16; sy=Yout+lin*T+qy*16; }
      ctx.drawImage(im, sx, sy, 16, 16, dx+qx*16, dy+qy*16, 16, 16);
    }
  }
  function preencher(ctx, def, dx, dy, h){
    if(def.lpc){
      const im=img[def.lpc.img]; if(!im){ px(ctx,dx,dy,T,T,def.cor); return; }
      ctx.drawImage(im, def.lpc.c*T+(h%3)*T, (def.lpc.r+5)*T, T, T, dx, dy, T, T);
    } else if(def.gerado){
      ctx.drawImage(gerado(def.gerado, h%4), dx, dy);
    } else if(def.nome==='agua'){
      const im=img.atlas;
      if(im) ctx.drawImage(im, 10*T, 12*T, T, T, dx, dy, T, T); else px(ctx,dx,dy,T,T,def.cor);
    } else px(ctx,dx,dy,T,T,def.cor);
  }

  /* detalhes miúdos no meio do terreno (tufo, florzinha, pedrisco, concha,
     rachadura…), sorteados pela posição: o chão para de parecer papel de
     parede repetido. Vai pro chunk pré-renderizado — custo zero por quadro. */
  function detalheChao(ctx, nome, dx, dy, h){
    const r = h>>>4, q = r%997, ox = dx+4+((h>>>8)%22), oy = dy+5+((h>>>13)%20);
    if(nome==='grama' || nome==='grama_escura'){
      const esc = nome==='grama' ? '#3c7f2e' : '#1f4620', cla = nome==='grama' ? '#6fbf4a' : '#3d7a35';
      if(q%5===0){ px(ctx,ox,oy,1,3,esc); px(ctx,ox+2,oy-1,1,4,esc); px(ctx,ox+4,oy,1,3,esc); px(ctx,ox+2,oy-1,1,1,cla); }
      else if(q%17===1){ const c=['#fff6d8','#ffe066','#ff8ab0','#c9a8ff','#ffffff'][q%5]; px(ctx,ox,oy,2,2,c); px(ctx,ox+5,oy+3,2,2,c); px(ctx,ox+2,oy+6,2,2,c); px(ctx,ox+1,oy+1,1,1,'#e6a21a'); }
      else if(q%29===2){ px(ctx,ox,oy,4,3,'#8a8a80'); px(ctx,ox,oy,3,1,'#b0b0a6'); }
      else if(q%11===3){ px(ctx,ox,oy+2,6,1,cla); px(ctx,ox+1,oy+1,4,1,cla); }
    } else if(nome==='terra' || nome==='terra2'){
      if(q%4===0){ px(ctx,ox,oy,3,2,'#7d5a36'); px(ctx,ox,oy,2,1,'#c9a272'); }
      if(q%9===1){ px(ctx,ox+6,oy+4,2,2,'#6a4a2a'); px(ctx,ox+2,oy+8,2,1,'#6a4a2a'); }
      if(q%31===2){ px(ctx,ox,oy,1,3,'#4f8f34'); px(ctx,ox+2,oy-1,1,4,'#4f8f34'); }
    } else if(nome==='areia'){
      if(q%7===0){ px(ctx,ox,oy,3,2,'#fff3d6'); px(ctx,ox+1,oy,1,1,'#e6b8a0'); }
      else if(q%13===1){ px(ctx,ox,oy,2,2,'#b89a4a'); px(ctx,ox+4,oy+1,1,1,'#b89a4a'); }
      else if(q%41===2){ px(ctx,ox+1,oy,1,5,'#e8743a'); px(ctx,ox-1,oy+2,5,1,'#e8743a'); }
    } else if(nome==='calcada'){
      if(q%23===0){ px(ctx,ox,oy,4,1,'#8a8880'); px(ctx,ox+3,oy+1,3,1,'#8a8880'); }
      else if(q%37===1){ px(ctx,ox,oy,2,2,'#6e6c66'); }
      else if(q%19===2){ px(ctx,dx+15,dy+1,1,3,'#5c9a3a'); px(ctx,dx+17,dy+2,1,2,'#5c9a3a'); }
    } else if(nome==='asfalto'){
      if(q%29===0){ px(ctx,ox,oy,7,5,'#3a3b41'); px(ctx,ox+1,oy+1,5,3,'#414249'); }
      else if(q%43===1){ px(ctx,ox,oy,5,1,'#2f3035'); px(ctx,ox+4,oy+1,4,1,'#2f3035'); px(ctx,ox+7,oy+2,2,1,'#2f3035'); }
    } else if(nome==='pedra'){
      if(q%17===0){ px(ctx,ox,oy,1,2,'#6f9a4a'); px(ctx,ox+2,oy-1,1,3,'#6f9a4a'); }
      else if(q%23===1){ px(ctx,ox,oy,5,1,'#b9ab86'); }
    }
  }

  /* brilho animado por cima da água / lava (desenhado por quadro só nas
     células visíveis — o resto do chão fica no chunk pré-renderizado) */
  const brilhos={};
  function brilho(tipo, q){
    const k=tipo+q; if(brilhos[k]) return brilhos[k];
    const c=tela(T,T), x=c.getContext('2d');
    for(let n=0;n<5;n++){
      const h=hash(n*13+q*3, n*17+(tipo==='lava'?99:0));
      const xx=h%28, yy=(h>>8)%28, w=3+((h>>16)%5);
      if(tipo==='agua'){ x.fillStyle='rgba(190,235,255,.55)'; x.fillRect(xx,yy,w,1); x.fillStyle='rgba(255,255,255,.35)'; x.fillRect(xx+1,yy,1,1); }
      else { x.fillStyle='rgba(255,210,80,.7)'; x.fillRect(xx,yy,w,2); x.fillStyle='rgba(255,250,200,.6)'; x.fillRect(xx+1,yy,2,1); }
    }
    return brilhos[k]=c;
  }

  /* ============================================================
     2. SPRITES DE OBJETO
     { img, r:[x,y,w,h], a:[ax,ay] (pés, em px do recorte),
       col:[x0,y0,w,h] (caixa de colisão RELATIVA aos pés, em px),
       anim:{n, dx, dy, fps} }  ou  { gerar:()=>canvas, a, col }
     ============================================================ */
  const SPR = {};
  function spr(nome, def){ SPR[nome]=def; }
  // árvores: as 5 folhas de árvore têm a MESMA disposição (só muda a folhagem)
  const ARV = {
    redonda:  [320,102,96,122], redonda2:[128,104,95,118], fina:[64,96,64,128],
    media:    [129,352,94,137], alta:[321,352,93,159], pinheiro:[0,356,62,145], pinheiro2:[64,356,63,149],
    grande:   [301,512,165,188], grande2:[0,535,150,169], moita:[131,2,55,58], moita2:[200,7,48,54]
  };
  const FOLHA_ARV = { V:'arvV', M:'arvM', S:'arvS', L:'arvL', P:'arvP' };
  Object.keys(ARV).forEach(k=>{
    Object.keys(FOLHA_ARV).forEach(f=>{
      const r=ARV[k], baixa = k.indexOf('moita')===0;
      spr('arv_'+k+'_'+f, { img:FOLHA_ARV[f], r, a:[r[2]/2, r[3]-(baixa?4:8)],
        col: baixa ? [-r[2]*0.35, -12, r[2]*0.7, 12] : [-9,-12,18,10] });
    });
  });
  spr('coqueiro', { img:'fruta', r:[9,1024,83,129], a:[38,122], col:[-7,-10,14,8] });
  spr('bananeira',{ img:'fruta', r:[100,1039,92,113], a:[46,108], col:[-7,-10,14,8] });
  spr('arbusto',  { img:'atlas', r:[769,384,94,80], a:[47,76], col:[-40,-26,80,24] });
  spr('arbusto2', { img:'atlas', r:[865,400,94,80], a:[47,76], col:[-40,-26,80,24] });
  spr('pedra_g',  { img:'atlas', r:[834,689,61,43], a:[30,40], col:[-26,-18,52,16] });
  spr('pedra_m',  { img:'atlas', r:[866,753,61,43], a:[30,40], col:[-26,-18,52,16] });
  spr('pedra_p',  { img:'atlas', r:[928,772,31,22], a:[15,20], col:[-12,-10,24,9] });
  spr('rocha_c',  { img:'atlas', r:[870,501,85,91], a:[42,86], col:[-36,-34,72,32] });
  spr('pedregulho',{img:'atlas', r:[816,608,64,41], a:[32,38], col:[-28,-20,56,18] });
  spr('toco',     { img:'atlas', r:[391,395,50,41], a:[25,38], col:[-16,-14,32,12] });
  spr('estatua_cabeca',{ img:'atlas', r:[449,384,64,96], a:[32,90], col:[-24,-26,48,24] });
  spr('fonte',    { img:'atlas', r:[544,384,32,64], a:[16,60], col:[-14,-26,28,24] });
  spr('cachoeira',{ img:'atlas', r:[672,384,96,192], a:[48,190], col:null, chao:true });
  spr('ponte_h',  { img:'atlas', r:[512,512,96,64], a:[48,64], col:null, chao:true });
  spr('cerca_h',  { img:'build', r:[812,355,72,23], a:[36,22], col:[-36,-8,72,8] });
  spr('barril',   { img:'build', r:[930,266,28,38], a:[14,36], col:[-12,-12,24,11] });
  spr('barril2',  { img:'build', r:[962,282,28,38], a:[14,36], col:[-12,-12,24,11] });
  spr('carroca',  { img:'build', r:[672,525,96,83], a:[48,78], col:[-44,-26,88,24] });
  spr('tenda',    { img:'build', r:[418,517,124,150], a:[62,146], col:[-58,-60,116,58] });
  spr('poste',    { img:'build', r:[387,524,26,66], a:[13,64], col:[-5,-6,10,5] });
  spr('placa_inn',{ img:'build', r:[672,644,24,24], a:[12,24], col:null });
  spr('bau',      { img:'baus', r:[0,0,32,32], a:[16,30], col:[-14,-14,28,12] });
  spr('bau_aberto',{img:'baus', r:[0,32,32,32], a:[16,30], col:[-14,-14,28,12] });
  spr('tocha',    { img:'tocha', r:[0,0,32,64], a:[16,62], col:[-4,-6,8,4], anim:{n:9, dx:32, fps:10} });
  spr('fogueira', { img:'fogueira', r:[0,0,64,64], a:[32,56], col:[-20,-18,40,14], anim:{n:5, dx:64, fps:9}, luz:'#ff9a3a' });
  spr('lixeira',  { img:'lixo', r:[0,0,32,48], a:[16,46], col:[-11,-10,22,9] });
  spr('cone',     { img:'cones', r:[0,0,32,32], a:[16,30], col:[-8,-8,16,7] });
  spr('pneus',    { img:'pneus', r:[0,0,64,64], a:[32,60], col:[-24,-18,48,16] });

  /* ---- peças desenhadas em código: cada uma gera um canvas UMA vez ---- */
  const cacheGerado = {};
  function gerar(chave, w, h, fn){
    if(cacheGerado[chave]) return cacheGerado[chave];
    const c=tela(w,h); fn(c.getContext('2d'), w, h); return cacheGerado[chave]=c;
  }
  function sombra(x, cx, cy, rx, ry){ x.fillStyle='rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.fill(); }

  /* Arranha-céu visto de cima em 3/4: topo (laje) + fachada de vidro.
     w = largura em tiles, prof = profundidade da laje, alt = fachada. */
  function predio(o){
    const w=o.w*T, laje=(o.prof||2)*T, fach=(o.alt||4)*T, H=laje+fach;
    const k='predio_'+[o.w,o.prof,o.alt,o.cor,o.estilo||0,o.antena?1:0,o.heliponto?1:0].join('_');
    const c=gerar(k, w, H+6, (x)=>{
      const pal = {
        vidro:['#3d6f93','#5a95ba','#2b4f6b','#9fd2ee','#bcd7e4'],
        verde:['#2f7a76','#49a39b','#1f5450','#a6efe3','#c7e3df'],
        areia:['#b49a6d','#d9c39a','#7d6845','#f3e2b8','#e8dcc2'],
        noite:['#2a3350','#3d4b74','#1a2036','#ffe9a3','#5c6a90'],
        ouro: ['#9a7a3a','#c9a352','#6b5226','#ffe7a0','#e6d3a0']
      }[o.cor||'vidro'];
      // fachada
      px(x,0,laje,w,fach,pal[0]);
      const colW = o.estilo===1 ? 6 : 8, linH = 10;
      for(let yy=laje+6; yy<laje+fach-12; yy+=linH){
        for(let xx=4; xx<w-6; xx+=colW){
          const h=hash(xx*3+o.w, yy+o.alt);
          px(x,xx,yy,colW-3,linH-4, (h%9===0)?pal[3]:pal[1]);
          px(x,xx,yy,colW-3,1,'rgba(255,255,255,.25)');
        }
      }
      px(x,0,laje,3,fach,pal[2]); px(x,w-3,laje,3,fach,pal[2]);
      // térreo: porta e marquise
      px(x,0,laje+fach-14,w,14,pal[2]);
      px(x,(w/2-10)|0,laje+fach-13,20,13,'#1b1f2a'); px(x,(w/2-9)|0,laje+fach-12,8,12,'#7ec9ef'); px(x,(w/2+1)|0,laje+fach-12,8,12,'#7ec9ef');
      // laje (topo) com borda
      px(x,0,0,w,laje,pal[4]); px(x,0,0,w,3,'#ffffff55'); px(x,0,laje-4,w,4,pal[2]);
      px(x,3,3,w-6,laje-8,pal[4]);
      px(x,8,8,14,10,'#8e979c'); px(x,9,9,12,8,'#a7b0b5');                     // caixa d'água
      if(o.w>=4){ px(x,w-26,10,16,12,'#7d868b'); px(x,w-24,12,12,2,'#5b6266'); px(x,w-24,16,12,2,'#5b6266'); } // ar-condicionado
      if(o.antena){ px(x,(w/2)|0,2,2,laje-10,'#cfd6da'); px(x,(w/2-1)|0,2,4,3,'#ff4040'); }
      if(o.heliponto){ x.strokeStyle='#ffe066'; x.lineWidth=2; x.beginPath(); x.arc(w/2, laje/2, Math.min(w,laje)/3, 0, Math.PI*2); x.stroke(); px(x,(w/2-5)|0,(laje/2-6)|0,2,12,'#ffe066'); px(x,(w/2+3)|0,(laje/2-6)|0,2,12,'#ffe066'); px(x,(w/2-3)|0,(laje/2-1)|0,6,2,'#ffe066'); }
    });
    return { cv:c, a:[w/2, H], col:[-w/2, -(H-4), w, H-6] };
  }

  /* casa: telhado (cor) + parede de tijolo/pedra + porta + janelas */
  function casa(o){
    const w=o.w*T, hTel=(o.tel||2)*T, hPar=(o.par||2)*T, H=hTel+hPar;
    const k='casa_'+[o.w,o.tel,o.par,o.telhado,o.parede,o.porta,o.janelas,o.estilo,o.placa||'',o.chamine?1:0,o.noite||o.acesa?1:0].join('_');
    const c=gerar(k, w, H, (x)=>{
      const bd=img.build;
      // PAREDE (9 fatias do atlas: tijolo vermelho 0,9 · pedra cinza 0,2 · pedra clara gerada)
      const blocos={ tijolo:[0,9], pedra:[0,2] };
      const bl=blocos[o.parede||'tijolo'];
      const nl=o.par||2;
      for(let j=0;j<nl;j++) for(let i=0;i<o.w;i++){
        const yy=hTel+j*T;
        if(bl && bd){
          const col = i===0?0 : i===o.w-1?2 : 1;
          const lin = nl===1?1 : j===0?0 : j===nl-1?2 : 1;
          x.drawImage(bd, (bl[0]+col)*T, (bl[1]+lin)*T, T, T, i*T, yy, T, T);
        } else {
          x.drawImage(gerado(o.parede==='cal'?'cal':'pedra', (i+j)%4), i*T, yy);
        }
      }
      // TELHADO: telha de ardósia do atlas, tingida
      const tint={ ardosia:null, barro:'rgba(176,74,40,.62)', verde:'rgba(46,120,80,.55)', azul:'rgba(48,86,160,.55)',
                   roxo:'rgba(110,50,140,.55)', areia:'rgba(214,180,120,.6)', branco:'rgba(235,235,225,.65)' }[o.telhado||'barro'];
      for(let j=0;j<o.tel;j++) for(let i=0;i<o.w;i++){
        if(bd) x.drawImage(bd, 4*T, 13*T, T, T, i*T, j*T, T, T); else px(x,i*T,j*T,T,T,'#555');
      }
      if(tint){ x.globalCompositeOperation='source-atop'; x.fillStyle=tint; x.fillRect(0,0,w,hTel); x.globalCompositeOperation='source-over'; }
      // cumeeira, beiral e sombra do beiral
      px(x,0,0,w,3,'rgba(255,255,255,.18)');
      px(x,0,(hTel*0.38)|0,w,3,'rgba(0,0,0,.28)'); px(x,0,((hTel*0.38)|0)+3,w,1,'rgba(255,255,255,.15)');
      px(x,0,hTel-5,w,5,'rgba(0,0,0,.35)');
      px(x,0,0,2,hTel,'rgba(0,0,0,.25)'); px(x,w-2,0,2,hTel,'rgba(0,0,0,.25)');
      if(o.chamine){ const cx=(w*0.72)|0; px(x,cx,4,12,18,'#7b3a2a'); px(x,cx-1,2,14,4,'#5a2a1e'); }
      // PORTA e JANELAS
      const pc = o.porta!=null ? o.porta : Math.floor(o.w/2);
      if(bd && pc>=0){
        if(hPar>=2*T) x.drawImage(bd, 3*T, 9*T, T, 2*T, pc*T, H-2*T, T, 2*T);
        else x.drawImage(bd, 3*T, 10*T, T, T, pc*T, H-T, T, T);
      }
      if(o.janelas!==false && bd){
        for(let i=0;i<o.w;i++){
          if(i===pc) continue;
          if(o.w>=3 && (i===0||i===o.w-1) && o.w<5) continue;
          const yy = hPar>=2*T ? H-2*T+6 : H-T+2;
          if(o.noite || o.acesa) x.drawImage(bd, 2*T, 0, T, 40, i*T, yy, T, 40>hPar?hPar-4:40);
          else x.drawImage(bd, 8*T, 9*T+4, T, 30, i*T, yy, T, 30);
        }
      }
      if(o.placa){
        px(x,(w/2-26)|0, hTel+2, 52, 12, '#2b1a0e'); px(x,(w/2-25)|0, hTel+3, 50, 10, '#f4d58a');
        x.fillStyle='#2b1a0e'; x.font='bold 8px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(o.placa, w/2, hTel+8.5);
      }
    });
    const portaX = ((o.porta!=null?o.porta:Math.floor(o.w/2))+0.5)*T - w/2;
    return { cv:c, a:[w/2, H], col:[-w/2, -H+4, w, H-4], porta:portaX };
  }

  /* cúpula dourada com base de pedra e minarete (a "igrejinha da esquina") */
  function cupula(o){
    const w=(o.w||6)*T, H=(o.h||7)*T;
    const c=gerar('cupula_'+o.w+'_'+o.h, w, H, (x)=>{
      const base=H*0.45, by=H-base;
      // base de pedra
      for(let yy=by; yy<H; yy+=8) for(let xx=0; xx<w; xx+=16){ const o2=((yy/8)%2)*8; px(x,xx+o2,yy,15,7,['#e9dcb7','#e2d3aa','#efe3c3'][((xx+yy)/8)%3|0]); }
      px(x,0,by,w,4,'#cdbd92');
      // arcos
      for(let i=0;i<3;i++){ const ax=w*(0.2+i*0.3)-8; px(x,ax,H-30,16,30,'#3b2b1a'); x.fillStyle='#3b2b1a'; x.beginPath(); x.arc(ax+8,H-30,8,Math.PI,0); x.fill(); px(x,ax+2,H-26,12,26,'#5b3b1d'); }
      // tambor
      const tr=w*0.36, cx=w/2, ty=by-6;
      px(x,cx-tr,ty-18,tr*2,24,'#d9c9a0'); for(let i=0;i<8;i++) px(x,cx-tr+6+i*(tr*2-12)/7,ty-14,4,10,'#3a6d8f');
      // cúpula
      const g=x.createLinearGradient(cx-tr,0,cx+tr,0); g.addColorStop(0,'#a27a1c'); g.addColorStop(0.35,'#ffe27a'); g.addColorStop(0.55,'#f2c64a'); g.addColorStop(1,'#8a6214');
      x.fillStyle=g; x.beginPath(); x.ellipse(cx, ty-18, tr, tr*1.05, 0, Math.PI, 0); x.fill();
      px(x,cx-1,ty-18-tr*1.05-14,3,16,'#c8a03a'); x.fillStyle='#ffe27a'; x.beginPath(); x.arc(cx+0.5,ty-18-tr*1.05-16,3,0,Math.PI*2); x.fill();
      // minarete
      const mx=w-22; px(x,mx,H*0.12,14,H*0.88-base+base*0.5,'#e6d8b2'); px(x,mx-2,H*0.30,18,5,'#cdbd92'); px(x,mx+2,H*0.08,10,H*0.06,'#f2c64a');
      x.fillStyle='#f2c64a'; x.beginPath(); x.moveTo(mx,H*0.12); x.lineTo(mx+7,H*0.02); x.lineTo(mx+14,H*0.12); x.fill();
    });
    return { cv:c, a:[w/2,H], col:[-w/2, -H*0.45, w, H*0.45-2] };
  }

  /* Torre do Relógio: torre de pedra alta, relógio parado em 03:33 */
  function torreRelogio(o){
    const w=(o.w||4)*T, H=(o.h||10)*T;
    const c=gerar('torre_'+w+'_'+H+'_'+(o.hora||'333'), w, H, (x)=>{
      const topo=H*0.18;
      for(let yy=topo; yy<H; yy+=8) for(let xx=0; xx<w; xx+=16){ const o2=((yy/8)%2)*8; px(x,xx+o2-8,yy,15,7,['#cfc2a0','#c6b892','#d8cba9'][((xx+yy)/8)%3|0]); }
      px(x,0,topo,4,H-topo,'#a89a77'); px(x,w-4,topo,4,H-topo,'#a89a77');
      // telhado pontudo
      x.fillStyle='#5b3b6b'; x.beginPath(); x.moveTo(-2,topo+6); x.lineTo(w/2,0); x.lineTo(w+2,topo+6); x.fill();
      x.fillStyle='#7a5390'; x.beginPath(); x.moveTo(w/2,0); x.lineTo(w+2,topo+6); x.lineTo(w/2,topo+6); x.fill();
      // relógio
      const cy=topo+w*0.55, r=w*0.36;
      x.fillStyle='#3b2b1a'; x.beginPath(); x.arc(w/2,cy,r+4,0,Math.PI*2); x.fill();
      x.fillStyle='#f5ecd2'; x.beginPath(); x.arc(w/2,cy,r,0,Math.PI*2); x.fill();
      x.fillStyle='#3b2b1a'; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; px(x, w/2+Math.sin(a)*(r-4)-1, cy-Math.cos(a)*(r-4)-1, 2, 2, '#3b2b1a'); }
      const hh=(o.hora||'333'), hr=+hh[0], mn=+(hh.slice(1));
      const am=mn/60*Math.PI*2, ah=(hr%12+mn/60)/12*Math.PI*2;
      x.strokeStyle='#1b1208'; x.lineWidth=3; x.beginPath(); x.moveTo(w/2,cy); x.lineTo(w/2+Math.sin(ah)*r*0.5, cy-Math.cos(ah)*r*0.5); x.stroke();
      x.lineWidth=2; x.beginPath(); x.moveTo(w/2,cy); x.lineTo(w/2+Math.sin(am)*r*0.8, cy-Math.cos(am)*r*0.8); x.stroke();
      // janelas e porta
      for(let j=0;j<3;j++) px(x,w/2-5,cy+r+18+j*36,10,16,'#2b2233');
      px(x,w/2-14,H-40,28,40,'#3b2b1a'); px(x,w/2-11,H-37,22,37,'#6b4224'); px(x,w/2-1,H-37,2,37,'#3b2b1a');
    });
    return { cv:c, a:[w/2,H], col:[-w/2, -T*2.2, w, T*2.2-2] };
  }

  /* prédio do Laboratório 5000Z (fachada de concreto com letreiro) */
  function laboratorio(o){
    const w=(o.w||10)*T, H=(o.h||7)*T;
    const c=gerar('lab_'+w+'_'+H, w, H, (x)=>{
      const laje=H*0.42;
      px(x,0,0,w,laje,'#8d969b'); px(x,4,4,w-8,laje-10,'#a3acb1'); px(x,0,laje-6,w,6,'#5c6469');
      for(let i=0;i<4;i++) px(x,16+i*(w-48)/3,12,22,14,'#6e777c');
      px(x,w-46,laje-36,30,22,'#c2c9cc'); px(x,w-40,laje-30,18,4,'#5c6469');
      px(x,0,laje,w,H-laje,'#b7bfc2');
      for(let i=0;i<w;i+=32) px(x,i,laje,1,H-laje,'#a0a8ab');
      px(x,0,laje,w,6,'#d4dadc');
      for(let i=0;i<Math.floor(w/48);i++){ if(Math.abs(24+i*48-w/2)<40) continue; px(x,16+i*48,laje+22,30,22,'#28323a'); px(x,18+i*48,laje+24,26,8,'#4f8fb0'); }
      // letreiro
      px(x,w/2-56,laje+6,112,14,'#1b2026'); x.fillStyle='#7fe3ff'; x.font='bold 9px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('LAB · 5000Z', w/2, laje+13.5);
      // portão
      px(x,w/2-26,H-44,52,44,'#2a3138'); px(x,w/2-22,H-40,44,40,'#58656e'); for(let j=0;j<5;j++) px(x,w/2-22,H-36+j*8,44,2,'#46525a');
      px(x,w/2-2,H-40,4,40,'#ffcc33');
    });
    return { cv:c, a:[w/2,H], col:[-w/2, -H+6, w, H-8] };
  }

  /* barraca do mercado: toldo listrado + caixotes */
  function barraca(o){
    const cores={ verm:['#c4352f','#f2ece0'], azul:['#2f5fc4','#f2ece0'], verde:['#2f9a4a','#f6efd8'], amar:['#e0a92a','#7a3a1a'] }[o.cor||'verm'];
    const c=gerar('barraca_'+(o.cor||'verm')+'_'+(o.item||'fruta'), 72, 64, (x)=>{
      px(x,6,30,60,30,'#7a5230'); px(x,8,32,56,10,'#8d6038');
      const it={ fruta:['#f28b1c','#e8e03a','#d9302a','#7ec23a'], peixe:['#9fb7c4','#c6d4dc','#7d96a3','#b3c7d1'], pao:['#d9a45a','#c98e40','#e6b876','#b77a32'], tecido:['#b03aa0','#3aa0b0','#e0c040','#e05a3a'] }[o.item||'fruta'];
      for(let i=0;i<10;i++) px(x,10+(i%5)*11,33+((i/5)|0)*5,8,4,it[i%4]);
      px(x,4,4,2,40,'#5a3a1e'); px(x,66,4,2,40,'#5a3a1e');
      for(let i=0;i<8;i++) px(x,i*9,2,9,22,cores[i%2]);
      for(let i=0;i<8;i++){ x.fillStyle=cores[i%2]; x.beginPath(); x.arc(i*9+4.5,24,4.5,0,Math.PI); x.fill(); }
      px(x,0,0,72,3,'rgba(0,0,0,.3)');
    });
    return { cv:c, a:[36,60], col:[-32,-28,64,26] };
  }

  function conteiner(x, cor, escuro){
    px(x,0,8,64,36,cor); for(let i=2;i<62;i+=5) px(x,i,10,2,32,escuro); px(x,0,0,64,10,escuro); px(x,0,0,64,2,'rgba(255,255,255,.25)');
    px(x,0,42,64,2,'#1b1f22'); px(x,52,14,8,24,'rgba(0,0,0,.18)');
  }
  /* peças pequenas desenhadas (banco, relógio de rua, cartaz, terminal…) */
  function peca(nome){
    const P = {
      banco:   [40,24,(x)=>{ px(x,2,6,36,6,'#8a5a32'); px(x,2,13,36,5,'#7a4e2a'); px(x,4,18,3,6,'#3b3b44'); px(x,33,18,3,6,'#3b3b44'); }, [20,23], [-18,-8,36,7]],
      relogio_rua: [18,58,(x)=>{ px(x,8,16,3,42,'#2c3a33'); px(x,6,54,7,4,'#1f2924'); x.fillStyle='#2c3a33'; x.beginPath(); x.arc(9.5,10,9,0,Math.PI*2); x.fill(); x.fillStyle='#f5ecd2'; x.beginPath(); x.arc(9.5,10,7,0,Math.PI*2); x.fill(); x.strokeStyle='#111'; x.lineWidth=1.5; x.beginPath(); x.moveTo(9.5,10); x.lineTo(13,9); x.moveTo(9.5,10); x.lineTo(12,15.5); x.stroke(); }, [9,57], [-4,-4,8,4]],
      cartaz:  [26,40,(x)=>{ px(x,11,22,4,18,'#4a3a2a'); px(x,0,0,26,24,'#3b1d4f'); px(x,2,2,22,20,'#c9a0e8'); px(x,8,5,10,9,'#5b2a7a'); px(x,10,3,6,3,'#ffd34a'); px(x,5,16,16,2,'#5b2a7a'); }, [13,39], [-4,-4,8,4]],
      cartaz_procura: [26,40,(x)=>{ px(x,11,22,4,18,'#4a3a2a'); px(x,0,0,26,24,'#5a3a1a'); px(x,2,2,22,20,'#efe2bf'); px(x,4,3,18,3,'#7a2a1a'); px(x,8,8,10,8,'#3a3a3a'); px(x,5,18,16,1,'#7a2a1a'); }, [13,39], [-4,-4,8,4]],
      terminal:[30,40,(x)=>{ px(x,3,8,24,30,'#3a4248'); px(x,0,4,30,22,'#4f5960'); px(x,3,7,24,15,'#0e1a12'); px(x,5,9,12,2,'#6cff9a'); px(x,5,13,18,2,'#3bd17a'); px(x,5,17,8,2,'#6cff9a'); px(x,5,30,20,4,'#2a3035'); }, [15,38], [-14,-12,28,11]],
      capsula: [40,72,(x)=>{ px(x,4,58,32,12,'#5c6469'); px(x,6,4,28,56,'#1d3a35'); px(x,8,6,24,52,'rgba(120,255,200,.35)'); px(x,10,8,4,48,'rgba(255,255,255,.35)'); px(x,4,0,32,8,'#7a8389'); px(x,8,60,24,3,'#ffcc33'); }, [20,70], [-18,-14,36,13]],
      capsula_aberta: [40,72,(x)=>{ px(x,4,58,32,12,'#5c6469'); px(x,6,4,28,56,'#22302e'); px(x,9,10,22,46,'#16201f'); px(x,4,0,32,8,'#7a8389'); px(x,30,6,8,52,'rgba(160,255,220,.25)'); px(x,8,60,24,3,'#ff5a33'); }, [20,70], [-18,-14,36,13]],
      prototipo: [40,30,(x)=>{ px(x,4,14,30,12,'#6b7378'); px(x,8,10,16,8,'#848c91'); px(x,26,8,10,10,'#5c6469'); px(x,28,11,6,3,'#2a2f33'); px(x,2,24,10,4,'#4a5155'); px(x,14,20,4,3,'#c9302a'); px(x,22,4,2,6,'#9aa2a7'); }, [20,28], [-18,-10,36,9]],
      bancada: [64,40,(x)=>{ px(x,0,10,64,8,'#8d969b'); px(x,0,18,64,4,'#5c6469'); px(x,4,22,4,18,'#4a5155'); px(x,56,22,4,18,'#4a5155'); px(x,8,4,10,6,'#c9302a'); px(x,22,2,14,8,'#3a4248'); px(x,24,3,10,5,'#6cff9a'); px(x,44,5,12,5,'#d9a441'); }, [32,39], [-31,-22,62,20]],
      tanque: [36,64,(x)=>{ px(x,4,8,28,52,'#3a5a6a'); px(x,6,10,24,48,'rgba(90,200,255,.45)'); px(x,8,40,20,18,'rgba(60,255,160,.35)'); px(x,2,4,32,6,'#7a8389'); px(x,2,58,32,6,'#5c6469'); px(x,10,14,3,40,'rgba(255,255,255,.3)'); }, [18,63], [-16,-12,32,11]],
      armario: [32,52,(x)=>{ px(x,0,0,32,52,'#5c6469'); px(x,2,2,13,48,'#7a8389'); px(x,17,2,13,48,'#7a8389'); px(x,13,22,2,6,'#2a2f33'); px(x,17,22,2,6,'#2a2f33'); }, [16,51], [-16,-12,32,11]],
      caixa:   [30,30,(x)=>{ px(x,0,4,30,26,'#9a6a3a'); px(x,0,4,30,4,'#b98a52'); px(x,2,10,26,2,'#7a4e2a'); px(x,2,20,26,2,'#7a4e2a'); }, [15,29], [-15,-12,30,11]],
      cabos:   [64,20,(x)=>{ x.strokeStyle='#222'; x.lineWidth=3; x.beginPath(); x.moveTo(0,10); x.bezierCurveTo(16,0,30,20,64,8); x.stroke(); x.strokeStyle='#c9302a'; x.lineWidth=2; x.beginPath(); x.moveTo(0,14); x.bezierCurveTo(20,20,40,2,64,14); x.stroke(); }, [32,19], null],
      transformador: [44,52,(x)=>{ px(x,4,10,36,40,'#5f6b70'); px(x,8,14,28,30,'#717d82'); for(let i=0;i<4;i++) px(x,8,16+i*7,28,2,'#4d575b'); px(x,10,0,4,12,'#cfd6da'); px(x,30,0,4,12,'#cfd6da'); px(x,14,40,16,6,'#ffcc33'); px(x,18,41,8,4,'#1b1f22'); }, [22,51], [-20,-14,40,13]],
      boia:    [24,24,(x)=>{ x.strokeStyle='#e8442a'; x.lineWidth=5; x.beginPath(); x.arc(12,12,8,0,Math.PI*2); x.stroke(); x.strokeStyle='#fff'; x.setLineDash([4,5]); x.beginPath(); x.arc(12,12,8,0,Math.PI*2); x.stroke(); }, [12,22], null],
      barco:   [96,40,(x)=>{ x.fillStyle='#7a4e2a'; x.beginPath(); x.moveTo(0,10); x.lineTo(96,10); x.lineTo(84,36); x.lineTo(10,36); x.fill(); px(x,6,12,84,6,'#9a6a3a'); px(x,40,0,4,14,'#5a3a1e'); px(x,8,18,80,2,'#f2ece0'); }, [48,38], [-46,-26,92,24]],
      lampiao: [20,48,(x)=>{ px(x,8,14,4,34,'#2c2c34'); px(x,4,44,12,4,'#1c1c22'); px(x,3,2,14,14,'#2c2c34'); px(x,5,4,10,10,'#ffd36a'); px(x,7,6,3,6,'#fff6c2'); }, [10,47], [-5,-5,10,4]],
      engrenagem: [32,32,(x)=>{ x.fillStyle='#8a6a32'; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; px(x,16+Math.cos(a)*12-3,16+Math.sin(a)*12-3,6,6,'#8a6a32'); } x.beginPath(); x.arc(16,16,11,0,Math.PI*2); x.fill(); x.fillStyle='#5a4420'; x.beginPath(); x.arc(16,16,4,0,Math.PI*2); x.fill(); }, [16,30], [-12,-10,24,9]],
      igreja_placa: [34,22,(x)=>{ px(x,0,0,34,16,'#3b2b1a'); px(x,1,1,32,14,'#f2e6c4'); x.fillStyle='#3b2b1a'; x.font='bold 6px monospace'; x.textAlign='center'; x.fillText('IGREJINHA',17,7); x.fillText('(SIC)',17,13); px(x,15,16,4,6,'#3b2b1a'); }, [17,21], null],
      arco_portao: [112,56,(x)=>{ px(x,0,0,112,18,'#efe7cf'); px(x,0,14,112,4,'#cfc4a5'); for(let i=0;i<7;i++) px(x,4+i*16,0,10,6,'#f8f2e0');
        px(x,0,18,14,38,'#e2d8bd'); px(x,98,18,14,38,'#e2d8bd'); x.fillStyle='#efe7cf'; x.beginPath(); x.moveTo(14,18); x.quadraticCurveTo(56,52,98,18); x.lineTo(98,26); x.quadraticCurveTo(56,58,14,26); x.fill();
        px(x,0,52,14,4,'#bfb293'); px(x,98,52,14,4,'#bfb293'); }, [56,55], null],
      quadro_recompensa: [48,48,(x)=>{ px(x,6,30,4,18,'#4a3a2a'); px(x,38,30,4,18,'#4a3a2a'); px(x,0,0,48,34,'#5a3a1a'); px(x,3,3,42,28,'#8a6a3a');
        px(x,6,6,11,13,'#efe2bf'); px(x,19,5,11,14,'#f3e7c6'); px(x,32,7,11,12,'#efe2bf'); px(x,10,20,13,9,'#e8d9b0'); px(x,27,21,12,8,'#f3e7c6'); px(x,8,8,7,2,'#7a2a1a'); px(x,21,7,7,2,'#7a2a1a'); px(x,34,9,7,2,'#7a2a1a'); }, [24,47], [-22,-10,44,9]],
      foto: [20,16,(x)=>{ px(x,0,0,20,16,'#5a3a1a'); px(x,2,2,16,12,'#e6dcc0'); px(x,4,6,4,6,'#3b2414'); px(x,11,5,5,7,'#3b2414'); px(x,11,6,5,2,'#111'); }, [10,15], null],
      rodo_suporte: [20,40,(x)=>{ px(x,2,6,16,4,'#5a3a1a'); px(x,4,10,2,8,'#5a3a1a'); px(x,14,10,2,8,'#5a3a1a'); px(x,8,14,4,26,'rgba(0,0,0,.18)'); }, [10,39], null],
      portao_grade: [96,72,(x)=>{ px(x,0,0,96,8,'#3a3f45'); px(x,0,64,96,8,'#2a2e33'); for(let i=0;i<12;i++){ px(x,4+i*8,4,3,64,'#4d555c'); px(x,4+i*8,4,1,64,'#7a838a'); } px(x,0,30,96,5,'#3a3f45'); px(x,40,24,16,16,'#8a6a32'); px(x,45,29,6,6,'#2a2e33'); }, [48,71], [-48,-14,96,13]],
      guarda_sol: [44,46,(x)=>{ px(x,21,16,2,30,'#e9e4d0'); x.fillStyle='#e8442a'; x.beginPath(); x.moveTo(0,18); x.quadraticCurveTo(22,-6,44,18); x.fill(); x.fillStyle='#f6efd8'; for(let i=0;i<4;i++){ x.beginPath(); x.moveTo(5+i*11,17); x.lineTo(11+i*11,6); x.lineTo(16+i*11,17); x.fill(); } sombra(x,22,43,14,3); }, [22,45], [-3,-4,6,3]],
      torre_salva: [44,72,(x)=>{ px(x,6,30,4,42,'#c9c2b0'); px(x,34,30,4,42,'#c9c2b0'); px(x,6,50,32,3,'#c9c2b0'); px(x,2,14,40,18,'#f2ece0'); px(x,2,10,40,5,'#e8442a'); px(x,8,18,28,8,'#3a6d8f'); px(x,20,0,4,12,'#e9e4d0'); px(x,24,0,12,6,'#e8442a'); }, [22,71], [-18,-8,36,7]],
      luneta: [24,40,(x)=>{ px(x,11,16,3,24,'#3a3f45'); px(x,6,36,13,4,'#2a2e33'); x.save(); x.translate(12,14); x.rotate(-0.35); px(x,-9,-4,20,7,'#5c6469'); px(x,9,-5,5,9,'#7a838a'); x.restore(); }, [12,39], [-5,-4,10,4]],
      brilho: [16,16,(x)=>{ px(x,7,0,2,16,'rgba(255,240,150,.9)'); px(x,0,7,16,2,'rgba(255,240,150,.9)'); px(x,5,5,6,6,'#fff6c2'); px(x,6,6,4,4,'#ffe066'); }, [8,15], null],
      placa_madeira: [28,34,(x)=>{ px(x,12,14,4,20,'#5a3a1e'); px(x,0,0,28,16,'#5a3a1e'); px(x,2,2,24,12,'#a97a45'); px(x,5,5,18,2,'#5a3a1e'); px(x,5,9,12,2,'#5a3a1e'); }, [14,33], [-4,-4,8,4]],
      cartaz_rainha: [28,44,(x)=>{ px(x,12,24,4,20,'#3a2a3a'); px(x,0,0,28,26,'#2a0f3a'); px(x,2,2,24,22,'#7a3aa8'); x.fillStyle='#ffd34a'; x.beginPath(); x.moveTo(6,10); x.lineTo(9,4); x.lineTo(14,8); x.lineTo(19,4); x.lineTo(22,10); x.fill(); px(x,6,10,16,3,'#ffd34a'); px(x,9,15,10,6,'#e8d9f5'); px(x,11,17,2,2,'#2a0f3a'); px(x,15,17,2,2,'#2a0f3a'); }, [14,43], [-4,-4,8,4]],
      sacola_pao: [20,20,(x)=>{ px(x,3,6,14,14,'#d9b27a'); px(x,3,6,14,2,'#b98a52'); px(x,6,0,3,9,'#e0a24a'); px(x,10,1,3,8,'#c98e40'); }, [10,19], null],
      container_vermelho: [64,44,(x)=>conteiner(x,'#b8402e','#8a2a1e'), [32,43], [-31,-16,62,15]],
      container_azul:     [64,44,(x)=>conteiner(x,'#2e6ab8','#1e4a8a'), [32,43], [-31,-16,62,15]],
      container_verde:    [64,44,(x)=>conteiner(x,'#3a9a52','#26703a'), [32,43], [-31,-16,62,15]],
      guindaste: [96,160,(x)=>{ px(x,40,40,10,116,'#e0a92a'); for(let j=44;j<150;j+=10){ px(x,40,j,10,2,'#9a7020'); } px(x,30,148,30,12,'#5c6469');
        px(x,0,30,96,8,'#e0a92a'); for(let i=2;i<94;i+=8) px(x,i,32,2,4,'#9a7020'); px(x,36,18,18,14,'#3a3f45'); px(x,40,21,10,6,'#7fd8ff');
        px(x,80,38,2,50,'#222'); px(x,74,86,14,8,'#5c6469'); }, [45,159], [-16,-12,32,11]],
      farol: [40,112,(x)=>{ for(let j=20;j<104;j+=14) px(x,8,j,24,7,'#c9302a'); for(let j=27;j<104;j+=14) px(x,8,j,24,7,'#f2ece0');
        px(x,6,104,28,8,'#5c6469'); px(x,10,8,20,14,'#2a2e33'); px(x,12,10,16,10,'#ffe9a3'); px(x,8,4,24,5,'#c9302a'); px(x,18,0,4,5,'#2a2e33'); }, [20,111], [-14,-10,28,9]],
      galpao: [128,96,(x)=>{ px(x,0,36,128,60,'#8d969b'); for(let i=0;i<128;i+=8) px(x,i,36,4,60,'#9fa8ad');
        x.fillStyle='#5c6469'; x.beginPath(); x.moveTo(-2,38); x.lineTo(64,6); x.lineTo(130,38); x.fill(); px(x,0,36,128,4,'#3a3f45');
        px(x,44,58,40,38,'#3a3f45'); for(let j=0;j<5;j++) px(x,44,60+j*7,40,2,'#2a2e33'); px(x,100,0,12,30,'#7b3a2a'); px(x,98,0,16,4,'#5a2a1e'); }, [64,95], [-64,-58,128,56]],
      quiosque: [64,64,(x)=>{ px(x,6,30,52,30,'#8a5a32'); px(x,10,34,44,10,'#d9a441'); for(let i=0;i<8;i++) px(x,i*8,6,8,26,i%2?'#2ab0c0':'#f2ece0');
        x.fillStyle='#2ab0c0'; x.beginPath(); x.moveTo(-2,8); x.lineTo(32,0); x.lineTo(66,8); x.fill(); px(x,22,44,20,4,'#f28b1c'); px(x,26,40,4,4,'#e8442a'); px(x,34,40,4,4,'#7ec23a'); }, [32,62], [-28,-30,56,28]],
      toalha: [26,40,(x)=>{ for(let j=0;j<40;j+=6) px(x,0,j,26,6,j%12?'#e8442a':'#f6efd8'); }, [13,39], null],
      canteiro: [64,28,(x)=>{ px(x,0,8,64,20,'#7a5a3a'); px(x,2,10,60,16,'#5a3a1e'); const c=['#e8442a','#ffe066','#c46bff','#ff8ab0','#f2ece0'];
        for(let i=0;i<14;i++){ px(x,4+i*4,(i%2)*4+6,3,8,'#3a8a32'); px(x,3+i*4,(i%2)*4+4,5,4,c[i%5]); } }, [32,27], [-32,-12,64,12]],
      ponto_onibus: [64,56,(x)=>{ px(x,4,10,4,46,'#3a3f45'); px(x,56,10,4,46,'#3a3f45'); px(x,0,4,64,8,'#2e6ab8'); px(x,8,14,48,26,'rgba(160,220,255,.35)'); px(x,10,40,44,6,'#8a5a32');
        px(x,58,0,16,14,'#ffe066'); x.fillStyle='#000'; x.font='bold 8px monospace'; x.fillText('333',58,10); }, [32,55], [-30,-12,60,10]],
      mesa_cafe: [44,36,(x)=>{ px(x,18,14,8,20,'#3a3f45'); x.fillStyle='#f2ece0'; x.beginPath(); x.ellipse(22,12,18,7,0,0,Math.PI*2); x.fill(); px(x,0,22,8,12,'#8a5a32'); px(x,36,22,8,12,'#8a5a32'); px(x,18,8,6,4,'#5a3a1e'); }, [22,35], [-20,-10,40,9]],
      banca_jornal: [56,56,(x)=>{ px(x,0,14,56,40,'#2a6a3a'); px(x,0,10,56,6,'#1e4a2a'); px(x,4,20,48,18,'#f2ece0'); for(let i=0;i<6;i++) px(x,6+i*8,22,6,14,['#e8442a','#2e6ab8','#ffe066','#7a3aa8','#3a9a52','#f28b1c'][i]); px(x,20,42,16,12,'#1e4a2a'); }, [28,55], [-26,-20,52,18]],
      chamine: [24,64,(x)=>{ px(x,4,8,16,56,'#7b3a2a'); px(x,2,4,20,6,'#5a2a1e'); for(let j=14;j<60;j+=8) px(x,4,j,16,1,'#5a2a1e'); }, [12,63], [-9,-8,18,7]],
      cupula_pequena: [64,72,(x)=>{ for(let yy=34;yy<72;yy+=8) for(let xx=0;xx<64;xx+=16){ const o2=((yy/8)%2)*8; px(x,xx+o2-8,yy,15,7,['#efe7cf','#e6dcc2','#f4ecd6'][((xx+yy)/8)%3|0]); }
        x.fillStyle='#f4f0e6'; x.beginPath(); x.ellipse(32,34,22,24,0,Math.PI,0); x.fill(); x.fillStyle='#d8d0bc'; x.beginPath(); x.ellipse(40,34,10,22,0,Math.PI*1.5,0); x.fill(); px(x,30,4,4,8,'#c9a03a'); px(x,24,52,16,20,'#3b2b1a'); }, [32,71], [-32,-36,64,34]],
      gerador: [56,44,(x)=>{ px(x,2,8,52,34,'#4d575b'); px(x,6,12,44,22,'#5f6b70'); for(let i=0;i<5;i++) px(x,8+i*9,14,6,18,'#3d4549'); px(x,40,2,8,8,'#ffcc33'); px(x,2,40,52,4,'#2a2f33'); }, [28,43], [-26,-16,52,14]]
    };
    const p=P[nome] || EXTRA[nome]; if(!p) return null;
    // peças novas ganham o contorno escuro de pixel art (combina com os móveis dos atlas)
    const contorno = !P[nome] && !(p[5] && (p[5].semContorno || p[5].chao));
    const cv=gerar('peca_'+nome, p[0], p[1], (x,w,h)=>{ p[2](x,w,h); if(contorno) contornar(x.canvas, '#1c1622', 110); });
    return { cv, a:p[3], col:p[4], luz:p[5]&&p[5].luz, chao:p[5]&&p[5].chao };
  }

  /* SPR com `auto:true`: o retângulo é APROXIMADO e é aparado pelo alfa na
     primeira vez que o sprite é usado (com o atlas já carregado). Âncora
     nos pés = meio de baixo; colisão = `colFrac` de baixo da figura
     (móvel visto de cima ocupa o chão quase todo; padrão 0,45). */
  function aparar(s){
    const im=img[s.img]; if(!im) return false;
    const [x0,y0,w,h]=s.r, c=tela(w,h), x=c.getContext('2d'); x.drawImage(im,x0,y0,w,h,0,0,w,h);
    let d=null; try{ d=x.getImageData(0,0,w,h).data; }catch(e){ s._ok=true; return true; }
    let mnx=1e9,mny=1e9,mxx=-1,mxy=-1;
    for(let j=0;j<h;j++) for(let i=0;i<w;i++) if(d[(j*w+i)*4+3]>16){ if(i<mnx)mnx=i; if(i>mxx)mxx=i; if(j<mny)mny=j; if(j>mxy)mxy=j; }
    if(mxx>=0) s.r=[x0+mnx, y0+mny, mxx-mnx+1, mxy-mny+1];
    const W=s.r[2], H=s.r[3];
    if(!s.a) s.a=[Math.round(W/2), H-1];
    if(s.col===undefined){ const f=s.colFrac!=null?s.colFrac:0.45, ch=Math.max(6, Math.round(H*f)); s.col = s.semCol ? null : [-Math.round(W/2)+2, -ch, W-4, ch-1]; }
    s._ok=true; return true;
  }
  /* resolve um nome de sprite → { cv|img, r, a, col, anim } pronto pra desenhar */
  function sprite(nome){
    if(SPR[nome]){ const s=SPR[nome]; if(s.auto && !s._ok) aparar(s); return { im:img[s.img], r:s.r, a:s.a, col:s.col, anim:s.anim, chao:s.chao, luz:s.luz }; }
    const g=peca(nome); if(g) return { im:g.cv, r:[0,0,g.cv.width,g.cv.height], a:g.a, col:g.col, luz:g.luz, chao:g.chao };
    return null;
  }
  /* peças registradas por outros arquivos (js/ow_arte_extra.js) */
  const EXTRA = {};
  function novaPeca(nome, w, h, fn, a, col, extra){ EXTRA[nome]=[w,h,fn,a,col,extra||{}]; }
  function pecaChao(nome){ if(EXTRA[nome]) EXTRA[nome][5].chao=true; }
  function pecaSemContorno(nome){ if(EXTRA[nome]) EXTRA[nome][5].semContorno=true; }

  /* ============================================================
     3. PERSONAGENS VISTOS DE CIMA
     ============================================================ */
  // id do elenco → arquivo da folha (o do Lambança tem nome curto) + altura em tiles
  const FOLHAS = {
    mecas:'mecas', cargas:'cargas', hans_lambanca:'lambanca', marcelao_black_jw:'marcelao_black_jw',
    strong_smerg:'strong_smerg', serrinha_dog:'serrinha_dog', fat_mango:'fat_mango', matheus_limeira2:'mameluco',
    careca:'careca', tupas:'tupas', smergula:'smergula', fat_smerg:'fat_smerg', smerg_normal:'smerg_normal',
    smergulao:'smergulao', crianca_rosa:'crianca_rosa', ursao:'ursao', cabelin:'cabelin',
    adulto_feliz:'adulto_feliz', fat_girl:'fat_girl', loirinha_cdi:'loirinha_cdi',
    orelha:'orelha'          // o Cachorro Orelha (antes da maldição) — folha gerada no Gemini
  };
  const ALTURA = { crianca_rosa:1.35, smergulao:2.15, ursao:2.0, fat_smerg:1.85, fat_mango:1.85, strong_smerg:1.9,
                   serrinha_dog:1.45, smerg_normal:1.6, smergula:1.95, orelha:1.15 };
  const DIRS = ['baixo','esquerda','direita','cima'];
  const bonecos = {};

  /* recorta e reduz a folha (uma vez por personagem) */
  function prepararFolha(id, im){
    const cw=im.width/3, ch=im.height/4;
    const alvoH = (ALTURA[id]||1.75)*T;
    // lê o alfa da folha inteira uma vez
    const c0=tela(im.width, im.height), x0=c0.getContext('2d'); x0.drawImage(im,0,0);
    let dados=null; try{ dados=x0.getImageData(0,0,im.width,im.height).data; }catch(e){}
    const caixa=(col,lin)=>{
      const sx=Math.round(col*cw), sy=Math.round(lin*ch), w=Math.round(cw), h=Math.round(ch);
      if(!dados) return {x:sx,y:sy,w,h};
      let mnx=1e9,mny=1e9,mxx=-1,mxy=-1;
      for(let y=sy;y<sy+h;y+=2) for(let x=sx;x<sx+w;x+=2){ if(dados[(y*im.width+x)*4+3]>40){ if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y; } }
      if(mxx<0) return {x:sx,y:sy,w,h};
      return { x:Math.max(sx,mnx-2), y:Math.max(sy,mny-2), w:Math.min(sx+w,mxx+3)-Math.max(sx,mnx-2), h:Math.min(sy+h,mxy+3)-Math.max(sy,mny-2), cx:sx+w/2 };
    };
    const ref=caixa(1,0);
    const s=alvoH/ref.h;
    const frames=[];
    for(let lin=0;lin<4;lin++){
      frames[lin]=[];
      for(let col=0;col<3;col++){
        const b=caixa(col,lin);
        const ow=Math.max(1,Math.round(b.w*s)), oh=Math.max(1,Math.round(b.h*s));
        // redução em etapas de ½ (fica bem melhor que um salto só)
        let src=c0, sx=b.x, sy=b.y, sw=b.w, sh=b.h;
        while(sw/2>ow*1.6){
          const t2=tela(sw/2, sh/2), tx=t2.getContext('2d'); tx.imageSmoothingEnabled=true; tx.imageSmoothingQuality='high';
          tx.drawImage(src, sx, sy, sw, sh, 0, 0, t2.width, t2.height);
          src=t2; sx=0; sy=0; sw=t2.width; sh=t2.height;
        }
        const cv=tela(ow, oh), cx=cv.getContext('2d'); cx.imageSmoothingEnabled=true; cx.imageSmoothingQuality='high';
        cx.drawImage(src, sx, sy, sw, sh, 0, 0, ow, oh);
        const centro = (b.cx!=null ? b.cx : b.x+b.w/2);
        frames[lin][col]={ cv, ax:(centro-b.x)*s, ay:oh-1 };
      }
    }
    alinharLados(frames, FOLHAS[id] || (TINTA[id] && TINTA[id].arq) || id);
    return frames;
  }

  /* As folhas geradas por IA às vezes trazem, na fileira "esquerda" ou
     "direita", um quadro virado pro lado OPOSTO (quase sempre o do meio,
     "parado"). Andando, o boneco ficava virando de um lado pro outro.
     Cada quadro de lado tem a direção detectada pela cabeça (`olharEsq`)
     e o que estiver ao contrário é espelhado. */
  function espelharQuadro(q){ const c=tela(q.cv.width,q.cv.height), x=c.getContext('2d'); x.translate(c.width,0); x.scale(-1,1); x.drawImage(q.cv,0,0); return { cv:c, ax:q.cv.width-q.ax, ay:q.ay }; }
  /* Pra onde cada quadro de LADO de cada folha olha DE VERDADE (conferido
     à mão, quadro por quadro): [fileira "esquerda", fileira "direita"],
     uma letra por coluna — L = esquerda, R = direita, F = de frente.
     Folha que não está aqui é tratada como certa (LLL / RRR). */
  const LADOS = {
    mecas:['LRR','LRR'], cargas:['RRR','RRR'], lambanca:['LLR','LRR'], marcelao_black_jw:['LLR','RRR'],
    strong_smerg:['LRR','LRR'], serrinha_dog:['LRR','LLL'], fat_mango:['RRR','RRR'], mameluco:['LFL','RFR'],
    careca:['LLR','LRR'], tupas:['LRL','RRR'], smergula:['LLR','LRR'], fat_smerg:['LFR','RRR'],
    smerg_normal:['LRR','LRR'], smergulao:['LLL','RFR'], crianca_rosa:['LLR','RRR'], cabelin:['LRR','LRR'],
    // gente gerada no Gemini (assets/topdown/npc_N_topdown.png)
    npc_0:['LLL','LLL'], npc_1:['LLL','RRR'], npc_2:['LLL','RRR'], npc_3:['LLL','RRR'], npc_4:['LLL','RRR'], npc_5:['LLL','RRR'], npc_6:['LLL','RRR'], npc_7:['LRR','RRR'], npc_8:['LLL','RRR'], npc_9:['LLL','RRR'], npc_16:['RRR','LLL'], npc_17:['LRR','RRR'],
    orelha:['LLR','LRR']
  };
  function alinharLados(frames, chave){
    const t=LADOS[chave]; if(!t) return;
    const orig=[frames[1].slice(), frames[2].slice()];
    const pega=(lin,col,quer)=>{               // o quadro (lin,col) virado pra `quer`
      const f=t[lin][col];
      if(f===quer) return orig[lin][col];
      if(f!=='F') return espelharQuadro(orig[lin][col]);
      const o=1-lin, g=t[o][col];               // quadro de frente: usa o da outra fileira
      return g===quer ? orig[o][col] : g==='F' ? orig[lin][col] : espelharQuadro(orig[o][col]);
    };
    for(let c=0;c<3;c++){ frames[1][c]=pega(0,c,'L'); frames[2][c]=pega(1,c,'R'); }
  }

  /* ROBÔS = protótipos do Mecas: usam a MESMA folha dele, tingida (aço,
     gelo, ferrugem) pra dar pra distinguir do herói no meio da rua. */
  const TINTA = {
    robo:       { arq:'mecas', cor:'#8a98a8', alfa:0.9, luz:'rgba(120,140,170,.18)' },
    sentinela:  { arq:'mecas', cor:'#7fd4ff', alfa:0.85, luz:'rgba(190,240,255,.22)' },
    robo_orfao: { arq:'mecas', cor:'#b0503a', alfa:0.8, luz:'rgba(60,20,10,.15)' },
    androide:   { arq:'mecas', cor:'#e8f6ff', alfa:0.75, luz:'rgba(160,240,255,.22)' },
    colosso:    { arq:'mecas', cor:'#9fe0ff', alfa:0.85, luz:'rgba(220,250,255,.3)' },
    colosso_orfao:{ arq:'mecas', cor:'#a0482e', alfa:0.85, luz:'rgba(40,10,0,.2)' }
  };
  ALTURA.sentinela = 1.9; ALTURA.colosso = 3.3; ALTURA.colosso_orfao = 3.3;
  function tingir(im, t){
    const c=tela(im.width, im.height), x=c.getContext('2d');
    x.drawImage(im,0,0);
    x.globalCompositeOperation='color'; x.globalAlpha=t.alfa; x.fillStyle=t.cor; x.fillRect(0,0,c.width,c.height);
    x.globalAlpha=1; x.globalCompositeOperation='source-over'; x.fillStyle=t.luz; x.fillRect(0,0,c.width,c.height);
    x.globalCompositeOperation='destination-in'; x.drawImage(im,0,0);
    return c;
  }
  /* cidadão com FOLHA pronta (ex.: gerada por IA e com o fundo removido):
     ponha `assets/topdown/npc_<n>_topdown.png` (mesma grade 4×3 dos heróis)
     e o número aqui — `cidadao:<n>` passa a usar a folha no lugar do desenho. */
  const NPC_FOLHAS = [0,1,2,3,4,5,6,7,8,9,16,17];
  /* `marionete:N` = o mesmo cidadão com o tempo congelado: folha tingida de gelo */
  const GELO = { cor:'#8fdcff', alfa:0.45, luz:'rgba(200,240,255,.18)' };
  function boneco(id){
    if(bonecos[id]) return bonecos[id];
    const b = bonecos[id] = { id, pronto:false, frames:null };
    const cid = /^(cidadao|marionete):(\d+)$/.exec(id);
    if(cid && NPC_FOLHAS.indexOf(+cid[2])>=0){
      const im=new Image(), n=cid[2], gelo=cid[1]==='marionete';
      im.onload=()=>{ try{ b.frames=prepararFolha('npc_'+n, gelo ? tingir(im, GELO) : im); b.pronto=true; }catch(e){ b.frames=procedural(id); b.pronto=true; } };
      im.onerror=()=>{ b.frames=procedural(id); b.pronto=true; };
      im.src='assets/topdown/npc_'+n+'_topdown.png';
      return b;
    }
    if(TINTA[id]){
      const t=TINTA[id], im=new Image();
      im.onload=()=>{ try{ b.frames=prepararFolha(id, tingir(im, t)); b.pronto=true; }catch(e){ console.warn('robô tingido', id, e); b.frames=procedural(id); b.pronto=true; } };
      im.onerror=()=>{ b.frames=procedural(id); b.pronto=true; };
      im.src='assets/topdown/'+t.arq+'_topdown.png';
      return b;
    }
    const arq=FOLHAS[id];
    if(arq){
      const im=new Image();
      im.onload=()=>{ try{ b.frames=prepararFolha(id, im); b.pronto=true; }catch(e){ console.warn('folha top-down', id, e); } };
      im.src='assets/topdown/'+arq+'_topdown.png';
    }
    if(!arq) b.frames = procedural(id), b.pronto=true;
    return b;
  }
  let ESPERA=null;
  // quadro pra desenhar: dir 0..3 (baixo, esq, dir, cima), passo 0..3 (ciclo 0,1,2,1)
  function quadro(id, dir, passo, andando){
    const b=boneco(id);
    const col = andando ? [0,1,2,1][passo&3] : 1;
    if(b.pronto && b.frames) return b.frames[dir][col];
    const p=ESPERA || (ESPERA=procedural('_espera'));
    return p[dir][col];
  }

  /* ---- bonecos desenhados em código (mesma grade 4×3) ----
     ids: 'robo', 'sentinela', 'androide', 'cidadao:<n>', 'cachorro', 'marionete:<n>' */
  /* Gente da cidade. Os índices 0–7 são os que o roteiro já usa (4 =
     idoso/relojoeiro, 6 = pescador, 5 = de kipá…); 8+ são novos.
     cab: estilo do cabelo · chap: chapéu · roupa: 'camisa'|'vestido'|'regata'
     · extra: lista (gravata, oculos, barba, avental, colete, bermuda, camera) */
  const PALETAS_CIDADAO = [
    { pele:'#f0c9a0', corCab:'#4a2c18', cab:'curto',  cam:'#f2f0ea', cal:'#3a3d48', sap:'#1e1a1a', extra:['gravata'] },
    { pele:'#c98e5e', corCab:'#151515', cab:'curto',  cam:'#c8423a', cal:'#5a4430', sap:'#2a1a12', extra:['oculos'] },
    { pele:'#f6d6b4', corCab:'#e0b85a', cab:'longo',  cam:'#4fae6e', cal:'#2c3a60', sap:'#5a3020', extra:[] },
    { pele:'#7a4a2c', corCab:'#151515', cab:'curto',  chap:'bone', corChap:'#d23a2a', cam:'#f0c43a', cal:'#3a5a8a', sap:'#e8e8e8', extra:['bermuda','camera'] },
    { pele:'#efc9a2', corCab:'#c9c9c9', cab:'careca', cam:'#e8dcc0', cal:'#4a3a2a', sap:'#2a1a12', extra:['colete','barba','oculos'] },
    { pele:'#dcae82', corCab:'#5a2e16', cab:'curto',  chap:'kipa', corChap:'#2a4a8a', cam:'#f6f4ee', cal:'#2a3a5a', sap:'#1e1a1a', extra:['barba'] },
    { pele:'#a8693e', corCab:'#2a1a0e', cab:'curto',  chap:'balde', corChap:'#c8b070', cam:'#e8742a', cal:'#5a5f66', sap:'#3a2a1a', extra:['barba'] },
    { pele:'#f6d2b0', corCab:'#c8452a', cab:'coque',  cam:'#2ab0c0', cal:'#2ab0c0', sap:'#7a3a2a', roupa:'vestido', extra:[] },
    { pele:'#5a3420', corCab:'#151010', cab:'afro',   cam:'#7a4ab0', cal:'#2a2a33', sap:'#f2f2f2', extra:[] },
    { pele:'#e2b48a', corCab:'#3a2010', cab:'curto',  chap:'lenco', corChap:'#c43a5a', cam:'#8a5a3a', cal:'#8a5a3a', sap:'#3a2a1a', roupa:'vestido', extra:[] },
    { pele:'#b9784a', corCab:'#1a1a1a', cab:'raspado',cam:'#2e6ab8', cal:'#e8e8e8', sap:'#e8442a', roupa:'regata', extra:['bermuda'] },
    { pele:'#f0c49a', corCab:'#6a4020', cab:'curto',  chap:'chef', corChap:'#ffffff', cam:'#ffffff', cal:'#5a5a62', sap:'#2a2a2a', extra:['avental'] },
    { pele:'#e8b890', corCab:'#121212', cab:'chanel', cam:'#26365a', cal:'#26365a', sap:'#121212', extra:['gravata'] },
    { pele:'#d8a070', corCab:'#7a4a22', cab:'longo',  cam:'#e0a02a', cal:'#4a6a3a', sap:'#5a3a1a', extra:['barba'] },
    { pele:'#8a5636', corCab:'#121212', cab:'curto',  chap:'bone', corChap:'#1a1a1a', cam:'#24262c', cal:'#24262c', sap:'#121212', extra:[] },
    { pele:'#f6d8bc', corCab:'#8a5a2a', cab:'rabo',   cam:'#f08ab0', cal:'#4a6aa8', sap:'#ffffff', extra:['bermuda'] }
  ];
  const tom = (c, k) => { const n=parseInt(c.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255;
    if(k<0){ r*=1+k; g*=1+k; b*=1+k; } else { r+=(255-r)*k; g+=(255-g)*k; b+=(255-b)*k; }
    return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); };
  /* contorno escuro de 1 px em volta do que foi desenhado (o "jeito" de pixel art) */
  function contornar(cv, cor, lim){
    lim = lim||40;                       // alfa mínimo que conta como "desenho" (sombra fraca não ganha contorno)
    const x=cv.getContext('2d'), W=cv.width, H=cv.height, im=x.getImageData(0,0,W,H), d=im.data, o=new Uint8ClampedArray(d);
    const [r,g,b]=[parseInt(cor.slice(1,3),16),parseInt(cor.slice(3,5),16),parseInt(cor.slice(5,7),16)];
    for(let j=0;j<H;j++) for(let i=0;i<W;i++){ const k=(j*W+i)*4; if(d[k+3]>lim) continue;
      const viz=(a,b2)=>a>=0&&b2>=0&&a<W&&b2<H&&d[(b2*W+a)*4+3]>lim;
      if(viz(i-1,j)||viz(i+1,j)||viz(i,j-1)||viz(i,j+1)){ o[k]=r; o[k+1]=g; o[k+2]=b; o[k+3]=255; } }
    x.putImageData(new ImageData(o,W,H),0,0);
  }
  /* cidadão em pixel art, proporção chibi igual à dos heróis (cabeça grande).
     Desenha baixo/esquerda/cima; a direita é a esquerda espelhada. */
  function humanoPixel(d, pe, P, congelado){
    const W=32, H=56, cv=tela(W,H), x=cv.getContext('2d');
    const lado = d===1||d===2, costas = d===3;
    const p=(a,b,w,h,c)=>px(x,a,b,w,h,c);
    const ex=P.extra||[], tem=k=>ex.indexOf(k)>=0;
    const pele=P.pele, peleS=tom(pele,-0.18), cam=P.cam, camS=tom(cam,-0.22), camL=tom(cam,0.2), cal=P.cal, calS=tom(cal,-0.25), cab=P.corCab, cabS=tom(cab,-0.3), cabL=tom(cab,0.25);
    const vestido=P.roupa==='vestido', regata=P.roupa==='regata';
    // ---- pernas e sapatos ----
    const perna=(lx,ly,lh)=>{ if(tem('bermuda')){ p(lx,ly,5,4,cal); p(lx,ly+4,5,lh-4,pele); p(lx+3,ly+4,2,lh-4,peleS); } else { p(lx,ly,5,lh,cal); p(lx+3,ly,2,lh,calS); } p(lx-1,ly+lh,6,3,P.sap); p(lx-1,ly+lh,6,1,tom(P.sap,0.25)); };
    if(!lado){ const l=pe<0?1:0, r=pe>0?1:0; perna(10,41-l,10); perna(17,41-r,10); }
    else { perna(13+pe*3,41,10); if(pe!==0) perna(13-pe*3,41,10); }
    // ---- tronco ----
    if(!lado){
      if(vestido){ p(8,28,16,10,cam); x.fillStyle=cam; x.beginPath(); x.moveTo(8,37); x.lineTo(5,47); x.lineTo(27,47); x.lineTo(24,37); x.fill(); p(20,28,4,19,camS); p(8,28,2,10,camL); }
      else { p(8,28,16,14,cam); p(20,28,4,14,camS); p(8,28,2,14,camL); p(8,40,16,2,calS); }
      if(!costas){ p(14,28,4,2,peleS); if(regata){ p(8,28,3,6,pele); p(21,28,3,6,pele); } }
      if(tem('gravata') && !costas){ p(15,30,2,9,'#c4352f'); p(14,30,4,2,'#a02a20'); }
      if(tem('colete')){ p(8,29,5,12,'#6a4a2a'); p(19,29,5,12,'#5a3a1e'); }
      if(tem('avental') && !costas){ p(10,31,12,15,'#f6f4ee'); p(10,31,12,1,'#d8d4c8'); p(19,32,3,14,'#e4e0d6'); }
      if(tem('camera') && !costas){ p(17,34,6,5,'#2a2a2a'); p(19,35,2,2,'#7fd8ff'); p(10,29,1,6,'#2a2a2a'); }
      // braços balançando
      const ab = costas ? -pe : pe;
      const braco=(bx,by)=>{ p(bx,by,4,10,regata?pele:cam); p(bx+(bx<16?0:2),by,2,10,regata?peleS:camS); p(bx,by+10,4,3,pele); };
      braco(4,29+ab); braco(24,29-ab);
    } else {
      if(vestido){ p(11,28,11,10,cam); x.fillStyle=cam; x.beginPath(); x.moveTo(11,37); x.lineTo(9,47); x.lineTo(24,47); x.lineTo(22,37); x.fill(); p(19,28,3,19,camS); }
      else { p(11,28,11,14,cam); p(19,28,3,14,camS); p(11,40,11,2,calS); }
      if(tem('avental')){ p(10,31,3,15,'#f6f4ee'); }
      if(tem('colete')){ p(11,29,11,12,'#6a4a2a'); }
      const bx=14-pe*3; p(bx,29,4,10,regata?pele:camS); p(bx,39,4,3,pele);
    }
    // ---- cabeça (grande, cantos arredondados) ----
    const HX=7, HY=6, HW=18, HH=22;
    p(HX+1,HY,HW-2,HH,pele); p(HX,HY+2,HW,HH-4,pele);
    if(lado){ p(HX+HW-6,HY+2,5,HH-4,peleS); p(HX-1,HY+12,2,3,pele); }     // nariz pra esquerda
    else p(HX+HW-3,HY+2,3,HH-4,peleS);
    if(!lado && !costas){ p(HX-2,HY+10,2,4,pele); p(HX+HW,HY+10,2,4,peleS); }   // orelhas
    if(lado){ p(HX+11,HY+10,3,4,peleS); }
    // ---- rosto ----
    const olho=congelado?'#7fe3ff':'#1a1420';
    if(!costas && !lado){
      p(HX+4,HY+11,3,4,olho); p(HX+11,HY+11,3,4,olho); p(HX+4,HY+11,1,1,'#ffffff'); p(HX+11,HY+11,1,1,'#ffffff');
      p(HX+4,HY+9,3,1,cabS); p(HX+11,HY+9,3,1,cabS);
      p(HX+7,HY+17,4,1,'#9a4a3a'); p(HX+2,HY+15,2,1,'#f2a0a0'); p(HX+14,HY+15,2,1,'#f2a0a0');
      if(tem('oculos')){ x.strokeStyle='#2a2a2a'; x.lineWidth=1; x.strokeRect(HX+3.5,HY+10.5,5,5); x.strokeRect(HX+10.5,HY+10.5,5,5); p(HX+8,HY+12,2,1,'#2a2a2a'); }
      if(tem('barba')){ p(HX+1,HY+15,HW-2,7,cab); p(HX+3,HY+20,HW-6,3,cab); p(HX+6,HY+17,6,2,'#9a4a3a'); p(HX+1,HY+15,2,2,pele); p(HX+HW-3,HY+15,2,2,peleS); }
    } else if(lado){
      p(HX+2,HY+11,3,4,olho); p(HX+2,HY+11,1,1,'#ffffff'); p(HX+2,HY+9,3,1,cabS); p(HX+1,HY+17,3,1,'#9a4a3a');
      if(tem('oculos')){ x.strokeStyle='#2a2a2a'; x.lineWidth=1; x.strokeRect(HX+1.5,HY+10.5,5,5); p(HX+6,HY+12,6,1,'#2a2a2a'); }
      if(tem('barba')){ p(HX+1,HY+15,10,7,cab); p(HX+1,HY+17,3,1,'#9a4a3a'); }
    }
    // ---- cabelo ----
    const st=P.cab;
    if(costas){
      if(st==='careca') p(HX,HY+12,HW,6,cab);
      else if(st==='raspado') p(HX+1,HY,HW-2,10,cabS);
      else if(st==='afro'){ x.fillStyle=cab; x.beginPath(); x.ellipse(16,HY+8,13,12,0,0,Math.PI*2); x.fill(); }
      else { p(HX,HY-1,HW,st==='longo'?28:st==='chanel'?20:15,cab); p(HX+1,HY-2,HW-2,2,cab); p(HX+HW-4,HY,4,st==='longo'?27:14,cabS); }
      if(st==='coque'){ p(13,HY-6,7,6,cab); p(14,HY-7,5,1,cabL); }
      if(st==='rabo'){ p(14,HY+12,4,14,cab); p(13,HY+10,6,3,'#e8442a'); }
    } else {
      const lat = lado ? 1 : 0;
      if(st==='careca'){ p(HX,HY+8,3,6,cab); if(!lado) p(HX+HW-3,HY+8,3,6,cab); else p(HX+12,HY+6,6,8,cab); }
      else if(st==='raspado'){ p(HX+1,HY,HW-2,4,cabS); }
      else if(st==='afro'){ x.fillStyle=cab; x.beginPath(); x.ellipse(lado?18:16,HY+4,lado?12:13,9,0,0,Math.PI*2); x.fill(); p(HX,HY+4,lado?2:3,8,cab); if(!lado) p(HX+HW-3,HY+4,3,8,cab); p(HX+5,HY-2,5,2,cabL); }
      else {
        p(HX+1,HY-1,HW-2,5,cab); p(HX,HY+1,HW,4,cab); p(HX+2,HY-2,HW-4,2,cab); p(HX+4,HY-1,6,1,cabL);
        if(lado){ p(HX+8,HY+1,HW-8,st==='longo'?26:st==='chanel'?18:12,cab); p(HX+HW-3,HY+3,3,st==='longo'?24:10,cabS); }
        else {
          p(HX,HY+3,3,st==='longo'?24:st==='chanel'?16:9,cab); p(HX+HW-3,HY+3,3,st==='longo'?24:st==='chanel'?16:9,cabS);
          if(st==='chanel') p(HX+3,HY+3,HW-6,3,cab);
          else p(HX+3,HY+3,5,2,cab);
        }
        if(st==='coque'){ p(13,HY-6,7,5,cab); p(14,HY-7,5,1,cabL); }
        if(st==='rabo' && lado){ p(HX+HW-1,HY+8,4,13,cab); }
      }
    }
    // ---- chapéus ----
    const ch=P.chap, cc=P.corChap;
    if(ch==='bone'){ p(HX,HY-3,HW,7,cc); p(HX+2,HY-4,HW-4,1,cc); p(HX+3,HY-2,5,1,tom(cc,0.3));
      if(!lado&&!costas) p(HX+1,HY+3,HW-2,2,tom(cc,-0.3)); else if(lado) p(HX-4,HY+2,7,2,tom(cc,-0.3)); }
    if(ch==='kipa') p(HX+5,HY-3,8,3,cc);
    if(ch==='balde'){ p(HX-2,HY+1,HW+4,3,tom(cc,-0.2)); p(HX+1,HY-4,HW-2,6,cc); }
    if(ch==='chef'){ p(HX+1,HY-12,HW-2,14,cc); p(HX,HY-14,HW,4,cc); p(HX+1,HY,HW-2,2,'#dcdcdc'); }
    if(ch==='lenco'){ p(HX-1,HY-3,HW+2,9,cc); if(!lado&&!costas){ p(HX-1,HY+6,3,18,cc); p(HX+HW-2,HY+6,3,18,tom(cc,-0.2)); } else p(HX+6,HY+3,HW-5,22,cc); p(HX+2,HY-2,6,1,tom(cc,0.3)); }
    contornar(cv, '#1c1622');
    if(congelado){ x.globalCompositeOperation='source-atop'; x.fillStyle='rgba(150,220,255,.30)'; x.fillRect(0,0,W,H); x.globalCompositeOperation='source-over'; }
    // sombra embaixo (depois do contorno)
    const fim=tela(W,H), fx=fim.getContext('2d'); sombra(fx,16,53,10,3); fx.drawImage(cv,0,0);
    return fim;
  }
  function espelhar(cv){ const c=tela(cv.width,cv.height), x=c.getContext('2d'); x.translate(cv.width,0); x.scale(-1,1); x.drawImage(cv,0,0); return c; }
  function procedural(id){
    const [tipo, n] = String(id).split(':');
    const frames=[];
    if(tipo==='cidadao' || tipo==='marionete' || tipo==='_espera'){
      const P=PALETAS_CIDADAO[(+n||0)%PALETAS_CIDADAO.length];
      for(let d=0; d<4; d++){ frames[d]=[];
        for(let c=0;c<3;c++){ const pe=c===0?-1:c===2?1:0;
          const cv = d===2 ? espelhar(humanoPixel(1, pe, P, tipo==='marionete')) : humanoPixel(d, pe, P, tipo==='marionete');
          frames[d][c]={ cv, ax:16, ay:54 }; } }
      return frames;
    }
    for(let d=0; d<4; d++){
      frames[d]=[];
      for(let c=0;c<3;c++){
        const W=28, H=48, cv=tela(W,H), x=cv.getContext('2d');
        const pe = c===0?-1 : c===2?1 : 0;
        if(tipo==='robo'||tipo==='sentinela'||tipo==='robo_orfao') roboDesenho(x, d, pe, tipo);
        else if(tipo==='androide') androideDesenho(x, d, pe);
        else if(tipo==='cachorro') cachorroDesenho(x, d, pe);
        else humanoDesenho(x, d, pe, PALETAS_CIDADAO[(+n||0)%PALETAS_CIDADAO.length], tipo==='marionete');
        frames[d][c]={ cv, ax:W/2, ay:H-1 };
      }
    }
    return frames;
  }
  function humanoDesenho(x, d, pe, P, congelado){
    sombra(x,14,45,9,3);
    // pernas
    const lp = d===1||d===2 ? pe*3 : 0;
    px(x,9+(d===0||d===3?0:lp),32+(d===0||d===3?Math.max(0,pe):0),4,13,P.cal);
    px(x,15-(d===0||d===3?0:lp),32+(d===0||d===3?Math.max(0,-pe):0),4,13,P.cal);
    px(x,9+(d===0||d===3?0:lp),44,5,3,'#2a2018'); px(x,15-(d===0||d===3?0:lp),44,5,3,'#2a2018');
    // tronco e braços
    px(x,7,18,14,15,P.cam); px(x,7,18,14,2,'rgba(255,255,255,.2)');
    const ab = d===1||d===2 ? 0 : pe*2;
    if(d!==1) px(x,4,19+ab,3,11,P.cam); if(d!==2) px(x,21,19-ab,3,11,P.cam);
    if(d!==1) px(x,4,29+ab,3,3,P.pele); if(d!==2) px(x,21,29-ab,3,3,P.pele);
    // cabeça
    px(x,8,4,12,14,P.pele);
    if(d===3){ px(x,7,3,14,13,P.cab); }
    else {
      px(x,7,2,14,5,P.cab); if(d===1) px(x,15,3,6,9,P.cab); if(d===2) px(x,7,3,6,9,P.cab);
      if(d===0){ px(x,10,10,2,2,congelado?'#6fe3ff':'#1a1a1a'); px(x,16,10,2,2,congelado?'#6fe3ff':'#1a1a1a'); px(x,12,14,4,1,'#9a5a4a'); }
      if(d===1){ px(x,9,10,2,2,congelado?'#6fe3ff':'#1a1a1a'); }
      if(d===2){ px(x,17,10,2,2,congelado?'#6fe3ff':'#1a1a1a'); }
    }
    if(P.ext==='oculos' && d!==3){ px(x,9,9,10,1,'#111'); }
    if(P.ext==='bone'){ px(x,6,1,16,4,'#c9302a'); if(d===0) px(x,8,5,12,2,'#a02020'); }
    if(P.ext==='kipa'){ px(x,11,1,6,2,'#2a4a8a'); }
    if(P.ext==='lenco'){ px(x,6,1,16,5,'#e0c24a'); }
    if(P.ext==='idoso'){ px(x,7,2,14,3,'#cfcfcf'); }
    if(congelado){ x.fillStyle='rgba(140,220,255,.28)'; x.fillRect(4,2,20,44); }
  }
  function roboDesenho(x, d, pe, tipo){
    const corpo = tipo==='sentinela' ? '#9fc6d8' : tipo==='robo_orfao' ? '#7a5a5a' : '#8b949a';
    const escuro= tipo==='sentinela' ? '#5c8aa0' : tipo==='robo_orfao' ? '#4a2a2a' : '#5c6469';
    const olho  = tipo==='robo_orfao' ? '#ff3a2a' : tipo==='sentinela' ? '#bff4ff' : '#3bd1ff';
    sombra(x,14,45,10,3);
    px(x,8,34+Math.max(0,pe),5,11,escuro); px(x,15,34+Math.max(0,-pe),5,11,escuro);
    px(x,7,43,7,4,'#2a2f33'); px(x,14,43,7,4,'#2a2f33');
    px(x,5,18,18,17,corpo); px(x,5,18,18,2,'#ffffff44'); px(x,9,22,10,8,escuro); px(x,11,24,6,4,'#ffcc33');
    px(x,2,20+pe,3,12,escuro); px(x,23,20-pe,3,12,escuro);
    px(x,7,5,14,13,corpo); px(x,7,5,14,2,'#ffffff55');
    if(d===0) { px(x,8,9,12,4,'#1b1f22'); px(x,9,10,10,2,olho); }
    if(d===1) { px(x,7,9,7,4,'#1b1f22'); px(x,7,10,5,2,olho); }
    if(d===2) { px(x,14,9,7,4,'#1b1f22'); px(x,16,10,5,2,olho); }
    px(x,13,0,2,5,'#cfd6da'); px(x,12,0,4,2,olho);
  }
  function androideDesenho(x, d, pe){
    sombra(x,14,45,9,3);
    px(x,9,32+Math.max(0,pe),4,13,'#e8eef0'); px(x,15,32+Math.max(0,-pe),4,13,'#e8eef0');
    px(x,9,44,5,3,'#2a3a40'); px(x,15,44,5,3,'#2a3a40');
    px(x,7,17,14,16,'#f2f6f7'); px(x,7,23,14,2,'#2ac7c0'); px(x,12,18,4,4,'#2ac7c0');
    px(x,4,18+pe*2,3,12,'#d7e0e3'); px(x,21,18-pe*2,3,12,'#d7e0e3');
    px(x,8,3,12,14,'#f2f6f7');
    if(d===0){ px(x,9,8,10,3,'#123'); px(x,10,9,3,1,'#2ae8e0'); px(x,15,9,3,1,'#2ae8e0'); }
    if(d===1){ px(x,8,8,6,3,'#123'); px(x,9,9,3,1,'#2ae8e0'); }
    if(d===2){ px(x,14,8,6,3,'#123'); px(x,16,9,3,1,'#2ae8e0'); }
    if(d===3){ px(x,9,5,10,2,'#2ac7c0'); }
  }
  function cachorroDesenho(x, d, pe){
    sombra(x,14,45,11,3);
    const c1='#c98a4a', c2='#8a5a2a';
    if(d===1||d===2){
      const f = d===1 ? -1 : 1, cx=14;
      px(x,cx-10,30,20,9,c1); px(x,cx-9+ (pe>0?1:0),38,3,7,c2); px(x,cx+6-(pe>0?1:0),38,3,7,c2);
      px(x,cx+f*9-4,24,9,9,c1); px(x,cx+f*9-(f>0?-2:5),21,4,8,c2);           // cabeça e a ORELHA grande
      px(x,cx+f*13-1,28,3,2,'#222'); px(x,cx-f*11-1,27,3,3,c2);              // focinho e rabo
    } else {
      px(x,8,28,12,13,c1); px(x,9,40+Math.max(0,pe),3,5,c2); px(x,16,40+Math.max(0,-pe),3,5,c2);
      px(x,8,18,12,11,c1); px(x,3,15,6,12,c2); px(x,19,15,6,12,c2);          // orelhas enormes
      if(d===0){ px(x,10,22,2,2,'#111'); px(x,16,22,2,2,'#111'); px(x,12,26,4,2,'#222'); }
    }
  }

  return {
    T, TERR, tid, carregar, img, desenharTerreno, preencher, brilho, sprite, SPR, spr, novaPeca, pecaChao, pecaSemContorno, ARQ, gerar, sombra,
    predio, casa, cupula, torreRelogio, laboratorio, barraca, peca,
    boneco, quadro, procedural, DIRS, FOLHAS, hash, tela, px
  };
})();
