# Prompt: Modo História vira RPG de mundo aberto visto de cima

> Cole tudo abaixo da linha no Claude Code, aberto na pasta `game-test`.

---

Quero transformar o **Modo História** do Arena Fighter num **RPG de mundo aberto visto de cima** (top-down, estilo Pokémon / RPG Maker). Hoje ele é uma lista de fases com cena de diálogo e luta 3x3. Depois da mudança, quando o jogador entrar no Modo História, ele cai direto num **mapa enorme, detalhado e vivo**: anda com o personagem, fala com NPCs, pega missões, marca a missão que quer seguir e encontra as lutas pelo caminho. Também quero **reescrever os roteiros de Tel Aviv e de Smergulus Kingdom com MUITO mais tempo de jogo**, já pensando no formato visto de cima, e preparar tudo pra terminar numa **guerra de todo mundo contra todo mundo**.

É um trabalho grande. Antes de escrever código: leia o projeto, monte um plano por etapas e me mostre. Depois implemente etapa por etapa, testando cada uma no navegador.

## 1. Leia antes de começar

- `CONTEXT.md`, inteiro. Principalmente a seção **1.1 Modo História**, as regras de elenco, o aviso de cache `?v=NN` e a seção sobre celular (o jogo é 100% jogável no telefone).
- `js/historia.js`: roteiro atual (`TELAVIV` com 25 fases, `SMERGULUS` com 40), `N()`/`D()`, `LOCAIS`, progresso, as duas campanhas (normal e **Condenação**).
- `js/turnui.js` → `TurnUI.iniciarHistoria(idsAliados, idsInimigos, opts)` e `js/turnbattle.js` → `opts.ajustes`, `danoMult`, `chefe`, `formaInicial`. **As lutas continuam sendo o 3x3 por turnos que já existe.** Não crie outro sistema de combate.
- `js/characters.js` (elenco, ids, `historia:true`), `js/spritesheet.js` (detecção de frames), `js/input.js`, `js/sprites.js`.
- `modohistoria/mapa.png`: o mapa-múndi pintado. **Ele é a referência de como o mundo é organizado**: Smergulus Kingdom no noroeste (terra escura, vulcões, castelo roxo, ruínas), Tel Aviv no leste (cidade murada à beira-mar, arranha-céus, cúpulas, porto), Ruínas da Ilha no centro-sudoeste (templo branco, coqueiros, píer), Limeira no sudeste (terra de lava em chamas, árvores queimadas), estradas de terra ligando tudo, rios, montanhas e o mar.

## 2. Arte que já está pronta

### Personagens andando, vistos de cima: `assets/topdown/<id>_topdown.png`
São 20 folhas PNG **com fundo transparente**, todas no mesmo formato: grade de **4 linhas × 3 colunas**.
- Linhas: 1 = andando pra **baixo**, 2 = **esquerda**, 3 = **direita**, 4 = **cima** (de costas).
- Colunas: 1 = pé esquerdo à frente, 2 = **parado**, 3 = pé direito à frente. O ciclo de andar é 1 → 2 → 3 → 2.
- O tamanho das folhas varia (cerca de 700 a 1024 px de largura). Recorte por detecção do alfa (a mesma ideia do `spritesheet.js`) ou pela grade 4×3, e **pré-redimensione uma vez** pra um canvas em cache no tamanho do jogo. Não redimensione a cada quadro.
- Arquivos: `mecas`, `cargas`, `lambanca`, `marcelao_black_jw`, `strong_smerg`, `serrinha_dog`, `fat_mango`, `mameluco`, `careca`, `tupas`, `smergula`, `fat_smerg`, `smerg_normal`, `smergulao`, `crianca_rosa`, `ursao`, `cabelin`, `adulto_feliz`, `fat_girl`, `loirinha_cdi`.

