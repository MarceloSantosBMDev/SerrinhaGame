/* ============================================================
   OW ARTE EXTRA — mais objetos pro mundo aberto
   ------------------------------------------------------------
   1. MÓVEIS dos atlas LPC (camas, fogão, estantes, piano, lareira,
      sofás, balcão de vidro, máquina de café…). O retângulo é
      APROXIMADO: `auto:true` apara pelo alfa na primeira vez (ver
      OWArte.aparar), então dá pra mexer sem medir pixel por pixel.
   2. PEÇAS DESENHADAS EM CÓDIGO (pixel art na escala do jogo: 1 tile =
      32 px): carros, hidrante, orelhão, bicicleta, cerca branca, sebe,
      parquinho, carrinho de falafel… e os móveis que os atlas não têm
      (TV, geladeira, balcão de padaria, bar, escritório, igreja,
      engrenagens da torre, galpão).
   Âncora = PÉS (é por ela que tudo se ordena por Y). Colisão relativa
   aos pés. Peças de PAREDE (janela, quadro, relógio) não têm colisão:
   ficam na fileira da face da parede, onde ninguém anda mesmo.
   ============================================================ */
(function(){
  const A = OWArte, px = A.px, T = A.T;
  const P = (nome, w, h, fn, a, col, extra) => A.novaPeca(nome, w, h, fn, a, col, extra);
  const auto = (nome, img, r, o) => A.spr(nome, Object.assign({ img, r, auto:true }, o||{}));

  /* ================= 0. VEÍCULOS (gerados no Gemini, fundo removido) =================
     modohistoria/assets/veiculos/<carro>_<baixo|esq|dir|cima>.png */
  ['astra','corsa'].forEach(carro=>['baixo','esq','dir','cima'].forEach(d=>{
    const k=carro+'_'+d; A.ARQ[k]='modohistoria/assets/veiculos/'+k+'.png';
    A.spr(k, { img:k, r:[0,0,160,120], auto:true, semCol:true });
  }));

  /* ================= 1. MÓVEIS DOS ATLAS ================= */
  // city_inside.png
  auto('cama_roxa',     'cityin', [160,0,32,96],  { colFrac:0.8 });
  auto('cama_azul',     'cityin', [192,0,32,96],  { colFrac:0.8 });
  auto('criado_mudo',   'cityin', [224,0,32,32],  { colFrac:0.6 });
  auto('mesa_grande',   'cityin', [256,0,96,96],  { colFrac:0.75 });
  auto('tapete_real',   'cityin', [34,0,94,96],   { semCol:true, chao:true });
  auto('tapete_listra', 'cityin', [64,96,128,32], { semCol:true, chao:true });
  auto('quadro_rei',    'cityin', [224,64,32,32], { semCol:true });
  auto('quadro_flor',   'cityin', [224,96,32,32], { semCol:true });
  auto('aparador',      'cityin', [0,96,64,64],   { colFrac:0.5 });
  auto('mesinha',       'cityin', [64,128,32,32], { colFrac:0.5 });
  auto('banqueta_verm', 'cityin', [96,128,32,32], { colFrac:0.5 });
  auto('estandarte',    'cityin', [128,128,32,32],{ semCol:true });
  auto('espelho',       'cityin', [192,96,32,64], { colFrac:0.3 });
  auto('beliche',       'cityin', [256,96,64,64], { colFrac:0.6 });
  auto('planta_vaso',   'cityin', [320,96,32,64], { colFrac:0.25 });
  auto('planta_vaso2',  'cityin', [352,96,32,64], { colFrac:0.25 });
  auto('janela_arco',   'cityin', [384,96,32,64], { semCol:true });
  auto('janela_int',    'cityin', [416,96,32,64], { semCol:true });
  auto('jarro',         'cityin', [160,192,32,32],{ colFrac:0.5 });
  auto('jarro2',        'cityin', [160,224,32,32],{ colFrac:0.5 });
  auto('lareira',       'cityin', [328,160,48,96],{ colFrac:0.3, luz:'#ff9a3a' });
  auto('piano',         'cityin', [460,164,72,80],{ colFrac:0.55 });
  auto('pilastra',      'cityin', [448,64,32,64], { colFrac:0.3 });
  auto('busto',         'cityin', [480,60,32,72], { colFrac:0.3 });
  auto('porta_madeira', 'cityin', [512,32,32,64], { semCol:true });
  auto('braseiro',      'cityin', [544,0,32,48],  { colFrac:0.3, luz:'#ff9a3a' });
  // obj_misk_atlas.png
  auto('cama_casal',    'misc', [320,940,64,84],  { colFrac:0.85 });
  auto('cama_casal2',   'misc', [384,940,64,84],  { colFrac:0.85 });
  auto('cama_solteiro', 'misc', [4,936,56,88],    { colFrac:0.85 });
  auto('cadeira',       'misc', [96,940,32,38],   { colFrac:0.5 });
  auto('cadeira_costas','misc', [64,1000,32,24],  { colFrac:0.6 });
  auto('fogao_lenha',   'misc', [192,896,32,128], { colFrac:0.25, luz:'#ff9a3a' });
  auto('fogao',         'misc', [224,962,32,62],  { colFrac:0.4 });
  auto('abajur',        'misc', [256,960,32,30],  { colFrac:0.4 });
  auto('guarda_roupa',  'misc', [448,944,64,80],  { colFrac:0.4 });
  auto('cadeira_fina',  'misc', [512,966,32,58],  { colFrac:0.4 });
  auto('cortina',       'misc', [586,930,22,94],  { semCol:true });
  auto('vaso_azul',     'misc', [607,958,34,56],  { colFrac:0.35 });
  auto('vaso_porcelana','misc', [672,972,30,42],  { colFrac:0.4 });
  auto('pote_porcelana','misc', [706,994,28,24],  { colFrac:0.5 });
  auto('banco_alto',    'misc', [706,958,28,36],  { colFrac:0.3 });
  auto('cristaleira',   'misc', [448,132,32,70],  { colFrac:0.35 });
  auto('estante_livros','misc', [480,132,32,70],  { colFrac:0.35 });
  auto('gaveteiro',     'misc', [480,229,32,70],  { colFrac:0.35 });
  auto('armario_coz',   'misc', [512,229,32,70],  { colFrac:0.35 });
  auto('armario_coz2',  'misc', [544,229,32,70],  { colFrac:0.35 });
  auto('armario_coz3',  'misc', [576,229,32,70],  { colFrac:0.35 });
  auto('vitrine',       'misc', [736,160,96,88],  { colFrac:0.5 });
  auto('maquina_cafe',  'misc', [648,446,48,70],  { colFrac:0.3 });
  auto('vaso_sanitario','misc', [642,400,28,40],  { colFrac:0.5 });
  auto('bebedouro_passaro','misc',[480,330,32,54],{ colFrac:0.3 });
  auto('estante_vazia', 'misc', [416,355,32,72],  { colFrac:0.35 });
  auto('estante_cheia', 'misc', [448,355,32,72],  { colFrac:0.35 });
  auto('balcao_bar',    'misc', [576,394,64,48],  { colFrac:0.55 });
  auto('mesa_comprida', 'misc', [582,447,58,90],  { colFrac:0.85 });
  auto('palete',        'misc', [400,460,66,76],  { colFrac:0.8 });
  auto('tonel',         'misc', [737,532,30,34],  { colFrac:0.5 });
  auto('caixa_frutas',  'misc', [256,650,64,52],  { colFrac:0.6 });
  auto('caixa_legumes', 'misc', [352,650,64,52],  { colFrac:0.6 });
  auto('sacos',         'misc', [96,415,63,68],   { colFrac:0.5 });
  auto('saco',          'misc', [0,430,34,36],    { colFrac:0.5 });
  auto('saco_graos',    'misc', [0,503,34,30],    { colFrac:0.5 });
  auto('lenha',         'misc', [0,365,34,38],    { colFrac:0.5 });
  auto('lapide',        'misc', [703,800,33,34],  { colFrac:0.4 });
  auto('lapide_rip',    'misc', [737,800,30,30],  { colFrac:0.4 });
  auto('lapide_grande', 'misc', [712,850,50,48],  { colFrac:0.4 });
  auto('lapide_cruz',   'misc', [737,925,26,38],  { colFrac:0.3 });
  // moveis_estofados.png
  auto('luminaria_pe',  'moveis', [2,62,30,36],   { colFrac:0.3 });
  auto('poltrona',      'moveis', [2,125,30,34],  { colFrac:0.6 });
  auto('poltrona2',     'moveis', [34,125,30,34], { colFrac:0.6 });
  auto('sofa',          'moveis', [196,125,56,34],{ colFrac:0.6 });
  auto('sofa_longo',    'moveis', [196,195,56,28],{ colFrac:0.6 });
  auto('sofa_grande',   'moveis', [128,222,64,36],{ colFrac:0.6 });
  auto('pufe',          'moveis', [132,295,26,22],{ colFrac:0.6 });
  auto('mesinha_redonda','moveis',[228,322,26,28],{ colFrac:0.5 });
  auto('biombo',        'moveis', [128,62,32,66], { colFrac:0.25 });
  auto('trono',         'moveis', [194,286,34,74],{ colFrac:0.35 });

  /* ================= 2. PEÇAS DESENHADAS ================= */
  const sombra = (x,cx,cy,rx,ry)=>A.sombra(x,cx,cy,rx,ry);

  /* ---------- carros (vistos de cima em 3/4) ---------- */
  const CORES_CARRO = { verm:['#c7372d','#8f231b','#e8645a'], azul:['#2f63c4','#1d3f86','#5d8ee8'], amar:['#e0b02a','#9a7414','#f5d35a'],
    branco:['#e8e8e4','#a8a8a4','#ffffff'], preto:['#3a3d44','#1d1f24','#5a5e68'], verde:['#3a9a5a','#226a3a','#62c47e'], taxi:['#f2c230','#a8841a','#ffe27a'], prata:['#b8bec6','#7d838b','#dfe4ea'] };
  Object.keys(CORES_CARRO).forEach(k=>{
    const [c,e,l]=CORES_CARRO[k];
    P('carro_h_'+k, 68, 40, (x)=>{
      sombra(x,34,35,32,5);
      px(x,6,30,10,8,'#1b1b1f'); px(x,50,30,10,8,'#1b1b1f');          // rodas
      px(x,2,12,64,22,c); px(x,2,30,64,4,e); px(x,2,12,64,2,l);        // lataria
      px(x,16,4,34,16,e); px(x,18,5,30,13,c);                            // teto
      px(x,14,6,6,12,'#7fb6d6'); px(x,46,6,4,12,'#5d8eb0'); px(x,21,6,24,4,'#9fd0ea'); // vidros
      px(x,0,16,3,6,'#ffe9a3'); px(x,65,16,3,6,'#d23a2a');                // farol / lanterna
      px(x,30,22,2,2,'#1d1f24'); px(x,44,22,2,2,'#1d1f24');
      if(k==='taxi'){ px(x,28,0,12,5,'#2a2a2a'); px(x,29,1,10,3,'#ffe066'); }
    }, [34,38], [-32,-16,64,15]);
    P('carro_v_'+k, 38, 66, (x)=>{
      sombra(x,19,62,17,4);
      px(x,1,10,6,12,'#1b1b1f'); px(x,31,10,6,12,'#1b1b1f'); px(x,1,44,6,12,'#1b1b1f'); px(x,31,44,6,12,'#1b1b1f');
      px(x,4,4,30,58,c); px(x,4,4,30,2,l); px(x,4,58,30,4,e);
      px(x,7,16,24,8,'#9fd0ea'); px(x,7,44,24,6,'#5d8eb0'); px(x,7,24,24,20,e); px(x,9,26,20,16,c);
      px(x,6,3,6,3,'#ffe9a3'); px(x,26,3,6,3,'#ffe9a3'); px(x,6,60,6,2,'#d23a2a'); px(x,26,60,6,2,'#d23a2a');
      if(k==='taxi'){ px(x,13,30,12,5,'#2a2a2a'); px(x,14,31,10,3,'#ffe066'); }
    }, [19,63], [-17,-30,34,29]);
  });
  P('onibus_h', 132, 52, (x)=>{
    sombra(x,66,47,64,5); px(x,10,40,14,10,'#1b1b1f'); px(x,104,40,14,10,'#1b1b1f');
    px(x,2,4,128,40,'#2e6ab8'); px(x,2,4,128,3,'#6d9ae0'); px(x,2,36,128,6,'#1e4a8a');
    for(let i=0;i<8;i++) px(x,8+i*15,12,12,12,'#9fd0ea');
    px(x,0,14,3,10,'#ffe9a3'); px(x,6,26,120,3,'#ffe066'); x.fillStyle='#fff'; x.font='bold 8px monospace'; x.fillText('333',100,35);
  }, [66,48], [-64,-20,128,19]);
  P('moto', 34, 24, (x)=>{ sombra(x,17,21,14,3); px(x,2,14,8,8,'#1b1b1f'); px(x,24,14,8,8,'#1b1b1f'); px(x,8,10,18,6,'#c7372d'); px(x,12,6,8,5,'#2a2a2a'); px(x,24,6,2,6,'#888'); px(x,22,5,6,2,'#555'); }, [17,22], [-14,-6,28,5]);
  P('bicicleta', 34, 22, (x)=>{ x.strokeStyle='#222'; x.lineWidth=2; x.beginPath(); x.arc(7,14,6,0,Math.PI*2); x.arc(27,14,6,0,Math.PI*2); x.stroke();
    x.strokeStyle='#2ab0c0'; x.beginPath(); x.moveTo(7,14); x.lineTo(15,6); x.lineTo(24,6); x.lineTo(27,14); x.moveTo(15,6); x.lineTo(17,14); x.lineTo(7,14); x.stroke(); px(x,13,3,6,2,'#333'); px(x,23,3,4,2,'#333'); }, [17,21], [-14,-6,28,5]);
  P('bicicletario', 72, 30, (x)=>{ px(x,0,22,72,4,'#5c6469'); for(let i=0;i<5;i++){ x.strokeStyle='#8f969c'; x.lineWidth=2; x.beginPath(); x.arc(8+i*14,22,6,Math.PI,0); x.stroke(); } }, [36,29], [-34,-8,68,7]);

  /* ---------- rua ---------- */
  P('hidrante', 16, 24, (x)=>{ sombra(x,8,22,6,2); px(x,4,6,8,16,'#d23a2a'); px(x,3,4,10,4,'#a8281c'); px(x,6,1,4,4,'#d23a2a'); px(x,1,10,3,4,'#a8281c'); px(x,12,10,3,4,'#a8281c'); px(x,5,7,2,12,'#ef6a5a'); }, [8,22], [-5,-5,10,4]);
  P('caixa_correio', 18, 34, (x)=>{ px(x,8,16,3,18,'#4a4a4a'); px(x,1,4,16,13,'#2e6ab8'); px(x,1,4,16,3,'#5d8ee8'); px(x,4,9,10,2,'#1d3f86'); px(x,14,0,2,8,'#d23a2a'); }, [9,33], [-4,-4,8,3]);
  P('orelhao', 30, 52, (x)=>{ sombra(x,15,50,12,3); px(x,13,20,4,30,'#555'); x.fillStyle='#f2a12a'; x.beginPath(); x.ellipse(15,16,14,15,0,0,Math.PI*2); x.fill(); x.fillStyle='#c97a12'; x.beginPath(); x.ellipse(15,18,10,11,0,0,Math.PI*2); x.fill(); px(x,11,14,8,10,'#333'); px(x,12,15,6,3,'#7fd8ff'); }, [15,50], [-6,-5,12,4]);
  P('semaforo', 20, 76, (x)=>{ px(x,8,24,4,52,'#3a3f45'); px(x,4,72,12,4,'#2a2e33'); px(x,3,0,14,28,'#2a2e33'); px(x,6,3,8,6,'#ff4a3a'); px(x,6,11,8,6,'#5a4a1a'); px(x,6,19,8,6,'#1a4a2a'); }, [10,75], [-4,-4,8,3], { luz:'#ff6a5a' });
  P('placa_pare', 20, 46, (x)=>{ px(x,9,16,3,30,'#8f969c'); x.fillStyle='#d23a2a'; x.beginPath(); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8; x.lineTo(10+Math.cos(a)*9,9+Math.sin(a)*9); } x.fill(); px(x,4,8,12,2,'#fff'); }, [10,45], [-3,-3,6,3]);
  P('placa_rua', 40, 52, (x)=>{ px(x,18,8,3,44,'#3a5a3a'); px(x,0,2,40,10,'#2a7a4a'); px(x,1,3,38,8,'#3a9a5a'); px(x,4,6,30,2,'#e8f0e8'); px(x,4,12,24,8,'#2a5a9a'); px(x,6,15,18,2,'#e8f0e8'); }, [19,51], [-3,-3,6,3]);
  P('bueiro', 26, 26, (x)=>{ x.fillStyle='#3a3b41'; x.beginPath(); x.arc(13,13,12,0,Math.PI*2); x.fill(); x.fillStyle='#55565e'; x.beginPath(); x.arc(13,13,10,0,Math.PI*2); x.fill(); for(let i=0;i<4;i++) px(x,6,7+i*4,14,2,'#3a3b41'); }, [13,24], null, {});
  P('faixa_ped_h', 32, 32, (x)=>{ for(let i=0;i<4;i++) px(x,2,2+i*8,28,4,'#e9e4d0'); }, [16,31], null);
  P('faixa_ped_v', 32, 32, (x)=>{ for(let i=0;i<4;i++) px(x,2+i*8,2,4,28,'#e9e4d0'); }, [16,31], null);
  P('vaga', 32, 32, (x)=>{ px(x,0,0,2,32,'#e9e4d0'); px(x,30,0,2,32,'#e9e4d0'); }, [16,31], null);
  P('cone_rua', 16, 20, (x)=>{ sombra(x,8,18,7,2); px(x,1,16,14,3,'#e8642a'); x.fillStyle='#f2742a'; x.beginPath(); x.moveTo(3,16); x.lineTo(8,1); x.lineTo(13,16); x.fill(); px(x,5,8,6,3,'#fff'); }, [8,18], [-5,-4,10,3]);
  P('barreira', 64, 30, (x)=>{ px(x,4,10,4,20,'#3a3f45'); px(x,56,10,4,20,'#3a3f45'); for(let i=0;i<8;i++) px(x,i*8,6,8,10,i%2?'#e8442a':'#f2ece0'); px(x,0,6,64,1,'#222'); }, [32,29], [-32,-8,64,7]);
  P('lixeira_verde', 22, 34, (x)=>{ sombra(x,11,32,9,2); px(x,2,8,18,24,'#2a7a4a'); px(x,1,4,20,5,'#1e5a36'); px(x,4,10,2,20,'#3a9a5a'); px(x,8,1,6,4,'#1e5a36'); }, [11,32], [-9,-7,18,6]);
  P('banco_praca', 56, 34, (x)=>{ sombra(x,28,31,26,3); px(x,2,4,52,6,'#8a5a32'); px(x,2,11,52,3,'#5a3a1e'); px(x,2,14,52,9,'#9a6a3a'); px(x,2,14,52,2,'#b98a52'); px(x,5,23,4,9,'#2a2e33'); px(x,47,23,4,9,'#2a2e33'); px(x,0,4,4,20,'#2a2e33'); px(x,52,4,4,20,'#2a2e33'); }, [28,32], [-26,-10,52,9]);
  P('poste_duplo', 40, 88, (x)=>{ px(x,18,14,4,72,'#2c3a33'); px(x,14,84,12,4,'#1f2924'); px(x,4,12,32,3,'#2c3a33'); px(x,0,14,10,8,'#2c3a33'); px(x,30,14,10,8,'#2c3a33'); px(x,1,20,8,4,'#ffe9a3'); px(x,31,20,8,4,'#ffe9a3'); }, [20,87], [-4,-5,8,4]);
  P('arvore_calcada', 48, 80, (x)=>{ px(x,8,68,32,10,'#6a4a2a'); px(x,10,70,28,6,'#4a3018'); px(x,21,40,6,32,'#5a3a1e');
    const c=['#2f7a2a','#3f9a34','#57b844']; [[24,26,20],[12,32,13],[36,32,13],[24,16,14]].forEach(([cx,cy,r],i)=>{ x.fillStyle=c[i%2]; x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fill(); });
    x.fillStyle=c[2]; x.beginPath(); x.arc(20,18,7,0,Math.PI*2); x.fill(); }, [24,77], [-6,-8,12,7]);
  P('palmeira_vaso', 40, 72, (x)=>{ px(x,10,56,20,16,'#b8743a'); px(x,8,54,24,4,'#d08a4a'); px(x,18,26,4,30,'#8a6a3a');
    x.fillStyle='#3f9a34'; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; x.beginPath(); x.ellipse(20+Math.cos(a)*10,24+Math.sin(a)*6,12,4,a,0,Math.PI*2); x.fill(); } }, [20,71], [-9,-8,18,7]);

  /* ---------- casa por fora: cerca, sebe, varal, horta ---------- */
  P('cerca_branca', 64, 26, (x)=>{ for(let i=0;i<8;i++){ px(x,2+i*8,4,5,20,'#f4f0e4'); px(x,3+i*8,2,3,2,'#f4f0e4'); px(x,6+i*8,4,1,20,'#c9c2b0'); } px(x,0,9,64,3,'#e2dccd'); px(x,0,18,64,3,'#e2dccd'); }, [32,24], [-32,-6,64,5]);
  P('cerca_branca_v', 10, 66, (x)=>{ for(let j=0;j<8;j++) px(x,2,2+j*8,6,6,'#f4f0e4'); px(x,4,0,2,66,'#e2dccd'); }, [5,64], [-5,-62,10,61]);
  P('sebe', 64, 34, (x)=>{ px(x,0,8,64,24,'#2f6f2a'); for(let i=0;i<9;i++){ x.fillStyle=i%2?'#3f8a34':'#357a2e'; x.beginPath(); x.arc(4+i*7,10,7,0,Math.PI*2); x.fill(); } px(x,0,28,64,4,'#1f4a1c'); for(let i=0;i<10;i++) px(x,3+i*6,12+(i%3)*4,2,2,'#5aa844'); }, [32,32], [-32,-12,64,11]);
  P('sebe_v', 32, 72, (x)=>{ px(x,4,6,24,64,'#2f6f2a'); for(let j=0;j<9;j++){ x.fillStyle=j%2?'#3f8a34':'#357a2e'; x.beginPath(); x.arc(16,8+j*7,12,0,Math.PI*2); x.fill(); } }, [16,70], [-12,-64,24,63]);
  P('varal', 72, 52, (x)=>{ px(x,2,8,3,44,'#6a4a2a'); px(x,67,8,3,44,'#6a4a2a'); x.strokeStyle='#ddd'; x.lineWidth=1; x.beginPath(); x.moveTo(3,10); x.quadraticCurveTo(36,16,68,10); x.stroke();
    const roupa=[['#e8442a',10,14],['#2e6ab8',22,12],['#f2ece0',36,16],['#ffe066',50,12],['#3a9a52',58,14]]; roupa.forEach(([c,xx,h])=>{ px(x,xx,12,9,h,c); px(x,xx,12,9,2,'rgba(0,0,0,.15)'); }); }, [36,51], [-4,-4,8,3]);
  P('caixa_dagua', 40, 60, (x)=>{ px(x,6,30,4,30,'#7a7d80'); px(x,30,30,4,30,'#7a7d80'); x.fillStyle='#3a6d8f'; x.beginPath(); x.ellipse(20,22,18,10,0,0,Math.PI*2); x.fill(); px(x,2,10,36,14,'#3a6d8f'); x.fillStyle='#5a8faf'; x.beginPath(); x.ellipse(20,10,18,7,0,0,Math.PI*2); x.fill(); }, [20,59], [-14,-6,28,5]);
  P('vaso_flor', 24, 26, (x)=>{ sombra(x,12,24,9,2); px(x,5,14,14,10,'#b8743a'); px(x,4,12,16,3,'#d08a4a'); x.fillStyle='#3f9a34'; x.beginPath(); x.arc(12,9,8,0,Math.PI*2); x.fill(); [['#ff6a8a',8,6],['#ffe066',14,4],['#c9a8ff',15,10],['#fff',9,11]].forEach(([c,a,b])=>px(x,a,b,3,3,c)); }, [12,24], [-8,-6,16,5]);
  P('jardineira', 64, 22, (x)=>{ px(x,0,10,64,12,'#8a5a32'); px(x,0,10,64,2,'#a8743e'); for(let i=0;i<10;i++){ px(x,3+i*6,4,4,8,'#3f9a34'); px(x,3+i*6,2,4,4,['#ff6a8a','#ffe066','#fff','#c9a8ff'][i%4]); } }, [32,21], [-32,-8,64,7]);
  P('horta_couve', 32, 24, (x)=>{ for(let i=0;i<3;i++){ x.fillStyle=['#3f9a34','#57b844','#2f7a2a'][i]; x.beginPath(); x.arc(6+i*10,14,6,0,Math.PI*2); x.fill(); } }, [16,22], null);
  P('regador', 22, 16, (x)=>{ px(x,4,4,12,10,'#5aa0b8'); px(x,15,6,6,2,'#5aa0b8'); px(x,6,1,8,3,'#3a7a90'); }, [11,15], null);
  P('carrinho_falafel', 72, 64, (x)=>{ sombra(x,36,60,32,4); px(x,6,58,8,6,'#222'); px(x,58,58,8,6,'#222'); px(x,4,28,64,30,'#d9d4c4'); px(x,4,28,64,4,'#f2ede0'); px(x,10,36,52,14,'#c4352f');
    x.fillStyle='#fff'; x.font='bold 8px monospace'; x.fillText('FALAFEL',14,46); for(let i=0;i<8;i++) px(x,i*9,4,9,18,i%2?'#2f9a4a':'#f2ece0'); px(x,4,4,2,24,'#5a5a5a'); px(x,66,4,2,24,'#5a5a5a'); }, [36,62], [-32,-20,64,19]);
  P('mesa_bistro', 48, 40, (x)=>{ sombra(x,24,37,18,3); px(x,22,16,4,20,'#3a3f45'); x.fillStyle='#e8e4da'; x.beginPath(); x.arc(24,14,12,0,Math.PI*2); x.fill(); px(x,0,22,10,14,'#2a2e33'); px(x,38,22,10,14,'#2a2e33'); px(x,1,22,8,4,'#c4352f'); px(x,39,22,8,4,'#c4352f'); x.fillStyle='#e8442a'; x.beginPath(); x.moveTo(8,8); x.quadraticCurveTo(24,-6,40,8); x.fill(); }, [24,38], [-20,-10,40,9]);
  P('chafariz', 96, 72, (x)=>{ sombra(x,48,64,46,8); x.fillStyle='#c9bd9a'; x.beginPath(); x.ellipse(48,48,46,20,0,0,Math.PI*2); x.fill(); x.fillStyle='#3d82b8'; x.beginPath(); x.ellipse(48,46,40,15,0,0,Math.PI*2); x.fill();
    x.fillStyle='#7fc4e8'; x.beginPath(); x.ellipse(40,44,16,5,0,0,Math.PI*2); x.fill(); px(x,42,14,12,32,'#d8cba9'); x.fillStyle='#d8cba9'; x.beginPath(); x.ellipse(48,16,16,6,0,0,Math.PI*2); x.fill();
    x.fillStyle='rgba(180,230,255,.85)'; px(x,46,0,4,16,'rgba(180,230,255,.85)'); px(x,36,10,3,10,'rgba(180,230,255,.6)'); px(x,57,10,3,10,'rgba(180,230,255,.6)'); }, [48,68], [-44,-28,88,26]);
  P('estatua', 40, 84, (x)=>{ px(x,4,60,32,24,'#9a917c'); px(x,2,58,36,4,'#b8ad94'); px(x,14,22,12,38,'#8a9a8a'); x.fillStyle='#8a9a8a'; x.beginPath(); x.arc(20,16,7,0,Math.PI*2); x.fill(); px(x,24,24,10,4,'#8a9a8a'); px(x,32,14,3,12,'#8a9a8a'); px(x,10,66,20,3,'#7a7058'); }, [20,83], [-17,-14,34,13]);
  P('escorregador', 64, 64, (x)=>{ sombra(x,32,60,30,4); px(x,4,10,4,52,'#e0a92a'); px(x,22,10,4,52,'#e0a92a'); for(let j=16;j<60;j+=8) px(x,4,j,22,2,'#c98e1a'); px(x,2,6,26,6,'#e8442a'); x.fillStyle='#2e6ab8'; x.beginPath(); x.moveTo(26,8); x.lineTo(34,8); x.lineTo(62,56); x.lineTo(54,62); x.fill(); }, [32,61], [-28,-12,56,11]);
  P('balanco', 72, 60, (x)=>{ px(x,2,4,4,56,'#c4352f'); px(x,66,4,4,56,'#c4352f'); px(x,0,2,72,5,'#a02a20'); for(const sx of [18,46]){ px(x,sx,7,1,34,'#999'); px(x,sx+10,7,1,34,'#999'); px(x,sx-2,40,14,4,'#2e6ab8'); } }, [36,59], [-34,-6,68,5]);
  P('caixa_areia', 64, 40, (x)=>{ px(x,0,6,64,32,'#8a5a32'); px(x,4,10,56,24,'#e7cf6a'); px(x,14,18,8,6,'#d8b850'); px(x,40,14,10,4,'#e8442a'); px(x,44,22,6,6,'#2e6ab8'); }, [32,38], null);
  P('outdoor', 128, 112, (x)=>{ px(x,30,60,6,52,'#5c6469'); px(x,92,60,6,52,'#5c6469'); px(x,0,0,128,66,'#2a2e33'); px(x,3,3,122,60,'#1a2a4a');
    x.fillStyle='#ffe066'; x.font='bold 13px monospace'; x.textAlign='center'; x.fillText('M.B.JW INDUSTRIES',64,24); x.fillStyle='#7fe3ff'; x.font='bold 9px monospace'; x.fillText('"O FUTURO É AGORA."',64,40); x.fillStyle='#ff9a9a'; x.fillText('(AGORA = 03:33)',64,54); }, [64,111], [-34,-6,68,5]);
  P('antena_parabolica', 32, 30, (x)=>{ px(x,14,18,4,12,'#7a7d80'); x.fillStyle='#d8dde0'; x.beginPath(); x.ellipse(16,12,14,10,-0.4,0,Math.PI*2); x.fill(); x.fillStyle='#b0b6ba'; x.beginPath(); x.ellipse(17,13,9,6,-0.4,0,Math.PI*2); x.fill(); }, [16,29], [-6,-4,12,3]);
  P('pombos', 30, 12, (x)=>{ for(const [a,b] of [[2,4],[12,6],[22,3]]){ px(x,a,b,6,4,'#8a8f9a'); px(x,a+5,b-1,3,3,'#6a6f7a'); px(x,a+7,b,1,1,'#e8a02a'); } }, [15,11], null);
  P('gato', 20, 16, (x)=>{ px(x,3,6,11,7,'#e08a3a'); px(x,12,2,6,6,'#e08a3a'); px(x,12,1,2,2,'#e08a3a'); px(x,16,1,2,2,'#e08a3a'); px(x,0,8,4,2,'#c06a2a'); px(x,13,4,1,1,'#222'); px(x,16,4,1,1,'#222'); }, [9,14], null);
  P('mesa_piquenique', 72, 46, (x)=>{ sombra(x,36,43,32,3); px(x,4,4,64,6,'#8a5a32'); px(x,0,14,72,12,'#9a6a3a'); px(x,0,14,72,2,'#b98a52'); px(x,4,30,64,6,'#8a5a32'); px(x,8,26,4,16,'#5a3a1e'); px(x,60,26,4,16,'#5a3a1e'); px(x,20,16,10,6,'#f2ece0'); px(x,22,17,6,4,'#e8442a'); }, [36,44], [-34,-24,68,23]);
  P('rede_volei', 128, 40, (x)=>{ px(x,2,0,4,40,'#d8d4c4'); px(x,122,0,4,40,'#d8d4c4'); for(let i=0;i<5;i++) px(x,6,4+i*4,116,1,'#f2ece0'); for(let i=0;i<29;i++) px(x,6+i*4,4,1,17,'#f2ece0'); }, [64,39], [-2,-4,4,3]);
  P('prancha', 18, 56, (x)=>{ x.fillStyle='#2ab0c0'; x.beginPath(); x.ellipse(9,28,8,27,0,0,Math.PI*2); x.fill(); px(x,8,4,2,48,'#ffe066'); }, [9,55], null);
  P('cadeira_praia', 30, 30, (x)=>{ for(let j=0;j<5;j++) px(x,4,4+j*4,22,4,j%2?'#2e6ab8':'#f2ece0'); px(x,2,22,4,8,'#8a6a3a'); px(x,24,22,4,8,'#8a6a3a'); }, [15,29], null);
  P('caiaque', 80, 22, (x)=>{ x.fillStyle='#e8642a'; x.beginPath(); x.ellipse(40,11,38,9,0,0,Math.PI*2); x.fill(); x.fillStyle='#2a2a2a'; x.beginPath(); x.ellipse(40,11,9,5,0,0,Math.PI*2); x.fill(); }, [40,20], null);
  P('rede_pesca', 48, 26, (x)=>{ x.strokeStyle='#8a7a5a'; for(let i=0;i<8;i++){ x.beginPath(); x.moveTo(i*6,2); x.lineTo(i*6+10,24); x.stroke(); x.beginPath(); x.moveTo(i*6+10,2); x.lineTo(i*6,24); x.stroke(); } }, [24,25], null);
  P('ancora', 30, 36, (x)=>{ px(x,13,4,4,26,'#4a4f55'); px(x,6,8,18,3,'#4a4f55'); x.strokeStyle='#4a4f55'; x.lineWidth=4; x.beginPath(); x.arc(15,22,11,0.1,Math.PI-0.1); x.stroke(); x.beginPath(); x.arc(15,4,3,0,Math.PI*2); x.stroke(); }, [15,35], [-10,-6,20,5]);
  P('pilha_pneus', 40, 40, (x)=>{ for(let j=0;j<3;j++){ x.fillStyle='#1b1b1f'; x.beginPath(); x.ellipse(20,32-j*10,18,7,0,0,Math.PI*2); x.fill(); x.fillStyle='#3a3a40'; x.beginPath(); x.ellipse(20,31-j*10,8,3,0,0,Math.PI*2); x.fill(); } }, [20,39], [-17,-10,34,9]);
  P('carro_sucata', 68, 40, (x)=>{ sombra(x,34,35,32,5); px(x,2,12,64,22,'#7a5a4a'); px(x,2,30,64,4,'#4a3a30'); px(x,16,4,34,16,'#5a4a40'); px(x,18,5,30,13,'#6a5040'); px(x,21,6,24,4,'#2a2a2a'); for(let i=0;i<8;i++) px(x,6+i*7,14+(i%3)*5,4,3,'#a8643a'); px(x,50,30,10,8,'#1b1b1f'); }, [34,38], [-32,-16,64,15]);

  /* ---------- fachada de loja (toldo + vitrine), por cima da casa ---------- */
  ['verm','verde','azul','amar'].forEach(k=>{
    const c={ verm:['#c4352f','#f2ece0'], verde:['#2f9a4a','#f6efd8'], azul:['#2f5fc4','#f2ece0'], amar:['#e0a92a','#7a3a1a'] }[k];
    P('toldo_'+k, 64, 18, (x)=>{ for(let i=0;i<8;i++) px(x,i*8,0,8,12,c[i%2]); for(let i=0;i<8;i++){ x.fillStyle=c[i%2]; x.beginPath(); x.arc(i*8+4,12,4,0,Math.PI); x.fill(); } px(x,0,0,64,2,'rgba(0,0,0,.25)'); }, [32,17], null);
  });

  /* ================= INTERIORES: peças desenhadas ================= */
  P('tv', 40, 40, (x)=>{ px(x,4,24,32,14,'#6a4a2a'); px(x,4,24,32,2,'#8a6a3a'); px(x,6,2,28,22,'#1b1b1f'); px(x,8,4,24,16,'#2a4a6a'); x.fillStyle='#7fe3ff'; x.font='bold 7px monospace'; x.fillText('03:33',9,15); px(x,18,0,1,3,'#555'); }, [20,38], [-16,-12,32,11]);
  P('geladeira', 30, 58, (x)=>{ sombra(x,15,56,13,2); px(x,2,2,26,54,'#e8ecee'); px(x,2,2,26,2,'#ffffff'); px(x,2,22,26,2,'#b8bec2'); px(x,22,8,2,10,'#8a9094'); px(x,22,28,2,16,'#8a9094'); px(x,6,30,8,6,'#ffe066'); px(x,8,40,6,4,'#ff6a8a'); }, [15,56], [-13,-12,26,11]);
  P('pia', 40, 40, (x)=>{ px(x,0,12,40,28,'#d8d4c8'); px(x,0,12,40,4,'#f2efe6'); px(x,6,16,28,10,'#9aa8b0'); px(x,8,18,24,6,'#b8c6ce'); px(x,18,6,4,10,'#a8aeb2'); px(x,14,6,12,3,'#a8aeb2'); px(x,4,30,32,8,'#b8b4a8'); px(x,19,32,2,4,'#7a7468'); }, [20,39], [-20,-14,40,13]);
  P('balcao_coz', 40, 40, (x)=>{ px(x,0,12,40,28,'#9a6a3e'); px(x,0,10,40,6,'#e8e4da'); px(x,4,20,14,16,'#8a5a32'); px(x,22,20,14,16,'#8a5a32'); px(x,15,26,2,4,'#d9a441'); px(x,23,26,2,4,'#d9a441'); px(x,6,4,8,7,'#c4352f'); px(x,26,2,8,9,'#f2ece0'); }, [20,39], [-20,-14,40,13]);
  P('mesa_jantar', 64, 48, (x)=>{ sombra(x,32,45,30,3); px(x,4,30,4,16,'#5a3a1e'); px(x,56,30,4,16,'#5a3a1e'); px(x,0,8,64,26,'#8a5a32'); px(x,0,8,64,3,'#a8743e'); px(x,8,12,48,16,'#f2ece0'); px(x,12,16,10,6,'#fff'); px(x,40,16,10,6,'#fff'); px(x,28,14,8,10,'#c4352f'); px(x,30,12,4,4,'#3f9a34'); }, [32,46], [-32,-24,64,23]);
  P('mesa_redonda', 48, 40, (x)=>{ sombra(x,24,37,20,3); px(x,21,20,6,16,'#5a3a1e'); x.fillStyle='#8a5a32'; x.beginPath(); x.ellipse(24,16,22,12,0,0,Math.PI*2); x.fill(); x.fillStyle='#a8743e'; x.beginPath(); x.ellipse(24,14,20,10,0,0,Math.PI*2); x.fill(); px(x,20,10,8,6,'#c9a050'); }, [24,38], [-20,-12,40,11]);
  P('banqueta', 18, 26, (x)=>{ px(x,4,10,2,16,'#3a3f45'); px(x,12,10,2,16,'#3a3f45'); x.fillStyle='#c4352f'; x.beginPath(); x.ellipse(9,8,8,4,0,0,Math.PI*2); x.fill(); }, [9,25], [-6,-5,12,4]);
  P('estante_pao', 64, 60, (x)=>{ px(x,0,0,64,60,'#7a4f2c'); px(x,2,2,60,56,'#5e3a1f'); for(let j=0;j<3;j++){ px(x,2,18+j*18,60,3,'#9a6a3e'); for(let i=0;i<6;i++){ const c=['#d9a45a','#c98e40','#e6b876','#b77a32'][(i+j)%4]; x.fillStyle=c; x.beginPath(); x.ellipse(8+i*10,13+j*18,5,4,0,0,Math.PI*2); x.fill(); } } }, [32,59], [-32,-12,64,11]);
  P('balcao_padaria', 96, 46, (x)=>{ px(x,0,16,96,30,'#e8e0cc'); px(x,0,14,96,4,'#c9a050'); px(x,4,18,88,16,'rgba(160,220,255,.5)'); for(let i=0;i<8;i++){ x.fillStyle=['#d9a45a','#f2c27a','#c98e40','#ff8ab0'][i%4]; x.beginPath(); x.ellipse(10+i*11,28,4,3,0,0,Math.PI*2); x.fill(); }
    px(x,4,2,18,14,'#3a3f45'); px(x,6,4,14,6,'#6cff9a'); px(x,70,4,14,10,'#d9b27a'); px(x,0,40,96,6,'#b8ae98'); }, [48,45], [-48,-22,96,21]);
  P('forno_padaria', 64, 70, (x)=>{ px(x,0,10,64,60,'#a4523a'); for(let j=0;j<7;j++){ const o=(j%2)*8; for(let i=-1;i<5;i++) px(x,i*16+o+1,10+j*8+1,14,6,['#b25e44','#a4523a','#b86a4e'][(i+j+3)%3]); }
    x.fillStyle='#2a1a10'; x.beginPath(); x.arc(32,46,16,Math.PI,0); x.fill(); px(x,16,46,32,14,'#2a1a10'); px(x,20,50,24,8,'#ff8a2a'); px(x,24,52,16,4,'#ffd04a'); px(x,24,0,16,12,'#7a7d80'); }, [32,69], [-32,-24,64,23], { luz:'#ff9a3a' });
  P('cesto_pao', 32, 24, (x)=>{ px(x,2,10,28,12,'#b8843a'); for(let i=0;i<5;i++) px(x,3+i*6,10,1,12,'#8a5a22'); for(let i=0;i<4;i++){ x.fillStyle=['#d9a45a','#e6b876'][i%2]; x.beginPath(); x.ellipse(7+i*6,8,5,4,0.3,0,Math.PI*2); x.fill(); } }, [16,22], [-14,-8,28,7]);
  P('caixa_registradora', 30, 26, (x)=>{ px(x,2,8,26,16,'#5c6469'); px(x,4,2,22,8,'#3a4248'); px(x,6,3,18,4,'#6cff9a'); for(let i=0;i<3;i++) for(let j=0;j<2;j++) px(x,6+i*7,12+j*5,5,3,'#cfd6da'); }, [15,25], [-12,-8,24,7]);
  P('cardapio', 40, 34, (x)=>{ px(x,0,0,40,30,'#2a2e33'); px(x,2,2,36,26,'#1a1e22'); x.fillStyle='#f2ece0'; x.font='bold 6px monospace'; x.fillText('MENU',12,9); for(let j=0;j<4;j++){ px(x,5,13+j*4,18,1,'#cfc8b8'); px(x,28,13+j*4,7,1,'#ffe066'); } }, [20,33], null);
  P('barril_chopp', 34, 40, (x)=>{ sombra(x,17,38,14,3); x.fillStyle='#8a5a32'; x.beginPath(); x.ellipse(17,20,15,18,0,0,Math.PI*2); x.fill(); px(x,2,10,30,3,'#4a4f55'); px(x,2,27,30,3,'#4a4f55'); px(x,15,18,4,6,'#c9a050'); }, [17,38], [-14,-10,28,9]);
  P('prateleira_garrafas', 64, 56, (x)=>{ px(x,0,0,64,56,'#5e3a1f'); for(let j=0;j<3;j++){ px(x,0,16+j*18,64,3,'#8a5a32'); for(let i=0;i<9;i++){ const c=['#2a7a4a','#7a2a2a','#c9a050','#2a4a7a','#e8e0cc'][(i*3+j)%5]; px(x,3+i*7,4+j*18,4,12,c); px(x,4+i*7,2+j*18,2,3,c); } } }, [32,55], null);
  P('mesa_escritorio', 64, 46, (x)=>{ sombra(x,32,43,30,3); px(x,0,12,64,22,'#b8b4a8'); px(x,0,12,64,3,'#d8d4c8'); px(x,2,34,4,12,'#5c6469'); px(x,58,34,4,12,'#5c6469');
    px(x,22,0,24,16,'#2a2e33'); px(x,24,2,20,11,'#2a6a8a'); px(x,26,4,10,2,'#7fe3ff'); px(x,32,16,4,2,'#2a2e33'); px(x,24,20,20,4,'#3a3f45'); px(x,6,16,12,8,'#f2ece0'); px(x,50,14,8,8,'#c4352f'); }, [32,44], [-32,-20,64,19]);
  P('cadeira_escritorio', 26, 32, (x)=>{ px(x,4,2,18,14,'#2a2e33'); px(x,3,14,20,8,'#3a3f45'); px(x,12,22,2,6,'#555'); px(x,4,28,18,2,'#555'); }, [13,31], [-9,-8,18,7]);
  P('bebedouro', 22, 50, (x)=>{ px(x,3,22,16,28,'#e8ecee'); px(x,3,22,16,2,'#fff'); px(x,5,0,12,22,'rgba(120,190,240,.7)'); px(x,5,0,12,3,'#2a6a9a'); px(x,7,30,3,3,'#3a6aff'); px(x,12,30,3,3,'#ff4a3a'); }, [11,49], [-9,-8,18,7]);
  P('elevador', 64, 64, (x)=>{ px(x,0,0,64,64,'#8f969c'); px(x,4,6,56,58,'#b8bec2'); px(x,6,10,25,54,'#cfd6da'); px(x,33,10,25,54,'#cfd6da'); px(x,31,10,2,54,'#7a8086'); px(x,24,0,16,6,'#2a2e33'); px(x,27,1,10,4,'#ff6a3a'); x.fillStyle='#ff6a3a'; x.font='bold 4px monospace'; }, [32,63], null);
  P('recepcao', 96, 48, (x)=>{ px(x,0,14,96,34,'#6a4a2a'); px(x,0,12,96,5,'#c9a050'); px(x,4,22,88,20,'#8a5a32'); for(let i=0;i<5;i++) px(x,8+i*18,26,12,12,'#7a4f2c'); px(x,70,2,16,12,'#2a2e33'); px(x,72,4,12,7,'#2a6a8a'); px(x,10,4,6,8,'#d9a441'); }, [48,47], [-48,-24,96,23]);
  P('banco_igreja', 96, 34, (x)=>{ sombra(x,48,31,46,3); px(x,0,2,96,10,'#6a4226'); px(x,0,2,96,2,'#8a5a32'); px(x,0,12,96,12,'#7a4f2c'); px(x,0,12,96,2,'#9a6a3e'); px(x,2,24,4,8,'#4a2e18'); px(x,90,24,4,8,'#4a2e18'); px(x,0,2,4,26,'#5a3a1e'); px(x,92,2,4,26,'#5a3a1e'); }, [48,32], [-48,-22,96,21]);
  P('altar', 96, 54, (x)=>{ px(x,0,20,96,34,'#e8e0cc'); px(x,0,18,96,4,'#c9a050'); px(x,8,26,80,22,'#7a2a3a'); px(x,44,26,8,22,'#c9a050'); px(x,40,34,16,6,'#c9a050');
    for(const cx of [14,82]){ px(x,cx-1,4,3,16,'#f2ece0'); px(x,cx-1,1,3,3,'#ffd04a'); px(x,cx-4,18,9,3,'#c9a050'); } }, [48,53], [-48,-28,96,27], { luz:'#ffd36a' });
  P('castical', 16, 46, (x)=>{ px(x,6,10,4,32,'#c9a050'); px(x,2,40,12,5,'#a8843a'); px(x,5,4,6,8,'#f2ece0'); x.fillStyle='#ffd04a'; x.beginPath(); x.ellipse(8,2,2,3,0,0,Math.PI*2); x.fill(); }, [8,45], [-4,-4,8,3], { luz:'#ffd36a' });
  P('vitral', 32, 56, (x)=>{ px(x,0,0,32,56,'#3a2a1a'); x.fillStyle='#3a2a1a'; px(x,3,8,26,46,'#2a1a10'); const c=['#e8442a','#2e6ab8','#ffe066','#3a9a52','#b03aa0'];
    for(let j=0;j<6;j++) for(let i=0;i<3;i++) px(x,4+i*8,10+j*7,7,6,c[(i+j*2)%5]); x.fillStyle='#ffe066'; x.beginPath(); x.arc(16,10,10,Math.PI,0); x.fill(); }, [16,55], null);
  P('relogio_parede', 28, 30, (x)=>{ x.fillStyle='#5a3a1e'; x.beginPath(); x.arc(14,14,13,0,Math.PI*2); x.fill(); x.fillStyle='#f5ecd2'; x.beginPath(); x.arc(14,14,10,0,Math.PI*2); x.fill(); x.strokeStyle='#111'; x.lineWidth=2; x.beginPath(); x.moveTo(14,14); x.lineTo(19,13); x.moveTo(14,14); x.lineTo(17,21); x.stroke(); }, [14,29], null);
  P('quadro_paisagem', 40, 30, (x)=>{ px(x,0,0,40,28,'#8a5a32'); px(x,3,3,34,22,'#7fc4e8'); px(x,3,16,34,9,'#3f9a34'); x.fillStyle='#ffe066'; x.beginPath(); x.arc(28,9,4,0,Math.PI*2); x.fill(); px(x,8,12,6,6,'#2f7a2a'); }, [20,29], null);
  P('quadro_mar', 40, 30, (x)=>{ px(x,0,0,40,28,'#c9a050'); px(x,3,3,34,22,'#f2c27a'); px(x,3,14,34,11,'#2e6ab8'); px(x,8,10,10,4,'#f2ece0'); px(x,12,6,2,4,'#5a3a1e'); }, [20,29], null);
  P('foto_familia', 24, 22, (x)=>{ px(x,0,0,24,20,'#3a2a1a'); px(x,2,2,20,16,'#e6dcc0'); px(x,5,7,4,9,'#5a3a2a'); px(x,10,6,4,10,'#2a2a3a'); px(x,15,8,4,8,'#8a3a2a'); }, [12,21], null);
  P('prateleira_parede', 48, 30, (x)=>{ px(x,0,20,48,4,'#8a5a32'); px(x,4,24,3,6,'#5a3a1e'); px(x,41,24,3,6,'#5a3a1e'); px(x,4,6,5,14,'#c4352f'); px(x,10,8,5,12,'#2e6ab8'); px(x,16,4,5,16,'#3a9a52'); x.fillStyle='#3f9a34'; x.beginPath(); x.arc(32,14,6,0,Math.PI*2); x.fill(); px(x,28,16,8,4,'#b8743a'); }, [24,29], null);
  P('calendario', 22, 28, (x)=>{ px(x,0,0,22,26,'#f2ece0'); px(x,0,0,22,7,'#c4352f'); for(let j=0;j<4;j++) for(let i=0;i<4;i++) px(x,2+i*5,9+j*4,3,2,'#8a8a8a'); px(x,12,17,4,3,'#e8442a'); }, [11,27], null);
  P('tapete_oval', 96, 56, (x)=>{ x.fillStyle='#7a2a3a'; x.beginPath(); x.ellipse(48,28,46,26,0,0,Math.PI*2); x.fill(); x.strokeStyle='#d9a441'; x.lineWidth=3; x.beginPath(); x.ellipse(48,28,38,20,0,0,Math.PI*2); x.stroke(); x.fillStyle='#d9a441'; x.beginPath(); x.ellipse(48,28,10,6,0,0,Math.PI*2); x.fill(); }, [48,55], null);
  P('tapete_azul', 96, 64, (x)=>{ px(x,0,0,96,64,'#2a4a7a'); px(x,4,4,88,56,'#3a6aa0'); px(x,10,10,76,44,'#2a4a7a'); for(let i=0;i<12;i++) px(x,i*8+2,0,2,4,'#e8e0cc'); for(let i=0;i<12;i++) px(x,i*8+2,60,2,4,'#e8e0cc'); }, [48,63], null);
  P('banheira', 64, 40, (x)=>{ px(x,0,6,64,32,'#e8ecee'); px(x,0,6,64,3,'#fff'); px(x,4,10,56,22,'#b8dcec'); px(x,6,12,16,4,'#e0f4ff'); px(x,56,2,4,8,'#a8aeb2'); }, [32,38], [-32,-26,64,25]);
  P('estante_metal', 64, 64, (x)=>{ px(x,0,0,4,64,'#5c6469'); px(x,60,0,4,64,'#5c6469'); for(let j=0;j<4;j++){ px(x,0,12+j*16,64,3,'#7a8389'); for(let i=0;i<3;i++) px(x,6+i*19,2+j*16,16,10,['#9a6a3a','#b98a52','#8a5a32'][(i+j)%3]); } }, [32,63], [-32,-12,64,11]);
  P('empilhadeira', 48, 56, (x)=>{ sombra(x,24,53,22,3); px(x,4,22,32,26,'#e0a92a'); px(x,6,8,24,16,'#2a2e33'); px(x,8,10,20,10,'#7fd8ff'); px(x,38,0,4,52,'#3a3f45'); px(x,36,44,12,4,'#5c6469'); px(x,4,44,10,10,'#1b1b1f'); px(x,26,44,10,10,'#1b1b1f'); }, [24,54], [-22,-16,44,15]);
  P('engrenagem_g', 64, 64, (x)=>{ x.fillStyle='#8a6a32'; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; x.save(); x.translate(32+Math.cos(a)*24,32+Math.sin(a)*24); x.rotate(a); x.fillRect(-5,-5,10,10); x.restore(); }
    x.beginPath(); x.arc(32,32,24,0,Math.PI*2); x.fill(); x.fillStyle='#a8843a'; x.beginPath(); x.arc(32,32,18,0,Math.PI*2); x.fill(); x.fillStyle='#5a4420'; x.beginPath(); x.arc(32,32,6,0,Math.PI*2); x.fill(); for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+0.4; x.fillRect(32+Math.cos(a)*11-3,32+Math.sin(a)*11-3,6,6); } }, [32,63], [-28,-20,56,19]);
  P('pendulo', 32, 96, (x)=>{ px(x,0,0,32,10,'#5a3a1e'); px(x,15,10,2,66,'#c9a050'); x.fillStyle='#ffe066'; x.beginPath(); x.arc(16,82,12,0,Math.PI*2); x.fill(); x.fillStyle='#c9a050'; x.beginPath(); x.arc(16,82,7,0,Math.PI*2); x.fill(); }, [16,95], [-10,-8,20,7]);
  P('maquina_relogio', 64, 72, (x)=>{ px(x,0,20,64,52,'#4a3a2a'); px(x,2,22,60,48,'#6a5040'); for(let i=0;i<3;i++){ x.fillStyle=['#c9a050','#a8843a','#8a6a32'][i]; x.beginPath(); x.arc(16+i*16,40+(i%2)*10,9,0,Math.PI*2); x.fill(); } px(x,24,0,16,20,'#3a3f45'); px(x,28,4,8,8,'#ff4a3a'); }, [32,71], [-32,-24,64,23]);
  P('caixa_ferramentas', 34, 20, (x)=>{ px(x,1,6,32,13,'#c4352f'); px(x,1,6,32,2,'#e8645a'); px(x,11,1,12,6,'#5a5a5a'); px(x,13,3,8,3,'#c4352f'); }, [17,19], [-15,-7,30,6]);
  P('cama_hospital', 40, 80, (x)=>{ px(x,2,8,36,68,'#e8ecee'); px(x,2,6,36,6,'#8f969c'); px(x,6,12,28,14,'#ffffff'); px(x,4,30,32,44,'#9fc7d8'); px(x,2,74,36,4,'#8f969c'); }, [20,78], [-18,-60,36,59]);
  P('tapete_bemvindo', 40, 20, (x)=>{ px(x,0,0,40,20,'#8a5a32'); px(x,2,2,36,16,'#b8843a'); x.fillStyle='#4a2e18'; x.font='bold 6px monospace'; x.fillText('SHALOM',6,13); }, [20,19], null);

  /* ================= PUZZLES (Torre do Relógio, ferro-velho, exército) ================= */
  const engr=(x, giro, cor)=>{ x.save(); x.translate(32,30); x.fillStyle=cor||'#8a6a32';
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; x.save(); x.rotate(a); x.fillRect(-5,-27,10,9); x.restore(); }
    x.beginPath(); x.arc(0,0,21,0,Math.PI*2); x.fill(); x.fillStyle='#a8843a'; x.beginPath(); x.arc(0,0,15,0,Math.PI*2); x.fill();
    x.rotate(giro*Math.PI/2); x.fillStyle='#ffe066'; x.beginPath(); x.moveTo(0,-15); x.lineTo(8,-2); x.lineTo(3,-2); x.lineTo(3,10); x.lineTo(-3,10); x.lineTo(-3,-2); x.lineTo(-8,-2); x.fill(); x.restore(); };
  for(let g=0; g<4; g++) P('engrenagem_seta_'+g, 64, 64, (x)=>engr(x, g), [32,63], [-24,-18,48,17]);
  P('alavanca', 30, 40, (x)=>{ px(x,4,30,22,8,'#4a4f55'); px(x,6,28,18,4,'#6a7075'); x.save(); x.translate(15,30); x.rotate(-0.5); px(x,-2,-24,4,24,'#8a8f95'); x.restore(); x.fillStyle='#c4352f'; x.beginPath(); x.arc(4,8,5,0,Math.PI*2); x.fill(); }, [15,39], [-11,-8,22,7]);
  P('cadeado_relogio', 30, 34, (x)=>{ x.strokeStyle='#8f969c'; x.lineWidth=4; x.beginPath(); x.arc(15,12,8,Math.PI,0); x.stroke(); x.fillStyle='#c9a050'; x.beginPath(); x.arc(15,22,11,0,Math.PI*2); x.fill(); x.fillStyle='#f5ecd2'; x.beginPath(); x.arc(15,22,8,0,Math.PI*2); x.fill(); x.strokeStyle='#111'; x.lineWidth=1.5; x.beginPath(); x.moveTo(15,22); x.lineTo(15,16); x.moveTo(15,22); x.lineTo(19,25); x.stroke(); }, [15,33], null);
  for(let d=0; d<10; d++) P('digito_'+d, 30, 46, (x)=>{ px(x,3,8,24,34,'#3a2a1a'); px(x,5,10,20,30,'#f5ecd2'); px(x,3,4,24,5,'#c9a050'); px(x,3,40,24,5,'#c9a050');
    x.fillStyle='#1a1208'; x.font='bold 20px monospace'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(d),15,26); px(x,5,10,20,2,'rgba(0,0,0,.15)'); }, [15,45], [-12,-8,24,7]);
  P('painel_relogio', 40, 44, (x)=>{ px(x,4,10,32,32,'#4a3a2a'); px(x,7,13,26,18,'#1a1a1a'); x.fillStyle='#7fe3ff'; x.font='bold 9px monospace'; x.textAlign='center'; x.fillText('TESTAR',20,25); px(x,14,34,12,5,'#c4352f'); px(x,10,4,20,8,'#c9a050'); }, [20,43], [-16,-10,32,9]);
  ['I','II','III'].forEach((rom,i)=>P('pendulo_'+(i+1), 34, 96, (x)=>{ px(x,1,0,32,12,'#5a3a1e'); px(x,16,12,2,62,'#c9a050');
    x.fillStyle='#ffe066'; x.beginPath(); x.arc(17,80,12,0,Math.PI*2); x.fill(); x.fillStyle='#c9a050'; x.beginPath(); x.arc(17,80,8,0,Math.PI*2); x.fill();
    x.fillStyle='#f5ecd2'; x.font='bold 9px serif'; x.textAlign='center'; x.fillText(rom,17,9); }, [17,95], [-10,-8,20,7]));
  P('escada_sobe', 32, 64, (x)=>{ px(x,0,0,32,64,'#2a2018'); for(let j=0;j<8;j++){ px(x,2,58-j*7,28,5,['#8a7a62','#7a6a54'][j%2]); px(x,2,58-j*7,28,1,'#a89a7c'); } px(x,0,0,3,64,'#5a4a3a'); px(x,29,0,3,64,'#5a4a3a'); }, [16,63], null);
  P('placa_parede', 64, 30, (x)=>{ px(x,0,0,64,28,'#3a2a1a'); px(x,2,2,60,24,'#d8cba9'); for(let j=0;j<3;j++) px(x,6,7+j*6,52-(j%2)*10,2,'#5a4a3a'); }, [32,29], null);
  P('relogio_gigante', 160, 150, (x)=>{ x.fillStyle='#bfe9ff'; x.beginPath(); x.arc(80,70,68,0,Math.PI*2); x.fill(); x.fillStyle='#2a5a7a'; x.beginPath(); x.arc(80,70,60,0,Math.PI*2); x.fill(); x.fillStyle='#d8eef8'; x.beginPath(); x.arc(80,70,54,0,Math.PI*2); x.fill();
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; px(x,80+Math.sin(a)*46-2,70-Math.cos(a)*46-2,4,4,'#0e2a44'); }
    x.strokeStyle='#0e2a44'; x.lineWidth=5; x.beginPath(); x.moveTo(80,70); x.lineTo(80+Math.sin(1.7)*26,70-Math.cos(1.7)*26); x.stroke(); x.lineWidth=3; x.beginPath(); x.moveTo(80,70); x.lineTo(80+Math.sin(3.45)*40,70-Math.cos(3.45)*40); x.stroke();
    px(x,60,136,40,14,'#2a3a48'); for(let i=0;i<8;i++) px(x,10+i*19,0,5,14+((i*7)%10),'#bfe9ff'); }, [80,149], [-60,-14,120,13], { luz:'#9fe8ff' });
  P('androide_off', 40, 34, (x)=>{ px(x,4,22,32,10,'#cfd6da'); px(x,8,14,18,12,'#e8eef0'); px(x,22,8,12,12,'#e8eef0'); px(x,24,12,8,3,'#123'); px(x,26,13,2,1,'#3a5a6a'); px(x,10,18,10,2,'#2ac7c0'); px(x,2,26,8,6,'#b8c0c4'); px(x,30,26,8,6,'#b8c0c4'); }, [20,33], [-16,-10,32,9]);

  /* ================= SMERGULUS KINGDOM ================= */
  A.ARQ.castelo_rainha='modohistoria/assets/gerados/castelo_rainha.png';
  A.spr('castelo_rainha', { img:'castelo_rainha', r:[0,0,600,700], auto:true, semCol:true });
  const cone=(x,cx,base,topo,larg,c1,c2)=>{ x.fillStyle=c1; x.beginPath(); x.moveTo(cx-larg,base); x.lineTo(cx,topo); x.lineTo(cx+larg,base); x.fill(); x.fillStyle=c2; x.beginPath(); x.moveTo(cx,topo); x.lineTo(cx+larg,base); x.lineTo(cx,base); x.fill(); };
  P('vulcao', 224, 176, (x)=>{ cone(x,112,170,30,108,'#3a2e2e','#2a2020'); px(x,86,24,52,14,'#2a2020'); x.fillStyle='#ff6a2a'; x.beginPath(); x.ellipse(112,30,26,8,0,0,Math.PI*2); x.fill(); x.fillStyle='#ffd04a'; x.beginPath(); x.ellipse(112,30,14,4,0,0,Math.PI*2); x.fill();
    for(const [a,b,h] of [[100,38,60],[120,40,90],[110,36,40]]){ px(x,a,b,5,h,'#e8542a'); px(x,a+1,b,2,h-10,'#ffb03c'); }
    for(let i=0;i<5;i++){ x.fillStyle='rgba(90,80,90,.55)'; x.beginPath(); x.arc(100+i*8,16-i*3,8+i,0,Math.PI*2); x.fill(); } }, [112,170], [-90,-40,180,38], { luz:'#ff7a3c' });
  P('vulcao_peq', 128, 100, (x)=>{ cone(x,64,96,22,60,'#3a2e2e','#2a2020'); x.fillStyle='#ff6a2a'; x.beginPath(); x.ellipse(64,22,14,5,0,0,Math.PI*2); x.fill(); px(x,60,26,4,40,'#e8542a'); }, [64,96], [-50,-24,100,22], { luz:'#ff7a3c' });
  P('represa', 192, 96, (x)=>{ px(x,0,30,192,60,'#4a4450'); for(let i=0;i<192;i+=16) px(x,i,30,14,58,['#5a5462','#524c5a'][(i/16)%2]); px(x,0,24,192,10,'#6a6274'); px(x,0,86,192,8,'#2a2630');
    for(let i=0;i<4;i++){ px(x,24+i*42,40,24,36,'#3a2a4a'); px(x,28+i*42,44,16,28,'#5a3a7a'); px(x,34+i*42,36,4,8,'#8a8f95'); } x.fillStyle='#7fc4e8'; for(let i=0;i<4;i++) px(x,30+i*42,88,12,8,'rgba(127,196,232,.8)'); }, [96,92], [-96,-30,192,28]);
  P('ponte_erguida', 104, 104, (x)=>{ px(x,4,0,96,90,'#5a3a1e'); for(let i=0;i<6;i++) px(x,4+i*16,0,14,90,['#7a4f2c','#6a4226'][i%2]); px(x,0,0,6,104,'#3a3f45'); px(x,98,0,6,104,'#3a3f45'); x.strokeStyle='#8a8f95'; x.lineWidth=3; x.beginPath(); x.moveTo(6,4); x.lineTo(30,-40); x.moveTo(98,4); x.lineTo(74,-40); x.stroke();
    x.fillStyle='#a24bff'; x.beginPath(); x.arc(52,46,12,0,Math.PI*2); x.fill(); px(x,46,40,12,14,'#5a2a8a'); px(x,50,30,4,10,'#8a8f95'); }, [52,103], null);
  P('estandarte_reino', 30, 76, (x)=>{ px(x,13,0,4,76,'#3a3f45'); px(x,2,6,26,34,'#5a2a8a'); px(x,2,6,26,4,'#7a3aaa'); x.fillStyle='#ffd34a'; x.beginPath(); x.moveTo(8,24); x.lineTo(10,16); x.lineTo(15,21); x.lineTo(20,16); x.lineTo(22,24); x.fill(); x.fillStyle='#5a2a8a'; x.beginPath(); x.moveTo(2,40); x.lineTo(15,48); x.lineTo(28,40); x.fill(); }, [15,75], [-4,-4,8,3]);
  P('estatua_rainha', 72, 128, (x)=>{ px(x,8,96,56,32,'#4a3a5a'); px(x,4,92,64,6,'#6a5a7a'); px(x,14,108,44,4,'#ffd34a');
    x.fillStyle='#7a7484'; x.beginPath(); x.moveTo(20,92); x.lineTo(28,44); x.lineTo(44,44); x.lineTo(52,92); x.fill(); x.beginPath(); x.arc(36,34,12,0,Math.PI*2); x.fill();
    x.fillStyle='#6a6474'; for(let i=0;i<6;i++){ x.beginPath(); x.arc(26+i*4,26-(i%2)*3,7,0,Math.PI*2); x.fill(); }
    x.fillStyle='#ffd34a'; x.beginPath(); x.moveTo(26,22); x.lineTo(28,12); x.lineTo(32,18); x.lineTo(36,10); x.lineTo(40,18); x.lineTo(44,12); x.lineTo(46,22); x.fill(); px(x,46,52,14,4,'#7a7484'); px(x,58,40,4,16,'#ffd34a'); }, [36,127], [-30,-30,60,28]);
  P('estatua_fat', 72, 116, (x)=>{ px(x,8,86,56,30,'#4a3a5a'); px(x,4,82,64,6,'#6a5a7a'); x.fillStyle='#7a7484'; x.beginPath(); x.ellipse(36,60,26,26,0,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(36,26,13,0,Math.PI*2); x.fill(); x.fillStyle='#6a6474'; x.beginPath(); x.arc(36,18,11,Math.PI,0); x.fill();
    px(x,10,96,52,10,'#3a2a4a'); x.fillStyle='#ffd34a'; x.font='bold 8px monospace'; x.textAlign='center'; x.fillText('SÓ EXISTE UM',36,104); }, [36,115], [-30,-28,60,26]);
  P('rampa_exclusiva', 96, 48, (x)=>{ x.fillStyle='#5e4a6e'; x.beginPath(); x.moveTo(0,46); x.lineTo(96,10); x.lineTo(96,46); x.fill(); x.fillStyle='#6e5a86'; x.beginPath(); x.moveTo(0,46); x.lineTo(96,10); x.lineTo(96,16); x.lineTo(6,46); x.fill(); px(x,70,30,24,10,'#ffd34a'); x.fillStyle='#3a2a4a'; x.font='bold 6px monospace'; x.fillText('SÓ O FAT',71,38); }, [48,47], [-44,-14,92,13]);
  P('casinha_orelha', 72, 72, (x)=>{ px(x,8,30,56,40,'#8a5a32'); for(let i=0;i<4;i++) px(x,8,34+i*9,56,2,'#6a4226'); x.fillStyle='#5a2a1e'; x.beginPath(); x.moveTo(0,34); x.lineTo(36,4); x.lineTo(72,34); x.fill(); x.fillStyle='#7a3a2a'; x.beginPath(); x.moveTo(36,4); x.lineTo(72,34); x.lineTo(36,34); x.fill();
    x.fillStyle='#1a1008'; x.beginPath(); x.arc(36,58,12,Math.PI,0); x.fill(); px(x,24,58,24,12,'#1a1008'); px(x,20,36,32,10,'#f2e6c4'); x.fillStyle='#3a2a1a'; x.font='bold 8px monospace'; x.textAlign='center'; x.fillText('ORELHA',36,44); }, [36,70], [-30,-28,60,27]);
  P('bueiro_grande', 64, 40, (x)=>{ px(x,0,4,64,34,'#2a2a30'); px(x,4,8,56,26,'#1a1a20'); for(let i=0;i<7;i++) px(x,6+i*8,8,3,26,'#5a5a64'); px(x,4,18,56,3,'#5a5a64'); }, [32,38], null, { chao:true });
  P('boneco_treino', 30, 56, (x)=>{ px(x,13,30,4,26,'#5a3a1e'); px(x,4,22,22,4,'#5a3a1e'); x.fillStyle='#d9b36a'; x.beginPath(); x.ellipse(15,30,9,12,0,0,Math.PI*2); x.fill(); x.beginPath(); x.arc(15,12,7,0,Math.PI*2); x.fill(); px(x,8,4,14,5,'#f2f2f2'); px(x,18,6,7,2,'#f2f2f2'); }, [15,55], [-6,-6,12,5]);
  P('cancela', 224, 60, (x)=>{ px(x,0,20,12,40,'#3a2a4a'); px(x,212,20,12,40,'#3a2a4a'); for(let i=0;i<13;i++) px(x,12+i*16,30,16,10,i%2?'#a24bff':'#f2ece0'); px(x,12,28,200,2,'#2a1e36'); px(x,96,0,32,24,'#5a2a8a'); x.fillStyle='#ffd34a'; x.font='bold 8px monospace'; x.textAlign='center'; x.fillText('PEDÁGIO',112,14); }, [112,59], null);
  P('guarita', 64, 80, (x)=>{ px(x,4,24,56,56,'#4a3a5a'); px(x,8,34,48,20,'#1a1a2a'); px(x,10,36,44,16,'#ffcf6a'); x.fillStyle='#2a1e36'; x.beginPath(); x.moveTo(0,26); x.lineTo(32,0); x.lineTo(64,26); x.fill(); px(x,24,56,16,24,'#2a1e36'); }, [32,79], [-28,-22,56,21], { luz:'#ffcf6a' });
  P('alma', 24, 34, (x)=>{ x.fillStyle='rgba(235,240,255,.85)'; x.beginPath(); x.arc(12,11,9,Math.PI,0); x.lineTo(21,26); x.lineTo(17,22); x.lineTo(12,28); x.lineTo(7,22); x.lineTo(3,26); x.closePath(); x.fill(); px(x,8,9,2,3,'#3a2a5a'); px(x,14,9,2,3,'#3a2a5a'); px(x,10,15,4,2,'#3a2a5a'); }, [12,33], null, { luz:'#e8f0ff', semContorno:true });
  P('potinho_alma', 18, 22, (x)=>{ px(x,3,6,12,15,'rgba(200,230,255,.55)'); px(x,2,4,14,3,'#8a8f95'); x.fillStyle='rgba(255,255,255,.95)'; x.beginPath(); x.arc(9,14,4,0,Math.PI*2); x.fill(); }, [9,21], [-6,-5,12,4], { luz:'#e8f4ff' });
  P('peso_academia', 64, 34, (x)=>{ px(x,8,14,48,6,'#8f969c'); for(const c of [0,52]){ px(x,c,4,12,26,'#2a2e33'); px(x,c+2,6,8,22,'#4a4f55'); } }, [32,33], [-30,-10,60,9]);
  P('pombo_correio', 22, 18, (x)=>{ px(x,4,6,12,8,'#8a8f9a'); px(x,14,3,6,6,'#6a6f7a'); px(x,19,5,3,2,'#e8a02a'); px(x,2,8,4,4,'#5a5f6a'); px(x,8,14,8,3,'#f2ece0'); }, [11,17], null);

  /* peças "de chão": desenhadas antes de tudo (gente pisa em cima) */
  ['tapete_oval','tapete_azul','tapete_bemvindo','faixa_ped_h','faixa_ped_v','vaga','bueiro','horta_couve','caixa_areia','toalha_praia']
    .forEach(n=>A.pecaChao(n));
  // traço fino / transparente: contorno estragaria
  ['pombos','rede_pesca','rede_volei','varal','cabos','boia','bicicleta','bicicletario','cortina']
    .forEach(n=>A.pecaSemContorno(n));
})();
