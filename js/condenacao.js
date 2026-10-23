/* ============================================================
   MODO CONDENAÇÃO — você contra um BOT ESTRATEGISTA (a rainha
   Smergula, no Tribunal). Igual à ranqueada (1 ban de cada lado,
   escolha alternada, ninguém repete personagem), mas sem pontos.

   O que o bot sabe:
     · a SUA FICHA — com quem você joga e quanto ganha com cada um, em
       TODO 3x3 que você joga (offline, sobrevivência, online, a própria
       Condenação). Fica no navegador (`localStorage`), registrada pelo
       TurnUI no fim de cada luta (ver `registrarPartida`).
     · a TABELA de dados (js/condenacao_dados.js): vitória de cada um,
       de cada um CONTRA cada outro e de cada DUPLA de aliados.

   O que o bot faz:
     · BANE o personagem que você MAIS joga e com o qual MAIS ganha (sem
       ficha ainda: o mais forte do jogo).
     · ESCOLHE pesando: força geral + vantagem contra os SEUS escolhidos +
       sinergia com os DELE + o quanto aquele personagem seria bom PRA
       VOCÊ (tira de você o que te ajudaria — inclusive o seu conforto).
     · Na luta usa a IA ESPERTA do motor (`iaEsperta`, ver turnbattle.js).
   Toda decisão vem com o MOTIVO, dito pela rainha.

   Reaproveita a tela do draft da ranqueada (`screen-draft`) — só o
   título, a fala e os botões mudam.
   ============================================================ */