### Cenário: `modohistoria/assets/`
São pacotes LPC (OpenGameArt), em **tiles de 32×32 px**, pixel art vista de cima. Abra as imagens pra ver o que tem em cada uma.
- `terreno/`: atlas de terreno (grama, terra, areia, água, pedra, lava, neve, caminhos) e `terrain-v7.png` / `terrain-map-v7.png`.
- `construcoes/`: `build_atlas.png` (casas, telhados, portas, janelas, muros, cercas, tenda, carroças) e `obj_misk_atlas.png`.
- `vegetacao/`: árvores verdes, outonais, marrons, **secas/mortas** (servem pra Limeira e Smergulus), frutíferas (coqueiro, bananeira).
- `interiores/`: castelo (paredes, chão, escadas), `city_inside.png` (trono, tapetes, mesas, braseiros, lareira, piano), `moveis_estofados.png` (camas, sofás, lâmpadas).
- `fogo/`: fogueira animada, chamas animadas, tocha animada.
- `ruinas_cavernas/`: ruínas, caverna, água e lava animadas, estátuas, cristais, trilho de mina, caixão.
- `cidade/`: asfalto, calçada, bueiro, placas, semáforos, cones, lixeiras, cerca de arame, pneus.
- `tiles_lpc_base/`: tiles avulsos (baús, barril, cozinha, casa, masmorra, castelo, lava, ponte, cachoeira, placas).
- `CREDITOS.md` e `creditos/`: **a maioria dessas licenças exige crédito** (CC-BY / CC-BY-SA). Faça uma **tela de Créditos** acessível pelo Modo História, listando autores e links do `CREDITOS.md`.

**Escala:** os tiles são de 32 px e os personagens são bem maiores na folha. Escolha uma escala única e coerente: personagem com cerca de 1,5 a 2 tiles de altura, tiles ampliados ×2 ou ×3 com `imageSmoothingEnabled = false`. Mantenha a mesma escala no jogo todo.

**O que não tem nos pacotes:** arranha-céus e mesquitas de Tel Aviv, máquinas do Laboratório 5000Z, sucata do ferro-velho, balcão e fornos da padaria, a Torre do Relógio. Por enquanto, monte essas peças combinando tiles (muros, telhados, janelas, cores) ou desenhando formas simples no canvas, e **me passe uma lista** das peças que valeria eu gerar como imagem. Não baixe nada da internet sem me perguntar.

## 3. O motor do mundo aberto

Crie módulos novos (por exemplo `js/overworld.js`, `js/overworld_mapas.js`, `js/missoes.js`) no mesmo estilo do resto do projeto: JS puro, sem build e sem framework.

- **Mapa em tiles, grande de verdade.** O mundo inteiro segue o `mapa.png`, com as 4 regiões ligadas por estradas. Tamanho mínimo:
  - Tel Aviv: 160×120 tiles;
  - Smergulus Kingdom: 180×140 tiles;
  - Ilha e Limeira: 80×80 tiles cada;
  - estradas, rios, ponte, floresta e montanhas entre as regiões.
  
  Pode ser um mapa único contínuo ou regiões ligadas por saídas. Escolha e justifique.
