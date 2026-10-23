/* ============================================================
   MAPA — SMERGULUS KINGDOM (180 × 140 tiles)
   O reino da rainha Smergula, no noroeste do mapa.png: terra escura
   de cinzas, vulcões, árvores mortas, ruínas, um rio a leste com a
   represa, a vila dos smergs no meio-sul, o quartel a oeste e o
   CASTELO ROXO (desenho gerado no Gemini) cercado por um fosso, com a
   ponte levadiça ao sul. A fronteira sul (cancela do pedágio de alma)
   leva às Estradas do Mundo.

     x →  0        40        86        130       180
     y 0  vulcão···|·ruínas·|··[ CASTELO ]··|·vulcão·|rio
       27         fosso ████████ fosso
       57              ponte levadiça
       60  quartel    campo de batalha          represa
       86  quartel    ····· VILA (praça) ·····  esgoto
      135             cancela (pedágio) → Estradas
   ============================================================ */
Mundo.regiao('smergulus', {
  nome:'Smergulus Kingdom', w:180, h:140, semente:1313, ceu:'reino', autoInteriores:true,
  mundi:{ x:2, y:3, w:42, h:52 },
  rodavel:['paralelepipedo','terra_batida','pedra_roxa'],   // a praça da rainha é a rotatória da vila
  // quem mora nas casas do reino: smergs (e as velhas do reino)
  moradores:['smerg_normal','smerg_normal','cidadao:16','cidadao:17'],
  falasMoradores:{
    casa:[ ['Shhh. Fala baixo. As paredes do reino têm ouvido. E o ouvido tem boné.'], ['Meu potinho de alma desse mês eu já paguei. Sobrou pouca alma. Mas sobrou.'],
           ['Você não é soldado? Então senta. Tem sopa. Sopa de nada, mas é quente.'], ['Dizem que a rainha já foi uma menina com fome. Ninguém diz isso perto do castelo.'],
           ['Bonzinho, se vir um cachorro de orelha grande, não conta pra ninguém. Ele é gente boa.'] ],
    loja:[ ['Tudo aqui custa um pedacinho de alma. Menos o sorriso. O sorriso é de graça, porque ninguém compra.'] ],
    galpao:[ ['Alojamento do quartel. Cem soldados, cem bonés, um só cobertor. A gente reveza.'], ['Eu durmo de boné. Se a rainha passar de noite, eu já tô uniformizado.'] ]
  },
  // Ato III: o tempo da rainha trava o céu do reino em 03:33 (noite roxa parada)
  hora:S=> (S.flag('ato3') && !S.flag('ato4')) ? 3.55 : null,
  pintar(p, S){
    const W=180, H=140;
    const rr=OWPintor.rng(1313), sorteia=l=>l[Math.floor(rr()*l.length)];
    p.ret(0,0,W,H,'cinzas');
    p.mancha(60,100,40,22,'terra2',0.35);
    p.mancha(28,95,22,22,'terra_batida',0.2);
    p.mancha(118,78,20,10,'grama_escura',0.4); p.mancha(150,110,14,14,'grama_escura',0.4);
    p.mancha(30,62,16,12,'rocha_escura',0.4);

    /* ---- vulcões (lava) ---- */
    p.mancha(20,18,13,11,'rocha_escura',0.3); p.mancha(20,18,6,5,'lava',0.3);
    p.mancha(132,12,9,7,'rocha_escura',0.3); p.mancha(132,12,4,3,'lava',0.3);
    p.obj('vulcao', 20, 16, { semCol:false, interagir:true, raio:200, texto:['O vulcão grande do reino. Ele ronca no ritmo de um coral desafinado.'] });
    p.obj('vulcao_peq', 132, 11);
    p.luz(20,18,7,'#ff7a3c'); p.luz(132,12,4,'#ff7a3c');

    /* ---- rio a leste (com a represa) ---- */
    p.rio([[178,0],[160,25],[152,52],[158,85],[166,112],[178,139]], { larg:5, margem:'terra', margemLarg:1 });
    p.obj('represa', 152, 53.4, { id:'represa', interagir:true, raio:160, texto:['A REPRESA DA RAINHA. Comportas de ferro roxo. Numa placa: "QUEM ABRE SEM ORDEM, AFOGA."'] });

    /* ---- o castelo e o fosso ---- */
    const fx0=76, fy0=27, fx1=103, fy1=57;
    p.ret(fx0,fy0,fx1-fx0+1,fy1-fy0+1,'agua');
    p.ret(fx0+3,fy0+3,fx1-fx0-5,fy1-fy0-5,'pedra_roxa');
    p.bordaDe('cinzas','agua','terra',1);
    // muralha roxa em volta da ilha do castelo, com o portão virado pra ponte
    p.muralha([[79,30],[100,30]], { topo:'muro_roxo_topo', face:'muro_roxo_face' });
    p.muralha([[79,30],[79,51]], { topo:'muro_roxo_topo', face:'muro_roxo_face' });
    p.muralha([[99,30],[99,51]], { topo:'muro_roxo_topo', face:'muro_roxo_face' });
    p.muralha([[79,52],[100,52]], { topo:'muro_roxo_topo', face:'muro_roxo_face', portoes:[[86,52,3]] });
    p.ret(85,49,3,6,'paralelepipedo');                                  // caminho do portão até a ponte
    p.ret(85,fy1-2,3,3,'madeira');                                      // ponte levadiça (tábuas)
    p.obj('ponte_erguida', 86, 56.4, { id:'ponte_erguida', solidoT:[85,55,3,3], se:S=>S.flag('ponte_erguida'), sempreCima:false, interagir:true,
      texto:['A ponte levadiça está ERGUIDA. As correntes estão presas por um cadeado roxo do tamanho de uma cabeça.'] });
    p.obj('castelo_rainha', 89.5, 50, { semCol:true, id:'castelo' });
    p.solido(83,33,15,16); p.solido(92,48,6,2);
    p.livre(86,48,2,1);
    p.porta(86,48, ['castelo_salao'].concat(Interiores.entrada('castelo_salao'), [3]), { nome:'Castelo da Rainha',
      trava:{ se:S=>!S.flag('castelo_fechado'), texto:'O portão do castelo está trancado com barras de ferro roxo. Lá dentro, uma risada ecoa.' } });
    p.porta(87,48, ['castelo_salao'].concat(Interiores.entrada('castelo_salao'), [3]), { nome:'Castelo da Rainha',
      trava:{ se:S=>!S.flag('castelo_fechado'), texto:'O portão do castelo está trancado com barras de ferro roxo.' } });
    [[82,50.6],[96,50.6]].forEach(([x,y])=>p.obj('braseiro', x, y));
    p.obj('estandarte_reino', 84, 51.2, { semCol:true }); p.obj('estandarte_reino', 89, 51.2, { semCol:true });
    [[81,33],[98,33]].forEach(([x,y])=>{ p.obj('sebe', x, y); p.obj('sebe', x, y+3); p.obj('sebe', x, y+6); });
    p.obj('tocha', 84, 54.4, { semCol:true }); p.obj('tocha', 88, 54.4, { semCol:true });
    p.luz(86,50,4,'#ffcf6a'); p.luz(82,50,3,'#ff9a3a'); p.luz(96,50,3,'#ff9a3a');

    /* ---- campo em frente ao castelo ---- */
    p.mancha(90,70,24,10,'terra_batida',0.3);
    p.estrada([[86,58],[86,139]], { larg:3, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[30,106],[150,106]], { larg:3, tipo:'paralelepipedo', calcada:0, faixa:false });
    ['tenda','tenda'].forEach((t,i)=>p.obj(t, 68+i*40, 70));
    for(let i=0;i<6;i++) p.obj('estandarte_reino', 66+i*8, 64);
    p.obj('estatua_fat', 96, 62, { interagir:true, texto:['ESTÁTUA DO FAT SMERG — "SÓ EXISTE UM." Do lado, uma RAMPA EXCLUSIVA de pedra roxa. Só ele pode subir.','Alguém riscou embaixo: "fat-o consumado".'] });
    p.obj('rampa_exclusiva', 99, 63);
    p.zona('Campo do Castelo', 60,58,60,26);

    /* ---- trilhas de terra batida ligando o reino ---- */
    p.trilha([[30,106],[30,78],[30,66]], 2, 'terra_batida');            // quartel → ruínas
    p.trilha([[30,66],[28,48],[27,36]], 2, 'terra_batida');             // ruínas → coral do vulcão
    p.trilha([[150,106],[146,84],[148,64],[151,60]], 2, 'terra_batida'); // fim da rua → represa
    p.trilha([[140,106],[140,112]], 2, 'terra_batida');                // rua → esgoto

    /* ---- VILA ---- */
    // ruelas de pedra na frente das portas (as casas de cima e as de baixo)
    p.estrada([[52,95],[72,95]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[100,95],[128,95]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[50,115],[84,115]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[88,115],[128,115]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[52,124],[68,124]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.estrada([[102,124],[128,124]], { larg:2, tipo:'paralelepipedo', calcada:0, faixa:false });
    p.elipse(86,98,9,6,'pedra_roxa');
    p.obj('estatua_rainha', 86, 97, { interagir:true, texto:['ESTÁTUA DA RAINHA SMERGULA. Na base, um título diferente em cada lado:','"A QUE TUDO VÊ" · "A QUE TUDO COBRA" · "A QUE NÃO DORME" · "A MAIS BONITA (DECRETO Nº 2)"'] });
    // mercado de almas (barracas em volta da praça)
    const itens=['fruta','pao','tecido','peixe']; [[74,93],[78,103],[94,93],[98,103]].forEach(([x,y],i)=>p.cv(OWArte.barraca({ cor:['verm','azul','amar','verde'][i], item:itens[i] }), x, y));
    p.obj('placa_madeira', 80, 92, { interagir:true, texto:['MERCADO DA RAINHA: "PÃO — 1 PEDAÇO DE ALMA. SOPA — 2 PEDAÇOS. FIADO NÃO."'] });
    const telhados=['roxo','roxo','ardosia','barro','roxo'];
    const casa=(x,y,w,extra)=>p.casa(x,y,Object.assign({ w, tel:2, par:2, telhado:sorteia(telhados), parede:sorteia(['pedra','pedra','tijolo']) }, extra||{}));
    // fileiras de casas da vila
    [[54,90],[60,90],[66,90],[104,90],[110,90],[116,90],[122,90]].forEach(([x,y])=>casa(x,y,5));
    [[52,110],[58,110],[64,110],[70,110],[100,110],[112,110],[118,110],[124,110]].forEach(([x,y])=>casa(x,y,5));
    [[54,119],[62,119],[104,119],[112,119],[120,119]].forEach(([x,y])=>casa(x,y,6));
    p.casa(92,110,{ w:6, tel:2, par:2, telhado:'roxo', parede:'tijolo', placa:'TAVERNA', id:'taverna_smerg', nomeLocal:'Taverna do Bonezinho',
      entra:['taverna_smerg'].concat(Interiores.entrada('taverna_smerg'), [3]) });
    p.obj('quadro_recompensa', 99, 114.6, { interagir:true, verbo:'📋 QUADRO', texto:['QUADRO DA TAVERNA: "PROCURA-SE: BANDO DO PÉ-DE-CABRA." "PROCURA-SE: SMERGULÃO — CRIME: ██████ (proibido de dizer por decreto real)." "PROCURA-SE: CACHORRO DE ORELHA GRANDE."'] });
    // a casinha do Orelha, no beco
    p.ret(70,118,6,6,'terra2');
    p.obj('casinha_orelha', 72, 121, { interagir:true, investigar:'casinha_orelha', verbo:'🔍 OLHAR', texto:['Uma casinha de cachorro de madeira, torta. Na placa, pintado à mão: "ORELHA".','Dentro, um pano velho e um pote de água seco.'] });
    p.obj('pote_porcelana', 74, 122, { semCol:true });
    p.zona('Beco do Orelha', 68,116,10,9);
    // praça: bancos, pombos, carroça do mercado
    p.obj('banco_praca', 81, 100); p.obj('banco_praca', 91, 100); p.obj('banco_praca', 81, 96); p.obj('banco_praca', 91, 96);
    p.obj('pombos', 84, 102, { semCol:true }); p.obj('pombos', 89, 94.5, { semCol:true });
    p.obj('caixa_frutas', 69, 98, { interagir:true, texto:['Um caixote de nabos cinzentos. Até os nabos do reino parecem cansados.'] });
    p.obj('caixa_legumes', 71, 98); p.obj('saco_graos', 67, 98.2);
    // quintais: hortas atrás das casas de cima, varais e lampiões nas ruelas
    [[55,88],[61,88],[67,88],[107,88],[113,88],[119,88]].forEach(([x,y])=>p.obj('horta_couve', x, y));
    [[57,127],[115,127],[70,127]].forEach(([x,y])=>p.obj('varal', x, y));
    [[58,97],[68,97],[106,97],[122,97],[56,117],[76,117],[104,117],[124,117]].forEach(([x,y])=>{ p.obj('lampiao', x, y); });
    p.obj('gato', 66, 96.4, { semCol:true, interagir:true, texto:['Um gato preto de olho roxo. Ele te encara como se soubesse quanto de alma você ainda tem.'] });
    [[53,113.6],[67,113.6],[103,113.6],[121,113.6],[57,93.6],[111,93.6]].forEach(([x,y])=>p.obj('jardineira', x, y, { semCol:true }));
    p.espalhar(['barril','caixa','vaso_flor','tonel','saco'], [50,86,80,40], { dens:0.025, dist:2.6, so:['terra2','cinzas'], semente:9 });
    for(let i=52;i<130;i+=9){ if(Math.abs(i-86)<6) continue; p.obj('tocha', i, 104, { semCol:true }); p.obj('tocha', i+4, 108.6, { semCol:true }); }
    p.zona('Vila dos Smergs', 50,86,82,40);
    p.zona('Praça da Rainha', 76,91,20,14);

    /* ---- QUARTEL (oeste) ---- */
    p.ret(10,80,38,34,'terra_batida');
    for(let i=0;i<5;i++){ p.obj('cerca_h', 12+i*8, 79.4); p.obj('cerca_h', 12+i*8, 114.4); }
    p.edificio('galpao', 12, 82, 5, 3, { solH:2, portaX:2, nomeLocal:'Alojamento dos Soldados', interior:'galpao' });
    p.edificio('galpao', 22, 82, 5, 3, { solH:2, portaX:2, nomeLocal:'Alojamento dos Soldados', interior:'galpao' });
    p.casa(34,82,{ w:7, tel:2, par:2, telhado:'roxo', parede:'tijolo', placa:'ACADEMIA 77', id:'academia', nomeLocal:'Academia Nº 77',
      entra:['academia_77'].concat(Interiores.entrada('academia_77'), [3]) });
    [[16,96],[22,96],[28,96],[16,102],[22,102],[28,102]].forEach(([x,y])=>p.obj('boneco_treino', x, y, { interagir:true, texto:['Um boneco de treino de palha com um boné virado pra trás. Alguém escreveu "Nº 77" nele e riscou.'] }));
    p.obj('placa_madeira', 38, 96, { interagir:true, texto:['QUARTEL DA RAINHA — "TODO SOLDADO É IGUAL. BONÉ PRA TRÁS. MEDO PRA FRENTE."'] });
    p.obj('pilha_pneus', 42, 110); p.obj('barril', 12, 110); p.obj('caixa', 14, 111);
    p.obj('tenda', 14, 107); p.obj('tenda', 19, 107);
    p.obj('fogueira', 33, 103, { semCol:true }); p.obj('lenha', 35.5, 103.6); p.luz(33,103,4,'#ff8a3a');
    p.obj('estandarte_reino', 21, 90, { semCol:true }); p.obj('estandarte_reino', 41, 90, { semCol:true });
    p.obj('barril2', 44, 84); p.obj('barril2', 45.2, 85); p.obj('sacos', 45, 104);
    p.obj('peso_academia', 38, 92, { interagir:true, texto:['Um peso enferrujado largado no pátio. Escrito com giz: "SÓ O 77 LEVANTA ESSE". Ninguém nunca tentou provar o contrário.'] });
    p.zona('Quartel da Rainha', 10,80,38,34);

    /* ---- esgoto (entrada a sudeste) ---- */
    p.obj('bueiro_grande', 140, 112.6, { semCol:true });
    p.porta(140,112, ['esgoto'].concat(Interiores.entrada('esgoto'), [3]), { nome:'Esgoto' });
    p.obj('placa_madeira', 138, 111, { interagir:true, texto:['Na grade do esgoto, riscado: "SOLDADO DA RAINHA NÃO DESCE. — T."'] });
    p.zona('Entrada do Esgoto', 134,106,14,12);

    /* ---- ruínas (oeste) ---- */
    [[22,58],[30,56],[38,60],[24,68],[34,68]].forEach(([x,y],i)=>p.obj(['pilastra','estatua','pedregulho','pilastra','rocha_c'][i], x, y));
    p.obj('placa_madeira', 30, 64, { interagir:true, texto:['RUÍNAS DO PRIMEIRO REI. Ninguém lembra o nome dele. A rainha mandou apagar.'] });
    p.zona('Ruínas do Primeiro Rei', 16,50,30,24);

    /* ---- cemitério do reino (ao lado das ruínas) ---- */
    p.ret(49,63,12,10,'terra2');
    for(let i=0;i<3;i++){ p.obj('cerca_h', 50+i*4, 62.4); p.obj('cerca_h', 50+i*4, 72.4); }
    const lap=['lapide','lapide_cruz','lapide_rip','lapide'];
    [[51,65],[54,65],[57,65],[51,68],[57,68],[51,70.6],[54,70.6],[57,70.6]].forEach(([x,y],i)=>p.obj(lap[i%4], x, y));
    p.obj('lapide_grande', 54, 68, { interagir:true, texto:['Uma lápide maior que as outras, sem nome. Só uma data: o dia em que a rainha subiu ao trono.','Embaixo, alguém deixou um boné virado pra frente. Faz pouco tempo.'] });
    p.obj('toco', 60, 66); p.obj('arv_alta_S', 49, 64);
    p.zona('Cemitério do Reino', 48,62,14,12);

    /* ---- fronteira sul: a cancela do pedágio ---- */
    p.obj('cancela', 86, 134, { id:'cancela', solidoT:[83,133,7,2], se:S=>!S.flag('fronteira_aberta'), interagir:true,
      texto:['PEDÁGIO DA RAINHA SMERGULA. "UMA ALMA POR CARRO. FRONTEIRA FECHADA POR ORDEM REAL."'] });
    p.obj('guarita', 92, 134);
    p.zona('Fronteira Sul', 70,128,34,12);

    /* ---- vegetação morta e pedras ---- */
    p.espalhar(['arv_redonda_S','arv_alta_S','arv_fina_S','arv_media_S','arv_media_M','pedregulho','pedra_m'], [0,0,180,140], { dens:0.03, dist:2.8, so:['cinzas','terra2','rocha_escura','grama_escura'], semente:21,
      longe:(i,j)=> (i>=fx0-2 && i<=fx1+2 && j>=fy0-2 && j<=fy1+2) || (j>=86 && j<=127 && i>=48 && i<=132) || (i>=8 && i<=48 && j>=78 && j<=116) || (i>=47 && i<=62 && j>=61 && j<=74) || Math.abs(i-86)<3 || Math.abs(j-106)<3 });
    // tufos de grama morta e pedrinhas no chão de cinzas (só decoração, sem colisão)
    p.espalhar(['pedra_p','toco'], [0,0,180,140], { dens:0.012, dist:3, so:['cinzas','terra2'], semente:23,
      longe:(i,j)=> (j>=86 && j<=127 && i>=48 && i<=132) || Math.abs(i-86)<3 || Math.abs(j-106)<3 });
    p.espalhar(['arv_redonda_M','arv_media_M','arbusto2'], [110,70,30,30], { dens:0.06, dist:2.4, so:['grama_escura'], semente:22 });
    p.zona('Vulcão Grande', 6,6,30,26); p.zona('Rio da Represa', 145,40,20,30);

    p.ponto('castelo', 86, 50); p.ponto('praca', 86, 100); p.ponto('quartel', 28, 100);

    p.saida({ lado:'sul', de:[84,96], para:['estradas', 30, 2, 0],
      trava:{ se:S=>S.flag('fronteira_aberta'), texto:'A fronteira está fechada por ordem da rainha. Do outro lado da cancela, só neblina.' } });
  }
});
