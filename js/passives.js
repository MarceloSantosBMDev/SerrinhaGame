/* ============================================================
   SISTEMA DE PASSIVAS (elaborado)
   Hooks (todos opcionais):
     onSpawn(f)                  -> ajusta atributos base
     onTick(f,g)                 -> a cada frame
     onHit(f,target,dmg,info,g)  -> ao acertar; retorna dano
     onDamaged(f,dmg,info,g)     -> ao receber; retorna dano
     onBlock(f,attacker,dmg,g)
     onParry(f,attacker,g)
     onDash(f,g)
     onSpecial(f,g)
     onKO(f,g)                   -> retorna true p/ impedir a morte
     meterMult(f)                -> multiplicador de ganho de especial
   g = API do jogo: {opponent, applyStatus, fx, spawnProjectile, ...}
   ============================================================ */
const Passives = (function(){

  const list = {
    none:{ id:'none', name:'Nenhuma', icon:'—', desc:'Sem habilidade passiva especial.' },

    combustao:{ id:'combustao', name:'Combustão', icon:'🔥',
      desc:'Cada acerto aplica QUEIMADURA (dano contínuo, acumula até 5). O ESPECIAL detona todas as pilhas causando dano explosivo.',
      onHit(f,t,dmg,info,g){ if(info.type!=='special') g.applyStatus(t,'burn',{stacks:1,time:180}); return dmg; },
      onSpecial(f,g){ const o=g.opponent(f); const st=o.status.burn;
        if(st&&st.stacks>0){ const boom=st.stacks*7; g.deal(o,boom,f,{type:'detonate'});
          g.fx.spark(o.body.x+o.body.w/2,o.body.y+o.body.h/2,'#ff7a00',24,7); g.fx.addShake(10);
          g.floatText(o, '🔥'+Math.round(boom), '#ff7a00'); st.stacks=0; st.time=0; } } },

    permafrost:{ id:'permafrost', name:'Permafrost', icon:'❄', desc:'Acertos acumulam FRIO; ao encher, CONGELA o oponente brevemente. Imune a lentidão.',
      onSpawn(f){ f.immuneSlow=true; },
      onHit(f,t,dmg,info,g){ const s=g.applyStatus(t,'chill',{stacks:1,time:240,max:4});
        if(s.stacks>=4){ s.stacks=0; g.applyStatus(t,'freeze',{time:48}); g.floatText(t,'CONGELOU!','#7df0ff'); g.fx.spark(t.body.x+t.body.w/2,t.body.y+30,'#7df0ff',18,5);} return dmg; } },

    veneno:{ id:'veneno', name:'Toxina', icon:'☠', desc:'Acertos aplicam VENENO que ignora defesa. Você se cura com 25% do dano do veneno.',
      onHit(f,t,dmg,info,g){ g.applyStatus(t,'poison',{time:200,src:f}); return dmg; } },

    fortaleza:{ id:'fortaleza', name:'Fortaleza', icon:'🛡', desc:'Recebe 25% menos dano e metade do empurrão. Ataque PESADO tem super-armadura (não é interrompido). 8% mais lento.',
      onSpawn(f){ f.spd*=0.92; f.kbResist=0.5; },
      onDamaged(f,dmg,info){ return dmg*0.75; } },

    sobrecarga:{ id:'sobrecarga', name:'Sobrecarga', icon:'⚡', desc:'Cada DASH gera energia e eletrifica o próximo golpe (+35% de dano). Dashes recarregam o especial mais rápido.',
      onDash(f,g){ f.sp=Math.min(f.maxSp,f.sp+14); f.charged=true; g.fx.ring(f.body.x+f.body.w/2,f.body.y+f.body.h/2,'#ffe066'); },
      onHit(f,t,dmg,info,g){ if(f.charged){ f.charged=false; g.fx.spark(t.body.x+t.body.w/2,t.body.y+30,'#ffe066',16,6); return dmg*1.35; } return dmg; } },

    sombras:{ id:'sombras', name:'Sombras', icon:'🌑', desc:'Rouba 30% do dano causado como vida. Ao dar DASH você fica intangível por um instante (esquiva).',
      onHit(f,t,dmg,info){ f.hp=Math.min(f.maxHp,f.hp+dmg*0.30); return dmg; },
      onDash(f,g){ f.intangible=12; g.fx.trail(f.body.x+f.body.w/2,f.body.y+f.body.h/2,'#a93bff'); } },

    furia_titan:{ id:'furia_titan', name:'Fúria do Titã', icon:'💢', desc:'Dano aumenta conforme seu COMBO cresce (+8% por acerto, até +80%). Em troca, recebe +15% de dano.',
      onHit(f,t,dmg,info){ const mult=1+Math.min(0.8,(f.combo||0)*0.08); return dmg*mult; },
      onDamaged(f,dmg,info){ return dmg*1.15; } },

    regen_adapt:{ id:'regen_adapt', name:'Regeneração', icon:'✚', desc:'Recupera vida continuamente; quanto menor a vida, mais rápido cura. Parar de curar por 2s após levar dano.',
      onTick(f){ if(f.regenLock>0){ f.regenLock--; return; } const missing=1-f.hp/f.maxHp; f.hp=Math.min(f.maxHp,f.hp+0.08+missing*0.28); },
      onDamaged(f,dmg){ f.regenLock=120; return dmg; } },

    renascer:{ id:'renascer', name:'Renascer', icon:'🜂', desc:'Ao ser derrotado uma vez, RENASCE com 40% de vida em uma explosão de fogo que fere e empurra o oponente.',
      onKO(f,g){ if(f._reborn) return false; f._reborn=true; f.hp=f.maxHp*0.40; f.flash=24; f.invuln=60;
        const o=g.opponent(f); g.deal(o, 18, f, {type:'nova'});
        const dir=o.body.x<f.body.x?-1:1; g.knock(o, dir*16, -10);
        g.applyStatus(o,'burn',{stacks:3,time:200});
        g.fx.ring(f.body.x+f.body.w/2,f.body.y+f.body.h/2,'#ff5e3b'); g.fx.spark(f.body.x+f.body.w/2,f.body.y+40,'#ffd633',40,9);
        g.fx.addShake(16); g.floatText(f,'RENASCEU!','#ff5e3b'); return true; } },

    contra:{ id:'contra', name:'Contragolpe', icon:'⮌', desc:'Defesa perfeita (PARRY) atordoa muito o atacante e enche bastante o seu especial.',
      onParry(f,a,g){ f.sp=Math.min(f.maxSp,f.sp+45); a.stun=Math.max(a.stun,40); g.floatText(f,'PARRY!','#ffe066'); g.fx.ring(f.body.x+f.body.w/2,f.body.y+f.body.h/2,'#fff'); g.fx.addShake(8);} },

    adrenalina:{ id:'adrenalina', name:'Adrenalina', icon:'⏩', desc:'Carrega o especial 60% mais rápido. Com o especial cheio, ganha +12% de velocidade.',
      meterMult(f){ return 1.6; },
      onTick(f){ f._adr = f.sp>=f.maxSp; },
      onSpawn(f){ f._baseSpd=f.spd; },
      onTickLate(f){ f.spd = f._adr? f._baseSpd*1.12 : f._baseSpd; } },

    padeiro:{ id:'padeiro', name:'Padaria Ambulante', icon:'🥖',
      desc:'Comida cura: acertos com pão/croissant recuperam 15% do dano. Dar PARRY cura 7 e adianta todas as recargas em 0,75s.',
      onHit(f,t,dmg,info,g){
        if(info && info.food){ f.hp=Math.min(f.maxHp, f.hp+dmg*0.15); g.floatText(f,'+'+Math.round(dmg*0.15)+' 🥖','#ffd166',10); }
        return dmg;
      },
      onParry(f,a,g){
        f.hp=Math.min(f.maxHp, f.hp+7);
        if(f.cd) for(let i=0;i<f.cd.length;i++) f.cd[i]=Math.max(0,f.cd[i]-45);
        a.stun=Math.max(a.stun,34);
        g.floatText(f,'+10 🥖','#ffd166',12);
      },
      onBlock(f,a,dmg,g){ f.hp=Math.min(f.maxHp, f.hp+1.5); } },

    agilidade:{ id:'agilidade', name:'Agilidade Canina', icon:'🐾',
      desc:'Rolar/avançar dá invencibilidade breve e acelera TODAS as recargas em 1s. Leva 10% menos dano no ar.',
      onDash(f,g){
        f.intangible=Math.max(f.intangible,14);
        if(f.cd) for(let i=0;i<f.cd.length;i++) f.cd[i]=Math.max(0,f.cd[i]-60);
        g.fx.trail(f.body.x+f.body.w/2, f.body.y+f.body.h/2, '#ffd28a');
        g.floatText(f,'🐾','#ffd28a',11);
      },
      onDamaged(f,dmg){ return f.body && !f.body.onGround ? dmg*0.90 : dmg; } },

    protocolo_ciborgue:{ id:'protocolo_ciborgue', name:'Protocolo Ciborgue', icon:'🦾',
      desc:'Quanto mais apanha, mais máquina fica. Com 50% de vida vira QUASE-CIBORGUE (+16% dano, +8% velocidade). Com 30% vira CIBORGUE 5000Z (+34% dano, +16% velocidade, +2 defesa) e o Arsenal vira TIRO DE RIFLE.',
      /* a troca de forma em si é feita pelo motor (game.js: atualizaForma),
         porque envolve trocar spritesheet, efeitos e stats de uma vez.    */
      onHit(f,t,dmg){ return dmg * ((f.formBuff && f.formBuff.atk) || 1); } },

    espinhos:{ id:'espinhos', name:'Espinhos', icon:'🌵', desc:'Reflete 25% do dano recebido e faz o atacante SANGRAR por alguns segundos.',
      onDamaged(f,dmg,info,g){ if(info&&info.attacker&&info.type!=='reflect'){ g.deal(info.attacker, dmg*0.25, f, {type:'reflect'}); g.applyStatus(info.attacker,'bleed',{time:120}); } return dmg; } }
  };

  function get(id){ return list[id]||list.none; }
  function all(){ return Object.values(list); }

  // dispatchers
  function spawn(f){ const p=get(f.passive); if(p.onSpawn)p.onSpawn(f); }
  function tick(f,g){ const p=get(f.passive); if(p.onTick)p.onTick(f,g); if(p.onTickLate)p.onTickLate(f,g); }
  function hit(f,t,dmg,info,g){ const p=get(f.passive); return p.onHit?p.onHit(f,t,dmg,info,g):dmg; }
  function damaged(f,dmg,info,g){ const p=get(f.passive); return p.onDamaged?p.onDamaged(f,dmg,info,g):dmg; }
  function block(f,a,dmg,g){ const p=get(f.passive); if(p.onBlock)p.onBlock(f,a,dmg,g); }
  function parry(f,a,g){ const p=get(f.passive); if(p.onParry)p.onParry(f,a,g); }
  function dash(f,g){ const p=get(f.passive); if(p.onDash)p.onDash(f,g); }
  function special(f,g){ const p=get(f.passive); if(p.onSpecial)p.onSpecial(f,g); }
  function ko(f,g){ const p=get(f.passive); return p.onKO?p.onKO(f,g):false; }
  function meterMult(f){ const p=get(f.passive); return p.meterMult?p.meterMult(f):1; }

  return { get, all, spawn, tick, hit, damaged, block, parry, dash, special, ko, meterMult };
})();
