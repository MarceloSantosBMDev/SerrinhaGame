/* ============================================================
   GOLPES SOB MEDIDA — a encenação que combina com o NOME do golpe
   ------------------------------------------------------------
   O turnui.js já encena todo golpe em atos (corre/bate, mira/atira,
   concentra) e o turnfx.js pinta o efeito do ELEMENTO. Isso aqui é a
   camada de cima: cada golpe ganha a sua cara. O "Croissant Bumerangue"
   joga um croissant que vai e volta, o "Atropelamento" traz o Astra
   passando por cima do time, o "Rifle de Pulso" é um tiro de rifle, a
   "Mordida" fecha os dentes no alvo, e assim por diante.

   Uma RECEITA por golpe (chave = nome sem acento, minúsculo, só letra
   e número). Todos os campos são opcionais:
     mov        jeito de se mexer do corpo a corpo:
                'salto' (voadora), 'giro' (rola o caminho todo),
                'giroGolpe' (gira no golpe), 'sombra' (some e aparece
                nas costas do alvo), 'atravessa' (passa através do alvo),
                'carro' (vira o Astra no caminho)
     origem(I)          no começo do golpe, em quem usou
     voo(I, al, o)      golpe de longe: o que voa até UM alvo. Devolve
                        true se desenhou (aí o projétil padrão não sai).
                        o = { sx, sy, vida (quadros até o impacto), k (nº do alvo), i (nº do disparo) }
     vooUm(I, o)        golpe de longe em ÁREA com UM objeto só (a granada
                        no meio do time, a moeda ricocheteando)
     impacto(I, al, g)  em cada golpe que pegou (g.ultimo = o último)
     quadro(I, t)       todo quadro da encenação
     movAtacante(I, t, base) → {dx,dy,rot,alpha,sx,pose,prog} — troca o
                        movimento de quem bate (o COLAPSO pulando lá do alto)
     semCorte           tira o arco de corte padrão do corpo a corpo
   `I` (montado pelo turnui) = { ev, a, o (centro de quem usou), h (altura
   dele na tela), lado (pra que lado ele bate: 1/-1), cor, sup, alvos,
   R, altura(pos), pe(pos), atk (onde quem bate está AGORA), charId }

   Golpe sem receita própria ainda ganha alguma coisa pela PALAVRA do
   nome (soco, chute, tapa, mordida...) — ver `porPalavra`.
   ============================================================ */
