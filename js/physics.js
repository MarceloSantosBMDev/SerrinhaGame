/* ============================================================
   ENGINE DE FÍSICA (v2 — do zero, "game feel")
   - Euler semi-implícito com gravidade variável (subida x queda)
   - Atrito separado de chão e ar (momentum preservado no ar)
   - Pulo variável (jump cut), fast-fall, terminal velocity
   - Eventos de colisão: justLanded, wallHit, wallImpact
   ============================================================ */
const Physics = (function(){

  const GRAVITY        = 0.74;   // gravidade base na subida
  const FALL_MULT      = 1.35;   // queda mais "pesada" que a subida (snappy)
  const FAST_FALL      = 1.9;    // multiplicador ao apertar baixo no ar
  const MAX_FALL       = 20;     // velocidade terminal
  const GROUND_FRICTION= 0.80;   // atrito ao caminhar/parar no chão
  const AIR_FRICTION   = 0.955;  // ar: mais "deslizante" (preserva momentum)
  const STOP_THRESH    = 0.05;

  function makeBody(x,y,w,h,weight){
    return { x,y,w,h, vx:0,vy:0, weight:weight||1, onGround:false, facing:1,
             justLanded:false, wallHit:0, wallImpact:0, prevVy:0 };
  }

  function aabb(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }
  function hit(rect, body){
    return rect.x < body.x+body.w && rect.x+rect.w > body.x &&
           rect.y < body.y+body.h && rect.y+rect.h > body.y;
  }

  // impulso (knockback) com massa
  function knockback(body, fx, fy){
    const m=body.weight; body.vx += fx/m; body.vy += fy/m;
  }

  // integra 1 frame. opts.fastFall = queda rápida; opts.airControl ignorado aqui
  function step(body, world, opts){
    opts=opts||{};
    body.justLanded=false; body.wallHit=0; body.wallImpact=0; body.prevVy=body.vy;
    const wasGround=body.onGround;

    // gravidade (subida leve, queda pesada)
    let gAcc = GRAVITY*body.weight;
    if(body.vy>0){ gAcc *= FALL_MULT; if(opts.fastFall) gAcc *= FAST_FALL; }
    body.vy += gAcc;
    if(body.vy>MAX_FALL) body.vy = MAX_FALL;

    // atrito horizontal
    body.vx *= body.onGround? GROUND_FRICTION : AIR_FRICTION;
    if(Math.abs(body.vx)<STOP_THRESH) body.vx=0;

    // integração
    const impactVx=Math.abs(body.vx);
    body.x += body.vx;
    body.y += body.vy;

    // paredes laterais (registra impacto p/ wall-bounce)
    if(body.x < world.left){ body.x=world.left; if(body.vx<0){ body.wallHit=-1; body.wallImpact=impactVx; } body.vx=0; }
    else if(body.x+body.w > world.right){ body.x=world.right-body.w; if(body.vx>0){ body.wallHit=1; body.wallImpact=impactVx; } body.vx=0; }

    // chão
    body.onGround=false;
    if(body.y+body.h >= world.floor){
      body.y = world.floor - body.h; body.vy=0; body.onGround=true;
      if(!wasGround) body.justLanded=true;
    }
    // teto
    if(body.y < world.top){ body.y=world.top; if(body.vy<0) body.vy=0; }

    return body;
  }

  // resolve sobreposição entre dois corpos (empurrão suave)
  function separate(a,b){
    if(!aabb(a,b)) return;
    const overlapX = Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x);
    const ac=a.x+a.w/2, bc=b.x+b.w/2;
    const push = overlapX/2 + 0.5;
    if(ac<bc){ a.x-=push; b.x+=push; } else { a.x+=push; b.x-=push; }
  }

  return { GRAVITY, MAX_FALL, makeBody, aabb, hit, knockback, step, separate };
})();
