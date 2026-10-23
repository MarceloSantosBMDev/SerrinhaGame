/* ============================================================
   PATCH NOTES — histórico do que mudou no jogo, versão por versão.
   Cada vez que uma mudança pedida pelo dono do jogo é aplicada,
   sobe a versão (VERSAO_ATUAL) e entra uma entrada NOVA no topo do
   array HISTORICO. Nunca edite uma entrada antiga — ela é o
   registro do que aquela versão mudou.
   ============================================================ */
const PatchNotes = (function(){

  const VERSAO_ATUAL = '1.48';

  const HISTORICO = [
    { versao:'1.48', data:'2026-10-23', titulo:'MODO HISTÓRIA MAIS DIFÍCIL ⚔🔥',
      itens:[
        'As lutas do mundo aberto estavam fáceis demais: depois do balanceamento da 1.47 e com o bônus de vida da história '+
          '(até +40), quase todas — inclusive Marcelão, Colosso, Capitão-Mor e Fat Smerg — eram vitória garantida.',
        'Os inimigos da história agora jogam com a IA ESPERTA (a mesma da ⚖ Condenação): miram em quem está fraco, curam '+
          'na hora certa e escolhem o golpe que rende mais.',
        'Cada luta da história foi recalibrada uma por uma (vida e dano do lado inimigo), simulando milhares de lutas com o '+
          'grupo e o bônus que você tem naquele ponto. Patrulha de rua continua tranquila; luta comum pede atenção; rival, '+
          'Procura-se e chefe pedem estratégia; final de capítulo é a mais dura.',
        'Duas lutas que eram um muro ficaram mais justas: Caçadores na Cidade (Strong + Serrinha) e A Rainha Cobra a Conta.',
        'A ⚖ Condenação não muda.'
      ] },
    { versao:'1.47', data:'2026-10-23', titulo:'PATCH DE BALANCEAMENTO + REWORK DO CARECA 🧹💀',
      itens:[
        'REWORK DO CARECA: agora ele é um kamikaze de esfregão. Quase todo golpe do humano COBRA A PRÓPRIA VIDA e cada '+
          'ponto pago vira dano — e pode MATAR ele, que é o que ele quer: quando cai, volta como VERME na rodada seguinte.',
        'Golpes novos do Careca: 🧹 ESFREGADA RAIVOSA (paga 8 de vida, sem recarga) · 🪠 Estocada do Cabo (a única que não '+
          'cobra vida) · 🫧 Chão Ensaboado · 💀 PANCADA KAMIKAZE (paga 35% da vida que tem agora numa pancada enorme) · '+
          'ULTIMATE 🪱 ENTREGA À MALDIÇÃO (gasta TODA a vida num estouro no time inimigo inteiro e cai na hora pra voltar verme).',
        'O VERME ficou mais parrudo (96 de vida, era 65) e a ultimate dele continua sendo o Véu Maldito. As sprites do Careca '+
          'foram refeitas do zero: sem os pedaços de xadrez grudados e com a camiseta que sumia de alguns quadros de volta.',
        'CORRIGIDO: veneno e sangramento EMPILHAVAM sem limite — repetir a Mordida no mesmo alvo somava um sangramento novo '+
          'por cima do outro. Agora o MESMO golpe do MESMO atacante RENOVA o efeito. Efeitos de atacantes diferentes continuam somando.',
        'O BOT FICOU ESPERTO: o computador agora joga cada personagem com uma ESTRATÉGIA própria, achada por simulação '+
          '(antes ele gastava turno em golpes de preparação que rendiam menos que simplesmente bater). Vale pra luta contra '+
          'o computador, pro Modo Sobrevivência e pra ⚖ Condenação.',
        'BALANCEAMENTO: com todo mundo jogando bem, o elenco ia de 39% (Tupas) a 72% (Marcelão) de vitória. Depois de '+
          '60.000 batalhas por rodada de ajuste, TODO MUNDO ficou entre 49% e 51%. E a busca de estratégias rodou de novo '+
          'no jogo ajustado: ninguém mais acha uma estratégia que quebre o equilíbrio.',
        'MAIS FRACOS: Marcelão (Soco de Bolso 38→27, Furto de Tempo 36→26, Moeda Fatal 29→21) · Fat Girl (golpes −18%) · '+
          'Criança Rosa (golpes e curas −22%) · Fat Mango (golpes e curas −17%) · Mameluco (Trombada 29→23, Atropelamento '+
          '23→18, Pisando Fundo +6→+4 de velocidade, Provocação Geral +7→+4 de defesa) · Adulto Feliz (−12%) · Smergula (−4%) · Careca.',
        'MAIS FORTES: Tupas (golpes +29%) · Dmaterelizador (+28%, ultimate 70→90) · Cabelin (golpes e curas +35% e vida '+
          '164→173; a Muralha de Lasanha continua 30/50) · Strong Smerg (+20%) · Cargas (+20%) · Prodocimo (+16%) · Mecas '+
          '(+15%) · Smergulão (+14%) · Loirinha (golpes e curas +11%) · Serrinha, Fat Smerg, Mano Coxinha e Lambança (+2 a +5%).',
        'A tabela de vitórias do bot da ⚖ Condenação foi refeita.'
      ] },
    { versao:'1.46', data:'2026-10-23', titulo:'Prodocimo sem o Sumiço, Dmaterelizador sem a Fase Fantasma',
      itens:[
        'REMOVIDO: o 👻 SUMIÇO da PRODOCIMO (deixava um vulto e o próximo golpe nela errava). Ela fica com Finta, '+
          'Mão Leve, Fofoca e a ultimate Aperto de Mão Revelador.',
        'REMOVIDO: a 👾 FASE FANTASMA do DMATERELIZADOR (sumia do campo até o próximo turno). Ele fica com Toque '+
          'Desmaterializador, Portal, Desmaterializar e a ultimate Desmaterialização Total.',
        'Os dois ficaram até um pouco MAIS fortes sem esses golpes (era um turno inteiro sem dano): Prodocimo 52,5% e '+
          'Dmaterelizador 52,3% de vitória, medido em 60.000 batalhas simuladas. O elenco inteiro ficou entre 46,8% e 52,5%.',
        'A tabela de vitórias do bot da ⚖ Condenação foi refeita.'
      ] },
    { versao:'1.45', data:'2026-10-23', titulo:'BATALHAS DE CARA NOVA: cada golpe com a animação do nome dele 🎬',
      itens:[
        'TODO GOLPE do elenco ganhou uma animação PRÓPRIA, que combina com o nome: a Pancada de Pão bate com um pão de '+
          'verdade, o Croissant Bumerangue vai, passa pelo time inteiro e VOLTA pra mão do Fat Mango, a Bolsada joga a '+
          'bolsa, o Arsenal joga a granada no meio do time, a Moeda Fatal quica de inimigo em inimigo, a Mordida fecha os '+
          'dentes no alvo, o Rifle de Pulso atira um feixe, os Punhos 5000Z voam como punhos de energia, a Fofoca manda '+
          'balões de fala, o Furto de Tempo rouba o relógio do alvo, o Molho Fervendo é uma onda de molho... e por aí vai.',
        'O ASTRA entra em cena: na Trombada de Astra e no Atropelamento o Matheus Limeira vira o carro e passa por cima '+
          'do alvo; no Pisando Fundo o Astra cruza o palco.',
        'O CORSA BLINDADO agora é um CORSA de verdade: ele chega dirigindo de fora da arena, freia na frente do time e '+
          'abre a porta. O Escudo Temporal do Marcelão sobe do chão.',
        'MOVIMENTOS NOVOS: a Voadora da Alegria e a Voadora de Hambúrguer saltam alto; o Rolamento rola de verdade; o '+
          'Chute Giratório gira; o Golpe Traiçoeiro, o Passo nas Sombras e a Investida Relâmpago SOMEM e aparecem nas '+
          'costas do alvo; a Correnteza e a Entrega Relâmpago atravessam o inimigo; o COLAPSO do Fat Smerg pula pra '+
          'fora da tela e cai em cima do time inimigo.',
        'Golpes que varrem o time inteiro (croissant, moeda, onda, rachadura do Terremoto) agora acertam cada um na hora '+
          'em que passam por ele, em vez de todo mundo de uma vez.',
        'ACABAMENTO: placa com o nome do golpe, onomatopeias de quadrinho ("POW!", "CRUNCH!", "VRUUM!"), linhas de anime '+
          'fechando em quem solta a ultimate, quadro de impacto (a tela pisca em negativo) nas pancadas mais pesadas e '+
          'uma cortina de entrada quando a luta começa.',
        'Só a aparência mudou: nenhum dano, efeito ou regra de golpe foi alterado.'
      ] },
    { versao:'1.44', data:'2026-10-22', titulo:'Correção: a MÃO LEVE da Prodocimo agora rouba de verdade',
      itens:[
        'CORRIGIDO: a 🫳 MÃO LEVE só roubava BUFFS — e quase nunca o alvo tem buff, então o golpe parecia não roubar nada. '+
          'E quando roubava (a guarda do Defender, por exemplo), o buff sumia na mão dela no mesmo turno.',
        'Agora ela SEMPRE rouba 4 de ATAQUE e 3 de DEFESA do alvo por 2 turnos (ele perde, ela ganha — aparece um 🔻 no '+
          'card de quem foi roubado). Se o alvo tiver buff, ela leva junto, e o buff não some mais na hora.',
        'Pra ela continuar no meio do elenco: Finta 36→32 e Mão Leve 32→26 de dano. Medido em 12.000 batalhas: ~50%.',
        'A tabela do bot da ⚖ Condenação foi refeita.'
      ] },
    { versao:'1.43', data:'2026-10-22', titulo:'PERSONAGEM NOVO: DMATERELIZADOR 🌀',
      itens:[
        'NOVO — DMATERELIZADOR, "O Fã Número 1 da CDI" (batalha 3x3 e ranqueada). Um dos maiores fãs da CDI, a entidade '+
          'de Limeira que nasceu boa e se renegou no crime. É extremamente chato — ninguém gosta dele, nem a própria CDI.',
        'Passiva 🌀 DESINTEGRAÇÃO: todo golpe dele que pega desmancha 1 de DEFESA do alvo pra sempre (até −6 em cada inimigo).',
        'GOLPES: 🔮 TOQUE DESMATERIALIZADOR (esfera de energia, sem recarga) · 🕳 PORTAL (o golpe sai do outro lado: '+
          'ignora a provocação e a Muralha de Lasanha) · 🌀 DESMATERIALIZAR (apaga Corsa Blindado, Escudo Temporal, Muralha '+
          'de Lasanha, Fumaça Colorida, os buffs dos inimigos e o terreno que estiver no time dele) · 👾 FASE FANTASMA '+
          '(ninguém consegue mirar nele até o próximo turno dele, nem golpe em área).',
        'ULTIMATE 💠 DESMATERIALIZAÇÃO TOTAL: um raio gigante de dano enorme — mas ele gasta tudo e fica o turno '+
          'seguinte SEM PODER nenhum (só dá pra defender).',
        'BALANCEAMENTO: medido em 10.000 batalhas simuladas com ele em todas — 50%, no meio do elenco.',
        'A tabela do bot da ⚖ Condenação foi refeita com ele no elenco.'
      ] },
    { versao:'1.42', data:'2026-10-22', titulo:'PERSONAGEM NOVO: PRODOCIMO, A ENGANADORA 🃏',
      itens:[
        'NOVA — PRODOCIMO, "A Enganadora" (batalha 3x3 e ranqueada). Nasceu Smergulus, se mudou pra Limeira pequena e '+
          'mora lá até hoje. Ama enganar os outros — e é a única que já enganou a própria rainha Smergula.',
        'Ela não bate mais forte que ninguém: o kit é feito pra dar RAIVA de enfrentar. Passiva 🃏 CARA DE PAU: +10% de '+
          'esquiva, e quem ERRA um golpe nela fica CONFUSO no próximo turno.',
        'GOLPES: 🃏 FINTA (finge o soco e chuta — ×1,5 em alvo confuso) · 🫳 MÃO LEVE (rouba TODOS os buffs do alvo, até a '+
          'guarda do Defender) · 👻 SUMIÇO (deixa um vulto: o próximo golpe nela erra inteiro) · 🤭 FOFOCA (dano leve e '+
          'confunde o time inimigo por 1 turno).',
        'ULTIMATE 🤝 APERTO DE MÃO REVELADOR: o alvo fica CONFUSO por 6 TURNOS. Não tem dano, então não dá pra esquivar. '+
          'O Lambança (Fé Inabalável) continua imune a confusão.',
        'BALANCEAMENTO: medido em 10.000 batalhas simuladas com ela em todas — 48% de vitória, no meio-baixo do elenco '+
          '(que vai de 48% a 52%). Ficou um pouco abaixo do meio de propósito: controle rende mais na mão de gente do que '+
          'na do bot.',
        'A tabela do bot da ⚖ Condenação foi refeita com ela no elenco.'
      ] },
    { versao:'1.41', data:'2026-10-21', titulo:'Vida dos personagens de volta ao normal + 3º golpe do Mano Coxinha',
      itens:[
        'VIDA CORRIGIDA: o patch 1.40 equilibrou o jogo inflando a vida de alguns (Marcelão 268, Mano Coxinha 258, '+
          'Mameluco 254). Agora a vida de todo mundo voltou pra perto do que era, e o ADULTO FELIZ é de novo quem tem '+
          'MAIS vida no jogo (205). Marcelão 268→182, Mano Coxinha 258→186, Mameluco 254→179.',
        'O equilíbrio agora vem do DANO e da defesa, não da vida: medido em 22.000 batalhas simuladas, todo mundo '+
          'fica entre 48% e 51% de vitória.',
        'MARCELÃO: no lugar da vida extra, ganhou VELOCIDADE (12→14) — o Ladrão de Tempo age antes de quase todo mundo. '+
          'Os golpes dele continuam bem abaixo do que eram antes da 1.40.',
        'MANO COXINHA ganhou um 3º GOLPE, que também troca com o modo: 🍳 ÓLEO QUENTE (coxinha — queima o time inimigo), '+
          '🍕 FATIA VOADORA (pizza — dano e deixa o alvo mais lento) e 🦶 VOADORA DE HAMBÚRGUER (hambúrguer — dano alto '+
          'e chance de atordoar). Agora são 3 golpes + a ult que gira.',
        'O verme do Careca volta com 65 de vida (era 75).',
        'A tabela do bot da ⚖ Condenação foi refeita de novo.'
      ] },
    { versao:'1.40', data:'2026-10-21', titulo:'PATCH DE EMERGÊNCIA: elenco inteiro rebalanceado + Mano Coxinha refeito',
      itens:[
        'REBALANCEAMENTO GERAL: medido em 30.000 batalhas simuladas (times sorteados, a mesma IA dos dois lados). '+
          'Antes a vitória ia de 34% (Mameluco) a 64% (Serrinha Dog); agora TODO MUNDO fica entre 48% e 52%. '+
          'Ajustes de vida e de dano em quase todo o elenco — os números novos já aparecem na ficha de cada um.',
        'MARCELÃO BLACK JW: batia o DOBRO do resto do elenco. Golpes cortados em 40% (Soco de Bolso 60→35, '+
          'Furto de Tempo 56→33, Moeda Fatal 46→27). Pra continuar jogável, ele virou mais UTILIDADE: o Furto de '+
          'Tempo recarrega em 2 turnos (era 3), a moeda quica com 80% de chance (era 60%), e mais vida e defesa.',
        'MANO COXINHA REFEITO: agora tem UMA ULT só, que GIRA. Ele começa no modo COXINHA (defesa) e a cada uso da '+
          'ult come a próxima comida da roda: 🍗 coxinha → 🍕 PIZZA (velocidade) → 🍔 HAMBÚRGUER (ataque) → coxinha… '+
          'O botão da ult mostra o que ele vai comer. Toda comida cura 30, recarga de 2 turnos. Os bônus de cada '+
          'modo e o ataque dele DIMINUÍRAM; o modo "normal" não existe mais.',
        'Fat Smerg (o mais forte de antes, junto com o Serrinha) perdeu vida; Mameluco, Careca e Fat Mango subiram. '+
          'O verme do Careca agora volta com 75 de vida (era 60).',
        'A tabela que o bot da ⚖ Condenação usa pra montar o time foi refeita com os números novos.'
      ] },
    { versao:'1.39', data:'2026-10-21', titulo:'PERSONAGEM NOVO: MANO COXINHA 🍗',
      itens:[
        'NOVO — MANO COXINHA, "O Salgado de Limeira" (batalha 3x3 e ranqueada). É de Limeira, mas é HUMANO: '+
          'só gosta tanto de coxinha que ficou com o formato dela.',
        'A ULTIMATE SÃO TRÊS COMIDAS, com uma recarga só de 2 turnos. Cada uma cura 25 e troca o MODO DE COMBATE: '+
          '🍗 COXINHA = DEFESA (+7 de defesa, recebe 25% menos dano) · 🍔 HAMBÚRGUER = ATAQUE (+30% de dano) · '+
          '🍕 PIZZA = VELOCIDADE (+7 de velocidade, +18% de esquiva). A comida do modo em que ele já está fica travada.',
        'OS GOLPES MUDAM COM O MODO: Barrigada → Casca Crocante / CRUNCH! / Rodízio de Tapas, e Coxinha Arremessada → '+
          'Muralha de Massa (provoca) / Arroto de Cheddar (acerta o time todo) / Entrega Relâmpago. E ele PARA e '+
          'ANDA diferente em cada modo: guarda fechada na defesa, inclinado e rindo no ataque, quicando na velocidade.',
        'BALANCEAMENTO: medido em 60.000 batalhas simuladas — 50,9% de vitória, no meio do elenco. Os três modos '+
          'ficaram parecidos entre si (49,8% a 51,5%), então não existe "comida certa" fixa: depende da luta.',
        'A tabela que o bot da ⚖ Condenação usa pra montar o time foi refeita com ele no elenco.'
      ] },
    { versao:'1.38', data:'2026-10-18', titulo:'Batalhas no celular: a fileira não "cai" mais pro lado',
      itens:[
        'CORRIGIDO: no celular (em pé e deitado) os três lutadores de cada time ficavam numa escada diagonal muito '+
          'inclinada, com o de trás lá em cima e o da frente cortado na borda da tela. A fileira agora é mais reta, '+
          'parecida com a do computador, e ninguém sai cortado.'
      ] },
    { versao:'1.37', data:'2026-10-18', titulo:'MODO HISTÓRIA RESETADO PRA TODO MUNDO',
      itens:[
        'O progresso do 📖 Modo História foi ZERADO uma vez pra todos os jogadores: quem tinha terminado a história na '+
          'versão antiga (a lista de fases) caía num save convertido pela metade, com missões puladas e grupo errado. Agora '+
          'todo mundo começa do laboratório, com Tel Aviv e o Smergulus Kingdom do jeito certo.',
        'A ⚖ Condenação NÃO foi resetada (ela tem progresso próprio).'
      ] },
    { versao:'1.36', data:'2026-10-18', titulo:'FIM DE TEL AVIV + CAPÍTULO 2: SMERGULUS KINGDOM, carros e o botão START',
      itens:[
        'TEL AVIV TEM FINAL: a história continua depois do Cargas — os caçadores de recompensa, a trégua, o Lambança volta, '+
          'as peças do Astra, o cadeado do ferro-velho, o Colosso da Muralha, a Cidade Velha à noite e a SUBIDA DA TORRE DO '+
          'RELÓGIO, andar por andar, até a luta contra o Marcelão Black JW lá no topo. Depois, o recado do Strong, o exército '+
          'de androides e a Estrada do Norte se abrindo.',
        'MISSÕES QUE NÃO SÃO LUTA: achar a chave da torre, pegar peças pelo mapa, abrir um cadeado de 4 números, alinhar '+
          'engrenagens, girar rodas de um relógio até o código certo, soltar pêndulos na ordem, energizar a subestação na '+
          'sequência do esquema, abrir as comportas de uma represa, levantar pesos na ordem, fazer um fio d\'água… Os itens '+
          'que você carrega aparecem na nova aba 🎒 ITENS do diário.',
        'SECUNDÁRIAS NOVAS em Tel Aviv: Procura-se (4 robôs malucos), a coleira do Serrinha, pão quente pra cidade parada, '+
          'Para-Raios, o rodo do Careca, a fila do caixa, o ônibus 333, a selfie congelada e o androide que queria ser garçom.',
        'NOVO — CAPÍTULO 2, SMERGULUS KINGDOM: o reino da rainha Smergula inteiro pra explorar — castelo roxo com muralha e '+
          'fosso, ponte levadiça, vila dos smergs com praça e mercado de almas, quartel, Academia Nº 77, taverna, esgoto dos '+
          'justiceiros, represa, vulcões, ruínas, cemitério e a fronteira com o pedágio. Dentro do castelo: salão do trono, '+
          'cozinha real, arquivo real e a Torre das Almas.',
        'A HISTÓRIA DO REINO EM 4 ATOS, cada um com OUTRO personagem: Ato I você é o STRONG (Nº 77) e conhece o Cachorro '+
          'Orelha; Ato II você é o TUPAS com o Careca; Ato III é o SERRINHA com o Tupas e o Pipoca, com o reino parado; e no '+
          'Ato IV o grupo do Mecas atravessa as Estradas do Mundo pra guerra. Termina com a rainha… bom, joga aí.',
        'SECUNDÁRIAS DO REINO: Procura-se Smergulão (o crime continua proibido), o Escrivão que desmaia, Só Existe Um Fat, '+
          'Contrabando de Coxinha, as boias do Tupas, o ursinho cor-de-rosa, o Coral do Vulcão, a Casinha do Orelha, e 12 '+
          'bonés + 8 páginas do Arquivo Real pra colecionar.',
        'NOVO — BOTÃO START (ou tecla P): escolha QUEM do grupo você controla. Cada um anda num ritmo: o CARGAS é o mais '+
          'rápido (é um raio), o Serrinha corre bem, o Fat Mango é devagar.',
        'NOVO — CARROS: o ASTRA (prata, mais rápido) e o CORSA (vermelho, um pouco mais lento). Ande até o carro e aperte E. '+
          'Carro só anda na RUA (asfalto, calçamento e estrada de terra) e atravessa de uma região pra outra.',
        'NPCs PADRONIZADOS: os moradores agora usam folhas de sprite do mesmo tamanho e estilo dos personagens (incluindo '+
          'gente nova do reino), e o Cachorro Orelha ganhou sprite próprio.',
        'CORRIGIDO: andando de LADO, o personagem não fica mais virando pra um lado e pro outro a cada passo — todo mundo '+
          'olha pra direção em que está andando.',
        'CORRIGIDO: cruzamentos onde a calçada de uma rua "cortava" a outra; postes e lixeiras que estavam em cima do '+
          'asfalto; inimigos e itens da praia que tinham ficado dentro do mar.'
      ] },
    { versao:'1.35', data:'2026-10-18', titulo:'TEL AVIV MAIS VIVA: dá pra ENTRAR nas casas, prédios e lojas',
      itens:[
        'NOVO — DÁ PRA ENTRAR EM QUASE TUDO: as mais de 100 construções de Tel Aviv (casas, lojas, arranha-céus, galpões, '+
          'armazéns do porto, o hotel, os templos) agora têm porta e um INTERIOR mobiliado — cozinha, quarto, sala, escritório, '+
          'saguão com elevador, galpão com empilhadeira, templo com vitrais. Cada casa tem os próprios móveis, e muitas têm '+
          'um morador congelado no minuto 03:33 pra conversar. Ande até a porta pra entrar; saia pela porta de baixo.',
        'PADARIA PÃO DO MINUTO e TAVERNA DO PORTO abertas, com o padeiro, o forno aceso, o balcão de doces, o bar com '+
          'garrafas, barris de chope, piano e o taverneiro roncando no ritmo do relógio. A Torre do Relógio continua trancada '+
          '(é coisa da história).',
        'MAPA MUITO MAIS DETALHADO: carros estacionados, ônibus 333, táxis, faixas de pedestre, semáforos, hidrantes, '+
          'orelhões, bueiros, árvores na calçada; o Parque das Torres com chafariz; o Parquinho com escorregador e balanço; '+
          'a RUA DO COMÉRCIO com farmácia, relojoaria, barbearia, sorveteria, mercadinho, café, livraria e floricultura; a '+
          'Vila Oeste com horta; a Horta Comunitária; o estacionamento e a piscina do hotel; o Olival e o Cemitério Antigo ao '+
          'sul da muralha; o pátio do laboratório com contêineres; e o porto com âncora, redes e empilhadeira.',
        'A CIDADE VELHA virou uma medina de verdade: fileiras de casas caiadas com becos, toldos de loja, varais e gatos.',
        'GENTE NOVA: os moradores da cidade foram redesenhados em pixel art (16 visuais: cabelos, chapéus, barba, óculos, '+
          'avental, vestido…) e tem mais gente pelas ruas, parques, praia e porto.',
        'ROBÔS: os robôs de patrulha e as sentinelas agora são CÓPIAS do Mecas (são protótipos dele) — de aço, de gelo ou '+
          'enferrujados.',
        'O chão ganhou detalhe (tufos de grama, florzinhas, pedrisco, conchas, rachaduras) e sumiram as manchas PRETAS que '+
          'apareciam na borda dos canteiros de flor.'
      ] },
    { versao:'1.34', data:'2026-10-17', titulo:'MODO HISTÓRIA VIRA MUNDO ABERTO (Etapa 1: Tel Aviv, do laboratório ao homem do raio)',
      itens:[
        'NOVO — o 📖 HISTÓRIA agora te coloca DENTRO do mundo, visto de cima: você anda com o personagem, fala com as '+
          'pessoas, pega missões e encontra as lutas pelo caminho. As lutas continuam sendo o 3x3 por turnos.',
        'TEL AVIV INTEIRA pra explorar (160 × 120 tiles): o Laboratório 5000Z, a Praça do Relógio, o Distrito das Torres, o '+
          'Mercado de Jaffa, a "igrejinha" dourada, a praia, o porto com a baía e o farol, o Parque do Yarkon, a zona '+
          'industrial, e a Cidade Velha murada (por enquanto só dá pra ver por cima do muro — algo ENORME dorme atrás do portão).',
        'CAPÍTULO 1 REESCRITO em missões: acordar na cápsula, os terminais que não batem com a lembrança de "voluntário", a '+
          'contenção, a sala dos protótipos, o Guardião do Portão, a cidade parada em 03:33, o Lambança jurando que é de Tel '+
          'Aviv, o apagão e o Cargas. Nesta etapa a história vai até o Cargas entrar no grupo — o resto do capítulo vem a seguir.',
        'GRUPO: quem entra no grupo anda ATRÁS de você em fila, e luta junto (até 3). INIMIGOS andam pelo mapa: se te VEEM, '+
          'aparece um "!" e eles vêm correndo. Ganhou, você continua de onde estava; perdeu, acorda no último ponto salvo.',
        'DIÁRIO (J): missões principais, secundárias e concluídas, com o objetivo atual, onde fica e a recompensa. MARQUE '+
          'uma missão e ela ganha uma SETA na borda da tela com a distância, um losango no chão e um ponto no minimapa e no MAPA (M).',
        'SECUNDÁRIAS: "Hora Certa" (12 relógios parados — um deles não concorda com os outros), "Prova Que É Daqui" (as provas '+
          'de que o Lambança é de Tel Aviv… todas de Limeira) e "Pescador do Minuto".',
        'ARQUIVO (no menu): gente, lore, bestiário, colecionáveis escondidos (relógios, protótipos, cartazes roxos do norte) e '+
          'REJOGAR LUTA contra chefe já vencido. Missões dão BÔNUS DE HISTÓRIA: vida a mais pro grupo nas lutas da história.',
        'DIA E NOITE: o céu escurece e as luzes da cidade acendem (os relógios de Tel Aviv pararam; o sol, não). Água e lava '+
          'cintilam, chaminés soltam fumaça, gaivotas cruzam o litoral.',
        'CELULAR: joystick que nasce onde o polegar encosta (metade esquerda da tela), botão Ⓐ que acende quando tem algo pra '+
          'falar/ver, e 🗺 📜 ☰ no alto. Empurrar o joystick até o fim corre.',
        'SALVAMENTO NOVO e automático (ao trocar de área, ao concluir missão e de tempos em tempos; o 🕯 lampião salva na hora). '+
          'Quem já tinha vencido fases de Tel Aviv na versão antiga começa com as missões equivalentes concluídas.',
        'A ⚖ CONDENAÇÃO continua em lista de fases, pelo Tribunal da vila ou pelo menu ☰ do mundo.',
        'CRÉDITOS: o mundo usa pacotes de pixel art do Liberated Pixel Cup (OpenGameArt). Autores e licenças na tela ✍ CRÉDITOS, '+
          'no menu do Modo História.',
        'Equilíbrio (simulador, IA nos dois lados): Guardião do Portão ~72%, o duelo com o Cargas ~65% (com o bônus que se tem '+
          'naquele ponto da história), lutas comuns 95–100%.'
      ] },
    { versao:'1.33', data:'2026-10-15', titulo:'Batalha em perspectiva, efeitos por elemento e a HISTÓRIA SOB JULGAMENTO',
      itens:[
        'NOVO — ⚖ CAMPANHA DA CONDENAÇÃO no Modo História: no mapa agora tem duas abas, 📖 CAMPANHA e ⚖ CONDENAÇÃO. '+
          'A Condenação é a mesma história (Tel Aviv e Smergulus Kingdom), reencenada pela rainha Smergula do trono '+
          'dela — e do outro lado joga o BOT DO JULGAMENTO, a IA esperta do Tribunal. Sem draft e sem banimento: os '+
          'times são os da história. Cada campanha tem o PRÓPRIO progresso (dá pra seguir as duas em paralelo). '+
          'Também dá pra abrir pelo Tribunal da Rainha, na vila.',
        'A rainha abre cada fase da Condenação com uma fala do trono, comenta a luta em cima do palco (quando alguém '+
          'cai, quando sai uma ultimate) e dá o veredito no fim: ⚖ ABSOLVIDO ou ⛓ CONDENADO.',
        'PALCO NOVO EM PERSPECTIVA: os lutadores agora ficam EM PÉ NO CHÃO do cenário, em diagonal — quem está atrás '+
          'aparece menor, quem está na frente aparece maior — com sombra no chão e a placa de vida em cima da cabeça. '+
          'Antes eram cartões pequenos encostados nas bordas, com o meio do palco vazio. Um anel no chão mostra de quem '+
          'é a vez (verde/vermelho) e em quem dá pra mirar (amarelo).',
        'EFEITOS POR ELEMENTO: cada tipo de dano tem o próprio impacto — fogo solta brasas, gelo estilhaça em cristais, '+
          'raio estala em zigue-zague, água espirra e faz onda no chão, veneno borbulha, sangue respinga, sombra suga '+
          'em espiral, energia cruza em feixe, explosão levanta fumaça, charme solta corações.',
        'PROJÉTEIS POR ELEMENTO: bola de fogo com rastro de brasa, lasca de gelo, RAIO que cresce até o alvo, feixe de '+
          'energia, bolha d\'água, gosma de veneno, orbe sombrio, bomba girando com pavio, coração voando.',
        'O número de dano agora ESTOURA na tela; golpe que arranca um pedaço grande vem com contorno e "!". Golpe de '+
          'vários acertos mostra "3 HITS". Na ULTIMATE a câmera dá um soco pra dentro no impacto.',
        'NOCAUTE: clarão, estrelinhas e a ALMA subindo do corpo. Ícones do que PEGOU no alvo sobem dele (☠ VENENO, '+
          '❄ LENTO, ⚡ ATORDOADO, 😤 PROVOCADO...). Defender ergue um escudo de luz. "⚔ LUTEM!" no começo, anúncio de '+
          'RODADA e confete na vitória.',
        'Veneno, queimadura, sangramento, terreno e regeneração agora MOSTRAM o número quando tiram/dão vida (antes a '+
          'barra só descia em silêncio). A barra de vida deixa um RASTRO claro do que foi perdido, e pisca com pouca vida.',
        'REGRA NOVA — ESQUIVOU, ESCAPOU DE TUDO: quem esquiva de um golpe não leva o dano NEM os efeitos dele (veneno, '+
          'sangramento, lentidão, confusão, atordoar, provocação, selo, furto de tempo). Golpe de vários acertos: basta '+
          'um acerto pegar. Aparece "💨 efeito evitado".',
        'CORRIGIDO: o BOT conseguia se curar com o Beijo Curativo da Loirinha (o jogador nunca pôde). Golpe de "1 aliado" '+
          '(Beijo, Lasanha Quentinha, Abraço Curativo, Purificação) agora vai SEMPRE num companheiro, pros dois lados — e '+
          'sem companheiro de pé ele fica travado. A IA também parou de gastar o beijo só porque ELA estava ferida.',
        'CORRIGIDO: DEFENDER não protegia de nada — a guarda de +8 sumia no mesmo turno em que era erguida. Agora ela '+
          'segura todos os golpes até o seu próximo turno.',
        'CORRIGIDO (Modo História): as lutas contra o Marcelão Black JW (Tel Aviv fases 15, 19 e 20; Smergulus fase 19) '+
          'estavam IMPOSSÍVEIS desde que os golpes dele ficaram mais fortes na 1.28. Recalibradas: fase 19 ~52%, '+
          'fase 20 ~39% de vitória (medido no simulador).',
        'AJUSTE (Modo História): os chefes do Capítulo 2 tinham ficado fáceis demais com as mudanças do elenco '+
          '(Capitão-Mor medido em 66% estava em 98%). Voltaram pra dificuldade planejada (52% a 66%).',
        'BOT DO JULGAMENTO MAIS ESPERTO: conta a chance de esquiva do alvo, respeita a provocação, não desperdiça golpe '+
          'em quem já vai cair no veneno, escolhe a cura que mais devolve vida e enxerga terreno/provocação/guarda. Contra '+
          'a IA comum ele vence ~60% das lutas 3x3 sorteadas (antes ~54%). A tabela que o bot do Tribunal usa pra '+
          'draftar foi regerada (60.000 batalhas) com as regras novas.',
        'CORRIGIDO: sair de uma luta (VOLTAR) enquanto o bot "pensava" e começar outra logo em seguida fazia um '+
          'INIMIGO FANTASMA da luta anterior agir dentro da luta nova. Agora só quem é da luta atual consegue jogar.',
        'CORRIGIDO: o motor agora confere TODA condição de golpe (antes só a da água do Tupas) — e o convidado da '+
          'partida online passou a ler a condição pelo estado certo (Invocar o Ursão aparecia liberado/travado errado).',
        'DESEMPENHO: a tela de efeitos para de se redesenhar quando não tem nada nela, o cenário não mede mais o próprio '+
          'tamanho a cada quadro e as posições dos lutadores são medidas uma vez por quadro (antes, várias).'
      ] },
    { versao:'1.32', data:'2026-10-15', titulo:'NOVO MODO: ⚖ Condenação — você contra o bot da rainha',
      itens:[
        'NOVO MODO ⚖ CONDENAÇÃO (Tribunal da Rainha, novo ponto da vila): igual à ranqueada — 1 banimento '+
          'de cada lado e escolha alternada, sem repetir personagem — só que contra um BOT ESTRATEGISTA, a '+
          'rainha Smergula. Não vale pontos.',
        'O BOT BANE o personagem que você MAIS joga e com o qual MAIS ganha. O jogo agora guarda com quem '+
          'você luta em todo 3x3 (offline, sobrevivência, online e a própria Condenação) — a rainha mostra o '+
          'que sabe de você no diálogo "O que você sabe de mim?".',
        'O BOT ESCOLHE estudando o draft: quem vence os personagens que VOCÊ pegou, quem combina com o time '+
          'DELE e quem seria bom PRA VOCÊ (e ele tira). A rainha diz o motivo de cada ban e cada escolha.',
        'Na LUTA ele usa uma IA mais esperta: escolhe o golpe que mais rende no momento e mira em quem dá pra '+
          'derrubar ou em quem é mais perigoso.',
        'Medido: contra um jogador que escolhe pelos mais fortes, o bot vence ~64% (o bot comum venceria ~51%).',
        'CORRIGIDO: na tela do draft (ranqueada também), texto longo que quebrava em duas linhas ficava por '+
          'cima do texto de baixo.'
      ] },
    { versao:'1.31', data:'2026-10-14', titulo:'Ultimate com os OLHOS do personagem + batalha mais viva',
      itens:[
        'ULTIMATE: quando alguém solta o golpe especial, uma faixa atravessa a tela com os OLHOS de quem está '+
          'usando (estilo anime), ampliados, com linhas de velocidade na cor do golpe e o nome da ultimate '+
          'embaixo. Vale pra todo o elenco — e cada forma tem os próprios olhos (Smergula demônio de olhos '+
          'vermelhos, Mecas ciborgue com o olho de máquina, Criança Rosa demônio, Careca verme, Ursão...).',
        'O cenário APAGA enquanto a ultimate carrega, deixando os lutadores em destaque.',
        'ENTRADA: no começo da luta todo mundo chega correndo de fora do palco, um depois do outro.',
        'Os lutadores parados agora RESPIRAM (balançam de leve, cada um no seu ritmo).',
        'Uma SETA quicando mostra de quem é a vez (verde = seu time, vermelha = inimigo).',
        'ESQUIVA deixa um vulto azul pra trás; CURA solta sinais de + verdes subindo.',
        'FIM DE LUTA: quem ganhou comemora pulando na pose de vitória.'
      ] },
    { versao:'1.30', data:'2026-10-14', titulo:'Cargas: efeitos de raio novos em todos os golpes',
      itens:[
        'VISUAL ⚡ Cargas — folha nova de efeitos de raio em todos os golpes (só visual, nenhum número mudou):',
        'Choque Rápido: um ORBE de energia pulsando voa da mão dele e estoura em faíscas no alvo.',
        'Investida Relâmpago: raios estalam no chão na largada e o alvo leva uma EXPLOSÃO de luz.',
        'Rajada em Cadeia: o orbe enrola nele, um FEIXE voa pra cada inimigo e um RAIO cai em cima de cada um.',
        'TEMPESTADE ENCURRALADA: chama azul e tornado elétrico subindo no Cargas, colunas de raio no time '+
          'inimigo — e a GAIOLA de raios fica em cima de cada inimigo preso enquanto o Campo Elétrico durar.'
      ] },
    { versao:'1.29', data:'2026-10-14', titulo:'NOVA PERSONAGEM: Criança Rosa (e o Ursão)',
      itens:[
        'NOVA PERSONAGEM (3x3): 🧸 Criança Rosa — parceira do Smergulão na Ilha das Ruínas. Foi morta pela '+
          'rainha Smergula como vingança ao crime do Smergulão e voltou com poderes de demônio.',
        'DUAS FORMAS: a ultimate troca entre CRIANÇA e DEMÔNIO, e todos os golpes trocam junto (sprites e '+
          'efeitos diferentes em cada forma).',
        'CRIANÇA (suporte): 🧸 Ursinho Arremessado (dano e cura o aliado mais ferido) · 🤗 Abraço Curativo · '+
          '🎵 Cantiga de Ninar (AMBIENTE de cura: cura +30% e regeneração pra todo mundo).',
        'DEMÔNIO (dano): 🐾 Garra Sombria · 😱 Pesadelo (CONFUNDE o time inimigo inteiro) · 🔥 Bola de Fogo '+
          'Demoníaca (queimadura).',
        '🐻 INVOCAR O URSÃO (só no modo Demônio e só com um aliado CAÍDO): ela dá 25% da própria vida e o '+
          'ursinho volta do abismo como o URSÃO — 100 de vida e golpes fortes — no lugar do aliado que caiu.',
        'Balanceada em ~49% de vitória (6.000 batalhas com ela em campo).'
      ] },
    { versao:'1.28', data:'2026-10-14', titulo:'Marcelão Black JW e Smergulão: força saiu dos stats e foi pros golpes',
      itens:[
        'AJUSTE: os dois tinham os atributos mais altos do elenco (ataque 31 e 30, quando o resto vai de 15 a '+
          '27). Os stats ficaram parecidos com os outros personagens e a força foi pros GOLPES — o '+
          'personagem continua do mesmo tamanho, só que agora quem pesa é o kit, não o número na ficha.',
        '⏱ Marcelão Black JW: vida 200→175, ataque 31→22, defesa 13→11, velocidade 13→12. Soco de Bolso '+
          '36→60, Furto de Tempo 34→56, Moeda Fatal 28→46. Vitória ~49%.',
        '👤 Smergulão: vida 190→175, ataque 30→22, defesa 11→9 (abaixo da média de propósito — ele se '+
          'protege esquivando), velocidade 13→12. Golpe Traiçoeiro 28→34, Passo nas Sombras 34→42. Vitória ~50%.'
      ] },
    { versao:'1.27', data:'2026-10-14', titulo:'NOVO PERSONAGEM: Smergulão, o Fugitivo das Ruínas',
      itens:[
        'NOVO PERSONAGEM (3x3): 👤 Smergulão — FURTIVO. Era um smerg grande do Smergulus Kingdom, expulso por '+
          'crimes que ninguém tem coragem de dizer. Hoje lidera a Ilha das Ruínas junto da parceira, a Criança Rosa.',
        'Passiva 👤 Furtividade: ganha 1 nível por turno (até 5), cada nível é +6% de esquiva. Tomar golpe '+
          'revela ele (perde 1 nível). Com 4+ níveis fica MUITO furtivo e contra-ataca quem errar, igual o Serrinha Dog.',
        '🗡 Golpe Traiçoeiro (básico): se ele ESQUIVOU do último golpe inimigo, bate ×1,8.',
        '👤 Passo nas Sombras: acerta e liga o MODO FURTIVO por 2 turnos — troca pra folha dele escondido, '+
          'fica meio transparente, bate pela metade e esquiva +15%.',
        '🌿 Moita: se esconde numa moita (+35% de esquiva até o próximo turno dele) — e fica DENTRO da moita no campo.',
        'ULT 🌈 FUMAÇA COLORIDA (setup): bomba de fumaça de cinco cores no lado do time dele — +25% de esquiva '+
          'pra todo mundo ali por 3 rodadas.',
        'Balanceado em ~52% de vitória (15.000 batalhas simuladas).'
      ] },
    { versao:'1.26', data:'2026-10-14', titulo:'NOVO PERSONAGEM: Cabelin, o Rei da Lasanha + correção da Fúria Canina',
      itens:[
        'NOVO PERSONAGEM (3x3): 🍝 Cabelin, da Ilha — SUPORTE e o maior fã de lasanha do mundo. Cura, protege '+
          'e ataca, tudo com lasanha. Usa a folha dele COM a lasanha em todas as animações.',
        'Golpes: 🍕 Fatia Voadora (arremessa uma fatia de verdade, sem recarga) · 🍝 Lasanha Quentinha (cura um '+
          'aliado e as camadas de massa dão defesa) · 🧀 Queijo Derretido (dano + lentidão) · 🍅 Molho Fervendo '+
          '(onda de molho que queima o time inimigo).',
        'ULT 🧱 MURALHA DE LASANHA: ele gasta 30 da própria vida e ergue uma muralha de lasanha com 50 de vida '+
          'na frente do time. Enquanto ela estiver de pé, TODO golpe do time inimigo é obrigado a acertar a '+
          'muralha, até ela quebrar. Golpe em área acerta a muralha uma vez só, e veneno, lentidão e '+
          'atordoamento ficam presos na lasanha. A muralha aparece no campo com barra de vida.',
        'Passiva 🍝 Sobras de Lasanha: no fim de cada turno dele, o aliado mais ferido come um pedaço (+5 de vida).',
        'Balanceado em ~52% de vitória (14.000 batalhas simuladas).',
        'CORRIGIDO: a FÚRIA CANINA do Serrinha Dog dava o "+5 de força por turno" pro INIMIGO atingido em vez '+
          'de dar pro próprio Serrinha. Agora vai pra ele, como a descrição sempre disse.'
      ] },
    { versao:'1.25', data:'2026-10-14', titulo:'Animações de ataque novas para todo o elenco + buff no Marcelão Black JW',
      itens:[
        'ANIMAÇÕES (3x3): TODO golpe de TODO personagem ganhou uma animação própria, montada com as poses '+
          'das folhas que antes ficavam sem uso — o Fat Mango arma e desce o pão com nuvem de farinha, o '+
          'Marcelão liga o funil que suga o tempo, o Mecas tira a granada do cinto (e saca o rifle no modo '+
          'ciborgue), o Serrinha some e reaparece mordendo, e assim por diante.',
        'ENCENAÇÃO NOVA: golpe corpo a corpo agora tem preparo, investida com vulto ficando pra trás, a '+
          'sequência inteira de poses com o impacto no quadro certo e a volta. Golpe à distância mira, '+
          'solta e o projétil voa até o alvo. Golpe em ÁREA corpo a corpo passa por cada inimigo, um de cada vez.',
        'IMPACTO com peso: a cena congela um instante no golpe, o palco treme e o alvo é empurrado pra trás '+
          '(e quem cai nocauteado fica caído onde foi arremessado).',
        'ULTIMATES: energia carregando no lutador, clarão e uma faixa com o nome do golpe cruzando a tela.',
        'As partidas ficaram mais longas de propósito (cada golpe leva de 1,5 a 2,5 segundos) pra dar pra '+
          'ver todo mundo atacando.',
        'CORRIGIDO: a ultimate do Lambança mostrava quadros com o texto da folha colado; Lambança, Loirinha '+
          'e Fat Girl agora caem no nocaute em vez de trocar de pose seco; Marcelão e Cargas ganharam pose '+
          'de nocaute de verdade.',
        'BUFF ⏱ Marcelão Black JW: vencia só 14% das partidas (o pior do elenco por longe — o dano dele era '+
          'o mais baixo do jogo). Vida 170→200, ataque 19→31, defesa 10→13, velocidade 11→13; Soco de Bolso '+
          '18→36, Furto de Tempo 14→34, Moeda Fatal 13→28. Agora vence ~46%, no meio do elenco.'
      ] },
    { versao:'1.24', data:'2026-10-12', titulo:'Modo História: Capítulo 2 — Smergulus Kingdom (40 fases) + epílogo de Tel Aviv',
      itens:[
        'NOVO CAPÍTULO 2 — 🏰 SMERGULUS KINGDOM, com 40 fases em quatro atos: as origens do Strong Smerg (o '+
          'soldado nº 77 que treinou até ficar mais forte que o normal) e do Serrinha Dog (o Cachorro Orelha, '+
          'amaldiçoado pela rainha), os justiceiros Tupas e Careca, o Fat Smerg ao lado da rainha, a morte do '+
          'Marcelão Black JW nas mãos da Smergula e, no fim, a GUERRA GERAL contra ela. Libera depois de terminar '+
          'o Capítulo 1. Chefes nas fases 10, 15, 20, 25, 30, 36, 39 e 40.',
        'TEL AVIV ganhou 5 fases novas (21–25): a notícia da morte do Marcelão, o recado que ele deixou gravado, '+
          'o exército de androides do Mecas, a caravana de Limeira (Lambança, Fat Mango e Mameluco com o Astra) e '+
          'o chefe Colosso Órfão. Quem já tinha terminado as 20 fases continua da fase 21.',
        'NOVO INIMIGO (só no Modo História): 🪖 Soldado Smerg — o smerg comum do exército da rainha, com folha '+
          'normal e folha "assustado" pras cenas. Vira Recruta, Lanceiro, Capitão, Guarda Real, Smerg do Relógio, '+
          'Guarda do Trono... e o Pipoca, o soldado medroso que lidera a rebelião dos bonés.',
        'NOVOS CENÁRIOS: Smergulus Kingdom (vila com o castelo da rainha), Salão do Trono, Esgoto do Reino e '+
          'Campo de Guerra. Também entram no sorteio das batalhas normais.',
        'LORE do catálogo atualizada para Strong Smerg, Serrinha Dog, Fat Smerg, Smergula, Tupas e Careca.'
      ] },
    { versao:'1.23', data:'2026-09-09', titulo:'Escudo Temporal (Marcelão Black JW) perdeu a defesa',
      itens:[
        'AJUSTE: o Escudo Temporal deixou de dar +8 de defesa pro time — pedido do dono do jogo: a '+
          'proposta dele é SÓ acelerar a recarga do time, não proteger, pra não duplicar o que o Corsa '+
          'Blindado do Fat Mango já faz. Continua adiantando 1 turno de recarga do time inteiro por '+
          'rodada (menos a ultimate de cada um) e continua aparecendo como o muro de gelo no campo.'
      ] },
    { versao:'1.22', data:'2026-09-09', titulo:'Fix visual: Escudo Temporal desenhava um carro em vez de um muro',
      itens:[
        'CORRIGIDO: toda ESTRUTURA no campo (Corsa Blindado, Escudo Temporal) desenhava o mesmo carrinho '+
          'blindado — `desenharEstruturas()` era hardcoded pra sempre desenhar `carro()`, não importa qual '+
          'skill criou a estrutura. O Escudo Temporal do Marcelão Black JW (gelo) aparecia como um carro '+
          'laranja, sem nada a ver com o resto do kit dele.',
        'NOVO desenho: `muro()` — um bloco de gelo com juntas de tijolo e o mesmo brilho pulsando que o '+
          'carro já tinha. Cada estrutura agora escolhe o próprio visual (`estrutura.visual`): Corsa '+
          'Blindado continua carro, Escudo Temporal agora é muro.',
        'Corrigido no mesmo passo: a cópia do objeto de estrutura (`sk.estrutura` → `estruturas[time]`) '+
          'trocou de "campo por campo" pra clonar tudo de uma vez (`Object.assign`) — é a MESMA classe de '+
          'bug que já tinha apagado o bônus de recarga do Escudo Temporal na v1.21 (um campo novo que a '+
          'lista manual não incluía), e o `visual`/`cor` do muro cairiam na mesma armadilha se a cópia '+
          'continuasse campo a campo.'
      ] },
    { versao:'1.21', data:'2026-09-09', titulo:'Marcelão Black JW: ultimate virou AMBIENTE, Escudo Temporal virou ESTRUTURA de time',
      itens:[
        'REWORK da ultimate: TEMPESTADE DE GELO deixou de bater no time inimigo e virou um AMBIENTE — '+
          'igual o Charme da Loirinha e o Véu Maldito da Smergula, ela agora congela a arena INTEIRA. '+
          'Por 4 turnos: todo mundo em campo, dos DOIS times, trava na MESMA velocidade (5, não importa '+
          'o que cada um tinha antes), e toda skill que QUALQUER UM usar demora +1 turno a mais pra '+
          'recarregar. Vem com partículas de cristal de gelo, na mesma linguagem visual dos outros dois '+
          'ambientes do jogo.',
        'REWORK do Escudo Temporal: deixou de ser um buff só nele e virou uma ESTRUTURA pro time inteiro '+
          '(igual o Corsa Blindado) — continua dando +8 de defesa pra todos os aliados, e agora TAMBÉM '+
          'adianta 1 turno de recarga de toda skill do time a cada rodada, EXCETO a ultimate de cada um '+
          '(senão o super recarregaria de graça todo round).',
        'Corrigido no processo: o código que grava uma ESTRUTURA no campo copiava os dados campo a campo '+
          'e tinha esquecido de incluir o campo novo — a defesa do Escudo Temporal funcionava, mas o '+
          'bônus de recarga silenciosamente não fazia nada. Achado testando o rework, não teria dado '+
          'pra perceber só lendo o código.',
        'Ajustado o `idle` dele: usava um quadro só da folha (o retrato grande) e era o único personagem '+
          'do elenco sem nenhum balanço parado — agora alterna entre duas poses, igual todo mundo.'
      ] },
    { versao:'1.20', data:'2026-09-09', titulo:'NOVO PERSONAGEM: Marcelão Black JW',
      itens:[
        'NOVO PERSONAGEM (3x3): ⏱ Marcelão Black JW, O LADRÃO DE TEMPO — o primeiro kit do jogo inteiro '+
          'girado em torno de RECARGA em vez de dano bruto.',
        'FURTO DE TEMPO: atrasa em 2 turnos toda skill do alvo que já estiver recarregando, e adianta em '+
          '2 turnos toda skill DELE que já estiver recarregando (menos a que acabou de usar) — o tempo '+
          'sai de um lado e vai pro outro, na mesma tacada.',
        'MOEDA FATAL: joga uma moeda que RECOCHETEIA sozinha pelo time inimigo — um alvo novo a cada '+
          'quique (nunca repete no mesmo lance), com 60% de chance de continuar a cada acerto. Para '+
          'quando erra a sorte ou não sobra mais ninguém.',
        'ESCUDO TEMPORAL (defesa) e a ultimate TEMPESTADE DE GELO (a área inteira sofre o Furto de Tempo '+
          'de uma vez, mais dano e lentidão) fecham o kit.',
        'Passiva ⏱ LADRÃO DE TEMPO: 35% de chance, no fim de cada turno dele, de adiantar 1 turno de '+
          'recarga de uma skill sua sorteada — mesmo sem usar as skills dedicadas.',
        'Personagem novo — ainda sem passar pelo simulador de 4000 batalhas (stats iniciais dentro da '+
          'régua do elenco, não uma medição de verdade).'
      ] },
    { versao:'1.19', data:'2026-09-09', titulo:'Buff no Lambança, nerf na Fat Girl',
      itens:[
        'BUFF: a ultimate do Lambança, SELO DO SILÊNCIO, ganhou um segundo efeito PERMANENTE — além de '+
          'selar o último golpe do alvo por 3 turnos (como já fazia), agora ela também apaga o ATAQUE do '+
          'alvo PRA SEMPRE, pro resto da luta. Os dois efeitos saem juntos, no mesmo golpe.',
        'NERF na Fat Girl: ataque base 27 → 23 (ela estava empatada com o Strong Smerg no topo do '+
          'elenco) e a defesa que a MEDITAÇÃO BRANCA dá 10 → 6 (ela já era a mais alta da faixa que o '+
          'resto do elenco usa em golpes parecidos — agora fica na ponta baixa da mesma faixa).',
        'Os dois ajustes foram pedido direto do dono do jogo — ainda não passaram pelo simulador de 4000 '+
          'batalhas (ver `js/turndata.js` e `CONTEXT.md` §5.1 pros números de referência antigos).'
      ] },
    { versao:'1.18', data:'2026-09-07', titulo:'NOVO SISTEMA: Skins',
      itens:[
        'NOVO: sistema de SKINS — folhas alternativas puramente visuais (não mexem em stat, skill nem '+
          'passiva nenhuma), escolhidas no CATÁLOGO (o Mecas, no Laboratório 5000Z do hub). Ao selecionar '+
          'um personagem com skin, aparece um seletor abaixo da ficha dele.',
        'PRIMEIRA SKIN: 🎽 Skin Honesta, do Fat Smerg — "sem camisa, sem papas na língua". Libera '+
          'automaticamente pra quem vencer 10 partidas RANQUEADAS (o contador é o mesmo `wins` do perfil).',
        'Ao desbloquear uma skin nova numa vitória ranqueada, aparece um POPUP na hora avisando ("🎉 NOVA '+
          'SKIN DESBLOQUEADA!"), com uma prévia do personagem na skin nova.',
        'Quem já tinha 10+ vitórias ranqueadas ANTES desta versão não precisa vencer de novo: a skin '+
          'aparece liberada assim que o perfil é lido (sem popup nesse caso, só na hora da vitória).',
        'NOVO campo de perfil: `unlockedSkins` (lista de skins já desbloqueadas). A skin EQUIPADA (qual '+
          'delas o jogador está vendo agora) é uma preferência separada, guardada no aparelho — não '+
          'precisa de conta pra escolher, só pra desbloquear uma nova.',
        'A skin equipada aparece na MONTAGEM DE TIME e DENTRO da batalha 3x3 (offline e online) — a '+
          'única exceção de propósito é o DRAFT da ranqueada, que mostra sempre a folha padrão pra não '+
          'exibir cosmético no meio da escolha ao vivo contra o adversário.',
        'A skin é uma preferência de TELA, não da partida: cada jogador vê cada personagem (seu ou do '+
          'adversário) com a skin que ELE MESMO equipou no próprio aparelho — não precisa sincronizar '+
          'pela rede, então os dois lados podem estar vendo peles diferentes pro mesmo lutador.'
      ] },
    { versao:'1.17', data:'2026-09-06', titulo:'NOVO MODO: Sobrevivência',
      itens:[
        'NOVO: 🏕 MODO SOBREVIVÊNCIA, acessível pelo Strong Smerg no Dojo da Mata. O jogo sorteia o SEU '+
          'time de 3 (você não escolhe) e você enfrenta um time inimigo sorteado atrás do outro, sem '+
          'parar — vence um, o próximo já entra na sequência. O seu time SEMPRE entra de vida cheia em '+
          'cada rodada nova (o motor recria as unidades do zero a cada `TurnBattle.iniciar()`) — o que '+
          'muda de rodada pra rodada é só o time inimigo sorteado, cada vez mais times pra sobreviver.',
        'A corrida acaba quando o time perde uma luta, ou quando o jogador escolhe "PARAR AQUI" depois '+
          'de uma vitória — as duas contam para o recorde.',
        'NOVO campo de perfil: `survivalRecord`, a MAIOR sequência de times derrubados já alcançada. '+
          'Só sobe (igual o `peakRating` do elo), aparece na tela de PERFIL de qualquer jogador, e some '+
          '"ainda não jogou" pra quem nunca tentou.',
        'Motor reaproveitado 100%: é o mesmo `TurnBattle`/`TurnUI` da luta 3x3 offline, só que '+
          'encadeando uma `iniciar()` atrás da outra com um time inimigo novo sorteado a cada rodada.'
      ] },
    { versao:'1.16', data:'2026-09-06', titulo:'Sistema de PERFIL: avatar, favorito, elo atual e maior elo',
      itens:[
        'NOVO: cada jogador pode escolher uma FOTO DE PERFIL — o rosto de um dos personagens do elenco, '+
          'recortado automaticamente a partir da própria sprite dele (mecânica nova: `Sprites.renderFace`, '+
          'aproveita o mesmo quadro `idle` de sempre, sem pedir upload de imagem nenhuma).',
        'Tela nova "🖼 ESCOLHER AVATAR": grade com o rosto dos 11 lutadores do 3x3, clica e já troca. '+
          'Acessível pelo botão "TROCAR FOTO" no próprio perfil.',
        'NOVO: tela de "👤 PERFIL", aberta clicando em QUALQUER linha do ranking (era só texto antes) — '+
          'mostra avatar, apelido, patente, e quatro números: ELO ATUAL, MAIOR ELO já alcançado, WINRATE '+
          'na ranqueada e PERSONAGEM FAVORITO (o mais usado nas partidas online, com quantas vezes).',
        'O "maior elo" é um campo novo (`peakRating`) que só sobe, nunca desce — grava o pico de verdade, '+
          'diferente do rating atual que oscila com derrota.',
        'A barra de conta (topo) agora mostra o avatar escolhido, e clicar nele abre o próprio perfil.',
        'Balanceamento de dados: perfis antigos que ainda não tinham `avatar`/`peakRating` continuam '+
          'funcionando normal (preenchidos com um padrão na hora de ler, sem precisar migrar nada).'
      ] },
    { versao:'1.15', data:'2026-09-06', titulo:'Nerf: meditar até o fim parou de ser a jogada ótima',
      itens:[
        'A MEDITAÇÃO BRANCA tinha virado a estratégia mais forte do jogo, não só uma opção dela: '+
          'stackar as 3 meditações e só depois atacar batia mais forte que qualquer coisa no elenco. '+
          'Medido com a estratégia fixa "medita 3x, depois ataca sempre sem reagir a nada" — o pior '+
          'caso possível, sem nenhuma leitura de jogo: 34,9% de vitória sem proteção do time, e '+
          '**52,9%** com um taunter (Mameluco) segurando os 3 inimigos enquanto ela meditava à vontade '+
          '— maior que a taxa de qualquer personagem do jogo.',
        'A raiz: o golpe mais forte dela, já no teto de ataque (180), acertava **~95 de dano pós-defesa** '+
          '— quase um character-kill de um golpe só, contra um elenco de 145 a 200 de vida.',
        'Teto da meditação 180 → **140** (27 → 54 → 108 → 140: a 3ª meditação passa a render só +32 '+
          'em vez de dobrar de novo) e os 4 golpes normais 46/60/74/60 → **40/52/64/52**.',
        'O mesmo golpe no teto agora sai em ~78 de dano pós-defesa (-18%). Medido de novo com a mesma '+
          'estratégia fixa: "medita 3x" caiu para **31,8%** sem proteção e **44,2%** protegida — abaixo '+
          'até de NUNCA meditar (47,1% e 55,2% nos mesmos cenários). Meditar até o fim virou uma aposta '+
          'que só compensa se ela sobreviver pra usar o dano extra, não mais o combo óbvio.',
        'Taxa geral dela (times de 3 sorteados, 4000 batalhas): **44,8% → 37,5%**, dentro da faixa do '+
          'elenco (37,5%–62,6%). Ela é a mais fraca da tabela agora, de propósito — é a personagem que '+
          'mais precisa do time proteger pra valer o investimento.'
      ] },
    { versao:'1.14', data:'2026-09-06', titulo:'Fat Girl é canhão de vidro de verdade agora',
      itens:[
        'Vida 165 → 145 (a MENOR do jogo — o resto do elenco vai de 164 a 200) e defesa 13 → 8 '+
          '(a MENOR também). Somando as duas, ela aguenta ~24% menos pancada que na versão passada: '+
          'com def 8 ela leva 76% do dano cru, contra 66% de quem tem def 13.',
        'A guarda da MEDITAÇÃO caiu de +30 para +10 de defesa (a mesma faixa do +6/+7/+8 do resto do '+
          'elenco). Os +30 resolviam o balanço sozinhos, mas transformavam a meditação num botão de '+
          '"fico durão por 2 turnos" — o oposto do personagem. Em troca a guarda dura 3 turnos em vez '+
          'de 2, o que cobre a sequência de meditações do começo da luta (essa duração vale 8 pontos '+
          'de taxa de vitória sozinha: 37,8% com 2 turnos, 45,9% com 3).',
        'O dano dos golpes subiu junto, que é o outro lado da troca: 28/36/44/36 → **46/60/74/60**. '+
          'O Golpe de Quadril bate ~63 num alvo de defesa média já no primeiro turno, sem meditar '+
          'nenhuma vez, e passa de 95 depois de três meditações.',
        'O dano parou aí de propósito, e isso está medido: com vida 145 e defesa 8, golpes de 28/36/44 '+
          'dão 29,4% de vitória, 40/52/64 dão 38,7%, 46/60/74 dão 46,9% — e 50/65/80 dão 46,6%, ou '+
          'seja, empatado. Passando desse ponto ela morre antes de gastar o dano a mais (é sempre o '+
          'alvo prioritário da IA, por ter a menor vida). Número maior na tela não vira poder.',
        'Resultado (4000 batalhas simuladas): **44,8%** de vitória, dentro da faixa do elenco, que hoje '+
          'vai de 38,2% a 60,4%. Ela fica de propósito um pouco abaixo da média: é a personagem que '+
          'mais depende do time segurar a barra pra ela — se ela sobrevive, ela decide a partida.'
      ] },
    { versao:'1.13', data:'2026-09-05', titulo:'MEDITAÇÃO BRANCA vira POSTURA: dobra o ataque, e ela nunca perde turno',
      itens:[
        'A Fat Girl não perde mais turno nenhum por meditar. Ela joga TODO turno — meditar virou uma das '+
          'coisas que ela pode escolher fazer no turno dela, e o preço é só não ter batido nesse turno.',
        'Cada meditação DOBRA o ataque dela na hora, até o teto de 180: 27 → 54 → 108 → 180 (três '+
          'meditações). O que ela acumula NÃO expira — fica pro resto da partida, como uma transformação.',
        'Ela continua sentada na pose de meditação, sem levantar nem quando apanha, e só sai dela quando '+
          'VOCÊ atacar com ela. Meditar de novo, defender ou tomar dano não tiram ela da posição.',
        'A guarda da meditação subiu para +30 de defesa por 2 turnos (era +12). É o que paga o turno '+
          'parado: ela tem a menor vida do jogo e é alvo prioritário da IA, então sentar sem se proteger '+
          'era entregar o turno de graça. Medido: com os +12 antigos a postura dava 41,4% de vitória; '+
          'com +30 dá **50,3%**, o meio exato do elenco (que hoje vai de 36,4% a 60,7%).',
        'A IA inimiga aprendeu a usar a postura: medita só nas duas primeiras rodadas, só enquanto está '+
          'acima de 70% de vida e só até o teto — antes ela ficaria sentada a partida inteira, porque a '+
          'meditação não tem recarga e era sempre uma opção disponível.',
        'Mecânica antiga de "canalizar e depois explodir" (o campo `meditar`, que travava a unidade por N '+
          'turnos) saiu do motor: nada mais no jogo usava, e ela custava ~18 pontos de taxa de vitória '+
          'sozinha. O que ficou no lugar é o campo `meditarStack` (multiplicador + teto), reaproveitável '+
          'por qualquer personagem futuro que queira uma postura que cresce.'
      ] },
    { versao:'1.12', data:'2026-09-05', titulo:'Fat Girl: sprite de derrotada arrumada e MEDITAÇÃO mais longa',
      itens:[
        'A pose de DERROTADA dela estava errada desde que a folha nova entrou: o quadro da folha é largo '+
          '(149×60) e traz três coisas grudadas — ela sentada tonta à esquerda, o jato de gosma branca '+
          'atravessando o meio e, só na direita, ela caída de verdade. O jogo desenhava o quadro INTEIRO, '+
          'então a derrota virava um borrão branco com duas Fat Girls. Agora o quadro é recortado na parte '+
          'deitada (`crop` no anim `ko`, em js/characters.js) — ela cai e fica deitada no chão, na poça.',
        'MEDITAÇÃO BRANCA: volta a durar 2 turnos sem agir (era 1) e o bônus subiu de +50 para +80 de '+
          'ataque por 4 turnos. A guarda erguida durante a meditação acompanhou (+12 de defesa por 3 '+
          'turnos em vez de 2), pra cobrir a janela inteira em que ela fica parada.',
        'Efeito no balanço, medido em 4000 batalhas simuladas: ela cai de 47,1% para **37,4%** de vitória. '+
          'O segundo turno parado custa ~10 pontos e o +80 não paga por ele (o ataque entra no dano com '+
          'peso 0,35, então +80 é ≈ +28 por golpe, por 4 turnos, uma vez a cada 6 — enquanto o turno '+
          'perdido é dano zero E um turno inteiro apanhando). Fica registrado: se um dia for pra trazer ela '+
          'de volta pro meio da tabela sem encurtar a meditação, o caminho medido é engrossar a blindagem '+
          'da meditação (com +45 durante os turnos parados ela volta a ~47,8%).'
      ] },
    { versao:'1.11', data:'2026-09-05', titulo:'Fat Girl volta pra régua do elenco',
      itens:[
        'A Fat Girl estava com números de outro jogo: DEFESA 53 (o resto do elenco vai de 9 a 15), '+
          'ataque base 32 (o resto vai de 17 a 27), golpes de 32/44/58 (o resto vai de 6 a 29) e um bônus '+
          'de ultimate de +133 de ataque (os outros buffs de força do jogo dão de 5 a 6). Na prática, a '+
          'personagem de MENOS vida do jogo era a mais difícil de matar do elenco inteiro — mais que os '+
          'dois tanques, que ainda têm a passiva Fortaleza.',
        'Medindo antes de mexer (4000 batalhas simuladas, times de 3 sorteados dos dois lados, mesma IA '+
          'nos dois): ela testava 57,7% de vitória, a 2ª melhor do jogo. Isolando a defesa, era ELA a '+
          'personagem inteira: com o kit original completo, só trocando def 53 por 13 a taxa desabava de '+
          '56% para 17%. Nada do resto do kit importava.',
        'Novos números: vida 150→165, ataque 32→27 (empata com o Strong Smerg, o maior do jogo), '+
          'DEFESA 53→13 (dentro da faixa de todo mundo), velocidade 12 igual. Os golpes caíram para '+
          '28/36/44/36 — continuam os maiores do jogo por golpe, e isso é de propósito: ela é a única do '+
          'elenco sem NADA de área, cura, setup ou suporte, todo golpe dela mira um inimigo só.',
        'A MEDITAÇÃO BRANCA virou um turno só de meditação (era 2) e agora ela ACORDA JÁ AGINDO. Antes, '+
          'lançar a ultimate custava o turno do lançamento + os turnos meditando + o turno de acordar — '+
          '3 turnos parados numa luta que dura ~6. Medido: com o mesmo kit, TER a ultimate dava 29% de '+
          'vitória e NÃO ter dava 47,6%. Ninguém paga pra acordar e continuar parada.',
        'Em troca, o bônus dela é grande de verdade (+50 de ataque por 4 turnos) e ela medita de guarda '+
          'erguida (+12 de defesa por 2 turnos), que é exatamente a janela em que fica imóvel — sem essa '+
          'blindagem curta ela mede 42,3% em vez de 48,4%.',
        'Resultado (4000 batalhas simuladas): 57,7% → **47,1%**, no meio do elenco, que hoje vai de '+
          '38,6% (Mameluco) a 59,5% (Strong Smerg / Serrinha Dog).'
      ] },
    { versao:'1.10', data:'2026-09-05', titulo:'Fat Girl troca o nunchaco pela MEDITAÇÃO BRANCA',
      itens:[
        'Sprite trocada de novo (assets/fat_girl/fat_girl3.png) — terceira folha dela, também com corte '+
          'automático. O nunchaco sumiu do visual: golpes normais agora usam poses de soco e chute puro, '+
          'e o arremesso virou uma gosma branca (bola segurada com as duas mãos, depois jogada).',
        'MECÂNICA NOVA NO JOGO — "meditar": a ultimate deixou de ser um buff instantâneo (empunhar o '+
          'nunchaco) e virou MEDITAÇÃO BRANCA — ela fecha os olhos, fica 1 turno inteiro SEM AGIR (mas '+
          'continua tomando dano normalmente) e só quando ela volta o bônus de ataque (+80 por 4 turnos) é liberado de '+
          'uma vez. Implementado como um campo genérico `meditar` na skill (`js/turnbattle.js`, '+
          '`iniciarTurnoAtual` conta os turnos e libera o `buff` guardado quando chega a zero) — reutilizável '+
          'por qualquer personagem futuro com uma ultimate de "canalizar e depois explodir".',
        'Enquanto ela está meditando, o jogo mostra a pose de MEDITAÇÃO (sentada de pernas cruzadas) travada '+
          'sem o balanço do idle normal — pedido explícito pra dar a sensação de que ela se move menos '+
          'nesse estado (`js/turnui.js`, `desenharSprites`).',
        'Golpe de arremesso renomeado de "Baba de Nunchaco" para "Baba Branca" (mesmo dano, só a arma '+
          'que mudou — agora é a gosma, não o nunchaco).',
        'Balanceamento: perder um turno inteiro derrubou a taxa de vitória de ~59% pra ~31% na primeira '+
          'versão da mecânica. Compensado com o bônus da ultimate MUITO mais alto (+23→+80 de ataque) e um '+
          'pouco mais de defesa (32→38) pra ela sobreviver ao turno em que fica exposta sem revidar. '+
          'Fechou em **~56-58% de vitória** (1200 batalhas simuladas), de novo bem perto do Strong Smerg.'
      ] },
    { versao:'1.9', data:'2026-09-05', titulo:'Fat Girl vira canhão de vidro + sprite nova',
      itens:[
        'Sprite trocada por uma folha com o corte no padrão normal do resto do elenco '+
          '(assets/fat_girl/fat_girl2.png) — a folha antiga (assets/fat_girl/fat_girl.png) precisava de faixas '+
          'recortadas à mão porque as poses vinham coladas sem espaço em branco; a nova já separa tudo '+
          'sozinha, então aquele código todo (`prepararFatGirl`) foi removido. As duas primeiras poses de '+
          '"parada" da folha nova ficaram de fora do corte por saírem numa escala maior que o resto.',
        'Repensada como CANHÃO DE VIDRO de verdade: pouca defesa (36→32) e vida (145→150, ainda entre as '+
          'mais baixas do elenco) trocadas por dano MUITO mais alto por golpe — o ataque base (32) ficou '+
          'igual, mas o `dano` de cada golpe dela praticamente dobrou (Soco Rápido 16→32, Chute Giratório '+
          '24→44, Golpe de Quadril 30→58, Baba de Nunchaco 24→44, buff da ultimate 14→23).',
        'Balanceamento: mesmo método de sempre, mas agora medindo contra o Strong Smerg (~57-61% de '+
          'vitória) como referência em vez do teto genérico de 60% — pedido explícito pra ela ficar na '+
          'mesma faixa dele. Fechou em **~59-61%** (1200 batalhas simuladas), a poucos pontos do Strong '+
          'Smerg e dentro da variação normal entre baterias.'
      ] },
    { versao:'1.8', data:'2026-09-05', titulo:'Novo lutador: Fat Girl — DPS de alvo único',
      itens:[
        'NOVO PERSONAGEM (3x3): Fat Girl, raça HUMANO. DPS de dano físico — pouca vida (145, entre as mais '+
          'baixas do elenco) e o MAIOR ataque base do jogo (32). Todo golpe dela (básico e ultimate incluídos) '+
          'mira em UM inimigo só, nunca em área.',
        'Passiva — FÚRIA DE NUNCHACO: qualquer golpe que ela acerta (não só a ultimate) tem 18% de chance de '+
          'ATORDOAR o alvo por um turno.',
        'ULTIMATE — EMPUNHA O NUNCHACO: ela puxa o nunchaco da cintura (as poses da folha que mostram a arma '+
          'na mão são usadas só nesse momento) e ganha +14 de ataque por 4 turnos — o reforço é só NELA, '+
          'nunca no time.',
        'Sprite com um problema novo no projeto: a folha (assets/fat_girl/fat_girl.png) não deixa espaço em branco '+
          'entre as poses, então o fatiamento automático (que separa quadros por coluna vazia) juntava poses '+
          'e legendas de texto no mesmo quadro. Resolvido com faixas CUSTOMIZADAS cortadas manualmente '+
          'coordenada por coordenada (ver `prepararFatGirl()` em characters.js) — a primeira vez que o jogo '+
          'precisa desse tipo de correção; nenhum outro personagem do elenco tem esse problema.',
        'Corrigido de quebra um bug de IA que afetava qualquer ultimate futura desse formato: golpes '+
          '`super:true` que só dão BUFF (dano:0, como a dela) não entravam na prioridade de "usar a '+
          'ultimate assim que carregar" — só contavam como super os que causam dano direto. Sem o ajuste, a '+
          'IA só puxava o nunchaco nas duas primeiras rodadas da luta e nunca mais durante o resto da '+
          'partida.',
        'Balanceamento: motor sem interface, mesma IA nos dois lados, trocando só uma vaga do time (mesmo '+
          'método usado no Adulto Feliz e na Serrinha Dog/Smergula). Primeira versão testava **~15% de '+
          'vitória** — o ataque mais alto do jogo não importava porque ela morria por volta da rodada 4 em '+
          'praticamente toda partida (é sempre a vida mais baixa do próprio time, então vira alvo prioritário '+
          'da IA inimiga desde o primeiro turno). Aumentar só o dano não resolveu (ela continuava morrendo '+
          'cedo demais pra usar esse dano); o que funcionou foi subir a DEFESA (8→36) — bem acima do resto '+
          'do elenco, mas condizente com o `body:big` dela: não é mais vida, é resistência física. Com isso '+
          'e um ajuste de dano nos golpes normais, fechou em **~41-45% de vitória** (1600 batalhas '+
          'simuladas), dentro do teto de 60% e na mesma faixa do Adulto Feliz.'
      ] },
    { versao:'1.7', data:'2026-09-05', titulo:'Veneno padronizado e sangramento ignora defesa',
      itens:[
        'VENENO: agora dá sempre o MESMO dano por turno, não importa quem aplicou — antes a Serrinha Dog '+
          'envenenava por 7 e a Smergula por 9, a mesma picada doendo diferente só pela origem. Unificado '+
          'em 7 (o valor mais baixo dos dois, pra não empurrar pra cima quem já mede na faixa alta de '+
          'vitória nas simulações de balanço).',
        'SANGRAMENTO: o acerto direto do golpe que causa sangramento agora IGNORA a defesa do alvo, igual '+
          'o veneno já fazia — Mordida (Serrinha Dog) e Corte Espectral/Rasgo Demoníaco (Smergula).',
        'Para compensar, o dano direto desses golpes foi recalibrado pra baixo e a Serrinha Dog perdeu um '+
          'pouco de ataque (24→20): sem isso ela ficava sensivelmente mais forte, porque Mordida é SEM '+
          'RECARGA (sai todo turno da partida) e o ganho de "não ser mais barrado pela defesa" se acumula '+
          'muito mais do que num golpe de recarga alta.',
        'Balanceamento medido com testes A/B de 2000 batalhas simuladas comparando a ficha ANTES e DEPOIS '+
          'byte a byte (isolando o efeito real do ruído da própria simulação, que sozinho já varia uns '+
          '3-4 pontos percentuais entre rodadas): Serrinha Dog foi de 61,6% para 59,5-60,4% de vitória '+
          '(ficou igual ou levemente melhor que antes) e Smergula ficou praticamente inalterada '+
          '(45,4% → 44,8-45,4%). Nenhum personagem passou a testar mais forte do que já testava.'
      ] },
    { versao:'1.6.1', data:'2026-09-05', titulo:'Sprite nova do Adulto Feliz + bug sério corrigido',
      itens:[
        'Sprite do Adulto Feliz trocada pela folha sem o texto na camisa (assets/adulto_feliz/adultofeliz2.png). '+
          'O fatiamento saiu diferente da folha antiga (sem o texto os espaços entre poses mudam de '+
          'tamanho), então idle/andar/socos/especial/arremesso/machucado/vitória foram todos remapeados '+
          'pose por pose para ele se mexer igual ao resto do elenco, sem "pular" de tamanho no meio da '+
          'animação.',
        'Corrigido um bug sério (achado testando a sprite nova, mas afetava TODO o jogo, não só ele): a '+
          'caixinha "Escolha o alvo ↑" lia uma variável que não existia mais (`miraAliado`), e como isso '+
          'ficava DENTRO da mesma expressão que monta a lista de botões inteira, o erro impedia a lista '+
          'inteira de atualizar — ao escolher QUALQUER golpe que precisa de alvo (a imensa maioria dos '+
          'golpes do jogo), os botões ficavam congelados no estado de ANTES de escolher (sem o destaque '+
          'no botão clicado, sem a dica de texto) até o jogador clicar no alvo e completar a jogada. O '+
          'clique no alvo em si continuava funcionando — os cards do palco são atualizados antes do ponto '+
          'onde o erro acontecia — mas a experiência ficava com essa "trava" visual momentânea.'
      ] },
    { versao:'1.6', data:'2026-09-05', titulo:'Novo lutador: Adulto Feliz — o primeiro HUMANO de verdade',
      itens:[
        'NOVO PERSONAGEM (3x3): Adulto Feliz, raça HUMANO — o primeiro do elenco sem nenhuma linhagem '+
          'especial. Tanque puro: a maior vida do jogo (200) e uma passiva nova, Estofado (10% menos dano '+
          'e +3 de defesa por turno dele, até +18).',
        'O ataque dele é baixo de propósito — quem carrega o dano é o novo campo `escalaVida`: cada golpe '+
          'ganha bônus de dano proporcional à VIDA MÁXIMA dele (não à vida atual). Foi medido primeiro com '+
          'a vida ATUAL e criava uma espiral ruim: o tanque que mais apanha virava o que menos batia, bem '+
          'na hora que o time mais precisava — trocado para vida máxima, o dano fica estável a luta inteira.',
        'ULTIMATE — BIZARRICE: mecânica nova no jogo. Rouba a ultimate de QUALQUER personagem em campo '+
          '(aliado OU inimigo) e a deixa pronta pra ele usar no lugar da própria Bizarrice — quem perdeu '+
          'fica com a PRÓPRIA ultimate travada em recarga total. Golpe roubado usa as estatísticas de '+
          'QUEM ROUBOU, não de quem perdeu.',
        'Balanceamento: 150 batalhas simuladas (motor sem interface, mesma IA nos dois lados, trocando só '+
          'uma vaga do time — mesmo método usado na Smergula). A primeira versão rodou 19-25% de vitória '+
          '(fraco demais); depois dos ajustes acima, estabilizou entre 40-55%, dentro do teto de 60% e na '+
          'mesma faixa do resto do elenco.',
        'Corrigido de quebra: a IA do "rouba de qualquer um" sorteava entre aliado E inimigo sem preferência '+
          '— quase 4 em cada 10 vezes ela roubava do PRÓPRIO time (perde o turno e ainda trava a ultimate '+
          'do companheiro). Agora prioriza sempre o time inimigo.'
      ] },
    { versao:'1.5', data:'2026-09-05', titulo:'Painel do dono: quem é mais escolhido e quem mais ganha',
      itens:[
        'ADMIN: nova seção "📊 PERSONAGENS NA RANQUEADA" — lista o elenco inteiro com quanto cada um é '+
          'escolhido e qual a taxa de vitória, com retrato, barra e número.',
        'ADMIN: filtro de período (7 dias / 30 dias / tudo) e ordenação por mais escolhido ou por maior vitória.',
        'ADMIN: a cor da barra de vitória é o atalho de leitura — vermelho acima de 58% (forte demais), '+
          'verde perto de 50% (equilibrado), azul abaixo de 42% (fraco). Quem tem zero escolha aparece '+
          'apagado no fim, porque "ninguém quer" também é informação.',
        'ADMIN: percentual com menos de 10 partidas decididas vem marcado com "?" — nessa amostra o número '+
          'oscila sozinho e não serve para balancear.',
        'Nada novo passou a ser gravado: os números saem do histórico de partidas que já existia (cada '+
          'partida de ranqueada já guardava o time e o resultado desde sempre).',
        'Corrigido: com a tabela nova o painel ficou mais alto que a tela e o topo (título, filtros) ficava '+
          'inalcançável — mesmo problema de centralização vertical corrigido no jogo na 1.4.1.'
      ] },
    { versao:'1.4.1', data:'2026-09-05', titulo:'Conserto do celular: metade das telas estava quebrada',
      itens:[
        'A v1.4 quebrou no celular tudo que vem DEPOIS da batalha no HTML: online, fila, draft, ranking, '+
          'login, cadastro, catálogo e patch notes apareciam como uma "tela estranha" — na verdade era o '+
          'esqueleto vazio da tela de batalha desenhado por cima.',
        'Causa: a regra nova do celular era `#screen-battle { display:flex }`. Seletor de ID ganha de seletor '+
          'de classe, então esse `display:flex` vencia o `display:none` que esconde as telas inativas — e a '+
          'batalha ficava desenhada o tempo todo. Hub e montagem de time escapavam só porque vêm ANTES dela '+
          'no documento. Agora a regra é `#screen-battle.active`.',
        'Corrigido também: telas mais altas que o celular (patch notes, ranking, catálogo) ficavam com o '+
          'começo ACIMA do topo, sem como rolar até ele — o título e os primeiros itens eram inalcançáveis. '+
          'Era a centralização vertical: no celular a lista agora começa no topo.',
        'Corrigido: nessas mesmas telas o conteúdo encostava nas duas bordas do telefone e o topo ficava '+
          'escondido atrás da barra de conta.',
        'Corrigido: nomes longos ("Loirinha da CDI", "A Bênção Desajeitada") quebravam em duas linhas no '+
          'catálogo e no draft e subiam por cima do sprite.',
        'Corrigido: rolagem lateral no draft em telas de 320px.'
      ] },
    { versao:'1.4', data:'2026-09-05', titulo:'Jogo inteiro jogável no celular',
      itens:[
        'BATALHA: no celular o palco agora fica FIXO no alto e só a lista de golpes rola. Antes o jogador '+
          'escolhia o golpe embaixo, rolava pra cima pra tocar no alvo e rolava de volta — a cada turno da partida.',
        'BATALHA: em pé, os cards encolhem o suficiente para os SEIS lutadores caberem na tela sem rolar. '+
          'Deitado (paisagem), a tela vira duas colunas: palco de um lado, golpes do outro.',
        'BATALHA: a ficha do 🔎 virou folha que sobe de baixo, dá pra fechar com o polegar sem mirar num X no topo.',
        'BATALHA: novo botão 📜 para abrir/fechar o histórico (no celular ele fica com 3 linhas para sobrar tela '+
          'para os golpes).',
        'MONTAR TIME: COMEÇAR BATALHA e VOLTAR agora ficam fixos no rodapé — antes estavam depois da grade '+
          'inteira de personagens, a uma rolagem longa de distância.',
        'HUB: botão 💬 FALAR na altura do polegar (ninguém adivinha que precisa tocar no personagem) e '+
          'ARRASTAR para o lado troca de ponto da vila, além das setas.',
        'Altura de tela: o jogo passou a usar `dvh` no lugar de `vh`. Com `vh` o rodapé de TODA tela ficava '+
          'escondido atrás da barra de endereço do navegador — justamente onde ficam os botões de ação.',
        'Corrigido: arrastar a lista de golpes até o fim disparava o "puxar para atualizar" do navegador e '+
          'RECARREGAVA a página no meio da partida online.',
        'Corrigido: campos de login com fonte menor que 16px faziam o iPhone dar zoom sozinho ao focar — e não voltava.',
        'Corrigido: o :hover ficava grudado depois do toque, deixando cards aumentados e brilhando para sempre.',
        'Corrigido: rolagem horizontal fantasma no catálogo, e o texto de vida vazando para fora do card em telas de 320px.',
        'Nenhum alvo de toque abaixo de 44px e nenhuma fonte de leitura abaixo de 8px no celular.',
        'Desempenho: as scanlines e o desfoque atrás dos cards deixaram de usar composição pesada no celular — '+
          'eram uma camada do tamanho da tela por cima dos canvas animados, e derrubavam o quadro a quadro da batalha.'
      ] },
    { versao:'1.3', data:'2026-09-05', titulo:'Fila de partidas consertada + menu virou a vila',
      itens:[
        'FILA: achado o motivo de "tem dois na fila e não cai um contra o outro". Quem entrava e não achava '+
          'ninguém na hora se anunciava UMA vez e ficava dormindo esperando convite. Se a entrada dele sumisse '+
          'do servidor — e sumia sozinha, porque a queda e reconexão normal do Firebase dispara o onDisconnect '+
          'que apaga a entrada — ele continuava esperando para sempre, invisível para todo mundo que chegasse '+
          'depois. Os dois "na fila", nenhum dos dois enxergando o outro.',
        'FILA: agora a busca é ativa — a cada 2,5s o jogo se reanuncia, renova a entrada e procura adversário '+
          'de novo. Um pacote perdido custa no máximo 2,5s em vez de travar a fila. Testado apagando a entrada '+
          'no meio da busca: ela volta sozinha.',
        'FILA: a faixa de rating da ranqueada ALARGA com o tempo de espera (±350 → mais 250 a cada 10s → '+
          'qualquer rating depois de 1 minuto). Antes, dois jogadores a 400 pontos de distância nunca se achavam.',
        'FILA: convite de partida abandonada não sequestra mais a busca seguinte — convite com mais de 90s '+
          'é descartado (antes, o jogador entrava numa sala morta e o adversário de verdade ficava sozinho).',
        'FILA: cancelar a busca agora sai da fila DE VERDADE e o "sair" atrasado não apaga mais a entrada da '+
          'busca nova; entradas de jogadores que sumiram são varridas em vez de ficarem de enfeite no servidor.',
        'FILA: a tela de "procurando" mostra quantos estão na fila e avisa quando a faixa de rating alargou — '+
          'dá para saber se falta gente ou se é o pareamento que está demorando.',
        'MENU: a tela inicial virou um HUB no estilo Naruto Shippuden. Em vez de lista de botões, você fica '+
          'num ponto da vila com um personagem animado na sua frente e FALA com ele para jogar. As setas ◀ ▶ '+
          'trocam de ponto: Dojo da Mata (Strong Smerg) para o 3x3 offline, Portão da Arena (Loirinha da CDI) '+
          'para o online, e Laboratório 5000Z (Mecas) para catálogo e patch notes.',
        'MENU: cada personagem tem árvore de diálogo — é ele que pergunta se é ranqueada ou casual, explica a '+
          'diferença e ainda ensina as regras do 3x3 pelos submenus.',
        'MENU: novo atalho no dojo — "time sorteado, luta agora" entra direto na batalha contra a IA.',
        'Corrigido: a tela de montar time dizia "RANQUEADA" mesmo quando você tinha entrado pelo casual.'
      ] },
    { versao:'1.2', data:'2026-09-04', titulo:'Lambança parado corrigido de vez',
      itens:[
        'O ajuste da v1.1 (idle num frame só) tirou o bug de crescer/encolher, mas deixou o Lambança parado '+
          'demais — sem nenhuma sensação de movimento.',
        'Reanalisada a folha de sprites: a faixa de chute tem dois frames de guarda quase do MESMO tamanho '+
          '(51x65 e 43x66) — um balanço sutil de "pronto pra briga", sem o pop de escala do bug antigo. '+
          'Idle e o andar dele agora usam esse par.',
        'Removida de vez qualquer menção ao nome antigo do Lambança — inclusive da entrada da v1.0 destas notas.'
      ] },
    { versao:'1.1', data:'2026-09-04', titulo:'Sprite do Lambança, Strong Smerg nerfado e ult reformulada',
      itens:[
        'Corrigido bug visual: o idle do Lambança alternava entre dois frames de tamanho bem diferente e '+
          'a imagem dele parecia crescer/encolher — idle agora fica num frame só.',
        'Selo do Silêncio (ult do Lambança) não sela mais "pelo resto da partida" — agora é por 3 turnos. '+
          'A versão permanente era o tipo de coisa que na simulação parece equilibrada (o bot não escolhe o '+
          'melhor alvo/momento), mas num jogador de verdade virava um corte definitivo, sem chance de resposta.',
        'Compensado o corte da ult: dano do Selo do Silêncio 22→26.',
        'Rodadas de teste simulado (1200+ partidas) apontaram o Strong Smerg MUITO acima da média (até 74% '+
          'de vitórias). Causa raiz: a passiva dele (velocidade crescente, sem teto) empurrava ele para cima '+
          'do limiar de "turno extra" do motor (1.35x a velocidade média do campo) e, depois disso, ele '+
          'passava a agir DUAS vezes por rodada de graça, pro resto da partida.',
        'Strong Smerg — passiva Agilidade Crescente: teto de velocidade acumulada 12→3 (antes disso, no meio '+
          'do jogo ele já cruzava sozinho o limiar do turno extra permanente).',
        'Strong Smerg — Jab Duplo: dano 14→10 (por golpe).',
        'Strong Smerg — Descarga: chance de atordoar 45%→30%, recarga 2→3.',
        'Strong Smerg — Foco Veloz: +5→+3 de velocidade por turno, 4→3 turnos, recarga 4→6.',
        'Strong Smerg — RAJADA DE FÚRIA: dano por golpe 12→9, recarga 5→6, escala de dano por velocidade reduzida.',
        'Smergulite Aguda (Fat Smerg, Strong Smerg, Fat Mango): lentidão 10%→8%, recarga 4→5 — evita que a '+
          'lentidão fique empilhada quase o tempo todo em quem já é rápido.',
        'Loirinha da CDI: velocidade 14→12, Bolsada 33→29 de dano, Beijo Curativo 50→44 de cura.',
        'Serrinha Dog: vida 206→188 (era a maior vida do jogo, destoando do resto), veneno das Presas Tóxicas 9→7.'
      ] },
    { versao:'1.0', data:'2026-09-04', titulo:'Lambança rebalanceado + ranking corrigido',
      itens:[
        'Lambança: ninguém sabe o nome verdadeiro dele — na história só existe o apelido.',
        'Lambança nerfado (estava roubado): vida 220→175, ataque 30→22, defesa 19→14.',
        'Lambança — Golpe Consagrado: dano 37→26.',
        'Lambança — Bênção do Alto: +9 ataque no time 3 turnos (recarga 4) → +6 ataque 2 turnos (recarga 5).',
        'Lambança — Purificação: escudo +9 → +6 de defesa.',
        'Lambança — Selo do Silêncio (ult): dano 30→22, recarga 5→6.',
        'Corrigido bug visual: a aba RANKING as vezes ficava travada (título, lista e o botão VOLTAR saíam da tela e não tinha como rolar pra ver — só recarregando a página) por causa de duas falhas no CSS.',
        'Corrigido bug: o painel "COMO SUBIR NO RANKING" aparecia sempre aberto, ignorando o clique de esconder/mostrar.',
        'Novo botão VOLTAR fixo no canto superior esquerdo, disponível em qualquer tela — nunca mais precisa recarregar a página pra sair de uma tela travada.',
        'Criada esta aba de Patch Notes.'
      ] }
  ];

  function render(){
    const box = document.getElementById('pn-list');
    if(!box) return;
    box.innerHTML = `<div class="pn-versao-atual">Versão atual: <b>${VERSAO_ATUAL}</b></div>` +
      HISTORICO.map(v=>`
        <div class="pn-card">
          <div class="pn-card-head">
            <span class="pn-v">v${v.versao}</span>
            <span class="pn-titulo">${v.titulo}</span>
            <span class="pn-data">${v.data}</span>
          </div>
          <ul class="pn-itens">${v.itens.map(i=>`<li>${i}</li>`).join('')}</ul>
        </div>
      `).join('');
  }

  return { VERSAO_ATUAL, HISTORICO, render };
})();
