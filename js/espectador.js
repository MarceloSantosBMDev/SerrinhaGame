/* ============================================================
   MODO ESPECTADOR — assistir ranqueadas ao vivo
   ------------------------------------------------------------
   · LISTA (`screen-aovivo`): ouve o índice público `aoVivo` (ver
     net.js) — quem está jogando, rating, fase (draft/batalha), rodada.
     Não precisa de conta: a leitura é pública nas regras do banco.
   · ASSISTIR: usa a MESMA tela de batalha do 3x3 (TurnUI) em modo
     só-leitura. Não roda motor nenhum: desenha o estado que o
     anfitrião já grava em `salas/<id>/snap` a cada jogada, igual o
     convidado da partida faz (TurnOnline.hidratar). Enquanto a partida
     ainda está no draft, mostra os banimentos e as escolhas ao vivo.
   · O espectador nunca ESCREVE nada na sala: não tem como interferir
     na partida, nem atrasar quem está jogando.
   ============================================================ */
const Espectador = (function(){

  let offLista=null, offSala=null;
  let lista={};
  let salaId=null, info=null, ultimoN=null, viuBatalha=false;

  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nomeChar = id => { const c=Characters.byId(id); return c? c.name : id; };

  /* ---------------- LISTA ---------------- */
  function abrirLista(){
    pararSala();
    goto('aovivo');
    pararLista();
    const box=document.getElementById('aovivo-lista');
    if(box) box.innerHTML='<div class="av-vazio">Procurando partidas…</div>';
    const sub=document.getElementById('aovivo-sub');
    if(sub) sub.textContent = Net.kind()==='firebase'
      ? 'Ranqueadas acontecendo agora — qualquer um pode assistir.'
      : 'Modo local: só aparecem partidas abertas neste navegador.';
    offLista = Net.observarAoVivo(v=>{ lista=v||{}; renderLista(); });
  }
  function pararLista(){ if(offLista){ try{ offLista(); }catch(e){} offLista=null; } }

  function tempoDesde(ts){
    const s=Math.max(0, Math.floor((Date.now()-(ts||Date.now()))/1000));
    return s<60 ? s+'s' : Math.floor(s/60)+' min';
  }
  function jogadorHTML(j){
    j=j||{};
    const t = (typeof Ranked!=='undefined' && j.rating) ? Ranked.tier(j.rating) : null;
    return `<span class="av-nick">${esc(j.nick||'?')}</span>`+
      (t? `<span class="av-tier" style="color:${t.cor}">${esc(t.label)} · ${j.rating|0}</span>` : '');
  }
  function timeHTML(ids){
    return (ids&&ids.length) ? `<span class="av-time">${ids.map(id=>esc(nomeChar(id))).join(' · ')}</span>` : '';
  }

  function renderLista(){
    const box=document.getElementById('aovivo-lista');
    if(!box) return;
    const ids=Object.keys(lista).sort((a,b)=>(lista[b].inicio||0)-(lista[a].inicio||0));
    if(!ids.length){
      box.innerHTML='<div class="av-vazio">Nenhuma ranqueada rolando agora.<br>Volte daqui a pouco — a lista atualiza sozinha.</div>';
      return;
    }
    box.innerHTML = ids.map(id=>{
      const p=lista[id];
      const fase = p.fase==='batalha' ? `⚔ Rodada ${p.rodada||1}` : '🎯 Draft';
      return `<div class="av-item">`+
        `<div class="av-lados">`+
          `<div class="av-lado">${jogadorHTML(p.host)}${timeHTML(p.timeHost)}</div>`+
          `<div class="av-vs">VS</div>`+
          `<div class="av-lado">${jogadorHTML(p.guest)}${timeHTML(p.timeGuest)}</div>`+
        `</div>`+
        `<div class="av-rodape"><span class="av-fase"><i class="av-live"></i>AO VIVO · ${fase} · ${tempoDesde(p.inicio)}</span>`+
        `<button class="btn-mini" data-sala="${esc(id)}">👁 ASSISTIR</button></div>`+
      `</div>`;
    }).join('');
    box.querySelectorAll('button[data-sala]').forEach(b=>{ b.onclick=()=>assistir(b.dataset.sala); });
  }

  /* ---------------- ASSISTIR ---------------- */
  function assistir(id){
    const p=lista[id]; if(!p) return;
    pararLista(); pararSala();
    salaId=id; info=p; ultimoN=null; viuBatalha=false;
    TurnUI.iniciarEspectador({ nomes:{ aliado:(p.host&&p.host.nick)||'Anfitrião',
                                       inimigo:(p.guest&&p.guest.nick)||'Convidado' } });
    if(p.fase!=='batalha') TurnUI.mostrarDraftEspectador('<div class="bt-vez">🎯 Draft em andamento…</div>');
    offSala = Net.assistir(id, { onSnap:receberEstado, onEvent:receberEvento, onFim:receberFim });
  }

  function receberEstado(s){
    if(!salaId || !s || !s.aliado) return;          // snapshot do 1x1 (a/b) não é desta tela
    if(s.n!=null && s.n===ultimoN) return;
    ultimoN=s.n; viuBatalha=true;
    if(s.cenario && (!TurnBG.atual || TurnBG.atual.id!==s.cenario)) TurnBG.usar(s.cenario);
    else if(!s.cenario && !TurnBG.atual) TurnBG.sortear();
    const st=TurnOnline.hidratar(s);
    TurnUI.quandoLivre(()=>{ if(salaId) TurnUI.aplicarEstado(st); });
  }

  /* `salas/<id>/ev` é o canal do DRAFT (os dois lados escrevem nele);
     só o estado completo que o anfitrião espalha interessa aqui. */
  function receberEvento(m){
    if(!salaId || viuBatalha || !m || m.tipo!=='draft_estado') return;
    const nomes={ aliado:(info.host&&info.host.nick)||'Anfitrião', inimigo:(info.guest&&info.guest.nick)||'Convidado' };
    const picks=m.picks||{aliado:[],inimigo:[]}, ban=m.banidos||{};
    const linha = lado =>
      `<div class="av-draft-lado"><b>${esc(nomes[lado])}</b>`+
      (ban[lado]? ` <span class="av-ban">🚫 ${esc(nomeChar(ban[lado]))}</span>` : '')+
      `<div>${(picks[lado]||[]).map(id=>esc(nomeChar(id))).join(' · ') || '<i>ainda sem escolhas</i>'}</div></div>`;
    const vez = m.acabou ? 'Draft fechado — a batalha vai começar!'
      : m.fase==='banimento' ? 'Fase de banimento…'
      : m.vez ? 'Vez de escolher: '+esc(nomes[m.vez]) : 'Draft em andamento…';
    TurnUI.mostrarDraftEspectador(`<div class="bt-vez">🎯 ${vez}</div>`+linha('aliado')+linha('inimigo'));
  }

  function receberFim(){
    if(!salaId) return;
    TurnUI.quandoLivre(()=>TurnUI.fimEspectador('Um dos jogadores saiu da partida.'));
  }

  function pararSala(){
    if(offSala){ try{ offSala(); }catch(e){} offSala=null; }
    if(salaId) TurnUI.sairEspectador();
    salaId=null; info=null;
  }

  function voltarLista(){ abrirLista(); }
  function sair(){ pararSala(); pararLista(); goto('menu'); }

  return { abrirLista, pararLista, assistir, voltarLista, sair, pararSala,
           get assistindo(){ return !!salaId; } };
})();
