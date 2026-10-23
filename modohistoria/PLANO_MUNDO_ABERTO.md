# Modo História → RPG de mundo aberto visto de cima — PLANO

## Status (2026-10-17)

- ✅ **Etapa 1 pronta (versão 1.34).** Motor (`overworld.js`, `ow_arte.js`, `ow_pintor.js`,
  `missoes.js`), Tel Aviv inteira (160×120) + Laboratório 5000Z, missões 1–14 do Cap. 1
  (até o Cargas entrar no grupo), secundárias Hora Certa / Prova Que É Daqui / Pescador do
  Minuto, 12 relógios + 5 provas + 5 protótipos + 3 cartazes, Arquivo, Créditos, mapa-múndi,
  minimapa, seta, salvamento + migração, controles de toque. Testado no navegador.
- ⏭ **Etapa 2:** missões 15–33 (caçadores, turistas + Táxi do Astra, ferro-velho, Colosso,
  Cidade Velha à noite, Torre do Relógio com puzzle, Marcelão, epílogo), interiores (padaria,
  taverna, casa do Careca, torre), resto das secundárias, Condenação do Cap. 1 gerada do
  roteiro novo (`Missoes.sessoesCondenacao(1)`), migração das fases 9–25.
- Portas já existentes no mapa e trancadas na lore até a Etapa 2: Torre do Relógio, padaria,
  taverna, casa do Careca, portão da Cidade Velha, portão do ferro-velho, Estrada do Norte e
  ponte do Yarkon.

> Documento de trabalho. Ele vale até cada etapa ficar pronta e ir pro `CONTEXT.md`.
> Regra de lore fixa: o Lambança é **só Lambança** em qualquer texto (fala, missão,
> comentário, patch note). O id dele em `characters.js` não muda, mas o nome antigo
> nunca é escrito.

---

## 0. Decisões de arquitetura

### 0.1 Um mapa contínuo ou regiões? → **Regiões ligadas por saídas, sem tela de "fase"**

O mundo vira **5 mapas externos**: Tel Aviv, Smergulus Kingdom, Ruínas da Ilha, Limeira
e **Estradas do Mundo** (o "meio" do `mapa.png`: estradas de terra, rio, ponte,
floresta, montanhas, a costa). Eles se tocam pelas bordas: andar até a borda leste
das Estradas entra no portão oeste de Tel Aviv com um fade curto (~250 ms), e o jogador
aparece já andando, na mesma direção. Por dentro de cada região não existe corte nenhum.

Por que não um mapa único de ~420×320 tiles:

1. **Celular.** Cada região é gerada (pintada pela semente) só quando o jogador entra
   nela. Abrir o jogo gera uns 20 mil tiles, não 135 mil. Isso conta no celular fraco.
2. **Clima e tom por região.** Lava e névoa em Limeira, céu roxo e vulcões em
   Smergulus, mar e brisa em Tel Aviv. Com região separada, cada uma tem a própria
   paleta de céu, partícula de ambiente e música, sem mistura de bordas.
3. **Bloqueio dentro da lore.** As saídas são o lugar natural das travas da história
   (estrada interditada, ponte quebrada, muralha do reino fechada, névoa de lava).
4. **Salvamento.** O pedido é "salvar ao trocar de área". Com regiões, trocar de
   área é um momento claro e frequente.
5. **Editar.** Um arquivo de dados por região (`js/mapas/telaviv.js` etc.). Mexer em
   Limeira não mexe na semente de Tel Aviv.

Interiores (laboratório, casas, padaria, torre, salão do trono, esgoto, arquivo real,
academia…) são mapas pequenos com a mesma engine, entrados por **portas** (fade).

### 0.2 Escala única

- **1 tile = 32 px de mundo** (o tamanho nativo do LPC).
- **Personagem = 56 px de altura de mundo (1,75 tile)**. A folha top-down (≈230×290
  por quadro) é recortada e **pré-reduzida uma vez** pra 56 px × zoom, num canvas em
  cache por personagem/direção/quadro. Nunca redimensiono por quadro.
- **Zoom inteiro de tela** com `imageSmoothingEnabled=false`: ×2 no computador.
  No celular, o canvas é desenhado em pixels reais do aparelho (DPR) e o zoom é o
  inteiro que mostra **pelo menos ~13 tiles de largura** (em pé, 375 px CSS, DPR 3 →
  ×3 em pixels do aparelho). A proporção tile:personagem é a mesma em qualquer tela.
- Os personagens top-down não são pixel art "nativa 32px" (são folhas grandes). Na
  redução eu uso um downscale de boa qualidade **uma vez** (smoothing ligado só nessa
  passada, em 2 etapas de ½), pra eles não ficarem serrilhados. Os tiles continuam
  nítidos.

### 0.3 Desempenho

- **Chão em chunks de 16×16 tiles**, pré-renderizados num canvas offscreen no zoom
  atual. Cache com limite (~48 chunks) e descarte por uso (LRU). Por quadro desenho só
  os 4–9 chunks visíveis.
