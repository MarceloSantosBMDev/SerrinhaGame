/* ============================================================
   INTERIORES AUTOMÁTICOS — toda construção do mapa tem um "dentro"
   ------------------------------------------------------------
   O pintor (OWPintor.portaAuto) chama `Interiores.registrar(id, o)`
   pra cada casa/prédio/galpão sem `entra` numa região com
   `autoInteriores:true`. Isso REGISTRA uma região interior
   'int:<região>:<x>:<y>' (gerada só quando o jogador entra) e devolve
   onde ele aparece lá dentro. A semente sai do id: a mesma casa tem
   sempre os mesmos móveis.

   Planta: borda de `parede_topo_casa`, a sala com 2 fileiras de face de
   parede no alto (estilo `_a`/`_b`, ver OWArte.paredeInterna) e a porta
   de saída no meio da parede de baixo. Móveis encostam nas paredes; a
   coluna da porta fica sempre livre (dá pra entrar e sair sem travar).

   Tipos: casa, loja, predio (escritório ou saguão), galpao, templo,
   hotel, padaria, taverna, torre. Os interiores com nome próprio
   (padaria, taverna, casa_careca, torre_terreo) usam o mesmo montador
   com ajustes e ficam registrados no fim do arquivo.
   ============================================================ */
const Interiores = (function(){
  const T = 32;
  const hashStr = s => { let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  const NOMES = { casa:'Casa', loja:'Loja', predio:'Prédio', galpao:'Galpão', templo:'Templo', hotel:'Hotel Mar Azul', padaria:'Padaria Pão do Minuto', taverna:'Taverna do Porto', torre:'Torre do Relógio' };

  function dims(tipo, larg, r){
    larg=larg||4;
    if(tipo==='casa')   return { w:clamp(larg*2+4+Math.floor(r()*2), 11, 17), h:11 };
    if(tipo==='loja')   return { w:clamp(larg*2+3, 12, 16), h:10 };
    if(tipo==='predio') return { w:clamp(larg*2+6, 14, 20), h:12 };
    if(tipo==='galpao') return { w:17, h:12 };
    if(tipo==='templo') return { w:15, h:15 };
    if(tipo==='hotel')  return { w:19, h:12 };
    if(tipo==='padaria')return { w:15, h:11 };
    if(tipo==='taverna')return { w:17, h:12 };
    if(tipo==='torre')  return { w:13, h:13 };
    return { w:12, h:10 };
  }

  /* ---------------- falas de quem mora/trabalha lá dentro ---------------- */
  const FALAS = {
    casa: [
      ['Visita? Às 03:33? Entra, entra. Não repara a bagunça, ela tá parada desde ontem.'],
      ['Eu ia fazer café. A água ferveu às 03:33 e tá fervendo até agora. Quer?'],
      ['A novela parou no beijo. Faz uma eternidade que eles tão quase se beijando.'],
      ['Meu filho foi pro quarto "um minutinho". Ele nunca mentiu tanto.'],
      ['Shalom! Cuidado com o gato. Ele tá parado no meio do pulo, mas morde.'],
      ['Eu tava fechando a janela quando tudo parou. Agora tô sempre fechando a janela.'],
      ['Você é o técnico da TV? Ela só passa 03:33. Já tentei bater nela. Duas vezes.']
    ],
    loja: [['Promoção relâmpago! Pena que o relâmpago parou no meio também.'], ['Tudo pela metade do preço. A outra metade você paga quando o relógio andar.']],
    predio: [['Reunião às 03:30. Ela começou. Ela não acaba. Eu tô aqui desde sempre.'], ['O elevador tá no 33º andar. Desde 03:33. Eu subo de escada. Eu SEMPRE subo de escada.'], ['Bem-vindo ao 1º andar. Os outros 32 você imagina.']],
    galpao: [['Turno da noite. A noite não acaba, o turno também não. Pelo menos é hora extra infinita.'], ['Não mexe nas caixas. Tem coisa do M.B.JW aí dentro. Coisa que FAZ tique-taque.']],
    templo: [['Shhh. Aqui a gente reza pro tempo voltar. Ou pelo menos pra ele lembrar da gente.'], ['A vela não derrete. Milagre ou relógio quebrado? Eu prefiro milagre.']],
    hotel: [['Check-in? Claro! Check-out só quando o relógio andar. Política da casa.'], ['O hóspede do 333 pediu pra não ser incomodado. Ele foi atendido. Pela eternidade.']]
  };

  /* ---------------- registro ---------------- */
  function registrar(id, o){
    const s=hashStr(id), r=OWPintor.rng(s), tipo=o.tipo||'casa';
    const d=dims(tipo, o.larg, r);
    const ex=Math.floor(d.w/2);
    if(!Mundo.REGIOES[id]){
      Mundo.regiao(id, {
        nome: o.nome || NOMES[tipo] || 'Interior', w:d.w, h:d.h, semente:s, interior:true,
        fora:o.fora, portaFora:o.porta, tipoInterior:tipo,
        pintar(p, S){ montar(p, Object.assign({}, o, { id, tipo }), d.w, d.h, s); }
      });
    }
    return [ex, d.h-2];
  }

  /* ---------------- montagem ---------------- */
  function montar(p, o, w, h, s){
    const r=OWPintor.rng(s ^ 0x9e3779b9);
    const pick = l => l[Math.floor(r()*l.length)];
    const ex=Math.floor(w/2);
    const ocup=new Set();
    const livre=(x,y,ww,hh)=>{ for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++){ if(i<1||j<3||i>w-2||j>h-2) return false; if(ocup.has(i+','+j)) return false; } return true; };
    const ocupar=(x,y,ww,hh)=>{ for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) ocup.add(i+','+j); };
    // coluna da porta e a fileira de chegada ficam livres
    for(let j=3;j<h-1;j++) ocupar(ex,j,1,1);
    ocupar(ex-1,h-2,3,1);
    /* põe um objeto ocupando wT×hT tiles a partir de (x,y) (pés no meio de baixo) */
    const por=(nome,x,y,wT,hT,extra)=>{ ocupar(x,y,wT,hT); return p.obj(nome, x+wT/2-0.5, y+hT-1, extra||null); };
    const tenta=(nome,x,y,wT,hT,extra)=>{ if(!livre(x,y,wT,hT)) return null; return por(nome,x,y,wT,hT,extra); };
    /* encosta na parede do fundo (fileira 3), da esquerda/direita pro meio */
    const fundo=(lista, de, ate)=>{ let x=de; for(const it of lista){ const [n,wT,hT,ex2]=it; while(x+wT-1<=ate && !livre(x,3,wT,hT)) x++; if(x+wT-1>ate) break; por(n,x,3,wT,hT,ex2); x+=wT+(it[4]||0); } };
    /* encosta numa parede lateral, de cima pra baixo */
    const lateral=(lista, xcol, de, ate)=>{ let y=de; for(const it of lista){ const [n,wT,hT,ex2]=it; while(y+hT-1<=ate && !livre(xcol-(wT-1)*(xcol>w/2?1:0),y,wT,hT)) y++; if(y+hT-1>ate) break; por(n,xcol-(wT-1)*(xcol>w/2?1:0),y,wT,hT,ex2); y+=hT+(it[4]||0); } };
    /* peça de parede (janela, quadro, relógio): na face, sem colisão */
    // (raio maior: quem interage está no chão, uma fileira abaixo da parede)
    const naParede=[];
    const parede=(nome,x,alt,extra)=>{ naParede.push(x); return p.obj(nome, x, alt!=null?alt:2, Object.assign({ semCol:true }, extra&&extra.interagir?{ raio:96 }:{}, extra||{})); };    // janelas por último: pulam o lugar de quadro/relógio/cardápio que já está na parede
    const janelas=(de,ate,passo,nome)=>{ for(let x=de;x<=ate;x+=passo) if(Math.abs(x-ex)>0 && !naParede.some(q=>Math.abs(q-x)<1.3)) parede(nome||'janela_int', x); };
    const tapete=(nome,x,y)=>p.obj(nome, x, y, { semCol:true });
    const sala=(x,y,ww,hh,piso,par)=>{ p.ret(x,y,ww,hh,piso); p.ret(x,y,ww,1,par+'_a'); p.ret(x,y+1,ww,1,par+'_b'); };
    const morador=(desenho, x, y, falas, nome)=>{
      if(typeof Missoes==='undefined') return;
      // região com gente própria (o reino: só smergs) troca o desenho e as falas
      if(o.falasMoradores && o.falasMoradores[T_]) falas=pick(o.falasMoradores[T_]);
      const idN='npc_'+o.id.replace(/[^a-z0-9]/gi,'_');
      Missoes.def.npc(idN, { desenho, nome:nome||'', em:[o.id, x, y], dir:0, anda:{ tipo:'vagar', r:1.5, vel:28, espera:3 }, falas });
      ocupar(x,y,1,1);
    };
    const cid = () => o.moradores ? pick(o.moradores) : (r()<0.35 ? 'marionete:' : 'cidadao:') + Math.floor(r()*8);
    const T_ = o.tipo;

    // casca: tudo parede, sala inteira, porta de saída embaixo
    p.ret(0,0,w,h,'parede_topo_casa');
    const estilo = {
      casa:   [pick(['piso_tabuas','piso_tabuas','madeira','piso_ladrilho']), pick(['pcreme','pverde','prosa','pcreme','ptijolo'])],
      loja:   ['piso_ladrilho', pick(['pcreme','pazulejo','pverde'])],
      predio: ['piso_marmore', pick(['pvidro','pcreme'])],
      galpao: ['piso_concreto', 'ptijolo'],
      templo: ['piso_marmore', 'ppedra'],
      hotel:  ['piso_marmore', 'pcreme'],
      padaria:['piso_ladrilho', 'pazulejo'],
      taverna:['piso_tabuas', 'pmadeira'],
      torre:  ['piso_pedra_int', 'ppedra']
    }[T_] || ['piso_tabuas','pcreme'];
    sala(1,1,w-2,h-2,estilo[0],estilo[1]);
    p.ret(ex,h-1,1,1,estilo[0]);
    p.porta(ex,h-1,[o.fora, o.porta[0], o.porta[1]+1, 0], { nome:'Sair' });
    p.obj('tapete_bemvindo', ex, h-2, { semCol:true });
    p.ponto('saidaInterior', ex, h-2);
    const luzMorna=(x,y)=>p.luz(x,y,3.2,'#ffd9a0');
    // interiores com nome próprio: as pistas da história vêm ANTES dos móveis (o espaço é delas)
    if(o.extra) o.extra(p, { w, h, ex, tenta, por, parede, fundo, ocupar, livre, r });

    /* ================= CASA ================= */
    if(T_==='casa'){
      const div = w>=13 ? Math.floor(w*0.58) : 0;      // parede interna: sala | quarto
      if(div && div!==ex && Math.abs(div-ex)>1){
        p.ret(div,1,1,h-2,'parede_topo_casa');
        p.ret(div,h-4,1,2,estilo[0]);                  // vão de passagem embaixo
        for(let j=3;j<h-1;j++) ocupar(div,j,1,1);
        ocupar(div-1,h-4,3,2);
      }
      const esqFim = div ? div-1 : w-2;
      // cozinha no canto esquerdo do fundo
      fundo([['geladeira',1,1,{ interagir:true, texto:['Dentro da geladeira: um pudim parado no meio do tremelique.','O gelo não derrete. O pudim não cai. Eletrodoméstico do ano.'] }],
             ['balcao_coz',1,1], [pick(['fogao','fogao','fogao_lenha']),1,1], ['pia',1,1], ['armario_coz',1,1]], 1, Math.min(esqFim, ex-1));
      // sala: sofá + estante + TV do outro lado da porta
      const salaDe = ex+1, salaAte = esqFim;
      if(salaAte-salaDe>=2){
        fundo([['estante_livros',1,1,{ interagir:true, texto:[pick(['Um livro chamado "Como Aproveitar Cada Minuto". O marcador está na página 333.','Enciclopédia, volume R: "Relógio — ver também: problema".','Um álbum de fotos. Em todas, alguém está olhando o relógio.'])] }],
               [pick(['sofa','sofa_grande','sofa_longo']),2,1], ['planta_vaso',1,1]], salaDe, salaAte);
        tenta('tapete_oval', salaDe, 5, Math.min(3,salaAte-salaDe+1), 2, { semCol:true });
        tenta('mesinha_redonda', salaDe+1, 5, 1, 1);
      }
      // mesa de jantar à esquerda, no meio
      if(ex-1>=4){ const mx=Math.max(1, Math.floor((ex-1)/2)-1); if(tenta('mesa_jantar', mx, 6, 2, 1)){ tenta('cadeira', mx-1, 6, 1, 1); tenta('cadeira', mx+2, 6, 1, 1); } }
      tenta('tv', 1, h-3, 1, 1, { interagir:true, texto:['A TV mostra um relógio digital em tela cheia: 03:33.','Em todos os canais. Até no de culinária. O bolo está assando há uma eternidade.'] });
      // quarto (se tiver parede interna) ou canto da cama
      if(div){
        const qDe=div+1, qAte=w-2;
        fundo([[pick(['cama_casal','cama_casal2','cama_solteiro']),2,2], ['criado_mudo',1,1], ['guarda_roupa',2,1]], qDe, qAte);
        tenta('abajur', qAte, 6, 1, 1);
        tenta('espelho', qAte, 7, 1, 1);
        tenta(pick(['tapete_azul','tapete_oval']), qDe, 6, Math.min(3,qAte-qDe+1), 2, { semCol:true });
        parede(pick(['quadro_paisagem','quadro_flor','quadro_mar']), qDe+1.5, 1.7);
        luzMorna(qDe+1, 5);
      } else {
        tenta(pick(['cama_solteiro','cama_azul','cama_roxa']), w-3, 5, 2, 2) || tenta('cama_azul', w-2, 5, 1, 3);
        tenta('criado_mudo', w-2, 4, 1, 1);
      }
      // paredes: relógio, foto e as janelas no que sobrar
      parede('relogio_parede', ex-1.5, 1.6, { interagir:true, texto:['Relógio de parede: 03:33.','Você dá uma batidinha nele. Ele te encara de volta. 03:33.'] });
      parede(pick(['foto_familia','calendario','prateleira_parede']), ex+1.5, 1.7);
      janelas(2, (div||w-1)-1, 4);
      tenta(pick(['planta_vaso2','vaso_azul','vaso_porcelana']), 1, h-2, 1, 1);
      tenta('luminaria_pe', w-2, h-2, 1, 1);
      luzMorna(ex, 5);
      if(r()<0.55){ const nx=Math.max(2, ex-2-Math.floor(r()*2)); morador(cid(), nx, h-4, pick(FALAS.casa)); }
      if(r()<0.25) tenta('gato', w-3, h-3, 1, 1, { semCol:true, interagir:true, texto:['Um gato parado no meio do pulo. Os bigodes estão eriçados há horas.'] });
    }

    /* ================= LOJA (casa com placa) ================= */
    else if(T_==='loja'){
      fundo([['estante_cheia',1,1],['estante_cheia',1,1],['estante_vazia',1,1],['caixa_frutas',2,1],['estante_cheia',1,1]], 1, ex-1);
      fundo([['caixa_legumes',2,1],['estante_cheia',1,1],['sacos',2,1]], ex+1, w-2);
      tenta('vitrine', ex+1, 6, 3, 1) || tenta('balcao_bar', ex+1, 6, 2, 1);
      tenta('caixa_registradora', ex+2, 5, 1, 1, { interagir:true, texto:['A caixa registradora marca R$ 3,33. Em todas as vendas.'] });
      tenta('cesto_pao', 1, 6, 1, 1); tenta('tonel', 1, 7, 1, 1); tenta('caixa', 2, 7, 1, 1);
      parede('cardapio', ex-2, 1.7); janelas(2, w-3, 5, 'janela_arco');
      morador(cid(), ex+2, 4, pick(FALAS.loja), 'LOJISTA');
      luzMorna(ex,5);
    }

    /* ================= PRÉDIO: escritório ou saguão ================= */
    else if(T_==='predio'){
      const escritorio = r()<0.55;
      fundo([['planta_vaso2',1,1],['bebedouro',1,1],['maquina_cafe',1,1,{ interagir:true, texto:['Máquina de café: "SEU CAFÉ ESTARÁ PRONTO EM 0 MINUTOS". Faz horas.'] }]], 1, ex-2);
      p.obj('elevador', ex+1.5, 2.95, { semCol:true, raio:64, interagir:true, texto:['O painel do elevador mostra: 33º andar.','Você aperta o botão. Ele acende, apaga, acende. 03:33.'] });
      ocupar(ex+1,3,2,1);
      fundo([['planta_vaso',1,1],['estante_livros',1,1]], ex+3, w-2);
      if(escritorio){
        for(let j=5;j<=h-4;j+=3){ tenta('mesa_escritorio', 2, j, 2, 1, { interagir:true, texto:[pick(['Na tela: uma planilha com uma única célula preenchida. "03:33".','E-mail aberto: "Re: Re: Re: Re: reunião de alinhamento (urgente)". Enviado às 03:33.','Um post-it: "LIGAR PRO M.B.JW SOBRE O PROJETO 5000". Riscado três vezes.'])] }); tenta('cadeira_escritorio', 2, j+1, 1, 1);
          tenta('mesa_escritorio', w-4, j, 2, 1); tenta('cadeira_escritorio', w-3, j+1, 1, 1); }
        parede('calendario', ex-2, 1.7);
      } else {
        tenta('recepcao', ex-4, 5, 3, 1, { interagir:true, texto:['No balcão: um livro de visitas. Última assinatura: "M.B.JW — 03:32 — vim só buscar umas peças".'] });
        tenta('sofa', 1, h-4, 2, 1); tenta('sofa', w-3, h-4, 2, 1); tenta('mesinha_redonda', 1, h-3, 1, 1); tapete('tapete_azul', ex+0.5, 8.6);
        tenta('planta_vaso', w-2, 5, 1, 1);
      }
      janelas(1, w-2, 3, 'janela_arco');
      morador(cid(), ex-2, 6, pick(FALAS.predio), escritorio?'FUNCIONÁRIO':'PORTEIRO');
    }

    /* ================= GALPÃO ================= */
    else if(T_==='galpao'){
      fundo([['estante_metal',2,1],['estante_metal',2,1],['palete',2,2]], 1, ex-1);
      fundo([['estante_metal',2,1],['palete',2,2],['estante_metal',2,1]], ex+1, w-2);
      for(let j=6;j<=h-4;j+=3){ tenta('caixa', 2, j, 1, 1); tenta('barril', 3, j, 1, 1); tenta(pick(['caixa','tonel','pilha_pneus']), w-3, j, 1, 1); tenta('caixa', w-4, j, 1, 1); }
      tenta('empilhadeira', ex+2, h-4, 2, 1, { interagir:true, texto:['Uma empilhadeira com a chave no contato. O garfo parou a um palmo do chão.'] });
      tenta('caixa_ferramentas', ex-2, h-3, 1, 1); tenta('engrenagem', ex-3, 6, 1, 1);
      tenta('prototipo', ex-3, h-4, 2, 1, { interagir:true, texto:['Um robô desmontado com uma etiqueta: "LOTE 4999 — DESCARTAR". Ele ainda pisca.'] });
      p.luz(ex,5,4,'#ffe2a0');
      if(r()<0.6) morador(cid(), ex+3, 6, pick(FALAS.galpao), 'OPERÁRIO');
    }

    /* ================= TEMPLO (cúpula) ================= */
    else if(T_==='templo'){
      p.ret(ex-1,3,3,h-4,'tapete');
      for(let j=6;j<=h-3;j+=2){ tenta('banco_igreja', 1, j, ex-2, 1); tenta('banco_igreja', ex+2, j, w-3-(ex+2)+1, 1); }
      por('altar', ex-1, 3, 3, 1, { interagir:true, texto:['As velas do altar estão acesas. As chamas não tremem. Nem um pouquinho.'] });
      tenta('castical', ex-3, 3, 1, 1); tenta('castical', ex+3, 3, 1, 1);
      for(let x=2;x<w-2;x+=3) if(Math.abs(x-ex)>1) parede('vitral', x, 2);
      tenta('vaso_porcelana', 1, 3, 1, 1); tenta('vaso_porcelana', w-2, 3, 1, 1);
      p.luz(ex,4,5,'#ffe2a0');
      morador('cidadao:5', 2, 4, pick(FALAS.templo), 'ZELADOR');
    }

    /* ================= HOTEL ================= */
    else if(T_==='hotel'){
      tenta('recepcao', ex+2, 4, 3, 1, { interagir:true, texto:['Livro de hóspedes: "Fat Mango e Mameluco — Limeira-SP — quarto 12 — chegaram às 03:30, ainda não fizeram check-in".'] });
      p.obj('elevador', ex-2.5, 2.95, { semCol:true, raio:64, interagir:true, texto:['ELEVADOR — "FORA DE SERVIÇO DESDE 03:33. USE A ESCADA. A ESCADA TAMBÉM PAROU."'] }); ocupar(ex-3,3,2,1);
      fundo([['piano',2,2],['planta_vaso2',1,1]], 1, ex-4);
      fundo([['estante_livros',1,1],['planta_vaso',1,1]], w-3, w-2);
      tapete('tapete_real', ex+0.5, 8.4);
      tenta('sofa_grande', 1, h-4, 2, 1); tenta('poltrona', 3, h-4, 1, 1); tenta('sofa_grande', w-3, h-4, 2, 1); tenta('poltrona2', w-4, h-4, 1, 1);
      tenta('mesinha_redonda', 2, h-3, 1, 1); tenta('mesinha_redonda', w-3, h-3, 1, 1);
      tenta('pilastra', ex-2, 6, 1, 1); tenta('pilastra', ex+2, 6, 1, 1); tenta('busto', 1, 6, 1, 1, { interagir:true, texto:['Busto do fundador do hotel. Na placa: "Ele sempre chegava na hora". Ironia de bronze.'] });
      tenta('vaso_azul', w-2, 6, 1, 1); tenta('luminaria_pe', 4, h-3, 1, 1); tenta('caixa', w-5, h-3, 1, 1, { interagir:true, texto:['Uma mala esquecida com etiqueta: "LIMEIRA → TEL AVIV". Tem cheiro de manga.'] });
      parede('quadro_rei', ex+3, 1.7); parede('relogio_parede', ex+5, 1.6); janelas(2, w-3, 4, 'janela_arco');
      morador('cidadao:7', ex+3, 5, pick(FALAS.hotel), 'RECEPCIONISTA');
      luzMorna(ex, 5); luzMorna(3, 5); luzMorna(w-4, 5);
    }

    /* ================= PADARIA ================= */
    else if(T_==='padaria'){
      fundo([['forno_padaria',2,1],['estante_pao',2,1],['estante_pao',2,1]], 1, ex-1);
      fundo([['estante_pao',2,1],['geladeira',1,1],['armario_coz',1,1]], ex+1, w-2);
      tenta('balcao_padaria', ex+1, 5, 3, 1, { interagir:true, texto:['Pão francês, sonho, bolo de fubá. Tudo com cara de três minutos de idade.','Três minutos e trinta e três segundos, pra ser exato.'] });
      tenta('caixa_registradora', ex+4, 5, 1, 1);
      tenta('cesto_pao', 1, 5, 1, 1); tenta('cesto_pao', 1, 6, 1, 1); tenta('sacos', 1, 7, 2, 1);
      tenta('mesa_bistro', 2, h-3, 1, 1); tenta('mesa_bistro', w-3, h-3, 1, 1); tenta('mesa_bistro', w-3, h-5, 1, 1);
      parede('cardapio', ex+2.5, 1.7, { interagir:true, texto:['CARDÁPIO: Pão do Minuto (R$ 0,33) · Sonho Parado (R$ 3,33) · Café Eterno (grátis, ele nunca esfria).'] });
      parede('relogio_parede', ex-1.5, 1.6);
      luzMorna(ex,5); luzMorna(3,4);
      morador('cidadao:4', ex+2, 4, [['O forno tá quente desde 03:33. O pão não queima, não cresce, não esfria. Padeiro nenhum sonhou com isso.'],['Leva um sonho. Literalmente: ele tá parado no meio do recheio.']], 'SEU MOTI, O PADEIRO');
    }

    /* ================= TAVERNA ================= */
    else if(T_==='taverna'){
      p.obj('prateleira_garrafas', ex+3, 2.2, { semCol:true }); p.obj('prateleira_garrafas', ex-3, 2.2, { semCol:true });
      fundo([['lareira',2,1],['barril_chopp',1,1],['barril_chopp',1,1]], 1, ex-2);
      fundo([['barril_chopp',1,1],['tonel',1,1],['piano',2,2]], w-6, w-2);
      tenta('balcao_bar', ex+1, 5, 2, 1); tenta('balcao_bar', ex-2, 5, 2, 1);
      tenta('banqueta', ex-2, 6, 1, 1); tenta('banqueta', ex-1, 6, 1, 1); tenta('banqueta', ex+1, 6, 1, 1); tenta('banqueta', ex+2, 6, 1, 1);
      for(const [mx,my] of [[2,h-4],[w-4,h-4],[3,h-6]]){ if(tenta('mesa_redonda', mx, my, 2, 1)){ tenta('cadeira', mx-1, my, 1, 1); tenta('cadeira', mx+2, my, 1, 1); } }
      tenta('braseiro', w-2, h-2, 1, 1);
      p.luz(2,4,4,'#ff9a3a'); luzMorna(ex,5);
      if(o.moradores) morador(o.moradores[0], ex, 4, [['Bem-vindo à Taverna do Bonezinho. Aqui boné pra trás paga meia. Boné pra frente… a gente não fala disso em voz alta.'],['O quadro de recompensas tá na parede. Trabalho honesto. Quase.']], 'TAVERNEIRO SMERG');
      else morador('cidadao:6', ex, 4, [['Zzz… 03:33… zzz… 03:33…'],['(o taverneiro ronca no ritmo exato de um relógio)']], 'TAVERNEIRO ADORMECIDO');
    }

    /* ================= TORRE (térreo) ================= */
    else if(T_==='torre'){
      por('maquina_relogio', ex-1, 3, 3, 1, { interagir:true, texto:['O mecanismo central da torre. As engrenagens giram… ao contrário.','Tem um encaixe vazio no meio, do tamanho de um relógio de bolso.'] });
      tenta('engrenagem_g', 1, 4, 2, 2); tenta('engrenagem_g', w-3, 4, 2, 2); tenta('engrenagem_g', 2, h-4, 2, 1);
      tenta('pendulo', w-3, h-4, 1, 1); tenta('caixa_ferramentas', w-2, h-2, 1, 1);
      for(let x=2;x<w-2;x+=4) if(Math.abs(x-ex)>1) parede('janela_arco', x);
      p.luz(ex,4,4,'#ffe2a0');
    }

  }

  /* ---------------- interiores com nome próprio ---------------- */
  const ENTRADAS = {};
  function especial(id, tipo, fora, porta, nome, extra, opc){
    const s=hashStr(id), d=dims(tipo, 6, OWPintor.rng(s));
    Mundo.regiao(id, { nome, w:d.w, h:d.h, semente:s, interior:true, fora, portaFora:porta, tipoInterior:tipo,
      pintar(p, S){ montar(p, Object.assign({ id, tipo, fora, porta, extra }, opc||{}), d.w, d.h, s); } });
    return ENTRADAS[id] = [Math.floor(d.w/2), d.h-2];
  }
  /* onde o jogador aparece ao entrar num interior com nome próprio: [x, y] */
  const entrada = id => ENTRADAS[id] || [5, 5];
  /* interior feito à mão (js/mapas/interiores_c2.js…) avisa onde se entra nele */
  const fixarEntrada = (id, xy) => { ENTRADAS[id]=xy; };

  return { registrar, especial, entrada, fixarEntrada, dims, montar };
})();

