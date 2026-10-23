/* ============================================================
   MAPA — ESTRADAS DO MUNDO (200 × 72 tiles)
   O "meio" do mapa.png: a Estrada do Norte sai de Tel Aviv (borda sul,
   x≈160), sobe, cruza o rio por uma ponte de madeira e vira pro
   noroeste até a fronteira do Smergulus Kingdom (borda norte, x≈30).
   Estrada de TERRA: o Astra anda aqui (`rodavel`).
   Saídas trancadas dentro da lore: a Ilha (a ponte caiu) e Limeira
   (névoa de lava). A borda leste é a ponte do Yarkon (caída).
   ============================================================ */
Mundo.regiao('estradas', {
  nome:'Estradas do Mundo', w:200, h:72, semente:4242, ceu:'campo',
  mundi:{ x:42, y:8, w:14, h:70 },
  rodavel:['terra','madeira'],
  pintar(p, S){
    const W=200, H=72;
    p.ret(0,0,W,H,'grama');
    p.mancha(30,10,40,12,'cinzas',0.35);                  // o chão do reino começando no norte
    p.mancha(18,30,20,10,'terra2',0.35);
    p.mancha(180,60,22,10,'grama_flor',0.3);
    // rio que desce do norte e corta a estrada
    p.rio([[118,0],[112,20],[100,38],[96,56],[90,72]], { larg:4, margem:'areia', margemLarg:1 });
    // a estrada de terra
    p.trilha([[160,72],[160,46],[140,44],[100,44],[60,40],[40,26],[30,0]], 4, 'terra');
    p.ret(96,42,10,5,'madeira');                            // ponte sobre o rio
    p.obj('placa_madeira', 152, 48, { interagir:true, texto:['ESTRADA DO NORTE ↑ SMERGULUS KINGDOM (pedágio de alma)','← RUÍNAS DA ILHA (ponte caída)  ·  ↓ TEL AVIV  ·  ↘ LIMEIRA (névoa de lava)'] });
    p.obj('placa_madeira', 34, 6, { interagir:true, texto:['FRONTEIRA DO REINO DA RAINHA SMERGULA. "AQUI TUDO TEM PREÇO. INCLUSIVE O AR."'] });
    // pousada do viajante
    p.casa(128,36,{ w:6, tel:2, par:2, telhado:'barro', parede:'tijolo', placa:'POUSADA', nomeLocal:'Pousada do Meio do Caminho' });
    p.obj('fogueira', 124, 41); p.obj('mesa_piquenique', 136, 40); p.obj('lenha', 122, 39);
    // floresta e montanhas
    p.floresta([0,48,80,24], ['arv_redonda_V','arv_pinheiro_V','arv_grande_V','arv_media_V'], { so:['grama'], semente:5, dens:0.25, dist:1.8 });
    p.floresta([110,0,90,30], ['arv_pinheiro_V','arv_alta_V','arv_redonda_V'], { so:['grama'], semente:6, dens:0.22, dist:1.8 });
    p.espalhar(['arv_alta_S','arv_fina_S','pedregulho','pedra_m'], [0,0,70,30], { dens:0.05, dist:2.4, so:['cinzas','terra2','grama'], semente:7 });
    p.espalhar(['arv_redonda_V','arbusto','arv_moita_V','pedra_p'], [60,30,140,42], { dens:0.03, dist:2.4, so:['grama','grama_flor'], semente:8 });
    p.zona('Estrada do Norte', 120,40,80,32); p.zona('Ponte do Rio', 90,36,20,14); p.zona('Fronteira do Reino', 10,0,50,18);
    // saídas
    p.saida({ lado:'sul', de:[156,164], para:['telaviv', 65, 2, 0] });
    p.saida({ lado:'norte', de:[26,34], para:['smergulus', 86, 137, 3],
      trava:{ se:S=>S.flag('fronteira_aberta'), texto:'A cancela roxa do pedágio está baixada. Um smerg cobrador boceja: "fronteira fechada. ordem real."' } });
    p.saida({ lado:'oeste', de:[30,44], para:['ilha', 78, 40, 1], trava:{ se:S=>false, texto:'A ponte pras Ruínas da Ilha caiu numa tempestade. Do outro lado, um templo branco e alguém acenando com uma lasanha.' } });
    p.saida({ lado:'leste', de:[30,72], para:['telaviv', 1, 41, 2], trava:{ se:S=>S.flag('ponte_yarkon'), texto:'A ponte do Yarkon caiu no minuto 03:33. Do outro lado, Tel Aviv.' } });
    p.saida({ lado:'sul', de:[60,80], para:['limeira', 40, 1, 0], trava:{ se:S=>false, texto:'Uma névoa de lava fecha a estrada pra Limeira. Dá pra ouvir, lá longe, um sino de igrejinha.' } });
  }
});