- **Interiores.** Portas levam a mapas internos com transição de tela: laboratório, casas, padaria, torre, salão do trono, esgoto, arquivo real, academia etc.
- **Não escreva o mapa à mão tile por tile.** Crie um formato de dados com funções que "pintam" o mapa: retângulo de terreno, estrada, rio, muralha, casa, praça, espalhar árvores com semente fixa. Assim o mapa fica enorme, detalhado e editável, e a mesma semente sempre gera o mesmo mapa.
- **Camadas:** chão, objetos e **camada de cima** (copa de árvore e telhado desenhados por cima do jogador). Ordene por Y, pra quem está mais embaixo aparecer na frente.
- **Tiles animados:** água, lava, fogueira, tochas, fumaça de chaminé. Um ciclo de cor de céu (dia/noite) seria ótimo, principalmente nas cenas noturnas da Cidade Velha.
- **Colisão** por tile, com caixas menores pra objetos.
- **Câmera** suave seguindo o jogador, presa às bordas do mapa.
- **Desempenho:** desenhe só o que está na tela e pré-renderize pedaços (chunks) do chão. Precisa rodar liso no celular.
- **Controles:** setas/WASD + E/Espaço (interagir) + M (mapa) + J (missões) + Esc (menu). No celular, joystick virtual + botão de ação + botões de menu, seguindo o padrão de toque que o jogo já usa.
- **NPCs:** parados, andando em rota ou vagando numa área. Balão de fala e retrato (reaproveite `Sprites.renderPose` nas conversas), e `!` (tem missão) / `?` (entregar missão) em cima da cabeça.
- **Seguidores estilo Pokémon.** Quem está no grupo anda atrás do líder em fila, seguindo o rastro de posições dele. Exemplo: o jogador controla o **Mecas**; quando ele encontra o **Cargas**, o Cargas entra no grupo e passa a segui-lo pelo mapa. O grupo muda conforme a história. Nas lutas, o time aliado é o líder + seguidores (até 3), mais quem o roteiro mandar.
- **Lutas no mapa:** inimigos visíveis andando (robôs de patrulha, soldados smerg). Encostou ou foi visto → luta 3x3 com `TurnUI.iniciarHistoria`. Ganhou → volta pro mesmo ponto do mapa. Perdeu → volta pro último ponto de salvamento. Chefes têm arena própria e cena antes e depois.
- **Cenas de diálogo:** reaproveite o sistema atual (`N()`, `D()`, máquina de escrever, PULAR), agora disparado por NPCs, gatilhos de área e fim de luta.
- **Mapa-múndi (tecla M):** use o `modohistoria/mapa.png` como tela de mapa, com a posição do jogador, os marcadores de missão e os pontos de viagem rápida já descobertos.
- **Salvamento** em `localStorage` com chave nova, salvando automaticamente ao trocar de área e ao terminar missão. Migre o progresso antigo: quem já venceu X fases de Tel Aviv começa com as missões equivalentes concluídas.
- **Campanha Condenação:** não pode quebrar. Ou ela continua no formato de lista de fases que existe hoje, acessível pelo mapa e pelo Tribunal da vila, ou ganha uma versão adaptada. Proponha a opção e me pergunte.

## 4. Sistema de missões

- **Missão principal:** a linha da história, dividida em **capítulos**. Cada capítulo tem várias missões encadeadas com objetivos claros ("Fale com…", "Vá até…", "Encontre 3…", "Vença…", "Escolte…", "Investigue…").
- **Missões secundárias:** muitas, espalhadas pelo mapa, cada uma com uma ideia legal (lista na seção 6). Nada de missão genérica do tipo "mate 10 robôs" sem graça: toda missão precisa de uma piada, um segredo ou um pedaço de lore.
- **Diário de missões (J):** abas Principal / Secundárias / Concluídas, com objetivo atual, onde fica e a recompensa.
- **Marcar missão:** o jogador escolhe UMA missão pra acompanhar. Ela ganha um **marcador no mapa**, uma **seta na borda da tela** apontando pro objetivo, a distância e o ícone no mapa-múndi e no minimapa.
- **Minimapa** no canto, que dá pra esconder.
- **Mundo aberto:** nada fica trancado pra sempre. Capítulo concluído continua visitável, missão secundária pode ser feita depois, chefe vencido pode ser revisto ("Rejogar luta"). Áreas que ainda não abriram na história ficam bloqueadas **dentro da lore** (estrada interditada, ponte quebrada, muralha do reino fechada, névoa de lava), nunca com um "🔒 em breve" seco.
- **Recompensas** que façam sentido no jogo: entradas no **Arquivo** (um diário de lore/bestiário com o que o jogador descobriu), pontos de viagem rápida, roupas/skins que já existem no catálogo, e pequenos bônus de história (ex.: `ajustes` com +HP pro grupo nas lutas do capítulo). Não invente uma economia complicada.
- **Colecionáveis** escondidos pelo mapa (relógios parados, cartazes, protótipos, páginas do arquivo real), com um contador no Arquivo.

## 5. Regras de lore (obrigatórias)

