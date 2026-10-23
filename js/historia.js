/* ============================================================
   MODO HISTÓRIA
   - MAPA DO MUNDO (`screen-historia-mapa`): `modohistoria/mapa.png` com
     um PONTO clicável por local. Local com `cap` abre o capítulo.
   - CAPÍTULO (`screen-historia-fases`): lista de fases. Cada fase libera
     a próxima; fase já vencida pode ser rejogada.
   - FASE = cena de abertura → luta 3x3 roteirizada → cena de fechamento.
   - CENA (`screen-historia-cena`): narração estilo visual novel. Cada
     fala tem QUEM fala (sprite + nome no balão) ou é narração pura.
     Reaproveita TurnBG (cenário) e Sprites.renderPose (personagem).
   - A luta usa o motor normal do 3x3 (TurnUI.iniciarHistoria) com
     `ajustes` por posição — é assim que chefe fica mais forte que a
     versão jogável (ver `opts.ajustes` em TurnBattle.iniciar).

   CAPÍTULO 1 — TEL AVIV (25 fases)
   O Mecas acorda no laboratório 5000Z sem saber quem o criou. Pelo
   caminho encontra o Lambança (que é de Limeira mas JURA que é de Tel
   Aviv) e o Cargas, o homem do raio — o maior inimigo do Marcelão Black
   JW, o Ladrão de Tempo que criou o Mecas e parou todos os relógios da
   cidade. Na fase 20, Mecas + Cargas vencem o Marcelão no topo da
   Torre do Relógio e ele foge pro norte. Epílogo (21–25): a notícia de
   que a rainha Smergula matou o Marcelão, o exército de androides e a
   caravana de Limeira partindo pra guerra.

   CAPÍTULO 2 — SMERGULUS KINGDOM (40 fases, abre depois do Cap. 1)
   O reino da rainha Smergula visto por quem é de lá — ver o bloco
   SMERGULUS mais abaixo. Termina na GUERRA GERAL contra a rainha.
   ============================================================ */
