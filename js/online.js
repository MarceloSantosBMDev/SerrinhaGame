/* ============================================================
   ONLINE — fluxo completo:
     escolher modo → (montar time OU draft) → procurar/jogar →
     registrar resultado.

   DOIS MODOS, os dois em 3x3 por turnos:
     · CASUAL    = cada um monta o PRÓPRIO time antes de entrar na
                   fila (pode repetir personagem entre os dois lados).
                   Sem rating.
     · RANQUEADA = entra na fila SEM time. Ao encontrar adversário,
                   os dois fazem um DRAFT ao vivo (ver js/turndraft.js):
                   escolhem um personagem por vez, alternando, e um
                   personagem escolhido por um lado fica indisponível
                   para o outro. Vale rating.
   ============================================================ */
const Online = (function(){

  let modo='casual';        // 'casual' | 'ranked'
  let meuTime=null;         // três lutadores (casual: pré-escolhido · ranqueada: vem do draft)
  let sala=null;            // {roomId, role, opponent}
  let chan=null;
  let procurando=false;
  let inicio=0, timerId=null, offFila=null;
  let meuPerfil=null;       // {nick, rating} — vai pro índice "ao vivo" quando eu sou o anfitrião
  let aoVivoId=null;        // sala que EU anunciei como ao vivo (só o host anuncia)

  function ehRanqueada(){ return modo==='ranked'; }
  function estado(){ return { modo, sala, procurando, meuTime }; }

  /* ---------- 1) escolher modo ---------- */
  function escolherModo(m){
    const u=Auth.user();
    if(!u || u.provider==='guest'){ toast('Entre com uma conta para jogar online'); goto('login'); return; }
    // detecta conta "perfil local" presa de quando o Firebase ainda
    // estava conectando (bug já corrigido, mas contas antigas ficaram
    // órfãs): sem sessão real no Firebase Auth, toda escrita no servidor
    // dá permission_denied. Avisa em vez de deixar o erro genérico.
    if(Net.kind()==='firebase' && u.provider==='local'){
      toast('Sua conta é só local — saia e crie de novo para jogar online');
      Auth.signOut(); goto('login'); return;
    }
    /* encerra qualquer busca antiga antes de trocar de modo — senão o
       `procurando` velho bloqueava a busca nova (e a fila do modo
       anterior ficava com o jogador anunciado). */
    if(procurando){ try{ Net.leaveQueue({uid:u.uid}, modo); }catch(e){} }
    procurando=false; clearInterval(timerId); clearFila();
    modo=m; meuTime=null;
    if(m==='ranked'){
      // RANQUEADA: sem montagem prévia — o time sai do draft, depois de parear
      goto('matchmaking');
      procurar();
      return;
    }
    // CASUAL: monta o time antes de entrar na fila, como sempre foi
    TurnUI.abrirMontagem({ online:true });
  }

  /* ---------- 2) CASUAL: time montado → entra na fila ---------- */
  async function comTime(ids){
    if(!ids || ids.length!==3) return;
    meuTime=ids.slice();
    goto('matchmaking');
    await procurar();
  }

  /* ---------- 3) matchmaking ---------- */
  async function procurar(){
    if(procurando) return;               // dois cliques não abrem duas buscas
    procurando=true; inicio=Date.now();
    const st=document.getElementById('mm-status');
    const sub=document.getElementById('mm-sub');
    const tempo=document.getElementById('mm-time');
    st.textContent='Procurando adversário…';
    const linha = (modo==='ranked'?'🏆 RANQUEADA · draft ao vivo':'🎲 CASUAL · 3x3 por turnos')+
      ' · '+(Net.kind()==='firebase'?'servidor online':'modo local');
    sub.textContent = linha;
    /* quantos estão na fila AGORA. Se aparece "2 na fila" e mesmo assim
       nada acontece, o problema é pareamento; se aparece "1 na fila", o
       outro jogador simplesmente não está aqui. Antes não dava para
       saber qual dos dois era. */
    clearFila();
    offFila = Net.observarFila(modo, n=>{
      if(!procurando || !sub) return;
      sub.textContent = linha + ' · ' + n + ' na fila';
    });
    clearInterval(timerId);
    timerId=setInterval(()=>{
      if(!tempo) return;
      const s=Math.floor((Date.now()-inicio)/1000);
      tempo.textContent = s+'s';
      /* a faixa de rating alarga sozinha (ver net.js) — avisa o jogador
         em vez de deixar a tela parecer travada. */
      if(modo==='ranked' && st && procurando)
        st.textContent = s>60 ? 'Procurando… (aceitando qualquer rating)'
                     : s>20 ? 'Procurando… (ampliando a faixa de rating)'
                            : 'Procurando adversário…';
    },500);

    let perfil={ uid:'?', nick:'Lutador', rating:1000, time:meuTime };
    try{
      const p=await Ranked.profile();
      const u=Auth.user();
      perfil={ uid:u.uid, nick:(p&&p.nick)||u.nick, rating:(p&&p.rating)||Ranked.START,
               time:meuTime };
    }catch(e){ const u=Auth.user(); perfil.uid=u.uid; perfil.nick=u.nick; }

    meuPerfil=perfil;
    try{
      const r=await Net.joinQueue(perfil, modo);
      if(!procurando) return;                 // cancelou no meio
      procurando=false; sala=r;
      clearInterval(timerId); clearFila();
      st.textContent='Adversário encontrado!';
      sub.textContent = (r.opponent&&r.opponent.nick||'Oponente') +
        (modo==='ranked' && r.opponent && r.opponent.rating? ' · '+Ranked.tier(r.opponent.rating).label : '');
      setTimeout(()=>iniciarPartida(), 900);
    }catch(e){
      clearInterval(timerId); clearFila();
      if(!procurando) return;                 // erro de "cancelei": a tela já saiu daqui
      procurando=false;
      st.textContent='Não deu para procurar: '+e.message;
    }
  }

  function clearFila(){ if(offFila){ try{ offFila(); }catch(e){} offFila=null; } }

  function cancelar(){
    procurando=false; clearInterval(timerId); clearFila();
    /* sai da fila DE VERDADE: o leaveQueue novo também aborta a espera
       pendente do joinQueue (senão o ciclo de tentativa continuava
       rodando em segundo plano e o jogador podia ser pareado depois de
       já ter voltado para o menu). */
    try{ const u=Auth.user(); if(u) Net.leaveQueue({uid:u.uid}, modo); }catch(e){}
    goto('online');
  }

  /* ---------- 4) partida ---------- */
  function iniciarPartida(){
    if(!sala) return;
    /* confiavel:true = fica no relay do servidor em vez de promover para
       P2P. No jogo por turnos (draft OU batalha) cada mensagem é uma
       jogada: perder uma trava a partida, então não vale a pena
       arriscar o P2P aqui. */
    chan = Net.canal(sala.roomId, sala.role, { confiavel: true });
    anunciarAoVivo();
    if(ehRanqueada()) iniciarDraft();
    else iniciarBatalha3x3();
  }

  /* RANQUEADA: draft ao vivo antes da batalha — ver js/turndraft.js.
     Quem resolve as regras do draft também é o ANFITRIÃO. */
  function iniciarDraft(){
    const opp=sala.opponent||{};
    TurnDraft.iniciar({
      chan, role:sala.role,
      oponente:{ nick:opp.nick||'Adversário', rating:opp.rating||Ranked.START },
      onCompleto:(meuTimeDraft, timeDeleDraft)=>{
        meuTime = meuTimeDraft;
        iniciarBatalha3x3(timeDeleDraft);
      }
    });
  }

  /* batalha 3x3 por turnos (casual ou ranqueada — depois do draft).
     Quem resolve as regras é o ANFITRIÃO (ver js/turnonline.js). */
  function iniciarBatalha3x3(timeDeleOverride){
    const opp=sala.opponent||{};
    // time do adversário: veio do draft (ranqueada) OU da fila, já
    // pré-escolhido (casual). Se faltar (perfil antigo), sorteia.
    let timeDele = timeDeleOverride ||
      (opp.time && opp.time.length===3 ? opp.time.slice() : null);
    const pool=Characters.jogaveis().map(c=>c.id);
    if(!timeDele) timeDele=[0,1,2].map(()=>pool[(Math.random()*pool.length)|0]);
    /* inimigo exclusivo do Modo História (robôs/sentinelas, `historia:true`)
       nunca entra em partida online — nem se um cliente desatualizado
       mandar um time com ele: troca por um personagem jogável sorteado. */
    const limpa = t => t.map(id => pool.indexOf(id)>=0 ? id : pool[(Math.random()*pool.length)|0]);
    timeDele = limpa(timeDele);
    meuTime = limpa(meuTime||[]);
    if(aoVivoId) Net.atualizarAoVivo(aoVivoId, { fase:'batalha', rodada:1, timeHost:meuTime, timeGuest:timeDele });
    TurnOnline.iniciar({
      chan, role:sala.role, meuTime:meuTime, timeDele:timeDele,
      oponente:{ nick:opp.nick||'Adversário', rating:opp.rating||Ranked.START },
      onFim:fimDaBatalha,
      onRodada:r=>{ if(aoVivoId) Net.atualizarAoVivo(aoVivoId, { rodada:r }); }
    });
    toast(sala.role==='host' ? 'Você é o anfitrião da sala' : 'Conectado à sala');
  }

  /* ---------- 5) fim ---------- */

  /* fim da batalha: só a RANQUEADA registra rating. A CASUAL só mostra
     o resultado (o placar já apareceu na própria tela de batalha). */
  async function fimDaBatalha(venceu, info){
    pararAoVivo();      // acabou: sai da lista na hora (quem assiste já viu o estado final)
    const cx=document.getElementById('bt-rating');
    if(!ehRanqueada()){
      if(cx) cx.textContent='Partida casual — sem alteração de rating.';
      return;
    }
    try{
      const oppR=(sala&&sala.opponent&&sala.opponent.rating)||Ranked.START;
      const r=await Ranked.reportOnline(venceu, oppR, {
        modo:'ranked-3x3',
        adversarioNick:(sala&&sala.opponent&&sala.opponent.nick)||null,
        meuTime:(meuTime||[]).join(','),
        desistencia:!!(info&&info.desistencia) });
      if(r && cx){
        const t=Ranked.tier(r.depois), s=r.delta>=0?'+':'';
        cx.innerHTML = `<span style="color:${r.delta>=0?'#3bff9c':'#ff6b6b'}">RATING ${s}${r.delta}</span>`+
                       ` → <b style="color:${t.cor}">${t.label} (${r.depois})</b>`;
      }
      // skin nova desbloqueada nesta partida (ver Ranked.verificarSkins)
      if(r && r.skinsNovas && r.skinsNovas.length && typeof mostrarSkinPopup==='function'){
        r.skinsNovas.forEach(({charId, skin})=> mostrarSkinPopup(charId, skin));
      }
      Menu.atualizaBarra();
    }catch(e){ if(cx) cx.textContent='Não deu para registrar o rating.'; }
    // o canal continua aberto até o jogador clicar em VOLTAR (para o
    // outro lado receber o "saiu" só quando a partida realmente fechar)
  }

  /* volta da batalha (ou do draft, se cair no meio) para o menu online */
  function voltar(){ limpar(); goto('online'); }

  /* MODO ESPECTADOR: só a RANQUEADA aparece na lista, e só o ANFITRIÃO
     anuncia (uma entrada por partida, não duas). host = time 'aliado'
     do motor, guest = 'inimigo' — quem assiste usa isso pra pôr cada
     nome do lado certo do palco. */
  function anunciarAoVivo(){
    if(!ehRanqueada() || !sala || sala.role!=='host') return;
    const opp=sala.opponent||{}, eu=meuPerfil||{};
    aoVivoId=sala.roomId;
    Net.anunciarAoVivo(aoVivoId, {
      modo:'ranked', fase:'draft', rodada:0, inicio:Date.now(),
      host:{ nick:eu.nick||'Lutador', rating:eu.rating||Ranked.START },
      guest:{ nick:opp.nick||'Adversário', rating:opp.rating||Ranked.START }
    });
  }
  function pararAoVivo(){
    if(!aoVivoId) return;
    try{ Net.removerAoVivo(aoVivoId); }catch(e){}
    aoVivoId=null;
  }

  function limpar(){
    pararAoVivo();
    procurando=false; clearInterval(timerId); clearFila();
    try{ const u=Auth.user(); if(u) Net.leaveQueue({uid:u.uid}, modo); }catch(e){}
    try{ TurnDraft.encerrar(); }catch(e){}
    try{ TurnOnline.encerrar(); }catch(e){}
    if(chan){ try{ chan.leaveRoom(); }catch(e){} chan=null; }
    sala=null;
  }

  return { escolherModo, comTime, procurar, cancelar, voltar,
           ehRanqueada, estado, limpar,
           get modo(){ return modo; } };
})();
