// Simulador de ESTRATÉGIAS — usa o motor real do jogo (turnbattle.js) com os dois lados controlados aqui.
const fs=require('fs'), vm=require('vm');
const RAIZ=require('path').join(__dirname,'..','..','js')+'/';

function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let rng=Math.random;
function carregar(){
  const noop=()=>{};
  const el=()=>({getContext:()=>new Proxy({},{get:()=>noop}),style:{},addEventListener:noop,appendChild:noop,classList:{add:noop,remove:noop,toggle:noop,contains:()=>false}});
  const M=Object.create(Math); M.random=()=>rng();
  const ctx={console,Math:M,JSON,Date,setTimeout:noop,clearTimeout:noop,setInterval:noop,performance:{now:()=>Date.now()},
    localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
    document:{createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,body:el()},
    Image:function(){}, requestAnimationFrame:noop};
  ctx.window=ctx; vm.createContext(ctx);
  for(const [f,n] of [['turndata.js','TurnData'],['characters.js','Characters'],['turnbattle.js','TurnBattle']])
    vm.runInContext(fs.readFileSync(RAIZ+f,'utf8')+`\n;this.${n}=${n};`, ctx, {filename:f});
  ctx.TurnBattle.setDelayIA(0); ctx.TurnBattle.setEspera(null);
  return ctx;
}
const C=carregar(), B=C.TurnBattle, TD=C.TurnData;
/* AJUSTE DE BALANÇO em memória (ajuste.json = { charId: { d: mult do dano dos golpes, c: mult das curas, h: mult da vida } }).
   Escala a partir dos números ORIGINAIS da ficha; cada objeto de golpe é tocado uma vez só. */
function aplicarAjuste(AJ){
  const vistos=new Set();
  for(const id in AJ){ const f=TD.ficha(id); if(!f) continue; const a=AJ[id];
    if(a.h){ f._hp0=f._hp0||f.hp; f.hp=Math.round(f._hp0*a.h); }
    const mexe=o=>{ if(!o||vistos.has(o)) return; vistos.add(o);
      if(o.dano>0){ o._d0=o._d0||o.dano; o.dano=Math.max(1,Math.round(o._d0*(a.d||1))); }
      if(o.cura>0){ o._c0=o._c0||o.cura; o.cura=Math.max(1,Math.round(o._c0*(a.c||1))); }
      if(a.b){ for(const k of ['buff','buffEu']) if(o[k] && o[k].valor>0){ o[k]._b0=o[k]._b0||o[k].valor; o[k].valor=Math.max(1,Math.round(o[k]._b0*a.b)); } }
      if(o.escalaVida){ o._v0=o._v0||o.escalaVida; o.escalaVida=+(o._v0*(a.d||1)).toFixed(3); }
      if(o.escalaDefesa){ o._e0=o._e0||o.escalaDefesa; o.escalaDefesa=+(o._e0*(a.d||1)).toFixed(3); } };
    f.skills.forEach(s=>{ mexe(s); if(s.formaOverride) Object.values(s.formaOverride).forEach(mexe); });
  }
}
let AJUSTE={}; try{ AJUSTE=JSON.parse(fs.readFileSync(__dirname+'/ajuste.json','utf8')); }catch(e){}
aplicarAjuste(AJUSTE);
const IDS=C.Characters.jogaveis().map(x=>x.id).filter(id=>TD.ficha(id));

/* ---------- POLÍTICA ----------
   { alvo:'fraco'|'pct'|'forte'|'ia', lista:[{i, g, p}] }  (i=-1 = Defender)
   Percorre a lista; o 1º golpe disponível com a condição verdadeira sai.
   Nada passou → a IA padrão do jogo decide. */
const GATES=['sempre','rodadaAte','rodadaDepois','vidaMenos','vidaMais','timeFerido','usosMenos','inimigos2','inimigos1'];
const PARAMS={ rodadaAte:[1,2,3,4], rodadaDepois:[1,2,3,4], vidaMenos:[.3,.5,.7,.9,.99], vidaMais:[.3,.5,.7,.9,.99],
               timeFerido:[.4,.6,.8], usosMenos:[1,2,3], sempre:[0], inimigos2:[0], inimigos1:[0] };
