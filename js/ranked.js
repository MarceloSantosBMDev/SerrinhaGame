/* ============================================================
   RANQUEADA — rating ELO, perfil do jogador e leaderboard.

   Backend: se o Firebase estiver ligado (js/firebase-init.js define
   Ranked.setBackend), grava no Firestore. Senão, usa localStorage
   para você já conseguir testar tudo offline.

   ⚠️ O resultado é enviado pelo navegador. Isso significa que um
   jogador mal-intencionado consegue forjar vitória. Para ranqueada
   valendo de verdade, a validação precisa rodar no servidor
   (Cloud Functions). Está anotado no README das regras.
   ============================================================ */
const Ranked = (function(){

  const K = 32;                 // fator de variação do ELO
  const START = 1000;           // rating inicial
  const AI_RATING = { easy:800, normal:1050, hard:1350 };
  const LOCAL_KEY = 'arena_ranked_v1';
  const LOCAL_MATCHES_KEY = 'arena_matches_v1';
  const LOCAL_MATCHES_MAX = 300;   // só pra não crescer sem limite no localStorage

  let backend = null;           // {getPlayer, savePlayer, addMatch, top, matchesOf}
  let cache = null;             // perfil em memória

  function setBackend(b){ backend = b || null; }
  function isCloud(){ return !!backend; }

  /* ---------- fallback local ----------
     Espelha o suficiente do Firestore pra dar pra testar o PERFIL inteiro
     (avatar, favorito, maior elo) sem Firebase. `addMatch` antes era um
     no-op ("histórico só na nuvem") — mas sem histórico local, o cartão
     de "personagem favorito" nunca tinha o que mostrar em modo offline,
     então agora ele grava também (com um teto, pra não crescer à toa). */
  function localAll(){ try{ return JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}'); }catch(e){ return {}; } }
  function localWrite(o){ localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); }
  function localMatches(){ try{ return JSON.parse(localStorage.getItem(LOCAL_MATCHES_KEY)||'[]'); }catch(e){ return []; } }
  function localWriteMatches(a){ localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(a)); }

  const localBackend = {
    async getPlayer(uid){ return localAll()[uid] || null; },
    async savePlayer(uid, p){ const a=localAll(); a[uid]=p; localWrite(a); return p; },
    async addMatch(m){
      const a=localMatches();
      a.push(Object.assign({}, m, { id:'local_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6) }));
      while(a.length>LOCAL_MATCHES_MAX) a.shift();
      localWriteMatches(a);
    },
    async matchesOf(uid, n){
      return localMatches().filter(m=>m.uid===uid).slice(-1*(n||200)).reverse();
    },
    async top(n){
      return Object.values(localAll())
        .sort((a,b)=>b.rating-a.rating).slice(0,n||20);
    }
  };
  function be(){ return backend || localBackend; }

  /* ---------- perfil ---------- */
  function blank(user){
    return { uid:user.uid, nick:user.nick||'Lutador', rating:START, peakRating:START,
             avatar:null, wins:0, losses:0, draws:0, matches:0, survivalRecord:0,
             unlockedSkins:[], updatedAt:Date.now() };
  }

  /* perfis salvos ANTES do sistema de avatar/maior-elo/sobrevivência/skins
     não têm esses campos — sem isso a tela de perfil mostraria "undefined"
     pra quem já jogava antes dessas versões. */
  function comPadroes(p){
    if(p.peakRating==null) p.peakRating = Math.max(p.rating||START, START);
    if(p.avatar===undefined) p.avatar = null;
    if(p.survivalRecord==null) p.survivalRecord = 0;
    if(!Array.isArray(p.unlockedSkins)) p.unlockedSkins = [];
    return p;
  }

  /* varre TODAS as skins do elenco que têm regra de desbloqueio (ver
     `Characters.skinsComRegra`) e libera quem já cumpriu a condição e
     ainda não tinha sido marcado. Devolve só as que acabaram de entrar
     nesta chamada — é o que vira popup de "skin nova" na tela. Chamada
     depois de CADA partida que mexe em `wins` (só a ranqueada online
     grava resultado hoje — ver `report`/`reportOnline` abaixo). */
  function verificarSkins(p){
    if(typeof Characters==='undefined') return [];
    const novas=[];
    Characters.skinsComRegra().forEach(({charId, char, skin})=>{
      const key=Characters.skinKey(charId, skin.id);
      if(p.unlockedSkins.includes(key)) return;
      let liberou=false;
      if(skin.unlock.tipo==='ranked_wins') liberou = (p.wins||0) >= skin.unlock.valor;
      if(liberou){ p.unlockedSkins.push(key); novas.push({charId, char, skin}); }
    });
    return novas;
  }

  async function profile(force){
    const u = Auth.user();
    if(!u || u.provider==='guest') return null;
    if(cache && cache.uid===u.uid && !force) return cache;
    let p = await be().getPlayer(u.uid);
    if(!p){ p = blank(u); await be().savePlayer(u.uid, p); }
    if(p.nick !== u.nick){ p.nick = u.nick; }        // mantém o apelido em dia
    comPadroes(p);
    /* pega quem já cumpria o requisito de alguma skin ANTES dela existir
       (ex.: já tinha 10 vitórias quando a Skin Honesta foi lançada) — sem
       popup aqui (é só abrir o jogo, não uma vitória), mas já aparece
       liberada da próxima vez que o catálogo for aberto. */
    if(verificarSkins(p).length) await be().savePlayer(p.uid, p);
    cache = p; return p;
  }
  function cached(){ return cache; }
  function clearCache(){ cache = null; }

  /* perfil de QUALQUER jogador (pro clique no ranking) — não mexe no
     cache do usuário logado, que é só para o PRÓPRIO perfil. */
  async function playerByUid(uid){
    if(!uid) return null;
    const p = await be().getPlayer(uid);
    return p ? comPadroes(p) : null;
  }

  /* personagem mais usado pelo jogador NAS PARTIDAS ONLINE (só elas
     gravam `meuTime` — a ranqueada contra bot nunca existiu de verdade
     no cliente atual, ver `report()` mais abaixo, que ficou sem uso).
     Conta CADA personagem do time uma vez por partida, então "escolher"
     vale igual não importa quantos golpes ele deu. */
  async function favorito(uid){
    let ms; try{ ms = await be().matchesOf(uid, 200); }catch(e){ ms = []; }
    const cont = {};
    (ms||[]).forEach(m=>{
      if(!m || !m.meuTime) return;
      const ids = String(m.meuTime).split(',').map(s=>s.trim()).filter(Boolean);
      new Set(ids).forEach(id=>{ cont[id] = (cont[id]||0)+1; });
    });
    let melhor=null, max=0;
    Object.keys(cont).forEach(id=>{ if(cont[id]>max){ max=cont[id]; melhor=id; } });
    return melhor ? { charId:melhor, vezes:max } : null;
  }

  /* pacote completo pra tela de perfil: dados do jogador + favorito.
     `winrateRanked` usa os contadores que JÁ existem no perfil (wins/
     losses/matches) — como só a ranqueada online grava resultado hoje,
     isso já É o winrate da ranqueada, sem precisar reler `matches`. */
  async function profilePublico(uid){
    const p = await playerByUid(uid);
    if(!p) return null;
    const decididas = (p.wins||0) + (p.losses||0);
    const winrateRanked = decididas>0 ? Math.round((p.wins||0)/decididas*100) : null;
    let fav=null; try{ fav = await favorito(uid); }catch(e){}
    return { perfil:p, favorito:fav, winrateRanked, decididas };
  }

  /* jogador escolhe (ou troca) o personagem do próprio avatar. Guarda só
     o ID — quem sabe desenhar o rosto (Sprites.renderFace) é a tela. */
  async function setAvatar(charId){
    const p = await profile();
    if(!p) throw new Error('Entre com uma conta pra escolher um avatar.');
    if(!charId || typeof Characters==='undefined' || !Characters.byId(charId))
      throw new Error('Personagem inválido.');
    p.avatar = charId;
    await be().savePlayer(p.uid, p);
    cache = p;
    return p;
  }

  /* ---------- ELO ---------- */
  function expected(a, b){ return 1/(1+Math.pow(10,(b-a)/400)); }
  function apply(rating, oppRating, score){   // score: 1 vitória, 0.5 empate, 0 derrota
    return Math.round(rating + K*(score - expected(rating, oppRating)));
  }
  /* ---------- LADDER: cada patente tem 4 divisões (4 = mais baixa, 1 = mais alta)
     Ex.: Serrinha 4 → Serrinha 3 → Serrinha 2 → Serrinha 1 → sobe de patente.
     A escada segue a MESMA mitologia do catálogo de personagens (raças em
     js/characters.js): todo mundo começa igual um vira-lata de rua e vai
     virando cada vez menos "gente normal" até virar lenda — e no topo,
     um Smerg Supremo, o único posto sem divisão (é patente única). */
  const DIV_PTS = 60;                       // pontos por divisão
  const TIER_PTS = DIV_PTS*4;               // 240 por patente
  const TIERS = [
    { nome:'Vira-Lata',        base:0,    cor:'#c98d5a', icone:'🐕',
      desc:'Todo mundo começa aqui, farejando o próprio time.' },
    { nome:'Serrinha',         base:240,  cor:'#ffd28a', icone:'🐾',
      desc:'Já rola pelo campo sem tropeçar nos próprios pés.' },
    { nome:'Smerg',            base:480,  cor:'#c9ccd4', icone:'👊',
      desc:'Nome de família reconhecido na arena — mas ainda em treino.' },
    { nome:'Padeiro de Elite', base:720,  cor:'#ffd166', icone:'🥖',
      desc:'Bate tão forte quanto entrega pão quente — respeitado no bairro.' },
    { nome:'Quase-Ciborgue',   base:960,  cor:'#5ad6ff', icone:'🦾',
      desc:'Já apanhou o bastante pra começar a virar máquina de guerra.' },
    { nome:'Meio-Anjo',        base:1200, cor:'#fff2b0', icone:'👼',
      desc:'Carisma de outro mundo — literalmente.' },
    { nome:'Meio-Demônio',     base:1440, cor:'#a24bff', icone:'😈',
      desc:'Rouba mais vitória do que alma, mas rouba as duas.' },
    { nome:'Titã',             base:1680, cor:'#7df0ff', icone:'⚡',
      desc:'Fúria e velocidade que já não cabem em corpo de gente.' },
    { nome:'Lenda Viva',       base:1920, cor:'#ff5e3b', icone:'🔥',
      desc:'Adversário raro — quando aparece, todo mundo já sabe o nome.' },
    { nome:'Smerg Supremo',    base:2160, cor:'#ffe066', icone:'👑', semDivisao:true,
      desc:'O topo da linhagem. Patente única — não tem divisão porque não tem pra onde subir.' }
  ];

  function tier(r){
    r = Math.max(0, r|0);
    let t = TIERS[0];
    for(const x of TIERS){ if(r >= x.base) t = x; }
    if(t.semDivisao) return { nome:t.nome, divisao:null, cor:t.cor, icone:t.icone, desc:t.desc||'', label:t.icone+' '+t.nome, progresso:1 };
    // dentro da patente: divisão 4 embaixo -> 1 em cima
    const off = Math.min(TIER_PTS-1, Math.max(0, r - t.base));
    const div = 4 - Math.floor(off / DIV_PTS);
    const dentro = off % DIV_PTS;
    return { nome:t.nome, divisao:div, cor:t.cor, icone:t.icone, desc:t.desc||'',
             label:t.icone+' '+t.nome+' '+div, progresso:dentro/DIV_PTS,
             faltam: DIV_PTS - dentro };
  }
  function ladder(){ return TIERS; }

  /* ---------- registrar resultado ---------- */
  /* venceu: 1 | 0.5 | 0   info:{diff, myChar, oppChar, rounds} */
  async function report(venceu, info){
    const p = await profile();
    if(!p) return null;
    const oppR = AI_RATING[(info&&info.diff)||'normal'] || AI_RATING.normal;
    const antes = p.rating;
    p.rating = Math.max(100, apply(antes, oppR, venceu));
    p.peakRating = Math.max(p.peakRating||START, p.rating);
    if(venceu===1) p.wins++; else if(venceu===0) p.losses++; else p.draws++;
    p.matches++; p.updatedAt = Date.now();
    const skinsNovas = verificarSkins(p);

    await be().savePlayer(p.uid, p);
    try{
      await be().addMatch({
        uid:p.uid, nick:p.nick, resultado: venceu===1?'vitoria':venceu===0?'derrota':'empate',
        dificuldade:(info&&info.diff)||'normal',
        meuLutador:(info&&info.myChar)||null, adversario:(info&&info.oppChar)||null,
        placar:(info&&info.rounds)||null,
        ratingAntes:antes, ratingDepois:p.rating, delta:p.rating-antes, criadoEm:Date.now()
      });
    }catch(e){ /* histórico é opcional */ }

    cache = p;
    return { antes, depois:p.rating, delta:p.rating-antes, perfil:p, skinsNovas };
  }

  async function leaderboard(n){ try{ return await be().top(n||20); }catch(e){ return []; } }

  /* resultado do MODO SOBREVIVÊNCIA: `streak` é quantos times o jogador
     derrubou seguidos antes de perder (ou de parar por vontade própria).
     Só sobe, igual o peakRating — o recorde é o MELHOR que já rolou, não
     a última tentativa. */
  async function reportSurvival(streak){
    const p = await profile();
    if(!p) return null;
    const anterior = p.survivalRecord||0;
    const novo = Math.max(anterior, streak||0);
    const bateuRecorde = novo > anterior;
    p.survivalRecord = novo;
    p.updatedAt = Date.now();
    await be().savePlayer(p.uid, p);
    cache = p;
    return { recorde:novo, anterior, bateuRecorde };
  }

  /* resultado de partida ONLINE (contra outro jogador de verdade) */
  async function reportOnline(venceu, oppRating, info){
    const p = await profile();
    if(!p) return null;
    const antes = p.rating;
    p.rating = Math.max(100, apply(antes, oppRating||START, venceu));
    p.peakRating = Math.max(p.peakRating||START, p.rating);
    if(venceu===1) p.wins++; else if(venceu===0) p.losses++; else p.draws++;
    p.matches++; p.updatedAt = Date.now();
    const skinsNovas = verificarSkins(p);
    await be().savePlayer(p.uid, p);
    try{
      await be().addMatch(Object.assign({
        uid:p.uid, nick:p.nick, modo:'online-ranked',
        resultado: venceu===1?'vitoria':venceu===0?'derrota':'empate',
        ratingAntes:antes, ratingDepois:p.rating, delta:p.rating-antes,
        ratingAdversario:oppRating||null, criadoEm:Date.now()
      }, info||{}));
    }catch(e){}
    cache = p;
    return { antes, depois:p.rating, delta:p.rating-antes, perfil:p, skinsNovas };
  }

  return { setBackend, isCloud, profile, cached, clearCache, report, reportOnline, reportSurvival,
           leaderboard, tier, ladder, AI_RATING, START,
           playerByUid, profilePublico, favorito, setAvatar };
})();
