/* ============================================================
   TELA DE SELEÇÃO 3x3 — mostra arma, história e as 4 skills
   ============================================================ */
const CharSelect = (function(){

  let turn=1, p1=null, p2=null, mode='cpu', diff='normal', onlineMode=null;
  let animId=null, t=0, hovered=null;

  const WEAPON_PT = { sword:'Espada', staff:'Cajado', daggers:'Adagas', hammer:'Marreta',
    spear:'Lança', scythe:'Foice', axe:'Machado', holystaff:'Bastão Sagrado', bow:'Arco', fists:'Punhos' };

  /* seleção do ONLINE: escolhe só o SEU lutador e entra na fila */
  function initOnline(modoOnline){
    mode='online'; onlineMode=modoOnline;
    turn=1; p1=null; p2=null; hovered=Characters.grid()[0].id;
    render(); showInfo(Characters.grid()[0]);
    document.getElementById('select-title').textContent =
      (modoOnline==='ranked'?'🏆 RANQUEADA':'🎲 CASUAL')+' — ESCOLHA SEU LUTADOR';
    const picks=document.querySelector('#screen-select .picks');
    if(picks) picks.style.display='none';
    if(animId) cancelAnimationFrame(animId); animLoop();
  }

  function init(m,d){
    mode=m||'cpu'; diff=d||'normal'; onlineMode=null;
    const picks=document.querySelector('#screen-select .picks');
    if(picks) picks.style.display='';
    turn=1; p1=null; p2=null; hovered=Characters.grid()[0].id;
    render(); updateTitle(); updatePicks(); showInfo(Characters.grid()[0]);
    if(animId) cancelAnimationFrame(animId); animLoop();
  }

  function updateTitle(){
    const who = turn===1?'JOGADOR 1':(mode==='cpu'?'ESCOLHA O OPONENTE (IA)':'JOGADOR 2');
    document.getElementById('select-title').textContent = who+' — ESCOLHA O LUTADOR';
  }
  function updatePicks(){
    document.getElementById('p1-pick').textContent = p1?Characters.byId(p1).name:'---';
    const l2=document.getElementById('p2-label'); if(l2) l2.textContent=mode==='cpu'?'IA:':'P2:';
    document.getElementById('p2-pick').textContent = p2?Characters.byId(p2).name:'---';
  }

  function render(){
    const grid=document.getElementById('character-grid'); grid.innerHTML='';
    Characters.grid().forEach(c=>{
      const cell=document.createElement('div'); cell.className='char-cell';
      if(p1===c.id) cell.classList.add('p1'); if(p2===c.id) cell.classList.add(p1===c.id?'both':'p2');
      const cv=document.createElement('canvas'); cv.width=170; cv.height=170; cv.dataset.id=c.id; cell.appendChild(cv);
      if(p1===c.id){ const t=document.createElement('div'); t.className='tag-corner l'; t.textContent='P1'; cell.appendChild(t); }
      if(p2===c.id){ const t=document.createElement('div'); t.className='tag-corner r'; t.textContent=mode==='cpu'?'IA':'P2'; cell.appendChild(t); }
      const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=c.name; cell.appendChild(nm);
      const tg=document.createElement('div'); tg.className='char-tag'; tg.textContent='⚔ '+(WEAPON_PT[c.weapon&&c.weapon.type]||'—'); cell.appendChild(tg);
      cell.onmouseenter=()=>{ hovered=c.id; showInfo(c); };
      cell.onclick=()=>pick(c.id);
      grid.appendChild(cell);
    });
  }

  function showInfo(c){
    const pas=Passives.get(c.passive);
    const wpn=WEAPON_PT[c.weapon&&c.weapon.type]||'—';
    let skillsHtml='';
    (c.skills||[]).forEach(sk=>{
      const tag = sk.type==='stance'
        ? `<span class="sk-toggle">ATIVO</span><span class="sk-cd2">${(sk.cd/60).toFixed(1)}s após</span>`
        : `<span class="sk-cd2">${(sk.cd/60).toFixed(1)}s</span>`;
      skillsHtml += `<div class="sk-row"><span class="sk-b">[${sk.key}] ${sk.icon||'★'} ${sk.name}</span>`+
        `${tag}<span class="sk-d">${sk.desc}</span></div>`;
    });
    document.getElementById('info-panel').innerHTML =
      `<div class="ip-head"><b>${c.name}</b> — <i>${c.title||''}</i> &nbsp; <span class="ip-wpn">⚔ ${wpn}</span></div>`+
      `<div class="ip-story">"${c.story||''}"</div>`+
      `<div class="ip-pass"><span class="ptag">${pas.icon} PASSIVA — ${pas.name}:</span> ${pas.desc}</div>`+
      `<div class="ip-stats">HP ${c.hp} · ATK ${c.atk} · DEF ${c.def} · VEL ${c.spd} · PESO ${c.weight}</div>`+
      (c.forms? `<div class="ip-forms">🔄 TRANSFORMA: ${
        (c.formNames||[]).map((n,i)=> i===0? n
          : `<b>${n}</b> (${Math.round((c.formThresholds[i-1]||0)*100)}% vida)`).join(' → ')}</div>` : '')+
      `<div class="ip-skills">${skillsHtml}</div>`;
  }

  function animLoop(){
    t++;
    document.querySelectorAll('#character-grid canvas').forEach(cv=>{
      const c=Characters.byId(cv.dataset.id); if(!c) return;
      Sprites.renderTo(cv, c, (hovered===c.id)?'punch':'idle', 2.4, t);
    });
    animId=requestAnimationFrame(animLoop);
  }

  function pick(id){
    // ONLINE: escolhe só o seu lutador e vai para a fila
    if(mode==='online'){
      p1=id; render();
      if(animId) cancelAnimationFrame(animId);
      setTimeout(()=>Online.comLutador(id), 250);
      return;
    }
    if(turn===1){ p1=id; turn=2; updateTitle(); }
    else { p2=id; }
    render(); updatePicks();
    if(p1&&p2){ if(animId) cancelAnimationFrame(animId);
      setTimeout(()=>{ goto('arena'); Game.start(Characters.byId(p1), Characters.byId(p2), {mode,diff}); }, 300); }
  }
  function stop(){ if(animId){ cancelAnimationFrame(animId); animId=null; } }

  return { init, initOnline, stop };
})();
