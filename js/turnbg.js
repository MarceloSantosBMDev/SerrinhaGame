/* ============================================================
   AMBIENTES DA BATALHA 3x3
   ------------------------------------------------------------
   O palco da batalha (times um de frente para o outro) ganha um
   CENÁRIO sorteado a cada luta.

   Como é desenhado:
   · a parte PARADA (céu, prédios, chão) é desenhada UMA vez num
     canvas de apoio e só é refeita quando o tamanho muda — senão
     redesenhar 6 camadas a 60fps custaria caro à toa;
   · a parte VIVA (estrelas piscando, brasas, névoa, luzes) é
     desenhada por cima a cada quadro.

   Tudo em retângulos inteiros, no mesmo estilo pixelado do jogo.
   ============================================================ */
const TurnBG = (function(){

  let cv=null, ctx=null, off=null, offCtx=null;
  let W=0, H=0, t=0, atual=null;

  function px(c,x,y,w,h,cor){
    c.fillStyle=cor;
    c.fillRect(Math.round(x), Math.round(y), Math.max(1,Math.round(w)), Math.max(1,Math.round(h)));
  }
  /* disco "pixelado": círculo montado por FAIXAS de retângulo.
     Com arc() o contorno sai suavizado e destoa do resto da arte. */
  function disco(c, cx, cy, raio, cor){
    for(let dy=-raio; dy<=raio; dy+=2){
      const w=Math.sqrt(Math.max(0, raio*raio-dy*dy))*2;
      if(w>0) px(c, cx-w/2, cy+dy, w, 2, cor);
    }
  }
  function ceu(c, cores){
    const g=c.createLinearGradient(0,0,0,H);
    cores.forEach((cor,i)=> g.addColorStop(i/(cores.length-1), cor));
    c.fillStyle=g; c.fillRect(0,0,W,H);
  }
  // ruído determinístico: o mesmo cenário sempre sai igual
  function r(n){ const x=Math.sin(n*127.1)*43758.5453; return x-Math.floor(x); }

  /* piso comum: linha de horizonte + grade em fuga */
  function chao(c, y, corTopo, corBase, corLinha){
    px(c,0,y,W,H-y, corBase);
    px(c,0,y,W,4, corTopo);
    px(c,0,y,W,2, corLinha);
    c.strokeStyle='rgba(120,80,180,.16)'; c.lineWidth=1;
    for(let i=-8;i<=8;i++){
      c.beginPath(); c.moveTo(W/2+i*44, y); c.lineTo(W/2+i*(H-y)*3, H); c.stroke();
    }
    for(let yy=y; yy<H; yy+=Math.max(6,(yy-y)*0.28+7)){
      c.beginPath(); c.moveTo(0,yy); c.lineTo(W,yy); c.stroke();
    }
  }

  /* ============================================================
     OS AMBIENTES
     ============================================================ */
  const AMBIENTES=[

    /* ---------- 1. ARENA NEON (noite na cidade) ---------- */
    { id:'arena', nome:'Arena Neon', icone:'🌃',
      estatico(c){
        ceu(c,['#2a1248','#3a1a52','#160a26']);
        const hz=H*0.74;
        // lua minguante (disco cheio + disco do céu por cima)
        disco(c, W*0.80, H*0.16, 26, '#ffe9a8');
        disco(c, W*0.845, H*0.14, 23, '#33195a');
        // skyline em duas camadas
        for(let x=0;x<W;x+=34){ const hh=40+r(x)*70; px(c,x,hz-hh-46,28,hh+46,'#1d0f33'); }
        for(let x=16;x<W;x+=58){ const hh=70+r(x*3)*90; px(c,x,hz-hh,20,hh,'#241445');
          px(c,x,hz-hh,20,5,'#ff3bd0'); }
        chao(c,hz,'#3a2458','#2a1a40','#ff3bd0');
      },
      animado(c){
        for(let i=0;i<48;i++){
          const x=(i*97)%W, y=(i*53)%(H*0.45);
          c.globalAlpha=((i+((t/26)|0))%5===0)?0.35:0.85;
          px(c,x,y,2,2,'#fff');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 2. FERRO-VELHO (entardecer, sucata) ---------- */
    { id:'ferrovelho', nome:'Ferro-Velho', icone:'🔧',
      estatico(c){
        ceu(c,['#4a2418','#7a3a1e','#2a1410']);
        const hz=H*0.76;
        disco(c, W*0.2, H*0.2, 34, '#ffb03c');            // sol baixo
        // morros de sucata
        for(let x=-20;x<W;x+=90){
          const hh=50+r(x)*60;
          for(let i=0;i<7;i++) px(c, x+r(x+i)*60, hz-hh+i*9, 40-i*4, 10, i%2?'#3a2a24':'#4a352c');
        }
        // guindaste
        const gx=W*0.72;
        px(c,gx,hz-150,8,150,'#5a4030'); px(c,gx-46,hz-150,110,8,'#5a4030');
        px(c,gx+56,hz-142,4,34,'#3a2a20'); px(c,gx+50,hz-108,16,12,'#8a6a3a');
        chao(c,hz,'#5a4030','#3a2a20','#ffb03c');
      },
      animado(c){
        for(let i=0;i<14;i++){                            // fagulhas de solda
          const f=(t*0.9+i*37)%140;
          c.globalAlpha=1-f/140;
          px(c, W*0.72+58+Math.sin(i*2.1)*10, H*0.76-96+f*0.7, 3,3, i%2?'#ffe066':'#ff7a3c');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 3. DESERTO DE SAL ---------- */
    { id:'deserto', nome:'Deserto de Sal', icone:'🏜',
      estatico(c){
        ceu(c,['#f2a65a','#e0d3b8','#c9b48a']);
        const hz=H*0.70;
        disco(c, W*0.5, H*0.16, 48, 'rgba(255,243,196,.18)');   // halo antes
        disco(c, W*0.5, H*0.16, 40, '#fff3c4');
        // dunas
        for(let cam=0;cam<3;cam++){
          const base=hz-30+cam*14, cor=['#c8a578','#b08d60','#96754c'][cam];
          for(let x=0;x<W;x+=8){
            const y=base+Math.sin((x*0.012)+cam*2)*12+Math.sin(x*0.03+cam)*4;
            px(c,x,y,8,H-y,cor);
          }
        }
        // cactos / postes secos
        for(let i=0;i<5;i++){ const x=40+r(i*9)*(W-80);
          px(c,x,hz-34,6,34,'#4f6b3a'); px(c,x-8,hz-24,8,5,'#4f6b3a'); }
        chao(c,hz+22,'#e8d9b0','#8a6a44','#f2a65a');
      },
      animado(c){
        for(let i=0;i<26;i++){                            // areia levada pelo vento
          const x=((i*131)+t*1.4)%W, y=H*0.62+((i*29)%(H*0.34));
          c.globalAlpha=0.28; px(c,x,y,4,2,'#f6e6c0');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 4. LABORATÓRIO 5000Z ---------- */
    { id:'laboratorio', nome:'Laboratório 5000Z', icone:'🔬',
      estatico(c){
        ceu(c,['#0d1c2a','#12283c','#081018']);
        const hz=H*0.74;
        // parede de painéis
        for(let x=0;x<W;x+=52) for(let y=10;y<hz-20;y+=42){
          px(c,x+4,y,44,34,'#132b3f'); px(c,x+4,y,44,3,'#1d4763');
        }
        // canos
        for(let i=0;i<4;i++){ const y=24+i*30; px(c,0,y,W,7,'#1a3a52'); px(c,0,y,W,2,'#2a5a7a'); }
        // tanques com líquido
        [0.16,0.84].forEach(f=>{
          const x=W*f-24;
          px(c,x,hz-118,48,118,'#0f2233'); px(c,x+5,hz-108,38,98,'#0a3a4a');
          px(c,x+5,hz-62,38,52,'#1b8fa8'); px(c,x,hz-124,48,8,'#2a5a7a');
        });
        chao(c,hz,'#1d4763','#0e1c28','#5ad6ff');
      },
      animado(c){
        for(let i=0;i<10;i++){                            // luzes de status
          const x=60+i*((W-120)/9), on=((t/20|0)+i)%3;
          px(c,x,16,5,5, on===0?'#5ad6ff': on===1?'#3bff9c':'#1a3a52');
        }
        for(let i=0;i<12;i++){                            // bolhas nos tanques
          const f=(t*0.8+i*23)%110, lado=i%2?0.16:0.84;
          c.globalAlpha=0.5;
          px(c, W*lado-14+((i*7)%26), H*0.74-14-f, 3,3, '#7df0ff');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 5. RUA DA PADARIA ---------- */
    { id:'padaria', nome:'Rua da Padaria', icone:'🥖',
      estatico(c){
        ceu(c,['#1b2b52','#33406e','#141a2e']);
        const hz=H*0.76;
        // fachadas
        for(let x=-10;x<W;x+=118){
          const hh=110+r(x)*40;
          px(c,x,hz-hh,110,hh,'#2a2140');
          px(c,x,hz-hh,110,7,'#c46bff');
          for(let jx=10;jx<100;jx+=32) for(let jy=14;jy<hh-40;jy+=30)
            px(c,x+jx,hz-hh+jy,18,18, r(x+jx+jy)>0.55?'#ffd166':'#1a1430');
          // toldo listrado
          for(let s=0;s<110;s+=12){ px(c,x+s,hz-42,12,10, (s/12)%2? '#f4602a':'#ffe8c4'); }
          px(c,x+16,hz-32,44,32,'#120c22');           // porta
        }
        // poste
        px(c,W*0.5-3,hz-92,6,92,'#3a2a48'); px(c,W*0.5-11,hz-100,22,10,'#ffd166');
        chao(c,hz,'#3a2f52','#241d38','#ffd166');
      },
      animado(c){
        c.globalAlpha=0.10+Math.sin(t*0.05)*0.03;         // halo do poste
        px(c,W*0.5-40,H*0.76-104,80,44,'#ffd166');
        c.globalAlpha=1;
        for(let i=0;i<8;i++){                             // vapor de pão quente
          const f=(t*0.6+i*31)%120;
          c.globalAlpha=(1-f/120)*0.3;
          px(c, W*0.18+i*13, H*0.76-44-f*0.6, 5,5, '#ffe8c4');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 6. MATA FECHADA ---------- */
    { id:'mata', nome:'Mata Fechada', icone:'🌲',
      estatico(c){
        ceu(c,['#0b2018','#123024','#06120e']);
        const hz=H*0.78;
        for(let cam=0;cam<3;cam++){
          const cor=['#0f2a1e','#16382a','#1e4634'][cam], passo=54-cam*8;
          for(let x=-20;x<W;x+=passo){
            const hh=80+r(x+cam*11)*90-cam*10, tx=x+r(x)*10;
            px(c,tx+passo*0.3,hz-hh*0.4,7,hh*0.4,'#123021');       // tronco
            for(let k=0;k<4;k++){                                  // copa em degraus
              const lw=passo*(0.95-k*0.16);
              px(c, tx+passo*0.35-lw/2, hz-hh+k*(hh*0.18), lw, hh*0.22, cor);
            }
          }
        }
        chao(c,hz,'#1e4634','#0d1f16','#9cff5e');
      },
      animado(c){
        for(let i=0;i<16;i++){                            // vaga-lumes
          const x=(i*151)%W + Math.sin(t*0.02+i)*18;
          const y=H*0.34+((i*67)%(H*0.42)) + Math.cos(t*0.03+i*2)*12;
          c.globalAlpha=0.35+Math.abs(Math.sin(t*0.06+i))*0.6;
          px(c,x,y,3,3,'#c9ff6b');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 7. TEL AVIV (entardecer à beira-mar) — Modo História ----------
       cidade velha com cúpula dourada à esquerda, torres de vidro à
       direita, o mar no horizonte e a Torre do Relógio no meio, parada
       em 03:33 (o tempo roubado pelo Marcelão). */
    { id:'telaviv', nome:'Tel Aviv', icone:'🕌',
      estatico(c){
        ceu(c,['#3a1d52','#c4563c','#f4a259']);
        const hz=H*0.72, mar=hz-26;
        disco(c, W*0.62, mar-6, 30, '#ffd27a');               // sol se pondo no mar
        px(c,0,mar,W,26,'#2a5a8a');                           // mar
        for(let i=0;i<6;i++) px(c, W*0.62-34+i*4, mar+4+i*4, 68-i*8, 2, '#ffd27a');   // reflexo
        // cidade velha: casas de pedra + cúpula dourada + minarete
        for(let x=0;x<W*0.42;x+=30){ const hh=26+r(x)*30; px(c,x,hz-hh,28,hh,'#7a4a3a'); px(c,x,hz-hh,28,3,'#a8705a'); }
        const cx=W*0.20;
        px(c,cx-26,hz-64,52,40,'#8a5a44');
        disco(c, cx, hz-66, 24, '#ffcf3c'); px(c,cx-26,hz-66,52,26,'#8a5a44');
        px(c,cx-2,hz-98,4,10,'#ffcf3c');
        px(c,W*0.33,hz-104,10,104,'#9a6a50'); px(c,W*0.33-3,hz-108,16,6,'#ffcf3c');
        // torres modernas com janelas acesas
        for(let x=W*0.70;x<W;x+=40){
          const hh=90+r(x)*80;
          px(c,x,hz-hh,30,hh,'#2a2244');
          for(let jy=8;jy<hh-6;jy+=10) for(let jx=4;jx<26;jx+=8)
            if(r(x+jx*3+jy)>0.5) px(c,x+jx,hz-hh+jy,4,4,'#ffd166');
        }
        // Torre do Relógio
        const tx=W*0.47;
        px(c,tx,hz-150,30,150,'#5a3a4a'); px(c,tx-4,hz-156,38,8,'#3a2234');
        disco(c, tx+15, hz-128, 11, '#f4ead2');
        px(c,tx+14,hz-138,2,10,'#1a0e18'); px(c,tx+15,hz-128,8,2,'#1a0e18');   // 03:33 — parado
        chao(c,hz,'#d8a868','#7a5638','#ffcf3c');
      },
      animado(c){
        for(let i=0;i<8;i++){                              // gaivotas
          const x=((i*173)+t*0.7)%(W+40)-20, y=H*0.22+((i*41)%(H*0.18))+Math.sin(t*0.05+i)*4;
          px(c,x,y,4,2,'#2a1438'); px(c,x+4,y-2,4,2,'#2a1438');
        }
        c.globalAlpha=0.35+Math.sin(t*0.04)*0.15;            // brilho do mar
        px(c, W*0.62-40, H*0.72-16, 80, 2, '#fff3c4');
        c.globalAlpha=1;
      } },

    /* ---------- 8. MURALHA DA CIDADE VELHA (noite, lanternas) ---------- */
    { id:'muralha', nome:'Muralha da Cidade Velha', icone:'🏯',
      estatico(c){
        ceu(c,['#0e1636','#1c2a5a','#0a0f22']);
        const hz=H*0.76;
        disco(c, W*0.78, H*0.18, 28, '#f2ecd0');
        const topo=hz-120;
        for(let y=topo;y<hz;y+=14) for(let x=((y/14)%2)*20-20;x<W;x+=40)
          px(c,x,y,38,12, r(x*7+y)>0.5?'#8a7a62':'#7a6a54');           // blocos de pedra
        for(let x=0;x<W;x+=36) px(c,x,topo-18,22,18,'#8a7a62');          // ameias
        const gx=W*0.5-34;                                               // portão em arco
        px(c,gx,hz-80,68,80,'#1a1220'); disco(c, gx+34, hz-80, 34, '#1a1220');
        px(c,gx-10,hz-124,88,8,'#6a5a46');
        chao(c,hz,'#9a8a6a','#4a3e30','#ffb347');
      },
      animado(c){
        [0.18,0.36,0.64,0.82].forEach((f,i)=>{                           // lanternas tremendo
          const x=W*f, y=H*0.76-70;
          px(c,x-1,y-12,2,12,'#2a2018');
          c.globalAlpha=0.6+Math.sin(t*0.2+i*1.7)*0.25;
          px(c,x-5,y,10,12,'#ffb347');
          c.globalAlpha=0.12+Math.sin(t*0.2+i*1.7)*0.05;
          px(c,x-22,y-12,44,36,'#ffb347');
        });
        c.globalAlpha=1;
      } },

    /* ---------- 9. TORRE DO RELÓGIO (covil do Marcelão) ----------
       por dentro: relógio gigante congelado, engrenagens, gelo. Os
       ponteiros andam DE TRÁS PRA FRENTE — é o tempo sendo roubado. */
    { id:'torre', nome:'Torre do Relógio', icone:'🕰',
      estatico(c){
        ceu(c,['#071426','#0e2a44','#050c18']);
        const hz=H*0.78;
        [[0.12,40],[0.88,52],[0.26,22]].forEach(([f,rr],i)=>{            // engrenagens
          const x=W*f, y=H*0.30+i*30;
          for(let a=0;a<12;a++){ const an=a*Math.PI/6;
            px(c, x+Math.cos(an)*(rr+5)-4, y+Math.sin(an)*(rr+5)-4, 8,8,'#1d3a5a'); }
          disco(c,x,y,rr,'#1d3a5a'); disco(c,x,y,rr*0.45,'#071426');
        });
        disco(c, W*0.5, H*0.34, 76, '#2a5a7a');                          // relógio gigante
        disco(c, W*0.5, H*0.34, 68, '#d8eef8');
        for(let h=0;h<12;h++){ const an=h*Math.PI/6;
          px(c, W*0.5+Math.cos(an)*58-2, H*0.34+Math.sin(an)*58-2, 4,4,'#0e2a44'); }
        for(let x=0;x<W;x+=26){ const hh=10+r(x)*26; px(c,x+6,0,6,hh,'#bfe9ff'); px(c,x+8,hh,2,4,'#bfe9ff'); }  // pingentes de gelo
        chao(c,hz,'#7df0ff','#10263a','#bfe9ff');
      },
      animado(c){
        const cx=W*0.5, cy=H*0.34, an=-t*0.02;                           // ponteiros ao contrário
        for(let k=0;k<44;k+=3) px(c, cx+Math.cos(an)*k-1, cy+Math.sin(an)*k-1, 3,3,'#0e2a44');
        for(let k=0;k<30;k+=3) px(c, cx+Math.cos(an/12)*k-1, cy+Math.sin(an/12)*k-1, 4,4,'#0e2a44');
        for(let i=0;i<30;i++){                                           // neve caindo
          const x=(i*97+Math.sin(t*0.01+i)*20)%W, y=((i*61)+t*0.8)%H;
          c.globalAlpha=0.6; px(c,x,y,2,2,'#e6f6ff');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 10. VILA DO REINO SMERGULUS — Capítulo 2 ----------
       céu roxo nublado, o castelo da rainha Smergula no alto do morro
       com bandeiras roxas, e as casinhas tortas dos smergs comuns. */
    { id:'reino', nome:'Smergulus Kingdom', icone:'🏰',
      estatico(c){
        ceu(c,['#2a1840','#5a3a6a','#8a6a7a']);
        const hz=H*0.74;
        // morro + castelo no fundo
        for(let x=0;x<W;x+=6){
          const y=hz-60-Math.max(0, 70-Math.abs(x-W*0.5)*0.32);
          px(c,x,y,6,hz-y,'#3a2a48');
        }
        const cx=W*0.5;
        px(c,cx-60,hz-176,120,60,'#2a1e36');                        // muralha do castelo
        for(let x=cx-60;x<cx+60;x+=14) px(c,x,hz-186,8,10,'#2a1e36');
        [[-70,40],[56,40],[-14,64]].forEach(([dx,hh])=>{             // torres
          px(c,cx+dx,hz-176-hh,28,hh,'#2a1e36');
          for(let k=0;k<4;k++) px(c,cx+dx+k*4,hz-184-hh+k*2,28-k*8,4,'#1e1428');   // telhado em cone
          px(c,cx+dx+10,hz-160-hh,8,10,'#ffcf6a');                   // janela acesa
        });
        px(c,cx-12,hz-146,24,30,'#120a1a');                          // portão
        // casinhas da vila
        for(let x=-10;x<W;x+=76){
          if(Math.abs(x+30-cx)<70) continue;
          const hh=40+r(x)*24, w=56;
          px(c,x,hz-hh,w,hh,r(x*3)>0.5?'#6a4a3a':'#5a3e34');
          for(let k=0;k<5;k++) px(c,x-4+k*4,hz-hh-6-k*5,w+8-k*8,6,'#4a2a2a');   // telhado
          px(c,x+8,hz-hh+12,10,10,r(x+7)>0.4?'#ffcf6a':'#1a1020');
          px(c,x+w-20,hz-20,12,20,'#1a1020');                         // porta
        }
        chao(c,hz,'#7a5a4a','#3a2a2a','#a24bff');
      },
      animado(c){
        const cx=W*0.5, hz=H*0.74;
        [[-70,40],[56,40],[-14,64]].forEach(([dx,hh],i)=>{           // bandeiras roxas tremulando
          const x=cx+dx+13, y=hz-218-hh;
          px(c,x,y,2,34,'#1a1020');
          for(let k=0;k<5;k++) px(c,x+2+k*4,y+Math.sin(t*0.12+k*0.8+i)*2,4,10,'#a24bff');
        });
        for(let i=0;i<5;i++){                                         // corvos
          const x=((i*211)+t*0.6)%(W+60)-30, y=H*0.16+((i*37)%(H*0.16))+Math.sin(t*0.07+i)*3;
          px(c,x,y,4,2,'#120a1a'); px(c,x+4,y-2+(((t/8|0)+i)%2)*3,4,2,'#120a1a'); px(c,x-4,y-2+(((t/8|0)+i)%2)*3,4,2,'#120a1a');
        }
      } },

    /* ---------- 11. SALÃO DO TRONO (castelo da Smergula) ----------
       pedra roxa, tapete vermelho até o trono, tochas e ALMAS subindo
       devagar — o que a rainha roubou fica preso no salão. */
    { id:'castelo', nome:'Salão do Trono', icone:'👑',
      estatico(c){
        ceu(c,['#120818','#24102e','#0a0410']);
        const hz=H*0.78;
        for(let y=0;y<hz;y+=16) for(let x=((y/16)%2)*24-24;x<W;x+=48)
          px(c,x,y,46,14, r(x*5+y)>0.5?'#2a1634':'#24122e');           // parede de blocos
        // colunas
        [0.10,0.30,0.70,0.90].forEach(f=>{
          const x=W*f-14;
          px(c,x,0,28,hz,'#3a2048'); px(c,x+4,0,4,hz,'#4a2a5a');
          px(c,x-6,hz-12,40,12,'#3a2048'); px(c,x-6,20,40,10,'#3a2048');
        });
        // trono
        const tx=W*0.5;
        px(c,tx-34,hz-130,68,130,'#4a1a2a'); px(c,tx-26,hz-120,52,80,'#7a2a3a');
        px(c,tx-40,hz-40,80,40,'#4a1a2a');
        for(let k=0;k<5;k++) px(c,tx-26+k*12,hz-148+(k%2)*6,6,18,'#ffcf3c');   // coroa no espaldar
        // tapete
        for(let y=hz;y<H;y+=4){ const w=40+(y-hz)*1.2; px(c,tx-w/2,y,w,4,'#8a1a2a'); }
        chao(c,hz,'#3a2048','#1a0c22','#ff4d6d');
      },
      animado(c){
        [0.20,0.80].forEach((f,i)=>{                                  // tochas
          const x=W*f, y=H*0.40;
          px(c,x-2,y,4,18,'#2a1a10');
          c.globalAlpha=0.7+Math.sin(t*0.25+i*2)*0.25;
          px(c,x-5,y-12,10,12,'#ff9a3c'); px(c,x-3,y-18,6,8,'#ffe066');
          c.globalAlpha=0.10+Math.sin(t*0.25+i*2)*0.04;
          px(c,x-30,y-34,60,60,'#ff9a3c');
        });
        for(let i=0;i<18;i++){                                        // almas subindo
          const vel=0.25+(i%4)*0.07;
          const y=H*0.80-((t*vel+i*53)%(H*0.80));
          const x=((i*113)%W)+Math.sin(t*0.03+i)*10;
          c.globalAlpha=0.20+0.35*(y/(H*0.8));
          px(c,x,y,4,6,'#c9a8ff'); px(c,x+1,y+6,2,3,'#c9a8ff');
        }
        c.globalAlpha=1;
      } },

    /* ---------- 12. ESGOTO DO REINO (esconderijo dos justiceiros) ----------
       túnel de tijolo em arco, canal de água no meio — o Tupas manda
       nessa água toda e mesmo assim não chega perto da beirada. */
    { id:'esgoto', nome:'Esgoto do Reino', icone:'🕳',
      estatico(c){
        ceu(c,['#0c1416','#14242a','#081012']);
        const hz=H*0.78;
        for(let y=0;y<hz;y+=12) for(let x=((y/12)%2)*16-16;x<W;x+=32)
          px(c,x,y,30,10, r(x*3+y*7)>0.6?'#2a3a3a':'#223232');          // tijolos
        // arcos do túnel
        [0.22,0.5,0.78].forEach(f=>{
          const x=W*f;
          disco(c,x,hz-70,52,'#0a1214'); px(c,x-52,hz-70,104,70,'#0a1214');
        });
        // canos pingando
        [0.12,0.62,0.9].forEach(f=>{ px(c,W*f,0,12,40,'#3a4a42'); px(c,W*f-2,38,16,6,'#4a5a50'); });
        // canal de água
        px(c,0,hz-22,W,22,'#1a4a5a'); px(c,0,hz-22,W,3,'#3a8aa0');
        // lodo verde nas paredes
        for(let i=0;i<14;i++){ const x=r(i*13)*W; px(c,x,hz-40-r(i)*30,6,20+r(i*5)*20,'#3a6a2a'); }
        chao(c,hz,'#2a3a3a','#141e1e','#3bb8ff');
      },
      animado(c){
        const hz=H*0.78;
        for(let i=0;i<10;i++){                                        // reflexo correndo na água
          const x=((i*97)+t*0.9)%W;
          c.globalAlpha=0.35; px(c,x,hz-14+(i%3)*4,18,2,'#7fd8ff');
        }
        [0.12,0.62,0.9].forEach((f,i)=>{                              // gotas dos canos
          const y=44+((t*1.6+i*40)%(hz-66));
          c.globalAlpha=0.7; px(c,W*f+5,y,2,4,'#7fd8ff');
        });
        c.globalAlpha=1;
      } },

    /* ---------- 13. CAMPO DE GUERRA (fronteira do reino) ----------
       a guerra geral: céu de fumaça vermelha, o castelo pegando fogo lá
       no fundo, lanças fincadas no chão e as duas bandeiras — a roxa da
       rainha e a azul de quem veio de Tel Aviv e de Limeira. */
    { id:'campo', nome:'Campo de Guerra', icone:'⚔',
      estatico(c){
        ceu(c,['#2a0c10','#7a2a1e','#c4563c']);
        const hz=H*0.76;
        disco(c, W*0.78, H*0.20, 30, '#ffb03c');                       // sol de fumaça
        // castelo distante pegando fogo
        const cx=W*0.5;
        px(c,cx-50,hz-90,100,40,'#2a1418');
        [[-60,30],[40,34],[-10,52]].forEach(([dx,hh])=>px(c,cx+dx,hz-90-hh,22,hh,'#2a1418'));
        for(let x=0;x<W;x+=8){ const y=hz-50-Math.sin(x*0.02)*10-r(x)*6; px(c,x,y,8,hz-y,'#3a1a1a'); }   // colinas
        // lanças e bandeiras fincadas
        for(let i=0;i<9;i++){
          const x=30+i*((W-60)/8)+r(i)*16, hh=30+r(i*3)*24;
          px(c,x,hz-hh,3,hh,'#5a4030');
          if(i%3===0) px(c,x+3,hz-hh,14,10, i%2? '#a24bff':'#3b8aff');
        }
        chao(c,hz,'#6a3a2a','#2a1410','#ff7a3c');
      },
      animado(c){
        const cx=W*0.5, hz=H*0.76;
        for(let i=0;i<14;i++){                                        // fogo no castelo
          const f=(t*0.7+i*19)%60;
          c.globalAlpha=(1-f/60)*0.8;
          px(c, cx-50+((i*29)%100), hz-100-f*0.8, 4,4, i%2?'#ffe066':'#ff7a3c');
        }
        for(let i=0;i<24;i++){                                        // brasas no vento
          const x=((i*131)+t*1.1)%W, y=H*0.30+((i*47)%(H*0.45))+Math.sin(t*0.05+i)*6;
          c.globalAlpha=0.5; px(c,x,y,2,2,'#ffb03c');
        }
        c.globalAlpha=1;
      } }
  ];

  /* ============================================================
     ESTRUTURAS (o Corsa do Fat Mango e afins)
     Ficam NA FRENTE do time que protegem, entre ele e o inimigo.
     ============================================================ */
  /* Carro visto de lado, montado em blocos. `dir` aponta para o lado do
     INIMIGO — é para lá que a porta abre, porque é ela que apara o golpe. */
  function carro(c, x, y, dir, cor, brilho){
    const e=H/300;                       // acompanha o tamanho do palco
    const escuro='#0d0710', vidro='#9fd8ff';
    /* bloco em coordenadas do carro: vx cresce para o lado do inimigo.
       Com dir=-1 o bloco inteiro é espelhado em torno de x.          */
    const bx=(vx,vy,vw,vh,cc)=>{
      const esq = dir>0 ? x+vx*e : x-(vx+vw)*e;
      px(c, esq, y+vy*e, vw*e, vh*e, cc);
    };
    bx(-42, 2, 84, 3, 'rgba(0,0,0,.45)');   // sombra no chão

    bx(-40,-14, 80, 14, cor);            // carroceria
    bx(-40,-14, 80,  3, '#ffffff26');    // brilho do teto da carroceria
    bx(-40, -3, 80,  3, escuro);         // baixo escuro
    bx(-24,-27, 44, 14, cor);            // cabine
    bx(-24,-27, 44,  2, '#ffffff33');
    bx(-20,-25, 17, 10, vidro);          // vidro traseiro
    bx(  0,-25, 16, 10, vidro);          // para-brisa
    bx(-21,-24, 15,  4, '#ffffff55');    // reflexo
    bx( 22,-13,  4,  9, '#ffe066');      // farol
    bx(-42,-12,  3,  7, '#ff6b6b');      // lanterna
    // rodas
    [-26, 18].forEach(rx=>{
      bx(rx, -6, 14, 8, '#161020');
      bx(rx+2, -4, 10, 4, '#4a4458');
    });
    // PORTA ABERTA virada para o inimigo: é o "escudo" do time
    bx(24,-30, 4, 28, '#d8dde3');
    bx(28,-30, 3, 28, cor);
    bx(24,-30, 4,  3, '#ffffff88');
    if(brilho>0){                        // campo de proteção pulsando
      c.globalAlpha=0.13+brilho*0.13;
      bx(-46,-38, 88, 42, '#7df0ff');
      c.globalAlpha=1;
    }
  }

  /* ============================================================
     AMBIENTE — o clima da arena (o Charme da Loirinha)
     Desenhado por cima do cenário e por baixo dos lutadores: um véu
     de cor + pétalas/corações subindo. Sem estado próprio: a posição
     sai de `t`, então não acumula partícula nenhuma na memória.
     ============================================================ */
  function coracao(c, x, y, s, cor, alpha){
    c.globalAlpha = alpha;
    px(c, x-s,     y-s,   s,   s,   cor);
    px(c, x,       y-s,   s,   s,   cor);
    px(c, x-s*1.5, y,     s*3, s,   cor);
    px(c, x-s,     y+s,   s*2, s,   cor);
    px(c, x-s*0.5, y+s*2, s,   s,   cor);
    c.globalAlpha = 1;
  }

  /* mancha de maldição: bloco irregular com farpas, para o Véu
     Maldito não parecer pétala rosa pintada de roxo. */
  function mancha(c, x, y, s, cor, alpha){
    c.globalAlpha = alpha;
    px(c, x-s,     y-s*0.5, s*2, s*1.5, cor);
    px(c, x-s*1.5, y,       s,   s,     cor);
    px(c, x+s*0.5, y-s,     s,   s,     cor);
    px(c, x-s*0.5, y+s,     s,   s*1.5, cor);
    c.globalAlpha = 1;
  }

  /* cristal de gelo: losango pontudo, pra TEMPESTADE DE GELO (Marcelão
     Black JW) não parecer coração ou mancha de maldição azul. */
  function cristal(c, x, y, s, cor, alpha){
    c.globalAlpha = alpha;
    px(c, x-s*0.5, y-s*1.5, s,   s,     cor);
    px(c, x-s,     y-s*0.5, s*2, s,     cor);
    px(c, x-s*0.5, y+s*0.5, s,   s,     cor);
    c.globalAlpha = 1;
  }

  function desenharAmbiente(c, amb){
    if(!amb) return;
    const cor = amb.cor || '#ff9ecb';
    const sombrio = amb.particula==='mancha';
    const gelado  = amb.particula==='gelo';
    /* véu: o maléfico ESCURECE a arena antes de tingir, senão um roxo
       claro por cima de um cenário claro não lê como "maldito". */
    if(sombrio){
      c.globalAlpha = 0.30;
      px(c, 0, 0, W, H, '#07040c');
      c.globalAlpha = 1;
    }
    c.globalAlpha = (sombrio? 0.16 : 0.11) + Math.sin(t*0.03)*0.025;
    px(c, 0, 0, W, H, cor);
    c.globalAlpha = 1;
    // partículas subindo
    for(let i=0;i<26;i++){
      const vel = 0.30 + (i%5)*0.08;
      const y   = H + 24 - ((t*vel + i*61) % (H+48));
      const x   = ((i*97) % W) + Math.sin(t*0.02 + i)*16;
      const tam = 3 + (i%3);
      const a   = 0.45 + Math.sin(t*0.05 + i)*0.3;
      if(sombrio){
        if(i%3===0) mancha(c, x, y, tam, '#1a0a24', a*0.9);
        else { c.globalAlpha=a*0.8; px(c, x, y, tam, tam+2, cor); c.globalAlpha=1; }
      } else if(gelado){
        if(i%4===0) cristal(c, x, y, tam, cor, a);
        else { c.globalAlpha=a; px(c, x, y, tam, tam, cor); c.globalAlpha=1; }
      } else {
        if(i%4===0) coracao(c, x, y, tam, cor, a);
        else { c.globalAlpha=a; px(c, x, y, tam, tam, cor); c.globalAlpha=1; }
      }
    }
  }

  /* muro de gelo empilhado: tijolos alternados pra não parecer só um
     bloco liso. Usa o mesmo helper `bx` (coordenadas do objeto, espelha
     com `dir`) e o mesmo glow pulsante do carro, pra combinar com o
     resto da linguagem visual das estruturas. */
  function muro(c, x, y, dir, cor, brilho){
    const e=H/300;
    const escuro='#0d0710';
    const bx=(vx,vy,vw,vh,cc)=>{
      const esq = dir>0 ? x+vx*e : x-(vx+vw)*e;
      px(c, esq, y+vy*e, vw*e, vh*e, cc);
    };
    bx(-40,  2, 80,  3, 'rgba(0,0,0,.45)');  // sombra no chão
    bx(-40,-36, 80, 36, cor);                // corpo do muro
    bx(-40,-36, 80,  3, '#ffffff40');        // brilho gelado no topo
    bx(-40, -3, 80,  3, escuro);             // base escura
    // juntas horizontais (fiadas) e verticais alternadas (tijolo de verdade)
    bx(-40,-26, 80,  2, '#0d071055');
    bx(-40,-16, 80,  2, '#0d071055');
    bx(-40, -6, 80,  2, '#0d071055');
    bx(-20,-36,  2, 10, '#0d071044');
    bx( 20,-36,  2, 10, '#0d071044');
    bx(  0,-26,  2, 10, '#0d071044');
    bx(-30,-16,  2, 10, '#0d071044');
    bx( 10,-16,  2, 10, '#0d071044');
    bx(-10, -6,  2, 10, '#0d071044');
    bx( 30, -6,  2, 10, '#0d071044');
    if(brilho>0){                            // campo de proteção pulsando
      c.globalAlpha=0.13+brilho*0.13;
      bx(-44,-40, 88, 44, '#7df0ff');
      c.globalAlpha=1;
    }
  }

  /* 1.33: o palco virou DIORAMA (lutadores em diagonal, os da frente
     embaixo). A estrutura fica no CHÃO, na frente da linha do time,
     perto do meio — onde o golpe inimigo chega primeiro. */
  /* 1.45 — o CORSA DE VERDADE: o mesmo sprite do Corsa visto de lado do
     mundo aberto (modohistoria/assets/veiculos), no lugar do carro de
     blocos. A porta aberta (o "escudo") continua desenhada por cima, do
     lado do inimigo. Sem o PNG carregado, cai no carro de blocos. */
  const CORSA_PNG = { dir:'modohistoria/assets/veiculos/corsa_dir.png', esq:'modohistoria/assets/veiculos/corsa_esq.png' };
  const imgsCarro={};
  function imgCarro(src){ if(!imgsCarro[src]){ const im=new Image(); im.src=src; imgsCarro[src]=im; } return imgsCarro[src]; }
  function corsa(c, x, y, dir, brilho){
    const im=imgCarro(dir>0? CORSA_PNG.dir : CORSA_PNG.esq);
    if(!im.complete || !im.naturalWidth) return false;
    /* o Corsa do mundo aberto vem com bagageiro e malas no teto (é o
       carro da viagem): as primeiras linhas da folha são cortadas fora */
    const corte = dir>0 ? 14 : 16, sh=im.naturalHeight-corte;
    const alt=Math.round(H*0.17), larg=Math.round(im.naturalWidth*alt/sh);
    c.save(); c.imageSmoothingEnabled=false;
    c.globalAlpha=0.45; c.fillStyle='#000'; c.fillRect(Math.round(x-larg*0.46), Math.round(y-2), Math.round(larg*0.92), Math.max(2,Math.round(alt*0.07)));
    c.globalAlpha=1;
    c.drawImage(im, 0, corte, im.naturalWidth, sh, Math.round(x-larg/2), Math.round(y-alt*0.98), larg, alt);
    // porta aberta virada pro inimigo
    const e=alt/60, px0 = dir>0 ? x+larg*0.22 : x-larg*0.22-4*e;
    px(c, px0, y-alt*0.72, 4*e, alt*0.56, '#d8dde3');
    px(c, px0+(dir>0? 4*e : -3*e), y-alt*0.72, 3*e, alt*0.56, '#c0392b');
    px(c, px0, y-alt*0.72, 4*e, 3*e, '#ffffff88');
    if(brilho>0){ c.globalAlpha=0.10+brilho*0.12; px(c, x-larg*0.56, y-alt*1.05, larg*1.12, alt*1.08, '#7df0ff'); c.globalAlpha=1; }
    c.restore();
    return true;
  }

  /* ENTRADA das estruturas: o Corsa chega DIRIGINDO de fora do palco e
     freia no lugar; o muro de gelo SOBE do chão. `chegada[lado]` guarda o
     quadro em que a estrutura apareceu (some → zera). */
  const chegada={ aliado:null, inimigo:null };
  const POS_ESTRUTURA={ aliado:0.40, inimigo:0.60 };
  function desenharEstruturas(c, estruturas){
    const yBase=H*0.93, pulso=(Math.sin(t*0.08)+1)/2;
    /* cada estrutura escolhe o próprio visual (`es.visual`) — Corsa
       Blindado (Fat Mango) continua sendo um carro; Escudo Temporal
       (Marcelão Black JW) é um muro. Padrão cai no carro, pro estilo
       antigo (sem `visual`) continuar funcionando sem editar mais nada. */
    const desenhar=(es, lado, dir, corPadrao)=>{
      if(!es){ chegada[lado]=null; return; }
      if(chegada[lado]==null) chegada[lado]=t;
      const k=Math.min(1,(t-chegada[lado])/30), ease=1-Math.pow(1-k,3);
      const cor = es.cor || corPadrao;
      let x=W*POS_ESTRUTURA[lado];
      if(es.visual==='muro'){
        // sobe do chão: recorta o que ainda está "debaixo da terra"
        c.save(); c.beginPath(); c.rect(0,0,W,yBase+4); c.clip();
        c.translate(0, Math.round((1-ease)*H*0.16));
        muro(c, x, yBase, dir, cor, pulso);
        c.restore();
        if(k<1 && (t%3===0)){ c.globalAlpha=0.6; px(c, x-40*H/300+Math.random()*80*H/300, yBase-4, 4, 4, '#bff6ff'); c.globalAlpha=1; }
      } else {
        // chega dirigindo de fora do palco e freia (com um balanço de mola)
        x = x - dir*(1-ease)*W*0.55;
        const mola = k<1 ? 0 : Math.round(Math.sin(Math.min(1,(t-chegada[lado]-30)/12)*Math.PI*2)*1.5*(1-Math.min(1,(t-chegada[lado]-30)/12)));
        if(!corsa(c, x, yBase+mola, dir, k>=1? pulso : 0)) carro(c, x, yBase, dir, cor, pulso);
        if(k<1 && t%2===0){ c.globalAlpha=0.55; px(c, x-dir*H*0.12, yBase-4-Math.random()*6, 5, 5, '#d8c8a8'); c.globalAlpha=1; }
      }
    };
    desenhar(estruturas && estruturas.aliado,  'aliado',   1, '#f4602a');
    desenhar(estruturas && estruturas.inimigo, 'inimigo', -1, '#c0392b');
  }
  // onde a estrutura de um lado está, em coordenadas de TELA (pra buzina do Corsa)
  function posEstruturaTela(lado){
    if(!cv) return null;
    const r=cv.getBoundingClientRect();
    return { x:r.left+W*(POS_ESTRUTURA[lado]||0.5), y:r.top+H*0.93, alt:Math.round(H*0.24) };
  }

  /* ============================================================
     BARREIRAS — a Muralha de Lasanha do Cabelin
     Usa o PRÓPRIO desenho da folha dele (quadro 3:0: ele empurrando a
     lasanha gigante) recortado só na lasanha, com a barra de vida em
     cima. `bs` vem por LADO DA TELA ({aliado: esquerda, inimigo:
     direita}) — quem traduz time do motor → lado da tela é o TurnUI.
     ============================================================ */
  /* no meio do palco, NA FRENTE da linha do time (o diorama deixa o
     centro livre — é ali que os dois times se encontram) */
  const POS_BARREIRA = { aliado:0.455, inimigo:0.545 };
  const FOLHA_LASANHA = 'assets/cabelin/cabelin_lasanha.png';
  function posBarreira(lado){
    return { x:W*(POS_BARREIRA[lado]||0.5), y:H*0.86, alt:Math.round(H*0.25) };
  }
  function desenharBarreiras(c, bs){
    if(!bs) return;
    ['aliado','inimigo'].forEach(lado=>{
      const b=bs[lado]; if(!b) return;
      const p=posBarreira(lado), alt=p.alt;
      let w=Math.round(alt*0.85);
      const sh = (typeof SpriteSheet!=='undefined') ? SpriteSheet.load(FOLHA_LASANHA) : null;
      const fr = sh && sh.ready ? SpriteSheet.pick(sh, 3, 0) : null;
      // treme um pouco quando está quase quebrando
      const tr = b.hp < b.hpMax*0.35 ? Math.round(Math.sin(t*0.9)*1.5) : 0;
      if(fr){
        const sx=fr.x+Math.round(fr.w*0.36), sw=Math.round(fr.w*0.64), s=alt/fr.h;
        w=Math.round(sw*s);
        c.save(); c.imageSmoothingEnabled=false;
        if(lado==='inimigo'){ c.translate(Math.round(p.x),0); c.scale(-1,1); c.translate(-Math.round(p.x),0); }
        c.drawImage(sh.img, sx, fr.y, sw, fr.h, Math.round(p.x-w/2)+tr, Math.round(p.y-alt), w, alt);
        c.restore();
      } else {
        // folha ainda carregando: bloco de massa e queijo
        for(let k=0;k<6;k++) px(c, p.x-w/2+tr, p.y-alt+k*(alt/6), w, alt/6-2, k%2?'#ffcf5a':'#c8461e');
      }
      // barra de vida da muralha
      const bw=Math.max(46, Math.round(w*0.9)), by=Math.round(p.y-alt-12);
      px(c, p.x-bw/2-2, by-2, bw+4, 9, '#07040c');
      px(c, p.x-bw/2, by, bw, 5, '#3a1a10');
      px(c, p.x-bw/2, by, bw*Math.max(0,b.hp/b.hpMax), 5, '#ffb83c');
      c.font="8px 'Press Start 2P', monospace"; c.textAlign='center';
      c.fillStyle='#07040c'; c.fillText(b.hp+'/'+b.hpMax, p.x+1, by-4);
      c.fillStyle='#ffe9a8'; c.fillText(b.hp+'/'+b.hpMax, p.x, by-5);
    });
  }

  /* ============================================================
     FUMAÇA COLORIDA — ult do Smergulão. Nuvens de cinco cores
     subindo devagar sobre a METADE do campo do time protegido.
     Sem estado próprio: a posição sai de `t`.
     ============================================================ */
  const CORES_FUMACA=['#ff5fa2','#5ad6ff','#ffe066','#9cff5e','#c46bff'];
  function desenharFumacas(c, fs){
    if(!fs) return;
    ['aliado','inimigo'].forEach(lado=>{
      const f=fs[lado]; if(!f) return;
      const x0 = lado==='aliado'? 0 : W*0.5, larg=W*0.5;
      for(let i=0;i<34;i++){
        const vel=0.18+(i%5)*0.05;
        const y = H*0.95 - ((t*vel + i*47) % (H*0.85));
        const x = x0 + ((i*83) % larg) + Math.sin(t*0.015+i)*14;
        const r = 10 + (i%4)*5 + (1-y/H)*10;               // cresce conforme sobe
        c.globalAlpha = 0.16 + 0.12*Math.sin(t*0.03+i);
        disco(c, x, y, Math.round(r), CORES_FUMACA[i%5]);
      }
      c.globalAlpha=1;
    });
  }

  /* ============================================================
     API
     ============================================================ */
  /* tamanho do canvas: em vez de ler clientWidth/clientHeight A CADA
     QUADRO (leitura de layout logo depois dos transforms escritos pelos
     sprites — o navegador refazia o layout toda vez), um ResizeObserver
     avisa quando mudou. Sem ResizeObserver, confere todo quadro como antes. */
  let ro=null, tamSujo=true, vinheta=null;
  function ligar(canvas){
    cv=canvas; ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
    off=document.createElement('canvas'); offCtx=off.getContext('2d');
    W=0; H=0;                       // força o primeiro desenho
    tamSujo=true; vinheta=null;
    if(ro){ ro.disconnect(); ro=null; }
    if(typeof ResizeObserver!=='undefined'){ ro=new ResizeObserver(()=>{ tamSujo=true; }); ro.observe(cv); }
  }
  function sortear(){
    atual=AMBIENTES[(Math.random()*AMBIENTES.length)|0];
    W=0;                            // redesenha a camada parada
    return atual;
  }
  function usar(id){
    const a=AMBIENTES.find(x=>x.id===id);
    if(a){ atual=a; W=0; }
    return atual;
  }
  function nome(){ return atual? atual.icone+' '+atual.nome : ''; }

  function redimensionar(){
    if(!tamSujo && W && H) return false;            // nada mudou desde o último quadro
    tamSujo = (typeof ResizeObserver==='undefined');
    const w=Math.max(1, cv.clientWidth|0), h=Math.max(1, cv.clientHeight|0);
    if(w===W && h===H) return false;
    W=w; H=h;
    cv.width=W; cv.height=H; off.width=W; off.height=H;
    ctx.imageSmoothingEnabled=false; offCtx.imageSmoothingEnabled=false;
    offCtx.clearRect(0,0,W,H);
    if(atual) atual.estatico(offCtx);
    // vinheta: o gradiente só muda com o tamanho — criado uma vez aqui
    vinheta=ctx.createRadialGradient(W/2,H*0.55,H*0.30, W/2,H*0.55,W*0.72);
    vinheta.addColorStop(0,'rgba(0,0,0,0)'); vinheta.addColorStop(1,'rgba(6,3,12,.66)');
    return true;
  }

  /* `escuro` (0–1): ULTIMATE carregando — o cenário apaga e os lutadores
     (que são desenhados por cima, em outros canvas) ficam em destaque. */
  function passo(estruturas, ambiente, barreiras, fumacas, escuro){
    if(!cv || !atual) return;
    t++;
    redimensionar();
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(off,0,0);
    atual.animado(ctx);
    desenharAmbiente(ctx, ambiente);
    desenharEstruturas(ctx, estruturas);
    desenharBarreiras(ctx, barreiras);
    desenharFumacas(ctx, fumacas);
    if(escuro>0){ ctx.globalAlpha=Math.min(0.85, escuro); ctx.fillStyle='#05030a'; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
    // vinheta: escurece as bordas para os lutadores saltarem à vista
    if(vinheta){ ctx.fillStyle=vinheta; ctx.fillRect(0,0,W,H); }
  }

  /* onde a muralha de um lado está, em coordenadas de TELA (o TurnUI
     usa pra mandar o golpe voar até ela) */
  function posBarreiraTela(lado){
    if(!cv) return null;
    const r=cv.getBoundingClientRect(), p=posBarreira(lado);
    return { x:r.left+p.x, y:r.top+p.y-p.alt*0.5 };
  }

  return { ligar, sortear, usar, nome, passo, posBarreiraTela, posEstruturaTela, AMBIENTES, get atual(){ return atual; } };
})();