- **Nunca escreva o antigo primeiro nome do Lambança** (aquele que aparece no id dele em `characters.js`) em nenhum texto: fala, missão, comentário, patch note. Ele é só **Lambança**. Não renomeie o id.
- **Cada personagem no seu lugar** (confira em `CONTEXT.md`):
  - **Tel Aviv:** Mecas, Cargas, Lambança, Marcelão Black JW, Strong Smerg + Serrinha Dog (dupla de **caçadores de recompensa**, nunca guardas nem defensores de nada), Fat Mango e Mameluco (**turistas** de Limeira, com o **Astra**), O Careca (de Tel Aviv), robôs e protótipos do Mecas. A **Smergula não pisa em Tel Aviv**: só é citada. Adulto Feliz, Fat Girl, Loirinha e Fat Smerg **não aparecem** em Tel Aviv.
  - **Smergulus Kingdom:** Smergula (a **rainha**, dona de tudo), Fat Smerg (compatriota dela, o único smerg mais **gordo** que o normal), Strong Smerg (o único mais **forte** que o normal, ex-soldado nº 77), Serrinha Dog (era o **Cachorro Orelha**, amaldiçoado pela rainha), Tupas (mestre da água que **não sabe nadar**) e Careca (de Tel Aviv, amaldiçoado em **minhoca**, mora no reino desde a maldição; os dois são **justiceiros** com esconderijo no esgoto), soldados `smerg_normal` (fracos e muitos; o Pipoca é um deles). Mameluco + Fat Mango com o Astra aparecem às vezes.
  - **Ruínas da Ilha:** Smergulão e Criança Rosa (líderes da ilha), Ursão (o ursinho dela que virou urso-demônio), Cabelin (da ilha, o maior fã de lasanha do mundo, cura com lasanha).
  - **Limeira:** Lambança (é de Limeira, mas **jura que é de Tel Aviv**), Fat Mango, Mameluco.
  - **Adulto Feliz, Fat Girl e Loirinha da CDI:** ainda não sei onde moram. **Me pergunte** antes de colocá-los no mapa. Deixe espaço pra eles na guerra final.
- **Marcelão Black JW** criou o Mecas (a lembrança de "voluntário" foi implantada), roubou o tempo de Tel Aviv (todos os relógios parados em **03:33**) e é o maior inimigo do Cargas. Ele foge pro reino e a Smergula **suga a alma dele**: ele **morre**. Depois disso, só aparece em gravação ou lembrança.
- **Smergulão:** foi um **Smerg** do reino, um smerg GRANDE, **criado pela Smergula**, que cometeu um **crime tão pesado que não pode ser dito** e foi expulso. **Nunca revele qual foi o crime**, em lugar nenhum: a graça é todo mundo saber que existe e ninguém conseguir falar. Por vingança, a rainha matou a Criança Rosa, que voltou com poderes demoníacos.
- **O Careca** tem cabelo cacheado ("Careca" é só apelido). Era o melhor amigo do Mecas antes do Projeto 5000Z. A vingança dele contra a Smergula é do arco global: em Tel Aviv, ele só é **citado** ou dá pistas.
- O jogador **não precisa saber toda a lore**. Ela é descoberta **explorando**: cartazes, NPCs, arquivos, conversas opcionais. Ninguém despeja lore em parede de texto.

## 6. Roteiros novos (bem mais longos)

Reescreva `TELAVIV` e `SMERGULUS` no formato de missões no mapa. **Meta de duração:** Tel Aviv com cerca de 2 a 3 horas jogando tudo, Smergulus com cerca de 3 a 4 horas (principal + secundárias). Aproveite o que o roteiro atual tem de bom (chefes, falas, ganchos) e expanda. Escreva **todas as falas** em português, com humor, trocadilhos e personalidade. Abaixo vai a espinha dorsal. Os detalhes e as falas ficam com você.

### Capítulo 1: Tel Aviv, "03:33"
Controla o **Mecas**.
1. **Acordar no Laboratório 5000Z.** Tutorial de andar, interagir e lutar (robôs de patrulha). Terminais com registros que não batem com a lembrança de "voluntário". Os protótipos 1000Z… 4999Z quebrados pelo lab.
2. **A cidade parada.** Todos os relógios em 03:33. NPCs presos repetindo a mesma frase do mesmo minuto. Mercado, porto, praias, arranha-céus, Cidade Velha murada.
3. **"Eu sou daqui."** O **Lambança** aparece jurando que é de Tel Aviv, com sotaque, camiseta e documento de Limeira. Entra no grupo por um trecho.
4. **O homem do raio.** Apagão na subestação. O **Cargas** aparece; ele odeia o Marcelão. **O Cargas entra no grupo e passa a seguir o Mecas**.
5. **Caçadores na cidade.** **Strong Smerg + Serrinha Dog** estão atrás do contrato pela cabeça do Marcelão. Rola uma luta por mal-entendido, depois uma trégua interesseira. Quadro de recompensas deles vira fonte de missões.
6. **Turistas perdidos.** **Fat Mango + Mameluco** com o **Astra** quebrado. Consertar o Astra libera a **viagem rápida** ("Táxi do Astra") entre pontos descobertos.
7. **Ferro-velho e Muralha.** Peças, sucata, a máquina do Marcelão na muralha: chefe **Colosso da Muralha**.
8. **Cidade Velha à noite.** Pistas do **Careca**: a casa vazia, o rodo dele, vizinhos falando de "uma coisa da rainha". Só referências.
9. **A Torre do Relógio.** Subida com puzzle de engrenagens e ponteiros girando ao contrário. Chefes: **Marcelão** (time de 3) e **Marcelão "Tempo Absoluto"** (só Mecas + Cargas). Ele foge pro norte.
10. **Epílogo.** O Strong traz a notícia: a Smergula sugou a alma do Marcelão. O **Protocolo Órfão** enlouquece os robôs. O Mecas assume o código 5000Z e começa o exército de androides. Chefe **Colosso Órfão**. Lambança, Mango e Mameluco partem pra Limeira e prometem voltar pra guerra. **A estrada do norte abre**: caminho pro reino.