/* ---- os que o mapa de Tel Aviv já chamava pelo nome ---- */
Interiores.especial('padaria', 'padaria', 'telaviv', [47,62], 'Padaria Pão do Minuto');
Interiores.especial('taverna', 'taverna', 'telaviv', [124,84], 'Taverna do Porto');
Interiores.especial('torre_terreo', 'torre', 'telaviv', [69,36], 'Torre do Relógio — Térreo');
Interiores.especial('casa_careca', 'casa', 'telaviv', [44,100], 'Casa do Careca', (p, k)=>{
  k.tenta('espelho', 1, k.h-3, 1, 1, { interagir:true, texto:['Um espelho com um bilhete colado: "CABELO É ESTADO DE ESPÍRITO".'] });
  k.tenta('caixa', k.w-2, k.h-3, 1, 1, { interagir:true, texto:['Uma caixa cheia de pentes. Nenhum foi usado. Nunca.'] });
  // pistas do Cap. 1 (Ruas Que Não Dormem) — o Careca só é CITADO em Tel Aviv
  k.parede('foto_familia', k.ex+3.5, 1.7, { investigar:'careca_foto', interagir:true, verbo:'🔍 OLHAR',
    texto:['Uma foto na parede: dois meninos na praia, de chinelo. Um de óculos, sorrindo torto. Um de cabelo cacheado, segurando um rodo como se fosse uma espada.', 'Atrás da foto, a lápis: "eu e o Mecas. o Mecas perdeu o chinelo de novo."'] });
  k.parede('rodo_suporte', k.ex-3.5, 1.9, { investigar:'careca_rodo', interagir:true, verbo:'🔍 OLHAR',
    texto:['Um suporte de rodo na parede. Vazio. A marca na tinta mostra que ele ficou aqui por anos.'] });
  k.tenta('mesinha', k.ex+2, k.h-4, 1, 1, { investigar:'careca_carta', interagir:true, verbo:'✉ LER',
    texto:['Uma carta em cima da mesinha, com letra apressada:', '"Se alguém achar isso: eu fui pedir um favor no norte. Pra achar meu amigo que sumiu. Volto logo. — C."', 'A carta tem poeira de meses.'] })
    || k.tenta('mesinha', 2, 5, 1, 1, { investigar:'careca_carta', interagir:true, verbo:'✉ LER',
    texto:['Uma carta com letra apressada: "Fui pedir um favor no norte. Pra achar meu amigo que sumiu. Volto logo. — C."'] });
});
