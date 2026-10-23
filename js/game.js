/* ============================================================
   MOTOR DO JOGO (v3 — armas, skills com cooldown, jogo estratégico)
   Integra: Physics, Sprites, Passives, FX, Input, AI
   - Golpes normais (leve/forte) baseados na ARMA
   - 4 SKILLS por personagem, cada uma com COOLDOWN
   - Buffs (fúria/pedra/escudo), status, projéteis, área
   - Cancelamentos para combos, juggle, super-flash e câmera lenta
   ============================================================ */
const Game = (function(){

  const canvas=document.getElementById('arena');
  const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
  const W=canvas.width, H=canvas.height;
  const WORLD={ left:18, right:W-18, top:0, floor:H-58 };
  const SCALE=3.3;
  const HP_SCALE=1.6;      // vida maior -> lutas mais longas
  const BASE_SPEED=0.68;   // ritmo global (1 = normal). Luta lenta e analisável
  const MOVE_SCALE=0.80;   // andar/pular mais pesado

  /* ---- física de impacto ---- */
  const KB = {
    punch:{ x:8.5,  y:-2.8, air:-4.6 },   // empurrão leve
    kick:{  x:15.0, y:-6.5, air:-8.0 },   // chute joga pra trás e levanta
    heavy:{ x:16.0, y:-7.0, air:-8.6 },
    skill:{ x:17.5, y:-8.0, air:-9.6 },
    super:{ x:26.0, y:-12.0, air:-13.5 }
  };
  const KD_SPEED=9.0;      // velocidade de queda que derruba (knockdown)
  const KD_TIME=52;        // frames no chão
  const WAKE_INVULN=26;    // invencibilidade ao levantar

  /* ---- stamina (anti-spam) ---- */
  const ST_MAX=100;
  const ST_COST={ punch:12, kick:17, heavy:24, skill:28, super:40, dash:16, airdash:20, jump:7 };
  const ST_REGEN={ idle:0.78, walk:0.58, block:0.16, air:0.30, acting:0.0 };
  const ST_IDLE_DELAY=28;  // frames parado antes de "recuperar o fôlego"
  const ST_BLOCK_HIT=0.85; // stamina gasta por ponto de dano bloqueado
  const EXHAUST_TIME=110;  // frames exausto ao zerar

  // modificador de alcance/dano por arma
  const WMOD = {
    sword:{r:1.12,d:1.0}, staff:{r:1.18,d:0.95}, daggers:{r:0.85,d:0.9}, hammer:{r:1.0,d:1.3},
    spear:{r:1.5,d:1.0}, scythe:{r:1.25,d:1.05}, axe:{r:1.05,d:1.25}, holystaff:{r:1.16,d:0.95}, bow:{r:0.8,d:0.85},
    fists:{r:0.92,d:1.0}
  };
  const SWING = ['sword','axe','hammer','scythe'];
  const BUFFNAME = { rage:'FÚRIA', iron:'PELE DE PEDRA', haste:'VELOZ', shield:'ESCUDO' };

  let f1,f2, projectiles=[], running=false, rafId=null, frame=0;
  let mode='cpu', diff='normal';
  let _c1,_c2, rounds={1:0,2:0}, roundNum=1, roundTime, lastSec, roundFrames=0, endLock=0, matchOver=false;
  let timeScale=1, acc=0, koPending=false, koTimer=0, paused=false;
  /* ---- online ---- */
  let netRole=null, netChan=null, remoteCtrl=null, netSendT=0, lastSnap=null, netOnEnd=null;
  let netSeq=0, netUltimoN=-1;
  const SNAP_FRAMES=2;    // host manda estado a cada 2 frames (~30x/s)
  const INPUT_HEARTBEAT=6;// guest: reenvio de segurança a cada 6 frames (~10x/s).
                          // Os golpes NÃO esperam isso: saem no mesmo frame.
  const comboFx={1:{n:0,t:0,x:0,y:0}, 2:{n:0,t:0,x:0,y:0}};

  /* ---------------- API p/ passivas/efeitos ---------------- */
  const g = {
    opponent(f){ return f===f1?f2:f1; },
    deal(target,dmg,attacker,info){ damage(target,dmg,attacker,info||{}); },
    knock(target,fx,fy){ Physics.knockback(target.body, fx*(1-(target.kbResist||0)), fy); },
    applyStatus, fx:FX,
    floatText(f,text,color,size){ FX.floatText(f.body.x+f.body.w/2, f.body.y-8, text, color, size||12); }
  };
  function elem(f){ return f.char.element||'fire'; }
  function vcol(f){ return (f.weapon&&f.weapon.aura) || (f.char.palette&&f.char.palette.aura) || '#fff'; }

  /* ============ CONTROLE REMOTO (input que chega pela rede) ============ */
  function makeRemoteCtrl(){
    const s={ held:{}, fila:[], dash:0 };
    return { type:'remote', state:s,
      held(a){ return !!s.held[a]; },
      pressed(a){ const i=s.fila.indexOf(a); if(i>=0){ s.fila.splice(i,1); return true; } return false; },
      dash(){ const d=s.dash; s.dash=0; return d; },
      skill(n){ const i=s.fila.indexOf('skill'+n); if(i>=0){ s.fila.splice(i,1); return true; } return false; } };
  }
  /* lê o que o jogador local apertou, para mandar pela rede */
  function amostraInput(cc, acc){
    ['left','right','jump','block'].forEach(a=>{ acc.held[a]=cc.held(a); });
    ['punch','kick','heavy'].forEach(a=>{ if(cc.pressed(a)) acc.fila.push(a); });
    for(let n=1;n<=4;n++) if(cc.skill(n)) acc.fila.push('skill'+n);
    const d=cc.dash(); if(d) acc.dash=d;
    return acc;
  }
  /* estado autoritativo que o host manda para o guest */
  function montaSnapshot(){
    /* pacote enxuto: campos zerados são omitidos (a maioria fica em 0
       quase sempre). Menos bytes = menos tempo no ar.                */
    function f2o(f){ const b=f.body; const o={
      x:Math.round(b.x), y:Math.round(b.y), fc:b.facing,
      hp:Math.round(f.hp), st:Math.round(f.st), po:poseOf(f) };
      if(b.vx) o.vx=+b.vx.toFixed(1);
      if(b.vy) o.vy=+b.vy.toFixed(1);
      if(b.onGround) o.og=1;
      if(f.action) o.at=f.action.t;
      if(f.stun) o.sn=f.stun;
      if(f.hitstun) o.hs=f.hitstun;
      if(f.knockdown) o.kd=f.knockdown;
      if(f.exhausted) o.ex=f.exhausted;
      if(f.combo) o.cb=f.combo;
      if(f.stance) o.stc=f.stance.idx;
      // recargas mudam devagar: manda a cada 6 pacotes
      if(frame % (SNAP_FRAMES*6) < SNAP_FRAMES) o.cd=f.cd.map(x=>Math.round(x));
      return o; }
    return { t:frame, a:f2o(f1), b:f2o(f2), r:[rounds[1],rounds[2]], rt:roundTime, rn:roundNum };
  }
  function aplicaSnapshot(s){
    if(!s||!f1||!f2) return;
    /* meuLado = o lutador que ESTE cliente controla (guest = f2).
       Nele usamos PREDIÇÃO: a posição é minha, o resto é do host.  */
    function o2f(f,o,meuLado){ const b=f.body;
      const n=v=>v||0;                    // campos omitidos valem 0
      // vida/atordoamento/recarga: sempre do host (ele é a autoridade)
      f.hp=o.hp; f.st=o.st; f.stun=n(o.sn); f.hitstun=n(o.hs);
      f.knockdown=n(o.kd); f.exhausted=n(o.ex); f.combo=n(o.cb);
      if(o.cd) for(let i=0;i<4;i++) f.cd[i]=o.cd[i];
      f._netStance=(o.stc==null?-1:o.stc);
      f._netTarget={x:o.x, y:o.y};
      // se o host diz que estou apanhando, ele manda no meu corpo também
      const hostManda = !meuLado || n(o.sn)>0 || n(o.hs)>0 || n(o.kd)>0;
      if(hostManda){
        f._netPose=o.po; f._netAt=n(o.at);
        b.vx=n(o.vx); b.vy=n(o.vy); b.facing=o.fc; b.onGround=!!o.og;
        if(Math.abs(o.x-b.x)>220 || Math.abs(o.y-b.y)>220){ b.x=o.x; b.y=o.y; }
      } else {
        f._netPose=null;                 // pose vem da minha simulação local
        if(Math.abs(o.x-b.x)>260){ b.x=o.x; b.y=o.y; }   // divergiu demais: recoloca
      }
    }
    o2f(f1, s.a, netRole==='guest'? false : true);
    o2f(f2, s.b, netRole==='guest'? true  : false);
    rounds[1]=s.r[0]; rounds[2]=s.r[1]; roundTime=s.rt; roundNum=s.rn;
    lastSnap=s;
  }

  /* ---------------- criação de lutador ---------------- */
  function makeFighter(char,x,facing,playerNum,ctrl){
    const b=Physics.makeBody(x, WORLD.floor-104, 52, 104, char.weight||1);
    b.facing=facing;
    const hp=Math.round((char.hp||100)*HP_SCALE);
    const f={ char, playerNum, ctrl, body:b, weapon:char.weapon,
      maxHp:hp, hp:hp, maxSp:100, sp:0,
      atk:char.atk, def:char.def, spd:char.spd, jmp:char.jmp, _baseSpd:char.spd,
      passive:char.passive, blocking:false, blockTime:0,
      action:null, cd:[0,0,0,0],
      stun:0, hitstun:0, flash:0, combo:0, comboTimer:0, juggle:0,
      status:{}, buffs:{}, frozen:false, invuln:0, intangible:0, charged:false, regenLock:0,
      counterWindow:0, dashCd:0, wasGround:true, hitbox:null, activeHit:null, _reborn:false,
      maxAirJumps:1, airJumps:1, airDash:true, jumpPrev:false, fastFall:false,
      // stamina / fôlego
      st:ST_MAX, maxSt:ST_MAX, exhausted:0,
      // física de impacto
      launched:false, knockdown:0, lastMove:null, moveRepeat:0,
      // POSTURA (skill ativa que liga/desliga)
      stance:null, stanceHitCd:0, bounced:false };
    f.spd*=MOVE_SCALE; f._baseSpd=f.spd; f.jmp*=0.94;
    // estado de forma (personagens com transformação, ex.: Mecas)
    f.form=0; f.formBuff={atk:1,spd:1,def:0};
    f._baseSpdOrig=f.spd; f._baseDefOrig=f.def;
    Passives.spawn(f);
    return f;
  }

  /* ---------------- status ---------------- */
  function applyStatus(target,type,opts){
    opts=opts||{}; const st=target.status;
    if(type==='burn'){ st.burn=st.burn||{stacks:0,time:0}; st.burn.stacks=Math.min(6,st.burn.stacks+(opts.stacks||1));
      st.burn.time=Math.max(st.burn.time,opts.time||180); st.burn.src=opts.src||st.burn.src; return st.burn; }
    if(type==='chill'){ st.chill=st.chill||{stacks:0,time:0}; st.chill.stacks=Math.min(opts.max||4, st.chill.stacks+1);
      st.chill.time=opts.time||240; if(!target.immuneSlow) applyStatus(target,'slow',{time:80,mult:0.7}); return st.chill; }
    if(type==='freeze'){ if(target.frozenImmune) return {}; st.freeze={time:opts.time||48}; return st.freeze; }
    if(type==='poison'){ st.poison={time:opts.time||200, src:opts.src}; return st.poison; }
    if(type==='bleed'){ st.bleed={time:opts.time||120}; return st.bleed; }
    if(type==='slow'){ if(target.immuneSlow) return {}; st.slow={time:opts.time||90,mult:opts.mult||0.6}; return st.slow; }
    return {};
  }
  function applyStatuses(t,st,src){
    if(!st) return;
    if(st.burn) applyStatus(t,'burn',{stacks:st.burn,time:200,src});
    if(st.poison) applyStatus(t,'poison',{time:80+st.poison*50,src});
    if(st.chill){ for(let i=0;i<st.chill;i++) applyStatus(t,'chill',{time:240}); }
    if(st.freeze) applyStatus(t,'freeze',{time:st.freeze});
    if(st.slow) applyStatus(t,'slow',{time:120,mult:st.slow});
    if(st.bleed) applyStatus(t,'bleed',{time:120});
  }

  function tickStatus(f){
    const st=f.status;
    if(st.burn){ st.burn.time--; if(st.burn.time>0 && st.burn.time%34===0){ damage(f, 1.0+st.burn.stacks*0.9, st.burn.src, {type:'dot'}); FX.status(f.body.x+f.body.w/2,f.body.y+18,'#ff7a00'); } if(st.burn.time<=0) delete st.burn; }
    if(st.poison){ st.poison.time--; if(st.poison.time>0 && st.poison.time%28===0){ const d=2.0; damage(f,d,st.poison.src,{type:'poison'}); const s=st.poison.src; if(s&&s.hp>0) s.hp=Math.min(s.maxHp,s.hp+d*0.25); FX.status(f.body.x+f.body.w/2,f.body.y+18,'#aaff00'); } if(st.poison.time<=0) delete st.poison; }
    if(st.bleed){ st.bleed.time--; if(st.bleed.time>0 && st.bleed.time%32===0){ damage(f,1.1,null,{type:'dot'}); FX.status(f.body.x+f.body.w/2,f.body.y+18,'#ff3b3b'); } if(st.bleed.time<=0) delete st.bleed; }
    if(st.chill){ st.chill.time--; if(st.chill.time<=0) delete st.chill; }
    if(st.slow){ st.slow.time--; if(st.slow.time<=0) delete st.slow; }
    f.frozen=false;
    if(st.freeze){ st.freeze.time--; f.frozen=true; if(st.freeze.time<=0) delete st.freeze; }
  }
  function tickBuffs(f){
    for(const k in f.buffs){ const bf=f.buffs[k]; if(bf){ bf.time--; if(bf.time<=0) delete f.buffs[k]; } }
  }
  function applyBuff(f,data){
    if(data.buff==='shield') f.buffs.shield={time:data.dur, amount:data.amount, max:data.amount};
    else f.buffs[data.buff]={time:data.dur, mult:data.mult};
    FX.ring(f.body.x+f.body.w/2,f.body.y+f.body.h/2, data.color||'#fff');
    g.floatText(f, BUFFNAME[data.buff]||'BUFF', data.color||'#fff', 12);
  }

  /* ---------------- dano ---------------- */
  function damage(target,dmg,attacker,info){
    info=info||{};
    if(target.hp<=0 && !info.force) return;
    if(target.invuln>0 && info.type!=='dot') return;
    const direct=['light','heavy','skill','special','projectile','dashstrike'].includes(info.type);
    if(target.intangible>0 && direct){ g.floatText(target,'ESQUIVA','#fff'); return; }
    let d=dmg;
    if(direct) d=Math.max(1, d - target.def*0.45);
    if(target.buffs.iron) d*=target.buffs.iron.mult;
    if(target.exhausted>0) d*=1.25;      // exausto = mais vulnerável (punição por spam)
    d=Passives.damaged(target, d, info, g);
    if(d<0) d=0;
    // escudo absorve
    if(target.buffs.shield){ const s=target.buffs.shield; const ab=Math.min(s.amount,d); s.amount-=ab; d-=ab;
      if(ab>0) g.floatText(target,'🛡','#bfe9ff',11); if(s.amount<=0) delete target.buffs.shield; }
    target.hp-=d;
    if(d>0.5) target.flash=Math.max(target.flash,5);
    if(d>=1) g.floatText(target, Math.round(d), info.type==='skill'||info.type==='special'?'#ff3bd0':(info.type==='dot'||info.type==='poison'?'#aaff00':'#ffffff'), info.type==='special'?16:12);
    if(target.hp<=0){ target.hp=0; Passives.ko(target,g); }
  }

  /* ---------------- construção de golpes ---------------- */
  function buildNormal(f,kind){
    const wt=f.weapon&&f.weapon.type; const wm=WMOD[wt]||{r:1,d:1};
    const swing=SWING.includes(wt);
    if(kind==='punch'){    // SOCO: golpe rápido com a arma (estocada), pouco dano, recovery curto
      return { name:'soco', anim:'thrust', startup:5, recovery:11,
        hits:[{done:false,start:5,end:9,reach:48*wm.r,h:38,dmg:f.atk*0.40*wm.d,hitstun:11,kb:3}] };
    }
    if(kind==='kick'){     // CHUTE: perna, bom alcance e empurrão (ótimo p/ espaçar)
      return { name:'chute', anim:'kick', startup:8, recovery:15,
        hits:[{done:false,start:8,end:13,reach:62,h:46,dmg:f.atk*0.6,hitstun:15,kb:9}] };
    }
    return { name:'forte', anim:'swing', startup:11, recovery:22,   // FORTE: golpe de arma pesado
      hits:[{done:false,start:11,end:18,reach:64*wm.r,h:54,dmg:f.atk*0.85*wm.d,hitstun:18,kb:7}] };
  }

  function buildSkillMove(f,skill,index){
    /* formOverride: a MESMA skill muda de comportamento conforme a forma
       do lutador (ex.: o Arsenal do Mecas vira tiro de rifle no ciborgue,
       e o super vira explosão em área). Mescla os campos por cima.     */
    if(skill.formOverride && skill.formOverride[f.form||0]){
      skill = Object.assign({}, skill, skill.formOverride[f.form||0]);
      if(skill.aoe){ skill = Object.assign({}, skill, {type:'aoe'}); }
    }
    const m={ name:skill.name, anim:skill.anim||'special', super:!!skill.super, isSkill:true,
              cd:skill.cd, skillIndex:index, startup:skill.startup||10, recovery:skill.recovery||20,
              armor:!!skill.armor, hits:null, pre:null, cast:null, iframes:null };
    switch(skill.type){
      case 'melee':
        m.hits = skill.hits.map(h=>Object.assign({done:false}, h)); break;
      case 'projectile':
        m.cast={at:skill.startup||10, kind:'projectile', done:false,
          data:{dmg:skill.dmg, speed:skill.speed, color:skill.color, status:skill.status, lifesteal:skill.lifesteal,
                big:skill.big, boomerang:skill.boomerang, range:skill.range, emoji:skill.emoji, food:skill.food}}; break;
      case 'aoe':
        m.cast={at:skill.startup||14, kind:'aoe', done:false,
          data:{dmg:skill.dmg, radius:skill.radius, knockup:skill.knockup, color:skill.color, status:skill.status, front:skill.front, detonate:skill.detonate, healSelf:skill.healSelf}}; break;
      case 'buff':
        m.cast={at:skill.startup||8, kind:'buff', done:false,
          data:{buff:skill.buff, mult:skill.mult, amount:skill.amount, dur:skill.dur, color:skill.color}}; break;
      case 'heal':
        m.cast={at:skill.startup||12, kind:'heal', done:false, data:{amount:skill.amount, color:skill.color}}; break;
      case 'dash':
        m.pre={at:Math.max(1,(skill.startup||6)-2), kind: skill.blink?'blink':(skill.fly?'fly':'dash'), done:false,
          data:{dist:skill.dist||16, behind:skill.blink==='behind', back:skill.back, up:skill.up, refund:skill.refund}};
        if(skill.iframes) m.iframes={start:0,end:skill.iframes};
        if(skill.dmg>0) m.hits=[{done:false,start:skill.startup||6,end:(skill.startup||6)+8,reach:skill.reach||60,h:56,dmg:skill.dmg,hitstun:16,kb:skill.kb||6,status:skill.status,color:skill.color,guardBreak:skill.guardBreak}];
        break;
      case 'counter':
        m.cast={at:skill.startup||4, kind:'counter', done:false,
          data:{window:skill.window||22, dmg:skill.dmg||18, car:skill.car, carVfx:skill.carVfx}}; break;
    }
    return m;
  }

  function actionEnd(m){
    let last=m.startup||6;
    if(m.hits&&m.hits.length) last=Math.max.apply(null, m.hits.map(h=>h.end));
    else if(m.cast) last=m.cast.at;
    return last + (m.recovery||16);
  }

  function startAction(f, move){
    f.action={move, t:0, hitConnected:false};
    f.hitbox=null; f.activeHit=null;
    if(move.isSkill){ VFX.play(elem(f), 'charge', f.body.x+f.body.w/2, f.body.y+f.body.h*0.5, f.body.facing, vcol(f)); }
    if(move.super){ FX.screenFlash(12, vcol(f)); FX.addShake(10); FX.addHitstop(4); }
  }

  function tryNormal(f,kind){ startAction(f, buildNormal(f,kind)); }
  /* ============ POSTURAS (skills que ligam/desligam) ============
     Ativa no toque, fica ativa gastando fôlego, e sai quando:
       - o jogador aperta o botão de novo
       - o fôlego acaba (fica exausto)
     Enquanto ativa pode: dar PARRY, causar dano por contato, mudar
     a velocidade e trocar a animação.                              */
  function startStance(f,i,sk){
    f.stance={idx:i, def:sk, t:0};
    f.stanceHitCd=0;
    interrupt(f);
    const c=sk.color||vcol(f);
    FX.ring(f.body.x+f.body.w/2, f.body.y+f.body.h/2, c);
    VFX.play(elem(f),'charge', f.body.x+f.body.w/2, f.body.y+f.body.h*0.5, f.body.facing, c);
    g.floatText(f, sk.onText||sk.name, c, 12);
  }
  function endStance(f, motivo){
    if(!f.stance) return;
    const sk=f.stance.def, i=f.stance.idx;
    f.cd[i]=sk.cd;                       // a recarga só começa ao SAIR
    f.stance=null; f.stanceHitCd=0;
    FX.dust(f.body.x+f.body.w/2, WORLD.floor, f.body.facing);
    if(motivo==='stamina') g.floatText(f,'SEM FÔLEGO!','#ff6b6b',12);
    else g.floatText(f, sk.offText||'FIM', '#9fd8ff', 11);
  }

  function stepStance(f){
    if(!f.stance) return;
    const sk=f.stance.def, b=f.body;
    f.stance.t++;

    // fôlego escoa enquanto a postura estiver ligada
    f.st -= (sk.drain||0.55);
    if(f.st<=0){ f.st=0; f.exhausted=EXHAUST_TIME; endStance(f,'stamina'); return; }
    // não dá pra manter postura caído/atordoado
    if(f.knockdown>0 || f.hp<=0){ endStance(f,'queda'); return; }

    if(f.stanceHitCd>0) f.stanceHitCd--;

    // movimento próprio da postura (ex.: rolando rápido)
    if(sk.rollSpeed){
      const dirIn=(f.ctrl.held('right')?1:0)-(f.ctrl.held('left')?1:0);
      if(dirIn!==0){ b.facing=dirIn; b.vx += dirIn*sk.rollSpeed*0.35; }
      const mx=sk.rollSpeed;
      if(b.vx>mx)b.vx=mx; if(b.vx<-mx)b.vx=-mx;
      if(f.stance.t%4===0) FX.dust(b.x+b.w/2, WORLD.floor, -Math.sign(b.vx)||1);
    }
    if(sk.rooted){ b.vx*=0.72; }        // postura parada (escudo)

    // rastro/efeito contínuo
    if(f.stance.t%6===0) FX.trail(b.x+b.w/2, b.y+b.h/2, sk.color||vcol(f));

    // dano por contato (rolar por cima do oponente)
    if(sk.contactDmg){
      const o=g.opponent(f);
      if(o.hp>0 && f.stanceHitCd<=0 && Physics.aabb(b,o.body)){
        f.stanceHitCd=sk.contactRate||26;
        let dmg=sk.contactDmg;
        dmg=Passives.hit(f,o,dmg,{type:'skill',attacker:f},g);
        const blocked=o.blocking && o.blockTime>7;
        if(blocked) dmg*=0.35; else { o.stun=Math.max(o.stun,14); o.hitstun=18; interrupt(o); }
        damage(o,dmg,f,{type:'skill',attacker:f,blocked});
        const dir=(o.body.x>b.x)?1:-1;
        g.knock(o, dir*KB.kick.x*0.75, KB.kick.y*0.7);
        o.launched=true; o.body.onGround=false;
        FX.spark(o.body.x+o.body.w/2, o.body.y+40, sk.color||'#fff', 14, 6);
        FX.addShake(7); FX.addHitstop(4);
      }
    }
  }

  /* parry da postura: devolve o golpe e pune quem atacou */
  function stanceParry(def,att,sk){
    Passives.parry(def,att,g);
    const c=sk.color||'#fff';
    att.stun=Math.max(att.stun, sk.parryStun||30); interrupt(att);
    const dir=(att.body.x<def.body.x)?-1:1;
    g.knock(att, dir*(sk.parryKb||11), -5);
    if(sk.parryDmg) damage(att, sk.parryDmg, def, {type:'skill',attacker:def});
    FX.spark(att.body.x+att.body.w/2, att.body.y+42, c, 20, 7);
    FX.addShake(11); FX.addHitstop(7); FX.screenFlash(4, c);
    g.floatText(def, sk.parryText||'PARRY!', c, 13);
  }

  function trySkill(f,i){
    const skill=f.char.skills && f.char.skills[i]; if(!skill) return false;
    if(f.cd[i]>0){ g.floatText(f, '...', '#888', 10); return false; }
    f.cd[i]=skill.cd;
    if(skill.super) Passives.special(f,g);
    startAction(f, buildSkillMove(f,skill,i));
    return true;
  }

  function doPre(f,pre){
    const b=f.body;
    if(pre.kind==='dash'){
      b.vx=(pre.data.back? -b.facing : b.facing)*pre.data.dist;
      if(pre.data.up) b.vy=-pre.data.up, b.onGround=false;
      if(pre.data.refund){ f.st=Math.min(f.maxSt, f.st+pre.data.refund); g.floatText(f,'+'+pre.data.refund+' fôlego','#ffe066',10); }
    }
    else if(pre.kind==='fly'){ b.vy=-12.5; b.vx=b.facing*(pre.data.dist||10); b.onGround=false; }
    else if(pre.kind==='blink'){
      const o=g.opponent(f); const clamp=x=>Math.max(WORLD.left,Math.min(WORLD.right-b.w,x));
      if(pre.data.behind){ const tx=(o.body.facing>0)? o.body.x-b.w-4 : o.body.x+o.body.w+4; b.x=clamp(tx); b.facing=(o.body.x>b.x)?1:-1; }
      else { const dir=(o.body.x>b.x)?1:-1; b.x=clamp(o.body.x - dir*(b.w+8)); b.facing=dir; }
      FX.trail(b.x+b.w/2,b.y+b.h/2,(f.weapon&&f.weapon.aura)||'#fff'); FX.ring(b.x+b.w/2,b.y+b.h/2,'#fff');
    }
    Passives.dash(f,g);
  }
  function doCast(f,cast){
    const d=cast.data;
    if(cast.kind==='projectile'){ spawnProjectile(f,d); const b=f.body; VFX.play(elem(f),'muzzle', b.facing>0?b.x+b.w:b.x, b.y+b.h*0.4, b.facing, d.color||vcol(f)); }
    else if(cast.kind==='aoe') doAoE(f,d);
    else if(cast.kind==='buff') applyBuff(f,d);
    else if(cast.kind==='heal'){ f.hp=Math.min(f.maxHp,f.hp+d.amount); f.flash=10; FX.ring(f.body.x+f.body.w/2,f.body.y+f.body.h/2,d.color||'#7dffc4'); g.floatText(f,'+'+d.amount,d.color||'#7dffc4',14); }
    else if(cast.kind==='counter'){
      f.counterWindow=d.window; f._counterDmg=d.dmg; f._counterCar=!!d.car;
      if(d.car){
        // carDraw: o sprite do personagem já mostra o carro -> só fumaça de freio
        if(d.carVfx) VFX.car(f.body.x+f.body.w/2 + f.body.facing*70, WORLD.floor, f.body.facing, d.window+18);
        else for(let i=0;i<18;i++) FX.emit(f.body.x+f.body.w/2 - f.body.facing*(20+Math.random()*80),
              WORLD.floor-Math.random()*12, -f.body.facing*(1+Math.random()*2), -Math.random()*1.3,
              {color:'#d8d8e0', life:26+Math.random()*16, size:4+Math.random()*4, g:-0.02});
        FX.addShake(7); g.floatText(f,'CORSA!','#dfe4ea',13);
      }
      else g.floatText(f,'POSTURA','#ffe066',11);
    }
  }

  // interrompe a ação atual SEM deixar hitbox "fantasma" (evita crash no loop)
  function interrupt(f){ f.action=null; f.hitbox=null; f.activeHit=null; }

  function stepAction(f){
    const a=f.action;
    if(!a){ f.hitbox=null; f.activeHit=null; return; }   // garante limpeza se a ação foi anulada externamente
    a.t++;
    const m=a.move;
    if(m.pre && !m.pre.done && a.t>=m.pre.at){ m.pre.done=true; doPre(f,m.pre); }
    if(m.cast && !m.cast.done && a.t>=m.cast.at){ m.cast.done=true; doCast(f,m.cast); }
    if(m.iframes && a.t>=m.iframes.start && a.t<=m.iframes.end) f.intangible=Math.max(f.intangible,2);
    // hitbox ativa
    f.hitbox=null; f.activeHit=null;
    if(m.hits){
      for(const h of m.hits){ if(a.t>=h.start && a.t<=h.end && !h.done){
        const b=f.body; const hx=b.facing>0? b.x+b.w : b.x-h.reach;
        f.hitbox={x:hx, y:b.y+(h.yOff!=null?h.yOff:14), w:h.reach, h:h.h}; f.activeHit=h; break; } }
    }
    if(a.t>=actionEnd(m)){ f.action=null; f.hitbox=null; f.activeHit=null; }
  }

  /* ---------------- resolução de golpe ---------------- */
  function resolveHit(att,def){
    if(!att.action || !att.hitbox || !att.activeHit || def.hp<=0) return;
    const h=att.activeHit;
    if(!Physics.hit(att.hitbox, def.body)) return;
    if(def.intangible>0){ h.done=true; g.floatText(def,'ESQUIVA','#fff'); return; }
    if(def.invuln>0){ h.done=true; return; }
    h.done=true;
    att.action.hitConnected=true;

    // POSTURA com parry (ex.: rolamento / porta do Corsa)
    if(def.stance && def.stance.def.parry){
      const sk=def.stance.def;
      // escudo frontal só protege de quem está na frente
      const naFrente = !sk.frontOnly || ((att.body.x > def.body.x) === (def.body.facing>0));
      if(naFrente){ stanceParry(def,att,sk); return; }
    }
    // contragolpe
    if(def.counterWindow>0){ doCounter(def,att); return; }

    const type = att.action.move.super?'special':'skill';
    let dmg=h.dmg;
    if(att.buffs.rage) dmg*=att.buffs.rage.mult;
    dmg=Passives.hit(att,def,dmg,{type,attacker:att,food:h.food},g);

    // PARRY
    if(def.blocking && def.blockTime<=7){
      Passives.parry(def,att,g);
      Physics.knockback(att.body, -att.body.facing*7, -2); att.stun=Math.max(att.stun,18); interrupt(att);
      FX.spark(def.body.x+def.body.w/2, def.body.y+40,'#ffffff',14,5); FX.addShake(7);
      return;
    }
    let blocked=false;
    if(def.blocking){
      if(h.guardBreak){        // QUEBRA-GUARDA: atravessa o bloqueio
        def.blocking=false; def.blockTime=0; def.stun=Math.max(def.stun,34);
        g.floatText(def,'GUARDA QUEBRADA!','#ff5252',13);
        FX.addShake(12); FX.screenFlash(5,'#ffca28');
        FX.spark(def.body.x+def.body.w/2, def.body.y+44,'#ffca28',20,7);
      } else {
        blocked=true; dmg*=0.30; def.stun=Math.max(def.stun,8); Passives.block(def,att,dmg,g);
        FX.spark(def.body.x+(att.body.facing>0?0:def.body.w), def.body.y+44,'#9fd8ff',8,3);
        // defender custa fôlego: não dá pra ficar só na guarda
        def.st-=dmg*ST_BLOCK_HIT + 4;
        if(def.st<=0){
          def.st=0; def.exhausted=EXHAUST_TIME; def.blocking=false; def.blockTime=0;
          def.stun=Math.max(def.stun,30);
          g.floatText(def,'GUARDA ROMPIDA!','#ff6b6b',13);
          FX.addShake(11); FX.spark(def.body.x+def.body.w/2, def.body.y+40,'#ff6b6b',18,6);
        }
      }
    }

    // combo
    if(!blocked){ if(def.hitstun>0) att.combo++; else att.combo=1; att.comboTimer=80;
      if(att.combo>1) comboFx[att.playerNum]={n:att.combo,t:60,x:att.body.x+att.body.w/2,y:att.body.y-30}; }
    dmg*=Math.max(0.55, Math.pow(0.9, Math.max(0,att.combo-1)));

    // ANTI-SPAM: repetir o mesmo golpe perde força (força variar o ataque)
    const mvName=(att.action.move.name)||'x';
    if(att.lastMove===mvName) att.moveRepeat++; else { att.lastMove=mvName; att.moveRepeat=0; }
    if(att.moveRepeat>0){
      dmg*=Math.max(0.40, 1-att.moveRepeat*0.20);
      if(att.moveRepeat===2) g.floatText(att,'REPETIDO!','#ff9a9a',10);
    }

    // super-armadura do defensor?
    const defArmor = def.action && def.action.move.armor;
    if(!blocked){
      if(!defArmor){ def.stun=Math.max(def.stun, h.hitstun||14); interrupt(def); }
      def.hitstun=(h.hitstun||14)+6;
    }
    if(h.status && !blocked) applyStatuses(def, h.status, att);
    if(h.lifesteal && !blocked){ const heal=dmg*h.lifesteal; att.hp=Math.min(att.maxHp, att.hp+heal); g.floatText(att,'+'+Math.round(heal),'#9cff5e',10); }

    damage(def, dmg, att, {type, attacker:att, blocked});

    applyKnockback(att, def, h, dmg, blocked, defArmor);

    const col=(att.weapon&&att.weapon.aura)||'#fff';
    const impactX=att.body.facing>0? def.body.x: def.body.x+def.body.w;
    FX.spark(impactX, def.body.y+42, col, blocked?6:14, blocked?3:7);
    FX.addShake(att.action.move.super?14: h.launch?9:5);
    FX.addHitstop(att.action.move.super?10: h.launch?6:4);
    if(att.action.move.isSkill && !blocked) VFX.play(elem(att), att.action.move.super?'super':'hit', impactX, def.body.y+44, att.body.facing, col);
  }

  /* Classe do golpe — define o "peso" do impacto */
  function moveClass(move){
    if(!move) return 'punch';
    if(move.super) return 'super';
    if(move.isSkill) return 'skill';
    if(move.name==='chute') return 'kick';
    if(move.name==='forte') return 'heavy';
    return 'punch';
  }

  /* FÍSICA DE IMPACTO: o oponente é realmente arremessado.
     - impulso escala com a classe do golpe e o dano
     - massa do alvo divide o impulso (Physics.knockback)
     - alvo no ar voa mais (menos atrito) e entra em "launched"
     - pancada forte derruba (knockdown) ao aterrissar                */
  function applyKnockback(att, def, h, dmg, blocked, defArmor){
    const cls=moveClass(att.action&&att.action.move);
    const base=KB[cls]||KB.punch;
    const dir=att.body.facing;
    const airborne=!def.body.onGround;

    if(blocked){                       // bloqueou: só desliza pra trás
      g.knock(def, dir*base.x*0.30, -0.6);
      g.knock(att, -dir*base.x*0.10, 0);   // recuo do atacante
      return;
    }
    if(defArmor){ g.knock(def, dir*base.x*0.22, 0); return; }

    // escala pelo dano do golpe (golpe mais forte = mais impulso)
    const power=0.75 + Math.min(1.0, dmg/26)*0.55;
    let fx=base.x*power*(h.kb? Math.min(1.6, h.kb/7) : 1);
    let fy=(airborne? base.air : base.y)*power;

    // lançamento explícito (uppercut/launcher)
    if(h.launch){
      fy=-(h.up||13)*Math.max(0.55, 1-def.juggle*0.10);
      fx*=0.65;
      def.juggle++;
      def.bounced = h.groundBounce? false : true;   // quica no chão = combo continua
    } else def.bounced = true;
    // juggle: cada acerto no ar dá menos altura (evita loop infinito)
    if(airborne){ fy*=Math.max(0.45, 1-def.juggle*0.14); def.juggle++; }

    def.body.onGround=false;
    g.knock(def, fx, fy);
    def.launched=true;

    // recuo do atacante (ação/reação) — segura o spam de avanço
    g.knock(att, -dir*base.x*0.13, 0);

    // poeira/rastro do arremesso
    FX.dust(def.body.x+def.body.w/2, WORLD.floor, dir);
  }

  function doCounter(def,att){
    def.counterWindow=0;
    const car=def._counterCar;
    g.floatText(def, car?'PORTADA!':'CONTRA!', car?'#dfe4ea':'#ffe066', 14);
    att.stun=Math.max(att.stun, car?40:30); interrupt(att);
    damage(att, def._counterDmg||18, def, {type:'skill',attacker:def});
    const dir=att.body.x<def.body.x?-1:1; g.knock(att, dir*(car?13:9), car?-7:-5);
    FX.spark(att.body.x+att.body.w/2, att.body.y+40, car?'#dfe4ea':'#ffe066', car?24:16, car?8:6);
    FX.addShake(car?14:10); FX.addHitstop(car?9:6);
    if(car) FX.screenFlash(5,'#dfe4ea');
  }

  function doAoE(f,d){
    const o=g.opponent(f); const cxF=f.body.x+f.body.w/2;
    const dist=Math.abs((o.body.x+o.body.w/2)-cxF);
    const col=d.color||'#fff';
    FX.ring(cxF,WORLD.floor,col); FX.spark(cxF, d.front? f.body.y+40: WORLD.floor, col, 26,7); FX.addShake(13);
    VFX.play(elem(f), (d.detonate||d.radius>175)?'super':'aoe', d.front? cxF+f.body.facing*40 : cxF, d.front? f.body.y+40 : WORLD.floor, f.body.facing, col);
    if(d.detonate){ const st=o.status.burn; if(st&&st.stacks>0){ const boom=st.stacks*6; g.deal(o,boom,f,{type:'detonate'}); st.stacks=0; st.time=0; g.floatText(o,'🔥'+Math.round(boom),'#ff7a00',16); FX.spark(o.body.x+o.body.w/2,o.body.y+30,'#ff7a00',24,7);} }
    if(d.healSelf){ f.hp=Math.min(f.maxHp,f.hp+d.healSelf); g.floatText(f,'+'+d.healSelf,'#ffd',12); }
    let inRange;
    if(d.front){ const onSide=(f.body.facing>0)? (o.body.x+o.body.w>f.body.x) : (o.body.x<f.body.x+f.body.w); inRange = onSide && dist<d.radius; }
    else inRange = dist<d.radius;
    if(inRange && o.hp>0){
      let dmg=d.dmg; dmg=Passives.hit(f,o,dmg,{type:'special',attacker:f},g); if(f.buffs.rage) dmg*=f.buffs.rage.mult;
      if(!(o.action&&o.action.move.armor)){ o.stun=Math.max(o.stun,20); interrupt(o); } o.hitstun=26;
      if(d.status) applyStatuses(o,d.status,f);
      damage(o,dmg,f,{type:'special',attacker:f});
      if(d.knockup){ o.body.vy=-d.knockup; o.body.onGround=false; o.juggle++; }
      const dir=o.body.x<f.body.x?-1:1; g.knock(o,dir*6,-2);
    }
  }

  /* ---------------- projéteis ---------------- */
  function spawnProjectile(f,d){
    const b=f.body, dir=b.facing, big=d.big;
    projectiles.push({ x:dir>0?b.x+b.w:b.x-20, y:b.y+b.h*0.4, w:big?30:20, h:big?22:14,
      vx:dir*(d.speed||10), dmg:d.dmg||14, owner:f, color:d.color||'#fff', status:d.status,
      lifesteal:d.lifesteal, life:d.boomerang?260:140, t:0, food:d.food,
      // bumerangue: vai, gira e volta — pode acertar na ida e na volta
      boomerang:!!d.boomerang, range:d.range||330, spin:!!d.boomerang, back:false,
      startX:(dir>0?b.x+b.w:b.x-20), emoji:d.emoji||null });
  }
  function updateProjectiles(){
    for(let i=projectiles.length-1;i>=0;i--){
      const p=projectiles[i]; p.x+=p.vx; p.life--; p.t++;
      if(p.t%2===0) FX.trail(p.x+p.w/2,p.y+p.h/2,p.color);
      const target=g.opponent(p.owner);

      // ---- BUMERANGUE: inverte no alcance máximo e some ao voltar ----
      if(p.boomerang){
        if(!p.back && Math.abs(p.x-p.startX)>=p.range){
          p.back=true; p.vx*=-0.92; p.hitDone=false;      // pode acertar de novo na volta
          FX.spark(p.x+p.w/2,p.y+p.h/2,p.color,10,4);
        }
        if(p.back){
          const ob=p.owner.body, cx=ob.x+ob.w/2;
          if(Math.abs((p.x+p.w/2)-cx)<26){                 // voltou pra mão do dono
            FX.spark(p.x+p.w/2,p.y+p.h/2,p.color,8,3);
            projectiles.splice(i,1); continue;
          }
        }
      }

      if(p.x<WORLD.left || p.x+p.w>WORLD.right){
        if(p.boomerang && !p.back){ p.back=true; p.vx*=-0.92; p.hitDone=false; FX.spark(p.x,p.y,p.color,10,4); }
        else { FX.spark(p.x,p.y,p.color,8,4); projectiles.splice(i,1); continue; }
      }
      if(p.life<=0){ FX.spark(p.x,p.y,p.color,8,4); projectiles.splice(i,1); continue; }
      if(target.hp>0 && !p.hitDone && Physics.hit({x:p.x,y:p.y,w:p.w,h:p.h}, target.body)){
        if(target.intangible>0){ g.floatText(target,'ESQUIVA','#fff'); if(p.boomerang){ p.hitDone=true; continue; } projectiles.splice(i,1); continue; }
        let dmg=p.dmg; dmg=Passives.hit(p.owner,target,dmg,{type:'projectile',attacker:p.owner,food:p.food},g); if(p.owner.buffs.rage) dmg*=p.owner.buffs.rage.mult;
        // postura com parry também rebate projétil
        if(target.stance && target.stance.def.parry){
          const sk=target.stance.def;
          const naFrente=!sk.frontOnly || ((p.x>target.body.x)===(target.body.facing>0));
          if(naFrente){ stanceParry(target,p.owner,sk); FX.spark(p.x,p.y,sk.color||'#fff',14,6); projectiles.splice(i,1); continue; }
        }
        const blocked=target.blocking && target.blockTime>7; const parry=target.blocking && target.blockTime<=7;
        if(parry){ Passives.parry(target,p.owner,g); FX.spark(p.x,p.y,'#fff',12,5); projectiles.splice(i,1); continue; }
        if(blocked) dmg*=0.3;
        if(!blocked){ if(!(target.action&&target.action.move.armor)){ target.stun=Math.max(target.stun,12); interrupt(target); } target.hitstun=16; }
        if(p.status && !blocked) applyStatuses(target,p.status,p.owner);
        if(p.lifesteal && !blocked) p.owner.hp=Math.min(p.owner.maxHp, p.owner.hp+dmg*p.lifesteal);
        damage(target,dmg,p.owner,{type:'projectile',attacker:p.owner,blocked});
        const dir=Math.sign(p.vx)||1; g.knock(target,dir*6*(blocked?0.4:1),-2);
        FX.spark(p.x,p.y,p.color,16,6); FX.addShake(6); FX.addHitstop(3);
        if(p.boomerang) p.hitDone=true;      // continua voando; rearma ao virar
        else projectiles.splice(i,1);
      }
    }
  }

  /* ---------------- input ---------------- */
  /* stamina: tem fôlego? / gasta fôlego
     Golpe normal sai com QUALQUER fôlego restante — mas se estourar, você
     gasta tudo e fica EXAUSTO. É isso que pune o spam.                    */
  function hasSt(f,key){
    if(f.exhausted>0) return false;
    if(key==='skill'||key==='super') return f.st >= (ST_COST[key]||0)*0.5;
    return f.st>0;
  }
  function useSt(f,key){
    f.st-=(ST_COST[key]||0);
    if(f.st<=0){
      f.st=0; f.exhausted=EXHAUST_TIME;
      g.floatText(f,'SEM FÔLEGO!','#ff6b6b',13);
      FX.spark(f.body.x+f.body.w/2, f.body.y+34, '#ff6b6b', 12, 4);
    }
  }
  function noSt(f){
    if(frame%14===0) g.floatText(f,'cansado','#ff9a9a',9);
  }

  function handleInput(f){
    const cc=f.ctrl, b=f.body;
    if(f.hp<=0 || f.frozen){ f.blocking=false; f.fastFall=false; f.jumpPrev=cc.held('jump'); return; }
    if(f.knockdown>0){ f.blocking=false; f.fastFall=false; f.jumpPrev=cc.held('jump'); return; }
    if(f.stun>0){ f.blocking=false; f.fastFall=false; f.jumpPrev=cc.held('jump'); return; }

    const haste=f.buffs.haste?f.buffs.haste.mult:1;
    const slow=(f.status.slow&&f.status.slow.time>0)?f.status.slow.mult:1;
    const mob=haste*slow*(f.exhausted>0?0.55:1);   // exausto anda arrastado

    // DASH: no chão = avanço/recuo rápido; no ar = AIR-DASH (1x, com i-frames)
    const dd=cc.dash();
    if(dd!==0 && !f.action && f.dashCd<=0){
      if(b.onGround){
        if(hasSt(f,'dash')){ useSt(f,'dash'); b.vx=dd*(f.spd*2.8); b.facing=dd; f.dashCd=26; FX.dust(b.x+b.w/2,WORLD.floor,dd); Passives.dash(f,g); }
        else noSt(f);
      }
      else if(f.airDash && hasSt(f,'airdash')){ useSt(f,'airdash'); f.airDash=false; b.vx=dd*(f.spd*3.0); b.vy=Math.min(b.vy,1.5); f.intangible=Math.max(f.intangible,7); f.dashCd=24; FX.trail(b.x+b.w/2,b.y+b.h/2,vcol(f)); Passives.dash(f,g); }
    }

    // BLOQUEIO (chão)
    f.blocking = !f.action && cc.held('block') && b.onGround;
    f.blockTime = f.blocking? f.blockTime+1 : 0;
    // FAST-FALL (segurar baixo no ar, caindo)
    f.fastFall = (!b.onGround && cc.held('block') && b.vy>-1);

    if(!f.action && !f.blocking){
      // movimento: chão responsivo; ar com controle reduzido (preserva momentum/knockback)
      const accel = (b.onGround? f.spd*0.58 : f.spd*0.20)*mob;
      const maxRun = f.spd*1.65*mob;
      if(cc.held('left')){ b.vx-=accel; b.facing=-1; }
      if(cc.held('right')){ b.vx+=accel; b.facing=1; }
      if(b.onGround){ if(b.vx>maxRun)b.vx=maxRun; if(b.vx<-maxRun)b.vx=-maxRun; }

      // PULO variável + PULO DUPLO
      const jHeld=cc.held('jump'), jPress=jHeld && !f.jumpPrev;
      if(jPress && hasSt(f,'jump')){
        if(b.onGround){ useSt(f,'jump'); b.vy=-f.jmp; b.onGround=false; FX.dust(b.x+b.w/2,WORLD.floor,0); }
        else if(f.airJumps>0){ useSt(f,'jump'); f.airJumps--; b.vy=-f.jmp*0.9; FX.ring(b.x+b.w/2,b.y+b.h-6,vcol(f)); FX.dust(b.x+b.w/2,b.y+b.h,0); }
      }
      if(!jHeld && b.vy<-3) b.vy*=0.55;   // jump cut -> altura variável
    }
    f.jumpPrev=cc.held('jump');

    // golpes (normais cancelam em skills no acerto)
    const pressedSkill=[1,2,3,4].find(n=>cc.skill(n));

    // ---- POSTURA: o mesmo botão liga e desliga ----
    if(pressedSkill){
      const idx=pressedSkill-1, def=f.char.skills&&f.char.skills[idx];
      if(def && def.type==='stance'){
        if(f.stance && f.stance.idx===idx){ endStance(f,'manual'); return; }
        if(!f.stance && f.cd[idx]<=0 && f.exhausted<=0 && f.st>(def.minSt||18)){ startStance(f,idx,def); return; }
        if(f.cd[idx]>0) g.floatText(f,'...','#888',10); else noSt(f);
        return;
      }
    }
    // enquanto uma postura estiver ativa, não sai outro golpe
    if(f.stance) return;

    const canStart = !f.action || f.action.hitConnected;
    if(canStart && !f.blocking){
      if(pressedSkill){
        const isSuper=(f.char.skills&&f.char.skills[pressedSkill-1]&&f.char.skills[pressedSkill-1].super);
        const key=isSuper?'super':'skill';
        if(hasSt(f,key)){ if(trySkill(f,pressedSkill-1)) useSt(f,key); } else noSt(f);
      }
      else if(cc.pressed('punch')){ if(hasSt(f,'punch')){ useSt(f,'punch'); tryNormal(f,'punch'); } else noSt(f); }
      else if(cc.pressed('kick')){  if(hasSt(f,'kick')){  useSt(f,'kick');  tryNormal(f,'kick'); }  else noSt(f); }
      else if(cc.pressed('heavy')){ if(hasSt(f,'heavy')){ useSt(f,'heavy'); tryNormal(f,'heavy'); } else noSt(f); }
    }
  }

  /* ---- TRANSFORMAÇÃO POR VIDA (Mecas) ----
     Troca a forma quando a vida cruza os limites definidos no personagem.
     Só sobe de forma (não volta ao curar) para não ficar piscando entre
     duas formas quando a vida oscila em cima do limite.                */
  function atualizaForma(f){
    const c=f.char;
    if(!c.forms || !c.formThresholds) return;
    const frac = f.maxHp? f.hp/f.maxHp : 1;
    let alvo=0;
    for(let i=0;i<c.formThresholds.length;i++) if(frac<=c.formThresholds[i]) alvo=i+1;
    if(alvo<=f.form) return;                  // nunca regride
    f.form=alvo;

    // aplica os ganhos da nova forma
    const b=(c.formBuffs && c.formBuffs[alvo]) || {atk:1,spd:1,def:0};
    f.formBuff=b;
    f.spd = f._baseSpdOrig * (b.spd||1);
    f.def = f._baseDefOrig + (b.def||0);

    // efeito de transformação
    const cx=f.body.x+f.body.w/2, cy=f.body.y+f.body.h/2, cor=(alvo>=2)?'#5ad6ff':'#9fb3c8';
    f.invuln=Math.max(f.invuln, 34);          // respiro para não morrer no meio da troca
    f.flash=14;
    FX.screenFlash(alvo>=2?10:6, cor);
    FX.addShake(alvo>=2?16:10);
    FX.addHitstop(alvo>=2?10:6);
    FX.ring(cx,cy,cor); FX.spark(cx,cy,cor, alvo>=2?34:22, 8);
    try{ VFX.play('lightning', alvo>=2?'super':'charge', cx, cy, f.body.facing, cor); }catch(e){}
    g.floatText(f, (c.formNames&&c.formNames[alvo])||'TRANSFORMOU!', cor, alvo>=2?16:13);
  }

  function stepFighter(f){
    atualizaForma(f);
    tickStatus(f); tickBuffs(f); Passives.tick(f,g);
    for(let i=0;i<4;i++) if(f.cd[i]>0) f.cd[i]--;
    if(f.stun>0)f.stun--; if(f.hitstun>0)f.hitstun--; if(f.flash>0)f.flash--;
    if(f.invuln>0)f.invuln--; if(f.intangible>0)f.intangible--; if(f.dashCd>0)f.dashCd--;
    if(f.counterWindow>0)f.counterWindow--;
    if(f.comboTimer>0){ f.comboTimer--; if(f.comboTimer<=0){ f.combo=0; f.moveRepeat=0; f.lastMove=null; } }

    // ---- QUEDA (knockdown): fica no chão e levanta invencível ----
    if(f.knockdown>0){
      f.knockdown--;
      if(f.knockdown===0){ f.invuln=Math.max(f.invuln,WAKE_INVULN); g.floatText(f,'LEVANTOU','#9fd8ff',10); }
    }

    // ---- STAMINA / FÔLEGO ----
    if(f.exhausted>0){
      f.exhausted--;
      if(f.exhausted===0){ f.st=Math.max(f.st, f.maxSt*0.35); g.floatText(f,'RECUPERADO','#8fd6ff',10); }
    } else if(f.hp>0 && !f.stance){    // postura ativa não regenera (ela consome)
      // só recupera fôlego depois de um tempo SEM atacar (força pausas)
      if(f.action) f.stIdle=0; else f.stIdle=(f.stIdle||0)+1;
      let rg;
      if(f.action) rg=ST_REGEN.acting;
      else if(f.blocking) rg=ST_REGEN.block;
      else if(!f.body.onGround) rg=ST_REGEN.air;
      else if(Math.abs(f.body.vx)>0.5) rg=ST_REGEN.walk;
      else rg=ST_REGEN.idle;
      if(f.stIdle<ST_IDLE_DELAY) rg*=0.15;
      f.st=Math.min(f.maxSt, f.st+rg);
    }

    handleInput(f);
    stepStance(f);
    stepAction(f);
    Physics.step(f.body, WORLD, {fastFall:f.fastFall});
    const b=f.body;
    if(b.onGround){ f.juggle=0; f.airJumps=f.maxAirJumps; f.airDash=true; }

    // ---- ATERRISSAGEM: pancada forte derruba ----
    if(b.justLanded){
      FX.dust(b.x+b.w/2,WORLD.floor,0);
      if(f.launched){
        const impacto=Math.max(Math.abs(b.prevVy), Math.abs(b.vx));
        // QUIQUE: golpe marcado faz o alvo quicar uma vez (estende combo)
        if(!f.bounced && Math.abs(b.prevVy)>6){
          f.bounced=true; b.vy=-Math.abs(b.prevVy)*0.52; b.onGround=false;
          f.hitstun=Math.max(f.hitstun,26); f.stun=Math.max(f.stun,20);
          FX.dust(b.x+b.w/2, WORLD.floor, Math.sign(b.vx)||1);
          FX.spark(b.x+b.w/2, WORLD.floor-4, '#ffe066', 12, 5); FX.addShake(7);
          g.floatText(f,'QUIQUE!','#ffe066',11);
        }
        else if(impacto>KD_SPEED && f.knockdown<=0){
          f.knockdown=KD_TIME; f.stun=Math.max(f.stun,KD_TIME); interrupt(f);
          b.vx*=0.18;
          FX.spark(b.x+b.w/2, WORLD.floor-6, '#ffd28a', 20, 6);
          FX.dust(b.x+b.w/2, WORLD.floor, Math.sign(b.vx)||1);
          FX.addShake(10); FX.addHitstop(4);
          g.floatText(f,'QUEDA!','#ff9a3b',13);
        }
        f.launched=false;
      }
    }
    // REBOTE NA PAREDE: bater forte na parede em hitstun estende o combo
    if(b.wallHit!==0 && f.hitstun>0 && b.wallImpact>8.5){
      b.vx = -b.wallHit*Math.min(11, b.wallImpact*0.55); b.vy=Math.min(b.vy,-5);
      f.hitstun+=10; f.stun=Math.max(f.stun,12); f.juggle=Math.max(0,f.juggle-1);
      FX.spark(b.wallHit>0? WORLD.right-4: WORLD.left+4, b.y+b.h*0.4, '#fff', 18,7); FX.addShake(10);
      g.floatText(f,'PAREDE!','#ffe066',12);
    }
    f.wasGround=b.onGround;
    if(f.intangible>0 && frame%3===0) FX.trail(b.x+b.w/2,b.y+b.h/2,vcol(f));
  }

  function faceOpponent(f,o){
    if(!f.action && Math.abs(f.body.vx)<0.4 && f.body.onGround)
      f.body.facing = f.body.x<o.body.x?1:-1;
  }

  // CLASH: quando os dois golpes ativos se chocam, ambos recuam (momento épico)
  function clash(){
    if(f1.action&&f2.action&&f1.hitbox&&f2.hitbox&&f1.activeHit&&f2.activeHit && Physics.aabb(f1.hitbox,f2.hitbox)){
      f1.activeHit.done=true; f2.activeHit.done=true;
      const dir=f1.body.x<f2.body.x?-1:1;
      Physics.knockback(f1.body, dir*7,-3.5); Physics.knockback(f2.body,-dir*7,-3.5);
      f1.stun=Math.max(f1.stun,10); f2.stun=Math.max(f2.stun,10);
      interrupt(f1); interrupt(f2);
      const mx=(f1.body.x+f2.body.x)/2 + 26, my=Math.min(f1.body.y,f2.body.y)+50;
      FX.screenFlash(6,'#fff'); FX.addShake(13); FX.addHitstop(11);
      FX.spark(mx,my,'#ffffff',28,9); FX.ring(mx,my,'#ffe066'); FX.floatText(mx,my-22,'CLASH!','#ffe066',18);
      return true;
    }
    return false;
  }

  /* ---------------- loop ---------------- */
  function update(){
    frame++;

    /* ---- ONLINE: o GUEST não simula, só manda input e desenha o que o host mandou ---- */
    if(mode==='online' && netRole==='guest'){
      /* ---- 1) INPUT: acumula sempre; manda NA HORA se apertou algo ---- */
      const acc = remoteCtrl.state;
      const antesFila = acc.fila.length, antesHeld = JSON.stringify(acc.held);
      amostraInput(f2.ctrl, acc);
      const apertouAlgo = acc.fila.length>antesFila || JSON.stringify(acc.held)!==antesHeld || acc.dash;
      netSendT++;
      if(netChan && (apertouAlgo || netSendT >= INPUT_HEARTBEAT)){
        netSendT=0;
        // n = número de série: o RTDB não avisa se o valor for idêntico ao anterior
        try{ netChan.sendInput({n:++netSeq, held:Object.assign({},acc.held), fila:acc.fila.slice(), dash:acc.dash}); }catch(e){}
        acc.fila.length=0; acc.dash=0;    // já foi; não repete
      }

      /* ---- 2) PREDIÇÃO: simulo o MEU lutador na hora (sem esperar o servidor).
             Se o host diz que estou apanhando, quem manda é ele.        ---- */
      const souControlado = (f2.stun>0 || f2.hitstun>0 || f2.knockdown>0);
      if(!souControlado){
        stepFighter(f2);
        f2.hitbox=null; f2.activeHit=null;   // dano quem resolve é o host
      }

      /* ---- 3) suaviza rumo ao estado do host ---- */
      if(f1 && f1._netTarget){ const b=f1.body, a=f1._netTarget;
        b.x += (a.x-b.x)*0.30; b.y += (a.y-b.y)*0.30; }
      if(f2 && f2._netTarget){ const b=f2.body, a=f2._netTarget;
        const d=Math.abs(a.x-b.x);
        const k = souControlado? 0.35 : (d>90? 0.16 : 0.05);  // correção suave quando eu mando
        b.x += (a.x-b.x)*k; b.y += (a.y-b.y)*k*0.6;
      }

      Input.endFrame(); FX.update();
      [1,2].forEach(p=>{ if(comboFx[p].t>0) comboFx[p].t--; });
      return;
    }

    if(FX.hitstop>0){ FX.consumeHitstop(); FX.update(); return; }
    if(mode==='cpu' && f2.hp>0 && f1.hp>0) AI.think(f2, f1, diff);
    stepFighter(f1); stepFighter(f2);
    Physics.separate(f1.body,f2.body);
    if(!clash()){ resolveHit(f1,f2); resolveHit(f2,f1); }
    updateProjectiles();
    faceOpponent(f1,f2); faceOpponent(f2,f1);
    FX.update();
    [1,2].forEach(p=>{ if(comboFx[p].t>0) comboFx[p].t--; });
    // relógio conta em FRAMES DE JOGO: o ritmo lento não encurta a rodada
    roundFrames++; if(roundFrames>=60){ roundFrames=0; roundTime=Math.max(0,roundTime-1); }
    /* ---- ONLINE: o HOST manda o estado autoritativo ---- */
    if(mode==='online' && netRole==='host' && netChan){
      netSendT++;
      if(netSendT >= SNAP_FRAMES){ netSendT=0; try{ netChan.sendSnapshot(montaSnapshot()); }catch(e){} }
    }

    Input.endFrame();
    if(endLock>0){ endLock--; return; }
    if(!koPending){
      if(f1.hp<=0||f2.hp<=0){ koPending=true; koTimer=72; timeScale=BASE_SPEED*0.4; FX.addHitstop(8); FX.screenFlash(8,'#fff'); FX.addShake(14); }
      else if(roundTime<=0){ endRound(); }
    } else { koTimer--; if(koTimer<=0){ timeScale=BASE_SPEED; koPending=false; endRound(); } }
  }

  function loop(){
    // try/catch garante que um erro em UM frame nunca mate o loop (jogo nunca "trava de vez")
    try{
      if(running && !paused){ acc+=timeScale; let steps=0; while(acc>=1 && steps<4){ acc-=1; update(); steps++; } }
      else FX.update();
      render(); updateHud();
    }catch(err){
      console.error('[Arena] erro no frame (ignorado, jogo continua):', err);
      acc=0;
    }
    rafId=requestAnimationFrame(loop);
  }

  /* ---------------- rodadas ---------------- */
  function start(c1,c2,opts){
    opts=opts||{}; mode=opts.mode||'cpu'; diff=opts.diff||'normal';
    Input.setMode(mode==='2p'?'2p':'1p');
    paused=false;

    // ---- configura a rede ----
    netRole = (mode==='online') ? (opts.role||'host') : null;
    netChan = (mode==='online') ? (opts.chan||null) : null;
    netOnEnd = opts.onEnd || null;
    netSendT=0; lastSnap=null;
    if(netChan){
      if(netRole==='host'){
        netChan.onInput(p=>{                       // input do guest chega aqui
          if(!remoteCtrl||!p) return;
          if(p.n!=null){ if(p.n===netUltimoN) return; netUltimoN=p.n; }  // ignora repetido
          const s=remoteCtrl.state;
          if(p.held) s.held=p.held;
          if(p.fila && p.fila.length) s.fila.push.apply(s.fila, p.fila);
          if(p.dash) s.dash=p.dash;
        });
      } else {
        netChan.onSnapshot(s=>aplicaSnapshot(s));   // estado do host
      }
      netChan.onOpponentLeft(()=>{
        toast('O adversário saiu da partida');
        if(netOnEnd) try{ netOnEnd({desistencia:true, venceu: 1}); }catch(e){}
        stop();
      });
    }
    _c1=c1; _c2=c2; rounds={1:0,2:0}; roundNum=1; matchOver=false;
    document.getElementById('end-banner').classList.add('hidden');
    buildRound(); running=true;
    if(rafId) cancelAnimationFrame(rafId); loop();
  }
  function buildRound(){
    FX.reset(); projectiles=[]; timeScale=BASE_SPEED; acc=0; koPending=false; koTimer=0;
    let ctrl1, ctrl2;
    if(mode==='online'){
      // convenção: f1 = lutador do HOST, f2 = lutador do GUEST (nos dois lados)
      remoteCtrl = makeRemoteCtrl();
      if(netRole==='host'){ ctrl1=Input.ctrl(1); ctrl2=remoteCtrl; }
      else { ctrl1=makeRemoteCtrl(); ctrl2=Input.ctrl(1); }   // guest controla o f2
    } else {
      ctrl1=Input.ctrl(1);
      ctrl2 = mode==='cpu'? AI.ctrl() : Input.ctrl(2);
    }
    f1=makeFighter(_c1, 230, 1, 1, ctrl1);
    f2=makeFighter(_c2, W-230-52, -1, 2, ctrl2);
    roundTime=99; lastSec=performance.now(); roundFrames=0; endLock=26;
    buildSkillHud(); setupHud(); updatePips();
    document.getElementById('end-banner').classList.add('hidden');
    toast('ROUND '+roundNum);
  }
  function nextRound(){ roundNum++; buildRound(); running=true; }

  function endRound(){
    if(!running) return; running=false;
    let winner=0;
    if(f1.hp<=0&&f2.hp<=0) winner=0;
    else if(f1.hp<=0) winner=2; else if(f2.hp<=0) winner=1;
    else winner=f1.hp>f2.hp?1: f1.hp<f2.hp?2:0;
    if(winner) rounds[winner]++;
    updatePips();
    if(rounds[1]>=2||rounds[2]>=2){
      matchOver=true; showEnd(winner,true);
      // ranqueada é SÓ online — partida contra IA/2P local nunca mexe em rating
      if(mode==='online'){
        const score = winner===1?1 : winner===2?0 : 0.5;
        // no online: o placar é do ponto de vista de QUEM está jogando
        const meuScore = (netRole==='host')? score : (1-score);
        if(netOnEnd) try{ netOnEnd({venceu:meuScore, rounds:rounds[1]+'x'+rounds[2]}); }catch(e){}
      }
    }
    else { showEnd(winner,false); setTimeout(()=>{ if(!matchOver) nextRound(); }, 1900); }
  }
  function showEnd(winner, over){
    const banner=document.getElementById('end-banner');
    if(over){
      document.getElementById('end-text').textContent = winner? nameOf(winner).toUpperCase()+' VENCEU!':'EMPATE!';
      document.getElementById('end-sub').textContent='Placar  '+rounds[1]+' x '+rounds[2];
      banner.classList.remove('hidden');
    } else toast('ROUND '+roundNum+' — '+(winner? nameOf(winner)+' venceu!':'empate'));
  }
  function nameOf(p){ return p===1? f1.char.name : f2.char.name; }
  function stop(){ running=false; matchOver=true; paused=false; if(rafId){ cancelAnimationFrame(rafId); rafId=null; } }
  function pause(){ if(running) paused=true; }
  function resume(){ paused=false; }
  function isPaused(){ return paused; }
  function canPause(){ return running; }

  /* ---------------- HUD ---------------- */
  function buildSkillHud(){
    [['1',f1],['2',f2]].forEach(([n,f])=>{
      const wrap=document.getElementById('skills-'+n); if(!wrap) return; wrap.innerHTML='';
      (f.char.skills||[]).forEach((sk,i)=>{
        const c=document.createElement('div'); c.className='skill-chip'+(sk.super?' super':'');
        c.innerHTML=`<div class="sk-cd" id="cd-${n}-${i}"></div><div class="sk-key">${sk.key}</div><div class="sk-ic">${sk.icon||'★'}</div><div class="sk-cdn" id="cdn-${n}-${i}"></div>`;
        c.title=sk.name+' — '+sk.desc; wrap.appendChild(c);
      });
    });
  }
  function setupHud(){
    [['1',f1],['2',f2]].forEach(([n,f])=>{
      document.getElementById('hud-name-'+n).textContent=f.char.name;
      document.getElementById('hud-name-'+n).style.color=(f.char.palette&&f.char.palette.primary)||'#fff';
      const pc=document.getElementById('portrait-'+n);
      if(pc&&pc.getContext){ pc.width=42; pc.height=42; Sprites.renderTo(pc, f.char, 'idle', 1.0, 0); }
    });
  }
  function updatePips(){
    [1,2].forEach(p=>{ const wrap=document.getElementById('pips-'+p); if(!wrap) return; wrap.innerHTML='';
      for(let i=0;i<2;i++){ const d=document.createElement('div'); d.className='pip'+(i<rounds[p]?' win':''); wrap.appendChild(d);} });
  }
  function statusText(f){
    const s=f.status, t=[];
    if(s.burn) t.push('🔥'+s.burn.stacks); if(s.poison) t.push('☠'); if(s.freeze) t.push('❄');
    if(s.chill) t.push('🧊'+s.chill.stacks); if(s.slow) t.push('🐌'); if(s.bleed) t.push('🩸');
    if(f.buffs.rage) t.push('💢'); if(f.buffs.iron) t.push('🪨'); if(f.buffs.shield) t.push('🛡'); if(f.buffs.haste) t.push('⏩');
    if(f.invuln>0) t.push('✦');
    if(f.stance) t.push((f.stance.def.icon||'🌀')+' '+(f.stance.def.onText||'ATIVO'));
    if(f.exhausted>0) t.push('😮‍💨 EXAUSTO');
    if(f.knockdown>0) t.push('⬇ CAÍDO');
    return t.join(' ');
  }
  function updateHud(){
    if(!f1||!f2) return;
    [['1',f1],['2',f2]].forEach(([n,f])=>{
      const hp=Math.max(0,f.hp/f.maxHp*100);
      const bar=document.getElementById('hp-'+n); bar.style.width=hp+'%'; bar.classList.toggle('low',hp<30);
      const ghost=document.getElementById('hp-ghost-'+n); if(ghost) ghost.style.width=hp+'%';
      const stBar=document.getElementById('st-'+n);
      if(stBar){
        const sp=Math.max(0,f.st/f.maxSt*100);
        stBar.style.width=sp+'%';
        stBar.classList.toggle('low', sp<35 && f.exhausted<=0);
        stBar.classList.toggle('out', f.exhausted>0);
      }
      const stx=document.getElementById('status-'+n); if(stx) stx.textContent=statusText(f);
      (f.char.skills||[]).forEach((sk,i)=>{
        const cdEl=document.getElementById('cd-'+n+'-'+i), cdn=document.getElementById('cdn-'+n+'-'+i);
        if(cdEl){ const r=f.cd[i]/sk.cd; cdEl.style.height=(Math.max(0,r)*100)+'%'; }
        if(cdn){ cdn.textContent = f.cd[i]>0? Math.ceil(f.cd[i]/60) : ''; }
        const chip=cdEl&&cdEl.parentElement;
        if(chip) chip.classList.toggle('active', !!(f.stance && f.stance.idx===i));
      });
    });
    document.getElementById('timer').textContent=roundTime;
    if(mode==='online' && netChan){
      const el=document.getElementById('net-badge');
      if(el){ const p2p=netChan.modo==='p2p';
        el.textContent = p2p? '🟢 P2P direto' : '🟡 via servidor';
        el.style.color = p2p? '#3bff9c' : '#ffe066';
      }
    }
  }
  let toastTimer=null;
  function toast(msg){
    let el=document.getElementById('toast');
    if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
    el.textContent=msg; el.style.display='block';
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>{ el.style.display='none'; },1300);
  }

  /* ---------------- render ---------------- */
  function poseOf(f){
    // no guest, a pose vem pronta do host
    if(mode==='online' && netRole==='guest' && f._netPose) return f._netPose;
    if(f.hp<=0) return 'ko';
    if(f.knockdown>0) return 'ko';      // caído no chão
    if(f.stance) return f.stance.def.anim||'block';   // postura ativa
    if(f.frozen) return 'block';
    if(f.action){
      const an=f.action.move.anim;
      // se o personagem tem essa animação própria (ex.: 'roll', 'slide'), usa direto
      if(f.char.anims && f.char.anims[an]) return an;
      const POSEMAP={ cast:'special', special:'special', aim:'aim', thrust:'thrust', punch:'punch', kick:'kick', swing:'swing',
        sword:'swing', axe:'swing', hammer:'swing', scythe:'swing', spear:'thrust', daggers:'thrust', staff:'thrust', holystaff:'thrust', bow:'aim' };
      return POSEMAP[an]||'special';
    }
    if(f.stun>3 && f.hitstun>0) return 'hurt';
    if(f.blocking) return 'block';
    if(!f.body.onGround) return f.body.vy<0?'jump':'fall';
    if(Math.abs(f.body.vx)>0.5) return 'walk';
    return 'idle';
  }
  function atkPhase(f){ if(!f.action) return 1; const m=f.action.move; return Math.min(1, f.action.t/((m.startup||6)+6)); }

  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#2a1248'); sky.addColorStop(.5,'#3a1a52'); sky.addColorStop(1,'#160a26');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffe9a8'; ctx.beginPath(); ctx.arc(W*0.8,90,46,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(42,18,72,.6)'; ctx.beginPath(); ctx.arc(W*0.82,80,40,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff';
    for(let i=0;i<40;i++){ const x=(i*97%W), y=(i*53%200); ctx.globalAlpha=((i+((frame/30)|0))%5===0)?.5:.9; ctx.fillRect(x,y,2,2); }
    ctx.globalAlpha=1;
    ctx.fillStyle='#1d0f33';
    for(let x=0;x<W;x+=46){ const hh=60+((x*7)%70); ctx.fillRect(x, WORLD.floor-hh-90, 38, hh+90); }
    ctx.fillStyle='#241445';
    for(let x=40;x<W;x+=180){ ctx.fillRect(x, WORLD.floor-200, 24, 200); ctx.fillStyle='#ff3bd0'; ctx.fillRect(x, WORLD.floor-200, 24, 6); ctx.fillStyle='#241445'; }
    ctx.fillStyle='#2a1a40'; ctx.fillRect(0,WORLD.floor,W,H-WORLD.floor);
    ctx.fillStyle='#3a2458'; ctx.fillRect(0,WORLD.floor,W,5);
    ctx.fillStyle='#ff3bd0'; ctx.fillRect(0,WORLD.floor,W,2);
    ctx.strokeStyle='rgba(120,80,180,.25)'; ctx.lineWidth=1;
    for(let i=0;i<14;i++){ ctx.beginPath(); ctx.moveTo(W/2+(i-7)*60, WORLD.floor); ctx.lineTo(W/2+(i-7)*((H-WORLD.floor)*2), H); ctx.stroke(); }
    for(let y=WORLD.floor; y<H; y+=10){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }
  function drawProjectiles(){
    projectiles.forEach(p=>{
      ctx.save(); ctx.shadowColor=p.color; ctx.shadowBlur=12;
      if(p.spin){                       // bumerangue girando (croissant)
        ctx.translate(p.x+p.w/2, p.y+p.h/2);
        ctx.rotate(p.t*0.42*(p.back?-1:1));
        if(p.emoji){
          ctx.font=Math.round(p.h*2.0)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(p.emoji,0,0);
        } else {
          ctx.fillStyle=p.color;
          ctx.beginPath(); ctx.arc(0,0,p.h*0.8, 0.5, Math.PI*1.5); ctx.arc(0,0,p.h*0.42, Math.PI*1.5, 0.5, true); ctx.closePath(); ctx.fill();
        }
      } else {
        ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#fff'; ctx.fillRect(p.x+p.w*0.3,p.y+p.h*0.3,p.w*0.4,p.h*0.4);
      }
      ctx.restore();
    });
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  }
  function drawFighter(f){
    Sprites.shadow(ctx, f.body.x+f.body.w/2, WORLD.floor+6, f.body.w*0.55*(f.body.onGround?1:0.6), f.body.onGround?0.35:0.18);
    Sprites.drawChar(ctx, f.char, {
      x:f.body.x+f.body.w/2, y:f.body.y+f.body.h, facing:f.body.facing, scale:SCALE,
      targetH:f.body.h*1.16, animT:(f.action? f.action.t : 0), form:f.form||0,
      pose:poseOf(f), t:frame, atk:atkPhase(f),
      flash:(f.flash>0 && frame%2===0),
      charge:(!!f.buffs.rage || (f.action && (f.action.move.super||f.action.move.anim==='special'))),
      koGlow:(f.invuln>0 && frame%4<2)
    });
    if(f.blocking){ ctx.strokeStyle='#9fd8ff'; ctx.lineWidth=3; const sx=f.body.facing>0?f.body.x+f.body.w+6:f.body.x-6;
      ctx.beginPath(); ctx.moveTo(sx,f.body.y+14); ctx.lineTo(sx,f.body.y+f.body.h-14); ctx.stroke(); }
    if(f.buffs.shield){ ctx.strokeStyle='rgba(150,220,255,.7)'; ctx.lineWidth=2; ctx.strokeRect(f.body.x-4,f.body.y-4,f.body.w+8,f.body.h+8); }
  }
  function drawCombos(){
    [1,2].forEach(p=>{ const c=comboFx[p]; if(c.t<=0||c.n<2) return;
      ctx.save(); ctx.globalAlpha=Math.min(1,c.t/20); ctx.textAlign='center';
      ctx.font="bold 26px 'Press Start 2P', monospace"; ctx.lineWidth=5; ctx.strokeStyle='#000';
      ctx.strokeText(c.n+' HITS', c.x, c.y-(60-c.t)); ctx.fillStyle=p===1?'#3b9bff':'#ff5e5e';
      ctx.fillText(c.n+' HITS', c.x, c.y-(60-c.t)); ctx.restore(); });
    ctx.textAlign='left'; ctx.globalAlpha=1;
  }
  function render(){
    const off=FX.shakeOffset();
    ctx.save(); ctx.translate(Math.round(off.x),Math.round(off.y));
    drawBackground();
    if(f1&&f2){ drawProjectiles();
      const order=f1.body.y<=f2.body.y?[f1,f2]:[f2,f1];
      drawFighter(order[0]); drawFighter(order[1]); drawCombos();
    }
    FX.render(ctx);
    ctx.restore();
  }

  return { start, stop, pause, resume, isPaused, canPause };
})();