const TurnGolpes = (function(){

  const F = TurnFX;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const escolhe=l=>l[(Math.random()*l.length)|0];
  const norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');

  /* ============================================================
     OBJETOS EM PIXEL ART
     Cada letra é uma cor da paleta, '.' é transparente. Assado UMA vez
     num canvas pequeno (1 px por letra) e ampliado sem suavizar na hora
     de desenhar — fica com a mesma cara de pixel art do resto.
     A paleta pode ser trocada na chamada (`obj('punho', {b:'#5ad6ff'})`).
     ============================================================ */
  const OBJ = {
    croissant:{ pal:{a:'#7a3e0e', b:'#e0a040', c:'#ffd27a'}, px:[
      '......aaaa......',
      '....aabbbbaa....',
      '..aabbcbbcbbaa..',
      '.abbcbbabbcbbba.',
      'abbcbba..abbcbba',
      'abbba......abbba',
      '.aba........aba.',
      '..a..........a..' ]},
    pao:{ pal:{a:'#6e3c12', b:'#d79a46', c:'#f5d08a'}, px:[
      '..aaaaaaaaaaaaaa..',
      '.abbbcbbbbcbbbbba.',
      'abbcbbbbcbbbbcbbba',
      'abbbbbbbbbbbbbbbba',
      '.abbbbbbbbbbbbbba.',
      '..aaaaaaaaaaaaaa..' ]},
    granada:{ pal:{a:'#16200e', b:'#4a6a2a', c:'#8aaa5a', d:'#c8c8c8', e:'#ffe066'}, px:[
      '...ddd...',
      '..d.ed...',
      '..aaaa...',
      '.abbbba..',
      'abcbbbba.',
      'abbbbbba.',
      'abbcbbba.',
      'abbbbbba.',
      '.abbbba..',
      '..aaaa...' ]},
    moeda:{ pal:{a:'#7a4e00', b:'#ffcf3a', c:'#fff3b0'}, px:[
      '..aaaa..',
      '.abbbba.',
      'abccbbba',
      'abcbbbba',
      'abbbbcba',
      'abbbbcba',
      '.abbbba.',
      '..aaaa..' ]},
    bolsa:{ pal:{a:'#3a0a1a', b:'#ff5fa2', c:'#ffb0d0', d:'#ffe066'}, px:[
      '...aaaaaa...',
      '..a......a..',
      '..a......a..',
      '.aaaaaaaaaa.',
      'abbbbbbbbbba',
      'abccbbbbbbba',
      'abbbbddbbbba',
      'abbbbddbbbba',
      'abbbbbbbbbba',
      'abbbbbbbbbba',
      '.aaaaaaaaaa.' ]},
    bombom:{ pal:{a:'#5a1030', b:'#ff4d8a', c:'#ffd0e0', d:'#ffe066'}, px:[
      'aa...aaaaaa...aa',
      'ada.abbbbbba.ada',
      'addaabccbbbaadda',
      'adddabcbbbbaddda',
      'addaabbbbbbaadda',
      'ada.abbbbbba.ada',
      'aa...aaaaaa...aa' ]},
    ursinho:{ pal:{a:'#3a1a0a', b:'#c08850', c:'#1a0a00', d:'#ecd0a8', e:'#ff5fa2'}, px:[
      '.aa......aa.',
      'abba....abba',
      'abbaaaaaabba',
      '.abbbbbbbba.',
      'abbcbbbbcbba',
      'abbbbddbbbba',
      'abbbdccdbbba',
      '.abbbddbbba.',
      '..aeeaaeea..',
      '.abbbbbbbba.',
      'abbbddddbbba',
      'abbbddddbbba',
      '.aaa....aaa.' ]},
    pizza:{ pal:{a:'#7a3a10', b:'#d08a3a', c:'#ffd23a', d:'#d02a1a'}, px:[
      'aaaaaaaaaaaa',
      'abbbbbbbbbba',
      '.acccdcccca.',
      '.acdccccdca.',
      '..acccdcca..',
      '..accdccca..',
      '...acccca...',
      '...acdcca...',
      '....acca....',
      '....acca....',
      '.....aa.....' ]},
    coxinha:{ pal:{a:'#7a4010', b:'#e0a030', c:'#ffd27a'}, px:[
      '....aa....',
      '...abba...',
      '...abba...',
      '..abbbba..',
      '..abcbba..',
      '.abcbbbba.',
      '.abbbbbba.',
      'abbbbbbbba',
      'abbbbbbbba',
      'abbbbbbbba',
      '.abbbbbba.',
      '..aaaaaa..' ]},
    hamburguer:{ pal:{a:'#6a3a10', b:'#e0a040', c:'#fff3c0', d:'#5ad13a', e:'#ffd23a', f:'#5a2a0a'}, px:[
      '...aaaaaa...',
      '.aabbbbbbaa.',
      'abbcbbbcbbba',
      'abbbbcbbbbba',
      'dddddddddddd',
      'eeeeeeeeeeee',
      'ffffffffffff',
      'abbbbbbbbbba',
      '.aaaaaaaaaa.' ]},
    lasanha:{ pal:{a:'#7a3010', b:'#ffcf5a', c:'#fff0a0', d:'#c8461e', e:'#aab8c4', f:'#ffffff'}, px:[
      '...aaaaaaaa...',
      '..abcbbcbbca..',
      '..adddddddda..',
      '..abbbbbbbba..',
      '..adddddddda..',
      '..abcbbcbbca..',
      '.eeeeeeeeeeee.',
      'eeffffffffffee',
      '.eeeeeeeeeeee.' ]},
    labios:{ pal:{a:'#7a0a2a', b:'#ff3a6a', c:'#ff9ab0'}, px:[
      '..aa....aa..',
      '.abba..abba.',
      'abbbbaabbbba',
      'abbbbbbbbbba',
      '.abbcccbbba.',
      '..abbbbbba..',
      '....aaaa....' ]},
    // punho fechado de lado, olhando pra direita: dedos dobrados (vincos) e o dedão por baixo
    punho:{ pal:{a:'#10202a', b:'#cfd8e0', c:'#7a8a96', d:'#ffffff'}, px:[
      '....aaaaaaa.',
      '...addbbbbba',
      '..adbbcbcbba',
      'aaabbbcbcbba',
      'abbbbbcbcbba',
      'abbbbbcbcbba',
      'abbaaaaaabba',
      'abbbddddbbba',
      '.aabbbbbbba.',
      '...aaaaaaa..' ]},
    mao:{ pal:{a:'#5a3a1a', b:'#f0c090'}, px:[
      '...a.a.a..',
      '..abababa.',
      '..abababa.',
      'a.abababa.',
      'abaabbbba.',
      'abbabbbba.',
      '.abbbbbba.',
      '..abbbbba.',
      '..abbbbba.',
      '...abbba..',
      '...aaaaa..' ]},
    caveira:{ pal:{a:'#1a2a10', b:'#e8f0d8', c:'#1a2a10'}, px:[
      '..aaaaaa..',
      '.abbbbbba.',
      'abbbbbbbba',
      'abccbbccba',
      'abccbbccba',
      'abbbbbbbba',
      '.abbccbba.',
      '..abbbba..',
      '..ab.b.a..',
      '...aaaa...' ]},
    nota:{ pal:{a:'#ff5fa2', b:'#ffd6ea'}, px:[
      '...aaa.',
      '...abba',
      '...a.ba',
      '...a...',
      '...a...',
      '.aaa...',
      'abbba..',
      'abbba..',
      '.aaa...' ]},
    relogio:{ pal:{a:'#2a5a7a', b:'#e8fdff', c:'#1a2a3a', d:'#7df0ff'}, px:[
      '....ddd....',
      '...aaaaa...',
      '..abbbbba..',
      '.abbbcbbba.',
      'abbbbcbbbba',
      'abbbbcbbbba',
      'abbbbcccbba',
      'abbbbbbbbba',
      '.abbbbbbba.',
      '..abbbbba..',
      '...aaaaa...' ]},
    balao:{ pal:{a:'#3a0a2a', b:'#ffffff', c:'#ff5fa2'}, px:[
      '.aaaaaaaaaa.',
      'abbbbbbbbbba',
      'abbcbbbbcbba',
      'abbcbbbbcbba',
      'abbcbbbbcbba',
      'abbbbbbbbbba',
      'abbcbbbbcbba',
      '.aaaaaaaaaa.',
      '..aba.......',
      '..aa........' ]},
    olho:{ pal:{a:'#2a0a3a', b:'#f0e0ff', c:'#a24bff', d:'#1a0028'}, px:[
      '...aaaaaa...',
      '.aabbbbbbaa.',
      'abbbcccbbbba',
      'abbcdddcbbba',
      'abbbcccbbbba',
      '.aabbbbbbaa.',
      '...aaaaaa...' ]},
    presa:{ pal:{a:'#2a4a1a', b:'#f0fff0', c:'#9cff5e'}, px:[
      'aaaaa',
      'abbba',
      'abbba',
      'abbba',
      '.abba',
      '.abba',
      '.aba.',
      '..ca.',
      '..c..' ]},
    pedra:{ pal:{a:'#3a2a1a', b:'#8a6a3a', c:'#caa66a'}, px:[
      '...aaaa...',
      '..abbbba..',
      '.abcbbbbaa',
      'abbbbbbbba',
      'abbbbbcbba',
      'abbbbbbbba',
      '.abbbbbba.',
      '..aaaaaa..' ]},
    queijo:{ pal:{a:'#8a6010', b:'#ffd23a', c:'#e0a020'}, px:[
      '........aaaa',
      '.....aaabbba',
      '..aaabbbbbba',
      'aabbbbcbbbba',
      'abbcbbbbbbba',
      'abbbbbbbcbba',
      'abbbbbbbbbba',
      'aaaaaaaaaaaa' ]},
    coracao:{ pal:{a:'#7a0a3a', b:'#ff5fa2', c:'#ffd6ea'}, px:[
      '.aa...aa.',
      'abba.abba',
      'abcbabbba',
      'abbbbbbba',
      '.abbbbba.',
      '..abbba..',
      '...aba...',
      '....a....' ]},
    gota:{ pal:{a:'#7a5a00', b:'#ffcf3a', c:'#fff3b0'}, px:[
      '..a..',
      '.aba.',
      '.aba.',
      'abcba',
      'abbba',
      '.aaa.' ]},
    bala:{ pal:{a:'#1a1420', b:'#5a5068', c:'#ffffff'}, px:[
      '.aaaa.',
      'abbcba',
      'abbbba',
      '.aaaa.' ]},
    caixa:{ pal:{a:'#5a3a1a', b:'#d0a060', c:'#d02a1a', d:'#ffffff'}, px:[
      'aaaaaaaaaaaa',
      'abbbbbbbbbba',
      'abbccccccbba',
      'abbcddddcbba',
      'abbccccccbba',
      'abbbbbbbbbba',
      'aaaaaaaaaaaa' ]},
    estrela:{ pal:{a:'#8a6a00', b:'#ffe066', c:'#ffffff'}, px:[
      '....a....',
      '...aba...',
      'aaabcbaaa',
      '.abbcbba.',
      '..abbba..',
      '.abbabba.',
      '.aa...aa.' ]}
  };
  const cacheObj={};
  function obj(nome, pal){
    const k=nome+(pal? JSON.stringify(pal) : '');
    if(cacheObj[k]) return cacheObj[k];
    const def=OBJ[nome]; if(!def) return null;
    const cores=Object.assign({}, def.pal, pal||{});
    const h=def.px.length, w=Math.max.apply(null, def.px.map(r=>r.length));
    // 1 px de folga em volta pro CONTORNO BRANCO ("adesivo"): sem ele o
    // croissant marrom sumia na frente do muro de tijolo do castelo
    const c=document.createElement('canvas'); c.width=w+2; c.height=h+2;
    const g=c.getContext('2d');
    const cheio=(x,y)=>{ const l=def.px[y]; return !!(l && x>=0 && x<l.length && l[x]!=='.' && cores[l[x]]); };
    g.fillStyle='rgba(255,255,255,0.85)';
    for(let y=-1;y<=h;y++) for(let x=-1;x<=w;x++)
      if(!cheio(x,y) && (cheio(x-1,y)||cheio(x+1,y)||cheio(x,y-1)||cheio(x,y+1))) g.fillRect(x+1,y+1,1,1);
    def.px.forEach((linha,y)=>{ for(let x=0;x<linha.length;x++){ const ch=linha[x]; if(ch==='.'||!cores[ch]) continue; g.fillStyle=cores[ch]; g.fillRect(x+1,y+1,1,1); } });
    cacheObj[k]=c;
    return c;
  }

  // PNGs prontos do projeto (os carros de lado do mundo aberto)
  const cachePng={};
  function png(src){
    if(cachePng[src]) return cachePng[src];
    const im=new Image(); im.src=src; cachePng[src]=im; return im;
  }
  const ASTRA = ()=>({ dir:png('modohistoria/assets/veiculos/astra_dir.png'), esq:png('modohistoria/assets/veiculos/astra_esq.png') });
  const CORSA = ()=>({ dir:png('modohistoria/assets/veiculos/corsa_dir.png'), esq:png('modohistoria/assets/veiculos/corsa_esq.png') });
  function preload(){ ASTRA(); CORSA(); }

  /* ---------------- atalhos de cena ---------------- */
  const cab = (I,al)=> al.pos.y - I.altura(al.pos)*0.42;          // cabeça do alvo
  const hA  = (I,al)=> I.altura(al.pos);
  const dirDe = (I,al)=> al.pos.x>=I.o.x ? 1 : -1;
  // altura do objeto proporcional ao tamanho do lutador na tela
  const tam = (I, k)=> Math.max(18, I.h*(k||0.3)*1.7);
  // estilhaços de uma cor só
  function lascas(x,y,cores,n,forca){
    const d=F.desenho; n=n||10; forca=forca||1;
    for(let i=0;i<n;i++) d.faisca(x,y,escolhe(cores), rnd(-3.5,3.5)*forca, rnd(-4.5,-1)*forca, rnd(18,30), escolhe([3,4,6]), 0.28);
  }
  // vapor/fumaça subindo (lasanha quente, molho, pistão)
  function vapor(x,y,n,cor){
    const d=F.desenho; n=n||6;
    for(let i=0;i<n;i++) d.faisca(x+rnd(-12,12), y+rnd(-4,6), cor||'#f0f0f0', rnd(-0.3,0.3), rnd(-1.4,-0.6), rnd(26,40), escolhe([6,8]), -0.01, 3, 0.99);
  }
  // chuva de objetos caindo do alto da tela em cima de (x, yAlvo)
  function cai(img, x, yAlvo, alt, atraso, vida){
    vida=vida||18;
    const y0=-30, vy=(yAlvo-y0)/vida;
    F.objeto(img, x, y0, { alt, vida, vy, vrot:rnd(-0.2,0.2), atraso:atraso||0 });
  }
  // a mão que aparece batendo na cara (tapa) — vem de lado e some
  function tapa(I, al, cor, txt){
    const d=dirDe(I,al), y=cab(I,al)+hA(I,al)*0.12;
    F.objeto(obj('mao'), al.pos.x-d*hA(I,al)*0.35, y, { alt:tam(I,0.32), vida:10, vx:d*4, rot:d*0.6, vrot:d*0.12, espelha:d<0 });
    F.onomato(txt||'SLAP!', al.pos.x+d*10, y-hA(I,al)*0.3, cor||'#ff5fa2', 16);
  }
  // punho fantasma acertando (combo, rajada)
  function punhoNoAlvo(I, al, pal, n){
    const d=dirDe(I,al), h=hA(I,al);
    for(let i=0;i<(n||1);i++){
      const ox=rnd(-h*0.18,h*0.18), oy=rnd(-h*0.3,h*0.15);
      F.objeto(obj('punho', pal), al.pos.x-d*h*0.3+ox, al.pos.y+oy, { alt:tam(I,0.26), vida:9, vx:d*5, espelha:d<0, atraso:i*2, de:0.7, ate:1.2 });
    }
  }
  // fantasmas (almas) indo do alvo pra quem drenou
  function almas(I, al, cor, n){
    for(let i=0;i<(n||4);i++){
      const ox=rnd(-14,14), oy=rnd(-20,10);
      F.forma(28+i*3, (p,f)=>{
        const k=Math.min(1,f/(24+i*3)), x=al.pos.x+ox+(I.o.x-al.pos.x-ox)*k, y=al.pos.y+oy+(I.o.y-al.pos.y-oy)*k-Math.sin(k*Math.PI)*30;
        F.desenho.disco(x,y,5,cor||'#c46bff',0.8*p); F.desenho.disco(x-1,y-1,2,'#ffffff',p);
      });
    }
  }
  const ultimoAlvo = (I,al)=> !I.alvos.length || al===I.alvos[I.alvos.length-1];
  // centro do grupo de alvos (granada no meio do time)
  function centro(I){
    if(!I.alvos.length) return { x:I.o.x+I.lado*120, y:I.o.y };
    let x=0,y=0; I.alvos.forEach(al=>{ x+=al.pos.x; y+=al.pos.y; });
    return { x:x/I.alvos.length, y:y/I.alvos.length };
  }

  /* ============================================================
     AS RECEITAS
     ============================================================ */
  const R = {};
  const def=(nomes, rec)=>{ (Array.isArray(nomes)?nomes:[nomes]).forEach(n=>{ R[norm(n)]=rec; }); };

  /* ---------------- FAT SMERG ---------------- */
  def('Provocar Fúria', {
    origem:I=>{ F.onomato('GRRR!', I.o.x, I.o.y-I.h*0.62, '#ff4d6d', 14); F.nuvem(I.o.x, I.o.y-I.h*0.45, 12, '#ff4d6d', 22); },
    impacto:(I,al,g)=>{ if(!g.ultimo) return; F.onomato('POW!', al.pos.x, cab(I,al)-10, '#ff4d6d', 18); }
  });
  def('Terremoto', { varre:'x',
    origem:I=>{ F.onomato('KRAKOOM!', I.o.x+I.lado*40, I.o.y-I.h*0.55, '#caa66a', 15); F.tremer(6, 30); },
    vooUm:(I,o)=>{
      // a rachadura corre do pé dele até o time inimigo; as pedras saltam na chegada
      const y=I.pe(I.o), ult=I.alvos[I.alvos.length-1].pos;
      F.rachadura(I.o.x, ult.x+I.lado*30, y, '#1a0f08', o.vida+40, o.vida);
      F.ondaChao(I.o.x, y, '#caa66a', 40, 24);
      return true;
    },
    voo:()=>true,
    impacto:(I,al,g)=>{
      const y=I.pe(al.pos);
      for(let i=0;i<4;i++) F.objeto(obj('pedra'), al.pos.x+rnd(-20,20), y-4, { alt:tam(I,0.16), vida:30, vx:rnd(-2,2), vy:rnd(-7,-4), grav:0.45, vrot:rnd(-0.3,0.3) });
      F.espinhos(al.pos.x, y, hA(I,al)*0.7, '#8a6a3a', 26);
    }
  });
  def('Postura de Rocha', {
    impacto:(I,al)=>{
      const h=hA(I,al);
      for(let i=0;i<8;i++){ const an=i*Math.PI/4, r=h*0.7;
        F.forma(18, (p,f)=>{ const k=Math.min(1,f/16); F.desenho.desenhaImg(obj('pedra'), al.pos.x+Math.cos(an)*r*(1-k), al.pos.y+Math.sin(an)*r*0.6*(1-k), tam(I,0.14), f*0.2, 1); }); }
      F.escudo(al.pos.x, al.pos.y, h, '#caa66a'); F.onomato('ROCHA!', al.pos.x, cab(I,al)-14, '#caa66a', 13);
    }
  });
  def('COLAPSO', {
    origem:I=>{ F.onomato('COLAPSO!', I.o.x, I.o.y-I.h*0.7, '#ffb03c', 16); },
    // ele PULA pra fora da tela e cai em cima do time inimigo
    movAtacante:(I,t,b)=>{
      const f=I.f, c=centro(I), sobeIni=f.CARGA, sobeFim=f.W, cai=f.W+f.VOO;
      if(t<sobeIni) return null;
      if(t<sobeFim){ const k=(t-sobeIni)/Math.max(1,sobeFim-sobeIni); return { dx:0, dy:-k*k*(I.o.y+I.h*1.2), pose:'jump' }; }
      if(t<cai){ const k=(t-sobeFim)/Math.max(1,cai-sobeFim); return { dx:c.x-I.o.x, dy:-(1-k*k)*(c.y+I.h*1.2)+(c.y-I.o.y)*k*k, pose:I.a.pose, prog:1 }; }
      const k=Math.min(1,(t-cai)/Math.max(1,I.a.dur-cai));
      return { dx:(c.x-I.o.x)*(1-k), dy:(c.y-I.o.y)*(1-k)-Math.sin(k*Math.PI)*40, pose:k<0.9?'jump':'idle' };
    },
    voo:()=>true,
    vooUm:(I,o)=>{
      // sombra crescendo no chão onde ele vai cair
      const c=centro(I), y=I.pe({x:c.x,y:c.y,h:I.h/0.8});
      F.forma(o.vida, (p)=>{ F.desenho.ctx.save(); F.desenho.ctx.globalAlpha=0.5*(1-p); F.desenho.ctx.fillStyle='#000';
        F.desenho.ctx.beginPath(); F.desenho.ctx.ellipse(c.x, y, 30+(1-p)*60, 8+(1-p)*12, 0, 0, Math.PI*2); F.desenho.ctx.fill(); F.desenho.ctx.restore(); });
      F.forma(o.vida+1, ()=>{}, ()=>{
        F.quadroImpacto(3); F.tremer(14, 30);
        F.rachadura(c.x-140, c.x+140, y, '#1a0f08', 60);
        F.onomato('BOOOM!', c.x, c.y-I.h*0.7, '#ffb03c', 22);
        for(let i=0;i<10;i++) F.objeto(obj('pedra'), c.x+rnd(-60,60), y-6, { alt:tam(I,0.18), vida:36, vx:rnd(-4,4), vy:rnd(-9,-5), grav:0.45, vrot:rnd(-0.3,0.3) });
      });
      return true;
    }
  });
  def('Smergulite Aguda', {
    origem:I=>{ F.onomato('ATCHIM!', I.o.x+I.lado*18, I.o.y-I.h*0.5, '#7df0ff', 13); },
    voo:(I,al,o)=>{
      F.forma(o.vida, (p,f)=>{ const k=1-p, x=o.sx+(al.pos.x-o.sx)*k, y=o.sy+(al.pos.y-o.sy)*k-Math.sin(k*Math.PI)*24;
        for(let i=0;i<4;i++) F.desenho.disco(x+Math.sin(f*0.3+i*2)*6, y+Math.cos(f*0.3+i*2)*4, 7-i, i%2?'#7df0ff':'#9cff5e', 0.55); });
      return true;
    },
    impacto:(I,al)=>{ F.nuvem(al.pos.x, al.pos.y, 22, '#7df0ff', 36, '#9cff5e'); }
  });

  /* ---------------- STRONG SMERG ---------------- */
  def('Jab Duplo', { impacto:(I,al,g)=>{ punhoNoAlvo(I,al,null,1); F.onomato(g.ultimo?'JAB!':'PÁ!', al.pos.x+rnd(-12,12), cab(I,al)-8, '#ffe066', 13); } });
  def('Descarga', {
    voo:(I,al,o)=>{ F.forma(o.vida, (p,f)=>{ const k=Math.min(1,(1-p)*1.4), d=F.desenho;
      if(f%3===2) return; const pts=d.zigue(o.sx,o.sy,o.sx+(al.pos.x-o.sx)*k,o.sy+(al.pos.y-o.sy)*k,16);
      d.linhaPx(pts,'#ffe066',10,0.3); d.linhaPx(pts,'#fff7c2',4,1); }); return true; },
    impacto:(I,al)=>{ F.onomato('ZAP!', al.pos.x, cab(I,al)-6, '#ffe066', 16); F.anel(al.pos.x, al.pos.y, '#ffe066', 10, 14); }
  });
  def('Foco Veloz', {
    quadro:(I,t)=>{ if(t%4===0 && t<I.f.D) F.rastroVelocidade(I.o.x, I.o.y, t%8?1:-1, '#7df0ff', I.h); },
    impacto:(I,al)=>{ F.onomato('ZUUM!', al.pos.x, cab(I,al)-12, '#7df0ff', 13); }
  });
  def('RAJADA DE FÚRIA', {
    impacto:(I,al,g)=>{ punhoNoAlvo(I,al,{b:'#ffe066',c:'#c89a20',d:'#ffffff'},3); F.onomato(escolhe(['POW!','BAM!','PÁ!','TUM!']), al.pos.x+rnd(-20,20), cab(I,al)-rnd(0,24), '#ffb03c', g.ultimo?20:14);
      if(g.ultimo) F.quadroImpacto(2); }
  });

  /* ---------------- SERRINHA ---------------- */
  def(['Mordida','Mordida Podre'], {
    impacto:(I,al,g)=>{ if(!g.ultimo) return; const podre=I.ev.skill.tipo==='veneno';
      F.mordida(al.pos.x, al.pos.y-hA(I,al)*0.1, podre?'#2a4a1a':'#3a0a10', hA(I,al));
      F.onomato('CHOMP!', al.pos.x, cab(I,al)-12, podre?'#9cff5e':'#ff4d6d', 15); }
  });
  def('Rolamento', { mov:'giro', impacto:(I,al)=>{ F.onomato('TUM!', al.pos.x, cab(I,al)-6, '#d8dde3', 13); } });
  def('Presas Tóxicas', {
    voo:(I,al,o)=>{ for(let i=0;i<2;i++) F.voa(obj('presa'), o.sx, o.sy+(i?8:-8), al.pos.x, al.pos.y+(i?8:-8), o.vida, { alt:tam(I,0.16), arco:10, rastro:'#9cff5e' }); return true; },
    impacto:(I,al)=>{ F.mordida(al.pos.x, al.pos.y-hA(I,al)*0.1, '#2a4a1a', hA(I,al)*0.8); }
  });
  def('FÚRIA CANINA', {
    origem:I=>{ F.onomato('AUUUU!', I.o.x, I.o.y-I.h*0.7, '#c46bff', 16); F.nuvem(I.o.x, I.o.y, 26, '#4a1f70', 40, '#c46bff'); },
    impacto:(I,al,g)=>{ F.garras(al.pos.x, al.pos.y, '#c46bff', dirDe(I,al), hA(I,al)/90*1.2); if(g.ultimo) almas(I, al, '#c46bff', 5); }
  });

  /* ---------------- FAT MANGO ---------------- */
  def('Pancada de Pão', {
    impacto:(I,al,g)=>{ if(!g.ultimo) return; const d=dirDe(I,al);
      F.objeto(obj('pao'), al.pos.x-d*hA(I,al)*0.15, cab(I,al)+6, { alt:tam(I,0.13), vida:12, rot:-d*1.2, vrot:d*0.2, espelha:d<0 });
      lascas(al.pos.x, cab(I,al)+10, ['#d79a46','#f5d08a','#6e3c12'], 12);
      F.onomato('PLAFT!', al.pos.x, cab(I,al)-14, '#f5d08a', 15); }
  });
  def('Croissant Bumerangue', { varre:'caminho',
    // UM croissant: vai, varre o time e VOLTA pra mão dele
    voo:()=>true,
    vooUm:(I,o)=>{
      // os alvos já vêm na ordem em que ele passa (o turnui ordenou e marcou a hora de cada um)
      const pts=I.alvos.map(al=>({x:al.pos.x, y:al.pos.y}));
      const fimP=pts.pop()||{x:I.o.x+I.lado*200,y:I.o.y};
      F.voa(obj('croissant'), o.sx, o.sy, fimP.x, fimP.y, o.vida, { alt:tam(I,0.2), giro:0.45, arco:26, volta:Math.round(o.vida*1.1), pontos:pts, fantasmas:3 });
      return true;
    },
    impacto:(I,al)=>{ lascas(al.pos.x, al.pos.y, ['#e0a040','#ffd27a'], 8); F.onomato('TOIN!', al.pos.x, cab(I,al)-6, '#ffd27a', 12); }
  });
  def('Forno Aceso', {
    origem:I=>{ F.onomato('FOOOM!', I.o.x+I.lado*24, I.o.y-I.h*0.55, '#ff7a3c', 15);
      F.forma(30,(p,f)=>{ F.desenho.disco(I.o.x+I.lado*20, I.o.y, 18+Math.sin(f*0.5)*3, '#ff7a3c', 0.35*p); }); },
    impacto:(I,al)=>{ F.pilar(al.pos.x, I.pe(al.pos), hA(I,al), '#ff7a3c', 26, true); }
  });
  def('BANQUETE', {
    impacto:(I,al)=>{
      const comidas=['croissant','pao','coxinha','pizza','hamburguer'];
      for(let i=0;i<4;i++) cai(obj(escolhe(comidas)), al.pos.x+rnd(-22,22), al.pos.y-rnd(0,20), tam(I,0.2), i*4, 16);
      F.onomato('NHAM!', al.pos.x, cab(I,al)-16, '#7dff8a', 14);
    }
  });
  def('CORSA BLINDADO', {
    // o Corsa em si chega pelo TurnBG (é estrutura do campo); aqui é a buzina
    impacto:(I,al)=>{ if(al!==I.alvos[0]) return;
      const p=TurnBG.posEstruturaTela && TurnBG.posEstruturaTela(I.ladoTela(I.ev.time));
      if(p) F.forma(26, ()=>{}, ()=>F.onomato('BI-BI!', p.x, p.y-p.alt, '#ffe066', 15)); }
  });

  /* ---------------- MECAS ---------------- */
  def('Combo Cibernético', { impacto:(I,al,g)=>{ punhoNoAlvo(I,al,null,1); lascas(al.pos.x, al.pos.y, ['#cfd8e0','#ffe066','#ffffff'], 6); F.onomato(g.ultimo?'KLANG!':'TUM!', al.pos.x, cab(I,al)-8, '#cfd8e0', 13); } });
  def('Combo Hidráulico', {
    impacto:(I,al,g)=>{ punhoNoAlvo(I,al,{b:'#9aa8b4'},1); vapor(I.atk.x, I.atk.y-I.h*0.1, 6); F.onomato(g.ultimo?'PSSH-POW!':'TUM!', al.pos.x, cab(I,al)-8, '#cfd8e0', 12); }
  });
  def('PUNHOS 5000Z', {
    voo:(I,al,o)=>{ F.voa(obj('punho',{a:'#0a2a3a', b:'#5ad6ff', c:'#2a8ab0', d:'#e8fdff'}), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.24), arco:4, rastro:'#5ad6ff', fantasmas:4, espelha:al.pos.x<o.sx }); return true; },
    impacto:(I,al,g)=>{ F.anel(al.pos.x, al.pos.y, '#5ad6ff', 8, 12); F.onomato(g.ultimo?'POW!':'PÁ!', al.pos.x+rnd(-14,14), cab(I,al)-rnd(0,16), '#5ad6ff', g.ultimo?18:13); }
  });
  def(['Arsenal','Arsenal Duplo'], {
    voo:()=>true,
    vooUm:(I,o)=>{
      const c=centro(I), duas=norm(I.ev.skill.nome)==='arsenalduplo';
      F.voa(obj('granada'), o.sx, o.sy, c.x, c.y, o.vida, { alt:tam(I,0.16), giro:0.35, arco:60 });
      if(duas) F.voa(obj('granada'), o.sx, o.sy-6, c.x+30, c.y+10, o.vida, { alt:tam(I,0.16), giro:-0.3, arco:44 });
      F.onomato('TUNK!', o.sx, o.sy-20, '#c8c8c8', 11);
      return true;
    },
    impacto:(I,al,g)=>{ if(g.ultimo && ultimoAlvo(I,al)) F.onomato('KABOOM!', centro(I).x, centro(I).y-I.h*0.6, '#ffb03c', 18); }
  });
  def('RIFLE DE PULSO', {
    voo:(I,al,o)=>{
      // carrega no cano e solta o feixe no instante certo
      F.forma(Math.max(2,o.vida-6), (p,f)=>{ F.desenho.disco(o.sx, o.sy, 3+f*0.6, '#5ad6ff', 0.6+0.3*Math.sin(f)); });
      F.forma(Math.max(1,o.vida-6), ()=>{}, ()=>{ F.feixeGrosso(o.sx, o.sy, al.pos.x, al.pos.y, '#5ad6ff', Math.max(6,I.h*0.07), 18); F.onomato('PEW!', o.sx, o.sy-22, '#5ad6ff', 13); });
      return true;
    },
    impacto:(I,al)=>{ F.anel(al.pos.x, al.pos.y, '#e8fdff', 6, 12); }
  });
  def(['Criogenia','Criogenia Mk-II','NITROGÊNIO LÍQUIDO'], {
    voo:(I,al,o)=>{
      const forte = norm(I.ev.skill.nome)!=='criogenia', nitro = norm(I.ev.skill.nome)==='nitrogenioliquido';
      F.forma(o.vida+8, (p,f)=>{ const d=F.desenho;
        for(let i=0;i<(forte?5:3);i++){ const k=Math.random()*Math.min(1,f/o.vida);
          d.faisca(o.sx+(al.pos.x-o.sx)*k, o.sy+(al.pos.y-o.sy)*k+rnd(-8,8)*k, nitro? escolhe(['#ffffff','#e8fdff']) : escolhe(['#7df0ff','#e8fdff']), rnd(-0.5,0.5), rnd(-0.6,0.3), 14, escolhe(nitro?[6,8]:[4,6]), 0, nitro?3:7); }
      });
      return true;
    },
    impacto:(I,al)=>{ F.cristais(al.pos.x, I.pe(al.pos), hA(I,al), '#7df0ff', 50); F.onomato('KRSSH!', al.pos.x, cab(I,al)-14, '#7df0ff', 13); }
  });
  def(['PROTOCOLO 5000Z','PROTOCOLO 5000Z — TOTAL'], {
    origem:I=>{ F.circuloMagico(I.o.x, I.pe(I.o), I.h*0.7, '#5ad6ff', 60); },
    voo:(I,al,o)=>{ F.forma(Math.max(1,o.vida-4), ()=>{}, ()=>F.feixeGrosso(o.sx, o.sy, al.pos.x, al.pos.y, '#5ad6ff', Math.max(9,I.h*0.11), 22)); return true; },
    impacto:(I,al)=>{ if(norm(I.ev.skill.nome).indexOf('total')>=0) F.pilar(al.pos.x, I.pe(al.pos), hA(I,al), '#5ad6ff', 30);
      F.onomato('ZZAAAP!', al.pos.x, cab(I,al)-10, '#5ad6ff', 14); }
  });
  def('CANHÃO DE PLASMA', {
    voo:(I,al,o)=>{ if(o.k===0) F.forma(o.vida, (p,f)=>{ const c=centro(I), k=1-p, x=o.sx+(c.x-o.sx)*k, y=o.sy+(c.y-o.sy)*k, r=Math.max(10,I.h*0.16);
        F.desenho.disco(x,y,r+4,'#ff5fd0',0.4); F.desenho.disco(x,y,r,'#5ad6ff',0.9); F.desenho.disco(x-2,y-2,r*0.5,'#ffffff',1);
        if(f%2===0) F.desenho.faisca(x,y,escolhe(['#5ad6ff','#ff5fd0']), rnd(-2,2), rnd(-2,2), 12, 4, 0); });
      return true; },
    impacto:(I,al,g)=>{ if(ultimoAlvo(I,al)){ F.quadroImpacto(2); F.onomato('VRAAAM!', centro(I).x, centro(I).y-I.h*0.6, '#5ad6ff', 18); } }
  });

  /* ---------------- ROBÔ DE CONTENÇÃO (história) ---------------- */
  def('Soco de Sucata', { impacto:(I,al)=>{ lascas(al.pos.x, al.pos.y, ['#8a8a8a','#c8a060','#5a5a5a'], 8); F.onomato('CLANK!', al.pos.x, cab(I,al)-6, '#c8c8c8', 12); } });
  def('Investida Enferrujada', { impacto:(I,al)=>{ lascas(al.pos.x, al.pos.y, ['#a0522d','#8a8a8a'], 12, 1.3); F.onomato('KRASH!', al.pos.x, cab(I,al)-6, '#c8a060', 14); } });
  def('Alarme de Curto-Circuito', {
    origem:I=>{ F.forma(40,(p,f)=>{ if(f%8<4) F.desenho.disco(I.o.x, I.o.y-I.h*0.5, 8, '#ff3030', 0.9); }); F.onomato('BZZT!', I.o.x, I.o.y-I.h*0.7, '#ff3030', 12); }
  });

  /* ---------------- CABELIN ---------------- */
  def('Fatia Voadora', {
    // o Cabelin tem a fatia de lasanha na folha dele; a do Mano Coxinha é PIZZA
    voo:(I,al,o)=>{ if(I.ev.skill.tipo==='lasanha') return false;
      F.voa(obj('pizza'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.2), giro:0.4, arco:20, fantasmas:2 }); return true; },
    impacto:(I,al)=>{ if(I.ev.skill.tipo==='lasanha'){ F.onomato('SPLAT!', al.pos.x, cab(I,al)-8, '#ffb83c', 14); lascas(al.pos.x, al.pos.y, ['#c8461e','#ffcf5a'], 10); }
      else F.onomato('PLOFT!', al.pos.x, cab(I,al)-8, '#ffd23a', 13); }
  });
  def('Lasanha Quentinha', {
    voo:(I,al,o)=>{ F.voa(obj('lasanha'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.18), arco:34 });
      F.forma(o.vida, (p,f)=>{ if(f%3===0){ const k=1-p; vapor(o.sx+(al.pos.x-o.sx)*k, o.sy+(al.pos.y-o.sy)*k-Math.sin(k*Math.PI)*34-10, 1); } });
      return true; },
    impacto:(I,al)=>{ vapor(al.pos.x, al.pos.y-10, 8); F.onomato('NHAM!', al.pos.x, cab(I,al)-12, '#ffb83c', 13); }
  });
  def('Queijo Derretido', {
    voo:(I,al,o)=>{ F.forma(o.vida+6, (p,f)=>{ const d=F.desenho, kmax=Math.min(1,f/o.vida);
        for(let i=0;i<24;i++){ const k=kmax*i/24, an=k*14+f*0.3, r=6+Math.sin(k*Math.PI)*6;
          d.px(o.sx+(al.pos.x-o.sx)*k+Math.cos(an)*r, o.sy+(al.pos.y-o.sy)*k+Math.sin(an)*r-Math.sin(k*Math.PI)*16, 4, i%3?'#ffd23a':'#fff3b0', 0.9*Math.min(1,p*3)); } });
      F.voa(obj('queijo'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.14), giro:0.3, arco:16 });
      return true; },
    impacto:(I,al)=>{ F.forma(40,(p,f)=>{ for(let i=0;i<5;i++) F.desenho.retang(al.pos.x-20+i*10, al.pos.y-10, 3, Math.min(30,f*1.2)*(0.6+0.4*Math.sin(i)), '#ffd23a', p); }); F.onomato('GRUDOU!', al.pos.x, cab(I,al)-10, '#ffd23a', 12); }
  });
  def('Molho Fervendo', { varre:'x',
    vooUm:(I,o)=>{ const u=I.alvos[I.alvos.length-1].pos; F.onda(o.sx, u.x, I.pe(u), Math.max(26,I.h*0.45), '#c8261e', o.vida+22, '#ff7a3c', o.vida); return true; },
    voo:()=>true,
    impacto:(I,al)=>{ vapor(al.pos.x, al.pos.y, 6, '#ffd0c0'); lascas(al.pos.x, al.pos.y, ['#c8261e','#ff7a3c'], 8); }
  });
  def('MURALHA DE LASANHA', {
    quadro:(I,t)=>{ // camadas caindo e empilhando onde a muralha vai ficar
      if(!I.ev.barreiraNova) return;
      const fim=I.f.D!=null? I.f.D-I.R(8) : 40;
      if(t>fim-30 && t<fim && (fim-t)%6===0){ const p=TurnBG.posBarreiraTela(I.ladoTela(I.ev.barreiraNova.time)); if(p) cai(obj('lasanha'), p.x+rnd(-6,6), p.y+20-((fim-t)/6)*10, tam(I,0.22), 0, 12); }
    }
  });

  /* ---------------- SMERGULÃO ---------------- */
  def('Golpe Traiçoeiro', { mov:'sombra', impacto:(I,al,g)=>{ if(g.ultimo) F.onomato('TSHK!', al.pos.x, cab(I,al)-6, '#c46bff', 14); } });
  def('Passo nas Sombras', { mov:'sombra', impacto:(I,al)=>{ F.nuvem(al.pos.x, al.pos.y, 18, '#2a1040', 24, '#5a2a80'); } });
  def('Moita', { impacto:(I,al)=>{ lascas(al.pos.x, al.pos.y, ['#3a8a2a','#5ad13a','#2a5a1a'], 18, 0.8); F.onomato('FSSH!', al.pos.x, cab(I,al)-6, '#5ad13a', 12); } });
  def('FUMAÇA COLORIDA', {
    origem:I=>{ const bomba=obj('bombom',{b:'#c46bff',d:'#5ad6ff'}); F.objeto(bomba, I.o.x, I.o.y-10, { alt:tam(I,0.12), vida:24, vy:-5, grav:0.4, vrot:0.3 }); }
  });

  /* ---------------- CRIANÇA ROSA / URSÃO ---------------- */
  def('Ursinho Arremessado', {
    voo:(I,al,o)=>{ F.voa(obj('ursinho'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.22), giro:0.5, arco:30, volta:Math.round(o.vida*0.8) }); return true; },
    impacto:(I,al)=>{ F.onomato('TOIN!', al.pos.x, cab(I,al)-8, '#ff9ecb', 13); }
  });
  def('Garra Sombria', { impacto:(I,al)=>{ F.garras(al.pos.x, al.pos.y, '#a24bff', dirDe(I,al), hA(I,al)/90); } });
  def('Abraço Curativo', {
    voo:(I,al,o)=>{ F.voa(obj('coracao'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.16), arco:28 }); return true; },
    impacto:(I,al)=>{ F.objeto(obj('coracao'), al.pos.x, al.pos.y-10, { alt:tam(I,0.5), vida:30, de:0.4, ate:1.2, alpha:0.7 }); F.onomato('ABRAÇO!', al.pos.x, cab(I,al)-16, '#ff9ecb', 12); }
  });
  def('Pesadelo', { impacto:(I,al)=>{ F.objeto(obj('olho',{c:'#ff2a3a'}), al.pos.x, cab(I,al)-20, { alt:tam(I,0.16), vida:40, de:0.3, ate:1.4 }); F.nuvem(al.pos.x, al.pos.y, 20, '#1a0628', 36, '#4a0a1a'); } });
  def('Cantiga de Ninar', {
    quadro:(I,t)=>{ if(t%7===0 && t<I.f.D) F.objeto(obj('nota'), I.o.x+rnd(-20,20), I.o.y-I.h*0.4, { alt:tam(I,0.12), vida:40, vx:rnd(-0.8,0.8), vy:-1.2, vrot:rnd(-0.05,0.05) }); },
    impacto:(I,al)=>{ F.onomato('zzZ', al.pos.x+14, cab(I,al)-10, '#ffd6ea', 12); }
  });
  def('Bola de Fogo Demoníaca', { impacto:(I,al)=>{ F.pilar(al.pos.x, I.pe(al.pos), hA(I,al)*0.8, '#c4103a', 24, true); } });
  def('DESPERTAR DEMÔNIO', {
    origem:I=>{ F.pilar(I.o.x, I.pe(I.o), I.h, '#c4103a', 50, true); F.rachadura(I.o.x-80, I.o.x+80, I.pe(I.o), '#1a0000', 70); }
  });
  def('VOLTAR A SER CRIANÇA', { origem:I=>{ for(let i=0;i<8;i++) F.objeto(obj('coracao'), I.o.x+rnd(-30,30), I.o.y+rnd(-10,20), { alt:tam(I,0.1), vida:40, vy:-1.4, atraso:i*3 }); } });
  def('Patada Demoníaca', { impacto:(I,al)=>{ F.garras(al.pos.x, al.pos.y, '#c4103a', dirDe(I,al), hA(I,al)/90*1.3); F.onomato('RAAH!', al.pos.x, cab(I,al)-8, '#c4103a', 14); } });
  def('Investida Selvagem', { impacto:(I,al)=>{ F.tremer(8,16); F.onomato('RAAWR!', al.pos.x, cab(I,al)-8, '#c4103a', 15); } });
  def('Rugido do Abismo', {
    origem:I=>{ for(let i=0;i<3;i++) F.forma(30, (p,f)=>{ if(f<i*6) return; const r=(f-i*6)*6; for(let k=0;k<16;k++){ const an=k*Math.PI/8; F.desenho.px(I.o.x+Math.cos(an)*r, I.o.y-I.h*0.2+Math.sin(an)*r*0.7, 4, '#c4103a', p); } });
      F.onomato('ROAAAR!', I.o.x+I.lado*30, I.o.y-I.h*0.6, '#c4103a', 17); F.tremer(6,24); },
    voo:()=>true,
    impacto:(I,al)=>{ F.espinhos(al.pos.x, I.pe(al.pos), hA(I,al), '#2a0a1a', 30); }
  });

  /* ---------------- SOLDADO SMERG ---------------- */
  def('Soco de Quartel', { impacto:(I,al)=>{ punhoNoAlvo(I,al,null,1); F.onomato('POW!', al.pos.x, cab(I,al)-6, '#d8dde3', 13); } });
  def('Chute de Recruta', { impacto:(I,al)=>{ F.onomato('TUM!', al.pos.x, cab(I,al)-6, '#d8dde3', 14); } });
  def('Bola de Smergulite', { impacto:(I,al)=>{ F.nuvem(al.pos.x, al.pos.y, 14, '#7df0ff', 24, '#9cff5e'); } });

  /* ---------------- LOIRINHA DA CDI ---------------- */
  def('Tapa', { impacto:(I,al)=>tapa(I,al,'#ff5fa2','SLAP!') });
  def('Bolsada', {
    voo:(I,al,o)=>{ F.voa(obj('bolsa'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.2), giro:0.4, arco:22, fantasmas:2 }); return true; },
    impacto:(I,al)=>{ F.onomato('BAM!', al.pos.x, cab(I,al)-8, '#ff5fa2', 16); lascas(al.pos.x, al.pos.y, ['#ffe066','#ff5fa2','#ffffff'], 8); }
  });
  def('Beijo Curativo', {
    voo:(I,al,o)=>{ F.voa(obj('labios'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.12), arco:26, rastro:'#ff9ecb' }); return true; },
    impacto:(I,al)=>{ F.onomato('SMACK!', al.pos.x, cab(I,al)-10, '#ff5fa2', 13); }
  });
  def('AMBIENTE: CHARME', { impacto:(I,al)=>{ F.objeto(obj('labios'), al.pos.x, al.pos.y-14, { alt:tam(I,0.2), vida:30, de:0.4, ate:1.3, alpha:0.85 }); } });

  /* ---------------- SMERGULA ---------------- */
  def('Toque Sugador', { impacto:(I,al)=>{ F.objeto(obj('mao',{b:'#c46bff',a:'#2a0a3a'}), al.pos.x, al.pos.y-8, { alt:tam(I,0.28), vida:16, de:1.2, ate:0.8, alpha:0.8 }); almas(I, al, '#c46bff', 4); } });
  def('GARRA DA ALMA', {
    voo:(I,al,o)=>{ F.voa(obj('mao',{b:'#a24bff',a:'#1a0028'}), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.36), arco:8, fantasmas:4, rastro:'#a24bff' }); return true; },
    impacto:(I,al)=>{ almas(I, al, '#ff4dff', 6); F.onomato('ARRANCA!', al.pos.x, cab(I,al)-10, '#a24bff', 12); }
  });
  def(['Praga Venenosa','PESTE NEGRA'], {
    voo:(I,al,o)=>{ const negra=norm(I.ev.skill.nome)==='pestenegra';
      F.voa(obj('caveira', negra? {b:'#3a4a2a', a:'#000000'} : null), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.16), arco:22, rastro:negra?'#1a2a10':'#6ad13a', fantasmas:2 }); return true; },
    impacto:(I,al)=>{ F.nuvem(al.pos.x, al.pos.y, 20, norm(I.ev.skill.nome)==='pestenegra'? '#1a2a10' : '#6ad13a', 40, '#9cff5e'); }
  });
  def(['Corte Espectral','RASGO DEMONÍACO'], {
    voo:(I,al,o)=>{ F.forma(o.vida, (p)=>{ const k=1-p, x=o.sx+(al.pos.x-o.sx)*k, y=o.sy+(al.pos.y-o.sy)*k, d=F.desenho;
        for(let i=0;i<3;i++) d.linhaPx([{x:x-8+i*8, y:y-16},{x:x+4+i*8, y:y+16}], i===1?'#ffffff':'#ff4d6d', 3, 0.9); }); return true; },
    impacto:(I,al)=>{ F.garras(al.pos.x, al.pos.y, '#ff4d6d', dirDe(I,al), hA(I,al)/90*(norm(I.ev.skill.nome)==='rasgodemoniaco'?1.4:1)); }
  });
  def(['Miragem','LOUCURA'], {
    impacto:(I,al)=>{ F.objeto(obj('olho'), al.pos.x, cab(I,al)-22, { alt:tam(I,0.14), vida:44, de:0.3, ate:1.3 });
      F.vortice(al.pos.x, cab(I,al), 22, '#c46bff', 40); }
  });
  def(['VÉU MALDITO','ABISMO'], {
    origem:I=>{ // um véu preto descendo do alto do palco
      F.forma(60, (p,f)=>{ const d=F.desenho, W=d.cv.width, k=Math.min(1,f/24);
        for(let i=0;i<W;i+=8){ const alt=(80+Math.sin(i*0.05+f*0.1)*20)*k; d.retang(i, 0, 8, alt*3, '#07040c', 0.55*Math.min(1,p*2.5)); d.retang(i, alt*3-3, 8, 3, '#a24bff', 0.8*Math.min(1,p*2.5)); } });
      F.circuloMagico(I.o.x, I.pe(I.o), I.h*0.7, '#a24bff', 60);
    }
  });

  /* ---------------- MATHEUS LIMEIRA (o Astra) ---------------- */
  def(['Trombada de Astra','ATROPELAMENTO'], { mov:'carro', semCorte:true,
    impacto:(I,al,g)=>{ F.onomato(norm(I.ev.skill.nome)==='atropelamento'? 'CRASH!' : 'BLAM!', al.pos.x, cab(I,al)-8, '#ffe066', 16);
      lascas(al.pos.x, I.pe(al.pos)-10, ['#cfd8e0','#9fd8ff','#ffffff'], 10); }
  });
  def('Provocação Geral', {
    origem:I=>{ for(let i=0;i<3;i++) F.forma(28, (p,f)=>{ if(f<i*5) return; const r=(f-i*5)*7; for(let k=-4;k<=4;k++){ const an=(I.lado>0?0:Math.PI)+k*0.14; F.desenho.px(I.o.x+Math.cos(an)*r, I.o.y-I.h*0.35+Math.sin(an)*r, 4, '#ffb03c', p); } });
      F.onomato('VEM!', I.o.x+I.lado*30, I.o.y-I.h*0.6, '#ffb03c', 16); },
    voo:()=>true,
    impacto:(I,al)=>{ F.onomato('😤', al.pos.x, cab(I,al)-10, '#ffb03c', 14); }
  });
  def('Pisando Fundo', {
    origem:I=>{ const y=I.pe(I.o)+6, W=F.desenho.cv.width;
      F.veiculo(ASTRA(), I.lado>0? -80 : W+80, I.lado>0? W*0.55 : W*0.45, y, Math.max(26,I.h*0.42), 34, { some:true });
      F.onomato('VRUUM!', I.o.x, I.o.y-I.h*0.6, '#7df0ff', 15); }
  });

  /* ---------------- LAMBANÇA ---------------- */
  def('Golpe Consagrado', { impacto:(I,al)=>{ punhoNoAlvo(I,al,{b:'#ffe066',c:'#c89a20',d:'#ffffff'},1); F.objeto(obj('estrela'), al.pos.x, cab(I,al), { alt:tam(I,0.18), vida:20, de:0.5, ate:1.6 }); } });
  def('Bênção do Alto', { impacto:(I,al)=>{ F.pilar(al.pos.x, I.pe(al.pos), hA(I,al), '#ffe066', 32); } });
  def('Purificação', { impacto:(I,al)=>{ F.circuloMagico(al.pos.x, I.pe(al.pos), hA(I,al)*0.5, '#7dffc4', 40); } });
  def('Selo do Silêncio', {
    impacto:(I,al)=>{ F.circuloMagico(al.pos.x, al.pos.y, hA(I,al)*0.55, '#ffe066', 54, 1);
      F.onomato('SELADO!', al.pos.x, cab(I,al)-18, '#ffe066', 15); F.quadroImpacto(2); }
  });

  /* ---------------- ADULTO FELIZ ---------------- */
  def('Tapa de Amor', { impacto:(I,al)=>{ tapa(I,al,'#ff9ecb','SLAP!'); F.objeto(obj('coracao'), al.pos.x, cab(I,al), { alt:tam(I,0.1), vida:24, vy:-1.2 }); } });
  def('Bombom Explosivo', {
    voo:()=>true,
    vooUm:(I,o)=>{ const c=centro(I); F.voa(obj('bombom'), o.sx, o.sy, c.x, c.y, o.vida, { alt:tam(I,0.12), giro:0.4, arco:50 }); return true; },
    impacto:(I,al)=>{ for(let i=0;i<10;i++) F.desenho.faisca(al.pos.x, al.pos.y, escolhe(['#ff4d8a','#ffe066','#5ad6ff','#9cff5e']), rnd(-4,4), rnd(-5,-1), 26, 5, 0.2, 6);
      if(ultimoAlvo(I,al)) F.onomato('KA-BOOM!', centro(I).x, centro(I).y-I.h*0.6, '#ff4d8a', 16); }
  });
  def('Abraço de Urso', { impacto:(I,al)=>{ F.onomato('APERTA!', al.pos.x, cab(I,al)-10, '#ff9ecb', 13); for(let i=0;i<4;i++) F.objeto(obj('coracao'), al.pos.x+rnd(-20,20), cab(I,al)+10, { alt:tam(I,0.09), vida:28, vy:-1, atraso:i*3 }); } });
  def('Voadora da Alegria', { mov:'salto', impacto:(I,al)=>{ F.onomato('VOADORA!', al.pos.x, cab(I,al)-10, '#ffe066', 15); F.quadroImpacto(2); } });
  def('BIZARRICE', {
    impacto:(I,al)=>{ F.vortice(al.pos.x, al.pos.y, hA(I,al)*0.5, '#ff5fa2', 44, '#5ad6ff');
      F.forma(34, (p,f)=>{ const k=Math.min(1,f/30), x=al.pos.x+(I.o.x-al.pos.x)*k, y=al.pos.y+(I.o.y-al.pos.y)*k-Math.sin(k*Math.PI)*50;
        F.desenho.disco(x,y,9,'#c46bff',0.8); F.desenho.disco(x,y,4,'#ffffff',1); });
      F.onomato('BIZARRO!', al.pos.x, cab(I,al)-14, '#c46bff', 13); }
  });

  /* ---------------- FAT GIRL ---------------- */
  def('Soco Rápido', { impacto:(I,al)=>{ punhoNoAlvo(I,al,null,1); F.onomato('PÁ!', al.pos.x, cab(I,al)-6, '#ffffff', 13); } });
  def('Chute Giratório', { mov:'giroGolpe', impacto:(I,al)=>{ F.anel(al.pos.x, al.pos.y, '#ffffff', 14, 14); F.onomato('WHAM!', al.pos.x, cab(I,al)-8, '#ffe066', 15); } });
  def('Golpe de Quadril', { impacto:(I,al)=>{ F.tremer(9,18); F.ondaChao(al.pos.x, I.pe(al.pos), '#ffffff', 40, 22); F.onomato('BUMP!', al.pos.x, cab(I,al)-8, '#ff9ecb', 18); } });
  def('Baba Branca', {
    voo:(I,al,o)=>{ F.forma(o.vida, (p,f)=>{ const k=1-p, x=o.sx+(al.pos.x-o.sx)*k, y=o.sy+(al.pos.y-o.sy)*k-Math.sin(k*Math.PI)*18;
        F.desenho.disco(x,y,7+Math.sin(f)*1,'#f0f0f0',1); F.desenho.disco(x-2,y-2,3,'#ffffff',1); if(f%2===0) F.desenho.faisca(x,y+6,'#f0f0f0',0,0.5,16,3,0.2,1); }); return true; },
    impacto:(I,al)=>{ for(let i=0;i<8;i++) F.desenho.faisca(al.pos.x+rnd(-14,14), al.pos.y+rnd(-12,4), '#f0f0f0', rnd(-1,1), rnd(0.2,1), 40, 5, 0.12, 1, 0.9); F.onomato('SPLOSH!', al.pos.x, cab(I,al)-8, '#f0f0f0', 13); }
  });
  def('MEDITAÇÃO BRANCA', { origem:I=>{ F.circuloMagico(I.o.x, I.pe(I.o), I.h*0.6, '#ffffff', 70); F.onomato('OMMM...', I.o.x, I.o.y-I.h*0.7, '#ffffff', 13); } });

  /* ---------------- MARCELÃO BLACK JW ---------------- */
  def('Soco de Bolso', { impacto:(I,al)=>{ punhoNoAlvo(I,al,null,1); F.onomato('TUF!', al.pos.x, cab(I,al)-6, '#d8dde3', 12); } });
  def('Furto de Tempo', {
    voo:(I,al,o)=>{ F.voa(obj('relogio'), o.sx, o.sy, al.pos.x, al.pos.y, o.vida, { alt:tam(I,0.16), arco:16, rastro:'#7df0ff' }); return true; },
    impacto:(I,al)=>{ // o relógio do alvo volta pro bolso dele
      F.voa(obj('relogio'), al.pos.x, cab(I,al), I.o.x, I.o.y, 24, { alt:tam(I,0.12), arco:30, giro:0.2 });
      F.onomato('TIC-TAC!', al.pos.x, cab(I,al)-12, '#7df0ff', 12); }
  });
  def('Moeda Fatal', { varre:'ordem',
    voo:()=>true,
    vooUm:(I,o)=>{ // a moeda quica de alvo em alvo (na ordem em que o motor ricocheteou)
      const pts=I.alvos.map(al=>({x:al.pos.x,y:al.pos.y})), fim=pts.pop()||{x:I.o.x+I.lado*200,y:I.o.y};
      F.voa(obj('moeda'), o.sx, o.sy, fim.x, fim.y, o.vida, { alt:tam(I,0.1), giro:0.6, arco:22, pontos:pts, rastro:'#ffcf3a' });
      F.onomato('TLIM!', o.sx, o.sy-18, '#ffcf3a', 11);
      return true;
    },
    impacto:(I,al)=>{ F.anel(al.pos.x, al.pos.y, '#ffcf3a', 6, 10); F.onomato('TLIN!', al.pos.x, cab(I,al)-4, '#ffcf3a', 11); }
  });
  def('Escudo Temporal', { origem:I=>{ F.objeto(obj('relogio'), I.o.x, I.o.y-I.h*0.5, { alt:tam(I,0.24), vida:40, de:0.4, ate:1.2, vrot:0.05 }); } });
  def('TEMPESTADE DE GELO', {
    quadro:(I,t)=>{ if(t>I.f.CARGA && t<I.a.dur){ const d=F.desenho, W=d.cv.width;
      for(let i=0;i<3;i++) d.faisca(rnd(0,W+200), -10, escolhe(['#ffffff','#bff6ff','#7df0ff']), rnd(-5,-3), rnd(4,7), 60, escolhe([3,4,6]), 0, i%3===0?5:0, 1); } }
  });

  /* ---------------- CARECA ---------------- */
  // rework 1.47: o humano paga com a própria vida
  def('Esfregada Raivosa', { impacto:(I,al)=>{ F.onomato('FLAP!', al.pos.x, cab(I,al)-6, '#ff4d6d', 14);
      lascas(I.atk.x, I.atk.y-I.h*0.1, ['#ff4d6d','#c4103a'], 6, 0.6); } });
  def('Pancada Kamikaze', { mov:'salto',
    origem:I=>{ F.onomato('KAMIKAZE!', I.o.x, I.o.y-I.h*0.65, '#ff4d6d', 15); },
    impacto:(I,al)=>{ F.quadroImpacto(3); F.tremer(12,24); F.ondaChao(al.pos.x, I.pe(al.pos), '#ff4d6d', 46, 24);
      F.onomato('CRASH!', al.pos.x, cab(I,al)-12, '#ff4d6d', 19); lascas(al.pos.x, al.pos.y, ['#ff4d6d','#c4103a','#ffffff'], 16, 1.4); } });
  def('ENTREGA À MALDIÇÃO', {
    origem:I=>{ F.pilar(I.o.x, I.pe(I.o), I.h, '#9cff5e', 60, true); F.rachadura(I.o.x-90, I.o.x+90, I.pe(I.o), '#0a1a00', 70);
      F.onomato('AAARGH!', I.o.x, I.o.y-I.h*0.7, '#9cff5e', 16); },
    impacto:(I,al)=>{ F.espinhos(al.pos.x, I.pe(al.pos), hA(I,al), '#4a8a1a', 30); F.nuvem(al.pos.x, al.pos.y, 20, '#2a4a10', 36, '#9cff5e'); }
  });
  def('Esfregada', { impacto:(I,al)=>{ for(let i=0;i<8;i++) F.desenho.faisca(al.pos.x+rnd(-16,16), al.pos.y+rnd(-14,10), '#cfefff', rnd(-0.6,0.6), rnd(-1.6,-0.4), 30, escolhe([5,7]), -0.01, 3); F.onomato('FLAP!', al.pos.x, cab(I,al)-6, '#cfefff', 13); } });
  def('Toca do Verme', { impacto:(I,al)=>{ lascas(al.pos.x, I.pe(al.pos), ['#5a4030','#8a6a3a'], 14); } });
  def('Estocada do Cabo', {
    impacto:(I,al)=>{ const d=dirDe(I,al); F.forma(10,(p,f)=>{ F.desenho.retang(Math.min(I.atk.x, al.pos.x), al.pos.y-2, Math.abs(al.pos.x-I.atk.x)+d*10, 4, '#c8a060', p); F.desenho.retang(Math.min(I.atk.x, al.pos.x), al.pos.y-1, Math.abs(al.pos.x-I.atk.x), 1, '#ffffff', p); });
      F.onomato('TOC!', al.pos.x, cab(I,al)-6, '#c8a060', 14); }
  });
  def('Cusparada Ácida', { impacto:(I,al)=>{ for(let i=0;i<8;i++) F.desenho.faisca(al.pos.x+rnd(-12,12), al.pos.y+rnd(-8,8), '#9cff5e', rnd(-0.4,0.4), rnd(-1.2,-0.3), 30, 4, -0.02, 3); F.onomato('TSSS!', al.pos.x, cab(I,al)-8, '#9cff5e', 12); } });
  def(['Chão Ensaboado','Lodo Tóxico'], { varre:'x',
    vooUm:(I,o)=>{ const lodo=norm(I.ev.skill.nome)==='lodotoxico', u=I.alvos[I.alvos.length-1].pos;
      F.onda(o.sx, u.x, I.pe(u), Math.max(16,I.h*0.22), lodo?'#4a8a1a':'#bfe8ff', o.vida+22, lodo?'#9cff5e':'#ffffff', o.vida); return true; },
    voo:()=>true,
    impacto:(I,al)=>{ if(norm(I.ev.skill.nome)==='chaoensaboado'){ F.onomato('SPLASH!', al.pos.x, cab(I,al)-6, '#bfe8ff', 12);
      for(let i=0;i<5;i++) F.desenho.faisca(al.pos.x+rnd(-16,16), I.pe(al.pos)-6, '#ffffff', rnd(-0.5,0.5), rnd(-1.4,-0.4), 34, 6, -0.01, 3); } }
  });
  def('Encarada', { origem:I=>{ F.onomato('...', I.o.x, I.o.y-I.h*0.6, '#ff4d6d', 14); }, impacto:(I,al)=>{ F.onomato('😤', al.pos.x, cab(I,al)-10, '#ffb03c', 14); } });

  /* ---------------- TUPAS (já tem folha de efeitos) ---------------- */
  def("Jato d'Água", { impacto:(I,al)=>{ F.onomato('SPLASH!', al.pos.x, cab(I,al)-6, '#3bb8ff', 13); } });
  def('Onda', { varre:'x', vooUm:(I,o)=>{ const u=I.alvos[I.alvos.length-1].pos; F.onda(o.sx, u.x, I.pe(u), Math.max(30,I.h*0.6), '#3bb8ff', o.vida+22, '#e2f6ff', o.vida); return false; } });
  def('Bolha', { impacto:(I,al)=>{ F.onomato('BLOP!', al.pos.x, cab(I,al)-12, '#7dd8ff', 12); } });
  def('Correnteza', { mov:'atravessa' });
  def('REDEMOINHO', { impacto:(I,al)=>{ F.vortice(al.pos.x, al.pos.y, hA(I,al)*0.5, '#3bb8ff', 40, '#e2f6ff'); } });

  /* ---------------- CARGAS (já tem folha de efeitos) ---------------- */
  def('Choque Rápido', { impacto:(I,al)=>{ F.onomato('ZAP!', al.pos.x, cab(I,al)-6, '#ffe066', 13); } });
  def('Investida Relâmpago', { mov:'sombra', impacto:(I,al)=>{ F.onomato('ZZT!', al.pos.x, cab(I,al)-6, '#ffe066', 14); } });
  def('Rajada em Cadeia', { varre:'ordem',
    vooUm:(I,o)=>{ // o arco PULA de um alvo pro outro
      const pts=[{x:o.sx,y:o.sy}].concat(I.alvos.map(al=>({x:al.pos.x,y:al.pos.y})));
      F.forma(o.vida+14, (p,f)=>{ const d=F.desenho, n=Math.min(pts.length-1, Math.floor(f/Math.max(1,o.vida)*(pts.length-1))+1);
        if(f%3===2) return;
        for(let i=0;i<n;i++){ const z=d.zigue(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y,10); d.linhaPx(z,'#ffe066',8,0.3); d.linhaPx(z,'#fff7c2',3,1); } });
      return false;
    }
  });
  def('TEMPESTADE ENCURRALADA', {
    impacto:(I,al)=>{ const d=F.desenho; F.forma(16, (p,f)=>{ if(f%3===2) return; const z=d.zigue(al.pos.x+rnd(-10,10), -20, al.pos.x, al.pos.y, 18); d.linhaPx(z,'#ffe066',10,0.35); d.linhaPx(z,'#ffffff',4,1); });
      F.onomato('KRA-KOOM!', al.pos.x, cab(I,al)-14, '#ffe066', 13); }
  });

  /* ---------------- MANO COXINHA ---------------- */
  def('Casca Crocante', { impacto:(I,al)=>{ lascas(al.pos.x, al.pos.y, ['#e0a030','#ffd27a','#7a4010'], 14); F.onomato('CROC!', al.pos.x, cab(I,al)-8, '#ffd27a', 14); } });
  def('CRUNCH!', { impacto:(I,al)=>{ F.mordida(al.pos.x, al.pos.y-hA(I,al)*0.1, '#5a2a0a', hA(I,al)*1.2); F.onomato('CRUNCH!', al.pos.x, cab(I,al)-12, '#ffd23a', 18); } });
  def('Rodízio de Tapas', { impacto:(I,al,g)=>tapa(I,al,'#ffd23a', g.ultimo? 'TAPA!' : 'PÁ!') });
  def('Muralha de Massa', { origem:I=>{ F.escudo(I.o.x, I.o.y, I.h, '#e0a030'); }, impacto:(I,al)=>{ F.onomato('😤', al.pos.x, cab(I,al)-10, '#ffb03c', 14); } });
  def('ARROTO DE CHEDDAR', {
    origem:I=>{ F.onomato('BUUURP!', I.o.x+I.lado*30, I.o.y-I.h*0.5, '#ffd23a', 17); },
    impacto:(I,al)=>{ F.nuvem(al.pos.x, al.pos.y, 22, '#ffb03c', 36, '#ffd23a'); }
  });
  def('Entrega Relâmpago', { mov:'atravessa', impacto:(I,al)=>{ F.objeto(obj('caixa'), al.pos.x, cab(I,al), { alt:tam(I,0.14), vida:26, vx:rnd(-2,2), vy:-5, grav:0.4, vrot:0.25 }); F.onomato('ENTREGA!', al.pos.x, cab(I,al)-14, '#ffd23a', 12); } });
  def('Óleo Quente', {
    voo:(I,al,o)=>{ for(let i=0;i<3;i++) F.voa(obj('gota'), o.sx, o.sy, al.pos.x+(i-1)*12, al.pos.y+(i-1)*6, o.vida, { alt:tam(I,0.08), arco:34+i*8 }); return true; },
    impacto:(I,al)=>{ F.pilar(al.pos.x, I.pe(al.pos), hA(I,al)*0.6, '#ff7a3c', 20, true); F.onomato('TSSS!', al.pos.x, cab(I,al)-8, '#ffcf3a', 12); }
  });
  def('Voadora de Hambúrguer', { mov:'salto', impacto:(I,al)=>{ F.objeto(obj('hamburguer'), al.pos.x, cab(I,al), { alt:tam(I,0.18), vida:20, de:0.6, ate:1.4 }); F.onomato('SPLAT!', al.pos.x, cab(I,al)-12, '#ffd23a', 15); } });
  // as ults comem: a comida aparece na boca e vai sumindo em mordidas
  const comer = nome => ({ origem:I=>{
    const y=I.o.y-I.h*0.32, x=I.o.x+I.lado*I.h*0.12, img=obj(nome);
    F.forma(50, (p,f)=>{ const morde=Math.floor(f/12), alt=tam(I,0.22)*(1-morde*0.22); if(alt>2) F.desenho.desenhaImg(img, x, y, alt, 0, 1);
      if(f%12===11){ lascas(x, y, ['#e0a030','#ffd27a'], 5, 0.6); F.onomato('NHAC!', x+rnd(-8,8), y-20, '#ffd27a', 10); } });
  }});
  def('Comer Pizza', comer('pizza')); def('Comer Coxinha', comer('coxinha')); def('Comer Hambúrguer', comer('hamburguer'));

  /* ---------------- PRODOCIMO ---------------- */
  def('Finta', { impacto:(I,al)=>{ F.onomato('FINTA!', al.pos.x, cab(I,al)-16, '#ffe066', 11); F.onomato('TUM!', al.pos.x+14, cab(I,al), '#ffffff', 14); } });
  def('Mão Leve', { impacto:(I,al)=>{ F.voa(obj('estrela'), al.pos.x, cab(I,al), I.o.x, I.o.y-I.h*0.3, 22, { alt:tam(I,0.12), arco:40, giro:0.3 }); F.onomato('PEGUEI!', al.pos.x, cab(I,al)-10, '#ff9ecb', 11); } });
  def('Fofoca', {
    voo:(I,al,o)=>{ F.voa(obj('balao'), o.sx, o.sy, al.pos.x, cab(I,al)-6, o.vida, { alt:tam(I,0.16), arco:20 }); return true; },
    impacto:(I,al)=>{ F.onomato('?!', al.pos.x, cab(I,al)-14, '#ff5fa2', 14); }
  });
  def('APERTO DE MÃO REVELADOR', {
    impacto:(I,al)=>{ const d=dirDe(I,al), y=al.pos.y-hA(I,al)*0.05;
      F.objeto(obj('mao'), al.pos.x-d*16, y, { alt:tam(I,0.22), vida:30, rot:d*1.4, espelha:d<0 });
      F.objeto(obj('mao',{b:'#e0b080'}), al.pos.x+d*4, y, { alt:tam(I,0.22), vida:30, rot:-d*1.4, espelha:d>0 });
      F.quadroImpacto(3); F.onomato('!!', al.pos.x, cab(I,al)-18, '#ff5fa2', 20); }
  });

  /* ---------------- DMATERELIZADOR (já tem folha de efeitos) ---------------- */
  def('Toque Desmaterializador', { impacto:(I,al)=>{ F.cubinhos(al.pos.x, al.pos.y, hA(I,al), '#8a5cff', 18); } });
  def('Portal', {
    voo:(I,al,o)=>{ // entra num portal na frente dele e sai noutro colado no alvo
      F.portal(o.sx+I.lado*16, o.sy, I.h*0.9, '#8a5cff', o.vida+10);
      F.portal(al.pos.x-dirDe(I,al)*hA(I,al)*0.4, al.pos.y, hA(I,al), '#8a5cff', o.vida+14);
      return false; },
    impacto:(I,al)=>{ F.cubinhos(al.pos.x, al.pos.y, hA(I,al), '#8a5cff', 10); }
  });
  def('Desmaterializar', { impacto:(I,al)=>{ F.vortice(al.pos.x, al.pos.y, hA(I,al)*0.45, '#8a5cff', 36); F.cubinhos(al.pos.x, al.pos.y, hA(I,al), '#8a5cff', 16); } });
  def('DESMATERIALIZAÇÃO TOTAL', {
    voo:(I,al,o)=>{ F.forma(Math.max(1,o.vida-6), ()=>{}, ()=>F.feixeGrosso(o.sx, o.sy, al.pos.x, al.pos.y, '#8a5cff', Math.max(12,I.h*0.16), 30)); return false; },
    impacto:(I,al)=>{ F.cubinhos(al.pos.x, al.pos.y, hA(I,al), '#8a5cff', 40); F.quadroImpacto(3); }
  });

  /* ============================================================
     SEM RECEITA: pela palavra do nome (serve também pra golpe novo)
     ============================================================ */
  function porPalavra(n, ev){
    const tem=w=>n.indexOf(w)>=0;
    if(tem('mordida')||tem('morde')) return R.mordida;
    if(tem('tapa')) return { impacto:(I,al)=>tapa(I,al,null,'SLAP!') };
    if(tem('voadora')) return R.voadoradaalegria;
    if(tem('soco')||tem('jab')||tem('punho')) return R.socorapido;
    if(tem('chute')) return R.chutederecruta;
    if(tem('garra')) return R.garrasombria;
    if(ev && ev.estilo==='corpo' && (ev.skill.tipo||'fisico')==='fisico') return { impacto:(I,al,g)=>{ if(g.ultimo) F.onomato(escolhe(['POW!','BAM!','PÁ!','TUM!']), al.pos.x, cab(I,al)-6, '#ffffff', 13); } };
    return null;
  }

  function receita(ev){
    if(!ev || !ev.skill || ev.acao==='defender') return null;
    const n=norm(ev.skill.nome);
    return R[n] || porPalavra(n, ev);
  }

  return { receita, obj, png, preload, ASTRA, CORSA, norm, get RECEITAS(){ return R; } };
})();
