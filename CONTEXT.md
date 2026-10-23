# ARENA FIGHTER — contexto geral do projeto

Jogo de luta pixel-art que roda **direto no navegador**, sem build e sem
framework. É tudo HTML + CSS + JavaScript puro (cada arquivo `js/*.js`
define um módulo global no padrão IIFE, ex.: `const Game = (function(){…})()`).

Tem **dois jogos dentro do mesmo app**:

| Modo | O que é | Arquivos |
|---|---|---|
| **Luta 1x1** (1 jogador, 2 jogadores, online casual) | luta de ação em tempo real, com fôlego, parry, combos e projéteis | `js/game.js` + `physics/input/ai/passives/particles/vfx` |
| **3x3 por turnos** (menu, e a RANQUEADA online) | RPG tático: monta um time de 3, cada um com 5 golpes, passiva e status por turno, num palco com cenário | `js/turndata.js`, `js/turnbattle.js`, `js/turnui.js`, `js/turnfx.js`, `js/turnbg.js`, `js/turnonline.js` |

> **A ranqueada NÃO é mais a luta 1x1.** Rating agora se ganha no **3x3
> por turnos online**. O online casual continua sendo a luta de ação.

> 📖 **REGRA FIXA — o LIVRO DO JOGO precisa ser atualizado.** Existe um
> manual em formato de livro para o JOGADOR, em `livro.html` (arquivo
> separado, com passar de página — ver §8 mais abaixo). Ele documenta
> TODA mecânica do jogo em linguagem de jogador (turno, dano, status,
> passivas, elenco, ranqueada, perfil). **Sempre que uma mecânica nova
> for adicionada, ou uma existente mudar de comportamento** (passiva
> nova, tipo de dano novo, sistema novo como o de perfil, mudança na
> fórmula de dano, etc.) — **a página certa de `livro.html` precisa ser
> atualizada na mesma tacada**, não só o `CONTEXT.md` e o patch notes.
> As três coisas registram o mesmo tipo de mudança pra públicos
> diferentes: `CONTEXT.md` é pra quem mexe no código, `js/patchnotes.js`
> é o histórico versão-a-versão dentro do jogo, `livro.html` é o manual
> "atemporal" pro jogador entender a mecânica sem precisar ler patch
> note nenhum. Esquecer o livro deixa ele desatualizado sem ninguém
> perceber, porque ele não é lido no fluxo normal de jogar.

Os dois modos **compartilham** os personagens (`js/characters.js`) e o
desenho dos sprites (`js/sprites.js` + `js/spritesheet.js`), mas têm
**números de combate separados** — os stats do 1x1 estão em
`characters.js` e os do 3x3 em `turndata.js`.

---

## 1. Onde está cada coisa

```
game-test/
├── index.html          ← TODAS as telas + navegação (goto) + objeto Menu
├── admin.html          ← painel do dono: ESTATÍSTICAS da ranqueada + resetar ranking
├── livro.html          ← LIVRO DO JOGO: manual em formato de livro pro jogador (ver §8 e a regra logo acima)
├── sheet-debug.html    ← ferramenta: mostra como cada spritesheet foi fatiada
├── dev-server.py       ← servidor local sem cache (python dev-server.py → :5577)
│
├── css/style.css       ← TODO o visual do jogo (um arquivo só)
├── assets/<personagem>/*.png ← spritesheets, UMA PASTA POR PERSONAGEM (assets/mecas/, assets/cabelin/…)
│
├── js/
│   ├── hub.js          ← ★ A TELA INICIAL: a "vila" com NPCs e diálogo
│   ├── historia.js     ← ★ MODO HISTÓRIA: cutscenes (N/D), Condenação em lista, Créditos
│   ├── overworld.js    ← ★ MUNDO ABERTO: motor (câmera, chunks, colisão, grupo, NPC, HUD, toque)
│   ├── missoes.js      ← ★ missões, diário, Arquivo, salvamento e migração do save antigo
│   ├── ow_arte.js      ← tiles LPC + autotile, sprites de objeto, folhas top-down, bonecos em código
│   ├── ow_arte_extra.js← móveis recortados dos atlas (auto-apara) + ~120 peças em pixel art (carros, rua, interiores)
│   ├── ow_pintor.js    ← "pintor" de mapas por comandos com semente fixa
│   ├── mapas/*.js      ← uma região/interior por arquivo (telaviv.js, interiores_c1.js…)
│   ├── mapas/interiores_auto.js ← INTERIOR GERADO de toda casa/prédio/loja/galpão (+ padaria, taverna, torre)
│   ├── mapas/interiores_c1b.js  ← os 5 andares da Torre do Relógio (puzzles do fim de Tel Aviv)
│   ├── mapas/estradas.js        ← Estradas do Mundo (liga Tel Aviv ⇄ Reino; Ilha/Limeira travadas)
│   ├── mapas/smergulus.js       ← SMERGULUS KINGDOM (180×140): castelo, vila, quartel, represa…
│   ├── mapas/interiores_c2.js   ← salão do trono, cozinha/arquivo real, Torre das Almas, academia, esgoto
│   ├── roteiro_c1.js   ← Capítulo 1 (Tel Aviv) em missões, NPCs, lutas, coletáveis
│   ├── roteiro_c1b.js  ← Capítulo 1, Partes 5–10 (caçadores → torre → Marcelão → estrada norte) + secundárias
│   ├── roteiro_c2.js   ← Capítulo 2 (Smergulus Kingdom), 4 atos com troca de elenco + secundárias
│   ├── physics.js      ← gravidade, atrito, colisão, knockback (1x1)
│   ├── spritesheet.js  ← carrega o PNG e DETECTA os frames sozinho
│   ├── sprites.js      ← desenha o lutador (sheet ou boneco procedural)
│   ├── particles.js    ← FX: faíscas, poeira, textos, shake, hitstop (1x1)
│   ├── vfx.js          ← efeitos elementais por skill (usa FX)
│   ├── passives.js     ← passivas do 1x1 (hooks onHit, onDamaged, …)
│   ├── characters.js   ← ★ O ELENCO: sprites, animações, stats e skills do 1x1
│   ├── input.js        ← teclado 1P e 2P
│   ├── ai.js           ← IA do 1x1 (fácil/normal/difícil)
│   ├── game.js         ← ★ MOTOR DO 1x1 (o maior arquivo, ~1250 linhas)
│   ├── select.js       ← tela de seleção de lutador
│   ├── catalog.js      ← tela de CATÁLOGO (consulta o elenco inteiro + escolhe SKIN)
│   │
│   ├── turndata.js     ← ★ stats, 4 skills e passiva de cada um NO 3x3
│   ├── turnbattle.js   ← ★ motor de turnos: ordem, dano, status, terreno, IA
│   ├── turnui.js       ← ★ tela do 3x3: palco, cards, skills, log e ANIMAÇÃO
│   ├── turnfx.js       ← efeitos visuais do 3x3 (impacto, projétil, dano)
│   ├── turngolpes.js   ← ★ GOLPES SOB MEDIDA: a animação de cada golpe pelo NOME dele (ver §5.5.1)
│   ├── turnbg.js       ← CENÁRIOS do 3x3 + estruturas (o Corsa) no campo
│   ├── turnonline.js   ← ★ RANQUEADA 3x3 online (host x convidado)
│   │
│   ├── auth.js         ← login (local por padrão, Firebase se configurado)
│   ├── ranked.js       ← rating ELO, perfil e leaderboard
│   ├── net.js          ← matchmaking + canal da partida online
│   ├── online.js       ← fluxo do online (modo → lutador → fila → luta)
│   ├── firebase-config.js  ← ★ config do projeto Firebase
│   └── firebase-init.js    ← liga Auth/Firestore/RTDB (módulo ES)
│
├── firebase.json, .firebaserc, firestore.rules, database.rules.json
├── modohistoria/mapa.png  ← mapa do mundo (Modo História) — tela do mapa-múndi (M)
├── modohistoria/assets/   ← pacotes LPC (tiles 32px) + CREDITOS.md (licenças CC-BY/CC-BY-SA)
├── modohistoria/atlas-debug.html ← ferramenta: grade + coordenada de cada tile de um atlas
├── modohistoria/PLANO_MUNDO_ABERTO.md ← plano das etapas, roteiros e arte que falta
├── assets/topdown/       ← personagens vistos de cima (grade 4×3, ver ow_arte.js)
└── public/             ← página padrão do Firebase (NÃO é o jogo)
```

### 1.0 Modo Espectador — `js/espectador.js`

Assistir ranqueadas ao vivo, sem conta. Entrada: botão **👁 ASSISTIR AO
VIVO** na tela Online ou a Loirinha no Portão da Arena → `screen-aovivo`.

- **Índice**: `aoVivo/<roomId>` no RTDB (leitura PÚBLICA nas regras). Só o
  ANFITRIÃO da ranqueada escreve (`Online.anunciarAoVivo` ao abrir a sala;
  `fase` draft→batalha, `rodada` via `TurnOnline` `opts.onRodada`; apagado
  em `fimDaBatalha`/`limpar` e por `onDisconnect` se ele cair).
- **Assistir** não muda nada pra quem joga: o espectador só OUVE
  `salas/<id>/snap` (estado inteiro que o host já mandava pro convidado —
  desenhado com `TurnOnline.hidratar`), `salas/<id>/ev` (só os
  `draft_estado`) e `salas/<id>/saiu`. Nunca escreve na sala. Esses três
  caminhos ganharam `.read: true` em `database.rules.json`.
- **Tela**: a mesma batalha do 3x3 com `ctrl.espectador` — `minhaVez()`
  é sempre falso (sem botões de golpe), aliado = anfitrião embaixo.
  Nicks vêm da rede: tudo que entra em `innerHTML` passa por `esc()`.
- `Net.assistir/observarAoVivo/...` existem nos dois transportes; no
  loopback só enxerga partidas do mesmo navegador (útil pra testar:
  `Net.setTransport(null)` + `Net.canal(id,'host')` simula um anfitrião).
- ⚠️ As regras novas precisam ser publicadas
  (`firebase deploy --only database`), senão a lista dá PERMISSION_DENIED.

### 1.1 Modo História — MUNDO ABERTO (`js/overworld.js` + `js/missoes.js`)

> 🗺 **Desde a 1.34 o 📖 HISTÓRIA é um RPG de mundo aberto visto de cima.**
> `Historia.abrirMundo()` → `Mundo.abrir()` → `screen-mundo` (canvas + HUD).
> O plano inteiro (etapas, roteiros, arte que falta) está em
> `modohistoria/PLANO_MUNDO_ABERTO.md`. **Pronto (1.36):** motor + Tel Aviv
> inteira + Laboratório + Cap. 1 COMPLETO (até a Estrada do Norte, `cap1_fim`)
> + Estradas do Mundo + Smergulus Kingdom com o Cap. 2 completo (`cap2_fim`).
> Testado de ponta a ponta com lutas automáticas, e todas as secundárias.
>
> **Regiões** (`Mundo.regiao(id, def)` em `js/mapas/*.js`): cada uma é
> pintada por COMANDOS (`js/ow_pintor.js`: `ret`, `mancha`, `poligono`,
> `estrada`, `rio`, `muralha`, `casa`, `predio`, `grande`, `espalhar`, `bordaDe`…)
> com semente fixa (mulberry32) e só é GERADA quando o jogador entra. Ligam-se
> por `saida` (borda, com `trava:{se, texto}` = bloqueio dentro da lore) e
> `porta` (interior: `fora` + `portaFora` no def). `mundi:{x,y,w,h}` = onde a
> região fica no `mapa.png` (%). Tel Aviv = 160×120; lab = 37×34.
>
> **Escala única:** 1 tile = 32 px de mundo; personagem ≈ 56 px (1,75 tile,
> `ALTURA` por personagem em `ow_arte.js`). Zoom INTEIRO na tela, sem
> suavização (~13 tiles de largura no PC, ~10,5 no celular em pé).
>
> **Desempenho:** chão em chunks de 16×16 tiles pré-renderizados em 1:1 (512 px)
> e ampliados (cache LRU de 40). Água/lava cintilam por cima só nas células
> visíveis. Objetos e pessoas ordenados por Y (pés) a cada quadro, só os
> visíveis (baldes por chunk). Colisão: célula (`TERR[t].solido` ou `col`) +
> caixas pequenas de objeto (`col` relativo aos pés, ou `solidoT` em tiles pra
> portão). Laço com dt real preso a 1/30 s. Dia/noite = um `fillRect` + luzes
> pré-renderizadas somadas (`lighter`).
>
> **Arte** (`js/ow_arte.js`): terrenos LPC no formato 3×6 montados em QUARTOS
> de tile (8 vizinhos; prioridade maior desenha a borda por cima) + preenchimentos
> gerados em código (asfalto, calçada, pedra, piso do lab, muro, parede…).
> Sprites de objeto = recorte de atlas (`SPR`) ou peça desenhada em código
> (`peca(nome)`, `predio`, `casa`, `cupula`, `torreRelogio`, `laboratorio`,
> `barraca`). Personagens: `assets/topdown/<id>_topdown.png` (linhas baixo/esq/
> dir/cima, colunas passo-parado-passo, ciclo 0,1,2,1), recortados pelo alfa e
> REDUZIDOS UMA VEZ pra cache; quem não tem folha (`robo`, `sentinela`,
> `androide`, `cidadao:n`, `marionete:n`, `cachorro`) é desenhado em código no
> mesmo formato. ⚠️ A folha do Lambança chama `lambanca_topdown.png` (`FOLHAS`).
>
> **Roteiro** (`js/roteiro_c1.js`, registra em `Missoes.def`): `missao`, `npc`,
> `inimigo` (visível, ronda + cone de visão `visao` → "!" → corre → luta),
> `luta` (`time:'grupo'` = líder + seguidores até 3, `antes`/`depois` = cena
> grande no `screen-historia-cena`, `chefe`, `rejogavel`, `condenacao`),
> `gatilho`, `arquivo`, `coletavel`, `viagem`, `obj` (objeto que o roteiro põe
> no mapa). Passos: `falar`, `ir`, `luta`, `cena`, `coletar`, `investigar`, com
> `aoIniciar`/`aoConcluir` = lista de AÇÕES (`Missoes.fazer`: `fala`, `cena`,
> `luta`, `grupo:'+id'`, `flag`, `ir`, `pos`, `hora`, `arquivo`, `fn`…). Passo
> de luta já vencida antes de chegar nele conclui sozinho (`luta:<id>` / `viu:<id>`).
> Condições são funções `S=>…` (`S.flag`, `S.feita`, `S.ativa`, `S.no(id,n)`,
> `S.noGrupo`, `S.quantos(tipo)`).
>
> **Salvamento:** `localStorage['historia_mundo_v1']` (área, posição, grupo,
> líder, flags, missões, marcada, coletados, arquivo, bônus, `salvoEm`).
> Salva ao trocar de área, ao concluir missão, a cada 30 s e no 🕯 lampião.
> Perdeu luta → `salvoEm`. **Sem migração (1.37):** o save da lista de fases
> antiga deixava quem tinha zerado a versão velha com missões puladas; agora
> `Missoes.carregar()` faz um **reset geral** uma vez por `RESET_VERSAO`
> (`localStorage['historia_reset']`): apaga `historia_mundo_v1` e
> `historia_progresso` e todo mundo recomeça. Subir `RESET_VERSAO` = zerar o
> Modo História de todos de novo. A Condenação (`historia_progresso_condenacao`)
> não é tocada. `R.migracao`/`migracaoMais` ficaram sem efeito.
>
> **Lutas:** `Mundo.lutar(def)` → `TurnUI.iniciarHistoria(time, inimigos,
> {textoSair:'🗺 VOLTAR AO MAPA', ajustes…})`. `ajustes.aliado[i].hpMais`
> (novo no motor) soma o **bônus de história** (`recompensa.bonusHp`, teto 40).
> O inimigo some na hora em que a luta começa e há 3 s de folga na volta.
> ⚖️ **DIFICULDADE (1.48)** — depois do balanceamento da 1.47 (Marcelão
> mais fraco; Mecas, Cargas e Strong +15–20%) e com o bônus de história
> chegando a +40, o mundo aberto tinha virado ~100% de vitória em quase tudo
> (até Marcelão, Colosso, Capitão-Mor e Fat Smerg). Agora:
> - o bot do mundo aberto joga com a **IA esperta** (`botEsperto:true` em
>   `TurnUI.iniciarHistoria` → `iaEsperta` no motor, SEM a Juíza/veredito);
> - **`DIFICULDADE` em `js/missoes.js`**: um `k` por id de luta; `Mundo.lutar`
>   multiplica vida (`ajustes.hpMult`, novo no motor, aplicado depois de
>   `hp`/`hpMais`) e `danoMult` de TODO o lado inimigo por `k`. Os números do
>   roteiro ficam como estão (a Condenação usa eles direto, sem o `k`).
> - Calibrado com um simulador que carrega o roteiro real, segue as missões
>   principais em ordem (grupo, `elenco`, bônus de vida de cada ponto) e roda
>   cada luta no motor (bot = IA esperta; jogador = "jogador médio": IA comum
>   com 1 jogada em 4 sorteada — sem isso IA × IA é determinística e a curva
>   vira degrau 100%→0%; 200 lutas por k, k = 0,80…3,00). Os "Procura-se"
>   foram medidos com Mecas + Cargas (o grupo de quando eles abrem).
>   Metas: tutorial 88% · patrulha 80% · comum 70% · pico/rival/procura-se
>   58% · chefe 45% · final de capítulo 40%. A curva é ÍNGREME (IA × IA é quase
>   determinística): 0,05 de k pode mudar 20–30 pontos — recalibre com
>   varredura, não com bissecção. Mexeu em kit/ficha/roteiro → recalibrar.
>   Ferramentas: `tools/balanco/historia_sim.js` (`node historia_sim.js 200
>   esperta [trecho-do-id]` = % por luta, sem o k) e `historia_grade.js`
>   (`node historia_grade.js 200 [ids,separados]` = varredura → `grade_*.json`).
>   Os grupos das lutas sem missão (inimigo visível, Procura-se) são aproximados
>   no simulador — confira/fixe em `ctxLuta` antes de confiar no número.
>
> **Testar sem jogar à mão** (o painel de navegador embutido estrangula o
> rAF pra ~5 qps): `Mundo._simular(seg, ['arrowleft'])` roda a lógica em passos
> fixos; `Mundo._apertar('e')`; `Mundo.posicionar('jogador',x,y,dir)`;
> `Mundo._previa(0.1)` devolve um canvas com a região inteira; `Mundo._zoom(z)`.
>
> **Condenação no mundo novo:** decidido com o dono do jogo — continua em
> LISTA de fases (Tribunal da vila e ☰ → ⚖ do mundo), gerada das lutas
> `condenacao:true` do roteiro novo (`Missoes.sessoesCondenacao(cap)`). Na
> Etapa 1 ela ainda usa as listas antigas (`TELAVIV`/`SMERGULUS` em
> historia.js); troca quando o capítulo inteiro estiver reescrito.
>
> 🚫 **Lore (regra fixa):** o Lambança é só "Lambança" em qualquer texto. O id
> antigo dele continua no código, mas o nome antigo nunca aparece escrito.
>
> 🏠 **INTERIORES AUTOMÁTICOS (1.35)** — `js/mapas/interiores_auto.js`. Região
> com `autoInteriores:true` (Tel Aviv): todo `p.casa`, `p.predio`, `p.edificio`
> (sprite com porta, ex.: galpão) e `p.grande(..., {interior:'templo'})` SEM
> `entra` ganha porta pra um interior registrado na hora da pintura como
> `'int:<região>:<xPorta>:<yPorta>'` (`OWPintor.portaAuto` → `Interiores.registrar`).
> O tipo sai do comando: casa com `placa` = `loja`, prédio = `predio`
> (escritório ou saguão), `interior:'galpao'|'hotel'|'templo'` força. `interior:false`
> deixa fechado. A semente sai do id (mesma casa = mesmos móveis). O motor
> (`Mundo.mapa`) pinta a região de fora antes se o save parou dentro de um
> `int:` (o interior só existe depois que a de fora registrou). Interiores com
> nome próprio: `Interiores.especial(id, tipo, fora, porta, nome, extra)` —
> `padaria`, `taverna`, `casa_careca`, `torre_terreo`; o `entra` do mapa usa
> `Interiores.entrada(id)` pra cair no lugar certo. Planta: borda
> `parede_topo_casa`, face de parede em 2 fileiras (`p<estilo>_a`/`_b`:
> creme, madeira, tijolo, azulejo, pedra, verde, rosa, vidro), porta embaixo no
> meio; a coluna da porta nunca recebe móvel. Moradores entram por
> `Missoes.def.npc` na hora da pintura. Peça de parede com `interagir` ganha
> `raio:96` (o jogador está uma fileira abaixo).
>
> **Pintor:** `espalhar` não põe nada na frente de porta nem em cima de NPC/
> inimigo do roteiro. **Arte:** `OWArte.novaPeca(nome,w,h,fn,a,col,extra)`
> registra peça desenhada (ganha contorno de pixel art sozinha; `extra.chao`
> = desenhada embaixo de todo mundo, `pecaSemContorno`), `OWArte.spr(nome,
> {img, r, auto:true, colFrac})` recorta do atlas com retângulo APROXIMADO
> (apara pelo alfa no 1º uso). Mesma prioridade de terreno conta como igual
> no autotile (era isso que deixava borda PRETA nos canteiros de flor).
> `detalheChao` sorteia tufo/flor/pedrisco/concha no chunk (custo zero por
> quadro). Robôs (`robo`, `sentinela`, `robo_orfao`) = folha do Mecas
> TINGIDA (`TINTA`). Cidadãos (`cidadao:0..15`, `marionete:n` = congelado)
> = `humanoPixel`, pixel art chibi 32×56 com contorno; os índices 0–7 são os
> que o roteiro já usava (4 = idoso, 5 = kipá, 6 = pescador).
> ⚠️ Cache de `casa`/`predio` é por chave: parâmetro visual novo TEM que entrar
> na chave (a placa não entrava e toda loja saía "FARMÁCIA").
>
> **Testar o mapa sem andar à mão:** no console, abrir o mundo e rodar um BFS
> de alcance a partir da praça pra conferir que toda porta, NPC e objeto
> interagível é alcançável (feito na 1.35: 105 portas + 104 interiores OK com o
> portão da Cidade Velha aberto).
> ⚠️ Só chame `Mundo.mapa(id)` DEPOIS de `Mundo.abrir()` (que carrega as
> imagens): pintar antes deixa `o.s=null` nos sprites de atlas e envenena o
> cache de `casa`/`predio` (casa sem porta/janela) até recarregar a página.
>
> 🧩 **1.36 — itens, puzzles, START, carros, Cap. 2**
> - **Itens** (`R.item(id,{nome,icone,texto})`, aba 🎒 do diário): objeto com
>   `pegar:'id'` some sozinho depois de pego; `precisa:{item,texto}` trava um
>   objeto; ação `{item:'+id'|'-id', n}`; passo `{tipo:'item', item:id|[ids]}`.
> - **Puzzles:** passo `{tipo:'puzzle', flag, local}` conclui quando a flag
>   liga (evento `flag`). Ajudantes em `Missoes.puzzles`: `cadeado(cfg)`
>   (dígitos), `passoSequencia(cfg, quem)` (ordem certa; errou = zera) e
>   `alavanca(cfg, idx)`. Estado em `S.puz`. Objetos com `faz` (função ou ações).
> - **Elenco trocado** (Cap. 2): ação `{elenco:{grupo,lider}}` guarda o grupo
>   atual em `dados.grupoGuardado`; `{restaurarElenco:true}` devolve.
> - **START** (`P` / botão no HUD): `Mundo.escolherLider(id)` entre quem está no
>   grupo. Velocidade a pé por personagem: `VEL_PERSONAGEM` em overworld.js
>   (Cargas 1,4 · Serrinha 1,25 · Fat Mango 0,85…).
> - **Carros:** `Mundo.veiculo(tipo,{nome, vel, desc, area, x, y, dir, se, pode})`
>   (Astra vel 275, Corsa 205; sprites `modohistoria/assets/veiculos/<carro>_<baixo|esq|dir|cima>.png`,
>   gerados no Gemini). Só anda nos terrenos `def.rodavel` da região (padrão
>   `['asfalto']`; Tel Aviv também calçamento/pedra da praça; o reino
>   paralelepípedo, terra batida e a praça roxa). A posição fica no save
>   (`dados.veiculos`) e o carro atravessa `saida` de região. A chegada de uma
>   `saida` precisa cair em terreno rodável, senão o carro chega travado.
> - **Pintor:** a calçada de `estrada` nova NÃO sobrescreve asfalto/paralelepípedo
>   (cruzamento livre). `linha(pts, larg, t, so, nao)` ganhou o `nao`.
> - **Lados das folhas:** as folhas geradas por IA misturam frames virados pra
>   esquerda e direita; a tabela `LADOS` em ow_arte.js diz, por folha, pra onde
>   cada frame das linhas ESQ/DIR olha (`'LRR'`…) e o código espelha o que estiver
>   errado. Folha nova de NPC → conferir e registrar em `LADOS` + `NPC_FOLHAS`
>   (`cidadao:N` usa `assets/topdown/npc_N_topdown.png`; 0–9 Tel Aviv, 16–17 reino).

