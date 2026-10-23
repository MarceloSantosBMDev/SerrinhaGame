# Winrate COM ESTRATÉGIA — v1.46

Simulado no motor real do jogo. Pra cada personagem, uma busca testou listas de prioridade de golpes com condições (rodada, vida, número de usos, quem mirar) e ficou com a que mais vence. Cada estratégia foi conferida em 4.000 lutas novas. Depois, um torneio de 60.000 batalhas 3x3 com TODO MUNDO usando a sua melhor estratégia.

| # | Personagem | IA normal (todos) | Com estratégia (contra a IA normal) | Torneio: todos com estratégia |
|---|---|---|---|---|
| 1 | Marcelão Black JW | 48,5% | 82,0% | **71,9%** |
| 2 | Criança Rosa | 52,2% | 71,8% | **61,3%** |
| 3 | Fat Girl | 47,3% | 74,8% | **61,2%** |
| 4 | Adulto Feliz | 51,4% | 74,2% | **58,7%** |
| 5 | Fat Mango | 50,5% | 73,9% | **58,5%** |
| 6 | Mameluco | 49,1% | 71,0% | **57,0%** |
| 7 | Serrinha Dog | 50,2% | 69,5% | **55,8%** |
| 8 | Smergula | 48,0% | 69,7% | **55,1%** |
| 9 | Mano Coxinha | 49,9% | 63,8% | **48,5%** |
| 10 | Lambança | 50,8% | 63,3% | **47,7%** |
| 11 | Fat Smerg | 48,5% | 63,6% | **47,2%** |
| 12 | Careca | 51,2% | 63,5% | **46,9%** |
| 13 | Cargas | 48,7% | 49,9% | **45,6%** |
| 14 | Smergulão | 47,6% | 52,8% | **45,4%** |
| 15 | Prodocimo | 52,7% | 57,0% | **44,0%** |
| 16 | Mecas | 51,1% | 53,9% | **43,2%** |
| 17 | Strong Smerg | 47,6% | 54,4% | **41,3%** |
| 18 | Dmaterelizador | 52,5% | 54,3% | **40,8%** |
| 19 | Loirinha da CDI | 50,2% | 50,7% | **40,6%** |
| 20 | Tupas | 51,5% | 55,0% | **39,9%** |
| 21 | Cabelin | 50,4% | 52,3% | **39,5%** |

## A estratégia de cada um

Ordem de prioridade: no turno dele, sai o PRIMEIRO golpe da lista que estiver pronto e com a condição valendo. Entre parênteses, quantos % dos turnos dele aquela linha foi a escolhida no torneio. Linhas que nunca aconteceram foram tiradas.

### Marcelão Black JW — 71,9%
1. **🪙 Moeda Fatal** — sempre que estiver pronto (44%)
2. **⏱ Furto de Tempo** — sempre que estiver pronto (44%)
3. **👊 Soco de Bolso** — sempre que estiver pronto (12%)
- Mira: golpe de um alvo vai no inimigo com a MENOR % de vida.
- Nunca usa: 🧊 Escudo Temporal, 🌀 TEMPESTADE DE GELO.

### Criança Rosa — 61,3%
1. **🧸 Ursinho Arremessado (nas outras formas: Garra Sombria)** — sempre que estiver pronto (99%)
- Mira: golpe de um alvo vai no inimigo com MENOS vida.
- Nunca usa: 🤗 Abraço Curativo, 🎵 Cantiga de Ninar, 🐻 Invocar o Ursão, 👹 DESPERTAR DEMÔNIO.

### Fat Girl — 61,2%
1. **💥 Golpe de Quadril** — sempre que estiver pronto (40%)
2. **🦵 Chute Giratório** — sempre que estiver pronto (33%)
3. **⚪ Baba Branca** — sempre que estiver pronto (25%)
4. **👊 Soco Rápido** — sempre que estiver pronto (2%)
- Mira: golpe de um alvo vai no inimigo com MENOS vida.
- Nunca usa: 🤍 MEDITAÇÃO BRANCA.

### Adulto Feliz — 58,7%
1. **🦵 Voadora da Alegria** — sempre que estiver pronto (37%)
2. **✋ Tapa de Amor** — só com 1 inimigo de pé (17%)
3. **🤗 Abraço de Urso** — com 2 ou mais inimigos de pé (24%)
4. **🍬 Bombom Explosivo** — sempre que estiver pronto (20%)
5. **✋ Tapa de Amor** — sempre que estiver pronto (1%)
- Mira: golpe de um alvo vai no inimigo com MENOS vida.
- Nunca usa: 🎭 BIZARRICE.

