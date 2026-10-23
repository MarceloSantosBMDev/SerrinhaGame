// fica com a estratégia nova só se ela ganhou de verdade da gravada; senão volta a anterior (pasta argv[2])
const fs=require('fs'); const ant=process.argv[2];
for(const id of fs.readFileSync(__dirname+'/ids.txt','utf8').trim().split(/\s+/)){
  const f=__dirname+'/res_'+id+'.json'; if(!fs.existsSync(f)) continue; const r=JSON.parse(fs.readFileSync(f));
  const melhorou = r.melhor.lista.length && r.confMelhor > r.confBase+1;
  if(!melhorou && fs.existsSync(__dirname+'/'+ant+'/res_'+id+'.json')){ fs.copyFileSync(__dirname+'/'+ant+'/res_'+id+'.json', f); }
  else if(melhorou) console.log('nova estratégia:', id, r.confBase.toFixed(1),'→',r.confMelhor.toFixed(1));
}
