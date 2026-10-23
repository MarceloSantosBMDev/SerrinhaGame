/* ============================================================
   MODO 3x3 POR TURNOS — dados de combate
   ------------------------------------------------------------
   Separado do jogo de luta: aqui cada personagem tem stats,
   4 golpes e uma PASSIVA própria, pensados para turnos.

   TIPOS DE DANO (10):
     fisico      dano direto, reduzido pela defesa
     fogo        aplica QUEIMADURA (dano por turno)
     veneno      IGNORA defesa (acerto direto e o veneno por turno) —
                 o veneno por turno é sempre o MESMO número, não importa
                 quem aplicou (ver VENENO_TICK)
     sangramento IGNORA defesa (acerto direto e o sangramento por turno)
                 — cresce conforme o alvo perde vida
     eletrico    chance de ATORDOAR (perde o turno)
     gelo        aplica LENTIDÃO (reduz velocidade / atrasa o turno)
     terra       ataque de TERRENO: fica no campo e fere todo turno
     sombrio     DRENA vida do alvo para quem atacou
     energia     PERFURA defesa (ignora boa parte dela)
     explosivo   atinge o time inteiro
   ============================================================ */
const TurnData = (function(){

  const TIPOS = {
    fisico:     { nome:'Físico',      cor:'#d8dde3', icone:'👊' },
    fogo:       { nome:'Fogo',        cor:'#ff7a3c', icone:'🔥' },
    veneno:     { nome:'Veneno',      cor:'#9cff5e', icone:'☠' },
    sangramento:{ nome:'Sangramento', cor:'#ff4d6d', icone:'🩸' },
    eletrico:   { nome:'Elétrico',    cor:'#ffe066', icone:'⚡' },
    gelo:       { nome:'Gelo',        cor:'#7df0ff', icone:'❄' },
    terra:      { nome:'Terreno',     cor:'#caa66a', icone:'🌋' },
    sombrio:    { nome:'Sombrio',     cor:'#c46bff', icone:'🌑' },
    energia:    { nome:'Energia',     cor:'#5ad6ff', icone:'✨' },
    explosivo:  { nome:'Explosivo',   cor:'#ffb03c', icone:'💥' },
    charme:     { nome:'Charme',      cor:'#ff9ecb', icone:'💗' },
    maldito:    { nome:'Maldito',     cor:'#a24bff', icone:'🕸' },
    agua:       { nome:'Água',        cor:'#3bb8ff', icone:'💧' },
    // do Cabelin: dano físico comum (corta pela defesa normal), só com cor e ícone próprios
    lasanha:    { nome:'Lasanha',     cor:'#ffb83c', icone:'🍝' }
  };

  /* Quais tipos contam como MAGIA. Serve para o Véu Maldito, que
     fortalece "qualquer tipo de magia" — o soco e a explosão ficam de
     fora de propósito: ambiente de bruxaria não ajuda porrada. */
  const MAGICOS = ['veneno','sombrio','energia','gelo','fogo','eletrico','charme','maldito','agua'];
  function ehMagia(tipo){ return MAGICOS.indexOf(tipo)>=0; }

  /* VENENO POR TURNO — sempre este número, independente de quem picou.
     Antes cada personagem tinha o próprio valor (Serrinha Dog 7,
     Smergula 9): duas picadas de veneno iguais doendo diferente só
     porque a origem é outra não fazia sentido — o veneno é o mesmo
     veneno. Escolhido o valor da Serrinha (o mais baixo dos dois) para
     não empurrar ainda mais pra cima quem já mede acima do teto de 60%
     de vitória nas simulações de balanço.                             */
  const VENENO_TICK = 7;

  /* PASSIVAS — uma por personagem. Os "por turno" acumulam. */
  const PASSIVAS = {
    fortaleza:{ nome:'Fortaleza', icone:'🛡',
      desc:'Recebe 25% menos dano. Imune a Lentidão.' },
    agilidade_crescente:{ nome:'Agilidade Crescente', icone:'💨',
      desc:'Ganha +12% de velocidade a cada turno (acumula). Fica cada vez mais rápido na ordem.' },
    instinto:{ nome:'Instinto Selvagem', icone:'🐾',
      desc:'+6% de chance de esquiva a cada turno (até 30%). Ao esquivar, contra-ataca.' },
    padaria:{ nome:'Padaria Ambulante', icone:'🥖',
      desc:'No fim de cada turno, cura 3 de vida em si e 1 em cada aliado.' },
    sugadora:{ nome:'Sugadora de Almas', icone:'👻',
      desc:'CADA golpe dela rouba ALMAS do alvo (quanto mais dano, mais almas). '+
           'Ao juntar 115 almas ela vira SMERGULA DEMÔNIO: os cinco golpes são TROCADOS por versões '+
           'que roubam vida, e ela ganha +20% de dano, +4 de ataque e +1 de defesa.' },
    carisma:{ nome:'Carisma', icone:'💋',
      desc:'Toda cura que ela faz em OUTRO aliado devolve 45% do valor para ela mesma. Quanto mais cuida do time, mais ela aguenta.' },
    protocolo_ciborgue:{ nome:'Protocolo Ciborgue', icone:'🦾',
      desc:'Com 50% de vida vira QUASE-CIBORGUE (+20% dano) e com 30% vira CIBORGUE 5000Z (+40% dano, +2 defesa). '+
           'A CADA FORMA os quatro golpes dele são TROCADOS por versões mais fortes — quanto mais apanha, mais perigoso fica.' },
    fervor:{ nome:'Fé Inabalável', icone:'✝',
      desc:'Recebe 15% menos dano e é imune a CONFUSÃO — a cabeça dele não sai do lugar.' },
    estofado:{ nome:'Estofado', icone:'🛋',
      desc:'Recebe 10% menos dano, e ganha +3 de defesa a cada turno dele (acumula até +18) — quanto mais '+
           'tempo em campo, mais difícil de derrubar.' },
    furia_nunchaco:{ nome:'Fúria de Nunchaco', icone:'🥋',
      desc:'TODO golpe que ela acerta (qualquer um, não só a ultimate) tem 18% de chance de ATORDOAR o alvo.' },
    ladrao_de_tempo:{ nome:'Ladrão de Tempo', icone:'⏱',
      desc:'No fim de cada turno dele, 35% de chance de adiantar em 1 turno a recarga de UMA skill sua '+
           'sorteada entre as que ainda estão recarregando.' },
    sucata:{ nome:'Produção em Massa', icone:'🤖',
      desc:'Robô de patrulha comum — sem chip de combate avançado, sem bônus especial.' },
    duas_almas:{ nome:'Duas Almas', icone:'🧸',
      desc:'Dentro dela vivem a CRIANÇA e o DEMÔNIO. A ultimate troca entre os dois — e TODOS os golpes '+
           'trocam junto: Criança cura e protege o time, Demônio bate, confunde e invoca o Ursão.' },
    invocado:{ nome:'Invocado', icone:'🐻',
      desc:'Não nasceu no time: foi trazido pela Criança Rosa pro lugar de um aliado caído.' },
    furtividade:{ nome:'Furtividade', icone:'👤',
      desc:'Ganha 1 nível de FURTIVIDADE a cada turno dele (até 5): cada nível é +6% de chance de ESQUIVAR. '+
           'Tomar um golpe revela ele (perde 1 nível). Com 4 níveis ou mais ele fica MUITO furtivo e, igual o '+
           'Serrinha Dog, CONTRA-ATACA quem errar nele.' },
    sobras_lasanha:{ nome:'Sobras de Lasanha', icone:'🍝',
      desc:'Sempre sobra lasanha: no fim de cada turno dele, o aliado MAIS FERIDO (pode ser ele mesmo) come '+
           'um pedaço e recupera 5 de vida.' },
    soldado_raso:{ nome:'Soldado Raso', icone:'🪖',
      desc:'Smerg comum do exército da rainha Smergula — sem bônus especial. O perigo é que existem centenas dele.' },
    reservatorio:{ nome:'Reservatório', icone:'💧',
      desc:'Ele luta com a ÁGUA que carrega (começa com 100). Quanto mais cheio o estoque, mais forte o golpe: '+
           'tanque cheio bate ×1,6, tanque seco ×0,6. Todo golpe gasta um pouco de água e só a CORRENTEZA enche de volta.' },
    maldicao_verme:{ nome:'Maldição do Verme', icone:'🪱',
      desc:'Quando ele cai (até pagando com a própria vida), se a partida ainda não tiver acabado, ele VOLTA no '+
           'começo da rodada seguinte como VERME: 96 de vida e os golpes viram VENENO (toca, cusparada, lodo e '+
           'mordida). Acontece só uma vez por partida.' },
    condutor:{ nome:'Condutor', icone:'⚡',
      desc:'TODO golpe que ele acerta (qualquer um, não só a ultimate) tem 8% de chance de ATORDOAR o alvo.' },
    cardapio:{ nome:'Cardápio de Limeira', icone:'🍽',
      desc:'Começa no modo COXINHA. A ult gira na ordem 🍗 coxinha → 🍕 pizza → 🍔 hambúrguer → coxinha… e cada modo '+
           'troca os golpes dele: COXINHA = defesa (+6 de defesa, recebe 20% menos dano), PIZZA = velocidade '+
           '(+6 de velocidade, +15% de esquiva), HAMBÚRGUER = ataque (+25% de dano).' },
    cara_de_pau:{ nome:'Cara de Pau', icone:'🃏',
      desc:'+10% de chance de esquivar. Quem ERRA um golpe nela não entende o que aconteceu e fica CONFUSO '+
           'no próximo turno.' },
    desintegracao:{ nome:'Desintegração', icone:'🌀',
      desc:'Todo golpe dele que pega DESMANCHA 1 de defesa do alvo PRA SEMPRE (até −6 em cada inimigo). '+
           'Quanto mais a luta dura, mais mole o time inimigo fica.' }
  };

  /* ---------- GOLPES DE SETUP COMPARTILHADOS ----------
     Não tem problema personagem repetir golpe: quem muda é o dono.
     · lentidao.pct = porcentagem da velocidade ATUAL do alvo
       (10% de quem tem 20 dói mais que 10% de quem tem 7)
     · estrutura    = objeto que fica no campo protegendo um time   */
  function smergulite(){
    /* cd IGUAL à duração de propósito: como cada aplicação nova empilha
       (ver `lentidao` no motor), deixar o cd menor que a duração dava
       pra manter 2 doses ativas o tempo todo — num personagem que já é
       rápido (Strong Smerg, Serrinha Dog) isso virava "sempre age
       primeiro, sempre", o maior fator por trás deles dominando o
       teste simulado mesmo depois de vários nerfs de dano. */
    return { nome:'Smergulite Aguda', pose:'smergulite', tipo:'gelo', icone:'🦠', alvo:'todos_inimigos', cd:5, dano:0, setup:true,
             lentidao:{ pct:0.08, turnos:5 },
             desc:'Espalha a doença no time inimigo: TODOS ficam 8% mais lentos por 5 turnos. '+
                  'Doses novas ACUMULAM — dois turnos de smergulite e o inimigo age depois de todo mundo.' };
  }

  /* VÉU MALDITO — ultimate da Smergula E do Careca (a maldição que virou
     ele verme é dela). Função que devolve uma cópia, igual smergulite():
     a Smergula pendura por cima o formaOverride do ABISMO (forma demônio);
     o Careca usa a versão base nas duas formas. */
  function veuMaldito(){
    return { nome:'VÉU MALDITO', pose:'veu', tipo:'maldito', icone:'🕸', alvo:'eu', cd:5, dano:0, super:true, setup:true,
      ambiente:{ nome:'Véu Maldito', icone:'🕸', turnos:4, cor:'#7a3fb0', particula:'mancha',
                 dotMult:1.35, dotTurnosExtra:1, magiaMult:1.15, confusaoExtra:1 },
      desc:'Cobre a arena de um véu preto. Enquanto durar, veneno, sangramento e queimadura dão +35% e duram '+
           '1 turno a mais, TODA magia dá +15% e a confusão dura 1 turno a mais. Ambiente é global: vale para os dois times.' };
  }

  /* ---------- FICHAS ----------
     alvo: 'inimigo' | 'todos_inimigos' | 'eu' | 'aliados'
     cd:   turnos de recarga (0 = sempre disponível)          */
  const FICHAS = {
    fat_smerg:{
      hp:168, atk:20, def:13, spd:7, passiva:'fortaleza',
      skills:[
        /* TAUNT: obriga o alvo a bater só nele por 2 turnos e ergue a
           guarda no mesmo golpe — é o gancho que fecha a build de tanque:
           provoca, aguenta com Fortaleza + Postura de Rocha, e devolve
           tudo isso como dano no COLAPSO (ver escalaDefesa ali embaixo). */
        { nome:'Provocar Fúria', pose:'provocar', tipo:'fisico', icone:'😤', alvo:'inimigo', cd:3, dano:9,
          provoca:{ turnos:2 }, buffEu:{ tipo:'blindagem', valor:6, turnos:3 },
          desc:'Berra e acerta um soco: o alvo fica PROVOCADO (só ataca ele por 2 turnos) e ele ergue '+
               'a guarda (+6 de defesa por 3 turnos).' },
        { nome:'Terremoto', pose:'terremoto', tipo:'terra', icone:'🌋', alvo:'todos_inimigos', cd:3, dano:10,
          terreno:{ nome:'Chão Instável', turnos:3, dano:7 },
          desc:'Racha o chão: dano em todos e o TERRENO fere o time inimigo por 3 turnos.' },
        { nome:'Postura de Rocha', pose:'rocha', tipo:'fisico', icone:'🪨', alvo:'eu', cd:4, dano:0,
          buff:{ tipo:'blindagem', valor:6, porTurno:true, turnos:4 },
          desc:'Cresce +6 de defesa por turno enquanto durar.' },
        { nome:'COLAPSO', pose:'colapso', tipo:'explosivo', icone:'💥', alvo:'todos_inimigos', cd:5, dano:15, super:true,
          escalaDefesa:0.419,
          desc:'Salto e impacto colossal no time inteiro. Quanto mais defesa ele empilhou (guarda + Postura '+
               'de Rocha), mais forte o impacto — o soco devolve tudo que ele aguentou.' },
        smergulite() ]
    },

    strong_smerg:{
      hp:183, atk:27, def:11, spd:12, passiva:'agilidade_crescente',
      skills:[
        { nome:'Jab Duplo', pose:'jab', tipo:'fisico', icone:'👊', alvo:'inimigo', cd:0, dano:11, vezes:2,
          desc:'Dois golpes rápidos no mesmo alvo.' },
        { nome:'Descarga', pose:'descarga', tipo:'eletrico', icone:'⚡', alvo:'inimigo', cd:3, dano:23, atordoar:0.30,
          desc:'30% de chance de ATORDOAR (o alvo perde o próximo turno).' },
        { nome:'Foco Veloz', pose:'focoVeloz', tipo:'fisico', icone:'💨', alvo:'eu', cd:6, dano:0,
          buff:{ tipo:'agilidade', valor:3, porTurno:true, turnos:3 },
          desc:'Acelera ainda mais: +3 de velocidade por turno, por 3 turnos.' },
        { nome:'RAJADA DE FÚRIA', pose:'rajada', tipo:'fisico', icone:'🌀', alvo:'inimigo', cd:6, dano:10, vezes:4, super:true,
          escalaVelocidade:true,
          desc:'Quatro golpes. Cada ponto de velocidade acumulada aumenta o dano.' },
        smergulite() ]
    },

    /* ⚖️ Como foi medido o ajuste do sangramento nela.
       Sangramento passou a IGNORAR defesa (ver calcularDano) — ela é a
       única do elenco cujo golpe BÁSICO (Mordida, sem recarga) usa esse
       tipo, então ela sentiu a mudança em TODO turno da partida.
       Comparei 2000 batalhas simuladas ANTES e DEPOIS da mudança
       (motor sem interface, mesma IA nos dois lados — método de sempre):
         · original (atk 24, Mordida 20 de dano):    61,6% de vitória
           — já acima do teto de 60%, mas isso é PRÉ-EXISTENTE, não
           criado por este ajuste.
         · só recalibrando Mordida pelo fator simples (20→14, ×0,7,
           igual ao Corte Espectral da Smergula) e um corte parcial de
           ataque (24→21): 65,0% — PIOROU, porque o ganho de "não ser
           mais barrado pela defesa do alvo" se repete em TODO turno
           (Mordida não tem recarga) e um corte pensado pra golpe de
           recarga alta não é fundo o suficiente aqui.
         · atk 24→18: 57,2% — fundo demais.
         · atk 24→20 (o valor final): 59,0% — mais perto do original
           (61,6%) do que qualquer outro ponto testado, e abaixo do
           teto. Cortar o ATAQUE (não só o número da Mordida) foi o que
           respondeu de forma mensurável: ele reduz TODO o kit de uma
           vez (Mordida, Rolamento, Presas Tóxicas), refletindo que o
           kit INTEIRO ficou mais forte, não uma skill isolada.        */
    serrinha_dog:{
      hp:181, atk:20, def:11, spd:13, passiva:'instinto',
      skills:[
        { nome:'Mordida', pose:'mordida', tipo:'sangramento', icone:'🩸', alvo:'inimigo', cd:0, dano:8,
          dot:{ tipo:'sangramento', dano:6, turnos:3 },
          desc:'Sangramento por 3 turnos — dói mais quanto menos vida o alvo tiver. IGNORA a defesa do alvo.' },
        { nome:'Rolamento', pose:'rolamento', tipo:'fisico', icone:'🔄', alvo:'todos_inimigos', cd:2, dano:12,
          desc:'Rola pelo campo acertando o time inteiro.' },
        { nome:'Presas Tóxicas', pose:'presas', tipo:'veneno', icone:'☠', alvo:'inimigo', cd:3, dano:12,
          dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:4 },
          desc:'Veneno por 4 turnos que IGNORA a defesa do alvo.' },
        { nome:'FÚRIA CANINA', pose:'furia', tipo:'sombrio', icone:'🌑', alvo:'inimigo', cd:5, dano:18, super:true,
          /* buffEu, NÃO buff: `buff` vai para os ALVOS da skill — como ela
             mira um inimigo, a força estava indo pro INIMIGO (bug achado na
             1.26). buffEu é o campo de "buff em quem usou mirando inimigo". */
          drena:0.35, buffEu:{ tipo:'forca', valor:5, porTurno:true, turnos:3 },
          desc:'Drena 35% do dano como vida e ganha +5 de força por turno, por 3 turnos.' },
        smergulite() ]
    },

    fat_mango:{
      hp:166, atk:21, def:12, spd:8, passiva:'padaria',
      skills:[
        { nome:'Pancada de Pão', pose:'pao', tipo:'fisico', icone:'🥖', alvo:'inimigo', cd:0, dano:21, drena:0.15,
          desc:'Bate com o pão dormido e se cura com 15% do dano.' },
        { nome:'Croissant Bumerangue', pose:'croissant', estiloAnim:'tiro', tipo:'fisico', icone:'🥐', alvo:'todos_inimigos', cd:2, dano:16,
          desc:'O croissant vai, volta e acerta o time todo.' },
        { nome:'Forno Aceso', pose:'forno', tipo:'fogo', icone:'🔥', alvo:'todos_inimigos', cd:3, dano:14,
          dot:{ tipo:'queimadura', dano:7, turnos:3 },
          desc:'QUEIMA o time inimigo por 3 turnos.' },
        /* ele já cura sozinho pela passiva Padaria Ambulante — BANQUETE e
           CORSA eram um SEGUNDO e TERCEIRO sistema de sustento em cima
           disso. Cortado bem mais fundo que os outros ajustes daqui. */
        { nome:'BANQUETE', pose:'banquete', tipo:'fisico', icone:'🍞', alvo:'aliados', cd:5, dano:0, super:true,
          cura:17, buff:{ tipo:'regeneracao', valor:2, turnos:3 },
          desc:'Cura 17 no time e dá regeneração de 2 por turno.' },
        { nome:'CORSA BLINDADO', pose:'car', tipo:'fisico', icone:'🚗', alvo:'aliados', cd:5, dano:0, setup:true,
          estrutura:{ nome:'Corsa Blindado', icone:'🚗', turnos:4, defesa:4, visual:'carro' },
          desc:'Estaciona o Corsa na frente do time e abre a porta: +4 de DEFESA para todos os aliados '+
               'enquanto o carro aguentar. Só um carro por time — estacionar de novo renova os turnos.' } ]
    },

    mecas:{
      hp:169, atk:24, def:11, spd:10, passiva:'protocolo_ciborgue',
      formas:[0.50, 0.30],
      formaNomes:['Humano','Quase-Ciborgue','CIBORGUE 5000Z'],
      /* SEM isso, o motor aplica por baixo dos panos o multiplicador
         padrão [1, 1.20, 1.40] (calcularDano) POR CIMA dos números já
         turbinados do formaOverride abaixo — dobrando o ganho de cada
         forma. Os formaOverride JÁ SÃO o balanceamento por forma, então
         aqui fica neutro (1,1,1): só um bônus, não dois empilhados. */
      formaMult:[1, 1, 1],
      /* Os QUATRO golpes trocam de versão conforme a forma sobe.
         formaOverride[forma] é mesclado por cima do golpe base, então
         nome, dano, tipo e descrição mudam junto — o jogador VÊ o
         upgrade no botão, não só sente no dano.                      */
      skills:[
        { nome:'Combo Cibernético', pose:'combo', tipo:'fisico', icone:'🦾', alvo:'inimigo', cd:0, dano:13, vezes:2,
          desc:'Dois socos secos com o braço reforçado.',
          formaOverride:{
            1:{ nome:'Combo Hidráulico', icone:'🦿', dano:16,
                desc:'QUASE-CIBORGUE: os pistões entram no soco — mais peso em cada golpe.' },
            2:{ nome:'PUNHOS 5000Z', icone:'🥊', tipo:'energia', dano:16, vezes:3,
                desc:'CIBORGUE: TRÊS socos movidos a energia que perfuram a defesa.' } } },

        { nome:'Arsenal', pose:'arsenal', tipo:'explosivo', icone:'💣', alvo:'todos_inimigos', cd:3, dano:16,
          desc:'Joga uma granada no time inimigo.',
          formaOverride:{
            1:{ nome:'Arsenal Duplo', icone:'💣', dano:20,
                desc:'QUASE-CIBORGUE: o lançador do braço cospe duas granadas de uma vez.' },
            2:{ nome:'RIFLE DE PULSO', tipo:'energia', dano:24, alvo:'inimigo', icone:'🔫',
                desc:'CIBORGUE: saca o rifle e ATIRA num alvo só — perfura a defesa.' } } },

        { nome:'Criogenia', pose:'crio', tipo:'gelo', icone:'❄', alvo:'inimigo', cd:3, dano:16,
          lentidao:{ valor:5, turnos:3 },
          desc:'Congela o alvo: -5 de velocidade por 3 turnos (atrasa o turno dele).',
          formaOverride:{
            1:{ nome:'Criogenia Mk-II', dano:20, lentidao:{ valor:7, turnos:3 },
                desc:'QUASE-CIBORGUE: jato mais frio — -7 de velocidade por 3 turnos.' },
            2:{ nome:'NITROGÊNIO LÍQUIDO', icone:'🧊', dano:23, lentidao:{ valor:9, turnos:4 }, atordoar:0.15,
                desc:'CIBORGUE: despeja nitrogênio — -9 de velocidade por 4 turnos e 15% de ATORDOAR.' } } },

        { nome:'PROTOCOLO 5000Z', pose:'protocolo', tipo:'energia', icone:'⚡', alvo:'todos_inimigos', cd:5, dano:31, super:true,
          desc:'Descarga de energia que PERFURA a defesa do time inteiro.',
          formaOverride:{
            1:{ nome:'CANHÃO DE PLASMA', icone:'🌟', dano:38,
                desc:'QUASE-CIBORGUE: o braço vira canhão e varre o time inimigo.' },
            2:{ nome:'PROTOCOLO 5000Z — TOTAL', icone:'☢', dano:32, atordoar:0.15,
                desc:'CIBORGUE: libera o núcleo. Dano máximo em área e 15% de ATORDOAR cada alvo.' } } } ]
    },

    /* =================== ROBÔ DE PATRULHA (MODO HISTÓRIA) ===================
       Inimigo roteirizado do Capítulo 1 — Fase 1 (js/historia.js): robô
       de fábrica comum, bem mais fraco que o Mecas ciborgue que o
       jogador controla naquela luta. Sem passiva de verdade, sem
       ultimate — só um kit básico de 3 golpes pra dar volume na cena
       (o time inimigo entra com 3 cópias deste id). Não é balanceado
       pelo simulador como o resto do elenco: é um encontro de história,
       feito de propósito mais fraco que o jogador. */
    mecas_grunt:{
      hp:110, atk:10, def:4, spd:6, passiva:'sucata',
      skills:[
        { nome:'Soco de Sucata', tipo:'fisico', icone:'🤖', alvo:'inimigo', cd:0, dano:9,
          desc:'Um soco desajeitado, sem a mira de um ciborgue de verdade.' },
        { nome:'Investida Enferrujada', tipo:'fisico', icone:'⚙', alvo:'inimigo', cd:2, dano:13,
          desc:'Avança com o peso todo — dói mais, mas demora pra recarregar.' },
        { nome:'Alarme de Curto-Circuito', tipo:'eletrico', icone:'🔌', alvo:'inimigo', cd:4, dano:11, atordoar:0.12,
          desc:'Solta uma descarga elétrica de pane: 12% de chance de ATORDOAR.' } ]
    },

    /* ========================= CABELIN =========================
       SUPORTE da Ilha, o maior fã de lasanha do mundo. Cura o time com
       lasanha e a ULT ergue a MURALHA DE LASANHA: ele PAGA 30 da própria
       vida e a muralha nasce com 50 — enquanto ela estiver de pé, TODO
       golpe de dano do time inimigo acerta a muralha em vez de um
       personagem (área acerta ela UMA vez; status do golpe — veneno,
       lentidão, atordoar — fica preso na lasanha). Ver `barreira` e
       `custoVida` no motor (js/turnbattle.js). */
    cabelin:{
      /* ⚖ 1.26: primeira versão (180/18/11, Fatia 20, cura 36, passiva 7) media 80,6% de vitória —
         cada parte do kit valia 8–13 pontos sozinha (passiva 13, cura 11,
         muralha 8). Cortado o kit todo MENOS a muralha (30/50 é pedido do
         dono do jogo): 52,6% em 4000 batalhas com ele sempre em campo. */
      hp:173, atk:15, def:10, spd:10, passiva:'sobras_lasanha', sobras:5,
      skills:[
        { nome:'Fatia Voadora', pose:'fatia', tipo:'lasanha', icone:'🍕', alvo:'inimigo', cd:0, dano:24,
          estiloAnim:'tiro',
          fx:{ folha:'assets/cabelin/cabelin_lasanha.png', modo:'projetil', quadros:[[2,2]], alt:30 },
          desc:'Arremessa uma fatia de lasanha pelando na cara do inimigo. Sem recarga.' },

        { nome:'Lasanha Quentinha', pose:'quentinha', tipo:'lasanha', icone:'🍝', alvo:'aliado', cd:2, dano:0,
          cura:35, buff:{ tipo:'blindagem', valor:3, turnos:2 }, estiloAnim:'tiro',
          desc:'Entrega uma lasanha saindo do forno pra UM aliado: cura 35 e as camadas de massa dão +3 de '+
               'defesa por 2 turnos.' },

        { nome:'Queijo Derretido', pose:'queijo', tipo:'lasanha', icone:'🧀', alvo:'inimigo', cd:3, dano:19,
          lentidao:{ valor:3, turnos:2 }, estiloAnim:'tiro',
          desc:'Uma espiral de queijo derretido gruda no alvo: dano e -3 de velocidade por 2 turnos.' },

        { nome:'Molho Fervendo', pose:'molho', tipo:'fogo', icone:'🍅', alvo:'todos_inimigos', cd:3, dano:14,
          dot:{ tipo:'queimadura', dano:4, turnos:3 }, estiloAnim:'tiro',
          desc:'Uma onda de molho de tomate fervendo varre o time inimigo e QUEIMA todo mundo por 3 turnos.' },

        { nome:'MURALHA DE LASANHA', pose:'muralha', tipo:'lasanha', icone:'🧱', alvo:'eu', cd:5, dano:0,
          super:true, setup:true, estiloAnim:'foco', custoVida:30,
          barreira:{ nome:'Muralha de Lasanha', hp:50, icone:'🍝' },
          desc:'Gasta 30 da PRÓPRIA vida pra levantar uma muralha de lasanha (50 de vida) na frente do time. '+
               'Enquanto ela estiver de pé, TODO golpe do time inimigo é obrigado a acertar a muralha — até '+
               'ela quebrar. Golpe em área acerta a muralha uma vez só.' } ]
    },

    /* ======================== SMERGULÃO ========================
       FURTIVO, líder da Ilha das Ruínas (com a parceira, a Criança Rosa).
       Era um smerg grande, expulso do Smergulus Kingdom por crimes que
       ninguém tem coragem de dizer. Kit inteiro gira em ESQUIVAR:
       · passiva Furtividade (níveis → esquiva; 4+ contra-ataca)
       · Golpe Traiçoeiro: bate mais se ele desviou do último golpe
       · Passo nas Sombras (o golpe "meio termo"): bate e liga o MODO
         FURTIVO (forma 1, outra folha): metade do dano, +15% de esquiva
       · Moita: se esconde, esquiva enorme até o próximo turno dele
       · ULT Fumaça Colorida: SETUP, fumaça no lado do time dele que dá
         esquiva pra todo mundo ali
       Ver chanceEsquiva/contraAtaca/`fumacas` em js/turnbattle.js. */
    smergulao:{
      /* ⚖ 1.27: 1ª versão (170/22/9/12, golpes 16/22, modo 3 turnos, fumaça 20%) media 22,8% —
         dois dos quatro golpes não tiram vida e o modo furtivo corta o dano pela
         metade, então o dano que sobra precisa ser alto. 52,3% em 3000 batalhas. */
      /* ⚖ 1.28: stats trazidos pra perto do elenco (190/30/11/13 → 175/22/9/12 —
         defesa abaixo da média de propósito: ele se protege ESQUIVANDO) e a força
         nos golpes 28/34 → 34/42: 49,9% (6000 batalhas). */
      hp:173, atk:22, def:9, spd:12, passiva:'furtividade',
      formaNomes:['Normal','MODO FURTIVO'], formaIcone:'👤',
      skills:[
        { nome:'Golpe Traiçoeiro', pose:'traicoeiro', tipo:'fisico', icone:'🗡', alvo:'inimigo', cd:0, dano:37,
          bonusEsquiva:1.8,
          desc:'Ataque básico. Se ele ESQUIVOU do último golpe inimigo, aproveita a brecha e bate ×1,8.' },

        { nome:'Passo nas Sombras', pose:'sombras', tipo:'fisico', icone:'👤', alvo:'inimigo', cd:3, dano:46,
          modoFurtivo:2,
          desc:'Acerta o alvo e some: entra no MODO FURTIVO por 2 turnos — os golpes seguintes saem pela '+
               'METADE, mas ele fica bem mais difícil de acertar (+15% de esquiva).' },

        { nome:'Moita', pose:'moita', tipo:'fisico', icone:'🌿', alvo:'eu', cd:3, dano:0, moita:true,
          desc:'Se enfia numa moita: +35% de chance de esquivar até o próximo turno dele.' },

        { nome:'FUMAÇA COLORIDA', pose:'fumaca', tipo:'charme', icone:'🌈', alvo:'aliados', cd:5, dano:0,
          super:true, setup:true, estiloAnim:'foco',
          fumaca:{ nome:'Fumaça Colorida', icone:'🌈', turnos:3, esquiva:0.25 },
          desc:'Joga uma bomba de fumaça colorida no lado do time dele: por 3 rodadas, TODO MUNDO do time dele '+
               'ganha +25% de chance de esquivar (somado com a furtividade dele).' } ]
    },

    /* ===================== CRIANÇA ROSA =====================
       Parceira do Smergulão na Ilha das Ruínas. Foi MORTA pela rainha
       Smergula como vingança pelo crime do Smergulão — e voltou com
       poderes de demônio. DUAS FORMAS (forma 0 Criança / 1 Demônio): a
       ULT (`alternaForma`) troca entre elas e cada slot tem a versão da
       outra forma no `formaOverride` — por isso os overrides ZERAM o que
       não usam (cura, curaAliado, ambiente...), senão o campo da versão
       Criança vazaria pra versão Demônio no Object.assign.
       Invocar o Ursão: `soForma:1` + precisa de aliado caído (ver
       condicaoSkill/aliadoCaido e `invocar` no motor). */
    crianca_rosa:{
      /* ⚖ 1.29: 1ª versão (165/20, golpes 16/26/34/10/24) media 31,4%. Stats perto da mediana do
         elenco e a força nos golpes + Ursão batendo mais forte: 48,8% (6000 batalhas). */
      hp:175, atk:21, def:10, spd:11, passiva:'duas_almas',
      formaNomes:['Criança','DEMÔNIO'], formaIcone:'👹',
      skills:[
        { nome:'Ursinho Arremessado', pose:'ursinho', tipo:'fisico', icone:'🧸', alvo:'inimigo', cd:0, dano:32,
          curaAliado:14, estiloAnim:'tiro',
          desc:'Gira e arremessa o ursinho no inimigo — e o ursinho volta cuidando: cura 14 no aliado mais ferido.',
          formaOverride:{ 1:{ nome:'Garra Sombria', icone:'🐾', tipo:'sombrio', dano:50, curaAliado:0,
            estiloAnim:'corpo', pose:'garra',
            fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[1,0],[1,1]], alt:58 },
            desc:'DEMÔNIO: o ursinho vira sombra e rasga o alvo com garras.' } } },

        { nome:'Abraço Curativo', pose:'abraco', tipo:'charme', icone:'🤗', alvo:'aliado', cd:2, dano:0, cura:39,
          estiloAnim:'tiro',
          desc:'Corre e abraça UM aliado junto com o ursinho: cura 39.',
          formaOverride:{ 1:{ nome:'Pesadelo', icone:'😱', tipo:'maldito', alvo:'todos_inimigos', cd:4, dano:19, cura:0,
            confusao:{ turnos:2 }, estiloAnim:'tiro', pose:'pesadelo',
            fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[0,0],[3,0]], alt:62 },
            desc:'DEMÔNIO: solta o vulto de olhos vermelhos no time inimigo — todo mundo fica CONFUSO por 2 turnos.' } } },

        { nome:'Cantiga de Ninar', pose:'cantiga', tipo:'charme', icone:'🎵', alvo:'aliados', cd:5, dano:0, cura:14,
          ambiente:{ nome:'Cantiga de Ninar', icone:'🎵', turnos:3, curaMult:1.3, regen:4, cor:'#ffb3d9' },
          estiloAnim:'foco',
          desc:'Canta abraçada no ursinho: cura 14 no time na hora e vira AMBIENTE por 3 turnos — toda cura vale '+
               '+30% e todo mundo recupera 4 por rodada. O ambiente é global (vale pros dois times).',
          formaOverride:{ 1:{ nome:'Bola de Fogo Demoníaca', icone:'🔥', tipo:'fogo', alvo:'inimigo', cd:3, dano:46,
            cura:0, ambiente:null, dot:{ tipo:'queimadura', dano:6, turnos:3 }, estiloAnim:'tiro', pose:'fogo',
            fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'projetil', quadros:[[4,3]], alt:36 },
            desc:'DEMÔNIO: cospe uma bola de fogo do abismo — QUEIMA o alvo por 3 turnos.' } } },

        { nome:'Invocar o Ursão', pose:'invocar', tipo:'sombrio', icone:'🐻', alvo:'eu', cd:5, dano:0,
          soForma:1, invocar:{ id:'ursao', custoPct:0.25 }, estiloAnim:'foco',
          desc:'Só no modo DEMÔNIO e só com um aliado CAÍDO: dá 25% da própria vida pro ursinho e ele volta '+
               'como o URSÃO (100 de vida, dano alto) no lugar do aliado que caiu.' },

        { nome:'DESPERTAR DEMÔNIO', pose:'despertar', tipo:'maldito', icone:'👹', alvo:'eu', cd:2, dano:0,
          super:true, alternaForma:true, estiloAnim:'foco',
          desc:'Deixa o demônio sair: vira o modo DEMÔNIO e todos os golpes viram golpes de dano.',
          formaOverride:{ 1:{ nome:'VOLTAR A SER CRIANÇA', icone:'🧸', tipo:'charme', pose:'acalmar',
            desc:'Abraça o ursinho e acalma o demônio: volta pro modo CRIANÇA e os golpes voltam a curar.' } } } ]
    },

    /* URSÃO — a INVOCAÇÃO da Criança Rosa. Não é escolhível (`invocacao`
       no characters.js): só entra em campo pelo Invocar o Ursão. 100 de
       vida (pedido do dono do jogo) e golpes que doem de verdade. */
    ursao:{
      hp:100, atk:28, def:10, spd:11, passiva:'invocado',
      skills:[
        { nome:'Patada Demoníaca', pose:'patada', tipo:'fisico', icone:'🐾', alvo:'inimigo', cd:0, dano:38,
          fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[1,2]], alt:62 },
          desc:'Uma patada com a boca do abismo junto.' },
        { nome:'Investida Selvagem', pose:'investida', tipo:'fisico', icone:'🐻', alvo:'inimigo', cd:3, dano:50,
          atordoar:0.20,
          fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[5,0]], alt:60 },
          desc:'Corre de quatro e atropela: dano alto e 20% de chance de ATORDOAR.' },
        { nome:'Rugido do Abismo', pose:'rugido', tipo:'sombrio', icone:'🔥', alvo:'todos_inimigos', cd:4, dano:22,
          estiloAnim:'tiro',
          fx:{ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[4,0]], alt:52 },
          desc:'Ruge e espinhos de sombra saem do chão debaixo do time inimigo inteiro.' } ]
    },

    /* =================== SOLDADO SMERG (MODO HISTÓRIA) ===================
       Inimigo roteirizado do Capítulo 2 — Smergulus Kingdom (js/historia.js).
       Mesmo espírito do robô de patrulha: kit básico de 3 golpes, sem
       ultimate, fraco de propósito — quem vira Recruta, Lanceiro, Capitão
       ou Guarda Real é o `ajustes` da fase (vida/ataque/nome), não o kit.
       A bola que ele arremessa na folha virou a Bola de Smergulite: a
       mesma doença do kit dos smergs jogáveis, só que numa dose pequena. */
    smerg_normal:{
      hp:115, atk:11, def:4, spd:7, passiva:'soldado_raso',
      skills:[
        { nome:'Soco de Quartel', tipo:'fisico', icone:'👊', alvo:'inimigo', cd:0, dano:9, pose:'punch',
          desc:'O soco que todo recruta aprende no primeiro dia.' },
        { nome:'Chute de Recruta', tipo:'fisico', icone:'🦶', alvo:'inimigo', cd:2, dano:13, pose:'kick',
          desc:'Chute alto, com o peso todo — dói mais, mas demora pra recarregar.' },
        { nome:'Bola de Smergulite', tipo:'gelo', icone:'🦠', alvo:'inimigo', cd:3, dano:10, pose:'ranged',
          lentidao:{ valor:2, turnos:2 },
          desc:'Arremessa uma bola contaminada: -2 de velocidade por 2 turnos.' } ]
    },

    /* ===================== LOIRINHA DA CDI =====================
       SUPORTE. Bate pouco de propósito: o valor dela é manter o time
       de pé. Rápida (age cedo, cura antes do golpe chegar) e frágil.  */
    loirinha_cdi:{
      hp:177, atk:20, def:11, spd:12, passiva:'carisma',
      skills:[
        { nome:'Tapa', pose:'tapa', tipo:'fisico', icone:'✋', alvo:'inimigo', cd:0, dano:28, atordoar:0.15,
          desc:'Tapa na cara, de mão aberta. 15% de chance de ATORDOAR de tanta vergonha.' },

        { nome:'Bolsada', pose:'bolsada', tipo:'fisico', icone:'👜', alvo:'inimigo', cd:2, dano:32, estiloAnim:'tiro',
          desc:'Arremessa a bolsa (cheia) na cara do inimigo. Dói mais que parece.' },

        { nome:'Beijo Curativo', pose:'beijo', tipo:'charme', icone:'💋', alvo:'aliado', cd:3, dano:0,
          cura:49,
          desc:'Manda um beijo para UM aliado escolhido e cura 49 de vida nele. '+
               'Pela passiva Carisma, ela ainda recupera 45% do que curou.' },

        /* o ambiente em si continua GLOBAL de propósito (também ajuda o
           inimigo, é a natureza do golpe) — mas agora o cast em si já
           cura o time na hora, então usar nunca é prejuízo na certa
           mesmo que o inimigo tenha mais cura pra aproveitar depois. */
        { nome:'AMBIENTE: CHARME', pose:'charme', tipo:'charme', icone:'💗', alvo:'aliados', cd:5, dano:0, super:true,
          cura:16, ambiente:{ nome:'Charme', icone:'💗', turnos:4, curaMult:1.5, regen:3, cor:'#ff9ecb' },
          desc:'Cura 16 no time na hora e enche a arena de pétalas e corações: por 4 turnos, TODA cura no campo '+
               '(dos dois times) vale +50% e todo mundo recupera 3 de vida por rodada. O ambiente é global — '+
               'a vantagem é de quem tiver mais cura no time — mas a cura imediata é só sua.' } ]
    },

    /* ======================== SMERGULA ========================
       MAGA de desgaste. Não mata no golpe: mata no veneno, no
       sangramento e na confusão, tudo amplificado pelo ambiente dela.

       `almas` é o gatilho da transformação — diferente do Mecas, que
       vira ciborgue APANHANDO, ela vira demônio CAUSANDO dano:
         porDano  = almas ganhas por ponto de dano
         porGolpe = almas fixas por golpe que acerta
         limite   = quantas almas para virar demônio
       `formaMult` substitui a curva do Mecas para ela.               */
    smergula:{
      hp:167, atk:22, def:9, spd:11, passiva:'sugadora',
      almas:{ porDano:0.85, porGolpe:5, limite:115 },
      formaNomes:['Smergula','SMERGULA DEMÔNIO'],
      formaMult:[1, 1.20],
      formaGanhos:{ atk:4, def:1 },
      skills:[
        { nome:'Toque Sugador', pose:'toque', tipo:'sombrio', icone:'🖐', alvo:'inimigo', cd:0, dano:18, drena:0.20,
          desc:'Agarra o inimigo e puxa a alma pela mão. Rouba 20% do dano como vida.',
          formaOverride:{
            1:{ nome:'GARRA DA ALMA', tipo:'maldito', icone:'👹', dano:23, drena:0.35,
                desc:'DEMÔNIO: a garra arranca o naco inteiro — rouba 35% do dano como vida.' } } },

        { nome:'Praga Venenosa', pose:'praga', tipo:'veneno', icone:'☠', alvo:'inimigo', cd:2, dano:13,
          dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:4 }, estiloAnim:'tiro',
          desc:'Lança a praga: veneno de '+VENENO_TICK+' por 4 turnos que IGNORA a defesa.',
          formaOverride:{
            /* o dreno aqui é BAIXO de propósito: golpe de área cura uma
               vez POR ALVO, então 25% em três inimigos viraria cura de
               super a cada dois turnos. */
            1:{ nome:'PESTE NEGRA', icone:'🦠', alvo:'todos_inimigos', dano:12, drena:0.15, cd:3,
                dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:4 },
                desc:'DEMÔNIO: a praga vira epidemia — envenena o TIME inteiro ('+VENENO_TICK+' por 4 turnos) e ela bebe 15% do dano de cada um.' } } },

        /* dano direto recalibrado (×0,7) quando o sangramento passou a
           IGNORAR defesa — mesmo ajuste da Mordida da Serrinha Dog, ver
           o comentário lá. Corte Espectral 20→14, Rasgo Demoníaco 23→16. */
        { nome:'Corte Espectral', pose:'corte', tipo:'sangramento', icone:'🩸', alvo:'inimigo', cd:2, dano:12,
          dot:{ tipo:'sangramento', dano:7, turnos:3 }, estiloAnim:'tiro',
          desc:'Rasga com garras de sombra: sangramento de 7 por 3 turnos (dói mais quanto menos vida o alvo tiver). IGNORA a defesa do alvo.',
          formaOverride:{
            1:{ nome:'RASGO DEMONÍACO', icone:'🩸', dano:14, drena:0.30,
                dot:{ tipo:'sangramento', dano:11, turnos:4 },
                desc:'DEMÔNIO: rasgo profundo — sangramento de 11 por 4 turnos e rouba 30% do dano.' } } },

        { nome:'Miragem', pose:'miragem', tipo:'maldito', icone:'😵', alvo:'todos_inimigos', cd:3, dano:11,
          confusao:{ turnos:2 },
          desc:'Enche a cabeça do time inimigo de vulto. CONFUSO: 35% das vezes o golpe sai num alvo QUALQUER '+
               'do campo — às vezes no próprio companheiro.',
          formaOverride:{
            1:{ nome:'LOUCURA', icone:'🌀', dano:15, drena:0.15, cd:4, confusao:{ turnos:3 },
                desc:'DEMÔNIO: a miragem vira delírio — 3 turnos de confusão e ela ainda rouba 15% do dano de cada alvo.' } } },

        Object.assign(veuMaldito(), {
          formaOverride:{
            1:{ nome:'ABISMO', icone:'🕳',
                ambiente:{ nome:'Abismo', icone:'🕳', turnos:5, cor:'#4a1f70', particula:'mancha',
                           dotMult:1.5, dotTurnosExtra:1, magiaMult:1.25, confusaoExtra:1 },
                desc:'DEMÔNIO: o véu vira buraco. Veneno/sangue/queimadura +50% e +1 turno, TODA magia +25%, '+
                     'confusão +1 turno, por 5 rodadas.' } } }) ]
    },

    /* ========================= MAMELUCO =========================
       TANQUE de suporte: provoca o time inimigo INTEIRO pra cima dele
       (não só um, como o Fat Smerg) e acelera os aliados com o Astra.
       Defesa alta pra aguentar o foco dos três de uma vez.           */
    matheus_limeira2:{
      hp:179, atk:17, def:17, spd:6, passiva:'fortaleza',
      skills:[
        { nome:'Trombada de Astra', pose:'trombada', tipo:'fisico', icone:'🚗', alvo:'inimigo', cd:0, dano:23,
          desc:'Um encontrão com a lataria do Astra. Simples e direto.' },

        /* mesma ideia da "Provocar Fúria" do Fat Smerg, só que provoca
           o TIME INTEIRO em vez de um só — por isso a recarga é maior
           e a duração um pouco menor: é MUITO mais forte concentrar os
           três inimigos de uma vez do que só um. */
        { nome:'Provocação Geral', pose:'provocacao', tipo:'fisico', icone:'😤', alvo:'todos_inimigos', cd:5, dano:0,
          provoca:{ turnos:2 }, buffEu:{ tipo:'blindagem', valor:4, turnos:3 },
          desc:'Grita pro time inimigo INTEIRO vir pra cima dele (só atacam ele por 2 turnos) e ergue a guarda '+
               '(+4 de defesa por 3 turnos) pra aguentar o tranco.' },

        { nome:'Pisando Fundo', pose:'pisando', tipo:'fisico', icone:'🏎', alvo:'aliados', cd:3, dano:0, setup:true,
          buff:{ tipo:'agilidade', valor:4, turnos:3 },
          desc:'Acelera o Astra e dá carona pro time: +4 de velocidade para TODOS os aliados por 3 turnos.' },

        { nome:'ATROPELAMENTO', pose:'atropelamento', tipo:'fisico', icone:'💥', alvo:'todos_inimigos', cd:5, dano:18, super:true,
          escalaDefesa:0.241,
          desc:'Acelera e atropela o time inimigo inteiro. Quanto mais defesa ele empilhou (guarda + Provocação '+
               'Geral), mais forte o impacto — o Astra devolve tudo que ele aguentou.' } ]
    },

    /* ========================= LAMBANÇA =========================
       SUPORTE sem cura nenhuma: bufa o time, limpa sangramento/veneno
       de um aliado e a ULT sela por 3 turnos o ÚLTIMO golpe que o alvo
       usou (ver `desabilitar` no motor — mira em `alvo.ultimaSkill`,
       então só funciona depois que o alvo já agiu pelo menos uma vez).
       A sela ERA permanente ("resto da partida"): parecia justo na
       simulação (bot não sabe escolher o melhor alvo/momento), mas na
       mão de um jogador de verdade virava um corte definitivo e sem
       chance de resposta — daí ter virado temporária. */
    hans_lambanca:{
      hp:173, atk:22, def:14, spd:12, passiva:'fervor',
      skills:[
        { nome:'Golpe Consagrado', pose:'consagrado', estiloAnim:'corpo', tipo:'energia', icone:'✊', alvo:'inimigo', cd:0, dano:26,
          desc:'Soco carregado de fé — perfura um pouco da defesa do alvo.' },

        { nome:'Bênção do Alto', pose:'bencao', tipo:'energia', icone:'🙏', alvo:'aliados', cd:5, dano:0, setup:true,
          buff:{ tipo:'forca', valor:6, turnos:2 },
          desc:'Abençoa o time inteiro: +6 de ataque para TODOS os aliados por 2 turnos.' },

        /* sem cura nenhuma — só encerra os DOTs e ainda dá um respiro de
           defesa, pra usar valer o turno mesmo se o aliado não tiver
           nada pra limpar. */
        { nome:'Purificação', pose:'purificacao', tipo:'energia', icone:'✨', alvo:'aliado', cd:4, dano:0,
          limparDots:['sangramento','veneno'], buff:{ tipo:'blindagem', valor:6, turnos:2 },
          desc:'Remove sangramento e veneno de UM aliado escolhido e dá +6 de defesa nele por 2 turnos.' },

        /* ⚖️ Buff pedido pelo dono do jogo: a ultimate ganhou um SEGUNDO
           efeito, permanente — `removerAtaque` (ver turnbattle.js) zera o
           ATAQUE do alvo pra sempre, além do selo de 3 turnos que já
           existia. O selo tinha sido reduzido de "resto da partida" pra 3
           turnos por não ter contraparte nenhuma (ver o comentário do
           motor) — isso continua valendo pro SELO; o que muda agora é que
           a ultimate ganhou uma segunda punição, permanente, no ataque. */
        { nome:'Selo do Silêncio', pose:'selo', tipo:'energia', icone:'🔇', alvo:'inimigo', cd:6, dano:26, super:true,
          desabilitar:true, removerAtaque:true,
          desc:'Golpe de luz que sela o alvo: o ÚLTIMO golpe que ele usou fica SELADO por 3 turnos, '+
               'E o ATAQUE dele é apagado PRA SEMPRE — some pro resto da luta. '+
               'Sem golpe anterior (alvo que ainda não agiu), só o dano e a remoção de ataque valem.' } ]
    },

    /* ======================= ADULTO FELIZ =======================
       TANQUE puro, primeiro HUMANO de verdade do elenco. Ataque baixo
       de propósito — o dano dele sai do `escalaVida` embutido em cada
       golpe (ver calcularDano no motor): quanto mais vida ele AINDA
       TEM, mais forte o golpe sai. Não tem golpe de cura nem de status
       longo — o valor dele em campo é aguentar na frente, crescer de
       defesa sozinho (passiva Estofado) e, quando precisar, ROUBAR a
       ultimate de QUALQUER personagem (ver `roubar` no motor). */
    adulto_feliz:{
      /* ⚖️ Balanceamento medido: a primeira versão (atk14/spd6, escalaVida
         baixo) rodou a 19-25% de vitória em 150 batalhas simuladas — MUITO
         abaixo até do Mameluco (39%), o outro tanque provoca+escudo do
         elenco. Duas causas achadas: (1) `escalaVida` na VIDA ATUAL criava
         uma espiral — o tanque que mais apanha é o que menos bate, bem na
         hora que o time mais precisa dele — trocado para vida MÁXIMA
         (constante a partida inteira); (2) a passiva só crescia defesa aos
         poucos, sem nenhuma redução desde o turno 1 (todo tanque do elenco
         — Fat Smerg, Mameluco — tem Fortaleza, -25% flat IMEDIATO). Depois
         de reforçar as duas coisas E o ataque/velocidade (ele nunca subia
         de patamar de dano por ser sempre o mais lento a agir), foi para
         ~55% — dentro do teto de 60% pedido, sem ficar de novo o mais
         fraco do elenco. */
      hp:205, atk:21, def:15, spd:8, passiva:'estofado',
      skills:[
        { nome:'Tapa de Amor', pose:'tapaAmor', tipo:'fisico', icone:'✋', alvo:'inimigo', cd:0, dano:6,
          escalaVida:0.123,
          desc:'Um tapa carinhoso (mas didático). Sem recarga — e quanto maior ele for '+
               '(vida máxima), mais esse tapa dói.' },

        { nome:'Bombom Explosivo', pose:'bombom', tipo:'explosivo', icone:'🍬', alvo:'todos_inimigos', cd:3, dano:8,
          escalaVida:0.07, estiloAnim:'tiro',
          desc:'Joga uma bala doce (e nada inofensiva) no meio do time inimigo. O açúcar rende: '+
               'o dano cresce com o tamanho dele.' },

        /* mesmo gancho de tanque do Fat Smerg (provoca + ergue guarda),
           só que o abraço em si também escala com a vida — ele não é só
           utilidade, dói de verdade. */
        { nome:'Abraço de Urso', pose:'abraco', tipo:'fisico', icone:'🤗', alvo:'inimigo', cd:3, dano:5,
          escalaVida:0.088, provoca:{ turnos:2 }, buffEu:{ tipo:'blindagem', valor:8, turnos:3 },
          desc:'Aperta o alvo num abraço apertado demais: ele fica PROVOCADO (só ataca ele) por 2 '+
               'turnos, e o abraço também serve de escudo (+8 de defesa nele por 3 turnos).' },

        { nome:'Voadora da Alegria', pose:'voadora', tipo:'fisico', icone:'🦵', alvo:'inimigo', cd:3, dano:11,
          escalaVida:0.176,
          desc:'Um salto que ninguém espera de alguém do tamanho dele — o golpe mais pesado do kit, '+
               'e fica bem mais pesado quanto maior ele for.' },

        { nome:'BIZARRICE', tipo:'sombrio', icone:'🎭', alvo:'qualquer', cd:6, dano:0,
          super:true, setup:true, roubar:true, estiloAnim:'foco',
          desc:'Rouba a ultimate de QUALQUER personagem em campo — aliado ou inimigo, não importa — '+
               'e a deixa pronta pra ele usar no próprio card. Quem perdeu fica com a PRÓPRIA ultimate '+
               'travada em recarga total.' } ]
    },

    /* ========================= FAT GIRL =========================
       DPS puro: pouca vida, ataque alto, e os QUATRO golpes normais
       miram SEMPRE um único inimigo — nunca área, nem suporte, nem
       setup. A passiva (furia_nunchaco) dá chance de atordoar em
       QUALQUER golpe que acerte, então não precisa repetir `atordoar`
       em cada skill (ver o hook genérico em usarSkill no motor). A
       ULT (MEDITAÇÃO BRANCA) não é golpe, é POSTURA: não trava turno
       nenhum, ela pode escolher meditar em vez de atacar em qualquer
       turno, e cada meditação dobra o ataque atual até um teto — ver o
       campo `meditarStack` em usarSkill (js/turnbattle.js). */
    fat_girl:{
      /* ⚖ ESCALA — ela entrou no elenco fora da régua de todo mundo:
         def 53 (o resto vai de 9 a 15), atk 32 (o resto de 17 a 27),
         golpes de 32/44/58 (o resto de 6 a 29) e um buff de força de
         133 onde os outros dão 5-6.

         A DEFESA era, de longe, o pior dos quatro. Como o corte é
         100/(100+def*4), def 53 fazia ela levar 32% do dano cru,
         contra 66% de um def 13: a personagem de MENOS vida do jogo
         era, na prática, a mais dura do elenco — mais que os dois
         tanques, que têm Fortaleza. Medindo, a defesa sozinha era a
         personagem inteira: com o kit original completo (atk 32,
         golpes 32/44/58, buff 133) ela ia de 56% de vitória com
         def 53 para 17% com def 13. Nada do resto do kit importava.

         CANHÃO DE VIDRO DE VERDADE (ajuste atual): a menor vida do jogo
         (145, o resto vai de 164 a 200) e a MENOR defesa (8, o resto vai
         de 9 a 15) — ela é o corpo mais frágil do elenco em cima do
         maior dano por golpe, de longe. O ataque BASE continua na régua
         (27, empatado com o Strong Smerg); quem sai da régua é o `dano`
         das skills, e é ali que a troca acontece: sem NADA de área,
         cura, setup ou suporte, cada turno dela é um alvo só.

         O dano SATURA — vale saber antes de mexer de novo. Medindo com
         hp 145 / def 8 fixos: golpes em 28/36/44 dão 29,4% de vitória,
         em 40/52/64 dão 38,7%, em 46/60/74 dão 46,9%, em 50/65/80 dão
         46,6% (empatado). Passando de ~46/60/74 ela morre antes de
         gastar o dano a mais (é sempre o alvo prioritário da IA, por ter
         a menor vida) — número maior na tela deixa de virar poder.

         Só que esse teto de dano "seguro" (46/60/74/60, usado até a
         v1.14) ignorava a MEDITAÇÃO: um golpe daquele kit, no teto de
         ataque de então (180), acertava ~95 de dano JÁ DEPOIS da defesa
         do alvo — quase um character-kill num elenco de 145-200 de vida.
         O ajuste 1.15 (ver a nota na ultimate, mais abaixo) desceu o
         teto da meditação e os golpes JUNTOS: 46/60/74/60→40/52/64/52 e
         teto 180→140. O golpe no teto agora sai em ~78 pós-defesa
         (-18%), e simulando com a estratégia "medita 3x, depois ataca
         sempre" (o pior caso: um jogador forçando o combo até o fim),
         a taxa de vitória CAIU de 34,9% para 30,3% sem proteção do time
         — meditar até o fim deixou de compensar sozinho. */
      /* ⚖️ NERF pedido pelo dono do jogo (ainda não remedido com o
         simulador de 4000 batalhas — os números de vitória acima são de
         ANTES desta rodada, ficam valendo como referência histórica até
         alguém rodar de novo). Dois cortes:
         1. Ataque BASE 27→23 — ela estava empatada com o Strong Smerg no
            topo do elenco (17-27); a régua do dano dela já vem dos
            `dano` fixos de cada golpe (ver a nota ESCALA acima), então
            o atk base pesa pouco na conta — um corte aqui reduz o piso
            sem mexer no que faz ela ser canhão de vidro.
         2. Guarda da meditação (`buffEu`) 10→6 — ela já estava no TETO
            da faixa do resto do elenco (+6/+7/+8, ver comentário
            original logo abaixo); 6 alinha ela com a ponta BAIXA dessa
            faixa em vez da alta, deixando a janela de meditação mais
            arriscada de verdade. */
      hp:151, atk:23, def:8, spd:12, passiva:'furia_nunchaco',
      skills:[
        { nome:'Soco Rápido', pose:'socoRapido', tipo:'fisico', icone:'👊', alvo:'inimigo', cd:0, dano:50,
          desc:'Um soco seco, sem enrolação. Sem recarga.' },

        { nome:'Chute Giratório', pose:'giratorio', tipo:'fisico', icone:'🦵', alvo:'inimigo', cd:2, dano:65,
          desc:'Gira o corpo inteiro no chute — mais lento que o soco, mas dói mais.' },

        { nome:'Golpe de Quadril', pose:'quadril', tipo:'fisico', icone:'💥', alvo:'inimigo', cd:3, dano:80,
          desc:'Joga o peso do corpo todo num golpe só. O mais forte dos ataques normais dela.' },

        { nome:'Baba Branca', pose:'baba', tipo:'fisico', icone:'⚪', alvo:'inimigo', cd:2, dano:65, estiloAnim:'tiro',
          desc:'Cospe uma gosma branca e pesada na direção do alvo.' },

        /* A MEDITAÇÃO não trava turno, é POSTURA (campo `meditarStack`,
           ver usarSkill): ela joga todo turno, e meditar é o que ela
           escolhe FAZER no turno — o preço é só não ter batido nele.
           Cada meditação DOBRA o ataque atual até o teto de 140
           (27 → 54 → 108 → 140, a 3ª só rende +32 em vez de dobrar de
           novo), o ganho é permanente (entra em atkPerm, não expira) e
           a pose fica travada até ela atacar.

           ⚖ NERF 1.15 — "medita muito" tinha virado a jogada MAIS forte
           do jogo, não só uma das opções dela. Simulando com a
           estratégia fixa "medita 3x, depois ataca sempre" (ela não
           reage a nada, só executa o combo): antes do nerf, sem time
           protegendo, 34,9% de vitória — mas o número que importa é o
           golpe em si, não a taxa agregada: com teto 180 e os golpes
           46/60/74/60 de antes, o Golpe de Quadril bem no teto saía
           batendo ~95 de dano JÁ DEPOIS da defesa do alvo, contra HP de
           145-200 do elenco inteiro — ou seja, quase um character-kill
           por golpe, e a defesa dele já dobra o padrão do jogo (menos)
           por causa disso. Com um TIME PROTEGENDO ela (um taunter
           segurando os 3 inimigos enquanto ela medita à vontade — testado
           com o Mameluco usando Provocação Geral toda vez que sai de
           recarga), o combo completo de 3 meditações chegava a 52,9% de
           vitória sozinho, maior que qualquer taxa do elenco.
           Depois do nerf (teto 180→140, golpes 46/60/74/60→40/52/64/52):
           o mesmo golpe no teto cai para ~78 de dano pós-defesa (-18%), e
           a estratégia "medita 3x" caiu pra 30,3% sem proteção e 43,0%
           protegida — abaixo até da opção de NUNCA meditar (47,9% e
           55,4% nos mesmos cenários). Ou seja: meditar até o fim deixou
           de ser a jogada ótima, virou uma aposta que só compensa se ela
           realmente sobreviver pra usar o dano extra — que é a ideia
           de canhão de vidro, não "quanto mais medita, melhor". Taxa
           geral dela caiu de 44,8% pra 39,1% (4000 batalhas, times de 3
           sorteados), dentro da faixa do elenco (37,4%–61,8%). */
        { nome:'MEDITAÇÃO BRANCA', pose:'meditar', tipo:'fisico', icone:'🤍', alvo:'eu', cd:0, dano:0, super:true,
          meditarStack:{ mult:2, teto:140 },
          /* guarda: era +10 (o TETO da faixa +6/+7/+8 do resto do
             elenco) — nerfada pra +6 (a ponta BAIXA da mesma faixa, ver
             o comentário de nerf lá em cima nos stats base). Já foi +30
             e resolvia o balanço sozinha — mas transformava a meditação
             num botão de "fico durão por 2 turnos", exatamente o oposto
             do canhão de vidro. Quem paga o turno parado agora é o dano
             do outro lado da aposta, não defesa emprestada.
             A DURAÇÃO importa mais que o valor (medido com o +10 antigo):
             os mesmos pontos de defesa por 2 turnos davam 37,8% de
             vitória e por 3 turnos davam 45,9% — 3 turnos cobrem a
             sequência inteira de meditações do começo da luta, 2 turnos
             deixam ela descoberta no meio dela. Com o valor mais baixo
             (+6) a duração de 3 turnos continua, só o quanto protege por
             turno que caiu — ainda não remedido. */
          buffEu:{ tipo:'blindagem', valor:6, turnos:3 },
          desc:'Senta e medita: o ataque dela DOBRA na hora (até o teto de 140) e ela fica de guarda '+
               'erguida. Ela não perde turno nenhum por isso — meditar É o turno dela. Pode meditar de '+
               'novo quantas vezes quiser, dobrando outra vez, e só sai da posição quando VOCÊ atacar '+
               'com ela. O que ela acumula não expira.' } ]
    },

    /* ================= MARCELÃO BLACK JW =================
       O LADRÃO DE TEMPO — kit de RECARGA, não de dano bruto. Pedido do
       dono do jogo: um golpe que "sugue" a recarga do inimigo (atrasa) e
       adiante a própria (acelera), e uma moeda que recocheteia sozinha
       pelo time inimigo até a sorte decidir que já bateu o bastante.
       ⚖ BUFF 1.25: media 14,4% de vitória (20.000 batalhas 3x3 sorteadas)
       — o pior do elenco por longe. Testado: o kit de suporte NÃO era o
       problema (sem Escudo e sem Tempestade ele ia só a 18%); o dano dele
       era o mais baixo do jogo. Stats 170/19/10/11 → 200/31/13/13 e golpes
       18/14/13 → 36/34/28: ~48% (4000 batalhas com ele sempre em campo). */
    marcelao_black_jw:{
      /* ⚖ 1.28: pedido do dono do jogo — stats parecidos com o resto do elenco
         (mediana 175/21/11/11) e a força nos GOLPES. 200/31/13/13 → 175/22/11/12,
         golpes 36/34/28 → 60/56/46: 49% (6000 batalhas com ele em campo). */
      /* ⚖ 1.40 (patch de emergência): batia demais — 60/56/46 por golpe, o
         dobro do resto do elenco. Golpes cortados ~40% e o que segurava ele
         virou UTILIDADE: Furto de Tempo recarrega em 2 (era 3), a moeda quica
         com 80% (era 60%).
         1.41: a vida que a 1.40 deu pra ele (268) foi pedida de volta — vida
         perto do original (182) e, no lugar, VELOCIDADE 14: o Ladrão de Tempo
         age antes de quase todo mundo. ~50% de vitória. */
      hp:182, atk:22, def:18, spd:14, passiva:'ladrao_de_tempo',
      skills:[
        { nome:'Soco de Bolso', tipo:'fisico', icone:'👊', alvo:'inimigo', cd:0, dano:27, pose:'socoBolso',
          desc:'Soco seco, sem golpe de efeito nenhum — o básico dele, pra não gastar recarga à toa.' },

        /* FURTO DE TEMPO — o coração do kit. `roubarTempo` (ver o motor)
           faz DUAS coisas no mesmo golpe: toda skill do ALVO que já
           estiver recarregando ganha +2 turnos de recarga (atrasa), e
           toda skill DELE que já estiver recarregando perde 2 turnos
           (adianta) — MENOS a que ele acabou de usar agora (senão ela
           nasceria descontada na hora). */
        { nome:'Furto de Tempo', tipo:'energia', icone:'⏱', alvo:'inimigo', cd:2, dano:26,
          roubarTempo:{ valor:2 }, pose:'furto',
          desc:'Rouba tempo do alvo: TODA skill dele que já estiver recarregando ganha +2 turnos de '+
               'recarga. O tempo roubado vem pra ele — TODA skill SUA que já estiver recarregando '+
               'perde 2 turnos (menos esta, que acabou de sair).' },

        /* MOEDA FATAL — `recochete` (ver o motor) faz a moeda pular pra
           um inimigo vivo DIFERENTE a cada acerto, sempre com a mesma
           chance de continuar. Nunca repete o mesmo alvo duas vezes
           seguidas, e para sozinha quando erra a sorte ou o time inimigo
           acaba. estiloAnim força o arremesso mesmo sendo dano físico. */
        { nome:'Moeda Fatal', tipo:'fisico', icone:'🪙', alvo:'inimigo', cd:4, dano:21,
          estiloAnim:'tiro', recochete:{ chance:0.8 }, pose:'moeda',
          desc:'Joga a moeda no alvo — ela RECOCHETEIA sozinha pelo time inimigo, pulando pra alguém '+
               'diferente a cada acerto, com 80% de chance de continuar a cada quique. Para quando erra '+
               'a sorte ou não sobra mais ninguém pra acertar.' },

        /* ESCUDO TEMPORAL virou ESTRUTURA (igual o Corsa Blindado do Fat
           Mango) em vez de buff pessoal — mas com uma proposta DIFERENTE
           de propósito: o Corsa já cobre "defesa pro time", então este
           não dá defesa nenhuma (sem `defesa` no objeto — a checagem em
           `recalcularBonus`/etiquetas já é condicional, então não
           precisa de zero explícito). É só RECARGA: `estrutura.recarga`
           (ver o motor) desconta 1 turno de TODA skill em recarga do
           time inteiro, no fim de CADA rodada, enquanto o escudo
           aguentar — menos a ULTIMATE de cada um (`skill.super`), pra
           não virar "recarrega o super de graça todo round". */
        { nome:'Escudo Temporal', tipo:'gelo', icone:'🧊', alvo:'aliados', cd:4, dano:0, setup:true, pose:'escudo',
          estrutura:{ nome:'Escudo Temporal', icone:'🧊', turnos:3, recarga:1,
                      visual:'muro', cor:'#bfe9ff' },
          desc:'Ergue um muro de gelo na frente do time inteiro — não é escudo de defesa (isso já é a '+
               'praia do Corsa Blindado): no fim de CADA rodada (menos a de quando é lançado), toda '+
               'skill do time que já estiver recarregando adianta 1 turno — EXCETO a ultimate de cada '+
               'um. Dura 3 turnos.' },

        /* ULTIMATE — vira uma AMBIENTE (igual o Charme da Loirinha e o
           Véu Maldito da Smergula): setup puro, sem dano direto, global
           (vale pros DOIS times). `velocidadeFixa` (ver recalcularBonus
           no motor) TRAVA a velocidade de TODO MUNDO em campo no mesmo
           número, por cima de qualquer buff/penalidade — não é uma
           REDUÇÃO como o `lentidao` normal, é um valor fixo pra todo
           mundo. `recargaExtra` atrasa TODA skill que QUALQUER UM usar
           enquanto durar (ver usarSkill no motor) — dos dois lados,
           inclusive o time dele; quem tem um jeito de acelerar a própria
           recarga (a passiva dele, o Furto de Tempo) sente menos.
           estiloAnim:'foco' só pra pegar a pose `special` (o tornado) —
           sem isso um golpe de área sem tipo físico cairia na pose
           `ranged`, repetindo o arremesso da moeda. */
        { nome:'TEMPESTADE DE GELO', tipo:'gelo', icone:'🌀', alvo:'eu', cd:6, dano:0, super:true, setup:true,
          estiloAnim:'foco', pose:'tempestade',
          ambiente:{ nome:'Tempestade de Gelo', icone:'🌀', turnos:4, cor:'#7df0ff', particula:'gelo',
                     velocidadeFixa:5, recargaExtra:1 },
          desc:'Congela a arena inteira: por 4 turnos, TODO MUNDO em campo (dos dois times) fica com a '+
               'MESMA velocidade — trava em 5 — e toda skill usada por QUALQUER UM durante a tempestade '+
               'demora +1 turno a mais pra recarregar. Ambiente global: vale pros dois lados.' } ]
    },

    /* ========================= CARGAS =========================
       ELÉTRICO, o mais RÁPIDO do elenco (spd bem acima de todo mundo
       — o resto vai de 6 a 13). Dano médio de propósito ("nem muito
       forte nem muito fraco"): quem carrega o kit é a CHANCE DE
       ATORDOAR, tanto na passiva (Condutor, qualquer golpe) quanto
       embutida nos próprios golpes. A ULTIMATE não é um golpe que
       mata — é uma ARMADILHA: prende o time inimigo numa gaiola de
       raios que fere sozinha por 2 turnos, com dano baseado na
       PRÓPRIA velocidade dele no momento do cast (`terreno.escalaVelocidade`,
       ver TurnBattle.usarSkill — computado uma vez no cast, igual o
       resto das escalas do jogo). */
    /* ========================= CARECA =========================
       Humano de Tel Aviv, luta com um ESFREGÃO. Passiva Maldição do
       Verme: morreu e a partida não acabou → volta na rodada seguinte
       como VERME (ver `verme` aqui e `renascerVermes` no motor).
       · `verme` = números da forma verme. Vida BAIXA de propósito: ele
         ganha uma segunda vida inteira, então ela tem que cair rápido.
       · forma 1 = verme. Os golpes trocam via formaOverride (igual o
         Mecas) e os de forma 0 que têm campo que o verme NÃO deve herdar
         zeram ele no override (`lentidao:null`).
       · formaMult neutro: sem isso o motor aplica o ×1,20 padrão da
         forma 1 (pensado pro Mecas) em cima do verme.
       · ULT = VÉU MALDITO (a mesma da Smergula), nas duas formas — e o
         veneno do verme é justamente o que o véu amplifica. */
    /* ========================= CARECA (rework 1.47) =========================
       Pedido do dono do jogo: "um boneco mais divertido — no modo normal ele
       usa a PRÓPRIA VIDA pra dar dano, pra poder morrer mais rápido e virar
       verme". O humano agora é um kamikaze: os golpes cobram vida dele
       (campo `sacrificio` — ver usarSkill no motor) e o dano cresce com o que
       ele pagou. Diferente da Muralha do Cabelin, aqui PODE MATAR quem paga:
       morreu pagando → a Maldição do Verme agenda a volta como VERME na rodada
       seguinte (uma vez por partida, como sempre). O verme continua o lado
       venenoso, e a ult dele é o Véu Maldito, que engorda o veneno.
         · sacrificio: { valor (fixo) | pct (da vida ATUAL) | tudo:true,
                         danoPorVida: cada 1 de vida paga vira N de dano BASE }   */
    careca:{
      hp:170, atk:21, def:9, spd:10, passiva:'maldicao_verme',
      formaNomes:['Humano','VERME'], formaMult:[1, 1],
      verme:{ hp:96, atk:19, def:7, spd:12 },
      /* `pose` = animação PRÓPRIA do golpe (chave de anims em characters.js,
         ver poseDeAtaque no turnui). Cada override do verme troca a pose junto. */
      skills:[
        { nome:'Esfregada Raivosa', tipo:'fisico', icone:'🧹', alvo:'inimigo', cd:0, dano:17, pose:'esfregada',
          sacrificio:{ valor:8, danoPorVida:1.5 },
          desc:'Esfrega com tanta raiva que se machuca junto: paga 8 da PRÓPRIA vida e cada ponto pago vira dano '+
               '(17 + 12). Pode matar ele — e aí ele volta como verme.',
          formaOverride:{
            /* ATAQUE BASE do verme: `cava` = golpe em duas partes (ver
               usarSkill/emergir no motor). Usou: some na terra (ninguém mira
               nele). Próximo turno: sai sozinho embaixo do alvo, com dano e veneno. */
            1:{ nome:'Toca do Verme', tipo:'veneno', icone:'🕳', dano:16, cava:true, estiloAnim:'corpo', sacrificio:null,
                dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:4 },
                desc:'VERME: se enfia na terra (ninguém consegue acertar ele) e no PRÓXIMO turno sai embaixo do alvo: '+
                     'dano + veneno de '+VENENO_TICK+' por 4 turnos.' } } },

        { nome:'Estocada do Cabo', tipo:'fisico', icone:'🪠', alvo:'inimigo', cd:2, dano:28, pose:'estocada',
          desc:'Vira o esfregão de lança e enfia o cabo no inimigo. O único golpe dele que não cobra vida.',
          formaOverride:{
            1:{ nome:'Cusparada Ácida', tipo:'veneno', icone:'🤮', dano:9, estiloAnim:'tiro', pose:'cuspe',
                dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:5 },
                desc:'VERME: cospe lodo verde — veneno de '+VENENO_TICK+' por 5 turnos.' } } },

        { nome:'Chão Ensaboado', tipo:'fisico', icone:'🫧', alvo:'todos_inimigos', cd:3, dano:9, pose:'esfregar',
          lentidao:{ pct:0.10, turnos:3 }, estiloAnim:'tiro',
          desc:'Passa o esfregão molhado no chão do time inimigo: todo mundo escorrega e fica 10% mais lento por 3 turnos.',
          formaOverride:{
            1:{ nome:'Lodo Tóxico', tipo:'veneno', icone:'🟢', dano:6, lentidao:null, pose:'lodo',
                dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:3 },
                desc:'VERME: espalha lodo no time inimigo INTEIRO — veneno de '+VENENO_TICK+' por 3 turnos em todos.' } } },

        /* KAMIKAZE: o coração do rework — troca um terço da vida que ele TEM
           AGORA por uma pancada enorme. Com pouca vida dói menos (e mata ele). */
        { nome:'Pancada Kamikaze', tipo:'fisico', icone:'💀', alvo:'inimigo', cd:3, dano:9, pose:'investida',
          sacrificio:{ pct:0.35, danoPorVida:1.3 }, estiloAnim:'corpo',
          desc:'Se joga de corpo inteiro no inimigo: paga 35% da vida que tem AGORA e cada ponto pago vira dano '+
               '(com a vida cheia, uns 86 de dano base). Pode matar ele — e aí ele volta como verme.',
          formaOverride:{
            1:{ nome:'Mordida Podre', tipo:'veneno', icone:'🦷', dano:7, sacrificio:null, estiloAnim:'corpo', pose:'mordida',
                dot:{ tipo:'veneno', dano:VENENO_TICK, turnos:4 },
                desc:'VERME: morde e deixa a ferida podre — veneno de '+VENENO_TICK+' por 4 turnos (ignora defesa).' } } },

        /* ULT do humano: se entrega de vez. Gasta TODA a vida num estouro no
           time inimigo e morre na hora — volta verme na rodada seguinte (se a
           maldição ainda não tiver sido usada; senão morre de vez). No verme
           a ult vira o Véu Maldito, que é o que o veneno dele quer. */
        Object.assign({ nome:'ENTREGA À MALDIÇÃO', pose:'special', tipo:'maldito', icone:'🪱', alvo:'todos_inimigos', cd:5,
          dano:7, super:true, sacrificio:{ tudo:true, danoPorVida:0.32 }, estiloAnim:'tiro',
          desc:'Deixa a maldição sair de uma vez: gasta TODA a vida que tem num estouro no time inimigo inteiro (quanto '+
               'mais vida, mais dano) e cai — volta como VERME na rodada seguinte. No modo verme vira o VÉU MALDITO.' },
          { formaOverride:{ 1: Object.assign(veuMaldito(), { sacrificio:null, estiloAnim:null }) } }) ]
    },

    /* ========================= TUPAS =========================
       ÁGUA. Domina a água — e não sabe nadar. Passiva RESERVATÓRIO:
       `agua` = estoque (max/inicial) e a faixa do multiplicador de dano
       (multMin + multFaixa × estoque/max → 0,5 a 1,5). Campos novos de
       skill que o motor lê:
         · custoAgua    — gasta depois de bater (o dano sai com o tanque de antes)
         · recuperaAgua — {valor, limite}: enche `valor`, mas SÓ pode ser usada
                          com o estoque ≤ limite×max (condicaoSkill no motor)
         · redemoinho   — {dano, custo}: a ULTIMATE ATIVA. O cast acerta o alvo
                          escolhido; depois, no fim de cada turno do Tupas, acerta
                          o PRÓXIMO inimigo da fila e gasta `custo` de água. Acaba
                          quando ele cai, quando a água não paga o turno, ou quando
                          o jogador DESATIVA (ação livre, não gasta o turno).
         · fx           — efeito de SPRITE da folha de efeitos (tupas2.png),
                          desenhado pelo TurnFX.sprite (ver turnui.js). */
    tupas:{
      hp:175, atk:21, def:10, spd:11, passiva:'reservatorio',
      agua:{ max:100, inicial:100, multMin:0.6, multFaixa:1 },
      fxRedemoinho:{ folha:'assets/tupas/tupas2.png', modo:'alvo', quadros:[[3,3],[0,0],[3,3]], alt:96 },
      skills:[
        { nome:"Jato d'Água", tipo:'agua', icone:'💦', alvo:'inimigo', cd:0, dano:31, custoAgua:6, pose:'jato',
          fx:{ folha:'assets/tupas/tupas2.png', modo:'projetil', quadros:[[1,1]], alt:30 },
          desc:'Dispara um jato de água no alvo. Barato: gasta só 6 de água.' },

        { nome:'Onda', tipo:'agua', icone:'🌊', alvo:'todos_inimigos', cd:3, dano:15, custoAgua:18, pose:'onda',
          fx:{ folha:'assets/tupas/tupas2.png', modo:'alvo', quadros:[[4,2],[4,1]], alt:78 },
          desc:'Ergue uma onda que quebra em cima do time inimigo inteiro. Gasta 18 de água.' },

        { nome:'Bolha', tipo:'agua', icone:'🫧', alvo:'eu', cd:4, dano:0, custoAgua:10, pose:'bolha',
          buff:{ tipo:'blindagem', valor:9, turnos:2 },
          fx:{ folha:'assets/tupas/tupas2.png', modo:'origem', quadros:[[5,1],[3,4]], alt:84 },
          desc:'Se fecha numa bolha d\'água: +9 de defesa por 2 turnos. Gasta 10 de água.' },

        /* a CONDIÇÃO pedida pro golpe de recuperar: só com metade do tanque
           ou menos — sem isso ele encheria o tanque sempre e a passiva
           (gastar água a cada golpe) não teria custo nenhum. */
        { nome:'Correnteza', tipo:'agua', icone:'🌀', alvo:'inimigo', cd:2, dano:12, estiloAnim:'corpo', pose:'correnteza',
          recuperaAgua:{ valor:45, limite:0.5 },
          fx:{ folha:'assets/tupas/tupas2.png', modo:'alvo', quadros:[[4,1],[5,0]], alt:56 },
          desc:'Vira correnteza, atravessa o inimigo e volta puxando a água dele: +45 de água. '+
               'Só dá pra usar com 50% de água ou MENOS.' },

        { nome:'REDEMOINHO', tipo:'agua', icone:'🌪', alvo:'inimigo', cd:5, dano:18, custoAgua:12, super:true, pose:'redemoinho',
          redemoinho:{ dano:16, custo:9 },
          fx:{ folha:'assets/tupas/tupas2.png', modo:'alvo', quadros:[[3,3],[0,0],[3,3]], alt:96 },
          desc:'Cria um redemoinho que acerta o alvo e FICA ATIVO: no fim de cada turno seu ele pula pro próximo '+
               'inimigo, um de cada vez, gastando 9 de água por acerto. Dura até a água acabar, até o Tupas cair, '+
               'ou até você DESATIVAR — desativar não gasta o turno.' } ]
    },

    cargas:{
      hp:162, atk:18, def:9, spd:14, passiva:'condutor',
      skills:[
        /* EFEITOS (1.30): folha raio_sprites.png — ver o mapa no characters.js do Cargas.
           fx = o que VOA · fxOrigem = nele no começo · fxImpacto = em cada alvo atingido */
        { nome:'Choque Rápido', pose:'choque', tipo:'eletrico', icone:'⚡', alvo:'inimigo', cd:0, dano:14, atordoar:0.08,
          fx:{ folha:'assets/cargas/raio_sprites.png', modo:'projetil', quadros:[{x:40,y:63,w:21,h:20},{x:65,y:61,w:36,h:26}], alt:28 },  // orbe de energia pulsando
          fxImpacto:{ folha:'assets/cargas/raio_sprites.png', quadros:[[0,1],[5,0]], alt:50 },                                         // estoura em faíscas
          desc:'Descarga rápida na palma da mão. Sem recarga — sempre pronta.' },

        { nome:'Investida Relâmpago', pose:'investidaRaio', tipo:'eletrico', icone:'💨', alvo:'inimigo', cd:2, dano:23, atordoar:0.12,
          estiloAnim:'corpo',
          fxOrigem:{ folha:'assets/cargas/raio_sprites.png', quadros:[[5,1],[1,0]], alt:56 },      // raios estalando no chão na largada
          fxImpacto:{ folha:'assets/cargas/raio_sprites.png', quadros:[[4,1],[0,1]], alt:78 },     // EXPLOSÃO de luz no alvo
          desc:'Vira um borrão elétrico e acerta o alvo antes que ele perceba o movimento.' },

        { nome:'Rajada em Cadeia', pose:'rajadaCadeia', tipo:'eletrico', icone:'🌩', alvo:'todos_inimigos', cd:3, dano:16, atordoar:0.10,
          fx:{ folha:'assets/cargas/raio_sprites.png', modo:'projetil', quadros:[[1,1]], alt:30 },                 // o FEIXE voando
          fxOrigem:{ folha:'assets/cargas/raio_sprites.png', quadros:[{x:109,y:56,w:99,h:35},[5,2]], alt:40 },     // orbe enrolando → anel
          fxImpacto:{ folha:'assets/cargas/raio_sprites.png', quadros:[[3,0],[3,1],[3,2]], alt:82 },             // um RAIO cai em cada um
          desc:'Um arco elétrico salta de inimigo em inimigo.' },

        /* estiloAnim:'foco' só pra pegar a pose `special` (o corpo em
           chamas azuis + o raio erguido) — sem isso um golpe de área
           tipo 'eletrico' cairia na pose `ranged`, repetindo o mesmo
           arremesso do Choque Rápido. terreno.dano fica de fora de
           propósito: sem ele, o motor calcula na hora do cast a partir
           da velocidade ATUAL de quem lançou (ver comentário no motor). */
        { nome:'TEMPESTADE ENCURRALADA', pose:'tempestadeRaio', tipo:'eletrico', icone:'🌪', alvo:'todos_inimigos', cd:5, dano:14,
          atordoar:0.12, super:true, estiloAnim:'foco',
          terreno:{ nome:'Campo Elétrico', icone:'⚡', turnos:2, escalaVelocidade:0.35,
                    // a GAIOLA de raios fica em cima de cada um preso nela (TurnUI.marcarTerrenos)
                    fx:{ folha:'assets/cargas/raio_sprites.png', quadros:[[2,2],[1,0]], alt:64, alpha:0.55 } },
          fxOrigem:{ folha:'assets/cargas/raio_sprites.png', quadros:[[5,3],[3,3],[3,4]], alt:70 },   // chama azul → TORNADO elétrico subindo nele
          fxImpacto:{ folha:'assets/cargas/raio_sprites.png', quadros:[[4,0],[2,2]], alt:86 },        // coluna de raio → gaiola fechando
          desc:'Prende o time inimigo numa gaiola de raios: dano imediato em todos e mais um CAMPO ELÉTRICO '+
               'por 2 turnos que fere todo mundo com base na SUA velocidade.' } ]
    },

    /* ======================= MANO COXINHA =======================
       De LIMEIRA, mas HUMANO (não é limeirense de raça): só gosta tanto de
       coxinha que ficou com o formato dela.
       1.40 (patch de emergência, pedido do dono do jogo): UMA ult só, que
       GIRA. Ele começa no modo COXINHA (`formaInicial:1`) e cada vez que
       usa a ult come a próxima comida da roda e muda de modo:
         🍗 COXINHA (defesa) → 🍕 PIZZA (velocidade) → 🍔 HAMBÚRGUER (ataque) → 🍗 …
       A ult é o mesmo slot com `formaOverride` por modo (o nome, a comida e
       o `virarForma` mudam). Toda comida cura um pouco; recarga de 2 turnos.
       Os três golpes trocam junto, e o characters.js tem um idle/walk por
       modo (forms[1..3]; a forma 0 não é mais usada).
       Bônus de cada modo (`formaStats`, ver statsDaForma no motor):
         1 COXINHA     +6 de defesa, recebe 20% menos dano
         2 HAMBÚRGUER  +25% de dano
         3 PIZZA       +6 de velocidade, +15% de esquiva
       ⚖ números medidos no patch 1.40 (ver o comentário de balanço lá em
       cima, no começo das FICHAS). */
    mano_coxinha:{
      hp:186, atk:21, def:13, spd:10, passiva:'cardapio', formaInicial:1,
      formaNomes:['Normal','COXINHA','HAMBÚRGUER','PIZZA'], formaIcone:'🍗',
      formaStats:{ 1:{ def:6, reducao:0.20 }, 2:{ dano:1.25 }, 3:{ spd:6, esquiva:0.15 } },
      skills:[
        { nome:'Casca Crocante', pose:'barrigada', tipo:'fisico', icone:'🛡', alvo:'inimigo', cd:0, dano:28, estiloAnim:'corpo',
          buffEu:{ tipo:'blindagem', valor:2, turnos:2 },
          desc:'COXINHA: dá uma barrigada com a casca dura e fica mais duro ainda (+2 de defesa por 2 turnos).',
          formaOverride:{
            2:{ nome:'CRUNCH!', icone:'😬', dano:37, pose:'crunch', buffEu:null,
                desc:'HAMBÚRGUER: abre a boca e MORDE o alvo como se fosse um salgado.' },
            3:{ nome:'Rodízio de Tapas', icone:'👋', dano:12, vezes:3, pose:'tapas', buffEu:null,
                desc:'PIZZA: três tapas tão rápidos que parecem um só.' } } },

        { nome:'Muralha de Massa', pose:'guarda', tipo:'fisico', icone:'🧱', alvo:'inimigo', cd:3, dano:22, estiloAnim:'corpo',
          provoca:{ turnos:2 }, buffEu:{ tipo:'blindagem', valor:3, turnos:2 },
          desc:'COXINHA: estufa a massa e chama a briga — o alvo fica PROVOCADO (só bate nele por 2 turnos) '+
               'e ele ganha +3 de defesa por 2 turnos.',
          formaOverride:{
            2:{ nome:'ARROTO DE CHEDDAR', icone:'💨', tipo:'explosivo', alvo:'todos_inimigos', dano:28, pose:'arroto',
                estiloAnim:'tiro', provoca:null, buffEu:null,
                fx:{ folha:'assets/mano_coxinha/mano_coxinha_coxinha.png', modo:'alvo', quadros:[[3,8]], alt:52 },
                desc:'HAMBÚRGUER: o hambúrguer volta em forma de ARROTO e acerta o time inimigo inteiro.' },
            3:{ nome:'Entrega Relâmpago', icone:'🛵', alvo:'todos_inimigos', dano:24, pose:'investida', provoca:null, buffEu:null,
                desc:'PIZZA: passa voando pelo time inimigo e atropela todo mundo.' } } },

        /* 3º golpe (1.41): também troca com o modo — óleo da fritura (coxinha),
           fatia arremessada (pizza) e voadora (hambúrguer). */
        { nome:'Óleo Quente', pose:'arremesso', tipo:'fogo', icone:'🍳', alvo:'todos_inimigos', cd:3, dano:11, estiloAnim:'tiro',
          dot:{ tipo:'queimadura', dano:4, turnos:2 },
          desc:'COXINHA: joga o óleo da fritura no time inimigo — dano em todos e QUEIMA por 2 turnos.',
          formaOverride:{
            3:{ nome:'Fatia Voadora', icone:'🍕', tipo:'fisico', alvo:'inimigo', dano:17, dot:null,
                lentidao:{ valor:3, turnos:2 },
                desc:'PIZZA: arremessa uma fatia de pizza quente no alvo — dano e -3 de velocidade por 2 turnos.' },
            2:{ nome:'Voadora de Hambúrguer', icone:'🦶', tipo:'fisico', alvo:'inimigo', dano:28, dot:null, cd:4,
                atordoar:0.15, pose:'kick', estiloAnim:'corpo',
                desc:'HAMBÚRGUER: pula com o peso do lanche inteiro — dano alto e 15% de chance de ATORDOAR.' } } },

        /* A ULT: um botão só. O que ele come depende do modo em que está. */
        { nome:'Comer Pizza', pose:'comerPizza', tipo:'fisico', icone:'🍕', alvo:'eu', cd:2, dano:0,
          super:true, virarForma:3, cura:30, estiloAnim:'foco',
          desc:'ULT (gira a cada uso): agora ele come uma PIZZA — cura 30 e vai pro modo PIZZA '+
               '(+6 de velocidade e +15% de esquiva). Depois vem o hambúrguer, depois a coxinha de novo.',
          formaOverride:{
            3:{ nome:'Comer Hambúrguer', pose:'comerHamburguer', icone:'🍔', virarForma:2,
                desc:'ULT (gira a cada uso): agora ele come um HAMBÚRGUER — cura 30 e vai pro modo HAMBÚRGUER '+
                     '(+25% de dano). Depois vem a coxinha, depois a pizza.' },
            2:{ nome:'Comer Coxinha', pose:'comerCoxinha', icone:'🍗', virarForma:1,
                desc:'ULT (gira a cada uso): agora ele come uma COXINHA — cura 30 e volta pro modo COXINHA '+
                     '(+6 de defesa e recebe 20% menos dano). Depois vem a pizza, depois o hambúrguer.' } } } ]
    },

    /* ======================== PRODOCIMO ========================
       A ENGANADORA (Smergulus, mora em Limeira). Pedido do dono do jogo:
       os poderes têm que dar RAIVA de enfrentar, não ser mais fortes que o
       resto — então o kit todo é tirar o controle do outro (errar, se
       confundir, perder o buff) com dano MENOR que o normal do elenco.
       Campos novos que o motor lê:
         · bonusConfuso — multiplica o dano em alvo CONFUSO (Finta)
         · roubarBuffs  — os buffs bons do alvo passam pra ela (Mão Leve)
         · sumico       — o próximo golpe inimigo nela acerta um vulto (Sumiço)
       Passiva Cara de Pau: +10% de esquiva e quem erra nela fica confuso
       (ver chanceEsquiva/aplicarDano no motor). */
    prodocimo:{
      /* ⚖ 1ª versão (def 10, golpes 27/24/10) media 39%: a confusão só
         desvia 35% dos golpes do alvo, então o controle sozinho não paga os
         turnos sem dano (ult, Sumiço). Medido por peça (5000 lutas cada,
         ela em todas): passiva vale ~8 pontos, ult ~2, Sumiço/Fofoca/Mão
         Leve ~1 cada. Força posta no DANO (vida perto do resto do elenco):
         golpes 36/32/14 e def 11 → 48,3% em 10.000 lutas — um pouco abaixo
         do meio DE PROPÓSITO: gente usa controle melhor que a IA.
         1.44: a Mão Leve passou a SEMPRE roubar 4 de ataque e 3 de defesa (antes só
         buff, e quase ninguém tem buff — o dono viu o golpe "não roubar nada"):
         52,6% → Finta 36→32 e Mão Leve 32→26 → 49,5% (12.000 lutas). */
      hp:165, atk:20, def:11, spd:12, passiva:'cara_de_pau',
      skills:[
        { nome:'Finta', pose:'finta', tipo:'fisico', icone:'🃏', alvo:'inimigo', cd:0, dano:37, estiloAnim:'corpo',
          bonusConfuso:1.5,
          desc:'Finge que vai dar um soco e acerta o chute. Contra alvo CONFUSO, ele cai direitinho: ×1,5 de dano.' },

        { nome:'Mão Leve', pose:'maoLeve', tipo:'fisico', icone:'🫳', alvo:'inimigo', cd:3, dano:30, estiloAnim:'corpo',
          roubarBuffs:true, roubarStats:{ atk:4, def:3, turnos:2 },
          desc:'Dá um bote no alvo e passa a mão no que é dele: SEMPRE rouba 4 de ataque e 3 de defesa por 2 turnos '+
               '(ele perde, ela ganha) — e se ele tiver BUFF (ataque, defesa, velocidade, regeneração, até a guarda do '+
               'Defender), leva tudo junto.' },

        /* 1.46: o SUMIÇO (vulto que fazia o próximo golpe errar) saiu do kit —
           pedido do dono do jogo: o golpe não fazia sentido nela. O motor ainda
           entende o campo `sumico`, só nenhum golpe usa mais. */

        { nome:'Fofoca', pose:'fofoca', tipo:'charme', icone:'🤭', alvo:'todos_inimigos', cd:4, dano:16,
          confusao:{ turnos:1 }, estiloAnim:'tiro',
          desc:'Espalha uma fofoca no time inimigo: dano leve em todos e ninguém mais sabe em quem confiar — '+
               'CONFUSOS no próximo turno.' },

        { nome:'APERTO DE MÃO REVELADOR', pose:'aperto', tipo:'charme', icone:'🤝', alvo:'inimigo', cd:5, dano:0,
          super:true, confusao:{ turnos:6 }, estiloAnim:'corpo',
          desc:'Estende a mão sorrindo — e quem aperta descobre quem ela é de verdade. O alvo fica CONFUSO por '+
               '6 turnos: cada golpe dele tem 35% de chance de sair num alvo qualquer do campo, até no próprio time. '+
               'Não tem dano, então não dá pra esquivar.' } ]
    },

    /* ===================== DMATERELIZADOR =====================
       Desmaterializa as coisas. Fã nº 1 da CDI; ninguém gosta dele. Kit
       CHATO de propósito (pedido do dono do jogo): desmancha defesa
       (passiva), desmancha o que o inimigo construiu, atravessa taunt e
       muralha, e some do campo. Campos novos que o motor lê:
         · atravessa — ignora a provocação e a Muralha de Lasanha (Portal)
         · desfazer  — apaga estrutura/muralha/fumaça do time inimigo, o
                       terreno no time dele e os buffs bons dos alvos
         · fase      — ninguém mira nele até o próximo turno dele (intocavel)
         · esgota    — a ult: N turnos SEM PODER depois (só defender).
                       Pedido do dono: "fica um turno sem conseguir usar o
                       poder de novo". */
    dmaterelizador:{
      /* ⚖ 1ª versão (golpes 26/34/12) media 55,4% — a passiva vale ~4,5 pontos e a ult ~4.
         A ult continua forte (pedido do dono) e o teto da passiva quase não muda nada (−3/−4/−6
         dão o mesmo), então o corte foi nos outros golpes: 20/28/10 → ~50% (10.000 lutas). */
      hp:168, atk:21, def:10, spd:11, passiva:'desintegracao',
      skills:[
        { nome:'Toque Desmaterializador', pose:'toque', tipo:'energia', icone:'🔮', alvo:'inimigo', cd:0, dano:26,
          estiloAnim:'tiro',
          fx:{ folha:'assets/dmatrelizador/dmatrelizador.png', modo:'projetil', quadros:[{x:244,y:233,w:22,h:26}], alt:26 },
          desc:'Junta energia na mão e solta uma esfera que desmancha o que encosta. Energia: atravessa boa parte da defesa.' },

        { nome:'Portal', pose:'portal', tipo:'energia', icone:'🕳', alvo:'inimigo', cd:3, dano:36, atravessa:true,
          estiloAnim:'tiro',
          fxImpacto:{ folha:'assets/dmatrelizador/dmatrelizador2.png', quadros:[{x:76,y:389,w:22,h:58}], alt:64 },
          desc:'Abre um portal e o golpe sai do outro lado, colado no alvo que ELE quiser: IGNORA a provocação e passa '+
               'por trás da Muralha de Lasanha.' },

        { nome:'Desmaterializar', pose:'desfaz', tipo:'energia', icone:'🌀', alvo:'todos_inimigos', cd:4, dano:13,
          desfazer:true, estiloAnim:'tiro',
          fxImpacto:{ folha:'assets/dmatrelizador/dmatrelizador.png', quadros:[{x:15,y:308,w:100,h:95}], alt:70 },
          desc:'Um redemoinho desmancha tudo que o time inimigo construiu: Corsa Blindado, Escudo Temporal, Muralha de '+
               'Lasanha e Fumaça Colorida somem, todo BUFF bom dos inimigos some, e o terreno que estiver ferindo o '+
               'time dele também.' },

        /* 1.46: a FASE FANTASMA (sumir do campo até o próximo turno) saiu do kit —
           pedido do dono do jogo. O motor ainda entende o campo `fase`. */

        { nome:'DESMATERIALIZAÇÃO TOTAL', pose:'total', tipo:'energia', icone:'💠', alvo:'inimigo', cd:5, dano:90,
          super:true, esgota:1, estiloAnim:'tiro',
          fx:{ folha:'assets/dmatrelizador/dmatrelizador.png', modo:'projetil', quadros:[{x:77,y:428,w:101,h:40}], alt:44 },
          fxImpacto:{ folha:'assets/dmatrelizador/dmatrelizador.png', quadros:[{x:176,y:513,w:118,h:88}], alt:96 },
          desc:'Solta TODO o poder num raio gigante que vai desfazendo o alvo em cubinhos. Dano enorme — mas gasta '+
               'tudo: no turno seguinte ele fica SEM PODER nenhum (só consegue defender).' } ]
    }
  };

  /* ==== ESTRATEGIAS (gerado) ====
     Gerado pela busca de estratégias (simulação no motor real, ver CONTEXT.md
     §5.2.1). Lido pela IA em jogadaDaIA: lista de prioridade { i: golpe
     (-1 = defender), g: condição, p: parâmetro } + regra de mira.
     NÃO edite à mão — rode a busca de novo e regenere. */
  const ESTRATEGIAS = {"fat_smerg":{"alvo":"pct","lista":[{"i":3,"g":"rodadaDepois","p":2},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "strong_smerg":{"alvo":"fraco","lista":[{"i":3,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "serrinha_dog":{"alvo":"fraco","lista":[{"i":3,"g":"timeFerido","p":0.8},{"i":2,"g":"sempre","p":0},{"i":0,"g":"vidaMais","p":0.5}]},
    "fat_mango":{"alvo":"ia","lista":[{"i":2,"g":"sempre","p":0},{"i":3,"g":"timeFerido","p":0.6},{"i":1,"g":"sempre","p":0},{"i":3,"g":"timeFerido","p":0.8},{"i":0,"g":"vidaMais","p":0.99}]},
    "mecas":{"alvo":"ia","lista":[{"i":0,"g":"inimigos1","p":0},{"i":3,"g":"timeFerido","p":0.6},{"i":0,"g":"vidaMenos","p":0.3}]},
    "loirinha_cdi":{"alvo":"ia","lista":[{"i":3,"g":"vidaMenos","p":0.7},{"i":2,"g":"timeFerido","p":0.6},{"i":1,"g":"inimigos2","p":0},{"i":3,"g":"timeFerido","p":0.8},{"i":1,"g":"timeFerido","p":0.8},{"i":0,"g":"vidaMais","p":0.5}]},
    "smergula":{"alvo":"forte","lista":[{"i":3,"g":"sempre","p":0},{"i":2,"g":"timeFerido","p":0.6},{"i":2,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "matheus_limeira2":{"alvo":"ia","lista":[{"i":1,"g":"inimigos2","p":0},{"i":2,"g":"inimigos2","p":0}]},
    "hans_lambanca":{"alvo":"pct","lista":[{"i":3,"g":"sempre","p":0},{"i":0,"g":"rodadaAte","p":3}]},
    "adulto_feliz":{"alvo":"fraco","lista":[{"i":3,"g":"sempre","p":0},{"i":0,"g":"inimigos1","p":0},{"i":2,"g":"inimigos2","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "fat_girl":{"alvo":"fraco","lista":[{"i":2,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":3,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "marcelao_black_jw":{"alvo":"pct","lista":[{"i":2,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]},
    "cargas":{"alvo":"ia","lista":[{"i":3,"g":"rodadaDepois","p":1},{"i":2,"g":"inimigos2","p":0},{"i":3,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"inimigos1","p":0},{"i":0,"g":"vidaMenos","p":0.3}]},
    "careca":{"alvo":"ia","lista":[{"i":2,"g":"inimigos2","p":0},{"i":3,"g":"vidaMais","p":0.5},{"i":0,"g":"sempre","p":0},{"i":0,"g":"vidaMais","p":0.5}]},
    "tupas":{"alvo":"ia","lista":[{"i":3,"g":"rodadaDepois","p":1}]},
    "cabelin":{"alvo":"ia","lista":[{"i":4,"g":"timeFerido","p":0.6},{"i":3,"g":"rodadaDepois","p":4},{"i":4,"g":"rodadaAte","p":4},{"i":3,"g":"rodadaDepois","p":2}]},
    "smergulao":{"alvo":"pct","lista":[{"i":3,"g":"sempre","p":0},{"i":0,"g":"inimigos1","p":0},{"i":1,"g":"vidaMenos","p":0.5},{"i":0,"g":"vidaMais","p":0.99}]},
    "crianca_rosa":{"alvo":"fraco","lista":[{"i":0,"g":"sempre","p":0}]},
    "mano_coxinha":{"alvo":"forte","lista":[{"i":3,"g":"inimigos1","p":0},{"i":1,"g":"rodadaAte","p":4},{"i":0,"g":"inimigos1","p":0},{"i":3,"g":"vidaMenos","p":0.5},{"i":2,"g":"sempre","p":0}]},
    "prodocimo":{"alvo":"ia","lista":[{"i":2,"g":"sempre","p":0},{"i":1,"g":"inimigos2","p":0},{"i":1,"g":"vidaMenos","p":0.5}]},
    "dmaterelizador":{"alvo":"ia","lista":[{"i":3,"g":"timeFerido","p":0.6},{"i":2,"g":"timeFerido","p":0.6},{"i":2,"g":"rodadaAte","p":2},{"i":2,"g":"rodadaDepois","p":4},{"i":3,"g":"sempre","p":0},{"i":1,"g":"sempre","p":0},{"i":0,"g":"sempre","p":0}]}};
  Object.keys(ESTRATEGIAS).forEach(id=>{ if(FICHAS[id]) FICHAS[id].estrategia=ESTRATEGIAS[id]; });
  /* ==== fim ESTRATEGIAS ==== */

  function ficha(id){ return FICHAS[id]; }
  function tipo(t){ return TIPOS[t]||TIPOS.fisico; }
  function passiva(p){ return PASSIVAS[p]||{nome:p,icone:'•',desc:''}; }

  /* ---------- LEITURA DO GOLPE (usado na batalha) ----------
     Monta as etiquetas curtas a partir dos PRÓPRIOS dados da skill,
     então nenhuma descrição fica desatualizada quando o número muda. */
  const ALVO_TXT = {
    inimigo:        { icone:'🎯', txt:'1 inimigo' },
    aliado:         { icone:'💚', txt:'1 aliado escolhido' },
    todos_inimigos: { icone:'💥', txt:'todos os inimigos' },
    eu:             { icone:'🙋', txt:'você mesmo' },
    aliados:        { icone:'🤝', txt:'seu time' },
    qualquer:       { icone:'🎭', txt:'qualquer um em campo (aliado ou inimigo)' }
  };
  function alvoTxt(s){ return ALVO_TXT[s.alvo] || ALVO_TXT.inimigo; }

  function etiquetas(s){
    const e=[], t=tipo(s.tipo), a=alvoTxt(s);
    e.push({ txt:a.icone+' '+a.txt, cor:'#9fd8ff' });
    if(s.dano>0){
      const vezes = s.vezes>1 ? ' ×'+s.vezes+' golpes' : '';
      e.push({ txt:t.icone+' '+s.dano+' de dano'+vezes, cor:t.cor });
    }
    if(s.cura)     e.push({ txt:'💚 cura '+s.cura, cor:'#7dff8a' });
    if(s.drena)    e.push({ txt:'🩸 drena '+Math.round(s.drena*100)+'% do dano', cor:'#c46bff' });
    if(s.dot)      e.push({ txt:'⏳ '+s.dot.tipo+' '+s.dot.dano+'/turno ('+s.dot.turnos+')', cor:t.cor });
    if(s.atordoar) e.push({ txt:'⚡ '+Math.round(s.atordoar*100)+'% de atordoar', cor:'#ffe066' });
    if(s.confusao) e.push({ txt:'😵 confusão ('+s.confusao.turnos+' turnos)', cor:'#a24bff' });
    if(s.lentidao) e.push({ txt: s.lentidao.pct
        ? '❄ -'+Math.round(s.lentidao.pct*100)+'% de velocidade ('+s.lentidao.turnos+' turnos)'
        : '❄ -'+s.lentidao.valor+' velocidade ('+s.lentidao.turnos+')', cor:'#7df0ff' });
    if(s.terreno)  e.push({ txt: s.terreno.dano!=null
        ? '🌋 terreno '+s.terreno.dano+'/turno ('+s.terreno.turnos+')'
        : '🌋 terreno — dano baseado na sua velocidade ('+s.terreno.turnos+' turnos)', cor:'#caa66a' });
    if(s.estrutura){
      const es=s.estrutura;
      if(es.defesa) e.push({ txt:es.icone+' +'+es.defesa+' defesa no time ('+es.turnos+' turnos)', cor:'#ffb03c' });
      if(es.recarga) e.push({ txt:es.icone+' recarga do time (menos a ULT) -'+es.recarga+' turno por rodada ('+es.turnos+' turnos)', cor:'#7df0ff' });
    }
    if(s.ambiente){
      const a=s.ambiente;
      e.push({ txt:a.icone+' AMBIENTE: '+a.nome+' ('+a.turnos+' turnos)', cor:a.cor||'#ff9ecb' });
      if(a.curaMult) e.push({ txt:'💚 cura +'+Math.round((a.curaMult-1)*100)+'% para TODOS', cor:'#7dff8a' });
      if(a.regen)    e.push({ txt:'💚 +'+a.regen+' de vida por rodada para TODOS', cor:'#7dff8a' });
      if(a.dotMult)  e.push({ txt:'⏳ veneno/sangue/queimadura +'+Math.round((a.dotMult-1)*100)+'% de dano', cor:'#9cff5e' });
      if(a.dotTurnosExtra) e.push({ txt:'⏳ e duram +'+a.dotTurnosExtra+' turno(s)', cor:'#9cff5e' });
      if(a.magiaMult) e.push({ txt:'🕸 TODA magia +'+Math.round((a.magiaMult-1)*100)+'% de dano', cor:'#a24bff' });
      if(a.confusaoExtra) e.push({ txt:'😵 confusão dura +'+a.confusaoExtra+' turno(s)', cor:'#a24bff' });
      if(a.velocidadeFixa!=null) e.push({ txt:'❄ TODOS em campo ficam com velocidade '+a.velocidadeFixa, cor:'#7df0ff' });
      if(a.recargaExtra) e.push({ txt:'⏱ toda skill usada por QUALQUER UM demora +'+a.recargaExtra+' turno(s) pra recarregar', cor:'#7df0ff' });
    }
    if(s.meditarStack){
      const m=s.meditarStack;
      e.push({ txt:'🤍 ataque ×'+(m.mult||2)+' na hora (teto '+m.teto+')', cor:'#3bff9c' });
      e.push({ txt:'🧘 fica meditando até você atacar', cor:'#9fd8ff' });
    }
    if(s.setup)    e.push({ txt:'🧩 SETUP', cor:'#3bff9c' });
    if(s.buff){
      const b=s.buff;
      e.push({ txt:'⬆ '+b.tipo+' +'+b.valor+(b.porTurno?' POR TURNO':'')+' ('+b.turnos+' turnos)', cor:'#3bff9c' });
    }
    if(s.buffEu){
      const b=s.buffEu;
      e.push({ txt: b.tipo==='blindagem'
        ? '🛡 +'+b.valor+' de defesa em você ('+b.turnos+' turnos)'
        : '⬆ '+b.tipo+' +'+b.valor+(b.porTurno?' POR TURNO':'')+' em você ('+b.turnos+' turnos)', cor:'#3bff9c' });
    }
    if(s.provoca)  e.push({ txt:'😤 PROVOCA o alvo ('+s.provoca.turnos+(s.provoca.turnos===1?' turno)':' turnos)'), cor:'#ffb03c' });
    if(s.cava)     e.push({ txt:'🕳 fica 1 turno na terra (intocável) e sai acertando', cor:'#c8a578' });
    if(s.custoAgua)    e.push({ txt:'💧 gasta '+s.custoAgua+' de água', cor:'#3bb8ff' });
    if(s.recuperaAgua) e.push({ txt:'💧 +'+s.recuperaAgua.valor+' de água (só com ≤'+Math.round(s.recuperaAgua.limite*100)+'%)', cor:'#7df0ff' });
    if(s.redemoinho)   e.push({ txt:'🌪 ATIVO: '+s.redemoinho.dano+' por turno, pula de inimigo em inimigo (−'+s.redemoinho.custo+' água cada)', cor:'#3bb8ff' });
    if(s.limparDots) e.push({ txt:'✨ remove sangramento/veneno do alvo', cor:'#7dffc4' });
    if(s.desabilitar) e.push({ txt:'🔇 sela o último golpe do alvo por 3 turnos', cor:'#ff4d6d' });
    if(s.removerAtaque) e.push({ txt:'☠ apaga o ATAQUE do alvo PRA SEMPRE', cor:'#ff4d6d' });
    if(s.roubarTempo) e.push({ txt:'⏱ atrasa a recarga do alvo e adianta a sua em '+s.roubarTempo.valor+' turno(s)', cor:'#7df0ff' });
    if(s.recochete) e.push({ txt:'🪙 recocheteia no time inimigo ('+Math.round((s.recochete.chance||0.6)*100)+'% de continuar por quique)', cor:'#bfe9ff' });
    if(s.escalaVelocidade) e.push({ txt:'💨 escala com a velocidade', cor:'#7df0ff' });
    if(s.escalaDefesa) e.push({ txt:'🛡 dano escala com sua defesa', cor:'#caa66a' });
    if(s.escalaVida) e.push({ txt:'❤ dano escala com sua vida MÁXIMA', cor:'#ff6b6b' });
    if(s.roubar) e.push({ txt:'🎭 rouba a ultimate do alvo (ele fica com a dele em recarga)', cor:'#c46bff' });
    if(s.barreira){
      e.push({ txt:s.barreira.icone+' ergue a '+s.barreira.nome+' com '+s.barreira.hp+' de vida', cor:'#ffb83c' });
      e.push({ txt:'🛡 TODO golpe inimigo acerta a barreira até ela quebrar', cor:'#ffb83c' });
    }
    if(s.custoVida) e.push({ txt:'❤ custa '+s.custoVida+' da sua vida', cor:'#ff6b6b' });
    if(s.sacrificio){ const sf=s.sacrificio;
      e.push({ txt:'💀 paga '+(sf.tudo? 'TODA a vida' : sf.pct? Math.round(sf.pct*100)+'% da vida atual' : sf.valor+' de vida')+' (pode morrer)', cor:'#ff6b6b' }); }
    if(s.curaAliado) e.push({ txt:'💗 cura '+s.curaAliado+' no aliado mais ferido', cor:'#7dff8a' });
    if(s.invocar){
      e.push({ txt:'🐻 invoca o URSÃO no lugar de um aliado caído', cor:'#ff4d6d' });
      e.push({ txt:'❤ custa '+Math.round((s.invocar.custoPct||0.25)*100)+'% da sua vida máxima', cor:'#ff6b6b' });
    }
    if(s.alternaForma) e.push({ txt:'🔁 troca entre CRIANÇA (suporte) e DEMÔNIO (dano) — os golpes mudam junto', cor:'#ff9ecb' });
    if(s.atravessa) e.push({ txt:'🕳 ignora provocação e Muralha de Lasanha', cor:'#8a5cff' });
    if(s.desfazer) e.push({ txt:'🌀 apaga estrutura, muralha, fumaça e buffs do inimigo (e o terreno no seu time)', cor:'#8a5cff' });
    if(s.fase) e.push({ txt:'👾 ninguém mira em você até o seu próximo turno (nem área)', cor:'#9fd8ff' });
    if(s.esgota) e.push({ txt:'😮‍💨 depois fica '+s.esgota+' turno SEM PODER (só defender)', cor:'#ff6b6b' });
    if(s.bonusConfuso) e.push({ txt:'🃏 ×'+s.bonusConfuso+' de dano em alvo CONFUSO', cor:'#c46bff' });
    if(s.roubarStats) e.push({ txt:'🫳 rouba '+[s.roubarStats.atk?s.roubarStats.atk+' de ataque':'', s.roubarStats.def?s.roubarStats.def+' de defesa':''].filter(Boolean).join(' e ')+' do alvo ('+s.roubarStats.turnos+' turnos)', cor:'#ff9ecb' });
    if(s.roubarBuffs) e.push({ txt:'🫳 rouba TODOS os buffs do alvo pra você', cor:'#ff9ecb' });
    if(s.sumico) e.push({ txt:'👻 o próximo golpe inimigo em você erra (até o seu próximo turno)', cor:'#9fd8ff' });
    if(s.bonusEsquiva) e.push({ txt:'🗡 ×'+s.bonusEsquiva+' de dano se você ESQUIVOU do último golpe inimigo', cor:'#c46bff' });
    if(s.modoFurtivo) e.push({ txt:'👤 liga o MODO FURTIVO por '+s.modoFurtivo+' turnos (metade do dano, +15% de esquiva)', cor:'#9fd8ff' });
    if(s.moita) e.push({ txt:'🌿 +35% de esquiva até o seu próximo turno', cor:'#7dff8a' });
    if(s.fumaca) e.push({ txt:s.fumaca.icone+' '+s.fumaca.nome+': +'+Math.round(s.fumaca.esquiva*100)+'% de esquiva pro seu time inteiro ('+s.fumaca.turnos+' rodadas)', cor:'#ff9ecb' });
    e.push({ txt: s.cd? '🕐 recarga '+s.cd+' turnos' : '🕐 sem recarga', cor:'#8a72b5' });
    if(s.super) e.push({ txt:'★ SUPER', cor:'#ffe066' });
    return e;
  }

  /* Qual animação a skill pede na batalha:
       corpo    -> o personagem VAI ATÉ o alvo e bate
       tiro     -> dispara/arremessa de longe
       foco     -> se concentra (buff, cura, terreno)                */
  const CORPO_A_CORPO = ['fisico','sangramento','sombrio'];
  function estilo(s){
    /* estiloAnim manda: serve para golpes cujo TIPO não descreve o
       movimento (a bolsada é 'fisico' mas é arremesso, não soco). */
    if(s.estiloAnim) return s.estiloAnim;
    if(s.alvo==='eu' || s.alvo==='aliados') return 'foco';
    if(s.alvo==='aliado') return 'tiro';          // o beijo voa até o aliado
    if(!s.dano) return 'tiro';                    // debuff de longe (smergulite)
    if(CORPO_A_CORPO.indexOf(s.tipo)>=0) return 'corpo';
    return 'tiro';
  }

  /* Rótulo curto do que o golpe CAUSA — aparece flutuando quando o
     golpe não tira vida (setup), senão nada apareceria na tela. */
  function rotulo(s){
    if(s.meditarStack) return '🤍 ATAQUE ×'+(s.meditarStack.mult||2);
    if(s.roubar) return '🎭 ROUBOU!';
    if(s.barreira) return s.barreira.icone+' '+s.barreira.nome.toUpperCase()+'!';
    if(s.fumaca) return s.fumaca.icone+' '+s.fumaca.nome.toUpperCase()+'!';
    if(s.alternaForma) return s.icone+' '+s.nome+'!';
    if(s.invocar) return '🐻 URSÃO!';
    if(s.moita)  return '🌿 NA MOITA!';
    if(s.sumico) return '👻 SUMIU!';
    if(s.fase)   return '👾 DESMATERIALIZOU!';
    if(s.confusao && !s.dano) return '😵 CONFUSO';
    if(s.ambiente) return s.ambiente.icone+' '+s.ambiente.nome.toUpperCase();
    if(s.estrutura) return s.estrutura.icone+' '+s.estrutura.nome.toUpperCase();
    if(s.lentidao)  return '❄ LENTO';
    if(s.dot)       return '⏳ '+s.dot.tipo.toUpperCase();
    if(s.buff)      return '⬆ '+s.buff.tipo.toUpperCase();
    if(s.terreno)   return '🌋 '+s.terreno.nome.toUpperCase();
    return null;
  }

  /* O golpe COMO ELE ESTÁ na forma atual do personagem (Mecas).
     Um lugar só para essa regra: o motor, o botão e a ficha usam
     esta função, então o que o jogador lê é o que vai sair.        */
  function skillNaForma(s, forma){
    if(s && s.formaOverride && s.formaOverride[forma||0])
      return Object.assign({}, s, s.formaOverride[forma||0]);
    return s;
  }

  return { TIPOS, PASSIVAS, FICHAS, MAGICOS, VENENO_TICK, ehMagia, ficha, tipo, passiva,
           etiquetas, alvoTxt, estilo, rotulo, skillNaForma };
})();
