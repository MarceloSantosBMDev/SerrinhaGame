/* ============================================================
   MAPA — TEL AVIV (160 × 120 tiles)
   Segue o modohistoria/mapa.png: cidade à beira-mar no leste do mundo,
   mar a leste e a baía ao sul, Cidade Velha murada no meio-sul, porto
   no sudeste, arranha-céus ao norte, laboratório e ferro-velho a oeste.
   Tudo é pintado por comandos (js/ow_pintor.js) com semente fixa.

   `autoInteriores:true` → TODA casa, prédio, galpão e loja tem porta e
   um interior gerado (js/mapas/interiores_auto.js). Os poucos que
   continuam fechados são trancas da HISTÓRIA (Torre do Relógio,
   ferro-velho, portão da Cidade Velha).

     x →  0        30        65        100       128 138   160
     y 0  ·lab·····|·····torres····|····torres····|calç|praia|mar
       22 ·········|═══ Rua das Torres ═══════════|    |     |
       41 ═══════ Avenida do Relógio ══ (praça) ══|    |     |
       57 ·casas···|══ Rua do Porto ══════════════|    |     |
       59 ·lojas·padaria··lojas·lojas·············|    |     |
       66 ·········[████ Cidade Velha (muralha) ███]subest.  |
      110 ferro-velho                    porto ── baía ──────
   ============================================================ */
