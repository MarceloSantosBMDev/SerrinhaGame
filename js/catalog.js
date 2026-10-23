/* ============================================================
   CATÁLOGO DE PERSONAGENS — mostra todo o elenco (inclusive os
   exclusivos do 3x3) com raça, passiva, stats e a história de
   cada um. Tela somente de consulta: não escolhe ninguém aqui.
   ============================================================ */
const Catalog = (function(){

  let animId=null, t=0, hovered=null;
  let perfil=null;         // Ranked.profile() — dono do unlockedSkins (null pra visitante)

  function init(){
    hovered = Characters.jogaveis()[0].id;
    renderLegend();
    render();
    showInfo(Characters.byId(hovered));
    if(animId) cancelAnimationFrame(animId); animLoop();
    carregarPerfil();
  }
  function stop(){ if(animId){ cancelAnimationFrame(animId); animId=null; } }

  /* o desbloqueio (unlockedSkins) mora no PERFIL do jogador — precisa
     buscar antes de saber quais skins mostrar liberadas. É assíncrono
     (pode vir do Firestore), então a tela abre já e reconsulta a ficha
     do personagem em foco assim que o perfil chega. */
  async function carregarPerfil(){
    try{ perfil = (typeof Ranked!=='undefined')? await Ranked.profile() : null; }
    catch(e){ perfil=null; }
    if(hovered) showInfo(Characters.byId(hovered));
  }

  /* a leitura/gravação de qual skin está EQUIPADA mora em Characters
     (js/characters.js) — o catálogo escreve nela, mas quem também LÊ é a
     montagem de time e a batalha 3x3 (js/turnui.js), então não podia
     ficar só aqui. */
  function skinLiberada(charId, skin){
    if(!skin.unlock) return true;                          // padrão: sempre liberada
    const lista=(perfil&&perfil.unlockedSkins)||[];
    return lista.includes(Characters.skinKey(charId, skin.id));
  }
  /* clique num chip de skin liberada — troca a que está equipada e
     redesenha (a ficha de INFO e a miniatura do grid). */
  function equiparSkin(charId, skinId){
    const c=Characters.byId(charId); if(!c) return;
    const skin=(c.skins||[]).find(s=>s.id===skinId);
    if(!skin || !skinLiberada(charId, skin)) return;
    Characters.salvarSkinEquipada(charId, skinId);
    if(hovered===charId) showInfo(c);
  }
  function skinsHtml(c){
    if(!c.skins || c.skins.length<2) return '';
    const equip=Characters.skinEquipadaId(c);
    return `<div class="ip-skins">`+
      c.skins.map(s=>{
        const liberada=skinLiberada(c.id, s);
        const sel=equip===s.id;
        const req = (!liberada && s.unlock && s.unlock.tipo==='ranked_wins')
          ? `Vença ${s.unlock.valor} partidas ranqueadas pra liberar.` : '';
        const titulo = liberada? (s.desc||'') : ('🔒 '+req);
        return `<button class="skin-chip ${sel?'sel':''} ${liberada?'':'lock'}" title="${titulo.replace(/"/g,'&quot;')}"
                  ${liberada? `onclick="Catalog.equiparSkin('${c.id}','${s.id}')"` : 'disabled'}>`+
                  `${liberada? (s.icone||'🎨') : '🔒'} ${s.nome}`+
                `</button>`;
      }).join('')+
    `</div>`;
  }

  function renderLegend(){
    const box=document.getElementById('catalog-races'); if(!box) return;
    box.innerHTML='';
    Object.keys(Characters.RACES).forEach(rid=>{
      const r=Characters.RACES[rid];
      const chip=document.createElement('div'); chip.className='race-chip';
      chip.style.borderColor=r.cor; chip.style.color=r.cor;
      chip.textContent=r.icone+' '+r.nome;
      box.appendChild(chip);
    });
  }

  function render(){
    const grid=document.getElementById('catalog-grid'); if(!grid) return;
    grid.innerHTML='';
    Characters.jogaveis().forEach(c=>{
      const race=Characters.raceOf(c.race);
      const cell=document.createElement('div'); cell.className='char-cell';
      if(hovered===c.id) cell.classList.add('p1');
      const cv=document.createElement('canvas'); cv.width=170; cv.height=170; cv.dataset.id=c.id; cell.appendChild(cv);
      const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=c.name; cell.appendChild(nm);
      const tg=document.createElement('div'); tg.className='char-tag'; tg.style.color=(race?race.cor:'#9d86c4');
      tg.textContent=(race?race.icone+' '+race.nome:'—'); cell.appendChild(tg);
      cell.onmouseenter=()=>{ hovered=c.id; showInfo(c);
        document.querySelectorAll('#catalog-grid .char-cell').forEach(e=>e.classList.remove('p1'));
        cell.classList.add('p1'); };
      cell.onclick=cell.onmouseenter;
      grid.appendChild(cell);
    });
  }

  /* a passiva e os stats de verdade agora são os do 3x3 (TurnData) —
     o campo `passive`/hp/atk/def/spd de characters.js é resquício do
     modo de luta 1x1 que saiu do jogo, então nem entra aqui. */
  function getPassiveInfo(id){
    const ficha=TurnData.ficha(id);
    if(!ficha) return { icon:'—', name:'Nenhuma', desc:'Sem habilidade passiva especial.' };
    const p=TurnData.passiva(ficha.passiva);
    return { icon:p.icone, name:p.nome, desc:p.desc };
  }

  function showInfo(c){
    const pas=getPassiveInfo(c.id);
    const ficha=TurnData.ficha(c.id);
    const race=Characters.raceOf(c.race);
    const raceHtml = race
      ? `<div class="ip-pass"><span class="ptag" style="color:${race.cor}">${race.icone} RAÇA — ${race.nome}:</span> ${race.desc}</div>`
      : '';
    const statsHtml = ficha
      ? `<div class="ip-stats">HP ${ficha.hp} · ATK ${ficha.atk} · DEF ${ficha.def} · VEL ${ficha.spd}</div>`
      : '';
    document.getElementById('catalog-info').innerHTML =
      `<div class="ip-head"><b>${c.name}</b> — <i>${c.title||''}</i></div>`+
      raceHtml+
      `<div class="ip-story">"${c.lore||c.story||''}"</div>`+
      `<div class="ip-pass"><span class="ptag">${pas.icon} PASSIVA — ${pas.name}:</span> ${pas.desc}</div>`+
      statsHtml+
      (c.formNames? `<div class="ip-forms">🔄 TRANSFORMA: ${
        c.formNames.map((n,i)=> i===0? n
          : (c.formThresholds ? `<b>${n}</b> (${Math.round(c.formThresholds[i-1]*100)}% vida)` : `<b>${n}</b>`)).join(' → ')}</div>` : '')+
      skinsHtml(c);
  }

  function animLoop(){
    t++;
    document.querySelectorAll('#catalog-grid canvas').forEach(cv=>{
      const c=Characters.byId(cv.dataset.id); if(!c) return;
      Sprites.renderTo(cv, Characters.charComSkin(c), (hovered===c.id)?'punch':'idle', 2.4, t);
    });
    animId=requestAnimationFrame(animLoop);
  }

  return { init, stop, equiparSkin };
})();
