/* ============================================================
   MISSÕES — roteiro, progresso e salvamento do Modo História
   ------------------------------------------------------------
   O ROTEIRO (js/roteiro_*.js) se registra aqui com `Missoes.def`:
     .missao(id, {cap, tipo:'principal'|'secundaria', titulo, resumo,
                  requer:[ids] | (S)=>bool, doador:npcId, oferta:[falas],
                  passos:[…], recompensa:{…}, retorno:[area,x,y]})
     .npc(id, {char|desenho, nome, em:[area,x,y], dir, anda, se, falas})
     .inimigo(id, {desenho|char, em, rota, visao, luta, se})
     .luta(id, {titulo, time, mais, inimigos, ajustes, cenario, antes,
                depois, chefe, rejogavel, condenacao})
     .gatilho({id, area, ret:[x,y,w,h], se, uma, faz:[ações]})
     .arquivo(id, {cat, titulo, texto})       (o diário de lore)
     .coletavel(id, {tipo, nome, texto})      (relógio parado, cartaz…)
     .viagem(id, {nome, area, x, y})          (ponto do Táxi do Astra)
   PASSO de missão: {obj, tipo, …} — tipos: falar (npc, cena), ir (alvo:
   [area,x,y,r]), luta (luta, npc?), cena (cena|fala, roda sozinho),
   coletar (coletar:tipo, quantos), investigar (objetos:[ids]).
   Opcionais: aoIniciar/aoConcluir: [ações], onde: 'texto'.
   AÇÕES (`Missoes.fazer`): {fala}, {cena, cenario}, {luta}, {grupo:'+id'},
   {lider}, {flag, v}, {iniciar}, {ir:[area,x,y,dir]}, {pos:[quem,x,y,dir]},
   {hora}, {toast}, {arquivo}, {esperar}, {fn}, {salvarAqui}.

   SALVAMENTO: localStorage['historia_mundo_v1']. O save antigo (lista de
   fases) NÃO é mais migrado: desde a 1.37 todo mundo recomeça (RESET_VERSAO).
   As tabelas `migracao`/`migracaoMais` dos roteiros ficaram sem efeito.
   ============================================================ */
