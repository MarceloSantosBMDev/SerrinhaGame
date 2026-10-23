/* ============================================================
   RANQUEADA 3x3 ONLINE — a ponte entre o motor de turnos e a rede
   ------------------------------------------------------------
   MODELO: AUTORIDADE DO ANFITRIÃO (host).

   Só UM lado simula a batalha. O host roda o TurnBattle normalmente
   (com a IA desligada, porque o time "inimigo" é gente de verdade) e,
   a cada mudança, manda o ESTADO INTEIRO para o convidado. O convidado
   não simula nada: ele desenha o que chega e manda de volta só a ação
   que escolheu ("usei a skill 2 no alvo X").

   Por que não rodar os dois lados em paralelo (lockstep)? Porque a
   batalha usa sorteio (iniciativa, esquiva, atordoar). Bastaria UMA
   mensagem perdida para os dois jogadores passarem a ver partidas
   diferentes, sem ninguém perceber. Mandando o estado inteiro, cada
   pacote novo CONSERTA o anterior — e o estado do 3x3 é pequeno
   (6 lutadores), diferente da luta 1x1 que roda a 60 quadros por
   segundo e por isso precisa de snapshot enxuto.

   Lados: o time do HOST é sempre o 'aliado' do motor; o do convidado
   é o 'inimigo'. Cada jogador vê o PRÓPRIO time embaixo (ver meuLado
   no turnui.js).
   ============================================================ */
