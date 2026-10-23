// grava os números do ajuste.json direto no js/turndata.js e confere recarregando
const fs=require('fs'), vm=require('vm');
const ARQ=process.env.ARQ||require('path').join(__dirname,'..','..','js','turndata.js');
const AJ=JSON.parse(fs.readFileSync(__dirname+'/ajuste.json'));
const carregaTD=src=>{ const c={console,Math,JSON,localStorage:{getItem(){return null}}}; vm.createContext(c); vm.runInContext(src+';this.TD=TurnData;',c); return c.TD; };
let src=fs.readFileSync(ARQ,'utf8');
const TD0=carregaTD(src);
// valores alvo: mesma regra do aplicarAjuste do sim.js
const alvo=[]; // {id, nome, campo, de, para}
const vistos=new Set();
for(const id in AJ){ const f=TD0.ficha(id); if(!f) continue; const a=AJ[id];
  const mexe=(o,dono)=>{ if(!o||vistos.has(o)) return; vistos.add(o);
    const nome=o.nome||dono;
    if(o.dano>0) alvo.push({id,nome,campo:'dano',de:o.dano,para:Math.max(1,Math.round(o.dano*(a.d||1)))});
    if(o.cura>0) alvo.push({id,nome,campo:'cura',de:o.cura,para:Math.max(1,Math.round(o.cura*(a.c||1)))});
    if(a.b) for(const k of ['buff','buffEu']) if(o[k] && o[k].valor>0) alvo.push({id,nome,campo:k+'.valor',de:o[k].valor,para:Math.max(1,Math.round(o[k].valor*a.b))});
    if(o.escalaVida) alvo.push({id,nome,campo:'escalaVida',de:o.escalaVida,para:+(o.escalaVida*(a.d||1)).toFixed(3)});
    if(o.escalaDefesa) alvo.push({id,nome,campo:'escalaDefesa',de:o.escalaDefesa,para:+(o.escalaDefesa*(a.d||1)).toFixed(3)}); };
  f.skills.forEach(s=>{ mexe(s); if(s.formaOverride) Object.values(s.formaOverride).forEach(o=>mexe(o, s.nome)); });
}
// edição no texto: dentro do bloco da ficha, acha `nome:'X'` e troca o 1º `campo:<de>` do MESMO objeto
const blocoDe=id=>{ const i=src.indexOf('\n    '+id+':{'); if(i<0) return null; const m=/\n    [a-z_0-9]+:\{/g; m.lastIndex=i+5; const r=m.exec(src); const fimEst=src.indexOf('\n  };',i); return [i, r? Math.min(r.index, fimEst) : fimEst]; };
let falhas=[];
for(const t of alvo){
  if(t.de===t.para) continue;
  const [i0,i1]=blocoDe(t.id);
  let bloco=src.slice(i0,i1);
  const esc=t.nome.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const reNome=new RegExp("nome:(['\"])"+esc+"\\1");
  const mN=reNome.exec(bloco);
  if(!mN){ falhas.push(t); continue; }
  // o objeto termina no próximo "nome:'" ou no fim do bloco
  const resto=bloco.slice(mN.index+5); const prox=resto.search(/nome:['"]/); const fimObj= prox<0? bloco.length : mN.index+5+prox;
  const trecho=bloco.slice(mN.index, fimObj);
  // compara pelo VALOR (no código pode estar 0.10 e o valor é 0.1)
  let feito=false, novo;
  if(t.campo.includes('.')){ const [obj,c]=t.campo.split('.');
    const re=new RegExp('([{ ,])('+obj+':\\{[^}]*?\\b'+c+':)([0-9.]+)');
    novo=trecho.replace(re,(m,a,meio,num)=>{ if(Math.abs(parseFloat(num)-t.de)<1e-9){ feito=true; return a+meio+t.para; } return m; });
  } else {
  const re=new RegExp('([{ ,])'+t.campo+':([0-9.]+)(?![0-9.])','g');
  novo=trecho.replace(re, (m,a,num)=>{ if(!feito && Math.abs(parseFloat(num)-t.de)<1e-9){ feito=true; return a+t.campo+':'+t.para; } return m; }); }
  if(!feito){ falhas.push(t); continue; }
  bloco=bloco.slice(0,mN.index)+novo+bloco.slice(fimObj);
  src=src.slice(0,i0)+bloco+src.slice(i1);
}
// VIDA (botão 'h'): o primeiro "hp:N" do bloco da ficha
for(const id in AJ){ const a=AJ[id]; if(!a.h) continue; const f=TD0.ficha(id); const para=Math.round(f.hp*a.h); if(para===f.hp) continue;
  const [i0,i1]=blocoDe(id); const bloco=src.slice(i0,i1); const novo=bloco.replace(new RegExp('\\bhp:'+f.hp+'\\b'), 'hp:'+para);
  if(novo===bloco) falhas.push({id,campo:'hp'}); else { src=src.slice(0,i0)+novo+src.slice(i1); alvo.push({id,nome:'(ficha)',campo:'hp',de:f.hp,para}); } }
fs.writeFileSync(ARQ,src);
// confere
const TD1=carregaTD(src); let erradas=0; const v2=new Set();
for(const t of alvo){ const f=TD1.ficha(t.id); let achou=null;
  if(t.campo==='hp'){ if(f.hp!==t.para){ erradas++; console.log('CONFERIR hp', t.id); } continue; }
  if(t.campo.includes('.')){ const [obj,c]=t.campo.split('.'); f.skills.forEach(s=>{ [s].concat(Object.values(s.formaOverride||{}).map(o=>Object.assign({nome:s.nome},o))).forEach(o=>{ if(o.nome===t.nome && o[obj] && achou==null) achou=o[obj][c]; }); });
    if(achou!==t.para){ erradas++; console.log('CONFERIR', t.id, t.nome, t.campo, t.de, '→', t.para, 'ficou', achou); } continue; }
  f.skills.forEach(s=>{ [s].concat(Object.values(s.formaOverride||{}).map(o=>Object.assign({nome:s.nome},o))).forEach(o=>{ if((o.nome===t.nome) && o[t.campo]!=null && achou==null) achou=o[t.campo]; }); });
  if(achou!==t.para){ erradas++; console.log('CONFERIR', t.id, t.nome, t.campo, t.de, '→', t.para, 'ficou', achou); } }
console.log('trocas', alvo.filter(t=>t.de!==t.para).length, 'falhas de texto', falhas.length, 'conferência com erro', erradas);
falhas.forEach(t=>console.log('FALHOU', JSON.stringify(t)));
