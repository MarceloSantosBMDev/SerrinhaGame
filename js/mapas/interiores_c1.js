/* ============================================================
   INTERIORES DO CAPÍTULO 1 (Tel Aviv)
   Interior = mapa pequeno com a mesma engine. Parede vista de cima:
   `parede_topo` (o alto da parede, escuro) + 2 fileiras de
   `parede_face` (a frente da parede, que dá pra ver) no topo de cada sala.
   ============================================================ */
(function(){
  /* sala: chão + as 2 fileiras de cima viram a face da parede */
  function sala(p, x, y, w, h, piso){ p.ret(x,y,w,h,piso||'piso_lab'); p.ret(x,y,w,2,'parede_face'); }
  /* passagem: abre o chão entre duas salas */
  function passagem(p, x, y, w, h, piso){ p.ret(x,y,w,h,piso||'piso_lab'); }

  /* ---------------- LABORATÓRIO 5000Z ----------------
       A (cápsula) ── B (contenção)
                        │
       D (saguão) ──── C (protótipos)
       └ saída (Tel Aviv) */
  Mundo.regiao('lab5000z', {
    nome:'Laboratório 5000Z', w:37, h:34, semente:5000, interior:true, fora:'telaviv', portaFora:[13,20],
    pintar(p){
      p.ret(0,0,37,34,'parede_topo');
      sala(p, 2,2,13,11);              // A — sala da cápsula
      sala(p, 18,2,17,11);             // B — ala de contenção
      sala(p, 18,16,17,15);            // C — sala dos protótipos
      sala(p, 2,16,13,15);             // D — saguão do portão
      passagem(p, 15,7,3,2);           // A → B
      p.ret(15,6,3,1,'parede_face');
      passagem(p, 25,12,2,6);          // B → C (atravessa a face da parede de C)
      passagem(p, 15,23,3,2);          // C → D
      p.ret(15,22,3,1,'parede_face');
      p.ret(7,31,3,2,'piso_lab');      // corredor da saída
      p.porta(8,32, ['telaviv', 13, 21, 0], { nome:'Saída pra Tel Aviv',
        trava:{ se:S=>S.flag('guardiao_vencido'), texto:'O portão de saída não abre. Um painel pisca: "ORDEM DO CRIADOR: UNIDADE 5000Z NÃO SAI."' } });

      // portões: A→B abre com o alarme (missão Contenção); C→D com o cartão
      p.obj('portao_grade', 16, 7.6, { id:'grade_ab', solidoT:[15,7,3,2], se:S=>!S.comecou('c1_contencao'), interagir:true,
        texto:['Uma grade de contenção. Do outro lado, o barulho de rodinhas fazendo ronda.'] });
      p.obj('portao_grade', 16, 23.6, { id:'grade_cd', solidoT:[15,23,3,2], se:S=>!S.flag('cartao_lab'), interagir:true,
        texto:['GRADE DO SAGUÃO — leitor de cartão piscando em vermelho. "ACESSO: SOMENTE CRIADOR."'] });

      // A — cápsula, terminais, tanques
      p.obj('capsula', 7, 4.6, { id:'capsula', se:S=>!S.flag('acordou') });
      p.obj('capsula_aberta', 7, 4.6, { id:'capsula_aberta', se:S=>S.flag('acordou'), interagir:true,
        texto:['A cápsula onde você acordou. Ainda tem o formato do seu corpo no estofado.', 'Gravado no vidro, por dentro: "Nº 5000. Que este seja o último."'] });
      p.obj('terminal', 3, 4.4, { id:'term_registro', interagir:true, investigar:'term_registro', verbo:'💻 LER', arquivo:'lore_voluntario',
        texto:['REGISTRO 5000Z — "Voluntário nº 1. Assinou o termo SORRINDO. Pediu pra ser chamado de Mecas."', '"Lembrança de consentimento: IMPLANTADA COM SUCESSO."', '...implantada?'] });
      p.obj('terminal', 12, 4.4, { id:'term_memoria', interagir:true, investigar:'term_memoria', verbo:'💻 LER',
        texto:['ELETROENCEFALOGRAMA — o gráfico desenha uma linha reta… e, de repente, um pico.', 'Legenda do pico: "03:33 — memória sobrescrita. Original arquivada em: ███ (CORROMPIDO)".'] });
      p.obj('tanque', 3, 10); p.obj('tanque', 13, 10); p.obj('cabos', 7, 11);
      p.luz(7,6,4,'#7fffd4');

      // B — contenção
      p.obj('bancada', 22, 4.5); p.obj('bancada', 30, 4.5); p.obj('armario', 33.2, 10); p.obj('caixa', 19.5, 11);
      p.obj('terminal', 26, 4.4, { id:'term_ordem', interagir:true, verbo:'💻 LER', arquivo:'lore_ordem_criador',
        texto:['ORDEM DO CRIADOR (M.B.JW): "Se a 5000 acordar antes da hora, CONTENHAM. Ela é a única que deu certo."', '"As outras 4999 vão pro ferro-velho. Sem pressa. Eu tenho todo o tempo do mundo."'] });

      // C — protótipos
      for(let i=0;i<5;i++) p.obj('prototipo', 20+i*3.2, 18.6);
      p.obj('prototipo', 33, 24); p.obj('prototipo', 20, 28); p.obj('bancada', 27, 28.5);
      p.obj('prototipo', 22.5, 23, { interagir:true, coletavel:'prot_1000z', verbo:'🔍 VER' });
      p.obj('prototipo', 31, 21.5, { interagir:true, coletavel:'prot_2000z', verbo:'🔍 VER' });
      p.obj('bau', 29, 25, { id:'bau_cartao', interagir:true, investigar:'cartao_lab', verbo:'🔍 ABRIR',
        texto:['Dentro do baú: um CARTÃO DE ACESSO com uma foto sua. Mais nova. Sorrindo.', 'Atrás do cartão, alguém escreveu à mão: "não confie no relógio".'] });

      // D — saguão
      p.obj('armario', 3.2, 19); p.obj('armario', 13, 19); p.obj('caixa', 3, 28); p.obj('caixa', 13, 28.5);
      p.obj('lampiao', 6, 30, { interagir:true, salvar:true, verbo:'🕯 SALVAR' }); p.luz(6,29,3,'#ffd36a');

      p.zona('Sala da Cápsula', 2,2,13,11);
      p.zona('Ala de Contenção', 15,2,20,11);
      p.zona('Sala dos Protótipos', 18,13,17,18);
      p.zona('Saguão do Portão', 2,16,16,17);
    }
  });
})();
