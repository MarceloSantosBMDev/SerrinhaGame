/* ============================================================
   DRAFT DA RANQUEADA — só existe no modo online RANQUEADO.
   ------------------------------------------------------------
   Duas fases:
     1) BANIMENTO — cada jogador bane UM personagem do jogo (os dois
        bans somem do pool pros DOIS lados, mesmo que banido só por um).
     2) ESCOLHA — os dois escolhem UM personagem por vez, alternando
        (quem começa é sorteado) — e quem um lado pega fica
        indisponível para o outro (sem repetir personagem entre os
        dois times).

   Mesma AUTORIDADE DO ANFITRIÃO do resto do 3x3 online (ver
   js/turnonline.js): só o HOST decide se uma escolha/banimento vale e
   manda o estado inteiro pro convidado a cada mudança — assim uma
   mensagem perdida se conserta sozinha no próximo pacote, em vez de
   travar o draft pra sempre.

   Mensagens (via chan.sendEvent/onEvent — canal livre, não usado
   pela batalha em si):
     host  -> guest  { tipo:'draft_estado', fase, banidos, pool, picks, vez, acabou }
     guest -> host   { tipo:'draft_banir', charId, n, r }
     guest -> host   { tipo:'draft_escolha', charId, n, r }
     guest -> host   { tipo:'draft_oi' }                (pede reenvio)
   ============================================================ */