const Historia = (function(){

  /* ---------------- PROGRESSO (localStorage) ----------------
     { telaviv: <quantas fases vencidas, em ordem> }. A versão antiga
     guardava só `cap1:true` (a fase 1 de quando o capítulo tinha uma
     fase só) — vira telaviv:1 pra ninguém perder o que já jogou. */
  const PROGRESSO_KEY='historia_progresso';

  /* ---------------- DUAS CAMPANHAS ----------------
     'normal'     → a história de sempre, IA comum do outro lado.
     'condenacao' → a MESMA história, reencenada pela rainha Smergula no
                    Tribunal: do outro lado joga o BOT DO JULGAMENTO (a IA
                    esperta do Modo Condenação, `iaEsperta` no motor) e a
                    rainha comenta tudo como juíza. Sem draft nem ban: os
                    times são os do roteiro. Progresso SEPARADO — dá pra
                    seguir as duas campanhas em paralelo.
     Lore: a rainha não aparece em Tel Aviv. Na Condenação ela fala do
     PRÓPRIO trono (cenário `castelo`), julgando a lembrança da luta. */
  const PROGRESSO_KEY_COND='historia_progresso_condenacao';
  const MODO_KEY='historia_modo';
  let modo = (function(){ try{ return localStorage.getItem(MODO_KEY)==='condenacao' ? 'condenacao' : 'normal'; }catch(e){ return 'normal'; } })();
  const chaveProgresso = m => ((m||modo)==='condenacao' ? PROGRESSO_KEY_COND : PROGRESSO_KEY);

  function progresso(m){
    let p={};
    try{ p=JSON.parse(localStorage.getItem(chaveProgresso(m)))||{}; }catch(e){}
    if((m||modo)!=='condenacao' && p.cap1 && !p.telaviv) p.telaviv=1;
    return p;
  }
  function vencidas(capId, m){ return progresso(m)[capId]|0; }
  function marcarVencida(capId, i, m){
    const p=progresso(m);
    p[capId]=Math.max(p[capId]|0, i+1);
    try{ localStorage.setItem(chaveProgresso(m), JSON.stringify(p)); }catch(e){}
  }
  function setModo(m){
    modo = (m==='condenacao') ? 'condenacao' : 'normal';
    try{ localStorage.setItem(MODO_KEY, modo); }catch(e){}
  }

  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ================= ROTEIRO =================
     Atalhos pra escrever o roteiro sem ruído:
       N(texto, extra)         → narração (sem personagem em cena)
       D(quem, texto, extra)   → fala de um personagem (charId)
     `extra`: { forma, pose, cenario, nome }. O Mecas aparece ciborgue
     (forma 2) por padrão — a transformação acontece na fase 1.        */
  const N = (texto, extra) => Object.assign({ quem:false, texto }, extra||{});
  const D = (quem, texto, extra) => Object.assign({ quem, texto }, extra||{});

  // inimigos genéricos reforçados
  const SENTINELA = { nome:'Sentinela', hp:130, atk:12, def:5, spd:7 };
  const GELIDA    = { nome:'Sentinela Gélida', hp:175, atk:18, def:8, spd:9 };
  const GUARDA    = { nome:'Guarda da Torre', hp:215, atk:23, def:9, spd:10 };
  /* "olhos azuis, gelados": cidadão com o tempo congelado pelo Marcelão,
     virado marionete. Um pouco mais forte que o normal, nome marcado. */
  const congelado = (nome, extra) => Object.assign({ nome:nome+' ❄' }, extra||{});
  /* "Protocolo Órfão": com o Marcelão morto, os robôs dele enlouquecem. */
  const ORFAO     = { nome:'Robô Órfão', hp:200, atk:22, def:8, spd:10 };

  /* ---- Capítulo 2: o exército da rainha Smergula. Todos são o MESMO
     smerg comum (`smerg_normal`) — o posto vem do nome e dos números. */
  const RECRUTA     = { nome:'Recruta Smerg', hp:100, atk:9 };
  const SOLDADO     = { nome:'Soldado Smerg' };
  const DESERTOR    = { nome:'Smerg Desertor', hp:140, atk:14, def:5 };
  const LANCEIRO    = { nome:'Lanceiro Smerg', hp:160, atk:16, def:6, spd:8 };
  const CAPITAO     = { nome:'Capitão Smerg', hp:240, atk:24, def:9, spd:10 };
  const GUARDA_REAL = { nome:'Guarda Real', hp:235, atk:26, def:10, spd:10 };
  /* soldado com um pedaço do TEMPO roubado do Marcelão no peito (Ato III+):
     mais rápido que um smerg comum devia ser. */
  const RELOGIO     = { nome:'Smerg do Relógio', hp:250, atk:29, def:9, spd:12 };
  const GUARDA_TRONO= { nome:'Guarda do Trono', hp:285, atk:33, def:12, spd:12 };
  /* aliados do Capítulo 2 (lado do jogador, por posição) */
  const PIPOCA      = { nome:'Pipoca', hp:185, atk:20, def:8, spd:9 };
  const REBELDE     = { nome:'Smerg Rebelde', hp:180, atk:19, def:7, spd:9 };
  const ANDROIDE    = { nome:'Androide 5000Z', hp:200, atk:21, def:9, spd:10 };

  const TELAVIV = {
    id:'telaviv', nome:'Capítulo 1 — Tel Aviv', icone:'🕌',
    fases:[

    /* ---------------- 1 ---------------- */
    { titulo:'A Criação', sinopse:'Um ciborgue acorda numa cápsula sem lembrar de nada.',
      cenario:'laboratorio', time:['mecas'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      intro:[
        N('LABORATÓRIO 5000Z. A cápsula se abre num jato de vapor — e ele desperta sem lembrar nem o próprio nome.', {cenario:'laboratorio'}),
        D('mecas','...onde... onde eu tô?', {forma:0, pose:'hurt'}),
        N('As pernas tremem. Os braços não obedecem como antes. Tem metal onde deveria ter pele.'),
        D('mecas','O que fizeram comigo? QUEM fez isso comigo?!', {forma:1, pose:'special'}),
        N('A raiva chega antes de qualquer explicação. Os implantes terminam de ligar, um por um.'),
        D('mecas','...', {forma:2, pose:'special', nome:'CIBORGUE 5000Z'}),
        N('Três ROBÔS DE PATRULHA bloqueiam a saída. Ele não veio pedir licença.')
      ],
      outro:[
        N('A sucata dos três robôs ainda fumega no chão.'),
        D('mecas','"...o que eu fiz. O QUE ELES FIZERAM COMIGO."', {pose:'hurt'}),
        N('Na lateral da cápsula, uma plaquinha de metal: PROPRIEDADE DE M.B.JW.'),
        D('mecas','M.B.JW... Eu vou descobrir quem é você.')
      ] },

    /* ---------------- 2 ---------------- */
    { titulo:'Corredores de Metal', sinopse:'O alarme dispara. O laboratório não quer deixar ele sair.',
      cenario:'laboratorio', time:['mecas'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[SENTINELA, SENTINELA, SENTINELA] },
      intro:[
        N('Luzes vermelhas. Uma sirene que não para.'),
        N('"UNIDADE 5000Z FORA DA CÁPSULA. INICIANDO PROTOCOLO DE CONTENÇÃO."', {nome:'ALTO-FALANTE'}),
        D('mecas','Contenção? Eu não sou um bicho.'),
        N('As portas do corredor se abrem. Sentinelas mais pesadas, de armadura reforçada.'),
        D('mecas','Vocês foram feitos pra me segurar. Eu fui feito pra quê?', {pose:'special'})
      ],
      outro:[
        N('Num terminal esquecido, um arquivo ainda aberto: "PROTOCOLO 5000Z — VOLUNTÁRIO Nº 1".'),
        N('Logo abaixo: "assinatura do voluntário: ███ DADO CORROMPIDO ███".'),
        D('mecas','Voluntário? Eu nunca me ofereci pra nada.'),
        D('mecas','...ou foi isso que me fizeram lembrar?', {pose:'hurt'})
      ] },

    /* ---------------- 3 ---------------- */
    { titulo:'O Guardião do Portão', sinopse:'Uma máquina enorme guarda a única saída do laboratório.',
      cenario:'laboratorio', time:['mecas'], inimigos:['mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[{ nome:'Guardião do Portão', hp:340, atk:36, def:8 }, {}] },
      intro:[
        N('O portão de saída. Na frente dele, um robô duas vezes maior que os outros, com um relógio no lugar do peito.'),
        D('mecas_grunt','"UNIDADE 5000Z. RETORNE À CÁPSULA. ORDEM DO CRIADOR."', {nome:'GUARDIÃO DO PORTÃO'}),
        D('mecas','Que criador?'),
        D('mecas_grunt','"O CRIADOR NÃO TEM PRESSA. O CRIADOR TEM TODO O TEMPO DO MUNDO."', {nome:'GUARDIÃO DO PORTÃO'}),
        D('mecas','Então ele pode esperar mais um pouco. Sai da frente.', {pose:'special'})
      ],
      outro:[
        N('O relógio no peito do Guardião racha. Os ponteiros, parados em 03:33, caem no chão.'),
        D('mecas','"Todo o tempo do mundo"...'),
        N('O portão abre. Do lado de fora, o vento quente de uma cidade inteira.')
      ] },

    /* ---------------- 4 ---------------- */
    { titulo:'Bem-vindo a Tel Aviv', sinopse:'A primeira noite na cidade — e um guia que ninguém pediu.',
      cenario:'telaviv', time:['mecas','hans_lambanca'], inimigos:['serrinha_dog','strong_smerg'],
      intro:[
        N('TEL AVIV. Torres de vidro de um lado, cúpulas douradas do outro, e o mar engolindo o sol.', {cenario:'telaviv'}),
        D('hans_lambanca','Opa, opa! Primeira vez em Tel Aviv? Seja bem-vindo à MINHA cidade!'),
        D('mecas','...Sua cidade?'),
        D('hans_lambanca','Nascido e criado! Do ladinho da igrejinha, ó. Aquela ali.'),
        D('mecas','Aquilo é uma cúpula dourada.'),
        D('hans_lambanca','É a igrejinha da esquina. Sempre foi. Deus abençoe.'),
        D('strong_smerg','Olha só, Serrinha. É o robô que fugiu. Tem recompensa pela cabeça de lata.'),
        D('hans_lambanca','Ninguém encosta em turista na minha cidade! Pai, abençoa essa trombada — LÁ VOU EU!', {pose:'special'})
      ],
      outro:[
        D('strong_smerg','Recompensa... do homem do relógio... a gente volta!', {pose:'hurt'}),
        D('hans_lambanca','Viu? Aqui em Tel Aviv a gente cuida de quem chega. Lá em Limeira já não é assim...'),
        D('mecas','Limeira?'),
        D('hans_lambanca','Que Limeira? Eu disse Limeira? Nunca nem ouvi falar. Prazer, Lambança. De Tel Aviv.')
      ] },

    /* ---------------- 5 ---------------- */
    { titulo:'O Pior Guia Turístico', sinopse:'Lambança mostra "a cidade dele". Nada do que ele fala é verdade.',
      cenario:'telaviv', time:['mecas','hans_lambanca'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[SENTINELA, {}, SENTINELA] },
      intro:[
        D('hans_lambanca','À esquerda, a famosa Torre do Relógio. Eu ajudei a construir quando era criança.'),
        D('hans_lambanca','À direita, a praia onde eu aprendi a nadar. No Rio Piracicaba.'),
        D('mecas','O Rio Piracicaba não fica aqui.'),
        D('hans_lambanca','Fica no coração, irmão. No coração.'),
        D('mecas','...Os ponteiros daquela torre não se mexem.'),
        D('hans_lambanca','Shhh! Tem robô vindo. Finge que é turista.'),
        N('Três robôs de patrulha viram a esquina, varrendo a rua com lanternas azuis.')
      ],
      outro:[
        D('mecas','Todos os relógios da rua estão parados no mesmo horário. 03:33.'),
        D('hans_lambanca','Sempre foi assim aqui. Acho. Na minha época era... ué, na minha época era assim também.'),
        D('mecas','"Sem pressa, que ele tem todo o tempo do mundo"... O homem do relógio parou a cidade.')
      ] },

    /* ---------------- 6 ---------------- */
    { titulo:'Sotaque do Interior', sinopse:'Dois turistas de Limeira reconhecem o Lambança.',
      cenario:'padaria', time:['mecas','hans_lambanca'], inimigos:['fat_mango','matheus_limeira2'],
      intro:[
        N('Uma padaria na beira da avenida. Na porta, um Corsa e um Astra prateado com placa de Limeira, cheios de mala.', {cenario:'padaria'}),
        D('matheus_limeira2','Mango, eu falei que era pra virar à esquerda. Mil e duzentos quilômetros e a gente para numa PADARIA.'),
        D('fat_mango','Férias sem pão quente não é férias, Mameluco. ...Peraí.'),
        D('fat_mango','LAMBANÇA?! Ô rapaz, que cê tá fazendo aqui? Você é de LIMEIRA! A gente cresceu na mesma rua!'),
        D('hans_lambanca','Nunca te vi mais gordo. Sou de Tel Aviv, nascido e criado.'),
        D('matheus_limeira2','Ele benzeu meu Astra na porta da igreja de Limeira, Mango. Duas vezes. Cobrou as duas.'),
        D('hans_lambanca','CALÚNIA! Isso pede uma luta abençoada!', {pose:'special'}),
        D('mecas','...A gente vai mesmo brigar por isso?'),
        D('hans_lambanca','Tem coisa mais importante que a terra natal de um homem?')
      ],
      outro:[
        D('fat_mango','Tá bom, tá bom, cê é de onde quiser! Mas escuta: a gente chegou ontem e o relógio do hotel já tava parado...', {pose:'hurt'}),
        D('matheus_limeira2','...e o recepcionista disse que tem gente sumindo e voltando diferente. Olhos azuis, gelados. Coisa de um tal de Marcelão.'),
        D('mecas','Marcelão.', {pose:'hurt'}),
        N('Um choque atravessa o crânio de metal. Uma voz, de longe: "Bom dia, unidade 5000Z. Eu sou seu criador."'),
        D('mecas','...M.B.JW. Marcelão Black JW.')
      ] },

    /* ---------------- 7 ---------------- */
    { titulo:'Apagão', sinopse:'A cidade inteira apaga. Um raio cai na avenida — e ele não está do seu lado.',
      cenario:'telaviv', time:['mecas'], inimigos:['cargas'],
      ajustes:{ inimigo:[{ hp:250, atk:22 }] },
      intro:[
        N('A cidade inteira apaga de uma vez. Torres, postes, letreiros. Silêncio.'),
        N('E então um RAIO cai no meio da avenida — e não vai embora. Fica ali, estalando, com um homem dentro.'),
        D('cargas','Cheiro de 5000Z. Eu reconheço esse metal de longe.', {pose:'special'}),
        D('mecas','Eu não sei quem você é.'),
        D('cargas','Mas eu sei O QUE você é. Uma máquina do Marcelão. E máquina do Marcelão eu desligo.'),
        D('hans_lambanca','Eu... vou ali comprar um pão. Boa sorte, amigo! Deus te abençoe!')
      ],
      outro:[
        D('cargas','Uma máquina dele teria me matado no primeiro golpe. Você... hesitou.', {pose:'hurt'}),
        D('mecas','Eu não sou máquina dele. Eu só quero saber quem me fez.'),
        D('cargas','Então a gente quer a mesma coisa. Eu sou o Cargas.'),
        D('cargas','E o homem que te fez é o maior inimigo que eu tenho nessa vida.')
      ] },

    /* ---------------- 8 ---------------- */
    { titulo:'O Inimigo do Meu Inimigo', sinopse:'Cargas conta quem é o Marcelão Black JW. E as Sentinelas chegam.',
      cenario:'telaviv', time:['mecas','cargas'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[GELIDA, GELIDA, GELIDA] },
      intro:[
        D('cargas','Marcelão Black JW. O Ladrão de Tempo. Foi ele que criou você — e o Protocolo 5000Z inteiro.'),
        D('cargas','Anos atrás a gente trabalhava junto. Eu era a bateria do laboratório: elétrico demais pra viver normal.'),
        D('cargas','Ele usava a minha energia pra ligar as cápsulas. Um dia eu vi o que ele colocava lá dentro.'),
        D('mecas','O quê?'),
        D('cargas','Gente. Gente de Tel Aviv. Ele rouba o tempo delas e transforma no que ele quiser.'),
        D('mecas','Então eu era...', {pose:'hurt'}),
        D('cargas','Uma pessoa. Antes dele. ...Abaixa! Sentinelas!', {pose:'special'})
      ],
      outro:[
        D('hans_lambanca','Voltei! Trouxe pão! Perdi alguma coisa?'),
        D('cargas','...Quem é esse?'),
        D('hans_lambanca','Lambança, às ordens. Nascido em Tel Aviv.'),
        D('cargas','Esse sotaque é de Limeira.'),
        D('hans_lambanca','É sotaque de TEL AVIV. Pão?')
      ] },

    /* ---------------- 9 ---------------- */
    { titulo:'Memórias Emprestadas', sinopse:'Na Muralha, Mecas descobre que a lembrança de ter se oferecido é falsa. E os caçadores voltam.',
      cenario:'muralha', time:['mecas','cargas','hans_lambanca'], inimigos:['strong_smerg','serrinha_dog','mecas_grunt'],
      ajustes:{ inimigo:[{ hp:230 }, { hp:220 }, SENTINELA] },
      intro:[
        N('A MURALHA DA CIDADE VELHA. Pedra antiga, lanternas tremendo no vento.', {cenario:'muralha'}),
        D('mecas','Eu lembro de entrar na cápsula sozinho. De querer entrar.', {forma:0}),
        D('cargas','É o truque favorito dele. Ele grava uma lembrança por cima e te faz achar que foi escolha sua.'),
        D('cargas','Rouba o tempo que você viveu de verdade e devolve um tempo de mentira.'),
        D('serrinha_dog','Bonita a conversa. Pena que a cabeça de lata vale o DOBRO desde ontem.'),
        D('strong_smerg','O Marcelão subiu a recompensa. E agora tem bônus pelo homem do raio também.'),
        D('cargas','Caçador de recompensa trabalhando pro Marcelão. Vocês não têm vergonha?'),
        D('serrinha_dog','A gente trabalha pra quem paga, faísca. Dizem que até a rainha Smergula, lá do reino dela, tá de olho nesse prêmio.'),
        D('hans_lambanca','Cabeça de amigo meu não tá à venda! Senhor, abençoa essa trombada!', {pose:'special'})
      ],
      outro:[
        D('strong_smerg','Recua, Serrinha! Isso não tava no contrato!', {pose:'hurt'}),
        D('serrinha_dog','A gente volta. Recompensa boa não foge.'),
        D('mecas','Eu tinha uma vida antes disso. Alguém roubou.'),
        N('Um rapaz de cabelo cacheado desce correndo a escada da Muralha, com um esfregão na mão.'),
        D('careca','...MECAS? É você? Debaixo de todo esse metal... é você mesmo?'),
        D('mecas','Você me conhece?'),
        D('careca','Se eu te conheço? A gente cresceu nessa cidade JUNTOS. Eu sou o Careca, cara.'),
        D('mecas','Careca. Você tem cabelo.'),
        D('careca','...É. Você também nunca entendeu o apelido.'),
        D('mecas','O Cargas disse que a minha lembrança da cápsula é falsa. Que eu não entrei por vontade própria.'),
        D('careca','E ele tá certo. Você NUNCA se ofereceu pra nada. Um homem de casaco branco te levou da rua. Eu vi.'),
        D('careca','Fiquei meses te procurando. Fui pedir ajuda até pra rainha Smergula, lá no reino dela...'),
        D('careca','...e ela me deu um "presente". Quando eu caio, eu volto. Só que não volto gente.', {pose:'hurt'}),
        D('careca','Isso é conta minha com ela. Um dia eu acerto. Hoje, eu vim te buscar.'),
        D('cargas','Mais um que o tempo do Marcelão atropelou. Bem-vindo ao time.'),
        N('Atrás do portão da Muralha, alguma coisa ENORME começa a acordar. Tique. Taque.')
      ] },

    /* ---------------- 10 · CHEFE ---------------- */
    { titulo:'O Colosso da Muralha', chefe:true, sinopse:'CHEFE · A máquina que o Marcelão deixou trancando a Cidade Velha.',
      cenario:'muralha', time:['mecas','cargas','hans_lambanca'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[{ nome:'Colosso da Muralha', chefe:true, hp:790, atk:68, def:13, spd:17 }, GELIDA, GELIDA] },
      intro:[
        N('O portão em arco se abre sozinho. Lá de dentro sai uma máquina do tamanho de uma casa, coberta de gelo.'),
        D('mecas_grunt','"CIDADE VELHA: TEMPO SOB CUSTÓDIA. NINGUÉM ENTRA. NINGUÉM SAI."', {nome:'COLOSSO DA MURALHA'}),
        D('cargas','Ele trancou a Cidade Velha inteira. Tem gente lá dentro, parada há dias.'),
        D('mecas','O Marcelão deixou um cão de guarda.'),
        D('hans_lambanca','Que tamanho de cão, Senhor. Vai na porrada mesmo.'),
        D('mecas_grunt','"INTRUSOS DETECTADOS. INICIANDO RETENÇÃO."', {nome:'COLOSSO DA MURALHA', pose:'special'})
      ],
      outro:[
        N('O Colosso cai de joelhos e o gelo do portão se quebra.'),
        N('Atrás da Muralha, a Cidade Velha volta a respirar: gente piscando, piscando, olhando em volta sem entender.'),
        D('cargas','Ele congela o tempo das pessoas e deixa uma máquina de guarda. Quebrou a máquina, o tempo volta.'),
        D('mecas','Então a gente quebra todas.')
      ] },

    /* ---------------- 11 ---------------- */
    { titulo:'O Mercado de Jaffa', sinopse:'O mercado está congelado — e dois turistas de Limeira viraram marionetes.',
      cenario:'telaviv', time:['mecas','cargas','hans_lambanca'], inimigos:['fat_mango','matheus_limeira2','mecas_grunt'],
      ajustes:{ inimigo:[congelado('Fat Mango', { hp:200 }), congelado('Mameluco', { hp:200 }), GELIDA] },
      intro:[
        N('O mercado de Jaffa. Barracas abertas, frutas no balcão — e ninguém se mexendo.'),
        D('mecas','Eles estão parados no meio do que faziam.'),
        D('hans_lambanca','Comprei pastel aqui a vida inteira. Eu acho. Num mercado parecido.'),
        N('Na barraca de lembrancinhas, dois turistas cheios de sacola. Uma camiseta "I ♥ TEL AVIV" pela metade da cabeça.'),
        D('hans_lambanca','O MANGO E O MAMELUCO! O Marcelão congelou os dois no meio das compras!'),
        N('As duas cabeças viram ao mesmo tempo. Olhos azuis. Tique. Taque.'),
        D('cargas','Bate pra acordar, não pra derrubar.')
      ],
      outro:[
        D('fat_mango','Ai, minha cabeça... Mameluco, por que eu tô com um chapéu de camelo?', {pose:'hurt'}),
        D('matheus_limeira2','A última coisa que eu lembro é um homem de casaco branco pedindo pra ver as horas no meu relógio.'),
        D('matheus_limeira2','Ele olhou, sorriu e disse: "Obrigado. Esse eu vou levar." E aí ficou tudo azul.'),
        D('fat_mango','Ele falou que tava indo pra Torre do Relógio. Que tava "quase pronto" pra parar a cidade INTEIRA.'),
        D('mecas','De uma vez. Pra sempre.')
      ] },

    /* ---------------- 12 ---------------- */
    { titulo:'O Trio de Limeira', sinopse:'Lambança, Mango e Mameluco lutam juntos na "igrejinha". Uma pista sobre o Lambança aparece.',
      cenario:'telaviv', time:['hans_lambanca','fat_mango','matheus_limeira2'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[GUARDA, GUARDA, GUARDA] },
      intro:[
        D('hans_lambanca','Antes da batalha final, eu PRECISO rezar na minha igrejinha. Conheço cada pedra daqui!'),
        N('Ele tropeça numa pedra.'),
        D('hans_lambanca','...Essa pedra é nova.'),
        D('cargas','Eu e o Mecas vamos olhar a Torre de perto. Vocês três seguram a porta.'),
        D('fat_mango','Os três de Limeira juntos de novo! Igual nos tempos da quermesse!'),
        D('hans_lambanca','Que quermesse? Eu nunca fui em quermesse. Eu sou de Tel Aviv.'),
        D('matheus_limeira2','Você vendia quentão na barraca da igreja, Lambança. Eu comprei.'),
        N('Robôs de patrulha cercam a cúpula dourada.')
      ],
      outro:[
        N('Do bolso do Lambança cai um cartão-postal: "LEMBRANÇA DE LIMEIRA — SP".'),
        D('fat_mango','Olha aí! Tem o SEU nome escrito!'),
        D('hans_lambanca','Amigo com o mesmo nome. Acontece muito.'),
        D('matheus_limeira2','Com a sua letra?'),
        D('hans_lambanca','...Às vezes eu sonho com uma cidade pequena, uma igreja de verdade, um padeiro gritando meu nome. Deve ser filme.'),
        D('fat_mango','Eu tô AQUI, Lambança. Gritando seu nome. Agora.')
      ] },

    /* ---------------- 13 ---------------- */
    { titulo:'Praia ao Entardecer', sinopse:'Uma pausa na areia. Cargas conta por que o Marcelão o odeia — e os caçadores tentam uma última vez.',
      cenario:'telaviv', time:['mecas','cargas','careca'], inimigos:['strong_smerg','serrinha_dog','mecas_grunt'],
      ajustes:{ inimigo:[{ hp:230, atk:31 }, { hp:220, atk:23 }, GELIDA] },
      intro:[
        N('A praia. Lambança dorme na areia, roncando uma oração.'),
        D('careca','A gente vinha nessa praia todo domingo, Mecas. Você perdia o chinelo toda vez.'),
        D('mecas','...Eu não lembro.'),
        D('careca','Tudo bem. Eu lembro pelos dois até você lembrar sozinho.'),
        D('mecas','Por que ele te odeia tanto, Cargas?'),
        D('cargas','Porque eu sou o único que ele não consegue atrasar.'),
        D('cargas','Ele rouba um segundo de mim, eu já corri dois. O relógio dele nunca me alcança.'),
        D('cargas','Pra um ladrão de tempo, não existe nada pior que alguém mais rápido que o tempo.'),
        D('strong_smerg','Bonito pôr do sol pra perder, hein?'),
        D('serrinha_dog','Terceira vez é a que paga. Hoje a gente leva os três.'),
        D('careca','Vem. Eu já fui verme, caçador não me assusta.')
      ],
      outro:[
        D('serrinha_dog','Strong... ele pagou a gente com o quê, mesmo?', {pose:'hurt'}),
        D('strong_smerg','Com "tempo". Disse que era o pagamento mais valioso do mundo.', {pose:'hurt'}),
        D('cargas','Tempo roubado de outra pessoa. Vocês trabalharam de graça pro ladrão.'),
        D('strong_smerg','...Chega. Contrato cancelado. Serrinha, a gente tá fora.'),
        D('serrinha_dog','Boa sorte com o relojoeiro. Vocês vão precisar.'),
        N('O sol desce até a linha do mar... e PARA. No meio do caminho.'),
        D('cargas','Não. Não agora.'),
        D('mecas','O que tá acontecendo?'),
        D('cargas','Ele tá parando a cidade inteira. Fica perto de mim, Mecas, fica perto de m—')
      ] },

    /* ---------------- 14 ---------------- */
    { titulo:'O Relógio Parou', sinopse:'Tel Aviv inteira congela. Só uma pessoa ainda se mexe.',
      cenario:'telaviv', time:['cargas'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      intro:[
        N('Silêncio absoluto. As ondas paradas no ar. O Mecas congelado no meio de um passo. O Lambança congelado no meio de um ronco.'),
        N('Só uma coisa se mexe em Tel Aviv: faíscas.'),
        D('cargas','Parou a cidade inteira, Marcelão? Esqueceu de mim de novo.', {pose:'special'}),
        D('cargas','Eu sou mais rápido que o seu relógio.'),
        N('Os robôs de patrulha também andam — feitos pelo Marcelão, imunes ao próprio feitiço.'),
        D('cargas','Três? Só três? Ele tá me subestimando.')
      ],
      outro:[
        D('cargas','Se eu jogar TODA a minha carga na rede elétrica da cidade...', {pose:'special'}),
        N('Um raio sobe do chão até o céu. Todas as luzes de Tel Aviv acendem ao mesmo tempo — e o mar volta a quebrar.'),
        D('mecas','...O que aconteceu? Eu pisquei.'),
        D('cargas','Você perdeu uns quarenta segundos. E ele perdeu a paciência.'),
        D('hans_lambanca','Amém! ...Eu dormi? Quem rezou por mim?')
      ] },

    /* ---------------- 15 ---------------- */
    { titulo:'Eco do Ladrão de Tempo', sinopse:'O Marcelão aparece pela primeira vez. Ou quase.',
      cenario:'torre', time:['mecas','cargas','hans_lambanca'], inimigos:['marcelao_black_jw','mecas_grunt','mecas_grunt'],
      /* ⚖ 1.33: os golpes do Marcelão viraram 60/56/46 na 1.28 e esta fase
         (feita pro kit antigo) caiu pra 27%. `danoMult` corta o dano dele
         sem mexer no kit: 76% na campanha normal (era o "primeiro contato"). */
      ajustes:{ inimigo:[{ nome:'Eco do Marcelão', chefe:true, hp:520, atk:32, spd:16, danoMult:0.8 }, GELIDA, GELIDA] },
      intro:[
        N('O pé da Torre do Relógio. Uma figura de casaco branco desce a escada — transparente, feita de gelo.', {cenario:'torre'}),
        D('marcelao_black_jw','Unidade 5000Z. Que orgulho. Você saiu da caixa sozinho.'),
        D('mecas','VOCÊ me criou.'),
        D('marcelao_black_jw','Eu te DEI tempo. Antes você era só mais um homem com prazo de validade.'),
        D('marcelao_black_jw','E você, Cargas. Minha bateria favorita. Sentiu saudade?'),
        D('cargas','Desce dessa torre e fala isso na minha cara.', {pose:'special'}),
        D('marcelao_black_jw','Eu não desço. Meu eco cuida de vocês. Tique... taque...')
      ],
      outro:[
        N('O eco se parte em mil pedaços de gelo.'),
        D('marcelao_black_jw','Impressionante. Subam, então. Vocês só estão adiantando o fim.'),
        D('hans_lambanca','Essa voz eu conheço! ...Não, não conheço. Não conheço ninguém de lugar nenhum.'),
        D('mecas','Ele não vai me receber de braços abertos.'),
        D('cargas','Ótimo. A gente não vai bater na porta.')
      ] },

    /* ---------------- 16 ---------------- */
    { titulo:'Ferro-Velho dos Protótipos', sinopse:'Atrás da cidade, um cemitério de robôs. Todos com o mesmo rosto.',
      cenario:'ferrovelho', time:['mecas','cargas','careca'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[GUARDA, GUARDA, GUARDA] },
      intro:[
        N('Atrás da Torre, um ferro-velho enorme. Pilhas de carcaças descartadas.', {cenario:'ferrovelho'}),
        D('mecas','Esses aqui... têm a minha cara.', {pose:'hurt'}),
        D('careca','Têm a cara que EU lembro. De antes do metal.', {pose:'hurt'}),
        D('mecas','Quantos de mim ele fez?'),
        D('cargas','Muitos. Você é o único que acordou.'),
        D('careca','O único que tinha alguém procurando.'),
        N('Entre as pilhas, os Guardas da Torre — a escolta pessoal do Marcelão.')
      ],
      outro:[
        N('Num terminal ainda ligado: "PROTÓTIPO 5000Z-01 — STATUS: ACORDADO. INSTRUÇÃO: TRAZER DE VOLTA À TORRE."'),
        D('mecas','Ele quer que eu volte.'),
        D('mecas','Então eu vou. Do meu jeito.', {pose:'special'}),
        N('Ao fundo, três carcaças começam a se mexer.')
      ] },

    /* ---------------- 17 ---------------- */
    { titulo:'Os Irmãos de Metal', sinopse:'Três protótipos do Mecas acordam — e só têm uma ordem.',
      cenario:'ferrovelho', time:['mecas','cargas','hans_lambanca'], inimigos:['mecas','mecas','mecas'],
      ajustes:{ inimigo:[{ nome:'Protótipo-02', hp:165 }, { nome:'Protótipo-03', hp:165 }, { nome:'Protótipo-04', hp:165 }] },
      intro:[
        N('Três carcaças se levantam do ferro-velho: Protótipo-02, 03 e 04. Todas com o rosto dele — de antes do metal.'),
        D('mecas','"INSTRUÇÃO: TRAZER DE VOLTA. INSTRUÇÃO: TRAZER DE VOLTA."', {forma:0, nome:'PROTÓTIPOS'}),
        D('mecas','Vocês não precisam fazer isso. Vocês eram gente, igual eu.'),
        D('mecas','"INSTRUÇÃO: TRAZER DE VOLTA."', {forma:0, nome:'PROTÓTIPOS'}),
        D('cargas','Eles não acordaram de verdade, Mecas. Só ele mexe as cordas.'),
        D('hans_lambanca','Senhor, perdoa o que a gente vai fazer com esses meninos.')
      ],
      outro:[
        N('Os três protótipos desligam devagar. Um deles, antes de apagar, abre a mão — como quem agradece.'),
        D('hans_lambanca','Descansem em paz, filhos de Tel Aviv.'),
        D('cargas','Eles não eram daqui.'),
        D('hans_lambanca','Ninguém é de lugar nenhum, Cargas. A gente é de onde o coração aponta.'),
        D('mecas','...Isso foi bonito, Lambança.'),
        D('hans_lambanca','Eu sei. Sou de Tel Aviv.')
      ] },

    /* ---------------- 18 ---------------- */
    { titulo:'Subindo a Torre', sinopse:'O Protótipo-00, a cópia perfeita do Mecas, guarda a escada até o topo.',
      cenario:'torre', time:['mecas','cargas','hans_lambanca'], inimigos:['mecas','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[{ nome:'Protótipo-00', chefe:true, forma:2, hp:260, atk:22, def:11 }, GUARDA, GUARDA] },
      intro:[
        N('A escada em espiral sobe por dentro da Torre. Engrenagens geladas, ponteiros girando ao contrário.', {cenario:'torre'}),
        N('No meio da escada, alguém espera. O mesmo corpo de metal. O mesmo olho vermelho. O mesmo rosto.'),
        D('mecas','"PROTÓTIPO-00. A VERSÃO QUE DEU CERTO."', {nome:'PROTÓTIPO-00', pose:'special'}),
        D('mecas','Eu sou o primeiro. Você é o rascunho que fugiu.', {nome:'PROTÓTIPO-00'}),
        D('cargas','Esse acordou de verdade. E escolheu o lado dele.'),
        D('hans_lambanca','Dois Mecas?! Senhor, me ajuda a não bater no errado.')
      ],
      outro:[
        D('mecas','"O criador... não vai lutar sozinho... vai lutar com o TEMPO do lado dele..."', {nome:'PROTÓTIPO-00', pose:'hurt'}),
        D('mecas','Você podia ter escolhido diferente.'),
        N('O Protótipo-00 desliga. Lá em cima, um tique-taque enorme — cada batida faz a torre inteira tremer.'),
        D('mecas','Última porta.')
      ] },

    /* ---------------- 19 · CHEFE ---------------- */
    { titulo:'Marcelão Black JW', chefe:true, sinopse:'CHEFE · O criador do Mecas, em pessoa, no coração da Torre.',
      cenario:'torre', time:['mecas','cargas','hans_lambanca'], inimigos:['marcelao_black_jw','mecas_grunt','mecas_grunt'],
      /* ⚖ 1.33: com o kit novo do Marcelão (1.28) esta luta tinha 0% de
         vitória. Recalibrada: 52% na campanha normal (era 49% no kit antigo). */
      ajustes:{ inimigo:[{ nome:'Marcelão Black JW', chefe:true, hp:690, atk:34, def:14, spd:17, danoMult:0.72 }, GELIDA, GELIDA] },
      intro:[
        N('O topo da Torre. Um relógio gigante de gelo. E, na frente dele, o homem de casaco branco.'),
        D('marcelao_black_jw','Bem-vindos à minha torre. Aqui dentro, cada segundo é meu.'),
        D('mecas','Eu vim pegar o meu de volta.', {pose:'special'}),
        D('marcelao_black_jw','O SEU? Rapaz, tudo que você é, eu emprestei.'),
        D('cargas','Hoje você devolve. Com juros.'),
        D('hans_lambanca','E eu vim rezar por vocês todos! ...E bater também.'),
        D('marcelao_black_jw','Tique.', {pose:'special'})
      ],
      outro:[
        D('marcelao_black_jw','Hah... hahaha... vocês acham que venceram?', {pose:'hurt'}),
        D('marcelao_black_jw','Eu tenho TODO o tempo do mundo.'),
        N('Ele agarra o ponteiro do relógio gigante e o gira PRA TRÁS. A torre inteira vira um clarão branco.'),
        D('cargas','LAMBANÇA!'),
        N('Quando a luz some, o Lambança não está mais lá.'),
        D('marcelao_black_jw','Mandei ele de volta pro lugar de onde ele veio DE VERDADE. Agora somos só nós três.')
      ] },

    /* ---------------- 20 · CHEFE FINAL ---------------- */
    { titulo:'Tempo Absoluto', chefe:true, sinopse:'CHEFE FINAL · Mecas e Cargas contra o Marcelão com o tempo de uma cidade inteira.',
      cenario:'torre', time:['mecas','cargas'], inimigos:['marcelao_black_jw'],
      /* ⚖ 1.33: estava em 0% desde o kit novo do Marcelão (1.28). spd 19 e
         não 20+: a 20 ele cruza o limiar de TURNO EXTRA contra Mecas+Cargas
         e a luta volta a ser impossível. 40% na campanha normal. */
      ajustes:{ inimigo:[{ nome:'MARCELÃO — TEMPO ABSOLUTO', chefe:true, hp:596, atk:34, def:15, spd:19, danoMult:0.78 }] },
      intro:[
        D('marcelao_black_jw','Cada relógio parado de Tel Aviv bate dentro de mim agora.', {pose:'special'}),
        N('O gelo cobre o corpo dele. Os olhos viram dois mostradores azuis.'),
        D('marcelao_black_jw','Vocês vão lutar contra o tempo de uma cidade INTEIRA.'),
        D('cargas','Mecas. Eu corro, você bate.'),
        D('mecas','Eu não fui criado por você, Marcelão.'),
        D('mecas','Eu fui criado APESAR de você.', {pose:'special'})
      ],
      outro:[
        N('O relógio gigante racha de cima a baixo — e explode em neve.'),
        N('Lá embaixo, em toda Tel Aviv, os ponteiros voltam a andar. 03:34.'),
        D('marcelao_black_jw','Isso... não acabou... o tempo... é MEU...', {pose:'hurt'}),
        N('O Marcelão se desfaz numa rachadura de gelo que corta o céu rumo ao noroeste.'),
        D('cargas','Ele fugiu pro norte. Pro reino dos Smergulus — as terras da rainha Smergula.'),
        D('cargas','Se ele chegar lá com o tempo que roubou, não é só Tel Aviv que vai parar.'),
        D('mecas','Então é pra lá que a gente vai.'),
        N('O Careca aparece na escada da Torre, ofegante, com o esfregão quebrado no meio.'),
        D('careca','Pro reino dela? Então eu vou junto.'),
        D('careca','O Marcelão te deve o seu passado, Mecas. A rainha Smergula me deve o meu corpo.'),
        D('mecas','Eu ainda não sei quem eu era. Mas agora eu sei quem eu sou.'),
        D('careca','Você é o cara que perdia o chinelo na praia todo domingo. Já é um começo.'),
        N('Na praia, dois turistas de Limeira acenam com as sacolas de lembrancinha.', {cenario:'telaviv'}),
        D('fat_mango','Ô, robô! Cadê o Lambança? A gente ia levar ele de volta pra casa no Corsa!'),
        D('matheus_limeira2','No Astra, Mango. O Corsa não aguenta mais mil e duzentos quilômetros.'),
        N('ENQUANTO ISSO, EM LIMEIRA...', {cenario:'padaria'}),
        D('hans_lambanca','Ué... que lugar é esse?', {pose:'hurt'}),
        D('hans_lambanca','Uma igrejinha na esquina... uma padaria com uma placa: "FECHADO — FOMOS PRA TEL AVIV. ASS: MANGO"...'),
        D('hans_lambanca','...Nunca vi na vida. Alguém sabe o caminho de volta pra Tel Aviv?'),
        N('O Marcelão fugiu. Mas a história de Tel Aviv ainda não acabou...')
      ] },

    /* ================= EPÍLOGO — A GUERRA QUE VEM DO NORTE =================
       21–25: a ponte pro Capítulo 2. O Marcelão chega ao reino e a rainha
       Smergula suga a alma dele (isso é mostrado no Capítulo 2, fase 20 —
       aqui só chega a NOTÍCIA, pela boca do Strong Smerg). Com o criador
       morto, os robôs entram em "Protocolo Órfão"; o Mecas assume o código
       deles e monta o exército de androides; os três de Limeira voltam e
       entram na guerra. A Smergula continua só citada em Tel Aviv. */

    /* ---------------- 21 ---------------- */
    { titulo:'Mensageiro do Norte', sinopse:'O Strong Smerg volta a Tel Aviv. Desta vez ele não veio caçar ninguém.',
      cenario:'telaviv', time:['mecas','cargas','careca'], inimigos:['strong_smerg'],
      ajustes:{ inimigo:[{ hp:420, atk:30, spd:13 }] },
      intro:[
        N('TRÊS DIAS DEPOIS. Pela primeira vez em meses, os relógios de Tel Aviv marcam a hora certa.', {cenario:'telaviv'}),
        D('careca','Mochila pronta. Esfregão novo. A gente sai pro reino hoje?'),
        D('mecas','Hoje. O Marcelão já tem três dias de vantagem.'),
        N('Um vulto desce a avenida correndo e levantando poeira. Braços enormes. Boné virado.'),
        D('cargas','Caçador de recompensa. De novo.', {pose:'special'}),
        D('strong_smerg','Calma, faísca! Eu não vim caçar ninguém! Eu vim—'),
        D('cargas','Da última vez você também "não veio caçar ninguém".'),
        D('strong_smerg','...Tá bom. Vai ser do jeito difícil. Mas depois vocês me ESCUTAM.', {pose:'special'})
      ],
      outro:[
        D('strong_smerg','Chega... chega! Escuta! O Marcelão tá MORTO.', {pose:'hurt'}),
        D('mecas','...O quê?'),
        D('strong_smerg','Ele chegou no reino fugindo e implorou abrigo pra rainha. Ofereceu o tempo que roubou de vocês em troca de proteção.'),
        D('strong_smerg','A Smergula aceitou o tempo. Depois sugou a alma dele junto. Na frente da corte inteira.'),
        D('careca','Ela fez isso comigo também. Só que comigo ela deixou o resto vivo pra sofrer.', {pose:'hurt'}),
        D('cargas','Então todo o tempo que ele roubou de Tel Aviv...'),
        D('strong_smerg','...agora é dela. Junto com as almas. Ela tá juntando um exército pra descer o mapa. Tel Aviv primeiro. Depois Limeira.'),
        D('strong_smerg','O Serrinha ficou lá segurando as pontas com o Tupas. Eu vim pedir ajuda. É a primeira vez na vida que eu trabalho de graça.'),
        D('careca','O TUPAS tá vivo? Aquele cara segura um rio inteiro na mão e se afoga numa bacia.'),
        N('Lá no alto da Torre do Relógio, o ponteiro dos segundos treme... e volta UM segundo pra trás.')
      ] },

    /* ---------------- 22 ---------------- */
    { titulo:'O Último Recado', sinopse:'Com o criador morto, o laboratório entra em pânico. E guarda uma mensagem.',
      cenario:'laboratorio', time:['mecas','cargas','careca'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[ORFAO, ORFAO, ORFAO] },
      intro:[
        N('LABORATÓRIO 5000Z. As luzes piscam vermelho. Desta vez a sirene tem outra voz.', {cenario:'laboratorio'}),
        N('"BATIMENTO DO CRIADOR: ZERO. INICIANDO PROTOCOLO ÓRFÃO. TODAS AS UNIDADES: MODO SELVAGEM."', {nome:'ALTO-FALANTE'}),
        D('cargas','Ele deixou até isso pronto. Se ele morresse, as máquinas dele enlouqueciam junto.'),
        D('mecas','Eu sou uma máquina dele.'),
        D('careca','Você é meu amigo que perdia o chinelo. Abaixa a cabeça, vem robô.'),
        N('Três robôs de patrulha saem dos tubos com os olhos piscando sem controle.')
      ],
      outro:[
        N('No meio da sucata, o holograma de uma cápsula liga sozinho. Um homem de casaco branco, cansado.'),
        D('marcelao_black_jw','Unidade 5000Z. Se esta gravação tocou, é porque meu coração parou.', {nome:'GRAVAÇÃO DO MARCELÃO'}),
        D('marcelao_black_jw','Eu fui pro norte achando que a rainha era igual a mim. Uma ladra. Ladrão de tempo devolve com juros. Ela não devolve nada.', {nome:'GRAVAÇÃO DO MARCELÃO'}),
        D('marcelao_black_jw','Meus robôs obedecem a quem tiver o meu código. O código é o seu número. 5000Z. Sempre foi.', {nome:'GRAVAÇÃO DO MARCELÃO'}),
        D('marcelao_black_jw','Não faça isso por mim. Faça porque, se ela parar o mundo, ninguém nunca mais acorda de cápsula nenhuma.', {nome:'GRAVAÇÃO DO MARCELÃO'}),
        D('marcelao_black_jw','Tique... taque.', {nome:'GRAVAÇÃO DO MARCELÃO', pose:'hurt'}),
        N('O holograma apaga.'),
        D('mecas','Ele morreu do jeito que viveu: deixando pra mim o que ele não quis carregar.'),
        D('cargas','Ele ainda é o pior homem que eu conheci. Mas o recado tá certo.')
      ] },

    /* ---------------- 23 ---------------- */
    { titulo:'O Exército de Metal', sinopse:'No ferro-velho, o Mecas usa o código 5000Z. Nem todo robô quer obedecer.',
      cenario:'ferrovelho', time:['mecas','cargas','strong_smerg'], inimigos:['mecas','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[{ nome:'Protótipo-05', hp:240, atk:22, def:10 }, ORFAO, ORFAO] },
      intro:[
        N('O FERRO-VELHO DOS PROTÓTIPOS. Centenas de carcaças. Algumas ainda piscam.', {cenario:'ferrovelho'}),
        D('mecas','"CÓDIGO 5000Z. TODAS AS UNIDADES: ACORDAR."', {pose:'special'}),
        N('Um zumbido atravessa as pilhas de sucata. Olhos acendem, um por um. Dezenas. Centenas.'),
        D('strong_smerg','...Isso aí é um exército. Eu caçava UM desses e achava que era muito.'),
        D('mecas','"PROTÓTIPO-05: COMANDO RECUSADO. PROTOCOLO ÓRFÃO ATIVO."', {forma:0, nome:'PROTÓTIPO-05'}),
        D('cargas','Os que estão em modo selvagem não escutam o código. Tem que desligar na mão.'),
        D('strong_smerg','Na mão é comigo.', {pose:'special'})
      ],
      outro:[
        N('O Protótipo-05 cai — e reinicia. Os olhos voltam azuis, calmos.'),
        D('mecas','"UNIDADE 5000Z: COMANDO ACEITO."', {forma:0, nome:'PROTÓTIPO-05'}),
        N('Em volta deles, uma fileira de androides se levanta do ferro-velho e bate continência ao mesmo tempo.'),
        D('mecas','Vocês não são máquinas do Marcelão. Não mais.'),
        D('mecas','Hoje vocês são de Tel Aviv.', {pose:'special'}),
        D('strong_smerg','Um exército inteiro com a sua cara. Isso vai dar pesadelo na rainha.')
      ] },

    /* ---------------- 24 ---------------- */
    { titulo:'A Caravana de Limeira', sinopse:'Um Astra e um Corsa chegam buzinando. O Lambança voltou — e trouxe Limeira junto.',
      cenario:'telaviv', time:['hans_lambanca','fat_mango','matheus_limeira2'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[ORFAO, ORFAO, ORFAO] },
      intro:[
        N('A entrada da cidade. Um Astra prateado e um Corsa cheio de pão buzinam sem parar.', {cenario:'telaviv'}),
        D('hans_lambanca','TEL AVIV! MINHA TERRA! VOLTEI! Deus abençoe cada pedra dessa rua!'),
        D('fat_mango','Ele acordou em Limeira, rezou na igreja de Limeira, comeu na MINHA padaria... e ainda jura que é daqui.'),
        D('matheus_limeira2','Mil e duzentos quilômetros de novo. E sabe por onde a gente passou? Pelo tal reino dos Smergulus. O Mango errou a curva. DUAS VEZES.'),
        D('fat_mango','Atalho, Mameluco. Era atalho.'),
        D('matheus_limeira2','Lá em Limeira o relógio da igreja parou ontem. 03:33. Igualzinho aqui.'),
        N('Três robôs selvagens que escaparam do ferro-velho cercam os dois carros.'),
        D('hans_lambanca','Ninguém encosta no Astra na minha cidade! Pai, abençoa essa trombada!', {pose:'special'})
      ],
      outro:[
        D('mecas','Lambança. Você voltou.'),
        D('hans_lambanca','Claro que voltei. Fui passar uns dias numa cidadezinha do interior. Nunca tinha ido. Lugar estranho, todo mundo me conhecia.'),
        D('fat_mango','A gente ouviu no rádio do Astra: a rainha do norte quer parar Tel Aviv E Limeira.'),
        D('hans_lambanca','Se ela mexeu com o relógio da igrejinha de Limeira... de uma cidade que eu nunca fui, claro... aí é pessoal.'),
        D('matheus_limeira2','O Astra vai pra guerra. Mas ninguém encosta no retrovisor.'),
        D('fat_mango','E a padaria vai junto. Exército nenhum anda de barriga vazia.'),
        D('strong_smerg','Robôs, um homem do raio, um verme de esfregão e três limeirenses. A rainha não sabe o que tá vindo.')
      ] },

    /* ---------------- 25 · CHEFE ---------------- */
    { titulo:'Rumo ao Reino', chefe:true, final:true, sinopse:'CHEFE · O último guarda do Marcelão tranca a saída da cidade. O exército precisa passar.',
      cenario:'muralha', time:['mecas','cargas','strong_smerg'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'],
      ajustes:{ inimigo:[{ nome:'Colosso Órfão', chefe:true, hp:780, atk:64, def:14, spd:17 }, ORFAO, ORFAO] },
      intro:[
        N('A MURALHA DA CIDADE VELHA, ao amanhecer. O exército de androides em fila. Atrás, um Astra e um Corsa.', {cenario:'muralha'}),
        N('No portão em arco, o Colosso da Muralha se remontou sozinho. Sem dono, sem gelo — só a ordem antiga.'),
        D('mecas_grunt','"PROTOCOLO ÓRFÃO. CRIADOR AUSENTE. NINGUÉM ENTRA. NINGUÉM SAI."', {nome:'COLOSSO ÓRFÃO'}),
        D('mecas','O código não pega nele. A ordem dele é mais velha que eu.'),
        D('cargas','Então a gente derruba de novo. Agora sem o Marcelão pra montar outro.'),
        D('strong_smerg','Eu já perdi pra vocês três vezes. É bom estar do lado certo uma vez.', {pose:'special'})
      ],
      outro:[
        N('O Colosso cai pela última vez. O portão da Muralha se abre para o norte.'),
        N('Do topo da Torre do Relógio, o ponteiro dos segundos volta mais um segundo. Lá no norte, alguém está puxando o tempo.'),
        D('cargas','Mecas. Se a gente perder lá, não sobra relógio nenhum andando no mundo.'),
        D('mecas','Então a gente não perde.'),
        D('careca','Eu esperei esse dia desde que virei verme.', {pose:'special'}),
        D('hans_lambanca','Uma última oração antes da guerra: Senhor, abençoa essa trombada. Todas elas.'),
        D('matheus_limeira2','E o retrovisor do Astra.'),
        D('strong_smerg','Pro norte. Pro Smergulus Kingdom.'),
        N('Androides de Tel Aviv. Um homem do raio. Um caçador de recompensa. Três limeirenses. Um amigo que vira verme.'),
        N('A GUERRA GERAL COMEÇOU.'),
        N('FIM DO CAPÍTULO 1 — TEL AVIV. A história continua no CAPÍTULO 2 — SMERGULUS KINGDOM.')
      ] }
    ]
  };

  /* ============================================================
     CAPÍTULO 2 — SMERGULUS KINGDOM (40 fases)
     O reino da rainha Smergula, contado por quem é de lá:
       · STRONG SMERG — um smerg comum (soldado nº 77) que treinou até
         ficar mais forte que o normal. Só existe um.
       · SERRINHA DOG — era o CACHORRO ORELHA, um vira-lata da vila. A
         rainha o amaldiçoou e ele virou o Serrinha. Os dois viram
         caçadores de recompensa.
       · TUPAS (domina a água, não sabe nadar) e o CARECA (de Tel Aviv,
         vive no reino desde a maldição) — os justiceiros do reino.
       · FAT SMERG — smerg comum que ficou mais gordo que o normal, único
         e poderoso por isso. Compatriota da rainha, anda com ela.
       · Smergs comuns (`smerg_normal`) — os soldados. Existem centenas.
       · Pipoca — um soldado comum medroso que vira o líder dos rebeldes.
     ATO I   (1–10)  antes de Tel Aviv: as origens, até os caçadores
                     pegarem o contrato do Marcelão (→ Cap. 1, fase 4).
     ATO II  (11–20) enquanto isso: o Marcelão foge pro reino e a rainha
                     suga a alma dele (→ Cap. 1, fase 21).
     ATO III (21–30) o reino parado pelo tempo roubado.
     ATO IV  (31–40) A GUERRA GERAL: Tel Aviv (Mecas, Cargas, Careca e os
                     androides) e Limeira (Lambança, Mango, Mameluco)
                     chegam pro lado dos justiceiros.
     ============================================================ */
  /* ⚖ 1.33 — os chefes deste capítulo tinham ESCORREGADO com as mudanças
     de balanço do elenco (Capitão-Mor medido em 66% estava em 98%, Relógio
     Mestre 51% → 91%). Voltaram pra perto do que foi desenhado com `hp` e
     `danoMult` (multiplicador do dano do chefe, ver TurnBattle.iniciar):
     10: 66% · 15: 61% · 20: 54% · 25: 52% · 30: 57% · 36: 66% · 40: 41%
     (simulador, IA comum dos dois lados, 500 lutas). O 19 (Marcelão,
     Fugitivo) estava em 0% desde o kit novo dele e foi pra ~57%. */
  const SMERGULUS = {
    id:'smergulus', nome:'Capítulo 2 — Smergulus Kingdom', icone:'🏰',
    requer:{ cap:'telaviv', texto:'Termine o Capítulo 1 — Tel Aviv para liberar.' },
    fases:[

    /* ======================= ATO I — O REINO DA RAINHA ======================= */

    /* ---------------- 1 ---------------- */
    { titulo:'Smerg Nº 77', sinopse:'No quartel da rainha, um soldado comum não para de treinar.',
      cenario:'reino', time:['strong_smerg'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[RECRUTA, RECRUTA, RECRUTA] },
      intro:[
        N('SMERGULUS KINGDOM. MUITO ANTES DE TEL AVIV.', {cenario:'reino'}),
        N('No reino da rainha Smergula, todo soldado é igual: boné pra trás, camiseta cinza, medo da rainha. Centenas deles.'),
        D('smerg_normal','Nº 77! Toque de recolher foi faz duas horas! Volta pro alojamento!', {nome:'SARGENTO SMERG'}),
        D('smerg_normal','Só mais cem flexões, sargento.', {nome:'SMERG Nº 77'}),
        D('fat_smerg','Deixa ele, sargento. Eu também era igual a vocês, sabia? Um smerg comum. Aí eu comi. E comi. E fiquei ÚNICO.'),
        D('fat_smerg','Mas treinar não faz ninguém único, Nº 77. Treinar faz cansado.'),
        N('Nº 77 treinou aquela noite. E a seguinte. E todas as outras, por um ano inteiro.'),
        N('Até que, numa manhã, o boné não coube mais na cabeça. Nem a camiseta nos braços.'),
        D('strong_smerg','...', {nome:'SMERG Nº 77', pose:'special'}),
        D('smerg_normal','O Nº 77 tá se achando. Vamos lembrar ele que aqui todo mundo é igual.', {nome:'RECRUTA SMERG'})
      ],
      outro:[
        N('Três recrutas no chão. Nº 77 nem suou.'),
        D('fat_smerg','Ora, ora. Faz séculos que o reino não via isso.'),
        D('fat_smerg','No reino só existe UM de cada coisa fora do normal. Eu sou o gordo. Você virou... o forte.'),
        D('strong_smerg','Então pode me chamar assim. Strong. Strong Smerg.'),
        D('fat_smerg','A rainha vai querer te conhecer, Strong. E ninguém diz não pra rainha.')
      ] },

    /* ---------------- 2 ---------------- */
    { titulo:'O Cachorro Orelha', sinopse:'Um vira-lata orelhudo rouba pão da cozinha real. Os soldados querem sopa.',
      cenario:'reino', time:['strong_smerg'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, SOLDADO, SOLDADO] },
      intro:[
        N('A vila do reino. Um cachorro magro, de orelhas maiores que a cabeça, corre com um pão inteiro na boca.'),
        N('Todo mundo na vila conhece ele: o CACHORRO ORELHA. Não tem dono, não tem casa, não tem medo.'),
        D('smerg_normal','PEGA ESSE BICHO! É o pão da mesa da rainha!', {nome:'SOLDADO SMERG'}),
        D('smerg_normal','Hoje a gente janta sopa de orelha!', {nome:'SOLDADO SMERG'}),
        N('O cachorro se esconde atrás de umas pernas enormes.', {nome:'CACHORRO ORELHA'}),
        D('strong_smerg','Três soldados atrás de um cachorro com fome. É isso que a rainha manda vocês fazerem?'),
        D('smerg_normal','Sai da frente, Nº 77. Ordem é ordem.', {nome:'SOLDADO SMERG'}),
        D('strong_smerg','Meu nome agora é Strong.', {pose:'special'})
      ],
      outro:[
        N('Os soldados fogem. O cachorro solta o pão no pé do Strong — e empurra com o focinho.', {nome:'CACHORRO ORELHA'}),
        D('strong_smerg','Pra mim? Você roubou o pão da rainha pra dividir comigo?'),
        N('"Au."', {nome:'CACHORRO ORELHA'}),
        D('strong_smerg','...Tá. A gente divide. Mas a rainha vai lembrar da sua cara, Orelha. E da minha.')
      ] },

    /* ---------------- 3 ---------------- */
    { titulo:'A Maldição da Rainha', sinopse:'Strong é chamado ao trono. O Cachorro Orelha vai junto — e sai de lá diferente.',
      cenario:'castelo', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, LANCEIRO, SOLDADO] },
      intro:[
        N('O SALÃO DO TRONO. Tochas, pedra roxa — e almas presas, subindo devagar pelo teto.', {cenario:'castelo'}),
        D('smergula','Então esse é o smerg que ficou forte demais. Ajoelha, Nº 77.'),
        D('strong_smerg','Strong, majestade. E eu não ajoelho.'),
        D('smergula','Eu ofereço um posto de general. Um exército seu. E você só precisa me dar... um pedacinho da sua alma.'),
        D('fat_smerg','É um bom negócio, Strong. Eu dei o meu pedacinho. Nunca mais passei fome.'),
        N('O Cachorro Orelha sobe na mesa do banquete e abocanha a coxa de frango do prato da rainha.', {nome:'CACHORRO ORELHA'}),
        D('smergula','...Esse bicho. De novo.', {pose:'special'}),
        D('smergula','Você quer comer na mesa como gente, cachorro? Então seja gente. METADE.', {pose:'special'}),
        N('Um véu preto cai sobre o cachorro. Ossos estalam. Orelhas encolhem. Ele fica de pé — sobre DUAS patas.'),
        D('serrinha_dog','...', {pose:'hurt', nome:'???'}),
        D('smergula','Agora você é meu bichinho de estimação. GUARDAS: o forte também. Vivo.')
      ],
      outro:[
        D('serrinha_dog','Eu... falo? Eu FALO!', {pose:'hurt', nome:'???'}),
        D('serrinha_dog','E a primeira coisa que eu quero dizer é: CORRE, GRANDÃO!', {nome:'???'}),
        D('smergula','Fujam. O reino inteiro é meu. Não existe lugar aqui onde eu não encontre vocês.'),
        D('fat_smerg','Majestade... quer que eu vá atrás?'),
        D('smergula','Não, meu gordinho. Deixa eles correrem. Quem corre cansa. E quem cansa, volta.')
      ] },

    /* ---------------- 4 ---------------- */
    { titulo:'Fuga pelos Telhados', sinopse:'O forte e o cachorro amaldiçoado fogem pela vila. A guarda inteira atrás.',
      cenario:'reino', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[LANCEIRO, LANCEIRO, SOLDADO] },
      intro:[
        N('Os telhados da vila. Atrás deles, sinos de alarme. Embaixo, uma fila de lanças.', {cenario:'reino'}),
        D('serrinha_dog','Eu tenho mão. Eu tenho DEDO. Olha isso. Eu consigo segurar um pão sem babar nele.'),
        D('strong_smerg','Foca, Orelha! Tem lanceiro subindo pela calha!'),
        D('serrinha_dog','Não me chama de Orelha. O Cachorro Orelha ficou lá no salão.', {pose:'special'})
      ],
      outro:[
        D('strong_smerg','Se não é Orelha, é o quê?'),
        D('serrinha_dog','Ela me fez metade gente pra eu ser bicho de estimação dela. Errou. Agora eu sou metade gente com dente de cachorro.'),
        D('serrinha_dog','Os dentes ficaram assim, ó. Feito uma serrinha.'),
        D('strong_smerg','Serrinha. ...Serrinha Dog.'),
        D('serrinha_dog','Serrinha Dog. Gostei. Ninguém nunca me deu nome nenhum.')
      ] },

    /* ---------------- 5 ---------------- */
    { titulo:'Água Que Não Molha', sinopse:'No esgoto do reino, um homem controla a água — e não chega perto dela.',
      cenario:'esgoto', time:['strong_smerg','serrinha_dog'], inimigos:['tupas'],
      ajustes:{ inimigo:[{ hp:400, atk:24, spd:11 }] },
      intro:[
        N('O ESGOTO DO REINO. O único lugar onde os soldados da rainha não descem.', {cenario:'esgoto'}),
        N('A água do canal se levanta sozinha e forma uma parede na frente deles.'),
        D('tupas','Mais um passo e eu afogo os dois. Soldado da rainha não entra no meu esgoto.'),
        D('strong_smerg','A gente não é soldado. A gente FUGIU da rainha.'),
        D('tupas','É o que todo espião diz.'),
        D('serrinha_dog','Você vai afogar a gente? Você tá se equilibrando num cano pra não pisar na água.'),
        D('tupas','...Eu prefiro o cano. Em guarda!', {pose:'special'})
      ],
      outro:[
        D('tupas','Tá bom, tá bom! Espião não apanha tão bem assim.', {pose:'hurt'}),
        D('tupas','Eu sou o Tupas. Justiceiro do reino. Eu protejo a vila dos cobradores da rainha.'),
        D('strong_smerg','Você manda na água inteira desse esgoto. Por que fica em cima do cano?'),
        D('tupas','Porque eu não sei nadar.'),
        D('serrinha_dog','...'),
        D('tupas','Água que obedece não precisa de braçada. Fim de assunto.')
      ] },

    /* ---------------- 6 ---------------- */
    { titulo:'O Rapaz de Tel Aviv', sinopse:'Um forasteiro de cabelo cacheado vem pedir um favor à rainha. Péssima ideia.',
      cenario:'castelo', time:['careca'], inimigos:['smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, SOLDADO] },
      intro:[
        N('ALGUMAS SEMANAS DEPOIS. Um forasteiro atravessa o salão do trono segurando um esfregão.', {cenario:'castelo'}),
        D('careca','Majestade. Eu vim de Tel Aviv. Meu melhor amigo sumiu: um homem de casaco branco levou ele da rua.'),
        D('careca','Dizem que a rainha do norte acha qualquer um. Eu pago o que for.'),
        D('smergula','Qualquer preço? Que fofo. O preço é uma alma. A sua.'),
        D('careca','...Minha alma eu não vendo. Nem pelo Mecas.'),
        D('smergula','Ninguém perguntou se você vende, cacheado. GUARDAS.'),
        D('careca','Eu só vim aqui com um esfregão. Mas um esfregão já resolve.', {pose:'special'})
      ],
      outro:[
        D('smergula','Ele bate nos meus soldados com um ESFREGÃO. Que ofensa.'),
        D('smergula','Você quer tanto ficar no chão limpando? Então rasteja nele. Pra sempre.', {pose:'special'}),
        N('O véu preto cai de novo. O Careca se encolhe, se enrola... e o que sobra no chão do salão é um verme.'),
        D('careca','O que... o que você fez comigo?!', {forma:1, pose:'hurt'}),
        D('smergula','Um presente. Cada vez que você cair, vai voltar assim. Joguem no fosso.'),
        N('NO FOSSO DO CASTELO. O verme afunda... e a água o cospe de volta pra margem, sozinha.', {cenario:'esgoto'}),
        D('tupas','Não me pede pra entrar aí. A água te trouxe. Agradece a ela.'),
        D('careca','...Obrigado, água.', {forma:1, pose:'hurt'})
      ] },

    /* ---------------- 7 ---------------- */
    { titulo:'Pedágio de Alma', sinopse:'Dois turistas de Limeira, a caminho de Tel Aviv, erram a curva. Feio.',
      cenario:'mata', time:['fat_mango','matheus_limeira2','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, LANCEIRO, SOLDADO] },
      intro:[
        N('A ESTRADA DA FRONTEIRA. Um Astra prateado, carregado de mala, freia na frente de uma cancela roxa.', {cenario:'mata'}),
        D('matheus_limeira2','Mango. O GPS falou "vire à esquerda" faz duzentos quilômetros.'),
        D('fat_mango','Atalho, Mameluco. Confia. Tel Aviv é logo ali.'),
        D('smerg_normal','PEDÁGIO DA RAINHA SMERGULA. UMA ALMA POR CARRO.', {nome:'COBRADOR SMERG'}),
        D('matheus_limeira2','Alma? O Astra TEM alma. Ninguém leva.'),
        N('A água de uma poça se levanta e derruba a cancela.'),
        D('tupas','Pedágio de alma é roubo. E roubo, nesse reino, passa por mim.'),
        D('fat_mango','Não sei quem você é, moço, mas a padaria agradece. Bora!')
      ],
      outro:[
        D('tupas','Vocês tão indo pra onde?'),
        D('matheus_limeira2','Tel Aviv. Férias.'),
        D('tupas','Tel Aviv é pro sudeste. Vocês tão indo pro norte.'),
        D('fat_mango','Eu sabia.'),
        D('matheus_limeira2','Você falou "atalho", Mango.'),
        N('O Astra dá meia-volta. Mil e duzentos quilômetros ainda pela frente.'),
        D('tupas','Gente estranha. Gente boa. Tomara que eu nunca mais precise deles.')
      ] },

    /* ---------------- 8 ---------------- */
    { titulo:'Primeiro Contrato', sinopse:'Sem casa e sem dinheiro, Strong e Serrinha descobrem uma profissão.',
      cenario:'reino', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[DESERTOR, { nome:'Chefe do Bando', hp:220, atk:20, def:7, spd:9 }, DESERTOR] },
      intro:[
        N('Um cartaz pregado na porta da taverna da vila:', {cenario:'reino'}),
        N('"PROCURA-SE: BANDO DO PÉ-DE-CABRA. ASSALTA A VILA TODA NOITE. RECOMPENSA: 30 MOEDAS. ASS: OS MORADORES."', {nome:'CARTAZ'}),
        D('serrinha_dog','Trinta moedas pra bater em quem merece apanhar? Isso é trabalho?'),
        D('strong_smerg','Parece que é. E paga melhor que ser soldado.'),
        D('smerg_normal','Tá olhando o quê, grandão? A vila é nossa depois que escurece.', {nome:'CHEFE DO BANDO'}),
        D('serrinha_dog','Escureceu.', {pose:'special'})
      ],
      outro:[
        N('Trinta moedas numa sacolinha. O dono da taverna aperta a mão dos dois.'),
        D('strong_smerg','A gente bate em quem merece e ainda recebe. Caçador de recompensa.'),
        D('serrinha_dog','Eu gosto disso. Ninguém é dono da gente. Quem paga é cliente.'),
        D('strong_smerg','Strong e Serrinha. Caçadores de recompensa.'),
        D('serrinha_dog','Serrinha e Strong. Eu que mordo.')
      ] },

    /* ---------------- 9 ---------------- */
    { titulo:'Justiça Não Tem Preço', sinopse:'O próximo alvo dos caçadores está escondido... atrás dos justiceiros.',
      cenario:'esgoto', time:['strong_smerg','serrinha_dog'], inimigos:['tupas','careca'],
      ajustes:{ inimigo:[{ hp:155, atk:15 }, { hp:145, atk:15 }] },
      intro:[
        N('"PROCURA-SE: SMERG DESERTOR. ROUBOU PÃO DA COZINHA REAL. RECOMPENSA: 80 MOEDAS. ASS: A COROA."', {nome:'CARTAZ', cenario:'esgoto'}),
        D('serrinha_dog','Oitenta moedas! E é pago pela rainha, Strong. Dinheiro dela no NOSSO bolso.'),
        N('No fundo do esgoto, um soldado magrinho treme atrás de dois justiceiros.'),
        D('smerg_normal','N-não me entreguem... eu só peguei pão pra minha mãe...', {nome:'DESERTOR', forma:1}),
        D('careca','Ele fica. Pão pra mãe não é crime.'),
        D('tupas','No meu esgoto ninguém caça faminto.'),
        D('strong_smerg','Contrato é contrato, justiceiro.'),
        D('careca','Então vem buscar.', {pose:'special'})
      ],
      outro:[
        D('strong_smerg','...Pão pra mãe, é?', {pose:'hurt'}),
        D('smerg_normal','A rainha cobra alma até da comida. Ela não come, ela não dorme... só cobra.', {nome:'DESERTOR', forma:1}),
        D('strong_smerg','Some daqui. Não vi ninguém. Contrato cancelado.'),
        D('serrinha_dog','Oitenta moedas, Strong...'),
        D('strong_smerg','Eu sei.'),
        D('tupas','Vocês trabalham por dinheiro.'),
        D('serrinha_dog','Vocês trabalham de graça.'),
        D('careca','Cada um com a sua religião. Mas hoje vocês fizeram justiça. De graça.')
      ] },

    /* ---------------- 10 · CHEFE ---------------- */
    { titulo:'O Cobrador da Rainha', chefe:true, sinopse:'CHEFE · Fat Smerg vem cobrar o imposto de alma da vila. Pessoalmente.',
      cenario:'reino', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','fat_smerg','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, { nome:'Fat Smerg', chefe:true, hp:572, atk:30, def:14, spd:9, danoMult:1.06 }, SOLDADO] },
      intro:[
        N('A praça da vila. Os moradores em fila, cada um com um potinho de vidro na mão.', {cenario:'reino'}),
        D('fat_smerg','Imposto de alma! Um pedacinho por cabeça. Não dói. Quer dizer... dói um pouquinho.'),
        D('fat_smerg','Ninguém nesse reino é forte o bastante pra dizer não pra rainha. Né, Strong?'),
        D('strong_smerg','Eu disse não pra ela na cara dela.'),
        D('fat_smerg','E olha onde você foi parar. Morando num ESGOTO.'),
        D('tupas','O esgoto é meu. Ele é visita.'),
        D('fat_smerg','Ninguém aqui é único, só eu e a rainha. Vou lembrar vocês disso.', {pose:'special'})
      ],
      outro:[
        D('fat_smerg','Uff... você bate forte, Strong. Fora do normal mesmo.', {pose:'hurt'}),
        D('fat_smerg','A rainha vai saber disso. E quando ela souber, eu não vou poder te proteger.'),
        D('strong_smerg','Você nunca me protegeu.'),
        D('fat_smerg','...Protegi mais do que você imagina.'),
        N('O Fat Smerg vai embora. Um corvo pousa na praça com um cartaz amarrado na pata.'),
        N('"PROCURA-SE: CIBORGUE 5000Z. FUGIU DO LABORATÓRIO. TEL AVIV. PAGA-SE EM TEMPO. — M.B.JW"', {nome:'CARTAZ'}),
        D('serrinha_dog','Paga em TEMPO? Strong, a gente nunca viu um prêmio desse tamanho.'),
        D('careca','Esse rosto... no desenho... debaixo do metal...'),
        D('careca','É o MECAS. É o meu amigo!', {pose:'special'}),
        D('strong_smerg','Então todo mundo vai pra Tel Aviv.'),
        D('tupas','Alguém tem que ficar. A rainha não vai gostar do que aconteceu hoje.'),
        N('E foi assim que dois caçadores de recompensa e um rapaz amaldiçoado foram parar em Tel Aviv.'),
        N('FIM DO ATO I.')
      ] },

    /* ======================= ATO II — ENQUANTO ISSO, NO REINO ======================= */

    /* ---------------- 11 ---------------- */
    { titulo:'Sozinho no Reino', sinopse:'Com os caçadores em Tel Aviv, o Tupas segura a vila sozinho.',
      cenario:'reino', time:['tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[SOLDADO, LANCEIRO, SOLDADO] },
      intro:[
        N('ENQUANTO ISSO, NO REINO. A rainha mandou a resposta para a praça da vila: soldados com tochas.', {cenario:'reino'}),
        D('smerg_normal','Ordem da rainha: quem ajudou o forte e o cachorro paga em dobro!', {nome:'SOLDADO SMERG'}),
        D('tupas','Quem ajudou fui eu. Cobra de mim.'),
        D('smerg_normal','Ele tá sozinho! Sem os caçadores, sem o verme!', {nome:'SOLDADO SMERG'}),
        D('tupas','Sozinho não. Tem um poço aqui do lado.', {pose:'special'})
      ],
      outro:[
        N('Dois soldados fogem encharcados. O terceiro fica — de joelhos, tremendo, com o boné no peito.'),
        D('smerg_normal','N-não me afoga! Eu nem queria vir! Eu nunca quero vir!', {forma:1, nome:'SOLDADO SMERG Nº 312', pose:'idle'}),
        D('tupas','Se não queria, por que veio?'),
        D('smerg_normal','Porque a rainha manda a gente na frente e fica lá atrás. Quem não vai... vira potinho.', {forma:1, nome:'SOLDADO SMERG Nº 312'}),
        D('tupas','Você tem nome, Nº 312?'),
        D('smerg_normal','Os outros me chamam de Pipoca. Porque eu pulo de susto com qualquer barulho.', {forma:1, nome:'PIPOCA', pose:'special'})
      ] },

    /* ---------------- 12 ---------------- */
    { titulo:'O Desertor Pipoca', sinopse:'Pipoca troca de lado. Os ex-colegas dele não gostam nada disso.',
      cenario:'esgoto', time:['tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, PIPOCA], inimigo:[LANCEIRO, SOLDADO, LANCEIRO] },
      intro:[
        N('O esconderijo dos justiceiros. O Pipoca desenha o castelo no chão com um graveto.', {cenario:'esgoto'}),
        D('smerg_normal','No alto da torre ela guarda os potinhos de alma. Centenas. Ela chama de Relógio de Almas.', {nome:'PIPOCA'}),
        D('smerg_normal','Cada potinho que enche, ela fica mais forte. E mais diferente. O rosto dela já não é o mesmo.', {nome:'PIPOCA'}),
        D('tupas','Por que você tá me contando isso?'),
        D('smerg_normal','Porque o soldado que bate em você é igualzinho eu. Só que ninguém nunca perguntou o nome dele.', {nome:'PIPOCA'}),
        N('Passos no túnel. Lanças.'),
        D('smerg_normal','O 312 virou casaca! Pega ele junto!', {nome:'LANCEIRO SMERG'}),
        D('smerg_normal','Ai, mãe. Tá bom. TÁ BOM. Eu luto!', {nome:'PIPOCA', forma:1, pose:'special'})
      ],
      outro:[
        D('smerg_normal','Eu... eu ganhei? EU GANHEI UMA LUTA!', {nome:'PIPOCA', pose:'win'}),
        D('tupas','A gente ganhou.'),
        D('smerg_normal','Tem mais gente como eu, Tupas. Com medo. Mas cansada de ter medo.', {nome:'PIPOCA'}),
        D('tupas','Então a gente começa uma coleção.')
      ] },

    /* ---------------- 13 ---------------- */
    { titulo:'A Volta dos Caçadores', sinopse:'Strong e Serrinha voltam de Tel Aviv — e a fronteira está fechada.',
      cenario:'mata', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[LANCEIRO, CAPITAO, LANCEIRO] },
      intro:[
        N('A FRONTEIRA. Dois vultos conhecidos voltando pela estrada — sem prêmio nenhum.', {cenario:'mata'}),
        D('tupas','Voltaram cedo. Cadê o tempo que iam ganhar?'),
        D('strong_smerg','Contrato cancelado. O homem pagava com tempo roubado de outra gente.'),
        D('serrinha_dog','Lá em Tel Aviv tem um robô com cara de gente, um homem que vira raio e um padre que jura que é de lá. Não é.'),
        D('tupas','E o Careca?'),
        D('serrinha_dog','Achou o amigo dele. O robô. Ficou por lá.'),
        D('smerg_normal','ALTO! A rainha fechou a fronteira. Ninguém entra.', {nome:'CAPITÃO SMERG'}),
        D('strong_smerg','A gente é DAQUI.', {pose:'special'})
      ],
      outro:[
        D('smerg_normal','A rainha... a rainha tá esperando alguém. Um visitante. Ninguém pode atrapalhar a chegada dele.', {nome:'CAPITÃO SMERG', pose:'hurt'}),
        D('serrinha_dog','Que visitante?'),
        D('smerg_normal','Ninguém sabe. Só que ele vem do sul. E vem com pressa.', {nome:'CAPITÃO SMERG', pose:'hurt'})
      ] },

    /* ---------------- 14 ---------------- */
    { titulo:'Rebelião dos Bonés', sinopse:'Um capitão chicoteia soldados com medo. O Pipoca não aguenta ver.',
      cenario:'reino', time:['strong_smerg','serrinha_dog','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[SOLDADO, CAPITAO, SOLDADO] },
      intro:[
        N('O pátio do quartel. Uma fila de soldados de joelhos, de boné na mão.', {cenario:'reino'}),
        D('smerg_normal','Medo é desobediência! Quem tremer na guerra, vira potinho!', {nome:'CAPITÃO SMERG'}),
        D('smerg_normal','...Eu tremia na fila igual eles. Todo dia.', {nome:'PIPOCA', forma:1}),
        D('strong_smerg','Eu também. Eu era o Nº 77 dessa fila.'),
        D('serrinha_dog','E eu era o cachorro que comia o resto da comida de vocês. A gente é tudo da mesma rua.'),
        D('smerg_normal','EU NÃO VOU TREMER MAIS!', {nome:'PIPOCA', pose:'special'})
      ],
      outro:[
        N('Um por um, os soldados de joelhos se levantam. E viram o boné pra frente.'),
        D('smerg_normal','Boné pra frente é... é rebelde! Eles estão com a gente!', {nome:'PIPOCA', pose:'win'}),
        D('strong_smerg','Uma rebelião de bonés. Nunca achei que ia ver isso.'),
        D('serrinha_dog','A rainha vai odiar. Já gostei.')
      ] },

    /* ---------------- 15 ---------------- */
    { titulo:'O Capitão-Mor', chefe:true, sinopse:'CHEFE · O comandante da guarda vem esmagar a rebelião antes que ela cresça.',
      cenario:'reino', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[CAPITAO, { nome:'Capitão-Mor Smergão', chefe:true, hp:870, atk:60, def:13, spd:12, danoMult:1.06 }, CAPITAO] },
      intro:[
        N('O portão do quartel cai no chão. Atrás dele, o maior smerg comum que o reino já viu de armadura.'),
        D('smerg_normal','Rebelião de BONÉ? Eu sou o Capitão-Mor desse exército. Eu treinei cada um de vocês.', {nome:'CAPITÃO-MOR SMERGÃO'}),
        D('smerg_normal','Inclusive você, Nº 77.', {nome:'CAPITÃO-MOR SMERGÃO'}),
        D('strong_smerg','O senhor me ensinou a dar soco. Eu aprendi sozinho em quem dar.'),
        D('tupas','Pipoca, leva os rebeldes pro esgoto. A gente segura ele.')
      ],
      outro:[
        D('smerg_normal','Vocês não entendem... a rainha não quer só o reino...', {nome:'CAPITÃO-MOR SMERGÃO', pose:'hurt'}),
        D('smerg_normal','O visitante do sul... ele traz o TEMPO de uma cidade inteira. Com isso ela para o mundo.', {nome:'CAPITÃO-MOR SMERGÃO', pose:'hurt'}),
        D('serrinha_dog','O tempo de uma cidade inteira... Strong. O homem do relógio.'),
        D('strong_smerg','O Marcelão. Ele tá vindo pra cá.')
      ] },

    /* ---------------- 16 ---------------- */
    { titulo:'Astra na Contramão (de Novo)', sinopse:'Os dois turistas de Limeira, voltando pra casa, erram a mesmíssima curva.',
      cenario:'mata', time:['fat_mango','matheus_limeira2','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[LANCEIRO, LANCEIRO, CAPITAO] },
      intro:[
        N('A ESTRADA DA FRONTEIRA, de novo. O mesmo Astra prateado. A mesma cancela roxa.', {cenario:'mata'}),
        D('matheus_limeira2','Mango. Mango. MANGO. É o MESMO pedágio. A gente passou aqui na IDA.'),
        D('fat_mango','Atalho pra Limeira. Confia.'),
        D('serrinha_dog','Os turistas de Limeira! Eu vi vocês em Tel Aviv! Na padaria!'),
        D('fat_mango','O cachorro dos caçadores! Ainda bem, um rosto conhecido!'),
        D('smerg_normal','PEDÁGIO DA RAINHA. AGORA SÃO DUAS ALMAS POR CARRO. INFLAÇÃO.', {nome:'COBRADOR SMERG'}),
        D('matheus_limeira2','Inflação?! Isso pede porrada.', {pose:'special'})
      ],
      outro:[
        D('fat_mango','Notícia fresca de Tel Aviv: o robô e o homem do raio venceram o Marcelão lá na Torre!'),
        D('matheus_limeira2','Mas ele fugiu. Virou uma rachadura de gelo e foi pro norte.'),
        D('serrinha_dog','Norte é aqui.'),
        D('fat_mango','...Ah.'),
        D('matheus_limeira2','E o Lambança sumiu num clarão. Dizem que foi parar em Limeira. A gente vai buscar ele.'),
        D('fat_mango','Se precisarem de ajuda, Limeira fica a mil e duzentos quilômetros. O Mango erra a curva, mas o Mango chega.'),
        D('matheus_limeira2','Eu dirijo na volta.')
      ] },

    /* ---------------- 17 ---------------- */
    { titulo:'Rachadura no Céu', sinopse:'Uma fenda de gelo corta o céu do reino. Tudo que ela toca, congela.',
      cenario:'reino', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[congelado('Soldado Smerg', { hp:190, atk:20, def:8 }), congelado('Lanceiro Smerg', { hp:200, atk:22, def:8 }), congelado('Soldado Smerg', { hp:190, atk:20, def:8 })] },
      intro:[
        N('Uma rachadura branca risca o céu do reino, de sul a norte. Faz tique. Faz taque.', {cenario:'reino'}),
        N('Por onde ela passa, os soldados da patrulha ficam parados no meio do passo — com olhos azuis, gelados.'),
        D('strong_smerg','Olhos azuis. Igual os marionetes do Marcelão em Tel Aviv.'),
        D('tupas','Gelo é água que esqueceu de correr. Eu cuido disso.'),
        N('As três cabeças viram ao mesmo tempo. Tique. Taque.')
      ],
      outro:[
        N('O gelo derrete. Os soldados acordam sem lembrar de nada.'),
        D('smerg_normal','Um homem de casaco branco passou por aqui... perguntou o caminho do castelo...', {nome:'SOLDADO SMERG', forma:1}),
        D('smerg_normal','...e pediu pra ver as horas no meu relógio.', {nome:'SOLDADO SMERG', forma:1}),
        D('serrinha_dog','Ele chegou. O Marcelão tá no reino.')
      ] },

    /* ---------------- 18 ---------------- */
    { titulo:'O Ladrão Pede Abrigo', sinopse:'Escondidos no salão do trono, os heróis assistem a um acordo terrível.',
      cenario:'castelo', time:['strong_smerg','serrinha_dog','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[GUARDA_REAL, GUARDA_REAL, GUARDA_REAL] },
      intro:[
        N('O SALÃO DO TRONO. Escondidos atrás de uma coluna: Strong, Serrinha e o Pipoca, tremendo.', {cenario:'castelo'}),
        D('marcelao_black_jw','Majestade. Eu trago o tempo de uma cidade inteira. Tel Aviv, segundo por segundo.', {pose:'hurt'}),
        D('marcelao_black_jw','Em troca, só peço abrigo. Um robô e um homem do raio estão atrás de mim.'),
        D('smergula','Tempo... A coisa mais valiosa do mundo, não é o que dizem?'),
        D('marcelao_black_jw','É o que EU digo.'),
        D('smergula','Você diz errado.'),
        D('smerg_normal','Atchim!', {nome:'PIPOCA', forma:1, pose:'special'}),
        D('smergula','...Temos ratos atrás da coluna. GUARDAS.')
      ],
      outro:[
        N('Os guardas caem. Mas no trono, a rainha nem olhou para a luta.'),
        D('smergula','Fiquem. Assistam. É bom vocês aprenderem como se faz um negócio comigo.'),
        D('marcelao_black_jw','Majestade... o acordo...', {pose:'hurt'}),
        D('smergula','O acordo era o tempo. E eu aceito.', {pose:'special'})
      ] },

    /* ---------------- 19 ---------------- */
    { titulo:'O Último Truque do Relógio', sinopse:'O Marcelão percebe a armadilha e tenta fugir — passando por cima de quem estiver na frente.',
      cenario:'castelo', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','marcelao_black_jw','smerg_normal'],
      /* ⚖ 1.33: 0% de vitória desde o kit novo do Marcelão (1.28) — ~60% agora */
      ajustes:{ inimigo:[congelado('Guarda Real', { hp:200, atk:22, def:9 }), { nome:'Marcelão, Fugitivo', chefe:true, hp:570, atk:30, def:13, spd:16, danoMult:0.65 }, congelado('Guarda Real', { hp:200, atk:22, def:9 })] },
      intro:[
        D('marcelao_black_jw','Não... ela não quer o tempo. Ela quer a ALMA de quem segura o tempo.', {pose:'hurt'}),
        D('marcelao_black_jw','Saiam da minha frente. Eu tenho TODO o tempo do mundo — e vou usar ele pra sair daqui.', {pose:'special'}),
        D('strong_smerg','Você pagou a gente com tempo roubado, Marcelão.'),
        D('strong_smerg','Agora a recompensa é VOCÊ.', {pose:'special'}),
        D('tupas','Tirei a água do fosso por um túnel. Ele não sai por baixo.'),
        D('serrinha_dog','E por cima ele não passa de mim.')
      ],
      outro:[
        N('O Marcelão cai de joelhos. O relógio no bolso dele racha.'),
        D('marcelao_black_jw','Hah... três smergs. Eu fugi de um ciborgue e de um raio... pra cair pra três smergs.', {pose:'hurt'}),
        D('marcelao_black_jw','Escutem... avisem a unidade 5000Z... o laboratório guarda um—', {pose:'hurt'}),
        N('Uma sombra cobre o salão inteiro. A rainha desceu do trono.'),
        D('smergula','Shhh. Chega de conversa, relojoeiro.')
      ] },

    /* ---------------- 20 · CHEFE ---------------- */
    { titulo:'A Rainha Cobra a Conta', chefe:true, sinopse:'CHEFE · A Smergula suga a alma do Marcelão — e o tempo de Tel Aviv junto.',
      cenario:'castelo', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smergula'],
      ajustes:{ inimigo:[GUARDA_REAL, { nome:'Sombra da Rainha', chefe:true, hp:477, atk:27, def:10, spd:12, danoMult:1.06 }] },
      intro:[
        D('smergula','Todo o tempo de uma cidade inteira... e a alma de quem roubou ele. Dois pratos num jantar só.', {pose:'special'}),
        D('marcelao_black_jw','Tique...', {pose:'hurt'}),
        D('smergula','Taque.', {pose:'special'}),
        N('Um fio branco sai do peito do Marcelão e entra na boca da rainha. O casaco branco cai vazio no chão.'),
        N('MARCELÃO BLACK JW, O LADRÃO DE TEMPO, ESTÁ MORTO.'),
        N('Os olhos da Smergula ficam azuis por um instante. Todos os relógios do castelo param. Depois voltam a andar — pra trás.'),
        D('smergula','Ah. Então é ASSIM que é ter todo o tempo do mundo.'),
        D('fat_smerg','Majestade... e os três?'),
        D('smergula','Eu não vou sujar a mão com eles. Minha sombra cuida. E um guarda pra ela não se sentir sozinha.')
      ],
      outro:[
        N('A sombra da rainha se desfaz em fumaça — e a rainha, no trono, só sorri. Nem um arranhão.'),
        D('smergula','Que gracinha. Venceram a minha sombra.'),
        D('smergula','Amanhã eu paro o reino. Depois Tel Aviv. Depois aquela cidadezinha do interior. Limeira.'),
        N('A água do fosso explode pelas janelas do salão — e leva os três embora num jato.', {cenario:'esgoto'}),
        D('tupas','Respirem. Tão vivos. Eu continuo sem saber nadar, mas a água me deve favores.'),
        D('strong_smerg','Ela tem o tempo de uma cidade inteira agora. A gente não ganha isso sozinho.'),
        D('strong_smerg','Eu vou pra Tel Aviv. Eles derrubaram o Marcelão. Vão querer derrubar ela também.'),
        D('serrinha_dog','E eu?'),
        D('strong_smerg','Você fica. Se eu levar o único cachorro que já mordeu a rainha, quem defende o reino?'),
        D('serrinha_dog','...Volta logo, grandão.'),
        N('FIM DO ATO II. (Em Tel Aviv, o Strong chega com a notícia — Capítulo 1, fase 21.)')
      ] },

    /* ======================= ATO III — O REINO PARADO ======================= */

    /* ---------------- 21 ---------------- */
    { titulo:'O Reino Parou', sinopse:'Com o tempo roubado, a rainha congela as vilas. Só os soldados dela se mexem.',
      cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[RELOGIO, SOLDADO, RELOGIO] },
      intro:[
        N('NA MANHÃ SEGUINTE. A vila inteira parada no meio do dia: o padeiro com o pão no ar, as crianças no meio do pulo.', {cenario:'reino'}),
        D('serrinha_dog','Ela fez igual o Marcelão fez em Tel Aviv. Só que pior.'),
        D('smerg_normal','Olha os soldados! Eles têm um relógio no peito! Brilhando!', {nome:'PIPOCA', forma:1}),
        N('Três soldados andam pela vila parada. No peito de cada um, um mostrador azul bate tique-taque.'),
        D('tupas','Ela dividiu o tempo do Marcelão entre os soldados. Agora eles são mais rápidos que a gente.'),
        D('serrinha_dog','Mais rápido que eu? Isso eu quero ver.', {pose:'special'})
      ],
      outro:[
        N('O relógio no peito de um soldado quebra. O padeiro da vila pisca, e o pão cai no chão.'),
        D('tupas','Quebrou o relógio do soldado, o tempo volta pra quem foi roubado.'),
        D('smerg_normal','Igual... igual as máquinas do Marcelão. Quebra a máquina, volta o tempo.', {nome:'PIPOCA'}),
        D('serrinha_dog','Então a gente quebra todos.')
      ] },

    /* ---------------- 22 ---------------- */
    { titulo:'Os Caçadores de Cão', sinopse:'A rainha quer o bichinho de estimação de volta. O bichinho cresceu.',
      cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[{ nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }, { nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }, { nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }] },
      intro:[
        N('O beco onde o Cachorro Orelha dormia. Um caixote, um pano velho, um pote de água seco.', {cenario:'reino'}),
        D('serrinha_dog','Eu dormia aqui. Bem aqui. Antes de ter mão.'),
        D('tupas','Quer ver?'),
        N('O Tupas levanta uma lâmina de água na frente dele, lisa como um espelho. No reflexo: um cachorro magro, de orelhas enormes.'),
        D('serrinha_dog','...Oi, Orelha.', {pose:'hurt'}),
        D('smerg_normal','Ordem da rainha: recolher o bichinho de estimação dela. Com coleira.', {nome:'CAÇADOR DE CÃO'}),
        D('serrinha_dog','O bichinho cresceu.', {pose:'special'})
      ],
      outro:[
        D('serrinha_dog','Ela me fez metade gente achando que eu ia ser metade dela.'),
        D('serrinha_dog','Sabe o que o Orelha fazia quando alguém tentava pôr coleira nele? Mordia.'),
        D('smerg_normal','Você ainda morde.', {nome:'PIPOCA'}),
        D('serrinha_dog','Agora com dente de serra.')
      ] },

    /* ---------------- 23 ---------------- */
    { titulo:'Represa', sinopse:'A rainha fecha o rio pra afogar o esconderijo. Logo o esgoto do Tupas.',
      cenario:'esgoto', time:['tupas','serrinha_dog','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, REBELDE], inimigo:[LANCEIRO, { nome:'Capitão da Represa', hp:300, atk:28, def:10, spd:11 }, LANCEIRO] },
      intro:[
        N('O esgoto treme. A água sobe rápido — pela canela, pelo joelho, pela cintura.', {cenario:'esgoto'}),
        D('smerg_normal','Fecharam a represa do rio! Vão encher o esgoto inteiro com a gente dentro!', {nome:'SMERG REBELDE', forma:1}),
        D('serrinha_dog','Tupas... a água tá no seu peito.'),
        D('tupas','Eu tô vendo.', {pose:'hurt'}),
        D('tupas','Água que obedece... não precisa de braçada.'),
        D('tupas','OBEDECE.', {pose:'special'}),
        N('A água para. Toda ela. E começa a voltar pelo túnel, contra a corrente, na direção da represa.')
      ],
      outro:[
        N('A represa estoura de dentro pra fora. Os soldados que a guardavam saem boiando rio abaixo.'),
        D('smerg_normal','ELE SEGUROU O RIO! COM A ÁGUA NO PESCOÇO!', {nome:'SMERG REBELDE', pose:'win'}),
        D('tupas','...Alguém me tira desse cano. Agora. Por favor.', {pose:'hurt'})
      ] },

    /* ---------------- 24 ---------------- */
    { titulo:'O Mercado de Almas', sinopse:'Na praça do castelo, comida se paga com pedaço de alma.',
      cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[RELOGIO, RELOGIO, RELOGIO] },
      intro:[
        N('O MERCADO DA RAINHA. Barracas de pão, fruta, sopa. Em cada uma, uma placa: "1 PEDAÇO DE ALMA".', {cenario:'reino'}),
        D('smerg_normal','Minha mãe comprava aqui. Toda semana ela voltava um pouco mais cansada. Eu achava que era a idade.', {nome:'PIPOCA', forma:1}),
        D('tupas','Os potinhos. Pra onde vão?'),
        D('smerg_normal','Pra torre. Pro Relógio de Almas.', {nome:'PIPOCA'}),
        D('serrinha_dog','Então hoje o mercado fecha mais cedo.', {pose:'special'})
      ],
      outro:[
        N('Os potinhos da barraca quebram. Fios brancos voltam voando para cada morador da vila.'),
        D('smerg_normal','...Mãe? Mãe, sou eu. O Pipoca.', {nome:'PIPOCA'}),
        N('Uma senhora pisca, sorri e passa a mão no boné dele.'),
        D('tupas','Isso aqui era um potinho só. O Relógio de Almas tem centenas.')
      ] },

    /* ---------------- 25 · CHEFE ---------------- */
    { titulo:'O Smerg do Relógio Mestre', chefe:true, sinopse:'CHEFE · Um soldado comum recebeu o maior pedaço do tempo roubado.',
      cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[RELOGIO, { nome:'Smerg do Relógio Mestre', chefe:true, hp:617, atk:37, def:11, spd:14, danoMult:1.1 }, RELOGIO] },
      intro:[
        N('A torre do sino da vila. No alto, um smerg com um mostrador enorme cravado no peito, girando rápido demais.'),
        D('smerg_normal','Ela me deu uma HORA inteira do tempo de Tel Aviv. Eu sou mais rápido que qualquer um.', {nome:'SMERG DO RELÓGIO MESTRE', pose:'special'}),
        D('smerg_normal','Mais rápido que o forte. Agora EU sou fora do normal.', {nome:'SMERG DO RELÓGIO MESTRE'}),
        D('serrinha_dog','O Strong não ficou forte porque alguém deu. Ele treinou um ano inteiro.'),
        D('smerg_normal','E eu ganhei em um segundo!', {nome:'SMERG DO RELÓGIO MESTRE', pose:'special'})
      ],
      outro:[
        N('O mostrador explode em luz. A hora roubada volta voando pro sul — de volta pra Tel Aviv.'),
        D('smerg_normal','Eu... eu só queria ser alguém. Igual o Strong.', {nome:'SMERG DO RELÓGIO MESTRE', forma:1, pose:'hurt'}),
        D('serrinha_dog','Então treina. Ele começou igualzinho você.'),
        D('smerg_normal','...Posso entrar na rebelião?', {nome:'SMERG DO RELÓGIO MESTRE', forma:1}),
        D('smerg_normal','Pode! Pega um boné e vira pra frente!', {nome:'PIPOCA', pose:'win'})
      ] },

    /* ---------------- 26 ---------------- */
    { titulo:'Recado de Tel Aviv', sinopse:'Um pombo-correio atravessa a fronteira. Os soldados querem ele assado.',
      cenario:'mata', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, REBELDE], inimigo:[GUARDA_REAL, RELOGIO, GUARDA_REAL] },
      intro:[
        N('A FRONTEIRA SUL. Um pombo cinza, de bilhete amarrado na pata, foge de três soldados.', {cenario:'mata'}),
        D('smerg_normal','Mensagem de fora do reino! Ordem da rainha: nada entra, nada sai!', {nome:'GUARDA REAL'}),
        D('serrinha_dog','Esse pombo cheira a pão de padaria. Isso é coisa de limeirense.'),
        D('tupas','Pega o pombo. Eu pego os guardas.', {pose:'special'})
      ],
      outro:[
        N('O bilhete, escrito com a letra torta do Strong:'),
        N('"TÔ VOLTANDO. COM UM EXÉRCITO DE ROBÔS, UM HOMEM QUE VIRA RAIO, O VERME DO ESFREGÃO E TRÊS DE LIMEIRA (UM DELES DIZ QUE É DE TEL AVIV). SEGURA AÍ. — STRONG"', {nome:'BILHETE'}),
        D('serrinha_dog','Ele voltou a escrever "segura aí". Ele sempre escreve "segura aí".'),
        D('tupas','O Careca tá vindo...'),
        D('serrinha_dog','E o exército vai precisar de uma porta aberta. Uma bem grande.')
      ] },

    /* ---------------- 27 ---------------- */
    { titulo:'A Ponte Levadiça', sinopse:'Pra o exército entrar, alguém tem que abaixar a ponte do castelo. Por cima do fosso.',
      cenario:'castelo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[GUARDA_REAL, GUARDA_REAL, GUARDA_REAL] },
      intro:[
        N('A casa das correntes da ponte levadiça, por dentro da muralha do castelo.', {cenario:'castelo'}),
        D('smerg_normal','A alavanca é aquela. Mas a guarda real nunca sai daqui.', {nome:'PIPOCA', forma:1}),
        D('tupas','E embaixo da ponte tem o fosso. Fundo.'),
        D('serrinha_dog','Você não precisa entrar nele, Tupas. Só precisa esvaziar.'),
        D('tupas','...Isso eu consigo.', {pose:'special'})
      ],
      outro:[
        N('O fosso esvazia num redemoinho. As correntes estalam. Mas a ponte não desce — a alavanca está presa por um cadeado roxo.'),
        D('smerg_normal','Cadeado da rainha. Só abre com a chave do pescoço dela.', {nome:'PIPOCA'}),
        D('serrinha_dog','Ou com uma explosão muito grande vinda de fora.'),
        D('tupas','O exército do Strong que se vire. Pelo menos o fosso já tá seco.')
      ] },

    /* ---------------- 28 ---------------- */
    { titulo:'O Jantar do Fat Smerg', sinopse:'Na cozinha do castelo, o compatriota da rainha janta sozinho.',
      cenario:'castelo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','fat_smerg','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[{ nome:'Cozinheiro Smerg', hp:160, atk:18, def:7 }, { nome:'Fat Smerg', hp:400, atk:25, def:13, spd:9 }, { nome:'Cozinheiro Smerg', hp:160, atk:18, def:7 }] },
      intro:[
        N('A COZINHA REAL. Uma mesa enorme, um prato enorme, uma cadeira só.', {cenario:'castelo'}),
        D('fat_smerg','Pode entrar, cachorro. Eu senti o cheiro de você desde a escada.'),
        D('serrinha_dog','Você janta sozinho todo dia, Fat?'),
        D('fat_smerg','Eu era um smerg comum. Ninguém nunca olhou pra mim na fila. A rainha olhou.'),
        D('fat_smerg','Ela me deu comida quando eu tinha fome. Me deu nome quando eu era um número. Ela me fez único.'),
        D('tupas','Ela te deu comida em troca de um pedaço da sua alma.'),
        D('fat_smerg','E valeu cada pedaço.', {pose:'special'})
      ],
      outro:[
        D('fat_smerg','Uff... vocês não vão me convencer, cachorro.', {pose:'hurt'}),
        D('fat_smerg','Ela me olhou quando ninguém olhava. Eu não traio quem me olhou.'),
        D('serrinha_dog','Eu sei como é isso. O Strong dividiu um pão comigo quando eu era só um cachorro.'),
        D('fat_smerg','Então você entende por que eu vou estar do lado dela até o fim.'),
        N('O Fat Smerg sai pela porta dos fundos, levando o prato.')
      ] },

    /* ---------------- 29 ---------------- */
    { titulo:'A Rainha Desperta', sinopse:'A Smergula fala com o reino inteiro: ao amanhecer, ela para o mundo.',
      cenario:'castelo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[GUARDA_TRONO, RELOGIO, GUARDA_TRONO] },
      intro:[
        N('Os corredores do castelo. A voz da rainha sai de todas as paredes ao mesmo tempo.', {cenario:'castelo'}),
        D('smergula','Povo do meu reino. Ao amanhecer, eu vou girar o Relógio de Almas uma última vez.', {pose:'special'}),
        D('smergula','E o mundo inteiro vai parar. Tel Aviv. Limeira. Cada relógio. Cada alma. Tudo meu. Pra sempre.'),
        D('smergula','Ah, e pros ratinhos no meu corredor: a guarda do trono manda lembranças.'),
        D('smerg_normal','Ela sabe que a gente tá aqui!', {nome:'PIPOCA', forma:1}),
        D('serrinha_dog','Ótimo. Eu tava cansado de andar na ponta do pé.', {pose:'special'})
      ],
      outro:[
        N('Lá fora, longe, além da fronteira sul: um som de corneta.'),
        N('Depois, outro som. Uma buzina. De Astra.'),
        D('tupas','Escutou isso?'),
        D('serrinha_dog','Escutei. Ele sempre escreve "segura aí". E sempre chega.')
      ] },

    /* ---------------- 30 · CHEFE ---------------- */
    { titulo:'General Smergão', chefe:true, sinopse:'CHEFE · O general da rainha junta o que sobrou do exército pra fechar a ponte de vez.',
      cenario:'campo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, {}, PIPOCA], inimigo:[RELOGIO, { nome:'General Smergão', chefe:true, hp:589, atk:37, def:13, spd:14, danoMult:1.09 }, RELOGIO] },
      intro:[
        N('O CAMPO EM FRENTE AO CASTELO, de madrugada. Três mil bonés pra trás, em fila. Um general de armadura dourada na frente.', {cenario:'campo'}),
        D('smerg_normal','Rebeldes de boné virado. Eu vou desvirar um por um.', {nome:'GENERAL SMERGÃO'}),
        D('smerg_normal','Três mil, Serrinha. A gente é cinquenta.', {nome:'PIPOCA', forma:1}),
        D('serrinha_dog','A gente só precisa segurar até o sol nascer.'),
        D('tupas','E derrubar o general. Sem general, três mil bonés viram três mil smergs com medo.')
      ],
      outro:[
        N('O General cai. O exército da rainha hesita.'),
        N('E então o sol nasce — e com ele, no alto do morro sul, uma fileira de olhos azuis acesos.'),
        N('Androides. Centenas. Na frente deles, um ciborgue, um homem que brilha de eletricidade, um rapaz com um esfregão... e um smerg grandão acenando.'),
        D('strong_smerg','EU FALEI QUE VOLTAVA!', {cenario:'campo', pose:'special'}),
        N('Atrás dos androides, um Astra prateado e um Corsa cheio de pão descem o morro buzinando.'),
        N('FIM DO ATO III. A GUERRA GERAL COMEÇOU.')
      ] },

    /* ======================= ATO IV — A GUERRA GERAL ======================= */

    /* ---------------- 31 ---------------- */
    { titulo:'A Chegada', sinopse:'Tel Aviv chega ao reino. O primeiro choque da guerra geral.',
      cenario:'campo', time:['strong_smerg','mecas','cargas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[RELOGIO, GUARDA_TRONO, RELOGIO] },
      intro:[
        N('O CAMPO DE GUERRA. Dois exércitos frente a frente: a bandeira roxa da rainha e a azul de quem veio do sul.', {cenario:'campo'}),
        D('serrinha_dog','Demorou, grandão.'),
        D('strong_smerg','Segurou?'),
        D('serrinha_dog','Segurei. O Tupas segurou um RIO.'),
        D('mecas','Então você é o Tupas. O Careca disse que você domina a água e não sabe nadar.'),
        D('tupas','O Careca fala demais. Cadê ele?'),
        D('careca','Aqui. Você ainda não aprendeu a nadar?'),
        D('tupas','Você ainda não ficou careca?'),
        D('cargas','Depois vocês se abraçam. Os soldados com relógio no peito: deixa eles comigo. Ninguém é mais rápido que eu.', {pose:'special'})
      ],
      outro:[
        D('cargas','Relógio roubado do Marcelão. Eu ainda reconheço esse tique-taque.'),
        D('mecas','Ele está morto. E mesmo assim ainda tem gente apanhando por causa do tempo dele.'),
        D('strong_smerg','Então a gente devolve o tempo pra quem é dono. Segundo por segundo.')
      ] },

    /* ---------------- 32 ---------------- */
    { titulo:'Metal Contra Boné', sinopse:'Androides de Tel Aviv contra os soldados da rainha. O Mecas comanda a linha de frente.',
      cenario:'campo', time:['mecas','mecas_grunt','mecas_grunt'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[{}, ANDROIDE, ANDROIDE], inimigo:[GUARDA_REAL, CAPITAO, GUARDA_REAL] },
      intro:[
        D('mecas','"CÓDIGO 5000Z. LINHA DE FRENTE: AVANÇAR."', {pose:'special'}),
        N('Fileiras de androides marcham contra fileiras de bonés. Metal contra boné.'),
        D('smerg_normal','Eles... eles têm a mesma cara! Todos!', {nome:'CAPITÃO SMERG', forma:1}),
        D('mecas','Vocês também. A gente tem mais em comum do que a rainha quer que vocês saibam.'),
        D('mecas','Mas hoje a gente luta.')
      ],
      outro:[
        D('mecas','"LINHA DE FRENTE: SEGURAR POSIÇÃO."'),
        N('Os androides param. Em volta deles, soldados smerg caídos — vivos, encolhidos, de mãos na cabeça.'),
        D('smerg_normal','Vocês... não vão acabar com a gente?', {nome:'SOLDADO SMERG', forma:1, pose:'hurt'}),
        D('mecas','Eu era uma pessoa dentro de uma cápsula, obedecendo ordem de quem me roubou. Eu conheço essa cara de medo.'),
        D('mecas','Vira o boné pra frente e sai do campo.')
      ] },

    /* ---------------- 33 ---------------- */
    { titulo:'A Caravana de Limeira', sinopse:'Um Astra e um Corsa entram na guerra. Limeira veio junto.',
      cenario:'campo', time:['hans_lambanca','fat_mango','matheus_limeira2'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[GUARDA_REAL, GUARDA_TRONO, GUARDA_REAL] },
      intro:[
        N('Uma buzina corta o campo de guerra. O Astra prateado vem na frente; atrás, o Corsa, soltando cheiro de pão.', {cenario:'campo'}),
        D('matheus_limeira2','Três vezes nesse reino. Agora pelo menos é de propósito.'),
        D('fat_mango','Quem tá com fome, pão quente no porta-malas! Quem é soldado da rainha, pão DORMIDO na cara!'),
        D('smerg_normal','Quem são vocês?!', {nome:'GUARDA REAL'}),
        D('hans_lambanca','Lambança, de Tel Aviv. Pai, abençoa essa trombada!', {pose:'special'}),
        D('fat_mango','De LIMEIRA.'),
        D('matheus_limeira2','Ele é de Limeira.')
      ],
      outro:[
        D('smerg_normal','Afinal... ele é de onde?', {nome:'GUARDA REAL', pose:'hurt'}),
        D('hans_lambanca','De onde o coração aponta, irmão. Hoje ele aponta pra cá.'),
        D('fat_mango','Bonito. Errado, mas bonito.'),
        D('matheus_limeira2','Alguém viu meu retrovisor? Alguém ENCOSTOU no meu retrovisor?')
      ] },

    /* ---------------- 34 ---------------- */
    { titulo:'Raio e Água', sinopse:'Pra explodir o cadeado da ponte, o Cargas precisa de condutor. O Tupas é feito de água.',
      cenario:'castelo', time:['tupas','cargas','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[GUARDA_TRONO, RELOGIO, GUARDA_TRONO] },
      intro:[
        N('A ponte levadiça. O cadeado roxo da rainha, brilhando. A guarda do trono na frente dele.', {cenario:'castelo'}),
        D('cargas','Eu jogo um raio no cadeado, ele estoura. Só que daqui ele não alcança.'),
        D('tupas','Água conduz eletricidade. Eu faço um fio de água daqui até lá.'),
        D('cargas','Água e raio. Ou a gente ganha junto ou a gente morre junto.'),
        D('tupas','Eu não sei nadar. Morrer molhado não tá nos meus planos.'),
        D('serrinha_dog','Os guardas primeiro. Depois vocês fazem ciência.', {pose:'special'})
      ],
      outro:[
        N('Um fio de água sobe do fosso até o cadeado. O Cargas encosta a mão nele.'),
        D('cargas','Fica longe da água, Tupas.'),
        D('tupas','Eu SEMPRE fico longe da água.'),
        N('BUM. O cadeado estoura, as correntes gritam, e a ponte levadiça desce com um estrondo.'),
        D('strong_smerg','PONTE ABERTA! TODO MUNDO PRA DENTRO!')
      ] },

    /* ---------------- 35 ---------------- */
    { titulo:'Escada pro Trono', sinopse:'O Careca sobe a escada da rainha. Cada degrau, uma lembrança da maldição.',
      cenario:'castelo', time:['careca','mecas','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[GUARDA_TRONO, GUARDA_TRONO, GUARDA_TRONO] },
      intro:[
        N('A escadaria do salão do trono. A mesma que o Careca subiu, meses atrás, com um esfregão e um pedido.', {cenario:'castelo'}),
        D('careca','Foi aqui. Eu subi essa escada pedindo ajuda pra achar você, Mecas.'),
        D('careca','Desci ela rastejando.', {pose:'hurt'}),
        D('mecas','Hoje você sobe de novo. E eu tô do seu lado.'),
        D('smergula','Cacheado! Voltou pra pedir outro favor? A tabela de preço continua a mesma.', {pose:'special'}),
        D('careca','Eu vou subir essa escada. Nem que seja rastejando.', {pose:'special'})
      ],
      outro:[
        D('tupas','Escada limpa.'),
        D('careca','Literalmente. Eu passei o esfregão.'),
        D('mecas','Lá em cima, a última porta.'),
        N('E na frente da última porta, ocupando ela inteira, o Fat Smerg.')
      ] },

    /* ---------------- 36 · CHEFE ---------------- */
    { titulo:'Fat Smerg, o Único', chefe:true, sinopse:'CHEFE · O compatriota da rainha guarda a última porta. O gordo contra o forte.',
      cenario:'castelo', time:['strong_smerg','serrinha_dog','fat_mango'], inimigos:['fat_smerg'],
      ajustes:{ inimigo:[{ nome:'Fat Smerg, o Único', chefe:true, hp:798, atk:38, def:16, spd:11, danoMult:1.05 }] },
      intro:[
        D('fat_smerg','Strong. Serrinha. Eu sabia que ia ser vocês.'),
        D('strong_smerg','Sai da porta, Fat. Ela vai parar o mundo. Vai parar você junto.'),
        D('fat_smerg','No reino só existe um de cada coisa fora do normal. Um forte. Um gordo.'),
        D('fat_smerg','Vamos ver qual dos dois é MAIS fora do normal.', {pose:'special'}),
        D('fat_mango','Ô grandão, eu sou padeiro. Eu entendo de massa. A sua tá mal sovada. Vem.')
      ],
      outro:[
        D('fat_smerg','Uff... o forte ganhou. Do jeito que começou: treinando.', {pose:'hurt'}),
        N('O Fat Mango se ajoelha do lado dele e estende um pão ainda quente.'),
        D('fat_mango','Ninguém devia jantar sozinho, grandão. Nem você.'),
        D('fat_smerg','...É de quê?'),
        D('fat_mango','De padaria. Não custa alma nenhuma.'),
        D('fat_smerg','Eu não vou trair ela, padeiro. Mas também não vou levantar de novo.'),
        N('O Fat Smerg come o pão em silêncio. E sai do caminho.')
      ] },

    /* ---------------- 37 ---------------- */
    { titulo:'Relógio de Almas', sinopse:'No alto da torre, o relógio que guarda o tempo do Marcelão e as almas do reino.',
      cenario:'torre', time:['mecas','cargas','careca'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ inimigo:[RELOGIO, { nome:'Guardião do Relógio', hp:340, atk:34, def:12, spd:15 }, RELOGIO] },
      intro:[
        N('O ALTO DA TORRE DO CASTELO. Um relógio gigante, feito de centenas de potinhos de vidro. Dentro de cada um, uma alma.', {cenario:'torre'}),
        N('No centro, girando pra trás, um ponteiro de gelo azul. O tempo de Tel Aviv.'),
        D('cargas','Ele roubou isso de nós. Ela roubou dele. Hoje volta pro dono.'),
        D('mecas','Quebra o relógio, o tempo volta. Igual na Muralha.'),
        D('careca','E as almas voltam pra cada um. Inclusive as que ela tirou da vila.'),
        D('smerg_normal','"NINGUÉM TOCA NO RELÓGIO DA RAINHA."', {nome:'GUARDIÃO DO RELÓGIO', pose:'special'})
      ],
      outro:[
        N('O Mecas soca o centro do relógio. Os potinhos estouram todos ao mesmo tempo.'),
        N('Uma chuva de fios brancos se espalha pelo céu — pro reino, pra Tel Aviv, pra Limeira.'),
        N('Lá no sul, a Torre do Relógio de Tel Aviv volta a andar. Na igrejinha de Limeira, o sino toca sozinho.'),
        D('cargas','Acabou o tempo dela.'),
        D('careca','Não. Escuta.', {pose:'hurt'}),
        N('No salão do trono, uma risada. Ela não precisa mais do relógio. Ela já bebeu o suficiente.')
      ] },

    /* ---------------- 38 ---------------- */
    { titulo:'Bonés Pra Frente', sinopse:'Pipoca lidera os soldados libertos contra a última guarda fiel à rainha.',
      cenario:'campo', time:['smerg_normal','serrinha_dog','hans_lambanca'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
      ajustes:{ aliado:[PIPOCA, {}, {}], inimigo:[GUARDA_TRONO, { nome:'Capitão do Trono', hp:360, atk:36, def:13, spd:13 }, GUARDA_TRONO] },
      intro:[
        N('O pátio do castelo. Centenas de soldados com a alma de volta no peito — e o boné virado pra frente.', {cenario:'campo'}),
        D('smerg_normal','Pessoal! Eu sou o Pipoca! Eu pulava de susto com qualquer barulho!', {nome:'PIPOCA'}),
        D('smerg_normal','Hoje eu ainda pulo. Mas pulo PRA FRENTE!', {nome:'PIPOCA', pose:'special'}),
        D('hans_lambanca','Que discurso lindo, filho. Senhor, abençoa esses meninos de boné.'),
        D('serrinha_dog','A guarda do trono é a única que ainda obedece ela. Derruba eles e a rainha fica sozinha.')
      ],
      outro:[
        N('O último guarda do trono larga a lança. E vira o boné pra frente.'),
        D('smerg_normal','A gente... a gente ganhou a guerra?', {nome:'PIPOCA'}),
        D('serrinha_dog','A guerra sim. Falta a rainha.'),
        D('hans_lambanca','Pipoca, você nasceu em Tel Aviv também?'),
        D('smerg_normal','Não, senhor. Aqui no reino.', {nome:'PIPOCA'}),
        D('hans_lambanca','Igual eu, então. Cada um nasce onde o coração aponta.')
      ] },

    /* ---------------- 39 · CHEFE ---------------- */
    { titulo:'Rainha Smergula', chefe:true, sinopse:'CHEFE · No salão do trono, a rainha sozinha — com almas e tempo de sobra.',
      cenario:'castelo', time:['mecas','cargas','strong_smerg'], inimigos:['smergula'],
      ajustes:{ inimigo:[{ nome:'Rainha Smergula', chefe:true, hp:620, atk:33, def:12, spd:16 }] },
      intro:[
        N('O SALÃO DO TRONO. Vazio. Nenhum guarda, nenhum gordinho. Só a rainha, no trono.', {cenario:'castelo'}),
        D('smergula','Vocês quebraram meu relógio. Libertaram meus soldados. Envergonharam meu gordinho.'),
        D('smergula','Mas a alma do relojoeiro ainda está AQUI dentro. E com ela, todo o tempo dele.', {pose:'special'}),
        D('mecas','Ele deixou um recado pra mim antes de morrer. Disse que você não devolve nada.'),
        D('smergula','Ele me conhecia bem.'),
        D('cargas','Eu também não. O tempo que você roubou eu cobro em raio.', {pose:'special'}),
        D('strong_smerg','Majestade. Da última vez eu não ajoelhei. Hoje eu vim te derrubar.', {pose:'special'})
      ],
      outro:[
        D('smergula','Hah... HAH... vocês acham que essa era eu?', {pose:'hurt'}),
        D('smergula','Esse era o resto de GENTE que sobrava em mim.'),
        N('Ela abre a boca e respira fundo. Cada alma que ainda flutuava pelo salão é sugada de uma vez.'),
        N('O rosto muda. A voz muda. O que levanta do trono já não é bem gente.'),
        D('smergula','Agora eu sou SÓ fome.', {forma:1, pose:'special'}),
        N('O Mecas, o Cargas e o Strong voam contra a parede do salão.'),
        D('careca','...Agora é comigo.', {pose:'special'})
      ] },

    /* ---------------- 40 · CHEFE FINAL ---------------- */
    { titulo:'Véu Maldito', chefe:true, final:true, sinopse:'CHEFE FINAL · Smergula Demônio contra os amaldiçoados do reino e o justiceiro que não sabe nadar.',
      cenario:'castelo', time:['careca','serrinha_dog','tupas'], inimigos:['smergula'],
      ajustes:{ inimigo:[{ nome:'SMERGULA DEMÔNIO', chefe:true, forma:1, hp:450, atk:30, def:11, spd:16, danoMult:1.07 }] },
      intro:[
        D('smergula','O verme, o cachorro e o homem que tem medo de água. Meus três erros.', {forma:1}),
        D('careca','Você me transformou em verme porque eu não quis te vender a alma.'),
        D('serrinha_dog','Você me transformou em gente pra eu ser seu bichinho.'),
        D('tupas','E eu você nunca transformou em nada. Eu só não gosto de você mesmo.'),
        D('smergula','Eu vou cobrir esse salão de véu. E vocês três vão ficar nele pra sempre.', {forma:1, pose:'special'}),
        D('careca','Eu já caí uma vez nesse salão. Cada vez que eu caio, eu volto.'),
        D('careca','Lembra? Foi você que me deu isso.', {pose:'special'})
      ],
      outro:[
        N('O véu preto rasga de cima a baixo. A rainha cai de joelhos no meio do salão.'),
        D('smergula','A fome... a fome tá voltando... eu não quero sentir a fome de novo...', {forma:1, pose:'hurt'}),
        N('As almas que ela engoliu saem dela como uma revoada de pássaros brancos, e atravessam as janelas — para casa.'),
        N('Uma alma não volta pra lugar nenhum: um fio branco que faz tique, faz taque, e se apaga no ar. O Marcelão não tem mais pra onde voltar.'),
        D('smergula','Eu era... só uma menina com fome...', {pose:'hurt'}),
        N('E a rainha Smergula se desfaz em fumaça roxa. No chão do salão, sobra só a coroa.'),
        N('Um vulto enorme entra pela porta dos fundos, pega a coroa com cuidado... e some pelos corredores.'),
        D('serrinha_dog','Era o Fat?'),
        D('strong_smerg','Deixa ele. Alguém tinha que se despedir dela.'),
        D('careca','A maldição não quebrou.', {pose:'hurt'}),
        D('careca','Quando eu cair, eu ainda vou voltar verme. Mas pelo menos agora eu sei por quem eu levanto.'),
        D('mecas','Por mim. Pelo Tupas. Por quem perdia o chinelo na praia.'),
        D('careca','Você lembrou do chinelo.'),
        D('mecas','Eu lembrei do chinelo.'),
        D('serrinha_dog','E eu continuo Serrinha. O Cachorro Orelha ficou no beco. Eu gosto de quem eu virei.'),
        D('tupas','Eu continuo sem saber nadar.'),
        D('strong_smerg','Caçador de recompensa sem recompensa. Primeira guerra que eu luto de graça. Não é tão ruim.'),
        N('UM MÊS DEPOIS. TEL AVIV.', {cenario:'telaviv'}),
        N('Na Torre do Relógio, os ponteiros andam pra frente. 03:34. 03:35. 03:36.'),
        D('hans_lambanca','Sejam bem-vindos a TEL AVIV, a minha cidade natal!'),
        D('fat_mango','Limeira.'),
        D('matheus_limeira2','Ele é de Limeira.'),
        D('cargas','O relógio tá andando. Pela primeira vez, ninguém tá roubando nem um segundo.'),
        D('mecas','Então a gente tem tempo.'),
        D('mecas','Tempo de verdade. Nosso.'),
        N('FIM DO CAPÍTULO 2 — SMERGULUS KINGDOM.')
      ] }
    ]
  };

  const CAPITULOS = { telaviv:TELAVIV, smergulus:SMERGULUS };
  const NUM_CAP = { telaviv:1, smergulus:2 };   // número que aparece na legenda das cenas

  /* ================= A JUÍZA (campanha da Condenação) =================
     A rainha Smergula abre cada fase do trono dela e dá o veredito no
     fim. As falas variam pela fase (sorteio estável por índice, então a
     mesma fase sempre abre com a mesma fala — dá identidade à sessão). */
  const JUIZA_NOME = '👑 RAINHA SMERGULA — A JUÍZA';
  const J = (texto, extra) => D('smergula', texto, Object.assign({ nome:JUIZA_NOME, cenario:'castelo' }, extra||{}));
  const JUIZA = {
    abertura: {
      telaviv: [
        'Réu, de pé. Hoje o tribunal reencena TEL AVIV. Eu nunca pisei naquela cidade — nem preciso. Daqui do meu trono eu vejo cada passo que você deu.',
        'Você vai reviver a sua história. Só que agora quem pensa pelos seus inimigos sou EU. O bot do julgamento não erra alvo à toa.'
      ],
      smergulus: [
        'Bem-vindo ao MEU reino, réu. Aqui cada soldado me obedece — e hoje eles lutam com a minha cabeça.',
        'Você vai assistir à história do meu reino pelo lado de quem perde. Eu jogo do outro lado. Sente-se. Não, melhor: lute.'
      ]
    },
    comum: [
      'Silêncio no tribunal! Sessão de hoje: "{t}". Que comece a sentença.',
      'Eu já li este capítulo, réu. "{t}"... sei cada passo que você deu. E cada erro.',
      '"{t}". Você venceu isso uma vez com sorte. Sorte não entra no meu salão.',
      'Escolha o golpe que quiser. Eu vou saber a resposta antes de você apertar.',
      'Eles lutavam sem cérebro. Agora lutam com o MEU.',
      'A memória é um tribunal, réu. E aqui eu sou a juíza, a acusação — e o carrasco.',
      'Fase {n}. Você ainda acredita que chega ao fim? Que adorável.',
      'Cada vitória sua eu anoto na ficha. Cada derrota, eu emolduro.',
      'O bot do julgamento mira em quem dói mais. Proteja o seu curandeiro... se tiver um.',
      '"{t}" — um capítulo curto. Perfeito pra uma sentença curta.'
    ],
    chefe: [
      'Ahh, "{t}". Um dos meus favoritos. Eu dei a esse inimigo tudo o que sei sobre você.',
      'Chefe à frente, réu. Se você cair aqui, a sentença sai hoje mesmo.',
      'Agora o tribunal fica sério. "{t}" — com a MINHA estratégia por trás.'
    ],
    final: 'O último capítulo, réu. Se você passar daqui, eu assino a sua absolvição com a minha própria pena. Não vai acontecer.',
    rainha: 'Então você chegou até MIM. Lute contra a rainha... com a rainha pensando pelos dois lados.',
    absolvido: [
      'Hmpf. Absolvido... por hoje. Continue — eu ainda não terminei com você.',
      'Você escapou da sentença desta vez. Anotado.',
      'Interessante. Você aprende. Isso torna a próxima condenação mais divertida.',
      'Absolvido. Não se acostume, réu.',
      'O tribunal reconhece a vitória. A juíza, não.'
    ],
    capitulo: 'Um capítulo inteiro sem ser condenado. O tribunal está... impressionado. Eu, não. Ainda.'
  };
  // sorteio estável por fase (a mesma fase sempre traz a mesma fala)
  const escolhaFixa = (lista, k) => lista[((k*7)+3) % lista.length];
  const preencher = (s, f, i) => s.replace(/\{t\}/g, f.titulo).replace(/\{n\}/g, String(i+1));

  function falasDaJuiza(capId, i){
    const cap=CAPITULOS[capId], f=cap.fases[i];
    const falas=[];
    if(i===0) (JUIZA.abertura[capId]||[]).forEach(t=>falas.push(J(t)));
    const ehRainha = (f.inimigos||[]).indexOf('smergula')>=0;
    if(ehRainha) falas.push(J(JUIZA.rainha, { pose:'special' }));
    if(f.final) falas.push(J(JUIZA.final, { pose:'special' }));
    else if(!ehRainha && f.chefe) falas.push(J(preencher(escolhaFixa(JUIZA.chefe, i), f, i), { pose:'special' }));
    else if(!ehRainha && i>0) falas.push(J(preencher(escolhaFixa(JUIZA.comum, i+(capId==='smergulus'?5:0)), f, i)));
    return falas;
  }
  /* a primeira fala DEPOIS da juíza precisa voltar pro cenário da fase
     (a juíza troca pro castelo) — clona a fala só pra pôr o cenário nela */
  function comCenario(falas, cenario){
    if(!falas.length) return falas;
    const primeira = Object.assign({}, falas[0]);
    if(!primeira.cenario) primeira.cenario = cenario;
    return [primeira].concat(falas.slice(1));
  }

  /* capítulo com `requer` só abre depois do capítulo pedido estar completo
     (na MESMA campanha — cada uma tem o próprio progresso) */
  function liberado(capId, m){
    const req=(CAPITULOS[capId]||{}).requer;
    if(!req) return true;
    const antes=CAPITULOS[req.cap];
    return !antes || vencidas(req.cap, m)>=antes.fases.length;
  }

  /* ---------------- MAPA DO MUNDO ----------------
     Coordenadas em PORCENTAGEM da imagem (funciona em qualquer tela). */
  const LOCAIS = [
    { id:'esmergos', nome:'Smergulus Kingdom', icone:'🏰', x:19, y:24, cap:'smergulus' },
    { id:'tel_aviv', nome:'Tel Aviv', icone:'🕌', x:68, y:30, cap:'telaviv' },
    { id:'ilha', nome:'Ruínas da Ilha', icone:'🏛', x:40, y:60, cap:null },
    { id:'limeira', nome:'Limeira', icone:'🌋', x:73, y:75, cap:null }
  ];

  /* `m` (opcional) troca de campanha antes de abrir — o Tribunal da vila
     abre direto na da Condenação. Sem `m` abre na última usada. */
  function abrirMapa(m){
    pararCena();
    if(m) setModo(m);
    /* a campanha normal agora é o MUNDO ABERTO (js/overworld.js); a lista de
       fases continua existindo só pra campanha da Condenação */
    if(modo!=='condenacao'){ abrirMundo(); return; }
    goto('historia-mapa');
    pintarModo();
    const box=document.getElementById('mapa-pontos');
    if(!box) return;
    box.innerHTML='';
    LOCAIS.forEach(l=>{
      const cap = l.cap && CAPITULOS[l.cap];
      const aberto = cap && liberado(l.cap);
      const feitas = cap ? vencidas(l.cap) : 0, total = cap ? cap.fases.length : 0;
      const completo = cap && feitas>=total;
      const btn=document.createElement('button');
      btn.className='mapa-ponto'+(aberto?'':' bloqueado');
      btn.style.left=l.x+'%'; btn.style.top=l.y+'%';
      btn.innerHTML=`<span class="mp-ic">${completo?'✅':l.icone}</span>`+
        `<span class="mp-nome">${esc(l.nome)}${aberto? ` <i>${Math.min(feitas,total)}/${total}</i>` : ' 🔒'}</span>`;
      btn.onclick=()=>clicarLocal(l);
      box.appendChild(btn);
    });
  }

  function clicarLocal(l){
    if(!l.cap || !liberado(l.cap)){
      const dica=document.getElementById('mapa-dica');
      if(dica){
        const req = l.cap && CAPITULOS[l.cap].requer;
        dica.textContent = l.nome+' — '+(req ? req.texto : 'em breve.');
        clearTimeout(dica._t);
        dica._t=setTimeout(()=>{ dica.textContent='Toque num local do mapa para ver o que rola lá.'; }, 2200);
      }
      return;
    }
    abrirCapitulo(l.cap);
  }

  /* pinta o MAPA na campanha atual: as duas abas, o título e o tom
     (a Condenação fica roxa, com a rainha no canto) */
  function pintarModo(){
    const cond = modo==='condenacao';
    const tela=document.getElementById('screen-historia-mapa');
    if(tela) tela.classList.toggle('condenacao', cond);
    const fases=document.getElementById('screen-historia-fases');
    if(fases) fases.classList.toggle('condenacao', cond);
    document.querySelectorAll('.mapa-modo').forEach(b=>b.classList.toggle('on', b.dataset.modo===modo));
    const tit=document.getElementById('mapa-titulo');
    if(tit) tit.textContent = cond ? '⚖ A HISTÓRIA SOB JULGAMENTO' : '🗺️ O MUNDO DE SERRINHA WORLD';
    const sub=document.getElementById('mapa-sub');
    if(sub) sub.innerHTML = cond
      ? '👑 A rainha Smergula reencena a sua história do trono dela. Do outro lado joga o <b>bot do julgamento</b> — '+
        'a IA esperta da Condenação. Sem draft, sem ban: os times são os do roteiro. Progresso separado.'
      : 'A história de sempre. Quer o desafio? Troque pra <b>⚖ Condenação</b> — a mesma campanha, com o bot da rainha do outro lado.';
  }
  function trocarModo(m){ setModo(m); abrirMapa(); }
  /* 📖 HISTÓRIA: entra direto no mundo aberto, no último ponto salvo */
  function abrirMundo(){ pararCena(); setModo('normal'); Mundo.abrir(); }

  /* ---------------- CRÉDITOS dos pacotes de arte (lidos do CREDITOS.md) ----------------
     A maioria das licenças (CC-BY / CC-BY-SA) exige crédito: a tela lê a
     tabela do próprio arquivo, então quem acrescentar um pacote lá já
     aparece aqui sem mexer em código. */
  const ARQ_CREDITOS=['tile_atlas_Attribution.txt','tile_atlas2_Attribution.txt','CREDITS-terrain.txt','CREDITS-trees.txt',
    'CREDITS-fruit-trees.txt','city_inside_credits.txt','cavern_ruins_credits.txt','lpc_base_assets_CREDITS.txt'];
  function pintarCreditos(box){
    box.innerHTML='<div class="cred-carregando">Carregando créditos…</div>';
    fetch('modohistoria/assets/CREDITOS.md').then(r=>r.text()).then(md=>{
      const linhas=md.split('\n').filter(l=>/^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1);
      const link=t=>esc(t).replace(/(https?:\/\/[^\s)|]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
      const linhaHtml=l=>{ const c=l.split('|').slice(1,-1).map(x=>x.trim().replace(/`/g,''));
        return `<div class="cred-item"><b>${esc(c[1])}</b><span>${esc(c[2])}</span><i>${esc(c[3])} · ${esc(c[0])}</i><em>${link(c[4]||'')}</em></div>`; };
      box.innerHTML=
        '<div class="cred-intro">O mundo do Modo História é montado com pacotes de pixel art do <b>Liberated Pixel Cup (LPC)</b> e do OpenGameArt.org. Obrigado a quem fez cada pedaço:</div>'+
        linhas.map(linhaHtml).join('')+
        '<div class="cred-intro">Lista completa de autores de cada pacote:</div><div class="cred-arqs">'+
        ARQ_CREDITOS.map(a=>`<a href="modohistoria/assets/creditos/${a}" target="_blank" rel="noopener">📄 ${a}</a>`).join('')+'</div>'+
        '<div class="cred-intro">Licenças CC-BY-SA: versões editadas dessas imagens (recortes, recolorações) seguem a mesma licença. Personagens, roteiro e o resto do jogo: Arena Fighter.</div>';
    }).catch(()=>{ box.innerHTML='<div class="cred-intro">Não deu pra ler o CREDITOS.md agora. Ele fica em modohistoria/assets/CREDITOS.md.</div>'; });
  }

  /* ---------------- LISTA DE FASES ---------------- */
  function abrirCapitulo(capId){
    const cap=CAPITULOS[capId]; if(!cap || !liberado(capId)) return;
    pararCena();
    goto('historia-fases');
    pintarModo();
    const cond = modo==='condenacao';
    const feitas=vencidas(capId);
    const tit=document.getElementById('hf-titulo');
    if(tit) tit.textContent = (cond?'⚖ ':'')+cap.icone+' '+cap.nome.toUpperCase();
    const sub=document.getElementById('hf-sub');
    if(sub) sub.textContent = (cond ? '⚖ Campanha da Condenação · ' : '')+(feitas>=cap.fases.length
      ? '✅ Capítulo completo! Rejogue qualquer fase.'
      : 'Fase '+(feitas+1)+' de '+cap.fases.length+' liberada');
    const box=document.getElementById('hf-lista'); if(!box) return;
    box.innerHTML = cap.fases.map((f,i)=>{
      const estado = i<feitas ? 'feita' : i===feitas ? 'atual' : 'travada';
      const icone = estado==='feita' ? '✅' : estado==='atual' ? '▶' : '🔒';
      return `<button class="hf-fase ${estado}${f.chefe?' chefe':''}" data-i="${i}" ${estado==='travada'?'disabled':''}>`+
        `<span class="hf-num">${i+1}</span>`+
        `<span class="hf-txt"><b>${esc(f.titulo)}</b>${f.chefe?'<em>CHEFE</em>':''}`+
        `<i>${estado==='travada' ? '???' : esc(f.sinopse)}</i></span>`+
        `<span class="hf-ic">${icone}</span></button>`;
    }).join('');
    box.querySelectorAll('.hf-fase:not([disabled])').forEach(b=>{ b.onclick=()=>jogarFase(capId, +b.dataset.i); });
    const atual=box.querySelector('.hf-fase.atual');
    if(atual) atual.scrollIntoView({ block:'center' });
  }

  function jogarFase(capId, i){
    const cap=CAPITULOS[capId], f=cap && cap.fases[i]; if(!f) return;
    const m=modo;          // a campanha fica PRESA nesta fase, mesmo que o jogador troque no mapa depois
    /* Condenação: a rainha abre a sessão do trono dela (castelo) e só
       depois a cena da fase começa, no cenário da fase */
    const falas = m==='condenacao'
      ? falasDaJuiza(capId, i).concat(comCenario(f.intro, f.cenario))
      : f.intro;
    tocarCena(falas, { legenda:legenda(capId, i, m), cenario:(m==='condenacao'?'castelo':f.cenario),
                       aoFim:()=>lutar(capId, i, m) });
  }
  function legenda(capId, i, m){
    return ((m||modo)==='condenacao' ? '⚖ JULGAMENTO · ' : '')+
           'CAPÍTULO '+(NUM_CAP[capId]||1)+' · FASE '+(i+1)+' — '+CAPITULOS[capId].fases[i].titulo.toUpperCase();
  }

  function lutar(capId, i, m){
    m = m || modo;
    const f=CAPITULOS[capId].fases[i];
    const cond = m==='condenacao';
    // o Mecas do jogador é sempre o ciborgue completo (a transformação é a fase 1)
    const aliado = f.time.map((id,k)=>Object.assign(id==='mecas'?{forma:2}:{}, ((f.ajustes||{}).aliado||[])[k]||{}));
    TurnUI.iniciarHistoria(f.time, f.inimigos, {
      cenario:f.cenario, titulo:(cond?'⚖ ':'')+'Fase '+(i+1)+': '+f.titulo,
      ajustes:{ aliado, inimigo:(f.ajustes||{}).inimigo||[] },
      /* CONDENAÇÃO: o lado inimigo joga com a IA ESPERTA (o mesmo cérebro
         do bot do Tribunal) e a rainha comenta a luta como juíza */
      iaEsperta:cond, juiza:cond,
      aoFim:()=>venceu(capId, i, m),
      aoSair:()=>abrirCapitulo(capId)
    });
  }

  function venceu(capId, i, m){
    m = m || modo;
    marcarVencida(capId, i, m);
    const cap=CAPITULOS[capId], f=cap.fases[i];
    let falas = f.outro;
    if(m==='condenacao'){
      /* veredito do trono ANTES do fechamento da fase; o fim do capítulo
         ganha uma fala a mais */
      const veredito=[J(escolhaFixa(JUIZA.absolvido, i))];
      if(i===cap.fases.length-1) veredito.push(J(JUIZA.capitulo, { pose:'special' }));
      falas = veredito.concat(comCenario(f.outro, f.cenario));
    }
    tocarCena(falas, { legenda:legenda(capId, i, m), cenario:(m==='condenacao'?'castelo':f.cenario),
      aoFim:()=> f.final ? abrirMapa() : abrirCapitulo(capId) });
  }

  /* ============================================================
     REPRODUTOR DE CENA
     Toque/ESPAÇO avança (primeiro completa o texto que ainda está
     sendo escrito, igual o diálogo do hub). PULAR vai direto pro fim.
     ============================================================ */
  let cena=null;     // { falas, i, texto, revelado, inicio, legenda, aoFim, quem, forma, pose }
  let animId=null, t=0;

  function tocarCena(falas, opts){
    opts=opts||{};
    cena={ falas, i:-1, texto:'', revelado:0, inicio:0, legenda:opts.legenda||'', aoFim:opts.aoFim||null,
           quem:false, forma:0, pose:'idle' };
    goto('historia-cena');
    // TurnBG é um motor SÓ (um canvas ligado por vez): a batalha e o hub
    // disputam ele — entrar na cena precisa rebindar pro canvas dela.
    TurnBG.ligar(document.getElementById('historia-bg'));
    if(opts.cenario) TurnBG.usar(opts.cenario);
    document.addEventListener('keydown', teclaCena);
    if(!animId) laco();
    proximaFala();
  }

  function falaAtual(){ return cena ? cena.falas[cena.i] : null; }

  function proximaFala(){
    cena.i++;
    if(cena.i>=cena.falas.length){ fecharCena(); return; }
    const f=falaAtual();
    cena.texto=f.texto; cena.revelado=0; cena.inicio=performance.now();
    if(f.cenario) TurnBG.usar(f.cenario);
    cena.quem = f.quem || false;
    cena.forma = f.forma!=null ? f.forma : (f.quem==='mecas' ? 2 : 0);
    cena.pose = f.pose || 'idle';
    const c = cena.quem && Characters.byId(cena.quem);
    const nome = f.nome || (c ? c.name : '');
    const leg=document.getElementById('ch-legenda'); if(leg) leg.textContent=cena.legenda;
    const el=document.getElementById('ch-nome');
    if(el){ el.textContent=nome; el.hidden=!nome; }
    const cx=document.getElementById('ch-caixa');
    if(cx) cx.classList.toggle('narracao', !cena.quem);
    const cv=document.getElementById('historia-char');
    if(cv && !cena.quem) cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
    pintarTexto();
  }

  function fecharCena(){
    document.removeEventListener('keydown', teclaCena);
    const cb=cena.aoFim;
    cena=null;
    if(cb) cb();
  }
  function pararCena(){
    if(!cena) return;
    document.removeEventListener('keydown', teclaCena);
    cena=null;
  }

  function avancar(){
    if(!cena) return;
    if(cena.revelado<cena.texto.length){ cena.revelado=cena.texto.length; pintarTexto(); return; }
    proximaFala();
  }
  function pular(){ if(cena) fecharCena(); }

  function teclaCena(e){
    if(!cena) return;
    const k=e.key, c=e.code;
    if(k==='Enter'||k===' '||c==='Enter'||c==='Space'){ avancar(); e.preventDefault(); }
    else if(k==='Escape'||c==='Escape'){ pular(); e.preventDefault(); }
  }

  function pintarTexto(){
    const el=document.getElementById('ch-texto');
    if(el && cena) el.textContent = cena.texto.slice(0, cena.revelado);
  }

  function laco(){
    animId=requestAnimationFrame(laco);
    const ativa=document.querySelector('.screen.active');
    if(!ativa || ativa.id!=='screen-historia-cena' || !cena) return;
    t++;
    TurnBG.passo(null, null);
    // máquina de escrever por TEMPO (com a aba em segundo plano o rAF cai
    // pra poucos quadros por segundo e o texto levaria um minuto)
    if(cena.revelado<cena.texto.length){
      const alvo=Math.floor((performance.now()-cena.inicio)/12);
      const novo=Math.max(cena.revelado, Math.min(cena.texto.length, alvo));
      if(novo!==cena.revelado){ cena.revelado=novo; pintarTexto(); }
    }
    const cv=document.getElementById('historia-char');
    const c=cena.quem && Characters.byId(cena.quem);
    if(cv && c){
      Sprites.renderPose(cv, c, {
        pose:cena.pose, t, form:cena.forma, dir:-1,
        targetH:cv.height-30, dy:Math.sin(t*0.06)*2
      });
    }
  }

  return { abrirMapa, abrirMundo, clicarLocal, abrirCapitulo, jogarFase, avancar, pular, trocarModo,
           tocarCena, pararCenaSeTiver:pararCena, pintarCreditos,
           CAPITULOS, get modo(){ return modo; } };
})();