- **Tiles animados** (água, lava, cachoeira) ficam fora do chunk. Cada chunk guarda a
  lista dos tiles animados dele, e eles são desenhados por cima só se estiverem
  visíveis. Fogueira, tocha e fumaça de chaminé são objetos animados.
- **Objetos e personagens**: lista ordenada por Y só do que está na tela (consulta por
  grade espacial, não percorro o mapa inteiro).
- Camada de cima (copa de árvore, telhado): também em chunks, desenhada depois do
  jogador. Quando o jogador está "dentro" do telhado de uma casa grande, ele fica
  semitransparente.
- Laço com `dt` real (mesmo cuidado da máquina de escrever por tempo: aba em segundo
  plano não pode fazer o jogador atravessar parede). O passo de física fica preso a
  1/30 s no máximo.
- No celular: sem `filter`/`shadowBlur` por quadro. O ciclo dia/noite é **um único
  `fillRect`** com cor e alfa, e as luzes (tochas, janelas) são gradientes
  pré-renderizados.

### 0.4 Arquivos novos (JS puro, IIFE, sem build)

| arquivo | o que faz |
|---|---|
| `js/ow_arte.js` | carrega tilesets LPC, **dicionário de tiles nomeados** (`'grama'`, `'agua'`, `'telhado_vermelho'`…) → `{img, x, y, w, h, anim}`, autotile de bordas (grama↔areia↔água), folhas top-down dos 20 personagens (recorte por alfa + grade 4×3, cache pré-reduzido), **sprites desenhados em código** pros que não têm folha (robô de patrulha, androide, cidadão genérico, cachorro Orelha) |
| `js/ow_pintor.js` | o **pintor de mapas**: `ret`, `estrada`, `rio`, `muralha`, `casa`, `predio`, `praca`, `espalhar`, `cerca`, `ponte`, `costa`… com PRNG de semente fixa (mulberry32). Gera as camadas e a colisão |
| `js/mapas/*.js` | um arquivo por região/interior: `telaviv.js`, `estradas.js`, `smergulus.js`, `ilha.js`, `limeira.js`, `interiores_c1.js`, `interiores_c2.js`. Só **dados + chamadas do pintor** |
| `js/overworld.js` | o motor: laço, câmera, colisão, jogador, seguidores, NPC, inimigos visíveis, gatilhos, portas/saídas, ciclo de céu, HUD (minimapa, seta da missão, toasts), controles de toque (joystick + ação + menus) |
| `js/missoes.js` | missões (estado, passos, objetivos), diário (J), marcar missão, Arquivo (lore/bestiário/colecionáveis), salvamento + migração do save antigo |
| `js/roteiro_c1.js` | Capítulo 1: NPCs, cenas, lutas e missões de Tel Aviv |
| `js/roteiro_c2.js` | Capítulo 2: Smergulus (+ Estradas) |
| `js/roteiro_c3.js` | Ilha e Limeira |
| `js/roteiro_guerra.js` | Capítulo final |
| `js/historia.js` | **continua**: o reprodutor de cena (`N`, `D`, máquina de escrever, PULAR) vira API pública (`Historia.tocarCena`) usada pelo mundo; mapa-múndi (M); Créditos; e a Condenação (ver §0.6) |

O `Historia.abrirMapa()` do botão 📖 HISTÓRIA passa a abrir o mundo direto
(`Mundo.abrir()`), no último ponto salvo.

Telas novas no `index.html`: `screen-mundo` (canvas + HUD), e painéis por cima dela
(diário, mapa-múndi, Arquivo, menu Esc, Créditos), sem trocar de tela. Assim voltar
de um painel é instantâneo. A cena de diálogo de NPC comum é um **balão dentro do
`screen-mundo`** (retrato com `Sprites.renderPose` no canto). As cenas grandes (chefe,
virada de capítulo) continuam no `screen-historia-cena` com o `TurnBG` atrás.

### 0.5 Controles

- **Teclado:** setas/WASD andam; **Shift** corre; **E/Espaço/Enter** interage ou avança
  fala; **M** mapa-múndi; **J** diário; **Tab** esconde/mostra o minimapa; **Esc** menu.
  Leio teclado num módulo próprio do mundo (o `Input` atual é do 1x1 e tem dash por
  duplo toque, que não serve aqui).
- **Celular** (segue as 3 regras do §2.2: polegar embaixo, sem rolagem, nada abaixo
  de 44 px): **joystick virtual** que nasce onde o polegar esquerdo toca na metade
  esquerda da tela; botão **Ⓐ** grande embaixo à direita (muda de rótulo: 💬 FALAR /
  🚪 ENTRAR / 🔍 VER); em cima à direita **🗺 📜 ☰**. Correr = joystick empurrado até
  o fim. Nada de `:hover`; `touch-action:none` só no canvas.

### 0.6 A Campanha Condenação → **DECIDIDO: lista gerada do roteiro novo**