function gateOk(e,u,st,usos){
  const v=u.hp/u.hpMax;
  switch(e.g){
    case 'sempre': return true;
    case 'rodadaAte': return st.rodada<=e.p;
    case 'rodadaDepois': return st.rodada>e.p;
    case 'vidaMenos': return v<e.p;
    case 'vidaMais': return v>=e.p;
    case 'timeFerido': return st.times[u.time].some(a=>a.vivo && a.hp/a.hpMax<e.p);
    case 'usosMenos': return (usos[u.id+':'+e.i]||0)<e.p;
    case 'inimigos2': return inimigosDe(u,st).length>=2;
    case 'inimigos1': return inimigosDe(u,st).length===1;
  }
  return false;
}
function inimigosDe(u,st){ return st.times[u.time==='aliado'?'inimigo':'aliado'].filter(a=>a.vivo && !a.enterrado && !(a.fase>0)); }
function disponivel(u,i){
  if(i===-1) return true;
  return u.cds[i]<=0 && !(u.desabilitadas||[]).some(d=>d.i===i) && !B.condicaoSkill(u,i);
}
function escolheAlvo(u,s,st,regra){
  if(s.alvo==='aliado'){ const c=st.times[u.time].filter(a=>a.vivo && a.id!==u.id); return c.sort((a,b)=>a.hp/a.hpMax-b.hp/b.hpMax)[0]||null; }
  if(s.alvo!=='inimigo') return null;
  const ini=inimigosDe(u,st); if(!ini.length) return null;
  if(regra==='pct') return ini.sort((a,b)=>a.hp/a.hpMax-b.hp/b.hpMax)[0];
  if(regra==='forte') return ini.sort((a,b)=>(b.atk+b.atkBonus)-(a.atk+a.atkBonus))[0];
  return ini.sort((a,b)=>a.hp-b.hp)[0];
}
const USO={};   // quantas vezes cada linha da estratégia foi a escolhida (chave charId#linha, ou #ia)
function jogar(u, pol, usos){
  const st=B.estado();
  if(pol && !u.enterrado){
    for(let li=0; li<pol.lista.length; li++){ const e=pol.lista[li];
      USO[u.charId+'#'+li]=(USO[u.charId+'#'+li]||0); // (contado só quando sai, logo abaixo)
      if(!disponivel(u,e.i) || !gateOk(e,u,st,usos)) continue;
      if(e.i===-1){ B.defender(u); USO[u.charId+'#'+li]++; return; }
      const s=B.skillEfetiva(u,e.i);
      if(s.alvo==='aliado' && !st.times[u.time].some(a=>a.vivo && a.id!==u.id)) continue;
      const alvo = pol.alvo==='ia' && s.alvo==='inimigo' ? escolheAlvo(u,s,st,'fraco') : escolheAlvo(u,s,st,pol.alvo);
      const ok=B.usarSkill(u,e.i,alvo);
      if(ok!==false){ usos[u.id+':'+e.i]=(usos[u.id+':'+e.i]||0)+1; USO[u.charId+'#'+li]++; return; }
    }
    USO[u.charId+'#ia']=(USO[u.charId+'#ia']||0)+1;
  }
  B.jogadaDaIA(u);
}
/* uma batalha; pols = {charId: politica}. Devolve true se o time 'aliado' venceu (null = não acabou) */
function batalha(A,Bt,pols){
  B.iniciar(A,Bt,null,{semIA:true});
  const usos={}; let g=0, ultimo=null, parado=0;
  while(!B.estado().acabou && g++<900){
    const st=B.estado(), u=st.atual; if(!u) break;
    const marca=u.id+'|'+st.rodada+'|'+(st.log?st.log.length:0);
    jogar(u, pols[u.charId]||null, usos);
    if(B.estado().atual===u && marca===ultimo){ if(++parado>3){ B.defender(u); parado=0; } } else parado=0;
    ultimo=marca;
  }
  const s=B.estado(); return s.acabou ? !!s.venceu : null;
}
function embaralha(p){ for(let i=p.length-1;i>0;i--){ const j=(rng()*(i+1))|0; [p[i],p[j]]=[p[j],p[i]]; } return p; }
/* % de vitória do time que tem `id` usando `pol` (o resto: IA padrão). Mesma semente = mesmas lutas sorteadas. */
function avaliar(id, pol, N, seed, outras){
  let v=0,n=0;
  // quem está sendo testado NÃO usa a estratégia gravada no jogo (o resto usa)
  const f=TD.ficha(id), guardada=f.estrategia; if(pol) f.estrategia=undefined;
  for(let k=0;k<N;k++){
    rng=mulberry(seed*7919+k);
    const resto=embaralha(IDS.filter(x=>x!==id));
    const meu=[id,resto[0],resto[1]], dele=resto.slice(2,5);
    const lado=k%2;
    const pols=Object.assign({}, outras||{}); pols[id]=pol;
    const r = lado? batalha(meu,dele,pols) : batalha(dele,meu,pols);
    if(r===null) continue; n++; if(lado? r : !r) v++;
  }
  rng=Math.random; f.estrategia=guardada;
  return 100*v/Math.max(1,n);
}
function nSkills(id){ return TD.ficha(id).skills.length; }
function mutar(id,pol){
  const p=JSON.parse(JSON.stringify(pol)), n=nSkills(id), r=rng();
  const novaEntrada=()=>{ const g=GATES[(rng()*GATES.length)|0]; const ps=PARAMS[g]; return { i: rng()<0.08? -1 : (rng()*n)|0, g, p:ps[(rng()*ps.length)|0] }; };
  if(r<0.30 || !p.lista.length){ p.lista.splice((rng()*(p.lista.length+1))|0, 0, novaEntrada()); }
  else if(r<0.45){ p.lista.splice((rng()*p.lista.length)|0,1); }
  else if(r<0.65){ const e=p.lista[(rng()*p.lista.length)|0]; const g=rng()<0.5? e.g : GATES[(rng()*GATES.length)|0]; e.g=g; const ps=PARAMS[g]; e.p=ps[(rng()*ps.length)|0]; }
  else if(r<0.80 && p.lista.length>1){ const a=(rng()*p.lista.length)|0, b=(rng()*p.lista.length)|0; [p.lista[a],p.lista[b]]=[p.lista[b],p.lista[a]]; }
  else if(r<0.90){ const e=p.lista[(rng()*p.lista.length)|0]; e.i= rng()<0.08? -1 : (rng()*n)|0; }
  else p.alvo=['fraco','pct','forte','ia'][(rng()*4)|0];
  if(p.lista.length>7) p.lista.length=7;
  return p;
}
module.exports={ AJUSTE, aplicarAjuste, USO, B, TD, IDS, C, avaliar, mutar, batalha, mulberry, embaralha, setRng:f=>{rng=f;}, get rng(){return rng;} };