Mundo.regiao('telaviv', {
  nome:'Tel Aviv', w:160, h:120, semente:333, ceu:'litoral', autoInteriores:true,
  // Cidade Velha à noite (Parte 8): enquanto essas missões estão abertas, é noite
  hora:S=> (S.ativa('c1_velha_noite') || S.ativa('c1_coisa_rainha')) ? 22.5 : null,
  // carro: asfalto + o calçamento da praça do relógio (ela corta a avenida: vira rotatória) e as ruelas de pedra
  rodavel:['asfalto','paralelepipedo','pedra'],
  mundi:{ x:53, y:20, w:34, h:46 },
  pintar(p, S){
    const W=160, H=120;
    const rr=OWPintor.rng(909);
    const sorteia = l => l[Math.floor(rr()*l.length)];
    const CORES_CARRO=['verm','azul','amar','branco','preto','verde','prata','branco','prata'];
    const carroH=(x,y,cor)=>p.obj('carro_h_'+(cor||sorteia(CORES_CARRO)), x, y);
    const carroV=(x,y,cor)=>p.obj('carro_v_'+(cor||sorteia(CORES_CARRO)), x, y);
    // faixa de pedestre: atravessa uma rua horizontal (colunas) ou vertical (fileiras)
    const faixaH=(x,y0,y1)=>{ for(let y=y0;y<=y1;y++) p.obj('faixa_ped_h', x, y, { semCol:true }); };
    const faixaV=(y,x0,x1)=>{ for(let x=x0;x<=x1;x++) p.obj('faixa_ped_v', x, y, { semCol:true }); };
    // enfeite que NUNCA fica na frente de uma porta (prédio sorteado pode ter a porta em qualquer x)
    const livreP=(x,y)=>!p.m.portas.some(d=>Math.abs(d.x-Math.floor(x))<=1 && Math.floor(y)>d.y && Math.floor(y)<=d.y+2);
    const po=(nome,x,y,ex)=>livreP(x,y) ? p.obj(nome,x,y,ex) : null;
    p.ret(0,0,W,H,'grama');

    /* ---- oeste: zona industrial de terra batida ---- */
    p.mancha(17,28,19,24,'terra',0.3);
    p.mancha(20,98,20,16,'terra',0.25);
    p.ret(4,86,30,24,'sucata');

    /* ---- mar a leste e baía ao sul ---- */
    const mar=[[139,0],[160,0],[160,120],[90,120],[94,113],[112,111],[126,104],[133,92],[136,74],[137,52],[136,32],[138,14]];
    p.poligono(mar,'agua',2.2);
    p.bordaDe('grama','agua','areia',6);
    p.bordaDe('areia','agua','areia_molhada',1);
    p.bordaDe('terra','agua','areia',3);
    p.bordaDe('sucata','agua','areia',2);

    /* ---- ruas ---- */
    p.estrada([[0,41],[127,41]], { larg:3 });                     // Avenida do Relógio
    p.estrada([[65,0],[65,63]], { larg:3 });                      // Rua do Mercado / Estrada do Norte
    p.estrada([[30,22],[127,22]], { larg:3 });                    // Rua das Torres
    p.estrada([[21,57],[100,57],[100,77],[127,77]], { larg:3 });  // Rua do Porto
    p.estrada([[13,21],[13,41]], { larg:3 });                     // acesso ao laboratório
    p.estrada([[110,41],[110,57]], { larg:3 });
    p.linha([[128,4],[128,96]], 3, 'calcada');                   // calçadão da praia
    p.trilha([[21,43],[21,85]], 3, 'terra');                      // estrada de terra do ferro-velho

    /* ---- Praça do Relógio ---- */
    p.elipse(65,41,8,6.5,'pedra');
    p.elipse(65,41,5,4,'paralelepipedo');
    p.obj('fonte', 60, 45);
    p.grande(OWArte.torreRelogio({ w:4, h:10 }), 67, 27, 4, 10, { solH:3, id:'torre_relogio',
      entra:['torre_terreo'].concat(Interiores.entrada('torre_terreo'), [3]), trava:{ se:S=>S.flag('torre_aberta'), texto:'A porta da Torre do Relógio está travada por dentro. Dá pra ouvir as engrenagens girando ao contrário.' }, nomeLocal:'Torre do Relógio' });
    p.obj('banco', 58, 38); p.obj('banco', 72, 44); p.obj('banco', 61, 37);
    p.obj('vaso_flor', 58, 44); p.obj('vaso_flor', 73, 38); p.obj('vaso_flor', 71, 36.6);
    p.obj('pombos', 62, 46, { semCol:true }); p.obj('pombos', 69, 41, { semCol:true });
    p.obj('carrinho_falafel', 70, 46.5, { interagir:true, texto:['FALAFEL DO YOSSI — "Aberto 24h". Bom, aberto desde 03:33 e sem previsão de fechar.','O óleo está fervendo no meio de uma bolha. A bolha não estoura.'] });

    /* ---- Laboratório 5000Z (de onde o Mecas sai) ---- */
    p.grande(OWArte.laboratorio({ w:10, h:7 }), 8, 13, 10, 7, { id:'lab_predio', entra:['lab5000z', 8, 30, 3], nomeLocal:'Laboratório 5000Z' });
    p.ponto('porta_lab', 13, 21);
    ['caixa','barril','barril2','caixa','pneus'].forEach((n,i)=>p.obj(n, 4+i*2.6, 22+(i%2)));
    p.obj('cerca_h', 4, 12); p.obj('cerca_h', 21, 12);
    p.obj('gerador', 21, 16); p.obj('cabos', 20, 19);
    // estacionamento do laboratório
    p.ret(1,6,6,6,'asfalto'); for(let i=1;i<7;i+=2) p.obj('vaga', i, 7, { semCol:true });
    carroV(1.5,8,'branco'); carroV(3.5,8,'prata'); p.obj('cone_rua', 6, 11); p.obj('cone_rua', 5, 11);
    p.obj('outdoor', 24, 9);
    p.obj('antena_parabolica', 16, 12);

    /* ---- arranha-céus (norte) ---- */
    const r=OWPintor.rng(77);
    const cores=['vidro','verde','vidro','areia','vidro','ouro'];
    let x=34;
    while(x<60){ const w=3+Math.floor(r()*3), alt=4+Math.floor(r()*4); if(x+w>62) break;
      p.predio(x, 19-(2+alt)+1, { w, prof:2, alt, cor:cores[Math.floor(r()*cores.length)], antena:r()<0.3, heliponto:w>=5&&r()<0.5 }); x+=w+1+Math.floor(r()*2); }
    x=69;
    while(x<124){ const w=3+Math.floor(r()*4), alt=5+Math.floor(r()*5); if(x+w>125) break;
      p.predio(x, 19-(2+alt)+1, { w, prof:2, alt, cor:cores[Math.floor(r()*cores.length)], antena:r()<0.35, heliponto:w>=5&&r()<0.5 }); x+=w+1+Math.floor(r()*2); }
    // quarteirão do meio (entre Torres e Avenida)
    x=34;
    while(x<60){ const w=3+Math.floor(r()*3), alt=3+Math.floor(r()*3); if(x+w>62) break;
      p.predio(x, 37-(2+alt)+1, { w, prof:2, alt, cor:r()<0.5?'areia':'vidro' }); x+=w+2; }
    x=74;
    while(x<106){ const w=3+Math.floor(r()*3), alt=3+Math.floor(r()*3); if(x+w>108) break;
      p.predio(x, 37-(2+alt)+1, { w, prof:2, alt, cor:r()<0.4?'areia':'verde' }); x+=w+2; }
    p.predio(113, 26, { w:6, prof:3, alt:9, cor:'ouro', antena:true, id:'torre_ouro', nomeLocal:'Torre Dourada' });
    p.obj('luneta', 96, 25, { interagir:true, investigar:'mirante_terraco', verbo:'🔭 OLHAR',
      texto:['Pela luneta: arranha-céus de vidro refletindo um sol que se mexe… e relógios que não.', 'Todo letreiro de rua, todo relógio de pulso nas vitrines: 03:33.'] });
    // calçada larga na frente das torres: árvores em canteiro, bancos, hidrantes
    for(let i=36;i<126;i+=6){ if(Math.abs(i-65)<5 || Math.abs(i-58)<2 || Math.abs(i-88)<2) continue; po('arvore_calcada', i, 20); }
    [[44,20],[79,20],[104,20],[120,20]].forEach(([a,b])=>po('hidrante', a, b));
    [[52,20],[93,20],[112,20]].forEach(([a,b])=>po('lixeira_verde', a, b));

    /* ---- Parque das Torres (entre a Rua das Torres e os prédios do meio) ---- */
    p.ret(34,25,26,5,'gramado');
    p.trilha([[34,27],[60,27]], 2, 'paralelepipedo');
    p.trilha([[47,24],[47,30]], 2, 'paralelepipedo');
    p.obj('chafariz', 47.5, 28.4);
    p.obj('banco_praca', 41, 26); p.obj('banco_praca', 54, 26); p.obj('banco_praca', 41, 29.2); p.obj('banco_praca', 54, 29.2);
    p.obj('jardineira', 37, 25.4); p.obj('jardineira', 57, 25.4);
    p.obj('estatua', 36, 29, { interagir:true, texto:['Estátua de bronze: "AO INVENTOR DESCONHECIDO". A placa embaixo foi arrancada.','Alguém riscou com chave: "M.B.JW era melhor de cabelo".'] });
    p.obj('carrinho_falafel', 59, 28.6, { interagir:true, texto:['Carrinho de sorvete de falafel. Ninguém pediu, mas existe.'] });
    p.zona('Parque das Torres', 34,24,27,7);
    /* ---- Parquinho do Leste (entre as torres, perto da luneta) ---- */
    p.ret(72,25,20,5,'gramado');
    p.ret(76,26,6,3,'areia');
    p.obj('escorregador', 78, 28); p.obj('balanco', 85, 28.4); p.obj('caixa_areia', 79.5, 28.6, { semCol:true });
    p.obj('mesa_piquenique', 89, 27); p.obj('banco_praca', 74, 28.6); p.obj('bicicletario', 90, 29.6);
    p.obj('bicicleta', 88, 29.8, { semCol:true });
    p.zona('Parquinho', 72,24,21,7);

    /* ---- casas (oeste-centro) e a padaria ---- */
    const telhados=['barro','barro','areia','verde','azul','branco'];
    for(let i=0;i<4;i++){
      p.casa(25+i*8, 45, { w:5, tel:2, par:2, telhado:telhados[i%telhados.length], parede:i%2?'pedra':'tijolo', chamine:i%2===0 });
      p.casa(25+i*8, 50, { w:4, tel:2, par:2, telhado:telhados[(i+3)%telhados.length], parede:'tijolo', porta:1 });
      // quintal: caixa de correio e flor viradas pra avenida (o corredor de trás fica livre)
      p.obj('caixa_correio', 25+i*8+0.6, 44.2); p.obj('vaso_flor', 25+i*8+4, 44.2);
      p.obj('jardineira', 25+i*8+5.6, 46.6, { semCol:false });
    }
    p.obj('varal', 31, 54.4); p.obj('sebe', 47.5, 54.4); p.obj('varal', 55.5, 54.4);
    p.obj('gato', 46, 49, { semCol:true, interagir:true, texto:['Um gato laranja dormindo em pé. Ou acordado deitado. É difícil dizer às 03:33.'] });
    p.casa(44, 59, { w:6, tel:2, par:2, telhado:'barro', parede:'tijolo', placa:'PADARIA', id:'padaria', nomeLocal:'Padaria Pão do Minuto',
      entra:['padaria'].concat(Interiores.entrada('padaria'), [3]) });
    p.obj('toldo_verm', 47, 61.1, { semCol:true, sempreCima:true });
    p.obj('mesa_bistro', 42.6, 63.2); p.obj('lixeira', 51, 63); p.obj('cesto_pao', 50.5, 63, { semCol:true });

    /* ---- lojas na Rua do Porto (todas têm interior) ---- */
    const loja=(x0,w,placa,tel,toldo,nome)=>{ p.casa(x0,59,{ w, tel:2, par:2, telhado:tel, parede:sorteia(['tijolo','pedra']), placa, nomeLocal:nome });
      if(toldo) p.obj('toldo_'+toldo, x0+Math.floor(w/2), 61.1, { semCol:true, sempreCima:true }); };
    loja(23,5,'FARMÁCIA','branco','verde','Farmácia Tel Aviv');
    loja(29,5,'RELÓGIOS','areia','azul','Relojoaria do Ezequiel');
    loja(37,5,'BARBEARIA','azul','verm','Barbearia');
    loja(52,5,'SORVETES','branco','amar','Sorveteria');
    loja(68,5,'MERCADO','barro','verm','Mercadinho');
    loja(74,6,'CAFÉ','verde','amar','Café da Esquina');
    loja(81,5,'LIVROS','azul','azul','Livraria');
    loja(87,5,'FLORES','areia','verde','Floricultura');
    [[28,63],[36,63],[57,63],[73,63],[86,63],[92,63]].forEach(([a,b],i)=>p.obj(i%2?'vaso_flor':'lixeira_verde', a, b));
    p.obj('mesa_bistro', 75.2, 63.4); p.obj('mesa_bistro', 79.8, 63.4); p.obj('bicicleta', 55, 63.4, { semCol:true });
    p.espalhar(['arv_redonda_V','arv_redonda2_V','arv_media_V','arbusto','arv_moita_V'], [23,44,38,11], { dens:0.05, dist:2.2, so:['grama'], semente:3 });

    /* ---- Vila Oeste (casinhas com horta, entre a avenida e o parque) ---- */
    p.casa(2,45,{ w:4, tel:2, par:2, telhado:'verde', parede:'pedra', nomeLocal:'Casa da Vila' });
    p.casa(8,45,{ w:4, tel:2, par:2, telhado:'barro', parede:'tijolo', nomeLocal:'Casa da Vila', chamine:true });
    p.casa(14,46,{ w:4, tel:2, par:2, telhado:'azul', parede:'tijolo', nomeLocal:'Casa da Vila' });
    p.ret(2,51,5,3,'horta'); for(let i=0;i<3;i++) p.obj('horta_couve', 3+i*1.5, 52, { semCol:true });
    p.obj('regador', 6.4, 53, { semCol:true }); p.obj('cerca_branca', 4, 54.2); p.obj('cerca_branca', 10, 54.2);
    p.obj('caixa_dagua', 13, 52); p.obj('varal', 16, 52.4);
    p.zona('Vila Oeste', 0,44,20,12);

    /* ---- Mercado de Jaffa ---- */
    p.ret(74,45,24,10,'pedra');
    const it=['fruta','peixe','pao','tecido'], cs=['verm','azul','verde','amar'];
    for(let j=0;j<2;j++) for(let i=0;i<5;i++) p.cv(OWArte.barraca({ cor:cs[(i+j)%4], item:it[(i*3+j)%4] }), 76+i*4.4, 47+j*5);
    p.obj('tenda', 95, 53); p.obj('barril', 74, 54); p.obj('caixa', 97, 48.4);
    p.obj('caixa_frutas', 74.6, 49.4); p.obj('caixa_legumes', 96.4, 50.2); p.obj('sacos', 93.2, 46.4); p.obj('cesto_pao', 80.5, 50.5, { semCol:true });
    p.obj('tonel', 75, 46);

    /* ---- a "igrejinha da esquina" (cúpula dourada) ---- */
    p.ret(97,59,13,8,'pedra');
    p.grande(OWArte.cupula({ w:6, h:7 }), 100, 58, 6, 7, { solH:3, id:'igrejinha', nomeLocal:'A "Igrejinha"', interior:'templo' });
    p.obj('igreja_placa', 99, 64);
    p.obj('coqueiro', 98, 61); p.obj('coqueiro', 107, 61);
    p.obj('vaso_porcelana', 99.5, 66, { semCol:false }); p.obj('vaso_porcelana', 106.5, 66);

    /* ---- subestação (o apagão) ---- */
    p.ret(112,63,13,10,'calcada');
    for(let i=0;i<3;i++) p.obj('transformador', 114+i*4, 66, { id:'trafo_'+i });
    p.obj('gerador', 121, 70); p.obj('cabos', 116, 70);
    p.obj('cerca_h', 113, 72); p.obj('cerca_h', 121, 72); p.obj('cerca_h', 113, 62); p.obj('cerca_h', 121, 62);
    p.casa(124,64,{ w:3, tel:1, par:2, telhado:'azul', parede:'pedra', janelas:false, porta:1, nomeLocal:'Sala de Controle', interior:'galpao' });
    p.obj('placa_pare', 111.5, 69); p.obj('cone_rua', 123.4, 71); p.obj('cone_rua', 124.2, 71.6);

    /* ---- porto ---- */
    p.ret(101,79,30,22,'calcada');
    p.casa(103,81,{ w:7, tel:2, par:2, telhado:'azul', parede:'pedra', janelas:false, porta:3, nomeLocal:'Armazém do Porto', interior:'galpao' });
    p.casa(112,81,{ w:7, tel:2, par:2, telhado:'azul', parede:'pedra', janelas:false, porta:3, nomeLocal:'Armazém do Porto', interior:'galpao' });
    p.casa(121,81,{ w:6, tel:2, par:2, telhado:'verde', parede:'tijolo', placa:'TAVERNA', id:'taverna', nomeLocal:'Taverna do Porto',
      entra:['taverna'].concat(Interiores.entrada('taverna'), [3]) });
    p.obj('barril_chopp', 121.4, 85.6); p.obj('mesa_redonda', 127.5, 86); p.obj('lampiao', 120.6, 85.2, { semCol:true });
    p.ret(106,101,3,13,'cais'); p.ret(116,99,3,13,'cais'); p.ret(124,97,3,10,'cais');
    p.obj('barco', 112, 107, { semCol:true }); p.obj('barco', 129, 103, { semCol:true });
    ['barril','barril2','caixa'].forEach((n,i)=>p.obj(n, 116+i*2, 91));
    p.obj('luneta', 118, 98, { interagir:true, investigar:'mirante_porto', verbo:'🔭 OLHAR',
      texto:['Pela luneta: a baía inteira. As ondas quebram normalmente. As gaivotas voam normalmente.', 'O relógio do farol, lá longe: 03:33. Até o farol parou.'] });
    p.obj('ancora', 110.5, 99); p.obj('rede_pesca', 120.6, 96.4, { semCol:true }); p.obj('rede_pesca', 104.4, 99.6, { semCol:true });
    p.obj('pilha_pneus', 130, 91.6); p.obj('palete', 107.4, 91.6); p.obj('empilhadeira', 110, 92.2);
    p.obj('caixa_frutas', 119.6, 99.6); p.obj('tonel', 123.4, 93); p.obj('boia', 123, 99.6, { semCol:true });
    p.obj('caiaque', 101.5, 105, { semCol:true });

    /* ---- Cidade Velha (murada) ---- */
    p.ret(38,68,54,40,'paralelepipedo');
    p.muralha([[36,66],[92,66],[92,108],[36,108],[36,66]], { portoes:[[64,66,3]] });
    p.obj('portao_grade', 64, 68.6, { id:'portao_velha', solidoT:[63,65,3,5], se:S=>!S.flag('colosso_vencido'), interagir:true,
      texto:['O portão da Cidade Velha está trancado com uma corrente do tamanho de um braço.', 'Do outro lado, algo ENORME respira em ciclos de exatamente 3 minutos e 33 segundos.'] });
    /* Cidade Velha por dentro: rua principal do portão até a praça,
       becos tortos, casas caiadas de tamanhos variados, cúpulas, tochas */
    p.estrada([[64,69],[64,104]], { larg:3, tipo:'pedra', calcada:0, faixa:false });
    p.estrada([[39,80],[89,80]], { larg:2, tipo:'pedra', calcada:0, faixa:false });
    p.estrada([[39,95],[89,95]], { larg:2, tipo:'pedra', calcada:0, faixa:false });
    p.elipse(64,88,7,5.5,'pedra');
    p.obj('fonte', 64, 88); p.obj('coqueiro', 58, 85); p.obj('coqueiro', 70, 85); p.obj('coqueiro', 58, 91); p.obj('coqueiro', 70, 91);
    p.cv(OWArte.barraca({ cor:'amar', item:'tecido' }), 60, 92); p.cv(OWArte.barraca({ cor:'verm', item:'pao' }), 68, 92);
    p.obj('banco', 61, 84); p.obj('banco', 67, 84);
    p.obj('pombos', 63, 86, { semCol:true }); p.obj('vaso_porcelana', 57.5, 88); p.obj('vaso_porcelana', 70.5, 88);
    const rv=OWPintor.rng(4444);
    p.casa(42,97,{ w:5, tel:2, par:2, telhado:'azul', parede:'cal', porta:2, id:'casa_careca', nomeLocal:'Casa do Careca',
      entra:['casa_careca'].concat(Interiores.entrada('casa_careca'), [3]) });
    /* medina: 6 fileiras de casas coladas com becos de 1 tile entre elas;
       a porta de cada fileira dá num beco ou numa rua. [linha da porta, x de, x até] */
    const fileirasCV=[ [72,39,59],[72,69,89],[78,39,59],[78,69,89],
                       [85,39,54],[85,74,89],[92,39,54],[92,74,89],
                       [100,48,59],[100,69,89],[105,39,59],[105,69,89] ];
    fileirasCV.forEach(([pl,de,ate])=>{
      let x=de;
      while(x<=ate-2){
        let w=3+Math.floor(rv()*3); if(x+w-1>ate) w=ate-x+1; if(w<3) break;
        const h=3+Math.floor(rv()*2), y=pl-h+1;
        if(rv()<0.1 && w>=4) p.grande(OWArte.cupula({ w:4, h:h+1 }), x, y-1, 4, h+1, { solH:h-1, interior:'templo', nomeLocal:'Pequeno Templo' }), w=4;
        else {
          p.casa(x, y, { w, tel:2, par:h-2, telhado:['barro','areia','barro','branco','verde','azul'][Math.floor(rv()*6)], parede:rv()<0.75?'cal':'pedra', porta:Math.floor(w/2), janelas:rv()<0.75, chamine:rv()<0.15 });
          // vida na frente das casas: vaso, gato, toldo de loja
          const dx=x+Math.floor(w/2), fy=y+h, enfeite=rv();
          if(enfeite<0.3) p.obj(rv()<0.5?'vaso_flor':'jarro', x+(dx-x>1?0:w-1)+0.1, fy-0.15);
          else if(enfeite<0.4) p.obj('gato', dx+1.2, fy-0.3, { semCol:true, interagir:true, texto:['Um gato da Cidade Velha. Ele não está congelado: só está te ignorando.'] });
          else if(enfeite<0.55 && w>=4) p.obj('toldo_'+['verm','azul','verde','amar'][Math.floor(rv()*4)], dx, y+h-1.9, { semCol:true, sempreCima:true });
        }
        x+=w+1+(rv()<0.2?1:0);
      }
    });
    // varais atravessando os becos (só desenho, por cima)
    [[44,74],[52,80.6],[78,74],[84,87],[46,87],[80,107]].forEach(([a,b])=>p.obj('varal', a, b, { semCol:true }));
    p.espalhar(['arv_moita_V','canteiro','barril','caixa','coqueiro','vaso_flor','jarro','tonel'], [39,69,52,38], { dens:0.035, dist:2.2, so:['paralelepipedo','pedra'], semente:41 });
    for(let i=41;i<88;i+=7){ p.obj('tocha', i, 79, { semCol:true }); p.obj('tocha', i+3, 94, { semCol:true }); }
    for(let j=72;j<104;j+=8){ p.obj('tocha', 60, j, { semCol:true }); p.obj('tocha', 68, j+4, { semCol:true }); }

    /* ---- praia ---- */
    p.espalhar(['coqueiro','coqueiro','bananeira'], [129,4,9,90], { dens:0.07, dist:2.6, so:['areia'], semente:12 });
    p.espalhar(['guarda_sol'], [130,8,8,80], { dens:0.03, dist:4, so:['areia'], semente:13 });
    p.obj('torre_salva', 134, 30, { interagir:true, investigar:'mirante_praia', verbo:'🔭 SUBIR',
      texto:['Do alto da torre do salva-vidas: a praia inteira cheia de gente CONGELADA no meio do mergulho.', 'Um surfista no ar, em cima da onda, há sei lá quanto tempo. A prancha dele marca 03:33. Prancha não tem relógio.'] });
    p.obj('rede_volei', 133.5, 52); p.obj('prancha', 131, 36, { semCol:true }); p.obj('prancha', 132, 36.3, { semCol:true });
    [[131,14],[133,58],[130,77],[132,86]].forEach(([a,b])=>p.obj('cadeira_praia', a, b, { semCol:true }));
    p.obj('caiaque', 134.5, 74, { semCol:true }); p.obj('caiaque', 133.5, 18, { semCol:true });

    /* ---- árvores e postes nas avenidas ---- */
    for(let i=4;i<126;i+=9){ if(Math.abs(i-65)<9) continue; po('poste', i, 38); p.obj('poste', i+4, 43); }
    for(let j=4;j<62;j+=9){ if(Math.abs(j-41)<8) continue; p.obj('poste', 63, j); }
    for(let i=7;i<126;i+=9){ if(Math.abs(i-65)<10 || Math.abs(i-41)<3 || Math.abs(i-30)<2 || i===16) continue; p.obj('arvore_calcada', i, 43); }
    p.espalhar(['arv_redonda_V','arv_fina_V','arv_media_V','arv_alta_V'], [24,24,8,14], { dens:0.18, dist:2, so:['grama'], semente:21 });
    p.espalhar(['arv_redonda_V','arv_pinheiro_V','arv_media_V','arbusto2','arv_moita_V'], [0,0,32,84], { dens:0.035, dist:2.5, so:['grama'], semente:22 });
    p.espalhar(['arv_redonda_V','arv_grande_V','arv_media_V','arbusto'], [93,26,20,13], { dens:0.06, dist:2.4, so:['grama'], semente:23 });
    p.espalhar(['arv_redonda_V','arv_media_V','arbusto'], [111,44,16,12], { dens:0.06, dist:2.4, so:['grama'], semente:24 });
    p.espalhar(['arv_pinheiro_V','arv_alta_V','arv_redonda_V'], [0,0,160,4], { dens:0.4, dist:1.6, so:['grama','terra'], semente:25, longe:(i)=>Math.abs(i-65)<4 });

    /* ---- ruas vivas: carros parados, ônibus, faixas, semáforos ---- */
    [5,9,25,52,78,84,92,100,117,121].forEach(c=>carroH(c, 42));
    [33,40,56,74,82,108,124].forEach(c=>carroH(c, 23));
    [28,36,54,80,90].forEach(c=>carroH(c, 58));
    carroV(64, 10, 'taxi'); carroV(66, 52); carroV(101, 72, 'taxi'); carroH(115, 78, 'branco');
    p.obj('onibus_h', 45.5, 42);
    faixaH(16,40,42); faixaH(106,40,42); faixaH(114,40,42); faixaH(61,21,23); faixaH(69,21,23);
    faixaH(61,56,58); faixaH(69,56,58); faixaV(18,64,66); faixaV(26,64,66); faixaV(64,99,101);
    [[11,38],[16,44],[105,38],[112,44],[63,19],[68,25],[62,59],[96,59]].forEach(([a,b])=>po('semaforo', a, b));
    [[30,41],[80,41],[118,41],[50,22],[95,22],[45,57],[85,57],[100,70]].forEach(([a,b])=>p.obj('bueiro', a, b, { semCol:true }));
    [[20,38],[38,43],[88,38],[102,43],[124,38],[60,24],[118,24],[24,55],[60,55]].forEach(([a,b])=>po('hidrante', a, b));
    [[33,38],[52,38],[97,38],[123,43],[34,24],[86,55]].forEach(([a,b])=>po('lixeira_verde', a, b));
    po('orelhao', 76, 43); po('orelhao', 103, 24); po('caixa_correio', 92, 43);
    po('placa_rua', 15, 38); po('placa_rua', 108, 38);
    po('moto', 47, 39.4); po('moto', 114, 39.4); po('bicicletario', 86, 24.4);

    /* ---- estacionamento e piscina do hotel ---- */
    p.ret(102,45,7,10,'asfalto');
    for(let j=50;j<54;j+=2){ carroH(104.5, j+1); }     // as 2 vagas de cima são do Astra e do Corsa (Mundo.veiculo)
    p.obj('placa_madeira', 101.5, 46, { interagir:true, texto:['ESTACIONAMENTO DO HOTEL — VAGAS 1 e 2: "TURISTAS DE LIMEIRA. NÃO ENCOSTAR NO RETROVISOR."'] });
    p.ret(119,52,7,4,'calcada'); p.ret(120,53,5,2,'agua');
    p.obj('cadeira_praia', 119.6, 55.4, { semCol:true }); p.obj('cadeira_praia', 125.4, 55.4, { semCol:true }); p.obj('guarda_sol', 126.2, 53);
    p.obj('palmeira_vaso', 118.6, 52); p.obj('palmeira_vaso', 126.4, 51.2);

    /* ---- ferro-velho (fechado no Cap. 1 até a missão dele) ---- */
    for(let i=0;i<4;i++){ p.obj('cerca_h', 6+i*7.5, 84); }
    p.espalhar(['pneus','caixa','barril','prototipo','carro_sucata','pilha_pneus'], [5,88,28,20], { dens:0.07, dist:2, semente:31 });
    p.obj('placa_madeira', 24, 83, { interagir:true, texto:['FERRO-VELHO — PROPRIEDADE DE M.B.JW', '"Proibida a entrada de quem tem coração. Robôs, fiquem à vontade."'] });
    p.solido(4,84,30,1); p.livre(20,84,3,1);
    p.obj('portao_grade', 21, 85.6, { id:'portao_ferro', solidoT:[20,84,3,2], se:S=>!S.flag('ferro_aberto'), interagir:true,
      texto:['O portão do ferro-velho está acorrentado. A corrente tem um cadeado em formato de relógio.'] });

    /* ---- zona industrial (oeste): galpões (com interior), chaminés fumegando ---- */
    p.edificio('galpao', 3, 29, 5, 3, { solH:2, portaX:2, fumaca:[44,-92], nomeLocal:'Galpão Industrial' });
    p.edificio('galpao', 23, 29, 5, 3, { solH:2, portaX:2, fumaca:[44,-92], nomeLocal:'Galpão Industrial' });
    p.edificio('galpao', 3, 35, 5, 3, { solH:2, portaX:2, nomeLocal:'Galpão Industrial' });
    p.obj('chamine', 18, 30, { fumaca:[0,-62] }); p.obj('chamine', 31, 37, { fumaca:[0,-62] });
    ['barril','barril2','caixa','pneus','caixa'].forEach((n,i)=>p.obj(n, 16+i*1.6, 37+(i%2)*0.6));
    p.obj('cerca_h', 3, 25); p.obj('cerca_h', 26, 25);
    p.obj('container_azul', 9, 33); p.obj('container_vermelho', 9, 34.4); p.obj('palete', 25, 36.4); p.obj('empilhadeira', 28, 35.6);

    /* ---- Parque do Yarkon (lago, flores, bancos) ---- */
    p.mancha(10,69,7,4.5,'agua',0.25);
    p.bordaDe('grama','agua','terra',1);
    p.mancha(10,69,11,8,'grama_flor',0.3);
    p.mancha(10,69,7,4.5,'agua',0.25);
    p.bordaDe('grama_flor','agua','terra',1);
    p.trilha([[21,60],[16,63],[10,62],[3,64]], 2, 'terra');
    p.obj('banco', 8, 63); p.obj('banco', 13, 63); p.obj('canteiro', 4, 75); p.obj('canteiro', 15, 76);
    p.obj('barco', 10, 70, { semCol:true });
    p.obj('mesa_piquenique', 16.5, 79); p.obj('bebedouro_passaro', 3, 72); p.obj('lixeira_verde', 18, 63);
    p.espalhar(['arv_grande_V','arv_redonda_V','arv_media_V','arv_alta_V','arbusto'], [0,58,20,26], { dens:0.06, dist:2.6, so:['grama','grama_flor'], semente:51 });
    p.zona('Parque do Yarkon', 0,58,20,26);

    /* ---- Horta comunitária (entre a trilha do ferro-velho e a muralha) ---- */
    p.ret(25,67,8,6,'horta');
    for(let j=68;j<72;j+=2) for(let i=26;i<32;i+=2) p.obj('horta_couve', i, j, { semCol:true });
    p.obj('cerca_branca', 26, 73.4); p.obj('cerca_branca', 31, 73.4); p.obj('regador', 33.4, 70, { semCol:true });
    p.obj('caixa_dagua', 34, 66); p.obj('mesa_piquenique', 29, 77); p.obj('lenha', 33, 76); p.obj('caixa_ferramentas', 25.5, 76, { semCol:true });
    p.zona('Horta Comunitária', 23,64,13,16);

    /* ---- Olival e cemitério antigo (ao sul da muralha) ---- */
    p.trilha([[36,113],[78,113]], 2, 'terra');
    p.espalhar(['arv_redonda_P','arv_moita_P','arv_redonda2_P','arv_media_P'], [37,110,40,10], { dens:0.16, dist:2.4, so:['grama'], semente:71 });
    p.ret(80,110,11,7,'grama_escura');
    const lap=['lapide','lapide_rip','lapide_cruz','lapide','lapide_grande'];
    for(let j=111;j<116;j+=2) for(let i=81;i<90;i+=2) p.obj(lap[(i*3+j)%lap.length], i+(j%4?0.5:0), j);
    p.obj('cerca_h', 82, 109.4); p.obj('cerca_h', 88, 109.4); p.obj('arv_alta_S', 79.5, 116); p.obj('arv_fina_S', 90.5, 112);
    p.obj('placa_madeira', 85, 117.2, { interagir:true, texto:['CEMITÉRIO ANTIGO DE JAFFA','Todas as lápides têm a mesma hora de falecimento esculpida: 03:33. Algumas são de 1800 e pouco.'] });
    p.zona('Olival', 36,109,44,11); p.zona('Cemitério Antigo', 79,109,13,10);

    /* ---- pátio do laboratório: sucata e contêineres ---- */
    p.obj('pilha_pneus', 20, 21); p.obj('carro_sucata', 25, 19); p.obj('container_verde', 27, 15); p.obj('container_azul', 27, 16.4);
    p.obj('caixa', 19, 9); p.obj('barril2', 20.4, 9.6); p.obj('palete', 29, 21.6);

    /* ---- leste: quintal com mesa e jardim entre o hotel e a igrejinha ---- */
    p.espalhar(['arv_redonda_V','arv_media_V','arbusto','vaso_flor'], [111,56,16,6], { dens:0.07, dist:2.4, so:['grama'], semente:81, longe:(i,j)=>j===57 });
    p.obj('mesa_piquenique', 117, 60); p.obj('bicicleta', 120, 60.4, { semCol:true });

    /* ---- Hotel dos turistas (leste) ---- */
    p.predio(114,44,{ w:6, prof:2, alt:3, cor:'areia', id:'hotel', nomeLocal:'Hotel Mar Azul', interior:'hotel' });
    p.obj('placa_madeira', 113, 50, { interagir:true, texto:['HOTEL MAR AZUL ★★★', '"Check-out: 12h. Ou quando o relógio andar. O que vier primeiro."'] });
    p.obj('mesa_cafe', 121, 51); p.obj('mesa_cafe', 124, 51);
    p.zona('Hotel Mar Azul', 111,43,16,10);

    /* ---- casinhas do leste (atrás da Torre Dourada) ---- */
    p.casa(120,29,{ w:5, tel:2, par:2, telhado:'branco', parede:'pedra', nomeLocal:'Casa' });
    p.casa(120,34,{ w:5, tel:2, par:2, telhado:'barro', parede:'tijolo', nomeLocal:'Casa', chamine:true });
    p.obj('caixa_correio', 119.4, 37.6); p.obj('vaso_flor', 125, 32.6);

    /* ---- detalhes da cidade ---- */
    p.obj('ponto_onibus', 41, 43, { interagir:true, texto:['PONTO DO ÔNIBUS 333 — "Próximo ônibus: 03:33".', 'Tem um horário colado embaixo, em letra pequena: "Última parada: O REINO".'] });
    p.obj('banca_jornal', 70, 24, { interagir:true, texto:['Manchete do jornal, de ontem às 03:32: "CIENTISTA M.B.JW PROMETE ANUNCIAR AMANHÃ A MAIOR INVENÇÃO DE TODOS OS TEMPOS".', 'Não teve amanhã.'] });
    p.obj('mesa_cafe', 98, 47); p.obj('mesa_cafe', 98, 51);
    p.obj('canteiro', 55, 44.2); po('canteiro', 76, 38); po('canteiro', 104, 38);
    p.mancha(108,32,4,3,'grama_flor',0.3); p.mancha(46,30,3,2,'grama_flor',0.3);

    /* ---- praia viva ---- */
    p.obj('quiosque', 131, 24); p.obj('quiosque', 131, 66);
    p.espalhar(['toalha'], [130,10,7,70], { dens:0.03, dist:3, so:['areia'], semente:61 });

    /* ---- porto: contêineres, guindaste, farol na baía ---- */
    const cts=['container_vermelho','container_azul','container_verde'];
    for(let i=0;i<5;i++) p.obj(cts[i%3], 103+i*2.2, 96); for(let i=0;i<3;i++) p.obj(cts[(i+1)%3], 104+i*2.2, 94);
    p.obj('guindaste', 126, 96);
    p.mancha(121,115,2.2,1.8,'rocha_escura',0.2);
    p.obj('farol', 121, 115, { interagir:true, raio:180, texto:['O farol da baía. A luz gira… e para. Gira… e para. Sempre no mesmo ponto: apontando pro norte.'] });
    p.luz(121,113,4,'#ffe9a3');

    /* ---- nomes dos lugares (aparecem no alto da tela) ---- */
    p.zona('Laboratório 5000Z', 0,8,30,16);
    p.zona('Praça do Relógio', 56,34,18,14);
    p.zona('Distrito das Torres', 30,0,98,20);
    p.zona('Mercado de Jaffa', 72,43,28,13);
    p.zona('A "Igrejinha"', 96,57,15,10);
    p.zona('Subestação do Porto', 111,61,15,13);
    p.zona('Porto de Tel Aviv', 99,77,36,40);
    p.zona('Cidade Velha', 36,66,58,44);
    p.zona('Praia de Tel Aviv', 128,0,32,100);
    p.zona('Ferro-Velho', 0,82,36,38);
    p.zona('Rua das Casas', 20,44,44,15);
    p.zona('Rua do Comércio', 22,58,76,8);

    p.ponto('praca', 64, 41); p.ponto('mercado', 85, 50); p.ponto('igrejinha', 103, 66); p.ponto('subestacao', 116, 69);

    /* ---- saídas (fechadas dentro da lore) ---- */
    p.saida({ lado:'norte', de:[63,67], para:['estradas', 160, 69, 3],
      trava:{ se:S=>S.flag('estrada_norte_aberta'), texto:'A Estrada do Norte está fechada por uma barreira de robôs do Marcelão. Eles não piscam. Não respiram. Não deixam passar.' } });
    p.saida({ lado:'oeste', de:[39,43], para:['estradas', 196, 70, 1],
      trava:{ se:S=>S.flag('ponte_yarkon'), texto:'A ponte do Yarkon caiu no minuto 03:33. Do outro lado, a estrada pro resto do mundo… e nenhum jeito de chegar lá.' } });
  }
});
