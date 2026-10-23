/* ============================================================
   MOTOR DA BATALHA 3x3 POR TURNOS
   - ordem de turno por VELOCIDADE (recalculada a cada rodada,
     porque agilidade/lentidão mudam durante a luta)
   - status por turno: queimadura, veneno, sangramento, atordoado,
     lentidão, regeneração, buffs que crescem por turno
   - terreno persistente que fere um dos times todo turno
   - Mecas troca de forma conforme perde vida
   ============================================================ */
const TurnBattle = (function(){

  let times = { aliado:[], inimigo:[] };
  let ordem = [];            // unidades na ordem de ação da rodada
  let idxTurno = 0;
  let rodada = 1;
  /* UM terreno POR TIME (indexado pelo time que sofre o efeito).
     Antes era um slot único global: quando os dois lados lançavam
     Terremoto, o que agia por último SOBRESCREVIA o do outro — e como
     a ordem de turno favorece o aliado (age primeiro), o inimigo
     sempre ficava com o terreno. Era uma vantagem estrutural enorme. */
  let terrenos = { aliado:null, inimigo:null };
  /* ESTRUTURAS: objeto que um time coloca no campo para se proteger
     (o Corsa do Fat Mango). Indexado pelo time PROTEGIDO. Só uma por
     time — estacionar de novo renova, não empilha defesa infinita. */
  let estruturas = { aliado:null, inimigo:null };
  /* AMBIENTE: diferente de terreno e estrutura, ele é GLOBAL — pega os
     dois times. É clima de arena, não vantagem de um lado só. Guarda um
     multiplicador de cura e uma regeneração por rodada.               */
  let ambiente = null;
  /* BARREIRAS (Muralha de Lasanha do Cabelin): indexadas pelo time
     PROTEGIDO. Diferente da estrutura (que dá bônus e some por TEMPO),
     a barreira tem VIDA própria e some quando quebra. Enquanto existir,
     TODO golpe de dano do outro time acerta ela no lugar dos personagens
     — ver `naBarreira` em usarSkill. { nome, icone, hp, hpMax, dono } */
  let barreiras = { aliado:null, inimigo:null };
  /* FUMAÇA COLORIDA (ult do Smergulão): fica no LADO do time de quem
     soltou e dá chance de esquiva pra todo mundo dentro dela. Indexada
     pelo time protegido; some por tempo (rodadas). { nome, turnos, esquiva } */
  let fumacas = { aliado:null, inimigo:null };
  /* IA ESPERTA (Modo Condenação): em vez de sortear entre os golpes de
     dano e bater sempre no de menos vida, ela PONTUA cada golpe e cada
     alvo (ver `valorDoGolpe`/`melhorAlvo`). Ligada por partida. */
  let iaEsperta = false;
  let acabou = false;
  let esperandoAlvo = null;  // skill escolhida esperando clique no alvo
  let onUpdate = null;       // callback da UI
  let log = [];
  let delayIA = 700;         // ms antes da IA jogar (0 = instantâneo)
  /* EVENTO da última ação: é o que a UI usa para ANIMAR o golpe
     (quem bateu, em quem, quanto e com qual estilo). O motor continua
     resolvendo tudo na hora — o evento é só a "gravação" do que houve. */
  let evento = null, seqEvento = 0;
  let esperar = null;        // a UI diz aqui se ainda está animando
  let semIA = false;         // true = o time inimigo é outro jogador
  /* chance de um golpe sair no alvo errado quando quem bate está
     CONFUSO. Aferido por simulação — ver o comentário em usarSkill. */
  const CONFUSAO_CHANCE = 0.35;

  /* ---------------- criação ---------------- */
  function criarUnidade(charId, time, pos){
    const c = Characters.byId(charId);
    const f = TurnData.ficha(charId);
    if(!c || !f) return null;
    return {
      id: charId+'_'+time+pos, charId, char:c, ficha:f, time, pos,
      nome: c.name,
      hpMax: f.hp, hp: f.hp,
      atk: f.atk, def: f.def, spd: f.spd,
      atkBonus:0, defBonus:0, spdBonus:0,   // total (buffs + permanentes)
      atkPerm:0, defPerm:0, spdPerm:0,      // ganhos permanentes (passivas/forma)
      buffs: [],        // {tipo, valor, porTurno, turnos, acumulado}
      dots: [],         // {tipo, dano, turnos, origem}
      atordoado: 0,
      confuso: 0,       // turnos de CONFUSÃO (erra o lado do golpe)
      provocado: null,  // {turnos, por} — taunt: só ataca quem o provocou
      almas: 0,         // passiva sugadora: vira transformação
      esquiva: 0,       // passiva instinto
      forma: f.formaInicial||0,   // Mecas (0) · Mano Coxinha começa no modo COXINHA (1)
      cds: (f.skills||[]).map(()=>0),
      ultimaSkill: null,   // {i, nome} — último golpe que ESSA unidade usou (Lambança mira nisso)
      desabilitadas: [],  // índices de skill DESABILITADOS pro resto da partida (Lambança)
      roubado: null,       // {skill} — ultimate roubada (Adulto Feliz), ocupa o slot da BIZARRICE
      /* POSTURA de meditação (Fat Girl): não trava turno — só diz que ela
         está sentada meditando, o que segura a pose na tela até ela
         atacar. O ataque acumulado mora em atkPerm, como transformação. */
      emMeditacao: false,
      /* RESERVATÓRIO (Tupas): água no estoque. O dano dele escala com ela,
         todo golpe gasta um pouco e o REDEMOINHO (ultimate) bebe dela a
         cada turno enquanto estiver ativo. null = personagem sem estoque. */
      agua: f.agua ? f.agua.inicial : null,
      redemoinho: null,   // {proximo, ultimo, dano, custo, iUlt, recem} — ultimate ATIVA do Tupas
      /* FURTIVIDADE (Smergulão): níveis 0–5 que viram esquiva; `naMoita`
         = turnos escondido na moita; `modoFurtivo` = turnos no modo
         furtivo (forma 1); `esquivouUltimo` = desviou do último golpe
         inimigo (o Golpe Traiçoeiro bate mais forte). */
      furtivo: 0, naMoita: 0, modoFurtivo: 0, esquivouUltimo: false,
      /* SUMIÇO (Prodocimo): turnos em que o próximo golpe inimigo nela acerta
         só um VULTO. Some no primeiro golpe que pegar o vulto. */
      sumida: 0,
      /* DMATERELIZADOR: `fase` = turnos desmaterializado (ninguém mira, ver
         intocavel); `esgotado` = turnos sem poder depois da ult;
         `desintegrado` = defesa que a passiva dele já tirou desta unidade. */
      fase: 0, esgotado: 0, desintegrado: 0,
      vivo: true
    };
  }

  /* opts.semIA = o time 'inimigo' é comandado por OUTRO JOGADOR
     (ranqueada online). O motor continua sendo o mesmo — ele só não
     joga sozinho pelo lado inimigo; as ações chegam pela rede.      */
  function iniciar(idsAliados, idsInimigos, cb, opts){
    opts = opts || {};
    semIA = !!opts.semIA;
    iaEsperta = !!opts.iaEsperta;
    onUpdate = cb || null;
    times.aliado  = idsAliados.map((id,i)=>criarUnidade(id,'aliado',i)).filter(Boolean);
    times.inimigo = idsInimigos.map((id,i)=>criarUnidade(id,'inimigo',i)).filter(Boolean);
    /* MODO HISTÓRIA: uma unidade pode entrar já numa forma avançada (o
       Mecas já sai ciborgue da cutscene de criação — ver js/historia.js).
       checarForma() nunca REGRIDE (só `alvoF>u.forma`), então só precisa
       fixar o valor inicial aqui; replica o ganho de defPerm que
       checarForma() daria de qualquer forma na transição pra forma 2+. */
    if(opts.formaInicial){
      times.aliado.concat(times.inimigo).forEach(u=>{
        const fi=opts.formaInicial[u.charId];
        if(fi!=null && fi>u.forma){
          u.forma=fi;
          if(fi>=2) u.defPerm=(u.defPerm||0)+2;
        }
      });
      recalcularBonus();
    }
    /* MODO HISTÓRIA: ajuste POR POSIÇÃO (`opts.ajustes[lado][i]`) — chefes
       mais fortes, inimigos de elite, clones com outro nome. Por posição
       e não por charId porque o mesmo personagem pode aparecer dos dois
       lados (o Mecas contra os próprios protótipos) com valores diferentes.
       Só mexe nos números da unidade; o kit (ficha) continua o mesmo. */
    if(opts.ajustes){
      ['aliado','inimigo'].forEach(lado=>{
        (opts.ajustes[lado]||[]).forEach((a,i)=>{
          const u=times[lado][i]; if(!u || !a) return;
          if(a.nome) u.nome=a.nome;
          if(a.hp){ u.hpMax=a.hp; u.hp=a.hp; }
          // bônus de história do mundo aberto (missão concluída dá +vida pro grupo)
          if(a.hpMais){ u.hpMax+=a.hpMais; u.hp=u.hpMax; }
          // dificuldade do mundo aberto (`DIFICULDADE` em missoes.js): escala a vida que ficou
          if(a.hpMult){ u.hpMax=Math.max(1,Math.round(u.hpMax*a.hpMult)); u.hp=u.hpMax; }
          if(a.atk!=null) u.atk=a.atk;
          if(a.def!=null) u.def=a.def;
          if(a.spd!=null) u.spd=a.spd;
          if(a.chefe) u.chefe=true;
          /* multiplicador do dano que ELE causa. Existe porque o dano do kit
             mora na skill (Soco de Bolso 60), não no ataque: depois que o
             Marcelão ganhou golpes de 60 (1.28), o chefe dele com atk alto
             virou 0% de vitória e mexer no `atk` quase não mudava nada. */
          if(a.danoMult!=null) u.danoMult=a.danoMult;
          if(a.forma!=null && a.forma>u.forma){
            u.forma=a.forma;
            if(a.forma>=2 && u.ficha.formas) u.defPerm=(u.defPerm||0)+2;
          }
        });
      });
      recalcularBonus();
    }
    rodada=1; terrenos={aliado:null,inimigo:null}; estruturas={aliado:null,inimigo:null}; ambiente=null;
    barreiras={aliado:null,inimigo:null}; fumacas={aliado:null,inimigo:null};
    acabou=false; esperandoAlvo=null; log=[];
    evento=null; seqEvento=0;
    turnosPorTime={aliado:0, inimigo:0}; danoPorTime={aliado:0, inimigo:0};
    // quem já nasce num modo (Mano Coxinha no modo COXINHA) ganha os bônus dele desde o 1º turno
    recalcularBonus();
    escrever('⚔ A batalha começou!');
    novaRodada();
    // se quem começa é do time inimigo, a IA precisa ser acionada AQUI.
    // (antes, a IA só era chamada dentro de proximoTurno, então a batalha
    //  ficava parada para sempre quando o inimigo tinha o mais rápido.)
    iniciarTurnoAtual();
    return estado();
  }

  /* ---------------- ordem de turno ---------------- */
  function velocidadeDe(u){ return Math.max(1, u.spd + u.spdBonus); }
  function novaRodada(){
    /* Empate de velocidade é decidido por INICIATIVA sorteada a cada
       rodada. Antes o desempate era fixo a favor do aliado — como agir
       primeiro decide quem dá o golpe final, isso sozinho valia ~65% de
       vitória num espelho perfeito. Agora é 50/50 e justo. */
    todos().forEach(u=>{ u.iniciativa = Math.random(); });
    const vivos = todos().filter(u=>u.vivo);
    ordem = vivos.slice().sort((a,b)=>{
      const d = velocidadeDe(b)-velocidadeDe(a);
      return d!==0? d : (b.iniciativa - a.iniciativa);
    });

    /* TURNO EXTRA por velocidade.
       Antes a velocidade só decidia a ORDEM — não dava vantagem real, e
       os personagens rápidos (que pagam por isso com pouca vida/defesa)
       ficavam sempre no fundo do balanceamento. Agora quem for bem mais
       rápido que a média do campo age uma segunda vez na rodada, o que
       também dá propósito à passiva "Agilidade Crescente".            */
    if(vivos.length>1){
      const vels = vivos.map(velocidadeDe);
      const media = vels.reduce((a,b)=>a+b,0)/vels.length;
      ordem.forEach(u=>{
        if(velocidadeDe(u) >= media*1.35){
          ordem.push(u);                    // entra de novo no fim da rodada
          u._turnoExtra = true;
        } else u._turnoExtra = false;
      });
    }
    idxTurno = 0;
  }
  function todos(){ return times.aliado.concat(times.inimigo); }
  function vivosDo(time){ return times[time].filter(u=>u.vivo); }
  /* vivo E que dá pra mirar: quem está ENTERRADO (Toca do Verme, Careca)
     não leva golpe de ninguém até sair da terra — nem de área. */
  /* `fase` (Fase Fantasma do Dmaterelizador): desmaterializado, igual a terra — ninguém mira */
  function intocavel(u){ return !!(u.enterrado || u.fase>0); }
  function alvejaveis(time){ return vivosDo(time).filter(u=>!intocavel(u)); }
  function atual(){ return ordem[idxTurno] || null; }

  function escrever(txt){ log.push(txt); if(log.length>60) log.shift(); }

  // contador de turnos por time (diagnóstico de equilíbrio)
  let turnosPorTime = { aliado:0, inimigo:0 };
  let danoPorTime = { aliado:0, inimigo:0 };
  function contarTurno(u){ if(u && turnosPorTime[u.time]!=null) turnosPorTime[u.time]++; }
  function contarDano(origem, v){ if(origem && danoPorTime[origem.time]!=null) danoPorTime[origem.time]+=v; }

  /* ---------------- dano ---------------- */
  function multAgua(u){
    const cfg=u.ficha.agua; if(!cfg) return 1;
    return (cfg.multMin!=null? cfg.multMin : 0.5) + (cfg.multFaixa!=null? cfg.multFaixa : 1) * Math.max(0, u.agua)/cfg.max;
  }
  /* skill do slot i pode ser usada AGORA? (além de recarga/selo). Devolve
     o motivo em texto quando não pode — a UI mostra no botão e a IA filtra.
     `ts` (opcional) = os times de onde ler os companheiros. A tela do
     CONVIDADO online não roda motor nenhum (o `times` daqui é o de alguma
     luta velha) — ela passa os times do estado que chegou pela rede. */
  function condicaoSkill(u, i, ts){
    const s=skillEfetiva(u, i); if(!s) return 'sem golpe';
    // DESMATERIALIZAÇÃO TOTAL gasta tudo: no turno seguinte ele não tem poder nenhum (só defender)
    if(u.esgotado>0) return '🌀 esgotado: sem poder neste turno';
    if(s.redemoinho && u.redemoinho) return null;          // vira o botão de DESATIVAR
    if(s.recuperaAgua && u.agua!=null && u.agua > u.ficha.agua.max*s.recuperaAgua.limite)
      return '💧 só com '+Math.round(s.recuperaAgua.limite*100)+'% de água ou menos';
    // golpe que só existe numa forma (Invocar o Ursão: só no modo DEMÔNIO)
    if(s.soForma!=null && (u.forma||0)!==s.soForma)
      return '👹 só no modo '+((u.ficha.formaNomes||[])[s.soForma]||'certo');
    // comida do modo em que ele já está: não troca nada (Mano Coxinha)
    if(s.virarForma!=null && u.ficha.formaStats && (u.forma||0)===s.virarForma)
      return '🍽 já está no modo '+((u.ficha.formaNomes||[])[s.virarForma]||'');
    // invocação precisa de um aliado CAÍDO pra ocupar o lugar dele
    if(s.invocar && !aliadoCaido(u, ts)) return '💀 só com um aliado caído';
    /* golpe de UM aliado (Beijo Curativo, Lasanha Quentinha, Abraço,
       Purificação) é pra um COMPANHEIRO — nunca em si mesmo. Era a brecha
       do bot: a Loirinha da IA se beijava sozinha (o jogador nunca pôde).
       Sem companheiro de pé, o golpe não tem pra quem ir. */
    if(s.alvo==='aliado' && !companheiros(u, ts).length) return '💚 sem aliado de pé pra receber';
    return null;
  }

  /* companheiros VIVOS e alcançáveis de `u` (sem ele mesmo e sem quem
     está enterrado) — quem pode receber um golpe de "1 aliado". */
  function companheiros(u, ts){
    return ((ts||times)[u.time]||[]).filter(x=>x!==u && x.id!==u.id && x.vivo && !x.enterrado);
  }

  /* aliado morto que pode dar o lugar pra uma INVOCAÇÃO (o Ursão da
     Criança Rosa). Quem ainda vai voltar sozinho (Careca esperando virar
     verme) não conta — o lugar dele não está vago. */
  function aliadoCaido(u, ts){
    // `!x.renasce` (e não `==null`): no estado que chega pela rede ele vem como true/false
    return ((ts||times)[u.time]||[]).find(x=>x!==u && x.id!==u.id && !x.vivo && !x.renasce) || null;
  }
  let seqInvocacao=0;

  function calcularDano(origem, alvo, base, tipo, opts){
    opts=opts||{};
    let dano = base + (origem? (origem.atk + origem.atkBonus)*0.35 : 0);

    /* multiplicador de FORMA. O Mecas herda a curva antiga; quem
       define `formaMult` (a Smergula) usa a própria. */
    if(origem && (origem.ficha.formas || origem.ficha.almas)){
      const mults = origem.ficha.formaMult || [1, 1.20, 1.40];
      dano *= mults[origem.forma] || 1;
    }
    // MODO DE COMBATE (Mano Coxinha): o hambúrguer liga o modo ATAQUE
    const fsO = statsDaForma(origem);
    if(fsO && fsO.dano) dano *= fsO.dano;
    /* RESERVATÓRIO (Tupas): tanque cheio bate ×1,5, tanque seco ×0,5 —
       a água é o que dá peso ao golpe. Lido ANTES de descontar o custo do
       próprio golpe (o desconto acontece no fim do usarSkill). */
    if(origem && origem.ficha.agua) dano *= multAgua(origem);
    // MODO FURTIVO (Smergulão): bem mais esquivo, bem menos dano
    if(origem && origem.modoFurtivo>0) dano *= 0.5;
    // chefe do Modo História com o dano calibrado (ver `ajustes.danoMult` em iniciar)
    if(origem && origem.danoMult) dano *= origem.danoMult;
    // AMBIENTE amplifica MAGIA (o Véu Maldito da Smergula)
    if(ambiente && ambiente.magiaMult && typeof TurnData!=='undefined' && TurnData.ehMagia(tipo))
      dano *= ambiente.magiaMult;
    // Rajada de Fúria escala com a velocidade acumulada
    if(opts.escalaVelocidade && origem) dano *= 1 + (origem.spdBonus*0.02);
    /* COLAPSO do Fat Smerg: o dano CRESCE com a defesa DELE. É o que
       fecha a estratégia de tanque — ele provoca o inimigo, sobrevive
       com a Fortaleza, engrossa a defesa com a Postura de Rocha e o
       salto final devolve toda essa defesa acumulada como dano. */
    if(opts.escalaDefesa && origem) dano += (origem.def + origem.defBonus) * opts.escalaDefesa;
    /* Adulto Feliz: o dano dele sai do TAMANHO dele (vida MÁXIMA), não
       do ataque (que é baixo de propósito) — quanto maior ele for, mais
       peso ele joga no braço. Foi medido com a vida ATUAL primeiro
       (caindo conforme ele apanha), mas isso criava uma espiral: o
       tanque que mais leva dano era também o que menos causava dano
       exatamente quando mais precisava — 150 batalhas simuladas deram
       só 17% de vitória. Com o teto (hpMax) o dano fica CONSTANTE a
       partida inteira: ele ainda é recompensado por ser gigante, só que
       sem punir dobrado quem já está fazendo o trabalho de tanque. */
    if(opts.escalaVida && origem) dano += origem.hpMax * opts.escalaVida;

    /* Defesa por PORCENTAGEM, não subtração fixa.
       Com subtração (dano - def*0.6), um golpe de 13 contra def 13 perdia
       60% do valor, enquanto um golpe de 34 perdia só 23% — ou seja, a
       defesa apagava os personagens de vários golpes pequenos (Jab Duplo,
       Combo Cibernético) e inflava os tanques. Em porcentagem o corte é
       igual para todos os tamanhos de golpe.                            */
    let def = alvo.def + alvo.defBonus;
    // veneno e sangramento ignoram defesa — os dois "chegam pelo corpo",
    // não pela força do golpe; a defesa não impede infecção nem corte.
    if(tipo==='veneno' || tipo==='sangramento') def = 0;
    else if(tipo==='energia') def *= 0.25;    // energia perfura
    dano = dano * (100 / (100 + Math.max(0,def)*4));
    dano = Math.max(1, dano);

    // passiva Fortaleza
    if(alvo.ficha.passiva==='fortaleza') dano *= 0.75;
    // passiva Fé Inabalável (Lambança): sem cura nenhuma no kit, então
    // parte da sobrevivência dele vem de apanhar um pouco menos.
    if(alvo.ficha.passiva==='fervor') dano *= 0.85;
    // passiva Estofado (Adulto Feliz): redução menor que a Fortaleza,
    // mas soma com o crescimento de defesa por turno (ver tickFimDeTurno)
    if(alvo.ficha.passiva==='estofado') dano *= 0.90;
    // MODO DEFESA (Mano Coxinha, depois da coxinha): a massa amortece
    const fsA = statsDaForma(alvo);
    if(fsA && fsA.reducao) dano *= 1 - fsA.reducao;
    return Math.round(dano);
  }

  /* bônus do MODO DE COMBATE atual (`formaStats[forma]` na ficha — só o
     Mano Coxinha usa): { dano, reducao, def, spd, esquiva } */
  function statsDaForma(u){
    if(!u || !u.ficha || !u.ficha.formaStats) return null;
    return u.ficha.formaStats[u.forma||0] || null;
  }

  /* CHANCE DE ESQUIVA de quem vai levar o golpe. Um lugar só, porque
     agora são várias fontes: Instinto (Serrinha), Furtividade
     (Smergulão — níveis + moita + modo furtivo) e a Fumaça Colorida
     (vale pra TODO o time dentro dela). Teto de 70%: ninguém vira
     intocável empilhando tudo. */
  const FURTIVO_POR_NIVEL = 0.06, FURTIVO_MAX = 5, FURTIVO_CONTRA = 4;
  const CARA_DE_PAU_ESQUIVA = 0.10;   // passiva da Prodocimo (ver aplicarDano)
  const DESINTEGRA_MAX = 6;           // passiva do Dmaterelizador: defesa máxima tirada de cada alvo
  function chanceEsquiva(alvo){
    // SUMIÇO (Prodocimo): o que está ali é um vulto — o golpe erra com certeza
    if(alvo.sumida>0) return 1;
    let c=0;
    if(alvo.ficha.passiva==='instinto') c += alvo.esquiva||0;
    if(alvo.ficha.passiva==='cara_de_pau') c += CARA_DE_PAU_ESQUIVA;
    if(alvo.ficha.passiva==='furtividade'){
      c += (alvo.furtivo||0)*FURTIVO_POR_NIVEL;
      if(alvo.modoFurtivo>0) c += 0.15;
      if(alvo.naMoita>0)     c += 0.35;
    }
    const fu=fumacas[alvo.time]; if(fu) c += fu.esquiva||0;
    const fs=statsDaForma(alvo); if(fs && fs.esquiva) c += fs.esquiva;   // modo VELOCIDADE (pizza)
    return Math.min(0.70, c);
  }
  /* contra-ataque ao esquivar: o Serrinha SEMPRE; o Smergulão só quando
     está MUITO furtivo (4+ níveis) — "desvia igual o Serrinha Dog". */
  function contraAtaca(alvo){
    return alvo.ficha.passiva==='instinto' ||
           (alvo.ficha.passiva==='furtividade' && (alvo.furtivo||0)>=FURTIVO_CONTRA);
  }

  let _esquivou=false;       // marcado por aplicarDano, lido pelo evento
  let _vulto=false;          // a esquiva foi o SUMIÇO da Prodocimo (a tela escreve outra coisa)
  function aplicarDano(origem, alvo, valor, tipo){
    if(!alvo.vivo) return 0;
    // esquiva (Instinto, Furtividade, Fumaça Colorida, Sumiço)
    const inimigoBateu = origem && origem.time!==alvo.time;
    if(inimigoBateu && Math.random() < chanceEsquiva(alvo)){
      _esquivou=true;
      alvo.esquivouUltimo=true;
      if(alvo.sumida>0){
        alvo.sumida=0; _vulto=true;
        escrever(`👻 ${origem.nome} acertou só um VULTO — ${alvo.nome} não estava ali!`);
      } else escrever(`💨 ${alvo.nome} ESQUIVOU!`);
      /* CARA DE PAU (Prodocimo): quem erra nela fica sem entender nada —
         CONFUSO no próximo turno. 2 e não 1: o fim do turno de quem bateu
         (que é agora) já desconta um. Fé Inabalável continua imune. */
      if(alvo.ficha.passiva==='cara_de_pau' && origem && origem.vivo && origem.ficha.passiva!=='fervor' && !(origem.confuso>=2)){
        origem.confuso = 2;
        escrever(`   😵 ${origem.nome} caiu na conversa de ${alvo.nome} e ficou CONFUSO`);
      }
      if(origem && origem.vivo && contraAtaca(alvo)){
        const contra = Math.round(valor*0.35);
        origem.hp = Math.max(0, origem.hp - contra);
        escrever(`   ↪ contra-ataque em ${origem.nome}: ${contra}`);
        checarMorte(origem);
      }
      return 0;
    }
    alvo.hp = Math.max(0, alvo.hp - valor);
    contarDano(origem, valor);
    /* tomou o golpe: não esquivou do último, e o furtivo foi DESCOBERTO
       (perde um nível de furtividade) */
    if(inimigoBateu && valor>0){
      alvo.esquivouUltimo=false;
      if(alvo.ficha.passiva==='furtividade' && alvo.furtivo>0) alvo.furtivo--;
    }
    /* SUGADORA: todo golpe que acerta converte dano em ALMAS. É o que
       move a transformação dela — ao contrário do Mecas, que vira
       ciborgue apanhando, ela vira demônio batendo. */
    const cfg = origem && origem.ficha.almas;
    if(cfg && valor>0){
      origem.almas = (origem.almas||0) + Math.round(valor*(cfg.porDano||0) + (cfg.porGolpe||0));
      checarForma(origem);
    }
    checarForma(alvo);
    checarMorte(alvo);
    return valor;
  }

  /* TODA cura do jogo passa por aqui: é o único ponto que conhece o
     multiplicador do AMBIENTE e a passiva Carisma. Espalhar isso pelos
     quatro lugares que curam (skill, dreno, regeneração, padaria) seria
     garantir que um deles ficasse para trás. */
  function curar(alvo, valor, origem){
    if(!alvo || !alvo.vivo || valor<=0) return 0;
    let v = valor;
    if(ambiente && ambiente.curaMult) v *= ambiente.curaMult;
    v = Math.round(v);
    const antes = alvo.hp;
    alvo.hp = Math.min(alvo.hpMax, alvo.hp + v);
    const feito = alvo.hp - antes;
    // passiva CARISMA: quem cura OUTRO aliado leva 45% de volta
    if(feito>0 && origem && origem!==alvo && origem.vivo && origem.ficha.passiva==='carisma'){
      // conta o que ENTROU de fato: com a vida cheia o retorno é zero,
      // e anunciar cura que não aconteceu confunde a leitura do log.
      const antesO = origem.hp;
      origem.hp = Math.min(origem.hpMax, origem.hp + Math.round(feito*0.45));
      const ganho = origem.hp - antesO;
      if(ganho>0) escrever(`   💋 ${origem.nome} recuperou ${ganho} pelo próprio carinho`);
    }
    return feito;
  }

  function checarMorte(u){
    if(u.vivo && u.hp<=0){
      u.vivo=false; u.enterrado=null; escrever(`☠ ${u.nome} foi derrotado!`);
      if(u.redemoinho) fimRedemoinho(u, 'o Tupas caiu');
      /* passiva MALDIÇÃO DO VERME (Careca): agenda a volta pra rodada
         seguinte. Uma vez só por partida (`virouVerme`). Se o time dele
         acabar antes disso, checarFim encerra a partida e ele não volta. */
      if(u.ficha.verme && !u.virouVerme && u.renasce==null){
        u.renasce = rodada + 1;
        escrever(`   🪱 ...a maldição se mexe debaixo do corpo de ${u.nome}.`);
      }
    }
  }

  /* começo de rodada: quem tem a volta agendada renasce na FORMA VERME,
     com os números da ficha `verme` e sem nenhum efeito da vida anterior
     (veneno, buff, selo, atordoamento) — é outro corpo. As recargas
     zeram, menos a da ultimate (senão morrer viraria ult de graça). */
  function renascerVermes(){
    todos().forEach(u=>{
      if(u.vivo || u.renasce==null || u.renasce>rodada) return;
      const v=u.ficha.verme;
      u.renasce=null; u.virouVerme=true; u.vivo=true; u.forma=1;
      u.hpMax=v.hp; u.hp=v.hp; u.atk=v.atk; u.def=v.def; u.spd=v.spd;
      u.atkPerm=0; u.defPerm=0; u.spdPerm=0;
      u.buffs=[]; u.dots=[]; u.atordoado=0; u.confuso=0; u.provocado=null;
      u.desabilitadas=[]; u.roubado=null; u.emMeditacao=false; u.enterrado=null;
      u.cds=u.cds.map((c,i)=>{ const s=u.ficha.skills[i]; return (s && s.super)? c : 0; });
      escrever(`🪱 ${u.nome} VOLTOU — como VERME! (${v.hp} de vida)`);
      // evento só pra UI encenar a volta (pose `renascer`); não tira vida de ninguém
      evento = { seq:++seqEvento, acao:'renascer', origem:u.id, time:u.time, estilo:'foco',
                 skill:{ nome:'Maldição do Verme', icone:'🪱', tipo:'veneno', alvo:'eu', pose:'renascer',
                         vezes:1, super:false, dano:0, rotulo:'🪱 VOLTOU COMO VERME!' },
                 alvos:[{ id:u.id, dano:0, cura:0, esquivou:false, morreu:false }] };
    });
    recalcularBonus();
  }

  /* Mecas: troca de forma ao cruzar os limites de vida (nunca regride) */
  function checarForma(u){
    // transformação por ALMAS acumuladas (Smergula)
    const cfg=u.ficha.almas;
    if(cfg && u.forma<1 && (u.almas||0)>=cfg.limite){
      u.forma=1;
      escrever(`👹 ${u.nome} consumiu ${cfg.limite} almas → ${u.ficha.formaNomes[1]}!`);
      const g=u.ficha.formaGanhos||{};
      u.atkPerm=(u.atkPerm||0)+(g.atk||0);
      u.defPerm=(u.defPerm||0)+(g.def||0);
      recalcularBonus();
      return;
    }
    if(!u.ficha.formas) return;
    const frac = u.hp/u.hpMax;
    let alvoF=0;
    u.ficha.formas.forEach((lim,i)=>{ if(frac<=lim) alvoF=i+1; });
    if(alvoF>u.forma){
      u.forma=alvoF;
      escrever(`🦾 ${u.nome} → ${u.ficha.formaNomes[alvoF]}!`);
      if(alvoF>=2){ u.defPerm=(u.defPerm||0)+2; recalcularBonus(); }
    }
  }

  /* ---------------- executar uma skill ---------------- */
  /* a unidade é DESTA luta? Um timer da IA da luta anterior (o jogador saiu
     no VOLTAR enquanto o bot "pensava" e já começou outra) disparava com a
     unidade velha — e um inimigo fantasma agia dentro da luta nova. */
  function daLuta(u){ return !!u && (times.aliado.indexOf(u)>=0 || times.inimigo.indexOf(u)>=0); }

  function usarSkill(unidade, iSkill, alvoEscolhido){
    if(acabou || !unidade || !unidade.vivo || !daLuta(unidade)) return false;
    // enterrado não escolhe nada: quem tira ele da terra é o próprio turno (emergir)
    if(unidade.enterrado && !unidade._emergindo) return false;
    const sk0 = unidade.ficha.skills[iSkill];
    if(!sk0) return false;
    if(unidade.cds[iSkill]>0) return false;
    if((unidade.desabilitadas||[]).some(d=>d.i===iSkill)) return false;   // Lambança selou esse golpe

    /* ROUBO (Adulto Feliz): se este slot é a BIZARRICE e ele já tem uma
       ultimate roubada guardada, é ELA que sai agora — não a Bizarrice
       de novo. Mecas continua resolvendo forma normalmente por cima. */
    const consumindoRoubo = !!(sk0.roubar && unidade.roubado);
    const sk = TurnData.skillNaForma(consumindoRoubo? unidade.roubado.skill : sk0, unidade.forma);
    /* CASTANDO a própria Bizarrice agora (não consumindo um roubo já
       guardado): o cd dela só é decidido DEPOIS de saber se o roubo deu
       certo — ver o fechamento mais abaixo, perto de `sk.roubar`. Se
       fixasse aqui, um roubo bem-sucedido já nasceria travado 6 turnos
       antes de ele conseguir usar a ultimate que acabou de roubar. */
    const lancandoBizarrice = !!(sk0.roubar && !consumindoRoubo);
    /* Tupas: o golpe que RECUPERA água só sai com o estoque baixo (a
       condição vem da ficha), e o redemoinho ativo não é lançado de novo
       — o slot dele vira DESATIVAR (desativarRedemoinho, de graça). */
    /* TODA condição vale aqui, não só a da água: antes o motor só conferia
       a Correnteza — "Invocar sem ninguém caído" ou "Ursão fora do modo
       demônio" eram barrados só pelo botão da tela (um cliente online
       adulterado passava direto). */
    if(condicaoSkill(unidade, iSkill)) return false;
    if(sk.redemoinho && unidade.redemoinho) return false;

    /* AMBIENTE com `recargaExtra` (TEMPESTADE DE GELO, Marcelão Black
       JW): toda skill que QUALQUER UM usar enquanto durar recarrega mais
       devagar — só entra quem realmente vai pra recarga (cd>0), uma
       skill livre não tem "recarga" pra atrasar. */
    const recargaExtra = (ambiente && ambiente.recargaExtra && (sk.cd||0)>0) ? ambiente.recargaExtra : 0;
    if(consumindoRoubo){
      unidade.roubado = null;
      // volta a travar como se fosse a própria Bizarrice: nunca menos
      // que o cd dela, senão dava pra roubar+usar rápido demais em loop.
      unidade.cds[iSkill] = Math.max(sk.cd||0, sk0.cd||0) + recargaExtra;
    } else if(!lancandoBizarrice){
      unidade.cds[iSkill] = (sk.cd||0) + recargaExtra;
      /* RECARGA COMPARTILHADA (`cdGrupo`, as comidas do Mano Coxinha): os
         golpes do mesmo grupo são UMA ult só em três botões — usou um,
         os outros recarregam junto. */
      if(sk.cdGrupo) unidade.ficha.skills.forEach((s,j)=>{ if(j!==iSkill && s.cdGrupo===sk.cdGrupo) unidade.cds[j]=Math.max(unidade.cds[j]||0, unidade.cds[iSkill]); });
    }
    unidade.ultimaSkill = { i:iSkill, nome:sk.nome };
    contarTurno(unidade);
    const timeInimigo = unidade.time==='aliado'? 'inimigo':'aliado';
    escrever(`▶ ${unidade.nome} usou ${sk.icone||''} ${sk.nome}`);

    // ---- alvos ----
    let alvos=[];
    /* o lado do alvo é CONFERIDO aqui: online o alvo chega como um id
       pela rede, e um cliente adulterado poderia mandar "curo o inimigo"
       ou "bato no meu aliado". Se não bater, cai no alvo padrão. */
    const escolhaValida = (lado)=> (alvoEscolhido && alvoEscolhido.vivo && !intocavel(alvoEscolhido) &&
                                    alvoEscolhido.time===lado) ? alvoEscolhido : null;
    if(sk.alvo==='inimigo')
      alvos = [ escolhaValida(timeInimigo) || alvejaveis(timeInimigo)[0] ].filter(Boolean);
    else if(sk.alvo==='aliado'){       // UM aliado escolhido (o beijo) — NUNCA ele mesmo
      const esc = escolhaValida(unidade.time);
      alvos = [ (esc && esc!==unidade) ? esc :
                companheiros(unidade).sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0] ].filter(Boolean);
    }
    else if(sk.alvo==='todos_inimigos')alvos = alvejaveis(timeInimigo);
    else if(sk.alvo==='eu')            alvos = [unidade];
    else if(sk.alvo==='aliados')       alvos = vivosDo(unidade.time);
    /* 'qualquer' (BIZARRICE): qualquer um vivo em campo, dos dois times,
       MENOS ele mesmo — não existe "escolha padrão" sensata (diferente
       de 'inimigo', que cai no primeiro vivo), então sem um alvo válido
       vindo de fora o golpe simplesmente não acerta ninguém.          */
    else if(sk.alvo==='qualquer'){
      const esc = alvoEscolhido;
      alvos = (esc && esc.vivo && esc.id!==unidade.id) ? [esc] : [];
    }
    alvos = alvos.filter(Boolean);

    /* TAUNT (Provocar Fúria do Fat Smerg): quem está PROVOCADO só
       consegue mirar um golpe de alvo único em quem o provocou. É
       enforçado AQUI, no motor — vale para o jogador, para a IA e para
       o online, não importa o alvo que o chamador pediu. Golpe de área
       continua acertando todo mundo (inclusive o provocador). Se o
       provocador já morreu, a raiva perde o alvo e o golpe sai normal. */
    // (golpe que `atravessa` — o Portal do Dmaterelizador — sai do outro lado: ignora o taunt)
    if(unidade.provocado && sk.dano>0 && sk.alvo==='inimigo' && !sk.atravessa){
      const dono = todos().find(x=>x.id===unidade.provocado.por);
      if(dono && dono.vivo && !intocavel(dono) && dono.time===timeInimigo) alvos=[dono];
    }

    /* CONFUSÃO: metade das vezes o golpe sai no lado errado e acerta o
       PRÓPRIO time. Fica antes da gravação do evento de propósito —
       a animação precisa mostrar o golpe indo para onde ele foi de
       verdade, não para onde o jogador mirou. Só vale para golpe que
       causa dano: cura ou buff confuso viraria bagunça ilegível.
       Sem aliado vivo para acertar, o golpe sai normal.              */
    let confundiu=false;
    if(unidade.confuso>0 && sk.dano>0 && Math.random()<CONFUSAO_CHANCE){
      /* o golpe vai para um alvo QUALQUER do campo — pode ser o inimigo
         que ele já ia acertar. Medido: quando o confuso batia SEMPRE no
         próprio time, a confusão sozinha valia 56% de vitória contra 0%
         sem ela (dano dobrado: eu não levo E ele se machuca). Sorteando
         no campo inteiro, o efeito continua doendo sem decidir a luta. */
      const cand = todos().filter(x=>x.vivo && !intocavel(x) && x!==unidade);
      if(cand.length){
        const escolhido = cand[(Math.random()*cand.length)|0];
        alvos = [escolhido];
        confundiu = true;
        escrever(escolhido.time===unidade.time
          ? `   😵 ${unidade.nome} está CONFUSO e acertou ${escolhido.nome}, do PRÓPRIO time!`
          : `   😵 ${unidade.nome} está CONFUSO e bateu a esmo em ${escolhido.nome}`);
      }
    }

    /* MOEDA FATAL (Marcelão Black JW): a moeda pula sozinha pro time
       inimigo inteiro, um alvo NOVO por vez (nunca repete o mesmo dois
       quiques seguidos — assim cada entrada de `alvos` cai num `id`
       diferente, e o resto do motor/UI, que já sabe lidar com golpe de
       área acertando vários alvos numa tacada só, funciona sem precisar
       de nenhum código especial pra multi-hit). Cada quique rola a
       MESMA chance de continuar; para sozinha quando erra a sorte ou
       quando não sobra mais ninguém vivo pra pular. Não recocheteia se
       a CONFUSÃO já redirecionou o golpe (ver acima) — cruzar os dois
       efeitos abriria a possibilidade de "recochetear" no PRÓPRIO time,
       o que não faz sentido pra uma moeda mirada no time inimigo. */
    if(sk.recochete && !confundiu && alvos.length){
      const chance = sk.recochete.chance!=null? sk.recochete.chance : 0.6;
      const restantes = alvejaveis(timeInimigo).filter(u=>u!==alvos[0]);
      const sequencia = [alvos[0]];
      while(restantes.length && Math.random()<chance){
        const idx = (Math.random()*restantes.length)|0;
        sequencia.push(restantes[idx]);
        restantes.splice(idx,1);
      }
      alvos = sequencia;
      if(alvos.length>1) escrever(`   🪙 a moeda recocheteou ${alvos.length} vez(es)`);
    }

    /* TOCA DO VERME (`cava`, Careca verme): golpe em DUAS partes. Usar a
       skill só ENTERRA (sem dano, lembra o alvo escolhido); no próximo
       turno dele `emergir()` sai da terra sozinho e aí sim o mesmo golpe
       acerta, com dano e veneno. Enterrado ninguém mira nele (alvejaveis). */
    const cavando = !!(sk.cava && !unidade._emergindo);
    /* limpa a marca JÁ aqui, não depois que usarSkill voltar: com a IA
       instantânea o proximoTurno lá embaixo pode rodar a rodada inteira
       (até o próximo turno DELE) antes de retornar. */
    unidade._emergindo = false;
    if(cavando){
      unidade.enterrado = { alvo:(alvos[0] && alvos[0].id) || null, i:iSkill };
      alvos = [];
      escrever(`   🕳 ${unidade.nome} se enfiou na terra! Sai no próximo turno.`);
    }

    /* MURALHA DE LASANHA: o time inimigo tem uma barreira de pé → TODO
       golpe de DANO mirado nele (1 alvo ou área) acerta a barreira no
       lugar dos personagens, até ela quebrar. Vale por cima do taunt (a
       muralha está NA FRENTE de todo mundo). Golpe confuso não entra —
       ele já saiu a esmo. A área acerta a muralha UMA vez (é um objeto
       só); os efeitos do golpe (veneno, lentidão, atordoar, dreno) ficam
       presos na lasanha: com `alvos` vazio, nada daqui pra baixo pega. */
    /* DESMATERIALIZAR (Dmaterelizador): antes de tudo, desmancha o que o
       time inimigo construiu no campo (Corsa, Escudo Temporal, Muralha de
       Lasanha, Fumaça Colorida) e o terreno que está ferindo o time DELE.
       Por vir antes da muralha, o golpe chega nos personagens. Os buffs de
       cada alvo saem no bloco de status (quem esquivar escapa). */
    const desfeitos=[];
    if(sk.desfazer){
      if(estruturas[timeInimigo]){ desfeitos.push(estruturas[timeInimigo].nome); estruturas[timeInimigo]=null; }
      if(barreiras[timeInimigo]){ desfeitos.push(barreiras[timeInimigo].nome); barreiras[timeInimigo]=null; }
      if(fumacas[timeInimigo]){ desfeitos.push(fumacas[timeInimigo].nome); fumacas[timeInimigo]=null; }
      if(terrenos[unidade.time]){ desfeitos.push(terrenos[unidade.time].nome); terrenos[unidade.time]=null; }
      if(desfeitos.length) escrever(`   🌀 ${unidade.nome} DESMATERIALIZOU: ${desfeitos.join(', ')}`);
    }

    const barr = barreiras[timeInimigo];
    let golpeNaBarreira = null;
    // o Portal sai do outro lado da muralha (`atravessa`)
    if(barr && barr.hp>0 && sk.dano>0 && !confundiu && !cavando && alvos.length && !sk.atravessa &&
       (sk.alvo==='inimigo' || sk.alvo==='todos_inimigos') && alvos.every(a=>a.time===timeInimigo)){
      const alvoMuralha = { def:0, defBonus:0, ficha:{ passiva:null } };
      let total=0;
      for(let v=0; v<(sk.vezes||1); v++)
        total += calcularDano(unidade, alvoMuralha, sk.dano, sk.tipo,
          {escalaVelocidade:sk.escalaVelocidade, escalaDefesa:sk.escalaDefesa, escalaVida:sk.escalaVida});
      const antes = barr.hp;
      barr.hp = Math.max(0, barr.hp - total);
      contarDano(unidade, antes - barr.hp);
      escrever(`   ${barr.icone} o golpe acertou a ${barr.nome}: -${total} (${barr.hp}/${barr.hpMax})`);
      golpeNaBarreira = { time:timeInimigo, dano:total, hpAntes:antes, hpDepois:barr.hp, hpMax:barr.hpMax,
                          quebrou: barr.hp<=0, nome:barr.nome, icone:barr.icone };
      if(barr.hp<=0){ escrever(`   💥 a ${barr.nome} QUEBROU!`); barreiras[timeInimigo]=null; }
      alvos = [];
    }

    // gravação da ação para a UI animar
    const ev = { seq:++seqEvento, acao:'skill', origem:unidade.id, time:unidade.time, barreira:golpeNaBarreira,
                 estilo: cavando? 'foco' : (typeof TurnData!=='undefined'? TurnData.estilo(sk):'corpo'),
                 skill:{ nome:sk.nome, icone:sk.icone||'★', tipo:sk.tipo||'fisico',
                         // pose própria do golpe (anim do personagem) — ver poseDeAtaque no turnui
                         pose: cavando? 'cavar' : (sk.cava? 'emergir' : (sk.pose||null)),
                         fx: sk.fx||null,   // efeito de SPRITE (folha de efeitos) — ver TurnFX.sprite
                         fxOrigem: sk.fxOrigem||null,    // efeito em QUEM USOU, no começo do golpe
                         fxImpacto: sk.fxImpacto||null,  // efeito em CADA alvo atingido, no impacto

                         alvo:sk.alvo, vezes:sk.vezes||1, super:!!sk.super, dano:sk.dano||0,
                         rotulo:(typeof TurnData!=='undefined'? TurnData.rotulo(sk):null) },
                 /* `efeitos` = o que PEGOU em cada alvo (veneno, lento, atordoado…)
                    — a tela mostra os ícones subindo dele. `evitou` = esquivou
                    do golpe e, com isso, de todos os efeitos dele. */
                 alvos: alvos.map(a=>({ id:a.id, dano:0, cura:0, esquivou:false, morreu:false, efeitos:[] })) };
    if(desfeitos.length) ev.desfeitos = desfeitos;
    const reg = id => ev.alvos.find(x=>x.id===id);
    const marcaEfeito = (alvo, chave)=>{ const r=reg(alvo.id); if(r && r.efeitos.indexOf(chave)<0) r.efeitos.push(chave); };

    // ---- cura ----
    if(sk.cura){
      alvos.forEach(a=>{ const feito=curar(a, sk.cura, unidade);
        const r=reg(a.id); if(r) r.cura += feito;
        escrever(`   💚 ${a.nome} +${feito}`); });
    }

    /* ---- MURALHA DE LASANHA (Cabelin): paga com a PRÓPRIA vida e ergue a
       barreira na frente do time. Nunca mata quem paga (fica com 1, no
       mínimo). Levantar de novo com uma muralha de pé só renova a vida
       dela, não empilha. ---- */
    if(sk.barreira){
      const custo = Math.max(0, Math.min(sk.custoVida||0, unidade.hp-1));
      if(custo>0){ unidade.hp -= custo; escrever(`   ❤ ${unidade.nome} pagou ${custo} de vida`); }
      const b=sk.barreira;
      barreiras[unidade.time] = { nome:b.nome, icone:b.icone||'🧱', hp:b.hp, hpMax:b.hp, dono:unidade.id };
      escrever(`   ${b.icone||'🧱'} ${b.nome} de pé (${b.hp} de vida): os inimigos SÓ conseguem bater nela!`);
      ev.barreiraNova = { time:unidade.time, hp:b.hp, hpMax:b.hp, custo };
    }

    /* ---- SMERGULÃO ----
       · moita       : se esconde — esquiva ENORME até o próximo turno dele
                       (dura 2 fins de turno: o deste e o do próximo dele)
       · modoFurtivo : liga o MODO FURTIVO por N turnos dele (forma 1):
                       bate pela metade, esquiva +15%
       · fumaca      : FUMAÇA COLORIDA no lado do time dele              */
    if(sk.moita){
      unidade.naMoita = 2;
      escrever(`   🌿 ${unidade.nome} se escondeu na MOITA (muito difícil de acertar até o próximo turno dele)`);
    }
    /* ---- PRODOCIMO: SUMIÇO — deixa um vulto no lugar. O próximo golpe
       inimigo nela (até o próximo turno dela) erra com certeza; 2 porque
       o fim DESTE turno já desconta um, igual a moita. ---- */
    if(sk.sumico){
      unidade.sumida = 2;
      escrever(`   👻 ${unidade.nome} SUMIU na fumaça — o próximo golpe nela vai acertar um vulto`);
    }
    /* ---- DMATERELIZADOR: FASE FANTASMA — se desmaterializa: até o
       próximo turno dele ninguém consegue mirar nele (nem golpe de área),
       igual a quem está debaixo da terra. 2: o fim deste turno já desconta. */
    if(sk.fase){
      unidade.fase = 2;
      escrever(`   🌀 ${unidade.nome} se DESMATERIALIZOU — ninguém acerta ele até o próximo turno dele`);
    }
    /* ---- CRIANÇA ROSA ----
       · invocar     : paga % da vida MÁXIMA e traz o URSÃO pro lugar de um
                       aliado caído (unidade nova, outro id, entra na
                       próxima rodada). Só passa da condição com morto.
       · alternaForma: a ult — troca Criança ↔ Demônio (e os golpes trocam
                       junto pelo formaOverride). */
    if(sk.invocar){
      const morto = aliadoCaido(unidade);
      if(morto){
        const inv=sk.invocar;
        const custo = Math.max(0, Math.min(unidade.hp-1, Math.round(unidade.hpMax*(inv.custoPct||0.25))));
        unidade.hp -= custo;
        const lista=times[unidade.time], idx=lista.indexOf(morto);
        const novo=criarUnidade(inv.id, unidade.time, morto.pos);
        if(novo){
          novo.id = novo.id+'_'+(++seqInvocacao);
          novo.invocadoPor = unidade.id;
          lista[idx]=novo;
          escrever(`   ❤ ${unidade.nome} deu ${custo} da própria vida`);
          escrever(`   🧸 ${novo.nome} foi invocado no lugar de ${morto.nome}! (${novo.hp} de vida)`);
          ev.invocou = { id:novo.id, substituiu:morto.id, custo };
        }
      }
    }
    if(sk.alternaForma){
      unidade.forma = (unidade.forma||0)===1 ? 0 : 1;
      const nomes=unidade.ficha.formaNomes||['',''];
      escrever(`   👹 ${unidade.nome} virou: ${nomes[unidade.forma]}`);
      ev.trocouForma = unidade.forma;
    }
    /* ---- MANO COXINHA ----
       · virarForma: a comida liga um MODO de combate (1 defesa, 2 ataque,
                     3 velocidade). Só pra quem tem `formaStats` na ficha —
                     se o Adulto Feliz roubar a comida, ele só come (cura),
                     não vira o modo de outro personagem. */
    if(sk.virarForma!=null && unidade.ficha.formaStats){
      unidade.forma = sk.virarForma;
      const nomes=unidade.ficha.formaNomes||[];
      escrever(`   ${sk.icone||'🍽'} ${unidade.nome} entrou no modo ${nomes[unidade.forma]||unidade.forma}`);
      ev.trocouForma = unidade.forma;
      recalcularBonus();
    }
    // (o modo furtivo liga DEPOIS do dano deste golpe — ver o fim do usarSkill)
    if(sk.fumaca){
      const f=sk.fumaca;
      fumacas[unidade.time] = { nome:f.nome, icone:f.icone||'🌫', turnos:f.turnos, esquiva:f.esquiva };
      ev.fumacaNova = true;
      escrever(`   ${f.icone||'🌫'} ${f.nome} cobriu o lado ${unidade.time==='aliado'?'do seu time':'do time inimigo'}: `+
               `+${Math.round(f.esquiva*100)}% de esquiva pra todo mundo ali (${f.turnos} rodadas)`);
    }

    /* ---- meditar (Fat Girl): POSTURA que EMPILHA ataque.
       Não trava turno nenhum — ela joga todo turno; meditar é uma das
       coisas que ela pode escolher fazer NO turno dela, e o preço é
       simplesmente não ter batido nesse turno. Cada meditação MULTIPLICA
       o ataque atual (`mult`) até o teto (`teto`), e o ganho entra em
       `atkPerm` (permanente, como uma transformação) em vez de um buff
       com prazo: a postura é o que ela CONSTRUIU, não um efeito que
       expira sozinho enquanto ela ainda está sentada.
       A pose fica travada (ver `emMeditacao` em turnui.js) até ela
       atacar — quem tira ela da meditação é o jogador, atacando. */
    if(sk.meditarStack){
      const cfg = sk.meditarStack;
      const atkAtual = unidade.atk + unidade.atkBonus;
      const teto = cfg.teto || Infinity;
      const ganho = Math.max(0, Math.round(Math.min(teto, atkAtual*(cfg.mult||2)) - atkAtual));
      unidade.emMeditacao = true;
      if(ganho>0){
        unidade.atkPerm = (unidade.atkPerm||0) + ganho;
        recalcularBonus();
        escrever(`   🤍 ${unidade.nome} medita: ataque ${atkAtual} → ${unidade.atk+unidade.atkBonus}`);
      } else {
        // já está no teto: continua meditando (a pose se mantém), mas o
        // turno não rende mais ataque nenhum — avisa, senão o jogador
        // fica gastando turno achando que ainda está subindo.
        escrever(`   🤍 ${unidade.nome} medita, mas o ataque já está no teto (${teto})`);
      }
    }
    // ---- buff (vai para os ALVOS da skill) ----
    else if(sk.buff){
      alvos.forEach(a=>{
        a.buffs.push(Object.assign({acumulado:0}, sk.buff));
        marcaEfeito(a, 'buff_'+sk.buff.tipo);
        escrever(`   ⬆ ${a.nome}: ${sk.buff.tipo}`);
      });
    }
    // ---- buffEu: buff que vai para QUEM USOU, mesmo mirando o inimigo
    //      (o Fat Smerg ergue a guarda no mesmo turno em que provoca) ----
    if(sk.buffEu){
      unidade.buffs.push(Object.assign({acumulado:0}, sk.buffEu));
      if(sk.buffEu.tipo==='blindagem')
        escrever(`   🛡 ${unidade.nome} ergueu a guarda (+${sk.buffEu.valor} de defesa, ${sk.buffEu.turnos} turnos)`);
      else
        escrever(`   ⬆ ${unidade.nome}: ${sk.buffEu.tipo} +${sk.buffEu.valor}${sk.buffEu.porTurno?' por turno':''} (${sk.buffEu.turnos} turnos)`);
    }
    /* (o FURTO DE TEMPO saiu daqui: roda DEPOIS do dano, porque se o alvo
       ESQUIVAR o golpe não rouba tempo nenhum — ver lá embaixo) */

    /* sair da meditação é ATACAR: qualquer golpe que tire vida levanta
       ela da postura. Defender ou usar setup não levanta — ela continua
       sentada, e a pose acompanha (ver `emMeditacao` em turnui.js). */
    if(sk.dano>0) unidade.emMeditacao = false;

    // ---- terreno ----
    if(sk.terreno){
      /* `escalaVelocidade` (Cargas, TEMPESTADE ENCURRALADA): em vez de um
         `dano` fixo na ficha, o terreno herda a VELOCIDADE de quem lançou
         no momento do cast — congelada aí (o resto do terreno já guarda
         só números fixos, sem referência à unidade). Mesma ideia do
         escalaVelocidade/escalaDefesa/escalaVida de calcularDano, só que
         aplicada uma vez na criação do terreno em vez de a cada golpe. */
      const terDano = sk.terreno.dano!=null ? sk.terreno.dano
        : Math.round(velocidadeDe(unidade) * (sk.terreno.escalaVelocidade||1));
      terrenos[timeInimigo] = { nome:sk.terreno.nome, turnos:sk.terreno.turnos,
                                dano:terDano, alvoTime:timeInimigo, dono:unidade.time,
                                fx: sk.terreno.fx||null };   // efeito que fica em cima de quem está no terreno
      ev.terrenoNovo = timeInimigo;   // a UI só mostra o efeito do terreno depois do impacto
      escrever(`   🌋 TERRENO em ${timeInimigo==='aliado'?'você':'inimigos'}: ${sk.terreno.nome} (${sk.terreno.turnos} turnos)`);
    }

    /* ---- estrutura (setup: objeto que protege o time de quem usou) ----
       CLONA O OBJETO INTEIRO (`Object.assign`), não campo a campo: uma
       cópia manual já esqueceu um campo novo antes (o `recarga` do
       Escudo Temporal nasceu sem efeito porque a lista aqui não incluía
       ele — ver o patch 1.21). Só garante os padrões por cima. */
    if(sk.estrutura){
      const es=sk.estrutura;
      estruturas[unidade.time] = Object.assign({}, es, { icone:es.icone||'🧱', dono:unidade.time });
      const partes=[];
      if(es.defesa) partes.push(`+${es.defesa} de defesa`);
      if(es.recarga) partes.push(`recarga do time (menos a ULT) -${es.recarga} turno/rodada`);
      escrever(`   ${es.icone||'🧱'} ${es.nome} na frente ${unidade.time==='aliado'?'do seu time':'do time inimigo'}: `+
               `${partes.join(' e ')} por ${es.turnos} turnos`);
    }

    // ---- ambiente (clima da arena: vale para os DOIS times) ----
    if(sk.ambiente){
      const a=sk.ambiente;
      /* copiar CAMPO A CAMPO aqui já me custou um bug: os campos novos
         do Véu Maldito (dotMult, magiaMult…) ficaram de fora e o
         ambiente não amplificava nada. Agora clona o que veio e só
         garante os padrões. */
      ambiente = Object.assign({}, a, {
        icone: a.icone||'✨', cor: a.cor||'#ff9ecb',
        curaMult: a.curaMult||1, regen: a.regen||0,
        dono: unidade.time });
      escrever(`   ${ambiente.icone} AMBIENTE: ${ambiente.nome} tomou conta da arena (${ambiente.turnos} rodadas)`);
      if(ambiente.curaMult>1) escrever(`   💚 toda cura no campo vale +${Math.round((ambiente.curaMult-1)*100)}%`);
    }

    /* ---- SACRIFÍCIO (Careca, 1.47): o golpe cobra vida de quem usa e cada
       ponto pago vira `danoPorVida` de dano BASE. Ao contrário da Muralha de
       Lasanha, PODE matar quem paga — a vida sai DEPOIS do golpe (ele ainda
       bate com tudo) e aí checarMorte agenda a volta como verme. ---- */
    let pagoSacrificio = 0;
    if(sk.sacrificio && unidade.vivo){
      const sf=sk.sacrificio;
      pagoSacrificio = sf.tudo ? unidade.hp : sf.pct ? Math.max(1, Math.round(unidade.hp*sf.pct)) : Math.min(unidade.hp, sf.valor||0);
    }
    // ---- dano ----
    const desviou = new Set();     // alvos que esquivaram de TODOS os acertos deste golpe
    if(sk.dano>0){
      const vezes = sk.vezes||1;
      /* GOLPE TRAIÇOEIRO (Smergulão): bate mais forte se ele desviou do
         último golpe inimigo que veio nele. */
      let base = sk.dano + Math.round(pagoSacrificio*((sk.sacrificio&&sk.sacrificio.danoPorVida)||0));
      if(sk.bonusEsquiva && unidade.esquivouUltimo){
        base = Math.round(base*sk.bonusEsquiva);
        ev.traicoeiro = true;
        escrever(`   🗡 ${unidade.nome} aproveitou a esquiva: golpe TRAIÇOEIRO (×${sk.bonusEsquiva})`);
      }
      alvos.forEach(alvo=>{
        let total=0, acertos=0, esquivas=0, vulto=false;
        /* FINTA (Prodocimo): quem está CONFUSO cai fácil na finta */
        let baseA = base;
        if(sk.bonusConfuso && alvo.confuso>0 && alvo.time!==unidade.time){
          baseA = Math.round(base*sk.bonusConfuso);
          escrever(`   🃏 ${alvo.nome} está confuso e caiu na finta (×${sk.bonusConfuso})`);
        }
        for(let v=0; v<vezes; v++){
          if(!alvo.vivo) break;
          // bateu num VULTO (Sumiço): o resto da sequência também vai no nada
          if(vulto){ esquivas++; continue; }
          const d = calcularDano(unidade, alvo, baseA, sk.tipo, {escalaVelocidade:sk.escalaVelocidade, escalaDefesa:sk.escalaDefesa, escalaVida:sk.escalaVida});
          _esquivou=false; _vulto=false;
          total += aplicarDano(unidade, alvo, d, sk.tipo);
          if(_esquivou) esquivas++; else acertos++;
          if(_vulto) vulto=true;
        }
        /* ESQUIVOU DE TUDO (nenhum dos golpes pegou) → escapa também dos
           EFEITOS do golpe (veneno, lentidão, atordoar, provocar, selo,
           furto de tempo…). Golpe de vários acertos: basta UM pegar pro
           efeito entrar. Ver o bloco de status logo abaixo. */
        if(esquivas>0 && acertos===0) desviou.add(alvo);
        const rr=reg(alvo.id);
        if(rr){ rr.dano=total; rr.esquivou=(esquivas>0 && total===0); if(vulto) rr.vulto=true; }
        if(total>0){
          const t=TurnData.tipo(sk.tipo);
          escrever(`   ${t.icone} ${alvo.nome} levou ${total}`);
          // drenar vida
          if(sk.drena){ const cura=curar(unidade, Math.round(total*sk.drena), null);
            escrever(`   🩸 ${unidade.nome} drenou ${cura}`); }
          /* passivas de "QUALQUER golpe que acerte tem chance de
             atordoar" — Fúria de Nunchaco (Fat Girl) e Condutor
             (Cargas). Hook GENÉRICO aqui, e não um campo `atordoar`
             repetido em cada skill do kit (o que exigiria lembrar de
             adicionar de novo toda vez que o kit mudasse). */
          /* DESINTEGRAÇÃO (Dmaterelizador): cada golpe que pega desmancha 1
             de DEFESA do alvo pra sempre — até 6 por alvo. */
          if(unidade.ficha.passiva==='desintegracao' && alvo.vivo && alvo.time!==unidade.time &&
             (alvo.desintegrado||0) < DESINTEGRA_MAX){
            alvo.desintegrado = (alvo.desintegrado||0) + 1;
            alvo.defPerm = (alvo.defPerm||0) - 1;
            marcaEfeito(alvo, 'desintegrado');
            escrever(`   🌀 ${alvo.nome} perdeu 1 de defesa pra sempre (−${alvo.desintegrado})`);
          }
          const CHANCE_ATORDOAR_PASSIVA = { furia_nunchaco:0.18, condutor:0.08 };
          const chanceP = CHANCE_ATORDOAR_PASSIVA[unidade.ficha.passiva];
          if(chanceP && alvo.vivo && Math.random()<chanceP){
            alvo.atordoado = 1;
            marcaEfeito(alvo, 'atordoado');
            escrever(`   ⚡ ${alvo.nome} foi ATORDOADO pelo golpe de ${unidade.nome}!`);
          }
        }
      });
    }

    /* ---- curaAliado (Criança Rosa, modo criança): o golpe básico bate E
       cura o aliado MAIS FERIDO (pode ser ela mesma). ---- */
    if(sk.curaAliado){
      const ferido = vivosDo(unidade.time).slice().sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0];
      const feito = ferido ? curar(ferido, sk.curaAliado, unidade) : 0;
      if(feito>0){
        escrever(`   💗 ${ferido.nome} +${feito} (o ursinho cuidou)`);
        ev.curaExtra = { id:ferido.id, cura:feito };
      }
    }

    /* ---- status por turno ----
       FORA do bloco de dano: golpes de SETUP (smergulite, por exemplo)
       não tiram vida nenhuma e mesmo assim precisam aplicar o efeito. */
    const temEfeitoNoAlvo = !!(sk.dot || sk.lentidao || sk.confusao || sk.atordoar || sk.provoca ||
                               sk.desabilitar || sk.removerAtaque || sk.roubarTempo || sk.roubarBuffs || sk.roubarStats || sk.desfazer);
    let roubouTempo=false;         // o Furto de Tempo encostou em alguém? (aí ele adianta as dele)
    alvos.forEach(alvo=>{
      if(!alvo.vivo) return;
      /* ESQUIVOU → o golpe não encostou, então nada do que vinha junto
         com ele pega (pedido do dono do jogo: "se esquiva do ataque, erra
         o efeito também"). Golpe que NÃO rola esquiva (setup sem dano,
         tipo a Smergulite) continua pegando normal. */
      if(desviou.has(alvo)){
        if(temEfeitoNoAlvo){
          const r=reg(alvo.id); if(r) r.evitou=true;
          escrever(`   💨 ${alvo.nome} esquivou — e escapou do efeito também`);
        }
        return;
      }
      if(sk.dot){
        // o AMBIENTE maléfico engrossa e estica os efeitos por turno
        let dd=sk.dot.dano, dt=sk.dot.turnos;
        if(ambiente){
          if(ambiente.dotMult)        dd = Math.round(dd*ambiente.dotMult);
          if(ambiente.dotTurnosExtra) dt = dt + ambiente.dotTurnosExtra;
        }
        /* 1.47: o MESMO efeito do MESMO atacante RENOVA em vez de empilhar.
           Antes cada Mordida/Praga somava mais um sangramento/veneno no alvo
           — a simulação com estratégias achou que só repetir a Mordida no
           mesmo alvo levava a Serrinha a ~67% de vitória. Atacantes
           diferentes continuam somando (dois venenos de dois inimigos). */
        const igual = alvo.dots.find(x=>x.tipo===sk.dot.tipo && x.origem===unidade.id);
        if(igual){ igual.dano=Math.max(igual.dano, dd); igual.turnos=Math.max(igual.turnos, dt); }
        else alvo.dots.push({ tipo:sk.dot.tipo, dano:dd, turnos:dt, origem:unidade.id });
        marcaEfeito(alvo, sk.dot.tipo);
        escrever(`   ⏳ ${alvo.nome}: ${sk.dot.tipo} ${dd}/turno (${dt} turnos)`);
      }
      if(sk.lentidao){
        if(alvo.ficha.passiva==='fortaleza'){ marcaEfeito(alvo, 'imune'); escrever(`   ❄ ${alvo.nome} é imune a lentidão`); }
        else {
          /* pct = porcentagem da velocidade base do alvo (arredonda para
             baixo de 1, senão o rápido perderia menos que o lento). */
          const perda = sk.lentidao.pct
            ? Math.max(1, Math.round((alvo.spd + (alvo.spdPerm||0)) * sk.lentidao.pct))
            : sk.lentidao.valor;
          alvo.buffs.push({tipo:'lentidao', valor:-perda, turnos:sk.lentidao.turnos, acumulado:0});
          marcaEfeito(alvo, 'lento');
          escrever(`   ❄ ${alvo.nome} ficou lento (-${perda} de velocidade, ${sk.lentidao.turnos} turnos)`);
        }
      }
      if(sk.confusao){
        if(alvo.ficha.passiva==='fervor'){ marcaEfeito(alvo, 'imune'); escrever(`   ✝ ${alvo.nome} é imune a confusão`); }
        else {
          let tc = sk.confusao.turnos + ((ambiente&&ambiente.confusaoExtra)||0);
          alvo.confuso = Math.max(alvo.confuso||0, tc);
          marcaEfeito(alvo, 'confuso');
          escrever(`   😵 ${alvo.nome} ficou CONFUSO (${tc} turnos)`);
        }
      }
      if(sk.atordoar && Math.random()<sk.atordoar){
        alvo.atordoado = 1;
        marcaEfeito(alvo, 'atordoado');
        escrever(`   ⚡ ${alvo.nome} foi ATORDOADO!`);
      }
      if(sk.provoca){
        alvo.provocado = { turnos:sk.provoca.turnos, por:unidade.id };
        marcaEfeito(alvo, 'provocado');
        escrever(`   😤 ${alvo.nome} está PROVOCADO: só ataca ${unidade.nome} por ${sk.provoca.turnos} turnos`);
      }
      /* MÃO LEVE (Prodocimo): os buffs BONS do alvo (ataque, defesa,
         velocidade, regeneração — inclusive a guarda do Defender) mudam de
         dono, com o tempo que ainda tinham. Lentidão não é buff: fica.
         +1 turno no que ela pega: o fim DESTE turno (o dela) já desconta um —
         sem isso a guarda do Defender (que chega com 1 turno sobrando)
         nascia e morria na mão dela no mesmo instante (bug da 1.42). */
      if(sk.roubarBuffs && alvo!==unidade){
        const bons = alvo.buffs.filter(b=>b.valor>0 && b.tipo!=='lentidao');
        if(bons.length){
          alvo.buffs = alvo.buffs.filter(b=>bons.indexOf(b)<0);
          bons.forEach(b=>unidade.buffs.push(Object.assign({}, b, { turnos:b.turnos+1 })));
          marcaEfeito(alvo, 'furtado');
          escrever(`   🫳 ${unidade.nome} passou a mão em ${bons.length} buff(s) de ${alvo.nome}: ${bons.map(b=>b.tipo).join(', ')}`);
        }
      }
      /* ...e SEMPRE rouba um pedaço dos STATS (`roubarStats`): o alvo perde
         ataque/defesa e ela ganha o mesmo, por N turnos. Antes ela só pegava
         buff — contra quem não tinha nenhum o golpe não roubava nada.
         Do lado dela +1 turno pelo mesmo motivo de cima; do lado do alvo
         não, porque o turno dele ainda vai chegar. */
      if(sk.roubarStats && alvo!==unidade){
        const rs=sk.roubarStats, partes=[];
        if(rs.atk){ alvo.buffs.push({tipo:'forca', valor:-rs.atk, turnos:rs.turnos, acumulado:0});
                    unidade.buffs.push({tipo:'forca', valor:rs.atk, turnos:rs.turnos+1, acumulado:0}); partes.push(`${rs.atk} de ataque`); }
        if(rs.def){ alvo.buffs.push({tipo:'blindagem', valor:-rs.def, turnos:rs.turnos, acumulado:0});
                    unidade.buffs.push({tipo:'blindagem', valor:rs.def, turnos:rs.turnos+1, acumulado:0}); partes.push(`${rs.def} de defesa`); }
        marcaEfeito(alvo, 'furtado');
        escrever(`   🫳 ${unidade.nome} roubou ${partes.join(' e ')} de ${alvo.nome} (${rs.turnos} turnos)`);
      }
      // DESMATERIALIZAR: os buffs bons do alvo somem (não vão pra ninguém)
      if(sk.desfazer && alvo.time!==unidade.time){
        const antes = alvo.buffs.length;
        alvo.buffs = alvo.buffs.filter(b=>!(b.valor>0 && b.tipo!=='lentidao'));
        if(alvo.buffs.length < antes){ marcaEfeito(alvo, 'desfeito'); escrever(`   🌀 os buffs de ${alvo.nome} foram desmaterializados`); }
      }
      /* Lambança: limpa sangramento/veneno de um aliado (não cura vida,
         só encerra os DOTs listados — mantém "suporte sem cura"). */
      if(sk.limparDots){
        const antes = alvo.dots.length;
        alvo.dots = alvo.dots.filter(d => sk.limparDots.indexOf(d.tipo) < 0);
        if(alvo.dots.length < antes){ marcaEfeito(alvo, 'purificado'); escrever(`   ✨ ${alvo.nome} foi purificado: sangramento/veneno removidos`); }
      }
      /* FURTO DE TEMPO (Marcelão Black JW): atrasa a recarga de quem já
         está recarregando no ALVO — o tempo que sai dele vai pro Marcelão
         (ver logo depois deste laço). Só mexe em skill que JÁ está em cd
         (>0): uma skill livre não tem "recarga" pra atrasar. */
      if(sk.roubarTempo){
        const valor = sk.roubarTempo.valor||1;
        let mexeu=false;
        alvo.cds.forEach((v,i)=>{ if(v>0){ alvo.cds[i]=v+valor; mexeu=true; } });
        roubouTempo=true;
        if(mexeu){ marcaEfeito(alvo, 'tempo'); escrever(`   ⏱ ${alvo.nome} teve as recargas atrasadas em ${valor} turno(s)`); }
      }
      /* Lambança: ULTIMATE — sela por um tempo o último golpe que o ALVO
         usou. Era "pelo resto da partida" antes, mas isso não tinha
         contraparte nenhuma: um golpe-chave (cura, taunt, ult de outro
         personagem) saía do jogo pro resto da luta com um único acerto,
         sem o adversário poder reagir. Virou uma sela de 3 turnos — ainda
         pesado (pode cortar uma cura bem na hora), mas dá pra a vítima
         se recuperar se sobreviver o suficiente. Sem golpe anterior
         (ainda não agiu), não tem o que desligar. Reaplicar no mesmo
         índice só renova a duração, não empilha. */
      if(sk.desabilitar){
        if(alvo.ultimaSkill){
          const i = alvo.ultimaSkill.i;
          const jaSelado = alvo.desabilitadas.find(d=>d.i===i);
          if(jaSelado) jaSelado.turnos = 3;
          else alvo.desabilitadas.push({ i, turnos:3 });
          marcaEfeito(alvo, 'selado');
          escrever(`   🔇 ${alvo.nome} teve "${alvo.ultimaSkill.nome}" SELADO por 3 turnos`);
        } else {
          escrever(`   🔇 ${alvo.nome} ainda não usou nenhum golpe — nada para desabilitar`);
        }
      }
      /* Lambança: ULTIMATE, segunda punição — remove o ATAQUE do alvo
         PRA SEMPRE (pedido do dono do jogo, buff da ultimate). Zera o
         `atk+atkBonus` ATUAL dele (base + qualquer buff temporário que
         já estivesse ativo) via `atkPerm` NEGATIVO — o mesmo campo que a
         transformação usa pra crescer, só que subtraindo. É permanente:
         não expira com `turnos` como os buffs normais. Buffs de força
         que o alvo receber DEPOIS disso ainda valem normal (somam em
         cima do novo piso zerado) — não é um travamento eterno em 0, é
         zerar o que ele tinha construído até aqui. */
      if(sk.removerAtaque){
        const atkAtual = alvo.atk + (alvo.atkBonus||0);
        /* CHEFE do Modo História (`ajustes.chefe`) resiste: perde só 25%.
           Sem isso um chefe solo vira saco de pancada assim que o Lambança
           acerta o selo — medido no simulador, a luta do Marcelão (fase 19)
           ia de difícil para 99% de vitória só por causa disso. */
        if(atkAtual>0 && alvo.chefe){
          const perda = Math.round(atkAtual*0.25);
          alvo.atkPerm = (alvo.atkPerm||0) - perda;
          marcaEfeito(alvo, 'resistiu');
          escrever(`   🛡 ${alvo.nome} RESISTIU ao selo — perdeu só ${perda} de ataque`);
        } else if(atkAtual>0){
          alvo.atkPerm = (alvo.atkPerm||0) - atkAtual;
          marcaEfeito(alvo, 'semAtaque');
          escrever(`   ☠ ${alvo.nome} teve o ATAQUE apagado PRA SEMPRE (${atkAtual} → 0)`);
        }
      }
      /* BIZARRICE (Adulto Feliz): acha a ultimate do ALVO (a skill dele
         marcada `super`, já na forma atual dele) e guarda uma CÓPIA para
         a unidade que roubou usar depois — nunca mexe na ficha original
         (ela é um objeto COMPARTILHADO entre todo mundo do mesmo
         personagem). A vítima perde o acesso: a própria ultimate entra
         em recarga total, como se ela mesma tivesse acabado de usá-la. */
      if(sk.roubar){
        const iSuper = alvo.ficha.skills.findIndex(s=>TurnData.skillNaForma(s, alvo.forma).super);
        if(iSuper<0){
          escrever(`   🎭 ${alvo.nome} não tem nenhuma ultimate para roubar`);
        } else {
          const skRoubada = TurnData.skillNaForma(alvo.ficha.skills[iSuper], alvo.forma);
          unidade.roubado = { skill: Object.assign({}, skRoubada) };
          alvo.cds[iSuper] = Math.max(alvo.cds[iSuper], skRoubada.cd||4);
          marcaEfeito(alvo, 'roubado');
          escrever(`   🎭 ${unidade.nome} ROUBOU "${skRoubada.nome}" de ${alvo.nome} — ela ficou travada pra ele!`);
        }
      }
    });
    /* FURTO DE TEMPO, segunda metade: o tempo que saiu do alvo vem pra
       ele — adianta as recargas DELE, menos o slot que acabou de usar (o
       cd dele foi fixado lá em cima; adiantar agora desfaria o preço do
       golpe). Se o alvo ESQUIVOU, não roubou nada e não ganha nada. */
    if(sk.roubarTempo && roubouTempo){
      const valor = sk.roubarTempo.valor||1;
      let acelerou=false;
      unidade.cds.forEach((v,i)=>{
        if(i!==iSkill && v>0){ unidade.cds[i]=Math.max(0, v-valor); acelerou=true; }
      });
      if(acelerou) escrever(`   ⏱ ${unidade.nome} adiantou as próprias recargas em ${valor} turno(s)`);
    }
    /* fecha o cd pendente da própria Bizarrice (ver comentário lá em
       cima): deu certo -> fica livre JÁ pra usar o que roubou; não achou
       alvo válido ou o alvo não tinha ultimate -> volta a travar normal,
       senão seria uma recarga de graça a cada vez que whiffasse. */
    if(lancandoBizarrice) unidade.cds[iSkill] = unidade.roubado ? 0 : (sk.cd||0);

    /* ---- RESERVATÓRIO (Tupas): o golpe gasta água DEPOIS de bater (o
       dano já saiu com o tanque de antes) e o de recuperar enche. ---- */
    if(unidade.agua!=null){
      const max=unidade.ficha.agua.max, antes=unidade.agua;
      if(sk.custoAgua) unidade.agua=Math.max(0, unidade.agua-sk.custoAgua);
      if(sk.recuperaAgua) unidade.agua=Math.min(max, unidade.agua+sk.recuperaAgua.valor);
      if(unidade.agua!==antes)
        escrever(`   💧 água de ${unidade.nome}: ${antes} → ${unidade.agua}`);
    }
    /* ---- REDEMOINHO (ultimate do Tupas): o golpe do cast já acertou o
       alvo escolhido; daqui pra frente ele fica ATIVO e, no fim de cada
       turno do Tupas, pula pro PRÓXIMO inimigo (ver tickRedemoinho). ---- */
    if(sk.redemoinho && unidade.vivo){
      const primeiro = alvos[0] || null;
      unidade.redemoinho = { ultimo: primeiro? primeiro.id : null, proximo:null, recem:true,
                             dano:sk.redemoinho.dano, custo:sk.redemoinho.custo, iUlt:iSkill, cd:sk.cd||0 };
      unidade.redemoinho.proximo = proximoDoRedemoinho(unidade);
      escrever(`   🌀 o REDEMOINHO de ${unidade.nome} está ATIVO — pula de inimigo em inimigo enquanto houver água`);
    }

    /* DESMATERIALIZAÇÃO TOTAL (`esgota`): o poder inteiro sai de uma vez e o
       próximo turno dele é SEM PODER nenhum (condicaoSkill trava tudo, só
       dá pra defender). +1: o fim deste turno já desconta um. */
    if(sk.esgota && unidade.vivo){
      unidade.esgotado = sk.esgota + 1;
      escrever(`   🌀 ${unidade.nome} gastou tudo: fica ${sk.esgota} turno sem poder`);
    }

    /* MODO FURTIVO liga só agora: o golpe que ativa ainda sai com o dano
       inteiro, os PRÓXIMOS é que saem pela metade. */
    if(sk.modoFurtivo && unidade.vivo){
      unidade.modoFurtivo = sk.modoFurtivo + 1;   // +1: o fim DESTE turno já desconta um
      unidade.forma = 1;
      escrever(`   👤 ${unidade.nome} entrou no MODO FURTIVO (${sk.modoFurtivo} turnos: metade do dano, +15% de esquiva)`);
    }

    // a conta do SACRIFÍCIO chega agora (depois do golpe) — e pode derrubar ele
    if(pagoSacrificio>0 && unidade.vivo){
      unidade.hp = Math.max(0, unidade.hp - pagoSacrificio);
      escrever(`   💀 ${unidade.nome} pagou ${pagoSacrificio} da própria vida`);
      ev.sacrificio = { pago:pagoSacrificio };
      checarMorte(unidade);
      if(!unidade.vivo) ev.sacrificio.morreu = true;
    }

    ev.alvos.forEach(r=>{ const u=todos().find(x=>x.id===r.id); if(u) r.morreu=!u.vivo; });
    evento = ev;

    recalcularBonus();
    proximoTurno();
    return true;
  }

  function defender(unidade){
    if(acabou || !daLuta(unidade)) return;
    contarTurno(unidade);
    /* turnos:2, não 1: o fim DESTE turno já desconta um (tickFimDeTurno
       roda logo abaixo, no proximoTurno). Com 1 a guarda nascia e morria
       no mesmo instante — DEFENDER não protegia de golpe nenhum. Com 2 ela
       segura todos os golpes até o próximo turno de quem defendeu. */
    unidade.buffs.push({tipo:'blindagem', valor:8, turnos:2, acumulado:0});
    escrever(`🛡 ${unidade.nome} se defendeu`);
    evento = { seq:++seqEvento, acao:'defender', origem:unidade.id, time:unidade.time,
               estilo:'foco', skill:{ nome:'Defender', icone:'🛡', tipo:'fisico', alvo:'eu', pose:'block',
               vezes:1, super:false, dano:0 }, alvos:[] };
    recalcularBonus();
    proximoTurno();
  }

  /* ================= REDEMOINHO (ultimate ATIVA do Tupas) =================
     Fica em campo enquanto: o Tupas estiver vivo, houver água pra pagar o
     turno, e ninguém desativar. A cada fim de turno DELE acerta um inimigo
     e passa pro próximo na ordem do time (um, outro, outro, volta...). */
  function proximoDoRedemoinho(u){
    if(!u.redemoinho) return null;
    const lista = alvejaveis(u.time==='aliado'? 'inimigo' : 'aliado');
    if(!lista.length) return null;
    const todosDoLado = times[u.time==='aliado'? 'inimigo' : 'aliado'];
    const iUlt = todosDoLado.findIndex(x=>x.id===u.redemoinho.ultimo);
    for(let k=1;k<=todosDoLado.length;k++){
      const c = todosDoLado[(Math.max(iUlt,0)+k) % todosDoLado.length];
      if(lista.indexOf(c)>=0) return c.id;
    }
    return lista[0].id;
  }
  function fimRedemoinho(u, motivo){
    const r=u.redemoinho; if(!r) return;
    u.redemoinho=null;
    u.cds[r.iUlt] = r.cd;                 // a recarga da ult começa a contar daqui
    escrever(`🌀 o redemoinho de ${u.nome} se desfez (${motivo})`);
  }
  function tickRedemoinho(u){
    const r=u.redemoinho;
    if(!r || !u.vivo || acabou) return;
    if(r.recem){ r.recem=false; return; }   // o turno do cast já acertou alguém
    if(u.agua < r.custo){ fimRedemoinho(u, 'acabou a água'); return; }
    let alvo = todos().find(x=>x.id===r.proximo);
    if(!alvo || !alvo.vivo || intocavel(alvo)){ r.proximo=proximoDoRedemoinho(u); alvo=todos().find(x=>x.id===r.proximo); }
    if(!alvo) return;
    _esquivou=false;
    const d = calcularDano(u, alvo, r.dano, 'agua');
    const feito = aplicarDano(u, alvo, d, 'agua');
    u.agua = Math.max(0, u.agua - r.custo);
    escrever(`🌀 o redemoinho acertou ${alvo.nome}: ${feito} (água ${u.agua})`);
    checarMorte(alvo);
    evento = { seq:++seqEvento, acao:'redemoinho', origem:u.id, time:u.time, estilo:'tiro',
               skill:{ nome:'Redemoinho', icone:'🌀', tipo:'agua', alvo:'inimigo', pose:'controla',
                       fx:(u.ficha.fxRedemoinho||null), vezes:1, super:false, dano:r.dano },
               alvos:[{ id:alvo.id, dano:feito, cura:0, esquivou:(_esquivou && feito===0), morreu:!alvo.vivo }] };
    /* o golpe pode ter acabado com o próprio redemoinho: a esquiva da
       Serrinha devolve contra-ataque e, se ele derrubar o Tupas, o
       checarMorte já desfez o redemoinho (achado na simulação). */
    if(!u.redemoinho) return;
    r.ultimo = alvo.id;
    r.proximo = proximoDoRedemoinho(u);
    if(u.agua < r.custo) fimRedemoinho(u, 'acabou a água');
  }
  /* DESATIVAR: ação LIVRE — não gasta o turno (não chama proximoTurno).
     Gera um evento só pra tela encenar e pro online confirmar a jogada. */
  function desativarRedemoinho(u){
    if(acabou || !u || !u.vivo || !u.redemoinho || !daLuta(u)) return false;
    fimRedemoinho(u, 'desativado — para de gastar água');
    evento = { seq:++seqEvento, acao:'desativar', origem:u.id, time:u.time, estilo:'foco',
               skill:{ nome:'Recolher Redemoinho', icone:'🌀', tipo:'agua', alvo:'eu', pose:'idle',
                       vezes:1, super:false, dano:0 }, alvos:[] };
    if(onUpdate) onUpdate(estado());
    return true;
  }

  /* ---------------- fim de turno ---------------- */
  function tickFimDeTurno(u){
    tickRedemoinho(u);
    // dano por turno
    for(let i=u.dots.length-1;i>=0;i--){
      const d=u.dots[i];
      let dano=d.dano;
      // sangramento cresce conforme o alvo perde vida
      if(d.tipo==='sangramento') dano = Math.round(dano*(1 + (1-u.hp/u.hpMax)));
      u.hp=Math.max(0,u.hp-dano);
      // atribui o dano ao time de quem aplicou o efeito
      const dono = todos().find(x=>x.id===d.origem);
      if(dono) contarDano(dono, dano);
      const ic = d.tipo==='veneno'?'☠' : d.tipo==='queimadura'?'🔥':'🩸';
      escrever(`   ${ic} ${u.nome} sofreu ${dano} de ${d.tipo}`);
      d.turnos--;
      if(d.turnos<=0) u.dots.splice(i,1);
    }
    checarForma(u); checarMorte(u);

    // passiva padaria: cura o time no fim do turno
    if(u.ficha.passiva==='padaria' && u.vivo){
      curar(u, 3, null);
      vivosDo(u.time).forEach(a=>{ if(a!==u) curar(a, 1, u); });
      escrever(`   🥖 ${u.nome} distribuiu pão (+3 nele, +1 nos aliados)`);
    }
    // passiva Sobras de Lasanha (Cabelin): o aliado mais ferido come um pedaço
    if(u.ficha.passiva==='sobras_lasanha' && u.vivo){
      const alvo = vivosDo(u.time).slice().sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0];
      const feito = alvo ? curar(alvo, u.ficha.sobras||5, u) : 0;
      if(feito>0) escrever(`   🍝 ${alvo.nome} comeu as sobras da lasanha (+${feito})`);
    }
    // regeneração
    u.buffs.filter(b=>b.tipo==='regeneracao').forEach(b=>{
      const feito=curar(u, b.valor, null);
      escrever(`   💚 ${u.nome} regenerou ${feito}`);
    });

    // passivas que crescem por turno
    if(u.ficha.passiva==='agilidade_crescente' && u.vivo){
      /* O motor dá TURNO EXTRA (age 2x na rodada) pra quem passa de 1.35x
         a velocidade média do campo (ver iniciarRodada). Um teto de +6
         ainda deixava o Strong Smerg cruzar essa linha sozinho, com a
         passiva pura, por volta da rodada 6 — e depois disso ele ficava
         dobrando de ação PRA SEMPRE, de graça, sem gastar carta nenhuma.
         Foi isso que segurava a taxa de vitória dele em 60-70%+ mesmo
         depois de cortar dano/atordoamento várias vezes. Teto de +3
         mantém ele rápido sem sozinho garantir turno extra permanente —
         quem quiser o turno extra tem que gastar o Foco Veloz pra isso,
         e só por uma janela curta. */
      u.spdPerm = Math.min(3, (u.spdPerm||0) + Math.max(1, Math.round(u.spd*0.12)));
      escrever(`   💨 ${u.nome} está mais rápido (+${u.spdPerm} total)`);
    }
    if(u.ficha.passiva==='instinto' && u.vivo){
      u.esquiva = Math.min(0.30, u.esquiva + 0.06);
    }
    /* FURTIVIDADE (Smergulão): +1 nível por turno dele (até 5 = +30% de
       esquiva; 4+ = contra-ataca igual o Serrinha). Tomar golpe tira um
       nível (ver aplicarDano). Moita e modo furtivo contam turnos DELE. */
    if(u.ficha.passiva==='furtividade' && u.vivo){
      const antes=u.furtivo||0;
      u.furtivo = Math.min(FURTIVO_MAX, antes+1);
      if(u.furtivo>antes) escrever(`   👤 ${u.nome} sumiu mais um pouco (furtividade ${u.furtivo}/${FURTIVO_MAX})`);
      if(u.naMoita>0){ u.naMoita--; if(u.naMoita===0) escrever(`   🌿 ${u.nome} saiu da moita`); }
      if(u.modoFurtivo>0){
        u.modoFurtivo--;
        if(u.modoFurtivo===0){ u.forma=0; escrever(`   👤 ${u.nome} saiu do modo furtivo`); }
      }
    }
    if(u.ficha.passiva==='estofado' && u.vivo){
      const antes=u.defPerm||0;
      u.defPerm = Math.min(18, antes + 3);
      if(u.defPerm>antes) escrever(`   🛋 ${u.nome} ficou mais resistente (+${u.defPerm} de defesa total)`);
    }
    /* Ladrão de Tempo (Marcelão Black JW): fora do golpe dedicado
       (`roubarTempo`), ele também rouba um pouquinho de tempo SOZINHO,
       de graça, no fim de cada turno dele — reforça a identidade sem
       depender só de uma skill. Sorteia entre as skills que JÁ estão
       recarregando (uma sem cd nenhum não tem o que adiantar). */
    if(u.ficha.passiva==='ladrao_de_tempo' && u.vivo){
      const emCd = u.cds.map((v,i)=>({i,v})).filter(x=>x.v>0);
      if(emCd.length && Math.random()<0.35){
        const pick = emCd[(Math.random()*emCd.length)|0];
        u.cds[pick.i] = Math.max(0, pick.v-1);
        escrever(`   ⏱ ${u.nome} adiantou o relógio: "${u.ficha.skills[pick.i].nome}" -1 turno de recarga`);
      }
    }

    if(u.confuso>0) u.confuso--;      // a confusão passa com o turno dele
    // Sumiço (Prodocimo): o vulto dura até o próximo turno dela
    if(u.sumida>0){ u.sumida--; if(u.sumida===0) escrever(`   👻 ${u.nome} reapareceu`); }
    // Dmaterelizador: volta a ter corpo / recupera o poder com o turno dele
    if(u.fase>0){ u.fase--; if(u.fase===0) escrever(`   🌀 ${u.nome} se materializou de novo`); }
    if(u.esgotado>0){ u.esgotado--; if(u.esgotado===0 && u.vivo) escrever(`   🌀 ${u.nome} recuperou o poder`); }
    // a raiva (taunt) também conta um turno DELE e se dissipa
    if(u.provocado){ u.provocado.turnos--; if(u.provocado.turnos<=0) u.provocado=null; }
    // golpes selados pelo Lambança (agora por tempo, não pra sempre — ver usarSkill)
    for(let i=u.desabilitadas.length-1;i>=0;i--){
      const d=u.desabilitadas[i];
      d.turnos--;
      if(d.turnos<=0){
        escrever(`   🔊 ${u.nome} recuperou um golpe que estava selado`);
        u.desabilitadas.splice(i,1);
      }
    }
    // buffs que crescem por turno
    for(let i=u.buffs.length-1;i>=0;i--){
      const b=u.buffs[i];
      if(b.porTurno) b.acumulado = (b.acumulado||0) + b.valor;
      b.turnos--;
      if(b.turnos<=0) u.buffs.splice(i,1);
    }
    recalcularBonus();
  }

  /* Recalcula os bônus somando: buffs temporários + ganhos PERMANENTES
     (spdPerm/defPerm), que vêm de passivas e da forma do Mecas.
     Separar os dois evita o bônus permanente ser apagado quando um
     buff temporário expira.                                          */
  function recalcularBonus(){
    todos().forEach(u=>{
      let atk=0, def=0, spd=0;
      u.buffs.forEach(b=>{
        const v = b.porTurno? (b.acumulado||0)+b.valor : b.valor;
        if(b.tipo==='forca') atk+=v;
        else if(b.tipo==='blindagem') def+=v;
        else if(b.tipo==='agilidade' || b.tipo==='lentidao') spd+=v;
      });
      // estrutura no campo protege o time inteiro enquanto durar
      const es = estruturas[u.time];
      if(es && es.defesa) def += es.defesa;
      // modo de combate do Mano Coxinha (defesa na coxinha, velocidade na pizza)
      const fs = statsDaForma(u);
      if(fs){ def += fs.def||0; spd += fs.spd||0; }
      u.atkBonus = atk + (u.atkPerm||0);
      u.defBonus = def + (u.defPerm||0);
      /* AMBIENTE com `velocidadeFixa` (TEMPESTADE DE GELO, Marcelão
         Black JW): não é uma REDUÇÃO como lentidão normal — TRAVA a
         velocidade de TODO MUNDO em campo no mesmo número, por cima de
         qualquer buff/penalidade/passiva que já estivesse rolando. */
      if(ambiente && ambiente.velocidadeFixa!=null) u.spdBonus = ambiente.velocidadeFixa - u.spd;
      else u.spdBonus = spd + (u.spdPerm||0);
    });
  }

  /* ---------------- avançar turno ---------------- */
  function proximoTurno(){
    const u=atual();
    if(u) tickFimDeTurno(u);
    if(checarFim()) return;

    idxTurno++;
    // pula mortos
    while(idxTurno<ordem.length && !ordem[idxTurno].vivo) idxTurno++;

    if(idxTurno>=ordem.length){
      // fim da rodada: terreno age
      ['aliado','inimigo'].forEach(time=>{
        const ter=terrenos[time];
        if(!ter) return;
        vivosDo(time).forEach(a=>{
          a.hp=Math.max(0,a.hp-ter.dano);
          danoPorTime[ter.dono] += ter.dano;
          escrever(`🌋 ${ter.nome} feriu ${a.nome} em ${ter.dano}`);
          checarForma(a); checarMorte(a);
        });
        ter.turnos--;
        if(ter.turnos<=0){ escrever(`🌋 ${ter.nome} se dissipou`); terrenos[time]=null; }
      });
      /* AMBIENTE age no fim da rodada, nos DOIS times. A regeneração
         dele é aplicada crua (sem passar por curar()), senão o próprio
         multiplicador do ambiente se aplicaria à cura do ambiente. */
      if(ambiente){
        if(ambiente.regen>0){
          const curados=[];
          todos().filter(x=>x.vivo).forEach(x=>{
            const antes=x.hp; x.hp=Math.min(x.hpMax, x.hp+ambiente.regen);
            if(x.hp>antes) curados.push(x.nome);
          });
          if(curados.length) escrever(`${ambiente.icone} ${ambiente.nome} curou ${ambiente.regen} em todo mundo`);
        }
        ambiente.turnos--;
        if(ambiente.turnos<=0){ escrever(`${ambiente.icone} ${ambiente.nome} se dissipou`); ambiente=null; }
      }
      // estruturas se desgastam junto com a rodada
      ['aliado','inimigo'].forEach(time=>{
        const es=estruturas[time];
        if(!es) return;
        /* ESCUDO TEMPORAL (Marcelão Black JW): `es.recarga` adianta a
           recarga do TIME dono da estrutura, todo fim de rodada — menos
           a ULTIMATE de cada um (`super:true`), pra não virar "super de
           graça todo round". Lê a skill base (`ficha.skills[i]`): o
           formaOverride não muda se um golpe É ou não a ultimate. */
        if(es.recarga){
          let adiantou=false;
          vivosDo(time).forEach(u=>{
            u.cds.forEach((v,i)=>{
              const skBase=(u.ficha.skills||[])[i];
              if(v>0 && !(skBase && skBase.super)){ u.cds[i]=Math.max(0, v-es.recarga); adiantou=true; }
            });
          });
          if(adiantou) escrever(`${es.icone} ${es.nome} adiantou a recarga do time (${es.recarga} turno)`);
        }
        es.turnos--;
        if(es.turnos<=0){ escrever(`${es.icone} ${es.nome} não aguentou mais e saiu de campo`); estruturas[time]=null; }
      });
      // a Fumaça Colorida vai se espalhando e some com as rodadas
      ['aliado','inimigo'].forEach(time=>{
        const fu=fumacas[time]; if(!fu) return;
        fu.turnos--;
        if(fu.turnos<=0){ escrever(`${fu.icone} a ${fu.nome} se dissipou`); fumacas[time]=null; }
      });
      recalcularBonus();
      if(checarFim()) return;
      rodada++;
      escrever(`— RODADA ${rodada} —`);
      // recarga das skills
      todos().forEach(x=>{ x.cds=x.cds.map(c=>Math.max(0,c-1)); });
      renascerVermes();
      novaRodada();
    }

    iniciarTurnoAtual();
  }

  /* Prepara o turno de quem está na vez: pula atordoado e, se for do
     time inimigo, aciona a IA. Usado no começo da batalha E a cada turno. */
  function iniciarTurnoAtual(){
    const prox=atual();
    if(prox && prox.atordoado>0){
      prox.atordoado--;
      escrever(`⚡ ${prox.nome} está atordoado e perdeu o turno!`);
      proximoTurno(); return;
    }
    /* enterrado (Toca do Verme): o turno é SÓ sair da terra — sozinho,
       pros dois lados (jogador, IA e online), sem escolher nada. Espera a
       animação anterior como a IA espera. */
    if(prox && prox.enterrado && !acabou){
      if(onUpdate) onUpdate(estado());
      if(delayIA<=0){ emergir(prox); return; }
      let tent=0;
      const sair=()=>{
        if(esperar && esperar() && ++tent<110){ setTimeout(sair, 90); return; }
        emergir(prox);
      };
      setTimeout(sair, delayIA);
      return;
    }
    /* Não existe mais turno PERDIDO por meditação: a Meditação Branca
       virou uma POSTURA que ela escolhe no próprio turno (ver
       `meditarStack` em usarSkill). Ela joga todo turno; meditar só
       significa que ela usou o turno pra crescer em vez de bater.
       Antes o motor travava a unidade aqui por N turnos, e isso valia
       ~18 pontos de taxa de vitória sozinho — a nota está em §5.1 do
       CONTEXT.md, e nada mais no jogo usa esse trecho. */
    if(onUpdate) onUpdate(estado());
    if(prox && prox.time==='inimigo' && !acabou && !semIA){
      // atraso 0 = joga na hora (usado em simulação/teste e no modo rápido)
      if(delayIA<=0){ jogadaDaIA(prox); return; }
      /* enquanto a UI estiver ANIMANDO o golpe anterior, a IA espera.
         Sem isso um turno começaria por cima da animação do outro. */
      /* trava de segurança: no máximo ~10s esperando (os golpes ficaram mais longos na 1.25). Se a animação
         não terminar (aba em segundo plano estrangula o rAF), a IA
         joga assim mesmo — melhor perder a encenação que travar. */
      let tentativas=0;
      const disparar=()=>{
        if(esperar && esperar() && ++tentativas<110){ setTimeout(disparar, 90); return; }
        jogadaDaIA(prox);
      };
      setTimeout(disparar, delayIA);
    }
  }

  /* sai da terra e acerta: o alvo é o que ele escolheu ao cavar; se esse
     morreu (ou também se enterrou), vai no primeiro inimigo que der pra
     mirar. Usa o MESMO usarSkill (com `_emergindo`), então dano, veneno,
     passivas e animação saem pelo caminho normal de qualquer golpe. */
  function emergir(u){
    if(acabou || !u || !u.vivo || !u.enterrado || !daLuta(u)) return;
    const e=u.enterrado, timeIni = u.time==='aliado'? 'inimigo' : 'aliado';
    let alvo=todos().find(x=>x.id===e.alvo);
    if(!alvo || !alvo.vivo || intocavel(alvo) || alvo.time!==timeIni) alvo=alvejaveis(timeIni)[0] || null;
    u.enterrado=null; u._emergindo=true;
    u.cds[e.i]=0;
    escrever(`🪱 ${u.nome} saiu da terra!`);
    const ok=usarSkill(u, e.i, alvo);
    if(!ok){ u._emergindo=false; defender(u); }
  }

  function checarFim(){
    if(acabou) return true;
    const a=vivosDo('aliado').length, i=vivosDo('inimigo').length;
    if(a===0 || i===0){
      acabou=true;
      escrever(a>0? '🏆 VITÓRIA!' : '💀 DERROTA...');
      if(onUpdate) onUpdate(estado());
      return true;
    }
    return false;
  }

  /* golpe que está DE VERDADE no slot `i` agora. Normalmente é só a
     ficha na forma atual (Mecas) — mas se o slot é a BIZARRICE e a
     unidade tem um roubo guardado, é o roubo que ocupa o lugar dela até
     ser usado. UI e IA usam isto em vez de ler `ficha.skills[i]` direto,
     senão o botão continuaria mostrando "BIZARRICE" mesmo com um golpe
     roubado pronto para sair. */
  function skillEfetiva(u, i){
    const s0 = u.ficha.skills[i];
    if(s0 && s0.roubar && u.roubado) return TurnData.skillNaForma(u.roubado.skill, u.forma);
    return TurnData.skillNaForma(s0, u.forma);
  }

  /* ---------------- IA do time inimigo ---------------- */
  function jogadaDaIA(u){
    if(acabou || !u || !u.vivo || !daLuta(u)) return;
    if(u.enterrado){ emergir(u); return; }   // turno de quem está na terra é só sair dela
    /* Tupas: o redemoinho bebe água todo turno — com o estoque perto do
       fim a IA recolhe ele (ação livre) pra sobrar água pros golpes. */
    if(u.redemoinho && u.agua < u.redemoinho.custo*2) desativarRedemoinho(u);
    /* time OPOSTO ao de quem está jogando — não hardcoded em 'aliado'.
       No jogo normal só o time 'inimigo' passa por aqui (então dava no
       mesmo), mas a função é exportada para simulação com IA dos DOIS
       lados (ver `jogadaDaIA` no retorno do módulo), e ali chamar isto
       para uma unidade do time 'aliado' tratava os PRÓPRIOS aliados
       como alvo. */
    const timeOposto = u.time==='aliado' ? 'inimigo' : 'aliado';
    const inimigos = alvejaveis(timeOposto);
    // IA ESPERTA só no lado do BOT (o 'inimigo' do motor) — o outro lado é o jogador
    const esperta = iaEsperta && u.time==='inimigo';
    // todo mundo do outro lado enterrado: não tem em quem bater — defende
    if(!inimigos.length){ defender(u); return; }

    /* a IA raciocina sobre o golpe NA FORMA ATUAL (o Mecas ciborgue
       tem outra lista de golpes que o Mecas humano) */
    const disponiveis = u.ficha.skills
      .map((s,i)=>({ s:skillEfetiva(u,i), i }))
      .filter(x=>u.cds[x.i]<=0 && !(u.desabilitadas||[]).some(d=>d.i===x.i) &&
                !condicaoSkill(u, x.i) && !(x.s.redemoinho && u.redemoinho));
    if(!disponiveis.length){ defender(u); return; }

    /* 1.47 — ESTRATÉGIA DO PERSONAGEM (`ficha.estrategia`, js/turndata.js).
       Lista de prioridade achada por SIMULAÇÃO (busca de estratégias no
       motor real): no turno dele sai o 1º golpe da lista que estiver pronto
       e com a condição valendo. Nada passou → a IA de sempre, logo abaixo.
       Era o maior furo do bot: ele gastava turno em setup e ultimate que
       rendem menos que simplesmente bater. */
    const est = u.ficha.estrategia;
    if(est && est.lista){
      u.usos = u.usos || {};
      const vida = u.hp/u.hpMax;
      const condicao = e=>{
        switch(e.g){
          case 'rodadaAte':    return rodada<=e.p;
          case 'rodadaDepois': return rodada>e.p;
          case 'vidaMenos':    return vida<e.p;
          case 'vidaMais':     return vida>=e.p;
          case 'timeFerido':   return vivosDo(u.time).some(a=>a.hp/a.hpMax<e.p);
          case 'usosMenos':    return (u.usos[e.i]||0)<e.p;
          case 'inimigos2':    return inimigos.length>=2;
          case 'inimigos1':    return inimigos.length===1;
          default:             return true;   // 'sempre'
        }
      };
      for(const e of est.lista){
        if(e.i===-1){ if(condicao(e)){ defender(u); return; } continue; }
        const x = disponiveis.find(d=>d.i===e.i);
        if(!x || !condicao(e)) continue;
        let alvo=null;
        if(x.s.alvo==='aliado'){ alvo = companheiros(u).sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0]||null; if(!alvo) continue; }
        else if(x.s.alvo==='inimigo'){
          const pool = inimigos.slice();
          alvo = est.alvo==='pct'   ? pool.sort((a,b)=>a.hp/a.hpMax-b.hp/b.hpMax)[0]
               : est.alvo==='forte' ? pool.sort((a,b)=>(b.atk+b.atkBonus)-(a.atk+a.atkBonus))[0]
               : pool.sort((a,b)=>a.hp-b.hp)[0];
        }
        if(usarSkill(u, x.i, alvo)!==false){ u.usos[x.i]=(u.usos[x.i]||0)+1; return; }
      }
    }

    // prioridade: cura quando ferido > setup no começo > super > área > dano
    let escolha=null;
    const ferido = u.hp < u.hpMax*0.5;
    /* suporte cura o TIME, não só a si mesmo: sem isso a Loirinha só
       usaria o beijo quando ela própria estivesse quase morrendo. */
    const timeFerido = vivosDo(u.time).some(a=>a.hp < a.hpMax*0.62);
    /* golpe de UM aliado (o beijo) só vale se um COMPANHEIRO estiver mal —
       ela não pode se beijar (ver condicaoSkill), então "eu estou ferida"
       não é motivo pra gastar o beijo. */
    const outroFerido = companheiros(u).some(a=>a.hp < a.hpMax*0.62);
    /* MANO COXINHA: as comidas (virarForma) têm cura pequena, mas o que
       importa é o MODO que elas ligam — ficam fora da lista de curas e
       têm regra própria: come logo no começo (o modo normal é o mais
       fraco), troca pra DEFESA quando apanha, pra ATAQUE quando tem
       inimigo pra finalizar e pra VELOCIDADE no resto. */
    /* A ult é UMA só e gira: coxinha → pizza → hambúrguer → coxinha…
       Cada comida é um turno SEM dano, então o bot só come quando o modo
       SEGUINTE vale a pena: sai da coxinha (defesa) quando está inteiro,
       e sai do ataque (volta pra coxinha) quando começa a apanhar. */
    const comida = disponiveis.find(x=>x.s.virarForma!=null);
    if(comida){
      const f=u.forma||0, vida=u.hp/u.hpMax;
      if(f===1 && vida > 0.55) escolha=comida;          // coxinha → pizza
      else if(f===3) escolha=comida;                    // pizza → hambúrguer (o modo de bater)
      else if(f===2 && vida < 0.4) escolha=comida;      // hambúrguer → coxinha (fecha a guarda)
    }
    const curas = disponiveis.filter(x=>{
      if(x.s.virarForma!=null) return false;
      if(!(x.s.cura || (x.s.buff && x.s.buff.tipo==='regeneracao'))) return false;
      return x.s.alvo==='aliado' ? outroFerido : (ferido || timeFerido);
    });
    // a esperta escolhe a cura que mais devolve vida AGORA (sem desperdiçar no cheio)
    if(esperta && curas.length>1) curas.sort((a,b)=>valorCura(u,b.s)-valorCura(u,a.s));
    if(!escolha && curas.length) escolha=curas[0];
    // Tupas com o tanque baixo: o golpe de recuperar água vem antes de tudo
    if(!escolha && u.agua!=null && u.agua < u.ficha.agua.max*0.4){
      const repoe = disponiveis.find(x=>x.s.recuperaAgua);
      if(repoe) escolha=repoe;
    }
    /* MURALHA DE LASANHA: só ergue sem muralha de pé, com vida sobrando
       pra pagar o custo, e quando o time já está apanhando (ou logo no
       começo, antes da pancadaria) — muralha erguida tarde é desperdício. */
    if(!escolha){
      const muralha = disponiveis.find(x=>x.s.barreira);
      if(muralha && !barreiras[u.time] && u.hp > (muralha.s.custoVida||0)+25 &&
         (rodada<=2 || vivosDo(u.time).some(a=>a.hp < a.hpMax*0.7))) escolha=muralha;
    }
    /* CRIANÇA ROSA: tem aliado caído e dá pra invocar → URSÃO primeiro.
       A ult troca de modo: Criança → Demônio com o time inteiro bem (ou
       com morto, pra poder invocar); Demônio → Criança com alguém mal. */
    if(!escolha){
      const inv = disponiveis.find(x=>x.s.invocar);
      if(inv && u.hp > u.hpMax*0.35) escolha=inv;
    }
    if(!escolha){
      const troca = disponiveis.find(x=>x.s.alternaForma);
      if(troca){
        const time=vivosDo(u.time), algumMal=time.some(a=>a.hp < a.hpMax*0.45);
        const temMorto=!!aliadoCaido(u);
        if((u.forma||0)===0 && ((!algumMal && rodada>=2) || temMorto)) escolha=troca;
        else if((u.forma||0)===1 && algumMal && !temMorto) escolha=troca;
      }
    }
    /* SMERGULÃO: acabou de esquivar → Golpe Traiçoeiro (bate mais forte);
       machucado e fora da moita → se esconde na moita; fumaça só se o lado
       dele ainda não estiver enfumaçado. */
    if(!escolha && u.esquivouUltimo){
      const tr = disponiveis.find(x=>x.s.bonusEsquiva);
      if(tr) escolha=tr;
    }
    if(!escolha && !u.naMoita && u.hp < u.hpMax*0.6 && Math.random()<0.6){
      const mo = disponiveis.find(x=>x.s.moita);
      if(mo) escolha=mo;
    }
    /* PRODOCIMO: some quando começa a apanhar; e a MÃO LEVE vai em quem
       estiver com buff bom pra roubar (guarda do Defender, Bênção…). */
    if(!escolha && !u.sumida && u.hp < u.hpMax*0.7 && Math.random()<0.5){
      const su = disponiveis.find(x=>x.s.sumico);
      if(su) escolha=su;
    }
    /* DMATERELIZADOR: some do campo (Fase Fantasma) quando está apanhando;
       Desmaterializar quando o outro lado tem estrutura/muralha/fumaça, buff
       bom, ou quando o terreno inimigo está ferindo o time dele. */
    if(!escolha && !u.fase && u.hp < u.hpMax*0.6 && Math.random()<0.6){
      const fa = disponiveis.find(x=>x.s.fase);
      if(fa) escolha=fa;
    }
    if(!escolha){
      const de = disponiveis.find(x=>x.s.desfazer);
      if(de && (estruturas[timeOposto] || barreiras[timeOposto] || fumacas[timeOposto] || terrenos[u.time] ||
                inimigos.some(a=>a.buffs.some(b=>b.valor>0 && b.tipo!=='lentidao')))) escolha=de;
    }
    let alvoForcado=null;
    if(!escolha){
      const ml = disponiveis.find(x=>x.s.roubarBuffs);
      const rico = ml && inimigos.find(a=>a.buffs.some(b=>b.valor>0 && b.tipo!=='lentidao'));
      if(rico){ escolha=ml; alvoForcado=rico; }
    }
    if(!escolha && !fumacas[u.time] && rodada<=3){
      const fu = disponiveis.find(x=>x.s.fumaca);
      if(fu && Math.random()<0.75) escolha=fu;
    }
    /* SETUP (smergulite, Corsa): vale a pena cedo, quando ainda sobra
       luta para aproveitar o efeito. Depois disso é turno jogado fora. */
    if(!escolha){
      // (muralha já tem regra própria logo acima — não entra aqui de novo)
      const setups = disponiveis.filter(x=>x.s.setup && !x.s.barreira && !x.s.fumaca);
      if(setups.length && rodada<=3 && Math.random()<0.75) escolha=setups[0];
    }
    /* POSTURA que empilha ataque (Meditação Branca): a IA medita CEDO,
       enquanto ainda sobra luta pra aproveitar o ataque acumulado, e
       para de meditar quando bate no teto — senão ela ficaria sentada a
       partida inteira sem nunca dar um golpe (a skill não tem recarga,
       então ela é sempre uma opção disponível). Só medita nas primeiras
       rodadas e no máximo até o teto: depois disso é turno jogado fora,
       exatamente como um setup usado tarde demais. */
    if(!escolha){
      const posturas = disponiveis.filter(x=>x.s.meditarStack);
      if(posturas.length && rodada<=2 && u.hp > u.hpMax*0.7){
        const cfg = posturas[0].s.meditarStack;
        if((u.atk + u.atkBonus) < (cfg.teto||Infinity)) escolha=posturas[0];
      }
    }
    if(!escolha){
      // (o Aperto de Mão Revelador não tem dano nem buff: entra pela confusão)
      const supers = disponiveis.filter(x=>x.s.super && (x.s.dano>0 || x.s.buff || x.s.confusao));
      if(supers.length) escolha=supers[0];
    }
    if(!escolha && !esperta){   // a esperta compara área × alvo único pela nota (lá embaixo)
      // só conta como "área" o que realmente machuca o time todo
      const areas = disponiveis.filter(x=>x.s.alvo==='todos_inimigos' && x.s.dano>0 && inimigos.length>1);
      if(areas.length) escolha=areas[0];
    }
    if(!escolha){
      const buffs = disponiveis.filter(x=>x.s.alvo==='eu' && x.s.buff);
      if(buffs.length && rodada<=2) escolha=buffs[0];
    }
    if(!escolha){
      const dano = disponiveis.filter(x=>x.s.dano>0);
      if(esperta && dano.length){
        // IA ESPERTA: o golpe que rende mais AGORA (dano real, abate, efeitos)
        dano.forEach(x=>{ x.nota = valorDoGolpe(u, x.s, inimigos, timeOposto) + Math.random()*2; });
        dano.sort((a,b)=>b.nota-a.nota);
        escolha = dano[0];
      } else
        escolha = dano.length? dano[(Math.random()*dano.length)|0] : disponiveis[0];
    }

    /* mira: golpe de aliado vai no companheiro MAIS FERIDO; 'qualquer'
       (Bizarrice) mira em quem tem a ultimate mais perigosa; o resto vai
       no inimigo mais fraco (para fechar a morte). */
    let alvo;
    if(alvoForcado) alvo = alvoForcado;
    /* confusão de UM alvo sem dano (Aperto de Mão Revelador): vale mais em
       quem bate mais forte e ainda não está confuso (e o Lambança é imune) */
    else if(escolha.s.confusao && !escolha.s.dano && escolha.s.alvo==='inimigo'){
      const pool = inimigos.filter(a=>a.ficha.passiva!=='fervor' && !(a.confuso>0));
      alvo = (pool.length? pool : inimigos).slice().sort((a,b)=>(b.atk+b.atkBonus)-(a.atk+a.atkBonus))[0];
    }
    else if(escolha.s.alvo==='aliado')
      alvo = companheiros(u).sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0] || null;
    else if(escolha.s.alvo==='qualquer'){
      /* SEMPRE prioriza o time INIMIGO: roubar de um aliado desperdiça o
         turno (nenhum ganho de dano pro campo) E ainda trava a ultimate
         do PRÓPRIO time — a primeira versão da IA sorteava entre os dois
         lados sem diferenciar e isso sozinho derrubava o Adulto Feliz
         pra ~20% de vitória na simulação (ele "roubava" do companheiro
         quase 4 em cada 10 vezes). Só considera aliado se NINGUÉM do
         time inimigo tiver ultimate nenhuma — cenário raríssimo. */
      const timeOpostoDele = u.time==='aliado' ? 'inimigo' : 'aliado';
      const rivais = alvejaveis(timeOpostoDele).filter(x=>x.id!==u.id);
      const rivaisComSuperPronta = rivais.filter(x=>{
        const iS = x.ficha.skills.findIndex(s=>TurnData.skillNaForma(s, x.forma).super);
        return iS>=0 && x.cds[iS]<=0;
      });
      const rivaisComSuper = rivais.filter(x=>x.ficha.skills.some(s=>s.super));
      let pool = rivaisComSuperPronta.length? rivaisComSuperPronta : rivaisComSuper;
      if(!pool.length){
        // fallback raríssimo: ninguém do time inimigo tem ultimate — aí sim considera o próprio time
        const companheiros = vivosDo(u.time).filter(x=>x.id!==u.id && x.ficha.skills.some(s=>s.super));
        pool = companheiros.length? companheiros : rivais;
      }
      alvo = pool.length? pool[(Math.random()*pool.length)|0] : null;
    }
    else if(esperta)
      alvo = melhorAlvo(u, escolha.s, inimigos);
    else
      alvo = inimigos.slice().sort((a,b)=>a.hp-b.hp)[0];
    usarSkill(u, escolha.i, alvo);
  }

  /* ---------------- IA ESPERTA (Modo Condenação) ---------------- */
  /* o quanto um inimigo é PERIGOSO: ataque alto, quem cura o time, chefe */
  function ameaca(a){
    let v = (a.atk + (a.atkBonus||0)) / 25;
    if(a.ficha.skills.some(s=>s.cura || s.curaAliado)) v += 0.6;
    if(a.chefe) v += 0.5;
    return v;
  }
  /* alvo que mais rende: quem ESSE golpe derruba agora (o mais perigoso
     deles); se ninguém cai, quem perde a maior fatia da vida, pesado
     pela ameaça. calcularDano não sorteia nada, então é previsão exata
     (menos esquiva). */
  function melhorAlvo(u, s, inimigos){
    /* PROVOCADO: golpe de alvo único vai no provocador de qualquer jeito
       (o motor força) — então é nele que a conta tem que ser feita, senão
       ela escolhe o golpe pensando num alvo que nunca vai acertar. */
    if(u.provocado && s.alvo==='inimigo'){
      const dono = inimigos.find(x=>x.id===u.provocado.por);
      if(dono) return dono;
    }
    let melhor=null, nota=-1e9;
    inimigos.forEach(a=>{
      const d = calcularDano(u, a, s.dano||0, s.tipo, {escalaVelocidade:s.escalaVelocidade, escalaDefesa:s.escalaDefesa, escalaVida:s.escalaVida}) * (s.vezes||1);
      // quem esquiva muito vale menos: o dano esperado é o dano × a chance de pegar
      const pega = 1 - chanceEsquiva(a);
      let n = d>=a.hp ? (100 + ameaca(a)*10)*pega : (d/a.hp)*50*pega + ameaca(a)*8;
      // já vai cair sozinho no próximo tique de veneno/sangue: bater nele é desperdício
      if(vidaQueOsDotsTiram(a) >= a.hp) n -= 60;
      if(n>nota){ nota=n; melhor=a; }
    });
    return melhor;
  }
  /* quanto os efeitos por turno (veneno/sangue/queimadura) ainda tiram
     de `a` no PRÓXIMO fim de turno dele — pra não gastar golpe em quem já
     está morto e não sabe */
  function vidaQueOsDotsTiram(a){
    return (a.dots||[]).reduce((t,d)=>{
      let v=d.dano; if(d.tipo==='sangramento') v=Math.round(v*(1+(1-a.hp/a.hpMax)));
      return t+v;
    }, 0);
  }
  /* quanto de vida uma cura devolve DE VERDADE agora (o que passa do
     máximo é desperdício) — a IA esperta compara curas por isso */
  function valorCura(u, s){
    const v = s.cura || ((s.buff && s.buff.tipo==='regeneracao') ? s.buff.valor*(s.buff.turnos||1) : 0);
    const falta = a => Math.max(0, a.hpMax - a.hp);
    if(s.alvo==='aliado'){
      const c = companheiros(u).sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[0];
      return c ? Math.min(v, falta(c)) * (c.hp < c.hpMax*0.35 ? 1.6 : 1) : 0;
    }
    if(s.alvo==='eu') return Math.min(v, falta(u));
    return vivosDo(u.time).reduce((t,a)=>t+Math.min(v, falta(a)), 0);
  }
  /* valor de um golpe de dano AGORA: dano que entra de verdade (limitado
     pela vida que sobra), bônus por abate e pelos efeitos. Com MURALHA
     inimiga de pé, área vale UM golpe só e os efeitos se perdem. */
  function valorDoGolpe(u, s, inimigos, timeOposto){
    const muralha = barreiras[timeOposto];
    const opts = {escalaVelocidade:s.escalaVelocidade, escalaDefesa:s.escalaDefesa, escalaVida:s.escalaVida};
    if(muralha && muralha.hp>0)
      return calcularDano(u, { def:0, defBonus:0, ficha:{ passiva:null } }, s.dano||0, s.tipo, opts)*(s.vezes||1) * 0.6;
    const alvos = s.alvo==='todos_inimigos' ? inimigos : [melhorAlvo(u, s, inimigos)].filter(Boolean);
    let v=0;
    alvos.forEach(a=>{
      const d = calcularDano(u, a, s.dano||0, s.tipo, opts) * (s.vezes||1);
      // esquivou = nem dano nem efeito (ver usarSkill): tudo vale × a chance de PEGAR
      const pega = 1 - chanceEsquiva(a);
      let va = Math.min(d, a.hp) + (d>=a.hp ? 40 + ameaca(a)*10 : 0);
      // efeito por turno só conta se ele SOBREVIVER ao golpe (morto não sangra)
      if(s.dot && d<a.hp) va += s.dot.dano * s.dot.turnos * 0.7;
      if(s.atordoar) va += s.atordoar * 25 * (1 + ameaca(a)*0.3);
      if(s.confusao && a.ficha.passiva!=='fervor') va += 12;
      if(s.lentidao && a.ficha.passiva!=='fortaleza') va += 6;
      // Desmaterializar: buffs que somem dele
      if(s.desfazer) va += a.buffs.reduce((t,b)=>t+(b.valor>0 && b.tipo!=='lentidao'? b.valor*1.5 : 0), 0);
      // Mão Leve: o que dá pra roubar dele agora (e ele perde)
      if(s.roubarBuffs) va += a.buffs.reduce((t,b)=>t+(b.valor>0 && b.tipo!=='lentidao'? b.valor*2 : 0), 0);
      // Finta: confuso cai na finta
      if(s.bonusConfuso && a.confuso>0) va += Math.min(d, a.hp)*(s.bonusConfuso-1);
      v += va * pega;
    });
    if(s.drena) v *= 1 + s.drena*0.5;
    /* o que o golpe deixa NO CAMPO além do acerto — sem isto a esperta
       desprezava o Terremoto (terreno que fere o time todo por 3 turnos),
       a provocação e a guarda erguida, e jogava o Fat Smerg PIOR que a IA
       comum (medido: 85% de vitória do jogador contra 60% da comum). */
    if(s.terreno){
      const td = s.terreno.dano!=null ? s.terreno.dano : velocidadeDe(u)*(s.terreno.escalaVelocidade||1);
      v += td * (s.terreno.turnos||1) * inimigos.length * 0.55;
    }
    if(s.provoca) v += 10 + (s.alvo==='todos_inimigos' ? 8 : 0);
    if(s.buffEu) v += (s.buffEu.valor||0) * Math.min(3, s.buffEu.turnos||1) * (s.buffEu.porTurno? 1.4 : 0.8);
    if(s.recochete && s.alvo==='inimigo' && inimigos.length>1) v *= 1 + (s.recochete.chance||0.6)*0.8;
    if(s.roubarTempo) v += 8;
    if(s.desabilitar || s.removerAtaque) v += 14;
    return v;
  }

  /* ---------------- estado para a UI ---------------- */
  function estado(){
    return {
      times, ordem, rodada, terrenos, estruturas, barreiras, fumacas, ambiente, acabou, log:log.slice(-14), evento,
      atual: atual(),
      vezDoJogador: !!(atual() && atual().time==='aliado' && !acabou),
      venceu: acabou? vivosDo('aliado').length>0 : null
    };
  }

  function setDelayIA(ms){ delayIA = Math.max(0, ms|0); }
  function setEspera(fn){ esperar = (typeof fn==='function')? fn : null; }
  function unidade(id){ return todos().find(u=>u.id===id) || null; }

  return { iniciar, usarSkill, defender, estado, velocidadeDe, setDelayIA, setEspera, unidade, skillEfetiva,
           desativarRedemoinho, condicaoSkill, multAgua,
           /* jogadaDaIA exposta de propósito: é o que permite rodar a
              MESMA política de IA nos dois lados num teste de balanço
              sem interface (ver README de balanceamento em CONTEXT.md —
              é o método usado para medir a Smergula e o Strong Smerg). */
           jogadaDaIA,
           get times(){ return times; }, get turnos(){ return turnosPorTime; }, get dano(){ return danoPorTime; },
           get estruturas(){ return estruturas; }, get barreiras(){ return barreiras; }, get fumacas(){ return fumacas; }, chanceEsquiva, get ambiente(){ return ambiente; } };
})();