**Continua em lista de fases**, aberta pelo Tribunal da vila
(como hoje) e pelo menu ☰ do mundo ("⚖ Tribunal da Rainha"). A rainha não pisa em Tel
Aviv: ela julga a *lembrança* do trono dela, como já é hoje. A lista passa a ser
**gerada a partir das lutas da história nova** (cada luta principal marcada
`condenacao:true` vira uma "sessão", com a cena antes e depois). Assim todo chefe
novo entra no julgamento sozinho e a história bate. O progresso antigo da Condenação é
convertido pela mesma tabela da migração (§5).

---

## 1. Formato dos dados

### 1.1 Região (mapa)

```js
Mundo.regiao('telaviv', {
  nome:'Tel Aviv', w:160, h:120, semente:333,
  ceu:'litoral',            // paleta do ciclo dia/noite
  musica:null,              // gancho pro futuro
  pintar(p){                // p = pintor (js/ow_pintor.js)
    p.ret(0,0,160,120,'grama');
    p.costa({lado:'leste', x:132, ondula:4});        // mar + areia com borda automática
    p.muralha([[30,62],[30,100],[78,100],[78,62]], {portoes:[[54,62],[30,80]]});
    p.estrada([[0,40],[60,40],[60,62]], {larg:3, tipo:'asfalto', calcada:true});
    p.predio(90,10,{w:6,h:9,cor:'vidro', andares:12});           // arranha-céu "montado"
    p.casa(40,70,{w:5,h:4,telhado:'barro', porta:'casa_careca'});
    p.praca(60,30,{r:6, centro:'relogio_praca'});
    p.espalhar('palmeira', {ret:[100,60,30,40], dens:0.04, longeDe:'estrada'});
  },
  saidas:[ { lado:'oeste', y:[38,42], para:'estradas', em:[198,70],
             trava:{ flag:'c1_lab_fim', texto:'A barreira de robôs ainda fecha o portão.' } } ],
  pontos:{ lab_porta:[18,22], torre:[62,34], ... }     // nomes usados pelo roteiro
});
```

Camadas geradas: `chao` (Uint16Array de ids de tile), `chao2` (bordas/decalques),
`objetos` (lista `{tile, x, y, solido:{x,y,w,h}}`), `cima` (copas/telhados),
`colisao` (Uint8Array: 0 livre, 1 parede, 2 água, 3 lava…). Caixa de colisão de objeto
menor que o desenho (tronco da árvore, não a copa).

### 1.2 NPC

```js
NPC('vendedor_frutas', {
  char:null, desenho:'cidadao', paleta:3,       // char = id do elenco OU desenho procedural
  nome:'Seu Abrão das Frutas',
  em:['telaviv', 71, 44], dir:'baixo',
  anda:{ tipo:'parado' } | { tipo:'vagar', r:3 } | { tipo:'rota', pts:[[71,44],[75,44]], espera:2 },
  falas:[                                   // primeira que bater a condição é a usada
    { se:'missao:c1_cidade_parada.ativa', cena:'vendedor_loop' },
    { se:'flag:torre_vencida',            cena:['O relógio voltou! Quanto tá a laranja? Ah, ainda é 3 reais.'] },
    { cena:['São 03:33. Laranja fresquinha!'] }
  ],
  missao:'sec_hora_certa'                    // gera o ! / ? em cima da cabeça
});
```

### 1.3 Cena

O formato atual, sem mudança: `[N(texto), D(charId, texto, {forma, pose, nome})]`,
mais três comandos opcionais que rodam no meio da fala:
`{faz:'grupo+', id:'cargas'}`, `{faz:'flag', id:'apagao'}`, `{faz:'mover', npc, para:[x,y]}`.
Cenas curtas de NPC → balão no mapa. Cenas marcadas `grande:true` → tela de cena.

### 1.4 Luta

```js
LUTA('cargas_apagao', {
  time:'grupo' | ['mecas'],              // 'grupo' = líder + seguidores (até 3)
  inimigos:['cargas'],
  ajustes:{ inimigo:[{ hp:250, atk:22 }] },
  cenario:'telaviv', chefe:false,
  antes:'cena_id', depois:'cena_id',
  condenacao:true,                        // entra na lista da Condenação
  rejogavel:true                          // aparece no "Rejogar luta" do Arquivo
});
```

Inimigo visível no mapa:
`{ id:'patrulha_3', desenho:'robo', em:[...], rota:[...], visao:4, luta:'patrulha_lab', some:true }`
(`visao` = tiles do cone. Viu → "!" em cima → corre até você → luta.)
Ganhou: volta pro mesmo ponto, inimigo some (ou volta depois de trocar de área, se
`reaparece:true`). Perdeu: volta pro último ponto de salvamento, nada se perde.

### 1.5 Gatilho

```js
GATILHO({ em:['telaviv', 58,60, 6,3], se:'missao:c1_apagao.passo>=1', uma:true,
          faz:[{cena:'subestacao'}, {luta:'cargas_apagao'}] });
```

### 1.6 Missão