**Secundárias de Tel Aviv** (exemplos, crie mais):
- **"Hora Certa":** ache os 12 relógios escondidos. Todos marcam 03:33, menos um.
- **"Pão Quentinho Pra Sempre":** o Fat Mango, "o Padeiro Blindado", monta uma padaria improvisada. Entregue os pães pela cidade. Com o tempo parado, eles nunca esfriam.
- **"Prova Que É Daqui":** ajude o Lambança a provar que é de Tel Aviv. Toda prova que você acha é de Limeira.
- **"Peças do Astra":** as peças do carro do Mameluco espalhadas pela cidade.
- **"Procura-se":** o quadro de recompensas do Strong e do Serrinha, com caçadas a robôs com nome e personalidade.
- **"Para-raios":** o Cargas carrega transformadores num puzzle de circuito.
- **"Protótipos Esquecidos":** ache os protótipos antigos do Mecas, com piadas numéricas ("4999Z: quase").
- **"O Rodo do Careca":** ache o rodo perdido. Pista do arco dele.
- **"Cartazes da Rainha":** propaganda smerg aparecendo em Tel Aviv. Primeiro sinal do reino, sem a rainha aparecer.

### Capítulo 2: Smergulus Kingdom, "A Coroa que Suga"
Use os atos que já existem como base e troque o personagem controlado conforme o ato.
1. **Ato I, Origens** (antes de Tel Aviv). Controla o **Strong Smerg**, soldado nº 77, com o **Cachorro Orelha** seguindo. A rainha amaldiçoa o Orelha, que vira **Serrinha Dog**. Os dois desertam, viram caçadores de recompensa e pegam o contrato do Marcelão (liga com o Cap. 1).
2. **Ato II, Enquanto isso.** Controla o **Tupas**, com o **Careca** seguindo, no esconderijo dos justiceiros no esgoto. O Marcelão foge pro reino e a rainha mata ele no salão do trono, com almas subindo (liga com o epílogo do Cap. 1). Chefes: **Fat Smerg**, Capitão-Mor, Sombra da Rainha.
3. **Ato III, O reino parado.** O tempo roubado do Marcelão agora está com a rainha. O reino trava em 03:33. Smerg do Relógio Mestre, General Smergão.
4. **Ato IV, Às vésperas da guerra.** O Mecas chega com o exército de androides (o grupo junta personagens dos dois capítulos). Alianças frágeis, cada facção com seus próprios motivos. Fat Smerg, o Único. A rainha. **Termina com a guerra começando**, o gancho pro capítulo final.