### 1.1.1 Modo História (lista de fases, hoje só a Condenação) — `js/historia.js`

> **Capítulo 1 — Tel Aviv (25 fases, completo).** Mapa → Tel Aviv abre
> `screen-historia-fases` (lista de fases; cada vitória libera a próxima,
> progresso em `localStorage['historia_progresso'] = {telaviv:N}` — o save
> antigo `{cap1:true}` vira `telaviv:1`). Cada fase em `TELAVIV.fases` é
> `{titulo, sinopse, cenario, time, inimigos, ajustes, intro, outro, chefe}`.
> As falas usam `N(texto)` (narração) e `D(charId, texto, {forma,pose,nome})`
> (personagem fala, sprite + plaquinha com o nome). Botão PULAR / Esc.
> Enredo: Marcelão Black JW criou o Mecas (a lembrança de "voluntário" é
> implantada); Cargas, o homem do raio, é o maior inimigo dele; o Lambança
> é de Limeira mas jura que é de Tel Aviv (o Marcelão o manda "de volta
> pra onde ele veio de verdade" na fase 19 — gancho pro capítulo Limeira).
> Chefes: 10 (Colosso da Muralha, máquina do Marcelão), 19 (Marcelão, time
> de 3) e 20 (Marcelão "Tempo Absoluto", só Mecas + Cargas).
>
> 🎭 **Elenco permitido em Tel Aviv (regra do dono do jogo):** Mecas, Cargas,
> Lambança, Marcelão Black JW, Strong Smerg + Serrinha Dog (dupla de
> CAÇADORES DE RECOMPENSA — nunca guardas/defensores de nada), Fat Mango e
> Mameluco (TURISTAS de Limeira, não moradores), mais robôs e protótipos
> do Mecas. A Smergula é RAINHA do reino dos Smergulus: só é citada, não
> aparece. Adulto Feliz, Fat Girl, Loirinha e Fat Smerg não entram neste
> capítulo. Antes de escrever capítulo novo, confirmar quem pertence ao lugar.
>
> 📖⚖ **DUAS CAMPANHAS (1.33).** O mapa tem abas `📖 CAMPANHA` /
> `⚖ CONDENAÇÃO` (`Historia.trocarModo`, `Historia.abrirMapa('condenacao')`
> abre direto — o Tribunal da vila tem a opção). Modo guardado em
> `localStorage['historia_modo']`; progresso SEPARADO:
> `historia_progresso` (normal) e `historia_progresso_condenacao`. Na
> Condenação: `falasDaJuiza` põe falas da rainha (cenário `castelo`, nome
> "👑 RAINHA SMERGULA — A JUÍZA") ANTES da intro da fase (`comCenario`
> devolve o cenário da fase na primeira fala dela) e um veredito ANTES do
> outro; a luta liga `iaEsperta` + `juiza`. Sem draft/ban: times do
> roteiro. Lore: a rainha fala do PRÓPRIO trono, julgando a lembrança — ela
> continua sem pisar em Tel Aviv. A fase em andamento guarda a campanha
> (`m`) nos callbacks: trocar de aba no meio não mistura progresso.
> Medido (IA comum no lugar do jogador, 300–600 lutas): chefes de Tel Aviv
> normal/condenação — 10: 62/20 · 15: 78/33 · 19: 57/15 · 20: 38/9 · 25: 52/10.
> No Capítulo 2 a IA esperta pesa pouco (muitas lutas contra soldados de kit
> simples): 10: 75/87 · 15: 61/48 · 20: 54/42 · 25: 52/42 · 30: 57/45 ·
> 36: 66/61 · 39: 48/37 · 40: 41/38.
>
> **`opts.ajustes[lado][i]`** (`TurnBattle.iniciar`): por POSIÇÃO —
> `{nome, hp, atk, def, spd, forma, chefe, danoMult}`. É como chefe/elite fica mais
> forte sem personagem novo. **`danoMult` (1.33)** multiplica o dano que
> ELE causa: o dano do kit mora na skill (Soco de Bolso 60), não no `atk`, e
> depois que o Marcelão ganhou golpes de 60 (1.28) as fases dele (Tel Aviv
> 15/19/20, Smergulus 19) ficaram em **0%** — mexer só no `atk` quase não
> mudava nada. Os chefes do Cap. 2 tinham escorregado pra 87–98% e também
> foram recalibrados com `hp` + `danoMult` (números acima). **`chefe:true` resiste ao Selo do Silêncio do
> Lambança** (perde 25% do ataque em vez de 100%): sem isso a luta da fase
> 19 ia a 99% de vitória, porque o selo apaga o ataque de um chefe solo.
>
> ⚖️ **Dificuldade medida** (simulador sem interface, `jogadaDaIA` jogando
> pelos DOIS lados, 800 lutas por fase — a IA joga pior que gente):
> fases comuns 65–100%, picos em 4, 13, 17 e 18 (~65–86%), chefes
> **10 = 62%, 19 = 49%, 20 = 34%**. O Colosso (fase 10) usa o kit fraco
> do robô de patrulha, por isso precisa de ATAQUE bem alto (68) pra
> ameaçar. Os chefes do Marcelão têm `spd` alto
> o bastante pra ganhar TURNO EXTRA (≥1,35× a média do campo) — é isso,
> mais que a vida, que faz eles ameaçarem. A própria Tempestade de Gelo
> dele trava a velocidade de todos em 5 e tira o turno extra enquanto dura.
>
> **Cenários novos** (`turnbg.js`, também entram no sorteio normal):
> `telaviv` (cidade à beira-mar, Torre do Relógio parada em 03:33),
> `muralha` (Cidade Velha à noite), `torre` (relógio gigante, ponteiros
> girando AO CONTRÁRIO).
>
> **Epílogo de Tel Aviv (fases 21–25)** — ponte pro Capítulo 2: o Strong
> Smerg chega com a notícia de que a Smergula sugou a alma do Marcelão
> (ele está MORTO; aparece só como gravação na fase 22), o "Protocolo
> Órfão" enlouquece os robôs, o Mecas assume o código 5000Z e monta o
> exército de androides, e Lambança + Mango + Mameluco voltam de Limeira
> e entram na guerra. Fase 25 (Colosso Órfão) é o novo `final:true`.
>
> **Capítulo 2 — Smergulus Kingdom (40 fases, `SMERGULUS` em
> historia.js).** `requer:{cap:'telaviv'}` — só abre com o Cap. 1
> completo (`liberado()`); progresso em `historia_progresso.smergulus`.
> Atos: I (1–10) origens, antes de Tel Aviv — Strong era o soldado nº 77,
> Serrinha era o CACHORRO ORELHA amaldiçoado pela rainha, os dois viram
> caçadores e pegam o contrato do Marcelão (→ Cap. 1 fase 4); II (11–20)
> enquanto isso — o Marcelão foge pro reino e a rainha o mata na fase 20
> (→ Cap. 1 fase 21); III (21–30) o reino parado pelo tempo roubado;
> IV (31–40) a GUERRA GERAL com Tel Aviv e Limeira. Chefes: 10 (Fat
> Smerg) 66%, 15 (Capitão-Mor) 66%, 20 (Sombra da Rainha) 55%, 25 (Smerg
> do Relógio Mestre) 51%, 30 (General Smergão) 52%, 36 (Fat Smerg, o
> Único) 57%, 39 (Rainha Smergula) 47%, 40 (Smergula Demônio, `forma:1`)
> 36% — mesmo simulador de 500 lutas por fase. Tel Aviv 25 = 51%.
>
> 🎭 **Elenco do reino (regra do dono do jogo):** Smergula é a RAINHA;
> Fat Smerg é o compatriota dela (smerg comum que ficou mais GORDO que o
> normal — único); Strong Smerg é o único smerg que ficou mais FORTE que o
> normal; Serrinha Dog era o Cachorro Orelha; Tupas e Careca vivem lá e
> são JUSTICEIROS (o Careca é de Tel Aviv, mora no reino desde a
> maldição). Os soldados são `smerg_normal` (`historia:true`, folhas
> `smerg_normal.png` = forma 0 e `scary_smerg.png` = forma 1 "assustado",
> só nas cenas) — aparecem SÓ neste capítulo. Mameluco + Fat Mango (com o
> Astra) aparecem às vezes (fases 7, 16, 33). O Pipoca é um soldado comum
> com nome (smerg_normal no time aliado via `ajustes.aliado`).
>
> Cenários do Cap. 2: `reino`, `castelo` (salão do trono, almas subindo),
> `esgoto` (esconderijo dos justiceiros), `campo` (campo de guerra).

(Até a 1.33) o botão **📖 HISTÓRIA** abria `screen-historia-mapa` — hoje
abre o mundo aberto (§1.1) e essa tela ficou só pra ⚖ Condenação: o
mapa do mundo (`modohistoria/mapa.png`) com um PONTO clicável por local
(coordenadas em % sobre a imagem, em `Historia.LOCAIS`). Só o local com
`cap` preenchido tem capítulo pronto — os outros mostram 🔒 e uma dica
"em breve" ao clicar. Progresso (quais capítulos já foram concluídos)
fica em `localStorage['historia_progresso']`, só pra marcar ✅ no mapa.

Cada capítulo é: **cutscene → luta 3x3 → cutscene**, tudo em
`screen-historia-cena` (`Historia.tocarCena`, o mesmo padrão de máquina
de escrever por TEMPO do diálogo do hub) reaproveitando `TurnBG`
(cenário) e `Sprites.renderPose` (personagem) — sem pedir arte nova. A
luta usa o motor normal do 3x3: `TurnUI.iniciarHistoria(idsAliados,
idsInimigos, opts)` monta um encontro ROTEIRIZADO (times fixos, não
sorteados) e devolve o controle pra cutscene no fim
(`opts.aoFim`) em vez da tela padrão de "jogar de novo" — ver o branch
`ctrl.historia` em `TurnUI.render()`. `opts.formaInicial:{charId:forma}`
deixa alguém entrar na luta já numa forma avançada (o Mecas do
Capítulo 1 já sai CIBORGUE, porque a transformação foi a cutscene —
ver `formaInicial` em `TurnBattle.iniciar`, que só ADIANTA forma, nunca
regride, então é seguro fixar o valor inicial ali).

Inimigos exclusivos de capítulo (ex.: `mecas_grunt`/"Robô de Patrulha",
os três mecas fracos do Capítulo 1) entram no `ROSTER` normal
(`characters.js`) e no `FICHAS` normal (`turndata.js`) — para
`Characters.byId`/`Sprites`/`TurnData.ficha` acharem tudo — mas com
`historia:true`, que os tira da montagem de time e do sorteio aleatório
(`Characters.jogaveis()`, usada em vez de `Characters.all()` em
`turnui.js`, `hub.js` e `online.js` para essas duas coisas). `all()`
continua devolvendo o elenco INTEIRO (admin, preload de sprite).

> ⚠️ **Cache**: os `<script>` no `index.html` têm `?v=NN`. Ao editar um
> arquivo `js/` ou o `css/`, **suba o número** — senão o navegador serve
> a versão velha.

---

## 2. Telas e navegação

Todas as telas estão no `index.html` como `<div id="screen-XXX" class="screen">`.
Só uma tem a classe `active` por vez. A troca é a função global
**`goto('menu' | 'team' | 'battle' | 'select' | 'arena' | 'online' | …)`**
(definida no `<script>` do próprio `index.html`).

| id da tela | para que serve |
|---|---|
| `screen-menu` | **o HUB da vila** — não é uma lista de botões (`js/hub.js`) |
| `screen-select` | escolher lutador do 1x1 (`js/select.js`) |
| `screen-arena` | a luta 1x1 (canvas `#arena`, `js/game.js`) |
| `screen-team` | montar o time de 3 — contra a IA **ou** para a ranqueada (`TurnUI.abrirMontagem`) |
| `screen-battle` | a batalha 3x3, local ou online (`TurnUI.render`) |
| `screen-online`, `screen-matchmaking`, `screen-leaderboard` | online e ranking |
| `screen-login`, `screen-signup` | conta |
| `screen-controls` | tabela de controles |

O objeto **`Menu`** (dentro do `index.html`) cuida de: dificuldade, login,
pausa, revanche, ranking e barra de conta.

### 2.1 A tela inicial é uma VILA — `js/hub.js`

Inspirada nos menus de Naruto Shippuden: em vez de escolher o modo numa
lista de botões, você está **num lugar**, com um personagem animado na
sua frente, e é **falando com ele** que o jogo começa.

| ponto | cenário | personagem | leva para |
|---|---|---|---|
| 🌲 DOJO DA MATA | `mata` | Strong Smerg | 3x3 **offline** (montar time, time sorteado, regras) |
| 🌃 PORTÃO DA ARENA | `arena` | Loirinha da CDI | **online** (ranqueada, casual, ranking) |
| 🔬 LABORATÓRIO 5000Z | `laboratorio` | Mecas | catálogo e patch notes |

- **◀ ▶** (clique ou setas do teclado) troca de ponto; o personagem
  **entra andando** pelo lado certo (pose `walk`) e depois fica no `idle`
  animado — é o mesmo `Sprites.renderPose` da batalha 3x3.
- **ESPAÇO / Enter / clique no personagem** abre o diálogo. Cada ponto
  tem uma **árvore de nós** (`raiz()` + `nos{}`): a opção pode `ir` para
  outro nó, `voltar`, `fechar` ou `faz` (a ação de verdade). É o NPC que
  pergunta "ranqueada ou casual?" — os submenus são a conversa.
- O **fundo é o `TurnBG`** (o mesmo dos palcos do 3x3): ele aceita
  qualquer canvas em `ligar()`, então o hub reaproveita os 6 ambientes em
  vez de ter um cenário próprio. Quem entra em batalha depois chama
  `ligar()` de novo no `#bt-bg`, e o hub só desenha enquanto
  `screen-menu` está ativa (`goto()` chama `Hub.abrir/fechar`).
- A **máquina de escrever é por tempo**, não por quadro: com a aba em
  segundo plano o `requestAnimationFrame` cai para poucos quadros por
  segundo e o texto levaria um minuto para aparecer.
- O personagem **sobe exatamente a altura da caixa de diálogo** (medida
  no DOM depois de desenhar): o Dojo tem 4 opções e o Portão tem 5, um
  valor fixo no CSS esconderia quem está falando em um dos dois.

---

### 2.2 Celular — o jogo é 100% jogável no telefone

Tudo mora em `css/style.css`, no bloco `CELULAR` do fim do arquivo. Não
existe versão mobile separada: é a mesma tela com regras a partir de
`@media (max-width:760px)`, mais um bloco de paisagem
(`(orientation:landscape) and (max-height:560px)`).

**As três regras que guiaram tudo:**

1. **Alcance do polegar** — o que decide a jogada (lista de golpes,
   COMEÇAR BATALHA, FALAR com o NPC) fica na metade de BAIXO da tela.
2. **Não rolar no meio da jogada.**
3. **Tamanho de dedo** — nada clicável abaixo de ~44px, nada legível
   abaixo de 8px.

**A tela de batalha é a que mais mudou.** No celular ela vira uma caixa
de altura fixa (`100dvh`, `overflow:hidden`): o **palco fica parado no
alto** e só a **lista de golpes rola por dentro**. Sem isso o jogador
escolhia o golpe embaixo, rolava para cima para tocar no alvo, e rolava
de volta — a cada turno. Deitado, vira **duas colunas** (palco | golpes)
com `display:grid`.

Detalhes que só existem porque quebraram na prática:

- **`#screen-battle.active`, nunca `#screen-battle`.** Foi o pior bug
  desta leva. `.screen{display:none}` é uma CLASSE; qualquer regra de
  celular escrita como `#screen-battle{display:flex}` é um ID e **ganha
  da regra que esconde as telas inativas** — a batalha ficava desenhada
  o tempo todo e comia toda tela que vem DEPOIS dela no `index.html`
  (online, fila, draft, ranking, login, catálogo, patch notes). Hub e
  montagem de time escapavam só por virem antes dela no documento.
  **Regra da casa: se um seletor de id mexe em `display` de uma
  `.screen`, ele PRECISA levar `.active` junto.**
- **`justify-content` no celular.** `.screen.active` centraliza na
  vertical; quando o conteúdo é mais alto que a tela — e no celular
  quase tudo é — centralizar joga o começo para CIMA do topo e o
  `overflow-y:auto` não rola para trás: título e primeiros itens ficam
  inalcançáveis. No celular vira `flex-start` (com `safe center` para
  quem suporta).
- **`dvh`, não `vh`.** `100vh` é a altura da tela COM a barra de
  endereço escondida: os últimos ~60px de toda tela ficavam atrás da
  barra do navegador, e era ali que moravam os botões de ação.
- **`.bt-skills > *{ flex:0 0 auto }`.** A lista de golpes é um flex
  column; sem travar o encolhimento, os botões **ESMAGAVAM** para caber
  em vez de gerar rolagem — a descrição sumia e as etiquetas saíam
  cortadas ao meio, sem barra de rolagem nenhuma.
- **`grid-template-rows: auto auto minmax(0,1fr)`** na paisagem. `1fr`
  quer dizer "no mínimo o conteúdo inteiro", então a faixa crescia até
  caber a lista de golpes toda e a tela voltava a rolar.
- **`align-items:stretch` no grid da paisagem.** `.screen.active` é um
  flex centralizado e essa herança vaza para o grid: o item ficava com a
  altura do próprio conteúdo e transbordava metade para cima — a lista
  de golpes nascia 97px acima do topo da tela.
- **`overscroll-behavior:none` no `body`.** Arrastar a lista de golpes
  até o fim disparava o "puxar para atualizar" e **recarregava a página
  no meio da partida online**.
- **`input{ font-size:16px }`.** Abaixo de 16px o Safari dá zoom sozinho
  ao focar o campo — e não volta. O jogador ficava preso num login
  gigante.
- **`@media (hover:none)` desarmando os `:hover`.** No celular o hover
  fica preso depois do toque: cartas ficavam aumentadas e brilhando para
  sempre.
- **`touch-action:manipulation`** nos botões tira os 300ms que o
  navegador espera para ver se o toque vira duplo-toque (zoom).
- **Desempenho**: as scanlines (`mix-blend-mode`) e o `backdrop-filter`
  dos cards são uma camada de composição do tamanho da tela por cima dos
  canvas animados — no celular derrubavam o quadro a quadro da batalha.
  Ambos são desligados abaixo de 760px.

O que ganhou controle novo no celular: **💬 FALAR** no hub (e **arrastar
para o lado** troca de ponto da vila), **📜** na batalha (abre/fecha o
histórico), **rodapé fixo** na montagem de time, e a ficha do **🔎** vira
folha que sobe de baixo.

---

## 3. Como o sprite é desenhado (vale para os dois modos)

1. `SpriteSheet.load('assets/x.png')` carrega o PNG e **acha os frames
   sozinho**: flood-fill nas bordas marca o fundo → linhas vazias separam
   as **faixas (bands)** → colunas vazias separam os **frames**.
2. Em `characters.js`, cada pose aponta para `{band, frames, fps, loop}`.
   Ex.: `punch: {band:1, frames:[0,1,3], fps:13, loop:false}`.
   `crop` isola o lutador quando o quadro original vem com o oponente junto.
3. `Sprites` desenha:
   - `Sprites.drawChar(ctx, char, o)` → usado na arena 1x1;
   - `Sprites.renderTo(canvas, char, pose, escala, t, forma)` → miniaturas
     (seleção, HUD, montagem de time) — a escala vem do tamanho do quadro;
   - `Sprites.renderPose(canvas, char, {pose, t, animT, form, dir, flash, targetH})`
     → **usado na batalha 3x3**; a escala vem da altura do *idle*, então o
     lutador não muda de tamanho ao trocar de pose no meio do golpe.
   - Se a folha não carregar, cai no **boneco procedural** desenhado à mão
     em `Sprites.draw` (nunca fica tela vazia).

**Formas** (o Mecas): `char.forms[]` tem uma folha por forma.
`Sprites.formOf(char, i)` devolve uma "visão" do personagem já apontando
para a folha certa. `Characters.preload()` baixa todas as folhas na
abertura para ele não piscar vazio na hora da transformação.

---

## 4. Modo 1x1 (`js/game.js`)

Fluxo: `Menu.play()` → `screen-select` → `Game.start(c1, c2, opts)` →
loop `update()`/`render()` a 60fps no canvas `#arena`.

Conceitos principais dentro do `game.js`:

- **fôlego (stamina)**: cada golpe custa; spam cansa e trava a ação;
- **ação/golpe**: `startup → active → recovery`, com `hits[]` que definem
  alcance, dano, hitstun e knockback;
- **posturas (stance)**: skills que ligam/desligam (Rolamento, Porta do Corsa);
- **parry, clash, juggle, ground bounce, super-armadura, i-frames**;
- **passivas**: `js/passives.js`, com hooks `onHit`, `onDamaged`, `onKO`…;
- **transformação por vida**: `atualizaForma(f)` troca a forma do Mecas;
- **online**: quem é *host* simula e manda `snapshot`; o *guest* manda
  `input` (ver `js/net.js`).

---

## 5. Modo 3x3 por turnos

> 🎬 **Animação de ataque (1.25).** TODA skill do elenco tem `pose` (nome
> de uma anim do personagem em `characters.js`, montada com `[faixa,quadro]`
> das folhas — inclusive poses que antes não eram usadas). Personagem com
> formas (Mecas, Smergula, Careca, Soldado Smerg) define a MESMA pose em
> cada forma. `turnui.js` (`iniciarAnim`/`passoAnim`) encena em atos:
> CARGA (só ultimate: `TurnFX.carga` + `TurnFX.banner` com o nome + clarão)
> → corpo: PREPARO → INVESTIDA (`TurnFX.fantasma`, vulto) → GOLPE → SEGURA
> → VOLTA; tiro: MIRA → VOO → IMPACTO; foco: sequência lenta → efeito.
> A sequência da pose é espalhada pelo tempo do golpe via `prog` (0–1) em
> `Sprites.frameFor` — o quadro do impacto cai no impacto, quantos quadros
> a pose tiver. No impacto: pausa de 3–6 quadros (`anim.pausa`),
> `TurnFX.tremer` no `#bt-palco` e o alvo é empurrado; nocauteado fica
> caído onde voou. Corpo a corpo em ÁREA passa por cada alvo em ordem.
> `RITMO` regula a velocidade geral. Golpe dura 1,5–2,5 s; por isso
> `PRAZO_ANIM`=9 s e a IA espera até ~10 s (`tentativas<110` no motor).
> `estiloAnim` só muda a encenação, nunca a mecânica.
> Pra conferir quadros de uma folha: `sheet-debug.html`.

> 🍝 **Cabelin + BARREIRA (1.26).** Suporte da Ilha, fã de lasanha
> (`cabelin`, folha `cabelin_lasanha.png`; `cabelin.png` = ele sem
> lasanha, sobrando pra uma skin). Ult com dois campos novos de skill:
> `custoVida` (paga da própria vida, nunca abaixo de 1) e `barreira:{nome,
> hp, icone}` → `barreiras[time]` no motor (vida própria, some ao
> quebrar, sem limite de turnos; erguer de novo renova). Em `usarSkill`,
> golpe de DANO mirado num time com barreira (1 alvo ou área, não
> confuso) acerta a barreira (área = 1 vez, sem defesa) e `alvos` vira
> vazio → nenhum efeito secundário passa. Ganha até do taunt. O evento
> leva `ev.barreira` (golpe nela) / `ev.barreiraNova`; `TurnUI.barreirasNaTela`
> segura a vida de ANTES até o impacto e mapeia time→lado da tela;
> `TurnBG.desenharBarreiras` recorta a lasanha do quadro 3:0 da folha
> dele. Vai pela rede em `turnonline.js` (serializar/hidratar). IA: ergue
> sem barreira de pé, com vida pra pagar, na rodada 1–2 ou com time
> abaixo de 70%. Passiva `sobras_lasanha` lê `ficha.sobras` (5).
> ⚖️ 1ª versão media 80,6%; cortado tudo menos a muralha (30/50 é regra
> do dono do jogo) → 52%.

> 👤 **Smergulão + ESQUIVA GERAL (1.27).** `aplicarDano` agora usa
> `chanceEsquiva(alvo)` (Instinto + Furtividade + `fumacas[time]`, teto
> 70%) e `contraAtaca(alvo)` (Serrinha sempre; Smergulão com furtividade
> ≥4). Esquiva só contra golpe do OUTRO time. Unidade ganhou `furtivo`
> (0–5), `naMoita`, `modoFurtivo` (liga forma 1 = folha
> `smergulao_escondido.png`, dano ×0,5 em calcularDano) e `esquivouUltimo`
> (skill `bonusEsquiva` multiplica o dano). Campos de skill novos:
> `moita`, `modoFurtivo:N` (liga DEPOIS do dano do próprio golpe),
> `fumaca:{nome,icone,turnos,esquiva}` (por time, some por rodada,
> desenhada em `TurnBG.desenharFumacas` na metade da tela do time).
> Anim pode usar quadro de OUTRA folha: passo `{folha, q:[faixa,quadro]}`
> (`Sprites.frameFor` devolve `_folha`). Pose `escondido` = parado na moita.
> ⚖️ 1ª versão 22,8% → 52% (dano alto, já que 2 dos 4 golpes não tiram vida).

> 🧸 **Criança Rosa + INVOCAÇÃO (1.29).** Duas formas trocadas pela ult
> (`alternaForma`); cada slot tem a versão Demônio em `formaOverride[1]`,
> que ZERA os campos da versão Criança (cura, curaAliado, ambiente) —
> o Object.assign do skillNaForma senão vazaria. Campos novos de skill:
> `curaAliado` (golpe que também cura o aliado mais ferido), `soForma`
> (condicaoSkill trava fora da forma), `invocar:{id, custoPct}` (precisa
> de `aliadoCaido(u)`; cria a unidade nova com `criarUnidade`, id único
> `_N`, no MESMO índice do morto em `times[time]`; entra na próxima
> rodada). O Ursão (`ursao`) tem `invocacao:true` → fora de
> `jogaveis()`/`grid()`. Folha de efeitos `crianca_rosa_poderes.png`
> (fx dos golpes). `formaIcone` na ficha troca o 🦾 da etiqueta de forma.
> UI: `ev.invocou` encena o urso nascendo (pose `surgir` + portal),
> `ev.curaExtra` mostra a cura do ursinho. ⚖️ 31,4% → 48,8%.

> ⚡ **Efeitos de golpe em camadas (1.30).** Além do `fx` (modo
> projetil/alvo/origem), toda skill pode ter `fxOrigem` (em quem usou, no
> começo) e `fxImpacto` (em cada alvo no impacto) — vão no `ev.skill`.
> `terreno.fx` fica FIXO sobre cada unidade do time afetado enquanto o
> terreno durar (`TurnUI.marcarTerrenos`, aparece só depois do impacto
> via `ev.terrenoNovo`); `fx.alpha` deixa o fixo semitransparente.
> Quadro de efeito pode ser `{x,y,w,h}` direto na folha (peça pequena
> demais pro detector). Folha do Cargas: `raio_sprites.png` (mapa no
> comentário dele em characters.js; as esferas 2:0/2:1 têm xadrez pintado).

> 👁 **Cut-in dos olhos (1.31).** Todo personagem/forma tem
> `olhos:{ q:[faixa,quadro], r:[x,y,w,h], folha? }` (a forma manda sobre o
> personagem); `Sprites.olhosDe(char, forma)` devolve o recorte e
> `TurnFX.cutin(olhos, cor, nome, lado)` desenha a faixa na ultimate (sem
> recorte cai no `banner`). Personagem novo: ACHAR os olhos no retrato da
> folha e preencher `olhos` (medido à mão, em frações). Ultimate também
> ganhou `CARGA` maior e `escuroDaUltimate()` → `TurnBG.passo(…, escuro)`.
> Extras: entrada correndo (`entrada`, segura `animando()` ~0,8 s),
> respiração no idle (`dyVivo`), seta de vez (`TurnFX.marcarVez`), vulto na
> esquiva, `TurnFX.cura` (+ verdes), pose `win` pulando no fim.

> ⚖ **Modo Condenação (1.32) — `js/condenacao.js` + `js/condenacao_dados.js`.**
> Ponto `tribunal` do hub (Smergula, cenário `castelo`). Draft LOCAL na
> mesma `screen-draft` da ranqueada (título `#draft-titulo`, fala da rainha
> `#draft-fala`, botões `#draft-acoes` — o TurnDraft limpa os três ao
> iniciar). Bot: `decidirBan` (mais jogado + maior vitória suavizada da
> FICHA; sem ficha → maior `meta`) e `decidirEscolha` (meta + vs×1,3 contra
> os picks do jogador + sinergia×0,9 + 45% do valor pro jogador = negação).
> FICHA = `localStorage['condenacao_ficha_v1']` {charId:{j,v}}, gravada pelo
> TurnUI no fim de todo 3x3 (menos história/espectador) com o time INICIAL.
> Luta: `TurnUI.iniciarCondenacao` → `TurnBattle.iniciar(…, {iaEsperta:true})`;
> a IA esperta (`valorDoGolpe`/`melhorAlvo`/`ameaca`) só age no lado
> 'inimigo'. ⚠️ A tabela de dados é gerada por simulação: mudou balanço ou
> entrou personagem → rode `Condenacao.gerarTabela(60000)` no console e cole
> em condenacao_dados.js (personagem fora da tabela conta como 50%).
> Medido (1500 cada): bot sem nada 50,8% · só draft 56,3% · só IA 53,9% ·
> completo 63,6% contra um jogador que pega pelos mais fortes.
> **1.33:** a IA esperta ficou mais esperta (só ela — a comum não mudou):
> `melhorAlvo` respeita a PROVOCAÇÃO (mira no provocador, que é onde o motor
> manda o golpe), multiplica o valor pela chance de PEGAR (`1-chanceEsquiva`)
> e despreza quem já cai no próximo tique de veneno/sangue
> (`vidaQueOsDotsTiram`); `valorDoGolpe` conta terreno, provocação, `buffEu`,
> recochete, furto de tempo e selo (sem isso ela jogava o Fat Smerg PIOR que a
> IA comum); `valorCura` escolhe a cura que mais devolve vida. Medido: IA
> esperta x comum em 3x3 sorteado = **~60%** (era ~54%). Tabela regerada.
> A rainha COMENTA a luta (`ctrl.juiza` → `falaJuiza`/`#bt-juiza` no
> turnui.js): começo, alguém caiu, ultimate — uma fala a cada ~3,5 s no máximo.

> 🏛 **1.33 — palco DIORAMA, efeitos por elemento e a campanha da
> Condenação.**
> - **Palco**: `.bt-palco` tem altura própria e os cards (`.bu`) são
>   `position:absolute`, postos pelos PÉS (`bottom`). Tudo sai de variáveis
>   CSS no palco: `--w1..3` (largura), `--x1..3` (distância da borda),
>   `--b1..3` (altura dos pés). nth-child(1) = fundo (menor, perto do meio),
>   (3) = frente. Time com 1 ou 2 (história) ganha `.n1`/`.n2` no `.bt-lado`.
>   ⚠️ `.bt-lado` NÃO pode ter z-index (viraria contexto de empilhamento e quem
>   avança passaria por trás do outro time); quem ataca ganha `.atacando`.
>   O card é `.bu-placa` (nome/vida/status, em cima da cabeça) + canvas
>   quadrado redimensionado pro tamanho real × DPR em `dimensionarCanvas()`
>   (no render e no resize — não a cada quadro). `Sprites.renderPose` aceita
>   `chao:{sombra, anel, pulso}` (sombra oval + anel de vez/alvo; com chão,
>   os pés sobem ~8,5% do alvo pra elipse caber). `centroDe` tem cache POR
>   QUADRO (`cacheCentros`) e devolve `w,h,card`; o laço lê posições antes de
>   escrever transforms.
> - **TurnFX** ganhou `elemento(tipo,x,y,forca,h)`, `projetilElemental`,
>   `numero` (pop/forte), `ko` (alma subindo), `zoom` (câmera no `#bt-palco`,
>   junto do tremor em `aplicaCamera`), `anuncio`, `confete`, `efeitoStatus`
>   (lê `ev.alvos[i].efeitos`), `escudo`, `setas`, `rastroVelocidade`,
>   `ondaChao`. Partículas com forma (gota, coração, bolha, brasa, lasca,
>   confete, estrela), teto de 700, e a tela não é redesenhada quando vazia.
> - **Evento**: cada alvo tem `efeitos:[...]` (o que PEGOU: `veneno`,
>   `lento`, `atordoado`, `provocado`, `selado`, `semAtaque`, `tempo`,
>   `buff_<tipo>`…) e `evitou:true` (esquivou e escapou dos efeitos).
> - **Vida sem golpe** (DOT, terreno, ambiente, padaria): `render` detecta a
>   diferença em quem não está no evento, CONGELA a barra e
>   `soltarNumerosPendentes` mostra o número quando a animação acaba.
> - **Campanha da Condenação** (§1.1): `TurnUI.iniciarHistoria(…, {iaEsperta,
>   juiza})`; fim mostra ⚖ ABSOLVIDO / ⛓ CONDENADO.

### 5.1 Dados — `js/turndata.js`
- `TIPOS`: 10 tipos de dano (físico, fogo, veneno, sangramento, elétrico,
  gelo, terreno, sombrio, energia, explosivo) com cor e ícone.
- `PASSIVAS`: uma por personagem (fortaleza, agilidade crescente, instinto,
  padaria, carisma, sugadora, protocolo ciborgue).
- `FICHAS`: por personagem — `hp/atk/def/spd`, passiva e **5 skills**.
  Campos de uma skill: `alvo`, `cd`, `dano`, `vezes`, `dot`, `lentidao`,
  `atordoar`, `drena`, `cura`, `buff`, `terreno`, `estrutura`, `setup`,
  `super`, `formaOverride`, `desc`.
- `TurnData.etiquetas(skill)` → gera as **etiquetas curtas** ("🎯 1 inimigo",
  "🔥 18 de dano", "🕐 recarga 3 turnos") lidas direto dos dados da skill.
- `TurnData.estilo(skill)` → diz qual **animação** o golpe pede:
  `corpo` (vai até o alvo e bate) · `tiro` (projétil) · `foco` (buff/cura).
- `TurnData.skillNaForma(skill, forma)` → devolve o golpe **como ele está na
  forma atual**. É o único lugar que aplica `formaOverride`; motor, botão e
  ficha usam essa função, então o que o jogador lê é o que sai de verdade.

**Alvos** (`alvo`): `inimigo` (1 escolhido) · `aliado` (1 companheiro
escolhido — o beijo) · `todos_inimigos` · `eu` · `aliados` (time todo).
O lado do alvo é **conferido no motor**: online o alvo chega como um id
pela rede, e um cliente adulterado poderia mandar "curo o inimigo".

**Golpes de SETUP** (`setup:true`) — não tiram vida, montam vantagem:

| Golpe | Quem tem | Efeito |
|---|---|---|
| **Smergulite Aguda** 🦠 | Fat Smerg, Strong Smerg, Serrinha Dog | todos os inimigos ficam **10% mais lentos por 5 turnos**. Doses acumulam; quem tem a passiva Fortaleza é imune |
| **CORSA BLINDADO** 🚗 | Fat Mango | estaciona o Corsa na frente do time: **+7 de defesa para todos os aliados por 4 turnos** |
| **AMBIENTE: CHARME** 💗 | Loirinha da CDI | enche a arena de pétalas: **toda cura do campo vale +50% e todo mundo recupera 3/rodada, por 4 rodadas** — vale para os DOIS times |
| **VÉU MALDITO** 🕸 | Smergula | cobre a arena de preto: **veneno/sangramento/queimadura +35% e +1 turno, toda MAGIA +15%, confusão +1 turno**, por 4 rodadas. Como demônio vira **ABISMO** (+50% / +25%, 5 rodadas) |

Golpe repetido entre personagens é normal — a função `smergulite()` devolve
uma cópia do golpe e é chamada nas três fichas.

**Mecas — arsenal que escala com a forma.** Ele tem `formas:[0.50, 0.30]`:
abaixo de 50% de vida vira Quase-Ciborgue, abaixo de 30% vira CIBORGUE 5000Z.
Além do multiplicador de dano da forma, **os quatro golpes são trocados**:

| Base (Humano) | Forma 1 | Forma 2 |
|---|---|---|
| Combo Cibernético 13×2 | Combo Hidráulico 15×2 | **PUNHOS 5000Z** 15×3, energia |
| Arsenal 17 em área | Arsenal Duplo 21 | **RIFLE DE PULSO** 26, alvo único, perfura |
| Criogenia 18, -5 vel | Criogenia Mk-II 22, -7 vel | **NITROGÊNIO LÍQUIDO** 26, -9 vel, 25% atordoar |
| PROTOCOLO 5000Z 28 | CANHÃO DE PLASMA 34 | **PROTOCOLO TOTAL** 40 + 30% atordoar |

**Loirinha da CDI — o SUPORTE** (`assets/loirinha_cdi/lorinhadacdi.png`). Bate pouco de
propósito: ❤158 ⚔17 🛡10 💨14 — a mais frágil do elenco, mas a mais rápida
(age cedo, cura antes do golpe chegar). Passiva **Carisma**: toda cura que
ela faz em OUTRO aliado devolve 40% para ela.
Golpes: **Tapa** (21, 15% de atordoar) · **Bolsada** (27, arremesso) ·
**Beijo Curativo** (cura 34 em 1 aliado escolhido) · **AMBIENTE: CHARME**.

> Ela é marcada com `so3x3:true` em `characters.js` e fica **fora da luta
> 1x1**: entrou com kit de turnos e não tem frame data de ação (hitbox,
> startup, recovery). `Characters.grid()` filtra; `Characters.all()` não.

**Smergula — a SUGADORA DE ALMAS** (`smergula3.png` humana, `smergula2.png`
demônio, ambas `so3x3`). Maga de desgaste: ❤170 ⚔22 🛡9 💨11. Não mata no
golpe — mata no veneno, no sangramento e na confusão, tudo esticado pelo
ambiente dela.

**Transformação por ALMAS** — é a segunda forma de transformar do jogo, e o
gatilho é o oposto do Mecas: ele vira ciborgue *apanhando*, ela vira demônio
*batendo*. Cada golpe que acerta converte dano em almas
(`ficha.almas = {porDano, porGolpe, limite}`); aos 115 ela vira **SMERGULA
DEMÔNIO** e os cinco golpes são trocados por versões com roubo de vida
(+20% de dano, +4 atk, +1 def). A barra de almas aparece no card dela.

| Humana | Demônio |
|---|---|
| Toque Sugador 23, drena 25% | **GARRA DA ALMA** 25, drena 35% |
| Praga Venenosa 15 + veneno 9×4 | **PESTE NEGRA** 14 em área + veneno 9×4, drena 15% |
| Corte Espectral 20 + sangue 7×3 | **RASGO DEMONÍACO** 23 + sangue 11×4, drena 30% |
| Miragem 11 em área + confusão 2 | **LOUCURA** 17 + confusão 3, drena 15% |
| VÉU MALDITO (ambiente) | **ABISMO** (ambiente mais forte) |

> ⚖️ **Como o balanceamento dela foi medido.** Rodei o motor sem interface
> (`delayIA=0`), com a MESMA política de IA nos dois lados, 80 batalhas por
> configuração, trocando só uma vaga do time. Duas coisas apareceram e
> foram corrigidas:
> 1. A confusão sozinha valia a personagem inteira — **56% de vitória com
>    ela, 0% sem ela** — porque o golpe confuso batia SEMPRE no próprio
>    time (dano dobrado: eu não levo e ele se machuca). Agora sorteia no
>    campo inteiro, com 35% de chance.
> 2. Veneno em ÁREA multiplicado pelo próprio ambiente compõe rápido
>    demais (uma PESTE NEGRA valia ~300 de dano). Área e ambiente foram
>    contidos.
>
> Resultado: ela mede **15%** na vaga do time A e **36%** do outro lado,
> dentro da faixa do elenco (6%–34%). O simulador está em
> `window.simular2` se você quiser refazer a conta — é só colar a política
> e chamar.

**Adulto Feliz — o TANQUE humano** (`adultofeliz2.png` — a folha SEM texto
na camisa; `adultofeliz.png`, a original com texto, ficou órfã em
`assets/` mas não é mais referenciada, `so3x3`). Primeiro
personagem `race:'humano'` de verdade do elenco (os outros "humanos" da
folha são todos Smergulus/Limeirense/Meio-Anjo/etc., uma variação por
cima). A maior vida do jogo (200), ataque baixo de propósito — quem
carrega o dano é o `escalaVida` embutido em cada golpe (bônus proporcional
à VIDA MÁXIMA de quem bate, não à atual).

Passiva **Estofado**: 10% menos dano + cresce +3 de defesa por turno dele
(até +18). A ULT, **BIZARRICE**, não causa dano: rouba a ultimate de
**qualquer personagem em campo — aliado ou inimigo** — e a deixa pronta
no lugar da própria Bizarrice; quem perdeu fica com a própria ultimate
travada em recarga total. Ver `roubar`/`skillEfetiva` em §5.2.

> ⚖️ **Como o balanceamento dele foi medido.** 150 batalhas simuladas por
> configuração (motor sem interface, `delayIA=0`, mesma IA nos dois lados,
> trocando só uma vaga do time — mesmo método da Smergula acima). Duas
> coisas apareceram e foram corrigidas:
> 1. `escalaVida` na vida ATUAL (não máxima) criava uma espiral: o tanque
>    que mais apanha vira o que menos bate, bem na hora que o time mais
>    precisa — **19-25% de vitória**. Trocado para vida máxima, o dano
>    fica constante a luta inteira.
> 2. A passiva só crescia devagar, sem nenhuma redução desde o turno 1
>    (todo tanque do elenco — Fat Smerg, Mameluco — tem Fortaleza, -25%
>    FLAT imediato). Estofado ganhou os 10% flat + o crescimento subiu de
>    +2/turno (teto 10) para +3/turno (teto 18). Ataque e velocidade
>    também subiram um pouco (ele nunca acumulava vantagem de dano por
>    ser sempre o mais lento a agir).
>
> Resultado: **~45% de vitória** (oscila 40-55% entre baterias de 150),
> dentro do teto de 60% e na mesma faixa do resto do elenco. O simulador
> não ficou preso num console desta vez — `TurnBattle.jogadaDaIA` agora é
> exportada de propósito (ver §5.2) exatamente para isso: rodar a mesma
> política de IA dos dois lados sem precisar reescrever nada.

**Fat Girl — canhão de vidro de alvo único** (`assets/fat_girl/fat_girl3.png`,
`so3x3`). Raça `humano`. **Canhão de vidro literal**: a menor vida do jogo
(145, o resto vai de 164 a 200) e a menor defesa (8, o resto vai de 9 a
15) — o ataque base (23, ver nerf 1.19 abaixo) já não é mais o topo do
elenco, mas o que realmente carrega ela são os maiores `dano` por golpe
(40/52/64/52, contra 6–29 de todo mundo). Todo golpe (básico e ultimate)
tem `alvo:'inimigo'`, nunca área: ela é a única do elenco sem NADA de
área, cura, setup ou suporte, e o dano por golpe é a troca por isso.

Passiva **Fúria de Nunchaco**: 18% de chance de ATORDOAR o alvo em
QUALQUER golpe que ela acerta, não só na ultimate. Apesar do nome (mantido
por história/lore), ela não usa mais nunchaco nenhum — ver ultimate abaixo.

ULTIMATE **MEDITAÇÃO BRANCA** — não é um golpe, é uma **POSTURA**
(`meditarStack`, ver §5.2). Ela **não perde turno nenhum**: joga todo
turno, e meditar é uma das coisas que pode escolher fazer no turno dela —
o preço é só não ter batido nele. Cada meditação **DOBRA o ataque atual**
até o teto de **140** (27 → 54 → 108 → 140, a 3ª meditação já não dobra
mais — rende só o resto até o teto), o ganho vai
para `atkPerm` e **não expira**, e ela ergue a guarda (+10 de defesa por 3
turnos). A pose fica travada na `special` (sentada de pernas cruzadas,
sem o balanço do idle e ignorando a reação de dano) até ela **atacar** —
quem tira ela da meditação é o jogador, com um golpe que fere; meditar de
novo, defender ou apanhar não tiram. Ver `desenharSprites` em
`js/turnui.js` e o campo `emMeditacao` da unidade.

> 🎨 **Sprite trocada de novo (3ª folha).** As duas anteriores
> (`assets/fat_girl/fat_girl.png` e `assets/fat_girl/fat_girl2.png`) ficaram órfãs em
> `assets/`. A atual (`assets/fat_girl/fat_girl3.png`) segue o corte automático
> normal do resto do elenco. Bandas com pose duplicada/misturada com um
> boneco de referência (ex.: faixas 3 e 6) foram deixadas de fora do
> mapeamento — só as poses limpas (soco, chute, segurando a bola branca,
> a MEDITAÇÃO, caída/nocaute, andando) entraram nos `anims`.
>
> A pose de **derrotada** (`ko`) é a exceção que precisou de `crop`: o
> quadro 9:2 é largo (149×60) e traz TRÊS coisas juntas — ela sentada
> tonta à esquerda, o jato de gosma atravessando o meio e, só na direita,
> ela caída de verdade. Desenhado inteiro, o nocaute virava um borrão
> branco com duas Fat Girls; o recorte `[0.40,0.54,0.60,0.46]` isola só a
> parte deitada e a poça em que ela cai.

> ⚖️ **Como o balanceamento dela foi medido (versão 1.11 — a que vale).**
> Mesmo método de sempre (motor sem interface, `delayIA=0`, mesma IA nos
> dois lados), agora com times de 3 sorteados dos DOIS lados e 4000
> batalhas — cada personagem acumula vitórias/participações, então o viés
> de lado se dilui sozinho.
>
> O problema herdado das versões 1.8–1.10 (histórico logo abaixo) era que
> ela tinha sido "consertada" pela DEFESA, e só por ela: def 53 num jogo
> onde o resto vai de 9 a 15. Como o corte é `100/(100+def*4)`, isso a
> fazia levar 32% do dano cru contra 66% de um def 13 — a personagem de
> menos vida do jogo era, na prática, a mais dura do elenco, mais que os
> dois tanques (que ainda têm Fortaleza). Medindo: com o kit original
> INTEIRO (atk 32, golpes 32/44/58, buff +133), só trocando def 53 por
> def 13 ela ia de 56% para 17% de vitória. Nada do resto importava.
>
> Duas coisas foram feitas:
> 1. **Números na régua**: vida 150→165, atk 32→27, def 53→13, golpes
>    32/44/58/44 → 28/36/44/36, bônus da ultimate +133→+50.
> 2. **A ultimate parou de ser uma armadilha**: meditar custava o turno do
>    lançamento + 2 turnos meditando + o turno de acordar = 3 turnos
>    parados numa luta que dura ~6. Com o mesmo kit, TER a ultimate dava
>    **29%** de vitória e NÃO ter dava **47,6%** — e aumentar o bônus não
>    resolvia (nem com força +100 ela passava de ~15%: morre parada).
>    Agora é 1 turno de meditação e ela **acorda já agindo**
>    (`iniciarTurnoAtual`), com uma blindagem curta cobrindo exatamente a
>    janela imóvel — sem essa blindagem cai de 48,4% para 42,3%.
>
> Resultado: **57,7% → 47,1%** de vitória, no meio de um elenco que hoje
> mede de 38,6% (Mameluco) a 59,5% (Strong Smerg / Serrinha Dog).

> ⚖️ **1.19 — nerf pedido pelo dono do jogo, ainda não remedido.** Dois
> cortes, sem simulação nova ainda (os números de vitória das notas
> abaixo continuam sendo a referência histórica, de ANTES desta rodada):
> - **Ataque base 27→23** — ela estava empatada com o Strong Smerg no
>   topo do elenco (17-27 no resto); a régua de dano dela já vem dos
>   `dano` fixos de cada golpe (ver o texto acima), então o atk base
>   pesava pouco na conta — um corte aqui reduz o piso sem mexer no que
>   faz ela ser canhão de vidro.
> - **Guarda da meditação (`buffEu` blindagem) 10→6** — ela já estava no
>   TETO da faixa do resto do elenco (+6/+7/+8); 6 alinha ela com a ponta
>   BAIXA da mesma faixa em vez da alta. A duração continua 3 turnos —
>   só o quanto protege por turno que caiu.
>
> Ver `js/turndata.js` (comentários ao lado de `atk` e `buffEu` na ficha
> dela) pros detalhes. Fica pendente rodar o simulador de 4000 batalhas
> de novo pra medir o efeito real.

> ⚖️ **1.15 — nerf: meditar até o fim parou de ser a jogada ótima.** A
> 1.14 tinha resolvido o balanço AGREGADO (44,8%, dentro da faixa), mas
> deixou passar um problema de ESTRATÉGIA: stackar as 3 meditações e só
> depois atacar tinha virado a jogada mais forte do jogo, não uma opção
> entre outras. Medido com uma estratégia FIXA — "medita 3x, depois ataca
> sempre, sem reagir a nada" — que é o pior caso possível, sem nenhuma
> leitura de jogo:
> - **Sem proteção do time**: 34,9% de vitória.
> - **Com um taunter segurando os 3 inimigos** (testado com o Mameluco
>   usando Provocação Geral toda vez que sai de recarga, pra ela meditar
>   em paz): **52,9%** — maior que a taxa de QUALQUER personagem do
>   elenco, incluindo o Strong Smerg.
>
> A raiz era o teto de ataque de 180 empilhado em cima dos golpes já
> fortes da 1.14: o Golpe de Quadril, no teto, acertava **~95 de dano
> pós-defesa** — quase um character-kill de um golpe só, num elenco de
> 145 a 200 de vida.
>
> Ajuste: teto da meditação 180→**140** e os 4 golpes normais
> 46/60/74/60→**40/52/64/52**. O mesmo golpe no teto cai pra ~78 pós-
> defesa (-18%). Medindo de novo com a MESMA estratégia fixa: "medita 3x"
> caiu para **31,8%** sem proteção e **44,2%** protegida — abaixo até de
> NUNCA meditar (47,1% e 55,2% nos mesmos dois cenários). Meditar até o
> fim deixou de ser o combo óbvio e virou uma aposta que só compensa se
> ela sobreviver pra gastar o dano extra.
>
> Taxa geral (4000 batalhas, times de 3 sorteados): **44,8% → 37,5%**,
> na cauda de baixo de um elenco que vai de 37,5% a 62,6% — ela é a mais
> fraca da tabela agora, de propósito.

> ⚖️ **1.14 — canhão de vidro de verdade: 44,8%.** Pedido do dono do
> jogo: menos vida, menos defesa, e a ultimate não podendo dar tanta
> defesa — o dano alto é a identidade dela, não o problema. Vida
> 165→**145** e defesa 13→**8** (as duas menores do jogo), guarda da
> meditação +30→**+10**, e os golpes 28/36/44/36 → **46/60/74/60**.
> Medido em 4000 batalhas: **44,8%**, dentro da faixa do elenco (38,2% a
> 60,4%), de propósito um pouco abaixo da média — é a personagem que mais
> depende do time segurar a barra pra ela.
>
> Dois números para quem for mexer nisso depois:
> - **O dano satura.** Com vida 145 e defesa 8: golpes em 28/36/44 =
>   29,4%; 40/52/64 = 38,7%; 46/60/74 = 46,9%; 50/65/80 = **46,6%**, ou
>   seja, empatado. Passando de ~46/60/74 ela morre antes de gastar o
>   dano a mais (é sempre alvo prioritário da IA, por ter a menor vida) —
>   número maior na tela deixa de virar poder.
> - **Na guarda da meditação, a DURAÇÃO vale mais que o valor.** Os
>   mesmos +10 de defesa por 2 turnos dão 37,8% e por 3 turnos dão 45,9%:
>   3 turnos cobrem a sequência inteira de meditações do começo da luta.
> - Aumentar a VELOCIDADE é o atalho tentador e foi descartado: spd 14
>   leva ela a 52,9% e spd 15 a 62,1%, porque cruza o limiar de turno
>   extra (≥1,35× a média do campo) e ela passa a agir duas vezes por
>   rodada. Fica registrado como o botão de emergência, não como ajuste
>   fino.

> ⚖️ **1.13 — a meditação virou POSTURA (números da época: 50,3%).**
> Pedido do dono do jogo: ela joga todo turno, meditar dobra o ataque
> (teto 180) e ela só sai da pose quando o jogador ataca. Isso tira do
> jogo o "turno perdido", que era o eixo de todos os problemas anteriores
> — o que sobra é uma escolha por turno: bater agora ou valer o dobro
> depois. Medido do jeito de sempre, 4000 batalhas:
> **37,4% → 50,3%**, o meio exato de um elenco que vai de 36,4%
> (Mameluco) a 60,7% (Strong Smerg).
>
> Dois números que decidiram o ajuste:
> - **A guarda da meditação é o que paga o turno parado.** Com os +12 de
>   defesa antigos a postura mede 41,4%; com **+30** por 2 turnos, 50,3%.
>   Ela tem a menor vida do jogo e é alvo prioritário da IA — sentar sem
>   se proteger é entregar o turno.
> - **Meditar sem parar é ruim, e isso está certo assim.** Medindo por
>   quantas meditações a IA faz: nenhuma = 48,2%, uma = 44,1%, duas =
>   38,4%, três = 37,5% (com a guarda antiga). A postura é uma aposta: o
>   ataque dobra, mas cada turno sentada é um turno em que os três
>   inimigos batem de graça. Por isso a IA medita só nas duas primeiras
>   rodadas e só acima de 70% de vida.

> ⚖️ **Ajuste 1.12 (substituído pelo 1.13), e o que ele custava.** A
> meditação voltou a durar **2 turnos** e o bônus subiu para **+80** de
> ataque (a blindagem da meditação acompanhou: +12 por 3 turnos, pra
> cobrir a janela inteira parada). Medido do mesmo jeito, 4000 batalhas:
> **47,1% → 37,4%**. O segundo turno parado custa ~10 pontos e o +80 não
> paga por ele — o ataque entra no dano com peso 0,35, então +80 vale
> ≈ +28 por golpe, por 4 turnos, uma vez a cada 6, enquanto o turno
> perdido é dano zero **e** um turno inteiro apanhando. Fica registrado
> para quem for mexer: para trazer ela de volta ao meio da tabela **sem**
> encurtar a meditação, o caminho já medido é engrossar a blindagem dos
> turnos parados — com +45 ela volta a ~47,8%.

> 🗃️ **Histórico (1.8–1.10) — por que ela chegou tão torta.** Vale como
> registro do que NÃO funcionou:
> 1. Primeira versão (atk 28, def 8, dano baixo, ultimate de buff
>    instantâneo) testava **~15% de vitória** — o ataque mais alto do jogo
>    não adiantava porque ela morria por volta da rodada 4 em quase toda
>    partida: sendo sempre a vida mais baixa do próprio time, vira alvo
>    prioritário da IA inimiga desde o primeiro turno. Subir a DEFESA bem
>    acima do resto do elenco (8→36) foi o que resolveu, fechando em
>    ~41-45%. Também foi corrigido um bug de IA que afeta qualquer
>    ultimate `super:true` com `dano:0` (só buff): não entrava no critério
>    "usar super assim que carregar" em `jogadaDaIA`, que só considerava
>    `dano>0` — ajustado pra também aceitar `buff`.
> 2. Pedido pra virar CANHÃO DE VIDRO de verdade, medida contra o Strong
>    Smerg (~57-61%) como referência: defesa reduzida (36→32) e o `dano`
>    de cada golpe quase dobrado (mantendo o ataque base igual). Fechou em
>    ~59-61%.
> 3. Ultimate trocada pela MEDITAÇÃO BRANCA (perder um turno inteiro sem
>    agir): a taxa caiu pra **~31%** na primeira tentativa — um turno
>    inteiro exposta sem revidar sai caro. Compensado com o bônus da
>    ultimate MUITO mais alto (+23→+80 de ataque) e mais um pouco de
>    defesa (32→38, e depois 53) pra sobreviver ao turno vulnerável.
>    Fechou de novo em **~56-58% de vitória** (1200 batalhas simuladas),
>    bem perto do Strong Smerg — mas pagando com a defesa de um tanque
>    numa personagem que devia ser de vidro, que é justamente o que a
>    versão 1.11 desfez.

**Marcelão Black JW — o LADRÃO DE TEMPO** (`assets/marcelao/marcelao_black_jw2.png`,
`so3x3`). Raça `humano`. Personagem novo (v1.20/1.21, sem histórico de
balanço ainda — os números de `hp/atk/def/spd` são um chute inicial
dentro da régua do elenco, não uma medição). Kit gira em torno de
RECARGA, não dano bruto: **Furto de Tempo** atrasa a recarga do alvo e
adianta a dele (a mesma quantidade dos dois lados, ver `roubarTempo` em
§5.2), **Moeda Fatal** recocheteia sozinha pelo time inimigo — um alvo
novo a cada quique, com uma chance fixa de continuar (`recochete`, ver
§5.2), **Escudo Temporal** é uma ESTRUTURA (`estrutura.recarga`, ver
§5.2) que SÓ adianta a recarga do time inteiro a cada rodada (menos a
ultimate de cada um) — de propósito SEM dar defesa nenhuma, pra não
duplicar o nicho do Corsa Blindado do Fat Mango — e a ultimate
**TEMPESTADE DE GELO** cria
um AMBIENTE — a arena inteira congela: todo mundo em campo (dos DOIS
times) trava na mesma velocidade, e toda skill usada por qualquer um
demora mais pra recarregar enquanto durar (`ambiente.velocidadeFixa` e
`ambiente.recargaExtra`, ver §5.2). A passiva **Ladrão de Tempo** rouba
um pouco de tempo de graça: 35% de chance, no fim de cada turno dele, de
adiantar 1 turno de recarga de uma skill sua sorteada.

> 🎨 **Duas folhas, uma escolhida.** O personagem veio com duas
> spritesheets (`marcelao_black_jw.png` e `marcelao_black_jw2.png`,
> ambas em `assets/`) — a segunda foi escolhida pra `char.sheet` por ter
> o ciclo de corrida e um soco limpo que a primeira não tinha; a primeira
> ficou órfã (mesmo padrão da `fat_girl.png`/`fat_girl2.png`, ver acima).
> A folha usada tem só 3 poses de combate de verdade pro motor usar
> (`punch`/`ranged`/`special` — ver poseDeAtaque em `turnui.js`), então
> `estiloAnim` é usado em duas skills pra forçar a pose certa: a MOEDA
> FATAL é `tipo:'fisico'` (cairia em `punch` por padrão) mas leva
> `estiloAnim:'tiro'` pra usar a pose de arremesso; a ultimate virou um
> golpe `alvo:'eu'` sem dano (cairia em `foco`→`special` sozinha, na
> real não precisou de `estiloAnim` nenhum — ficou só de exemplo de como
> resolver esse tipo de conflito se aparecer de novo num golpe de área).
>
> ⚠️ **`idle` de uma frame só = personagem "de estátua".** A primeira
> versão usava `band:0, frames:[0]` (o retrato grande da folha) como
> idle — sem um segundo quadro pra alternar, ele era o ÚNICO do elenco
> sem nenhum balanço no parado (todo o resto do elenco cicla 2-3 quadros
> no idle). Trocado pra `band:6, frames:[2,3]` (duas poses paradas da
> MESMA altura — 73px nas duas — senão ele "pulsaria" de tamanho a cada
> troca, ver o aviso do Adulto Feliz). Vale de lição pra qualquer
> personagem novo: o quadro de retrato/capa da folha raramente é o
> quadro certo pro `idle` de batalha.

**Cargas — o ELÉTRICO mais RÁPIDO do elenco** (`assets/cargas/cargas.png`,
`so3x3`). Raça `humano`. `spd:14` — o resto do elenco vai de 6 a 13, então
ele SEMPRE age primeiro (e frequentemente ganha o turno extra por
velocidade, ver `novaRodada` em §5.2). Dano de propósito "nem muito forte
nem muito fraco" (atk 18, no meio da régua): quem carrega o kit é a
CHANCE DE ATORDOAR, tanto embutida nos 4 golpes (8%–12%) quanto na
passiva **Condutor** (8% em QUALQUER golpe que acerte — mesmo hook
genérico que a Fúria de Nunchaco da Fat Girl usa, só que com um id
próprio, ver `CHANCE_ATORDOAR_PASSIVA` no motor).

A ULTIMATE, **TEMPESTADE ENCURRALADA**, não é o golpe mais forte dele —
é uma ARMADILHA: acerto imediato em todos os inimigos e um TERRENO
(`Campo Elétrico`) que fere o time inimigo por 2 turnos, com o dano
calculado a partir da PRÓPRIA velocidade dele no momento do cast
(`terreno.escalaVelocidade`, novo — ver o item dedicado em §5.2).

> ⚖️ **Nerf de emergência (medido) — a passiva DOBRAVA com os próprios
> golpes.** Versão original: `atk 20 / spd 16`, atordoar 12%–20% em CADA
> golpe E MAIS 20% da passiva Condutor no MESMO golpe — dois sorteios de
> atordoar por acerto, em cima do personagem mais rápido do jogo (quase
> sempre age primeiro E ganha turno extra). Simulado sem interface
> (motor com `jogadaDaIA` nos dois lados, times de 3 sorteados, ver
> `jogadaDaIA` exportada de propósito em §5.2): **94% de vitória** em 50
> batalhas — bem acima do teto de 60% do resto do elenco — e **4,7
> atordoamentos causados por jogo**, contra 0,6 do segundo colocado
> (Loirinha da CDI). Ajuste: `atk 20→18`, `spd 16→14`, atordoar dos 4
> golpes cortado quase pela metade (12/20/15/20% → 8/12/10/12%), a
> passiva Condutor 20%→8%, e o multiplicador do terreno 0.5→0.35. O
> golpe continua identificando ele como "o que mais atordoa" (2,0/jogo,
> ainda o maior do elenco) — só que sem virar auto-vitória: **53,3%** em
> 4000 batalhas, dentro da faixa do elenco (22%–62%). Ver `js/turndata.js`
> e o `CHANCE_ATORDOAR_PASSIVA` em `turnbattle.js`.

> 🎨 **Folha com 5 faixas de ação, só 2 slots de pose usáveis no
> motor de turnos.** Igual o Marcelão (`punch`/`ranged`/`special` são as
> únicas poses que `poseDeAtaque` em `turnui.js` sabe escolher), a folha
> do Cargas tem MAIS animações do que o motor consegue mostrar: a faixa
> 2 (braços erguidos canalizando + explosão) ficou de fora, sem slot que
> sobrasse. Duas skills usam `estiloAnim` pra fugir do padrão (`tipo:
> 'eletrico'` cairia em `ranged` por padrão nas duas): a INVESTIDA
> RELÂMPAGO leva `estiloAnim:'corpo'` pra puxar a pose `punch` (o borrão
> de velocidade da faixa 4); a ultimate leva `estiloAnim:'foco'` pra
> puxar `special` (corpo em chamas azuis + raio erguido da faixa 5) em
> vez de repetir o arremesso do Choque Rápido. A faixa 3 (orbe + escudo
> + onda), sem nenhuma skill que precisasse dela, virou o `win`.

> 💀 **1.47 — REWORK DO CARECA (kamikaze).** O texto logo abaixo descreve o
> kit ANTIGO (Encarada, Véu nas duas formas); o que vale agora: o humano paga
> com a PRÓPRIA VIDA — campo de skill novo `sacrificio:{ valor | pct (da vida
> ATUAL) | tudo:true, danoPorVida }`. Em `usarSkill` o pago é calculado ANTES
> do dano (`base += pago×danoPorVida`) e a vida sai DEPOIS do golpe (ele ainda
> bate com tudo), com `checarMorte(unidade)` — ao contrário do `custoVida` da
> Muralha de Lasanha, PODE matar, e aí a Maldição agenda o verme. `ev.sacrificio
> = {pago, morreu}` (o turnui mostra "-N 💀" e "a maldição se mexe").
> Kit humano: Esfregada Raivosa (paga 8, cd0) · Estocada do Cabo (sem custo) ·
> Chão Ensaboado · Pancada Kamikaze (paga 35% da vida atual) · ult ENTREGA À
> MALDIÇÃO (`tudo:true`, área — cai na hora). Verme: os mesmos 4 de veneno e a
> ult vira o VÉU MALDITO (`formaOverride[1]` = `veuMaldito()` com
> `sacrificio:null`). `ficha.verme` agora ❤96 ⚔19 🛡7 💨12; humano ❤170 🛡9.
> Sprites refeitas do .webp original: remoção do xadrez CÉLULA POR CÉLULA
> (grade de ~12,2 px detectada pelas transições, cor esperada de cada célula
> pela maioria dos pixels dela, tolerância 12 — a camiseta fica a 13 do cinza
> claro e a calça a 17 do escuro), flood a partir das bordas, borrões cinza
> longe do contorno escuro, buracos fechados pequenos tapados de volta.

**Careca — o AMIGO AMALDIÇOADO** (`assets/careca/careca.png` humano +
`assets/careca/careca_verme.png` verme, `so3x3`, raça `humano`, de Tel Aviv).
Luta com um esfregão. ❤168 ⚔21 🛡10 💨10. Ultimate = **VÉU MALDITO**, a
MESMA da Smergula (`veuMaldito()` em `turndata.js`, função compartilhada;
a Smergula pendura o formaOverride do ABISMO por cima, o Careca usa a base
nas duas formas).

Passiva **Maldição do Verme** — a TERCEIRA forma de transformar do jogo
(Mecas transforma apanhando, Smergula batendo, Careca MORRENDO):
`checarMorte` agenda `u.renasce = rodada+1`; no começo da rodada seguinte
`renascerVermes()` (chamado logo antes de `novaRodada`) traz ele de volta
em `forma 1` com os números de `ficha.verme` (❤60 ⚔17 🛡6 💨12), sem
nenhum efeito da vida anterior (dots, buffs, selo, atordoar), recargas
zeradas MENOS a da ultimate. Uma vez só (`virouVerme`). Se o time dele
acabar antes, `checarFim` encerra a partida primeiro e ele não volta. Os
golpes do verme vêm por `formaOverride[1]` (veneno: Mordida Podre,
Cusparada Ácida, Lodo Tóxico em área); `formaMult:[1,1]` porque o padrão
(×1,20 na forma 1) é do Mecas.

**Kit (5 golpes, cada um com `pose` própria):** Esfregada · Estocada do
Cabo · Chão Ensaboado (lentidão em área) · **Encarada** (`provoca:{turnos:1}`
em 1 inimigo) · VÉU MALDITO. No verme: **Toca do Verme** (ataque base) ·
Cusparada Ácida · Lodo Tóxico · Mordida Podre (`provoca:null` pra não herdar
o taunt) · VÉU MALDITO.

**`cava` — golpe em DUAS partes (Toca do Verme).** Usar a skill só enterra:
`unidade.enterrado = {alvo, i}`, sem dano, evento com pose `cavar`. Enterrado
ninguém mira nele: todo lugar que escolhe alvo (alvo padrão, área, recochete,
confusão, taunt, IA) usa `alvejaveis(time)` = vivos e NÃO enterrados, e o
clique da UI recusa. No turno seguinte dele, `iniciarTurnoAtual` chama
`emergir()` SOZINHO (jogador, IA e online — o jogador não escolhe nada;
`minhaVez()` é falso pra unidade enterrada): mesmo `usarSkill` com
`_emergindo`, agora com dano + veneno, pose `emergir`, no alvo guardado (ou
no primeiro alvejável se ele morreu). `_emergindo` é limpo DENTRO do
usarSkill — com IA instantânea o proximoTurno pode rodar a rodada inteira
antes de voltar. Se todo mundo do outro lado estiver enterrado, a IA defende.
`enterrado`/`renasce` vão no `serializar` do online (são estado de pose).

**Animação (pedido do dono: "use todas as sprites, dê impressão de
movimento"):** toda pose das duas folhas está em alguma anim. Três peças
genéricas que nasceram aqui e servem pra qualquer personagem:
- `skill.pose` → `ev.skill.pose` → `poseDeAtaque` usa a anim com esse nome
  se o personagem tiver (senão cai no punch/ranged/special de sempre);
- `anim.respira: N` (sprites.js, renderPose E renderTo) → sobe/desce N px
  devagar. Existe mas o Careca NÃO usa mais: o dono do jogo pediu
  movimento por QUADRO, não balanço — o idle dele alterna o esfregão
  erguido (0:1) com ele esfregando o chão (2:0);
- passo `[faixa, quadro, recorte]` (sprites.js frameFor) → recorta só aquele
  passo da anim (o `crop` normal vale pra anim inteira);
- golpe de foco COM `skill.pose` toca a anim desde o cast e fica 40 quadros
  (antes começava no quadro 14 e acabava no 30: 4 poses viravam 1–2).
Poses extras do motor: `enterrado` (só o montinho de terra, `crop`),
`renascer` (evento `acao:'renascer'` disparado ao voltar como verme) e
`metamorfose` (caído esperando a maldição — loop das 8 poses de humano
virando verme). A forma verme tem `scaleAdj:0.62`: a escala vem da altura
do PRÓPRIO idle (baixinho) e as poses em pé do verme passavam do quadro.

> ⚖️ **Medido** (4000 batalhas, times sorteados): **46,5%** (47,2% depois
> da Toca + Encarada), no meio do elenco. Achado contra-intuitivo: dar MAIS vida pra forma humana (168→185)
> DERRUBOU ele pra 36,6% — ele passava a morrer tarde demais e a partida
> acabava antes de ele virar verme (renascia em 66% das partidas, contra
> ~100%). A segunda vida é a força dele; o ajuste foi no verme (mais
> rápido, mordida com veneno mais longo), mantendo os 60 de vida baixos de
> propósito.

> 🎨 **Folhas com xadrez PINTADO.** As imagens originais (`.webp`, ficaram
> em `assets/` como fonte) vieram com o fundo xadrez desenhado nos pixels,
> não transparente. A camiseta cinza tem quase a cor do quadrado claro e
> a calça a do escuro, então o recorte automático picotava o boneco. Os
> `.png` em uso foram limpos com um script (Pillow): fundo = pixel que bate
> com a cor do quadrado claro/escuro (tolerância 9), ou borrão cinza que
> tem claro E escuro por perto (divisa); flood-fill pelas bordas + sementes
> em miolo de xadrez (pega o buraco do verme enrolado) + remove pedaços
> soltos < 300px. Próxima folha gerada por IA: provavelmente vem igual.
>
> ⚠️ As "sementes de miolo de xadrez" (que pegam fundo FECHADO, tipo o
> buraco do verme enrolado) também furam CAMISETA cinza texturizada
> (brilho + sombra parecem xadrez). As duas poses da faixa 2 (esfregando o
> chão / mão no peito) foram refeitas só naquela região, sem sementes e com
> a regra do borrão mais rígida (5 dos 8 vizinhos com cor exata de quadrado),
> e a poeira grudada apagada à mão em caixinhas (só cinza neutro — cabelo,
> pele e esfregão têm cor). Isso SEPAROU as duas poses, que antes saíam
> grudadas num quadro só: a faixa 2 passou de 4 pra 5 quadros e os índices
> 2:1→2:2, 2:2→2:3, 2:3→2:4 mudaram nas anims. **Se trocar a folha, confira
> a faixa 2 no sheet-debug antes.**

**Tupas — o MESTRE DAS ÁGUAS** (`assets/tupas/tupas.png` personagem +
`assets/tupas/tupas2.png` EFEITOS dos golpes, `so3x3`, raça `humano`). Domina a
água e não sabe nadar (lore). ❤180 ⚔21 🛡10 💨11. Tipo de dano novo
`agua` (💧, conta como magia).

Passiva **Reservatório** — `ficha.agua = {max, inicial, multMin, multFaixa}`;
`unidade.agua` é o estoque. `calcularDano` multiplica por `multAgua()`
(0,6 a 1,6). Campos de skill novos: `custoAgua` (desconta no FIM do
usarSkill — o dano sai com o tanque de antes), `recuperaAgua:{valor,
limite}` (enche, mas só com estoque ≤ limite×max — `condicaoSkill(u,i)`
devolve o motivo em texto; motor recusa, IA filtra, botão aparece travado
com o motivo), `redemoinho:{dano, custo}`.

**REDEMOINHO = ultimate ATIVA.** O cast acerta o alvo e cria
`u.redemoinho = {ultimo, proximo, recem, dano, custo, iUlt, cd}`.
`tickRedemoinho` roda no `tickFimDeTurno` do PRÓPRIO Tupas (pula o turno do
cast via `recem`): acerta `proximo`, desconta `custo`, gera um evento
`acao:'redemoinho'` (pra tela animar) e escolhe o próximo inimigo na ordem
do time (`proximoDoRedemoinho`, pula morto/enterrado). Acaba em
`fimRedemoinho` (água não paga o turno, Tupas caiu, ou desativado) e a
recarga da ult começa a contar DAÍ. `desativarRedemoinho(u)` é ação LIVRE:
não chama proximoTurno — o jogador continua jogando o turno. Online:
`ctrl.desativar` → convidado manda `{tipo:'desativar'}`; o evento gerado
serve de confirmação da jogada. ⚠️ Achado na simulação: a esquiva com
contra-ataque da Serrinha pode derrubar o Tupas NO MEIO do acerto do
redemoinho — o tick confere se `u.redemoinho` ainda existe depois do dano.

**Efeitos de SPRITE (genérico, nasceu aqui):** `skill.fx = {folha, modo,
quadros, alt}` → `ev.skill.fx` → turnui chama `TurnFX.sprite` (`modo:'alvo'`
no impacto, `'origem'` no cast) ou `TurnFX.spriteProjetil` (`'projetil'`,
no lugar do projétil desenhado). `TurnFX.fixo(chave, fx, x, y)` desenha
TODO quadro até ser tirado — é o redemoinho girando em cima do próximo
alvo (`marcarRedemoinhos` no loop da batalha). `char.folhasExtras` entra no
preload. Passo de anim `{x,y,w,h}` = retângulo direto da folha (o nocaute
deitado do Tupas tem 32px e o detector descarta < 40).

> ⚖️ **Medido** (4000 batalhas): 39,7% na primeira versão → **53,4%** com
> redemoinho mais barato (custo 12→9, dano 14→16), Jato 14→16, vida
> 165→180 e o piso do tanque seco 0,5→0,6.

**Mano Coxinha — o salgado dos 3 MODOS** (1.39, refeito na 1.40; `so3x3`,
raça `humano`, de Limeira mas NÃO limeirense). Três folhas: `mano_coxinha.png`
(base), `mano_coxinha_coxinha.png` (comendo coxinha, CRUNCH, nuvem do BURP) e
`mano_coxinha_comidas.png` (pizza e hambúrguer) — as duas últimas fileiras
dessas duas grudaram na detecção, então só as poses limpas são usadas (mapa
no comentário do `characters.js`).
- **UMA ult que GIRA** (pedido do dono do jogo, 1.40): começa no modo COXINHA
  (`formaInicial:1` na ficha → `criarUnidade`) e o slot da ult tem
  `virarForma` + `formaOverride` por modo, então a comida muda sozinha:
  coxinha(1) → pizza(3) → hambúrguer(2) → coxinha… A forma 0 ("Normal") não
  é mais usada. Cura 30, recarga 2.
- `virarForma:N` só vale pra quem tem `formaStats` (o Adulto Feliz roubando
  só come e cura). `cdGrupo` (recarga compartilhada entre skills) continua no
  motor, sem uso hoje.
- `formaStats:{forma:{dano, reducao, def, spd, esquiva}}` na FICHA →
  `statsDaForma(u)` entra em `calcularDano`, `chanceEsquiva` e
  `recalcularBonus` (que agora também roda no `iniciar`, pra forma inicial).
- Os TRÊS golpes (o 3º entrou na 1.41: Óleo Quente / Fatia Voadora / Voadora de
  Hambúrguer) trocam por `formaOverride[2|3]` (a base é o modo coxinha), e
  cada `forms[i]` do characters.js tem `idle`/`walk` próprios.
- IA: come pra sair da coxinha com mais de 55% de vida, sai da pizza sempre,
  e sai do hambúrguer (volta pra coxinha) abaixo de 40%.

**Prodocimo — A ENGANADORA** (1.42, `so3x3`, raça `smergulus`; nasceu no
reino da Smergula, mora em LIMEIRA desde pequena, a única que já enganou a
rainha). Pedido do dono: poderes que dão RAIVA de enfrentar, sem ser mais
forte que o resto. Três folhas (mapa no comentário do `characters.js`):
`prodocimo3.png` (base), `prodocimo2.png` (andar + APERTO DE MÃO) e
`prodocimo.png` (chutes e nocaute) — essa última tem METADE da resolução, por
isso o passo de anim ganhou `esc` (`{folha, q|r, esc}` → `fr._esc`, multiplica
a escala em `Sprites.renderPose/drawChar`) e `r:{x,y,w,h}` pra recortar
retângulo de OUTRA folha. ⚠️ A faixa 3 das folhas 2 e 3 saiu SEM AS PERNAS:
não usar.
- Passiva **Cara de Pau** (`cara_de_pau`): +10% em `chanceEsquiva`; em
  `aplicarDano`, quem ERRA nela fica `confuso=2` (o fim do turno de quem bateu
  já desconta 1 → confuso no próximo turno). Lambança (`fervor`) imune.
- Campos de skill novos: `bonusConfuso` (Finta ×1,5 em alvo confuso),
  `roubarBuffs` (Mão Leve: buffs com `valor>0`, menos lentidão, mudam de dono
  com os turnos que sobravam **+1** — o fim do turno dela desconta na hora;
  efeito `furtado`), `roubarStats:{atk,def,turnos}` (1.44: SEMPRE rouba —
  buff negativo no alvo, positivo nela com +1 turno; o card mostra 🔻 em
  buff negativo que não é lentidão. Antes ela só roubava buff e o golpe
  parecia não fazer nada; Finta 32 / Mão Leve 26 → ~50%), `sumico` (`u.sumida=2`:
  `chanceEsquiva` devolve 1, o primeiro golpe inimigo consome; golpe de vários
  acertos erra INTEIRO; `ev.alvos[i].vulto` → "👻 ERA UM VULTO!"; pose `sumida`
  no parado; vai no `serializar`).
- Ult **APERTO DE MÃO REVELADOR**: `confusao:{turnos:6}`, `dano:0` (não rola
  esquiva). A IA usa super com `confusao` e mira no inimigo de MAIOR ataque não
  confuso e sem `fervor` e usa Mão Leve em quem tiver buff bom.
- **1.46:** o SUMIÇO saiu do kit dela e a FASE FANTASMA saiu do kit do
  Dmaterelizador (pedido do dono: não faziam sentido). O motor ainda entende
  `sumico`/`fase` (nenhum golpe usa). Os dois SUBIRAM sem eles: 52,5% e 52,3%
  (60.000 lutas) — era turno sem dano. Tabela da Condenação regerada.
> ⚖️ Medido (simulador sem interface, ela em todas as lutas): 1ª versão
> (def 10, golpes 27/24/10) **39%**. Ablação: passiva vale ~8 pontos, ult ~2,
> o resto ~1 cada — a confusão só desvia 35% dos golpes, então controle
> sozinho não paga turno sem dano. Ajuste pelo DANO (regra da 1.41): golpes
> 36/32/14, def 11 → **48,0%** em 10.000 lutas; elenco inteiro 47,8–52,0% em
> 20.000. Um pouco abaixo do meio de propósito (gente usa controle melhor que a IA).

**Dmaterelizador — o FÃ Nº 1 DA CDI** (1.43, `so3x3`, raça `humano`; id
`dmaterelizador`, folhas `dmatrelizador*.png` — sem o "e", como vieram).
Desmaterializa as coisas e é CHATO de propósito; na lore ninguém gosta dele,
nem a CDI (entidade criminosa de Limeira que nasceu boa e se renegou). As
folhas grudam fileiras no recorte automático (os efeitos encostam): quase
toda pose é retângulo `{folha, r, esc}` medido à mão, com `esc` igualando cada
fileira à guarda da fileira de baixo da folha 2 (idle, 88px).
- Passiva **Desintegração**: golpe que pega = `defPerm -1` no alvo, até
  `DESINTEGRA_MAX` (6) por alvo (`u.desintegrado`).
- Campos novos: `atravessa` (Portal: ignora taunt e Muralha), `desfazer`
  (apaga `estruturas/barreiras/fumacas` do time inimigo e `terrenos` do time
  dele ANTES do teste da muralha, e os buffs bons de cada alvo no bloco de
  status; `ev.desfeitos` → texto na tela), `fase` (`u.fase=2`; `intocavel(u)`
  = enterrado OU fase — usado em `alvejaveis`, alvo escolhido, taunt,
  confusão, redemoinho e no clique da tela), `esgota` (ult: `u.esgotado`;
  `condicaoSkill` trava TODO golpe no turno seguinte, só Defender).
> ⚖️ 1ª versão (golpes 26/34/12) **55,4%**; passiva vale ~4,5 pontos e ult ~4;
> o teto da passiva (3, 4 ou 6) quase não muda. Ult mantida forte (70, pedido
> do dono); outros golpes 20/28/10 → **49,9%** em 10.000 lutas, 50,9% na
> tabela da Condenação.

> ⚖️ **REBALANCEAMENTO GERAL 1.40 (patch de emergência).** Simulação do
> elenco INTEIRO de uma vez (`__simTodos` no console: cada luta sorteia 2
> times de 3 sem repetir, mesma IA nos dois lados, vitória creditada aos 3).
> Antes: 34% (Mameluco) a 64% (Serrinha). Um ajustador automático mexeu em
> fatores de vida e de dano por personagem (proporcional à distância de 50%,
> normalizado pela mediana pra não inflar o elenco todo), com teto; quem bateu
> no teto (Mameluco, Marcelão, Mano Coxinha) ganhou DEFESA. Os números foram
> gravados direto nas fichas. Achados: no **Careca, mais vida PIORA** (a forma
> verme, a forte, chega mais tarde) — ele foi ajustado só pelo dano e o verme
> subiu pra 75. **Marcelão** teve o dano cortado 40% (pedido do dono) e foi
> compensado com utilidade (Furto cd 2, moeda 80%). Resultado: **48,5–52,1%**
> em 30.000 lutas e 48,5–51,6% na tabela da Condenação (60.000). Média de
> vitória do elenco é 50% por definição (toda luta tem um vencedor), então
> "todo mundo entre 50 e 60" na prática é "todo mundo colado em 50".
>
> ⚠️ **1.41 — VIDA NÃO É ALAVANCA DE BALANÇO.** O dono do jogo não gostou da
> 1.40 ter inflado a vida (Marcelão 268, Mano Coxinha 258, Mameluco 254). Regra:
> a vida de cada um fica perto do valor ORIGINAL (±4%), e o **Adulto Feliz tem a
> MAIOR vida do jogo** (205). O ajuste é por DANO (fator nos golpes) e DEFESA; o
> Marcelão, que não pode ganhar dano, foi compensado com VELOCIDADE (14).
> Resultado: 48,2–51,2% em 22.000 lutas.

### 5.2 Motor — `js/turnbattle.js`
- **Regras que mudaram na 1.33** (pedidas pelo dono do jogo / bugs):
  - **Esquivou → escapou do efeito.** No laço de dano conta `acertos` e
    `esquivas` por alvo; quem esquivou de TODOS os acertos entra em
    `desviou` e o bloco de status pula ele (dot, lentidão, confusão,
    atordoar, provoca, selo, removerAtaque, furto de tempo — o furto foi
    pra DEPOIS do dano por isso, e o Marcelão só adianta as recargas dele
    se `roubouTempo`). Golpe sem dano não rola esquiva e continua pegando.
  - **"1 aliado" nunca é ele mesmo.** `companheiros(u, ts)` = vivos, não
    enterrados, sem `u`. `condicaoSkill` trava o golpe sem companheiro; o
    alvo padrão e a IA usam `companheiros`. Era o bug do bot: a Loirinha da
    IA se beijava (o jogador nunca pôde — a UI já barrava).
  - **`condicaoSkill(u, i, ts)`** é conferida INTEIRA no `usarSkill` (antes
    só a da água). `ts` = times de onde ler aliados — a UI passa os do
    estado desenhado (o convidado online não roda motor). `aliadoCaido` usa
    `!x.renasce` (na rede ele chega como booleano).
  - **Defender** cria a blindagem com `turnos:2`: o fim do PRÓPRIO turno já
    desconta um — com 1 ela nascia e morria no mesmo instante.
  - **`daLuta(u)`**: `usarSkill`, `defender`, `jogadaDaIA`, `emergir` e
    `desativarRedemoinho` recusam unidade que não está em `times` agora. O
    timer da IA (`disparar`, até ~10 s esperando animação) sobrevive a um
    `iniciar()` novo — sem isso, sair no VOLTAR e começar outra luta fazia a
    unidade VELHA agir (e avançar o turno) dentro da luta nova.
- `TurnBattle.iniciar(idsAliados, idsInimigos, callbackDeUI)`.
- **Ordem de turno** por velocidade, recalculada toda rodada, com
  desempate aleatório e **turno extra** para quem for ≥35% mais rápido
  que a média.
- **Dano**: base + 35% do ataque, multiplicador de forma, e a defesa corta
  por *porcentagem* (`100/(100+def*4)`) — **veneno e sangramento ignoram
  defesa** (acerto direto e o efeito por turno), energia perfura 75%.
- **Status por turno**: queimadura, veneno (sempre `TurnData.VENENO_TICK` de
  dano, não importa quem aplicou), sangramento (cresce conforme o alvo
  perde vida), atordoado, lentidão, regeneração e buffs que crescem.
- **`meditarStack`** (campo genérico de skill, estreado na Fat Girl):
  POSTURA que cresce. `{mult, teto}` — cada uso multiplica o ataque ATUAL
  da unidade por `mult`, limitado a `teto`, e o ganho entra em `atkPerm`
  (permanente, como transformação; não é buff com prazo). Marca
  `emMeditacao` na unidade, que o `turnui.js` usa para segurar a pose;
  o motor limpa essa marca no primeiro golpe com `dano>0` que ela usar.
  Não trava turno nenhum: o preço é o próprio turno gasto. A IA tem regra
  própria para posturas em `jogadaDaIA` (só nas 2 primeiras rodadas, só
  acima de 70% de vida, só até o teto) — sem isso ela ficaria sentada a
  partida inteira, já que a skill não tem recarga.
  **Substituiu o antigo `meditar`** (que travava a unidade por N turnos e
  liberava um buff no fim): aquilo custava ~18 pontos de taxa de vitória
  só pelos turnos parados — o histórico está na nota da Fat Girl em §5.1.
  A aplicação fica em `usarSkill`, ANTES do bloco de `buff` normal (a
  postura ocupa o mesmo `else if`, senão um buff sairia nos dois lugares).
  Reusável por qualquer personagem futuro que queira uma postura que
  cresce em vez de um golpe.
- **`VENENO_TICK`** (`turndata.js`): dano do veneno por turno é um número
  ÚNICO e compartilhado — antes cada personagem tinha o próprio valor
  (Serrinha Dog 7, Smergula 9), o que não fazia sentido narrativo (duas
  picadas iguais doendo diferente só pela origem). Toda skill que aplica
  veneno referencia essa constante em vez de um número solto.
- **Sangramento ignora defesa** (`calcularDano`): o acerto direto de
  golpes tipo `sangramento` deixou de ser reduzido pela defesa do alvo,
  igual o veneno já fazia. Os `dano` diretos de Mordida (Serrinha Dog) e
  Corte Espectral/Rasgo Demoníaco (Smergula) foram recalibrados pra baixo
  pra compensar — ver o comentário `⚖️` na ficha da Serrinha Dog em
  `turndata.js` pelo método usado (2000 batalhas simuladas A/B, comparando
  a ficha antes/depois byte a byte para isolar o efeito real do ruído da
  própria simulação — Mordida é sem recarga, então qualquer sobra no
  ajuste se acumula turno após turno da partida inteira, diferente de um
  golpe de recarga alta).
- **Terreno**: um por time, fere o time inteiro no fim da rodada.
- **Estrutura**: um objeto por time (o Corsa), somado à defesa de todos os
  aliados em `recalcularBonus` e desgastado no fim de cada rodada.
- **Ambiente**: o clima da arena. Diferente dos dois de cima, é **GLOBAL** —
  vale para os dois times. Só existe um por vez (lançar outro substitui).
  Campos: `curaMult` (cura), `regen` (vida por rodada), `dotMult` e
  `dotTurnosExtra` (veneno/sangramento/queimadura), `magiaMult` (dano de
  tipos mágicos — ver `TurnData.MAGICOS`), `confusaoExtra`, `particula`
  (`'coracao'` ou `'mancha'`, muda o desenho no palco).
- **Confusão** (`confuso`, em turnos): quem age confuso tem
  `CONFUSAO_CHANCE` (35%) de acertar um alvo **qualquer** do campo em vez
  do escolhido — inclusive o próprio time.
- **`curar(alvo, valor, origem)`**: TODA cura do jogo passa por aqui —
  skill, dreno, regeneração e passiva. É o único ponto que conhece o
  multiplicador do ambiente e a passiva Carisma; espalhar isso pelos
  quatro lugares que curam seria garantir que um ficasse para trás.
- **IA** (`jogadaDaIA`, exportada de propósito — ver §5.7): cura se ferido
  > super > área > buff > dano; mira em quem está mais fraco. Alvo
  `'qualquer'` (Bizarrice) SEMPRE prioriza o time inimigo — nunca sorteia
  entre os dois lados sem diferenciar (ver §5.7, foi um bug real).
- **`escalaVida`** (Adulto Feliz): bônus de dano proporcional à VIDA
  MÁXIMA de quem bateu (não à atual — ver §5.7 do porquê). Junta-se a
  `escalaDefesa` (Fat Smerg/Mameluco) e `escalaVelocidade` (Strong Smerg)
  na lista de multiplicadores especiais de `calcularDano`.
- **`terreno.escalaVelocidade`** (Cargas, TEMPESTADE ENCURRALADA): a
  mesma ideia de escala, só que aplicada a um TERRENO em vez de um golpe
  direto. Sem `terreno.dano` fixo na ficha, `usarSkill` calcula
  `Math.round(velocidadeDe(unidade) * escalaVelocidade)` UMA VEZ no cast
  e guarda o número pronto em `terrenos[time].dano` — o terreno em si
  não guarda referência a quem lançou, só o valor já resolvido (mesmo
  padrão de "congelar no momento do cast" que o resto das escalas usa).
  `TurnData.etiquetas()` também precisou de um branch a mais: sem
  `terreno.dano` na ficha, o texto vira "dano baseado na sua velocidade"
  em vez de tentar interpolar um número que não existe.
- **`roubar` / `skillEfetiva(u, i)`** (Adulto Feliz): a skill marcada
  `roubar:true` (a BIZARRICE) acha a skill `super` do ALVO (aliado ou
  inimigo) na forma atual dele, guarda uma CÓPIA em `unidade.roubado` e
  trava a ultimate original da vítima em recarga total. Enquanto o roubo
  não é usado, ele **ocupa o mesmo slot** da Bizarrice — por isso toda
  leitura de "qual golpe está neste botão agora" passa por
  `TurnBattle.skillEfetiva(u, i)`, nunca por `ficha.skills[i]` direto (UI,
  ficha da unidade e a própria IA usam essa função). O cd do slot fica em
  0 assim que rouba (pronto pra já) e só volta a travar (no mínimo o cd
  da própria Bizarrice) depois que o roubo é USADO — senão nasceria
  travado 6 turnos antes de dar pra aproveitar o que acabou de roubar.
- **`removerAtaque`** (Lambança, ultimate SELO DO SILÊNCIO — buff pedido
  pelo dono do jogo, v1.19): zera o `atk+atkBonus` ATUAL do alvo de forma
  PERMANENTE, somando um `atkPerm` NEGATIVO — o mesmo campo que
  transformação/meditação usam pra crescer, só que subtraindo. Diferente
  de um `buff` normal (que empilha em `unidade.buffs` e expira em
  `turnos`), isso não tem prazo: fica pro resto da partida. Um buff de
  força que o alvo receber DEPOIS ainda funciona normal (soma em cima do
  novo piso zerado) — não é um travamento eterno em 0, é zerar o que ele
  tinha construído até ali. Roda JUNTO com `desabilitar` no mesmo golpe
  (a ultimate sela o último golpe usado E apaga o ataque, num só cast).
- **`roubarTempo`** (Marcelão Black JW, FURTO DE TEMPO, v1.20): mexe em
  `unidade.cds[]` direto — toda skill do ALVO que já estiver em `cd>0`
  ganha `+valor` turnos (atrasa), e toda skill de QUEM USOU que já
  estiver em `cd>0` perde `valor` turnos (adianta), MENOS o slot que
  acabou de ser usado (o cd dele foi fixado umas linhas antes; descontar
  na mesma tacada desfaria o preço do próprio golpe). Skill com `cd`
  zerado não é mexida — não tem "recarga" pra atrasar/adiantar.
- **`estrutura.recarga`** (Marcelão Black JW, ESCUDO TEMPORAL, v1.21):
  extensão do objeto `estruturas[time]` que já existia pro Corsa
  Blindado (`defesa`) — mesmo objeto, campo a mais. **Escudo Temporal NÃO
  leva `defesa`** (pedido do dono do jogo, v1.22: proposta diferente do
  Corsa de propósito — ele é só recarga, defesa de time já é o nicho do
  Fat Mango). `recalcularBonus`/`etiquetas` já checavam `es.defesa` de
  forma condicional (`if(es.defesa)`), então bastou não incluir o campo
  — sem precisar de nenhum `defesa:0` explícito nem de código a mais. No
  fim de CADA rodada (junto com o desgaste normal da estrutura, perto de
  onde
  `es.turnos--` já rodava), adianta `es.recarga` turnos de toda skill
  `cd>0` de todo mundo VIVO do time dono, EXCETO quem tem `super:true`
  na ficha BASE (a ultimate de cada um — sem essa exceção virava "super
  de graça todo round"). ⚠️ Achado testando (v1.21): o `sk.estrutura` que
  grava em `estruturas[unidade.time]` fazia uma cópia CAMPO A CAMPO
  (`{nome,icone,turnos,defesa,dono}`) em vez de espalhar o objeto
  inteiro — `recarga` chegava a existir na FICHA mas sumia no `estado()`
  de verdade. Corrigido pra `Object.assign({}, es, {...})` (v1.22) —
  mesma classe de bug que o comentário do `ambiente` logo abaixo já
  evitava copiando tudo de uma vez; agora as duas cópias (`estrutura` e
  `ambiente`) seguem o mesmo cuidado. O `visual`/`cor` do Escudo Temporal
  (ver §5.3) só passaram a chegar no palco por causa desse conserto.
- **`ambiente.velocidadeFixa`** (Marcelão Black JW, ultimate TEMPESTADE
  DE GELO, v1.21): em `recalcularBonus()`, TRAVA a velocidade de TODO
  MUNDO em campo (`todos()`, os dois times) no mesmo número — não é uma
  REDUÇÃO como `lentidao` normal (que soma um delta negativo em cima do
  que já tinha); é `u.spdBonus = velocidadeFixa - u.spd`, sobrescrevendo
  qualquer buff/perm/lentidão que já estivesse valendo. Só existe
  enquanto `ambiente` tiver esse campo — quando o ambiente se dissipa, a
  próxima passada de `recalcularBonus()` volta a somar os bônus normais.
- **`ambiente.recargaExtra`** (mesma ultimate, v1.21): em `usarSkill()`,
  no exato ponto onde `unidade.cds[iSkill]` é fixado depois de castar,
  soma `recargaExtra` turnos — só se a skill usada tiver `cd>0` de
  verdade (uma skill sem recarga continua sem recarga). Vale pra
  QUALQUER UM que usar uma skill enquanto o ambiente durar, dos dois
  times — inclusive o próprio Marcelão, que só sente menos por causa do
  resto do kit dele (a passiva e o Furto de Tempo empurram pro lado
  contrário).
- **`recochete`** (Marcelão Black JW, MOEDA FATAL, v1.20): em vez de
  resolver `alvos` do jeito normal (um só, pro `alvo:'inimigo'`), monta
  a lista de alvos como uma SEQUÊNCIA de quiques — começa no alvo
  escolhido, e a cada rodada de sorteio (`chance`, 60% por padrão) pula
  pra um inimigo vivo ainda não visitado nesta tacada, até errar a sorte
  ou não sobrar mais ninguém. Fica pronto ANTES do evento ser gravado
  (`ev.alvos`), então o resto do motor (dano, animação, UI) trata como
  se fosse um golpe de ÁREA normal — não precisou tocar no bloco de
  dano nem na animação, os dois já sabiam lidar com "um golpe, vários
  alvos diferentes" desde `todos_inimigos`. Nunca visita o MESMO alvo
  duas vezes na mesma tacada (de propósito: dois hits no mesmo `id`
  quebrariam o `reg(id)` que casa dano com o `ev.alvos` gravado — `.find`
  sempre acha só a PRIMEIRA entrada com aquele id). Não recocheteia se a
  CONFUSÃO já redirecionou o golpe (ver `confundiu` acima) — misturar os
  dois abriria "recochetear" no próprio time, o que não faz sentido pra
  uma moeda mirada no inimigo.
- **Evento** (`estado().evento`): a "gravação" da última ação — quem bateu,
  em quem, quanto, se esquivou, se morreu. **É o que a UI usa para animar.**
- `TurnBattle.setEspera(fn)`: enquanto a UI estiver animando, a IA segura
  a jogada dela (senão um turno começava por cima da animação do outro).

### 5.2.1 Estratégias, IA e balanceamento por simulação (1.46–1.47) — `tools/balanco/`
- **`ficha.estrategia`** (bloco `ESTRATEGIAS` GERADO no fim do turndata.js —
  não editar à mão): `{ alvo:'pct'|'fraco'|'forte'|'ia', lista:[{ i (golpe;
  -1 = defender), g (condição), p }] }`. Condições: `sempre`, `rodadaAte`,
  `rodadaDepois`, `vidaMenos`, `vidaMais`, `timeFerido`, `usosMenos` (conta em
  `u.usos`), `inimigos2`, `inimigos1`. `jogadaDaIA` percorre a lista ANTES da
  heurística antiga: sai o 1º golpe pronto com a condição valendo; nada passou
  → a IA de sempre. Vale pra todo bot (vs CPU, Sobrevivência, Condenação).
- **Veneno/sangramento/queimadura RENOVAM** (mesmo tipo + mesmo atacante:
  `max` de dano e turnos) em vez de empilhar. O empilhamento sem limite era a
  maior brecha que a simulação achou (Serrinha só de Mordida ~67%).
- **Ferramentas** (Node, carregam o motor REAL: turndata+characters+turnbattle):
  `sim.js` (motor + política + `busca <id> [iter] [N] [continua]`, que faz
  hill-climb de políticas contra o resto do elenco e confere em 4.000 lutas
  novas → `res_<id>.json`) · `ideias.js` (pontos de partida escritos à mão) ·
  `meta.js <N> <tag>` (torneio paralelo com a IA do jogo, ~22 s por 60 mil) ·
  `afinar.js <rodadas>` (escala `d` dano dos golpes / `c` curas / `b` buffs /
  `h` vida em `ajuste.json` até ~50%) · `assar.js` (grava as estratégias no
  turndata) · `escolher.js <pasta>` (só troca a estratégia se a nova ganhou
  +1 pt) · `gravar_numeros.js` (grava o `ajuste.json` nos números da ficha e
  CONFERE recarregando). Ciclo usado na 1.47: buscar → assar → afinar →
  buscar de novo (prova anti-brecha) → gravar. Resultado: 49,3%–51,2%, e a
  última busca não achou estratégia com mais de +3 pts.
- ⚠️ Mudou golpe/ficha? Rode `node meta.js 60000 X` em `tools/balanco/`. Se
  sair da faixa, `afinar.js` + `gravar_numeros.js`; personagem novo ou kit
  mudado → `busca` pra ele (ideia em `ideias.js`) + `assar.js`. As ESTRATEGIAS
  usam o ÍNDICE do golpe: reordenar skills exige rodar a busca de novo.

### 5.3 Cenários — `js/turnbg.js`
O palco (`.bt-palco`) tem os **times um de frente para o outro**: aliados à
esquerda olhando para a direita, inimigos à direita olhando para a esquerda,
em DIORAMA desde a 1.33 (ver a nota 🏛 1.33 em §5): diagonal com ponto de
fuga no centro, o 1º de cada time no fundo (menor), o 3º na frente.
Estruturas ficam no chão na frente da linha (`W*0.40/0.60`, `H*0.93`) e a
Muralha de Lasanha no meio (`0.455/0.545`, `H*0.86`). O tamanho do canvas é
vigiado por `ResizeObserver` (não lê `clientWidth` a cada quadro) e a
vinheta é um gradiente criado só quando o tamanho muda.

Ao fundo, um `<canvas id="bt-bg">` com um dos **6 ambientes sorteados por
batalha**: 🌃 Arena Neon · 🔧 Ferro-Velho · 🏜 Deserto de Sal ·
🔬 Laboratório 5000Z · 🥖 Rua da Padaria · 🌲 Mata Fechada.

Cada ambiente tem duas funções: `estatico()` (céu, prédios, chão — desenhado
**uma vez** num canvas de apoio e refeito só quando o tamanho muda) e
`animado()` (estrelas, fagulhas, vaga-lumes, vapor — a cada quadro). Por cima
vem a vinheta que escurece as bordas, e as **estruturas** do campo: o Corsa é
desenhado em blocos por `carro()`, virado para o inimigo, com a porta aberta
(é ela que apara o golpe) e um brilho pulsando enquanto o efeito dura.

**Nem toda estrutura é um carro.** `desenharEstruturas()` escolhe o desenho
pelo campo `estrutura.visual` que cada skill define (`turndata.js`) — hoje
`'carro'` (Corsa Blindado, Fat Mango) ou `'muro'` (Escudo Temporal,
Marcelão Black JW, desenhado por `muro()`: um bloco de gelo com juntas de
tijolo, mesmo `brilho` pulsando do carro). Sem `visual` cai no carro, pra
não quebrar nada que ainda não tenha o campo. Uma skill de estrutura nova
só precisa escolher um dos dois (ou pedir um desenho novo) — nunca reusar
o carro por padrão só porque `desenharEstruturas()` era hardcoded assim
antes da v1.22 (era o bug: TODA estrutura desenhava carro, mesmo a de
gelo do Marcelão).

Trocar o cenário na mão para testar: `TurnBG.usar('deserto')`.

### 5.4 Tela e animação — `js/turnui.js`
- `abrirMontagem()` → grade de escolha do time (3 personagens).
- `render(st)` → redesenha cards, ordem, terreno, log e botões de skill.
- **Animação do golpe** (`iniciarAnim` / `passoAnim`):
  1. o card do atacante fica parado, mas o **`<canvas>` dele sai do card**
     (transform CSS) e atravessa a tela até o alvo;
  2. troca de pose: `walk` na corrida → `punch`/`special`/`ranged` no golpe;
  3. no **frame do impacto** entram os efeitos (`TurnFX`), o número de dano
     e só então a **barra de vida do alvo cai** — até lá a vida fica
     congelada no valor antigo, senão o dano apareceria antes do soco;
  4. o alvo pisca branco, treme e faz a pose `hurt` (ou `ko` se morreu);
  5. o atacante volta para o lugar e a animação se encerra.
  Golpes de área/à distância não correm: disparam **projéteis pixelados**
  para cada alvo. Cura/buff fazem uma **aura** subindo.
- **Leitura dos golpes durante a batalha** (era o pedido "dá pra ler o que
  cada ataque faz"):
  - cada botão de skill mostra **nome + tipo + descrição + etiquetas**;
  - o botão **🔎** em cada card (inimigo também!) abre a **ficha completa**
    (`#bt-ficha`): vida, ataque, defesa, velocidade, forma atual, passiva e
    os 4 golpes com descrição, etiquetas e recarga.
- Entrada do jogador fica **bloqueada enquanto a animação roda** — mas com
  **prazo de 3s** (`animando()`): se a aba vai para segundo plano o navegador
  estrangula o `requestAnimationFrame`, a animação congela e, sem esse prazo,
  a batalha travaria esperando para sempre. O motor tem a mesma trava do lado
  dele (a IA desiste de esperar depois de ~4s).

### 5.5 Efeitos — `js/turnfx.js`
Um `<canvas>` transparente em **posição fixa por cima da tela inteira**
(`.bt-fx`, z-index 900). Precisa ser fora dos cards, senão o impacto seria
cortado pela moldura de 120px. Tudo é desenhado em **quadradinhos
inteiros**, para combinar com a pixel-art (nada de círculo liso):

`impacto()` estrela de faíscas + anel · `corte()` arco do golpe ·
`projetil()` tiro com rastro em arco · `aura()` brilho subindo ·
`texto()` número de dano flutuante · `flash()` clarão de tela nos supers.
Desde a 1.33 também `elemento()` (impacto por tipo de dano),
`projetilElemental()`, `numero()`, `ko()`, `zoom()`, `anuncio()`,
`confete()`, `efeitoStatus()`, `escudo()`, `setas()`, `rastroVelocidade()`,
`ondaChao()` — ver a nota 🏛 1.33 em §5.

> Os efeitos são **desenhados por código**, não são imagens baixadas: assim
> combinam com a paleta do jogo, funcionam offline e não dependem de
> licença de terceiros.

### 5.5.1 Golpes sob medida — `js/turngolpes.js` (1.45)
Camada POR CIMA da encenação do turnui + efeito de elemento do turnfx: cada
golpe ganha a animação que combina com o NOME (o pão voando, o Astra
atropelando, o rifle atirando). Uma RECEITA por golpe em `R`, chave =
`TurnGolpes.norm(nome)` (sem acento, minúsculo, só letra/número — o nome
que chega no `ev.skill.nome`, já na FORMA certa). Campos (todos opcionais):
`mov` ('salto' · 'giro' · 'giroGolpe' · 'sombra' · 'atravessa' · 'carro'),
`origem(I)`, `voo(I,al,o)` (devolve true = tira o projétil padrão),
`vooUm(I,o)` (UM objeto pro grupo; true = nenhum projétil por alvo),
`impacto(I,al,g)`, `quadro(I,t)`, `movAtacante(I,t,base)` (manda no movimento
inteiro — o COLAPSO), `semCorte`, `varre` ('caminho' · 'x' · 'ordem': o
turnui marca a hora de cada alvo pela DISTÂNCIA que o objeto percorre até
ele, e o `TurnFX.voa` anda em velocidade constante — os dois batem).
`I` é montado no `iniciarAnim` (`anim.I`): centro/altura de quem usou, lado,
alvos, `pe(pos)`, `atk` (onde quem bate está AGORA), `palco` (retângulo).
- **Objetos em pixel art** (`OBJ`: croissant, pão, granada, moeda, bolsa,
  bombom, ursinho, pizza, coxinha, hambúrguer, lasanha, lábios, punho, mão,
  caveira, nota, relógio, balão, olho, presa, pedra, queijo, coração, gota,
  caixa, estrela): string por linha, letra = cor da paleta, '.' = vazio.
  `obj(nome, paleta?)` assa num canvas com contorno branco de 1px (sem ele o
  marrom sumia no muro do castelo). Desenhado em `TurnFX.voa/objeto`.
- **Carros**: Astra e Corsa de lado são os PNGs do mundo aberto
  (`modohistoria/assets/veiculos/*_dir|esq.png`). O Corsa Blindado em
  `TurnBG.corsa()` corta as 14–16 linhas de cima (bagageiro com malas) e
  chega dirigindo (`chegada[lado]`); o muro de gelo sobe do chão.
- **Golpe sem receita** cai em `porPalavra` (soco, chute, tapa, mordida,
  garra… ou um "POW!" no físico corpo a corpo). Personagem NOVO: escrever as
  receitas dos golpes dele aqui — conferir com o teste que roda todas as
  receitas (`origem/voo/vooUm/impacto/quadro` + 160 quadros do TurnFX).
- **TurnFX ganhou** (pra isso): `forma`, `objeto`, `voa`, `veiculo`,
  `onomato`, `placa` (nome de todo golpe que não é ultimate), `focoLinhas`
  (ultimate), `quadroImpacto` (palco em negativo 2–3 quadros), `feixeGrosso`,
  `rachadura`, `pilar`, `circuloMagico`, `vortice`, `garras`, `mordida`,
  `onda`, `nuvem`, `cristais`, `espinhos`, `portal`, `cubinhos`,
  `transicao` (cortina de entrada, chamada no `prepararTela`) e `desenho`
  (as primitivas px/disco/linhaPx… pra quem desenha por fora).
- O sprite de quem bate aceita `rot`, `alpha` e `sx` (-1 = de costas) além
  de `dx/dy` no `a.poses[...]` (aplicado no `desenharSprites`).

### 5.6 Ranqueada 3x3 online — `js/turnonline.js`

A ranqueada usa **este mesmo motor de turnos**, só que o time inimigo é
outro jogador. Os dois modos online são 3x3 por turnos, mas entram por
caminhos diferentes:

- **casual**: `Online.escolherModo('casual')` → `TurnUI.abrirMontagem({online:true})`
  (a mesma tela de montar time, com o botão virando "PROCURAR ADVERSÁRIO")
  → `Online.comTime(ids)` → fila → `TurnOnline.iniciar(...)`.
- **ranqueada**: entra na fila **sem time** → depois de parear, os dois
  fazem o **draft ao vivo** (`js/turndraft.js`, escolha alternada com
  personagem bloqueado para o outro lado) → `TurnOnline.iniciar(...)`.

**Modelo: autoridade do anfitrião.** Só o *host* simula. Ele roda o
`TurnBattle` com `{semIA:true}` (o lado 'inimigo' é gente, não a IA) e, a
cada mudança, manda o **estado inteiro** pelo canal. O convidado não
simula nada: desenha o que chega e devolve só a ação escolhida
(`{tipo:'acao', i, alvo}`).

> Por que não rodar os dois lados em paralelo? A batalha sorteia
> (iniciativa, esquiva, atordoar). Uma única mensagem perdida e os dois
> jogadores passariam a ver partidas diferentes sem ninguém perceber.
> Mandando o estado inteiro, cada pacote **conserta** o anterior — e o
> estado do 3x3 tem só ~2 KB (6 lutadores), diferente da luta 1x1 que
> roda a 60 quadros por segundo.

Detalhes que existem por causa de problemas reais:

- **`char` e `ficha` não vão pela rede** — são remontados do `charId` do
  outro lado (`hidratar()`), que tem os mesmos `characters.js`/`turndata.js`.
- **Número de sequência em tudo** (`n`): o relay do Firebase escreve
  sempre no mesmo caminho, então dois envios próximos se atropelam. A ação
  do convidado é **reenviada** até o estado voltar, e o `n` evita que o
  host aplique a mesma jogada duas vezes.
- **A ranqueada NÃO usa P2P.** `Net.canal(sala, papel, {confiavel:true})`
  fica no relay do servidor. O canal WebRTC é aberto de propósito como
  *unreliable* (`maxRetransmits:0`) porque na luta 1x1 um pacote perdido
  não importa — o próximo dos 60 quadros por segundo já corrige. No jogo
  por turnos cada mensagem é uma JOGADA: perder uma trava a partida.
- **As duas pontas se re-sincronizam sozinhas.** O anfitrião reanuncia o
  estado a cada 2,5s *enquanto espera a vez do convidado* (é o único
  momento em que um estado perdido trava tudo), e o convidado pede estado
  sempre que passa 3s sem notícia. Testado derrubando 40% dos estados de
  propósito: a partida atravessa sem travar.
- **A jogada é confirmada pelo número do golpe**, não por "chegou algo":
  com a batida do anfitrião chega estado a cada 2,5s mesmo sem nada ter
  acontecido, e cancelar o reenvio nesses estados descartaria em silêncio
  uma jogada que se perdeu.
- **Lados**: o time do host é o `'aliado'` do motor e o do convidado é o
  `'inimigo'` — mas cada jogador precisa se ver embaixo. Quem resolve isso
  é o `meuLado()` do `turnui.js`: a tela desenha `st.times[meuLado()]` no
  `#team-aliado` e o resto no `#team-inimigo`. `st.venceu` é sempre do
  ponto de vista do `'aliado'`, então o convidado inverte.
- **O cenário é sorteado pelo host** e vai no estado (`cenario`), senão
  cada um lutaria num lugar diferente.
- Quem sai da sala entrega a vitória para o outro (`onOpponentLeft`).

---

## 6. Conta, ranking e online

- **`js/auth.js`** — por padrão o perfil é **local** (`localStorage`, senha
  guardada só como hash SHA-256). Se `js/firebase-config.js` estiver
  preenchido, `js/firebase-init.js` liga o **Firebase Auth** e a mesma
  interface passa a valer para contas de verdade.
- **`js/ranked.js`** — ELO (`K=32`, começa em 1000), patentes, leaderboard.
  Grava no Firestore quando há nuvem, senão no `localStorage`.
  ⚠️ O resultado é enviado pelo navegador: dá para forjar. Ranqueada
  "de verdade" precisa validar no servidor (Cloud Functions).
### 6.1 A FILA (matchmaking) — por que ela travava

Sintoma: dois jogadores na fila da ranqueada e, mesmo assim, nem sempre
caíam um contra o outro.

A causa raiz era o **desenho de uma tentativa só**: quem entrava e não
achava ninguém se anunciava na fila **uma vez** e ficava dormindo à
espera de um convite. Quatro coisas quebram isso, e todas terminam
iguais — os dois esperando um pelo outro:

1. **`onDisconnect` apagando a entrada.** O RTDB derruba e reconecta o
   socket sozinho (troca de rede, aba em segundo plano, wi-fi oscilando).
   Quando isso acontece o servidor executa o `onDisconnect` e apaga a
   entrada da fila. O jogador continua esperando, mas está **invisível**
   para quem chega depois. Era o caso mais comum.
2. **Cancelar e procurar de novo.** O `remove()` do cancelamento ia sem
   `await`; se chegasse ao servidor depois da nova busca, apagava a
   entrada **nova**.
3. **Convite fóssil.** `convites/<uid>` não era limpo quando a partida
   era abandonada antes de começar; na busca seguinte o jogador entrava
   numa **sala morta** e o adversário de verdade ficava sozinho.
4. **Faixa de rating fixa em ±350.** Dois jogadores a 400 pontos de
   distância nunca se achavam — e a tela só dizia "procurando…".

O desenho novo é de **tentativa repetida**: a cada 2,5s a mesma
transação roda de novo e, numa tacada só, (a) me reanuncia se minha
entrada sumiu, (b) renova meu `ts`, (c) varre as entradas mortas e (d)
tenta reivindicar alguém — com a **faixa de rating alargando** (±350,
mais 250 a cada 10s, qualquer rating depois de 1 minuto). Um estado
perdido deixa de ser fatal: no pior caso o par sai 2,5s depois.

Detalhes que existem por causa de um problema concreto:

- Ao reivindicar alguém eu **saio da fila junto**. Como agora eu fico
  anunciado enquanto espero, se eu continuasse lá depois de convidar
  alguém um terceiro jogador poderia me reivindicar e eu acabaria em
  duas salas ao mesmo tempo.
- O candidato escolhido é o de **`ts` mais antigo** (quem espera há mais
  tempo joga primeiro) — e, sendo determinístico, dois jogadores não
  "escolhem" parceiros diferentes na mesma rodada.
- Entrada só é considerada morta depois de **45s** sem renovar (e não
  20s): com a aba em segundo plano o `setTimeout` é estrangulado e o
  jogador renova bem mais devagar — mas continua recebendo convite
  normalmente, então não pode ser varrido antes disso.
- `Net.observarFila(modo, cb)` conta quantos estão na fila; a tela de
  matchmaking mostra isso. Se aparece "2 na fila" e nada acontece, o
  problema é pareamento; se aparece "1", o outro jogador não está ali.
  Antes não dava para distinguir os dois casos.

- **`js/net.js`** — dois transportes com a mesma interface:
  `LoopbackTransport` (duas abas no mesmo navegador, com latência simulada)
  e `RtdbTransport` (Firebase Realtime Database — escolhido por causa da
  latência, o Firestore sairia caro e lento para luta).
- **`js/online.js`** — orquestra modo → montagem → fila → partida → resultado.
  **Os dois modos online são 3x3 por turnos** (`iniciarBatalha3x3`): o
  `casual` monta o time antes da fila e não mexe no rating; o `ranked`
  entra na fila sem time e monta no draft (`iniciarDraft`). A luta 1x1
  não tem mais modo online.

Regras de segurança: `firestore.rules` e `database.rules.json`.

> ⚠️ **As regras do Realtime Database mudaram por causa da ranqueada 3x3**
> e precisam ser publicadas de novo (`firebase deploy --only database`):
> a fila passou a levar o campo `time` (os três lutadores) e o nó `snap`
> aceita o formato novo (`aliado`/`inimigo`) além do antigo (`a`/`b`).
> Sem republicar, a ranqueada dá `permission_denied` na hora de parear.
Hospedagem: `firebase.json` publica a **raiz** do projeto (o `public/` é a
página padrão do Firebase e fica de fora).

---

## 6.2 Painel do dono — `admin.html`

Página separada do jogo, login por e-mail (`admin123@hotmail.com`). A
interface só decide **o que mostrar**: quem pode apagar de verdade são as
regras do Firestore (`firestore.rules`, função `admin()`), então driblar
a tela não adianta.

Duas coisas lá dentro:

- **📊 PERSONAGENS NA RANQUEADA** — quem é mais escolhido e quanto cada
  um ganha. Filtro de 7/30 dias, ordenação por escolha ou por vitória.
- **⚠ RESETAR RANKING** — apaga perfis + histórico (temporada nova).

**De onde saem os números.** Não existe coleção de estatística: eles são
somados na hora a partir de `matches`. Toda partida de ranqueada já
gravava `meuTime` ("id1,id2,id3") e `resultado` — só faltava contar.
Três detalhes que mudam a leitura e por isso estão escritos na tela:

- Cada partida grava **um documento por jogador**, então a coluna é
  "% dos **times**", não "% das partidas" (por isso o resumo mostra
  `42 times ≈ 21 partidas`).
- Partida vencida por **abandono** conta igual (o ponto foi para o
  ranking de verdade), mas infla a vitória do time de quem ficou — o
  total aparece separado no resumo.
- Abaixo de **10 partidas decididas** o percentual de vitória vem
  marcado com **?**: com amostra desse tamanho o número oscila sozinho e
  não serve para balancear.

A cor da barra de vitória é o atalho de leitura: **vermelho ≥58%**
(forte demais), **verde 48–52%** (equilibrado), **azul ≤42%** (fraco).
Quem tem 0 escolha aparece apagado no fim — "ninguém quer" também é
informação de balanceamento.

A consulta é `orderBy('criadoEm','desc') + limit(3000)` **sem `where`**:
filtrar por modo no servidor exigiria criar um índice composto no
console do Firebase. O filtro de ranqueada é feito no cliente (quem não
tem `meuTime` não é ranqueada) e o período também.

---

## 6.3 Perfil do jogador — avatar, favorito, elo atual e maior elo

Cada jogador escolhe uma **foto de perfil**: não é upload de imagem, é o
**rosto de um dos 11 personagens do 3x3**, recortado automaticamente da
própria spritesheet dele. Clicando em qualquer linha do **ranking** abre
o perfil PÚBLICO de quem clicou — próprio ou de outra pessoa, é a mesma
tela, só que o botão de trocar a foto só aparece no seu.

**De onde vem o retrato — `Sprites.renderFace` (`js/sprites.js`).** As
folhas de sprite não têm um quadro de retrato de verdade (a folha antiga
tinha uma faixa "0=retrato" que nunca chegou a ser usada nos personagens
atuais). O recorte é uma **aproximação por fração** do quadro `idle`:
`FACE_CROP_PADRAO = [0.18, 0.00, 0.64, 0.54]` (x,y,w,h em frações do
quadro) funciona pra maioria do elenco porque todos têm proporção de
corpo parecida (mesma convenção do jogo: "todos ficam com a mesma
altura"). ⚠️ Já foi mais fechado (`[0.30,0.03,0.40,0.34]`) e ficou feio
sem marcação de rosto de verdade na folha — sem esse marcador, um close
apertado tem mais chance de acertar só metade da cara ou só o cabelo. O
valor atual é o antigo alargado 1,6× mantendo o mesmo centro (dá pra
recalcular outro fator com a mesma fórmula se precisar ajustar nos dois
sentidos: `centro ± (tamanho×fator)/2`, sempre a partir do MESMO centro
pra não precisar recalibrar tudo nos personagens que já têm override).
Três personagens precisaram de um recorte próprio
(`char.faceCrop`, em `js/characters.js`) porque fogem da proporção
padrão:
- **Fat Girl** — o rosto dela fica na METADE DIREITA do quadro (o padrão
  pegava só cabelo).
- **Loirinha da CDI** — mais alta que a média; o padrão pegava só o topo
  do cabelo loiro.
- **Smergula** — o padrão pegava zoom demais, cortando o rosto pela
  metade.

Cada um foi calibrado visualmente (zerando o crop numa grade 10% e
comparando com o quadro inteiro) — ver o comentário ao lado de cada
`faceCrop`. Se um personagem novo entrar com proporção muito diferente
(criança, algo não-bípede, etc.), o padrão vai errar do mesmo jeito e
precisa do mesmo tratamento.

**Dados novos em `players/{uid}` (`js/ranked.js`):**
- `avatar` — id do personagem escolhido (string) ou `null`. Só o cliente
  confere se o id existe de verdade (`Characters.byId`); a regra do
  Firestore só limita tamanho, não valida contra a lista do elenco.
- `peakRating` — o MAIOR rating que o jogador já teve. Só sobe (nunca
  volta pra trás quando o rating cai por derrota) — é isso que faz ele
  ser diferente do `rating` normal na tela de perfil. Atualizado no mesmo
  lugar que o rating, em `report()` e `reportOnline()`:
  `p.peakRating = Math.max(p.peakRating||START, p.rating)`.
- Perfis gravados ANTES desta versão não têm os dois campos —
  `comPadroes()` preenche na leitura (`peakRating` = o maior entre
  `rating` atual e o valor inicial; `avatar` = `null`), sem precisar
  migrar nada no banco.

**Personagem favorito — não é um contador novo.** Vem de reler
`matches` filtrando por `uid` (`Ranked.favorito(uid)`, que soma o campo
`meuTime` de cada partida ONLINE do jogador — a mesma fonte que o painel
do dono já usa pra estatística global, só que agora por jogador em vez
de agregada). Como só a ranqueada online grava `meuTime`, "favorito" já
sai correto como "mais usado nas partidas online" sem filtro extra.
Query só com `where('uid','==',uid)` (sem `orderBy`), de propósito: juntar
`where` de igualdade com `orderBy` num campo diferente pede um índice
composto que teria que ser criado à mão no console — um filtro só não
precisa de índice nenhum (mesmo cuidado do painel do dono, ver §6.2).

**Winrate na ranqueada não precisou de query nova.** `wins`/`losses`
já existiam no perfil (incrementados a cada `reportOnline`), e como só a
ranqueada online grava resultado hoje, esse número JÁ É o winrate da
ranqueada — `Ranked.profilePublico(uid)` só divide os dois.

**Histórico local passou a existir de verdade.** Antes `addMatch` do
backend local (`localBackend`, usado quando não há Firebase) era um
no-op — "histórico só na nuvem". Sem histórico local, o cartão de
favorito nunca tinha o que mostrar em modo offline/teste. Agora ele
grava em `localStorage` (`arena_matches_v1`, teto de 300 registros) e
`matchesOf(uid,n)` filtra por lá — o perfil funciona 100% sem Firebase
configurado, pra dar pra testar a feature inteira offline.

**Regras do Firestore (`firestore.rules`)** ganharam validação pros dois
campos novos em `perfilValido()` — `avatar` (string curta ou ausente) e
`peakRating` (mesma faixa do `rating`) — e o mesmo tipo de trava que já
existia pro rating: `peakRating` não pode saltar mais que +60 por escrita
(senão dava pra escrever "maior elo: 4000" numa tacada só, sem ter
chegado lá de verdade).

⚠️ **Testado com o Firebase de produção ligado — sem escrever nele.**
Este projeto já tem `js/firebase-config.js` preenchido com um projeto
real (jogadores de verdade no ranking). Pra testar o perfil sem sujar o
banco, o teste chamou `Ranked.setBackend(null)` — o `Ranked` (autenticado
de verdade pelo Firebase Auth) passa a gravar tudo no `localStorage` em
vez do Firestore, sem precisar mexer no código. Qualquer teste futuro que
grave dados de mentira deveria fazer o mesmo, em vez de criar contas de
teste que ficam presas no banco real (o Firestore não deixa apagar
`players`/`matches` pelo cliente — só o `admin()` consegue, ver §6.2).

---

## 6.4 Modo Sobrevivência — `js/turnui.js` + `js/ranked.js`

Acessível pelo Strong Smerg no DOJO DA MATA (`js/hub.js`, nó `survival`).
O jogo sorteia o time do JOGADOR (`TurnUI.timeAleatorio()` — mesma função
que já sorteava o time inimigo em `comecar()`, agora reaproveitada nos dois
lados) e encadeia uma luta 3x3 offline atrás da outra contra times inimigos
sorteados, até o jogador perder ou apertar "PARAR AQUI".
`timeAleatorio()` é uma função interna do `turnui.js` (não exportada),
reaproveitada tanto pelo time inimigo da luta normal quanto pelos dois
lados da sobrevivência.

- **Não é um modo novo dentro do motor** — é o mesmo `TurnBattle`/`TurnUI`
  da luta 3x3 contra IA, só chamado em sequência. `ctrl={survival:true,
  meuLado:'aliado'}` é o que diferencia a tela de fim (`renderFimSurvival`)
  da tela normal de "JOGAR DE NOVO / MENU".
- **A vida NÃO carrega entre rodadas.** `TurnBattle.iniciar()` sempre cria
  unidades do zero (`criarUnidade`, vida cheia, cds zerados, sem buffs) —
  não dava pra fazer o time do jogador entrar ferido na próxima luta sem
  mexer no motor. Decisão deliberada de não mexer nisso: o desafio da
  sobrevivência é a SEQUÊNCIA de adversários sorteados (cada um pode vir
  com uma composição mais dura), não desgaste de vida acumulado.
- **`survival.streak`** conta quantos times caíram. Incrementado uma única
  vez por vitória, guardado por `survival.processado` — sem essa trava o
  `render()` (chamado de novo a cada repintura da tela de fim) contaria a
  mesma vitória várias vezes.
- **Recorde** (`Ranked.reportSurvival(streak)`, campo `survivalRecord` no
  perfil): só sobe, mesmo padrão do `peakRating` (ver §6.3). Salvo tanto na
  DERROTA quanto quando o jogador escolhe parar de propósito depois de uma
  vitória — "parar no auge" precisa valer, senão a jogada ótima seria
  sempre continuar até morrer.
- Sem trava de salto por escrita nas regras do Firestore (diferente do
  `peakRating`, que trava ±60 por partida): uma corrida legítima pode
  render dezenas de vitórias numa tacada só antes de gravar.

---

## 6.5 Skins — `js/characters.js` + `js/catalog.js` + `js/sprites.js` + `js/ranked.js`

Skin é troca de FOLHA (visual puro — não mexe em stat, skill nem passiva
nenhuma), escolhida no **CATÁLOGO** (`screen-catalogo`, o Mecas no
LABORATÓRIO 5000Z do hub). Hoje só o Fat Smerg tem uma: a **Skin Honesta**
(`assets/fat_smerg/white_fat_smerg.png`).

- **`char.skins[]`** (`characters.js`): cada entrada é `{id, nome, icone,
  sheet, anims, unlock, desc}`. A primeira é sempre `{id:'padrao', nome:
  'Padrão'}` (sem `sheet` — usa a folha normal do personagem). `anims` é
  OPCIONAL: só precisa sobrescrever as poses onde a folha da skin não bate
  quadro-a-quadro com a original (ver o caso da Honesta abaixo); o resto
  herda de `char.anims` sem repetir nada.
- **`Sprites.skinOf(char, skinId)`** — mesma ideia do `formOf` (usado nas
  transformações do Mecas/Smergula): devolve uma "visão" do personagem
  (`Object.create(char)`) apontando pra folha da skin, com os `anims`
  mesclados (`Object.assign({}, char.anims, skin.anims)`). `'padrao'`
  devolve o char original sem view nenhuma.
- **`Characters.charComSkin(c)`** — o ponto único que resolve "com que
  folha eu desenho esse personagem AGORA": devolve `c` puro se a skin
  equipada for a padrão, ou `Sprites.skinOf(c, skinId)` senão. Todo lugar
  que desenha um personagem no 3x3 chama isso ANTES de mandar pro
  `Sprites.renderTo/renderPose` — hoje são três: o grid do catálogo
  (`catalog.js`), a grade de MONTAGEM DE TIME (`TurnUI.animarMontagem`) e
  os lutadores DENTRO da própria BATALHA (`TurnUI.desenharSprites`).
- **Exceção de propósito: o DRAFT da ranqueada (`js/turndraft.js`) NUNCA
  aplica skin** — mostra sempre a folha padrão de todo mundo, ligado ou
  não. É um pedido explícito: no meio de uma escolha ao vivo contra outro
  jogador (draft alternado, cada um vendo o que o outro pode pegar) não é
  hora de mostrar cosmético — só depois que os times fecham e a BATALHA
  começa de verdade é que a skin equipada aparece.
- **Continua sem sincronizar entre os dois lados de uma partida online.**
  Cada jogador vê CADA personagem (seu ou do adversário) com a skin que
  ELE PRÓPRIO tem equipada no aparelho dele — é uma preferência de tela,
  não um cosmético "pertencendo" a uma unidade específica da partida. Os
  dois jogadores podem estar vendo peles diferentes pro mesmo personagem
  ao mesmo tempo, e está certo assim (evita ter que mandar a escolha de
  skin pela rede, que não foi pedido).
- **Equipada = preferência LOCAL** (`localStorage`, chave
  `arena_skins_equip_v1`, `{charId: skinId}`, lida/gravada por
  `Characters.skinEquipadaId`/`salvarSkinEquipada`) — é só "qual pele eu
  quero ver", não precisa de conta nem sincroniza entre dispositivos.
- **Desbloqueada = conquista do PERFIL** (`unlockedSkins: string[]` em
  `players/{uid}`, cada item é `Characters.skinKey(charId, skinId)` tipo
  `"fat_smerg__honesta"`). Preso à conta — sem login não desbloqueia nada
  (mesma limitação que já existe pro rating: `Ranked.profile()` devolve
  `null` pra convidado).
- **A REGRA de desbloqueio** mora na própria skin (`skin.unlock:
  {tipo:'ranked_wins', valor:10}`). `Ranked.verificarSkins(p)` varre
  `Characters.skinsComRegra()` (toda skin do elenco que tem `unlock`) e
  libera quem já cumpriu — chamada em três pontos: depois de `report()` e
  `reportOnline()` (por causa do `p.wins` que acabou de mudar) E dentro de
  `profile()` (pega quem já cumpria o requisito ANTES da skin existir,
  sem esperar a próxima vitória — sem popup aí, só fica liberada da
  próxima vez que abrir o catálogo).
- **Popup de skin nova** (`mostrarSkinPopup(charId, skin)`, em
  `index.html`, do lado do `toast()`): só dispara depois de uma vitória
  ONLINE RANQUEADA de verdade (`js/online.js`, `fimDaBatalha`, lendo
  `r.skinsNovas` que `reportOnline` devolve) — nunca no meio de
  `profile()`, que roda o tempo todo em telas que não têm nada a ver com
  "acabei de conquistar algo".
- **A folha da Honesta tem um defeito de recorte automático**: a faixa 5
  (flexão/aura) saiu com só 3 quadros em vez de 4 — dois quadros ficaram
  colados e o `spritesheet.js` detectou como um blob só (ver
  `sheet-debug.html` pra comparar com `fat_smerg.png`). Por isso a skin
  sobrescreve só `win`/`special`/`aim` (as três poses que usam a faixa 5)
  pra não cair nesse quadro quebrado — idle/walk/punch/kick/hurt/ko
  reaproveitam o `anims` original sem alteração nenhuma, porque as faixas
  0-4 batem certinho entre as duas folhas.

---

## 7. Receitas rápidas

**Rodar localmente** (sem cache):

```bash
python dev-server.py
```

**Adicionar um personagem novo**
1. Coloque a spritesheet em `assets/`.
2. Abra `sheet-debug.html` para ver em que **faixa** ficou cada pose.
3. Adicione a entrada no `ROSTER` de `js/characters.js` (paleta, `anims`,
   stats e as 4 skills do 1x1).
4. Adicione a ficha dele em `FICHAS` no `js/turndata.js` (stats, passiva e
   as 4 skills do 3x3) — sem isso ele não aparece na montagem de time.
5. Suba o `?v=` dos dois arquivos no `index.html`.

**Mudar um golpe do 3x3**: só `js/turndata.js`. As etiquetas do botão e da
ficha se atualizam sozinhas, e `TurnData.estilo()` decide a animação.
Vale para a ranqueada também — os dois lados usam o mesmo arquivo.

**Adicionar uma skin** (ver §6.5)
1. Coloque a folha em `assets/` e compare com a original no
   `sheet-debug.html` (adicione uma entrada lá) — o ideal é ela ter a
   MESMA disposição de faixas/quadros da folha base, senão vai precisar
   sobrescrever `anims` pose por pose (como a Honesta fez com band 5).
2. Acrescente em `char.skins[]` (`characters.js`): `{id, nome, icone,
   sheet, anims (só o que precisar sobrescrever), unlock:{tipo:
   'ranked_wins', valor:N}, desc}`. Se o personagem ainda não tem
   `skins[]`, comece o array com `{id:'padrao', nome:'Padrão'}`.
3. Suba o `?v=` de `characters.js`.
Não precisa mexer em `catalog.js`, `ranked.js` nem no popup — o
desbloqueio, o picker e a persistência já são genéricos pra qualquer
skin com `unlock` preenchido.

**Testar a ranqueada sem servidor**: `Net.setTransport(null)` força o
transporte local (loopback). Dá para pôr um adversário falso na fila com
`Net.joinQueue({uid:'b2', nick:'Bruno', rating:1000, time:[...]}, 'ranked')`
antes de entrar pelo menu.

**Adicionar um cenário**: uma entrada nova em `AMBIENTES` (`js/turnbg.js`)
com `id`, `nome`, `icone`, `estatico(ctx)` e `animado(ctx)`. Use os
utilitários `px`, `disco`, `ceu` e `chao` do próprio arquivo. Entra
automaticamente no sorteio.

**Dar um golpe de setup a outro personagem**: acrescente `smergulite()` na
lista de skills dele em `FICHAS`, ou copie o formato do `CORSA BLINDADO`
(campo `estrutura`). Repetir golpe entre personagens é esperado.

**Mudar o ritmo da batalha 3x3**: `TurnBattle.setDelayIA(ms)` (padrão 700).
A duração da animação sai de `iniciarAnim()` em `js/turnui.js`.

---

## 8. Livro do jogo — `livro.html`

Manual em formato de LIVRO pro jogador (não pra quem mexe no código — é
o `CONTEXT.md` que cumpre esse papel). Arquivo HTML independente, como
`admin.html`/`sheet-debug.html`: não é linkado de dentro do jogo (assim
como os outros dois), fica só acessível direto pela URL. Reaproveita
`css/style.css` (fonte pixel, paleta, botões) mas o layout do livro em
si é próprio, todo dentro do próprio arquivo.

**Como funciona:** um array `PAGINAS` (no `<script>` do próprio
`livro.html`) com `{titulo, corpo}` por página — `corpo` é HTML puro.
`Livro.proxima()/anterior()/irPara(i)` trocam a página com uma
animaçãozinha de "virar" (CSS `@keyframes`), atualizam o contador
"N / total", os pontinhos de navegação e desabilitam os botões nas
pontas. Setas do teclado (`◀ ▶`) fazem a mesma coisa que os botões. A
página 2 (Sumário) é montada dinamicamente a partir do próprio array —
adicionar uma página nova no meio do array já entra no sumário sozinho,
sem precisar editar o sumário à mão.

**O conteúdo é escrito à mão, não lido ao vivo de `turndata.js`/
`characters.js`.** Foi uma escolha deliberada: os números do elenco nas
páginas de personagens (`Elenco I`/`Elenco II`) são um retrato do que
era verdade quando a página foi escrita, e ENVELHECEM sozinhos conforme
o balanceamento muda — exatamente por isso existe a regra (ver o aviso
logo no topo deste arquivo) de atualizar o livro toda vez que uma
mecânica muda. A ÚNICA coisa lida ao vivo é a versão atual, na última
página (`Créditos`), puxada de `PatchNotes.VERSAO_ATUAL` — isso sim faz
sentido ficar automático, porque é só um número solto, sem risco de
descrever uma mecânica errada se ficar pra trás.

**Sumário das 13 páginas atuais**: Capa · Sumário · Como jogar · Ordem de
turno · Dano e defesa · Status e efeitos · Passivas · Elenco I · Elenco
II · Ranqueada e ELO · Perfil do jogador · Modo História · Créditos.
- Modo História mudou (controle, missões, grupo, salvamento) → página "Modo História".

**Onde editar o quê:**
- Fórmula de dano mudou → página "Dano e defesa".
- Status novo (tipo o antigo `meditar` que virou `meditarStack`) →
  página "Status e efeitos".
- Passiva nova ou passiva existente mudou de comportamento → página
  "Passivas".
- Personagem novo, ou stats/kit de um existente mudaram → "Elenco I" ou
  "Elenco II" (o array de 11 fichas está dividido em duas páginas só
  pra não ficar gigante — adicionar o 12º personagem é decidir em qual
  das duas colocar, ou abrir uma terceira se as duas já estiverem cheias).
- Sistema de ranqueada/ELO/patente mudou → "Ranqueada e ELO".
- Sistema de perfil (avatar, favorito, maior elo) mudou → "Perfil do
  jogador".