### Fat Mango — 58,5%
1. **🔥 Forno Aceso** — sempre que estiver pronto (40%)
2. **🍞 BANQUETE** — quando alguém do time estiver abaixo de 60% de vida (20%)
3. **🥐 Croissant Bumerangue** — sempre que estiver pronto (30%)
4. **🍞 BANQUETE** — quando alguém do time estiver abaixo de 80% de vida (1%)
5. **🥖 Pancada de Pão** — só com a vida cheia (1%)
6. Nada disso disponível → a IA normal escolhe (9%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Mameluco — 57,0%
1. **💥 ATROPELAMENTO** — só com a própria vida abaixo de 70% (8%)
2. **🚗 Trombada de Astra** — só com 1 inimigo de pé (15%)
3. **🏎 Pisando Fundo** — só até a rodada 1 (14%)
4. **🏎 Pisando Fundo** — só depois da rodada 3 (15%)
5. **💥 ATROPELAMENTO** — sempre que estiver pronto (14%)
6. **😤 Provocação Geral** — só com a própria vida em 70% ou mais (12%)
7. **🚗 Trombada de Astra** — sempre que estiver pronto (23%)
- Mira: golpe de um alvo vai no inimigo com MENOS vida.

### Serrinha Dog — 55,8%
1. **☠ Presas Tóxicas** — sempre que estiver pronto (36%)
2. **🩸 Mordida** — sempre que estiver pronto (64%)
- Mira: golpe de um alvo vai no inimigo com a MENOR % de vida.
- Nunca usa: 🔄 Rolamento, 🌑 FÚRIA CANINA, 🦠 Smergulite Aguda.

### Smergula — 55,1%
1. **😵 Miragem (nas outras formas: LOUCURA)** — sempre que estiver pronto (39%)
2. **🩸 Corte Espectral (nas outras formas: RASGO DEMONÍACO)** — quando alguém do time estiver abaixo de 60% de vida (24%)
3. **🩸 Corte Espectral (nas outras formas: RASGO DEMONÍACO)** — sempre que estiver pronto (10%)
4. **☠ Praga Venenosa (nas outras formas: PESTE NEGRA)** — sempre que estiver pronto (26%)
5. **🖐 Toque Sugador (nas outras formas: GARRA DA ALMA)** — sempre que estiver pronto (1%)
- Mira: golpe de um alvo vai no inimigo de MAIOR ataque.
- Nunca usa: 🕸 VÉU MALDITO.

### Mano Coxinha — 48,5%
1. **🍕 Comer Pizza (nas outras formas: Comer Coxinha / Comer Hambúrguer)** — só com 1 inimigo de pé (10%)
2. **🧱 Muralha de Massa (nas outras formas: ARROTO DE CHEDDAR / Entrega Relâmpago)** — só até a rodada 4 (19%)
3. **🛡 Casca Crocante (nas outras formas: CRUNCH! / Rodízio de Tapas)** — só com 1 inimigo de pé (11%)
4. **🍕 Comer Pizza (nas outras formas: Comer Coxinha / Comer Hambúrguer)** — só com a própria vida abaixo de 50% (9%)
5. **🍳 Óleo Quente (nas outras formas: Voadora de Hambúrguer / Fatia Voadora)** — sempre que estiver pronto (22%)
6. Nada disso disponível → a IA normal escolhe (30%)
- Mira: golpe de um alvo vai no inimigo de MAIOR ataque.

### Lambança — 47,7%
1. **🔇 Selo do Silêncio** — sempre que estiver pronto (22%)
2. **✊ Golpe Consagrado** — só até a rodada 3 (27%)
3. Nada disso disponível → a IA normal escolhe (51%)
- Mira: golpe de um alvo vai no inimigo com a MENOR % de vida.

### Fat Smerg — 47,2%
1. **💥 COLAPSO** — só depois da rodada 2 (20%)
2. **🌋 Terremoto** — sempre que estiver pronto (38%)
3. **😤 Provocar Fúria** — sempre que estiver pronto (30%)
4. Nada disso disponível → a IA normal escolhe (12%)
- Mira: golpe de um alvo vai no inimigo com a MENOR % de vida.

### Careca — 46,9%
1. **🫧 Chão Ensaboado (nas outras formas: Lodo Tóxico)** — sempre que estiver pronto (48%)
2. **🧹 Esfregada (nas outras formas: Toca do Verme)** — só até a rodada 2 (15%)
3. **🪠 Estocada do Cabo (nas outras formas: Cusparada Ácida)** — só com a própria vida abaixo de 50% (16%)
4. **🧹 Esfregada (nas outras formas: Toca do Verme)** — só com 1 inimigo de pé (4%)
5. **🧹 Esfregada (nas outras formas: Toca do Verme)** — só depois da rodada 2 (16%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).
- Nunca usa: 😠 Encarada, 🕸 VÉU MALDITO.

### Cargas — 45,6%
1. **🌪 TEMPESTADE ENCURRALADA** — só depois da rodada 1 (20%)
2. **🌩 Rajada em Cadeia** — com 2 ou mais inimigos de pé (31%)
3. **🌪 TEMPESTADE ENCURRALADA** — sempre que estiver pronto (2%)
4. **💨 Investida Relâmpago** — sempre que estiver pronto (29%)
5. **⚡ Choque Rápido** — só com 1 inimigo de pé (4%)
6. **⚡ Choque Rápido** — só com a própria vida abaixo de 30% (4%)
7. Nada disso disponível → a IA normal escolhe (10%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Smergulão — 45,4%
1. **🌈 FUMAÇA COLORIDA** — sempre que estiver pronto (25%)
2. **🗡 Golpe Traiçoeiro** — só com 1 inimigo de pé (14%)
3. **👤 Passo nas Sombras** — só com a própria vida abaixo de 50% (9%)
4. **🗡 Golpe Traiçoeiro** — só com a vida cheia (7%)
5. Nada disso disponível → a IA normal escolhe (46%)
- Mira: golpe de um alvo vai no inimigo com a MENOR % de vida.

### Prodocimo — 44,0%
1. **🫳 Mão Leve** — só depois da rodada 4 (15%)
2. **🃏 Finta** — só depois da rodada 3 (37%)
3. **🫳 Mão Leve** — só com a própria vida abaixo de 90% (13%)
4. Nada disso disponível → a IA normal escolhe (35%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Mecas — 43,2%
1. **🦾 Combo Cibernético (nas outras formas: Combo Hidráulico / PUNHOS 5000Z)** — só com 1 inimigo de pé (10%)
2. **⚡ PROTOCOLO 5000Z (nas outras formas: CANHÃO DE PLASMA / PROTOCOLO 5000Z — TOTAL)** — quando alguém do time estiver abaixo de 60% de vida (10%)
3. **🦾 Combo Cibernético (nas outras formas: Combo Hidráulico / PUNHOS 5000Z)** — só com a própria vida abaixo de 30% (12%)
4. Nada disso disponível → a IA normal escolhe (68%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Strong Smerg — 41,3%
1. **🌀 RAJADA DE FÚRIA** — sempre que estiver pronto (20%)
2. **⚡ Descarga** — sempre que estiver pronto (30%)
3. **👊 Jab Duplo** — sempre que estiver pronto (50%)
- Mira: golpe de um alvo vai no inimigo com MENOS vida.
- Nunca usa: 💨 Foco Veloz, 🦠 Smergulite Aguda.

### Dmaterelizador — 40,8%
1. **🕳 Portal** — só com a vida cheia (10%)
2. **🕳 Portal** — só com 1 inimigo de pé (5%)
3. **🌀 Desmaterializar** — só com a própria vida em 70% ou mais (17%)
4. Nada disso disponível → a IA normal escolhe (68%)
- Mira: golpe de um alvo vai no inimigo de MAIOR ataque.

### Loirinha da CDI — 40,6%
1. **💗 AMBIENTE: CHARME** — só com a própria vida abaixo de 70% (10%)
2. **💋 Beijo Curativo** — quando alguém do time estiver abaixo de 60% de vida (24%)
3. **👜 Bolsada** — com 2 ou mais inimigos de pé (33%)
4. **💗 AMBIENTE: CHARME** — quando alguém do time estiver abaixo de 80% de vida (9%)
5. **👜 Bolsada** — quando alguém do time estiver abaixo de 80% de vida (6%)
6. **✋ Tapa** — só com a própria vida em 50% ou mais (13%)
7. Nada disso disponível → a IA normal escolhe (5%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Tupas — 39,9%
1. **🌀 Correnteza** — só depois da rodada 1 (22%)
2. Nada disso disponível → a IA normal escolhe (78%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).

### Cabelin — 39,5%
1. **🧱 MURALHA DE LASANHA** — quando alguém do time estiver abaixo de 60% de vida (12%)
2. **🍅 Molho Fervendo** — só depois da rodada 4 (9%)
3. **🧱 MURALHA DE LASANHA** — só até a rodada 4 (16%)
4. **🍅 Molho Fervendo** — só depois da rodada 2 (4%)
5. Nada disso disponível → a IA normal escolhe (58%)
- Mira: golpe de um alvo vai no inimigo com menos vida (igual a IA).
