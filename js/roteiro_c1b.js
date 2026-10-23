/* ============================================================
   ROTEIRO — CAPÍTULO 1: TEL AVIV, PARTES 5 a 10 (Etapa 2)
   ------------------------------------------------------------
   Continua de onde o roteiro_c1.js para (o Cargas entrou no grupo):
     5  Caçadores na cidade (Strong + Serrinha, a trégua, o quadro)
     6  Turistas perdidos (Fat Mango, Mameluco, o Corsa, as peças do Astra)
     7  Ferro-velho (cadeado de código) e o Colosso da Muralha
     8  Cidade Velha à noite (a casa do Careca — ele só é CITADO aqui)
     9  A Torre do Relógio: 3 andares de puzzle, Protótipo-00, o Marcelão
    10  Epílogo: a notícia do norte, Protocolo Órfão, o exército de metal,
        a caravana, o Colosso Órfão — e a Estrada do Norte abre.
   Missões que NÃO são de luta: cartazes, peças do Astra, cadeado de
   código, casa do Careca, chave da torre, engrenagens, relógio que anda
   pra trás, pêndulos, recrutar androides, e boa parte das secundárias.
   Números das lutas: os já medidos no roteiro antigo (historia.js).
   Lore: a Smergula NUNCA aparece aqui (só é citada); o Careca só é
   citado; o Lambança é só "Lambança".
   ============================================================ */