const TurnDraft = (function(){

  let chan=null, papel=null, ativo=false, onCompleto=null, oponente=null;
  let fase='banimento', banidos=null, pool=[], picks=null, vez=null, acabou=false;
  let seq=0, ultimoRecebido=null;
  let batidaId=null, pingId=null, recebiAlgum=false, ultimoEstadoEm=0;
  let acaoPendente=null, tentativas=0, reenvioId=null;
  let t=0;

  function meuLado(){ return papel==='host' ? 'aliado' : 'inimigo'; }
  function ladoDele(){ return papel==='host' ? 'inimigo' : 'aliado'; }
  function minhaVez(){ return ativo && fase==='escolha' && !acabou && vez===meuLado(); }
  function jaBani(){ return !!(banidos && banidos[meuLado()]); }

  /* ============================================================
     INÍCIO
     ============================================================ */
  function iniciar(opts){
    chan=opts.chan; papel=opts.role; onCompleto=opts.onCompleto||null; oponente=opts.oponente||null;
    ativo=true; fase='banimento'; banidos={ aliado:null, inimigo:null }; acabou=false; seq=0; ultimoRecebido=null;
    recebiAlgum=false; ultimoEstadoEm=0; acaoPendente=null; tentativas=0;
    clearInterval(batidaId); batidaId=null; clearInterval(pingId); pingId=null; clearTimeout(reenvioId);

    goto('draft');
    /* a tela é dividida com o MODO CONDENAÇÃO (js/condenacao.js), que troca
       título/fala/botões — volta tudo pro jeito da ranqueada */
    const tt=document.getElementById('draft-titulo'); if(tt) tt.textContent='🏆 DRAFT — RANQUEADA';
    const fl=document.getElementById('draft-fala'); if(fl) fl.textContent='';
    const ac=document.getElementById('draft-acoes'); if(ac) ac.innerHTML='';

    if(papel==='host'){
      pool = Characters.jogaveis().map(c=>c.id);
      picks = { aliado:[], inimigo:[] };
      vez = null;   // sorteado só quando a fase de banimento acabar
      render();
      chan.onEvent(receberDoConvidado);
      broadcast();
      /* re-anúncio periódico: mesma ideia da "batida do anfitrião" da
         batalha — se o convidado perder um pacote, o próximo o corrige. */
      batidaId=setInterval(()=>{
        if(!ativo){ clearInterval(batidaId); batidaId=null; return; }
        if(acabou) return;
        broadcast();
      }, 2500);
    } else {
      pool=[]; picks={ aliado:[], inimigo:[] }; vez=null;
      renderEsperando();
      chan.onEvent(receberDoHost);
      pingId=setInterval(()=>{
        if(!ativo){ clearInterval(pingId); pingId=null; return; }
        if(recebiAlgum && Date.now()-ultimoEstadoEm<3000) return;
        try{ chan.sendEvent({ tipo:'draft_oi' }); }catch(e){}
      }, 1200);
    }

    chan.onOpponentLeft(()=>{
      if(!ativo) return;               // draft já terminou (a batalha cuida disso agora)
      ativo=false;
      toast('O adversário saiu durante o draft');
      Online.voltar();
    });
  }

  function encerrar(){
    ativo=false; clearTimeout(reenvioId);
    clearInterval(batidaId); batidaId=null; clearInterval(pingId); pingId=null;
    acaoPendente=null; chan=null; papel=null; onCompleto=null;
  }

  /* ============================================================
     HOST — aplica banimentos/escolhas e manda o estado inteiro
     ============================================================ */
  function broadcast(){
    try{ chan.sendEvent({ tipo:'draft_estado', n:++seq, fase,
      banidos:{ aliado:banidos.aliado||null, inimigo:banidos.inimigo||null },
      pool:pool.slice(), picks:{ aliado:picks.aliado.slice(), inimigo:picks.inimigo.slice() }, vez, acabou }); }catch(e){}
    render();
  }

  function receberDoConvidado(m){
    if(!ativo || !m || papel!=='host') return;
    if(m.tipo==='draft_oi'){ broadcast(); return; }

    if(m.tipo==='draft_banir'){
      if(fase!=='banimento' || banidos.inimigo){ broadcast(); return; } // fora de hora/já baniu: corrige
      if(m.n!=null && m.n===ultimoRecebido) return;                    // reenvio: já apliquei
      ultimoRecebido=m.n;
      aplicarBanimento('inimigo', m.charId);
      return;
    }

    if(m.tipo!=='draft_escolha' || acabou || fase!=='escolha') return;
    if(m.n!=null && m.n===ultimoRecebido) return;   // reenvio: já apliquei
    if(vez!=='inimigo' || pool.indexOf(m.charId)<0){ broadcast(); return; } // fora de hora/repetido: corrige
    ultimoRecebido=m.n;
    aplicarEscolha('inimigo', m.charId);
  }

  function aplicarBanimento(lado, charId){
    banidos[lado] = charId;
    if(banidos.aliado && banidos.inimigo){
      // os dois bans já vieram — monta o pool definitivo e começa a escolha
      pool = Characters.jogaveis().map(c=>c.id).filter(id => id!==banidos.aliado && id!==banidos.inimigo);
      picks = { aliado:[], inimigo:[] };
      fase = 'escolha';
      vez = Math.random()<0.5 ? 'aliado' : 'inimigo';
    }
    broadcast();
  }

  function aplicarEscolha(lado, charId){
    pool.splice(pool.indexOf(charId), 1);
    picks[lado].push(charId);
    vez = (vez==='aliado') ? 'inimigo' : 'aliado';
    acabou = picks.aliado.length>=3 && picks.inimigo.length>=3;
    if(acabou) vez=null;
    broadcast();
    if(acabou) terminar();
  }

  /* ============================================================
     CONVIDADO — só manda pedido de banimento/escolha e desenha o
     que chega
     ============================================================ */
  function receberDoHost(s){
    if(!ativo || !s || papel==='host') return;
    if(s.n!=null && s.n===ultimoRecebido) return;
    ultimoRecebido=s.n; recebiAlgum=true; ultimoEstadoEm=Date.now();
    /* o RTDB APAGA valor vazio/null na escrita (um campo null ou um
       array vazio somem do pacote inteiro) — por isso NUNCA dá pra
       confiar em "s.x || fallback" no objeto INTEIRO: cada CHAVE
       interna precisa do próprio fallback. */
    fase = s.fase || 'banimento';
    banidos = { aliado:(s.banidos&&s.banidos.aliado)||null, inimigo:(s.banidos&&s.banidos.inimigo)||null };
    pool=s.pool||[];
    picks={ aliado:(s.picks&&s.picks.aliado)||[], inimigo:(s.picks&&s.picks.inimigo)||[] };
    vez=s.vez; acabou=!!s.acabou;
    if(acaoPendente){
      const confirmado = acaoPendente.tipo==='draft_banir'
        ? banidos[meuLado()]===acaoPendente.charId
        : (pool.indexOf(acaoPendente.charId)<0 || acabou);
      if(confirmado){ acaoPendente=null; clearTimeout(reenvioId); }
    }
    render();
    if(acabou) terminar();
  }

  function banir(charId){
    if(fase!=='banimento' || jaBani()) return;
    if(papel==='host'){ aplicarBanimento('aliado', charId); return; }
    mandar({ tipo:'draft_banir', charId });
  }

  function escolher(charId){
    if(!minhaVez()) return;
    if(pool.indexOf(charId)<0) return;
    if(papel==='host'){ aplicarEscolha('aliado', charId); return; }
    mandar({ tipo:'draft_escolha', charId });
  }

  function mandar(acao){
    acao.n=++seq; acaoPendente=acao; tentativas=0;
    disparar();
  }
  function disparar(){
    if(!ativo || !acaoPendente) return;
    acaoPendente.r=tentativas;
    try{ chan.sendEvent(acaoPendente); }catch(e){}
    clearTimeout(reenvioId); tentativas++;
    reenvioId=setTimeout(disparar, tentativas<3? 700 : 1500);
  }

  /* ============================================================
     FIM DO DRAFT — cada lado já sabe o PRÓPRIO time e o do rival
     (o objeto `picks` foi espelhado pros dois durante o draft todo)
     ============================================================ */
  function terminar(){
    if(!onCompleto) return;
    const cb=onCompleto; onCompleto=null;   // não chama duas vezes
    const meuTime = picks[meuLado()].slice(), timeDele = picks[ladoDele()].slice();
    setTimeout(()=>cb(meuTime, timeDele), 500);   // deixa o jogador ver os dois times prontos por um instante
  }

  /* ============================================================
     DESENHO
     ============================================================ */
  function chipsHTML(ids){
    ids = ids||[];
    const slots=[0,1,2].map(i=>{
      const id=ids[i];
      if(!id) return `<div class="draft-chip vazio">?</div>`;
      const c=Characters.byId(id);
      return `<div class="draft-chip"><canvas width="52" height="52" data-chip="${id}"></canvas><span>${c?c.name:id}</span></div>`;
    });
    return slots.join('');
  }
  function banChipHTML(id){
    if(!id) return `<div class="draft-chip vazio">?</div>`;
    const c=Characters.byId(id);
    return `<div class="draft-chip banido"><canvas width="52" height="52" data-chip="${id}"></canvas><span>${c?c.name:id}</span></div>`;
  }

  function renderEsperando(){
    const grid=document.getElementById('draft-grid'); if(grid) grid.innerHTML='';
    const st=document.getElementById('draft-status');
    if(st) st.textContent='Conectando com o adversário…';
  }

  function render(){
    if(fase==='banimento') renderBanimento();
    else renderEscolha();
  }

  function renderBanimento(){
    const st=document.getElementById('draft-status');
    const nomeDele=document.getElementById('draft-nome-dele');
    if(nomeDele) nomeDele.textContent = (oponente&&oponente.nick? oponente.nick.toUpperCase() : 'ADVERSÁRIO');
    const euBani = jaBani(), eleBani = !!banidos[ladoDele()];
    if(st){
      st.innerHTML = !euBani
        ? '🚫 <b>Escolha um personagem para BANIR</b> — ele some do jogo pros dois lados nesta partida'
        : (eleBani ? '🚫 Banimentos definidos — preparando o draft…' : '🚫 Banimento enviado — esperando o adversário banir…');
    }
    const meu=document.getElementById('draft-meu'); if(meu) meu.innerHTML=banChipHTML(banidos[meuLado()]);
    const dele=document.getElementById('draft-dele'); if(dele) dele.innerHTML=banChipHTML(banidos[ladoDele()]);

    const grid=document.getElementById('draft-grid');
    if(grid){
      grid.innerHTML='';
      Characters.jogaveis().forEach(c=>{
        const cell=document.createElement('div');
        const clicavel = !euBani;
        cell.className='char-cell draft-cell'+(banidos[meuLado()]===c.id?' p1':'')+
          (banidos[ladoDele()]===c.id?' p2':'')+(clicavel?' clicavel':' indisponivel');
        const cv=document.createElement('canvas'); cv.width=170; cv.height=170; cv.dataset.id=c.id; cell.appendChild(cv);
        const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=c.name; cell.appendChild(nm);
        const tg=document.createElement('div'); tg.className='char-tag';
        tg.textContent = banidos[meuLado()]===c.id? '🚫 seu banimento' : (banidos[ladoDele()]===c.id? '🚫 banido pelo rival' : '');
        cell.appendChild(tg);
        if(clicavel) cell.onclick=()=>banir(c.id);
        grid.appendChild(cell);
      });
    }
  }

  function renderEscolha(){
    const st=document.getElementById('draft-status');
    const nomeDele=document.getElementById('draft-nome-dele');
    if(nomeDele) nomeDele.textContent = (oponente&&oponente.nick? oponente.nick.toUpperCase() : 'ADVERSÁRIO');
    if(st){
      st.innerHTML = acabou
        ? '✅ Draft completo — preparando a batalha…'
        : (minhaVez()
            ? '<b>Sua vez</b> — escolha um lutador'
            : `Vez de <b>${(oponente&&oponente.nick)||'adversário'}</b> escolher…`);
    }
    const meu=document.getElementById('draft-meu'); if(meu) meu.innerHTML=chipsHTML(picks[meuLado()]);
    const dele=document.getElementById('draft-dele'); if(dele) dele.innerHTML=chipsHTML(picks[ladoDele()]);

    const grid=document.getElementById('draft-grid');
    if(grid){
      grid.innerHTML='';
      Characters.jogaveis().forEach(c=>{
        const banido = banidos.aliado===c.id || banidos.inimigo===c.id;
        if(banido) return;   // banido nem aparece mais na fase de escolha
        const disponivel = pool.indexOf(c.id)>=0;
        const peguei = picks[meuLado()].indexOf(c.id)>=0;
        const peguiuEle = picks[ladoDele()].indexOf(c.id)>=0;
        const cell=document.createElement('div');
        cell.className='char-cell draft-cell'+(!disponivel?' indisponivel':'')+(peguei?' p1':'')+(peguiuEle?' p2':'')+
          (minhaVez()&&disponivel?' clicavel':'');
        const cv=document.createElement('canvas'); cv.width=170; cv.height=170; cv.dataset.id=c.id; cell.appendChild(cv);
        const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=c.name; cell.appendChild(nm);
        const tg=document.createElement('div'); tg.className='char-tag';
        tg.textContent = peguei? '✅ seu time' : peguiuEle? '🚫 time dele' : (disponivel? '' : '—');
        cell.appendChild(tg);
        if(minhaVez() && disponivel) cell.onclick=()=>escolher(c.id);
        grid.appendChild(cell);
      });
    }
  }

  /* ============================================================
     ANIMAÇÃO — mesmo padrão do catálogo/montagem: idle em loop
     enquanto a tela de draft estiver ativa
     ============================================================ */
  function loop(){
    t++;
    const tela=document.getElementById('screen-draft');
    if(tela && tela.classList.contains('active')){
      document.querySelectorAll('#draft-grid canvas, .draft-chip canvas').forEach(cv=>{
        const id=cv.dataset.id||cv.dataset.chip;
        const c=id&&Characters.byId(id); if(!c) return;
        Sprites.renderTo(cv, c, 'idle', cv.width>=170?2.4:1.0, t);
      });
    }
    requestAnimationFrame(loop);
  }
  loop();   // roda a vida toda da página, igual ao loopBatalha() do turnui.js — só desenha quando a tela está ativa

  return { iniciar, encerrar, get ativo(){ return ativo; } };
})();
