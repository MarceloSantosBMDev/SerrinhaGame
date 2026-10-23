/* ============================================================
   PAINEL ADMIN — lança/edita personagens (paleta, corpo,
   passiva, especial) com pré-visualização animada do sprite.
   ============================================================ */
const Admin = (function(){

  let t=0, animId=null;

  function fillPassives(){
    const sel=document.getElementById('f-passive'); sel.innerHTML='';
    Passives.all().forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.icon+' '+p.name; sel.appendChild(o); });
    descP();
  }
  function descP(){ document.getElementById('passive-desc').textContent = Passives.get(document.getElementById('f-passive').value).desc; }

  function num(id){ return parseFloat(document.getElementById(id).value); }
  function val(id){ return document.getElementById(id).value; }

  // monta o objeto personagem a partir do formulário
  function build(){
    const pal={ skin:val('f-skin'), hair:val('f-hair'), primary:val('f-primary'),
                secondary:val('f-secondary'), shoe:val('f-shoe'), aura:val('f-aura'), eye:'#141018' };
    const aura=pal.aura;
    const spType=val('f-sptype'); const spVal=num('f-special'); const spName=val('f-spname');
    let special;
    if(spType==='projectile') special={type:'projectile',name:spName,proj:{color:aura,speed:10,dmg:spVal}};
    else if(spType==='heal')  special={type:'heal',name:spName,heal:spVal||30,color:aura};
    else if(spType==='aoe')   special={type:'aoe',name:spName,radius:150,color:aura};
    else if(spType==='teleport') special={type:'teleport',name:spName,reach:96,h:74,color:aura};
    else if(spType==='dashstrike') special={type:'dashstrike',name:spName,reach:84,h:60,color:aura,dashV:16};
    else special={type:'melee',name:spName,reach:100,h:78,color:aura};

    let id=val('f-id'); const name=val('f-name').trim();
    if(!id) id=Characters.newId(name||'novo');
    return {
      id, name:name||'Novo', title:val('f-title'),
      palette:pal, body:val('f-body'), sig:val('f-sig'),
      hp:num('f-hp'), atk:num('f-atk'), def:num('f-def'), spd:num('f-spd'), jmp:num('f-jmp'), weight:num('f-wt'),
      passive:val('f-passive'),
      light:num('f-light'), heavy:num('f-heavy'),
      special:spVal,          // dano/valor numérico (usado por baseDamage)
      specialMove:special     // objeto rico {type,...} (usado pela engine)
    };
  }

  function buildClean(){ return build(); }

  function live(){
    // pré-visualização instantânea
    const c=buildClean();
    document.getElementById('pv-label').innerHTML = '<b>'+ (c.name||'Novo') +'</b><br>'+ (Passives.get(c.passive).icon)+' '+Passives.get(c.passive).name+'<br>★ '+ ((c.specialMove&&c.specialMove.name)||'');
  }

  function renderList(){
    const arr=Characters.jogaveis();
    document.getElementById('char-count').textContent=arr.length;
    const wrap=document.getElementById('char-list'); wrap.innerHTML='';
    arr.forEach((c,i)=>{
      const div=document.createElement('div'); div.className='char-card';
      const cv=document.createElement('canvas'); cv.width=54; cv.height=64; cv.dataset.id=c.id;
      div.appendChild(cv);
      const info=document.createElement('div'); info.className='char-card-info';
      const tag=i<9?'':' <span style="color:#ff6">(fora do grid)</span>';
      const sp=(c.specialMove&&c.specialMove.name)||'Especial';
      info.innerHTML=`<div class="char-card-name">${c.name}${tag}</div>
        <div class="char-card-meta">HP ${c.hp} · ATK ${c.atk} · DEF ${c.def} · ${Passives.get(c.passive).icon} ${Passives.get(c.passive).name}<br>★ ${sp||'—'}</div>`;
      div.appendChild(info);
      const act=document.createElement('div'); act.className='char-card-actions';
      act.innerHTML=`<button class="btn" data-edit="${c.id}">Editar</button><button class="btn danger" data-del="${c.id}">✕</button>`;
      div.appendChild(act); wrap.appendChild(div);
    });
    wrap.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
    wrap.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>del(b.dataset.del));
  }

  function edit(id){
    const c=Characters.byId(id); if(!c) return;
    document.getElementById('form-title').textContent='EDITAR: '+c.name;
    document.getElementById('f-id').value=c.id;
    document.getElementById('f-name').value=c.name;
    document.getElementById('f-title').value=c.title||'';
    const pal=c.palette||Sprites.palette(c);
    document.getElementById('f-skin').value=pal.skin||'#f1c27d';
    document.getElementById('f-hair').value=pal.hair||'#3a2a1a';
    document.getElementById('f-primary').value=pal.primary||c.color||'#e63b2e';
    document.getElementById('f-secondary').value=pal.secondary||c.color2||'#ffb13b';
    document.getElementById('f-shoe').value=pal.shoe||'#3a2a14';
    document.getElementById('f-aura').value=pal.aura||'#ff7a00';
    document.getElementById('f-body').value=c.body||'normal';
    document.getElementById('f-sig').value=c.sig||'';
    document.getElementById('f-hp').value=c.hp; document.getElementById('f-atk').value=c.atk;
    document.getElementById('f-def').value=c.def; document.getElementById('f-spd').value=c.spd;
    document.getElementById('f-jmp').value=c.jmp; document.getElementById('f-wt').value=c.weight;
    document.getElementById('f-passive').value=c.passive;
    document.getElementById('f-light').value=c.light; document.getElementById('f-heavy').value=c.heavy;
    const sp=c.specialMove||{type:'melee',name:'Especial'};
    document.getElementById('f-sptype').value=sp.type||'melee';
    document.getElementById('f-spname').value=sp.name||'Especial';
    document.getElementById('f-special').value=(c.special!=null? c.special : (sp.heal||(sp.proj&&sp.proj.dmg)||20));
    descP(); live(); window.scrollTo({top:0,behavior:'smooth'});
  }

  function del(id){ if(confirm('Remover este personagem?')){ Characters.remove(id); renderList(); } }

  function save(ev){
    ev.preventDefault();
    const c=buildClean();
    Characters.upsert(c);
    cancel(); renderList();
    return false;
  }

  function cancel(){
    document.getElementById('char-form').reset();
    document.getElementById('f-id').value='';
    document.getElementById('form-title').textContent='LANÇAR NOVO PERSONAGEM';
    descP(); live();
  }

  function resetAll(){ if(confirm('Restaurar os 9 personagens padrão? Isto apaga suas criações.')){ Characters.reset(); renderList(); cancel(); } }

  function animLoop(){
    t++;
    const c=buildClean();
    Sprites.renderTo(document.getElementById('preview'), c, 'punch', 3.2, t);
    Sprites.renderTo(document.getElementById('preview2'), c, 'kick', 3.2, t);
    document.querySelectorAll('#char-list canvas').forEach(cv=>{
      const ch=Characters.byId(cv.dataset.id); if(ch) Sprites.renderTo(cv, ch, 'idle', 1.5, t);
    });
    animId=requestAnimationFrame(animLoop);
  }

  // init
  fillPassives(); renderList(); live(); animLoop();

  return { save, cancel, resetAll, edit, del, descP, live };
})();
