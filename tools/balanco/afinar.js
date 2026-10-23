// laço de afinação: mede (meta.js) e escala os golpes de cada um rumo a 50%
const {execSync}=require('child_process'); const fs=require('fs');
const IT=+(process.argv[2]||6), K=+(process.argv[3]||0.9);
const AJ=fs.existsSync(__dirname+'/ajuste.json')? JSON.parse(fs.readFileSync(__dirname+'/ajuste.json')) : {};
// quem é de cura/suporte: cura escala junto com o dano
const SUPORTE=['loirinha_cdi','cabelin','fat_mango','crianca_rosa'];
for(let it=0; it<IT; it++){
  fs.writeFileSync(__dirname+'/ajuste.json', JSON.stringify(AJ,null,1));
  const out=execSync('node meta.js 60000 A', {cwd:__dirname}).toString();
  const meta=JSON.parse(fs.readFileSync(__dirname+'/meta_A.json'));
  const vs=Object.values(meta); const desvio=Math.sqrt(vs.reduce((a,v)=>a+(v-50)**2,0)/vs.length);
  console.log('rodada',it,'desvio',desvio.toFixed(2),'faixa',Math.min(...vs).toFixed(1),'-',Math.max(...vs).toFixed(1));
  for(const id in meta){
    const w=meta[id]; if(Math.abs(w-50)<0.8) continue;
    const a=AJ[id]=AJ[id]||{d:1};
    const passo=Math.max(-0.10, Math.min(0.10, K*(50-w)/100));
    const botao=a.botao||'d';   // 'd' dano dos golpes · 'b' valor dos buffs · 'h' vida
    if(botao==='b') a.b=+Math.max(0.3, Math.min(1.7, (a.b||1)*(1+passo*1.6))).toFixed(3);
    else if(botao==='h') a.h=+Math.max(0.7, Math.min(1.5, (a.h||1)*(1+passo*0.8))).toFixed(3);
    else a.d=+Math.max(0.55, Math.min(1.7, (a.d||1)*(1+passo))).toFixed(3);
    if(SUPORTE.includes(id) && botao==='d') a.c=+Math.max(0.6, Math.min(1.7, (a.c||1)*(1+passo))).toFixed(3);
  }
}
fs.writeFileSync(__dirname+'/ajuste.json', JSON.stringify(AJ,null,1));
console.log(execSync('node meta.js 60000 A', {cwd:__dirname}).toString());
console.log(JSON.stringify(AJ));
