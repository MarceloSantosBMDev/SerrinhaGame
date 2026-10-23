/* ============================================================
   INTERIORES DO CAPÍTULO 1, PARTE 2 — A TORRE DO RELÓGIO
   ------------------------------------------------------------
   Quatro andares de 13×13 ligados por ESCADA (porta na parede do
   fundo, à direita) e pela porta de baixo (desce um andar):
     torre_terreo  máquina do relógio, o Eco do Marcelão (luta)
     torre_andar1  ENGRENAGENS: 3 alavancas, cada uma gira 2 engrenagens
     torre_andar2  MOSTRADOR: 4 rodas que giram PRA TRÁS (código 0334)
     torre_andar3  PÊNDULOS I, II, III na ordem da inscrição (III, I, II)
     torre_topo    o relógio gigante, o Protótipo-00 e o Marcelão
   A escada de cada andar só destrava com o puzzle do andar resolvido.
   Os puzzles usam as ferramentas de `Missoes.puzzles` (roteiro_c1b.js).
   ============================================================ */
(function(){
  const W=13, H=13, EX=6;
  /* casca de um andar: pedra, face de parede, porta de baixo e escada */
  function andar(p, o){
    p.ret(0,0,W,H,'parede_topo_casa');
    p.ret(1,1,W-2,H-2,'piso_pedra_int'); p.ret(1,1,W-2,1,'ppedra_a'); p.ret(1,2,W-2,1,'ppedra_b');
    p.ret(EX,H-1,1,1,'piso_pedra_int');
    p.porta(EX,H-1, o.desce, { nome:o.nomeDesce||'Descer' });
    p.obj('tapete_bemvindo', EX, H-2, { semCol:true });
    if(o.sobe){
      p.ret(W-3,2,1,1,'piso_pedra_int');
      p.porta(W-3,2, o.sobe, { nome:'Escada', trava:o.trava });
      p.obj('escada_sobe', W-3, 2.95, { semCol:true });
    }
    p.obj('janela_arco', 2, 2, { semCol:true }); p.obj('janela_arco', 4, 2, { semCol:true });
    p.luz(EX,6,5,'#ffe2a0');
    p.ponto('saidaInterior', EX, H-2);
  }
  const PZ = () => Missoes.puzzles;

  Mundo.regiao('torre_terreo', { nome:'Torre do Relógio — Térreo', w:W, h:H, semente:3301, interior:true, fora:'telaviv', portaFora:[69,36],
    pintar(p, S){
      andar(p, { desce:['telaviv', 69, 37, 0], nomeDesce:'Sair pra praça', sobe:['torre_andar1', EX, H-2, 3],
        trava:{ se:S=>S.flag('luta:eco'), texto:'A escada está coberta de gelo. Lá em cima, alguma coisa transparente desce degrau por degrau…' } });
      p.obj('maquina_relogio', EX, 3, { interagir:true, texto:['O mecanismo central da torre. As engrenagens giram… ao contrário.','Tem um encaixe vazio no meio, do tamanho de um relógio de bolso.'] });
      p.obj('engrenagem_g', 2, 5); p.obj('engrenagem_g', 3, 9); p.obj('pendulo', 10, 8);
      p.obj('caixa_ferramentas', 2, 11, { interagir:true, texto:['A caixa de ferramentas do Seu Ezequiel. Na tampa: "EZEQUIEL — 40 ANOS DE CORDA".'] });
    } });

  Mundo.regiao('torre_andar1', { nome:'Torre do Relógio — 1º Andar', w:W, h:H, semente:3302, interior:true, fora:'telaviv', portaFora:[69,36],
    pintar(p, S){
      andar(p, { desce:['torre_terreo', W-3, 3, 0], sobe:['torre_andar2', EX, H-2, 3],
        trava:{ se:S=>S.flag('torre_p1'), texto:'Uma grade de engrenagens trava a escada. As três engrenagens do andar estão desalinhadas.' } });
      const cfg={ id:'torre_eng', flag:'torre_p1', inicio:[1,2,3], objs:['eng_1','eng_2','eng_3'], liga:[[0,1],[1,2],[0,2]] };
      const est = S.puz('torre_eng') || cfg.inicio;
      [3,6,9].forEach((x,i)=>p.obj('engrenagem_seta_'+(S.flag('torre_p1')?0:est[i]), x, 5.4, { id:'eng_'+(i+1) }));
      ['A','B','C'].forEach((l,i)=>p.obj('alavanca', [3,6,9][i], 8, { interagir:true, verbo:'⚙ PUXAR '+l, faz:PZ().alavanca(cfg, i) }));
      p.obj('placa_parede', 6, 1.7, { interagir:true, raio:96, semCol:true, texto:['Gravado na pedra: "ALAVANCA A: 1ª e 2ª. ALAVANCA B: 2ª e 3ª. ALAVANCA C: 1ª e 3ª. CADA PUXADA, UM QUARTO DE VOLTA."','"Quando as três olharem pro céu, a escada obedece."'] });
    } });

  Mundo.regiao('torre_andar2', { nome:'Torre do Relógio — 2º Andar', w:W, h:H, semente:3303, interior:true, fora:'telaviv', portaFora:[69,36],
    pintar(p, S){
      andar(p, { desce:['torre_andar1', W-3, 3, 0], sobe:['torre_andar3', EX, H-2, 3],
        trava:{ se:S=>S.flag('torre_p2'), texto:'A escada está presa por um mostrador de quatro rodas. Ele pede uma HORA.' } });
      const dig = S.flag('torre_p2') ? [0,3,3,4] : (S.puz('torre_dig') || [1,1,1,1]);
      [3,5,7,9].forEach((x,i)=>p.obj('digito_'+dig[i], x, 5, { id:'roda_'+(i+1), interagir:true, verbo:'↺ GIRAR', faz:[{ fn:(S2, prox)=>{
        if(S2.flag('torre_p2')){ prox(); return false; }
        const d=(S2.puz('torre_dig')||[1,1,1,1]).slice(); d[i]=(d[i]+9)%10; S2.puz('torre_dig', d);
        Mundo.trocarSprite('roda_'+(i+1), 'digito_'+d[i]); prox(); return false; } }] }));
      p.obj('painel_relogio', 6, 8, { interagir:true, verbo:'✔ TESTAR', faz:[{ fn:(S2, prox)=>{
        if(S2.flag('torre_p2')){ prox(); return false; }
        const d=(S2.puz('torre_dig')||[1,1,1,1]).join('');
        if(d==='0334'){ Missoes.fazer([{ fala:[{ quem:false, texto:'03:34. O mostrador estala, os ponteiros dão UM passo pra frente — o primeiro em dias — e a escada destrava.' }] }, { flag:'torre_p2' }], prox); }
        else Mundo.falar([{ quem:false, texto:'O mostrador marca '+d.slice(0,2)+':'+d.slice(2)+'. Nada acontece. Os ponteiros riem baixinho: tique, taque.' }], {}, prox);
        return false; } }] });
      p.obj('placa_parede', 6, 1.7, { interagir:true, raio:96, semCol:true, texto:['Na parede, em letra de relojoeiro: "O MINUTO QUE FUGIU ABRE O CAMINHO."','Embaixo, riscado à faca: "as rodas giram pra trás. como tudo aqui."'] });
    } });

  const PEND = { id:'torre_pend', flag:'torre_p3', ordem:['III','I','II'], ok:'DONNNG. O pêndulo balança e fica balançando. ', erro:'Os três pêndulos param de uma vez. Silêncio. Ordem errada — começa de novo.',
    acerto:'O terceiro pêndulo completa o acorde: DONG — DING — DANG. A escada do topo desce sozinha, rangendo.' };
  Mundo.regiao('torre_andar3', { nome:'Torre do Relógio — 3º Andar', w:W, h:H, semente:3304, interior:true, fora:'telaviv', portaFora:[69,36],
    pintar(p, S){
      andar(p, { desce:['torre_andar2', W-3, 3, 0], sobe:['torre_topo', EX, H-2, 3],
        trava:{ se:S=>S.flag('torre_p3'), texto:'A escada do topo está recolhida. Os pêndulos do andar estão parados.' } });
      ['I','II','III'].forEach((rom,i)=>p.obj('pendulo_'+(i+1), [3,6,9][i], 6, { interagir:true, verbo:'🔔 TOCAR '+rom, faz:PZ().passoSequencia(PEND, rom) }));
      p.obj('placa_parede', 6, 1.7, { interagir:true, raio:96, semCol:true, texto:['Inscrição em latim de relojoeiro, traduzida embaixo a giz:','"O FIM VEM ANTES DO COMEÇO. O MEIO FICA PRO FIM."'] });
    } });

  Mundo.regiao('torre_topo', { nome:'Torre do Relógio — Topo', w:W, h:H, semente:3305, interior:true, fora:'telaviv', portaFora:[69,36], escuro:0.25,
    pintar(p, S){
      andar(p, { desce:['torre_andar3', W-3, 3, 0] });
      p.obj('relogio_gigante', EX, 4.6, { semCol:false, interagir:true, texto:['O relógio gigante de gelo. Os ponteiros giram pra trás, rápido demais pra contar.'] });
      p.luz(EX,3,6,'#9fe8ff');
      p.obj('engrenagem_g', 2, 9); p.obj('engrenagem_g', 10, 9);
    } });
})();
