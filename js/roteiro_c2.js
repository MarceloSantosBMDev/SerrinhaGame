/* ============================================================
   ROTEIRO — CAPÍTULO 2: SMERGULUS KINGDOM, "A COROA QUE SUGA"
   ------------------------------------------------------------
   Começa quando o Cap. 1 termina (a Estrada do Norte abriu). O reino é
   contado por quem é de lá, e o jogador troca de ponto de vista a cada
   ato (o grupo do Mecas fica GUARDADO e volta no Ato IV):
     ATO I   (muito antes de Tel Aviv) Strong Smerg, nº 77 — depois o
             Cachorro Orelha, que a rainha amaldiçoa e vira Serrinha.
     ATO II  (enquanto isso) Tupas, com o Careca seguindo. O Marcelão
             chega fugido e a rainha suga a alma dele.
     ATO III (o reino parado) Serrinha + Tupas, com o Pipoca.
     ATO IV  (às vésperas da guerra) o grupo do Mecas atravessa as
             Estradas do Mundo e chega ao reino. Termina com a rainha
             declarando guerra A TODOS — gancho pro capítulo final.
   Lore: o crime do Smergulão NUNCA é revelado. O Careca é de Tel Aviv
   e vive no reino desde a maldição (vira minhoca quando cai). O Tupas
   manda na água e não sabe nadar. Só existe UM Fat. A Smergula NÃO
   morre aqui (a forma Demônio fica pro final).
   Números das lutas: os já medidos no roteiro antigo (historia.js).
   ============================================================ */