**Secundárias e referências do reino** (exemplos, crie mais):
- **"Procura-se: Smergulão":** cartazes de procurado pelo reino inteiro. No campo **CRIME**, sempre: "██████ — proibido de dizer por decreto real". No **Arquivo Real** do castelo, a ficha dele: "Smerg criado por Sua Majestade. Tamanho: GRANDE. Crime: o escrivão desmaiou antes de terminar de escrever". Soldados velhos começam a contar e mudam de assunto. Um smerg sussurra "ele era um de nós". Quem juntar as pistas descobre que o Smergulão era um Smerg criado pela rainha, expulso por um crime que ninguém fala. **O crime nunca é revelado.**
- **"Só Existe Um Fat":** decreto real dizendo que só pode existir UM smerg gordo no reino. Estátua do Fat Smerg, banquete exclusivo, rampa exclusiva, soldados de dieta obrigatória. Trocadilhos tipo "Fat-o consumado" e "Fat-alidade". Quando o Fat Mango aparece com o Astra: "não somos parentes".
- **"Academia Nº 77":** o lugar onde o Strong ficou forte demais. Os pesos que ninguém mais levanta.
- **"A Casinha do Orelha":** a casinha de cachorro com a placa "ORELHA". O Serrinha para em frente e fica olhando.
- **"Salva-Vidas do Salva-Vidas":** o Tupas manda na água mas não sabe nadar. Missão de boias, ponte de gelo, água que ele controla mas não atravessa.
- **"Minhoca de Estimação":** pistas da maldição do Careca e do rodo dele.
- **"Soldado Pipoca":** o soldado comum com nome, que quer ser promovido de qualquer jeito.
- **"Achados e Perdidos":** um ursinho de pelúcia cor-de-rosa com cheiro de enxofre. Ninguém quer ficar perto. É a primeira pista da Criança Rosa e do Ursão, que leva até a Ilha.
- **"Almas no Trono":** o salão do trono com almas subindo. Uma delas para o relógio em 03:33.

### Ilha e Limeira (exploráveis, preparando a guerra)
- **Ruínas da Ilha:** templo, coqueiros, píer. Smergulão e Criança Rosa como líderes desconfiados. Cabelin e a missão **"A Lasanha Perdida"** (cura o grupo). O Ursão. A ilha decide de que lado vai ficar na guerra.
- **Limeira:** terra de lava, árvores queimadas, casas em chamas. Lambança em casa (e ainda dizendo que é de Tel Aviv), Fat Mango, Mameluco e o Astra. Limeira se arma pra guerra.

### Capítulo final: "A Guerra de Todos"
Tudo converge. O mapa inteiro vira zona de guerra: estradas tomadas, acampamentos, frentes de batalha em cada região. Facções: o Reino (Smergula, Fat Smerg, smergs), Tel Aviv (Mecas, androides, Cargas), Limeira (Lambança, Mango, Mameluco + Astra), a Ilha (Smergulão, Criança Rosa, Ursão, Cabelin), os caçadores (Strong e Serrinha, que ficam do lado de quem paga mais) e os justiceiros (Tupas, Careca, que querem vingança). Alianças mudam no meio da guerra: vira **todo mundo contra todo mundo** até o confronto final. Os capítulos 1 e 2 têm que **ir encaminhando** pra isso, com tensões, promessas e traições plantadas antes. Monte a estrutura desse capítulo e me mostre o plano antes de escrever tudo.

## 7. Equilíbrio das lutas

Use o simulador que já existe (citado no `CONTEXT.md`) pra medir a taxa de vitória dos chefes novos e mantenha as faixas atuais: lutas comuns fáceis, chefes de capítulo em torno de 35 a 65%. Ajuste com `ajustes` (`hp`, `danoMult`, `spd`, `chefe:true`).

## 8. Como entregar

1. Primeiro me mostre o **plano por etapas**, o **formato dos dados** (mapa, missões, NPCs, gatilhos) e o **esboço dos roteiros** (lista de missões principais e secundárias de cada capítulo).
2. Implemente em etapas. **Etapa 1:** motor + Tel Aviv jogável do começo até o Cargas entrar no grupo. Depois o resto de Tel Aviv, depois Smergulus, depois Ilha e Limeira, por último a guerra.
3. Teste cada etapa no navegador com o servidor `arena` do `.claude/launch.json`: andar nas 4 direções, colisão, seguidor, falar com NPC, marcar missão, seta apontando, luta e volta pro mapa, salvamento, **tela de celular** (375×812) com o joystick.
4. Suba o `?v=NN` dos scripts que mudar no `index.html` e atualize o `CONTEXT.md` (seção do Modo História), o livro do jogo e as patch notes, como o projeto já faz.
5. No fim de cada etapa, me diga o que ficou pronto, o que falta e quais imagens valeria eu gerar pra deixar o mapa mais bonito.