const TurnOnline = (function(){

  let chan=null, papel=null, ativo=false;
  let onFim=null;               // callback do Online para registrar o rating
  let onRodada=null, ultimaRodada=0;   // host: avisa o índice "ao vivo" quando a rodada muda
  let seq=0, ultimoRecebido=null;
  let acaoPendente=null, tentativas=0, reenvioId=null;
  let fimAvisado=false;
  let recebiAlgum=false, pingId=null, ultimoEstadoEm=0;
  let batidaId=null;            // host: re-anúncio do estado enquanto espera
  let ultimoEventoSeq=0;        // convidado: nº do último golpe que EU vi
  let baseDoEnvio=0;            // qual era esse nº quando mandei minha jogada

  function meuLado(){ return papel==='host' ? 'aliado' : 'inimigo'; }
  function ladoDele(){ return papel==='host' ? 'inimigo' : 'aliado'; }

  /* ============================================================
     SERIALIZAÇÃO
     Manda só o que a tela precisa. `char` e `ficha` NÃO vão pela
     rede: são reconstruídos do charId do outro lado (os dois têm o
     mesmo characters.js/turndata.js).
     ============================================================ */
  function serializar(st){
    const u2 = u => ({
      id:u.id, charId:u.charId, nome:u.nome, time:u.time, pos:u.pos,
      hp:u.hp, hpMax:u.hpMax, atk:u.atk, def:u.def, spd:u.spd,
      atkBonus:u.atkBonus||0, defBonus:u.defBonus||0, spdBonus:u.spdBonus||0,
      forma:u.forma||0, atordoado:u.atordoado||0, confuso:u.confuso||0,
      almas:u.almas||0, vivo:!!u.vivo,
      /* postura de meditação (Fat Girl): é ESTADO DE POSE, não efeito —
         sem mandar isto, o outro lado via ela de pé enquanto ela estava
         sentada meditando (a pose de quem assiste sai daqui). */
      emMeditacao:!!u.emMeditacao,
      /* Careca: na terra (Toca do Verme) e morto esperando voltar como
         verme — também são estado de POSE, o outro lado precisa ver. */
      enterrado:!!u.enterrado, renasce:u.renasce!=null,
      // Tupas: estoque de água e o redemoinho ativo (só o que a tela usa)
      agua:(u.agua==null? null : u.agua),
      redemoinho:(u.redemoinho? { proximo:u.redemoinho.proximo } : null),
      // Smergulão: furtividade, moita e modo furtivo mudam a POSE e o card
      furtivo:u.furtivo||0, naMoita:u.naMoita||0, modoFurtivo:u.modoFurtivo||0,
      esquivouUltimo:!!u.esquivouUltimo,
      // Prodocimo: o Sumiço muda a POSE (vulto) e o card (👻)
      sumida:u.sumida||0,
      // Dmaterelizador: desmaterializado (ninguém mira) e esgotado depois da ult
      fase:u.fase||0, esgotado:u.esgotado||0,
      cds:(u.cds||[]).slice(),
      dots:(u.dots||[]).map(d=>({tipo:d.tipo, dano:d.dano, turnos:d.turnos})),
      buffs:(u.buffs||[]).map(b=>({tipo:b.tipo, valor:b.valor, turnos:b.turnos}))
    });
    return {
      n:++seq,
      rodada:st.rodada, acabou:!!st.acabou, venceu:(st.venceu===true),
      terrenos:{ aliado:st.terrenos.aliado||null, inimigo:st.terrenos.inimigo||null },
      estruturas:{ aliado:(st.estruturas&&st.estruturas.aliado)||null,
                   inimigo:(st.estruturas&&st.estruturas.inimigo)||null },
      // Muralha de Lasanha (Cabelin) — vida própria, a tela desenha
      barreiras:{ aliado:(st.barreiras&&st.barreiras.aliado)||null,
                  inimigo:(st.barreiras&&st.barreiras.inimigo)||null },
      // Fumaça Colorida (Smergulão)
      fumacas:{ aliado:(st.fumacas&&st.fumacas.aliado)||null,
                inimigo:(st.fumacas&&st.fumacas.inimigo)||null },
      ambiente: st.ambiente || null,
      log:st.log||[], evento:st.evento||null,
      aliado:st.times.aliado.map(u2), inimigo:st.times.inimigo.map(u2),
      ordem:(st.ordem||[]).map(u=>u.id),
      atual: st.atual? st.atual.id : null,
      cenario: TurnBG.atual? TurnBG.atual.id : null
    };
  }

  /* remonta um estado igual ao que o TurnBattle.estado() devolve */
  function hidratar(s){
    const mk = o => {
      const u = Object.assign({}, o);
      u.char  = Characters.byId(o.charId);
      u.ficha = TurnData.ficha(o.charId);
      u.dots  = o.dots  || [];
      u.buffs = o.buffs || [];
      u.cds   = o.cds   || [];
      return u;
    };
    const times = { aliado:(s.aliado||[]).map(mk), inimigo:(s.inimigo||[]).map(mk) };
    const todos = times.aliado.concat(times.inimigo);
    const acha  = id => todos.find(u=>u.id===id) || null;
    return {
      times, rodada:s.rodada||1,
      terrenos:  s.terrenos   || {aliado:null,inimigo:null},
      estruturas:s.estruturas || {aliado:null,inimigo:null},
      barreiras: s.barreiras  || {aliado:null,inimigo:null},
      fumacas:   s.fumacas    || {aliado:null,inimigo:null},
      ambiente:  s.ambiente   || null,
      acabou:!!s.acabou, venceu:(s.acabou? !!s.venceu : null),
      log:s.log||[], evento:s.evento||null,
      ordem:(s.ordem||[]).map(acha).filter(Boolean),
      atual: acha(s.atual)
    };
  }

  /* ============================================================
     INÍCIO
     ============================================================ */
  function iniciar(opts){
    // opts: {chan, role, meuTime, timeDele, oponente, cenario, onFim}
    chan=opts.chan; papel=opts.role; onFim=opts.onFim||null;
    onRodada=opts.onRodada||null; ultimaRodada=0;
    ativo=true; seq=0; ultimoRecebido=null; fimAvisado=false; recebiAlgum=false; ultimoEstadoEm=0;
    ultimoEventoSeq=0; baseDoEnvio=0;
    clearInterval(pingId); pingId=null; clearInterval(batidaId); batidaId=null;
    acaoPendente=null; tentativas=0; clearTimeout(reenvioId);

    const ctrl = {
      online:true,
      meuLado: meuLado(),
      oponente: opts.oponente||null,
      acao: enviarAcao,
      defender: enviarDefender,
      desativar: enviarDesativar
    };

    if(papel==='host'){
      /* o host SORTEIA o cenário e manda o id junto em cada estado —
         senão cada jogador lutaria num lugar diferente (e o convidado,
         que nunca sorteia, ficaria sem fundo nenhum). */
      TurnUI.iniciarOnline(ctrl, { cenario:null });
      TurnBG.sortear();
      TurnBattle.setEspera(TurnUI.animando);
      TurnBattle.iniciar(opts.meuTime, opts.timeDele, aoAtualizar, { semIA:true });
      chan.onInput(receberAcaoDoConvidado);
      /* BATIDA DO ANFITRIÃO: enquanto a vez for do convidado, reanuncia
         o estado a cada 2,5s. É o que impede a partida de morrer se UM
         estado se perder no caminho: sem isso o convidado fica com a
         tela velha achando que não é a vez dele, o host fica esperando
         uma jogada que nunca vem, e ninguém tem como sair disso.
         Só reanuncia enquanto ESPERA — quando é a vez do host, a
         própria jogada dele já manda estado novo. */
      batidaId=setInterval(()=>{
        if(!ativo){ clearInterval(batidaId); batidaId=null; return; }
        const st=TurnBattle.estado();
        if(st.acabou || !st.atual || st.atual.time!=='inimigo') return;
        try{ chan.sendSnapshot(serializar(st)); }catch(e){}
      }, 2500);
    } else {
      TurnUI.iniciarOnline(ctrl, { esperando:true });
      chan.onSnapshot(receberEstado);
      /* PEDIDO DE ESTADO: vale no começo (se o host abriu a partida
         antes de eu plugar o ouvinte, o primeiro estado se perde) E no
         meio da partida (se um estado sumir, eu fico com a tela velha).
         Enquanto estiver mais de 3s sem notícia, eu peço de novo. */
      pingId=setInterval(()=>{
        if(!ativo){ clearInterval(pingId); pingId=null; return; }
        if(recebiAlgum && Date.now()-ultimoEstadoEm < 3000) return;
        try{ chan.sendInput({ tipo:'oi', n:++seq }); }catch(e){}
      }, 1500);
    }

    chan.onOpponentLeft(()=>{
      if(fimAvisado) return;
      fimAvisado=true; ativo=false;
      TurnUI.fimOnline(true, 'O adversário saiu da partida');
      if(onFim) onFim(1, {desistencia:true});
    });
  }

  /* ---------- HOST: motor rodando aqui ---------- */
  function aoAtualizar(st){
    TurnUI.aplicarEstado(st);
    try{ chan.sendSnapshot(serializar(st)); }catch(e){}
    if(onRodada && st.rodada!==ultimaRodada){ ultimaRodada=st.rodada; try{ onRodada(st.rodada); }catch(e){} }
    checarFim(st, 'aliado');
  }

  function receberAcaoDoConvidado(m){
    if(!ativo || !m || m.tipo==null) return;
    // "oi" = o convidado ainda não viu estado nenhum: reenvia o atual
    if(m.tipo==='oi'){ try{ chan.sendSnapshot(serializar(TurnBattle.estado())); }catch(e){} return; }
    if(m.n!=null && m.n===ultimoRecebido) return;      // reenvio: já apliquei
    ultimoRecebido = m.n;
    /* espera a animação do golpe anterior terminar antes de resolver o
       próximo turno — senão o soco do host seria cortado no meio */
    TurnUI.quandoLivre(()=>{
      const st=TurnBattle.estado();
      if(st.acabou || !st.atual || st.atual.time!=='inimigo') return;  // não é a vez dele
      if(m.tipo==='defender'){ TurnBattle.defender(st.atual); return; }
      // desativar o redemoinho do Tupas: ação livre — o turno CONTINUA sendo dele
      if(m.tipo==='desativar'){ TurnBattle.desativarRedemoinho(st.atual); return; }
      const alvo = m.alvo? TurnBattle.unidade(m.alvo) : null;
      TurnBattle.usarSkill(st.atual, m.i|0, alvo);
    });
  }

  /* ---------- CONVIDADO: só desenha o que chega ---------- */
  function receberEstado(s){
    if(!ativo || !s) return;
    if(s.n!=null && s.n===ultimoRecebido) return;
    ultimoRecebido = s.n;
    recebiAlgum=true; ultimoEstadoEm=Date.now();
    /* CONFIRMAÇÃO DA JOGADA pelo NÚMERO DO GOLPE, não por "chegou algo".
       Com a batida do anfitrião chega estado a cada 2,5s mesmo sem nada
       ter acontecido — cancelar o reenvio nesses estados descartaria uma
       jogada que se perdeu, e ela nunca mais seria enviada. Só está
       confirmada quando o host produz um golpe NOVO. */
    const evSeq = (s.evento && s.evento.seq) || 0;
    if(acaoPendente && (evSeq > baseDoEnvio || s.acabou)){
      acaoPendente=null; clearTimeout(reenvioId);
    }
    ultimoEventoSeq = evSeq;
    // usar() refaz a camada parada do cenário: só troca se mudou mesmo
    if(s.cenario && (!TurnBG.atual || TurnBG.atual.id!==s.cenario)) TurnBG.usar(s.cenario);
    else if(!s.cenario && !TurnBG.atual) TurnBG.sortear();   // host sem cenário: melhor um qualquer que palco vazio
    const st=hidratar(s);
    TurnUI.quandoLivre(()=>{
      TurnUI.aplicarEstado(st);
      checarFim(st, 'inimigo');
    });
  }

  /* ---------- ações do jogador local ---------- */
  function enviarAcao(i, alvoUid){
    if(!ativo) return;
    if(papel==='host'){
      const st=TurnBattle.estado();
      if(!st.atual || st.atual.time!=='aliado') return;
      TurnBattle.usarSkill(st.atual, i, alvoUid? TurnBattle.unidade(alvoUid) : null);
      return;
    }
    mandar({ tipo:'acao', i:i, alvo:alvoUid||null });
  }
  function enviarDesativar(){
    if(!ativo) return;
    if(papel==='host'){
      const st=TurnBattle.estado();
      if(!st.atual || st.atual.time!=='aliado') return;
      TurnBattle.desativarRedemoinho(st.atual);
      return;
    }
    mandar({ tipo:'desativar' });
  }
  function enviarDefender(){
    if(!ativo) return;
    if(papel==='host'){
      const st=TurnBattle.estado();
      if(!st.atual || st.atual.time!=='aliado') return;
      TurnBattle.defender(st.atual);
      return;
    }
    mandar({ tipo:'defender' });
  }

  /* O relay do Firebase escreve sempre no MESMO caminho: se dois envios
     se atropelam, um se perde e o turno travaria para sempre. Por isso
     cada ação leva um número e é reenviada até o estado voltar. */
  function mandar(acao){
    acao.n = ++seq;
    acaoPendente = acao; tentativas = 0;
    baseDoEnvio = ultimoEventoSeq;      // confirmo quando passar disso
    TurnUI.aguardando(true);
    disparar();
  }
  function disparar(){
    if(!ativo || !acaoPendente) return;
    /* `r` muda a cada tentativa DE PROPÓSITO: o relay escreve sempre no
       mesmo caminho e o Firebase só avisa o outro lado quando o VALOR
       muda. Reenviar o objeto idêntico não dispararia evento nenhum —
       era reenvio que não reenviava nada. */
    acaoPendente.r = tentativas;
    try{ chan.sendInput(acaoPendente); }catch(e){}
    clearTimeout(reenvioId);
    tentativas++;
    /* NUNCA desiste: enquanto a partida estiver de pé, insiste. Desistir
       deixava o jogador preso num "sem resposta" sem saída. Se o
       adversário realmente sumiu, quem encerra é o onOpponentLeft. */
    if(tentativas>=3) TurnUI.aguardando(false, 'Reenviando jogada… ('+tentativas+')');
    reenvioId=setTimeout(disparar, tentativas<3? 700 : 1500);
  }

  /* ---------- fim ---------- */
  function checarFim(st, meuLadoNoMotor){
    if(!st.acabou || fimAvisado) return;
    fimAvisado=true; ativo=false;
    // st.venceu é sempre relativo ao time 'aliado' do motor
    const venci = (meuLadoNoMotor==='aliado') ? !!st.venceu : !st.venceu;
    TurnUI.fimOnline(venci, null);
    if(onFim) onFim(venci?1:0, {});
  }

  function encerrar(){
    ativo=false; clearTimeout(reenvioId);
    clearInterval(pingId); pingId=null;
    clearInterval(batidaId); batidaId=null;
    acaoPendente=null; chan=null; papel=null; onFim=null; onRodada=null;
  }

  return { iniciar, encerrar, serializar, hidratar,
           get ativo(){ return ativo; }, get papel(){ return papel; } };
})();
