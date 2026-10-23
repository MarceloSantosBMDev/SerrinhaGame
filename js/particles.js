/* ============================================================
   EFEITOS: partículas, faíscas, poeira, números de dano,
   screen-shake e hitstop (congelamento de impacto)
   ============================================================ */
const FX = (function(){

  let parts = [];      // partículas
  let floats = [];     // textos flutuantes (dano / combo)
  let shapes = [];     // formas desenhadas por callback (VFX de skill)
  let shake = 0;       // intensidade do tremor
  let hitstop = 0;     // frames de congelamento
  let flash = 0, flashMax = 1, flashColor = '#fff';   // flash de tela (supers)

  function reset(){ parts=[]; floats=[]; shapes=[]; shake=0; hitstop=0; flash=0; }

  function screenFlash(frames, color){ flash=frames; flashMax=frames; flashColor=color||'#fff'; }

  // forma animada: fn(ctx, age, prog) chamada todo frame (prog vai de 1 -> 0)
  function addShape(life, fn){ shapes.push({life, max:life, age:0, fn}); }
  // partícula com gravidade/configurável (para VFX ricos)
  function emit(x,y,vx,vy,opts){
    opts=opts||{};
    parts.push({x,y,vx,vy, life:opts.life||20, max:opts.life||20, size:opts.size||3,
                color:opts.color||'#fff', g:opts.g==null?0.1:opts.g, fade:opts.fade!==false});
  }

  // explosão de faíscas no ponto de impacto
  function spark(x,y,color,n,power){
    n=n||10; power=power||5;
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, sp=Math.random()*power+1;
      parts.push({x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1, life:18+Math.random()*10,
                  max:28, size:2+Math.random()*3, color, g:0.25});
    }
  }
  // poeira ao andar/aterrissar/dash
  function dust(x,y,dir){
    for(let i=0;i<6;i++){
      parts.push({x:x+(Math.random()-.5)*10, y, vx:(-dir||1)*(Math.random()*2)+ (Math.random()-.5),
                  vy:-Math.random()*2, life:14+Math.random()*8, max:22, size:2+Math.random()*2,
                  color:'#caa6ff', g:0.06, fade:true});
    }
  }
  // rastro/afterimage simples
  function trail(x,y,color){
    parts.push({x,y,vx:0,vy:0,life:8,max:8,size:4,color,g:0,fade:true});
  }
  // anel de energia (especial)
  function ring(x,y,color){
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2, sp=4+Math.random()*2;
      parts.push({x,y,vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:22, max:22, size:3, color, g:0});
    }
  }
  function status(x,y,color){ // pingos de status (veneno/queimadura)
    parts.push({x:x+(Math.random()-.5)*16, y:y-(Math.random()*20), vx:0, vy:-0.6,
                life:20, max:20, size:3, color, g:-0.02, fade:true});
  }

  function floatText(x,y,text,color,size){
    floats.push({x,y,text,color,size:size||16,life:46,max:46,vy:-1.1});
  }

  function addShake(v){ shake=Math.max(shake,v); }
  function addHitstop(f){ hitstop=Math.max(hitstop,f); }
  function consumeHitstop(){ if(hitstop>0){ hitstop--; return true; } return false; }

  function update(){
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.vx*=0.96; p.life--;
      if(p.life<=0) parts.splice(i,1);
    }
    for(let i=floats.length-1;i>=0;i--){
      const f=floats[i]; f.y+=f.vy; f.vy*=0.94; f.life--;
      if(f.life<=0) floats.splice(i,1);
    }
    for(let i=shapes.length-1;i>=0;i--){ const s=shapes[i]; s.age++; s.life--; if(s.life<=0) shapes.splice(i,1); }
    if(shake>0) shake*=0.85; if(shake<0.3) shake=0;
    if(flash>0) flash--;
  }

  function render(ctx){
    shapes.forEach(s=>{ ctx.save(); try{ s.fn(ctx, s.age, s.life/s.max); }catch(e){} ctx.restore(); });
    parts.forEach(p=>{
      const a = p.fade? (p.life/p.max) : 1;
      ctx.globalAlpha=a;
      ctx.fillStyle=p.color;
      const s=p.size*(p.fade?(0.4+a*0.6):1);
      ctx.fillRect(p.x-s/2,p.y-s/2,s,s);
    });
    ctx.globalAlpha=1;
    floats.forEach(f=>{
      const a=Math.min(1,f.life/16);
      ctx.globalAlpha=a;
      ctx.font='bold '+f.size+"px 'Press Start 2P', monospace";
      ctx.textAlign='center';
      ctx.lineWidth=4; ctx.strokeStyle='#000';
      ctx.strokeText(f.text,f.x,f.y);
      ctx.fillStyle=f.color; ctx.fillText(f.text,f.x,f.y);
    });
    ctx.globalAlpha=1; ctx.textAlign='left';
    if(flash>0){ ctx.save(); ctx.globalAlpha=Math.min(0.85, flash/flashMax*0.85); ctx.fillStyle=flashColor;
      ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.restore(); ctx.globalAlpha=1; }
  }

  function shakeOffset(){
    if(shake<=0) return {x:0,y:0};
    return {x:(Math.random()-.5)*shake, y:(Math.random()-.5)*shake};
  }

  return { reset, spark, dust, trail, ring, status, floatText, addShake, screenFlash,
           addShape, emit, addHitstop, consumeHitstop, update, render, shakeOffset,
           get hitstop(){return hitstop;} };
})();
