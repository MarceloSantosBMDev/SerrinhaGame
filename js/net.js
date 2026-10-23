/* ============================================================
   REDE — matchmaking + canal de partida.

   Dois transportes com a MESMA interface:
     · LoopbackTransport  → dois jogadores no mesmo navegador,
       com latência simulada. Serve para testar tudo sem servidor.
     · RtdbTransport      → Firebase Realtime Database (produção).
       Usa RTDB (e não Firestore) porque luta precisa de latência
       baixa e muitas mensagens pequenas — no Firestore ficaria
       caro e lento.

   Interface:
     joinQueue(perfil, modo) -> Promise<{roomId, role, opponent}>
     leaveQueue()
     sendInput(obj)      guest -> host   (o que o jogador apertou)
     sendSnapshot(obj)   host  -> guest  (estado autoritativo)
     onInput(cb) / onSnapshot(cb) / onOpponentLeft(cb)
     leaveRoom()
   ============================================================ */
const Net = (function(){

  let transport = null;
  function setTransport(t){ transport = t; }
  function get(){ return transport || Loopback; }
  function kind(){ return (transport && transport.nome) || 'local'; }

  /* ================= LOOPBACK (teste / treino) =================
     Simula dois clientes ligados por um cabo com atraso.        */
  const Loopback = (function(){
    const fila = [];                 // quem está esperando
    const salas = {};                // roomId -> {host, guest, listeners}
    let latencia = 60;               // ms simulados de ida

    function setLatencia(ms){ latencia = Math.max(0, ms|0); }

    function sala(id){
      if(!salas[id]) salas[id]={ id, inputs:[], snaps:[], left:[], fechada:false, espect:[], ultimoSnap:null };
      return salas[id];
    }
    const aoVivo = {};               // roomId -> resumo da partida (modo espectador)
    const obsAoVivo = [];
    function avisarAoVivo(){ obsAoVivo.forEach(cb=>entrega(cb, Object.assign({}, aoVivo))); }
    function entrega(fn, dado){ setTimeout(()=>{ try{ fn(dado); }catch(e){} }, latencia); }

    function joinQueue(perfil, modo){
      return new Promise(resolve=>{
        const eu={ perfil, modo, resolve };
        // procura alguém compatível (mesmo modo)
        const i = fila.findIndex(x=>x.modo===modo && x.perfil.uid!==perfil.uid);
        if(i>=0){
          const outro = fila.splice(i,1)[0];
          const roomId = 'sala_'+Math.random().toString(36).slice(2,9);
          sala(roomId);
          // quem estava esperando vira HOST
          outro.resolve({ roomId, role:'host',  opponent:perfil });
          resolve({      roomId, role:'guest', opponent:outro.perfil });
        } else {
          fila.push(eu);   // espera
        }
      });
    }
    function leaveQueue(perfil){
      const i=fila.findIndex(x=>perfil && x.perfil.uid===perfil.uid);
      if(i>=0) fila.splice(i,1);
    }

    function canal(roomId, role){
      const s=sala(roomId);
      const cbs={ input:null, snap:null, left:null };
      const api={
        sendInput(o){ if(s.fechada) return; const t=salas[roomId]; if(t&&t._onInput) entrega(t._onInput,o); },
        sendSnapshot(o){ if(s.fechada) return; const t=salas[roomId]; if(t&&t._onSnap) entrega(t._onSnap,o);
                         s.ultimoSnap=o; s.espect.forEach(e=>e.snap && entrega(e.snap,o)); },
        onInput(cb){ cbs.input=cb; s._onInput=cb; },
        onSnapshot(cb){ cbs.snap=cb; s._onSnap=cb; },
        sendEvent(o){ const t=salas[roomId]; const alvo = role==='host'? t&&t._onEv_guest : t&&t._onEv_host;
                      const m=Object.assign({de:role}, o);
                      if(alvo) entrega(alvo, m);
                      s.espect.forEach(e=>e.ev && entrega(e.ev, m)); },
        onEvent(cb){ s['_onEv_'+role]=cb; },
        onOpponentLeft(cb){ cbs.left=cb; s['_onLeft_'+role]=cb; },
        leaveRoom(){
          s.fechada=true;
          const outro = role==='host'? s._onLeft_guest : s._onLeft_host;
          if(outro) entrega(outro,{});
          s.espect.forEach(e=>e.fim && entrega(e.fim,{quem:role}));
        }
      };
      return api;
    }
    function observarFila(modo, cb){
      const id=setInterval(()=>cb(fila.filter(x=>x.modo===modo).length), 700);
      cb(fila.filter(x=>x.modo===modo).length);
      return ()=>clearInterval(id);
    }

    /* ---- modo espectador (só funciona dentro do mesmo navegador) ---- */
    function anunciarAoVivo(roomId, info){ aoVivo[roomId]=Object.assign({ts:Date.now()}, info); avisarAoVivo(); }
    function atualizarAoVivo(roomId, patch){
      if(!aoVivo[roomId]) return;
      Object.assign(aoVivo[roomId], patch, {ts:Date.now()}); avisarAoVivo();
    }
    function removerAoVivo(roomId){ if(aoVivo[roomId]){ delete aoVivo[roomId]; avisarAoVivo(); } }
    function observarAoVivo(cb){
      obsAoVivo.push(cb); entrega(cb, Object.assign({}, aoVivo));
      return ()=>{ const i=obsAoVivo.indexOf(cb); if(i>=0) obsAoVivo.splice(i,1); };
    }
    function assistir(roomId, cbs){
      const s=sala(roomId), e={ snap:cbs.onSnap, ev:cbs.onEvent, fim:cbs.onFim };
      s.espect.push(e);
      if(s.ultimoSnap && e.snap) entrega(e.snap, s.ultimoSnap);
      if(s.fechada && e.fim) entrega(e.fim, {});
      return ()=>{ const i=s.espect.indexOf(e); if(i>=0) s.espect.splice(i,1); };
    }

    return { nome:'local', joinQueue, leaveQueue, canal, setLatencia, observarFila,
             anunciarAoVivo, atualizarAoVivo, removerAoVivo, observarAoVivo, assistir,
             _fila:()=>fila.length, _reset(){ fila.length=0; for(const k in salas) delete salas[k]; } };
  })();

  /* ================= WEBRTC P2P (baixa latência de verdade) =================
     Ideia: o Firebase só serve para os dois navegadores trocarem o
     "endereço" (offer/answer/ICE) UMA VEZ, no início da partida — isso
     é sinalização, não tem pressa. Depois disso, os pacotes de jogo
     (input/snapshot) trafegam DIRETO entre os dois navegadores, sem
     passar pelo servidor. É a única forma de sair da casa dos 100ms+
     que o relay por servidor sempre vai ter: aqui o atraso passa a
     ser só a distância física entre os dois jogadores.

     unordered + sem retransmissão (like UDP): um pacote perdido não
     trava a fila esperando reenvio — o próximo snapshot já corrige.  */
  function makeWebrtcLayer(rtdb, fns){
    const { ref, set, onValue, remove, push, onChildAdded } = fns;
    const ICE_SERVERS = [
      { urls:'stun:stun.l.google.com:19302' },
      { urls:'stun:stun1.l.google.com:19302' }
    ];

    function abrirCanal(roomId, role){
      return new Promise((resolve)=>{
       try{
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        const sigBase = 'sinal/'+roomId;
        let dc=null, aberto=false, offs=[];
        const cbs={ input:null, snap:null, ev:null, left:null };

        function pronto(){
          if(aberto) return; aberto=true;
          resolve({
            nome:'webrtc-p2p',
            pronto:true,
            /* BUG QUE DERRUBAVA O ONLINE INTEIRO:
               estava `enviaSeguro(o.__k='i')` — uma atribuição vale o
               valor atribuído, então o que ia pela rede era a STRING
               'i', não o objeto. O outro lado recebia "i", não achava
               `__k` e descartava em silêncio. Resultado: assim que a
               conexão direta subia, NENHUMA jogada do convidado chegava
               (na ranqueada 3x3 e na luta 1x1). */
            sendInput(o){ o.__k='i'; enviaSeguro(o); },
            sendSnapshot(o){ o.__k='s'; enviaSeguro(o); },
            sendEvent(o){ o.__k='e'; enviaSeguro(Object.assign({de:role},o)); },
            onInput(cb){ cbs.input=cb; },
            onSnapshot(cb){ cbs.snap=cb; },
            onEvent(cb){ cbs.ev=cb; },
            onOpponentLeft(cb){ cbs.left=cb; },
            leaveRoom(){
              try{ dc && dc.readyState==='open' && dc.send(JSON.stringify({__k:'bye'})); }catch(e){}
              offs.forEach(f=>{try{f();}catch(e){}});
              try{ pc.close(); }catch(e){}
              try{ remove(ref(rtdb, sigBase)); }catch(e){}
            }
          });
          function enviaSeguro(o){ if(dc && dc.readyState==='open'){ try{ dc.send(JSON.stringify(o)); }catch(e){} } }
        }

        function ligaCanal(canal){
          dc=canal;
          dc.onmessage = e=>{
            let m; try{ m=JSON.parse(e.data); }catch(err){ return; }
            if(m.__k==='i' && cbs.input) cbs.input(m);
            else if(m.__k==='s' && cbs.snap) cbs.snap(m);
            else if(m.__k==='e' && cbs.ev) cbs.ev(m);
            else if(m.__k==='bye' && cbs.left) cbs.left({webrtc:true});
          };
          dc.onopen = pronto;
        }

        // toda chamada ao RTDB aqui é "melhor esforço": se a sinalização
        // falhar por qualquer motivo (regras, rede, permissão), o pior
        // caso é não promover para P2P — nunca deixar uma promise solta.
        function seguro(promessa){ Promise.resolve(promessa).catch(()=>{}); }

        pc.onicecandidate = e=>{
          if(e.candidate) seguro(push(ref(rtdb, sigBase+'/ice_'+role), e.candidate.toJSON()));
        };

        if(role==='host'){
          dc = pc.createDataChannel('luta', { ordered:false, maxRetransmits:0 });
          ligaCanal(dc);
          pc.createOffer().then(off=>pc.setLocalDescription(off)).then(()=>{
            seguro(set(ref(rtdb, sigBase+'/offer'), { sdp:pc.localDescription.sdp, type:pc.localDescription.type }));
          }).catch(()=>resolve(null));
          offs.push(onValue(ref(rtdb, sigBase+'/answer'), s=>{
            const a=s.val(); if(a && !pc.currentRemoteDescription) pc.setRemoteDescription(a).catch(()=>{});
          }, ()=>resolve(null)));
        } else {
          pc.ondatachannel = e=>ligaCanal(e.channel);
          offs.push(onValue(ref(rtdb, sigBase+'/offer'), async s=>{
            const o=s.val(); if(!o || pc.currentRemoteDescription) return;
            try{
              await pc.setRemoteDescription(o);
              const ans=await pc.createAnswer(); await pc.setLocalDescription(ans);
              seguro(set(ref(rtdb, sigBase+'/answer'), { sdp:ans.sdp, type:ans.type }));
            }catch(e){ resolve(null); }
          }, ()=>resolve(null)));
        }
        // troca de candidatos ICE do outro lado
        const ladoAlheio = role==='host' ? 'guest' : 'host';
        onChildAdded(ref(rtdb, sigBase+'/ice_'+ladoAlheio), s=>{
          const c=s.val(); if(c) pc.addIceCandidate(c).catch(()=>{});
        }, ()=>resolve(null));

        // timeout de segurança: se não conectar em 6s, desiste (cai pro relay)
        setTimeout(()=>{ if(!aberto) resolve(null); }, 6000);
       }catch(e){ resolve(null); }   // WebRTC indisponível/bloqueado -> cai pro relay
      });
    }
    return { abrirCanal };
  }

  /* ================= FIREBASE RTDB (produção) =================
     Preenchido por js/firebase-init.js quando a config existir.  */
  function makeRtdbTransport(rtdb, fns){
    const { ref, set, get:rget, push, onValue, onChildAdded, remove, update, serverTimestamp, onDisconnect, runTransaction } = fns;

    /* ============================================================
       MATCHMAKING — por que a fila vivia "com dois na fila e ninguém
       pareando".

       O desenho antigo era de UMA TENTATIVA SÓ: quem entrava e não
       achava ninguém se anunciava na fila e ficava DORMINDO para sempre
       esperando um convite. Isso quebra em quatro situações reais, e
       todas terminam igual (os dois esperando um ao outro):

       1. `onDisconnect(meuRef).remove()` — o RTDB derruba e reconecta o
          socket sozinho o tempo todo (troca de rede, aba em segundo
          plano, wi-fi oscilando). Quando isso acontece o SERVIDOR
          executa o onDisconnect e APAGA minha entrada da fila. Eu
          continuo dormindo achando que estou na fila, mas para todo
          mundo que chega depois a fila está vazia. Era o caso mais
          comum: os dois "na fila", nenhum dos dois visível.
       2. cancelar → procurar de novo: o `remove()` do cancelamento era
          disparado sem await. Se ele chegasse ao servidor DEPOIS da
          transação da nova busca, apagava a entrada nova — de novo,
          jogador invisível esperando para sempre.
       3. convite velho: `convites/<uid>` nunca era limpo quando a
          partida era abandonada antes de começar. Na busca seguinte o
          `onValue` disparava na hora com o convite morto e o jogador
          entrava numa sala de uma partida que não existe mais, enquanto
          o adversário de verdade ficava sozinho na fila.
       4. faixa de rating fixa em ±350: dois jogadores de verdade a 400
          pontos de distância NUNCA se achavam, e a tela só dizia
          "procurando…" para sempre.

       O desenho novo é de TENTATIVA REPETIDA (a fila vira uma coisa
       viva): a cada 2,5s eu reexecuto a mesma transação, que ao mesmo
       tempo (a) me reanuncia caso minha entrada tenha sumido, (b)
       renova meu `ts`, (c) varre o lixo e (d) tenta reivindicar alguém —
       com a faixa de rating ALARGANDO conforme o tempo passa. Um estado
       perdido deixa de ser fatal: no pior caso o par sai 2,5s depois.  */
    /* 45s e não 20s: um navegador com a aba em SEGUNDO PLANO estrangula
       o setTimeout (chega a 1x por minuto), então quem deixou o jogo
       procurando em outra aba renova o `ts` bem mais devagar. Ele
       continua recebendo convite normalmente (o RTDB avisa mesmo em
       segundo plano) — só não pode ser varrido como lixo antes disso. */
    const VALIDADE_FILA   = 45000;   // entrada sem renovar há 45s = jogador que sumiu
    const VALIDADE_CONVITE= 90000;   // convite mais velho que isso é de uma partida abandonada
    const RETENTAR        = 2500;    // ritmo da nova tentativa

    let esperaAtiva = null;          // {cancelar()} da busca em andamento

    function cancelarEspera(){
      const e=esperaAtiva; esperaAtiva=null;
      if(e) try{ e.cancelar(); }catch(err){}
    }

    /* faixa de rating aceita AGORA. Começa apertada (partida justa) e
       vai abrindo — depois de 1 minuto procurando, qualquer adversário
       é melhor que adversário nenhum. */
    function janelaRating(modo, esperandoMs){
      if(modo!=='ranked') return Infinity;
      if(esperandoMs > 60000) return Infinity;
      return 350 + Math.floor(esperandoMs/10000)*250;      // 350 → 600 → 850 …
    }

    async function joinQueue(perfil, modo){
      const filaRef    = ref(rtdb, 'fila/'+modo);
      const meuRef     = ref(rtdb, 'fila/'+modo+'/'+perfil.uid);
      const conviteRef = ref(rtdb, 'convites/'+perfil.uid);
      const inicio     = Date.now();

      cancelarEspera();
      /* AWAIT de propósito nos dois: garante que nenhuma limpeza de uma
         busca anterior chegue ao servidor depois da minha entrada nova
         (era a causa nº 2 lá de cima). */
      try{ await remove(meuRef); }catch(e){}
      try{ await remove(conviteRef); }catch(e){}

      /* `time` = os TRÊS lutadores (casual). Vai na fila para o
         adversário já saber contra quem vai jogar antes da sala abrir.
         Na ranqueada é null: o time sai do draft, depois de parear. */
      function meuInfo(){
        return { nick:perfil.nick, rating:perfil.rating||1000, charId:perfil.charId||null,
                 time:perfil.time||null, ts:Date.now() };
      }

      /* uma rodada da transação. Devolve a sala se conseguiu reivindicar
         alguém, ou null se só me (re)anunciei na fila.                 */
      async function tentar(){
        const limite = janelaRating(modo, Date.now()-inicio);
        let decisao=null, candUid=null, candInfo=null;

        const resTx = await runTransaction(filaRef, (atual)=>{
          atual = atual || {};
          decisao=null; candUid=null; candInfo=null;    // reseta a cada retentativa da transação
          const agora=Date.now();

          // 1) copia só quem ainda está vivo (a varredura do lixo)
          const novo={};
          for(const u in atual){
            const e=atual[u];
            if(!e || u===perfil.uid) continue;          // a minha entrada é reescrita abaixo
            if(agora-(e.ts||0) > VALIDADE_FILA) continue;
            novo[u]=e;
          }

          // 2) o candidato mais ANTIGO que couber na faixa (quem espera
          //    há mais tempo joga primeiro — e sendo determinístico,
          //    dois jogadores nunca "escolhem" parceiros diferentes)
          const alvo = Object.keys(novo)
            .filter(u => Math.abs((novo[u].rating||1000)-(perfil.rating||1000)) <= limite)
            .sort((a,b)=>(novo[a].ts||0)-(novo[b].ts||0))[0];

          if(alvo){
            decisao='claimed'; candUid=alvo; candInfo=novo[alvo];
            delete novo[alvo];
            /* saio da fila junto: como agora eu também fico anunciado
               enquanto espero, se eu ficasse na fila depois de convidar
               alguém um TERCEIRO jogador poderia me reivindicar e eu
               acabaria em duas salas ao mesmo tempo. */
            return novo;
          }
          decisao='waiting';
          novo[perfil.uid]=meuInfo();
          return novo;
        });

        if(!resTx || !resTx.committed) return null;
        if(decisao!=='claimed') return null;

        const roomId  = 'sala_'+Math.random().toString(36).slice(2,9);
        const euInfo  = { uid:perfil.uid, nick:perfil.nick, rating:perfil.rating||1000,
                          charId:perfil.charId||null, time:perfil.time||null };
        const eleInfo = { uid:candUid, nick:candInfo.nick, rating:candInfo.rating||1000,
                          charId:candInfo.charId||null, time:candInfo.time||null };
        await set(ref(rtdb,'salas/'+roomId+'/info'), { criadaEm:Date.now(), modo, host:eleInfo, guest:euInfo });
        await set(ref(rtdb,'convites/'+candUid), { roomId, modo, oponente:euInfo, ts:Date.now() });
        return { roomId, role:'guest', opponent:eleInfo };
      }

      try{ onDisconnect(meuRef).remove(); }catch(e){}

      return await new Promise((resolve, reject)=>{
        let off=null, timer=null, pronto=false;

        function limpar(){
          if(off){ try{ off(); }catch(e){} off=null; }
          clearTimeout(timer); timer=null;
          if(esperaAtiva===quem) esperaAtiva=null;
        }
        function terminar(sala){ if(pronto) return; pronto=true; limpar(); resolve(sala); }
        function falhar(err){ if(pronto) return; pronto=true; limpar(); reject(err); }

        const quem = { cancelar(){ if(pronto) return;
                                   try{ remove(meuRef); }catch(e){}
                                   falhar(new Error('busca cancelada')); } };
        esperaAtiva = quem;

        // (a) alguém me convidou
        off = onValue(conviteRef, s=>{
          const c=s.val(); if(!c || pronto) return;
          // convite fóssil de uma partida abandonada: joga fora e continua na fila
          if(Date.now()-(c.ts||0) > VALIDADE_CONVITE){ try{ remove(conviteRef); }catch(e){} return; }
          try{ remove(conviteRef); }catch(e){}
          try{ remove(meuRef); }catch(e){}
          terminar({ roomId:c.roomId, role:'host', opponent:c.oponente });
        }, e=>falhar(e));

        // (b) eu procuro — para sempre, a cada 2,5s, alargando a faixa
        let primeira=true;
        (function ciclo(){
          if(pronto) return;
          tentar().then(sala=>{
            if(pronto) return;
            if(sala){ terminar(sala); return; }
            primeira=false;
            timer=setTimeout(ciclo, RETENTAR);
          }).catch(e=>{
            /* uma transação pode falhar por rede/regra. Só desiste se
               foi logo na primeira: no meio da fila, tentar de novo em
               2,5s é sempre melhor que derrubar a busca do jogador. */
            if(primeira) falhar(e);
            else if(!pronto) timer=setTimeout(ciclo, RETENTAR);
          });
        })();
      });
    }

    async function leaveQueue(perfil, modo){
      cancelarEspera();
      try{ await remove(ref(rtdb,'fila/'+(modo||'casual')+'/'+(perfil&&perfil.uid))); }catch(e){}
    }

    /* canal() é síncrono na interface antiga (Net.canal), mas para o
       WebRTC precisamos negociar antes de poder falar. Então: devolvemos
       na hora um canal de RELAY funcional, e por baixo dos panos tentamos
       trocar para P2P assim que a conexão direta ficar pronta — sem o
       jogo perceber a troca (mesmos métodos).                          */
    function canal(roomId, role, opts){
      opts = opts || {};
      const relay = canalRelay(roomId, role);
      /* opts.confiavel = batalha POR TURNOS.
         O canal P2P é aberto de propósito como "unreliable"
         (ordered:false, maxRetransmits:0) porque na luta 1x1 um pacote
         perdido é irrelevante — o próximo snapshot já corrige, 60 vezes
         por segundo. No 3x3 é o oposto: são poucas mensagens, cada uma
         é uma JOGADA, e perder uma trava o turno para sempre. Some-se
         a isso que o estado do 3x3 tem ~2 KB e é fragmentado pelo SCTP:
         basta um fragmento sumir e a mensagem inteira se perde.
         Por isso o modo por turnos fica no RELAY, que é confiável e se
         corrige sozinho. ~100ms de atraso não se percebe num turno. */
      if(opts.confiavel){
        console.info('[Arena] partida por turnos: canal CONFIÁVEL pelo servidor (sem P2P)');
        return relay;
      }
      try{
        const p2p = makeWebrtcLayer(rtdb, fns);
        p2p.abrirCanal(roomId, role).then(c=>{
          if(c){ relay._promoverPara(c); console.info('[Arena] conexão direta (P2P) estabelecida — latência mínima'); }
          else console.info('[Arena] P2P não conseguiu conectar (rede/NAT) — usando relay pelo servidor');
        }).catch(e=>{
          console.info('[Arena] P2P falhou ('+e.message+') — usando relay pelo servidor');
        });
      }catch(e){
        console.info('[Arena] WebRTC indisponível neste navegador — usando relay pelo servidor');
      }
      return relay;   // o jogo já pode falar por aqui imediatamente (relay funciona sempre)
    }

    function canalRelay(roomId, role){
      const base='salas/'+roomId;
      // REFS EM CACHE: criar ref() a cada envio custa caro quando são
      // 30 envios por segundo. Aqui cada caminho é resolvido uma vez só.
      const R = {
        snap:  ref(rtdb, base+'/snap'),
        input: ref(rtdb, base+'/input'),
        ev:    ref(rtdb, base+'/ev'),      // eventos avulsos (soco, skill) — vão na hora
        saiu:  ref(rtdb, base+'/saiu')
      };
      const meu   = role==='host' ? R.snap  : R.input;
      const outro = role==='host' ? R.input : R.snap;
      let offs=[];
      let ultimoEnvio=0, pendente=null, agendado=null;
      let p2pAtivo=null;         // quando promovido, os envios passam a ir por aqui
      const cbs={ input:null, snap:null, ev:null, left:null };

      /* escrita "fire and forget": não esperamos o await do Firebase,
         senão o jogo trava esperando a confirmação do servidor.       */
      function escreve(r, dado){
        try{
          const p = set(r, dado);
          /* antes o erro era engolido: um permission_denied nas regras
             do banco fazia a partida travar sem UMA pista no console. */
          if(p && p.catch) p.catch(e=>console.warn('[Arena] não consegui enviar:', e.code||e.message));
        }catch(e){ console.warn('[Arena] não consegui enviar:', e.message); }
      }

      /* junta envios muito próximos (coalescing) para não estourar a
         banda, mas sem passar de ~8ms de espera.
         Ao juntar dois pacotes de input, as teclas apertadas precisam
         SOMAR (senão um soco apertado no meio do caminho se perde).  */
      function funde(velho, novo){
        if(!velho) return novo;
        if(!novo.fila && !velho.fila) return novo;
        return { held: novo.held || velho.held,
                 fila: (velho.fila||[]).concat(novo.fila||[]),
                 dash: novo.dash || velho.dash };
      }

      function envia(dado){
        const agora=performance.now();
        pendente = (role==='guest') ? funde(pendente, dado) : dado;
        if(agora-ultimoEnvio >= 8){
          ultimoEnvio=agora; const d=pendente; pendente=null;
          escreve(meu, d);
        } else if(!agendado){
          agendado=setTimeout(()=>{
            agendado=null;
            if(pendente){ ultimoEnvio=performance.now(); const d=pendente; pendente=null; escreve(meu,d); }
          }, 8);
        }
      }

      const api = {
        sendInput(o){ if(p2pAtivo) p2pAtivo.sendInput(o); else if(role==='guest') envia(o); },
        sendSnapshot(o){ if(p2pAtivo) p2pAtivo.sendSnapshot(o); else if(role==='host') envia(o); },
        /* evento instantâneo: não espera o próximo tick */
        sendEvent(o){ if(p2pAtivo) p2pAtivo.sendEvent(o); else escreve(R.ev, Object.assign({de:role, n:(Math.random()*1e9)|0}, o)); },
        onInput(cb){ cbs.input=cb; if(p2pAtivo) p2pAtivo.onInput(cb); else offs.push(onValue(outro, s=>{ if(role==='host'){ const v=s.val(); if(v) cb(v); } })); },
        onSnapshot(cb){ cbs.snap=cb; if(p2pAtivo) p2pAtivo.onSnapshot(cb); else offs.push(onValue(outro, s=>{ if(role==='guest'){ const v=s.val(); if(v) cb(v); } })); },
        onEvent(cb){ cbs.ev=cb; if(p2pAtivo) p2pAtivo.onEvent(cb); else offs.push(onValue(R.ev, s=>{ const v=s.val(); if(v && v.de!==role) cb(v); })); },
        onOpponentLeft(cb){ cbs.left=cb; if(p2pAtivo) p2pAtivo.onOpponentLeft(cb); offs.push(onValue(R.saiu, s=>{ if(s.val()) cb(s.val()); })); },
        leaveRoom(){
          if(agendado) clearTimeout(agendado);
          if(p2pAtivo) try{ p2pAtivo.leaveRoom(); }catch(e){}
          escreve(R.saiu, {quem:role, ts:Date.now()});
          offs.forEach(f=>{ try{ f(); }catch(e){} }); offs=[];
        },
        /* troca por baixo dos panos para o canal P2P, sem o jogo perceber */
        _promoverPara(p2p){
          p2pAtivo=p2p;
          if(cbs.input) p2p.onInput(cbs.input);
          if(cbs.snap)  p2p.onSnapshot(cbs.snap);
          if(cbs.ev)    p2p.onEvent(cbs.ev);
          if(cbs.left)  p2p.onOpponentLeft(m=>cbs.left(m));
        },
        get modo(){ return p2pAtivo? 'p2p' : 'relay'; }
      };
      return api;
    }
    /* quantos jogadores VIVOS estão na fila deste modo. Serve para a
       tela de matchmaking dizer "1 de 2 na fila" em vez de só girar um
       spinner mudo — quando o pareamento demora, saber se tem gente do
       outro lado é metade do diagnóstico. Devolve a função que desliga. */
    function observarFila(modo, cb){
      try{
        return onValue(ref(rtdb,'fila/'+modo), s=>{
          const v=s.val()||{}, agora=Date.now();
          cb(Object.keys(v).filter(u=>agora-((v[u]&&v[u].ts)||0) <= VALIDADE_FILA).length);
        }, ()=>{});
      }catch(e){ return function(){}; }
    }

    /* ============================================================
       MODO ESPECTADOR
       `aoVivo/<roomId>` é o ÍNDICE público das ranqueadas em andamento
       (quem joga, fase, rodada). Quem escreve é só o ANFITRIÃO; o
       onDisconnect apaga a entrada se ele cair sem fechar a partida.
       Assistir não precisa de nada novo do lado de quem joga: o host já
       grava o estado INTEIRO da batalha em `salas/<id>/snap` (relay
       confiável, ver canal()) e o draft passa por `salas/<id>/ev` — o
       espectador só OUVE esses caminhos, nunca escreve. Leitura pública
       nas regras (database.rules.json), então nem precisa de conta.
       ============================================================ */
    const VALIDADE_AO_VIVO = 2*60*60*1000;   // entrada "ao vivo" de 2h atrás = lixo de host que sumiu

    function anunciarAoVivo(roomId, info){
      const r=ref(rtdb, 'aoVivo/'+roomId);
      try{ onDisconnect(r).remove(); }catch(e){}
      set(r, Object.assign({}, info, { ts:Date.now() })).catch(e=>console.warn('[Arena] ao vivo:', e.code||e.message));
    }
    function atualizarAoVivo(roomId, patch){
      update(ref(rtdb, 'aoVivo/'+roomId), Object.assign({}, patch, { ts:Date.now() })).catch(()=>{});
    }
    function removerAoVivo(roomId){
      const r=ref(rtdb, 'aoVivo/'+roomId);
      try{ onDisconnect(r).cancel(); }catch(e){}
      remove(r).catch(()=>{});
    }
    function observarAoVivo(cb){
      try{
        return onValue(ref(rtdb, 'aoVivo'), s=>{
          const v=s.val()||{}, agora=Date.now(), out={};
          Object.keys(v).forEach(id=>{ if(v[id] && agora-(v[id].inicio||0) < VALIDADE_AO_VIVO) out[id]=v[id]; });
          cb(out);
        }, e=>{ console.warn('[Arena] não deu para ler as partidas ao vivo:', e.code||e.message); cb({}); });
      }catch(e){ cb({}); return function(){}; }
    }
    function assistir(roomId, cbs){
      const base='salas/'+roomId, offs=[];
      const ouvir=(p, fn)=>{ try{ offs.push(onValue(ref(rtdb, base+'/'+p), s=>{ const v=s.val(); if(v) fn(v); }, ()=>{})); }catch(e){} };
      if(cbs.onSnap)  ouvir('snap', cbs.onSnap);
      if(cbs.onEvent) ouvir('ev',   cbs.onEvent);
      if(cbs.onFim)   ouvir('saiu', cbs.onFim);
      return ()=>offs.forEach(f=>{ try{ f(); }catch(e){} });
    }

    return { nome:'firebase', joinQueue, leaveQueue, canal, observarFila,
             anunciarAoVivo, atualizarAoVivo, removerAoVivo, observarAoVivo, assistir };
  }

  return {
    setTransport, get, kind, Loopback, makeRtdbTransport,
    anunciarAoVivo:(id,i)=>get().anunciarAoVivo(id,i),
    atualizarAoVivo:(id,p)=>get().atualizarAoVivo(id,p),
    removerAoVivo:(id)=>get().removerAoVivo(id),
    observarAoVivo:(cb)=>get().observarAoVivo(cb),
    assistir:(id,cbs)=>get().assistir(id,cbs),
    joinQueue:(p,m)=>get().joinQueue(p,m),
    leaveQueue:(p,m)=>get().leaveQueue&&get().leaveQueue(p,m),
    observarFila:(m,cb)=>{ const t=get(); return t.observarFila? t.observarFila(m,cb) : function(){}; },
    canal:(r,role,opts)=>get().canal(r,role,opts)
  };
})();