```js
MISSAO('c1_homem_do_raio', {
  cap:1, tipo:'principal', titulo:'O Homem do Raio',
  resumo:'A cidade apagou inteira. Alguém está fazendo isso de propósito.',
  requer:['c1_documento'],
  passos:[
    { obj:'Vá até a subestação do porto',  tipo:'ir',    alvo:['telaviv', 112, 70, 3] },
    { obj:'Encontre a fonte do apagão',    tipo:'falar', npc:'cargas_rua' },
    { obj:'Vença o homem do raio',         tipo:'luta',  luta:'cargas_apagao' },
    { obj:'Ouça o que o Cargas tem a dizer', tipo:'cena', cena:'cargas_explica' }
  ],
  recompensa:{ grupo:'+cargas', arquivo:['p_cargas'], bonus:{ cap:1, hp:10 }, viagem:'subestacao' }
});
```

Tipos de passo: `falar`, `ir`, `luta`, `cena`, `coletar` (N de um tipo),
`entregar` (item a NPC), `escoltar` (NPC te segue até um ponto), `investigar`
(interagir com K objetos marcados), `puzzle` (o puzzle diz quando acabou).

**Recompensas** (sem economia):
- **Arquivo**: entrada de lore/bestiário/personagem (e o contador de colecionáveis);
- **Viagem rápida**: ponto do Táxi do Astra liberado;
- **Skin** já existente no catálogo (sem inventar nova);
- **Bônus de história**: `ajustes` aplicados ao grupo nas lutas do capítulo
  (ex.: +10 HP pros aliados). Somados com teto, aparecem no diário.

### 1.7 Salvamento

`localStorage['historia_mundo_v1']`:
```js
{ v:1, area:'telaviv', x, y, dir, lider:'mecas', grupo:['cargas'],
  flags:{...}, missoes:{ id:{ passo:2, feita:false, cont:{} } }, marcada:'c1_homem_do_raio',
  viagem:['lab','porto'], coletados:{ relogio_04:1 }, arquivo:{ p_cargas:1 },
  salvoEm:{ area, x, y }, tempoJogado, minimapa:true }
```
Salva sozinho: ao trocar de área/entrar em porta, ao concluir missão, ao vencer luta e
a cada 60 s parado num ponto seguro. Pontos de salvamento visíveis (🕯 lampião/totem)
são também onde você volta se perder.

---

## 2. HUD e telas

- **Seta da missão marcada**: na borda da tela apontando pro objetivo, com a
  distância em metros (1 tile = 1 m). No mapa dela, marcador ◆ pulsando no chão.
  Objetivo noutra região → a seta aponta pra saída certa (caminho por grafo de saídas).
- **Minimapa** no canto superior esquerdo (Tab / toque esconde): a região inteira
  pré-renderizada 1 px/tile uma vez, com jogador, NPCs de missão (! ?) e o objetivo.
- **Diário (J)**: abas **Principal / Secundárias / Concluídas**; objetivo atual, onde
  fica, recompensa; botão **📍 MARCAR** (uma só por vez).
- **Mapa-múndi (M)**: o `mapa.png` com o jogador, os marcadores das missões, a missão
  marcada e os pontos de viagem já descobertos (toque = viajar, se o Astra já foi
  consertado). Coordenadas de cada região sobre a imagem, em %, como o `LOCAIS` atual.
- **Arquivo** (no menu ☰): Personagens · Bestiário · Lore · Colecionáveis (contador
  por tipo) · **Rejogar luta** (chefes já vencidos).
- **Créditos** (no menu ☰): lê o conteúdo de `CREDITOS.md` (autores, licenças, links),
  mais a lista completa de `creditos/*.txt`.

---

## 3. Esboço dos roteiros

Contagem de tempo: missão principal curta ≈ 3–5 min, com luta ≈ 6–8 min; secundária
≈ 5–10 min; exploração/colecionáveis por fora.

### Capítulo 1 — Tel Aviv: "03:33" (controla o Mecas) — meta 2–3 h

**Parte 1 · Laboratório 5000Z** (interior grande, 4 alas)
1. **Cápsula 5000Z**: acordar (cena de transformação), tutorial de andar e interagir.
2. **Registro do Voluntário**: 3 terminais. O log diz "voluntário nº 1, assinou feliz",
   a câmera de segurança mostra ele sendo carregado desacordado. Não bate.
3. **Contenção**: tutorial de luta, 3 robôs de patrulha *visíveis* fazendo ronda
   (ensina "foi visto = luta").
4. **Sala dos Protótipos**: 1000Z…4999Z quebrados pelo lab, um cartão de acesso.
   Ensina o Arquivo.
5. **O Guardião do Portão** (mini-chefe, relógio no peito em 03:33). Sai pra cidade.

**Parte 2 · A cidade parada**
6. **03:33**: todos os relógios parados; 3 cidadãos "presos no minuto" repetem a
   mesma frase. Falar 3 vezes com cada um quebra o loop por um segundo (pista).
7. **Mirantes**: subir 3 mirantes (porto, praia, terraço de arranha-céu), que
   revelam o mapa e ensinam o mapa-múndi e a marcar missão.
