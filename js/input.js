/* ============================================================
   INPUT — 1 jogador (vs IA) e 2 JOGADORES LOCAL
   ------------------------------------------------------------
   MODO 1P  (Input.setMode('1p'))
     P1: WASD  ou  setas · Soco J · Chute K · Forte L · Skills 1-4
   MODO 2P  (Input.setMode('2p'))
     P1: A/D mover · W pular · S bloquear · Soco F · Chute G · Forte H · Skills 1 2 3 4
     P2: ←/→ mover · ↑ pular · ↓ bloquear · Soco J · Chute K · Forte L · Skills 7 8 9 0
   Dash = toque duplo na direção. Interface igual à da IA.
   ============================================================ */
const Input = (function(){

  // teclas por jogador em cada modo
  const MAPS = {
    '1p': {
      1:{ left:['a','arrowleft'], right:['d','arrowright'], jump:['w','arrowup',' '], block:['s','arrowdown'],
          punch:['j','f'], kick:['k','g'], heavy:['l','h'],
          skills:[['Digit1','Numpad1'],['Digit2','Numpad2'],['Digit3','Numpad3'],['Digit4','Numpad4']] }
    },
    '2p': {
      1:{ left:['a'], right:['d'], jump:['w'], block:['s'],
          punch:['f'], kick:['g'], heavy:['h'],
          skills:[['Digit1'],['Digit2'],['Digit3'],['Digit4']] },
      2:{ left:['arrowleft'], right:['arrowright'], jump:['arrowup'], block:['arrowdown'],
          punch:['j'], kick:['k'], heavy:['l'],
          skills:[['Digit7','Numpad1'],['Digit8','Numpad2'],['Digit9','Numpad3'],['Digit0','Numpad4']] }
    }
  };

  let mode='1p';
  const down={}, edge={}, codeEdge={};
  const tapT={1:{left:0,right:0}, 2:{left:0,right:0}};
  const dashPulse={1:0, 2:0};

  function map(p){ return (MAPS[mode][p]) || MAPS[mode][1]; }
  function anyDown(arr){ if(!arr) return false; for(const k of arr) if(down[k]) return true; return false; }
  function anyEdge(arr){ if(!arr) return false; for(const k of arr) if(edge[k]) return true; return false; }
  function anyCode(arr){ if(!arr) return false; for(const c of arr) if(codeEdge[c]) return true; return false; }

  window.addEventListener('keydown', e=>{
    const k=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    if(!e.repeat){
      edge[k]=true; codeEdge[e.code]=true;
      const now=performance.now();
      // toque duplo lateral -> dash (por jogador)
      Object.keys(MAPS[mode]).forEach(ps=>{
        const p=+ps, m=MAPS[mode][p];
        if(m.left.includes(k)){ if(now-tapT[p].left<260) dashPulse[p]=-1; tapT[p].left=now; }
        if(m.right.includes(k)){ if(now-tapT[p].right<260) dashPulse[p]=1; tapT[p].right=now; }
      });
    }
    down[k]=true;
  });
  window.addEventListener('keyup', e=>{ down[e.key.toLowerCase()]=false; });
  window.addEventListener('blur', ()=>{ for(const k in down) down[k]=false; });

  function endFrame(){ for(const k in edge) delete edge[k]; for(const c in codeEdge) delete codeEdge[c]; }
  function setMode(m){ mode=(m==='2p')?'2p':'1p'; for(const k in down) down[k]=false; }

  function ctrl(player){
    const p=player||1;
    return {
      type:'human', player:p,
      held(a){ const m=map(p); return anyDown(m[a]); },
      pressed(a){ const m=map(p); return anyEdge(m[a]); },
      dash(){ const d=dashPulse[p]; dashPulse[p]=0; return d; },
      skill(n){ const m=map(p); return anyCode(m.skills[n-1]); }
    };
  }

  return { ctrl, endFrame, setMode, MAPS };
})();
