// roda N batalhas com a IA do jogo (cada um com a estratégia gravada) em paralelo e imprime o winrate
const {execSync}=require('child_process'); const fs=require('fs');
const N=+(process.argv[2]||60000), P=10, tag=process.argv[3]||'M';
fs.readdirSync(__dirname).filter(f=>f.startsWith('torneio_'+tag)).forEach(f=>fs.unlinkSync(__dirname+'/'+f));
const cmds=[...Array(P).keys()].map(p=>`node torneio.js ${Math.round(N/P)} ${tag}${p} ${p+501} ia`).join(' & ');
execSync('('+cmds+' & wait)', {cwd:__dirname, shell:'bash', stdio:'ignore'});
const M={}; fs.readdirSync(__dirname).filter(f=>f.startsWith('torneio_'+tag)).forEach(f=>{ const d=JSON.parse(fs.readFileSync(__dirname+'/'+f)); for(const k in d.M){ M[k]=M[k]||{w:0,n:0}; M[k].w+=d.M[k].w; M[k].n+=d.M[k].n; } });
const r=Object.keys(M).map(k=>[k,100*M[k].w/M[k].n]).sort((a,b)=>b[1]-a[1]);
fs.writeFileSync(__dirname+'/meta_'+tag+'.json', JSON.stringify(Object.fromEntries(r)));
console.log(r.map(([k,v])=>k.padEnd(20)+v.toFixed(1)).join('\n'));
const vs=r.map(x=>x[1]); console.log('faixa', Math.min(...vs).toFixed(1),'-',Math.max(...vs).toFixed(1), ' desvio', Math.sqrt(vs.reduce((a,v)=>a+(v-50)**2,0)/vs.length).toFixed(2));
