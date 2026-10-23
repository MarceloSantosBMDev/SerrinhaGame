// Simulador das lutas do Modo História (mundo aberto): carrega o roteiro real,
// segue as missões em ordem (grupo, elenco trocado, bônus de vida) e roda cada luta no motor.
const fs=require('fs'), vm=require('vm');
const RAIZ=require('path').join(__dirname,'..','..','js')+'/';
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let rng=Math.random;
const noop=()=>{};
const deep=()=>new Proxy(function(){}, { get:(t,k)=> k===Symbol.toPrimitive? ()=>'' : deep(), apply:()=>deep() });
const el=()=>({getContext:()=>new Proxy({},{get:()=>noop}),style:{},addEventListener:noop,appendChild:noop,classList:{add:noop,remove:noop,toggle:noop,contains:()=>false}});
const M=Object.create(Math); M.random=()=>rng();
const MIS={}, LUT={}, ORD=[]; let INI={grupo:['mecas']};
const R=new Proxy({ missao(id,d){MIS[id]=Object.assign({id,tipo:'principal',passos:[]},d); ORD.push(id);}, luta(id,d){LUT[id]=Object.assign({id},d);}, inicio(d){INI=Object.assign(INI,d);} },
  { get:(t,k)=> t[k] || noop });
const ctx={console,Math:M,JSON,Date,setTimeout:noop,clearTimeout:noop,setInterval:noop,performance:{now:()=>Date.now()},
  localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
  document:{createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,body:el()},
  Image:function(){}, requestAnimationFrame:noop,
  Missoes:new Proxy({def:R},{get:(t,k)=> k in t? t[k] : deep()}), Mundo:deep(), Interiores:deep(), OWArte:deep(), OWPintor:deep(), Historia:deep(), goto:noop };
ctx.window=ctx; vm.createContext(ctx);
for(const [f,n] of [['turndata.js','TurnData'],['characters.js','Characters'],['turnbattle.js','TurnBattle']])
  vm.runInContext(fs.readFileSync(RAIZ+f,'utf8')+`\n;this.${n}=${n};`, ctx, {filename:f});
for(const f of ['roteiro_c1.js','roteiro_c1b.js','roteiro_c2.js']) vm.runInContext(fs.readFileSync(RAIZ+f,'utf8'), ctx, {filename:f});
const B=ctx.TurnBattle; B.setDelayIA(0); B.setEspera(null);

/* ---- segue as missões em ordem ---- */
let grupo=INI.grupo.slice(), guardado=null, bonus=0; const ctxLuta={};
function visita(o){
  if(!o || typeof o!=='object') return;
  if(Array.isArray(o)){ o.forEach(visita); return; }
  if(typeof o.grupo==='string' && /^[+-]/.test(o.grupo)){ const id=o.grupo.slice(1); if(o.grupo[0]==='+'){ if(grupo.indexOf(id)<0) grupo.push(id); } else grupo=grupo.filter(x=>x!==id); }
  if(o.elenco){ guardado=grupo.slice(); grupo=o.elenco.grupo.slice(); }
  if(o.restaurarElenco && guardado){ grupo=guardado; guardado=null; }
  if(typeof o.luta==='string' && LUT[o.luta] && !ctxLuta[o.luta]) ctxLuta[o.luta]={ grupo:grupo.slice(), bonus };
  for(const k in o){ if(k==='recompensa' || k==='se' || k==='requer') continue; const v=o[k]; if(v && typeof v==='object') visita(v); }
}
for(const id of ORD){ const m=MIS[id]; if(m.tipo!=='principal') continue; visita(m.passos); visita(m.recompensa);
  if(m.recompensa && m.recompensa.bonusHp) bonus=Math.min(40,bonus+m.recompensa.bonusHp); m._bonusDepois=bonus; }
// secundárias: grupo do fim do capítulo delas não dá pra saber; usa o estado da principal mais próxima (aprox.)
let ultimo={grupo:INI.grupo.slice(),bonus:0};
for(const id of ['pr_torradeira','pr_semaforo','pr_aspirador','pr_guardachuva']) ctxLuta[id]={grupo:['mecas','cargas'],bonus:20};
ctxLuta.ultimo_recado_rua={grupo:['mecas','cargas','strong_smerg'],bonus:40};
for(const id in LUT){ if(ctxLuta[id]) ultimo=ctxLuta[id]; else ctxLuta[id]=Object.assign({aprox:true},ultimo); }
// secundárias também dão bônus — quem joga tudo tem mais. Aproximação conservadora: só as principais.

