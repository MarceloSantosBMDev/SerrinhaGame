// TORNEIO: todo mundo jogando com a MELHOR estratégia que a busca achou.
// node torneio.js <N> <parte> <semente> [ia]   ('ia' = todo mundo com a IA padrão, pra comparar)
const fs=require('fs');
const S=require('./sim.js');
const {IDS,mulberry,embaralha}=S;
const soIA=process.argv[5]==='ia';
const POL={};
if(!soIA) IDS.forEach(id=>{ const f=__dirname+'/res_'+id+'.json'; if(fs.existsSync(f)){ const r=JSON.parse(fs.readFileSync(f)); if(r.confMelhor>r.confBase) POL[id]=r.melhor; } });
const N=+(process.argv[2]||10000), parte=process.argv[3]||'0', semente=+(process.argv[4]||4242);
const M={}, V={};
const add=(o,k,w)=>{ const r=o[k]=o[k]||{w:0,n:0}; r.n++; if(w) r.w++; };
for(let k=0;k<N;k++){
  S.setRng(mulberry(semente*100003+k));
  const p=embaralha(IDS.slice()), A=p.slice(0,3), Bt=p.slice(3,6);
  const r=S.batalha(A,Bt,POL);
  if(r===null) continue;
  A.forEach(a=>{ add(M,a,r); Bt.forEach(b=>{ add(V,a+'>'+b,r); add(V,b+'>'+a,!r); }); });
  Bt.forEach(b=>add(M,b,!r));
}
fs.writeFileSync(__dirname+'/torneio_'+parte+'.json', JSON.stringify({M,V,USO:S.USO}));
console.log('parte',parte,'ok');