8. **Mercado de Jaffa Congelado**: marionetes de olhos azuis ❄ (cidadãos com o tempo
   roubado), luta.

**Parte 3 · "Eu sou daqui."**
9. **O Guia Que Ninguém Pediu**: o Lambança aparece na "igrejinha da esquina" (a cúpula
   dourada) e entra no grupo.
10. **Tour Oficial**: 4 pontos turísticos onde tudo o que ele explica está errado
    ("aqui é o Rio Piracicaba"). Robôs no fim.
11. **Documento**: cai um RG do bolso dele. Naturalidade: Limeira-SP. Ele diz que é
    falsificação "dos invejosos". (Abre a secundária "Prova Que É Daqui".)

**Parte 4 · O homem do raio**  ← **fim da Etapa 1**
12. **Apagão**: a cidade apaga (noite forçada). O Lambança "vai ali comprar pão" e sai
    do grupo.
13. **Raio na Avenida**: luta contra o Cargas.
14. **O Inimigo do Meu Inimigo**: ele conta quem é o Marcelão; Sentinelas Gélidas; o
    **Cargas entra no grupo** e passa a seguir o Mecas.

**Parte 5 · Caçadores na cidade**
15. **Procura-se: M.B.JW**: cartazes de recompensa pelo Marcelão. Strong Smerg +
    Serrinha acham que o Mecas é capanga dele → luta por mal-entendido.
16. **Trégua Interesseira**: "a gente não trabalha de graça… mas trabalha junto se
    render". Montam o **Quadro de Recompensas** na taverna do porto (secundárias
    "Procura-se"). *(Plantio pra guerra: o quadro tem um contrato lacrado "do reino",
    valor ███, que eles olham com carinho.)*