const Condenacao = (function(){

  /* ================= FICHA DO JOGADOR ================= */
  const FICHA_KEY='condenacao_ficha_v1';    // { charId: { j:jogos, v:vitórias } }
  function ficha(){ try{ return JSON.parse(localStorage.getItem(FICHA_KEY))||{}; }catch(e){ return {}; } }
  function registrarPartida(ids, venceu){
    if(!ids || !ids.length) return;
    const f=ficha();
    ids.forEach(id=>{ if(!id) return; const r=f[id]=f[id]||{j:0,v:0}; r.j++; if(venceu) r.v++; });
    try{ localStorage.setItem(FICHA_KEY, JSON.stringify(f)); }catch(e){}
  }
  /* vitória "suavizada": com poucos jogos puxa pra 50% (5 jogos fantasmas
     meio a meio) — senão 1 vitória em 1 jogo viraria 100% e decidiria o ban */
  const wrSuave = r => (r.v + 2.5) / (r.j + 5);
  const pct = x => Math.round(x*100)+'%';
  const nome = id => { const c=Characters.byId(id); return c? c.name : id; };

  /* ================= TABELA ================= */
  const D = () => (typeof CondenacaoDados!=='undefined') ? CondenacaoDados : { meta:{}, vs:{}, sin:{} };
  const meta = id => (D().meta[id]!=null ? D().meta[id] : 50);
  const vs   = (a,b) => (D().vs[a] && D().vs[a][b]!=null ? D().vs[a][b] : 50);
  const sin  = (a,b) => { const k=[a,b].sort().join('+'); return D().sin[k]!=null ? D().sin[k] : 50; };

  /* ================= CÉREBRO DO BOT ================= */
  /* BAN: o que você MAIS joga e com o que você MAIS ganha. "Mais joga" =
     pelo menos 35% dos jogos do seu mais jogado (e 2+ jogos); entre esses,
     o de maior vitória suavizada. Sem ficha (menos de 3 jogos com alguém):
     o mais forte do jogo pela tabela. */
  function decidirBan(pool){
    const f=ficha();
    const jogados=pool.filter(id=>f[id] && f[id].j>0).map(id=>({ id, r:f[id] }));
    const maxJ=Math.max(0, ...jogados.map(x=>x.r.j));
    if(maxJ>=3){
      const frequentes=jogados.filter(x=>x.r.j >= Math.max(2, maxJ*0.35));
      frequentes.sort((a,b)=> (wrSuave(b.r)-wrSuave(a.r)) || (b.r.j-a.r.j));
      const x=frequentes[0];
      return { id:x.id, motivo:`Você já lutou ${x.r.j} vezes com ${nome(x.id)} e venceu ${pct(x.r.v/x.r.j)}. `+
                                `Ele é seu queridinho. Está CONDENADO.` };
    }
    const top=pool.slice().sort((a,b)=>meta(b)-meta(a))[0];
    return { id:top, motivo:`Ainda não te conheço... então condeno o mais perigoso do reino: `+
                            `${nome(top)} (${meta(top)}% de vitória).` };
  }

  /* quanto um personagem vale PRA UM LADO, dado o que cada lado já pegou */
  function valor(c, aliados, rivais){
    let v = (meta(c)-50);
    rivais.forEach(e => v += (vs(c,e)-50)*1.3);     // bate bem nos que o outro pegou
    aliados.forEach(a => v += (sin(c,a)-50)*0.9);    // combina com o próprio time
    return v;
  }
  /* ESCOLHA: valor pro bot + 45% do valor que ele teria PRO JOGADOR
     (negação) + o conforto do jogador com ele (ficha). Um pouquinho de
     sorte entre os quase-empatados, senão o bot fica 100% previsível. */
  function decidirEscolha(pool, meus, deles){
    const f=ficha();
    const notas=pool.map(c=>{
      const praMim=valor(c, meus, deles);
      let praEle=valor(c, deles, meus);
      const fr=f[c]; if(fr && fr.j>=3) praEle += (wrSuave(fr)-0.5)*24;
      return { c, praMim, praEle, total: praMim + 0.45*Math.max(0, praEle) };
    }).sort((a,b)=>b.total-a.total);
    const melhores=notas.filter(n=>n.total >= notas[0].total-1.5);
    const e=melhores[(Math.random()*melhores.length)|0];
    return { id:e.c, motivo:motivoDaEscolha(e, meus, deles) };
  }
  function motivoDaEscolha(e, meus, deles){
    const c=e.c, partes=[];
    // melhor duelo contra os seus
    if(deles.length){
      const pior=deles.slice().sort((a,b)=>vs(c,b)-vs(c,a))[0];
      if(vs(c,pior)>=53) partes.push(`${nome(c)} vence ${Math.round(vs(c,pior))}% contra o seu ${nome(pior)}`);
    }
    if(meus.length){
      const par=meus.slice().sort((a,b)=>sin(c,b)-sin(c,a))[0];
      if(sin(c,par)>=55) partes.push(`junto com ${nome(par)} ganha ${Math.round(sin(c,par))}%`);
    }
    if(e.praEle>8) partes.push(`e seria ótimo PRA VOCÊ — não vai ter`);
    if(!partes.length) partes.push(`${nome(c)} é dos mais fortes que sobraram (${meta(c)}%)`);
    return partes.join(', ')+'.';
  }

  /* ================= DRAFT LOCAL ================= */
  let ativo=false, fase='banimento', banidos=null, pool=[], picks=null, vez=null, acabou=false;
  let banDoBot=null, fala='', pensandoId=null;

  function el(id){ return document.getElementById(id); }

  function abrir(){
    ativo=true; fase='banimento'; acabou=false;
    banidos={ jogador:null, bot:null };
    picks={ jogador:[], bot:[] }; vez=null;
    pool=Characters.jogaveis().map(c=>c.id).filter(id=>TurnData.ficha(id));
    banDoBot=decidirBan(pool);          // decidido JÁ — só aparece depois do seu ban (igual ranqueada: às cegas)
    fala='👑 "Então você veio ser julgado. Escolha quem vai CONDENAR primeiro. Eu já escolhi o meu."';
    goto('draft');
    const tt=el('draft-titulo'); if(tt) tt.textContent='⚖ CONDENAÇÃO — O TRIBUNAL DA RAINHA';
    const nd=el('draft-nome-dele'); if(nd) nd.textContent='👑 RAINHA SMERGULA';
    const ac=el('draft-acoes');
    if(ac) ac.innerHTML=`<button class="btn-big alt2" onclick="Condenacao.desistir()">🏳 DESISTIR</button>`;
    render();
  }

  function desistir(){
    ativo=false; clearTimeout(pensandoId);
    limparTela();
    goto('menu');
  }
  function limparTela(){
    const ac=el('draft-acoes'); if(ac) ac.innerHTML='';
    const fl=el('draft-fala'); if(fl) fl.textContent='';
  }

  function banir(id){
    if(!ativo || fase!=='banimento' || banidos.jogador) return;
    banidos.jogador=id;
    // o bot não pode ter banido o MESMO (aí ele troca pelo próximo da lista dele)
    let b=banDoBot;
    if(b.id===id) b=decidirBan(pool.filter(x=>x!==id));
    banidos.bot=b.id;
    pool=pool.filter(x=>x!==banidos.jogador && x!==banidos.bot);
    fala=`👑 "${b.motivo}"`;
    fase='escolha';
    vez = Math.random()<0.5 ? 'jogador' : 'bot';
    render();
    if(vez==='bot') vezDoBot();
  }

  function escolher(id){
    if(!ativo || fase!=='escolha' || vez!=='jogador' || pool.indexOf(id)<0) return;
    aplicar('jogador', id);
  }

  function aplicar(lado, id){
    pool.splice(pool.indexOf(id),1);
    picks[lado].push(id);
    acabou = picks.jogador.length>=3 && picks.bot.length>=3;
    vez = acabou ? null : (lado==='jogador' ? 'bot' : 'jogador');
    // quem já fechou o time passa a vez (não acontece na alternância 1-1, mas protege)
    if(!acabou && vez && picks[vez].length>=3) vez = vez==='bot'? 'jogador' : 'bot';
    render();
    if(acabou){ fase='fim'; render(); pensandoId=setTimeout(lutar, 1600); return; }
    if(vez==='bot') vezDoBot();
  }

  function vezDoBot(){
    fala='👑 A rainha está analisando o seu time…';
    render();
    clearTimeout(pensandoId);
    pensandoId=setTimeout(()=>{
      if(!ativo || vez!=='bot') return;
      const d=decidirEscolha(pool, picks.bot, picks.jogador);
      fala=`👑 "Eu fico com ${nome(d.id).toUpperCase()}: ${d.motivo}"`;
      aplicar('bot', d.id);
    }, 1300);
  }

  function lutar(){
    if(!ativo) return;
    ativo=false;
    limparTela();
    TurnUI.iniciarCondenacao(picks.jogador.slice(), picks.bot.slice());
  }

  /* ================= DESENHO (mesmos elementos do draft da ranqueada) ================= */
  function chipsHTML(ids, ban){
    if(ban!==undefined){
      if(!ban) return `<div class="draft-chip vazio">?</div>`;
      return `<div class="draft-chip banido"><canvas width="52" height="52" data-chip="${ban}"></canvas><span>${nome(ban)}</span></div>`;
    }
    return [0,1,2].map(i=>{
      const id=ids[i];
      if(!id) return `<div class="draft-chip vazio">?</div>`;
      return `<div class="draft-chip"><canvas width="52" height="52" data-chip="${id}"></canvas><span>${nome(id)}</span></div>`;
    }).join('');
  }

  function render(){
    const st=el('draft-status'), fl=el('draft-fala');
    if(fl) fl.textContent=fala;
    const f=ficha();
    if(fase==='banimento'){
      if(st) st.innerHTML='🚫 <b>Escolha um personagem para BANIR</b> — some pros dois lados nesta partida. A rainha já escolheu o dela.';
      const meu=el('draft-meu'); if(meu) meu.innerHTML=chipsHTML(null, banidos.jogador);
      const dele=el('draft-dele'); if(dele) dele.innerHTML=chipsHTML(null, null);
    } else {
      if(st) st.innerHTML = acabou ? '⚖ Times definidos — o julgamento vai começar…'
        : (vez==='jogador' ? '<b>Sua vez</b> — escolha um lutador' : 'Vez da <b>rainha</b> escolher…');
      const meu=el('draft-meu'); if(meu) meu.innerHTML=chipsHTML(picks.jogador);
      const dele=el('draft-dele'); if(dele) dele.innerHTML=chipsHTML(picks.bot);
    }
    const grid=el('draft-grid'); if(!grid) return;
    grid.innerHTML='';
    Characters.jogaveis().forEach(c=>{
      if(!TurnData.ficha(c.id)) return;
      const banido = banidos.jogador===c.id || banidos.bot===c.id;
      if(fase!=='banimento' && banido) return;
      const disponivel = fase==='banimento' ? !banidos.jogador : pool.indexOf(c.id)>=0;
      const meu = picks.jogador.indexOf(c.id)>=0, dela = picks.bot.indexOf(c.id)>=0;
      const clicavel = fase==='banimento' ? !banidos.jogador : (vez==='jogador' && disponivel && !acabou);
      const cell=document.createElement('div');
      cell.className='char-cell draft-cell'+(!disponivel&&fase!=='banimento'?' indisponivel':'')+
        (meu||banidos.jogador===c.id?' p1':'')+(dela?' p2':'')+(clicavel?' clicavel':' indisponivel');
      const cv=document.createElement('canvas'); cv.width=170; cv.height=170; cv.dataset.id=c.id; cell.appendChild(cv);
      const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=c.name; cell.appendChild(nm);
      const tg=document.createElement('div'); tg.className='char-tag';
      const r=f[c.id];
      tg.textContent = banidos.jogador===c.id ? '🚫 seu banimento'
        : meu ? '✅ seu time' : dela ? '👑 time da rainha'
        : (r && r.j ? `📊 você: ${r.j}j · ${pct(r.v/r.j)}` : '');
      cell.appendChild(tg);
      if(clicavel) cell.onclick = fase==='banimento' ? ()=>banir(c.id) : ()=>escolher(c.id);
      grid.appendChild(cell);
    });
  }

  /* o que a rainha "sabe" de você (pro diálogo do hub) */
  function resumoFicha(){
    const f=ficha();
    const l=Object.keys(f).filter(id=>Characters.byId(id) && f[id].j>0)
      .sort((a,b)=>f[b].j-f[a].j).slice(0,4);
    if(!l.length) return 'Eu ainda não sei NADA sobre você. Lute algumas vezes no 3x3 e eu vou aprendendo com quem você joga.';
    return 'Eu sei com quem você luta: '+l.map(id=>`${nome(id)} (${f[id].j} lutas, ${pct(f[id].v/f[id].j)} de vitória)`).join(', ')+
           '. É por aí que eu começo a te condenar.';
  }

  /* ================= FERRAMENTA DE DEV: regerar a tabela =================
     Rode no console depois de mexer em balanço: Condenacao.gerarTabela(60000)
     e cole o objeto que ele devolve em js/condenacao_dados.js. */
  function gerarTabela(N){
    const ids=Characters.jogaveis().map(c=>c.id).filter(id=>TurnData.ficha(id));
    const M={}, V={}, S={}; let n=0;
    const add=(o,k,w)=>{ const r=o[k]=o[k]||{w:0,n:0}; r.n++; if(w) r.w++; };
    TurnBattle.setDelayIA(0); TurnBattle.setEspera(null);
    for(let k=0;k<(N||60000);k++){
      const p=ids.slice(); for(let i=p.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [p[i],p[j]]=[p[j],p[i]]; }
      const A=p.slice(0,3), B=p.slice(3,6);
      TurnBattle.iniciar(A,B,null,{}); let g=0;
      while(!TurnBattle.estado().acabou && g++<800){ const s=TurnBattle.estado(); if(s.atual&&s.atual.time==='aliado') TurnBattle.jogadaDaIA(s.atual); else break; }
      const s=TurnBattle.estado(); if(!s.acabou) continue; n++;
      const wa=!!s.venceu;
      A.forEach(a=>{ add(M,a,wa); B.forEach(b=>{ add(V,a+'>'+b,wa); add(V,b+'>'+a,!wa); }); });
      B.forEach(b=>add(M,b,!wa));
      for(let i=0;i<3;i++) for(let j=i+1;j<3;j++){ add(S,[A[i],A[j]].sort().join('+'),wa); add(S,[B[i],B[j]].sort().join('+'),!wa); }
    }
    const r=o=>Math.round(1000*o.w/o.n)/10;
    const meta={}, vsT={}, sinT={};
    ids.forEach(a=>{ meta[a]=r(M[a]); vsT[a]={}; ids.forEach(b=>{ if(a!==b && V[a+'>'+b]) vsT[a][b]=r(V[a+'>'+b]); }); });
    Object.keys(S).forEach(k=>sinT[k]=r(S[k]));
    return { versao:(typeof PatchNotes!=='undefined'? PatchNotes.VERSAO_ATUAL:'?'), lutas:n, meta, vs:vsT, sin:sinT };
  }

  return { abrir, desistir, banir, escolher, registrarPartida, ficha, resumoFicha, gerarTabela,
           decidirBan, decidirEscolha, get ativo(){ return ativo; } };
})();