const Missoes = (function(){
  const CHAVE='historia_mundo_v1';
  const MISSOES={}, NPCS={}, INIMIGOS={}, LUTAS={}, GATILHOS=[], ARQUIVO={}, COLETAVEIS={}, VIAGENS={}, OBJETOS=[], ITENS={};
  const ORDEM=[];       // ordem de registro (é a ordem do diário e da história)
  let MIGRACAO=[];      // [{cap, fases, ate:missaoId}]
  let INICIO={ area:'lab5000z', x:10, y:10, dir:0, grupo:['mecas'], lider:'mecas' };

  const def = {
    missao(id, d){ MISSOES[id]=Object.assign({ id, tipo:'principal', passos:[] }, d); ORDEM.push(id); },
    npc(id, d){ NPCS[id]=Object.assign({ id }, d); },
    inimigo(id, d){ INIMIGOS[id]=Object.assign({ id }, d); },
    luta(id, d){ LUTAS[id]=Object.assign({ id }, d); },
    gatilho(d){ GATILHOS.push(d); },
    arquivo(id, d){ ARQUIVO[id]=Object.assign({ id }, d); },
    coletavel(id, d){ COLETAVEIS[id]=Object.assign({ id }, d); },
    viagem(id, d){ VIAGENS[id]=Object.assign({ id }, d); },
    /* objeto que o roteiro põe no mapa (coletável, pista): entra quando a região é gerada.
       `pegar:'item'` = some depois de pego (vira item do inventário) */
    obj(area, nome, x, y, extra){ extra=extra||{}; if(extra.pegar && !extra.se){ const k=extra.pegar; extra.se=S=>!S.flag('pegou:'+k); } OBJETOS.push({ area, nome, x, y, extra }); },
    /* item-chave (chave, peça, bilhete): aparece na aba 🎒 do diário */
    item(id, d){ ITENS[id]=Object.assign({ id, icone:'🔸' }, d); },
    migracao(lista){ MIGRACAO=lista; },
    migracaoMais(lista){ MIGRACAO=MIGRACAO.concat(lista); },
    inicio(d){ INICIO=Object.assign(INICIO, d); }
  };

  /* ================= ESTADO ================= */
  let dados=null;
  function novoSave(){
    return { v:1, area:INICIO.area, x:INICIO.x, y:INICIO.y, dir:INICIO.dir, lider:INICIO.lider, grupo:INICIO.grupo.slice(),
             flags:{}, missoes:{}, marcada:null, coletados:{}, arquivo:{}, bonus:{ hp:0 }, salvoEm:{ area:INICIO.area, x:INICIO.x, y:INICIO.y },
             tempoJogado:0, minimapa:true, gatilhos:{}, itens:{}, puz:{}, veiculos:{} };
  }
  const S = {
    get dados(){ return dados; },
    get grupo(){ return dados.grupo; },
    flag(k){ return !!(dados && dados.flags[k]); },
    setFlag(k,v){ dados.flags[k] = v===undefined ? true : v; if(!dados.flags[k]) delete dados.flags[k]; },
    feita(id){ const x=dados.missoes[id]; return !!(x && x.feita); },
    ativa(id){ const x=dados.missoes[id]; return !!(x && !x.feita); },
    comecou(id){ return !!dados.missoes[id]; },
    passo(id){ const x=dados.missoes[id]; return x ? (x.feita ? 1e9 : x.passo) : -1; },
    no(id, n){ const x=dados.missoes[id]; return !!(x && !x.feita && x.passo===n); },
    depois(id, n){ const x=dados.missoes[id]; return !!(x && (x.feita || x.passo>=n)); },
    coletou(id){ return !!dados.coletados[id]; },
    quantos(tipo){ return Object.keys(dados.coletados).filter(k=>COLETAVEIS[k] && COLETAVEIS[k].tipo===tipo).length; },
    noGrupo(id){ return dados.grupo.indexOf(id)>=0; },
    tem(item){ return !!(dados.itens && dados.itens[item]>0); },
    /* estado livre dos puzzles (engrenagens, código, ordem…) */
    puz(k, v){ dados.puz=dados.puz||{}; if(v!==undefined){ dados.puz[k]=v; gravar(); } return dados.puz[k]; }
  };
  /* liga uma flag e avisa quem espera por ela (passo `puzzle`) */
  function marcarFlag(k, v){ S.setFlag(k, v); gravar(); evento('flag', k); if(Mundo.recriarEntidadesSuave) Mundo.recriarEntidadesSuave(); }
  function darItem(id, n, silencioso){
    dados.itens=dados.itens||{}; dados.itens[id]=Math.max(0,(dados.itens[id]||0)+(n==null?1:n)); if(!dados.itens[id]) delete dados.itens[id];
    gravar();
    if(!silencioso && (n==null||n>0)){ const it=ITENS[id]; Mundo.toast((it?it.icone+' ':'🔸 ')+'Item: '+(it?it.nome:id), 'arq'); }
    evento('item', id);
  }
  function estado(){ return S; }

  /* RESET GERAL (1.37): quem tinha terminado o modo história ANTIGO (lista de
     fases) caía num save migrado e quebrado. Toda vez que RESET_VERSAO subir,
     o Modo História de TODO jogador volta pro começo uma vez (a Condenação,
     que tem save próprio, não é tocada). A migração do save antigo foi desligada. */
  const RESET_VERSAO='1';
  function resetGeral(){
    try{
      if(localStorage.getItem('historia_reset')===RESET_VERSAO) return;
      localStorage.removeItem(CHAVE);
      localStorage.removeItem('historia_progresso');
      localStorage.setItem('historia_reset', RESET_VERSAO);
    }catch(e){}
  }
  function carregar(){
    if(dados) return S;
    resetGeral();
    let d=null;
    try{ d=JSON.parse(localStorage.getItem(CHAVE)); }catch(e){}
    if(!d || d.v!==1) d=novoSave();
    dados=d;
    // campos que podem faltar em saves de versões anteriores
    const base=novoSave(); Object.keys(base).forEach(k=>{ if(dados[k]==null) dados[k]=base[k]; });
    gravar();
    return S;
  }
  function gravar(){ try{ localStorage.setItem(CHAVE, JSON.stringify(dados)); }catch(e){} }
  let tUltimo=0;
  function salvarPosicao(area, x, y, dir, lider){
    if(!dados) return;
    dados.area=area; dados.x=x; dados.y=y; dados.dir=dir; if(lider) dados.lider=lider;
    const reg=Mundo.REGIOES[area];
    if(!reg || !reg.semSalvar) dados.salvoEm={ area, x, y };
    gravar();
  }

  function concluirSilencioso(id){
    const mi=MISSOES[id]; if(!mi) return;
    dados.missoes[id]={ passo:mi.passos.length, feita:true, cont:{} };
    mi.passos.forEach(p=>{ aplicarEstado(p.aoIniciar); aplicarEstado(p.aoConcluir); aplicarEstado(p.depoisFala); if(p.luta) S.setFlag('luta:'+p.luta, true); });
    darRecompensa(mi, true);
  }
  /* aplica só o que muda ESTADO (sem cena, luta, teletransporte) */
  function aplicarEstado(acoes){
    (acoes||[]).forEach(a=>{
      if(a.grupo) mudarGrupo(a.grupo, true);
      if(a.lider) dados.lider=a.lider;
      if(a.flag) S.setFlag(a.flag, a.v);
      if(a.arquivo) dados.arquivo[a.arquivo]=1;
      if(a.item){ const mais=a.item[0]!=='-'; const id=a.item.replace(/^[+-]/,''); dados.itens=dados.itens||{}; dados.itens[id]=Math.max(0,(dados.itens[id]||0)+(mais?1:-1)); if(!dados.itens[id]) delete dados.itens[id]; }
      if(a.elenco) trocarElenco(a.elenco, true);
      if(a.restaurarElenco) restaurarElenco(true);
    });
  }
  /* ATOS com outro ponto de vista (Cap. 2): guarda o grupo de agora e
     põe outro no lugar; `restaurarElenco` devolve o grupo guardado. */
  function trocarElenco(e, silencioso){
    if(!dados.grupoGuardado) dados.grupoGuardado={ grupo:dados.grupo.slice(), lider:dados.lider };
    dados.grupo=e.grupo.slice(); dados.lider=e.lider||e.grupo[0];
    if(!silencioso) Mundo.atualizarGrupo();
  }
  function restaurarElenco(silencioso){
    const g=dados.grupoGuardado; if(!g) return;
    dados.grupo=g.grupo.slice(); dados.lider=g.lider; delete dados.grupoGuardado;
    if(!silencioso) Mundo.atualizarGrupo();
  }

  /* ================= MISSÕES ================= */
  function requisitos(mi){
    if(!mi.requer) return true;
    if(typeof mi.requer==='function') return !!mi.requer(S);
    return mi.requer.every(id=>S.feita(id));
  }
  function disponivel(id){ const mi=MISSOES[id]; return mi && !S.comecou(id) && requisitos(mi); }
  function iniciar(id, silencioso){
    const mi=MISSOES[id]; if(!mi || S.comecou(id)) return;
    dados.missoes[id]={ passo:0, feita:false, cont:{} };
    if(!silencioso) Mundo.toast((mi.tipo==='principal'?'📜 Nova missão: ':'✨ Missão secundária: ')+mi.titulo, 'missao');
    const marc=dados.marcada && MISSOES[dados.marcada];
    if(!dados.marcada || !S.ativa(dados.marcada) || (mi.tipo==='principal' && (!marc || marc.tipo==='principal'))) dados.marcada=id;
    gravar();
    iniciarPasso(id);
  }
  function passoAtual(id){ const x=dados.missoes[id], mi=MISSOES[id]; if(!x||x.feita||!mi) return null; return mi.passos[x.passo]||null; }
  function iniciarPasso(id){
    const p=passoAtual(id); if(!p) return;
    const seguir=()=>{
      // o "ao iniciar" pode ter resolvido o passo sozinho (ex.: uma luta já vencida
      // que avança pelo evento): aí este passo já passou e não pode avançar de novo
      if(passoAtual(id)!==p) return;
      if(p.tipo==='cena'){ fazer(p.cena ? [{ cena:p.cena, cenario:p.cenario, legenda:p.legenda }] : [{ fala:p.fala }], ()=>avancar(id)); return; }
      if(p.tipo==='coletar' && S.quantos(p.coletar)>=(p.quantos||1)) avancar(id);
      // luta que já foi vencida antes do passo chegar (mundo aberto: dá pra adiantar)
      if(p.tipo==='luta' && S.flag('luta:'+p.luta)) avancar(id);
      if(p.tipo==='investigar'){ const x=dados.missoes[id]; p.objetos.forEach(o=>{ if(S.flag('viu:'+o)) x.cont[o]=1; }); if(p.objetos.every(o=>x.cont[o])) avancar(id); }
      if(p.tipo==='puzzle' && S.flag(p.flag)) avancar(id);
      if(p.tipo==='item' && [].concat(p.item).every(i=>S.tem(i))) avancar(id);
    };
    if(p.aoIniciar && p.aoIniciar.length) fazer(p.aoIniciar, seguir); else seguir();
  }
  function avancar(id){
    const x=dados.missoes[id], mi=MISSOES[id]; if(!x || x.feita) return;
    const p=mi.passos[x.passo];
    const depois=()=>{
      x.passo++; x.cont={};
      if(x.passo>=mi.passos.length) concluir(id);
      else { gravar(); if(dados.marcada===id) Mundo.toast('➜ '+mi.passos[x.passo].obj, 'obj'); iniciarPasso(id); }
    };
    if(p && p.aoConcluir && p.aoConcluir.length) fazer(p.aoConcluir, depois); else depois();
  }
  function concluir(id){
    const mi=MISSOES[id], x=dados.missoes[id];
    x.feita=true; x.passo=mi.passos.length;
    Mundo.toast('✅ Missão concluída: '+mi.titulo, 'feita');
    darRecompensa(mi);
    if(dados.marcada===id){
      // marca a próxima principal ativa (ou nenhuma)
      dados.marcada=null;
    }
    verificarNovas();
    if(!dados.marcada){ const prox=ORDEM.find(k=>S.ativa(k) && MISSOES[k].tipo==='principal') || ORDEM.find(k=>S.ativa(k)); dados.marcada=prox||null; }
    gravar(); Mundo.salvar();
  }
  function darRecompensa(mi, silencioso){
    const r=mi.recompensa; if(!r) return;
    if(r.grupo) mudarGrupo(r.grupo, silencioso);
    if(r.arquivo) [].concat(r.arquivo).forEach(a=>{ if(!dados.arquivo[a]){ dados.arquivo[a]=1; if(!silencioso && ARQUIVO[a]) Mundo.toast('📚 Arquivo: '+ARQUIVO[a].titulo, 'arq'); } });
    if(r.flag) [].concat(r.flag).forEach(f=>S.setFlag(f,true));
    if(r.bonusHp){ dados.bonus.hp=Math.min(40,(dados.bonus.hp||0)+r.bonusHp); if(!silencioso) Mundo.toast('❤ Bônus de história: +'+r.bonusHp+' de vida pro grupo nas lutas', 'arq'); }
    if(r.viagem){ S.setFlag('viagem:'+r.viagem, true); if(!silencioso && VIAGENS[r.viagem]) Mundo.toast('🚕 Ponto de viagem: '+VIAGENS[r.viagem].nome, 'arq'); }
    if(r.skin && typeof Characters!=='undefined'){ /* skins do catálogo: só registra — o catálogo libera pelo perfil */ S.setFlag('skin:'+r.skin, true); }
  }
  /* principais automáticas e secundárias sem doador entram sozinhas */
  function verificarNovas(){
    ORDEM.forEach(id=>{
      const mi=MISSOES[id];
      if(!disponivel(id)) return;
      if(mi.tipo==='principal' || (mi.auto && !mi.doador)) iniciar(id);
    });
  }
  function mudarGrupo(g, silencioso){
    const mais=g[0]==='+', id=g.slice(1);
    const i=dados.grupo.indexOf(id);
    if(mais && i<0){ dados.grupo.push(id); if(!silencioso){ const c=Characters.byId(id); Mundo.toast('➕ '+(c?c.name:id)+' entrou no grupo!', 'grupo'); } }
    if(!mais && i>=0){ dados.grupo.splice(i,1); if(!silencioso){ const c=Characters.byId(id); Mundo.toast('➖ '+(c?c.name:id)+' saiu do grupo.', 'grupo'); } }
    if(!silencioso) Mundo.atualizarGrupo();
  }

  /* ================= AÇÕES (cenas, lutas, mudanças) ================= */
  function fazer(acoes, fim){
    const lista=(acoes||[]).slice();
    const prox=()=>{
      const a=lista.shift(); if(!a){ if(fim) fim(); return; }
      if(a.se && !a.se(S)) return prox();
      if(a.fala){ Mundo.falar(a.fala, { quem:a.quem, nome:a.nome, desenho:a.desenho }, prox); return; }
      if(a.cena){
        Mundo.suspender();
        Historia.tocarCena(a.cena, { legenda:a.legenda||'', cenario:a.cenario||'telaviv', aoFim:()=>{ Mundo.retomar(); prox(); } });
        return;
      }
      if(a.luta){ lutar(a.luta, { aoVencer:prox }); return; }
      if(a.grupo){ [].concat(a.grupo).forEach(g=>mudarGrupo(g)); gravar(); return prox(); }
      if(a.lider){ dados.lider=a.lider; Mundo.atualizarGrupo(); return prox(); }
      if(a.flag){ marcarFlag(a.flag, a.v); return prox(); }
      if(a.item){ const mais=a.item[0]!=='-'; darItem(a.item.replace(/^[+-]/,''), mais?(a.n||1):-(a.n||1), !mais); return prox(); }
      if(a.elenco){ trocarElenco(a.elenco); gravar(); return prox(); }
      if(a.restaurarElenco){ restaurarElenco(); gravar(); return prox(); }
      if(a.iniciar){ iniciar(a.iniciar); return prox(); }
      if(a.ir){ Mundo.irPara(a.ir[0], a.ir[1], a.ir[2], a.ir[3], prox); return; }
      if(a.pos){ Mundo.posicionar(a.pos[0], a.pos[1], a.pos[2], a.pos[3]); return prox(); }
      if(a.hora!==undefined){ Mundo.hora(a.hora); return prox(); }
      if(a.toast){ Mundo.toast(a.toast); return prox(); }
      if(a.arquivo){ if(!dados.arquivo[a.arquivo]){ dados.arquivo[a.arquivo]=1; if(ARQUIVO[a.arquivo]) Mundo.toast('📚 Arquivo: '+ARQUIVO[a.arquivo].titulo, 'arq'); gravar(); } return prox(); }
      if(a.esperar){ setTimeout(prox, a.esperar); return; }
      if(a.salvarAqui){ const p=Mundo.posicao(); dados.salvoEm={ area:p.area, x:Math.floor(p.x), y:Math.floor(p.y) }; gravar(); Mundo.toast('🕯 Ponto de salvamento.'); return prox(); }
      if(a.fn){ const r=a.fn(S, prox); if(r!==false) prox(); return; }
      prox();
    };
    prox();
  }

  /* ================= DIFICULDADE (mundo aberto) =================
     k por luta: vida E dano de todo o lado inimigo ×k, e o bot joga com a
     IA esperta. Os números do roteiro vieram da lista de fases antiga (sem o
     bônus de vida, que chega a +40, e com outro kit): no mundo aberto quase
     tudo tinha virado 100% de vitória. Calibrado por simulação no motor real
     com o grupo e o bônus que se tem em cada ponto da história: o bot joga
     com a IA esperta e o lado do jogador é um "jogador médio" (a IA comum,
     com 1 jogada em 4 sorteada), 200 lutas por k. k < 1 = luta que era um
     muro (Caçadores 14%, Sombra da Rainha 0%) e ficou mais justa. Metas:
     tutorial 88% · patrulha 80% · comum 70% · pico/rival/procura-se 58% ·
     chefe 45% · final de capítulo 40%. Luta fora da tabela = k 1. */
  const DIFICULDADE = {
    // Capítulo 1
    lab_contencao:1.45, lab_patrulha:2.05, guardiao:1.06, mercado_sentinelas:1.1, tour_robos:2.1, cargas_apagao:1,
    sentinelas_geladas:1.45, patrulha_rua:2.15, patrulha_dupla:1.45, cacadores:0.85, trio_limeira:1.35,
    irmaos_metal:1.05, colosso:1.07, eco:1.12, prototipo00:1, marcelao:1.1, tempo_absoluto:1.35, mensageiro:1.65,
    ultimo_recado:1.9, exercito:1.35, caravana:2.3, colosso_orfao:1.1, pr_torradeira:2.7, pr_semaforo:2.4,
    pr_aspirador:2.55, pr_guardachuva:1.45, ultimo_recado_rua:2.65,
    // Capítulo 2
    c2_recrutas:1.45, c2_pao:1.4, c2_maldicao:1.95, c2_telhados:1.8, c2_tupas:1.28, c2_pedagio:2.75, c2_bando:1.7,
    c2_rapaz:0.8, c2_justica:1.15, c2_cobrador:1.15, c2_sozinho:2.1, c2_pipoca:1.28, c2_volta:2.05, c2_bones:2.1,
    c2_capitao:1.08, c2_rachadura:1.75, c2_abrigo:1.35, c2_truque:1, c2_sombra:0.8, c2_parou:1.5, c2_cao:1.5,
    c2_represa:1.7, c2_mercado:1.25, c2_relogio_mestre:1.07, c2_pombo:1.35, c2_jantar:1.1, c2_desperta:1.15,
    c2_general:1.08, c2_chegada:1.45, c2_metal:1.13, c2_caravana:1.65, c2_raio_agua:1.35, c2_escada:1.3,
    c2_fat_unico:1.15, c2_relogio_almas:1.35, c2_bones_frente:1.3, c2_rainha:1.15, c2_fiscal:3, c2_relogio_rua:2.85
  };
  function dificuldade(id){ return DIFICULDADE[id] || 1; }

  /* ================= LUTA ================= */
  function lutar(id, o){
    o=o||{};
    const d=LUTAS[id]; if(!d){ console.warn('luta?', id); if(o.aoVencer) o.aoVencer(); return; }
    Mundo.lutar(d, ()=>{
      S.setFlag('luta:'+id, true);
      if(o.aoVencer && o.antesDoDepois) o.aoVencer();
      const resto=()=>{
        evento('luta', id);
        if(o.aoVencer && !o.antesDoDepois) o.aoVencer();
      };
      if(o.inimigoId) S.setFlag('venceu:'+o.inimigoId, true);
      if(d.depois && d.depois.length){ Mundo.suspender(); Historia.tocarCena(d.depois, { legenda:d.titulo, cenario:d.cenario, aoFim:()=>{ Mundo.retomar(); resto(); } }); }
      else resto();
      gravar();
    }, null);
  }

  /* ================= EVENTOS DO MUNDO ================= */
  function evento(tipo, valor){
    if(tipo==='investigar'){ S.setFlag('viu:'+valor, true); gravar(); }
    ORDEM.forEach(id=>{
      const p=passoAtual(id); if(!p) return;
      if(tipo==='luta' && p.tipo==='luta' && p.luta===valor) avancar(id);
      else if(tipo==='coletar' && p.tipo==='coletar' && COLETAVEIS[valor] && COLETAVEIS[valor].tipo===p.coletar && S.quantos(p.coletar)>=(p.quantos||1)) avancar(id);
      else if(tipo==='investigar' && p.tipo==='investigar' && p.objetos.indexOf(valor)>=0){
        const x=dados.missoes[id]; x.cont[valor]=1; gravar();
        if(p.objetos.every(o=>x.cont[o])) avancar(id);
      }
      else if(tipo==='flag' && p.tipo==='puzzle' && p.flag===valor && S.flag(valor)) avancar(id);
      else if(tipo==='item' && p.tipo==='item' && [].concat(p.item).every(i=>S.tem(i))) avancar(id);
    });
  }

  /* NPC: missão em andamento > missão pra oferecer > fala de sempre */
  function falarCom(n, fim){
    // 1. passo atual de alguma missão aponta pra ele
    for(const id of ORDEM){
      const p=passoAtual(id); if(!p || p.npc!==n.id) continue;
      if(p.tipo==='falar'){ const fz = p.cena ? [{ fala:p.cena, quem:n.char, nome:n.nome, desenho:n.desenho }] : []; fazer(fz.concat(p.depoisFala||[]), ()=>{ avancar(id); if(fim) fim(); }); return; }
      if(p.tipo==='luta'){
        const fz = p.cena ? [{ fala:p.cena, quem:n.char, nome:n.nome, desenho:n.desenho }] : [];
        fazer(fz, ()=>lutar(p.luta, { aoVencer:fim })); return;
      }
    }
    // 2. secundária que ele oferece
    for(const id of ORDEM){
      const mi=MISSOES[id]; if(mi.doador!==n.id || !disponivel(id)) continue;
      const falas=(mi.oferta||[mi.resumo]).map(t=> typeof t==='string' ? { quem:n.char||false, desenho:n.desenho, nome:n.nome, texto:t } : t);
      falas.push({ quem:n.char||false, desenho:n.desenho, nome:n.nome, texto:'['+mi.titulo+'] Topa?',
        escolha:[ { t:'✔ Topo', faz:[{ fn:()=>{ iniciar(id); } }] }, { t:'✖ Agora não' } ] });
      Mundo.falar(falas, {}, fim); return;
    }
    // 3. fala normal
    let falas=n.falas;
    if(typeof falas==='function') falas=falas(S);
    if(Array.isArray(falas) && falas.length && falas[0] && falas[0].cena!==undefined){
      const c=falas.find(f=>!f.se || f.se(S)); falas=c ? c.cena : [];
    } else if(Array.isArray(falas) && falas.every(f=>typeof f==='string') && n.rodizio!==false){
      // gente da rua: uma fala por conversa, em rodízio
      n._i=((n._i==null?-1:n._i)+1)%falas.length; falas=[falas[n._i]];
    }
    if(!falas || !falas.length){ if(fim) fim(); return; }
    const extra = n.rejogar && S.flag('luta:'+n.rejogar) ? [{ quem:n.char||false, nome:n.nome, desenho:n.desenho, texto:'Quer revanche?', escolha:[ { t:'⚔ Rejogar luta', faz:[{ luta:n.rejogar }] }, { t:'✖ Não' } ] }] : [];
    Mundo.falar(falas.concat(extra), { quem:n.char, nome:n.nome, desenho:n.desenho, npc:n }, fim);
  }

  /* objeto com interagir: coletável, investigação, texto */
  function interagirObjeto(o){
    // objeto que só funciona com um item (porta, cadeado, máquina)
    if(o.precisa && !S.tem(o.precisa.item)){ Mundo.falar([].concat(o.precisa.texto||'Falta alguma coisa aqui.').map(t=>typeof t==='string'?{ quem:false, texto:t }:t), {}, null); return; }
    if(o.pegar){
      if(S.flag('pegou:'+o.pegar)) return;
      const txt=[].concat(o.texto||[]);
      Mundo.falar(txt.length ? txt.map(t=>typeof t==='string'?{ quem:false, texto:t }:t) : [{ quem:false, texto:'Você pegou: '+((ITENS[o.pegar]||{}).nome||o.pegar)+'.' }], {}, ()=>{
        S.setFlag('pegou:'+o.pegar, true); darItem(o.pegar, 1); if(o.faz) fazer(o.faz); if(Mundo.recriarEntidadesSuave) Mundo.recriarEntidadesSuave(); });
      return;
    }
    if(o.coletavel){
      if(dados.coletados[o.coletavel]) return;
      const c=COLETAVEIS[o.coletavel]||{ tipo:'?', nome:'?' };
      dados.coletados[o.coletavel]=1; gravar();
      const tot=Object.values(COLETAVEIS).filter(x=>x.tipo===c.tipo).length;
      Mundo.falar([{ quem:false, texto:c.texto||c.nome }], {}, ()=>{
        Mundo.toast('🔸 '+(c.rotulo||c.tipo)+' '+S.quantos(c.tipo)+'/'+tot, 'arq');
        if(c.arquivo && !dados.arquivo[c.arquivo]){ dados.arquivo[c.arquivo]=1; gravar(); }
        evento('coletar', o.coletavel);
      });
      return;
    }
    if(o.investigar){
      const passoQueQuer = ORDEM.some(id=>{ const p=passoAtual(id); return p && p.tipo==='investigar' && p.objetos.indexOf(o.investigar)>=0; });
      const txt = (passoQueQuer && o.textoMissao) ? o.textoMissao : o.texto;
      Mundo.falar([].concat(txt||'...').map(t=>typeof t==='string'?{ quem:false, texto:t }:t), {}, ()=>{ if(o.arquivo && !dados.arquivo[o.arquivo]){ dados.arquivo[o.arquivo]=1; Mundo.toast('📚 Arquivo: '+(ARQUIVO[o.arquivo]||{}).titulo, 'arq'); gravar(); } evento('investigar', o.investigar); });
      return;
    }
    if(o.salvar){ fazer([{ salvarAqui:true }]); Mundo.salvar(); return; }
    if(o.texto){ Mundo.falar([].concat(o.texto).map(t=>typeof t==='string'?{ quem:false, texto:t }:t), {}, o.faz ? ()=>fazer(o.faz) : null); return; }
    if(o.faz) fazer(o.faz);
  }

  /* chamado todo quadro com a posição do jogador (em tiles) */
  let tAndar=0, ultimoT=0;
  function aoAndar(area, x, y){
    const agora=performance.now();
    if(ultimoT && agora-ultimoT<1000) dados.tempoJogado+=(agora-ultimoT)/1000;
    ultimoT=agora;
    tAndar--; if(tAndar>0) return; tAndar=6;
    // passos "ir"
    for(const id of ORDEM){
      const p=passoAtual(id); if(!p || p.tipo!=='ir' || !p.alvo) continue;
      const [a,ax,ay,r]=p.alvo; if(a!==area) continue;
      if(Math.hypot(x-ax-0.5, y-ay-0.5)<=(r||1.6)){ avancar(id); return; }
    }
    // gatilhos de área
    for(const g of GATILHOS){
      if(g.area!==area) continue;
      if(g.uma && dados.gatilhos[g.id]) continue;
      const [gx,gy,gw,gh]=g.ret; if(x<gx||y<gy||x>=gx+gw||y>=gy+gh) continue;
      if(g.se && !g.se(S)) continue;
      if(g.uma) dados.gatilhos[g.id]=1;
      fazer(g.faz);
      return;
    }
    // pontos de viagem descobertos ao passar perto
    Object.values(VIAGENS).forEach(v=>{ if(v.area===area && !S.flag('viagem:'+v.id) && Math.hypot(x-v.x,y-v.y)<4){ S.setFlag('viagem:'+v.id); gravar(); Mundo.toast('🚕 Ponto de viagem descoberto: '+v.nome, 'arq'); } });
  }
  function aoEntrarArea(area, inicio){
    if(inicio){
      if(!ORDEM.some(id=>S.comecou(id))) verificarNovas();
      else verificarNovas();
      if(dados.flags.avisoMigracao){ delete dados.flags.avisoMigracao; gravar(); setTimeout(()=>Mundo.toast('📦 Progresso da versão antiga convertido em missões concluídas.'), 600); }
    }
  }
  function aoAbrirMundo(){
    const el=document.getElementById('mundo-mini'); if(el) el.classList.toggle('escondido', dados.minimapa===false);
  }

  /* ================= MARCADORES E ALVO ================= */
  function marcadorNPC(n){
    for(const id of ORDEM){ const p=passoAtual(id); if(p && p.npc===n.id && (p.tipo==='falar'||p.tipo==='luta')) return '?'; }
    for(const id of ORDEM){ const mi=MISSOES[id]; if(mi.doador===n.id && disponivel(id)) return '!'; }
    return null;
  }
  function alvoDoPasso(id){
    const p=passoAtual(id); if(!p) return null;
    if(p.alvo) return { area:p.alvo[0], x:p.alvo[1], y:p.alvo[2] };
    if(p.npc && NPCS[p.npc]){ const e=NPCS[p.npc].em; return { area:e[0], x:e[1], y:e[2], npc:p.npc }; }
    if(p.inimigo && INIMIGOS[p.inimigo]){ const e=INIMIGOS[p.inimigo].em; return { area:e[0], x:e[1], y:e[2] }; }
    if(p.local) return { area:p.local[0], x:p.local[1], y:p.local[2] };
    return null;
  }
  function objetivoMarcado(){
    const id=dados && dados.marcada; if(!id || !S.ativa(id)) return null;
    const mi=MISSOES[id], p=passoAtual(id); if(!p) return null;
    let obj=p.obj;
    if(p.tipo==='coletar') obj+=' ('+Math.min(S.quantos(p.coletar),p.quantos||1)+'/'+(p.quantos||1)+')';
    if(p.tipo==='investigar'){ const x=dados.missoes[id]; obj+=' ('+p.objetos.filter(o=>x.cont[o]).length+'/'+p.objetos.length+')'; }
    return { id, titulo:mi.titulo, obj, ondeTexto:p.onde||'' };
  }
  function alvoNaArea(area){
    const id=dados && dados.marcada; if(!id) return null;
    const p=passoAtual(id);
    // vários objetos: aponta pro mais perto que ainda falta (na região onde o jogador está)
    if(p && (p.tipo==='investigar' || p.tipo==='coletar') && !p.alvo){
      const x=dados.missoes[id];
      const o = p.tipo==='investigar'
        ? Mundo.objetoMaisPerto(ob=>ob.investigar && p.objetos.indexOf(ob.investigar)>=0 && !x.cont[ob.investigar])
        : Mundo.objetoMaisPerto(ob=>ob.coletavel && COLETAVEIS[ob.coletavel] && COLETAVEIS[ob.coletavel].tipo===p.coletar && !dados.coletados[ob.coletavel]);
      if(o) return o;
    }
    const a=alvoDoPasso(id); if(!a || a.area!==area) return null;
    if(a.npc){ const pos=Mundo.posNPC && Mundo.posNPC(a.npc); if(pos) return { x:pos.x, y:pos.y }; }
    return a;
  }
  /* objetivo noutra região: aponta pra porta/saída certa */
  function saidaRumo(area){
    const id=dados && dados.marcada; if(!id) return null;
    const a=alvoDoPasso(id); if(!a || a.area===area) return null;
    const mp=Mundo.mapa(area);
    const destino=a.area, regDest=Mundo.REGIOES[destino];
    const fora = regDest && regDest.fora;           // interior → a região de fora dele
    let porta = mp.portas.find(p=>p.para[0]===destino) || (fora && mp.portas.find(p=>p.para[0]===fora));
    if(porta) return { x:porta.x, y:porta.y, saida:porta.nome||Mundo.REGIOES[porta.para[0]].nome };
    let s = mp.saidas.find(x=>x.para[0]===destino) || (fora && mp.saidas.find(x=>x.para[0]===fora));
    if(!s && mp.def.interior){ const p=mp.portas[0]; if(p) return { x:p.x, y:p.y, saida:'Saída' }; }
    if(s){ const mid=(s.de[0]+s.de[1])/2; const pos = s.lado==='oeste'?[0,mid] : s.lado==='leste'?[mp.w-1,mid] : s.lado==='norte'?[mid,0] : [mid,mp.h-1]; return { x:pos[0], y:pos[1], saida:Mundo.REGIOES[s.para[0]].nome }; }
    return null;
  }
  function marcadoresMundi(){
    const out=[];
    ORDEM.forEach(id=>{
      if(!S.ativa(id)) return; const a=alvoDoPasso(id); if(!a) return;
      let reg=Mundo.REGIOES[a.area]; let x=a.x, y=a.y;
      if(reg && !reg.mundi && reg.fora){ const f=Mundo.REGIOES[reg.fora]; const pt=reg.portaFora||[f.w/2,f.h/2]; x=pt[0]; y=pt[1]; reg=f; }
      if(!reg || !reg.mundi) return;
      out.push({ x:reg.mundi.x + x/reg.w*reg.mundi.w, y:reg.mundi.y + y/reg.h*reg.mundi.h, titulo:MISSOES[id].titulo, marcada:dados.marcada===id });
    });
    return out;
  }
  function pontosViagem(){
    return Object.values(VIAGENS).filter(v=>S.flag('viagem:'+v.id)).map(v=>{
      const reg=Mundo.REGIOES[v.area]; if(!reg||!reg.mundi) return null;
      return { id:v.id, nome:v.nome, area:v.area, x:reg.mundi.x+v.x/reg.w*reg.mundi.w, y:reg.mundi.y+v.y/reg.h*reg.mundi.h, pode:S.flag('astra_consertado'), tx:v.x, ty:v.y };
    }).filter(Boolean).map(v=>Object.assign(v,{ x:v.x, y:v.y, area:v.area, xT:v.tx, yT:v.ty }));
  }
  function bonusDeHistoria(){ return { hp:(dados && dados.bonus && dados.bonus.hp)||0 }; }
  function npcsDaArea(area){ return Object.values(NPCS).filter(n=>n.em && n.em[0]===area); }
  function objetosDaArea(area){ return OBJETOS.filter(o=>o.area===area); }
  function inimigosDaArea(area){ return Object.values(INIMIGOS).filter(n=>n.em && n.em[0]===area); }
  function marcar(id){ dados.marcada=id; gravar(); Mundo.fecharPaineis(); const mi=MISSOES[id]; Mundo.toast('📍 Acompanhando: '+mi.titulo); }

  /* ================= DIÁRIO (J) ================= */
  let abaDiario='principal';
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function textoRecompensa(r){
    if(!r) return '';
    const p=[];
    if(r.grupo && r.grupo[0]==='+'){ const c=Characters.byId(r.grupo.slice(1)); p.push('👥 '+(c?c.name:r.grupo.slice(1))+' no grupo'); }
    if(r.arquivo) p.push('📚 '+[].concat(r.arquivo).length+' no Arquivo');
    if(r.bonusHp) p.push('❤ +'+r.bonusHp+' de vida nas lutas');
    if(r.viagem) p.push('🚕 ponto de viagem');
    if(r.texto) p.push(r.texto);
    return p.join(' · ');
  }
  function ondeFica(id){
    const a=alvoDoPasso(id); if(!a) return '';
    const p=passoAtual(id); if(p && p.onde) return p.onde;
    const reg=Mundo.REGIOES[a.area]; return reg ? reg.nome : '';
  }
  function pintarDiario(box){
    const abas=[['principal','📜 Principal'],['secundaria','✨ Secundárias'],['feitas','✅ Concluídas'],['itens','🎒 Itens']];
    let html='<div class="dj-abas">'+abas.map(a=>`<button class="dj-aba ${abaDiario===a[0]?'on':''}" onclick="Missoes.aba('${a[0]}')">${a[1]}</button>`).join('')+'</div><div class="dj-lista">';
    if(abaDiario==='itens'){
      const ks=Object.keys(dados.itens||{}).filter(k=>dados.itens[k]>0);
      if(!ks.length) html+='<div class="dj-vazio">Nenhum item. Chaves, peças e bilhetes que você pegar aparecem aqui.</div>';
      ks.forEach(k=>{ const it=ITENS[k]||{ nome:k, icone:'🔸' }; html+=`<div class="dj-m"><div class="dj-t">${it.icone} <b>${esc(it.nome)}</b>${dados.itens[k]>1?' ×'+dados.itens[k]:''}</div><div class="dj-r">${esc(it.texto||'')}</div></div>`; });
      box.innerHTML=html+'</div>'; return;
    }
    const lista=ORDEM.filter(id=>{
      const mi=MISSOES[id];
      if(abaDiario==='feitas') return S.feita(id);
      if(!S.ativa(id)) return false;
      return abaDiario==='principal' ? mi.tipo==='principal' : mi.tipo!=='principal';
    });
    if(abaDiario==='feitas') lista.reverse();
    if(!lista.length) html+=`<div class="dj-vazio">${abaDiario==='secundaria'?'Nenhuma secundária aceita. Procure gente com <b>!</b> em cima da cabeça.':abaDiario==='feitas'?'Nada concluído ainda.':'Nenhuma missão principal ativa.'}</div>`;
    lista.forEach(id=>{
      const mi=MISSOES[id], p=passoAtual(id), feita=S.feita(id), marc=dados.marcada===id;
      const obj=objetivoTxt(id);
      html+=`<div class="dj-m ${marc?'marcada':''} ${feita?'feita':''}">
        <div class="dj-t">${mi.tipo==='principal'?'Cap. '+(mi.cap||1)+' · ':''}<b>${esc(mi.titulo)}</b></div>
        <div class="dj-r">${esc(mi.resumo||'')}</div>
        ${feita?'':`<div class="dj-o">➜ ${esc(obj)}</div><div class="dj-onde">📍 ${esc(ondeFica(id))}</div>`}
        ${mi.recompensa?`<div class="dj-rec">🎁 ${esc(textoRecompensa(mi.recompensa))}</div>`:''}
        ${feita?'':`<button class="dj-marcar ${marc?'on':''}" onclick="Missoes.marcar('${id}')">${marc?'◆ MARCADA':'📍 MARCAR'}</button>`}
      </div>`;
    });
    html+='</div>';
    box.innerHTML=html;
  }
  function objetivoTxt(id){ const p=passoAtual(id); if(!p) return ''; const o=objetivoMarcadoDe(id); return o; }
  function objetivoMarcadoDe(id){ const salva=dados.marcada; dados.marcada=id; const o=objetivoMarcado(); dados.marcada=salva; return o?o.obj:''; }
  function aba(a){ abaDiario=a; const el=document.querySelector('#mundo-painel .mp-corpo'); if(el) pintarDiario(el); }

  /* ================= ARQUIVO ================= */
  let abaArq='personagem';
  function pintarArquivo(box){
    const abas=[['personagem','👤 Gente'],['lore','📖 Lore'],['bestiario','🤖 Bestiário'],['colecao','🔸 Coleção'],['lutas','⚔ Rejogar']];
    let html='<div class="dj-abas">'+abas.map(a=>`<button class="dj-aba ${abaArq===a[0]?'on':''}" onclick="Missoes.abaArquivo('${a[0]}')">${a[1]}</button>`).join('')+'</div><div class="dj-lista">';
    if(abaArq==='colecao'){
      const tipos={};
      Object.values(COLETAVEIS).forEach(c=>{ (tipos[c.tipo]=tipos[c.tipo]||{ total:0, achou:0, rotulo:c.rotulo||c.tipo, itens:[] }); tipos[c.tipo].total++; if(S.coletou(c.id)){ tipos[c.tipo].achou++; tipos[c.tipo].itens.push(c); } });
      const ks=Object.keys(tipos); if(!ks.length) html+='<div class="dj-vazio">Nada pra colecionar por aqui… ainda.</div>';
      ks.forEach(k=>{ const t=tipos[k]; html+=`<div class="dj-m"><div class="dj-t"><b>${esc(t.rotulo)}</b> — ${t.achou}/${t.total}</div>${t.itens.map(c=>`<div class="dj-r">• ${esc(c.nome)}</div>`).join('')}</div>`; });
    } else if(abaArq==='lutas'){
      const ls=Object.values(LUTAS).filter(l=>l.rejogavel && S.flag('luta:'+l.id));
      if(!ls.length) html+='<div class="dj-vazio">Vença um chefe e ele aparece aqui pra revanche.</div>';
      ls.forEach(l=>{ html+=`<div class="dj-m"><div class="dj-t"><b>${esc(l.titulo)}</b>${l.chefe?' · CHEFE':''}</div><button class="dj-marcar" onclick="Missoes.rejogar('${l.id}')">⚔ REJOGAR</button></div>`; });
    } else {
      const es=Object.values(ARQUIVO).filter(a=>a.cat===abaArq);
      const vistas=es.filter(a=>dados.arquivo[a.id]);
      html+=`<div class="dj-cont">${vistas.length}/${es.length} descobertos</div>`;
      es.forEach(a=>{ const ok=dados.arquivo[a.id];
        html+= ok ? `<div class="dj-m"><div class="dj-t"><b>${esc(a.titulo)}</b></div><div class="dj-r">${esc(a.texto)}</div></div>`
                  : `<div class="dj-m bloq"><div class="dj-t"><b>???</b></div><div class="dj-r">${esc(a.dica||'Explore pra descobrir.')}</div></div>`; });
    }
    html+='</div>';
    box.innerHTML=html;
  }
  function abaArquivo(a){ abaArq=a; const el=document.querySelector('#mundo-painel .mp-corpo'); if(el) pintarArquivo(el); }
  function rejogar(id){ Mundo.fecharPaineis(); const d=LUTAS[id]; Mundo.lutar(Object.assign({}, d, { depois:null }), ()=>Mundo.toast('⚔ Revanche vencida!'), null); }

  /* ================= CONDENAÇÃO (lista gerada do roteiro novo) =================
     Cada luta com `condenacao:true` vira uma "sessão" do julgamento, na
     ordem do roteiro. Entra no lugar das fases antigas quando o capítulo
     inteiro já foi reescrito (ver Historia.capituloCondenacao). */
  function sessoesCondenacao(cap){ return Object.values(LUTAS).filter(l=>l.condenacao && l.cap===cap).sort((a,b)=>(a.ordem||0)-(b.ordem||0)); }

  function S_(){ return S; }
  return {
    def, carregar, estado, S:S_, gravar, salvarPosicao, iniciar, avancar, fazer, lutar, falarCom, interagirObjeto, evento,
    aoAndar, aoEntrarArea, aoAbrirMundo, marcadorNPC, alvoNaArea, saidaRumo, objetivoMarcado, marcadoresMundi, pontosViagem,
    bonusDeHistoria, npcsDaArea, inimigosDaArea, objetosDaArea, marcar, pintarDiario, aba, pintarArquivo, abaArquivo, rejogar, sessoesCondenacao, dificuldade,
    MISSOES, NPCS, LUTAS, ARQUIVO, COLETAVEIS, VIAGENS, ORDEM, ITENS, flag:marcarFlag, darItem, trocarElenco, restaurarElenco,
    _resetar(){ dados=null; try{ localStorage.removeItem(CHAVE); }catch(e){} }
  };
})();
