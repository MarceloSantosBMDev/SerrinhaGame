// Varredura em grade: para cada luta, % de vitória em k = 0.80..2.60; escolhe o k mais perto da meta.
const fs=require('fs'); const H=require('./historia_sim.js');
const META_TIPO={ tutorial:88, patrulha:80, comum:70, pico:58, chefe:45, final:40 };
const TIPO={ lab_contencao:'tutorial', lab_patrulha:'tutorial',
  patrulha_rua:'patrulha', patrulha_dupla:'patrulha', ultimo_recado_rua:'patrulha', c2_fiscal:'patrulha', c2_relogio_rua:'patrulha',
  cargas_apagao:'pico', cacadores:'pico', mensageiro:'pico', c2_tupas:'pico', c2_justica:'pico', irmaos_metal:'pico', prototipo00:'pico', eco:'pico',
  c2_jantar:'pico', c2_relogio_almas:'pico', c2_bones_frente:'pico', c2_represa:'pico', c2_cao:'pico',
  pr_torradeira:'pico', pr_semaforo:'pico', pr_aspirador:'pico', pr_guardachuva:'pico',
  tempo_absoluto:'final', colosso_orfao:'final', c2_rainha:'final' };
const tipo=id=> TIPO[id] || (H.LUT[id].chefe ? 'chefe' : 'comum');
const mod=k=>cfg=>{ const c=JSON.parse(JSON.stringify(cfg)); c.ajustes.inimigo=c.inimigos.map((_,i)=>{ const a=Object.assign({}, c.ajustes.inimigo[i]||{}); a.hpMult=k; a.danoMult=(a.danoMult||1)*k; return a; }); return c; };
const N=+(process.argv[2]||200), so=process.argv[3];
const out={};
for(const id in H.LUT){ if(so && !so.split(',').includes(id)) continue;
  const meta=META_TIPO[tipo(id)], curva=[];
  for(let k=0.80; k<=3.001; k+=0.05){ const kk=+k.toFixed(2); curva.push([kk, H.taxa(id,N,true,mod(kk))]); }
  // mais perto da meta; empate → k menor. Tolerância: dentro de 4 pontos conta como "acertou"
  let best=curva[0]; for(const p of curva){ const d=Math.abs(p[1]-meta), db=Math.abs(best[1]-meta); if(d<db-0.01 && !(db<=4 && p[0]>best[0])) best=p; }
  out[id]={ k:best[0], tipo:tipo(id), meta, antes:+H.taxa(id,N,true).toFixed(0), depois:+best[1].toFixed(0),
            curva:curva.map(p=>p[0]+':'+p[1].toFixed(0)).join(' ') };
  console.log(id.padEnd(22), tipo(id).padEnd(9), 'meta', meta, '| antes', out[id].antes+'%', '-> k', best[0], '->', out[id].depois+'%');
}
fs.writeFileSync(__dirname+'/grade_'+(so?'parcial':'todas')+'.json', JSON.stringify(out,null,1));