(function(){
  const R = Missoes.def;
  const N = (texto, extra) => Object.assign({ quem:false, texto }, extra||{});
  const D = (quem, texto, extra) => Object.assign({ quem, texto }, extra||{});
  const P = (desenho, nome, texto) => ({ quem:null, desenho, nome, texto });
  const SM = (texto, nome, extra) => Object.assign({ quem:'smerg_normal', nome:nome||'SOLDADO SMERG', texto }, extra||{});
  const L = 'hans_lambanca';
  const PZ = () => Missoes.puzzles;

  // o exército da rainha: todos são o MESMO smerg comum; o posto vem do nome e dos números
  const RECRUTA     = { nome:'Recruta Smerg', hp:100, atk:9 };
  const SOLDADO     = { nome:'Soldado Smerg' };
  const DESERTOR    = { nome:'Smerg Desertor', hp:140, atk:14, def:5 };
  const LANCEIRO    = { nome:'Lanceiro Smerg', hp:160, atk:16, def:6, spd:8 };
  const CAPITAO     = { nome:'Capitão Smerg', hp:240, atk:24, def:9, spd:10 };
  const GUARDA_REAL = { nome:'Guarda Real', hp:235, atk:26, def:10, spd:10 };
  const RELOGIO     = { nome:'Smerg do Relógio', hp:250, atk:29, def:9, spd:12 };
  const GUARDA_TRONO= { nome:'Guarda do Trono', hp:285, atk:33, def:12, spd:12 };
  const PIPOCA      = { nome:'Pipoca', hp:185, atk:20, def:8, spd:9 };
  const REBELDE     = { nome:'Smerg Rebelde', hp:180, atk:19, def:7, spd:9 };
  const ANDROIDE    = { nome:'Androide 5000Z', hp:200, atk:21, def:9, spd:10 };
  const congelado = (nome, extra) => Object.assign({ nome:nome+' ❄' }, extra||{});

  const A1=S=>S.flag('ato1') && !S.flag('ato2'), A2=S=>S.flag('ato2') && !S.flag('ato3'), A3=S=>S.flag('ato3') && !S.flag('ato4'), A4=S=>S.flag('ato4');

  /* ================= ARQUIVO, ITENS, COLETÁVEIS ================= */
  R.arquivo('p_tupas',   { cat:'personagem', titulo:'Tupas', texto:'Justiceiro do reino. Manda na água inteira do esgoto e não sabe nadar. "Água que obedece não precisa de braçada."' });
  R.arquivo('p_careca',  { cat:'personagem', titulo:'O Careca', texto:'De Tel Aviv. Cabelo cacheado ("Careca" é só apelido). Foi pedir à rainha ajuda pra achar o amigo sumido e ganhou uma maldição: quando cai, volta minhoca.' });
  R.arquivo('p_fat',     { cat:'personagem', titulo:'Fat Smerg', texto:'Um smerg comum que comeu até ficar ÚNICO. Compatriota da rainha. "Ela me olhou quando ninguém olhava."' });
  R.arquivo('p_smergula',{ cat:'personagem', titulo:'Rainha Smergula', texto:'Dona de tudo no reino. Cobra imposto em pedaços de alma. Ninguém lembra de quando ela foi só uma menina com fome.' });
  R.arquivo('p_pipoca',  { cat:'personagem', titulo:'Pipoca', texto:'Soldado nº 312. Pula de susto com qualquer barulho. Virou o boné pra frente e nunca mais desvirou.' });
  R.arquivo('p_orelha',  { cat:'personagem', titulo:'Cachorro Orelha', texto:'Vira-lata da vila, orelha maior que a cabeça. Roubava pão da mesa da rainha pra dividir. A rainha não perdoa quem divide.' });
  R.arquivo('lore_smergulao', { cat:'lore', titulo:'Procura-se: Smergulão', dica:'Cartazes pelo reino inteiro. Um campo do cartaz está sempre riscado.', texto:'Smerg criado por Sua Majestade. Tamanho: GRANDE. Foi expulso do reino. O crime: ninguém fala. Os soldados velhos começam a contar e mudam de assunto. Um sussurra: "ele era um de nós".' });
  R.arquivo('lore_um_fat', { cat:'lore', titulo:'Só Existe Um Fat', texto:'Decreto Real Nº 1. Estátua, banquete e rampa EXCLUSIVOS. O resto do reino está de dieta obrigatória. Fat-o consumado.' });
  R.arquivo('lore_almas', { cat:'lore', titulo:'O Relógio de Almas', texto:'No alto da torre do castelo, centenas de potinhos de vidro, cada um com um pedaço de alma do reino. No meio, o ponteiro de gelo azul: o tempo roubado de Tel Aviv.' });
  R.arquivo('lore_morte_marcelao2', { cat:'lore', titulo:'Tique… Taque.', texto:'O Marcelão ofereceu à rainha o tempo de uma cidade inteira em troca de abrigo. Ela aceitou o tempo. E a alma de quem segurava ele.' });
  R.arquivo('lore_guerra', { cat:'lore', titulo:'A Guerra de Todos', texto:'A rainha perdeu a luta e não caiu. Bebeu as almas que restavam no salão e declarou guerra a todo mundo: Tel Aviv, Limeira, a Ilha, os caçadores, os justiceiros — e até a quem a ajudou.' });
  R.arquivo('lore_ursinho', { cat:'lore', titulo:'Achados e Perdidos', dica:'Alguma coisa cor-de-rosa que ninguém quer segurar.', texto:'Um ursinho de pelúcia cor-de-rosa com cheiro de enxofre. A velha do reino diz que ele "veio da ilha, da menina que a rainha… deixa pra lá". Ninguém quer ficar perto dele.' });
  R.arquivo('lore_coral', { cat:'lore', titulo:'Coral do Vulcão', texto:'Três soldados cantam pro vulcão grande todo dia, desafinados, pra ele não explodir. Até hoje funcionou. Ninguém sabe se é a música ou o desafino.' });
  R.arquivo('lore_pena', { cat:'lore', titulo:'A Pena do Escrivão', texto:'A pena com que o escrivão real tentou escrever o crime do Smergulão. Toda vez que alguém pergunta qual foi, ele desmaia de novo.' });

  R.item('coxinhas', { nome:'Coxinhas Contrabandeadas', icone:'🍗', texto:'Três coxinhas embrulhadas num pano. Proibidas por decreto real. Perfeitas.' });
  R.item('ursinho_rosa', { nome:'Ursinho Cor-de-Rosa', icone:'🧸', texto:'Cheira a enxofre. Os olhos de botão parecem acompanhar você.' });
  R.item('boia', { nome:'Boias', icone:'🛟', texto:'Boias de salva-vidas. Pro salva-vidas que não sabe nadar.' });
  R.item('pena_escrivao', { nome:'Pena do Escrivão', icone:'🪶', texto:'A tinta ainda está molhada no ponto exato onde ele desmaiou.' });

  const bones=[[40,90],[48,104],[58,96],[70,88],[112,100],[124,96],[130,116],[150,96],[100,130],[20,120],[140,70],[44,60]];
  bones.forEach(([x,y],i)=>{ const id='bone_'+(i+1); R.coletavel(id, { tipo:'bone', rotulo:'Bonés Perdidos', nome:'Boné nº '+(i+1), texto:['Um boné virado pra trás, largado no chão. Dentro, escrito: "MEDO É DESOBEDIÊNCIA".','Boné com um furo de lança. O dono, pelo jeito, correu rápido.','Um boné novinho, nunca usado. Era de um recruta que desistiu no primeiro dia. Bom pra ele.'][i%3] });
    R.obj('smergulus', 'bone_chao', x, y, { interagir:true, coletavel:id, verbo:'🧢 PEGAR' }); });
  const paginas=[['arquivo_real',3,6,'"Livro de impostos, página 1: um pedaço de alma por cabeça. Cabeça de criança vale meio."'],['arquivo_real',11,6,'"Página 2: o Fat Smerg está isento. Por decreto. E por tamanho."'],['arquivo_real',3,8,'"Página 3: ██████ — página arrancada. Só sobrou a margem: G R A N D E."'],
    ['castelo_salao',3,15,'"Página 4: a rainha não dorme. Ela espera."'],['esgoto',3,14,'"Página 5 (molhada): o primeiro rei tinha um nome. Alguém mandou apagar."'],['smergulus',30,66,'"Página 6, achada nas ruínas: ninguém nasce rainha. A fome faz rainha."'],
    ['smergulus',150,60,'"Página 7, presa na represa: o rio pertence à coroa. A água discorda."'],['smergulus',100,128,'"Página 8: decreto de fronteira. NINGUÉM ENTRA. NINGUÉM SAI. EXCETO TURISTA PERDIDO (cobrar em dobro)."']];
  paginas.forEach((pg,i)=>{ const id='pagina_'+(i+1); R.coletavel(id, { tipo:'pagina', rotulo:'Páginas do Arquivo Real', nome:'Página '+(i+1), texto:pg[3] }); R.obj(pg[0], 'pergaminho', pg[1], pg[2], { interagir:true, coletavel:id, verbo:'📜 LER' }); });
  // cartazes do Smergulão (secundária)
  [[66,102],[118,104],[44,96]].forEach(([x,y],i)=>R.obj('smergulus', 'cartaz_procura', x, y, { interagir:true, investigar:'smergulao_'+(i+1), verbo:'🔍 LER',
    texto:[ ['"PROCURA-SE: SMERGULÃO. TAMANHO: GRANDE. CRIME: ██████ — proibido de dizer por decreto real."'],
            ['Outro cartaz. Mesmo rosto: um smerg ENORME de black power. No campo CRIME, alguém tentou escrever por baixo da tarja e desistiu na primeira letra.'],
            ['"PROCURA-SE: SMERGULÃO. RECOMPENSA: um potinho inteiro de alma." O cartaz é velho. Muito velho.'] ][i] }));

  R.viagem('v_reino_praca', { nome:'Praça da Rainha', area:'smergulus', x:86, y:104 });
  R.viagem('v_reino_fronteira', { nome:'Fronteira do Reino', area:'smergulus', x:90, y:130 });

  /* ================= LUTAS ================= */
  let ordem=200;
  const luta=(id,d)=>R.luta(id, Object.assign({ cap:2, ordem:++ordem, condenacao:true }, d));
  luta('c2_recrutas', { titulo:'Smerg Nº 77', cenario:'reino', time:['strong_smerg'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[RECRUTA,RECRUTA,RECRUTA] },
    antes:[ SM('O Nº 77 tá se achando. Vamos lembrar ele que aqui todo mundo é igual.','RECRUTA SMERG', { cenario:'reino' }) ],
    depois:[ N('Três recrutas no chão. Nº 77 nem suou.'), D('fat_smerg','Ora, ora. Faz séculos que o reino não via isso.'),
             D('fat_smerg','No reino só existe UM de cada coisa fora do normal. Eu sou o gordo. Você virou… o forte.'),
             D('strong_smerg','Então pode me chamar assim. Strong. Strong Smerg.'), D('fat_smerg','A rainha vai querer te conhecer, Strong. E ninguém diz não pra rainha.') ] });
  luta('c2_pao', { titulo:'O Cachorro Orelha', cenario:'reino', time:['strong_smerg'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[SOLDADO,SOLDADO,SOLDADO] },
    antes:[ SM('PEGA ESSE BICHO! É o pão da mesa da rainha!', 'SOLDADO SMERG', { cenario:'reino' }), SM('Hoje a gente janta sopa de orelha!'),
            D('strong_smerg','Três soldados atrás de um cachorro com fome. É isso que a rainha manda vocês fazerem?'), SM('Sai da frente, Nº 77. Ordem é ordem.'), D('strong_smerg','Meu nome agora é Strong.', { pose:'special' }) ],
    depois:[ N('Os soldados fogem. O cachorro solta o pão no pé do Strong — e empurra com o focinho.'), D('strong_smerg','Pra mim? Você roubou o pão da rainha pra dividir comigo?'),
             N('"Au."', { nome:'CACHORRO ORELHA' }), D('strong_smerg','…Tá. A gente divide. Mas a rainha vai lembrar da sua cara, Orelha. E da minha.') ] });
  luta('c2_maldicao', { titulo:'A Maldição da Rainha', cenario:'castelo', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[SOLDADO,LANCEIRO,SOLDADO] },
    antes:[ D('smergula','Agora você é meu bichinho de estimação. GUARDAS: o forte também. Vivo.', { cenario:'castelo' }) ],
    depois:[ D('serrinha_dog','Eu… falo? Eu FALO!', { pose:'hurt', nome:'???' }), D('serrinha_dog','E a primeira coisa que eu quero dizer é: CORRE, GRANDÃO!', { nome:'???' }),
             D('smergula','Fujam. O reino inteiro é meu. Não existe lugar aqui onde eu não encontre vocês.'),
             D('smergula','Deixa eles correrem, meu gordinho. Quem corre cansa. E quem cansa, volta.') ] });
  luta('c2_telhados', { titulo:'Fuga pelos Telhados', cenario:'reino', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[LANCEIRO,LANCEIRO,SOLDADO] } });
  luta('c2_tupas', { titulo:'Água Que Não Molha', cenario:'esgoto', rejogavel:true, time:['strong_smerg','serrinha_dog'], inimigos:['tupas'], ajustes:{ inimigo:[{ hp:400, atk:24, spd:11 }] },
    antes:[ N('A água do canal se levanta sozinha e forma uma parede na frente deles.', { cenario:'esgoto' }), D('tupas','Mais um passo e eu afogo os dois. Soldado da rainha não entra no meu esgoto.'),
            D('strong_smerg','A gente não é soldado. A gente FUGIU da rainha.'), D('tupas','É o que todo espião diz.'),
            D('serrinha_dog','Você vai afogar a gente? Você tá se equilibrando num cano pra não pisar na água.'), D('tupas','…Eu prefiro o cano. Em guarda!', { pose:'special' }) ],
    depois:[ D('tupas','Tá bom, tá bom! Espião não apanha tão bem assim.', { pose:'hurt' }), D('tupas','Eu sou o Tupas. Justiceiro do reino. Eu protejo a vila dos cobradores da rainha.'),
             D('strong_smerg','Você manda na água inteira desse esgoto. Por que fica em cima do cano?'), D('tupas','Porque eu não sei nadar.'), D('serrinha_dog','…'),
             D('tupas','Água que obedece não precisa de braçada. Fim de assunto.') ] });
  luta('c2_pedagio', { titulo:'Pedágio de Alma', cenario:'mata', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[SOLDADO,LANCEIRO,SOLDADO] } });
  luta('c2_bando', { titulo:'Primeiro Contrato', cenario:'reino', time:['strong_smerg','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[DESERTOR, { nome:'Chefe do Bando', hp:220, atk:20, def:7, spd:9 }, DESERTOR] },
    antes:[ SM('Tá olhando o quê, grandão? A vila é nossa depois que escurece.', 'CHEFE DO BANDO', { cenario:'reino' }), D('serrinha_dog','Escureceu.', { pose:'special' }) ],
    depois:[ N('Trinta moedas numa sacolinha. O dono da taverna aperta a mão dos dois.'), D('strong_smerg','A gente bate em quem merece e ainda recebe. Caçador de recompensa.'),
             D('serrinha_dog','Eu gosto disso. Ninguém é dono da gente. Quem paga é cliente.'), D('strong_smerg','Strong e Serrinha. Caçadores de recompensa.'), D('serrinha_dog','Serrinha e Strong. Eu que mordo.') ] });
  luta('c2_rapaz', { titulo:'O Rapaz de Tel Aviv', cenario:'castelo', time:['careca'], inimigos:['smerg_normal','smerg_normal'], ajustes:{ inimigo:[SOLDADO,SOLDADO] },
    antes:[ N('ALGUMAS SEMANAS DEPOIS. Um forasteiro atravessa o salão do trono segurando um esfregão.', { cenario:'castelo' }),
            D('careca','Majestade. Eu vim de Tel Aviv. Meu melhor amigo sumiu: um homem de casaco branco levou ele da rua.'), D('careca','Dizem que a rainha do norte acha qualquer um. Eu pago o que for.'),
            D('smergula','Qualquer preço? Que fofo. O preço é uma alma. A sua.'), D('careca','…Minha alma eu não vendo. Nem pelo Mecas.'),
            D('smergula','Ninguém perguntou se você vende, cacheado. GUARDAS.'), D('careca','Eu só vim aqui com um esfregão. Mas um esfregão já resolve.', { pose:'special' }) ],
    depois:[ D('smergula','Ele bate nos meus soldados com um ESFREGÃO. Que ofensa.'), D('smergula','Você quer tanto ficar no chão limpando? Então rasteja nele. Pra sempre.', { pose:'special' }),
             N('O véu preto cai de novo. O Careca se encolhe, se enrola… e o que sobra no chão do salão é uma minhoca.'), D('careca','O que… o que você fez comigo?!', { forma:1, pose:'hurt' }),
             D('smergula','Um presente. Cada vez que você cair, vai voltar assim. Joguem no fosso.'),
             N('NO FOSSO DO CASTELO. A minhoca afunda… e a água a cospe de volta pra margem, sozinha.', { cenario:'esgoto' }),
             D('tupas','Não me pede pra entrar aí. A água te trouxe. Agradece a ela.'), D('careca','…Obrigado, água.', { forma:1, pose:'hurt' }) ] });
  luta('c2_justica', { titulo:'Justiça Não Tem Preço', cenario:'esgoto', time:['strong_smerg','serrinha_dog'], inimigos:['tupas','careca'], ajustes:{ inimigo:[{ hp:155, atk:15 }, { hp:145, atk:15 }] },
    antes:[ SM('N-não me entreguem… eu só peguei pão pra minha mãe…', 'DESERTOR', { forma:1, cenario:'esgoto' }), D('careca','Ele fica. Pão pra mãe não é crime.'),
            D('tupas','No meu esgoto ninguém caça faminto.'), D('strong_smerg','Contrato é contrato, justiceiro.'), D('careca','Então vem buscar.', { pose:'special' }) ],
    depois:[ D('strong_smerg','…Pão pra mãe, é?', { pose:'hurt' }), SM('A rainha cobra alma até da comida. Ela não come, ela não dorme… só cobra.', 'DESERTOR', { forma:1 }),
             D('strong_smerg','Some daqui. Não vi ninguém. Contrato cancelado.'), D('serrinha_dog','Oitenta moedas, Strong…'), D('strong_smerg','Eu sei.'),
             D('careca','Cada um com a sua religião. Mas hoje vocês fizeram justiça. De graça.') ] });
  luta('c2_cobrador', { titulo:'O Cobrador da Rainha', chefe:true, rejogavel:true, cenario:'reino', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','fat_smerg','smerg_normal'],
    ajustes:{ inimigo:[SOLDADO, { nome:'Fat Smerg', chefe:true, hp:572, atk:30, def:14, spd:9, danoMult:1.06 }, SOLDADO] },
    antes:[ N('A praça da vila. Os moradores em fila, cada um com um potinho de vidro na mão.', { cenario:'reino' }),
            D('fat_smerg','Imposto de alma! Um pedacinho por cabeça. Não dói. Quer dizer… dói um pouquinho.'), D('fat_smerg','Ninguém nesse reino é forte o bastante pra dizer não pra rainha. Né, Strong?'),
            D('strong_smerg','Eu disse não pra ela na cara dela.'), D('fat_smerg','E olha onde você foi parar. Morando num ESGOTO.'), D('tupas','O esgoto é meu. Ele é visita.'),
            D('fat_smerg','Ninguém aqui é único, só eu e a rainha. Vou lembrar vocês disso.', { pose:'special' }) ],
    depois:[ D('fat_smerg','Uff… você bate forte, Strong. Fora do normal mesmo.', { pose:'hurt' }), D('fat_smerg','A rainha vai saber disso. E quando ela souber, eu não vou poder te proteger.'),
             D('strong_smerg','Você nunca me protegeu.'), D('fat_smerg','…Protegi mais do que você imagina.') ] });
  luta('c2_sozinho', { titulo:'Sozinho no Reino', cenario:'reino', time:['tupas','careca'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[SOLDADO,LANCEIRO,SOLDADO] },
    antes:[ SM('Ordem da rainha: quem ajudou o forte e o cachorro paga em dobro!', 'SOLDADO SMERG', { cenario:'reino' }), D('tupas','Quem ajudou fui eu. Cobra de mim.'),
            SM('Ele tá sozinho! Sem os caçadores!'), D('careca','Sozinho não. Com um esfregão.'), D('tupas','E com um poço aqui do lado.', { pose:'special' }) ],
    depois:[ N('Dois soldados fogem encharcados. O terceiro fica — de joelhos, tremendo, com o boné no peito.'),
             SM('N-não me afoga! Eu nem queria vir! Eu nunca quero vir!', 'SOLDADO SMERG Nº 312', { forma:1 }), D('tupas','Se não queria, por que veio?'),
             SM('Porque a rainha manda a gente na frente e fica lá atrás. Quem não vai… vira potinho.', 'SOLDADO SMERG Nº 312', { forma:1 }), D('tupas','Você tem nome, Nº 312?'),
             SM('Os outros me chamam de Pipoca. Porque eu pulo de susto com qualquer barulho.', 'PIPOCA', { forma:1, pose:'special' }) ] });
  luta('c2_pipoca', { titulo:'O Desertor Pipoca', cenario:'esgoto', time:['tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{}, PIPOCA], inimigo:[LANCEIRO,SOLDADO,LANCEIRO] },
    antes:[ SM('O 312 virou casaca! Pega ele junto!', 'LANCEIRO SMERG', { cenario:'esgoto' }), SM('Ai, mãe. Tá bom. TÁ BOM. Eu luto!', 'PIPOCA', { forma:1, pose:'special' }) ],
    depois:[ SM('Eu… eu ganhei? EU GANHEI UMA LUTA!', 'PIPOCA', { pose:'win' }), D('tupas','A gente ganhou.'), SM('Tem mais gente como eu, Tupas. Com medo. Mas cansada de ter medo.', 'PIPOCA'), D('tupas','Então a gente começa uma coleção.') ] });
  luta('c2_volta', { titulo:'A Volta dos Caçadores', cenario:'mata', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[LANCEIRO,CAPITAO,LANCEIRO] },
    antes:[ SM('ALTO! A rainha fechou a fronteira. Ninguém entra.', 'CAPITÃO SMERG', { cenario:'mata' }), D('strong_smerg','A gente é DAQUI.', { pose:'special' }) ],
    depois:[ SM('A rainha… tá esperando alguém. Um visitante. Ninguém pode atrapalhar a chegada dele.', 'CAPITÃO SMERG', { pose:'hurt' }), D('serrinha_dog','Que visitante?'),
             SM('Ninguém sabe. Só que ele vem do sul. E vem com pressa.', 'CAPITÃO SMERG', { pose:'hurt' }) ] });
  luta('c2_bones', { titulo:'Rebelião dos Bonés', cenario:'reino', time:['strong_smerg','serrinha_dog','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},PIPOCA], inimigo:[SOLDADO,CAPITAO,SOLDADO] },
    antes:[ SM('Medo é desobediência! Quem tremer na guerra, vira potinho!', 'CAPITÃO SMERG', { cenario:'reino' }), SM('…Eu tremia na fila igual eles. Todo dia.', 'PIPOCA', { forma:1 }),
            D('strong_smerg','Eu também. Eu era o Nº 77 dessa fila.'), D('serrinha_dog','E eu era o cachorro que comia o resto da comida de vocês. A gente é tudo da mesma rua.'), SM('EU NÃO VOU TREMER MAIS!', 'PIPOCA', { pose:'special' }) ],
    depois:[ N('Um por um, os soldados de joelhos se levantam. E viram o boné pra frente.'), SM('Boné pra frente é… é rebelde! Eles estão com a gente!', 'PIPOCA', { pose:'win' }),
             D('strong_smerg','Uma rebelião de bonés. Nunca achei que ia ver isso.'), D('serrinha_dog','A rainha vai odiar. Já gostei.') ] });
  luta('c2_capitao', { titulo:'O Capitão-Mor', chefe:true, rejogavel:true, cenario:'reino', time:['strong_smerg','serrinha_dog','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ inimigo:[CAPITAO, { nome:'Capitão-Mor Smergão', chefe:true, hp:870, atk:60, def:13, spd:12, danoMult:1.06 }, CAPITAO] },
    antes:[ N('O portão do quartel cai no chão. Atrás dele, o maior smerg comum que o reino já viu de armadura.', { cenario:'reino' }),
            SM('Rebelião de BONÉ? Eu sou o Capitão-Mor desse exército. Eu treinei cada um de vocês. Inclusive você, Nº 77.', 'CAPITÃO-MOR SMERGÃO'),
            D('strong_smerg','O senhor me ensinou a dar soco. Eu aprendi sozinho em quem dar.'), D('tupas','Pipoca, leva os rebeldes pro esgoto. A gente segura ele.') ],
    depois:[ SM('Vocês não entendem… a rainha não quer só o reino…', 'CAPITÃO-MOR SMERGÃO', { pose:'hurt' }),
             SM('O visitante do sul… ele traz o TEMPO de uma cidade inteira. Com isso ela para o mundo.', 'CAPITÃO-MOR SMERGÃO', { pose:'hurt' }),
             D('serrinha_dog','O tempo de uma cidade inteira… Strong. O homem do relógio.'), D('strong_smerg','O Marcelão. Ele tá vindo pra cá.') ] });
  luta('c2_rachadura', { titulo:'Rachadura no Céu', cenario:'reino', time:['tupas','careca','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[congelado('Soldado Smerg', { hp:190, atk:20, def:8 }), congelado('Lanceiro Smerg', { hp:200, atk:22, def:8 }), congelado('Soldado Smerg', { hp:190, atk:20, def:8 })] },
    antes:[ N('Uma rachadura branca risca o céu do reino, de sul a norte. Faz tique. Faz taque.', { cenario:'reino' }), N('Por onde ela passa, os soldados ficam parados no meio do passo — com olhos azuis, gelados.'),
            D('tupas','Gelo é água que esqueceu de correr. Eu cuido disso.'), N('As três cabeças viram ao mesmo tempo. Tique. Taque.') ],
    depois:[ N('O gelo derrete. Os soldados acordam sem lembrar de nada.'), SM('Um homem de casaco branco passou por aqui… perguntou o caminho do castelo… e pediu pra ver as horas no meu relógio.', 'SOLDADO SMERG', { forma:1 }),
             D('careca','Casaco branco. Foi ele que levou o Mecas da rua.', { pose:'hurt' }), D('tupas','Ele chegou. O homem do relógio tá no reino.') ] });
  luta('c2_abrigo', { titulo:'O Ladrão Pede Abrigo', cenario:'castelo', time:['tupas','careca','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},PIPOCA], inimigo:[GUARDA_REAL,GUARDA_REAL,GUARDA_REAL] },
    antes:[ D('marcelao_black_jw','Majestade. Eu trago o tempo de uma cidade inteira. Tel Aviv, segundo por segundo.', { pose:'hurt', cenario:'castelo' }),
            D('marcelao_black_jw','Em troca, só peço abrigo. Um robô e um homem do raio estão atrás de mim.'), D('smergula','Tempo… A coisa mais valiosa do mundo, não é o que dizem?'),
            D('marcelao_black_jw','É o que EU digo.'), D('smergula','Você diz errado.'), SM('Atchim!', 'PIPOCA', { forma:1, pose:'special' }), D('smergula','…Temos ratos atrás da coluna. GUARDAS.') ],
    depois:[ N('Os guardas caem. Mas no trono, a rainha nem olhou para a luta.'), D('smergula','Fiquem. Assistam. É bom vocês aprenderem como se faz um negócio comigo.'),
             D('marcelao_black_jw','Majestade… o acordo…', { pose:'hurt' }), D('smergula','O acordo era o tempo. E eu aceito.', { pose:'special' }) ] });
  luta('c2_truque', { titulo:'O Último Truque do Relógio', chefe:true, cenario:'castelo', time:['tupas','careca','smerg_normal'], inimigos:['smerg_normal','marcelao_black_jw','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[congelado('Guarda Real', { hp:200, atk:22, def:9 }), { nome:'Marcelão, Fugitivo', chefe:true, hp:570, atk:30, def:13, spd:16, danoMult:0.65 }, congelado('Guarda Real', { hp:200, atk:22, def:9 })] },
    antes:[ D('marcelao_black_jw','Não… ela não quer o tempo. Ela quer a ALMA de quem segura o tempo.', { pose:'hurt', cenario:'castelo' }),
            D('marcelao_black_jw','Saiam da minha frente. Eu tenho TODO o tempo do mundo — e vou usar ele pra sair daqui.', { pose:'special' }),
            D('careca','Você me roubou um amigo, Marcelão. Hoje você não sai.', { pose:'special' }), D('tupas','Tirei a água do fosso por um túnel. Ele não sai por baixo.') ],
    depois:[ N('O Marcelão cai de joelhos. O relógio no bolso dele racha.'), D('marcelao_black_jw','Hah… fugi de um ciborgue e de um raio… pra cair pra uma minhoca de esfregão.', { pose:'hurt' }),
             D('marcelao_black_jw','Escutem… avisem a unidade 5000Z… o laboratório guarda um—', { pose:'hurt' }), N('Uma sombra cobre o salão inteiro. A rainha desceu do trono.'), D('smergula','Shhh. Chega de conversa, relojoeiro.') ] });
  luta('c2_sombra', { titulo:'A Rainha Cobra a Conta', chefe:true, rejogavel:true, cenario:'castelo', time:['tupas','careca','smerg_normal'], inimigos:['smerg_normal','smergula'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[GUARDA_REAL, { nome:'Sombra da Rainha', chefe:true, hp:477, atk:27, def:10, spd:12, danoMult:1.06 }] },
    antes:[ D('smergula','Todo o tempo de uma cidade inteira… e a alma de quem roubou ele. Dois pratos num jantar só.', { pose:'special', cenario:'castelo' }),
            D('marcelao_black_jw','Tique…', { pose:'hurt' }), D('smergula','Taque.', { pose:'special' }),
            N('Um fio branco sai do peito do Marcelão e entra na boca da rainha. O casaco branco cai vazio no chão.'), N('MARCELÃO BLACK JW, O LADRÃO DE TEMPO, ESTÁ MORTO.'),
            N('Os olhos da Smergula ficam azuis por um instante. Todos os relógios do castelo param. Depois voltam a andar — pra trás.'),
            D('smergula','Eu não vou sujar a mão com vocês. Minha sombra cuida. E um guarda pra ela não se sentir sozinha.') ],
    depois:[ N('A sombra da rainha se desfaz em fumaça — e a rainha, no trono, só sorri. Nem um arranhão.'),
             D('smergula','Amanhã eu paro o reino. Depois Tel Aviv. Depois aquela cidadezinha do interior. Limeira.'),
             N('A água do fosso explode pelas janelas do salão — e leva os três embora num jato.', { cenario:'esgoto' }),
             D('tupas','Respirem. Tão vivos. Eu continuo sem saber nadar, mas a água me deve favores.') ] });
  luta('c2_parou', { titulo:'O Reino Parou', cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},PIPOCA], inimigo:[RELOGIO,SOLDADO,RELOGIO] },
    antes:[ N('A vila inteira parada no meio do dia: o padeiro com o pão no ar, as crianças no meio do pulo.', { cenario:'reino' }), D('serrinha_dog','Ela fez igual o Marcelão fez em Tel Aviv. Só que pior.'),
            SM('Olha os soldados! Eles têm um relógio no peito! Brilhando!', 'PIPOCA', { forma:1 }), D('tupas','Ela dividiu o tempo do Marcelão entre os soldados. Agora eles são mais rápidos que a gente.'),
            D('serrinha_dog','Mais rápido que eu? Isso eu quero ver.', { pose:'special' }) ],
    depois:[ N('O relógio no peito de um soldado quebra. O padeiro da vila pisca, e o pão cai no chão.'), D('tupas','Quebrou o relógio do soldado, o tempo volta pra quem foi roubado.'), D('serrinha_dog','Então a gente quebra todos.') ] });
  luta('c2_cao', { titulo:'Os Caçadores de Cão', cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[{ nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }, { nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }, { nome:'Caçador de Cão', hp:210, atk:24, def:8, spd:11 }] },
    antes:[ SM('Ordem da rainha: recolher o bichinho de estimação dela. Com coleira.', 'CAÇADOR DE CÃO', { cenario:'reino' }), D('serrinha_dog','O bichinho cresceu.', { pose:'special' }) ],
    depois:[ D('serrinha_dog','Ela me fez metade gente achando que eu ia ser metade dela.'), D('serrinha_dog','Sabe o que o Orelha fazia quando alguém tentava pôr coleira nele? Mordia.'),
             SM('Você ainda morde.', 'PIPOCA'), D('serrinha_dog','Agora com dente de serra.') ] });
  luta('c2_represa', { titulo:'Represa', cenario:'esgoto', time:['tupas','serrinha_dog','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},REBELDE], inimigo:[LANCEIRO, { nome:'Capitão da Represa', hp:300, atk:28, def:10, spd:11 }, LANCEIRO] },
    antes:[ N('O esgoto treme. A água sobe rápido — pela canela, pelo joelho, pela cintura.', { cenario:'esgoto' }), D('serrinha_dog','Tupas… a água tá no seu peito.'), D('tupas','Eu tô vendo.', { pose:'hurt' }),
            D('tupas','Água que obedece… não precisa de braçada. OBEDECE.', { pose:'special' }), N('A água para. Toda ela. E começa a voltar pelo túnel, contra a corrente.') ],
    depois:[ N('A represa estoura de dentro pra fora. Os soldados que a guardavam saem boiando rio abaixo.'), SM('ELE SEGUROU O RIO! COM A ÁGUA NO PESCOÇO!', 'SMERG REBELDE', { pose:'win' }),
             D('tupas','…Alguém me tira desse cano. Agora. Por favor.', { pose:'hurt' }) ] });
  luta('c2_mercado', { titulo:'O Mercado de Almas', cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},PIPOCA], inimigo:[RELOGIO,RELOGIO,RELOGIO] },
    antes:[ SM('Quem quebrou os potinhos da rainha?! Isso é imposto!', 'FISCAL SMERG', { cenario:'reino' }), D('serrinha_dog','Fui eu. Cobra de mim.', { pose:'special' }) ],
    depois:[ SM('…Mãe? Mãe, sou eu. O Pipoca.', 'PIPOCA'), N('Uma senhora pisca, sorri e passa a mão no boné dele.'), D('tupas','Isso aqui era um mercado só. O Relógio de Almas tem centenas.') ] });
  luta('c2_relogio_mestre', { titulo:'O Smerg do Relógio Mestre', chefe:true, rejogavel:true, cenario:'reino', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[RELOGIO, { nome:'Smerg do Relógio Mestre', chefe:true, hp:617, atk:37, def:11, spd:14, danoMult:1.1 }, RELOGIO] },
    antes:[ N('A torre do sino da vila. No alto, um smerg com um mostrador enorme cravado no peito, girando rápido demais.', { cenario:'reino' }),
            SM('Ela me deu uma HORA inteira do tempo de Tel Aviv. Eu sou mais rápido que qualquer um.', 'SMERG DO RELÓGIO MESTRE', { pose:'special' }),
            D('serrinha_dog','O Strong não ficou forte porque alguém deu. Ele treinou um ano inteiro.'), SM('E eu ganhei em um segundo!', 'SMERG DO RELÓGIO MESTRE', { pose:'special' }) ],
    depois:[ N('O mostrador explode em luz. A hora roubada volta voando pro sul — de volta pra Tel Aviv.'), SM('Eu… eu só queria ser alguém. Igual o Strong.', 'SMERG DO RELÓGIO MESTRE', { forma:1, pose:'hurt' }),
             D('serrinha_dog','Então treina. Ele começou igualzinho você.'), SM('Pode! Pega um boné e vira pra frente!', 'PIPOCA', { pose:'win' }) ] });
  luta('c2_pombo', { titulo:'Recado de Tel Aviv', cenario:'mata', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},REBELDE], inimigo:[GUARDA_REAL,RELOGIO,GUARDA_REAL] },
    antes:[ SM('Mensagem de fora do reino! Ordem da rainha: nada entra, nada sai!', 'GUARDA REAL', { cenario:'mata' }), D('serrinha_dog','Esse pombo cheira a pão de padaria. Isso é coisa de limeirense.'), D('tupas','Pega o pombo. Eu pego os guardas.', { pose:'special' }) ],
    depois:[ N('"TÔ VOLTANDO. COM UM EXÉRCITO DE ROBÔS, UM HOMEM QUE VIRA RAIO E UM CARRO PRATA. SEGURA AÍ. — STRONG"', { nome:'BILHETE' }),
             D('serrinha_dog','Ele voltou a escrever "segura aí". Ele sempre escreve "segura aí".'), D('tupas','E o exército vai precisar de uma porta aberta. Uma bem grande.') ] });
  luta('c2_jantar', { titulo:'O Jantar do Fat Smerg', cenario:'castelo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','fat_smerg','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[{ nome:'Cozinheiro Smerg', hp:160, atk:18, def:7 }, { nome:'Fat Smerg', hp:400, atk:25, def:13, spd:9 }, { nome:'Cozinheiro Smerg', hp:160, atk:18, def:7 }] },
    antes:[ D('fat_smerg','Pode entrar, cachorro. Eu senti o cheiro de você desde a escada.', { cenario:'castelo' }), D('serrinha_dog','Você janta sozinho todo dia, Fat?'),
            D('fat_smerg','Eu era um smerg comum. Ninguém nunca olhou pra mim na fila. A rainha olhou.'), D('fat_smerg','Ela me deu comida quando eu tinha fome. Me deu nome quando eu era um número. Ela me fez único.'),
            D('tupas','Ela te deu comida em troca de um pedaço da sua alma.'), D('fat_smerg','E valeu cada pedaço.', { pose:'special' }) ],
    depois:[ D('fat_smerg','Uff… vocês não vão me convencer, cachorro.', { pose:'hurt' }), D('fat_smerg','Ela me olhou quando ninguém olhava. Eu não traio quem me olhou.'),
             D('serrinha_dog','Eu sei como é isso. O Strong dividiu um pão comigo quando eu era só um cachorro.'), D('fat_smerg','Então você entende por que eu vou estar do lado dela até o fim.') ] });
  luta('c2_desperta', { titulo:'A Rainha Desperta', cenario:'castelo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{},{},PIPOCA], inimigo:[GUARDA_TRONO,RELOGIO,GUARDA_TRONO] },
    antes:[ D('smergula','Povo do meu reino. Ao amanhecer, eu vou girar o Relógio de Almas uma última vez.', { pose:'special', cenario:'castelo' }),
            D('smergula','E o mundo inteiro vai parar. Tel Aviv. Limeira. Cada relógio. Cada alma. Tudo meu. Pra sempre.'),
            D('smergula','Ah, e pros ratinhos no meu corredor: a guarda do trono manda lembranças.'), D('serrinha_dog','Ótimo. Eu tava cansado de andar na ponta do pé.', { pose:'special' }) ],
    depois:[ N('Lá fora, longe, além da fronteira sul: um som de corneta. Depois, outro som. Uma buzina. De Astra.'), D('serrinha_dog','Ele sempre escreve "segura aí". E sempre chega.') ] });
  luta('c2_general', { titulo:'General Smergão', chefe:true, rejogavel:true, cenario:'campo', time:['serrinha_dog','tupas','smerg_normal'], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ aliado:[{},{},PIPOCA], inimigo:[RELOGIO, { nome:'General Smergão', chefe:true, hp:589, atk:37, def:13, spd:14, danoMult:1.09 }, RELOGIO] },
    antes:[ N('O CAMPO EM FRENTE AO CASTELO, de madrugada. Três mil bonés pra trás, em fila. Um general de armadura dourada na frente.', { cenario:'campo' }),
            SM('Rebeldes de boné virado. Eu vou desvirar um por um.', 'GENERAL SMERGÃO'), SM('Três mil, Serrinha. A gente é cinquenta.', 'PIPOCA', { forma:1 }),
            D('serrinha_dog','A gente só precisa segurar até o sol nascer.'), D('tupas','E derrubar o general. Sem general, três mil bonés viram três mil smergs com medo.') ],
    depois:[ N('O General cai. O exército da rainha hesita.'), N('E então o sol nasce — e com ele, no alto da estrada do sul, uma fileira de olhos azuis acesos.'),
             N('Androides. Centenas. Na frente deles, um ciborgue, um homem que brilha de eletricidade… e um smerg grandão acenando.'),
             D('strong_smerg','EU FALEI QUE VOLTAVA!', { pose:'special' }) ] });
  luta('c2_chegada', { titulo:'A Chegada', cenario:'campo', time:'grupo', inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[RELOGIO,GUARDA_TRONO,RELOGIO] },
    antes:[ N('O CAMPO DE GUERRA. Dois exércitos frente a frente: a bandeira roxa da rainha e a azul de quem veio do sul.', { cenario:'campo' }),
            D('cargas','Os soldados com relógio no peito: deixa eles comigo. Ninguém é mais rápido que eu.', { pose:'special' }) ],
    depois:[ D('cargas','Relógio roubado do Marcelão. Eu ainda reconheço esse tique-taque.'), D('mecas','Ele está morto. E mesmo assim ainda tem gente apanhando por causa do tempo dele.'),
             D('strong_smerg','Então a gente devolve o tempo pra quem é dono. Segundo por segundo.') ] });
  luta('c2_metal', { titulo:'Metal Contra Boné', cenario:'campo', time:['mecas','mecas_grunt','mecas_grunt'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ aliado:[{}, ANDROIDE, ANDROIDE], inimigo:[GUARDA_REAL,CAPITAO,GUARDA_REAL] },
    antes:[ D('mecas','"CÓDIGO 5000Z. LINHA DE FRENTE: AVANÇAR."', { pose:'special', cenario:'campo' }), N('Fileiras de androides marcham contra fileiras de bonés. Metal contra boné.'),
            SM('Eles… eles têm a mesma cara! Todos!', 'CAPITÃO SMERG', { forma:1 }), D('mecas','Vocês também. A gente tem mais em comum do que a rainha quer que vocês saibam.') ],
    depois:[ D('mecas','"LINHA DE FRENTE: SEGURAR POSIÇÃO."'), SM('Vocês… não vão acabar com a gente?', 'SOLDADO SMERG', { forma:1, pose:'hurt' }),
             D('mecas','Eu era uma pessoa dentro de uma cápsula, obedecendo ordem de quem me roubou. Eu conheço essa cara de medo.'), D('mecas','Vira o boné pra frente e sai do campo.') ] });
  luta('c2_caravana', { titulo:'A Caravana de Limeira', cenario:'campo', time:[L,'fat_mango','matheus_limeira2'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[GUARDA_REAL,GUARDA_TRONO,GUARDA_REAL] },
    antes:[ N('Uma buzina corta o campo de guerra. O Corsa vermelho, carregado de pão, vem descendo a estrada.', { cenario:'campo' }),
            D('matheus_limeira2','Três vezes nesse reino. Agora pelo menos é de propósito.'), D('fat_mango','Quem tá com fome, pão quente no porta-malas! Quem é soldado da rainha, pão DORMIDO na cara!'),
            SM('Quem são vocês?!', 'GUARDA REAL'), D(L,'Lambança, de Tel Aviv. Pai, abençoa essa trombada!', { pose:'special' }), D('fat_mango','De LIMEIRA.'), D('matheus_limeira2','Ele é de Limeira.') ],
    depois:[ SM('Afinal… ele é de onde?', 'GUARDA REAL', { pose:'hurt' }), D(L,'De onde o coração aponta, irmão. Hoje ele aponta pra cá.'), D('fat_mango','Bonito. Errado, mas bonito.'),
             D('fat_mango','…E "só existe um Fat"? Fica tranquilo, grandão do castelo. A gente não é parente.') ] });
  luta('c2_raio_agua', { titulo:'Raio e Água', cenario:'castelo', time:['tupas','cargas','serrinha_dog'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[GUARDA_TRONO,RELOGIO,GUARDA_TRONO] },
    antes:[ N('A ponte levadiça. O cadeado roxo da rainha, brilhando. A guarda do trono na frente dele.', { cenario:'castelo' }), D('serrinha_dog','Os guardas primeiro. Depois vocês fazem ciência.', { pose:'special' }) ],
    depois:[ N('O fio de água sobe do fosso até o cadeado. O Cargas encosta a mão nele.'), D('cargas','Fica longe da água, Tupas.'), D('tupas','Eu SEMPRE fico longe da água.'),
             N('BUM. O cadeado estoura, as correntes gritam, e a ponte levadiça desce com um estrondo.'), D('strong_smerg','PONTE ABERTA! TODO MUNDO PRA DENTRO!') ] });
  luta('c2_escada', { titulo:'Escada pro Trono', cenario:'castelo', time:['careca','mecas','tupas'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[GUARDA_TRONO,GUARDA_TRONO,GUARDA_TRONO] },
    antes:[ N('A escadaria do salão do trono. A mesma que o Careca subiu, meses atrás, com um esfregão e um pedido.', { cenario:'castelo' }), D('careca','Foi aqui. Eu subi essa escada pedindo ajuda pra achar você, Mecas.'),
            D('careca','Desci ela rastejando.', { pose:'hurt' }), D('mecas','Hoje você sobe de novo. E eu tô do seu lado.'), D('careca','Eu vou subir essa escada. Nem que seja rastejando.', { pose:'special' }) ],
    depois:[ D('tupas','Escada limpa.'), D('careca','Literalmente. Eu passei o esfregão.'), N('E na frente da última porta, ocupando ela inteira, o Fat Smerg.') ] });
  luta('c2_fat_unico', { titulo:'Fat Smerg, o Único', chefe:true, rejogavel:true, cenario:'castelo', time:['strong_smerg','serrinha_dog','fat_mango'], inimigos:['fat_smerg'],
    ajustes:{ inimigo:[{ nome:'Fat Smerg, o Único', chefe:true, hp:798, atk:38, def:16, spd:11, danoMult:1.05 }] },
    antes:[ D('fat_smerg','Strong. Serrinha. Eu sabia que ia ser vocês.', { cenario:'castelo' }), D('strong_smerg','Sai da porta, Fat. Ela vai parar o mundo. Vai parar você junto.'),
            D('fat_smerg','No reino só existe um de cada coisa fora do normal. Um forte. Um gordo. Vamos ver qual dos dois é MAIS fora do normal.', { pose:'special' }),
            D('fat_mango','Ô grandão, eu sou padeiro. Eu entendo de massa. A sua tá mal sovada. Vem.') ],
    depois:[ D('fat_smerg','Uff… o forte ganhou. Do jeito que começou: treinando.', { pose:'hurt' }), N('O Fat Mango se ajoelha do lado dele e estende um pão ainda quente.'),
             D('fat_mango','Ninguém devia jantar sozinho, grandão. Nem você.'), D('fat_smerg','…É de quê?'), D('fat_mango','De padaria. Não custa alma nenhuma.'),
             D('fat_smerg','Eu não vou trair ela, padeiro. Mas também não vou levantar de novo.'), N('O Fat Smerg come o pão em silêncio. E sai do caminho.') ] });
  luta('c2_relogio_almas', { titulo:'Relógio de Almas', cenario:'torre', time:['mecas','cargas','careca'], inimigos:['smerg_normal','smerg_normal','smerg_normal'], ajustes:{ inimigo:[RELOGIO, { nome:'Guardião do Relógio', hp:340, atk:34, def:12, spd:15 }, RELOGIO] },
    antes:[ N('O ALTO DA TORRE DO CASTELO. Um relógio gigante, feito de centenas de potinhos de vidro. Dentro de cada um, uma alma.', { cenario:'torre' }),
            D('cargas','Ele roubou isso de nós. Ela roubou dele. Hoje volta pro dono.'), SM('"NINGUÉM TOCA NO RELÓGIO DA RAINHA."', 'GUARDIÃO DO RELÓGIO', { pose:'special' }) ],
    depois:[ N('O Mecas soca o centro do relógio. Os potinhos estouram todos ao mesmo tempo.'), N('Uma chuva de fios brancos se espalha pelo céu — pro reino, pra Tel Aviv, pra Limeira.'),
             D('cargas','Acabou o tempo dela.'), D('careca','Não. Escuta.', { pose:'hurt' }), N('No salão do trono, uma risada. Ela não precisa mais do relógio. Ela já bebeu o suficiente.') ] });
  luta('c2_bones_frente', { titulo:'Bonés Pra Frente', cenario:'campo', time:['smerg_normal','serrinha_dog',L], inimigos:['smerg_normal','smerg_normal','smerg_normal'],
    ajustes:{ aliado:[PIPOCA,{},{}], inimigo:[GUARDA_TRONO, { nome:'Capitão do Trono', hp:360, atk:36, def:13, spd:13 }, GUARDA_TRONO] },
    antes:[ SM('Pessoal! Eu sou o Pipoca! Eu pulava de susto com qualquer barulho! Hoje eu ainda pulo. Mas pulo PRA FRENTE!', 'PIPOCA', { pose:'special', cenario:'campo' }),
            D(L,'Que discurso lindo, filho. Senhor, abençoa esses meninos de boné.') ],
    depois:[ N('O último guarda do trono larga a lança. E vira o boné pra frente.'), SM('A gente… a gente ganhou a guerra?', 'PIPOCA'), D('serrinha_dog','A guerra não. Falta a rainha.'),
             D(L,'Pipoca, você nasceu em Tel Aviv também?'), SM('Não, senhor. Aqui no reino.', 'PIPOCA'), D(L,'Igual eu, então. Cada um nasce onde o coração aponta.') ] });
  luta('c2_rainha', { titulo:'Rainha Smergula', chefe:true, final:true, rejogavel:true, cenario:'castelo', time:['mecas','cargas','strong_smerg'], inimigos:['smergula'],
    ajustes:{ inimigo:[{ nome:'Rainha Smergula', chefe:true, hp:620, atk:33, def:12, spd:16 }] },
    antes:[ N('O SALÃO DO TRONO. Vazio. Nenhum guarda, nenhum gordinho. Só a rainha, no trono.', { cenario:'castelo' }),
            D('smergula','Vocês quebraram meu relógio. Libertaram meus soldados. Envergonharam meu gordinho.'),
            D('smergula','Mas a alma do relojoeiro ainda está AQUI dentro. E com ela, todo o tempo dele.', { pose:'special' }),
            D('mecas','Ele deixou um recado pra mim antes de morrer. Disse que você não devolve nada.'), D('smergula','Ele me conhecia bem.'),
            D('strong_smerg','Majestade. Da última vez eu não ajoelhei. Hoje eu vim te derrubar.', { pose:'special' }) ],
    depois:[ D('smergula','Hah… HAH… vocês acham que essa era eu?', { pose:'hurt' }), D('smergula','Esse era o resto de GENTE que sobrava em mim.'),
             N('Ela abre a boca e respira fundo. Cada alma que ainda flutuava pelo salão é sugada de uma vez.'),
             N('O rosto muda. A voz muda. O que levanta do trono já não é bem gente.'),
             D('smergula','Vocês querem o reino? Fiquem com ele. EU QUERO O MUNDO.', { forma:1, pose:'special' }),
             D('smergula','Tel Aviv. Limeira. A ilha. Os caçadores que eu paguei. Os justiceiros que eu poupei. O meu gordinho. TODO MUNDO.', { forma:1 }),
             N('Ela atravessa o teto do salão numa coluna de fumaça roxa — e some no céu do norte.'),
             D('cargas','Ela fugiu.'), D('mecas','Não. Ela foi chamar a guerra.'),
             N('A GUERRA DE TODOS COMEÇOU.'), N('FIM DO CAPÍTULO 2 — SMERGULUS KINGDOM.') ] });

  /* ================= NPCs ================= */
  R.npc('sargento', { desenho:'smerg_normal', nome:'SARGENTO SMERG', em:['smergulus', 30, 92], dir:0, se:S=>A1(S) || A2(S),
    falas:[ { cena:['Nº 77! Toque de recolher foi faz duas horas!','…Tá, tá. Mais cem flexões. Mas sem barulho.'] } ] });
  R.npc('orelha_beco', { char:null, desenho:'orelha', nome:'Cachorro Orelha', em:['smergulus', 73, 119], dir:0, se:S=>S.comecou('c2_orelha') && !S.feita('c2_orelha'), falas:[ { cena:['(abana o rabo e esconde um pão debaixo da orelha)'] } ] });
  R.npc('smergula_trono', { char:'smergula', nome:'Rainha Smergula', em:['castelo_salao', 11, 6], dir:0, se:S=>(A1(S) && S.comecou('c2_trono') && !S.feita('c2_trono')) || (A2(S) && S.ativa('c2_abrigo')),
    falas:[ { cena:['Ajoelha.'] } ] });
  R.npc('fat_trono', { char:'fat_smerg', nome:'Fat Smerg', em:['castelo_salao', 14, 7], dir:1, se:S=>A1(S) && S.comecou('c2_trono') && !S.feita('c2_trono'), mudo:true });
  R.npc('tupas_esgoto', { char:'tupas', nome:'Tupas', em:['esgoto', 12, 9], dir:0, se:S=>A1(S),
    falas:[ { se:S=>S.feita('c2_agua'), cena:['Fica longe da beirada. Não por você. Por mim.'] }, { cena:['Quem está aí?'] } ] });
  R.npc('careca_esgoto', { char:'careca', nome:'O Careca', em:['esgoto', 14, 9], dir:0, se:S=>A1(S) && S.feita('c2_rapaz'),
    falas:[ { cena:['Eu vim de Tel Aviv procurar um amigo. Olha onde eu vim parar. Num esgoto, com um cara que não sabe nadar.'] } ] });
  R.npc('mango_fronteira', { char:'fat_mango', nome:'Fat Mango', em:['smergulus', 80, 130], dir:0, se:S=>A1(S) && S.comecou('c2_pedagio') && !S.feita('c2_pedagio'),
    falas:[ { cena:['Atalho, robô. Digo, grandão. Atalho.'] } ] });
  R.npc('mameluco_fronteira', { char:'matheus_limeira2', nome:'Mameluco', em:['smergulus', 82, 130], dir:0, se:S=>A1(S) && S.comecou('c2_pedagio') && !S.feita('c2_pedagio'), mudo:true });
  R.npc('chefe_bando', { desenho:'smerg_normal', nome:'CHEFE DO BANDO DO PÉ-DE-CABRA', em:['smergulus', 118, 98], dir:1, se:S=>S.comecou('c2_contrato') && !S.flag('luta:c2_bando') });
  R.npc('fat_praca', { char:'fat_smerg', nome:'Fat Smerg', em:['smergulus', 90, 101], dir:0, se:S=>S.comecou('c2_cobrador') && !S.feita('c2_cobrador') });
  R.npc('pipoca', { desenho:'smerg_normal', nome:'PIPOCA', em:['esgoto', 10, 9], dir:0, se:S=>S.flag('ato2') && S.feita('c2_sozinho'),
    falas:[ { se:S=>S.flag('ato3'), cena:['Boné pra frente, Serrinha! Eu ainda pulo de susto. Mas pulo pra FRENTE.'] }, { cena:['Eu desenhei o castelo no chão com um graveto. Tá torto. O castelo também é torto.'] } ] });
  R.npc('strong_fronteira', { char:'strong_smerg', nome:'Strong Smerg', em:['smergulus', 88, 128], dir:3, se:S=>S.ativa('c2_volta') });
  R.npc('serrinha_fronteira', { char:'serrinha_dog', nome:'Serrinha Dog', em:['smergulus', 90, 128], dir:3, se:S=>S.ativa('c2_volta'), mudo:true });
  R.npc('marcelao_trono', { char:'marcelao_black_jw', nome:'Marcelão Black JW', em:['castelo_salao', 11, 8], dir:3, se:S=>A2(S) && S.ativa('c2_abrigo'), mudo:true });
  R.npc('mae_pipoca', { desenho:'cidadao:16', nome:'DONA SMERGA, MÃE DO PIPOCA', em:['smergulus', 84, 112], dir:0, se:S=>S.flag('ato1'),
    falas:[ { se:S=>S.ativa('sec_ursinho') && S.tem('ursinho_rosa'), cena:['Esse ursinho… veio da ilha. Da menina que a rainha… deixa pra lá. Não fala dela aqui. Joga ele longe.'] },
            { se:S=>S.feita('c2_mercado'), cena:['Meu menino voltou com a alma inteira no peito e o boné virado pra frente. Eu nunca fui tão orgulhosa de uma desobediência.'] },
            { cena:['Meu filho é soldado. Ele pula de susto com tudo. Eu falo pra ele: pula pra frente, filho. Pula pra frente.'] } ] });
  R.npc('veterano', { desenho:'cidadao:17', nome:'VELHO SOLDADO', em:['smergulus', 44, 100], dir:0, se:S=>S.flag('ato1'),
    falas:[ { se:S=>S.ativa('sec_smergulao'), cena:['O Smergulão? Rapaz… ele era um de nós. Grande. Maior que todo mundo. Até o dia em que ele…','…','Bonito o tempo hoje, né? Cinza. Como sempre.'] },
            { cena:['Eu servi três rainhas. Quer dizer, uma rainha só. Três vezes. Ela não envelhece.'] } ] });
  R.npc('escrivao', { desenho:'smerg_normal', nome:'ESCRIVÃO REAL', em:['arquivo_real', 7, 8], dir:3, se:S=>S.flag('ato2'),
    falas:[ { se:S=>S.feita('sec_escrivao'), cena:['(ele te vê, lembra da pergunta e desmaia preventivamente)'] }, { cena:['Arquivo Real, boa tarde. Pode perguntar qualquer coisa. Qualquer coisa MESMO. Menos aquela.'] } ] });
  R.npc('dieta_1', { desenho:'smerg_normal', nome:'SOLDADO DE DIETA', em:['smergulus', 26, 108], dir:0, se:S=>S.flag('ato2'),
    falas:[ { se:S=>S.feita('sec_coxinha'), cena:['A coxinha… era quente… era crocante… era ILEGAL. Melhor coisa que eu comi esse ano.'] }, { cena:['Decreto real: só existe um Fat. O resto come alface. Alface CINZA. Do reino.'] } ] });
  R.npc('dieta_2', { desenho:'smerg_normal', nome:'SOLDADO DE DIETA', em:['smergulus', 40, 108], dir:0, se:S=>S.flag('ato2'), falas:[ ['Eu sonhei com uma coxinha. O fiscal do Fat me multou pelo sonho.'] ] });
  R.npc('dieta_3', { desenho:'smerg_normal', nome:'SOLDADO DE DIETA', em:['smergulus', 32, 88], dir:0, se:S=>S.flag('ato2'), falas:[ ['Meu boné tá folgado de tanta dieta. Tá caindo no olho.'] ] });
  ['coral_1','coral_2','coral_3'].forEach((id,i)=>R.npc(id, { desenho:'smerg_normal', nome:'CORAL DO VULCÃO', em:['smergulus', 26+i*3, 34], dir:3, se:S=>S.flag('ato1'),
    falas:[ ['Láááá… o vulcão dorme… láááá… não acorda não…','(desafinado)'], ['Eu sou o barítono. Ninguém sabe o que é barítono. Nem eu.'], ['Se a gente parar de cantar, ele explode. Ou não. Ninguém quer testar.'] ][i] }));
  // Ato IV
  R.npc('cargas_campo',  { char:'cargas', nome:'Cargas', em:['smergulus', 82, 74], dir:0, se:S=>S.ativa('c2_mesa'), falas:[ { cena:['Tel Aviv quer o tempo de volta. E eu quero a rainha longe de qualquer tomada.'] } ] });
  R.npc('strong_campo',  { char:'strong_smerg', nome:'Strong Smerg', em:['smergulus', 86, 74], dir:0, se:S=>S.ativa('c2_mesa'), falas:[ { cena:['Os caçadores lutam por quem paga. Hoje ninguém paga. …A gente luta assim mesmo. Não espalha.'] } ] });
  R.npc('tupas_campo',   { char:'tupas', nome:'Tupas', em:['smergulus', 90, 74], dir:0, se:S=>S.ativa('c2_mesa'), falas:[ { cena:['Os justiceiros querem justiça. O Careca quer a cabeça dela. Eu quero um esgoto seco e um banho de balde.'] } ] });
  R.npc('lambanca_campo',{ char:L, nome:'Lambança', em:['smergulus', 94, 74], dir:0, se:S=>S.ativa('c2_mesa'), falas:[ { cena:['Limeira quer o sino da igrejinha tocando de novo. Limeira, a cidadezinha que eu nunca fui. Tel Aviv também quer. Eu quero as duas.'] } ] });
  R.inimigo('fiscal_fat', { desenho:'smerg_normal', em:['smergulus', 30, 100], rota:[[22,100],[40,100],[40,92],[22,92]], visao:4, luta:'c2_fiscal', se:S=>S.ativa('sec_coxinha') });
  R.luta('c2_fiscal', { cap:2, titulo:'Fiscal do Fat', cenario:'reino', time:'grupo', inimigos:['smerg_normal','smerg_normal'], ajustes:{ inimigo:[{ nome:'Fiscal do Fat', hp:220, atk:20, def:8 }, SOLDADO] } });
  // patrulhas da fuga (Ato I, furtivo)
  [[70,100],[104,96],[120,106],[132,100]].forEach(([x,y],i)=>R.inimigo('guarda_fuga_'+(i+1), { desenho:'smerg_normal', em:['smergulus', x, y], rota:[[x-6,y],[x+6,y]], visao:5, luta:'c2_telhados', se:S=>S.ativa('c2_fuga') }));
  // soldados com relógio (Ato III)
  [[60,96],[110,96],[86,118]].forEach(([x,y],i)=>R.inimigo('relogio_'+(i+1), { desenho:'sentinela', em:['smergulus', x, y], rota:[[x-5,y],[x+5,y]], visao:4, luta:'c2_relogio_rua', se:S=>A3(S) }));
  R.luta('c2_relogio_rua', { cap:2, titulo:'Soldados do Relógio', cenario:'reino', time:'grupo', inimigos:['smerg_normal','smerg_normal'], ajustes:{ inimigo:[RELOGIO, SOLDADO] } });

  /* ================= OBJETOS ================= */
  // migalhas do Orelha (Ato I)
  [[78,104,'Migalhas de pão na pedra roxa. Pão BRANCO. Só a rainha come pão branco.'],[68,112,'Mais migalhas, entrando no beco. E uma pegada de pata com quatro dedos… e uma orelha arrastando no chão.'],[71,116,'Um pedaço de pão mordido, guardado com cuidado do lado da parede. Alguém está guardando pra depois. Ou pra alguém.']]
    .forEach(([x,y,t],i)=>R.obj('smergulus', 'brilho', x, y, { interagir:true, investigar:'migalha_'+(i+1), verbo:'🍞 OLHAR', se:S=>S.comecou('c2_orelha') && !S.feita('c2_orelha'), texto:[t] }));
  // pesos da academia
  const PESOS={ id:'pesos77', flag:'pesos_ok', ordem:['peso_1','peso_2','peso_3'], ok:'Levantou. ', erro:'Muito pesado assim, de cara. "Aquece primeiro, Nº 77." Os pesos voltam pro chão.',
    acerto:'O PESO QUE NINGUÉM LEVANTA sobe. A academia inteira para pra olhar. No quadro de recordes, alguém risca o "1º lugar" e escreve de novo, maior: "Nº 77".' };
  ['peso_1','peso_2','peso_3'].forEach(id=>R.obj('academia_77', 'brilho', id==='peso_1'?3:id==='peso_2'?7:11, 5, { interagir:true, verbo:'🏋 LEVANTAR '+(id==='peso_1'?'(leve)':id==='peso_2'?'(pesado)':'(O QUE NINGUÉM LEVANTA)'), se:S=>S.comecou('c2_academia') && !S.flag('pesos_ok'), faz:PZ().passoSequencia(PESOS, id) }));
  // potinhos do mercado (Ato III)
  [[75,95],[79,101],[95,95],[97,101],[86,95]].forEach(([x,y],i)=>R.obj('smergulus', 'potinho_alma', x, y, { interagir:true, investigar:'potinho_'+(i+1), verbo:'💥 QUEBRAR', se:S=>S.comecou('c2_mercado') && !S.flag('viu:potinho_'+(i+1)),
    texto:['CRASH. Um fio branco sai do potinho e voa direto pra uma casa da vila. Lá dentro, alguém suspira aliviado.'] }));
  // comportas da represa (Ato III): abrir na ordem do desenho
  const COMP={ id:'comportas', flag:'represa_ok', ordem:['c3','c1','c2'], ok:'A comporta range e abre. ', erro:'A água volta com tudo e fecha as comportas de novo. A ordem está errada.',
    acerto:'As três comportas abertas. A água do esgoto começa a escoar pro rio. O Tupas suspira — do cano.' };
  [['c1',147,55,'DE CIMA'],['c2',147,57,'DO MEIO'],['c3',147,59,'DE BAIXO']].forEach(([q,x,y,n])=>R.obj('smergulus', 'alavanca', x, y, { interagir:true, verbo:'⚙ COMPORTA '+n, se:S=>S.depois('c2_represa',1) && !S.flag('represa_ok'), faz:PZ().passoSequencia(COMP, q) }));
  R.obj('smergulus', 'placa_madeira', 145, 61, { interagir:true, investigar:'desenho_comportas', verbo:'🔍 LER', se:S=>S.comecou('c2_represa'),
    texto:['Riscado na placa, a carvão, com a letra do Pipoca: "abre a comporta DE BAIXO primeiro. depois a DE CIMA. a do meio por último. senão afoga tudo."'] });
  // pombo-correio (Ato III)
  R.obj('smergulus', 'pombo_correio', 96, 126, { interagir:true, investigar:'pombo', verbo:'🕊 PEGAR', se:S=>S.comecou('c2_pombo') && !S.flag('viu:pombo'), texto:['Você pega o pombo com cuidado. Ele cheira a pão de padaria. Na pata, um bilhete enrolado.'] });
  // fio de água (Ato IV): três poças entre o fosso e o cadeado
  const FIO={ id:'fio_agua', flag:'fio_ok', ordem:['p1','p2','p3'], ok:'O Tupas levanta a água da poça num fio fino. ', erro:'O fio de água arrebenta no meio. "Da beira do fosso PRA ponte, não ao contrário!" — começa de novo.',
    acerto:'Um fio de água contínuo sobe do fosso até o cadeado roxo, brilhando. Agora é com o Cargas.' };
  [['p1',82,60],['p2',84,59],['p3',86,58.6]].forEach(([q,x,y],i)=>R.obj('smergulus', 'brilho', x, y, { interagir:true, verbo:'💧 POÇA '+(i+1), se:S=>S.ativa('c2_ponte_final') && !S.flag('fio_ok'), faz:PZ().passoSequencia(FIO, q) }));
  // ursinho (secundária)
  R.obj('smergulus', 'ursinho', 126, 124, { interagir:true, pegar:'ursinho_rosa', verbo:'🧸 PEGAR', se:S=>S.flag('ato1') && !S.flag('pegou:ursinho_rosa'),
    texto:['Um ursinho de pelúcia cor-de-rosa, sentado sozinho no fim da rua. Cheiro de enxofre. Os olhos de botão parecem te seguir.'] });
  // boias do Tupas (secundária)
  [[60,128],[130,90],[110,126]].forEach(([x,y],i)=>R.obj('smergulus', 'boia', x, y, { interagir:true, pegar:'boia_'+(i+1), verbo:'🛟 PEGAR', se:S=>S.comecou('sec_boias') && !S.flag('pegou:boia_'+(i+1)), faz:[{ item:'+boia' }] }));
  R.item('boia_1', { nome:'Boia (1)', icone:'🛟' }); R.item('boia_2', { nome:'Boia (2)', icone:'🛟' }); R.item('boia_3', { nome:'Boia (3)', icone:'🛟' });
  // coxinhas (secundária)
  R.obj('cozinha_real', 'cesto_pao', 4, 6, { interagir:true, pegar:'coxinhas', verbo:'🍗 PEGAR', se:S=>S.comecou('sec_coxinha') && !S.flag('pegou:coxinhas'),
    texto:['Escondido atrás dos sacos da cozinha real: um cesto de coxinhas. Etiqueta: "EXCLUSIVO DO FAT. QUEM COMER VIRA POTINHO."'] });
  // Fat Smerg: rampa e estátua (secundária)
  R.obj('smergulus', 'brilho', 99, 64, { interagir:true, investigar:'rampa_fat', verbo:'🔍 OLHAR', se:S=>S.comecou('sec_um_fat'), texto:['A rampa exclusiva do Fat. No fim dela: um banquinho exclusivo. E uma placa: "VISTA EXCLUSIVA".'] });

  /* ================= MISSÕES — ATO I ================= */
  R.missao('c2_abertura', { cap:2, titulo:'A Coroa que Suga', requer:['c1_colosso_orfao'], resumo:'Muito antes de Tel Aviv, num reino de cinzas ao norte, um soldado comum não parava de treinar.',
    retorno:['smergulus', 28, 100],
    passos:[
      { tipo:'cena', obj:'Muito antes…', cenario:'reino', legenda:'CAPÍTULO 2 · A COROA QUE SUGA',
        cena:[ N('Enquanto o Mecas e os androides se preparam pra estrada do norte… é preciso voltar no tempo.', { cenario:'reino' }),
               N('SMERGULUS KINGDOM. MUITO ANTES DE TEL AVIV.'),
               N('No reino da rainha Smergula, todo soldado é igual: boné pra trás, camiseta cinza, medo da rainha. Centenas deles.'),
               SM('Nº 77! Toque de recolher foi faz duas horas! Volta pro alojamento!', 'SARGENTO SMERG'),
               SM('Só mais cem flexões, sargento.', 'SMERG Nº 77'),
               N('Nº 77 treinou aquela noite. E a seguinte. E todas as outras, por um ano inteiro.'),
               N('Até que, numa manhã, o boné não coube mais na cabeça. Nem a camiseta nos braços.') ],
        aoConcluir:[ { elenco:{ grupo:['strong_smerg'], lider:'strong_smerg' } }, { flag:'ato1' }, { ir:['smergulus', 28, 100, 0] },
          { fala:[ N('▶ Agora você controla o STRONG SMERG. O grupo do Mecas está guardado e volta mais tarde.'), N('Este é o reino. Explore à vontade: o Diário (J) mostra o objetivo.') ] } ] }
    ] });

  R.missao('c2_77', { cap:2, titulo:'Smerg Nº 77', requer:['c2_abertura'], resumo:'Os recrutas acham que o Nº 77 está se achando.', retorno:['smergulus', 28, 100],
    passos:[
      { tipo:'falar', obj:'Fale com o sargento do quartel', npc:'sargento', onde:'Quartel da Rainha (oeste)',
        cena:[ SM('Nº 77. Você não cabe mais no uniforme. Isso é contra o regulamento.', 'SARGENTO SMERG'), D('strong_smerg','O regulamento não treinou um ano inteiro.') ] },
      { tipo:'luta', obj:'Os recrutas querem "lembrar" o Nº 77', luta:'c2_recrutas', aoIniciar:[ { luta:'c2_recrutas' } ] }
    ], recompensa:{ arquivo:['p_fat'] } });

  R.missao('c2_academia', { cap:2, titulo:'Academia Nº 77', requer:['c2_77'], resumo:'Na academia do quartel tem um peso que ninguém nunca levantou.', retorno:['smergulus', 37, 87],
    passos:[
      { tipo:'puzzle', obj:'Levante os pesos, do leve ao que ninguém levanta', flag:'pesos_ok', local:['academia_77', 7, 6], onde:'Academia Nº 77 (quartel)',
        aoIniciar:[ { fala:[ N('🏋 Dentro da Academia: três pesos. Aquecimento primeiro, depois o pesado, por último O QUE NINGUÉM LEVANTA.') ] } ] }
    ], recompensa:{ bonusHp:5 } });

  R.missao('c2_orelha', { cap:2, titulo:'O Cachorro Orelha', requer:['c2_academia'], resumo:'Alguém roubou o pão da mesa da rainha. Os soldados querem sopa de orelha.', retorno:['smergulus', 80, 104],
    passos:[
      { tipo:'investigar', obj:'Siga as migalhas pela vila', objetos:['migalha_1','migalha_2','migalha_3'], onde:'Vila dos Smergs (praça e beco)',
        aoIniciar:[ { fala:[ SM('PEGA ESSE BICHO! É o pão da mesa da rainha!', 'SOLDADO SMERG'), N('Um cachorro magro, de orelhas maiores que a cabeça, sumiu na vila com um pão na boca.') ] } ] },
      { tipo:'falar', obj:'Ache o cachorro no beco', npc:'orelha_beco', onde:'Beco do Orelha',
        cena:[ N('Atrás da casinha torta: o cachorro, abanando o rabo, com um pão inteiro protegido debaixo da orelha.', { nome:'CACHORRO ORELHA' }) ] },
      { tipo:'luta', obj:'Os soldados chegaram', luta:'c2_pao', aoIniciar:[ { luta:'c2_pao' } ] }
    ], recompensa:{ grupo:'+orelha', arquivo:['p_orelha'], texto:'o Cachorro Orelha segue o Strong' } });

  R.missao('c2_trono', { cap:2, titulo:'A Maldição da Rainha', requer:['c2_orelha'], resumo:'O Strong foi chamado ao salão do trono. O Orelha vai junto. Péssima ideia.', retorno:['smergulus', 86, 52],
    passos:[
      { tipo:'ir', obj:'Vá ao salão do trono', alvo:['castelo_salao', 11, 12, 3], onde:'Castelo da Rainha (norte, depois da ponte levadiça)' },
      { tipo:'falar', obj:'Fale com a rainha', npc:'smergula_trono',
        cena:[ D('smergula','Então esse é o smerg que ficou forte demais. Ajoelha, Nº 77.'), D('strong_smerg','Strong, majestade. E eu não ajoelho.'),
               D('smergula','Eu ofereço um posto de general. Um exército seu. E você só precisa me dar… um pedacinho da sua alma.'),
               D('fat_smerg','É um bom negócio, Strong. Eu dei o meu pedacinho. Nunca mais passei fome.'),
               N('O Cachorro Orelha sobe na mesa do banquete e abocanha a coxa de frango do prato da rainha.', { nome:'CACHORRO ORELHA' }),
               D('smergula','…Esse bicho. De novo.', { pose:'special' }),
               D('smergula','Você quer comer na mesa como gente, cachorro? Então seja gente. METADE.', { pose:'special' }),
               N('Um véu preto cai sobre o cachorro. Ossos estalam. Orelhas encolhem. Ele fica de pé — sobre DUAS patas.') ],
        depoisFala:[ { grupo:'-orelha' }, { grupo:'+serrinha_dog' } ] },
      { tipo:'luta', obj:'Fuja dos guardas!', luta:'c2_maldicao', aoIniciar:[ { luta:'c2_maldicao' } ] }
    ], recompensa:{ arquivo:['p_smergula','p_serrinha'] } });

  R.missao('c2_fuga', { cap:2, titulo:'Fuga pelos Telhados', requer:['c2_trono'], resumo:'A guarda inteira atrás de vocês. O único lugar onde soldado não desce: o esgoto.', retorno:['smergulus', 86, 60],
    passos:[
      { tipo:'ir', obj:'Chegue na entrada do esgoto sem ser visto', alvo:['smergulus', 140, 112, 2.5], onde:'Entrada do Esgoto (sudeste da vila)',
        aoIniciar:[ { ir:['smergulus', 86, 62, 0] }, { fala:[ D('serrinha_dog','Eu tenho mão. Eu tenho DEDO. Olha isso.'), D('strong_smerg','Foca! A guarda tá na vila inteira!'),
                             N('👁 Guardas fazem ronda pela vila. Se um deles te VIR (o "!" em cima da cabeça), vira luta. Dá pra passar pelos becos.') ] } ],
        aoConcluir:[ { fala:[ D('strong_smerg','Se não é Orelha, é o quê?'), D('serrinha_dog','Ela me fez metade gente pra eu ser bicho de estimação dela. Errou. Agora eu sou metade gente com dente de cachorro.'),
                              D('serrinha_dog','Os dentes ficaram assim, ó. Feito uma serrinha.'), D('strong_smerg','Serrinha. …Serrinha Dog.'), D('serrinha_dog','Serrinha Dog. Gostei. Ninguém nunca me deu nome nenhum.') ] } ] }
    ] });

  R.missao('c2_agua', { cap:2, titulo:'Água Que Não Molha', requer:['c2_fuga'], resumo:'No esgoto do reino, um homem controla a água — e não chega perto dela.', retorno:['esgoto', 12, 14],
    passos:[
      { tipo:'luta', obj:'Fale com o homem do esgoto', npc:'tupas_esgoto', luta:'c2_tupas', onde:'Esgoto do Reino', cena:[ D('tupas','Soldado da rainha não entra no meu esgoto.') ] }
    ], recompensa:{ arquivo:['p_tupas'] } });

  R.missao('c2_pedagio', { cap:2, titulo:'Pedágio de Alma', requer:['c2_agua'], resumo:'Dois turistas de Limeira, a caminho de Tel Aviv, erraram a curva. Feio.', retorno:['smergulus', 86, 128],
    passos:[
      { tipo:'ir', obj:'Vá até a fronteira sul', alvo:['smergulus', 86, 129, 3], onde:'Fronteira Sul (a cancela do pedágio)',
        aoConcluir:[ { fala:[ D('matheus_limeira2','Mango. O GPS falou "vire à esquerda" faz duzentos quilômetros.'), D('fat_mango','Atalho, Mameluco. Confia. Tel Aviv é logo ali.'),
                              SM('PEDÁGIO DA RAINHA SMERGULA. UMA ALMA POR CARRO.', 'COBRADOR SMERG'), D('matheus_limeira2','Alma? O Astra TEM alma. Ninguém leva.') ] } ] },
      { tipo:'luta', obj:'Derrube a cancela do pedágio', luta:'c2_pedagio', aoIniciar:[ { luta:'c2_pedagio' } ],
        aoConcluir:[ { fala:[ D('tupas','Vocês tão indo pra onde?'), D('matheus_limeira2','Tel Aviv. Férias.'), D('tupas','Tel Aviv é pro sudeste. Vocês tão indo pro norte.'),
                              D('fat_mango','Eu sabia.'), D('matheus_limeira2','Você falou "atalho", Mango.'), N('O Astra dá meia-volta. Mil e duzentos quilômetros ainda pela frente.') ] } ] }
    ] });

  R.missao('c2_contrato', { cap:2, titulo:'Primeiro Contrato', requer:['c2_pedagio'], resumo:'Sem casa e sem dinheiro, Strong e Serrinha descobrem uma profissão no quadro da taverna.', retorno:['smergulus', 95, 114],
    passos:[
      { tipo:'ir', obj:'Leia o quadro da Taverna do Bonezinho', alvo:['smergulus', 99, 115, 2], onde:'Taverna do Bonezinho (vila)',
        aoConcluir:[ { fala:[ N('"PROCURA-SE: BANDO DO PÉ-DE-CABRA. ASSALTA A VILA TODA NOITE. RECOMPENSA: 30 MOEDAS."', { nome:'CARTAZ' }),
                              D('serrinha_dog','Trinta moedas pra bater em quem merece apanhar? Isso é trabalho?'), D('strong_smerg','Parece que é. E paga melhor que ser soldado.') ] } ] },
      { tipo:'luta', obj:'Ache o chefe do bando (leste da praça)', npc:'chefe_bando', luta:'c2_bando', cena:[ SM('Tá olhando o quê, grandão?', 'CHEFE DO BANDO') ] }
    ], recompensa:{ bonusHp:5 } });

  R.missao('c2_rapaz', { cap:2, titulo:'O Rapaz de Tel Aviv', requer:['c2_contrato'], resumo:'Algumas semanas depois, um forasteiro cacheado foi pedir um favor à rainha.', retorno:['esgoto', 12, 14],
    passos:[ { tipo:'luta', obj:'Um forasteiro no salão do trono', luta:'c2_rapaz', aoIniciar:[ { luta:'c2_rapaz' } ] } ],
    recompensa:{ arquivo:['p_careca'] } });

  R.missao('c2_justica', { cap:2, titulo:'Justiça Não Tem Preço', requer:['c2_rapaz'], resumo:'O próximo alvo dos caçadores está escondido atrás dos justiceiros do esgoto.', retorno:['esgoto', 12, 14],
    passos:[
      { tipo:'ir', obj:'Desça ao esgoto atrás do desertor', alvo:['esgoto', 12, 12, 3], onde:'Esgoto do Reino',
        aoIniciar:[ { fala:[ N('"PROCURA-SE: SMERG DESERTOR. ROUBOU PÃO DA COZINHA REAL. RECOMPENSA: 80 MOEDAS. ASS: A COROA."', { nome:'CARTAZ' }),
                             D('serrinha_dog','Oitenta moedas! E é pago pela rainha, Strong. Dinheiro dela no NOSSO bolso.') ] } ] },
      { tipo:'luta', obj:'Os justiceiros protegem o desertor', luta:'c2_justica', aoIniciar:[ { luta:'c2_justica' } ] }
    ] });

  R.missao('c2_cobrador', { cap:2, titulo:'O Cobrador da Rainha', requer:['c2_justica'], resumo:'O Fat Smerg veio cobrar o imposto de alma da vila. Pessoalmente.', retorno:['smergulus', 86, 104],
    passos:[
      { tipo:'luta', obj:'CHEFE: Fat Smerg na praça', npc:'fat_praca', luta:'c2_cobrador', onde:'Praça da Rainha', cena:[ D('fat_smerg','Imposto de alma! Um pedacinho por cabeça.') ] },
      { tipo:'cena', obj:'Um cartaz que muda tudo',
        fala:[ N('Um corvo pousa na praça com um cartaz amarrado na pata.'),
               N('"PROCURA-SE: CIBORGUE 5000Z. FUGIU DO LABORATÓRIO. TEL AVIV. PAGA-SE EM TEMPO. — M.B.JW"', { nome:'CARTAZ' }),
               D('serrinha_dog','Paga em TEMPO? Strong, a gente nunca viu um prêmio desse tamanho.'),
               D('careca','Esse rosto… no desenho… debaixo do metal… É o MECAS. É o meu amigo!', { pose:'special' }),
               D('careca','Eu não posso ir. Se eu cair longe do esgoto, eu volto minhoca no meio do caminho.', { pose:'hurt' }),
               D('strong_smerg','A gente vai. Caçar a lata. Ou… achar ela, sei lá.'),
               D('tupas','Alguém tem que ficar. A rainha não vai gostar do que aconteceu hoje.'),
               N('E foi assim que dois caçadores de recompensa foram parar em Tel Aviv.'), N('FIM DO ATO I.') ] }
    ], recompensa:{ bonusHp:5 } });

  /* ================= ATO II — ENQUANTO ISSO ================= */
  R.missao('c2_ato2', { cap:2, titulo:'Enquanto Isso, no Reino', requer:['c2_cobrador'], resumo:'Com os caçadores em Tel Aviv, o Tupas e o Careca seguram a vila sozinhos.', retorno:['esgoto', 12, 14],
    passos:[
      { tipo:'cena', obj:'Ato II', cenario:'reino', legenda:'ATO II · ENQUANTO ISSO',
        cena:[ N('ENQUANTO ISSO, NO REINO. A rainha mandou a resposta pra praça da vila: soldados com tochas.', { cenario:'reino' }) ],
        aoConcluir:[ { elenco:{ grupo:['tupas','careca'], lider:'tupas' } }, { flag:'ato2' }, { ir:['esgoto', 12, 14, 3] },
          { fala:[ N('▶ Agora você controla o TUPAS, com o Careca seguindo. (P / START troca entre os dois.)') ] } ] }
    ] });
  R.missao('c2_sozinho', { cap:2, titulo:'Sozinho no Reino', requer:['c2_ato2'], resumo:'Soldados com tocha na praça, cobrando em dobro de quem ajudou os caçadores.', retorno:['smergulus', 86, 104],
    passos:[ { tipo:'ir', obj:'Suba pra praça da vila', alvo:['smergulus', 86, 102, 4] }, { tipo:'luta', obj:'Os soldados das tochas', luta:'c2_sozinho', aoIniciar:[ { luta:'c2_sozinho' } ] } ],
    recompensa:{ arquivo:['p_pipoca'] } });
  R.missao('c2_pipoca', { cap:2, titulo:'O Desertor Pipoca', requer:['c2_sozinho'], resumo:'O Pipoca trocou de lado. Os ex-colegas dele não gostaram nada disso.', retorno:['esgoto', 12, 14],
    passos:[ { tipo:'investigar', obj:'Veja o mapa que o Pipoca desenhou (esconderijo)', objetos:['mapa_esgoto'], onde:'Esgoto — mesa do esconderijo' },
             { tipo:'luta', obj:'Lanceiros no túnel!', luta:'c2_pipoca', aoIniciar:[ { luta:'c2_pipoca' } ] } ] });
  R.missao('c2_volta', { cap:2, titulo:'A Volta dos Caçadores', requer:['c2_pipoca'], resumo:'Strong e Serrinha voltaram de Tel Aviv — sem prêmio nenhum. E a fronteira está fechada.', retorno:['smergulus', 86, 126],
    passos:[
      { tipo:'falar', obj:'Encontre os caçadores na fronteira', npc:'strong_fronteira', onde:'Fronteira Sul',
        cena:[ D('tupas','Voltaram cedo. Cadê o tempo que iam ganhar?'), D('strong_smerg','Contrato cancelado. O homem pagava com tempo roubado de outra gente.'),
               D('serrinha_dog','Lá em Tel Aviv tem um robô com cara de gente, um homem que vira raio e um sujeito que jura que é de lá. Não é.'),
               D('careca','O robô… ele tá bem?'), D('strong_smerg','Ele me deu uma surra. Tá ótimo.') ] },
      { tipo:'luta', obj:'"Ninguém entra."', luta:'c2_volta', aoIniciar:[ { luta:'c2_volta' } ] }
    ] });
  R.missao('c2_bones', { cap:2, titulo:'Rebelião dos Bonés', requer:['c2_volta'], resumo:'No pátio do quartel, um capitão chicoteia soldados com medo. O Pipoca não aguenta ver.', retorno:['smergulus', 28, 100],
    passos:[ { tipo:'ir', obj:'Vá ao pátio do quartel', alvo:['smergulus', 26, 100, 4] }, { tipo:'luta', obj:'Boné pra frente!', luta:'c2_bones', aoIniciar:[ { luta:'c2_bones' } ] },
             { tipo:'luta', obj:'CHEFE: o Capitão-Mor', luta:'c2_capitao', aoIniciar:[ { luta:'c2_capitao' } ] } ],
    recompensa:{ bonusHp:5 } });
  R.missao('c2_rachadura', { cap:2, titulo:'Rachadura no Céu', requer:['c2_bones'], resumo:'Uma fenda de gelo corta o céu do reino. Tudo que ela toca, congela. O homem do relógio chegou.', retorno:['smergulus', 86, 80],
    passos:[ { tipo:'ir', obj:'Vá até o campo do castelo, onde a rachadura caiu', alvo:['smergulus', 86, 74, 4] }, { tipo:'luta', obj:'Soldados congelados', luta:'c2_rachadura', aoIniciar:[ { luta:'c2_rachadura' } ] } ] });
  R.missao('c2_abrigo', { cap:2, titulo:'O Ladrão Pede Abrigo', requer:['c2_rachadura'], resumo:'Escondidos no salão do trono, os justiceiros assistem a um acordo terrível.', retorno:['castelo_salao', 11, 16],
    passos:[
      { tipo:'ir', obj:'Entre escondido no salão do trono', alvo:['castelo_salao', 11, 14, 3], onde:'Castelo da Rainha',
        aoConcluir:[ { fala:[ N('Atrás de uma coluna: Tupas, o Careca e o Pipoca, tremendo.'), N('No meio do salão, um homem de casaco branco, ajoelhado na frente do trono.') ] } ] },
      { tipo:'luta', obj:'Atchim!', luta:'c2_abrigo', aoIniciar:[ { luta:'c2_abrigo' } ] },
      { tipo:'luta', obj:'O Marcelão tenta fugir', luta:'c2_truque', aoIniciar:[ { luta:'c2_truque' } ] },
      { tipo:'luta', obj:'CHEFE: a Sombra da Rainha', luta:'c2_sombra', aoIniciar:[ { luta:'c2_sombra' } ] },
      { tipo:'cena', obj:'Fim do Ato II',
        fala:[ D('strong_smerg','Ela tem o tempo de uma cidade inteira agora. A gente não ganha isso sozinho.'), D('strong_smerg','Eu vou pra Tel Aviv. Eles derrubaram o Marcelão. Vão querer derrubar ela também.'),
               D('serrinha_dog','E eu?'), D('strong_smerg','Você fica. Se eu levar o único cachorro que já mordeu a rainha, quem defende o reino?'), D('serrinha_dog','…Volta logo, grandão.'),
               D('careca','Strong. Se você achar o Mecas… fala que o Careca ainda tem cabelo.'), N('FIM DO ATO II. (Em Tel Aviv, o Strong chega com a notícia.)') ] }
    ], recompensa:{ arquivo:['lore_morte_marcelao2'], bonusHp:5 } });

  /* ================= ATO III — O REINO PARADO ================= */
  R.missao('c2_ato3', { cap:2, titulo:'O Reino Parou', requer:['c2_abrigo'], resumo:'Com o tempo roubado, a rainha congelou as vilas. Só os soldados dela se mexem.', retorno:['esgoto', 12, 14],
    passos:[
      { tipo:'cena', obj:'Ato III', cenario:'reino', legenda:'ATO III · O REINO PARADO',
        cena:[ N('NA MANHÃ SEGUINTE. O céu do reino parou numa noite roxa. Todos os relógios: 03:33.', { cenario:'reino' }) ],
        aoConcluir:[ { elenco:{ grupo:['serrinha_dog','tupas'], lider:'serrinha_dog' } }, { flag:'ato3' }, { flag:'ponte_erguida' }, { flag:'castelo_fechado' }, { ir:['esgoto', 12, 14, 3] },
          { fala:[ N('▶ Agora você controla o SERRINHA DOG, com o Tupas. O Pipoca luta junto. O céu do reino travou em 03:33.') ] } ] },
      { tipo:'ir', obj:'Suba pra vila parada', alvo:['smergulus', 86, 102, 4] },
      { tipo:'luta', obj:'Os soldados com relógio no peito', luta:'c2_parou', aoIniciar:[ { luta:'c2_parou' } ] }
    ] });
  R.missao('c2_cao', { cap:2, titulo:'Os Caçadores de Cão', requer:['c2_ato3'], resumo:'A rainha quer o bichinho de estimação de volta. O bichinho cresceu.', retorno:['smergulus', 72, 118],
    passos:[
      { tipo:'investigar', obj:'Volte ao beco onde o Orelha dormia', objetos:['casinha_orelha'], onde:'Beco do Orelha (vila)',
        aoConcluir:[ { fala:[ D('serrinha_dog','Eu dormia aqui. Bem aqui. Antes de ter mão.'), N('O Tupas levanta uma lâmina de água, lisa como um espelho. No reflexo: um cachorro magro, de orelhas enormes.'), D('serrinha_dog','…Oi, Orelha.', { pose:'hurt' }) ] } ] },
      { tipo:'luta', obj:'"Com coleira."', luta:'c2_cao', aoIniciar:[ { luta:'c2_cao' } ] }
    ] });
  R.missao('c2_represa', { cap:2, titulo:'Represa', requer:['c2_cao'], resumo:'A rainha fechou o rio pra afogar o esgoto. As comportas da represa precisam abrir — na ordem certa.', retorno:['smergulus', 146, 62],
    passos:[
      { tipo:'investigar', obj:'Leia o desenho do Pipoca na placa da represa', objetos:['desenho_comportas'], onde:'Represa (rio, leste)' },
      { tipo:'puzzle', obj:'Abra as três comportas na ordem do desenho', flag:'represa_ok', local:['smergulus', 147, 57] },
      { tipo:'luta', obj:'A guarda da represa', luta:'c2_represa', aoIniciar:[ { luta:'c2_represa' } ] }
    ], recompensa:{ bonusHp:5 } });
  R.missao('c2_mercado', { cap:2, titulo:'O Mercado de Almas', requer:['c2_represa'], resumo:'Na praça, comida se paga com pedaço de alma. Os potinhos vão pro castelo.', retorno:['smergulus', 86, 104],
    passos:[
      { tipo:'investigar', obj:'Quebre os potinhos de alma do mercado', objetos:['potinho_1','potinho_2','potinho_3','potinho_4','potinho_5'], onde:'Praça da Rainha (barracas)',
        aoIniciar:[ { fala:[ SM('Minha mãe comprava aqui. Toda semana ela voltava um pouco mais cansada. Eu achava que era a idade.', 'PIPOCA', { forma:1 }) ] } ] },
      { tipo:'luta', obj:'O fiscal da rainha', luta:'c2_mercado', aoIniciar:[ { luta:'c2_mercado' } ] },
      { tipo:'luta', obj:'CHEFE: o Smerg do Relógio Mestre', luta:'c2_relogio_mestre', aoIniciar:[ { luta:'c2_relogio_mestre' } ] }
    ], recompensa:{ arquivo:['lore_almas'], bonusHp:5 } });
  R.missao('c2_pombo', { cap:2, titulo:'Recado de Tel Aviv', requer:['c2_mercado'], resumo:'Um pombo-correio atravessou a fronteira. Os soldados querem ele assado.', retorno:['smergulus', 90, 126],
    passos:[ { tipo:'investigar', obj:'Pegue o pombo antes dos guardas', objetos:['pombo'], onde:'Fronteira Sul' }, { tipo:'luta', obj:'A guarda real da fronteira', luta:'c2_pombo', aoIniciar:[ { luta:'c2_pombo' } ] } ] });
  R.missao('c2_jantar', { cap:2, titulo:'O Jantar do Fat Smerg', requer:['c2_pombo'], resumo:'O castelo fechou. Mas o esgoto tem uma passagem pra cozinha real.', retorno:['esgoto', 12, 14],
    passos:[
      { tipo:'ir', obj:'Use a passagem secreta do esgoto pra cozinha real', alvo:['cozinha_real', 7, 7, 3], onde:'Esgoto — porta no fundo à esquerda',
        aoIniciar:[ { flag:'passagem_secreta' }, { fala:[ D('tupas','A água sempre acha um caminho. Esse aqui dá na cozinha do castelo. Fundo do esgoto, à esquerda.') ] } ] },
      { tipo:'luta', obj:'O Fat janta sozinho', luta:'c2_jantar', aoIniciar:[ { luta:'c2_jantar' } ] },
      { tipo:'luta', obj:'A guarda do trono nos corredores', luta:'c2_desperta', aoIniciar:[ { luta:'c2_desperta' } ] }
    ] });
  R.missao('c2_general', { cap:2, titulo:'General Smergão', requer:['c2_jantar'], resumo:'O general da rainha junta três mil bonés no campo pra fechar o reino de vez.', retorno:['smergulus', 86, 78],
    passos:[
      { tipo:'ir', obj:'Vá ao campo em frente ao castelo', alvo:['smergulus', 86, 72, 4] },
      { tipo:'luta', obj:'CHEFE: General Smergão', luta:'c2_general', aoIniciar:[ { luta:'c2_general' } ] },
      { tipo:'cena', obj:'Fim do Ato III', cenario:'campo', legenda:'ATO IV · ÀS VÉSPERAS DA GUERRA',
        cena:[ N('FIM DO ATO III.', { cenario:'campo' }), N('Do outro lado do mapa, em Tel Aviv, um Astra prata liga o motor. Androides em fila. A Estrada do Norte, aberta.', { cenario:'telaviv' }),
               D('strong_smerg','Eu prometi que voltava. Segura aí, Serrinha.') ],
        aoConcluir:[ { restaurarElenco:true }, { flag:'ato4' }, { flag:'fronteira_aberta' }, { ir:['telaviv', 65, 6, 3] },
          { fala:[ N('▶ De volta ao grupo do MECAS. A fronteira do reino abriu: pegue a Estrada do Norte (saída no alto da Rua do Mercado) e atravesse as Estradas do Mundo até o Smergulus Kingdom. O Astra anda na estrada de terra!') ] } ] }
    ] });

  /* ================= ATO IV — ÀS VÉSPERAS DA GUERRA ================= */
  R.missao('c2_chegada', { cap:2, titulo:'A Chegada', requer:['c2_general'], resumo:'Tel Aviv vai ao reino. Atravesse as Estradas do Mundo até o campo em frente ao castelo.', retorno:['smergulus', 86, 80],
    passos:[
      { tipo:'ir', obj:'Atravesse as Estradas do Mundo até o reino', alvo:['estradas', 30, 4, 4], onde:'Estradas do Mundo (saída norte de Tel Aviv)' },
      { tipo:'ir', obj:'Chegue ao campo em frente ao castelo', alvo:['smergulus', 86, 74, 4], onde:'Smergulus Kingdom — campo do castelo' },
      { tipo:'cena', obj:'Reencontro',
        fala:[ D('serrinha_dog','Demorou, grandão.'), D('strong_smerg','Segurou?'), D('serrinha_dog','Segurei. O Tupas segurou um RIO.'),
               D('mecas','Então você é o Tupas. Dizem que você domina a água e não sabe nadar.'), D('tupas','Quem diz isso fala demais.'),
               N('E então, do meio dos rebeldes, um rapaz de cabelo cacheado com um esfregão.'), D('careca','…Mecas?'), D('mecas','…', { pose:'hurt' }),
               D('careca','Você não lembra de mim. Tudo bem. Eu lembro pelos dois. Eu sou o Careca.'), D('mecas','Careca. Você tem cabelo.'),
               D('careca','É. Você também nunca entendeu o apelido.'), D('mecas','…O rodo. Na sua casa, em Tel Aviv. O suporte vazio.'), D('careca','Você foi na minha casa?!'), D('mecas','Eu fui atrás de você. Igual você veio atrás de mim.') ],
        aoConcluir:[ { grupo:'+serrinha_dog' }, { grupo:'+tupas' }, { grupo:'+careca' } ] },
      { tipo:'luta', obj:'O primeiro choque da guerra', luta:'c2_chegada', aoIniciar:[ { luta:'c2_chegada' } ] },
      { tipo:'luta', obj:'Metal contra boné', luta:'c2_metal', aoIniciar:[ { luta:'c2_metal' } ] }
    ], recompensa:{ bonusHp:5, texto:'Serrinha, Tupas e o Careca entram no grupo' } });
  R.missao('c2_caravana', { cap:2, titulo:'A Caravana de Limeira', requer:['c2_chegada'], resumo:'Um Corsa cheio de pão entrou na guerra. Limeira veio junto.', retorno:['smergulus', 86, 80],
    passos:[ { tipo:'luta', obj:'O Corsa chega buzinando', luta:'c2_caravana', aoIniciar:[ { luta:'c2_caravana' } ] } ],
    recompensa:{ grupo:'+'+L } });
  R.missao('c2_mesa', { cap:2, titulo:'Mesa de Negociação', requer:['c2_caravana'], resumo:'Antes do ataque, cada lado diz o que quer. As alianças são frágeis.', retorno:['smergulus', 88, 76],
    passos:[
      { tipo:'falar', obj:'Ouça o Cargas (Tel Aviv)', npc:'cargas_campo' }, { tipo:'falar', obj:'Ouça o Strong (caçadores)', npc:'strong_campo' },
      { tipo:'falar', obj:'Ouça o Tupas (justiceiros)', npc:'tupas_campo' }, { tipo:'falar', obj:'Ouça o Lambança (Limeira)', npc:'lambanca_campo' },
      { tipo:'cena', obj:'O plano',
        fala:[ D('mecas','Tel Aviv quer o tempo. Os caçadores querem… não sei o que vocês querem.'), D('strong_smerg','A gente também não. Tem um envelope roxo no nosso bolso que a gente não abriu.'),
               D('cargas','Envelope roxo?'), D('serrinha_dog','Esquece. Coisa de família.'), D('tupas','A ponte levadiça está erguida com um cadeado roxo. Tem que estourar ele.'),
               D('cargas','Eu estouro qualquer coisa. Só preciso chegar perto.'), D('tupas','Água conduz eletricidade. Eu faço o caminho.') ] }
    ] });
  R.missao('c2_ponte_final', { cap:2, titulo:'Raio e Água', requer:['c2_mesa'], resumo:'Pra estourar o cadeado da ponte, o Cargas precisa de um condutor. O Tupas é feito de água (quase).', retorno:['smergulus', 84, 62],
    passos:[
      { tipo:'puzzle', obj:'Faça o fio d\'água: poças 1, 2 e 3, da beira do fosso até a ponte', flag:'fio_ok', local:['smergulus', 84, 60], onde:'Beira do fosso, na frente da ponte levadiça' },
      { tipo:'luta', obj:'A guarda do trono na ponte', luta:'c2_raio_agua', aoIniciar:[ { luta:'c2_raio_agua' } ],
        aoConcluir:[ { flag:'ponte_erguida', v:false }, { flag:'castelo_fechado', v:false } ] }
    ], recompensa:{ bonusHp:5 } });
  R.missao('c2_escada', { cap:2, titulo:'Escada pro Trono', requer:['c2_ponte_final'], resumo:'O Careca sobe a escada da rainha. Cada degrau, uma lembrança da maldição.', retorno:['castelo_salao', 11, 16],
    passos:[ { tipo:'ir', obj:'Entre no castelo', alvo:['castelo_salao', 11, 14, 3], onde:'Castelo da Rainha' },
             { tipo:'luta', obj:'A escadaria', luta:'c2_escada', aoIniciar:[ { luta:'c2_escada' } ] },
             { tipo:'luta', obj:'CHEFE: Fat Smerg, o Único', luta:'c2_fat_unico', aoIniciar:[ { luta:'c2_fat_unico' } ] } ],
    recompensa:{ bonusHp:5 } });
  R.missao('c2_torre', { cap:2, titulo:'Relógio de Almas', requer:['c2_escada'], resumo:'No alto da torre, o relógio que guarda o tempo de Tel Aviv e as almas do reino.', retorno:['castelo_salao', 11, 16],
    passos:[ { tipo:'ir', obj:'Suba a escada da torre (fundo do salão)', alvo:['torre_almas', 6, 9, 3], onde:'Salão do Trono → escada no fundo à direita' },
             { tipo:'luta', obj:'O Guardião do Relógio', luta:'c2_relogio_almas', aoIniciar:[ { luta:'c2_relogio_almas' } ] },
             { tipo:'luta', obj:'Bonés pra frente (lá embaixo, no pátio)', luta:'c2_bones_frente', aoIniciar:[ { luta:'c2_bones_frente' } ] } ] });
  R.missao('c2_rainha', { cap:2, titulo:'Rainha Smergula', requer:['c2_torre'], resumo:'No salão do trono, a rainha sozinha — com almas e tempo de sobra.', retorno:['castelo_salao', 11, 16],
    passos:[
      { tipo:'ir', obj:'Volte ao salão do trono', alvo:['castelo_salao', 11, 8, 3] },
      { tipo:'luta', obj:'CHEFE FINAL DO CAPÍTULO: Rainha Smergula', luta:'c2_rainha', aoIniciar:[ { luta:'c2_rainha' } ] }
    ], recompensa:{ flag:['cap2_fim'], arquivo:['lore_guerra'], bonusHp:5, texto:'FIM DO CAPÍTULO 2 — a Guerra de Todos começou' } });

  /* ================= SECUNDÁRIAS DO REINO ================= */
  R.missao('sec_smergulao', { cap:2, tipo:'secundaria', titulo:'Procura-se: Smergulão', doador:'veterano', requer:['c2_77'],
    resumo:'Cartazes pelo reino inteiro procuram um smerg GRANDE. O campo CRIME está sempre riscado.',
    oferta:[ P('cidadao:17','VELHO SOLDADO','Viu os cartazes? Procurado há anos. Ninguém fala o crime. Ninguém PODE falar.'), P('cidadao:17','VELHO SOLDADO','Se quiser saber mais, lê os cartazes. E dizem que o Arquivo Real guarda a ficha dele.') ],
    passos:[
      { tipo:'investigar', obj:'Leia os 3 cartazes do Smergulão', objetos:['smergulao_1','smergulao_2','smergulao_3'], onde:'Vila e quartel' },
      { tipo:'falar', obj:'Pergunte pro velho soldado', npc:'veterano' },
      { tipo:'investigar', obj:'Leia a ficha no Arquivo Real (castelo)', objetos:['ficha_smergulao'], onde:'Castelo → porta leste do salão (Arquivo Real, a partir do Ato II)' }
    ], recompensa:{ arquivo:['lore_smergulao'] } });
  R.missao('sec_escrivao', { cap:2, tipo:'secundaria', titulo:'O Escrivão Desmaiado', doador:'escrivao', requer:S=>S.flag('ato2'),
    resumo:'O escrivão real tentou escrever o crime do Smergulão. Desmaiou. Toda vez que alguém pergunta, desmaia de novo.',
    oferta:[ P('smerg_normal','ESCRIVÃO REAL','Pergunte o que quiser. Menos AQUELA pergunta. Promete?') ],
    passos:[
      { tipo:'falar', obj:'Pergunte qual foi o crime do Smergulão', npc:'escrivao',
        cena:[ D('tupas','Qual foi o crime do Smergulão?'), P('smerg_normal','ESCRIVÃO REAL','O crime foi… foi… ██'), N('Ele desmaia em cima da pilha de papel. A pena cai da mão dele.'),
               N('…Um minuto depois, ele acorda, olha pra você e desmaia de novo, por precaução.') ], depoisFala:[ { item:'+pena_escrivao' } ] }
    ], recompensa:{ arquivo:['lore_pena'] } });
  R.missao('sec_um_fat', { cap:2, tipo:'secundaria', titulo:'Só Existe Um Fat', doador:'dieta_1', requer:S=>S.flag('ato2'),
    resumo:'Decreto Real Nº 1: só pode existir UM smerg gordo. O resto do reino está de dieta.',
    oferta:[ { quem:'smerg_normal', nome:'SOLDADO DE DIETA', texto:'Você já viu a RAMPA EXCLUSIVA dele? Vai lá ver. Eu não posso nem olhar. Engorda.' } ],
    passos:[ { tipo:'investigar', obj:'Veja a rampa exclusiva do Fat (campo do castelo)', objetos:['rampa_fat'] } ],
    recompensa:{ arquivo:['lore_um_fat'] } });
  R.missao('sec_coxinha', { cap:2, tipo:'secundaria', titulo:'Contrabando de Coxinha', requer:['sec_um_fat'], auto:true,
    resumo:'Os soldados de dieta sonham com coxinha. A cozinha real tem um cesto escondido. O fiscal do Fat vigia o quartel.',
    passos:[
      { tipo:'item', obj:'Pegue as coxinhas na Cozinha Real', item:'coxinhas', onde:'Cozinha Real (pelo castelo ou pela passagem do esgoto)' },
      { tipo:'falar', obj:'Entregue pro soldado de dieta (sem ser visto pelo fiscal!)', npc:'dieta_1',
        cena:[ { quem:'smerg_normal', nome:'SOLDADO DE DIETA', texto:'É… É COXINHA. Ilegal. Quente. Esconde, esconde!' }, N('Três soldados comem em silêncio, com o boné cobrindo a cara. Um deles chora um pouquinho.') ],
        depoisFala:[ { item:'-coxinhas' } ] }
    ], recompensa:{ bonusHp:5 } });
  R.missao('sec_boias', { cap:2, tipo:'secundaria', titulo:'Salva-Vidas do Salva-Vidas', doador:'tupas_esgoto', requer:['c2_agua'],
    resumo:'O Tupas manda na água mas não sabe nadar. Ele quer boias. Pra garantir.',
    oferta:[ D('tupas','Não é medo. É… prevenção. Tem três boias perdidas pela vila. Traz pra mim? Não conta pro Careca.') ],
    passos:[ { tipo:'item', obj:'Ache as três boias pela vila', item:['boia_1','boia_2','boia_3'], onde:'Vila dos Smergs' },
             { tipo:'falar', obj:'Leve as boias pro Tupas', npc:'tupas_esgoto', cena:[ D('tupas','Três boias. Agora eu posso cair no canal com dignidade.'), D('tupas','…Eu não vou cair. Mas se cair.') ] } ],
    recompensa:{ bonusHp:5 } });
  R.missao('sec_ursinho', { cap:2, tipo:'secundaria', titulo:'Achados e Perdidos', requer:['c2_77'], auto:true,
    resumo:'Um ursinho cor-de-rosa com cheiro de enxofre apareceu no fim da rua da vila. Ninguém chega perto.',
    passos:[ { tipo:'item', obj:'Pegue o ursinho (fim da rua, sudeste da vila)', item:'ursinho_rosa' },
             { tipo:'falar', obj:'Pergunte pra Dona Smerga', npc:'mae_pipoca' } ],
    recompensa:{ arquivo:['lore_ursinho'] } });
  R.missao('sec_coral', { cap:2, tipo:'secundaria', titulo:'Coral do Vulcão', doador:'coral_1', requer:['c2_77'],
    resumo:'Três soldados cantam pro vulcão grande não explodir. Desafinados. Funciona.',
    oferta:[ { quem:'smerg_normal', nome:'CORAL DO VULCÃO', texto:'Falta uma voz no coral. Ouve os outros dois e diz se a gente tá afinado. (Não tá.)' } ],
    passos:[ { tipo:'falar', obj:'Ouça o barítono', npc:'coral_2' }, { tipo:'falar', obj:'Ouça o terceiro', npc:'coral_3' },
             { tipo:'falar', obj:'Dê sua opinião ao coral', npc:'coral_1', cena:[ { quem:'smerg_normal', nome:'CORAL DO VULCÃO', texto:'Desafinado? ÓTIMO. O vulcão gosta assim. Afinado ele acorda.' } ] } ],
    recompensa:{ arquivo:['lore_coral'] } });
  R.missao('sec_casinha', { cap:2, tipo:'secundaria', titulo:'A Casinha do Orelha', requer:['c2_cao'], auto:true,
    resumo:'Uma casinha de cachorro com a placa "ORELHA". O Serrinha para em frente e fica olhando.',
    passos:[ { tipo:'ir', obj:'Leve o Serrinha até a casinha do beco', alvo:['smergulus', 72, 123, 1.8],
      aoConcluir:[ { fala:[ N('O Serrinha para na frente da casinha. Não fala nada. Fica olhando a placa por um tempo comprido.'), N('Depois ajeita o pano velho lá dentro, com cuidado. E vai embora sem olhar pra trás.') ] } ] } ],
    recompensa:{ arquivo:['p_orelha'] } });

  R.arquivo('lore_minhoca', { cat:'lore', titulo:'Minhoca de Estimação', texto:'A maldição do Careca: cada vez que ele cai, volta minhoca. Ele guarda um pote de terra fofa no esgoto "pra emergências". E um rodo novo, com um C na parede, esperando o dono do rodo velho voltar.' });
  R.arquivo('lore_almas_trono', { cat:'lore', titulo:'Almas no Trono', texto:'No teto do salão do trono, as almas cobradas sobem e ficam rodando. Uma delas é diferente: azul, com um tique-taque. Toda vez que ela passa pelo relógio da parede, os ponteiros param em 03:33.' });
  R.obj('esgoto', 'vaso_flor', 9, 9, { interagir:true, investigar:'pote_minhoca', verbo:'🔍 OLHAR', se:S=>S.comecou('sec_minhoca'),
    texto:['Um pote de terra fofa e úmida, com uma etiqueta: "PRA EMERGÊNCIAS — C."','Dentro, alguém fez um caminhozinho com palitos. Do tamanho exato de uma minhoca.'] });
  R.obj('smergulus', 'placa_madeira', 24, 92, { interagir:true, investigar:'quadro_promocao', verbo:'📋 LER', se:S=>S.comecou('sec_pipoca'),
    texto:['QUADRO DE PROMOÇÕES DO QUARTEL: "PROMOVIDOS ESTE ANO: NINGUÉM."','"PRÓXIMA PROMOÇÃO: QUANDO A RAINHA QUISER." Embaixo, a lápis, a letra do Pipoca: "nº 312 se candidata. por favor."'] });
  R.obj('castelo_salao', 'alma', 15, 6, { interagir:true, semCol:true, investigar:'alma_0333', verbo:'👻 OLHAR', se:S=>S.comecou('sec_almas'),
    texto:['Uma alma azul, diferente das outras, girando perto do relógio da parede. Faz tique. Faz taque.','Quando ela passa, os ponteiros do relógio param: 03:33. Depois que ela vai embora, voltam a andar.'] });

  R.missao('sec_minhoca', { cap:2, tipo:'secundaria', titulo:'Minhoca de Estimação', requer:['c2_rapaz'], auto:true,
    resumo:'O Careca não fala da maldição. Mas o esconderijo do esgoto fala por ele.',
    passos:[ { tipo:'investigar', obj:'Procure pistas do Careca no esconderijo do esgoto', objetos:['rodo_esgoto','pote_minhoca'], onde:'Esgoto do Reino',
      aoConcluir:[ { fala:[ D('careca','…Tá. O pote é meu. Se eu cair longe da terra, eu fico me debatendo na pedra. Não é bonito.'), D('careca','E o rodo é novo. O velho ficou em Tel Aviv. Com o dono dele.'), D('tupas','Ninguém aqui vai contar pra ninguém.') ] } ] } ],
    recompensa:{ arquivo:['lore_minhoca'] } });
  R.missao('sec_pipoca', { cap:2, tipo:'secundaria', titulo:'Soldado Pipoca', doador:'pipoca', requer:['c2_pipoca'],
    resumo:'O Pipoca desertou, mas ainda sonha em ser promovido. De qualquer coisa. Por qualquer um.',
    oferta:[ { quem:'smerg_normal', nome:'PIPOCA', texto:'Eu sempre quis ser promovido. Cabo, sargento, qualquer coisa. Dá uma olhada no quadro do quartel pra mim? Eu não posso aparecer lá. Eu desertei.' } ],
    passos:[ { tipo:'investigar', obj:'Leia o quadro de promoções do quartel', objetos:['quadro_promocao'], onde:'Quartel da Rainha (oeste)' },
             { tipo:'falar', obj:'Dê a notícia pro Pipoca', npc:'pipoca',
               cena:[ { quem:'smerg_normal', nome:'PIPOCA', texto:'"Promovidos: ninguém." É. Já imaginava.' }, D('tupas','No meu esgoto o quadro é outro. Pipoca, nº 312: promovido a CABO DO ESGOTO.'),
                      { quem:'smerg_normal', nome:'CABO PIPOCA', texto:'CABO?! Eu?! …Isso tem salário?' }, D('tupas','Tem sopa.'), { quem:'smerg_normal', nome:'CABO PIPOCA', texto:'ACEITO.', pose:'win' } ] } ],
    recompensa:{ bonusHp:5 } });
  R.missao('sec_almas', { cap:2, tipo:'secundaria', titulo:'Almas no Trono', requer:['c2_abrigo'], auto:true,
    resumo:'Depois daquela noite, uma alma azul ficou rodando no salão do trono. Os relógios do castelo param quando ela passa.',
    passos:[ { tipo:'investigar', obj:'Observe a alma azul no salão do trono', objetos:['alma_0333'], onde:'Castelo da Rainha — salão do trono' } ],
    recompensa:{ arquivo:['lore_almas_trono'] } });

  R.migracaoMais([ { cap:'smergulus', fases:10, ate:'c2_cobrador' }, { cap:'smergulus', fases:20, ate:'c2_abrigo' }, { cap:'smergulus', fases:30, ate:'c2_general' }, { cap:'smergulus', fases:40, ate:'c2_rainha' } ]);
})();