**Parte 6 · Turistas perdidos**
17. **Placa de Limeira**: Astra quebrado na avenida, Fat Mango + Mameluco; o
    Lambança volta correndo pra negar que conhece os dois → luta (o trio "da
    igrejinha").
18. **Peças do Astra** (3 peças principais pela cidade) → libera o **Táxi do Astra**
    (viagem rápida).

**Parte 7 · Ferro-velho e Muralha**
19. **Ferro-Velho dos Protótipos**: cemitério de robôs com o rosto do Mecas.
20. **Memórias Emprestadas**: um terminal no ferro-velho prova que a lembrança de
    "voluntário" é implantada.
21. **CHEFE: Colosso da Muralha**, a máquina do Marcelão que tranca a Cidade Velha.

**Parte 8 · Cidade Velha à noite**
22. **Ruas Que Não Dormem**: a casa vazia do Careca, a foto dele de cabelo
    cacheado com um garoto de óculos ("...esse sou eu?"), o suporte do rodo vazio.
23. **Coisa da Rainha**: vizinhos falam baixo de "uma coisa da rainha" e de um rapaz
    que foi "pedir um favor no norte" e não voltou. Só referências.

**Parte 9 · A Torre do Relógio**
24. **Eco do Ladrão de Tempo**: holograma do Marcelão no saguão.
25. **Engrenagens**: 3 andares de puzzle (alavancas giram engrenagens; os ponteiros
    andam AO CONTRÁRIO, então é pra alinhar "voltando").
26. **Protótipo-00**: a cópia perfeita do Mecas guarda a escada.
27. **CHEFE: Marcelão Black JW** (time de 3).
28. **CHEFE: Tempo Absoluto** (só Mecas + Cargas). Ele foge pro norte.

**Parte 10 · Epílogo**
29. **Mensageiro do Norte**: o Strong traz a notícia; a Smergula sugou a alma do
    Marcelão.
30. **O Último Recado**: gravação do Marcelão no lab. Protocolo Órfão: robôs
    enlouquecem pela cidade (inimigos novos no mapa).
31. **O Exército de Metal**: o Mecas assume o código 5000Z e recruta 6 androides
    espalhados pela cidade (cada um com uma personalidade). *(Plantio: o Cargas não
    gosta: "você tá falando igual a ele".)*
32. **A Caravana Vai**: Lambança, Mango e Mameluco partem pra Limeira e prometem
    voltar pra guerra ("…pra Tel Aviv, que é minha casa", diz o Lambança, indo pra
    Limeira).
33. **CHEFE: Colosso Órfão** no portão norte. A estrada do norte abre.

**Secundárias de Tel Aviv (16)**
- **Hora Certa**: 12 relógios escondidos; 11 marcam 03:33, um marca 03:34 (ele
  andou um minuto: o último segundo de tempo que escapou do Marcelão → entrada de lore).
- **Pão Quentinho Pra Sempre**: o Fat Mango, "o Padeiro Blindado", entrega pão pela
  cidade. Com o tempo parado o pão nunca esfria ("é o único benefício do apocalipse").
- **Prova Que É Daqui**: 5 provas de que o Lambança é de Tel Aviv; todas são de
  Limeira (carteirinha do clube de Limeira, foto na rotatória, boletim, carnê…).
- **Peças do Astra (Turbo)**: peças extras: som automotivo, buzina que toca
  "Evidências", calota.
- **Procura-se** (quadro dos caçadores): 5 robôs com nome e personalidade:
  *Torradeira Furiosa*, *RB-Fofoqueiro* (conta segredo de todo mundo, inclusive
  pista do Careca), *Semáforo Que Só Fica Vermelho*, *Aspirador Sentinela 3000*
  e *Guarda-Chuva Kamikaze*.
- **Para-raios**: o Cargas carrega 5 transformadores num puzzle de circuito (fio no
  chão, ligar na ordem).
- **Protótipos Esquecidos**: 1000Z (uma torradeira com braço), 2000Z, 2500Z (só a
  metade de cima), 3333Z, 4999Z ("quase").
- **O Rodo do Careca**: o rodo perdido, achado no fundo do porto. O Mecas sente que
  conhece aquele cabo.
- **Cartazes da Rainha**: 8 cartazes de propaganda smerg aparecendo em Tel Aviv. A
  rainha não aparece.
- **Selfie Congelada**: turista paralisado no meio de uma selfie; a foto mostra o
  Marcelão de fundo, saindo da Torre às 03:33.
- **A Fila Que Não Anda**: fila do banco parada desde 03:33. O primeiro da fila
  esqueceu o que veio fazer.
- **Pescador do Minuto**: o peixe dele está no ar há sei lá quanto tempo. Solte o
  peixe.
- **Ônibus 333**: o motorista diz que o ponto final é "o reino". Pista pro Cap. 2.
- **O Androide Que Queria Ser Garçom** (pós-epílogo).
- **Fones do Serrinha**: ele perdeu a coleira com a placa (a placa diz "ORELHA";
  ele esconde) → planta "A Casinha do Orelha".
- **Colecionáveis**: 12 relógios, 8 cartazes, 5 protótipos, 10 "Páginas do Diário
  do Lab" (lore do Projeto 5000Z).

### Capítulo 2 — Smergulus Kingdom: "A Coroa que Suga" — meta 3–4 h

Antes dele, a região **Estradas do Mundo** abre (ponte, floresta, montanha). A
entrada no reino tem uma muralha + guarita; nos Atos I–III o jogo é do ponto de
vista de quem já está lá dentro, então a viagem é feita "no tempo" (cena de
abertura), e o mapa do reino passa por estados (`estado:'antes'|'parado'|'guerra'`).

**Ato I · Origens** (controla o Strong Smerg, nº 77; o Cachorro Orelha segue)
1. **Soldado Nº 77**: quartel, chamada, tutorial do grupo.
2. **Academia Nº 77**: treino; ele levanta o que ninguém levanta.
3. **O Cachorro Orelha**: o Orelha roubou o pão da cozinha real; perseguição no pátio.
4. **Chamado ao Trono**: primeira vez no salão; a rainha olha pro cachorro.
5. **A Maldição**: a rainha amaldiçoa o Orelha → **Serrinha Dog** (cena grande).
6. **Fuga pelos Telhados**: fuga furtiva com cone de visão dos guardas.
7. **Água Que Não Molha**: no esgoto, o Tupas controla a água sem chegar perto dela.
8. **Pedágio de Alma**: Mango + Mameluco erram a curva com o Astra.
9. **Primeiro Contrato**: viram caçadores de recompensa (quadro da taverna smerg).
10. **Justiça Não Tem Preço**: o alvo está escondido atrás dos justiceiros.
11. **CHEFE: Fat Smerg, o Cobrador** (imposto de alma).
12. **O Contrato do Marcelão**: a recompensa pela cabeça dele → partem pra Tel Aviv
    (liga com o Cap. 1).

**Ato II · Enquanto isso** (controla o Tupas; o Careca segue)
13. **Sozinho no Reino**: esconderijo do esgoto, tutorial da água.
14. **O Desertor Pipoca**: o Pipoca troca de lado.
15. **Rebelião dos Bonés**: um capitão chicoteia soldados medrosos.
16. **CHEFE: Capitão-Mor**.
17. **Astra na Contramão (de Novo)**.
18. **Rachadura no Céu**: uma fenda de gelo corta o céu (o Marcelão chegando).
19. **O Ladrão Pede Abrigo**: escondidos no salão do trono, assistem ao acordo.
20. **CHEFE: Sombra da Rainha**, quando o Marcelão tenta fugir.
21. **Almas Subindo**: a rainha mata o Marcelão (cena grande, almas subindo; liga com
    o epílogo do Cap. 1).

**Ato III · O reino parado** (o céu do reino **trava** em 03:33; o ciclo dia/noite
para de verdade nessa região)
22. **O Reino Parou**: só os soldados dela se mexem.
23. **Os Caçadores de Cão**: o Strong e o Serrinha voltam; a rainha quer o "bichinho".
24. **Represa**: a rainha fecha o rio pra afogar o esgoto do Tupas.
25. **Mercado de Almas**: comida paga com pedaço de alma.
26. **CHEFE: Smerg do Relógio Mestre**.
27. **Recado de Tel Aviv**: pombo-correio do Mecas; os soldados querem ele assado.
28. **A Ponte Levadiça**.
29. **O Jantar do Fat Smerg**.
30. **A Rainha Desperta**: "ao amanhecer, eu paro o mundo".
31. **CHEFE: General Smergão**.

**Ato IV · Às vésperas da guerra** (o Mecas chega com os androides; o grupo junta
gente dos dois capítulos e o líder pode ser trocado no menu)
32. **A Chegada**: Tel Aviv no reino.
33. **Metal Contra Boné**.
34. **Mesa de Negociação**: cada facção diz o que quer (alianças frágeis; o jogador
    ouve 4 lados).
35. **Raio e Água**: Cargas + Tupas explodem o cadeado da ponte.
36. **Escada pro Trono**: o Careca sobe; cada degrau é uma lembrança.
37. **CHEFE: Fat Smerg, o Único**.
38. **Relógio de Almas**: o relógio que guarda o tempo do Marcelão.
39. **CHEFE: Rainha Smergula**: ela perde a luta mas **não cai**. Toma as almas do
    relógio e declara guerra **a todos**, inclusive a quem a ajudou.
40. **A Guerra Começa**: o mapa do mundo muda de estado → gancho do capítulo final.
(A Smergula Demônio fica reservada pro final.)

**Secundárias do reino (18)**
- **Procura-se: Smergulão**: cartazes pelo reino; CRIME sempre "██████ —
  proibido de dizer por decreto real". No Arquivo Real, a ficha: "Smerg criado por
  Sua Majestade. Tamanho: GRANDE. Crime: o escrivão desmaiou antes de terminar de
  escrever". Soldados velhos começam a contar e mudam de assunto; um sussurra "ele era
  um de nós". **O crime nunca é revelado em lugar nenhum.**
- **O Escrivão Desmaiado**: ache o escrivão; toda vez que alguém pergunta do crime
  ele desmaia de novo. Recompensa: a pena dele (Arquivo).
- **Só Existe Um Fat**: decreto real; estátua, banquete exclusivo, rampa exclusiva,
  soldados de dieta obrigatória. "Fat-o consumado", "Fat-alidade". O Fat Mango
  aparece com o Astra: "não somos parentes".
- **Contrabando de Coxinha**: leve lanche escondido pros soldados de dieta (sem
  ser visto pelo fiscal do Fat).
- **Academia Nº 77**: os pesos que ninguém mais levanta; o recorde na parede.
- **A Casinha do Orelha**: a casinha com a placa "ORELHA". O Serrinha para e fica
  olhando (cena sem fala).
- **Salva-Vidas do Salva-Vidas**: boias, ponte de gelo, água que o Tupas controla mas
  não atravessa.
- **Minhoca de Estimação**: pistas da maldição do Careca e do rodo dele.
- **Soldado Pipoca**: 4 etapas de "promoção" que ele mesmo inventa.
- **Achados e Perdidos**: um ursinho cor-de-rosa com cheiro de enxofre; ninguém
  chega perto. Leva até a Ilha.
- **Almas no Trono**: uma das almas parou o relógio em 03:33.
- **Imposto de Alma**: recibos de alma pela vila.
- **Coral do Vulcão**: soldados que cantam pra vulcão não explodir.
- **Bonés Perdidos** (colecionável, 15), **Páginas do Arquivo Real** (10), **Estátuas
  da Rainha** (cada uma com um título diferente dela).

### Ruínas da Ilha e Limeira (exploráveis, ≈ 45 min cada)

**Ilha**: chegada pelo píer (barco do porto). Smergulão e Criança Rosa,
desconfiados. Missões: **Prova de Confiança**; **A Lasanha Perdida** (o Cabelin;
recompensa: cura do grupo fora de luta); **O Ursão** (o ursinho dela que virou
urso-demônio — acalmar ou enfrentar); **O Templo Branco**; **Conselho da Ilha** (a
ilha decide de que lado fica, mas guarda carta na manga).

**Limeira**: lava, árvores queimadas, casas em chamas. **Bem-vindo a Tel Aviv… digo,
Limeira** (o Lambança em casa, ainda jurando que é de Tel Aviv); **Oficina do
Astra**; **Casas em Chamas** (resgate); **Limeira Se Arma** (o Corsa vira tanque);
**A Rotatória da Igrejinha**.

### Capítulo final — "A Guerra de Todos" (estrutura; o texto completo só depois de você aprovar)

1. **Convocação**: o mapa inteiro entra em estado de guerra (acampamentos,
   barricadas, estradas tomadas). Você visita cada facção (Reino, Tel Aviv, Limeira,
   Ilha, Caçadores, Justiceiros) e cada uma pede uma coisa.
2. **Quatro Frentes** (em qualquer ordem, mundo aberto): Ponte do Rio, Muralha de
   Tel Aviv, Templo da Ilha, Campos de Lava. Cada frente tem 3–4 missões e um chefe.
3. **Traições** (plantadas nos caps. 1–2): os caçadores aceitam o contrato lacrado da
   rainha; os justiceiros abandonam a aliança pela vingança do Careca; o Cargas rompe
   com o Mecas por causa do código 5000Z; o Ursão foge do controle; o Pipoca vira
   general de alguém.
4. **Todos Contra Todos**: as alianças viram fumaça; lutas de 3 lados (o mapa marca
   "quem está contra quem" por região).
5. **Confronto final** no castelo: Smergula Demônio, com o tempo de duas cidades.
6. **Espaço reservado** pra Adulto Feliz, Fat Girl e Loirinha da CDI: **pergunto onde
   eles moram antes de pôr no mapa**.

---

## 4. Etapas de entrega

| etapa | conteúdo | teste no navegador |
|---|---|---|
| **1** | motor completo (tiles, chunks, colisão, câmera, camadas, ordem por Y, animados, céu), folhas top-down, pintor + região Tel Aviv inteira (160×120) + Laboratório, seguidores, NPC + balão, inimigos visíveis, lutas e volta ao mapa, missões + diário + marcar + seta + minimapa, mapa-múndi, salvamento + migração, controles de toque, Créditos, Condenação adaptada. Roteiro: **missões 1–14** + 3 secundárias | andar 4 direções, colisão, seguidor, falar, marcar, seta, luta e volta, perder e voltar ao save, recarregar a página, 375×812 com joystick |
| **2** | resto de Tel Aviv: missões 15–33, interiores (padaria, taverna, ferro-velho, Cidade Velha, Torre com puzzle), Táxi do Astra, todas as secundárias e colecionáveis do Cap. 1; equilíbrio dos chefes | idem + puzzle, viagem rápida, rejogar chefe |
| **3** | Estradas do Mundo + Smergulus (180×140) com os 4 atos, troca de líder, cone de visão, estados do mapa, secundárias do reino | idem |
| **4** | Ilha (80×80) + Limeira (80×80) | idem |
| **5** | Guerra (depois de você aprovar a estrutura e dizer onde moram Adulto Feliz, Fat Girl e Loirinha) | idem |

Em toda etapa: subir `?v=NN`, `CONTEXT.md` §1.1, `livro.html` (página nova "Modo
História"), `js/patchnotes.js`.

## 5. Migração do save antigo

`historia_progresso.telaviv = N` → missões principais equivalentes concluídas:

| fases antigas vencidas | missões novas concluídas |
|---|---|
| 1–3 | 1–5 (laboratório) |
| 4–6 | + 6–11 |
| 7–8 | + 12–14 (Cargas no grupo) |
| 9–10 | + 15–21 |
| 11–15 | + 22–24 |
| 16–18 | + 25–26 |
| 19–20 | + 27–28 |
| 21–25 | + 29–33 (Cap. 1 completo) |

`smergulus = N` é convertido do mesmo jeito, por ato. Quem migra começa no último
ponto de salvamento da última missão feita, com o grupo certo.

## 6. Equilíbrio

Script de simulação sem interface (o mesmo método do `CONTEXT.md`: `TurnBattle` com
`setDelayIA(0)` e `jogadaDaIA` dos dois lados), rodando cada `LUTA` do roteiro 500
vezes. Faixas: lutas comuns ≥ 75%, mini-chefes 55–70%, chefes de capítulo 35–65%.
Ajuste só por `ajustes` (`hp`, `danoMult`, `spd`, `chefe:true`).

## 7. Arte que vale gerar (o que falta nos pacotes)

Prioridade alta (aparece o tempo todo):
1. **Robô de Patrulha top-down** (grade 4×3 igual às outras), e a variação
   **Sentinela Gélida** (azul-gelo).
2. **Cidadãos de Tel Aviv top-down**: 4 folhas (homem, mulher, idoso, criança), que
   eu recoloro em código pra fazer a multidão.
3. **Androide 5000Z top-down** (Cap. 1 epílogo e Cap. 2 inteiro).
4. **Cachorro Orelha top-down** (o Serrinha antes da maldição).
5. **Arranha-céus de Tel Aviv** vistos de cima (3 alturas, 3×5 a 4×8 tiles, com
   telhado separado).
6. **Mesquita/cúpula dourada** (5×5 tiles) e **Torre do Relógio** (4×4 de base + topo
   alto, relógio parado em 03:33).

Prioridade média:
7. Máquinas do Laboratório 5000Z: cápsula, terminal, tanque de vidro, bancada (tiles
   32×32 / 64×64).
8. Sucata do ferro-velho: pilhas de robô, carcaças de carro, guindaste.
9. Padaria: balcão, vitrine de pão, forno.
10. Colosso da Muralha e Colosso Órfão (2×2 tiles no mapa).
11. Soldado smerg com lança (variação do `smerg_normal`) e Guarda Real.

Até lá eu monto essas peças com tiles combinados (muros, telhados, janelas, cores)
e formas simples desenhadas no canvas. **Nada é baixado da internet.**