/* ---------- busca (node sim.js busca <id> [iteracoes]) ---------- */
if(require.main===module && process.argv[2]==='busca'){
  const id=process.argv[3], IT=+(process.argv[4]||70), N=+(process.argv[5]||1200);
  const semente0=12345;
  const base=avaliar(id,null,N,semente0);
  let melhor={alvo:'ia', lista:[]}, nota=base;
  // ponto de partida: as ideias "óbvias" pra cada personagem também entram como candidatas
  const sementes=require('./ideias.js')(id, TD);
  // 2ª rodada: parte da melhor da 1ª + "maior dano primeiro, sem turno parado" (nos 3 jeitos de mirar)
  if(process.argv[6]==='continua'){
    const ant=__dirname+'/res_'+id+'.json'; if(fs.existsSync(ant)) sementes.unshift(JSON.parse(fs.readFileSync(ant)).melhor);
    const dano=TD.ficha(id).skills.map((s,i)=>({i,d:(s.dano||0)*(s.vezes||1)*(s.alvo==='todos_inimigos'?2:1)})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d);
    ['pct','fraco','forte'].forEach(alvo=>sementes.push({ alvo, lista:dano.map(x=>({i:x.i,g:'sempre',p:0})) }));
  }
  for(const s of sementes){ const v=avaliar(id,s,N,semente0); if(v>nota){ nota=v; melhor=s; } }
  let semMelhora=0;
  for(let it=0; it<IT; it++){
    rng=mulberry(999+it*31); const cand=mutar(id,melhor); rng=Math.random;
    const v=avaliar(id,cand,N,semente0);
    if(v>nota+0.15){ nota=v; melhor=cand; semMelhora=0; } else semMelhora++;
  }
  // confere em lutas NOVAS (outra semente) pra não ficar com sorte de amostra
  const confBase=avaliar(id,null,4000,777), confMelhor=avaliar(id,melhor,4000,777);
  const out={ id, base, nota, confBase, confMelhor, melhor };
  fs.writeFileSync(__dirname+'/res_'+id+'.json', JSON.stringify(out,null,1));
  console.log(id, base.toFixed(1), '→', nota.toFixed(1), '| conferido', confBase.toFixed(1), '→', confMelhor.toFixed(1));
}
