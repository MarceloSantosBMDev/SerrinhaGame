/* ============================================================
   INTERFACE DO MODO 3x3 POR TURNOS
   - montagem do time (escolher 3)
   - tela de batalha: unidades, barras, ordem de turno, skills, log
   - ANIMAÇÃO das ações: o lutador atravessa a tela, bate no alvo,
     solta o efeito e volta para o lugar
   - leitura completa de cada golpe (descrição + etiquetas) sem
     precisar sair da batalha
   ============================================================ */
const TurnUI = (function(){

  let meuTime=[];       // ids escolhidos
  let skillEscolhida=null;
  let animId=null, t=0;

  /* CONTROLE DA PARTIDA
     null            = batalha local contra a IA (o jogador é o 'aliado')
     {online:true..} = ranqueada online: quem resolve as jogadas é o
                       TurnOnline, e o MEU lado pode ser o 'inimigo' do
                       motor (quando eu sou o convidado da sala).      */
  let ctrl=null;
  let montagemOnline=false;      // a montagem de time leva para a fila?
  /* MODO SOBREVIVÊNCIA: time sorteado, contra times sorteados um atrás do
     outro, até perder. `streak` é quantos times já caíram; `processado`
     evita contar a mesma vitória/derrota duas vezes (render() é chamado
     de novo a cada repintura da tela de fim); `pronto` só liga depois que
     o recorde termina de gravar (evita mostrar um número velho). */
  let survival=null;
  let ultimaHistoria=null;      // último encontro do Modo História (para "TENTAR DE NOVO")
  let estadoAtual=null;          // último estado desenhado (local OU recebido)
  let aviso=null;                // "enviando jogada…" e afins

  function meuLado(){ return ctrl? ctrl.meuLado : 'aliado'; }
  function ladoDele(){ return meuLado()==='aliado'? 'inimigo':'aliado'; }
  /* espectador nunca joga: com isto falso, nenhum botão de golpe aparece
     e escolherSkill/defender/clique em alvo já recusam sozinhos. */
  /* enterrado (Toca do Verme) também não é "minha vez": o turno dele é só
     sair da terra, e quem faz isso é o motor, sozinho. */
  function minhaVez(st){ return !!(st && st.atual && !st.acabou && !(ctrl && ctrl.espectador) &&
                                   !st.atual.enterrado && st.atual.time===meuLado()); }
  // nick vem de outro jogador (rede): nunca entra cru no innerHTML
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function nomeDoLado(lado){ return (ctrl && ctrl.nomes && ctrl.nomes[lado]) || (lado==='aliado'?'Anfitrião':'Convidado'); }
  /* qual skill está com o alvo pendente, já na forma atual */
  function skillPendente(st){
    if(skillEscolhida==null || !st || !st.atual) return null;
    return TurnBattle.skillEfetiva(st.atual, skillEscolhida) || null;
  }
  // o beijo da Loirinha mira em ALIADO: quem fica clicável é o meu lado
  function mirandoAliado(st){ const s=skillPendente(st); return !!(s && s.alvo==='aliado'); }
  // BIZARRICE (Adulto Feliz) mira em QUALQUER UM — os dois lados ficam clicáveis
  function mirandoQualquer(st){ const s=skillPendente(st); return !!(s && s.alvo==='qualquer'); }
  /* a skill pendente aceita alvo NESTE lado? ('meu'/'dele' na visão de
     quem está jogando — não confundir com aliado/inimigo do motor). */
  function aceitaLado(st, ehMeuLado){
    if(mirandoQualquer(st)) return true;
    return ehMeuLado ? mirandoAliado(st) : !mirandoAliado(st);
  }
  /* procura a unidade no ESTADO desenhado, não no motor: online o
     convidado não roda motor nenhum, só recebe estado pronto. */
  function unidadeDe(uid){
    if(!estadoAtual) return null;
    return estadoAtual.times.aliado.concat(estadoAtual.times.inimigo).find(u=>u.id===uid)||null;
  }

  /* ---------------- montar time ---------------- */
  function abrirMontagem(opts){
    opts=opts||{};
    montagemOnline=!!opts.online;
    /* opts.time = time já escolhido (o NPC do hub pode mandar um time
       sorteado pronto para o jogador só conferir e confirmar). */
    meuTime=(opts.time||[]).slice(0,3); skillEscolhida=null;
    goto('team');
    renderMontagem();
    if(animId) cancelAnimationFrame(animId);
    animarMontagem();
  }

  function renderMontagem(){
    const grid=document.getElementById('team-grid');
    grid.innerHTML='';
    Characters.jogaveis().forEach(c=>{
      const f=TurnData.ficha(c.id); if(!f) return;
      const escolhido=meuTime.indexOf(c.id);
      const cell=document.createElement('div');
      cell.className='team-cell'+(escolhido>=0?' escolhido':'');
      const p=TurnData.passiva(f.passiva);
      cell.innerHTML=
        `<canvas width="120" height="120" data-id="${c.id}"></canvas>`+
        (escolhido>=0? `<div class="team-num">${escolhido+1}</div>`:'')+
        `<div class="team-nome">${c.name}</div>`+
        `<div class="team-stats">❤${f.hp} ⚔${f.atk} 🛡${f.def} 💨${f.spd}</div>`+
        `<div class="team-passiva">${p.icone} ${p.nome}</div>`;
      cell.onclick=()=>alternar(c.id);
      grid.appendChild(cell);
    });
    document.getElementById('team-count').textContent=meuTime.length+'/3';
    const btn=document.getElementById('team-start');
    btn.disabled = meuTime.length!==3;
    btn.classList.toggle('off', meuTime.length!==3);
    btn.textContent = montagemOnline? '🔎 PROCURAR ADVERSÁRIO' : 'COMEÇAR BATALHA';
    const tit=document.getElementById('team-titulo');
    /* quem monta time aqui é o CASUAL — a ranqueada vai direto para a
       fila e monta o time no draft. O título dizia "RANQUEADA" para os
       dois e confundia quem entrava pelo casual. */
    if(tit) tit.textContent = !montagemOnline ? '⚔ MONTE SEU TIME'
      : ((typeof Online!=='undefined' && Online.modo==='ranked') ? '🏆 RANQUEADA — MONTE SEU TIME'
                                                                 : '🎲 CASUAL ONLINE — MONTE SEU TIME');
    // detalhes do último escolhido
    if(meuTime.length) mostrarFicha(meuTime[meuTime.length-1]);
  }

  function alternar(id){
    const i=meuTime.indexOf(id);
    if(i>=0) meuTime.splice(i,1);
    else if(meuTime.length<3) meuTime.push(id);
    else return;
    renderMontagem();
  }

  function mostrarFicha(id){
    const c=Characters.byId(id), f=TurnData.ficha(id);
    const p=TurnData.passiva(f.passiva);
    document.getElementById('team-info').innerHTML=
      `<div class="ti-head"><b>${c.name}</b> — ${p.icone} <span class="ti-pass">${p.nome}</span></div>`+
      `<div class="ti-passdesc">${p.desc}</div>`+
      `<div class="ti-skills">`+ f.skills.map((s,i)=>{
        const tp=TurnData.tipo(s.tipo);
        return `<div class="ti-sk"><b>${s.icone||''} ${s.nome}</b>`+
               `<span class="ti-tipo" style="color:${tp.cor}">${tp.icone} ${tp.nome}</span>`+
               `<span class="ti-cd">${s.cd? 'recarga '+s.cd:'sem recarga'}</span>`+
               `<i>${s.desc||''}</i>`+
               `<span class="ti-tags">${etiquetasHTML(s)}</span></div>`;
      }).join('')+`</div>`;
  }

  function animarMontagem(){
    t++;
    document.querySelectorAll('#team-grid canvas').forEach(cv=>{
      const c=Characters.byId(cv.dataset.id); if(!c) return;
      Sprites.renderTo(cv, Characters.charComSkin(c), 'idle', 2.0, t, 0);
    });
    animId=requestAnimationFrame(animarMontagem);
  }

  function comecar(){
    if(meuTime.length!==3) return;
    if(animId){ cancelAnimationFrame(animId); animId=null; }
    // ranqueada: em vez de lutar contra a IA, vai para a fila online
    if(montagemOnline){ Online.comTime(meuTime.slice()); return; }
    const inimigos=timeAleatorio();
    prepararTela(null);
    TurnBG.sortear();
    TurnBattle.setEspera(animando);          // a IA espera a animação acabar
    TurnBattle.iniciar(meuTime, inimigos, render);
  }

  /* atalho do hub: já entra na batalha contra a IA com um time pronto,
     sem passar pela tela de montagem. */
  function lutarComTime(ids){
    if(!ids || ids.length!==3) return;
    montagemOnline=false;
    meuTime=ids.slice();
    comecar();
  }

  /* o VOLTAR da montagem depende de onde o jogador entrou:
     pelo menu (3x3 contra a IA) ou pela ranqueada online. */
  function sairMontagem(){
    if(animId){ cancelAnimationFrame(animId); animId=null; }
    goto(montagemOnline? 'online' : 'menu');
    montagemOnline=false;
  }

  /* 3 ids sorteados do elenco inteiro (repete se faltar personagem) —
     mesma lógica que já existia solta dentro de comecar() para o time
     inimigo da luta contra IA; virou função para servir também o time
     do JOGADOR e os adversários da sobrevivência. */
  function timeAleatorio(){
    const todos=Characters.jogaveis().map(c=>c.id);
    const pool=todos.slice().sort(()=>Math.random()-0.5);
    const time=[];
    while(time.length<3) time.push(pool[time.length % pool.length]);
    return time;
  }

  /* ============================================================
     MODO SOBREVIVÊNCIA — time sorteado, times inimigos sorteados um
     atrás do outro, até perder (ou até o jogador decidir parar). O
     RECORDE (maior sequência) fica salvo no perfil (Ranked.reportSurvival).
     ============================================================ */
  function iniciarSurvival(){
    montagemOnline=false;
    meuTime=timeAleatorio();          // o time do jogador é sorteado UMA vez e some com ele a corrida inteira
    survival={ streak:0, processado:false, pronto:false, recorde:null, anterior:0, bateuRecorde:false };
    proximaLutaSurvival();
  }

  function proximaLutaSurvival(){
    survival.processado=false; survival.pronto=false;
    const inimigos=timeAleatorio();
    prepararTela({ survival:true, meuLado:'aliado' });
    TurnBG.sortear();
    TurnBattle.setEspera(animando);
    TurnBattle.iniciar(meuTime, inimigos, render);
  }

  function continuarSurvival(){
    if(!survival) return;
    proximaLutaSurvival();
  }

  /* jogador para por vontade própria (sem ter perdido) — a sequência
     ainda vale para o recorde, senão "parar no auge" nunca compensaria. */
  function sairSurvival(){
    const s=survival;
    survival=null;
    if(s) Ranked.reportSurvival(s.streak).catch(()=>{});
    goto('menu');
  }

  /* tela de fim de rodada dentro da sobrevivência — chamada de dentro do
     render() normal quando `st.acabou` e `ctrl.survival`. */
  function renderFimSurvival(box, venci, st){
    if(!survival.processado){
      survival.processado=true;
      if(venci){
        survival.streak++;
      } else {
        Ranked.reportSurvival(survival.streak).then(r=>{
          if(r){ survival.recorde=r.recorde; survival.anterior=r.anterior; survival.bateuRecorde=r.bateuRecorde; }
          else { survival.recorde=survival.streak; }
          survival.pronto=true;
          render(st);
        }).catch(()=>{ survival.recorde=survival.streak; survival.pronto=true; render(st); });
      }
    }
    if(venci){
      box.innerHTML=`<div class="bt-fim">🏆 VITÓRIA!</div>`+
        `<div class="bt-vez">Sequência: <b>${survival.streak}</b> ${survival.streak===1?'time derrubado':'times derrubados'}</div>`+
        `<button class="btn-big" onclick="TurnUI.continuarSurvival()">⚔ PRÓXIMO TIME</button>`+
        `<button class="btn-big alt2" onclick="TurnUI.sairSurvival()">PARAR AQUI</button>`;
      return;
    }
    if(!survival.pronto){
      box.innerHTML=`<div class="bt-fim">💀 DERROTA</div>`+
        `<div class="bt-vez">Sequência final: <b>${survival.streak}</b></div>`+
        `<div class="bt-vez">salvando recorde…</div>`;
      return;
    }
    box.innerHTML=`<div class="bt-fim">💀 DERROTA</div>`+
      `<div class="bt-vez">Sequência final: <b>${survival.streak}</b> ${survival.streak===1?'time derrubado':'times derrubados'}</div>`+
      (survival.bateuRecorde
        ? `<div class="bt-dica">🎉 NOVO RECORDE! (antes: ${survival.anterior})</div>`
        : `<div class="bt-vez">Seu recorde: <b>${survival.recorde}</b></div>`)+
      `<button class="btn-big" onclick="goto('menu')">MENU</button>`;
  }

  /* ============================================================
     MODO HISTÓRIA (chamado pelo js/historia.js) — encontro ROTEIRIZADO:
     time do jogador e time inimigo são fixos (não sorteados), o cenário
     é o da cena (ex.: 'laboratorio') e o fim da luta chama de volta a
     cutscene em vez da tela padrão de "jogar de novo". `opts.formaInicial`
     repassa direto pro motor (Mecas já entra ciborgue, ver turnbattle.js).
     ============================================================ */
  function iniciarHistoria(idsAliados, idsInimigos, opts){
    opts=opts||{};
    montagemOnline=false;
    meuTime=idsAliados.slice();
    ultimaHistoria={ idsAliados, idsInimigos, opts };
    /* campanha da CONDENAÇÃO: `iaEsperta` = o bot do julgamento joga o
       lado inimigo; `juiza` = a rainha comenta a luta (ver falaJuiza) */
    prepararTela({ historia:true, meuLado:'aliado', titulo:opts.titulo||null,
                   aoFim:opts.aoFim||null, aoSair:opts.aoSair||null, textoSair:opts.textoSair||null,
                   juiza:!!opts.juiza, condHist:!!opts.iaEsperta });
    TurnBG.usar(opts.cenario||'laboratorio');
    TurnBattle.setEspera(animando);
    /* `botEsperto` = a mesma IA esperta, mas sem a Juíza nem a tela de veredito (mundo aberto) */
    TurnBattle.iniciar(idsAliados, idsInimigos, render,
      { formaInicial:opts.formaInicial||null, ajustes:opts.ajustes||null, iaEsperta:!!(opts.iaEsperta||opts.botEsperto) });
  }
  /* derrota → "VOLTAR ÀS FASES": devolve pra tela do capítulo, não pro menu */
  function sairHistoria(){
    const cb = ctrl && ctrl.aoSair;
    ctrl=null;
    if(cb) cb(); else goto('menu');
  }
  /* botão CONTINUAR da vitória: devolve o controle para js/historia.js
     (a cutscene de depois da luta), não para o menu direto. */
  function concluirHistoria(){
    const cb = ctrl && ctrl.aoFim;
    ctrl=null;
    if(cb) cb(); else goto('menu');
  }
  function repetirHistoria(){
    if(!ultimaHistoria){ goto('menu'); return; }
    iniciarHistoria(ultimaHistoria.idsAliados, ultimaHistoria.idsInimigos, ultimaHistoria.opts);
  }

  /* ============================================================
     MODO CONDENAÇÃO (chamado pelo js/condenacao.js depois do draft):
     você contra o BOT da rainha, no Salão do Trono, com a IA ESPERTA
     do motor do lado dele. Sem pontos — o fim só oferece outra rodada.
     ============================================================ */
  function iniciarCondenacao(idsJogador, idsBot){
    montagemOnline=false;
    meuTime=idsJogador.slice();
    prepararTela({ condenacao:true, juiza:true, meuLado:'aliado', titulo:'⚖ Condenação' });
    TurnBG.usar('castelo');
    TurnBattle.setEspera(animando);
    TurnBattle.iniciar(idsJogador, idsBot, render, { iaEsperta:true });
  }

  /* deixa a tela de batalha limpa para uma partida nova */
  function prepararTela(controle){
    ctrl=controle||null;
    goto('battle');
    anim=null; ultimoSeq=0; snapHP={}; estadoAtual=null; aviso=null;
    skillEscolhida=null; fecharFicha();
    hpPendente=[]; rodadaMostrada=0; fimFestejado=false;
    const jz=document.getElementById('bt-juiza'); if(jz){ jz.classList.remove('on'); clearTimeout(jz._t); }
    TurnBG.ligar(document.getElementById('bt-bg'));
    TurnFX.transicao();                      // a cortina abrindo em faixas diagonais
    if(typeof TurnGolpes!=='undefined') TurnGolpes.preload();   // os carros (Astra/Corsa) já baixando
  }

  /* ============================================================
     A JUÍZA COMENTA (Modo Condenação e a campanha da Condenação)
     A rainha Smergula fala por cima do palco nos momentos que importam:
     começo da luta, quando alguém cai, quando sai uma ultimate. Nunca
     duas falas coladas (espera ~3,5 s entre uma e outra).
     ============================================================ */
  const FALAS_JUIZA = {
    inicio:['Réu no banco. O bot do julgamento já sabe o seu primeiro golpe.',
            'Comece. Eu gosto de ver a esperança antes da sentença.',
            'Mostre o que aprendeu. Eu anoto tudo.',
            'Do meu trono eu vejo cada carta que você tem.'],
    matouSeu:['Um a menos.', 'Eu sabia que você ia deixar esse exposto.', 'Anotado na sua ficha.',
              'Cai um. Faltam dois.', 'Isso foi escolha sua, réu.'],
    perdeuDela:['Hmpf. Sorte.', 'Um peão. Eu tenho outros.', 'Isso não muda a sentença.',
                '...Interessante.', 'Não comemore ainda.'],
    ultDela:['Agora sim.', 'Sinta o peso da coroa.', 'Era isso que eu estava guardando.', 'Ajoelhe.'],
    ultSua:['Bonito. Inútil, mas bonito.', 'Gastou a sua melhor carta. E agora?', 'Eu esperava mais.'],
    absolvido:['Hmpf. Absolvido... por hoje.', 'Você escapou desta. Anotado.', 'O tribunal reconhece. A juíza, não.'],
    condenado:['Culpado. Volte quando aprender.', 'Condenado. Eu disse que ia acontecer.',
               'A sentença foi lida. Tente de novo... se tiver coragem.']
  };
  let juizaUltima=0;
  const sortear = lista => lista[(Math.random()*lista.length)|0];
  function falaJuiza(tipo, atraso){
    if(!ctrl || !ctrl.juiza || !FALAS_JUIZA[tipo]) return;
    const agora=performance.now();
    if(tipo!=='inicio' && agora-juizaUltima<3500) return;
    juizaUltima=agora;
    const c=ctrl, txt=sortear(FALAS_JUIZA[tipo]);
    setTimeout(()=>{ if(ctrl===c) mostrarJuiza(txt); }, atraso||0);
  }
  function mostrarJuiza(txt){
    const palco=document.getElementById('bt-palco'); if(!palco) return;
    let el=document.getElementById('bt-juiza');
    if(!el){
      el=document.createElement('div'); el.id='bt-juiza'; el.className='bt-juiza';
      el.innerHTML='<canvas width="40" height="40"></canvas><div class="bj-txt"><b>👑 A JUÍZA</b><span></span></div>';
    }
    if(el.parentElement!==palco) palco.appendChild(el);
    el.querySelector('span').textContent='"'+txt+'"';
    const smg=Characters.byId('smergula'); if(smg) Sprites.renderFace(el.querySelector('canvas'), smg);
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('on'), 3800);
  }

  /* ============================================================
     RANQUEADA ONLINE (chamado pelo TurnOnline)
     ============================================================ */
  function iniciarOnline(controle, opts){
    opts=opts||{};
    prepararTela(controle);
    if(opts.esperando){
      document.getElementById('bt-skills').innerHTML =
        '<div class="bt-vez">Conectando com o adversário…</div>';
      document.getElementById('bt-rodada').textContent='RANQUEADA';
    }
  }
  /* MODO ESPECTADOR (js/espectador.js): mesma tela da ranqueada, só que
     ninguém joga. `controle.nomes = {aliado, inimigo}` diz de quem é cada
     time (aliado = anfitrião, embaixo; inimigo = convidado, em cima). */
  function iniciarEspectador(controle){
    prepararTela(Object.assign({ espectador:true, meuLado:'aliado' }, controle||{}));
    document.getElementById('bt-skills').innerHTML =
      '<div class="bt-vez">👁 Conectando na partida…</div>'+
      '<button class="btn-big alt2" onclick="Espectador.sair()">SAIR</button>';
    document.getElementById('bt-rodada').textContent='👁 AO VIVO';
  }
  /* tela de espera enquanto a partida ainda está no DRAFT (sem batalha) */
  function mostrarDraftEspectador(html){
    if(!ctrl || !ctrl.espectador) return;
    document.getElementById('bt-skills').innerHTML = html +
      '<button class="btn-big alt2" onclick="Espectador.sair()">SAIR</button>';
  }
  function fimEspectador(msg){
    if(!ctrl || !ctrl.espectador) return;
    const box=document.getElementById('bt-skills');
    if(!box || (estadoAtual && estadoAtual.acabou)) return;   // já mostra o vencedor
    box.innerHTML=`<div class="bt-fim">📴 PARTIDA ENCERRADA</div>`+
      `<div class="bt-vez">${esc(msg||'Um dos jogadores saiu.')}</div>`+
      `<button class="btn-big" onclick="Espectador.voltarLista()">OUTRAS PARTIDAS</button>`+
      `<button class="btn-big alt2" onclick="Espectador.sair()">SAIR</button>`;
  }
  function sairEspectador(){ if(ctrl && ctrl.espectador) ctrl=null; }

  /* estado vindo de fora (host desenhando o próprio motor OU convidado
     desenhando o que chegou pela rede) */
  function aplicarEstado(st){ aviso=null; render(st); }
  function aguardando(ligado, texto){
    aviso = ligado? 'Enviando jogada…' : (texto||null);
    if(estadoAtual) render(estadoAtual);
  }
  function fimOnline(venci, motivo){
    const box=document.getElementById('bt-skills');
    if(!box) return;
    box.innerHTML=`<div class="bt-fim">${venci?'🏆 VITÓRIA!':'💀 DERROTA'}</div>`+
      (motivo? `<div class="bt-dica">${motivo}</div>`:'')+
      `<div class="bt-vez" id="bt-rating">registrando rating…</div>`+
      `<button class="btn-big" onclick="Online.voltar()">VOLTAR</button>`;
  }
  /* roda fn assim que a animação em curso acabar (ver animando()) */
  function quandoLivre(fn){
    if(!animando()){ fn(); return; }
    setTimeout(()=>quandoLivre(fn), 90);
  }

  /* ============================================================
     LEITURA DOS GOLPES
     ============================================================ */
  function etiquetasHTML(s){
    return TurnData.etiquetas(s).map(e=>`<i style="color:${e.cor}">${e.txt}</i>`).join('');
  }

  /* ficha completa de UMA unidade em batalha (serve para inimigo
     também: dá para ler o que o adversário pode fazer com você) */
  function abrirFichaUnidade(uid){
    const u=unidadeDe(uid); if(!u) return;
    const p=TurnData.passiva(u.ficha.passiva);
    const box=document.getElementById('bt-ficha');
    box.innerHTML=
      `<div class="bf-head">`+
        `<b>${u.nome}</b>`+
        `<span class="bf-time ${u.time}">${u.time==='aliado'?'seu time':'inimigo'}</span>`+
        `<button class="bf-x" onclick="TurnUI.fecharFicha()">✕</button>`+
      `</div>`+
      `<div class="bf-stats">❤ ${Math.ceil(u.hp)}/${u.hpMax} · ⚔ ${u.atk+u.atkBonus} · 🛡 ${u.def+u.defBonus} · 💨 ${TurnBattle.velocidadeDe(u)}`+
        (u.ficha.formaNomes? ` · 🦾 ${u.ficha.formaNomes[u.forma]}`:'')+
        (u.ficha.almas? ` · 👻 ${u.almas||0}/${u.ficha.almas.limite} almas`:'')+
        (u.confuso? ` · 😵 confuso (${u.confuso})`:'')+
        (u.provocado? ` · 😤 provocado (${u.provocado.turnos})`:'')+`</div>`+
      `<div class="bf-pass">${p.icone} <b>${p.nome}</b> — ${p.desc}</div>`+
      `<div class="bf-skills">`+ u.ficha.skills.map((s0,i)=>{
        // o golpe COMO ELE ESTÁ agora: forma atual (Mecas) ou um roubo
        // ativo no lugar da Bizarrice (Adulto Feliz) — ver skillEfetiva.
        const s=TurnBattle.skillEfetiva(u, i);
        const roubado = !!(s0.roubar && u.roubado);
        const tp=TurnData.tipo(s.tipo);
        const selo=(u.desabilitadas||[]).find(d=>d.i===i);
        const cd=selo? `<span class="bf-cd" style="color:#ff4d6d">🔇 selado (${selo.turnos})</span>`
                 : (u.cds[i]>0? `<span class="bf-cd">recarregando: ${u.cds[i]}</span>`:'');
        const up=roubado? `<span class="bf-up" title="roubado">🎭 roubada</span>`
                 : (s!==s0)? `<span class="bf-up">🦾 forma ${u.forma}</span>`:'';
        return `<div class="bf-sk ${s.super?'sup':''} ${s.setup?'setup':''} ${selo?'off':''}">`+
          `<div class="bf-sk-top"><b>${s.icone||'★'} ${s.nome}</b>`+
          `<span style="color:${tp.cor}">${tp.icone} ${tp.nome}</span>${up}${cd}</div>`+
          `<div class="bf-sk-desc">${s.desc||''}</div>`+
          `<div class="bf-tags">${etiquetasHTML(s)}</div></div>`;
      }).join('')+`</div>`;
    box.classList.add('on');
  }
  function fecharFicha(){
    const box=document.getElementById('bt-ficha');
    if(box) box.classList.remove('on');
  }

  /* ---------------- batalha ---------------- */
  function marcasHTML(u){
    return u.dots.map(d=>{
        const ic = d.tipo==='veneno'?'☠': d.tipo==='queimadura'?'🔥':'🩸';
        return `<span title="${d.tipo}">${ic}${d.turnos}</span>`; }).join('')
      + (u.atordoado?'<span title="atordoado">⚡</span>':'')
      + (u.confuso?`<span title="confuso">😵${u.confuso}</span>`:'')
      + (u.provocado?`<span title="provocado">😤${u.provocado.turnos}</span>`:'')
      + (u.enterrado?'<span title="debaixo da terra: ninguém acerta">🕳</span>':'')
      + (u.sumida>0?'<span title="sumiu: o próximo golpe acerta um vulto">👻</span>':'')
      + (u.fase>0?'<span title="desmaterializado: ninguém acerta">👾</span>':'')
      + (u.esgotado>0?'<span title="esgotado: sem poder neste turno">😮‍💨</span>':'')
      + (!u.vivo && u.renasce?'<span title="vai voltar como verme">🪱</span>':'')
      + u.buffs.map(b=>{
          const ic = b.tipo==='forca'?'💪': b.tipo==='blindagem'?'🛡':
                     b.tipo==='agilidade'?'💨': b.tipo==='lentidao'?'❄':'💚';
          // valor negativo fora a lentidão = stat ROUBADO (Mão Leve da Prodocimo)
          const menos = b.valor<0 && b.tipo!=='lentidao';
          return `<span title="${b.tipo}${menos?' roubado':''}">${menos?'🔻':''}${ic}</span>`; }).join('');
  }

  /* barra de ALMAS: só aparece para quem transforma juntando almas
     (a Smergula) e só enquanto ela ainda não virou demônio. */
  function almasHTML(u){
    const cfg=u.ficha.almas;
    if(!cfg || u.forma>0) return '';
    const pct=Math.min(100, (u.almas||0)/cfg.limite*100);
    return `<div class="bu-almas"><div class="bu-almas-fill" style="width:${pct}%"></div>`+
           `<span>👻 ${u.almas||0}/${cfg.limite}</span></div>`;
  }

  /* barra de ÁGUA (Tupas, passiva Reservatório): o estoque que faz o dano
     dele subir e descer. 🌪 = o redemoinho está ativo bebendo dela. */
  function aguaHTML(u){
    if(u.agua==null || !u.ficha.agua) return '';
    const max=u.ficha.agua.max, pct=Math.max(0,Math.min(100, u.agua/max*100));
    return `<div class="bu-almas bu-agua"><div class="bu-almas-fill" style="width:${pct}%"></div>`+
           `<span>💧 ${u.agua}/${max}${u.redemoinho?' 🌪':''}</span></div>`;
  }

  /* medidor de FURTIVIDADE (Smergulão): níveis 0–5 + moita / modo furtivo */
  function furtivoHTML(u){
    if(!u.ficha || u.ficha.passiva!=='furtividade') return '';
    const n=u.furtivo||0, pct=n/5*100, muito=n>=4;
    return `<div class="bu-almas bu-furtivo"><div class="bu-almas-fill" style="width:${pct}%;background:${muito?'#c46bff':'#9fd8ff'}"></div>`+
           `<span>👤 ${n}/5${muito?' ⚔':''}${u.naMoita>0?' 🌿':''}${u.modoFurtivo>0?' 🌫'+u.modoFurtivo:''}</span></div>`;
  }

  function hpLinhaHTML(u, hp){
    return `${Math.ceil(hp)}/${u.hpMax} <span class="bu-spd">💨${TurnBattle.velocidadeDe(u)}</span>`;
  }

  /* hpMostrar: quando uma ação está sendo animada, a barra do alvo
     segura o valor ANTIGO até o instante do impacto — senão a vida
     já teria caído antes do soco chegar. */
  /* DIORAMA (1.33): a placa (nome/vida/status) fica em cima da cabeça e o
     canvas embaixo, com os pés na base do card (ver .bu no CSS). O canvas
     nasce quadrado e é redimensionado pro tamanho REAL da tela em
     `dimensionarCanvas` — pixel art nítida em qualquer tamanho. */
  function unidadeHTML(u, ehAlvo, hpMostrar, ehVez){
    const hp = (hpMostrar==null? u.hp : hpMostrar);
    const pct=Math.max(0,hp/u.hpMax*100);
    const forma = u.ficha.formaNomes? u.ficha.formaNomes[u.forma] : null;
    const baixa = hp>0 && pct<=25 ? ' baixa' : '';
    return `<div class="bu ${hp>0?'':'morto'} ${ehAlvo?'alvo':''} ${ehVez?'vez':''}" data-uid="${esc(u.id)}">
      <div class="bu-placa">
        <button class="bu-info" title="ver golpes" onclick="event.stopPropagation();TurnUI.abrirFichaUnidade('${esc(u.id)}')">🔎</button>
        <div class="bu-nome">${esc(u.nome)}</div>
        ${forma&&u.forma>0? `<div class="bu-forma">${u.ficha.formaIcone||'🦾'} ${esc(forma)}</div>`:''}
        <div class="bu-bar"><div class="bu-rastro" style="width:${pct}%"></div><div class="bu-fill${baixa}" style="width:${pct}%"></div></div>
        <div class="bu-hp">${hpLinhaHTML(u,hp)}</div>
        ${almasHTML(u)}
        ${aguaHTML(u)}
        ${furtivoHTML(u)}
        <div class="bu-status">${marcasHTML(u)}</div>
      </div>
      <canvas width="128" height="128" data-cid="${esc(u.charId)}" data-form="${u.forma|0}"></canvas>
    </div>`;
  }

  /* o canvas do lutador com o tamanho de VERDADE na tela (× densidade de
     pixels). Feito uma vez por desenho dos cards (render), não a cada
     quadro — e de novo se a janela mudar de tamanho. */
  let tamanhosSujos=true;
  window.addEventListener('resize', ()=>{ tamanhosSujos=true; });
  function dimensionarCanvas(){
    const dpr=Math.min(2, window.devicePixelRatio||1);
    document.querySelectorAll('#team-inimigo .bu canvas, #team-aliado .bu canvas').forEach(cv=>{
      const w=Math.max(32, Math.round(cv.clientWidth*dpr));
      if(w && cv.width!==w){ cv.width=w; cv.height=w; }
    });
    tamanhosSujos=false;
  }

  /* atualiza SÓ os números de uma unidade (usado no impacto) */
  function atualizarUnidade(uid){
    const u=unidadeDe(uid); if(!u) return;
    const el=document.querySelector(`.bu[data-uid="${uid}"]`); if(!el) return;
    const pct=Math.max(0,u.hp/u.hpMax*100);
    const f=el.querySelector('.bu-fill');
    const rs=el.querySelector('.bu-rastro');
    if(f){
      const antes=parseFloat(f.style.width)||0;
      f.style.width=pct+'%';
      f.classList.toggle('baixa', u.hp>0 && pct<=25);
      /* rastro: perdeu vida → o pedaço fica claro e escorre DEPOIS (a
         transição com atraso está no CSS); ganhou → acompanha na hora */
      if(rs){
        if(pct>=antes){ rs.style.transition='none'; rs.style.width=pct+'%'; void rs.offsetWidth; rs.style.transition=''; }
        else rs.style.width=pct+'%';
      }
    }
    const h=el.querySelector('.bu-hp');     if(h) h.innerHTML=hpLinhaHTML(u, u.hp);
    const s=el.querySelector('.bu-status'); if(s) s.innerHTML=marcasHTML(u);
    const ag=el.querySelector('.bu-agua'); if(ag) ag.outerHTML=aguaHTML(u);
    const fu=el.querySelector('.bu-furtivo'); if(fu) fu.outerHTML=furtivoHTML(u);
    el.classList.toggle('morto', !u.vivo);
    snapHP[uid]=u.hp;
  }

  let snapHP={};        // vida que está DESENHADA na tela agora
  let ultimoSeq=0;      // último evento já animado
  /* números de vida que mudou SEM golpe (veneno, terreno, regeneração),
     a última lista de efeitos de cada um (pra saber QUAL veneno pingou,
     mesmo no tique que encerra ele), a rodada anunciada e o fim festejado */
  let hpPendente=[], ultimosDots={}, rodadaMostrada=0, rodadaPendente=null, fimFestejado=false;

  function soltarNumerosPendentes(){
    if(anim) return;
    if(rodadaPendente && (entrada==null || entrada>=70)){
      TurnFX.anuncio('RODADA '+rodadaPendente, '#9fd8ff', null, 58);
      rodadaPendente=null;
    }
    if(!hpPendente.length) return;
    const lote=hpPendente; hpPendente=[];
    lote.forEach(p=>{
      const c=centroDe(p.id);
      atualizarUnidade(p.id);
      if(!c || !p.diff) return;
      const y=c.y-altura(c)*0.42;
      if(p.diff<0){
        const ic = p.tipo==='veneno'?'☠': p.tipo==='queimadura'?'🔥': p.tipo==='sangramento'?'🩸': p.tipo==='eletrico'?'⚡':'🌋';
        const cor = TurnData.tipo(p.tipo==='queimadura'?'fogo': p.tipo==='terra'?'terra': p.tipo).cor;
        TurnFX.numero(c.x, y, p.diff+' '+ic, cor, 12, false);
        TurnFX.elemento(p.tipo==='queimadura'?'fogo':p.tipo, c.x, c.y, 0.55, altura(c));
      } else {
        TurnFX.numero(c.x, y, '+'+p.diff, '#7dff8a', 11, false);
        TurnFX.cura(c.x, c.y);
      }
    });
  }

  function subtituloLuta(){
    if(!ctrl) return '';
    if(ctrl.historia) return String(ctrl.titulo||'').toUpperCase().slice(0,42);
    if(ctrl.condenacao) return '⚖ O TRIBUNAL DA RAINHA';
    if(ctrl.survival && survival) return 'SOBREVIVÊNCIA · TIME '+(survival.streak+1);
    if(ctrl.oponente && ctrl.oponente.nick) return 'VS '+String(ctrl.oponente.nick).toUpperCase().slice(0,16);
    return '';
  }

  /* FIM DA LUTA: anúncio grande + confete pra quem ganhou */
  function festejarFim(){
    const st=estadoAtual; if(!st) return;
    if(ctrl && ctrl.espectador){
      TurnFX.anuncio('🏆 '+String(nomeDoLado(st.venceu?'aliado':'inimigo')).slice(0,18), '#ffe066', 'VENCEU!', 150);
      TurnFX.confete(); return;
    }
    const venci = meuLado()==='aliado' ? !!st.venceu : !st.venceu;
    const cond = !!(ctrl && (ctrl.condHist || ctrl.condenacao));
    if(venci){
      TurnFX.anuncio(cond? '⚖ ABSOLVIDO!' : '🏆 VITÓRIA!', '#ffe066', null, 150);
      TurnFX.confete(); TurnFX.flash(8, '#ffe066');
    } else {
      TurnFX.anuncio(cond? '⛓ CONDENADO' : '💀 DERROTA', '#ff4d6d', null, 150);
      TurnFX.flash(12, '#3a0010'); TurnFX.tremer(6, 18);
    }
  }

  function render(st){
    estadoAtual=st;
    /* luta NOVA (outros lutadores, rodada 1, ninguém agiu ainda) →
       toca a ENTRADA: todo mundo chega correndo (ver desenharSprites) */
    const idsLuta = st.times.aliado.concat(st.times.inimigo).map(u=>u.id).join('|');
    if(idsLuta!==idsLutaAnterior && st.rodada===1 && !st.evento){
      entrada=0;
      // time com que EU entrei (a invocação do Ursão troca gente no meio — não conta)
      timeInicial = st.times[meuLado()].map(u=>u.charId);
      fimRegistrado = false;
      falaJuiza('inicio', 1700);
    }
    idsLutaAnterior = idsLuta;
    /* FICHA do jogador pro bot da Condenação: com quem você joga e quanto
       ganha. Todo 3x3 em que VOCÊ escolheu o time conta (offline,
       sobrevivência, online, a própria Condenação) — menos o modo
       história (time fixo do roteiro) e quem só está assistindo. */
    if(st.acabou && !fimRegistrado && timeInicial && !(ctrl && (ctrl.historia || ctrl.espectador))){
      fimRegistrado = true;
      const venceuEu = meuLado()==='aliado' ? !!st.venceu : !st.venceu;
      if(typeof Condenacao!=='undefined') Condenacao.registrarPartida(timeInicial, venceuEu);
    }
    /* MEU lado vai sempre embaixo (verde) e o do adversário em cima
       (vermelho). Local eu sou o 'aliado' do motor; online, o convidado
       da sala é o 'inimigo' — e mesmo assim precisa se ver embaixo. */
    const meu=meuLado(), dele=ladoDele();
    const souAliado = meu==='aliado';
    // ação nova? então a vida dos envolvidos fica congelada até o impacto
    const ev=st.evento;
    const novaAcao = !!(ev && ev.seq!==ultimoSeq);
    const congelar={};
    if(novaAcao){
      (ev.alvos||[]).forEach(r=>{ if(snapHP[r.id]!=null) congelar[r.id]=snapHP[r.id]; });
      if(snapHP[ev.origem]!=null) congelar[ev.origem]=snapHP[ev.origem];
    }
    /* VIDA QUE MUDOU SEM GOLPE (veneno/queimadura/sangue no fim do turno,
       terreno e ambiente no fim da rodada, pão do Fat Mango, lasanha do
       Cabelin…): antes a barra só descia em silêncio. Agora a barra
       SEGURA o valor de antes e, quando o golpe em curso termina, o número
       sobe do lutador junto com a barra (soltarNumerosPendentes). */
    const envolvidos = {};
    if(novaAcao){
      (ev.alvos||[]).forEach(r=>{ envolvidos[r.id]=1; });
      envolvidos[ev.origem]=1;
      if(ev.curaExtra) envolvidos[ev.curaExtra.id]=1;
      if(ev.invocou){ envolvidos[ev.invocou.id]=1; envolvidos[ev.invocou.substituiu]=1; }
    }
    st.times.aliado.concat(st.times.inimigo).forEach(u=>{
      const antes=snapHP[u.id];
      if(antes!=null && congelar[u.id]==null && !envolvidos[u.id] && Math.round(u.hp)!==Math.round(antes)){
        const dts=(ultimosDots[u.id]||[]).concat(u.dots.map(d=>d.tipo));
        const ter=(st.terrenos||{})[u.time];
        const tipo = dts.indexOf('veneno')>=0? 'veneno' : dts.indexOf('queimadura')>=0? 'queimadura'
                   : dts.indexOf('sangramento')>=0? 'sangramento'
                   : (ter && /el[eé]tric/i.test(ter.nome||''))? 'eletrico' : 'terra';
        const ja=hpPendente.find(p=>p.id===u.id);       // render repetido antes de soltar: atualiza, não duplica
        if(ja){ ja.diff=Math.round(u.hp-antes); ja.tipo=tipo; }
        else hpPendente.push({ id:u.id, diff:Math.round(u.hp-antes), tipo });
        congelar[u.id]=antes;
      }
      ultimosDots[u.id]=u.dots.map(d=>d.tipo);
    });

    // times
    // 'qualquer' (Bizarrice) mira nos DOIS lados, menos em quem está na vez agora (ele mesmo)
    const podeInimigo = skillEscolhida!=null && aceitaLado(st, false);
    const podeAliado  = skillEscolhida!=null && aceitaLado(st, true);
    const ehEuMesmo = u=> !!(st.atual && u.id===st.atual.id);
    const ehVez = u=> !!(st.atual && !st.acabou && u.id===st.atual.id);
    const elIni=document.getElementById('team-inimigo'), elAli=document.getElementById('team-aliado');
    elIni.innerHTML =
      // skillEscolhida é um ÍNDICE: com a primeira skill (0) o teste
      // "!!skillEscolhida" dava false e os alvos nunca ficavam clicáveis.
      st.times[dele].map(u=>unidadeHTML(u, podeInimigo && u.vivo && !u.enterrado && !(u.fase>0) && !ehEuMesmo(u), congelar[u.id], ehVez(u))).join('');
    elAli.innerHTML =
      st.times[meu].map(u=>unidadeHTML(u, podeAliado && u.vivo && !u.enterrado && !(u.fase>0) && !ehEuMesmo(u), congelar[u.id], ehVez(u))).join('');
    // formação do diorama depende de quantos tem no time (história: 1 ou 2)
    [[elIni, st.times[dele].length],[elAli, st.times[meu].length]].forEach(([el,n])=>{
      el.classList.toggle('n1', n===1); el.classList.toggle('n2', n===2);
    });
    dimensionarCanvas();

    // clique para escolher alvo (o lado clicável depende da skill)
    const ligarAlvos=(sel, lado, valido)=>{
      document.querySelectorAll(sel+' .bu').forEach(el=>{
        el.onclick=()=>{
          if(animando()) return;             // não joga por cima da animação
          if(skillEscolhida==null) return;   // idem: índice 0 é válido
          if(!valido()) return;              // esta skill não mira deste lado
          const u=st.times[lado].find(x=>x.id===el.dataset.uid);
          if(!u||!u.vivo||u.enterrado||u.fase>0) return;   // enterrado (Toca do Verme) / desmaterializado não pode ser alvo
          if(ehEuMesmo(u)) return;           // Bizarrice não mira em quem está usando ela
          const s=skillEscolhida; skillEscolhida=null;
          atacar(s, u.id);
        };
      });
    };
    ligarAlvos('#team-inimigo', dele, ()=>aceitaLado(st, false));
    ligarAlvos('#team-aliado',  meu,  ()=>aceitaLado(st, true));

    // RODADA NOVA: o anúncio entra quando o golpe em curso acabar
    if(!st.acabou && st.rodada>1 && st.rodada!==rodadaMostrada) rodadaPendente=st.rodada;
    rodadaMostrada=st.rodada;

    // memoriza o que está desenhado (para o próximo congelamento)
    st.times.aliado.concat(st.times.inimigo).forEach(u=>{
      if(congelar[u.id]==null) snapHP[u.id]=u.hp;
    });

    // cabeçalho
    document.getElementById('bt-rodada').textContent =
      (ctrl&&ctrl.espectador? '👁 AO VIVO · RODADA ' :
       ctrl&&ctrl.online? '🏆 RODADA ' : ctrl&&ctrl.survival? '🏕 SOBREVIVÊNCIA (time '+(survival.streak+1)+') · RODADA ' : 'RODADA ')+st.rodada;
    const loc=document.getElementById('bt-local');
    if(loc) loc.textContent = TurnBG.nome() + (ctrl&&ctrl.oponente? ' · vs '+ctrl.oponente.nick : '')
      + (ctrl&&ctrl.espectador? ' · ⬇ '+nomeDoLado('aliado')+' vs ⬆ '+nomeDoLado('inimigo') : '')
      + (ctrl&&ctrl.historia&&ctrl.titulo? ' · 📖 '+ctrl.titulo : '')
      + (ctrl&&ctrl.survival? ' · sequência: '+survival.streak : '');
    const ters=[];
    const ter=st.terrenos||{};
    if(ter[dele]) ters.push(`🌋 <b>${ter[dele].nome}</b> nos inimigos (${ter[dele].dano}/turno, ${ter[dele].turnos})`);
    if(ter[meu])  ters.push(`🌋 <b style="color:#ff8a8a">${ter[meu].nome}</b> em você (${ter[meu].dano}/turno, ${ter[meu].turnos})`);
    const es=st.estruturas||{};
    // nem toda estrutura dá defesa: o Escudo Temporal só adianta recarga
    const efeitoEs = e => (e.defesa? '+'+e.defesa+' def' : e.recarga? '-'+e.recarga+' recarga/rodada' : '')+', '+e.turnos;
    if(es[meu])  ters.push(`${es[meu].icone} <b style="color:#7dffc4">${es[meu].nome}</b> protege o seu time (${efeitoEs(es[meu])})`);
    if(es[dele]) ters.push(`${es[dele].icone} <b style="color:#ff8a8a">${es[dele].nome}</b> protege os inimigos (${efeitoEs(es[dele])})`);
    const ba=st.barreiras||{};
    if(ba[meu])  ters.push(`${ba[meu].icone} <b style="color:#ffb83c">${ba[meu].nome}</b> segura os golpes no seu time (${ba[meu].hp}/${ba[meu].hpMax})`);
    const fm=st.fumacas||{};
    if(fm[meu])  ters.push(`${fm[meu].icone} <b style="color:#ff9ecb">${fm[meu].nome}</b> no seu lado (+${Math.round(fm[meu].esquiva*100)}% de esquiva, ${fm[meu].turnos})`);
    if(fm[dele]) ters.push(`${fm[dele].icone} <b style="color:#ff8a8a">${fm[dele].nome}</b> no lado inimigo (+${Math.round(fm[dele].esquiva*100)}% de esquiva, ${fm[dele].turnos})`);
    if(ba[dele]) ters.push(`${ba[dele].icone} <b style="color:#ff8a8a">${ba[dele].nome}</b> na frente dos inimigos — quebre ela primeiro (${ba[dele].hp}/${ba[dele].hpMax})`);
    const amb=st.ambiente;
    if(amb) ters.push(`${amb.icone} <b style="color:${amb.cor||'#ff9ecb'}">AMBIENTE: ${amb.nome}</b> — `+
      (amb.curaMult>1? `cura +${Math.round((amb.curaMult-1)*100)}% ` : '')+
      (amb.regen? `· +${amb.regen}/rodada ` : '')+`(${amb.turnos})`);
    document.getElementById('bt-terreno').innerHTML = ters.join(' · ');

    // ordem de turno (cor pelo MEU lado, não pelo lado do motor)
    document.getElementById('bt-ordem').innerHTML = st.ordem.filter(u=>u.vivo).map((u,i)=>
      `<span class="ordem-item ${u===st.atual?'agora':''} ${u.time===meu?'aliado':'inimigo'}">${u.nome.split(' ')[0]}</span>`).join('→');

    // log
    document.getElementById('bt-log').innerHTML = st.log.map(l=>`<div>${l}</div>`).join('');
    const lg=document.getElementById('bt-log'); lg.scrollTop=lg.scrollHeight;

    // skills
    const box=document.getElementById('bt-skills');
    if(st.acabou){
      // st.venceu é do ponto de vista do 'aliado' do motor
      const venci = souAliado? !!st.venceu : !st.venceu;
      if(ctrl&&ctrl.espectador){
        const vencedor = nomeDoLado(st.venceu ? 'aliado' : 'inimigo');
        box.innerHTML=`<div class="bt-fim">🏆 ${esc(vencedor)} VENCEU!</div>`+
          `<div class="bt-vez">Fim da partida — você estava assistindo.</div>`+
          `<button class="btn-big" onclick="Espectador.voltarLista()">OUTRAS PARTIDAS</button>`+
          `<button class="btn-big alt2" onclick="Espectador.sair()">SAIR</button>`;
      } else if(ctrl&&ctrl.survival){
        renderFimSurvival(box, venci, st);
      } else if(ctrl&&ctrl.condenacao){
        box.innerHTML=`<div class="bt-fim">${venci?'⚖ ABSOLVIDO!':'⛓ CONDENADO'}</div>`+
          `<div class="bt-vez">${venci? '👑 "...Dessa vez você escapou. Volte, e eu vou saber MAIS sobre você."'
                                     : '👑 "Eu sabia o que você ia escolher antes de você."'}</div>`+
          `<button class="btn-big" onclick="Condenacao.abrir()">⚖ NOVA CONDENAÇÃO</button>`+
          `<button class="btn-big alt2" onclick="goto('menu')">MENU</button>`;
      } else if(ctrl&&ctrl.historia){
        // campanha da Condenação: a rainha dá o veredito (a frase fica fixa nas repinturas)
        if(ctrl.condHist && !ctrl.veredito) ctrl.veredito = sortear(FALAS_JUIZA[venci?'absolvido':'condenado']);
        box.innerHTML=(ctrl.condHist
            ? `<div class="bt-fim">${venci?'⚖ ABSOLVIDO!':'⛓ CONDENADO'}</div>`+
              `<div class="bt-vez">👑 "${esc(ctrl.veredito)}"</div>`
            : `<div class="bt-fim">${venci?'🏆 VITÓRIA!':'💀 DERROTA'}</div>`)+
          (venci
            ? `<button class="btn-big" onclick="TurnUI.concluirHistoria()">CONTINUAR</button>`
            : `<button class="btn-big" onclick="TurnUI.repetirHistoria()">TENTAR DE NOVO</button>`+
              `<button class="btn-big alt2" onclick="TurnUI.sairHistoria()">${esc(ctrl.textoSair||'VOLTAR ÀS FASES')}</button>`);
      } else {
        box.innerHTML=`<div class="bt-fim">${venci?'🏆 VITÓRIA!':'💀 DERROTA'}</div>`+
          (ctrl&&ctrl.online
            ? `<div class="bt-vez" id="bt-rating">registrando rating…</div>`+
              `<button class="btn-big" onclick="Online.voltar()">VOLTAR</button>`
            : `<button class="btn-big" onclick="TurnUI.abrirMontagem()">JOGAR DE NOVO</button>`+
              `<button class="btn-big alt2" onclick="goto('menu')">MENU</button>`);
      }
    } else if(minhaVez(st)){
      const u=st.atual;
      box.innerHTML = `<div class="bt-vez">Vez de <b>${u.nome}</b>`+
        `<button class="bt-lupa" onclick="TurnUI.abrirFichaUnidade('${u.id}')">🔎 ficha</button></div>`+
        u.ficha.skills.map((s0,i)=>{
          // Mecas: cada forma troca o golpe. Adulto Feliz: um roubo ativo
          // TOMA o lugar da Bizarrice no mesmo slot. skillEfetiva resolve
          // as duas coisas — o botão mostra o que vai sair DE VERDADE.
          const s=TurnBattle.skillEfetiva(u, i);
          const roubado = !!(s0.roubar && u.roubado);
          const tp=TurnData.tipo(s.tipo);
          const emCD=u.cds[i]>0;
          const selo=(u.desabilitadas||[]).find(d=>d.i===i);
          const desabilitado=!!selo;
          const sel=skillEscolhida===i;
          /* Tupas: redemoinho ATIVO → o slot da ult vira DESATIVAR (ação
             livre, não gasta o turno). Golpe com condição (Correnteza só
             com pouca água) aparece travado com o motivo. */
          if(s.redemoinho && u.redemoinho){
            return `<button class="bt-sk sup desativa" onclick="TurnUI.desativarRedemoinho()">
              <span class="sk-top"><span class="sk-ic">🌀</span><span class="sk-nm">DESATIVAR REDEMOINHO</span>
                <span class="sk-cond">não gasta o turno</span></span>
              <span class="sk-desc">Recolhe o redemoinho agora (ele para de gastar água) e você continua jogando este turno.</span>
            </button>`;
          }
          // os times do ESTADO desenhado (o convidado online não roda motor nenhum)
          const cond = TurnBattle.condicaoSkill(u, i, st.times);
          if(cond && !emCD && !desabilitado){
            return `<button class="bt-sk off" disabled>
              <span class="sk-top"><span class="sk-ic">${s.icone||'★'}</span><span class="sk-nm">${s.nome}</span>
                <span class="sk-cond">${cond}</span></span>
              <span class="sk-desc">${s.desc||''}</span>
              <span class="sk-tags">${etiquetasHTML(s)}</span>
            </button>`;
          }
          return `<button class="bt-sk ${emCD?'cd':''} ${desabilitado?'off':''} ${sel?'sel':''} ${s.super?'sup':''} ${s.setup?'setup':''}"
                    ${(emCD||desabilitado)?'disabled':''} onclick="TurnUI.escolherSkill(${i})">
            <span class="sk-top">
              <span class="sk-ic">${s.icone||'★'}</span>
              <span class="sk-nm">${s.nome}</span>
              ${roubado? `<span class="sk-up" title="roubado">🎭</span>` : (s!==s0? `<span class="sk-up">🦾</span>`:'')}
              <span class="sk-tp" style="color:${tp.cor}">${tp.icone} ${tp.nome}</span>
              ${desabilitado? `<span class="sk-cd">🔇 selado (${selo.turnos})</span>` : (emCD? `<span class="sk-cd">${u.cds[i]}</span>`:'')}
            </span>
            <span class="sk-desc">${roubado? '🎭 ROUBADA — ':''}${s.desc||''}</span>
            <span class="sk-tags">${etiquetasHTML(s)}</span>
          </button>`;
        }).join('') +
        `<button class="bt-sk def" onclick="TurnUI.defender()">
           <span class="sk-top"><span class="sk-ic">🛡</span><span class="sk-nm">Defender</span></span>
           <span class="sk-desc">Passa o turno ganhando +8 de defesa até o próximo turno.</span></button>`+
        (skillEscolhida!=null
           ? `<div class="bt-dica">${mirandoQualquer(st)? 'Escolha QUALQUER personagem em campo ↑'
                : (mirandoAliado(st)? 'Escolha o ALIADO que vai receber ↑' : 'Escolha o alvo ↑')}</div>`
           : '')+
        (aviso? `<div class="bt-dica">${aviso}</div>`:'');
    } else if(st.atual && st.atual.enterrado){
      box.innerHTML=`<div class="bt-vez">🕳 <b>${esc(st.atual.nome)}</b> está saindo da terra…</div>`;
    } else if(ctrl&&ctrl.espectador){
      const u=st.atual;
      box.innerHTML=`<div class="bt-vez">👁 Assistindo · vez de <b>${esc(nomeDoLado(u? u.time : 'aliado'))}</b>`+
        (u? ` (${esc(u.nome)})` : '')+`…</div>`+
        `<button class="btn-big alt2" onclick="Espectador.sair()">SAIR</button>`;
    } else {
      const quem = (ctrl&&ctrl.oponente)? ctrl.oponente.nick : 'inimigo';
      box.innerHTML=`<div class="bt-vez">Vez do ${quem}…</div>`+
        (aviso? `<div class="bt-dica">${aviso}</div>`:'');
    }

    if(novaAcao){
      ultimoSeq=ev.seq; iniciarAnim(ev);
      // a juíza reage ao que aconteceu (só na Condenação)
      if(ctrl && ctrl.juiza){
        const mortos=(ev.alvos||[]).filter(r=>r.morreu).map(r=>unidadeDe(r.id)).filter(Boolean);
        if(mortos.some(u=>u.time===meu)) falaJuiza('matouSeu', 1500);
        else if(mortos.some(u=>u.time!==meu)) falaJuiza('perdeuDela', 1500);
        else if(ev.skill && ev.skill.super && ev.time!==meu) falaJuiza('ultDela', 500);
        else if(ev.skill && ev.skill.super && ev.time===meu) falaJuiza('ultSua', 1600);
      }
    }
    desenharSprites();
  }

  /* ============================================================
     ANIMAÇÃO DA AÇÃO
     ------------------------------------------------------------
     O motor já resolveu tudo quando chegamos aqui — a animação é a
     ENCENAÇÃO do evento. Três estilos (ver TurnData.estilo):
       corpo -> corre até o alvo e bate (um "hit" por golpe)
       tiro  -> fica no lugar e manda o projétil
       foco  -> se concentra (buff / cura / terreno)
     ============================================================ */
  let anim=null;

  /* A animação anda no requestAnimationFrame. Se a aba vai para segundo
     plano (ou a janela fica oculta) o navegador ESTRANGULA o rAF e a
     animação congela no meio — sem este prazo a IA ficaria esperando
     para sempre e a batalha travava. Passou de 3s, a encenação é
     abandonada e o jogo segue: o resultado já estava calculado.
     (1.25: os golpes ficaram bem mais longos — 1,5 a 2,5 s — então o
     prazo subiu junto; ele só serve pra aba em segundo plano.) */
  const PRAZO_ANIM=9000;
  function animando(){
    if(anim && performance.now()-anim.inicio > PRAZO_ANIM){
      limparTransforms(); anim=null;
    }
    // a entrada da luta também conta: ninguém age antes de todo mundo chegar
    // (o laço só anda com a tela de batalha aberta — sem ela, não segura nada)
    const entrando = entrada!=null && entrada<50 && fxLigado;
    return anim!=null || entrando;
  }

  /* centro do lutador NA TELA. Cache por QUADRO: várias partes do laço
     (seta da vez, redemoinho, terreno, animação) pediam o mesmo retângulo
     — e cada getBoundingClientRect depois de um transform escrito força
     o navegador a recalcular o layout. Um cálculo por lutador por quadro.
     `render()` zera o cache (os cards são recriados ali). */
  let cacheCentros=null;
  function centroDe(uid){
    if(cacheCentros && cacheCentros[uid]!==undefined) return cacheCentros[uid];
    const el=document.querySelector(`.bu[data-uid="${uid}"] canvas`);
    let c=null;
    if(el){
      const r=el.getBoundingClientRect();
      // o lutador ocupa os ~80% de baixo do quadro, com os pés quase na base
      c={ x:r.left+r.width/2, y:r.top+r.height*0.53, w:r.width, h:r.height, el, card:el.parentElement };
    }
    if(cacheCentros) cacheCentros[uid]=c;
    return c;
  }
  // altura (em px de tela) do lutador de um centro — pra pôr texto/efeito na cabeça dele
  const altura = p => (p && p.h ? p.h*0.80 : 90);

  function poseDeAtaque(ev){
    const c=Characters.byId((unidadeDe(ev.origem)||{}).charId)||{};
    const tem=p=> !!(c.anims && c.anims[p]) || !!(c.forms && c.forms.some(f=>f.anims&&f.anims[p]));
    // golpe com animação PRÓPRIA (`skill.pose` — desde a 1.25 todo golpe do elenco tem a sua)
    if(ev.skill.pose && tem(ev.skill.pose)) return ev.skill.pose;
    if(ev.estilo==='corpo') return ev.skill.super && tem('special') ? 'special' : 'punch';
    if(ev.estilo==='tiro')  return tem('ranged')? 'ranged' : 'special';
    return 'special';
  }

  /* quantos QUADROS a pose do golpe tem, na forma em que quem bate está
     agora — o tempo do golpe cresce com a sequência, pra cada quadro
     aparecer de verdade em vez de piscar. */
  function quadrosDaPose(ev, pose){
    const u=unidadeDe(ev.origem); const c=u && Characters.byId(u.charId);
    if(!c) return 1;
    const fa = c.forms ? (c.forms[Math.min(u.forma||0, c.forms.length-1)]||{}).anims : null;
    const a = (fa && fa[pose]) || (c.anims && c.anims[pose]);
    return (a && a.frames && a.frames.length) || 1;
  }

  /* ============================================================
     ENCENAÇÃO (1.25) — o golpe em ATOS, todos medidos em quadros:
       ultimate : CARGA (energia fechando no lutador + faixa com o nome)
       corpo    : PREPARO (recua) → INVESTIDA (vulto ficando pra trás)
                  → GOLPE (a sequência de poses inteira, impacto no
                  quadro final) → SEGURA → VOLTA
       tiro     : MIRA (a sequência até o quadro de soltar) → VOO → IMPACTO
       foco     : a sequência inteira devagar → efeito em quem recebe
     No impacto: PAUSA de impacto (a cena congela 3–6 quadros), tremor
     do palco e o alvo é EMPURRADO pra trás. Golpe em ÁREA corpo a corpo
     passa por cada inimigo, um de cada vez.
     ============================================================ */
  const RITMO=1.15;                  // tudo um pouco mais lento que o mínimo legível
  const R=n=>Math.round(n*RITMO);

  function iniciarAnim(ev){
    const orig=centroDe(ev.origem);
    if(!orig){ anim=null; return; }
    const cor=TurnData.tipo(ev.skill.tipo).cor;
    const vezes=Math.max(1, Math.min(4, ev.skill.vezes||1));
    const pose=poseDeAtaque(ev);
    const n=quadrosDaPose(ev, pose);
    const sup=!!ev.skill.super;
    const CARGA = sup? R(46) : 0;     // ultimate: tempo da faixa dos olhos aparecer antes do golpe
    let alvos=(ev.alvos||[]).map(r=>({ r, pos:centroDe(r.id), hits:[] })).filter(a=>a.pos);
    // golpe que bateu na MURALHA DE LASANHA: o alvo da encenação é ela
    if(ev.barreira){
      const p=TurnBG.posBarreiraTela(ladoTela(ev.barreira.time));
      if(p) alvos=[{ r:{ id:null, dano:ev.barreira.dano, cura:0, esquivou:false, morreu:false, barreira:true }, pos:p, hits:[] }];
    }
    const area = ev.estilo==='corpo' && alvos.length>1;
    if(area) alvos.sort((a,b)=> a.pos.y-b.pos.y || a.pos.x-b.pos.x);   // percorre a fileira em ordem

    const f={ CARGA };
    let dur;
    if(ev.estilo==='corpo'){
      f.PREP=CARGA+R(9); f.DASH=R(16); f.T0=f.PREP+f.DASH;
      f.S=R(Math.max(32, n*11, vezes*17, area? alvos.length*22 : 0));
      if(area){
        alvos.forEach((al,i)=> al.hits.push({ frame:f.T0+Math.round(f.S*(i+0.62)/alvos.length), ultimo:true, parte:1 }));
      } else {
        for(let i=0;i<vezes;i++){
          const frac = vezes>1 ? 0.25+0.7*((i+1)/vezes) : (n>1 ? Math.min(0.94,(n-1)/n+0.06) : 0.55);
          const g={ frame:f.T0+Math.round(f.S*frac), ultimo:i===vezes-1, parte:1/vezes };
          alvos.forEach(al=> al.hits.push(g));
        }
      }
      f.VOLTA0=f.T0+f.S+R(12); f.VOLTA=R(18);
      dur=f.VOLTA0+f.VOLTA;
    } else if(ev.estilo==='tiro'){
      f.W=CARGA+R(Math.max(28, n*12)); f.VOO=R(20);
      const G0=(typeof TurnGolpes!=='undefined') ? TurnGolpes.receita(ev) : null;
      if(G0 && G0.varre && alvos.length>1 && !ev.barreira){
        /* golpe que VARRE o time (croissant, moeda ricocheteando, onda,
           rachadura): cada alvo apanha quando o objeto PASSA nele — o
           tempo de cada um sai da distância percorrida até ele. */
        if(G0.varre!=='ordem') alvos.sort((a,b)=>Math.abs(a.pos.x-orig.x)-Math.abs(b.pos.x-orig.x));
        const L=[]; let acc=0, ant={x:orig.x, y:orig.y};
        alvos.forEach(al=>{ acc += G0.varre==='x' ? Math.abs(al.pos.x-ant.x) : Math.hypot(al.pos.x-ant.x, al.pos.y-ant.y); L.push(acc); ant=al.pos; });
        f.VOO=R(Math.round(20*(1+0.5*(alvos.length-1))));
        alvos.forEach((al,k)=> al.hits.push({ frame:f.W+Math.max(4,Math.round(f.VOO*L[k]/Math.max(1,acc))), disparo:f.W, ultimo:true, parte:1 }));
      } else
      for(let i=0;i<vezes;i++){
        const disparo=f.W+i*R(9);
        alvos.forEach((al,k)=> al.hits.push({ frame:disparo+f.VOO+k*2, disparo:disparo+k*2, ultimo:i===vezes-1, parte:1/vezes }));
      }
      const ultimo=Math.max(f.W+f.VOO, ...alvos.map(al=>al.hits.length? al.hits[al.hits.length-1].frame : 0));
      f.FIM=ultimo+R(8);
      dur=ultimo+R(26);
    } else {
      f.D=CARGA+R(Math.max(40, n*14));
      alvos.forEach(al=> al.hits.push({ frame:f.D-R(8), ultimo:true, parte:1 }));
      dur=f.D+R(20);
    }

    anim={ t:0, dur, ev, cor, alvos, orig, f, n, area, sup, inicio:performance.now(),
           pose, poses:{}, pausa:0, el:orig.el };

    /* 1.45 — GOLPE SOB MEDIDA (js/turngolpes.js): a receita do golpe pelo
       nome dele (o pão voando, o Astra, o rifle...). `I` é o que a receita
       enxerga da cena; `atk` acompanha onde quem bate está a cada quadro. */
    const ladoAtk = (alvos[0] && Math.abs(alvos[0].pos.x-orig.x)>4) ? (alvos[0].pos.x<orig.x? -1 : 1)
                  : (ladoTela(ev.time)==='aliado'? 1 : -1);
    anim.g = (typeof TurnGolpes!=='undefined') ? TurnGolpes.receita(ev) : null;
    anim.I = { ev, a:anim, o:orig, h:altura(orig), lado:ladoAtk, cor, sup, alvos, R, f, altura,
               pe:p=>p.y+altura(p)*0.45, atk:{ x:orig.x, y:orig.y }, ladoTela,
               palco:(document.getElementById('bt-palco')||document.body).getBoundingClientRect(),
               charId:(unidadeDe(ev.origem)||{}).charId };
    // placa com o NOME do golpe (a ultimate tem o cut-in no lugar)
    if(!sup && ev.acao!=='defender')
      TurnFX.placa((ev.skill.icone? ev.skill.icone+' ' : '')+ev.skill.nome, cor, ladoTela(ev.time)==='aliado'? 1 : -1);
    // Trombada / Atropelamento: quem bate VIRA o Astra no caminho
    if(anim.g && anim.g.mov==='carro') desenharCarroDaAnim(anim);

    if(sup){
      /* CUT-IN: os OLHOS de quem está soltando a ultimate atravessam a
         tela (na forma em que ele está agora). Sem recorte de olhos (ou
         folha ainda carregando), cai na faixa só com o nome. */
      const uo=unidadeDe(ev.origem);
      const olhos = uo ? Sprites.olhosDe(Characters.byId(uo.charId), uo.forma||0) : null;
      const nome=(ev.skill.icone? ev.skill.icone+' ':'')+ev.skill.nome;
      if(olhos) TurnFX.cutin(olhos, cor, nome, ladoTela(ev.time)==='aliado'? 1 : -1);
      else TurnFX.banner(nome, cor);
      TurnFX.flash(10, cor);
      TurnFX.carga(orig.x, orig.y, cor, CARGA);
      TurnFX.tremer(3, CARGA);
      TurnFX.focoLinhas(orig.x, orig.y, cor, CARGA+R(10));   // linhas de anime fechando nele
    }
    if(ev.estilo==='foco') TurnFX.aura(orig.x, orig.y, cor, R(34));
    // DEFENDER: hexágono de luz em volta dele
    if(ev.acao==='defender'){
      TurnFX.escudo(orig.x, orig.y, altura(orig), '#7df0ff');
      TurnFX.texto(orig.x, orig.y-altura(orig)*0.58, '🛡 +8 DEFESA', '#7df0ff', 10, { pop:true });
    }
  }

  // 0→1 suave nas pontas
  const suave=k=>{ k=Math.max(0,Math.min(1,k)); return k*k*(3-2*k); };

  /* para a UM BRAÇO de distância do alvo em vez de sobrepor (calculado
     pela distância real, funciona com os times lado a lado ou empilhados) */
  function pontoDeAtaque(orig, pos){
    const ddx=pos.x-orig.x, ddy=pos.y-orig.y;
    const dist=Math.hypot(ddx,ddy)||1;
    // um braço de distância proporcional ao tamanho do alvo (o da frente é maior)
    const parar=Math.min(dist*0.32, Math.max(40, (pos.w||110)*0.42));
    const k=1-parar/dist;
    return { x:ddx*k, y:ddy*k };
  }

  /* o ASTRA no lugar de quem bate (Trombada de Astra, Atropelamento): uma
     forma do TurnFX que vive enquanto a animação durar e desenha o carro
     onde o lutador estaria (`I.atk`) — ele mesmo fica invisível no trajeto. */
  function desenharCarroDaAnim(a){
    const imgs=TurnGolpes.ASTRA(), alt=Math.max(26, altura(a.orig)*0.58);
    let ultX=a.orig.x;
    TurnFX.forma(a.dur+240, ()=>{
      if(anim!==a || !a.carroVisivel) return;
      const x=a.I.atk.x, y=a.I.atk.y+altura(a.orig)*0.45 - alt*0.5;
      const vaiDir = (x-ultX)>0.5 ? true : (x-ultX)<-0.5 ? false : a.I.lado>0;
      // de ré na volta: continua de frente pro inimigo
      const frente = a.voltando ? a.I.lado>0 : vaiDir;
      TurnFX.desenho.desenhaImg(frente? imgs.dir : imgs.esq, x, y - Math.abs(Math.sin(a.t*0.9))*1.5, alt, 0, 1, false);
      if(Math.abs(x-ultX)>2){
        TurnFX.desenho.faisca(x-(frente?1:-1)*alt*0.9, y+alt*0.45, '#d8c8a8', (frente?-1:1)*1.5, -0.6, 14, 4, 0.04);
        if(a.t%3===0) TurnFX.rastroVelocidade(x-(frente?1:-1)*alt*0.5, y, frente?1:-1, '#ffffff', alt);
      }
      ultX=x;
    });
  }

  function passoAnim(){
    if(!anim) return;
    const a=anim, ev=a.ev, f=a.f;
    /* PAUSA DE IMPACTO: a cena inteira congela uns quadros no golpe (as
       poses ficam como estão; só os efeitos do TurnFX seguem rodando) —
       é o que dá PESO à pancada. */
    if(a.pausa>0){ a.pausa--; return; }
    a.t++;
    const t=a.t;
    a.poses={};
    const lado = a.alvos.length && a.alvos[0].pos.x < a.orig.x ? -1 : 1;   // pra que lado ele bate

    // ---------------- atacante ----------------
    let dx=0, dy=0, poseAt='idle', prog=null, animT=t;
    let rot=0, alpha=1, sx=1;                 // giro, sumiço e "de costas" (1.45)
    const G=a.g, I=a.I, mov=G && G.mov;
    if(t<f.CARGA){
      // carregando a ultimate: primeiro quadro do golpe, tremendo de leve
      poseAt=a.pose; prog=0; dx=(t%4<2?1:-1)*1.5;
    } else if(ev.estilo==='corpo'){
      const p0 = a.alvos.length? pontoDeAtaque(a.orig, a.alvos[0].pos) : {x:0,y:0};
      if(t<f.PREP){
        // PREPARO: recua e abaixa um pouco antes de sair
        const k=suave((t-f.CARGA)/(f.PREP-f.CARGA));
        dx=-lado*10*k; dy=3*k; poseAt=a.pose; prog=0;
      } else if(t<f.T0){
        // INVESTIDA: arranca até o alvo, com vulto e um pulinho no meio
        const k=suave((t-f.PREP)/f.DASH);
        dx=-lado*10*(1-k) + p0.x*k; dy=p0.y*k - Math.sin(k*Math.PI)*14;
        poseAt='walk';
        if(t%2===0) TurnFX.fantasma(a.el, a.cor);
        // linhas de velocidade atrás dele enquanto atravessa o palco
        if(t%3===0) TurnFX.rastroVelocidade(a.orig.x+dx, a.orig.y+dy, lado, a.cor, altura(a.orig));
        if(t===f.PREP) TurnFX.poeira(a.orig.x, a.orig.y+altura(a.orig)*0.45, lado);
        // chegou: o pé crava no chão do lado do alvo
        if(t===f.T0-1 && a.alvos[0]) TurnFX.ondaChao(a.orig.x+p0.x, a.orig.y+p0.y+altura(a.orig)*0.45, '#d8c8a8', 22, 14);
      } else if(t<f.VOLTA0){
        // GOLPE: a sequência de poses se espalha pelo tempo do golpe
        const k=(t-f.T0)/f.S;
        poseAt=a.pose; prog=Math.min(1,k);
        let pos=p0;
        if(a.area){
          // golpe em área: vai de um inimigo pro outro
          const m=a.alvos.length, seg=Math.min(m-0.001, k*m), i=Math.floor(seg), fr=seg-i;
          const ant=pontoDeAtaque(a.orig, a.alvos[Math.max(0,i-1)].pos), at=pontoDeAtaque(a.orig, a.alvos[i].pos);
          const kk=i===0? 1 : suave(fr/0.35);
          pos={ x:ant.x+(at.x-ant.x)*kk, y:ant.y+(at.y-ant.y)*kk };
          if(i>0 && fr<0.35 && t%2===0) TurnFX.fantasma(a.el, a.cor);
        }
        // avança um tico no instante de cada golpe (o "peso" do soco)
        const ultimoHit = Math.max(...a.alvos.map(al=>al.ultimoHit||-99));
        const tranco = (t-ultimoHit)<6 ? lado*6*(1-(t-ultimoHit)/6) : 0;
        dx=pos.x+tranco; dy=pos.y;
      } else {
        // VOLTA pro lugar
        const k=suave((t-f.VOLTA0)/f.VOLTA);
        const last = a.area? pontoDeAtaque(a.orig, a.alvos[a.alvos.length-1].pos) : p0;
        dx=last.x*(1-k); dy=last.y*(1-k) - Math.sin(k*Math.PI)*8;
        poseAt = k<0.9? 'walk' : 'idle';
      }

      /* ---- JEITOS DE SE MEXER do golpe sob medida (turngolpes.js) ---- */
      const alvo0=a.alvos[0];
      if(mov && alvo0){
        const rel={ x:alvo0.pos.x-a.orig.x, y:alvo0.pos.y-a.orig.y };
        const atras={ x:rel.x*2-p0.x, y:rel.y*2-p0.y };          // o mesmo braço de distância, do OUTRO lado do alvo
        // o alvo na ponta do palco: "atrás" dele seria fora da tela — encosta na borda
        if(I.palco){ const m=altura(a.orig)*0.28, ax=a.orig.x+atras.x;
          if(ax>I.palco.right-m) atras.x=I.palco.right-m-a.orig.x;
          if(ax<I.palco.left+m)  atras.x=I.palco.left+m-a.orig.x; }
        if(mov==='salto' && t>=f.PREP && t<f.T0){
          // VOADORA: sobe alto, inclinado, e desce com o pé na frente
          const k=suave((t-f.PREP)/f.DASH);
          dy-=Math.sin(k*Math.PI)*Math.max(46, altura(a.orig)*0.85);
          rot=lado*(-0.3+0.55*k); poseAt=a.pose; prog=0.5*k;
        } else if(mov==='giro' && t>=f.PREP && t<f.VOLTA0){
          // ROLAMENTO: vira uma bola rolando o caminho todo
          rot=lado*(t-f.PREP)*0.6; poseAt=a.pose; if(prog==null) prog=0.5;
          if(t%3===0) TurnFX.poeira(a.orig.x+dx, a.orig.y+dy+altura(a.orig)*0.45, lado);
        } else if(mov==='giroGolpe' && t>=f.T0 && t<f.VOLTA0){
          rot=lado*suave((t-f.T0)/f.S)*Math.PI*2;
        } else if(mov==='sombra' && !a.area){
          // SOME na frente dele e APARECE nas costas do alvo
          if(t<f.PREP){ alpha=1-suave((t-f.CARGA)/Math.max(1,f.PREP-f.CARGA)); }
          else if(t<f.T0){ alpha=0; dx=atras.x; dy=atras.y; sx=-1; }
          else if(t<f.VOLTA0){
            const ultimoHit = Math.max(...a.alvos.map(al=>al.ultimoHit||-99));
            const tranco = (t-ultimoHit)<6 ? -lado*6*(1-(t-ultimoHit)/6) : 0;
            dx=atras.x+tranco; dy=atras.y; sx=-1; alpha=Math.min(1,(t-f.T0+1)/3);
          } else {
            const k=(t-f.VOLTA0)/f.VOLTA;
            if(k<0.45){ dx=atras.x; dy=atras.y; sx=-1; alpha=1-k/0.45; } else { dx=0; dy=0; alpha=Math.min(1,(k-0.45)/0.4); }
            poseAt='idle';
          }
          if(t===f.PREP-1) TurnFX.nuvem(a.orig.x, a.orig.y, 18, '#2a1040', 22, a.cor);
          if(t===f.T0)     TurnFX.nuvem(a.orig.x+atras.x, a.orig.y+atras.y, 18, '#2a1040', 22, a.cor);
        } else if(mov==='atravessa' && !a.area && t>=f.T0){
          // ATRAVESSA o alvo como correnteza / entregador e volta pelo outro lado
          if(t<f.VOLTA0){ const k=suave(Math.min(1,(t-f.T0)/(f.S*0.7)));
            dx=p0.x+(atras.x-p0.x)*k; dy=p0.y+(atras.y-p0.y)*k; if(t%2===0) TurnFX.fantasma(a.el, a.cor); }
          else { const k=suave((t-f.VOLTA0)/f.VOLTA); dx=atras.x*(1-k); dy=atras.y*(1-k)-Math.sin(k*Math.PI)*16; }
        } else if(mov==='carro'){
          // o lutador some e o ASTRA faz o trajeto (desenharCarroDaAnim)
          const naRua = t>=f.PREP && t<f.VOLTA0+f.VOLTA*0.9;
          a.carroVisivel=naRua; a.voltando = t>=f.VOLTA0;
          alpha = naRua? 0 : 1;
          if(t>=f.PREP && t<f.T0) dy=p0.y*suave((t-f.PREP)/f.DASH);   // carro não pula
          if(t===f.PREP) TurnFX.onomato('VRUUM!', a.orig.x, a.orig.y-altura(a.orig)*0.5, '#ffe066', 14);
        }
        if(a.area && mov==='atravessa' && t>=f.T0 && t<f.VOLTA0 && t%2===0) TurnFX.fantasma(a.el, a.cor);
      }
    } else if(ev.estilo==='tiro'){
      if(t<f.FIM){
        poseAt=a.pose; prog=Math.min(1,(t-f.CARGA)/Math.max(1,f.W-f.CARGA));
        // recuo do disparo
        const desde=t-f.W;
        if(desde>=0 && desde<10) dx=-lado*8*(1-desde/10);
      }
    } else {
      if(t<f.D+R(8)){
        poseAt=a.pose; prog=Math.min(1,(t-f.CARGA)/Math.max(1,f.D-f.CARGA));
        dy=-Math.sin(Math.min(1,(t-f.CARGA)/(f.D-f.CARGA))*Math.PI)*8;   // sobe e desce concentrando
      }
    }
    // receita que manda no movimento inteiro (o COLAPSO saltando lá do alto)
    if(G && G.movAtacante){
      const o=G.movAtacante(I, t, { dx, dy });
      if(o){ dx=o.dx; dy=o.dy; if(o.pose){ poseAt=o.pose; prog=o.prog!=null? o.prog : null; }
             if(o.rot!=null) rot=o.rot; if(o.alpha!=null) alpha=o.alpha; if(o.sx!=null) sx=o.sx; }
    }
    I.atk.x=a.orig.x+dx; I.atk.y=a.orig.y+dy;
    a.poses[ev.origem]={ pose:poseAt, prog, animT, dx, dy, rot, alpha, sx };

    // receita: começo do golpe e o que roda todo quadro
    if(G && G.origem && t===f.CARGA+2) G.origem(I);
    if(G && G.quadro) G.quadro(I, t);

    // ---------------- efeitos de sprite do golpe (folha de efeitos — o Tupas) ----------------
    const fx = ev.skill.fx || null;
    if(fx && fx.modo==='origem' && t===f.CARGA+2) TurnFX.sprite(fx, a.orig.x, a.orig.y, R(44));
    // efeito em QUEM USOU no começo do golpe (o Cargas carregando o raio)
    if(ev.skill.fxOrigem && t===f.CARGA+2) TurnFX.sprite(ev.skill.fxOrigem, a.orig.x, a.orig.y-6, R(46));
    if(ev.estilo==='foco' && t===f.CARGA+Math.round((f.D-f.CARGA)/2)) TurnFX.aura(a.orig.x, a.orig.y, a.cor, R(30));
    /* URSÃO (Criança Rosa): o card dele já está no campo (o estado novo
       chegou) — então ele "nasce" na encenação: ursinho → ursinho em
       chamas → URSO, num portal da folha de efeitos dela. */
    if(ev.invocou){
      const fimInv = f.D!=null? f.D : f.CARGA+R(40);
      const ini = Math.max(f.CARGA, fimInv-R(34));
      a.poses[ev.invocou.id]={ pose:'surgir', prog:Math.max(0,Math.min(1,(t-ini)/(fimInv-ini))), animT:t, dx:0, dy:0, flash:t===fimInv };
      if(t===ini){
        const p=centroDe(ev.invocou.id);
        if(p) TurnFX.sprite({ folha:'assets/crianca_rosa/crianca_rosa_poderes.png', modo:'alvo', quadros:[[3,1],[3,1],[2,0]], alt:84 }, p.x, p.y, R(40));
      }
      if(t===fimInv){
        const p=centroDe(ev.invocou.id);
        if(p){ TurnFX.impacto(p.x, p.y, '#c4103a', 1.8); TurnFX.texto(p.x, p.y-62, '🐻 URSÃO!', '#ff4d6d', 14); TurnFX.poeira(p.x, p.y+40, 1); }
        if(ev.invocou.custo) TurnFX.texto(a.orig.x, a.orig.y-46, '-'+ev.invocou.custo+' ❤', '#ff6b6b', 12);
        TurnFX.tremer(8, 18); TurnFX.flash(6, '#c4103a');
        atualizarUnidade(ev.origem);
      }
    }
    // o ursinho volta cuidando: cura do ataque básico da Criança Rosa
    if(ev.curaExtra && !a.curaFeita && a.alvos.some(al=>al.hits.some(g=>g.ultimo && g.frame===t))){
      a.curaFeita=true;
      const p=centroDe(ev.curaExtra.id);
      if(p){ TurnFX.aura(p.x, p.y, '#ff9ecb', R(26)); TurnFX.cura(p.x, p.y); TurnFX.texto(p.x, p.y-42, '+'+ev.curaExtra.cura, '#7dff8a', 13); }
      atualizarUnidade(ev.curaExtra.id);
    }
    // FUMAÇA COLORIDA: a bomba do Smergulão estoura e pinta o lado do time
    if(ev.fumacaNova && !a.fumacaSolta && t >= (f.D!=null? f.D-R(10) : f.CARGA+R(20))){
      a.fumacaSolta=true;
      ['#ff5fa2','#5ad6ff','#ffe066','#9cff5e','#c46bff'].forEach((cor,k)=>
        TurnFX.impacto(a.orig.x+(k-2)*22, a.orig.y+10-(k%2)*16, cor, 1.3));
      TurnFX.texto(a.orig.x, a.orig.y-60, '🌈 FUMAÇA COLORIDA!', '#ff9ecb', 11);
      TurnFX.tremer(4, 12);
    }
    // DESMATERIALIZAR: o que ele apagou do campo inimigo (Corsa, muralha, fumaça…)
    if(ev.desfeitos && !a.desfeitosMostrados && a.alvos.some(al=>al.hits.some(g=>g.ultimo && g.frame===t))){
      a.desfeitosMostrados=true;
      const al0=a.alvos[0];
      if(al0) TurnFX.texto(al0.pos.x, al0.pos.y-altura(al0.pos)*0.75, '🌀 '+ev.desfeitos.join(' · ').toUpperCase()+' DESMATERIALIZADO', '#8a5cff', 9, { pop:true, vida:70 });
    }
    // GOLPE TRAIÇOEIRO: ele tinha esquivado — aparece nas costas e avisa
    if(ev.traicoeiro && t===(f.T0!=null? f.T0 : f.W||1) && a.alvos[0])
      TurnFX.texto(a.alvos[0].pos.x, a.alvos[0].pos.y-70, '🗡 TRAIÇOEIRO!', '#c46bff', 11);
    // MURALHA DE LASANHA subindo do chão no fim do golpe do Cabelin
    if(ev.barreiraNova && !a.barreiraErguida && t >= (f.D!=null? f.D-R(8) : f.CARGA+R(20))){
      a.barreiraErguida=true;
      const p=TurnBG.posBarreiraTela(ladoTela(ev.barreiraNova.time));
      if(p){
        TurnFX.poeira(p.x, p.y+40, 1); TurnFX.poeira(p.x, p.y+40, -1);
        TurnFX.anel(p.x, p.y+30, '#ffb83c', 16, 20);
        TurnFX.texto(p.x, p.y-58, '🍝 MURALHA DE LASANHA!', '#ffb83c', 11);
        if(ev.barreiraNova.custo) TurnFX.texto(a.orig.x, a.orig.y-46, '-'+ev.barreiraNova.custo+' ❤', '#ff6b6b', 12);
      }
      TurnFX.tremer(6, 16);
    }

    // ---------------- golpes ----------------
    let houveImpacto=false, houveKO=null;
    const tipo = ev.skill.tipo || 'fisico';
    a.alvos.forEach((al,ai)=>{
      const hAl = altura(al.pos), cabeca = al.pos.y - hAl*0.42;
      al.hits.forEach((g,gi)=>{
        if(ev.estilo==='tiro' && t===g.disparo){
          const sx=a.orig.x+lado*altura(a.orig)*0.2, sy=a.orig.y-altura(a.orig)*0.1;
          const voo=Math.max(4, g.frame-g.disparo);      // chega EXATAMENTE no impacto desse alvo
          /* golpe sob medida: UM objeto pro grupo (vooUm — a granada no meio
             do time) ou o objeto do golpe voando até cada alvo (voo — o pão,
             a bolsa, o punho de energia). Devolveu true = já desenhou. */
          let feito=false;
          if(G){
            if(G.vooUm && !a.vooUmFeito){ a.vooUmFeito=true; a.vooUmTomou=!!G.vooUm(I, { sx, sy, vida:f.VOO }); }
            if(a.vooUmTomou) feito=true;
            else if(G.voo) feito=!!G.voo(I, al, { sx, sy, vida:voo, k:ai, i:gi });
          }
          if(feito){}
          else if(fx && fx.modo==='projetil') TurnFX.spriteProjetil(fx, sx, sy, al.pos.x, al.pos.y, voo);
          // cada ELEMENTO voa do seu jeito: bola de fogo, raio, lasca de gelo, feixe...
          else TurnFX.projetilElemental(tipo, sx, sy, al.pos.x, al.pos.y, a.cor, voo);
        }
        if(t!==g.frame) return;
        if(fx && fx.modo==='alvo' && g.ultimo && !al.r.esquivou) TurnFX.sprite(fx, al.pos.x, al.pos.y-6, R(40));
        // efeito em CADA alvo atingido (raio caindo, explosão de luz…)
        if(ev.skill.fxImpacto && g.ultimo && !al.r.esquivou) TurnFX.sprite(ev.skill.fxImpacto, al.pos.x, al.pos.y-10, R(42));
        if(g.ultimo) a.terrenoMostrado=true;
        const forca = a.sup? 1.7 : (ev.estilo==='corpo'? 1.2 : 1);
        if(al.r.esquivou){
          if(g.ultimo){
            TurnFX.texto(al.pos.x, cabeca, al.r.vulto? '👻 ERA UM VULTO!' : 'ESQUIVOU!', '#7df0ff', 11, { pop:true });
            // esquivou do golpe = escapou do efeito também (ver usarSkill no motor)
            if(al.r.evitou) TurnFX.texto(al.pos.x, cabeca+14, '💨 efeito evitado', '#bff6ff', 8, { vida:56, vy:-0.9 });
            TurnFX.anel(al.pos.x, al.pos.y, '#7df0ff', 8, 12);
            TurnFX.rastroVelocidade(al.pos.x, al.pos.y, al.pos.x>=a.orig.x? 1 : -1, '#7df0ff', hAl);
            // vulto ficando pra trás no lugar onde ele estava
            const pe=centroDe(al.r.id); if(pe) TurnFX.fantasma(pe.el, '#7df0ff');
          }
        } else if(ev.estilo==='foco' || al.r.cura>0){
          // cura / buff / postura: brilho subindo em vez de pancada
          TurnFX.aura(al.pos.x, al.pos.y, al.r.cura>0? '#7dff8a' : a.cor, R(28));
          if(al.r.cura>0 && g.ultimo){
            TurnFX.cura(al.pos.x, al.pos.y);
            TurnFX.ondaChao(al.pos.x, al.pos.y+hAl*0.45, '#7dff8a', 24, 22);
          }
          if(g.ultimo){
            if(al.r.cura>0) TurnFX.numero(al.pos.x, cabeca, '+'+al.r.cura, '#7dff8a', 14);
            else if(ev.skill.rotulo && al===a.alvos[0]) TurnFX.texto(al.pos.x, cabeca-4, ev.skill.rotulo, '#3bff9c', 10, { pop:true });
          }
        } else {
          TurnFX.impacto(al.pos.x, al.pos.y, a.cor, forca);
          if(al.r.dano>0) TurnFX.elemento(tipo, al.pos.x, al.pos.y, forca, hAl);   // a marca do ELEMENTO no alvo
          if(ev.estilo==='corpo' && !(G && G.semCorte)) TurnFX.corte(al.pos.x, al.pos.y, a.cor, a.orig.x<=al.pos.x?1:-1);
          const dano = g.ultimo? al.r.dano : Math.round(al.r.dano*g.parte);
          if(al.r.dano>0){
            /* número que ESTOURA: golpe que tirou um pedaço grande (≥28% da
               vida dele) ou ultimate ganha contorno, tremida e "!" */
            const u=unidadeDe(al.r.id);
            const forte = a.sup || (u && g.ultimo && al.r.dano >= u.hpMax*0.28);
            TurnFX.numero(al.pos.x+(Math.random()*14-7), cabeca-gi*6, '-'+Math.max(1,dano)+(forte&&g.ultimo?'!':''),
                          a.cor, forte? 18 : 14, forte);
            houveImpacto=true;
            // combo: golpe de vários acertos mostra a contagem no último
            if(g.ultimo && al.hits.length>1 && !a.area)
              TurnFX.texto(al.pos.x+lado*hAl*0.45, cabeca-18, al.hits.length+' HITS', '#ffe066', 9, { pop:true, vida:50, vy:-0.6 });
          } else if(ev.skill.rotulo && g.ultimo)
            TurnFX.texto(al.pos.x, cabeca, ev.skill.rotulo, a.cor, 10, { pop:true });
          al.ultimoHit=t;
        }
        // a assinatura do golpe no alvo (o pão batendo, a mordida, o "POW!")
        if(G && G.impacto && !al.r.esquivou && !al.r.barreira) G.impacto(I, al, g);
        if(g.ultimo && al.r.barreira){
          // a muralha sente o golpe: lascas de massa e queijo voando
          a.barreiraBatida=true;
          for(let k=0;k<3;k++) TurnFX.impacto(al.pos.x+(k-1)*14, al.pos.y+(k-1)*10, k%2?'#ffcf5a':'#c8461e', ev.barreira.quebrou? 1.6 : 0.8);
          TurnFX.elemento('lasanha', al.pos.x, al.pos.y, 1, 90);
          if(ev.barreira.quebrou){
            TurnFX.texto(al.pos.x, al.pos.y-64, '💥 MURALHA QUEBROU!', '#ffb83c', 12, { pop:true });
            TurnFX.poeira(al.pos.x, al.pos.y+40, lado);
          }
        }
        if(g.ultimo){
          atualizarUnidade(al.r.id);
          /* EFEITOS que pegaram (veneno, lento, atordoado…): os ícones sobem
             do alvo um pouquinho depois do número, um embaixo do outro */
          if(!al.r.esquivou && al.r.efeitos && al.r.efeitos.length)
            (a.statusPend=a.statusPend||[]).push({ frame:t+R(9), x:al.pos.x, y:al.pos.y-hAl*0.12, lista:al.r.efeitos.slice(0,4) });
          if(al.r.morreu){
            TurnFX.texto(al.pos.x, cabeca-22, 'K.O.', '#ff4d6d', 18, { pop:true, forte:true, vida:60 });
            TurnFX.poeira(al.pos.x, al.pos.y+hAl*0.45, -lado);
            houveKO = al;
          }
        }
        al.batidoEm=t; al.ultimoGolpe=g.ultimo;
      });
    });
    if(houveImpacto){
      a.pausa = a.sup? 7 : (ev.estilo==='corpo'? 4 : 3);
      TurnFX.tremer(a.sup? 9 : (ev.estilo==='corpo'? 5 : 3), a.sup? 20 : 10);
      // ULTIMATE: a câmera dá um soco pra dentro no ponto do impacto
      if(a.sup && !a.zoomFeito){ a.zoomFeito=true; const al0=a.alvos[0]; TurnFX.zoom(1.07, 26, al0.pos.x, al0.pos.y); TurnFX.flash(5, '#ffffff'); }
    }
    if(houveKO){
      // NOCAUTE: a alma sobe, a cena segura mais um pouco e a câmera aproxima
      TurnFX.ko(houveKO.pos.x, houveKO.pos.y, altura(houveKO.pos), a.cor);
      a.pausa = Math.max(a.pausa, 9);
      TurnFX.tremer(10, 20);
      if(!a.zoomFeito){ a.zoomFeito=true; TurnFX.zoom(1.05, 24, houveKO.pos.x, houveKO.pos.y); }
      TurnFX.flash(4, '#ff4d6d');
    }
    // ícones de status que estavam esperando a vez deles
    if(a.statusPend && a.statusPend.length){
      a.statusPend = a.statusPend.filter(sp=>{
        if(t<sp.frame) return true;
        sp.lista.forEach((e,i)=>TurnFX.efeitoStatus(sp.x, sp.y, e, i));
        return false;
      });
    }
    // dreno / auto-cura de quem bateu aparece junto do último golpe
    if(a.alvos.some(al=>al.hits.some(g=>g.ultimo && g.frame===t))){
      atualizarUnidade(ev.origem);
      // SACRIFÍCIO (Careca): a conta da própria vida aparece no último golpe
      if(ev.sacrificio && !a.sacrificioMostrado){
        a.sacrificioMostrado=true;
        TurnFX.numero(a.orig.x, a.orig.y-altura(a.orig)*0.5, '-'+ev.sacrificio.pago+' 💀', '#ff4d6d', 13, !!ev.sacrificio.morreu);
        TurnFX.elemento('sangramento', a.orig.x, a.orig.y, 0.8, altura(a.orig));
        if(ev.sacrificio.morreu) TurnFX.texto(a.orig.x, a.orig.y-altura(a.orig)*0.75, '🪱 A MALDIÇÃO SE MEXE...', '#9cff5e', 10, { pop:true, vida:70 });
      }
    }

    // ---------------- reação dos alvos ----------------
    a.alvos.forEach(al=>{
      if(al.batidoEm==null) return;
      const d=t-al.batidoEm;
      const dir = al.pos.x>=a.orig.x ? 1 : -1;     // empurrado pra longe de quem bateu
      const u=unidadeDe(al.r.id);
      const morto = !!(u && !u.vivo && al.ultimoGolpe);
      // nocauteado fica caído ONDE foi arremessado até a cena acabar
      if(!al.r.esquivou && al.r.dano>0 && (morto || d<R(22))){
        const empurra = (a.sup? 22 : 13) * (morto? 1.5 : 1);
        const k = morto ? Math.min(1, d/10) : Math.max(0, 1-d/R(22));
        a.poses[al.r.id]={ pose:(morto && d>6)?'ko':'hurt', animT:d,
                           dx: dir*empurra*(morto? k : Math.sin(Math.min(1,d/4)*Math.PI/2)*k) + (d<6? (d%2?2:-2) : 0),
                           dy: morto? -Math.sin(Math.min(1,d/10)*Math.PI)*10 : 0,
                           flash:d<4 };
      } else if(al.r.esquivou && d<R(18)){
        const k=Math.sin(Math.min(1,d/R(18))*Math.PI);
        a.poses[al.r.id]={ pose:'jump', animT:d, dx:dir*18*k, dy:-12*k };
      }
    });

    if(t>=a.dur){
      limparTransforms();
      anim=null;
    }
  }

  /* MURALHA DE LASANHA na tela. O motor já resolveu o golpe quando a
     animação começa — então, ATÉ o golpe chegar nela, a tela continua
     mostrando a vida de ANTES (e a muralha recém-erguida só aparece
     quando o Cabelin termina de levantar). Devolve por LADO DA TELA. */
  function ladoTela(time){ return time===meuLado()? 'aliado' : 'inimigo'; }
  function barreirasNaTela(){
    const st=estadoAtual; if(!st) return null;
    const b=Object.assign({}, st.barreiras||{});
    if(anim){
      const ev=anim.ev;
      if(ev.barreira && !anim.barreiraBatida)
        b[ev.barreira.time]={ nome:ev.barreira.nome, icone:ev.barreira.icone, hp:ev.barreira.hpAntes, hpMax:ev.barreira.hpMax };
      if(ev.barreiraNova && !anim.barreiraErguida) b[ev.barreiraNova.time]=null;
    }
    return { aliado:b[meuLado()]||null, inimigo:b[ladoDele()]||null };
  }

  /* FUMAÇA COLORIDA por lado da tela; a recém-lançada só aparece quando a
     bomba do Smergulão cai (o golpe de foco "acerta" os aliados). */
  function fumacasNaTela(){
    const st=estadoAtual; if(!st) return null;
    const f=Object.assign({}, st.fumacas||{});
    if(anim && anim.ev.fumacaNova && !anim.fumacaSolta) f[anim.ev.time]=null;
    return { aliado:f[meuLado()]||null, inimigo:f[ladoDele()]||null };
  }

  /* ULTIMATE: o cenário vai apagando durante a carga e volta depois do golpe */
  function escuroDaUltimate(){
    if(!anim || !anim.sup) return 0;
    const t=anim.t, c=anim.f.CARGA||1;
    if(t<10) return 0.6*(t/10);
    if(t<c+R(26)) return 0.6;
    return Math.max(0, 0.6*(1-(t-c-R(26))/R(22)));
  }

  /* SETA em cima de quem vai agir (some durante as animações e no fim) */
  function marcarVezNaTela(){
    const st=estadoAtual;
    if(!st || st.acabou || anim || !st.atual || !st.atual.vivo){ TurnFX.marcarVez(null); return; }
    const p=centroDe(st.atual.id); if(!p || !p.card){ TurnFX.marcarVez(null); return; }
    // a seta fica em cima da PLACA (que fica em cima da cabeça)
    if(p.topo==null) p.topo=p.card.getBoundingClientRect().top;
    TurnFX.marcarVez(p.x, p.topo-2, st.atual.time===meuLado()? '#7dffc4' : '#ff8a8a');
  }

  function limparTransforms(){
    document.querySelectorAll('#team-inimigo canvas, #team-aliado canvas').forEach(cv=>{
      cv.style.transform=''; cv.style.zIndex=''; cv.style.position=''; cv.style.transformOrigin=''; cv.style.opacity='';
    });
    document.querySelectorAll('.bu.atacando').forEach(el=>el.classList.remove('atacando'));
  }

  /* ---------------- desenho dos lutadores ---------------- */
  /* REDEMOINHO ATIVO (Tupas): fica girando em cima do inimigo que ele vai
     acertar no fim do próximo turno do Tupas — dá pra ver onde ele está. */
  let redemoinhosNaTela={};
  function marcarRedemoinhos(){
    const agora={};
    const todos = estadoAtual ? estadoAtual.times.aliado.concat(estadoAtual.times.inimigo) : [];
    todos.forEach(u=>{
      if(!u.vivo || !u.redemoinho || !u.redemoinho.proximo || !u.ficha.fxRedemoinho) return;
      const p=centroDe(u.redemoinho.proximo); if(!p) return;
      const k='redemoinho_'+u.id; agora[k]=1;
      TurnFX.fixo(k, Object.assign({}, u.ficha.fxRedemoinho, { alt:58 }), p.x, p.y-34);
    });
    Object.keys(redemoinhosNaTela).forEach(k=>{ if(!agora[k]) TurnFX.fixo(k, null); });
    redemoinhosNaTela=agora;
  }

  /* TERRENO com efeito próprio (`terreno.fx` — o Campo Elétrico do
     Cargas): a gaiola de raios fica girando em cima de cada um que está
     preso nele, enquanto o terreno durar. */
  let terrenosNaTela={};
  function marcarTerrenos(){
    const agora={};
    const st=estadoAtual;
    if(st && st.terrenos){
      ['aliado','inimigo'].forEach(time=>{
        const ter=st.terrenos[time]; if(!ter || !ter.fx) return;
        // terreno recém-lançado: a gaiola só fecha quando o golpe chega
        if(anim && anim.ev.terrenoNovo===time && !anim.terrenoMostrado) return;
        (st.times[time]||[]).forEach(u=>{
          if(!u.vivo) return;
          const p=centroDe(u.id); if(!p) return;
          const k='ter_'+u.id; agora[k]=1;
          TurnFX.fixo(k, ter.fx, p.x, p.y-4);
        });
      });
    }
    Object.keys(terrenosNaTela).forEach(k=>{ if(!agora[k]) TurnFX.fixo(k, null); });
    terrenosNaTela=agora;
  }

  let entrada=null, idsLutaAnterior='';   // quadros desde o começo da luta (entrada correndo)
  let timeInicial=null, fimRegistrado=false;   // pra ficha da Condenação (ver render)
  function desenharSprites(){
    document.querySelectorAll('#team-inimigo .bu, #team-aliado .bu').forEach(el=>{
      const cv=el.querySelector('canvas'); if(!cv) return;
      const c=Characters.byId(cv.dataset.cid); if(!c) return;
      const uid=el.dataset.uid;
      const u=unidadeDe(uid);
      const info=(anim && anim.poses[uid]) || null;
      const inimigo=el.parentElement.classList.contains('inimigo');

      /* POSTURA de meditação: não tem contador de turnos — ela fica
         sentada até ATACAR (o motor limpa `emMeditacao` no primeiro
         golpe que tira vida). Enquanto isso a pose é a `special`. */
      const meditando = !!(u && u.emMeditacao && u.vivo);
      /* enquanto está MEDITANDO, apanhar não "levanta" ela — a reação de
         dano (`hurt`) é ignorada de propósito e a pose continua travada
         em `special`. Só uma pancada FATAL (info.pose==='ko') interrompe
         de verdade. Sem isso, cada acerto sofrido piscava a pose de pé
         da reação de dano e parecia que ela tinha saído da meditação. */
      const ignoraReacao = meditando && info && info.pose==='hurt';
      /* Careca: morto esperando a maldição (`renasce`) mostra a
         METAMORFOSE em loop; enterrado (Toca do Verme) só o montinho de terra. */
      // FIM DA LUTA: quem ganhou comemora pulando (quem caiu continua caído)
      const venceu = !!(estadoAtual && estadoAtual.acabou && u && u.vivo);
      const parado = !u ? 'idle'
        : !u.vivo ? (u.renasce? 'metamorfose' : 'ko')
        : u.enterrado ? 'enterrado'
        : u.naMoita>0 ? 'escondido'          // Smergulão parado dentro da moita
        : u.sumida>0 ? 'sumida'              // Prodocimo: só o vulto meio transparente
        : u.fase>0 ? 'fantasma'              // Dmaterelizador desmaterializado (cubinhos)
        : u.esgotado>0 ? 'esgotado'          // Dmaterelizador sem poder depois da ult
        : venceu ? 'win'
        : meditando ? 'special' : 'idle';
      let pose = (info && !ignoraReacao)? info.pose : parado;
      // meditando fica praticamente parada — animT travado, sem o
      // balancinho constante do idle normal (ver passiva Fúria de
      // Nunchaco / Meditação Branca da Fat Girl).
      let poseAnimT = (info && !ignoraReacao)? info.animT : (meditando? 0 : t);
      /* VIDA no parado: cada um RESPIRA (sobe e desce 1–2px, fora de fase
         com os outros) e quem ganhou dá pulinhos. Só sem animação em cima.
         `k` acompanha o tamanho do canvas (o diorama tem lutador de vários
         tamanhos — o da frente respira "maior" que o do fundo). */
      const k = cv.height/128;
      let dyVivo = 0;
      if(!info && u && u.vivo){
        const fase = (uid.length*7 + (uid.charCodeAt(0)||0)) % 30;
        dyVivo = venceu ? -Math.round(Math.abs(Math.sin((t+fase*3)*0.11))*11*k)
               : (parado==='idle' ? Math.round(Math.sin((t+fase*5)*0.05)*1.6*k) : 0);
      }
      /* ENTRADA da luta: nos primeiros quadros todo mundo chega correndo
         de fora do palco (cada um um pouco depois do outro) */
      let ent = null;
      if(entrada!=null && entrada < 70 && u && u.vivo){
        const ordemEl = Array.prototype.indexOf.call(el.parentElement.children, el);
        const k = Math.max(0, Math.min(1, (entrada - ordemEl*7)/34));
        const kk = 1-Math.pow(1-k,3);
        if(k<1){ ent = { dx:(inimigo? 1 : -1)*(1-kk)*240, dy:-Math.round(Math.abs(Math.sin(k*Math.PI*3))*6) }; pose='walk'; dyVivo=0; }
      }
      /* CHÃO: sombra sempre; anel pulsando em quem é a VEZ (verde = meu
         lado, vermelho = do outro) ou em quem dá pra MIRAR agora (amarelo) */
      const st=estadoAtual;
      const ehVez = !!(st && !st.acabou && !anim && st.atual && st.atual.id===uid && u && u.vivo);
      const anel = el.classList.contains('alvo') ? '#ffe066'
                 : ehVez ? (inimigo ? '#ff6b6b' : '#7dffc4') : null;
      // o lado inimigo olha para o outro lado
      Sprites.renderPose(cv, Characters.charComSkin(c), {
        pose, t, animT: poseAnimT, prog: (info && !ignoraReacao)? info.prog : null,
        form:+cv.dataset.form||0, dir: inimigo? -1 : 1,
        flash: !!(info && info.flash), targetH: Math.round(cv.height*0.80), dy: dyVivo,
        chao:{ sombra:true, anel, pulso:(Math.sin(t*0.12)+1)/2 }
      });

      // MODO FURTIVO: meio apagado, piscando de leve — difícil de enxergar
      const furt = !!(u && u.vivo && u.modoFurtivo>0);
      let op = furt ? String(0.55+Math.sin(t*0.08)*0.12) : '';
      // golpe sob medida: sumiu (Passo nas Sombras) ou virou o Astra
      if(info && info.alpha!=null && info.alpha<1) op=String(Math.max(0, info.alpha).toFixed(2));
      if(cv.style.opacity!==op) cv.style.opacity=op;
      // o deslocamento é no ELEMENTO (assim o sprite sai do card e
      // atravessa a tela em vez de ser cortado pela moldura)
      const extra = info ? (info.rot? ` rotate(${info.rot.toFixed(3)}rad)` : '') + (info.sx===-1? ' scaleX(-1)' : '') : '';
      if(ent){
        cv.style.position='relative'; cv.style.zIndex='30';
        cv.style.transform=`translate(${Math.round(ent.dx)}px, ${Math.round(ent.dy)}px)`;
      } else if(info && (info.dx||info.dy||extra)){
        cv.style.position='relative'; cv.style.zIndex='30';
        cv.style.transformOrigin = info.rot? '50% 62%' : '';
        cv.style.transform=`translate(${Math.round(info.dx||0)}px, ${Math.round(info.dy||0)}px)`+extra;
      } else if(cv.style.transform){
        cv.style.transform=''; cv.style.zIndex=''; cv.style.position='';
      }
      // quem avança no outro time passa na FRENTE de todo mundo (o card inteiro)
      const avancando = !!(info && (Math.abs(info.dx||0)>8 || Math.abs(info.dy||0)>8));
      if(el.classList.contains('atacando')!==avancando) el.classList.toggle('atacando', avancando);
    });
  }

  /* ÚNICO caminho de saída de uma jogada: local resolve na hora, online
     entrega ao TurnOnline (que manda pela rede ou resolve, se eu for o
     anfitrião). A tela não fala mais direto com o motor. */
  function atacar(i, alvoUid){
    if(ctrl && ctrl.online) ctrl.acao(i, alvoUid||null);
    else {
      const st=TurnBattle.estado();
      TurnBattle.usarSkill(st.atual, i, alvoUid? TurnBattle.unidade(alvoUid) : null);
    }
  }

  function escolherSkill(i){
    if(animando()) return;
    const st=estadoAtual;
    if(!minhaVez(st)) return;
    const u=st.atual, s=TurnBattle.skillEfetiva(u, i);
    if(!s || u.cds[i]>0 || (u.desabilitadas||[]).some(d=>d.i===i)) return;
    // golpes que não precisam escolher alvo saem na hora
    if(s.alvo!=='inimigo' && s.alvo!=='aliado' && s.alvo!=='qualquer'){ skillEscolhida=null; atacar(i, null); return; }
    skillEscolhida = (skillEscolhida===i)? null : i;
    render(st);
  }
  /* DESATIVAR o redemoinho do Tupas: ação livre (o motor não passa o
     turno). Online vai pelo controle da partida, como qualquer jogada. */
  function desativarRedemoinho(){
    if(animando()) return;
    const st=estadoAtual;
    if(!minhaVez(st) || !st.atual.redemoinho) return;
    skillEscolhida=null;
    if(ctrl && ctrl.online){ if(ctrl.desativar) ctrl.desativar(); return; }
    TurnBattle.desativarRedemoinho(TurnBattle.estado().atual);
  }

  function defender(){
    if(animando()) return;
    const st=estadoAtual;
    if(!minhaVez(st)) return;
    skillEscolhida=null;
    if(ctrl && ctrl.online) ctrl.defender();
    else TurnBattle.defender(st.atual);
  }

  /* animação contínua da tela de batalha */
  let fxLigado=false;
  function loopBatalha(){
    t++;
    /* guarda: se a tela sumir do DOM, o loop inteiro morria numa exceção
       e a batalha congelava sem aviso. Melhor pular o quadro. */
    const tela=document.getElementById('screen-battle');
    const naBatalha=!!(tela && tela.classList.contains('active'));
    if(naBatalha!==fxLigado){ fxLigado=naBatalha; TurnFX.ativo(naBatalha); if(!naBatalha){ anim=null; fecharFicha(); } }
    if(naBatalha){
      cacheCentros={};                       // retângulos valem só neste quadro
      if(tamanhosSujos) dimensionarCanvas();
      TurnBG.passo(estadoAtual&&estadoAtual.estruturas,
                   estadoAtual&&estadoAtual.ambiente,     // cenário + Corsa + clima
                   barreirasNaTela(),                     // + Muralha de Lasanha
                   fumacasNaTela(),                       // + Fumaça Colorida
                   escuroDaUltimate());                   // cenário apaga na ultimate
      /* LEITURAS primeiro (posições na tela), ESCRITAS depois (transform
         dos sprites): ler um retângulo depois de escrever um transform no
         mesmo quadro obriga o navegador a refazer o layout na hora. */
      marcarVezNaTela();
      marcarRedemoinhos();
      marcarTerrenos();
      soltarNumerosPendentes();
      // todo mundo chegou correndo: "⚔ LUTEM!" (com o nome da fase/adversário embaixo)
      if(entrada===46) TurnFX.anuncio('⚔ LUTEM!', '#ffe066', subtituloLuta(), 72);
      if(estadoAtual && estadoAtual.acabou && !fimFestejado && !anim && !(entrada!=null && entrada<70)){
        fimFestejado=true; festejarFim();
      }
      passoAnim();
      if(entrada!=null && entrada<70) entrada++;
      desenharSprites();
      TurnFX.passo();
    } else cacheCentros=null;
    requestAnimationFrame(loopBatalha);
  }
  loopBatalha();

  return { abrirMontagem, comecar, lutarComTime, sairMontagem, escolherSkill, defender, alternar,
           abrirFichaUnidade, fecharFicha,
           // modo sobrevivência
           iniciarSurvival, continuarSurvival, sairSurvival,
           // modo história (js/historia.js)
           iniciarHistoria, concluirHistoria, repetirHistoria, sairHistoria, desativarRedemoinho,
           // modo condenação (js/condenacao.js)
           iniciarCondenacao,
           // usados pela ranqueada online (js/turnonline.js)
           iniciarOnline, aplicarEstado, aguardando, fimOnline, quandoLivre, animando,
           // modo espectador (js/espectador.js)
           iniciarEspectador, mostrarDraftEspectador, fimEspectador, sairEspectador,
           get meuTime(){ return meuTime; } };
})();
