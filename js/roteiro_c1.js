/* ============================================================
   ROTEIRO — CAPÍTULO 1: TEL AVIV, "03:33"
   ------------------------------------------------------------
   Controla o Mecas. O Marcelão Black JW criou ele (a lembrança de
   "voluntário" foi implantada), roubou o tempo de Tel Aviv (todo relógio
   parado em 03:33) e é o maior inimigo do Cargas.
   Elenco permitido aqui: Mecas, Cargas, Lambança, Marcelão, Strong Smerg
   + Serrinha Dog (caçadores de recompensa), Fat Mango e Mameluco
   (turistas de Limeira), o Careca (só citado), robôs e protótipos. A
   rainha Smergula NUNCA aparece em Tel Aviv — só é citada.

   ETAPA 1 (esta): Partes 1–4, do laboratório até o Cargas entrar no
   grupo (missões 1–14), + secundárias Hora Certa, Prova Que É Daqui e
   Pescador do Minuto. As Partes 5–10 entram na Etapa 2.
   ============================================================ */
(function(){
  const R = Missoes.def;
  const N = (texto, extra) => Object.assign({ quem:false, texto }, extra||{});
  const D = (quem, texto, extra) => Object.assign({ quem, texto }, extra||{});
  // fala de NPC sem ficha no elenco (desenho em código + nome)
  const P = (desenho, nome, texto) => ({ quem:null, desenho, nome, texto });
  const L = 'hans_lambanca';   // id do Lambança no elenco (o nome dele é só Lambança)

  /* inimigos reforçados (os mesmos números já medidos da versão em lista) */
  const SENTINELA = { nome:'Sentinela', hp:130, atk:12, def:5, spd:7 };
  const GELIDA    = { nome:'Sentinela Gélida', hp:175, atk:18, def:8, spd:9 };

  R.inicio({ area:'lab5000z', x:7, y:7, dir:0, grupo:['mecas'], lider:'mecas' });

  /* save antigo (lista de fases) → missões novas. Etapa 1 cobre até a fase 8. */
  R.migracao([
    { cap:'telaviv', fases:3, ate:'c1_guardiao' },
    { cap:'telaviv', fases:6, ate:'c1_documento' },
    { cap:'telaviv', fases:8, ate:'c1_inimigo' }
  ]);

  /* ================= ARQUIVO (lore descoberta explorando) ================= */
  R.arquivo('p_mecas',    { cat:'personagem', titulo:'Mecas', texto:'Unidade 5000Z. Acordou numa cápsula sem lembrar do próprio nome. Jura que não é máquina de ninguém. Tem metal onde devia ter pele e uma raiva que chegou antes de qualquer explicação.' });
  R.arquivo('p_lambanca', { cat:'personagem', titulo:'Lambança', texto:'Benzedor autodeclarado, guia turístico autonomeado, "nascido e criado em Tel Aviv". Tem sotaque, camiseta e documento de Limeira. Chama a cúpula dourada de "igrejinha da esquina".' });
  R.arquivo('p_cargas',   { cat:'personagem', titulo:'Cargas', texto:'O homem do raio. Era a BATERIA do laboratório: elétrico demais pra viver normal. Viu o que o Marcelão colocava dentro das cápsulas e nunca mais esqueceu. O maior inimigo do Ladrão de Tempo.' });
  R.arquivo('p_marcelao', { cat:'personagem', titulo:'M.B.JW', dica:'As iniciais estão gravadas em algum lugar do laboratório.', texto:'Marcelão Black JW, o Ladrão de Tempo. Criador do Projeto 5000Z. "Sem pressa: ele tem todo o tempo do mundo" — porque roubou o de uma cidade inteira.' });
  R.arquivo('lore_voluntario', { cat:'lore', titulo:'Voluntário nº 1', texto:'O registro diz que o Mecas assinou o termo SORRINDO. Na linha de baixo: "lembrança de consentimento implantada com sucesso". Ninguém implanta lembrança de quem consentiu de verdade.' });
  R.arquivo('lore_ordem_criador', { cat:'lore', titulo:'Ordem do Criador', texto:'"Ela é a única que deu certo. As outras 4999 vão pro ferro-velho." — o Marcelão, sobre o Mecas e os protótipos.' });
  R.arquivo('lore_0333',  { cat:'lore', titulo:'03:33', texto:'A hora em que Tel Aviv parou. Relógio de parede, de pulso, de forno, de celular, até a prancha de surf: todos em 03:33. O sol continua andando. Ninguém sabe se isso é bom.' });
  R.arquivo('lore_telaviv', { cat:'lore', titulo:'Tel Aviv vista de cima', texto:'Arranha-céus de vidro ao norte, a Cidade Velha murada no meio, o porto na baía, a praia inteira a leste. E a Torre do Relógio no centro, de ponteiros parados, olhando tudo.' });
  R.arquivo('lore_0334',  { cat:'lore', titulo:'03:34', dica:'Um dos relógios da cidade não concorda com os outros.', texto:'Um relógio do porto marca 03:34. Um minuto inteiro escapou do Marcelão. Onde foi parar esse minuto? O relojoeiro acha que alguém está guardando ele.' });
  R.arquivo('lore_limeira', { cat:'lore', titulo:'Provas de Limeira', dica:'O Lambança perdeu umas coisas pela cidade.', texto:'Carteirinha do clube de Limeira, foto na rotatória de Limeira, boletim da escola de Limeira, carnê da loja de Limeira e uma camiseta "LIMEIRA 1826". Ele jura que é tudo de Tel Aviv.' });
  R.arquivo('lore_minuto', { cat:'lore', titulo:'O Pescador do Minuto', dica:'Alguém no cais está esperando o peixe cair.', texto:'Um peixe ficou parado no ar no minuto 03:33, a meio caminho do balde. Solto, ele caiu no mar e saiu nadando. O pescador chorou. O peixe, não.' });
  R.arquivo('b_patrulha', { cat:'bestiario', titulo:'Robô de Patrulha', texto:'Unidade de produção do laboratório. Faz ronda, ilumina a rua com uma lanterna azul e anota tudo. Se te vê, solta um "!" e vem correndo.' });
  R.arquivo('b_sentinela',{ cat:'bestiario', titulo:'Sentinela', texto:'Robô de contenção com armadura reforçada. Foi feito pra segurar o Mecas. Não segurou.' });
  R.arquivo('b_gelida',   { cat:'bestiario', titulo:'Sentinela Gélida', texto:'Sentinela com um pedaço de tempo congelado no peito. Mais rápida, mais fria, mais chata.' });
  R.arquivo('b_guardiao', { cat:'bestiario', titulo:'Guardião do Portão', texto:'Robô duas vezes maior que os outros, com um relógio no lugar do peito. Os ponteiros caíram em 03:33 quando ele caiu.' });

  /* ================= COLETÁVEIS ================= */
  const relogios=[
    ['telaviv', 70.5,42, 'Relógio de rua da praça. 03:33. Um pombo está parado no ar bem em cima dele.'],
    ['telaviv', 88,44, 'Relógio da banca de peixe: 03:33. O peixe também parece surpreso.'],
    ['telaviv', 14,25, 'Relógio de ponto do laboratório: 03:33. Ninguém bateu o ponto de saída.'],
    ['telaviv', 49,56, 'Relógio da padaria: 03:33. O pão saiu do forno às 03:33 e continua saindo.'],
    ['telaviv', 104,70, 'Relógio do pátio da "igrejinha": 03:33. Alguém pendurou um terço nele.'],
    ['telaviv', 125,60, 'Relógio da subestação: 03:33. Os fios zumbem no ritmo dos ponteiros parados.'],
    ['telaviv', 130,20, 'Relógio do calçadão: 03:33. Embaixo, escrito a giz: "CADÊ O TEMPO?"'],
    ['telaviv', 131,70, 'Relógio da praia: 03:33. Um caranguejo está tentando dar corda nele.'],
    ['telaviv', 46,24, 'Relógio do Distrito das Torres: digital, 03:33, piscando. Piscar ele consegue.'],
    ['telaviv', 101,24, 'Relógio de sol na frente da torre dourada. A sombra se mexe. É o único relógio da cidade que funciona — e ninguém olha pra ele.'],
    ['telaviv', 25,80, 'Relógio pregado no portão do ferro-velho: 03:33. Tem uma etiqueta: "LOTE 5000".'],
    ['telaviv', 108,113, 'Relógio da ponta do cais. Ele marca… 03:34. UM minuto depois de todos os outros.', true]
  ];
  relogios.forEach((r,i)=>{
    const id='relogio_'+String(i+1).padStart(2,'0');
    R.coletavel(id, { tipo:'relogio', rotulo:'Relógios parados', nome:(r[4]?'⏰ ':'')+r[3].split('.')[0], texto:r[3], arquivo:r[4]?'lore_0334':null });
    R.obj(r[0], 'relogio_rua', r[1], r[2], { interagir:true, coletavel:id, verbo:'⏱ VER' });
  });
  const provas=[
    ['prova_carteirinha', 79,45, 'Carteirinha do Clube Recreativo de LIMEIRA. Sócio: Lambança. Foto: Lambança. Validade: "até Deus quiser".'],
    ['prova_foto', 133,52, 'Uma foto do Lambança sorrindo na frente de uma rotatória com uma placa enorme: "BEM-VINDO A LIMEIRA".'],
    ['prova_boletim', 30,54, 'Boletim escolar. Escola Estadual de Limeira. Nota em Geografia: 2,5. "Aluno insiste que Limeira tem praia."'],
    ['prova_carne', 117,93, 'Carnê das Casas Limeirenses. 12 parcelas de um ventilador. Pagas: 1.'],
    ['prova_camiseta', 58,30, 'Uma camiseta: "LIMEIRA 1826 — CAPITAL DA LARANJA". Tamanho G. Cheiro de igrejinha.']
  ];
  provas.forEach(pv=>{
    R.coletavel(pv[0], { tipo:'prova', rotulo:'Provas de Limeira', nome:pv[3].split('.')[0], texto:pv[3] });
    R.obj('telaviv', 'brilho', pv[1], pv[2], { interagir:true, coletavel:pv[0], verbo:'🔍 PEGAR', se:S=>S.comecou('sec_prova') });
  });
  const prots=[
    ['prot_1000z', null, null, 'Protótipo 1000Z: uma torradeira com um braço. Na etiqueta: "funciona (como torradeira)".'],
    ['prot_2000z', null, null, 'Protótipo 2000Z: o dobro do 1000Z. Duas torradeiras e dois braços. Ainda não é gente.'],
    ['prot_2500z', 6,30, 'Protótipo 2500Z: só a metade de cima. A metade de baixo "foi pro outro projeto".'],
    ['prot_3333z', 112,47, 'Protótipo 3333Z: parado num banco de praça, olhando pro relógio. Ele também ficou em 03:33.'],
    ['prot_4999z', 30,105, 'Protótipo 4999Z. Na etiqueta, uma palavra só, escrita à mão: "quase".']
  ];
  prots.forEach(pr=>{
    R.coletavel(pr[0], { tipo:'prototipo', rotulo:'Protótipos esquecidos', nome:pr[3].split(':')[0], texto:pr[3] });
    if(pr[1]!=null) R.obj('telaviv', 'prototipo', pr[1], pr[2], { interagir:true, coletavel:pr[0], verbo:'🔍 VER' });
  });
  [[37,39,'"A RAINHA VÊ. A RAINHA SABE. A RAINHA COBRA." — um cartaz roxo, colado por cima de um anúncio de sorvete.'],
   [123,39,'"SMERGULUS KINGDOM: O REINO QUE NÃO DORME." Alguém escreveu embaixo: "nem a gente, desde 03:33".'],
   [96,56,'"PROCURA-SE: ██████. CRIME: proibido de dizer por decreto real." O papel é do norte. A tinta ainda cheira a enxofre.']
  ].forEach((c,i)=>{
    const id='cartaz_'+(i+1);
    R.coletavel(id, { tipo:'cartaz', rotulo:'Cartazes da Rainha', nome:'Cartaz roxo nº '+(i+1), texto:c[2] });
    R.obj('telaviv', 'cartaz_rainha', c[0], c[1], { interagir:true, coletavel:id, verbo:'🔍 LER' });
  });

  R.viagem('v_lab',    { nome:'Laboratório 5000Z', area:'telaviv', x:13, y:23 });
  R.viagem('v_praca',  { nome:'Praça do Relógio',  area:'telaviv', x:63, y:44 });
  R.viagem('v_mercado',{ nome:'Mercado de Jaffa',  area:'telaviv', x:85, y:56 });
  R.viagem('v_porto',  { nome:'Porto',             area:'telaviv', x:112, y:95 });
  R.viagem('v_praia',  { nome:'Praia',             area:'telaviv', x:131, y:45 });

  /* ================= LUTAS ================= */
  let ordem=0;
  R.luta('lab_contencao', { cap:1, ordem:++ordem, condenacao:true, titulo:'Contenção', cenario:'laboratorio', time:['mecas'],
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
    antes:[ N('"UNIDADE 5000Z FORA DA CÁPSULA. INICIANDO PROTOCOLO DE CONTENÇÃO."', { nome:'ALTO-FALANTE', cenario:'laboratorio' }),
            D('mecas','Contenção? Eu não sou um bicho.'),
            N('Três ROBÔS DE PATRULHA fecham o corredor. Eles não vieram pedir licença.') ],
    depois:[ N('A sucata dos três robôs ainda fumega no chão.'),
             D('mecas','"...o que eu fiz. O QUE ELES FIZERAM COMIGO."', { pose:'hurt' }) ] });
  R.luta('lab_patrulha', { cap:1, titulo:'Ronda do Laboratório', cenario:'laboratorio', time:['mecas'], inimigos:['mecas_grunt','mecas_grunt'] });
  R.luta('guardiao', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, chefe:true, titulo:'O Guardião do Portão', cenario:'laboratorio', time:['mecas'],
    inimigos:['mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Guardião do Portão', hp:430, atk:36, def:8, danoMult:1.35, chefe:true }, {}] },   // ⚖ ~72% (sim. 600 lutas, IA nos dois lados)
    antes:[ N('O portão de saída. Na frente dele, um robô duas vezes maior que os outros, com um relógio no lugar do peito.', { cenario:'laboratorio' }),
            D('mecas_grunt','"UNIDADE 5000Z. RETORNE À CÁPSULA. ORDEM DO CRIADOR."', { nome:'GUARDIÃO DO PORTÃO' }),
            D('mecas','Que criador?'),
            D('mecas_grunt','"O CRIADOR NÃO TEM PRESSA. O CRIADOR TEM TODO O TEMPO DO MUNDO."', { nome:'GUARDIÃO DO PORTÃO' }),
            D('mecas','Então ele pode esperar mais um pouco. Sai da frente.', { pose:'special' }) ],
    depois:[ N('O relógio no peito do Guardião racha. Os ponteiros, parados em 03:33, caem no chão.'),
             D('mecas','"Todo o tempo do mundo"...'),
             N('O portão de saída destrava. Do lado de fora, o vento quente de uma cidade inteira.') ] });
  R.luta('mercado_sentinelas', { cap:1, ordem:++ordem, condenacao:true, titulo:'Mercado de Jaffa', cenario:'telaviv', time:'grupo',
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[SENTINELA, SENTINELA, SENTINELA] },
    antes:[ N('No meio do mercado congelado, três SENTINELAS passam de banca em banca, encostando um aparelho no peito dos feirantes parados.', { cenario:'telaviv' }),
            N('A cada encostada, o aparelho apita: "+1 MINUTO COLETADO".'),
            D('mecas','Vocês estão… colhendo o tempo deles?'),
            N('"UNIDADE 5000Z. VOCÊ TAMBÉM É PROPRIEDADE DO CRIADOR. AJOELHE."', { nome:'SENTINELA' }),
            D('mecas','Eu não ajoelho pra torradeira.', { pose:'special' }) ],
    depois:[ N('O aparelho cai e se abre. Dentro, um monte de minutinhos brilhando — e um deles escapa e entra no peito de uma feirante.'),
             P('marionete:2','FEIRANTE','...três e trinta e… três e trinta e QUATRO? Ah. Não. De novo 03:33.'),
             D('mecas','Por um segundo ela se mexeu. O tempo deles ainda está em algum lugar.') ] });
  R.luta('tour_robos', { cap:1, ordem:++ordem, condenacao:true, titulo:'O Pior Guia Turístico', cenario:'telaviv', time:['mecas', L],
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[SENTINELA, {}, SENTINELA] },
    antes:[ D(L,'Shhh! Tem robô vindo. Finge que é turista.', { cenario:'telaviv' }),
            D('mecas','Eu SOU turista.'),
            D(L,'Então finge que é DAQUI, que nem eu. Pai, abençoa essa trombada — LÁ VOU EU!', { pose:'special' }) ],
    depois:[ D(L,'Viu? Aqui em Tel Aviv a gente cuida de quem chega. Lá em Limeira já não é assim…'),
             D('mecas','Limeira?'),
             D(L,'Que Limeira? Eu disse Limeira? Nunca nem ouvi falar.') ] });
  R.luta('cargas_apagao', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, titulo:'Raio na Avenida', cenario:'telaviv', time:['mecas'],
    inimigos:['cargas'], ajustes:{ inimigo:[{ hp:330, atk:24, danoMult:1.35, chefe:true }] },   // ⚖ ~65% com o bônus de +10 que se tem nesse ponto (52% sem bônus)
    antes:[ N('E então um RAIO cai no meio da avenida — e não vai embora. Fica ali, estalando, com um homem dentro.', { cenario:'telaviv' }),
            D('cargas','Cheiro de 5000Z. Eu reconheço esse metal de longe.', { pose:'special' }),
            D('mecas','Eu não sei quem você é.'),
            D('cargas','Mas eu sei O QUE você é. Uma máquina do Marcelão. E máquina do Marcelão eu desligo.') ],
    depois:[ D('cargas','Uma máquina dele teria me matado no primeiro golpe. Você… hesitou.', { pose:'hurt' }),
             D('mecas','Eu não sou máquina dele. Eu só quero saber quem me fez.'),
             D('cargas','Então a gente quer a mesma coisa. Eu sou o Cargas.'),
             D('cargas','E o homem que te fez é o maior inimigo que eu tenho nessa vida.') ] });
  R.luta('sentinelas_geladas', { cap:1, ordem:++ordem, condenacao:true, titulo:'O Inimigo do Meu Inimigo', cenario:'telaviv', time:['mecas','cargas'],
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[GELIDA, GELIDA, GELIDA] },
    antes:[ D('cargas','Abaixa! Sentinelas — e das GELADAS. Ele mandou o estoque bom.', { pose:'special', cenario:'telaviv' }),
            D('mecas','Você fica com a da esquerda?'),
            D('cargas','Eu fico com as três. Você fica com o que sobrar. Vai sobrar pouco.') ],
    depois:[ N('As três Sentinelas Gélidas caem derretendo. No peito de cada uma, um relógio de bolso marcando 03:33.'),
             D('cargas','Ele coloca o tempo roubado dentro delas. Por isso são rápidas. Por isso são frias.') ] });
  R.luta('patrulha_rua', { cap:1, titulo:'Patrulha', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt','mecas_grunt'] });
  R.luta('patrulha_dupla', { cap:1, titulo:'Patrulha Reforçada', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[SENTINELA,{},{}] } });

  /* ================= INIMIGOS VISÍVEIS ================= */
  R.inimigo('robo_lab_1', { desenho:'robo', em:['lab5000z', 24, 8], rota:[[20,8],[32,8],[32,10],[20,10]], visao:5, luta:'lab_contencao', se:S=>S.comecou('c1_contencao') });
  R.inimigo('robo_lab_2', { desenho:'robo', em:['lab5000z', 30, 26], rota:[[20,26],[33,26]], visao:4, luta:'lab_patrulha', se:S=>S.feita('c1_contencao') });
  R.inimigo('guardiao', { desenho:'sentinela', em:['lab5000z', 8, 26], visao:3, vel:0, velPerseguir:60, luta:'guardiao', se:S=>!S.flag('guardiao_vencido') });
  R.inimigo('sentinelas_mercado', { desenho:'sentinela', em:['telaviv', 86, 50], rota:[[80,50],[92,50]], visao:4, luta:'mercado_sentinelas', se:S=>S.comecou('c1_mercado') });
  R.inimigo('patrulha_1', { desenho:'robo', em:['telaviv', 40, 41], rota:[[34,40],[56,40]], visao:4, luta:'patrulha_rua', se:S=>S.feita('c1_guardiao') });
  R.inimigo('patrulha_2', { desenho:'robo', em:['telaviv', 100, 22], rota:[[90,22],[122,22]], visao:4, luta:'patrulha_rua', se:S=>S.feita('c1_guardiao') });
  R.inimigo('patrulha_3', { desenho:'robo', em:['telaviv', 118, 57], rota:[[104,57],[124,57]], visao:4, luta:'patrulha_rua', se:S=>S.feita('c1_guardiao') });
  R.inimigo('patrulha_4', { desenho:'sentinela', em:['telaviv', 28, 70], rota:[[22,64],[22,80]], visao:5, luta:'patrulha_dupla', se:S=>S.feita('c1_guardiao') });
  R.inimigo('patrulha_5', { desenho:'robo', em:['telaviv', 112, 88], rota:[[104,88],[126,88]], visao:4, luta:'patrulha_rua', se:S=>S.feita('c1_mercado') });

  /* ================= MISSÕES PRINCIPAIS ================= */

  /* ---- Parte 1 · Laboratório 5000Z ---- */
  R.missao('c1_capsula', { cap:1, titulo:'Cápsula 5000Z', resumo:'Você acordou numa cápsula, sem lembrar nem o próprio nome.',
    retorno:['lab5000z', 7, 7],
    passos:[
      { tipo:'cena', obj:'Acorde', cenario:'laboratorio', legenda:'CAPÍTULO 1 · 03:33',
        cena:[ N('LABORATÓRIO 5000Z. A cápsula se abre num jato de vapor — e ele desperta sem lembrar nem o próprio nome.', { cenario:'laboratorio' }),
               D('mecas','...onde… onde eu tô?', { forma:0, pose:'hurt' }),
               N('As pernas tremem. Os braços não obedecem como antes. Tem metal onde deveria ter pele.'),
               D('mecas','O que fizeram comigo? QUEM fez isso comigo?!', { forma:1, pose:'special' }),
               N('A raiva chega antes de qualquer explicação. Os implantes terminam de ligar, um por um.'),
               D('mecas','...', { forma:2, pose:'special', nome:'CIBORGUE 5000Z' }),
               N('Na lateral da cápsula, uma plaquinha de metal: PROPRIEDADE DE M.B.JW.') ],
        aoConcluir:[ { flag:'acordou' }, { arquivo:'p_mecas' }, { arquivo:'p_marcelao' } ] },
      { tipo:'ir', obj:'Teste as pernas: ande até o terminal (setas, WASD ou o joystick)', alvo:['lab5000z', 3, 6, 1.8],
        aoIniciar:[ { fala:[ N('🕹 Ande com as SETAS / WASD (no celular, arraste o dedo na metade esquerda da tela). Segure SHIFT pra correr.'),
                             D('mecas','As pernas funcionam. Pelo menos isso.') ] } ] }
    ] });

  R.missao('c1_registro', { cap:1, titulo:'Registro do Voluntário', requer:['c1_capsula'], resumo:'Os terminais do laboratório guardam registros sobre você. Não batem com o que você lembra.',
    retorno:['lab5000z', 7, 7],
    passos:[
      { tipo:'investigar', obj:'Leia os dois terminais da sala (E / Ⓐ perto deles)', objetos:['term_registro','term_memoria'],
        aoIniciar:[ { fala:[ N('💬 Pra mexer em algo ou falar com alguém, chegue perto e aperte E (no celular, o botão Ⓐ).') ] } ],
        aoConcluir:[ { fala:[ D('mecas','"Assinou o termo sorrindo." Eu não lembro de ter sorrido pra ninguém.'),
                              D('mecas','Eu não lembro de NADA. Só de acordar.'),
                              D('mecas','...e se a lembrança de ter me oferecido for a coisa mais falsa daqui?') ] } ] }
    ],
    recompensa:{ arquivo:['lore_voluntario'] } });

  R.missao('c1_contencao', { cap:1, titulo:'Contenção', requer:['c1_registro'], resumo:'O alarme disparou. O laboratório não quer deixar você sair.',
    retorno:['lab5000z', 20, 8],
    passos:[
      { tipo:'ir', obj:'Entre na Ala de Contenção (a grade abriu)', alvo:['lab5000z', 19, 8, 2],
        aoIniciar:[ { fala:[ N('Luzes vermelhas. Uma sirene que não para.'),
                             N('"UNIDADE 5000Z FORA DA CÁPSULA. INICIANDO PROTOCOLO DE CONTENÇÃO."', { nome:'ALTO-FALANTE' }),
                             N('A grade da Ala de Contenção sobe sozinha. Do outro lado: rodinhas fazendo ronda.'),
                             N('⚔ Inimigos andam pelo mapa. Se um deles te VIR, aparece um "!" e ele vem correndo. Encostou, é luta.') ] } ] },
      { tipo:'luta', obj:'Derrote a patrulha de contenção', luta:'lab_contencao', inimigo:'robo_lab_1' }
    ],
    recompensa:{ arquivo:['b_patrulha'] } });

  R.missao('c1_prototipos', { cap:1, titulo:'Sala dos Protótipos', requer:['c1_contencao'], resumo:'Uma sala cheia de robôs quebrados com o seu rosto. Em algum lugar, um cartão de acesso.',
    retorno:['lab5000z', 25, 20],
    passos:[
      { tipo:'ir', obj:'Desça até a Sala dos Protótipos', alvo:['lab5000z', 26, 18, 2.5],
        aoConcluir:[ { fala:[ N('Fileiras de robôs desligados. Todos com o mesmo rosto. O SEU rosto. Mais velho, mais novo, pela metade.'),
                              D('mecas','1000Z… 2000Z… quantos antes de mim?'),
                              N('🔸 Alguns protótipos dá pra examinar. Eles vão pro ARQUIVO (menu ☰ / Esc) — junto com tudo que você descobrir.') ] } ] },
      { tipo:'investigar', obj:'Ache o cartão de acesso (o baú no fundo da sala)', objetos:['cartao_lab'] }
    ],
    recompensa:{ flag:['cartao_lab'], arquivo:['lore_ordem_criador'] } });

  R.missao('c1_guardiao', { cap:1, titulo:'O Guardião do Portão', requer:['c1_prototipos'], resumo:'A grade do saguão aceitou o cartão. Entre você e a rua, uma máquina enorme.',
    retorno:['telaviv', 13, 23],
    passos:[
      { tipo:'ir', obj:'Atravesse a grade até o Saguão do Portão', alvo:['lab5000z', 12, 23, 2.5],
        aoIniciar:[ { fala:[ N('BIP. A grade lê o cartão, hesita… e abre.'), N('🕯 No saguão tem um LAMPIÃO: interagir com ele salva o jogo. Se perder uma luta, você volta pro último ponto salvo.') ] } ] },
      { tipo:'luta', obj:'Vença o Guardião do Portão', luta:'guardiao', inimigo:'guardiao' }
    ],
    recompensa:{ flag:['guardiao_vencido'], arquivo:['b_guardiao','b_sentinela'], bonusHp:5 } });

  /* ---- Parte 2 · A cidade parada ---- */
  R.missao('c1_0333', { cap:1, titulo:'03:33', requer:['c1_guardiao'], resumo:'Uma cidade inteira de relógios parados no mesmo minuto.',
    retorno:['telaviv', 63, 44],
    passos:[
      { tipo:'ir', obj:'Saia do laboratório', alvo:['telaviv', 13, 22, 3], onde:'Porta do Saguão do Portão',
        aoConcluir:[ { cena:[ N('TEL AVIV. Torres de vidro de um lado, cúpulas douradas do outro, e o mar engolindo o sol.', { cenario:'telaviv' }),
               N('Carros parados no meio da avenida. Um pombo parado no meio do voo. Gente parada no meio da frase.'),
               D('mecas','Ninguém se mexe.'),
               N('Num relógio de rua, os ponteiros apontam pra mesma hora de todos os outros relógios: 03:33.') ], cenario:'telaviv', legenda:'CAPÍTULO 1 · A CIDADE PARADA' } ] },
      { tipo:'ir', obj:'Vá até a Praça do Relógio', alvo:['telaviv', 64, 41, 3], onde:'Praça do Relógio (siga a Avenida do Relógio pro leste)',
        aoConcluir:[ { fala:[ D('mecas','A Torre do Relógio. Os ponteiros… parados em 03:33 também.'),
                              D('mecas','Mas tem gente falando. Alguém aqui ainda se mexe — mais ou menos.') ] } ] },
      { tipo:'falar', obj:'Fale com o homem atrasado na praça', npc:'loop_1',
        cena:[ P('cidadao:0','HOMEM DE GRAVATA','São 03:33. Eu tô atrasado pro trabalho. São 03:33. Eu tô atrasado pro trabalho. São 03:33.'),
               D('mecas','Ei. Ei! Você tá me ouvindo?'),
               P('cidadao:0','HOMEM DE GRAVATA','São 03:33. Eu tô atras— …quem é você? …São 03:33. Eu tô atrasado pro trabalho.'),
               D('mecas','Por meio segundo ele me viu.') ] },
      { tipo:'falar', obj:'Fale com a feirante do mercado', npc:'loop_2',
        cena:[ P('marionete:2','FEIRANTE','Laranja fresquinha! Três reais! Laranja fresquinha! Três reais! Laranja fres—'),
               D('mecas','Quanto tempo faz que você tá gritando isso?'),
               P('marionete:2','FEIRANTE','Três reais. …Três minutos? Três horas? Três… três e trinta e três. Laranja fresquinha!') ] },
      { tipo:'falar', obj:'Fale com o turista na beira da praia', npc:'loop_3',
        cena:[ P('cidadao:3','TURISTA','Tira a foto! Tira a foto! Tira a fo— a câmera não bate. A câmera não bate. Tira a foto!'),
               D('mecas','Deixa eu ver a câmera.'),
               N('No visor, a última foto tirada: a Torre do Relógio, e no alto dela, um homem de chapéu olhando pra baixo. 03:33.'),
               D('mecas','Alguém estava na torre na hora que tudo parou.') ] },
      { tipo:'cena', obj:'Pense no que viu',
        fala:[ D('mecas','Todo mundo preso no mesmo minuto. Como se alguém tivesse ROUBADO o resto.'),
               D('mecas','"O criador tem todo o tempo do mundo." M.B.JW. Foi ele.') ] }
    ],
    recompensa:{ arquivo:['lore_0333'] } });

  R.missao('c1_mirantes', { cap:1, titulo:'Do Alto Dá Pra Ver', requer:['c1_0333'], resumo:'Três lugares altos da cidade. De lá dá pra entender o tamanho do estrago.',
    retorno:['telaviv', 63, 44],
    passos:[
      { tipo:'investigar', obj:'Olhe a cidade dos três mirantes', objetos:['mirante_terraco','mirante_porto','mirante_praia'], onde:'Distrito das Torres, Porto e Praia',
        aoIniciar:[ { fala:[ N('📜 Aperte J (ou 📜) pra abrir o DIÁRIO e MARCAR a missão que quer seguir. A missão marcada ganha uma SETA na borda da tela e um ◆ no chão.'),
                             N('🗺 Aperte M (ou 🗺) pro MAPA DO MUNDO. Tab esconde o minimapa.') ] } ] }
    ],
    recompensa:{ arquivo:['lore_telaviv'], bonusHp:5 } });

  R.missao('c1_mercado', { cap:1, titulo:'Mercado de Jaffa Congelado', requer:['c1_0333'], resumo:'Alguma coisa está passando de banca em banca no mercado, recolhendo o tempo das pessoas.',
    retorno:['telaviv', 85, 56],
    passos:[
      { tipo:'ir', obj:'Vá até o Mercado de Jaffa', alvo:['telaviv', 85, 50, 4], onde:'Mercado de Jaffa (leste da praça)' },
      { tipo:'luta', obj:'Derrube as Sentinelas que colhem o tempo', luta:'mercado_sentinelas', inimigo:'sentinelas_mercado' }
    ] });

  /* ---- Parte 3 · "Eu sou daqui." ---- */
  R.missao('c1_guia', { cap:1, titulo:'O Guia Que Ninguém Pediu', requer:['c1_mercado'], resumo:'Um sujeito na frente da cúpula dourada não está congelado. E está FALANDO. Muito.',
    retorno:['telaviv', 103, 67],
    passos:[
      { tipo:'falar', obj:'Fale com o homem na frente da "igrejinha"', npc:'lambanca_igreja', onde:'A "Igrejinha" (a cúpula dourada, sul do mercado)',
        cena:[ D(L,'Opa, opa! Primeira vez em Tel Aviv? Seja bem-vindo à MINHA cidade!'),
               D('mecas','Você… se mexe. Por que você se mexe?'),
               D(L,'Porque eu sou abençoado, irmão. E porque eu cheguei aqui DEPOIS das 03:33. Quer dizer — eu nasci aqui. Nascido e criado.'),
               D('mecas','Isso não faz sentido.'),
               D(L,'Do ladinho da igrejinha, ó. Aquela ali.'),
               D('mecas','Aquilo é uma cúpula dourada.'),
               D(L,'É a igrejinha da esquina. Sempre foi. Deus abençoe. Prazer: Lambança. De Tel Aviv.'),
               D(L,'Cê tá perdido, eu tô sem nada pra fazer, a cidade tá parada. Deixa que eu te mostro tudo!') ],
        depoisFala:[ { grupo:'+'+L }, { arquivo:'p_lambanca' } ] }
    ] });

  R.missao('c1_tour', { cap:1, titulo:'Tour Oficial', requer:['c1_guia'], resumo:'O Lambança vai te mostrar "a cidade dele". Nada do que ele fala é verdade.',
    retorno:['telaviv', 47, 65],
    passos:[
      { tipo:'ir', obj:'Tour, parada 1: a Torre do Relógio', alvo:['telaviv', 68, 39, 2.5],
        aoConcluir:[ { fala:[ D(L,'À esquerda, a famosa Torre do Relógio. Eu ajudei a construir quando era criança.'),
                              D('mecas','Ela parece ter uns duzentos anos.'),
                              D(L,'Eu fui uma criança MUITO prestativa.') ] } ] },
      { tipo:'ir', obj:'Tour, parada 2: a praia', alvo:['telaviv', 131, 42, 3],
        aoConcluir:[ { fala:[ D(L,'A praia onde eu aprendi a nadar. No Rio Piracicaba.'),
                              D('mecas','O Rio Piracicaba não fica aqui.'),
                              D(L,'Fica no coração, irmão. No coração.') ] } ] },
      { tipo:'ir', obj:'Tour, parada 3: o porto', alvo:['telaviv', 112, 79, 3],
        aoConcluir:[ { fala:[ D(L,'O porto. Daqui saem os navios pra Limeira— pra LISBOA. Lisboa. Eu disse Lisboa.'),
                              D('mecas','Você disse Limeira.'),
                              D(L,'Sotaque, irmão. Sotaque de Tel Aviv. É forte.') ] } ] },
      { tipo:'ir', obj:'Tour, parada 4: a padaria', alvo:['telaviv', 47, 64, 2.5],
        aoConcluir:[ { fala:[ D(L,'E aqui, a Padaria Pão do Minuto. Melhor pão da cidade. O dono é meu primo. Ou era. Tá congelado ali dentro desde 03:33.'),
                              D('mecas','...Os ponteiros daquela torre não se mexem.'),
                              D(L,'Shhh! Tem robô vindo.') ] } ] },
      { tipo:'luta', obj:'Robôs de patrulha!', luta:'tour_robos', aoIniciar:[ { luta:'tour_robos' } ] }
    ],
    recompensa:{ bonusHp:5 } });

  R.missao('c1_documento', { cap:1, titulo:'Documento', requer:['c1_tour'], resumo:'Caiu alguma coisa do bolso do Lambança na briga.',
    retorno:['telaviv', 47, 65],
    passos:[
      { tipo:'cena', obj:'O que caiu do bolso dele?',
        fala:[ N('No chão, onde o Lambança estava brigando, um documento plastificado.'),
               D('mecas','"Registro Geral. Nome: Lambança. Naturalidade: LIMEIRA-SP."'),
               D(L,'FALSIFICAÇÃO! Coisa dos invejosos! Me dá isso aqui.'),
               N('Ele pega o documento… e come. Inteiro. Com plástico e tudo.'),
               D(L,'Pronto. Que documento? Nunca teve documento.'),
               D('mecas','Você comeu um RG.'),
               D(L,'E faria de novo. Sou de Tel Aviv, irmão. Aqui a gente come o que precisa.') ] }
    ] });

  /* ---- Parte 4 · O homem do raio ---- */
  R.missao('c1_apagao', { cap:1, titulo:'Apagão', requer:['c1_documento'], resumo:'A cidade inteira apagou de uma vez. A subestação do porto está chiando.',
    retorno:['telaviv', 112, 70],
    passos:[
      { tipo:'ir', obj:'Vá até a subestação do porto', alvo:['telaviv', 116, 70, 3], onde:'Subestação do Porto (leste da "igrejinha")',
        aoIniciar:[ { fala:[ N('E então tudo apaga de uma vez. Torres, postes, letreiros, até a luz da padaria. Silêncio.') ] },
                    { flag:'apagao' },
                    { fala:[ D(L,'Eita. Isso é sinal de Deus. Ou da companhia de luz.'),
                             D(L,'Eu… vou ali comprar um pão. Pra benzer. Pro escuro. Boa sorte, amigo! Deus te abençoe!'),
                             D('mecas','A padaria tá fechada. Tá todo mundo congelado.'),
                             N('Ele já foi.') ] },
                    { grupo:'-'+L } ] }
    ] });

  R.missao('c1_raio', { cap:1, titulo:'Raio na Avenida', requer:['c1_apagao'], resumo:'Um raio caiu na frente da subestação e não foi embora. Tem um homem dentro dele.',
    retorno:['telaviv', 112, 70],
    passos:[
      { tipo:'luta', obj:'Enfrente o homem do raio', npc:'cargas_rua', luta:'cargas_apagao',
        cena:[ D('cargas','Fica aí. Mais um passo e eu te desmonto parafuso por parafuso.'),
               D('mecas','Você apagou a cidade?'),
               D('cargas','Eu PEGUEI a energia da cidade. Pra caçar o que sobrou do laboratório. E olha só o que apareceu.') ] }
    ],
    recompensa:{ arquivo:['p_cargas'] } });

  R.missao('c1_inimigo', { cap:1, titulo:'O Inimigo do Meu Inimigo', requer:['c1_raio'], resumo:'O Cargas sabe quem te criou. E as Sentinelas Gélidas estão chegando.',
    retorno:['telaviv', 112, 70],
    passos:[
      { tipo:'cena', obj:'Ouça o Cargas',
        fala:[ D('cargas','Marcelão Black JW. O Ladrão de Tempo. Foi ele que criou você — e o Protocolo 5000Z inteiro.'),
               D('cargas','Anos atrás a gente trabalhava junto. Eu era a bateria do laboratório: elétrico demais pra viver normal.'),
               D('cargas','Ele usava a minha energia pra ligar as cápsulas. Um dia eu vi o que ele colocava lá dentro.'),
               D('mecas','O quê?'),
               D('cargas','Gente. Gente de Tel Aviv. Ele rouba o tempo delas e transforma no que ele quiser.'),
               D('mecas','Então eu era…', { pose:'hurt' }),
               D('cargas','Uma pessoa. Antes dele.') ] },
      { tipo:'luta', obj:'Sentinelas Gélidas!', luta:'sentinelas_geladas', aoIniciar:[ { luta:'sentinelas_geladas' } ] },
      { tipo:'cena', obj:'Decidam o que fazer',
        fala:[ D('cargas','Escuta, lata. Eu não confio em nada que saiu daquele laboratório.'),
               D('cargas','Mas você hesitou na hora de me acertar. Máquina dele não hesita.'),
               D('mecas','Então vem comigo. A gente acha ele junto.'),
               D('cargas','…Eu vou atrás. Literalmente: eu vou ATRÁS de você. Se você virar pra mim do jeito errado, eu te desligo.'),
               D('cargas','Toma, devolvi a luz da cidade. Os relógios continuam parados. Isso eu não consigo consertar.') ],
        aoConcluir:[ { grupo:'+cargas' }, { flag:'apagao', v:false } ] }
    ],
    recompensa:{ arquivo:['b_gelida'], bonusHp:5, texto:'o Cargas segue o Mecas pelo mapa' } });

  /* ================= SECUNDÁRIAS ================= */
  R.missao('sec_hora_certa', { cap:1, tipo:'secundaria', titulo:'Hora Certa', doador:'relojoeiro', requer:['c1_0333'],
    resumo:'O relojoeiro da praça quer saber se TODOS os relógios da cidade pararam no mesmo minuto. São 12 espalhados por aí.',
    oferta:[ P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','Rapaz! Você anda. Que inveja. Eu tô preso nesse banco faz… bom, 03:33.'),
             P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','Eu conheço cada relógio desta cidade. Doze relógios públicos. Se UM só tiver andado, a gente sabe que o tempo não sumiu: foi guardado.'),
             P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','Vai lá e confere os doze pra mim? Eu ia, mas meus joelhos estão em 03:33.') ],
    passos:[
      { tipo:'coletar', obj:'Confira os relógios da cidade', coletar:'relogio', quantos:12, onde:'Espalhados por Tel Aviv (o ⏱ do minimapa)' },
      { tipo:'falar', obj:'Conte pro relojoeiro', npc:'relojoeiro',
        cena:[ D('mecas','Onze marcam 03:33. O da ponta do cais marca 03:34.'),
               P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','UM MINUTO! Um minuto inteiro escapou! Então o tempo não morreu, rapaz. Alguém está segurando.'),
               P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','E quem segura, solta. Toma: pra você não perder a hora quando ela voltar.') ] }
    ],
    recompensa:{ arquivo:['lore_0334'], bonusHp:5 } });

  R.missao('sec_prova', { cap:1, tipo:'secundaria', titulo:'Prova Que É Daqui', doador:'lambanca_padaria', requer:['c1_apagao'],
    resumo:'O Lambança perdeu "documentos de Tel Aviv" pela cidade. Todo documento que você acha é de Limeira.',
    oferta:[ D(L,'Amigo! Que bom te ver. Eu tava aqui comprando pão… a padaria tá fechada… eu tô comendo o pão da vitrine. Deus abençoe a vitrine.'),
             D(L,'Escuta: eu perdi umas coisas na correria. PROVAS de que eu sou de Tel Aviv. Carteirinha, foto, essas coisas.'),
             D(L,'Acha pra mim? Aí ninguém mais duvida. Nem você. Principalmente você.') ],
    passos:[
      { tipo:'coletar', obj:'Ache as "provas" do Lambança', coletar:'prova', quantos:5, onde:'Mercado, praia, casas, porto e torres' },
      { tipo:'falar', obj:'Leve as provas pro Lambança', npc:'lambanca_padaria',
        cena:[ D('mecas','Carteirinha do clube de LIMEIRA. Foto na rotatória de LIMEIRA. Boletim da escola de LIMEIRA. Carnê das Casas LIMEIRENSES. Camiseta "LIMEIRA 1826".'),
               D(L,'Viu? Tudo provando que eu sou de Tel Aviv.'),
               D('mecas','Está escrito Limeira em TODAS.'),
               D(L,'É o nome do bairro, irmão. Limeira. Bairro de Tel Aviv. Fica ali depois da igrejinha.'),
               D('mecas','…'),
               D(L,'Obrigado, amigo. Deus te abençoe. Toma um pão. É de Tel Aviv. A embalagem diz Limeira, mas o pão é daqui.') ] }
    ],
    recompensa:{ arquivo:['lore_limeira'], bonusHp:5 } });

  R.missao('sec_pescador', { cap:1, tipo:'secundaria', titulo:'Pescador do Minuto', doador:'pescador', requer:['c1_0333'],
    resumo:'Um pescador no cais está esperando o peixe cair no balde desde 03:33.',
    oferta:[ P('cidadao:6','SEU NAHUM, O PESCADOR','Shhh. Não assusta ele.'),
             P('cidadao:6','SEU NAHUM, O PESCADOR','Ele pulou da água às 03:33 e ficou lá. No ar. Na ponta do cais. Eu tô esperando ele cair no balde.'),
             P('cidadao:6','SEU NAHUM, O PESCADOR','Faz… sei lá quanto tempo. Vai lá ver se ele tá bem?') ],
    passos:[
      { tipo:'investigar', obj:'Veja o peixe parado no ar', objetos:['peixe_no_ar'], onde:'Ponta do cais (porto)' },
      { tipo:'falar', obj:'Conte pro pescador', npc:'pescador',
        cena:[ D('mecas','Eu encostei nele. Ele caiu no mar e saiu nadando.'),
               P('cidadao:6','SEU NAHUM, O PESCADOR','…'),
               P('cidadao:6','SEU NAHUM, O PESCADOR','Ele estava LIVRE esse tempo todo e eu segurando a vara. Que lição. Que peixe.'),
               P('cidadao:6','SEU NAHUM, O PESCADOR','(chorando) Boa viagem, Moshe.') ] }
    ],
    recompensa:{ arquivo:['lore_minuto'] } });
  R.obj('telaviv', 'brilho', 107.5, 113, { interagir:true, investigar:'peixe_no_ar', verbo:'🐟 TOCAR', se:S=>S.comecou('sec_pescador') && !S.flag('viu:peixe_no_ar'),
    texto:['Um peixe prateado, parado no ar, com cara de quem ia mudar de ideia.', 'Você encosta nele com o dedo de metal. PLOFT. Ele cai na água e some num rabanete de espuma.'] });

  /* ================= NPCs DA HISTÓRIA ================= */
  R.npc('loop_1', { desenho:'cidadao:0', nome:'HOMEM DE GRAVATA', em:['telaviv', 60, 39], dir:0,
    falas:['São 03:33. Eu tô atrasado pro trabalho. São 03:33. Eu tô atrasado pro trabalho.'] });
  R.npc('loop_2', { desenho:'marionete:2', nome:'FEIRANTE', em:['telaviv', 82, 49], dir:0,
    falas:['Laranja fresquinha! Três reais! Laranja fresquinha! Três reais!'] });
  R.npc('loop_3', { desenho:'cidadao:3', nome:'TURISTA', em:['telaviv', 130, 47], dir:2,
    falas:['Tira a foto! Tira a foto! A câmera não bate!'] });
  R.npc('relojoeiro', { desenho:'cidadao:4', nome:'SEU EZEQUIEL, O RELOJOEIRO', em:['telaviv', 70, 45], dir:0,
    falas:[ { se:S=>S.feita('sec_hora_certa'), cena:['03:34. Eu repito isso antes de dormir. Bom… eu não durmo. Mas repito.'] },
            { cena:['Cada relógio tem uma voz, rapaz. Esses estão todos calados no mesmo tom.'] } ] });
  R.npc('pescador', { desenho:'cidadao:6', nome:'SEU NAHUM, O PESCADOR', em:['telaviv', 117, 101], dir:3,
    falas:[ { se:S=>S.feita('sec_pescador'), cena:['Eu pesco de novo quando o relógio voltar. Desta vez eu solto. Ou não.'] },
            { cena:['Shhh.'] } ] });
  R.npc('lambanca_igreja', { char:L, nome:'Lambança', em:['telaviv', 103, 66], dir:0, se:S=>S.comecou('c1_guia') && !S.feita('c1_guia') });
  R.npc('lambanca_padaria', { char:L, nome:'Lambança', em:['telaviv', 47, 64], dir:0, se:S=>S.feita('c1_apagao') && !S.noGrupo(L) && !S.depois('c1_torre',7),
    falas:[ { se:S=>S.feita('sec_prova'), cena:['Bairro Limeira, irmão. Depois da igrejinha. Pergunta pra qualquer um. Eles estão congelados, mas pergunta.'] },
            { cena:['Pão de vitrine. Três minutos de idade. Três minutos e trinta e três segundos, na verdade. Deus abençoe.'] } ] });
  R.npc('cargas_rua', { char:'cargas', nome:'Cargas', em:['telaviv', 116, 75], dir:3, se:S=>S.comecou('c1_raio') && !S.feita('c1_raio') });

  /* ================= GENTE DA CIDADE (presa no minuto) ================= */
  const rua = (id, d, x, y, falas, anda) => R.npc(id, { desenho:d, nome:'', em:['telaviv', x, y], dir:0, anda:anda||{ tipo:'parado' }, falas });
  rua('cid_1','cidadao:1', 30,41, ['Eu ia atravessar a rua. Eu ia. Às 03:33. Ainda vou.','O sinal fechou faz uma eternidade. Será que abre?']);
  rua('cid_2','marionete:5', 52,44, ['…três… e trinta… e três…','(os olhos dele são azuis e gelados, como gelo de geladeira)']);
  rua('cid_3','cidadao:2', 76,57, ['Eu juro que eu tava andando e de repente tava parada. Mas aí você chegou e eu tô falando. Isso é bom ou ruim?','Se você achar o meu minuto, me devolve? Era um minuto bom.'], { tipo:'vagar', r:2 });
  rua('cid_4','cidadao:5', 92,57, ['Shalom! Você também acha que o sol está andando e os relógios não? Meu rabino diz que é um sinal. Meu mecânico diz que é a bateria.']);
  rua('cid_5','cidadao:7', 124,44, ['O mar continua indo e vindo. Pelo menos alguém aqui tem rotina.','Dizem que o homem do chapéu subiu na torre às 03:32. Às 03:34 ninguém viu mais nada. Porque não teve 03:34.']);
  rua('cid_6','marionete:0', 104,74, ['Minha esposa disse "volto em um minuto". Ela foi pegar um café às 03:32.']);
  rua('cid_7','cidadao:4', 36,62, ['Na minha época os robôs não andavam na rua. Na minha época tinha 03:34.']);
  rua('cid_8','cidadao:6', 118,96, ['O porto parou. Os navios pararam. As gaivotas… essas nunca trabalham mesmo.'], { tipo:'vagar', r:3 });
  rua('cid_9','cidadao:3', 131,60, ['Vim pra Tel Aviv pela praia. A praia é linda. Eu só queria que o sol se pusesse logo, faz… ué, ele se pôs ontem? Teve ontem?'], { tipo:'vagar', r:3 });
  rua('cid_10','cidadao:2', 58,24, ['Trabalho no 33º andar. Que ironia, né? Andar 33. Hora 03:33. Eu ia descer às 03:34.']);
  rua('cid_11','marionete:7', 88,24, ['Eu sou corretor de imóveis. Apartamento com vista pra torre que não anda. Ótimo negócio.']);
  rua('cid_12','cidadao:0', 18,43, ['Aquele laboratório ali? Ninguém entra. Saem uns robôs às vezes. Ontem saiu um de óculos. …Era você?']);
  rua('cid_13','cidadao:5', 70,50, ['Eu vendo pipoca na praça. A pipoca não estoura. Fica todo mundo esperando o "plec". O "plec" não vem.']);
  rua('cid_14','cidadao:1', 110,48, ['Meu filho foi atrás de um homem com um esfregão na Cidade Velha. Disse que era amigo de infância de alguém. Faz tempo.','Vi um cartaz roxo na esquina. Coisa do norte. Tem uma rainha lá que… melhor nem falar o nome.']);
  rua('cid_15','marionete:3', 26,56, ['(ele está parado no meio de um espirro há sei lá quanto tempo)','…a… a… a…']);
  rua('cid_16','cidadao:7', 97,46, ['Shhh. Eu tô fingindo que sou estátua. Se o tempo voltar, ninguém vai saber que eu me mexi.'], { tipo:'vagar', r:2 });
  rua('cid_17','cidadao:6', 131,82, ['Turismo em Tel Aviv: venha ver a cidade que não sai do lugar. Literalmente.']);
  rua('cid_18','cidadao:4', 60,52, ['Eu era guarda de trânsito. Agora sou guarda de um trânsito PARADO. Nunca trabalhei tão pouco.']);
  // bairros novos (parques, comércio, vila, horta, porto, praia, olival)
  rua('cid_19','cidadao:8', 44,26, ['Eu tava correndo no parque às 03:32. Às 03:33 eu parei. Recorde pessoal de descanso.'], { tipo:'vagar', r:2 });
  rua('cid_20','cidadao:15', 81,27, ['O balanço não vai e não volta. Fica lá em cima. É o melhor balanço do mundo e o pior também.'], { tipo:'vagar', r:2 });
  rua('cid_21','cidadao:11', 49,64, ['Sou ajudante do Seu Moti na padaria. O pão tá pronto há três minutos. Desde sempre.']);
  rua('cid_22','cidadao:12', 33,64, ['Fui buscar o conserto do meu relógio na relojoaria. O Ezequiel disse que não tem conserto. Pro relógio de NINGUÉM.']);
  rua('cid_23','cidadao:9', 11,50, ['A horta cresce. Devagar, mas cresce. As couves não ligam pra relógio. Aprende com elas, menino.'], { tipo:'vagar', r:2 });
  rua('cid_24','cidadao:13', 30,75, ['Paz, irmão. A horta comunitária é o único lugar onde ninguém tá com pressa. Nem antes de 03:33.']);
  rua('cid_25','cidadao:14', 109,90, ['Segurança do porto. Ninguém entra, ninguém sai. Bom, ninguém se mexe, então tá fácil.'], { tipo:'vagar', r:2 });
  rua('cid_26','cidadao:10', 132,40, ['Vôlei de praia! Falta um. Falta a bola também. Ela tá parada lá em cima, ó.'], { tipo:'vagar', r:2 });
  rua('cid_27','marionete:8', 122,55, ['(congelado no meio de um mergulho seco na beira da piscina)']);
  rua('cid_28','cidadao:6', 56,114, ['Colho azeitona desde menino. Elas não caem mais. Eu chacoalho e elas ficam. Educadas.'], { tipo:'vagar', r:3 });
  rua('cid_29','marionete:12', 116,24, ['…e o próximo slide… o próximo slide… o próximo slide…']);
  rua('cid_30','cidadao:3', 46,39, ['Tirei foto da torre do relógio. Na foto ela marca 03:33. Na vida também. Pelo menos combina.'], { tipo:'vagar', r:2 });
})();
