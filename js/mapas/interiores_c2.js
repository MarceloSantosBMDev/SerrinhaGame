/* ============================================================
   INTERIORES DO CAPÍTULO 2 — SMERGULUS KINGDOM
   ------------------------------------------------------------
   castelo_salao  o salão do trono (corredor de tapete, colunas, almas)
                  → porta oeste: cozinha_real · porta leste: arquivo_real
                  → escada do fundo: torre_almas
   academia_77    os pesos que ninguém levanta, o recorde na parede
   taverna_smerg  a taverna dos soldados (quadro de recompensas)
   esgoto         o esconderijo dos justiceiros: canais d'água, passarelas
   Mesma engine e mesmos tipos de parede/piso dos outros interiores.
   ============================================================ */
(function(){
  /* casca: borda escura, piso, 2 fileiras de face de parede, porta de baixo */
  function casca(p, W, H, piso, parede, saida, nomeSaida, trava){
    p.ret(0,0,W,H,'parede_topo_casa');
    p.ret(1,1,W-2,H-2,piso); p.ret(1,1,W-2,1,parede+'_a'); p.ret(1,2,W-2,1,parede+'_b');
    const ex=Math.floor(W/2);
    p.ret(ex,H-1,1,1,piso); p.porta(ex,H-1, saida, { nome:nomeSaida||'Sair', trava });
    p.obj('tapete_bemvindo', ex, H-2, { semCol:true });
    p.ponto('saidaInterior', ex, H-2);
    return ex;
  }
  /* porta numa parede lateral (x=0 ou x=W-1), com um arco desenhado */
  function portaLado(p, x, y, para, nome, trava){ p.ret(x,y,1,1,'pedra_roxa'); p.porta(x,y, para, { nome, trava }); }

  /* ---------------- SALÃO DO TRONO ---------------- */
  const SW=23, SH=19;
  Interiores.fixarEntrada('castelo_salao', [11, SH-2]);
  Mundo.regiao('castelo_salao', { nome:'Salão do Trono', w:SW, h:SH, semente:2201, interior:true, fora:'smergulus', portaFora:[86,48], escuro:0.35,
    pintar(p, S){
      // com a ponte levadiça erguida, sair pela frente é dar de cara com o fosso
      const ex=casca(p, SW, SH, 'pedra_roxa', 'proxa', ['smergulus', 86, 49, 0], 'Sair do castelo',
        { se:S=>!S.flag('ponte_erguida'), texto:'A ponte levadiça está erguida. Lá fora só tem fosso. Melhor voltar pelo caminho por onde veio (a cozinha).' });
      p.ret(ex-1,4,3,SH-5,'tapete');
      p.obj('trono', ex, 3.6, { id:'trono', interagir:true, texto:['O trono da rainha. Espaldar de ferro roxo com uma coroa. O assento está… quente.'] });
      for(let j=5;j<SH-3;j+=4){ p.obj('pilastra', ex-4, j); p.obj('pilastra', ex+4, j); p.obj('braseiro', 2, j); p.obj('braseiro', SW-3, j); }
      for(let i=0;i<6;i++) p.obj('alma', 4+i*3, 2.4+(i%2)*0.4, { semCol:true });
      p.obj('estandarte_reino', ex-2, 2.6, { semCol:true }); p.obj('estandarte_reino', ex+2, 2.6, { semCol:true });
      p.luz(ex,4,6,'#a24bff');
      portaLado(p, 0, 9, ['cozinha_real', 13, 6, 1], 'Cozinha Real');
      portaLado(p, SW-1, 9, ['arquivo_real', 1, 6, 2], 'Arquivo Real', { se:S=>S.flag('arquivo_aberto') || S.flag('ato2'), texto:'A porta do Arquivo Real está trancada. Lá dentro, alguém ronca em cima de uma pilha de papel.' });
      p.ret(SW-4,2,1,1,'pedra_roxa');
      p.porta(SW-4,2, ['torre_almas', 6, 11, 3], { nome:'Escada da Torre', trava:{ se:S=>S.flag('ato4'), texto:'A escada da torre é guardada por uma porta de ferro com o selo da rainha. Ela só abre "no dia em que o mundo parar".' } });
      p.obj('escada_sobe', SW-4, 2.95, { semCol:true });
    } });

  /* ---------------- COZINHA REAL ---------------- */
  Interiores.fixarEntrada('cozinha_real', [13, 6]);
  Mundo.regiao('cozinha_real', { nome:'Cozinha Real', w:15, h:11, semente:2202, interior:true, fora:'smergulus', portaFora:[86,48],
    pintar(p, S){
      p.ret(0,0,15,11,'parede_topo_casa'); p.ret(1,1,13,9,'piso_ladrilho'); p.ret(1,1,13,1,'pazulejo_a'); p.ret(1,2,13,1,'pazulejo_b');
      portaLado(p, 14, 6, ['castelo_salao', 1, 9, 2], 'Voltar pro salão');
      // a passagem dos justiceiros: um alçapão atrás dos sacos, direto pro esgoto
      portaLado(p, 0, 8, ['esgoto', 1, 4, 2], 'Passagem pro esgoto', { se:S=>S.flag('passagem_secreta'), texto:'Uma tábua solta na parede, atrás dos sacos. Do outro lado, cheiro de esgoto. Não abre daqui.' });
      p.obj('fogao_lenha', 2, 3); p.obj('fogao', 3, 3); p.obj('forno_padaria', 6, 3); p.obj('armario_coz', 9, 3); p.obj('geladeira', 11, 3);
      p.obj('mesa_jantar', 6.5, 6); p.obj('cadeira_fina', 9, 6, { interagir:true, texto:['UMA cadeira só. Do tamanho de duas. É a cadeira do Fat Smerg.'] });
      p.obj('barril', 2, 8); p.obj('sacos', 4, 9); p.obj('caixa_legumes', 11.5, 9);
      p.obj('placa_parede', 7, 1.7, { interagir:true, raio:96, semCol:true, texto:['DECRETO REAL Nº 1: "SÓ EXISTE UM FAT. TODO O RESTO DO REINO ESTÁ DE DIETA."'] });
      p.luz(5,4,4,'#ff9a3a');
    } });

  /* ---------------- ARQUIVO REAL ---------------- */
  Interiores.fixarEntrada('arquivo_real', [1, 6]);
  Mundo.regiao('arquivo_real', { nome:'Arquivo Real', w:15, h:11, semente:2203, interior:true, fora:'smergulus', portaFora:[86,48], escuro:0.3,
    pintar(p, S){
      p.ret(0,0,15,11,'parede_topo_casa'); p.ret(1,1,13,9,'piso_tabuas'); p.ret(1,1,13,1,'pmadeira_a'); p.ret(1,2,13,1,'pmadeira_b');
      portaLado(p, 0, 6, ['castelo_salao', SW-2, 9, 1], 'Voltar pro salão');
      for(let i=2;i<13;i+=2) p.obj(i%4?'estante_cheia':'estante_livros', i, 3);
      p.obj('mesa_escritorio', 7.5, 6, { interagir:true, investigar:'ficha_smergulao', verbo:'📂 LER FICHA',
        texto:['FICHA DE EXPULSÃO, ARQUIVO REAL. "Nome: SMERGULÃO. Smerg criado por Sua Majestade. Tamanho: GRANDE."','"Crime: ██████████—" A tinta escorre, a letra treme e termina num rabisco.','Embaixo, outra letra: "o escrivão desmaiou antes de terminar de escrever."'] });
      p.obj('lenha', 2, 8); p.obj('caixa', 12, 8); p.obj('abajur', 10, 6);
      p.luz(7,5,4,'#ffd36a');
    } });

  /* ---------------- TORRE DAS ALMAS (o Relógio de Almas) ---------------- */
  Interiores.fixarEntrada('torre_almas', [6, 11]);
  Mundo.regiao('torre_almas', { nome:'Torre das Almas', w:13, h:13, semente:2204, interior:true, fora:'smergulus', portaFora:[86,48], escuro:0.45,
    pintar(p, S){
      casca(p, 13, 13, 'pedra_roxa', 'proxa', ['castelo_salao', SW-4, 3, 0], 'Descer');
      p.obj('relogio_gigante', 6, 4.6, { interagir:true, texto:['O RELÓGIO DE ALMAS: centenas de potinhos de vidro em volta de um ponteiro de gelo azul que gira pra trás. O tempo de Tel Aviv está aqui.'] });
      for(let i=0;i<9;i++) p.obj('potinho_alma', 1.6+i*1.2, 7+(i%3)*0.5, { semCol:true });
      p.luz(6,4,6,'#c9a8ff');
    } });

  /* ---------------- ACADEMIA Nº 77 ---------------- */
  Interiores.fixarEntrada('academia_77', [7, 9]);
  Mundo.regiao('academia_77', { nome:'Academia Nº 77', w:15, h:11, semente:2205, interior:true, fora:'smergulus', portaFora:[37,85],
    pintar(p, S){
      casca(p, 15, 11, 'piso_concreto', 'ptijolo', ['smergulus', 37, 86, 0]);
      p.obj('peso_academia', 3, 4, { interagir:true, verbo:'🏋 LEVANTAR', id:'peso_1' });
      p.obj('peso_academia', 7, 4, { interagir:true, verbo:'🏋 LEVANTAR', id:'peso_2' });
      p.obj('peso_academia', 11, 4, { interagir:true, verbo:'🏋 LEVANTAR', id:'peso_3' });
      p.obj('placa_parede', 7, 1.7, { interagir:true, raio:96, semCol:true, texto:['QUADRO DE RECORDES: "1º lugar: Nº 77 — levantou O PESO QUE NINGUÉM LEVANTA." 2º lugar: (vazio). 3º lugar: (vazio). Ninguém nunca mais tentou.'] });
      p.obj('boneco_treino', 2, 8); p.obj('boneco_treino', 12, 8); p.obj('bebedouro', 13, 3);
      p.luz(7,5,4,'#ffe2a0');
    } });

  /* ---------------- TAVERNA DOS SMERGS ---------------- */
  Interiores.especial('taverna_smerg', 'taverna', 'smergulus', [95,113], 'Taverna do Bonezinho', (p, k)=>{
    k.parede('quadro_recompensa', k.ex-4, 2.1, { interagir:true, verbo:'📋 QUADRO', texto:['"PROCURA-SE: BANDO DO PÉ-DE-CABRA. RECOMPENSA: 30 MOEDAS. ASS: OS MORADORES."','"PROCURA-SE: SMERGULÃO. CRIME: ██████ (proibido de dizer por decreto real)."'] });
  }, { moradores:['smerg_normal'] });

  /* ---------------- ESGOTO DOS JUSTICEIROS ---------------- */
  const EW=25, EH=17;
  Interiores.fixarEntrada('esgoto', [12, EH-2]);
  Mundo.regiao('esgoto', { nome:'Esgoto do Reino', w:EW, h:EH, semente:2206, interior:true, fora:'smergulus', portaFora:[140,112], escuro:0.4,
    pintar(p, S){
      casca(p, EW, EH, 'piso_pedra_int', 'ptijolo', ['smergulus', 140, 113, 0], 'Subir pra vila');
      // fundo à esquerda: o túnel que a água abriu até a cozinha do castelo
      portaLado(p, 0, 4, ['cozinha_real', 1, 8, 2], 'Túnel pra Cozinha Real', { se:S=>S.flag('passagem_secreta'), texto:'Uma grade enferrujada no fundo do esgoto. Do outro lado, um túnel escuro… e cheiro de comida de castelo. A grade não abre. Ainda.' });
      // canais d'água com passarelas
      p.ret(1,6,EW-2,2,'agua'); p.ret(1,11,9,2,'agua'); p.ret(15,11,9,2,'agua');
      p.ret(11,6,3,2,'madeira'); p.ret(4,6,2,2,'madeira'); p.ret(19,6,2,2,'madeira');
      // esconderijo (fundo)
      p.obj('cama_solteiro', 3, 4); p.obj('cama_azul', 21, 4); p.obj('mesa_redonda', 12, 4, { interagir:true, investigar:'mapa_esgoto', verbo:'🗺 OLHAR', texto:['Um mapa do castelo desenhado a carvão: o fosso, a ponte levadiça, a TORRE. Anotação: "o relógio de almas fica lá em cima".'] });
      p.obj('caixa', 7, 4); p.obj('barril', 16, 4); p.obj('rodo_suporte', 9, 1.9, { semCol:true, interagir:true, raio:96, investigar:'rodo_esgoto', verbo:'🔍 OLHAR', texto:['Um suporte de rodo na parede do esgoto, com um rodo novo. Embaixo, escrito: "C."'] });
      p.obj('boia', 6, 9.4, { semCol:true }); p.obj('boia', 18, 9.4, { semCol:true });
      p.obj('placa_parede', 12, 1.7, { interagir:true, raio:96, semCol:true, texto:['Pintado na parede: "JUSTIÇA NÃO TEM PREÇO." Embaixo, menor: "mas aceitamos doações de sopa."'] });
      p.luz(12,4,5,'#7fd8ff'); p.luz(4,13,3,'#7fd8ff'); p.luz(20,13,3,'#7fd8ff');
    } });
})();
