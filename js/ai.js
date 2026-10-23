/* ============================================================
   IA LOCAL — oponente estratégico (usa soco/chute/forte + skills).
   Ajustada para ser mais JUSTA (menos "dura"): deixa aberturas,
   não spamma skills e respeita o ritmo lento/estratégico.
   ============================================================ */
const AI = (function(){

  const PRESET = {
    easy:  { reaction:34, aggression:.26, block:.10, dash:.00, skill:.22, jump:.06, retreat:.34, range:104, skillGate:140 },
    normal:{ reaction:20, aggression:.46, block:.32, dash:.12, skill:.48, jump:.12, retreat:.26, range:110, skillGate:90 },
    hard:  { reaction:11, aggression:.70, block:.60, dash:.34, skill:.78, jump:.16, retreat:.18, range:116, skillGate:50 }
  };

  function ctrl(){
    const s={ left:false,right:false,jump:false,block:false, _dash:0, _skill:0, _atk:null };
    return { type:'cpu', state:s,
      held(a){ return !!s[a]; },
      pressed(a){ if(s._atk===a){ s._atk=null; return true; } return false; },
      dash(){ const d=s._dash; s._dash=0; return d; },
      skill(n){ if(s._skill===n){ s._skill=0; return true; } return false; } };
  }
  function clear(s){ s.left=s.right=s.jump=s.block=false; }

  function think(f, opp, diffName){
    const P=PRESET[diffName]||PRESET.normal;
    const s=f.ctrl.state;
    f.ai=f.ai||{timer:0, skillGate:0};
    if(f.ai.skillGate>0) f.ai.skillGate--;
    const b=f.body, ob=opp.body;
    const dx=(ob.x+ob.w/2)-(b.x+b.w/2), dist=Math.abs(dx), dir=dx>0?1:-1;

    if(f.frozen||f.stun>0||f.knockdown>0){ clear(s); return; }
    f.ai.timer--; const decide=f.ai.timer<=0; if(decide) f.ai.timer=P.reaction+((Math.random()*P.reaction)|0);
    clear(s);

    const stFrac = f.maxSt? f.st/f.maxSt : 1;

    // ---- POSTURA ATIVA: manter ou desligar? ----
    if(f.stance){
      const sk=f.stance.def;
      const desligar = stFrac<0.34                          // fôlego acabando
        || (sk.rooted && dist>P.range+130)                  // escudo parado sem alvo perto
        || (sk.rollSpeed && f.stance.t>200);                // rolou tempo demais
      if(desligar){ s._skill=(f.char.skills[f.stance.idx]||{}).key; return; }
      if(sk.rollSpeed){ if(dir>0) s.right=true; else s.left=true; }  // rola até o alvo
      return;
    }

    // ---- GESTÃO DE FÔLEGO: exausto ou sem stamina -> recua e recupera ----
    if(f.exhausted>0 || stFrac<0.22){
      if(dist<P.range+50){ if(dir>0) s.left=true; else s.right=true; }   // afasta pra respirar
      else if(opp.action && dist<P.range+40) s.block=true;
      return;                                                            // não ataca sem fôlego
    }

    // oponente exausto/caído -> hora de punir
    const punir = (opp.exhausted>0 || opp.knockdown>0);

    // bloqueio reativo (deixa aberturas: nem sempre bloqueia)
    const oppThreat=(opp.action||opp.hitstun>0) && dist<P.range+38;
    if(oppThreat && !punir && Math.random()<P.block){ s.block=true; return; }

    // recuar com pouca vida
    if(f.hp<f.maxHp*0.25 && !punir && Math.random()<P.retreat && dist<P.range){ if(dir>0) s.left=true; else s.right=true; return; }

    // skills (respeitando cooldown próprio + um "gate" entre skills)
    if(decide && f.ai.skillGate<=0 && stFrac>0.40 && Math.random()<P.skill){
      const skills=f.char.skills||[], ready=[];
      skills.forEach((sk,i)=>{ if(f.cd[i]<=0){
        const buff=(sk.type==='buff'||sk.type==='heal');
        const ranged=(sk.type==='projectile'||sk.type==='dash'||sk.type==='aoe');
        if(buff || sk.type==='projectile' || dist<P.range+(ranged?70:0)) ready.push(i);
      }});
      if(ready.length){
        let pick=ready[(Math.random()*ready.length)|0]; const sk=skills[pick];
        if(sk.type==='heal' && f.hp>f.maxHp*0.6) pick=ready.find(i=>skills[i].type!=='heal');
        if(pick!=null){ s._skill=skills[pick].key; f.ai.skillGate=P.skillGate;
          if(dist>P.range && skills[pick].type!=='projectile'){ if(dir>0)s.right=true; else s.left=true; }
          return; }
      }
    }

    if(dist>P.range){
      if(dir>0) s.right=true; else s.left=true;
      if(decide && Math.random()<P.dash) s._dash=dir;
      if(decide && Math.random()<P.jump) s.jump=true;
    } else if(decide){
      // guarda fôlego de reserva: só ataca se sobrar folga (ou se for punir)
      const agress = punir? Math.min(1,P.aggression+0.35) : P.aggression*(stFrac<0.45?0.5:1);
      if(Math.random()<agress){
        const r=Math.random();
        s._atk = r<0.5? 'punch' : r<0.82? 'kick' : 'heavy';   // varia soco/chute/forte
      } else if(Math.random()<P.jump) s.jump=true;
      else if(Math.random()<0.35){ if(dir>0)s.left=true; else s.right=true; } // reposiciona (neutro)
    }
  }

  return { ctrl, think, PRESET };
})();
