// grava as melhores estratégias (res_*.json) no bloco ESTRATEGIAS do turndata.js
const fs=require('fs'); const ARQ=require('path').join(__dirname,'..','..','js','turndata.js');
const ids=fs.readFileSync(__dirname+'/ids.txt','utf8').trim().split(/\s+/);
let uso={}; try{ fs.readdirSync(__dirname).filter(f=>/^torneio_E\d+\.json$/.test(f)).forEach(f=>{ const d=JSON.parse(fs.readFileSync(__dirname+'/'+f)); for(const k in d.USO) uso[k]=(uso[k]||0)+d.USO[k]; }); }catch(e){}
const E={};
ids.forEach(id=>{ const f=__dirname+'/res_'+id+'.json'; if(!fs.existsSync(f)) return; const r=JSON.parse(fs.readFileSync(f));
  if(!(r.confMelhor>r.confBase+0.5)) return;
  let tot=0; r.melhor.lista.forEach((e,li)=>tot+=uso[id+'#'+li]||0);
  const lista=r.melhor.lista.filter((e,li)=>!tot || (uso[id+'#'+li]||0)/tot>=0.005 || !(id+'#'+li in uso)).map(e=>({i:e.i,g:e.g,p:e.p}));
  E[id]={ alvo:r.melhor.alvo, lista }; });
let s=fs.readFileSync(ARQ,'utf8');
const ini='  /* ==== ESTRATEGIAS (gerado) ====', fim='  /* ==== fim ESTRATEGIAS ==== */\n';
const bloco=ini+`
     Gerado pela busca de estratégias (simulação no motor real, ver CONTEXT.md
     §5.2.1). Lido pela IA em jogadaDaIA: lista de prioridade { i: golpe
     (-1 = defender), g: condição, p: parâmetro } + regra de mira.
     NÃO edite à mão — rode a busca de novo e regenere. */
  const ESTRATEGIAS = ${JSON.stringify(E).replace(/\},"/g,'},\n    "')};
  Object.keys(ESTRATEGIAS).forEach(id=>{ if(FICHAS[id]) FICHAS[id].estrategia=ESTRATEGIAS[id]; });
`+fim;
if(s.includes(ini)) s=s.slice(0,s.indexOf(ini))+bloco+s.slice(s.indexOf(fim)+fim.length);
else s=s.replace('  function ficha(id){ return FICHAS[id]; }', bloco+'\n  function ficha(id){ return FICHAS[id]; }');
fs.writeFileSync(ARQ,s);
console.log('estratégias gravadas:', Object.keys(E).length, Object.keys(E).join(' '));