const lutador=id=>!!ctx.Characters.byId(id);
function montar(id){
  const d=LUT[id], c=ctxLuta[id];
  let time = d.time && d.time!=='grupo' ? d.time.slice() : c.grupo.filter(lutador);
  if(d.mais) d.mais.forEach(x=>{ if(time.indexOf(x)<0) time.push(x); });
  time=time.slice(0,3);
  const aliado=time.map((x,k)=>Object.assign(x==='mecas'?{forma:2}:{}, c.bonus?{hpMais:c.bonus}:{}, ((d.ajustes||{}).aliado||[])[k]||{}));
  return { time, inimigos:d.inimigos, ajustes:{ aliado, inimigo:(d.ajustes||{}).inimigo||[] } };
}
// "jogador médio": uma fração das jogadas do lado do jogador sai com golpe e alvo sorteados
const SEED=+(process.env.SEED||4242);
let ERRO=+(process.env.ERRO||0.25);
function jogadaAleatoria(u, st){
  const disp=u.ficha.skills.map((s,i)=>i).filter(i=>u.cds[i]<=0 && !(u.desabilitadas||[]).some(d=>d.i===i) && !B.condicaoSkill(u,i));
  if(!disp.length){ B.defender(u); return; }
  const i=disp[(rng()*disp.length)|0], s=B.skillEfetiva(u,i);
  let alvo=null;
  if(s.alvo==='inimigo'){ const c=st.times.inimigo.filter(a=>a.vivo && !a.enterrado && !(a.fase>0)); alvo=c[(rng()*c.length)|0]||null; }
  else if(s.alvo==='aliado'){ const c=st.times.aliado.filter(a=>a.vivo && a.id!==u.id); alvo=c[(rng()*c.length)|0]||null; if(!alvo){ B.jogadaDaIA(u); return; } }
  if(B.usarSkill(u,i,alvo)===false) B.jogadaDaIA(u);
}
function luta(cfg, esperta){
  B.iniciar(cfg.time, cfg.inimigos, null, { semIA:true, ajustes:JSON.parse(JSON.stringify(cfg.ajustes)), iaEsperta:!!esperta });
  let g=0, ult=null, par=0;
  while(!B.estado().acabou && g++<900){ const st=B.estado(), u=st.atual; if(!u) break;
    const marca=u.id+'|'+st.rodada+'|'+(st.log?st.log.length:0);
    if(u.time==='aliado' && ERRO>0 && rng()<ERRO && !u.enterrado) jogadaAleatoria(u, st); else B.jogadaDaIA(u);
    if(B.estado().atual===u && marca===ult){ if(++par>3){ B.defender(u); par=0; } } else par=0; ult=marca; }
  const s=B.estado(); return s.acabou ? !!s.venceu : null;
}
function taxa(id, N, esperta, mod){
  let cfg=montar(id); if(mod) cfg=mod(cfg, LUT[id]);
  let v=0,n=0; for(let k=0;k<N;k++){ rng=mulberry(SEED+k); const r=luta(cfg,esperta); if(r===null) continue; n++; if(r) v++; }
  rng=Math.random; return n? 100*v/n : NaN;
}
module.exports={ LUT, MIS, ctxLuta, montar, taxa, ctx };
if(require.main===module){
  const N=+(process.argv[2]||200), esperta=process.argv[3]==='esperta';
  const so=process.argv[4];
  for(const id in LUT){ if(so && !id.includes(so)) continue; const d=LUT[id], c=montar(id);
    console.log((d.chefe?'★':' ')+' '+id.padEnd(22)+' '+String(taxa(id,N,esperta).toFixed(0)).padStart(4)+'%  '+c.time.join('+')+(ctxLuta[id].aprox?'(~)':'')+' b'+ctxLuta[id].bonus+'  vs '+d.inimigos.join(',')); }
}