(function(){
  const R = Missoes.def;
  const N = (texto, extra) => Object.assign({ quem:false, texto }, extra||{});
  const D = (quem, texto, extra) => Object.assign({ quem, texto }, extra||{});
  const P = (desenho, nome, texto) => ({ quem:null, desenho, nome, texto });
  const L = 'hans_lambanca';
  const T = 32;

  const SENTINELA = { nome:'Sentinela', hp:130, atk:12, def:5, spd:7 };
  const GELIDA    = { nome:'Sentinela Gélida', hp:175, atk:18, def:8, spd:9 };
  const GUARDA    = { nome:'Guarda da Torre', hp:215, atk:23, def:9, spd:10 };
  const ORFAO     = { nome:'Robô Órfão', hp:200, atk:22, def:8, spd:10 };

  /* ============================================================
     PUZZLES (ferramentas reaproveitadas pelo Cap. 2 também)
     ============================================================ */
  /* CADEADO DE CÓDIGO: uma fala com botões pra girar cada dígito.
     `pra_tras`: o dígito gira ao contrário (9→8→…), como os relógios
     do Marcelão. Acertou → liga `flag` e roda `aoAbrir`. */
  function cadeado(cfg){
    return { fn:(S, prox)=>{ abrirCadeado(cfg, prox); return false; } };
  }
  function abrirCadeado(cfg, fim){
    const S=Missoes.S();
    if(S.flag(cfg.flag)){ if(fim) fim(); return; }
    const dig=(S.puz(cfg.id)||cfg.inicio).slice();
    let depois=null;
    const gira=i=>({ t:'↻ '+(i+1)+'º  ['+dig[i]+']', faz:[{ fn:()=>{ dig[i]=cfg.pra_tras ? (dig[i]+9)%10 : (dig[i]+1)%10; S.puz(cfg.id, dig.slice()); depois='de novo'; } }] });
    Mundo.falar([{ quem:false, nome:cfg.nome, texto:cfg.texto+'\n\n     [ '+dig.join('  ')+' ]', escolha:[ gira(0), gira(1), gira(2), gira(3),
      { t:'✔ TESTAR', faz:[{ fn:()=>{ depois = dig.join('')===cfg.codigo ? 'certo' : 'errado'; } }] }, { t:'✖ SAIR' } ] }], {}, ()=>{
        if(depois==='de novo') return abrirCadeado(cfg, fim);
        if(depois==='errado') return Mundo.falar([{ quem:false, texto:cfg.erro||'CLACK. Não abriu.' }], {}, ()=>abrirCadeado(cfg, fim));
        if(depois==='certo'){ Missoes.fazer([{ fala:[N(cfg.acerto||'CLICK. Abriu!')] }, { flag:cfg.flag }].concat(cfg.aoAbrir||[]), fim); return; }
        if(fim) fim();
      });
  }
  /* SEQUÊNCIA: mexer em objetos numa ordem. Errou, zera. */
  function passoSequencia(cfg, quem){
    return [{ fn:(S, prox)=>{
      if(S.flag(cfg.flag)){ prox(); return false; }
      const feitos=(S.puz(cfg.id)||[]).slice(), quer=cfg.ordem[feitos.length];
      if(quem===quer){
        feitos.push(quem); S.puz(cfg.id, feitos);
        if(feitos.length===cfg.ordem.length){ Missoes.fazer([{ fala:[N(cfg.acerto)] }, { flag:cfg.flag }].concat(cfg.aoAcertar||[]), prox); return false; }
        Mundo.falar([{ quem:false, texto:(cfg.ok||'Certo. ')+'('+feitos.length+'/'+cfg.ordem.length+')' }], {}, prox); return false;
      }
      S.puz(cfg.id, []);
      Mundo.falar([{ quem:false, texto:cfg.erro }], {}, prox); return false;
    } }];
  }
  /* ENGRENAGENS (estilo "apaga-luzes"): cada alavanca gira algumas
     engrenagens um quarto de volta. Todas apontando pra cima → resolve. */
  function alavanca(cfg, idx){
    return [{ fn:(S, prox)=>{
      if(S.flag(cfg.flag)){ Mundo.falar([{ quem:false, texto:'As engrenagens já estão alinhadas. A escada destravou.' }], {}, prox); return false; }
      const est=(S.puz(cfg.id)||cfg.inicio).slice();
      cfg.liga[idx].forEach(g=>{ est[g]=(est[g]+1)%4; });
      S.puz(cfg.id, est);
      est.forEach((v,g)=>Mundo.trocarSprite(cfg.objs[g], 'engrenagem_seta_'+v));
      const setas=['↑','→','↓','←'];
      if(est.every(v=>v===0)){ Missoes.fazer([{ fala:[N('CLANC. As três engrenagens travam apontando pra cima. Lá em cima, alguma coisa destranca.')] }, { flag:cfg.flag }], prox); return false; }
      Mundo.falar([{ quem:false, texto:'CRRRK. Engrenagens: '+est.map(v=>setas[v]).join('  ') }], {}, prox); return false;
    } }];
  }
  Missoes.puzzles = { cadeado, passoSequencia, alavanca };

  /* ============================================================
     ITENS, ARQUIVO, COLETÁVEIS
     ============================================================ */
  R.item('bateria_astra', { nome:'Bateria do Astra', icone:'🔋', texto:'Pesada, grudenta e com um adesivo: "PROPRIEDADE DO MAMELUCO. NÃO ENCOSTA."' });
  R.item('pneu_astra',    { nome:'Pneu do Astra', icone:'🛞', texto:'Um pneu careca. "Careca", tipo o apelido daquele cara que ninguém sabe por que chamam assim.' });
  R.item('chave_astra',   { nome:'Chave do Astra', icone:'🔑', texto:'Chaveiro em forma de laranja: "LIMEIRA — CAPITAL DA LARANJA".' });
  R.item('chave_torre',   { nome:'Chave da Torre do Relógio', icone:'🗝', texto:'Chave de bronze, pesada, com o mostrador de um relógio no cabo. Parado em 03:33, claro.' });
  R.item('vara_pesca',    { nome:'Vara de Pescar do Seu Nahum', icone:'🎣', texto:'"Devolve depois. Ou não. Eu não pesco mais. Eu solto."' });
  R.item('rodo_careca',   { nome:'O Rodo do Careca', icone:'🧹', texto:'Um rodo com o cabo gasto no lugar exato da mão. Você conhece esse cabo.' });
  R.item('senha_banco',   { nome:'Senha nº 033', icone:'🎫', texto:'Papelzinho de fila de banco. Número 033. Chamado às 03:33. Nunca atendido.' });
  R.item('coleira_orelha',{ nome:'Coleira velha', icone:'🦴', texto:'Uma coleira gasta com uma plaquinha de metal. Na plaquinha: "ORELHA".' });
  R.item('paes',          { nome:'Pães Quentinhos', icone:'🥖', texto:'Saíram do forno às 03:33. Continuam saindo. Nunca esfriam.' });

  R.arquivo('p_strong',   { cat:'personagem', titulo:'Strong Smerg', texto:'Caçador de recompensa. Um smerg comum que treinou até ficar forte demais — o único assim. Trabalha pra quem paga. Diz que não tem coração. Divide pão com cachorro.' });
  R.arquivo('p_serrinha', { cat:'personagem', titulo:'Serrinha Dog', texto:'Metade gente, metade cachorro, dentes de serra. Parceiro do Strong. Esconde uma coleira com um nome que ele não fala.' });
  R.arquivo('p_mango',    { cat:'personagem', titulo:'Fat Mango', texto:'O Padeiro Blindado. Turista de Limeira. Viajou mil e duzentos quilômetros de Corsa e a primeira coisa que procurou em Tel Aviv foi uma padaria.' });
  R.arquivo('p_mameluco', { cat:'personagem', titulo:'Mameluco', texto:'Turista de Limeira. Dono do Astra prata. Ninguém encosta no retrovisor. Ninguém.' });
  R.arquivo('lore_contrato', { cat:'lore', titulo:'Contrato Lacrado', dica:'Os caçadores guardam um envelope que não abrem.', texto:'No quadro dos caçadores, um envelope roxo lacrado com o selo de uma coroa. Valor: ███. O Strong olha pra ele de vez em quando. Com carinho demais.' });
  R.arquivo('lore_memoria', { cat:'lore', titulo:'Memórias Emprestadas', texto:'Terminal do ferro-velho: "MEMÓRIA DE VOLUNTÁRIO — MODELO PADRÃO. APLICADA EM 4.999 UNIDADES. EFICÁCIA: 1 (UMA) UNIDADE ACREDITOU." A unidade que acreditou era você.' });
  R.arquivo('lore_careca', { cat:'lore', titulo:'A Casa Vazia', dica:'Uma casa azul na Cidade Velha.', texto:'Na casa do Careca: uma foto de dois meninos na praia — um de óculos, um de cabelo cacheado. O suporte do rodo, vazio. E uma carta: "fui pedir um favor no norte. volto logo."' });
  R.arquivo('lore_rainha_citada', { cat:'lore', titulo:'"Uma Coisa da Rainha"', texto:'Os vizinhos da Cidade Velha falam baixo: o rapaz cacheado foi pedir ajuda pra uma rainha do norte. Quem pede favor pra ela paga com alguma coisa que não volta.' });
  R.arquivo('b_colosso',  { cat:'bestiario', titulo:'Colosso da Muralha', texto:'Máquina do tamanho de uma casa, com a cara do Mecas, coberta de gelo. Trancava a Cidade Velha inteira dentro de um minuto só.' });
  R.arquivo('b_prot00',   { cat:'bestiario', titulo:'Protótipo-00', texto:'"A versão que deu certo." Acordou antes do Mecas e escolheu o lado do criador.' });
  R.arquivo('b_marcelao', { cat:'bestiario', titulo:'Marcelão — Tempo Absoluto', texto:'Com o tempo de uma cidade inteira batendo no peito, os olhos viram dois mostradores azuis. Perdeu mesmo assim.' });
  R.arquivo('b_orfao',    { cat:'bestiario', titulo:'Robô Órfão', texto:'Protocolo Órfão: quando o coração do criador parou, os robôs dele perderam o juízo. Olho vermelho, ronda sem rumo.' });
  R.arquivo('lore_morte_marcelao', { cat:'lore', titulo:'O Fim do Ladrão de Tempo', texto:'O Marcelão fugiu pro reino dos Smergulus e pediu abrigo à rainha. Ela aceitou o tempo roubado — e sugou a alma dele junto. O Ladrão de Tempo está morto.' });
  R.arquivo('lore_5000z', { cat:'lore', titulo:'Código 5000Z', texto:'"Meus robôs obedecem a quem tiver o meu código. O código é o seu número." — gravação do Marcelão. O Mecas agora comanda um exército com a própria cara.' });
  R.arquivo('lore_onibus', { cat:'lore', titulo:'Ônibus 333', texto:'O motorista do 333 jura que a última parada é "o reino". Ninguém nunca desceu lá. Ninguém nunca voltou pra reclamar.' });
  R.arquivo('lore_selfie', { cat:'lore', titulo:'Selfie Congelada', texto:'Na tela do celular de um turista parado: uma selfie às 03:33. No fundo, um homem de casaco branco saindo da Torre do Relógio com um relógio de bolso na mão.' });
  R.arquivo('lore_fila', { cat:'lore', titulo:'A Fila Que Não Anda', texto:'O primeiro da fila do caixa eletrônico esqueceu o que veio fazer às 03:33. Ele veio pagar a conta de luz. Do dia do apagão.' });
  R.arquivo('lore_rodo', { cat:'lore', titulo:'O Rodo', texto:'Achado no fundo do porto. O cabo tem o formato exato da mão de alguém. O Mecas segurou e lembrou de uma risada. Não lembrou de quem.' });
  R.arquivo('lore_orelha', { cat:'lore', titulo:'Orelha', dica:'O Serrinha esconde uma plaquinha.', texto:'O Serrinha pegou a coleira de volta, olhou a plaquinha "ORELHA" por um tempão e guardou no bolso sem falar nada. Os caçadores são do norte. Do reino.' });

  // mais cartazes roxos (coleção "Cartazes da Rainha" chega a 8)
  [[87,43,'"PAGUE SEU IMPOSTO DE ALMA EM DIA. A COROA AGRADECE." Embaixo, em letra miúda: "a coroa não agradece".'],
   [26,63,'"SMERGULUS KINGDOM — VENHA CONHECER! (VOLTAR É OPCIONAL)."'],
   [134,58,'"SÓ EXISTE UM FAT. DECRETO REAL Nº 1." Ninguém em Tel Aviv entendeu esse.'],
   [110,90,'"A RAINHA ESTÁ CONTRATANDO: CAÇADORES DE RECOMPENSA. PAGA BEM. PAGA EM ALMA."'],
   [17,44,'"PROCURA-SE: CACHORRO DE ORELHA GRANDE. RESPONDE POR \'ORELHA\'. NÃO RESPONDE MAIS."']
  ].forEach((c,i)=>{ const id='cartaz_'+(i+4);
    R.coletavel(id, { tipo:'cartaz', rotulo:'Cartazes da Rainha', nome:'Cartaz roxo nº '+(i+4), texto:c[2] });
    R.obj('telaviv', 'cartaz_rainha', c[0], c[1], { interagir:true, coletavel:id, verbo:'🔍 LER' }); });

  R.viagem('v_hotel',  { nome:'Hotel Mar Azul', area:'telaviv', x:112, y:52 });
  R.viagem('v_velha',  { nome:'Cidade Velha',   area:'telaviv', x:64, y:72 });
  R.viagem('v_torres', { nome:'Parque das Torres', area:'telaviv', x:47, y:26 });

  /* ============================================================
     VEÍCULOS DOS TURISTAS (estacionados no hotel)
     ============================================================ */
  Mundo.veiculo('corsa', { nome:'Corsa', vel:205, desc:'mais lento, carrega pão', area:'telaviv', x:104.5*T+16, y:49*T+30, dir:2,
    se:S=>!S.flag('corsa_foi_pra_limeira'),
    pode:S=>S.flag('corsa_liberado'),
    trancado:'O Corsa vermelho do Fat Mango. Trancado, com o bagageiro cheio de saco de pão. Placa de Limeira.' });
  Mundo.veiculo('astra', { nome:'Astra', vel:275, desc:'o mais rápido', area:'telaviv', x:104.5*T+16, y:47*T+30, dir:2,
    pode:S=>S.flag('astra_consertado'),
    trancado:'O Astra prata do Mameluco. Sem bateria, com um pneu murcho e sem a chave. No retrovisor, um bilhete: "NÃO ENCOSTA".' });

  /* ============================================================
     LUTAS
     ============================================================ */
  let ordem=100;
  R.luta('cacadores', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, titulo:'Caçadores na Cidade', cenario:'telaviv', time:'grupo',
    inimigos:['strong_smerg','serrinha_dog','mecas_grunt'], ajustes:{ inimigo:[{ hp:205 }, { hp:195 }, SENTINELA] },
    antes:[ D('serrinha_dog','Olha só, Strong. O rosto do cartaz. Em pessoa. Em LATA.', { cenario:'telaviv' }),
            D('strong_smerg','Ciborgue 5000Z. Recompensa paga em tempo. Nada pessoal, lata.'),
            D('cargas','Caçador de recompensa trabalhando pro Marcelão. Vocês não têm vergonha?'),
            D('serrinha_dog','A gente trabalha pra quem paga, faísca.'),
            D('mecas','Eu não sou mercadoria.', { pose:'special' }) ],
    depois:[ D('strong_smerg','Recua, Serrinha! Isso não tava no contrato!', { pose:'hurt' }),
             D('serrinha_dog','Ninguém falou que a lata batia assim…'),
             D('cargas','Antes de correr, me responde uma coisa: ele pagou vocês com o quê?') ] });
  R.luta('trio_limeira', { cap:1, ordem:++ordem, condenacao:true, titulo:'Sotaque do Interior', cenario:'telaviv', time:['mecas', L], inimigos:['fat_mango','matheus_limeira2'],
    antes:[ D('matheus_limeira2','Mango, eu falei que era pra virar à esquerda. Mil e duzentos quilômetros e o Astra morre na porta do HOTEL.', { cenario:'telaviv' }),
            D('fat_mango','Férias, Mameluco. A gente tá de férias. …Peraí.'),
            D('fat_mango','LAMBANÇA?! Ô rapaz, que cê tá fazendo aqui? Você é de LIMEIRA! A gente cresceu na mesma rua!'),
            D(L,'Nunca te vi mais gordo. Sou de Tel Aviv, nascido e criado.'),
            D('matheus_limeira2','Ele benzeu meu Astra na porta da igreja de Limeira. Duas vezes. Cobrou as duas.'),
            D(L,'CALÚNIA! Isso pede uma luta abençoada! Mecas, me ajuda!', { pose:'special' }),
            D('mecas','…A gente vai mesmo brigar por isso?'),
            D(L,'Tem coisa mais importante que a terra natal de um homem?') ],
    depois:[ D('fat_mango','Tá bom, tá bom, cê é de onde quiser!', { pose:'hurt' }),
             D('matheus_limeira2','O Astra não liga. Sem bateria, pneu murcho e eu perdi a chave em algum lugar dessa cidade parada.'),
             D('fat_mango','Robô, cê parece gente boa. Ajuda a gente? O Corsa eu te empresto. Só não encosta no pão.') ] });
  R.luta('irmaos_metal', { cap:1, ordem:++ordem, condenacao:true, titulo:'Os Irmãos de Metal', cenario:'ferrovelho', time:'grupo', inimigos:['mecas','mecas','mecas'],
    ajustes:{ inimigo:[{ nome:'Protótipo-02', hp:165 }, { nome:'Protótipo-03', hp:165 }, { nome:'Protótipo-04', hp:165 }] },
    antes:[ N('Três carcaças se levantam das pilhas de sucata: Protótipo-02, 03 e 04. Todas com o rosto dele — de antes do metal.', { cenario:'ferrovelho' }),
            D('mecas','"INSTRUÇÃO: TRAZER DE VOLTA. INSTRUÇÃO: TRAZER DE VOLTA."', { forma:0, nome:'PROTÓTIPOS' }),
            D('mecas','Vocês não precisam fazer isso. Vocês eram gente, igual eu.'),
            D('cargas','Eles não acordaram de verdade, Mecas. Só ele mexe as cordas.'),
            D(L,'Senhor, perdoa o que a gente vai fazer com esses meninos.') ],
    depois:[ N('Os três desligam devagar. Um deles, antes de apagar, abre a mão — como quem agradece.'),
             D(L,'Descansem em paz, filhos de Tel Aviv.'),
             D('cargas','Eles não eram daqui.'),
             D(L,'Ninguém é de lugar nenhum, Cargas. A gente é de onde o coração aponta.') ] });
  R.luta('colosso', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, chefe:true, titulo:'O Colosso da Muralha', cenario:'muralha', time:'grupo',
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Colosso da Muralha', chefe:true, hp:790, atk:68, def:13, spd:17 }, GELIDA, GELIDA] },
    antes:[ N('O portão em arco da Cidade Velha. Na frente dele, encostado na muralha, uma máquina do tamanho de uma casa — com a SUA cara, coberta de gelo.', { cenario:'muralha' }),
            D('mecas_grunt','"CIDADE VELHA: TEMPO SOB CUSTÓDIA. NINGUÉM ENTRA. NINGUÉM SAI."', { nome:'COLOSSO DA MURALHA' }),
            D('cargas','Ele trancou a Cidade Velha inteira. Tem gente lá dentro parada há dias.'),
            D(L,'Que tamanho de cão de guarda, Senhor. Vai na porrada mesmo.'),
            D('mecas_grunt','"INTRUSOS DETECTADOS. INICIANDO RETENÇÃO."', { nome:'COLOSSO DA MURALHA', pose:'special' }) ],
    depois:[ N('O Colosso cai de joelhos e o gelo do portão se quebra em mil pedaços.'),
             N('Atrás da muralha, a Cidade Velha volta a respirar: gente piscando, olhando em volta sem entender.'),
             D('cargas','Ele congela o tempo e deixa uma máquina de guarda. Quebrou a máquina, o tempo volta.'),
             D('mecas','Então a gente quebra todas.') ] });
  R.luta('eco', { cap:1, ordem:++ordem, condenacao:true, titulo:'Eco do Ladrão de Tempo', cenario:'torre', time:'grupo',
    inimigos:['marcelao_black_jw','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Eco do Marcelão', chefe:true, hp:520, atk:32, spd:16, danoMult:0.8 }, GELIDA, GELIDA] },
    antes:[ N('O térreo da Torre. Uma figura de casaco branco desce a escada — transparente, feita de gelo.', { cenario:'torre' }),
            D('marcelao_black_jw','Unidade 5000Z. Que orgulho. Você saiu da caixa sozinho.'),
            D('mecas','VOCÊ me criou.'),
            D('marcelao_black_jw','Eu te DEI tempo. Antes você era só mais um homem com prazo de validade.'),
            D('marcelao_black_jw','E você, Cargas. Minha bateria favorita. Sentiu saudade?'),
            D('cargas','Desce dessa torre e fala isso na minha cara.', { pose:'special' }),
            D('marcelao_black_jw','Eu não desço. Meu eco cuida de vocês. Tique… taque…') ],
    depois:[ N('O eco se parte em mil pedaços de gelo.'),
             D('marcelao_black_jw','Impressionante. Subam, então. Se conseguirem: a minha torre só abre pra quem entende de tempo.'),
             D(L,'Essa voz eu conheço! …Não, não conheço. Não conheço ninguém de lugar nenhum.') ] });
  R.luta('prototipo00', { cap:1, ordem:++ordem, condenacao:true, titulo:'Protótipo-00', cenario:'torre', time:'grupo',
    inimigos:['mecas','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Protótipo-00', chefe:true, forma:2, hp:260, atk:22, def:11 }, GUARDA, GUARDA] },
    antes:[ N('No último lance da escada, alguém espera. O mesmo corpo de metal. O mesmo olho vermelho. O mesmo rosto.', { cenario:'torre' }),
            D('mecas','"PROTÓTIPO-00. A VERSÃO QUE DEU CERTO."', { nome:'PROTÓTIPO-00', pose:'special' }),
            D('mecas','Eu sou o primeiro. Você é o rascunho que fugiu.', { nome:'PROTÓTIPO-00' }),
            D(L,'Dois Mecas?! Senhor, me ajuda a não bater no errado.') ],
    depois:[ D('mecas','"O criador… vai lutar com o TEMPO do lado dele…"', { nome:'PROTÓTIPO-00', pose:'hurt' }),
             D('mecas','Você podia ter escolhido diferente.'),
             N('Lá em cima, um tique-taque enorme. Cada batida faz a torre inteira tremer.') ] });
  R.luta('marcelao', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, chefe:true, titulo:'Marcelão Black JW', cenario:'torre', time:'grupo',
    inimigos:['marcelao_black_jw','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Marcelão Black JW', chefe:true, hp:690, atk:34, def:14, spd:17, danoMult:0.72 }, GELIDA, GELIDA] },
    antes:[ N('O TOPO DA TORRE. Um relógio gigante de gelo. Na frente dele, o homem de casaco branco.', { cenario:'torre' }),
            D('marcelao_black_jw','Bem-vindos à minha torre. Aqui dentro, cada segundo é meu.'),
            D('mecas','Eu vim pegar o meu de volta.', { pose:'special' }),
            D('marcelao_black_jw','O SEU? Rapaz, tudo que você é, eu emprestei.'),
            D('cargas','Hoje você devolve. Com juros.'),
            D(L,'E eu vim rezar por vocês todos! …E bater também.'),
            D('marcelao_black_jw','Tique.', { pose:'special' }) ],
    depois:[ D('marcelao_black_jw','Hah… vocês acham que venceram? Eu tenho TODO o tempo do mundo.', { pose:'hurt' }),
             N('Ele agarra o ponteiro do relógio gigante e o gira PRA TRÁS. A torre inteira vira um clarão branco.'),
             D('cargas','LAMBANÇA!'),
             N('Quando a luz some, o Lambança não está mais lá.'),
             D('marcelao_black_jw','Mandei ele de volta pro lugar de onde ele veio DE VERDADE. Agora somos só nós três.') ] });
  R.luta('tempo_absoluto', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, chefe:true, titulo:'Tempo Absoluto', cenario:'torre', time:['mecas','cargas'], inimigos:['marcelao_black_jw'],
    ajustes:{ inimigo:[{ nome:'MARCELÃO — TEMPO ABSOLUTO', chefe:true, hp:596, atk:34, def:15, spd:19, danoMult:0.78 }] },
    antes:[ D('marcelao_black_jw','Cada relógio parado de Tel Aviv bate dentro de mim agora.', { pose:'special' }),
            N('O gelo cobre o corpo dele. Os olhos viram dois mostradores azuis.'),
            D('marcelao_black_jw','Vocês vão lutar contra o tempo de uma cidade INTEIRA.'),
            D('cargas','Mecas. Eu corro, você bate.'),
            D('mecas','Eu não fui criado por você, Marcelão. Eu fui criado APESAR de você.', { pose:'special' }) ],
    depois:[ N('O relógio gigante racha de cima a baixo — e explode em neve.'),
             N('Lá embaixo, em toda Tel Aviv, os ponteiros voltam a andar. 03:34.'),
             D('marcelao_black_jw','Isso… não acabou… o tempo… é MEU…', { pose:'hurt' }),
             N('O Marcelão se desfaz numa rachadura de gelo que corta o céu rumo ao noroeste.'),
             D('cargas','Ele fugiu pro norte. Pro reino dos Smergulus — as terras da rainha Smergula.'),
             D('mecas','Então é pra lá que a gente vai.') ] });
  R.luta('mensageiro', { cap:1, ordem:++ordem, condenacao:true, titulo:'Mensageiro do Norte', cenario:'telaviv', time:['mecas','cargas'], inimigos:['strong_smerg'],
    ajustes:{ inimigo:[{ hp:330, atk:26, spd:13 }] },
    antes:[ N('TRÊS DIAS DEPOIS. Pela primeira vez em meses, os relógios de Tel Aviv marcam a hora certa.', { cenario:'telaviv' }),
            N('Um vulto desce a avenida correndo e levantando poeira. Braços enormes. Boné virado.'),
            D('cargas','Caçador de recompensa. De novo.', { pose:'special' }),
            D('strong_smerg','Calma, faísca! Eu não vim caçar ninguém! Eu vim—'),
            D('cargas','Da última vez você também "não veio caçar ninguém".'),
            D('strong_smerg','…Tá bom. Vai ser do jeito difícil. Mas depois vocês me ESCUTAM.', { pose:'special' }) ],
    depois:[ D('strong_smerg','Chega… chega! Escuta! O Marcelão tá MORTO.', { pose:'hurt' }),
             D('mecas','…O quê?'),
             D('strong_smerg','Ele chegou no reino fugindo e implorou abrigo pra rainha. Ofereceu o tempo que roubou de vocês.'),
             D('strong_smerg','A Smergula aceitou o tempo. Depois sugou a alma dele junto. Na frente da corte inteira.'),
             D('cargas','Então todo o tempo que ele roubou de Tel Aviv…'),
             D('strong_smerg','…agora é dela. Ela tá juntando um exército pra descer o mapa. Tel Aviv primeiro. Depois Limeira.'),
             D('strong_smerg','O Serrinha ficou lá segurando as pontas com um tal de Tupas. Eu vim pedir ajuda. Primeira vez na vida que eu trabalho de graça.') ] });
  R.luta('ultimo_recado', { cap:1, ordem:++ordem, condenacao:true, titulo:'O Último Recado', cenario:'laboratorio', time:'grupo', inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[ORFAO, ORFAO, ORFAO] },
    antes:[ N('LABORATÓRIO 5000Z. As luzes piscam vermelho. A sirene tem outra voz.', { cenario:'laboratorio' }),
            N('"BATIMENTO DO CRIADOR: ZERO. INICIANDO PROTOCOLO ÓRFÃO. TODAS AS UNIDADES: MODO SELVAGEM."', { nome:'ALTO-FALANTE' }),
            D('cargas','Ele deixou até isso pronto. Se ele morresse, as máquinas dele enlouqueciam junto.'),
            D('mecas','Eu sou uma máquina dele.'),
            D('strong_smerg','Você é o cara que me deu uma surra. Isso é mais que máquina. Abaixa a cabeça!') ],
    depois:[ N('No meio da sucata, o holograma de uma cápsula liga sozinho. Um homem de casaco branco, cansado.'),
             D('marcelao_black_jw','Unidade 5000Z. Se esta gravação tocou, é porque meu coração parou.', { nome:'GRAVAÇÃO DO MARCELÃO' }),
             D('marcelao_black_jw','Eu fui pro norte achando que a rainha era igual a mim. Uma ladra. Ladrão devolve com juros. Ela não devolve nada.', { nome:'GRAVAÇÃO DO MARCELÃO' }),
             D('marcelao_black_jw','Meus robôs obedecem a quem tiver o meu código. O código é o seu número. 5000Z. Sempre foi.', { nome:'GRAVAÇÃO DO MARCELÃO' }),
             D('marcelao_black_jw','Não faça isso por mim. Faça porque, se ela parar o mundo, ninguém nunca mais acorda de cápsula nenhuma. Tique… taque.', { nome:'GRAVAÇÃO DO MARCELÃO', pose:'hurt' }),
             N('O holograma apaga.'),
             D('cargas','Ele ainda é o pior homem que eu conheci. Mas o recado tá certo.') ] });
  R.luta('exercito', { cap:1, ordem:++ordem, condenacao:true, titulo:'O Exército de Metal', cenario:'ferrovelho', time:'grupo', inimigos:['mecas','mecas_grunt','mecas_grunt'],
    ajustes:{ inimigo:[{ nome:'Protótipo-05', hp:240, atk:22, def:10 }, ORFAO, ORFAO] },
    antes:[ D('mecas','"CÓDIGO 5000Z. TODAS AS UNIDADES: ACORDAR."', { pose:'special', cenario:'ferrovelho' }),
            N('Olhos acendem pelas pilhas de sucata, um por um. Dezenas. Centenas.'),
            D('mecas','"PROTÓTIPO-05: COMANDO RECUSADO. PROTOCOLO ÓRFÃO ATIVO."', { forma:0, nome:'PROTÓTIPO-05' }),
            D('cargas','Os que estão em modo selvagem não escutam o código. Tem que desligar na mão.'),
            D('strong_smerg','Na mão é comigo.', { pose:'special' }) ],
    depois:[ N('O Protótipo-05 cai — e reinicia. Os olhos voltam azuis, calmos.'),
             D('mecas','"UNIDADE 5000Z: COMANDO ACEITO."', { forma:0, nome:'PROTÓTIPO-05' }),
             N('Uma fileira de androides se levanta do ferro-velho e bate continência ao mesmo tempo.'),
             D('mecas','Vocês não são máquinas do Marcelão. Hoje vocês são de Tel Aviv.', { pose:'special' }),
             D('cargas','…Você tá falando igual a ele, Mecas. "Código". "Unidades".', { pose:'hurt' }),
             D('mecas','Eu sei. Eu vou tomar cuidado.') ] });
  R.luta('caravana', { cap:1, ordem:++ordem, condenacao:true, titulo:'A Caravana Vai', cenario:'telaviv', time:['fat_mango','matheus_limeira2','mecas'], inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[ORFAO, ORFAO, ORFAO] },
    antes:[ N('No estacionamento do hotel, o Corsa carregado de pão. Três robôs órfãos cercam os dois carros.', { cenario:'telaviv' }),
            D('fat_mango','Ninguém encosta no Corsa na véspera de viagem! Mameluco, segura o pão!'),
            D('matheus_limeira2','E o retrovisor do Astra. Principalmente o retrovisor.', { pose:'special' }) ],
    depois:[ D('fat_mango','Pronto. Agora sim dá pra ir buscar o Lambança em Limeira.'),
             D('matheus_limeira2','No CORSA, Mango. O Astra fica com o robô. Ele vai precisar de carro rápido lá no norte.'),
             D('matheus_limeira2','…Robô. Se riscar, eu sei. Eu SEMPRE sei.') ] });
  R.luta('colosso_orfao', { cap:1, ordem:++ordem, condenacao:true, rejogavel:true, chefe:true, final:true, titulo:'Rumo ao Reino', cenario:'muralha', time:'grupo',
    inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Colosso Órfão', chefe:true, hp:780, atk:64, def:14, spd:17 }, ORFAO, ORFAO] },
    antes:[ N('A ESTRADA DO NORTE, ao amanhecer. O exército de androides em fila. Atrás, um Astra prata.', { cenario:'muralha' }),
            N('Na barreira da estrada, o Colosso se remontou sozinho. Sem dono, sem gelo — só a ordem antiga.'),
            D('mecas_grunt','"PROTOCOLO ÓRFÃO. CRIADOR AUSENTE. NINGUÉM ENTRA. NINGUÉM SAI."', { nome:'COLOSSO ÓRFÃO' }),
            D('mecas','O código não pega nele. A ordem dele é mais velha que eu.'),
            D('strong_smerg','Eu já perdi pra vocês duas vezes. É bom estar do lado certo uma vez.', { pose:'special' }) ],
    depois:[ N('O Colosso cai pela última vez. A barreira da Estrada do Norte se abre.'),
             D('cargas','Mecas. Se a gente perder lá, não sobra relógio nenhum andando no mundo.'),
             D('mecas','Então a gente não perde.'),
             D('strong_smerg','Pro norte. Pro Smergulus Kingdom.'),
             N('Androides de Tel Aviv. Um homem do raio. Um caçador de recompensa. Um Astra prata.'),
             N('FIM DO CAPÍTULO 1 — TEL AVIV.') ] });
  // procura-se (quadro dos caçadores)
  R.luta('pr_torradeira', { cap:1, titulo:'Procura-se: Torradeira Furiosa', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt'], ajustes:{ inimigo:[{ nome:'Torradeira Furiosa', hp:260, atk:22, def:8, spd:9 }] } });
  R.luta('pr_semaforo',   { cap:1, titulo:'Procura-se: Semáforo Que Só Fica Vermelho', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Semáforo Vermelho', hp:220, atk:20, def:12, spd:6 }, { nome:'Cone Leal', hp:120, atk:10 }] } });
  R.luta('pr_aspirador',  { cap:1, titulo:'Procura-se: Aspirador Sentinela 3000', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt'], ajustes:{ inimigo:[{ nome:'Aspirador Sentinela 3000', hp:300, atk:19, def:10, spd:8 }] } });
  R.luta('pr_guardachuva',{ cap:1, titulo:'Procura-se: Guarda-Chuva Kamikaze', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt','mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[{ nome:'Guarda-Chuva Kamikaze', hp:150, atk:24, spd:12 }, { nome:'Guarda-Chuva Kamikaze', hp:150, atk:24, spd:12 }, { nome:'Guarda-Chuva Kamikaze', hp:150, atk:24, spd:12 }] } });

  /* ============================================================
     NPCs E INIMIGOS DA PARTE 2
     ============================================================ */
  const T1 = S=>S.feita('c1_inimigo');
  R.npc('strong_praca',   { char:'strong_smerg', nome:'Strong Smerg', em:['telaviv', 66, 47], dir:0, se:S=>S.depois('c1_cacadores',1) && !S.feita('c1_cacadores') });
  R.npc('serrinha_praca', { char:'serrinha_dog', nome:'Serrinha Dog', em:['telaviv', 68, 47], dir:0, mudo:true, se:S=>S.depois('c1_cacadores',1) && !S.feita('c1_cacadores') });
  R.npc('strong_taverna', { char:'strong_smerg', nome:'Strong Smerg', em:['telaviv', 118, 87], dir:0,
    se:S=>S.feita('c1_cacadores') && !S.flag('strong_foi_pro_norte'),
    falas:[ { se:S=>S.ativa('sec_procura_se'), cena:['Robô com nome é robô com preço. Vai lá e traz a cabeça deles. Ou o parafuso principal.'] },
            { cena:['A gente não trabalha de graça. Mas trabalha junto, se render.','Aquele envelope roxo no quadro? Não mexe. É… contrato de família.'] } ] });
  R.npc('serrinha_taverna', { char:'serrinha_dog', nome:'Serrinha Dog', em:['telaviv', 116, 87], dir:0,
    se:S=>S.feita('c1_cacadores') && !S.flag('strong_foi_pro_norte'),
    falas:[ { se:S=>S.feita('sec_coleira'), cena:['…obrigado pela coleira. Não conta pro Strong que eu fiquei olhando ela.'] },
            { cena:['Eu tô bem. Eu tô ótimo. Só perdi uma coisa na praia. Coisa boba. Esquece.'] } ] });
  R.npc('mango_hotel', { char:'fat_mango', nome:'Fat Mango', em:['telaviv', 106, 44], dir:0, se:S=>S.depois('c1_placa',0) && !S.flag('corsa_foi_pra_limeira'),
    falas:[ { se:S=>S.ativa('sec_pao'), cena:['Os pães não esfriam! Nunca! É o único benefício do apocalipse!'] },
            { cena:['Padeiro Blindado, às ordens. O Corsa tá aberto pra você, robô. Freia devagar que tem pão no teto.'] } ] });
  R.npc('mameluco_hotel', { char:'matheus_limeira2', nome:'Mameluco', em:['telaviv', 108, 44], dir:0, se:S=>S.depois('c1_placa',0) && !S.flag('corsa_foi_pra_limeira'),
    falas:[ { se:S=>S.flag('astra_consertado'), cena:['O Astra tá contigo. Retrovisor. Lembra do retrovisor.','E o Táxi do Astra: no mapa (M), toca no 🚕 pra ir pros lugares que você já conhece.'] },
            { cena:['Bateria, pneu e a chave. Sem os três o Astra não sai. Sem o Astra eu não saio. Sem eu sair, o Mango come o Corsa inteiro de pão.'] } ] });
  R.npc('vizinha_1', { desenho:'cidadao:9', nome:'DONA RIVKA', em:['telaviv', 47, 101], dir:0, se:S=>S.flag('colosso_vencido'),
    falas:[ { se:S=>S.ativa('c1_coisa_rainha'), cena:['O menino cacheado? Foi pedir ajuda pro norte. Pra RAINHA de lá.','Quem pede favor pra ela volta sem alguma coisa. Ou não volta.'] },
            { cena:['Eu acordei e tinha passado três dias. Três! Meu feijão virou pedra.'] } ] });
  R.npc('vizinho_2', { desenho:'cidadao:5', nome:'SEU ARON', em:['telaviv', 56, 86], dir:0, se:S=>S.flag('colosso_vencido'),
    falas:[ { se:S=>S.ativa('c1_coisa_rainha'), cena:['Shhh. Não fala alto. "Coisa da rainha" a gente não fala alto.','Tem uns cartazes roxos aparecendo na cidade. Começou depois que o cacheado foi embora.'] },
            { cena:['A Cidade Velha voltou! Ninguém acredita, mas voltou. Só o meu relógio ainda insiste em 03:33.'] } ] });
  R.npc('vizinha_3', { desenho:'cidadao:7', nome:'NOA', em:['telaviv', 80, 97], dir:0, se:S=>S.flag('colosso_vencido'),
    falas:[ { se:S=>S.ativa('c1_coisa_rainha'), cena:['O Careca? Ele ia na casa do relojoeiro toda semana. O Seu Ezequiel guarda a chave reserva da Torre, sabia?','Ele cuidava do relógio da torre antes de tudo parar.'] },
            { cena:['Eu tava indo pra praia às 03:32. Acho que ainda vou. Daqui a pouco.'] } ] });
  R.npc('motorista_333', { desenho:'cidadao:14', nome:'MOTORISTA DO 333', em:['telaviv', 47, 44], dir:0,
    falas:[ { cena:['Linha 333. Saída 03:33. Última parada: O REINO.','Se eu já fui até lá? Não. Ninguém vai até o ponto final. O ponto final vem até você.'] } ] });
  R.npc('fila_1', { desenho:'marionete:0', nome:'PRIMEIRO DA FILA', em:['telaviv', 100, 44], dir:3,
    falas:[ { se:S=>S.feita('sec_fila'), cena:['A conta de luz! Do dia do apagão! …Já pagaram? Ah. Então eu volto pra fila. Por costume.'] },
            { cena:['Eu tô na frente da fila desde 03:33. Eu vim fazer… eu vim fazer… alguma coisa. Tinha uma senha. Eu perdi a senha.'] } ] });
  ['fila_2','fila_3','fila_4'].forEach((id,i)=>R.npc(id, { desenho:'marionete:'+[2,5,12][i], nome:'NA FILA', em:['telaviv', 101+i, 44], dir:1,
    falas:[ [ 'A fila não anda. Nunca andou. Mas eu não saio, senão perco o lugar.', 'Eu tô aqui por solidariedade. E porque a fila é a única coisa que eu tenho.', '(ele está parado no meio de um bocejo)' ][i] ] }));
  R.npc('turista_selfie', { desenho:'marionete:3', nome:'TURISTA DA SELFIE', em:['telaviv', 132, 64], dir:0, mudo:false,
    falas:[ { se:S=>S.feita('sec_selfie'), cena:['(ele continua congelado sorrindo pro celular. Agora você sabe o que tem no fundo da foto.)'] }, { cena:['(congelado no meio de uma selfie, com o celular no alto)'] } ] });
  R.npc('androide_garcom', { desenho:'androide', nome:'ANDROIDE 5000Z-B', em:['telaviv', 77, 64], dir:0, se:S=>S.feita('c1_exercito'),
    falas:[ { se:S=>S.feita('sec_garcom'), cena:['Mesa 3, um café eterno. Mesa 5, um sonho parado. Eu sou FELIZ, comandante.'] }, { cena:['Comandante. Eu fui feito pra guerra. Mas eu queria… servir café. É estranho?'] } ] });

  // topo da torre
  R.npc('marcelao_topo', { char:'marcelao_black_jw', nome:'Marcelão Black JW', em:['torre_topo', 6, 6], dir:0, se:S=>S.no('c1_torre',6) });
  R.inimigo('prot00', { desenho:'mecas', em:['torre_topo', 6, 9], dir:0, visao:3, vel:0, velPerseguir:70, luta:'prototipo00', se:S=>S.depois('c1_torre',5) && !S.flag('luta:prototipo00') });
  // inimigos visíveis
  R.inimigo('colosso_vis', { desenho:'colosso', em:['telaviv', 64, 64], dir:0, visao:3, vel:0, velPerseguir:50, luta:'colosso', se:S=>S.comecou('c1_colosso') && !S.flag('colosso_vencido') });
  R.inimigo('torradeira',  { desenho:'robo_orfao', em:['telaviv', 27, 35], rota:[[24,34],[30,34]], visao:4, luta:'pr_torradeira', se:S=>S.ativa('sec_procura_se') });
  R.inimigo('semaforo_vis',{ desenho:'robo', em:['telaviv', 104, 41], rota:[[98,41],[106,41]], visao:3, luta:'pr_semaforo', se:S=>S.ativa('sec_procura_se') });
  R.inimigo('aspirador',   { desenho:'sentinela', em:['telaviv', 120, 60], rota:[[116,60],[124,60]], visao:4, luta:'pr_aspirador', se:S=>S.ativa('sec_procura_se') });
  R.inimigo('guardachuva', { desenho:'robo', em:['telaviv', 132, 86], rota:[[131,84],[132,90]], visao:5, luta:'pr_guardachuva', se:S=>S.ativa('sec_procura_se') });
  R.inimigo('orfao_1', { desenho:'robo_orfao', em:['telaviv', 40, 41], rota:[[34,40],[56,40]], visao:4, luta:'ultimo_recado_rua', se:S=>S.comecou('c1_recado') && !S.feita('c1_colosso_orfao') });
  R.inimigo('orfao_2', { desenho:'robo_orfao', em:['telaviv', 95, 22], rota:[[88,22],[120,22]], visao:4, luta:'ultimo_recado_rua', se:S=>S.comecou('c1_recado') && !S.feita('c1_colosso_orfao') });
  R.inimigo('orfao_3', { desenho:'robo_orfao', em:['telaviv', 112, 88], rota:[[104,88],[126,88]], visao:4, luta:'ultimo_recado_rua', se:S=>S.comecou('c1_recado') && !S.feita('c1_colosso_orfao') });
  R.inimigo('colosso_orfao_vis', { desenho:'colosso_orfao', em:['telaviv', 65, 3], dir:0, visao:3, vel:0, velPerseguir:45, luta:'colosso_orfao', se:S=>S.comecou('c1_colosso_orfao') && !S.flag('estrada_norte_aberta') });
  R.luta('ultimo_recado_rua', { cap:1, titulo:'Robôs Órfãos', cenario:'telaviv', time:'grupo', inimigos:['mecas_grunt','mecas_grunt'], ajustes:{ inimigo:[ORFAO, ORFAO] } });

  /* ============================================================
     OBJETOS DA PARTE 2 (pistas, peças, puzzles)
     ============================================================ */
  // cartazes de PROCURA-SE com a cara do Mecas
  [[44,39],[30,24],[98,43]].forEach(([x,y],i)=>R.obj('telaviv', 'cartaz_procura', x, y, { interagir:true, investigar:'procura_'+(i+1), verbo:'🔍 LER', se:S=>S.comecou('c1_cacadores'),
    texto:[ ['"PROCURA-SE: CIBORGUE 5000Z. FUGIU DO LABORATÓRIO. PAGA-SE EM TEMPO. — M.B.JW"','O desenho é você. Desenharam o seu queixo maior do que ele é.'],
            ['Outro cartaz. "PAGA-SE EM TEMPO". Embaixo, a lápis: "quanto tempo? perguntar pro Strong".'],
            ['"PROCURA-SE: CIBORGUE 5000Z. VIVO. DE PREFERÊNCIA FUNCIONANDO." Alguém riscou "funcionando" e escreveu "inteiro".'] ][i] }));
  // quadro de recompensas (porta da taverna)
  R.obj('telaviv', 'quadro_recompensa', 119.4, 86.6, { interagir:true, verbo:'📋 VER QUADRO', se:S=>S.feita('c1_cacadores'),
    texto:['QUADRO DE RECOMPENSAS — STRONG & SERRINHA', '• TORRADEIRA FURIOSA (zona industrial) • SEMÁFORO QUE SÓ FICA VERMELHO (avenida, perto do x110) • ASPIRADOR SENTINELA 3000 (atrás do hotel) • GUARDA-CHUVA KAMIKAZE (praia)', 'E, preso num canto com um alfinete dourado: um envelope ROXO, lacrado, com o selo de uma coroa. Valor: ███.'],
    faz:[ { arquivo:'lore_contrato' } ] });
  // peças do Astra (dentro de interiores — na coluna da porta, que fica sempre livre)
  R.obj('int:telaviv:125:66', 'brilho', 8, 4, { interagir:true, pegar:'bateria_astra', verbo:'🔋 PEGAR', se:S=>S.comecou('c1_pecas') && !S.flag('pegou:bateria_astra'),
    texto:['Entre os quadros de força da sala de controle, uma bateria de carro com um adesivo: "PROPRIEDADE DO MAMELUCO".','Por que ela tá AQUI? Ninguém sabe. É Tel Aviv às 03:33.'] });
  R.obj('int:telaviv:5:31', 'brilho', 8, 4, { interagir:true, pegar:'pneu_astra', verbo:'🛞 PEGAR', se:S=>S.comecou('c1_pecas') && !S.flag('pegou:pneu_astra'),
    texto:['No meio das prateleiras do galpão, um pneu de Astra com etiqueta de oficina: "CONSERTADO. PAGO? NÃO."'] });
  R.obj('taverna', 'brilho', 8, 7, { interagir:true, pegar:'chave_astra', verbo:'🔑 PEGAR', se:S=>S.comecou('c1_pecas') && !S.flag('pegou:chave_astra'),
    texto:['Embaixo do balcão, onde o taverneiro ronca: um chaveiro em forma de laranja. "LIMEIRA — CAPITAL DA LARANJA".','O Mameluco esqueceu a chave do Astra no bar. Claro que esqueceu.'] });
  // cadeado-relógio do ferro-velho
  R.obj('telaviv', 'cadeado_relogio', 23.6, 84.4, { interagir:true, verbo:'🔐 CADEADO', se:S=>!S.flag('ferro_aberto') && S.comecou('c1_ferrovelho'),
    faz:[ cadeado({ id:'cad_ferro', flag:'ferro_aberto', nome:'CADEADO-RELÓGIO', inicio:[0,0,0,0], codigo:'5000',
      texto:'Um cadeado em forma de relógio, com 4 rodinhas de número. Gravado no aro: "SÓ ABRE PRO LOTE CERTO."',
      erro:'CLACK. O cadeado faz tique-taque, debochado. Não é esse lote.', acerto:'CLICK. O cadeado reconhece o número dele mesmo: 5000. A corrente cai.' }) ] });
  R.obj('telaviv', 'terminal', 15, 92, { interagir:true, investigar:'term_ferro', verbo:'💻 LER', arquivo:'lore_memoria', se:S=>S.flag('ferro_aberto'),
    texto:['TERMINAL DO FERRO-VELHO. "MEMÓRIA DE VOLUNTÁRIO — MODELO PADRÃO."', '"APLICADA EM 4.999 UNIDADES. EFICÁCIA: 1 (UMA) UNIDADE ACREDITOU."', 'A unidade que acreditou… é você.'] });
  // casa do Careca (os objetos vêm do interior especial: foto, suporte do rodo, carta)
  // a vara do pescador e o rodo no fundo do porto
  R.obj('telaviv', 'brilho', 117.5, 110, { interagir:true, verbo:'🎣 PESCAR', se:S=>S.comecou('sec_rodo') && !S.flag('pegou:rodo_careca'),
    precisa:{ item:'vara_pesca', texto:['A água aqui é funda e escura. Tem alguma coisa brilhando lá embaixo… mas não dá pra alcançar com a mão.'] },
    pegar:'rodo_careca', texto:['Você joga a vara do Seu Nahum. Fisga alguma coisa pesada.', 'Sai da água… um RODO. Com o cabo gasto no formato exato de uma mão.'] });
  // senha do banco
  R.obj('telaviv', 'brilho', 95.5, 39, { interagir:true, pegar:'senha_banco', verbo:'🎫 PEGAR', se:S=>S.comecou('sec_fila') && !S.flag('pegou:senha_banco'),
    texto:['No chão, perto do orelhão: um papelzinho de fila. Senha nº 033.'] });
  // coleira do Orelha na praia
  R.obj('telaviv', 'brilho', 133, 88, { interagir:true, pegar:'coleira_orelha', verbo:'🦴 PEGAR', se:S=>S.comecou('sec_coleira') && !S.flag('pegou:coleira_orelha'),
    texto:['Meio enterrada na areia: uma coleira gasta. Na plaquinha de metal, uma palavra: "ORELHA".'] });
  // celular da selfie
  R.obj('telaviv', 'brilho', 132.6, 64.2, { interagir:true, investigar:'selfie', verbo:'📱 OLHAR', se:S=>S.comecou('sec_selfie'),
    texto:['Na tela do celular do turista: uma selfie às 03:33. Ele sorrindo, a Torre do Relógio atrás.', 'No fundo, pequeno, um homem de casaco branco saindo da Torre com um relógio de bolso na mão. E olhando DIRETO pra câmera.'] });
  // transformadores do Para-raios (sequência: gerador → trafo 2 → trafo 0 → trafo 1)
  const PARA_RAIOS = { id:'seq_raios', flag:'para_raios_ok', ordem:['gerador','trafo_2','trafo_0','trafo_1'],
    ok:'ZZZT. O Cargas encosta a mão. A agulha sobe. ', erro:'BZZT — FUMAÇA. A agulha volta pro zero. O Cargas sacode a mão: "ordem errada, começa de novo".',
    acerto:'Os quatro acendem em sequência, um raio corre pelos fios e a subestação inteira zumbe afinada. O Cargas sorri pela primeira vez no capítulo.',
    aoAcertar:[ { arquivo:'lore_raios' } ] };
  R.arquivo('lore_raios', { cat:'lore', titulo:'Para-Raios', texto:'O Cargas religou a subestação na mão, na ordem do esquema: gerador primeiro, depois os transformadores de trás pra frente. "O Marcelão ligava assim. Por isso eu sei desligar."' });
  [['gerador',121,70.6],['trafo_0',114,66.6],['trafo_1',118,66.6],['trafo_2',122,66.6]].forEach(([q,x,y])=>
    R.obj('telaviv', 'brilho', x, y, { interagir:true, verbo:'⚡ ENERGIZAR', se:S=>S.ativa('sec_para_raios') && S.depois('sec_para_raios',1) && !S.flag('para_raios_ok'), faz:passoSequencia(PARA_RAIOS, q) }));

  /* ============================================================
     MISSÕES PRINCIPAIS — PARTE 5 a 10
     ============================================================ */
  R.missao('c1_cacadores', { cap:1, titulo:'Procura-se: 5000Z', requer:['c1_inimigo'], resumo:'Apareceram cartazes de PROCURA-SE pela cidade. O rosto do cartaz é o seu.',
    retorno:['telaviv', 63, 44],
    passos:[
      { tipo:'investigar', obj:'Leia os cartazes de procura-se', objetos:['procura_1','procura_2','procura_3'], onde:'Avenida, Rua das Torres e Mercado',
        aoIniciar:[ { fala:[ D('cargas','Mecas. Olha isso colado no poste.'), D('mecas','…Sou eu.'), D('cargas','"Paga-se em tempo." Isso é coisa dele. Vai ter caçador atrás de você na cidade inteira.') ] } ] },
      { tipo:'luta', obj:'Os caçadores na praça', npc:'strong_praca', luta:'cacadores', onde:'Praça do Relógio',
        cena:[ D('strong_smerg','Ora, ora. O cartaz em pessoa.'), D('serrinha_dog','Strong, ele é mais baixinho que no desenho.') ] }
    ], recompensa:{ arquivo:['p_strong','p_serrinha'] } });

  R.missao('c1_tregua', { cap:1, titulo:'Trégua Interesseira', requer:['c1_cacadores'], resumo:'Os caçadores descobriram que o Marcelão paga com tempo roubado. E agora?',
    retorno:['telaviv', 117, 88],
    passos:[
      { tipo:'cena', obj:'Escute os caçadores',
        fala:[ D('strong_smerg','"Paga em tempo." Disse que era o pagamento mais valioso do mundo.', { pose:'hurt' }),
               D('cargas','Tempo roubado de outra pessoa. Vocês trabalharam de graça pro ladrão.'),
               D('serrinha_dog','…Strong. A gente foi passado pra trás por um RELOJOEIRO.'),
               D('strong_smerg','Contrato cancelado. Mas a gente não trabalha de graça.'),
               D('strong_smerg','Trabalha JUNTO, se render. A gente monta o quadro na porta da taverna do porto. Robô com nome, a gente caça. Vocês ajudam, a gente divide.'),
               D('mecas','E o Marcelão?'),
               D('strong_smerg','O Marcelão agora é de graça. Esse eu pego por esporte.') ] },
      { tipo:'ir', obj:'Vá até a taverna do porto', alvo:['telaviv', 119, 86, 2.5], onde:'Taverna do Porto (sudeste)' },
      { tipo:'cena', obj:'O quadro dos caçadores',
        fala:[ N('📋 Na porta da taverna, o QUADRO DE RECOMPENSAS: robôs com nome, apelido e preço. Fale com o Strong pra pegar a missão "Procura-se".'),
               D('serrinha_dog','E não mexe no envelope roxo. É… coisa nossa.') ] }
    ] });

  R.missao('c1_placa', { cap:1, titulo:'Placa de Limeira', requer:['c1_tregua'], resumo:'Dois turistas estão parados no estacionamento do hotel com um Astra que não liga. A placa é de Limeira.',
    retorno:['telaviv', 107, 45],
    passos:[
      { tipo:'ir', obj:'Vá até o estacionamento do Hotel Mar Azul', alvo:['telaviv', 107, 45, 3], onde:'Hotel Mar Azul (leste)' },
      { tipo:'cena', obj:'Quem está gritando com um Astra?',
        fala:[ D('matheus_limeira2','LIGA. LIGA, Astra. Pelo amor de Deus, LIGA.'),
               D('fat_mango','Ele não liga, Mameluco. Ele tá sem bateria, sem pneu e sem chave. Ele tá sem vontade de viver.'),
               N('Lá do outro lado da rua, alguém vem correndo.'),
               D(L,'MECAS! Amigo! Que saudade! Eu fui comprar pão e— ah não.', { pose:'hurt' }) ] },
      { tipo:'luta', obj:'"Ninguém aqui é de Limeira!"', luta:'trio_limeira', aoIniciar:[ { luta:'trio_limeira' } ] },
      { tipo:'cena', obj:'Fazer as pazes',
        fala:[ D(L,'Tá bom. Tá BOM. Eu conheço vocês. De vista. De Tel Aviv.'),
               D('fat_mango','De LIMEIRA, Lambança.'),
               D(L,'Eu vou junto com o robô de novo. Alguém tem que mostrar a cidade pra ele direito.'),
               D('fat_mango','Robô, pode usar o Corsa. Ele é lento, mas é da família. O bagageiro tá cheio de pão, freia devagar.'),
               N('🚗 O CORSA está liberado: ande até ele no estacionamento e aperte E. Carro só anda na RUA.'),
               N('▶ Agora que o grupo cresceu: aperte P (ou START) pra escolher quem você controla. O Cargas anda MUITO mais rápido.') ],
        aoConcluir:[ { grupo:'+'+L }, { flag:'corsa_liberado' }, { arquivo:'p_mango' }, { arquivo:'p_mameluco' } ] }
    ] });

  R.missao('c1_pecas', { cap:1, titulo:'Peças do Astra', requer:['c1_placa'], resumo:'O Astra do Mameluco precisa de bateria, pneu e da chave. As três coisas estão perdidas pela cidade.',
    retorno:['telaviv', 107, 45],
    passos:[
      { tipo:'item', obj:'Ache a bateria, o pneu e a chave do Astra', item:['bateria_astra','pneu_astra','chave_astra'], onde:'Sala de Controle da subestação, Galpão Industrial (oeste) e Taverna do Porto',
        aoIniciar:[ { fala:[ D('matheus_limeira2','A bateria eu deixei carregando na subestação. O pneu, na borracharia do galpão lá do oeste. A chave… a chave eu não sei. Eu tava na taverna. Eu tava feliz.') ] } ] },
      { tipo:'falar', obj:'Leve as peças pro Mameluco', npc:'mameluco_hotel',
        cena:[ D('matheus_limeira2','Bateria. Pneu. CHAVE. Ô robô… cê é o melhor mecânico que eu nunca contratei.'),
               N('O Astra tosse, engasga… e liga. O motor ronca como se nunca tivesse parado.'),
               D('matheus_limeira2','Táxi do Astra aberto! Te levo em qualquer lugar que você já conhece. E você pode dirigir ele também. Só não—'),
               D('mecas','—encosta no retrovisor.'),
               D('matheus_limeira2','Tá aprendendo.') ],
        depoisFala:[ { item:'-bateria_astra' }, { item:'-pneu_astra' }, { item:'-chave_astra' }, { flag:'astra_consertado' } ] }
    ], recompensa:{ bonusHp:5, viagem:'v_hotel', texto:'🚗 Astra (o carro mais rápido) e o Táxi do Astra no mapa' } });

  R.missao('c1_ferrovelho', { cap:1, titulo:'Ferro-Velho dos Protótipos', requer:['c1_pecas'], resumo:'O ferro-velho do Marcelão está trancado com um cadeado em forma de relógio. Do outro lado, sucata com o seu rosto.',
    retorno:['telaviv', 21, 82],
    passos:[
      { tipo:'puzzle', obj:'Abra o cadeado-relógio do portão', flag:'ferro_aberto', local:['telaviv', 23, 84], onde:'Portão do Ferro-Velho (sudoeste)',
        aoIniciar:[ { fala:[ D('cargas','Cadeado do Marcelão. Ele não usa chave: usa número. Sempre o número de alguma coisa dele.'),
                             D(L,'Tenta 1234. Todo mundo usa 1234. Lá em Lime— lá em casa todo mundo usa.'),
                             N('🔐 Dica: olhe bem o relógio pregado no portão do ferro-velho. A etiqueta dele diz o "lote".') ] } ] },
      { tipo:'ir', obj:'Entre no ferro-velho', alvo:['telaviv', 18, 92, 3] },
      { tipo:'luta', obj:'Os protótipos acordaram', luta:'irmaos_metal', aoIniciar:[ { luta:'irmaos_metal' } ] },
      { tipo:'investigar', obj:'Leia o terminal do ferro-velho', objetos:['term_ferro'],
        aoConcluir:[ { fala:[ D('mecas','"Eficácia: uma unidade acreditou." Eu. Eu acreditei.', { pose:'hurt' }),
                              D('cargas','É o truque favorito dele. Ele grava uma lembrança por cima e te faz achar que foi escolha sua.'),
                              D('mecas','Eu tinha uma vida antes disso. Alguém roubou.'),
                              N('Lá longe, atrás do portão da Cidade Velha, alguma coisa ENORME começa a acordar. Tique. Taque.') ] } ] }
    ], recompensa:{ arquivo:['lore_memoria'], bonusHp:5 } });

  R.missao('c1_colosso', { cap:1, titulo:'O Colosso da Muralha', requer:['c1_ferrovelho'], resumo:'O portão da Cidade Velha acordou. E ele tem a sua cara.',
    retorno:['telaviv', 64, 62],
    passos:[
      { tipo:'luta', obj:'Derrube o Colosso no portão da Cidade Velha', luta:'colosso', inimigo:'colosso_vis', onde:'Portão da Cidade Velha (sul da praça)' }
    ], recompensa:{ flag:['colosso_vencido'], arquivo:['b_colosso'], bonusHp:5, viagem:'v_velha' } });

  R.missao('c1_velha_noite', { cap:1, titulo:'Ruas Que Não Dormem', requer:['c1_colosso'], resumo:'A Cidade Velha acordou de noite. Numa casa azul, alguém que te conhecia deixou coisas pra trás.',
    retorno:['telaviv', 64, 72],
    passos:[
      { tipo:'ir', obj:'Entre na Cidade Velha', alvo:['telaviv', 64, 74, 3], onde:'Cidade Velha (o portão abriu)',
        aoConcluir:[ { fala:[ N('A Cidade Velha à noite. Tochas acesas, varais parados, gente piscando na porta de casa sem entender que dia é.'),
                              D(L,'Ali, ó. A casa azul. Todo mundo fala dela. "A casa do Careca".'),
                              D('mecas','Careca…', { pose:'hurt' }) ] } ] },
      { tipo:'investigar', obj:'Investigue a casa do Careca', objetos:['careca_foto','careca_rodo','careca_carta'], onde:'Casa azul no sudoeste da Cidade Velha',
        aoConcluir:[ { fala:[ D('mecas','Dois meninos na praia. Um de óculos. Um de cabelo cacheado.'),
                              D('mecas','…esse sou eu?'),
                              D('cargas','"Fui pedir um favor no norte." Que favor alguém pede no norte?'),
                              D(L,'Ninguém pede nada no norte, irmão. O norte é que pede.') ] } ] }
    ], recompensa:{ arquivo:['lore_careca'] } });

  R.missao('c1_coisa_rainha', { cap:1, titulo:'Coisa da Rainha', requer:['c1_velha_noite'], resumo:'Os vizinhos falam baixo de um rapaz cacheado que foi pedir ajuda "pra rainha do norte". E alguém tem a chave da Torre.',
    retorno:['telaviv', 64, 88],
    passos:[
      { tipo:'falar', obj:'Pergunte pra Dona Rivka', npc:'vizinha_1', onde:'Cidade Velha' },
      { tipo:'falar', obj:'Pergunte pro Seu Aron', npc:'vizinho_2', onde:'Cidade Velha (perto da praça)' },
      { tipo:'falar', obj:'Pergunte pra Noa', npc:'vizinha_3', onde:'Cidade Velha (leste)' },
      { tipo:'falar', obj:'Peça a chave da Torre pro Seu Ezequiel', npc:'relojoeiro', onde:'Praça do Relógio',
        cena:[ D('mecas','Seu Ezequiel. A Noa disse que o senhor guarda a chave reserva da Torre.'),
               P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','Guardo. Eu cuidava daquele relógio há quarenta anos. Até um homem de casaco branco subir lá às 03:32.'),
               P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','Toma. E escuta um velho: lá dentro os ponteiros andam AO CONTRÁRIO. Tudo que você girar, gira pra trás.'),
               P('cidadao:4','SEU EZEQUIEL, O RELOJOEIRO','E se uma porta pedir a hora… dá pra ela o minuto que fugiu.') ],
        depoisFala:[ { item:'+chave_torre' }, { flag:'torre_aberta' } ] }
    ], recompensa:{ arquivo:['lore_rainha_citada'] } });

  R.missao('c1_torre', { cap:1, titulo:'A Torre do Relógio', requer:['c1_coisa_rainha'], resumo:'A Torre está aberta. Lá dentro: o eco do Marcelão, três andares de engrenagens e ponteiros que andam pra trás.',
    retorno:['telaviv', 69, 38],
    passos:[
      { tipo:'ir', obj:'Entre na Torre do Relógio', alvo:['torre_terreo', 6, 9, 2.5], onde:'Torre do Relógio (praça)' },
      { tipo:'luta', obj:'O eco do Marcelão', luta:'eco', aoIniciar:[ { luta:'eco' } ] },
      { tipo:'puzzle', obj:'1º andar: alinhe as engrenagens (todas pra cima)', flag:'torre_p1', local:['torre_andar1', 6, 6], onde:'Torre — 1º andar (escada do térreo)',
        aoIniciar:[ { fala:[ N('⚙ No 1º andar, três alavancas giram as engrenagens — mas cada alavanca mexe em DUAS ao mesmo tempo. Deixe as três setas apontando pra CIMA.') ] } ] },
      { tipo:'puzzle', obj:'2º andar: acerte a hora do mostrador', flag:'torre_p2', local:['torre_andar2', 6, 6], onde:'Torre — 2º andar',
        aoIniciar:[ { fala:[ N('🕰 No 2º andar, um mostrador de 4 rodas trava a escada. As rodas giram PRA TRÁS. Na parede: "O MINUTO QUE FUGIU ABRE O CAMINHO".') ] } ] },
      { tipo:'puzzle', obj:'3º andar: toque os pêndulos na ordem certa', flag:'torre_p3', local:['torre_andar3', 6, 6], onde:'Torre — 3º andar',
        aoIniciar:[ { fala:[ N('🔔 No 3º andar, três pêndulos (I, II e III). A inscrição diz a ordem — se você souber ler um relojoeiro.') ] } ] },
      { tipo:'luta', obj:'Protótipo-00 guarda a escada do topo', luta:'prototipo00', inimigo:'prot00', onde:'Torre — topo' },
      { tipo:'luta', obj:'CHEFE: Marcelão Black JW', npc:'marcelao_topo', luta:'marcelao',
        cena:[ D('marcelao_black_jw','Você subiu. Ninguém nunca subiu. Nem eu subo mais de escada.') ] },
      { tipo:'cena', obj:'…', fala:[ N('A torre treme. O Marcelão ainda está de pé — e agora o gelo cobre o corpo inteiro dele.') ],
        aoConcluir:[ { grupo:'-'+L } ] },
      { tipo:'luta', obj:'CHEFE: Tempo Absoluto', luta:'tempo_absoluto', aoIniciar:[ { luta:'tempo_absoluto' } ] },
      { tipo:'cena', obj:'03:34', cenario:'telaviv', legenda:'TEL AVIV · 03:34',
        cena:[ N('Em toda Tel Aviv, os ponteiros andam. 03:34. 03:35. As ondas quebram, as gaivotas gritam, um pombo termina o voo que começou há dias.', { cenario:'telaviv' }),
               P('cidadao:0','HOMEM DE GRAVATA','…São 03:35. EU TÔ ATRASADO PRO TRABALHO! — e sai correndo.'),
               N('ENQUANTO ISSO, EM LIMEIRA…', { cenario:'padaria' }),
               D(L,'Ué… que lugar é esse? Uma igrejinha na esquina… uma padaria com uma placa: "FECHADO — FOMOS PRA TEL AVIV. ASS: MANGO"…', { pose:'hurt' }),
               D(L,'…Nunca vi na vida. Alguém sabe o caminho de volta pra Tel Aviv?') ] }
    ], recompensa:{ flag:['tempo_voltou'], arquivo:['b_prot00','b_marcelao'], bonusHp:5 } });

  /* ---- Parte 10 · Epílogo ---- */
  R.missao('c1_mensageiro', { cap:1, titulo:'Mensageiro do Norte', requer:['c1_torre'], resumo:'Três dias depois. Um caçador de recompensa desce a avenida correndo.',
    retorno:['telaviv', 63, 44],
    passos:[
      { tipo:'ir', obj:'Volte pra Praça do Relógio', alvo:['telaviv', 63, 44, 3] },
      { tipo:'luta', obj:'"Calma, faísca!"', luta:'mensageiro', aoIniciar:[ { luta:'mensageiro' } ] }
    ], recompensa:{ grupo:'+strong_smerg', arquivo:['lore_morte_marcelao'], texto:'o Strong Smerg segue o grupo' } });

  R.missao('c1_recado', { cap:1, titulo:'O Último Recado', requer:['c1_mensageiro'], resumo:'Protocolo Órfão: os robôs do Marcelão enlouqueceram pela cidade. O laboratório guarda uma mensagem.',
    retorno:['telaviv', 13, 23],
    passos:[
      { tipo:'ir', obj:'Volte ao Laboratório 5000Z', alvo:['lab5000z', 8, 28, 3], onde:'Laboratório 5000Z (noroeste)' },
      { tipo:'luta', obj:'Os robôs órfãos do laboratório', luta:'ultimo_recado', aoIniciar:[ { luta:'ultimo_recado' } ] }
    ], recompensa:{ arquivo:['b_orfao','lore_5000z'] } });

  R.missao('c1_exercito', { cap:1, titulo:'O Exército de Metal', requer:['c1_recado'], resumo:'"O código é o seu número." Androides desligados espalhados pela cidade esperam a voz do Mecas.',
    retorno:['telaviv', 20, 90],
    passos:[
      { tipo:'investigar', obj:'Acorde os androides desligados (código 5000Z)', objetos:['and_1','and_2','and_3','and_4','and_5','and_6'], onde:'Espalhados pela cidade (siga a seta)',
        aoIniciar:[ { fala:[ D('mecas','Seis unidades desligadas, pelo registro. Se eu falar o código perto delas…'), D('cargas','Fala de longe. Não gosto do jeito que eles olham pra você.') ] } ] },
      { tipo:'luta', obj:'Os protótipos que não escutam', luta:'exercito', aoIniciar:[ { luta:'exercito' } ] }
    ], recompensa:{ bonusHp:5, texto:'os androides marcham com o Mecas' } });

  R.missao('c1_caravana', { cap:1, titulo:'A Caravana Vai', requer:['c1_exercito'], resumo:'O Lambança ligou de Limeira. O Fat Mango e o Mameluco vão buscar ele — e prometem voltar pra guerra.',
    retorno:['telaviv', 107, 45],
    passos:[
      { tipo:'falar', obj:'Fale com o Fat Mango no hotel', npc:'mango_hotel',
        cena:[ D('fat_mango','Robô! O Lambança ligou. De LIMEIRA. Ele jura que tá em Tel Aviv e que Limeira é que foi parar lá.'),
               D('matheus_limeira2','A gente vai buscar ele. E volta. Se tem guerra, Limeira vai junto.') ] },
      { tipo:'luta', obj:'Robôs órfãos no estacionamento!', luta:'caravana', aoIniciar:[ { luta:'caravana' } ] },
      { tipo:'cena', obj:'Até logo, Limeira',
        fala:[ N('O Corsa sai buzinando, carregado de pão, com o Fat Mango acenando pela janela.'),
               D('fat_mango','O Corsa é lento, mas chega! Guarda um lugar na guerra pra padaria!'),
               D('matheus_limeira2','O Astra fica. Leva ele pro norte. E o RETROVISOR…'),
               D('mecas','Eu sei.') ],
        aoConcluir:[ { flag:'corsa_foi_pra_limeira' } ] }
    ] });

  R.missao('c1_colosso_orfao', { cap:1, titulo:'Rumo ao Reino', requer:['c1_caravana'], resumo:'Na Estrada do Norte, o Colosso se remontou sozinho. Ele é a última coisa entre Tel Aviv e o reino.',
    retorno:['telaviv', 65, 8],
    passos:[
      { tipo:'luta', obj:'CHEFE: o Colosso Órfão na Estrada do Norte', luta:'colosso_orfao', inimigo:'colosso_orfao_vis', onde:'Estrada do Norte (norte da Rua do Mercado)' }
    ], recompensa:{ flag:['estrada_norte_aberta','cap1_fim'], bonusHp:5 } });

  /* androides desligados (Exército de Metal) */
  [[24,33],[50,30],[88,27],[123,46],[112,95],[30,105]].forEach(([x,y],i)=>R.obj('telaviv', 'androide_off', x, y, { interagir:true, investigar:'and_'+(i+1), verbo:'🤖 CÓDIGO 5000Z', se:S=>S.comecou('c1_exercito') && !S.flag('viu:and_'+(i+1)),
    texto:[ ['"5000Z." O androide abre os olhos azuis e bate continência. "UNIDADE 5000Z-A. ÀS ORDENS."'], ['"5000Z." Este acorda pedindo desculpas por ter dormido no serviço.'], ['"5000Z." Este acorda e pergunta se pode levar o banco da praça. Não pode.'],
            ['"5000Z." Acorda, olha pra piscina do hotel e diz: "sinto falta de algo que nunca tive".'], ['"5000Z." Acorda com uma gaivota no ombro. A gaivota fica.'], ['"5000Z." Este estava em cima de uma lápide. Diz que estava "descansando em paz". Levanta mesmo assim.'] ][i] }));

  /* ============================================================
     SECUNDÁRIAS NOVAS
     ============================================================ */
  R.missao('sec_procura_se', { cap:1, tipo:'secundaria', titulo:'Procura-se', doador:'strong_taverna', requer:['c1_tregua'],
    resumo:'Quatro robôs com nome e personalidade no quadro dos caçadores. A recompensa é dividida. (O Strong conta as moedas duas vezes.)',
    oferta:[ D('strong_smerg','Quadro novo. Quatro cabeças de lata com nome.'), D('serrinha_dog','O Guarda-Chuva Kamikaze é meu. Eu tenho trauma de guarda-chuva.') ],
    passos:[
      { tipo:'luta', obj:'Torradeira Furiosa (zona industrial)', luta:'pr_torradeira', inimigo:'torradeira' },
      { tipo:'luta', obj:'Semáforo Que Só Fica Vermelho (avenida, perto da rua x110)', luta:'pr_semaforo', inimigo:'semaforo_vis' },
      { tipo:'luta', obj:'Aspirador Sentinela 3000 (atrás do hotel)', luta:'pr_aspirador', inimigo:'aspirador' },
      { tipo:'luta', obj:'Guarda-Chuva Kamikaze (praia)', luta:'pr_guardachuva', inimigo:'guardachuva' },
      { tipo:'falar', obj:'Cobre a recompensa com o Strong', npc:'strong_taverna',
        cena:[ D('strong_smerg','Quatro de quatro. Metade pra vocês, metade pra gente.'), D('serrinha_dog','A metade da gente é maior.'), D('strong_smerg','É a matemática dos caçadores.') ] }
    ], recompensa:{ bonusHp:5 } });

  R.missao('sec_coleira', { cap:1, tipo:'secundaria', titulo:'O Que o Serrinha Perdeu', doador:'serrinha_taverna', requer:['c1_tregua'],
    resumo:'O Serrinha perdeu "uma coisa boba" na praia. Ele está fingindo muito bem que não liga.',
    oferta:[ D('serrinha_dog','…Tá bom. Eu perdi uma coleira. Na praia. Não é minha. Era de um cachorro que eu conheci.'), D('serrinha_dog','Acha pra mim? E não lê a plaquinha.') ],
    passos:[
      { tipo:'item', obj:'Procure a coleira na praia (sul da praia)', item:'coleira_orelha', onde:'Praia de Tel Aviv, perto da água' },
      { tipo:'falar', obj:'Devolva a coleira pro Serrinha', npc:'serrinha_taverna',
        cena:[ D('serrinha_dog','…'), N('Ele pega a coleira e fica olhando a plaquinha por um tempão.'), D('serrinha_dog','Você leu a plaquinha.'), D('mecas','Li.'), D('serrinha_dog','…Orelha era um bom nome. Pra um cachorro.') ],
        depoisFala:[ { item:'-coleira_orelha' } ] }
    ], recompensa:{ arquivo:['lore_orelha'] } });

  R.missao('sec_pao', { cap:1, tipo:'secundaria', titulo:'Pão Quentinho Pra Sempre', doador:'mango_hotel', requer:['c1_placa'],
    resumo:'O Fat Mango, "o Padeiro Blindado", achou um forno ligado desde 03:33. Os pães nunca esfriam. Entregue pela cidade.',
    oferta:[ D('fat_mango','Robô. Eu achei o forno da padaria ligado desde 03:33. O pão sai quente e CONTINUA quente.'), D('fat_mango','Leva pro pessoal que tá preso no minuto? Pão quente acorda até defunto. Quase.') ],
    passos:[
      { tipo:'falar', obj:'Entregue pão pro homem de gravata (praça)', npc:'loop_1', aoIniciar:[ { item:'+paes', n:4 } ],
        cena:[ P('cidadao:0','HOMEM DE GRAVATA','…pão? Quente? Eu… eu tô atrasado… mas tô com FOME. Obrigado.') ] },
      { tipo:'falar', obj:'Entregue pão pra feirante (mercado)', npc:'loop_2', cena:[ P('marionete:2','FEIRANTE','Pão! Três reais! …Ah, é de graça? Laranja de graça pra você também. Brincadeira. Três reais.') ] },
      { tipo:'falar', obj:'Entregue pão pro guarda de trânsito', npc:'cid_18', cena:[ P('cidadao:4','GUARDA DE TRÂNSITO','Pão quente às 03:33. Agora sim eu trabalho. Nada. Mas trabalho.') ] },
      { tipo:'falar', obj:'Entregue o último pão pro Fat Mango provar', npc:'mango_hotel',
        cena:[ D('fat_mango','Hmmm. Quente. Igual saiu. É o único benefício do apocalipse.'), D('fat_mango','Toma: o segredo do Padeiro Blindado. Farinha, água e nunca desistir. E fermento.') ],
        depoisFala:[ { item:'-paes', n:4 } ] }
    ], recompensa:{ bonusHp:5 } });

  R.missao('sec_para_raios', { cap:1, tipo:'secundaria', titulo:'Para-Raios', requer:['c1_placa'], auto:true,
    resumo:'O Cargas quer religar a subestação do jeito certo — do jeito que o Marcelão ligava. O esquema está na Sala de Controle.',
    passos:[
      { tipo:'investigar', obj:'Leia o esquema na Sala de Controle da subestação', objetos:['esquema_raios'], onde:'Subestação do Porto — Sala de Controle',
        aoIniciar:[ { fala:[ D('cargas','A subestação ainda tá ligada torta. Do jeito que eu deixei no apagão.'), D('cargas','O Marcelão tinha um esquema pra religar. Deve tá na sala de controle.') ] } ] },
      { tipo:'puzzle', obj:'Energize na ordem do esquema (gerador e os 3 transformadores)', flag:'para_raios_ok', local:['telaviv', 118, 68], onde:'Subestação do Porto' }
    ], recompensa:{ bonusHp:5 } });
  R.obj('int:telaviv:125:66', 'calendario', 5, 1.7, { interagir:true, investigar:'esquema_raios', verbo:'📐 LER', raio:96, semCol:true, se:S=>S.comecou('sec_para_raios'),
    texto:['ESQUEMA DE RELIGAMENTO — M.B.JW', '"1º o GERADOR. Depois os transformadores de TRÁS PRA FRENTE: o da ponta leste, o da ponta oeste e, por último, o do meio."', 'Embaixo, a letra do Cargas, bem mais nova: "por isso eu sei desligar".'] });

  R.missao('sec_rodo', { cap:1, tipo:'secundaria', titulo:'O Rodo do Careca', requer:S=>S.feita('c1_velha_noite') && S.feita('sec_pescador'), auto:true,
    resumo:'O suporte do rodo na casa do Careca está vazio. O Seu Nahum diz que viu "um cabo de rodo" afundando no porto.',
    passos:[
      { tipo:'falar', obj:'Peça a vara emprestada pro Seu Nahum', npc:'pescador',
        cena:[ P('cidadao:6','SEU NAHUM, O PESCADOR','Um cabo de rodo? Afundou na ponta do cais grande, no dia que tudo parou.'),
               P('cidadao:6','SEU NAHUM, O PESCADOR','Leva a vara. Eu não pesco mais. Eu solto.') ],
        depoisFala:[ { item:'+vara_pesca' } ] },
      { tipo:'item', obj:'Pesque o rodo no fundo do porto', item:'rodo_careca', onde:'Cais grande do porto (ponta)' },
      { tipo:'cena', obj:'O cabo do rodo',
        fala:[ D('mecas','O cabo tem o formato de uma mão. Eu… eu conheço esse cabo.', { pose:'hurt' }),
               N('Por um segundo, uma lembrança: alguém rindo, girando um rodo como se fosse uma espada. Cabelo cacheado.'),
               D('mecas','Eu vou guardar. Até devolver pro dono.') ] }
    ], recompensa:{ arquivo:['lore_rodo'], bonusHp:5 } });

  R.missao('sec_fila', { cap:1, tipo:'secundaria', titulo:'A Fila Que Não Anda', doador:'fila_1', requer:['c1_0333'],
    resumo:'A fila do caixa eletrônico perto do mercado está parada desde 03:33. O primeiro da fila perdeu a senha.',
    oferta:[ P('marionete:0','PRIMEIRO DA FILA','Moço. Você que anda. Acha minha senha? Era a 033. Ela voou quando tudo parou.') ],
    passos:[
      { tipo:'item', obj:'Ache a senha nº 033 (perto do orelhão)', item:'senha_banco', onde:'Avenida, perto do orelhão do mercado' },
      { tipo:'falar', obj:'Devolva a senha', npc:'fila_1',
        cena:[ P('marionete:0','PRIMEIRO DA FILA','033! Agora eu lembro o que eu vim fazer!'), P('marionete:0','PRIMEIRO DA FILA','Pagar a conta de luz. Do mês do apagão.'), D('cargas','…'), D('mecas','A conta é do Cargas, então.'), D('cargas','Eu não pago conta de luz. Eu SOU a conta de luz.') ],
        depoisFala:[ { item:'-senha_banco' } ] }
    ], recompensa:{ arquivo:['lore_fila'] } });

  R.missao('sec_onibus', { cap:1, tipo:'secundaria', titulo:'Ônibus 333', doador:'motorista_333', requer:['c1_0333'],
    resumo:'O motorista do ônibus 333 diz que a última parada é "o reino".',
    oferta:[ P('cidadao:14','MOTORISTA DO 333','Quer saber do ponto final? Confere o horário colado no ponto de ônibus. Eu não posso falar em voz alta.') ],
    passos:[
      { tipo:'ir', obj:'Leia o horário no ponto de ônibus', alvo:['telaviv', 41, 44, 1.6],
        aoConcluir:[ { fala:[ N('Horário colado no ponto, em letra miúda: "LINHA 333 — TEL AVIV ⇄ O REINO. ÚLTIMA SAÍDA: 03:33. RETORNO: —"'), D('cargas','"Retorno: tracinho." Ótimo.') ] } ] }
    ], recompensa:{ arquivo:['lore_onibus'] } });

  R.missao('sec_selfie', { cap:1, tipo:'secundaria', titulo:'Selfie Congelada', requer:['c1_0333'], auto:true,
    resumo:'Um turista congelado no meio de uma selfie na praia. O que ficou no fundo da foto?',
    passos:[ { tipo:'investigar', obj:'Olhe o celular do turista da selfie (praia)', objetos:['selfie'], onde:'Praia, perto do quiosque sul' } ],
    recompensa:{ arquivo:['lore_selfie'] } });

  R.missao('sec_garcom', { cap:1, tipo:'secundaria', titulo:'O Androide Que Queria Ser Garçom', doador:'androide_garcom', requer:['c1_exercito'],
    resumo:'Um androide do exército quer servir café, não guerra. O Café da Esquina precisa de garçom.',
    oferta:[ { quem:null, desenho:'androide', nome:'ANDROIDE 5000Z-B', texto:'Comandante… me deixa ficar no Café da Esquina? Eu sirvo a guerra depois. Ou nunca.' } ],
    passos:[
      { tipo:'ir', obj:'Leve o androide até o Café da Esquina', alvo:['telaviv', 77, 63, 2],
        aoConcluir:[ { fala:[ { quem:null, desenho:'androide', nome:'ANDROIDE 5000Z-B', texto:'Mesa 3, café eterno. Mesa 5, sonho parado. EU NASCI PRA ISSO.' }, D('mecas','Fica. A guerra tem gente demais. O café tem gente de menos.') ] } ] }
    ], recompensa:{ bonusHp:5 } });

  /* ---- gatilho: ferro-velho, a hora da noite na Cidade Velha ---- */
  R.gatilho({ id:'g_irmaos', area:'telaviv', ret:[6,88,26,20], uma:false, se:S=>S.no('c1_ferrovelho',2) && !S.flag('luta:irmaos_metal'), faz:[] });

  /* migração: quem já tinha vencido as fases 9–25 da versão em lista */
  if(Missoes.def.migracaoMais) Missoes.def.migracaoMais([
    { cap:'telaviv', fases:10, ate:'c1_colosso' },
    { cap:'telaviv', fases:15, ate:'c1_coisa_rainha' },
    { cap:'telaviv', fases:20, ate:'c1_torre' },
    { cap:'telaviv', fases:25, ate:'c1_colosso_orfao' }
  ]);
})();
