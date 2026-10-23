/* ============================================================
   PERSONAGENS — Fat Smerg, Strong Smerg e Serrinha Dog
   Sprites reais das spritesheets em assets/ (recorte automático).

   anims: pose -> {band, frames, fps, loop, crop}
     band   = faixa detectada na folha (ver sheet-debug.html)
     frames = índices dentro da faixa
     crop   = [x,y,w,h] em frações, para isolar o lutador quando o
              quadro original traz o oponente junto
   scaleAdj: ajuste fino de tamanho (todos ficam com a MESMA altura)
   ============================================================ */
const Characters = (function(){

  /* ============================================================
     RAÇAS — catálogo fixo (máx. 12), a maioria dos lutadores é
     variação de HUMANO. Um personagem pode ter mais de uma raça
     na ficha (ex: MEIO_ANJO já é a mistura anjo+humano em si).
     ============================================================ */
  const RACES = {
    humano:      { nome:'Humano', icone:'👤', cor:'#d8dde3',
      desc:'Gente comum que chegou até aqui na base de treino, teimosia e sorte.' },
    smergulus:   { nome:'Smergulus', icone:'💪', cor:'#8fd6ff',
      desc:'Uma linhagem de humanos que treinou (ou nasceu) pesado demais pro normal — '+
           'cada um puxou pra um lado, mas o corpo de base é sempre o mesmo.' },
    meio_anjo:   { nome:'Meio-Anjo', icone:'👼', cor:'#fff2b0',
      desc:'Metade humano, metade algo que desceu de cima — carisma que cura de verdade, '+
           'não é só figura de linguagem.' },
    meio_demonio:{ nome:'Meio-Demônio', icone:'😈', cor:'#a24bff',
      desc:'Metade humano, metade algo que subiu de baixo — a fome por alma é literal.' },
    automato:    { nome:'Autômato', icone:'🤖', cor:'#5ad6ff',
      desc:'Corpo de máquina rodando por cima (ou no lugar) de um humano — quanto menos '+
           'sobra do original, mais forte a casca fica.' },
    limeirense:  { nome:'Limeirense', icone:'🚙', cor:'#f4602a',
      desc:'Gente de cidade do interior — cresceu entre padaria, pancadão, igreja e um carro batido '+
           'que vale mais que a própria casa. Não tem nada de sobrenatural: é só orgulho e raiz.' }
  };
  function raceOf(id){ return RACES[id] || null; }

  const ROSTER = [

    /* ======================= FAT SMERG =======================
       Folha: 0=idle grande | 1=socos | 2=chutes | 3=poses
              4=corrida/agachado | 5=flex/aura/tiro            */
    { id:'fat_smerg', name:'Fat Smerg', title:'O Peso Pesado',
      /* olhos = recorte da FAIXA DOS OLHOS (cut-in da ultimate): quadro q=[faixa,quadro], r=[x,y,w,h] em frações */
      olhos:{ q:[0,0], r:[0.20,0.14,0.55,0.12] },
      sheet:'assets/fat_smerg/fat_smerg.png', scaleAdj:1.0,
      palette:{ skin:'#c98d5a', hair:'#2b1a10', primary:'#3d5a8a', secondary:'#d8b26a', shoe:'#6b4423', aura:'#8fd6ff', eye:'#141018' },
      weapon:{ type:'fists', color:'#c98d5a', edge:'#f0c9a0', aura:'#8fd6ff' },
      element:'earth', body:'big', sig:'',
      hp:95, atk:12, def:4, spd:3.7, jmp:11.2, weight:1.42, passive:'fortaleza', race:'smergulus',
      story:'Grandalhão de coração mole e soco de concreto. Ninguém acredita que ele seja rápido — até levar a barrigada que atravessa a arena.',
      lore:'Fat Smerg nasceu um smerg comum — mais um dos centenas de soldados iguais do exército da rainha '+
           'Smergula, no Smergulus Kingdom. Até que comeu mais do que qualquer smerg já tinha comido e ficou mais '+
           'gordo que o normal: virou ÚNICO, e poderoso justamente por isso — pele grossa, ossos pesados, paciência '+
           'de montanha. É o compatriota da rainha e anda sempre ao lado dela; ela foi a primeira a olhar pra ele '+
           'quando ele era só um número na fila, e ele não esquece. Na arena planta os pés, provoca quem for bobo '+
           'o suficiente de vir pra cima, e deixa a defesa que empilhou virar o estrago final.',
      anims:{
        idle:   {band:3, frames:[0,1,3],   fps:5,  loop:true},
        walk:   {band:4, frames:[0,1],     fps:7,  loop:true},
        jump:   {band:4, frames:[1],       fps:1,  loop:true},
        fall:   {band:4, frames:[0],       fps:1,  loop:true},
        block:  {band:3, frames:[2],       fps:1,  loop:true},
        punch:  {band:1, frames:[0,1,3],   fps:13, loop:false},
        thrust: {band:1, frames:[0,1,3],   fps:13, loop:false},
        swing:  {band:1, frames:[2,1,3],   fps:11, loop:false},
        kick:   {band:2, frames:[0,1,3],   fps:11, loop:false},
        special:{band:5, frames:[2,3],     fps:7,  loop:false},
        aim:    {band:5, frames:[3],       fps:1,  loop:false},
        hurt:   {band:4, frames:[3],       fps:1,  loop:true},
        ko:     {band:4, frames:[2],       fps:1,  loop:true},
        win:    {band:5, frames:[0,1],     fps:4,  loop:true},
        /* ---- golpes do 3x3 (`pose` da skill em turndata.js) ----
           a batalha de turnos espalha a sequência pelo tempo do golpe
           (ver `prog` em Sprites.frameFor), então cada quadro aparece. */
        provocar:  {band:5, frames:[[5,0],[1,3],[1,2]],      fps:7, loop:false},  // flexiona → avança → gancho
        terremoto: {band:2, frames:[[2,2],[4,1],[4,2]],      fps:6, loop:false},  // ergue o joelho → PISA
        rocha:     {band:5, frames:[[5,1],[5,0],[5,2]],      fps:5, loop:false},  // flexiona → aura
        colapso:   {band:5, frames:[[5,2],[2,1],[4,2]],      fps:6, loop:false},  // aura → salto → IMPACTO
        smergulite:{band:3, frames:[[3,2],[1,0]],            fps:6, loop:false}
      },
      skills:[
        { key:1, name:'Martelo Duplo', icon:'👊', cd:150,
          desc:'Soco rápido seguido de uma marretada com SUPER-ARMADURA (não é interrompido).',
          type:'melee', anim:'punch', startup:7, recovery:18, armor:true,
          hits:[ {start:7,end:12,reach:62,h:46,dmg:8,hitstun:14,kb:4},
                 {start:16,end:24,reach:78,h:54,dmg:14,hitstun:22,kb:9,color:'#8fd6ff'} ] },
        { key:2, name:'Chute Ascendente', icon:'🦵', cd:290,
          desc:'Lança o oponente para o alto — ele QUICA no chão, dando tempo de emendar outro golpe.',
          type:'melee', anim:'kick', startup:10, recovery:24,
          hits:[ {start:10,end:18,reach:74,h:84,dmg:13,hitstun:24,launch:true,up:15,kb:3,groundBounce:true,color:'#ffd77a'} ] },
        { key:3, name:'Barrigada Blindada', icon:'🛡', cd:330,
          desc:'Avança de barriga ATRAVESSANDO golpes (super-armadura) e atropela quem estiver na frente.',
          type:'dash', anim:'swing', startup:9, recovery:26, armor:true,
          dist:15, dmg:16, reach:72, kb:13, iframes:5 },
        { key:4, name:'ONDA DE ENERGIA', icon:'🌀', cd:840, super:true,
          desc:'Concentra energia e dispara uma esfera gigante que atravessa a arena.',
          type:'projectile', anim:'special', startup:20, recovery:32,
          dmg:26, speed:9, big:true, color:'#8fd6ff' } ],
      /* SKINS — visual só, não muda stat nenhum. `sheet` é uma folha
         separada com a MESMA disposição de faixas do original (ver
         sheet-debug), então reaproveita o `anims` base do personagem.
         A folha da Honesta tem a faixa 5 (flexão/aura) com só 3 quadros
         em vez de 4 — dois dos quadros da folha original saíram colados
         (o recorte automático detectou como um blob só) — por isso ela
         sobrescreve só win/special/aim pra não usar esse quadro quebrado. */
      skins:[
        { id:'padrao', nome:'Padrão' },
        { id:'honesta', nome:'Skin Honesta', icone:'🎽',
          sheet:'assets/fat_smerg/white_fat_smerg.png',
          anims:{ win:{band:5, frames:[0,2], fps:4, loop:true},
                  special:{band:5, frames:[2,2], fps:7, loop:false},
                  aim:{band:5, frames:[2], fps:1, loop:false} },
          unlock:{ tipo:'ranked_wins', valor:10 },
          desc:'Sem camisa, sem papas na língua — a versão do Fat Smerg que fala '+
               'exatamente o que pensa de cada adversário antes de acertar o soco.' }
      ] },

    /* ====================== STRONG SMERG ======================
       Folha: 0=4 poses | 1=[soco energia, chute voador(+alvo)]
              2=[guarda, soco energia, guarda]
              3=[merge, bloqueio, soco, guarda, NOCAUTE]        */
    { id:'strong_smerg', name:'Strong Smerg', title:'Punho de Ferro',
      olhos:{ q:[0,0], r:[0.28,0.115,0.45,0.06] },
      sheet:'assets/strong_smerg/strong_smerg.png', scaleAdj:1.0,
      palette:{ skin:'#8d5524', hair:'#1a1008', primary:'#2b2b2b', secondary:'#cfcfcf', shoe:'#8d5524', aura:'#4fc3f7', eye:'#141018' },
      weapon:{ type:'fists', color:'#8d5524', edge:'#c98d5a', aura:'#4fc3f7' },
      element:'lightning', body:'normal', sig:'',
      hp:152, atk:13, def:4, spd:5.2, jmp:13.5, weight:1.0, passive:'furia_titan', race:'smergulus',
      story:'Treinou a vida inteira para provar que velocidade vence tamanho. Cada golpe encadeado o deixa mais perigoso — e mais imprudente.',
      lore:'Natural do Smergulus Kingdom, Strong Smerg começou como o soldado nº 77 da rainha Smergula — um smerg '+
           'comum, igual a centenas de outros. Treinou todas as noites durante um ano até ficar mais forte que o '+
           'normal, e só existe um como ele. Disse não pra rainha na cara dela, fugiu do reino com o Serrinha Dog '+
           'e os dois viraram caçadores de recompensa. Na arena luta cada vez mais rápido a cada golpe que encaixa, '+
           'o que também é o problema: quando a fúria toma conta, ele para de escolher os golpes com cuidado, e é '+
           'aí que perde o combate que já tinha na mão.',
      anims:{
        idle:   {band:0, frames:[0,1,2,3], fps:6,  loop:true},
        walk:   {band:0, frames:[1,2],     fps:9,  loop:true},
        jump:   {band:0, frames:[3],       fps:1,  loop:true},
        fall:   {band:0, frames:[2],       fps:1,  loop:true},
        block:  {band:3, frames:[3],       fps:1,  loop:true},
        punch:  {band:2, frames:[0,1,2],   fps:14, loop:false},
        thrust: {band:2, frames:[0,1,2],   fps:14, loop:false},
        swing:  {band:2, frames:[1,2],     fps:12, loop:false},
        // o quadro do chute traz o oponente junto -> recorta só o lutador
        kick:   {band:1, frames:[1],       fps:9,  loop:false, crop:[0,0,0.62,1]},
        special:{band:1, frames:[0],       fps:8,  loop:false},
        aim:    {band:1, frames:[0],       fps:1,  loop:false},
        hurt:   {band:3, frames:[1],       fps:1,  loop:true},
        ko:     {band:3, frames:[4],       fps:1,  loop:true},
        win:    {band:0, frames:[0,1],     fps:4,  loop:true},
        // ---- golpes do 3x3 ----
        jab:       {band:2, frames:[[2,0],[2,1],[2,2],[1,0]],          fps:9, loop:false},
        descarga:  {band:3, frames:[[3,1],[3,2],[1,0]],                fps:7, loop:false},  // carrega → solta o choque
        focoVeloz: {band:0, frames:[[0,1],[0,2],[0,3],[0,2],[0,1]],    fps:9, loop:false},
        rajada:    {band:2, frames:[[2,1],[1,0],[2,1],[1,0],[1,1,[0,0,0.62,1]]], fps:9, loop:false},  // 4 socos → voadora
        smergulite:{band:3, frames:[[3,1],[3,2]],                      fps:6, loop:false}
      },
      skills:[
        { key:1, name:'Jab Duplo', icon:'⚡', cd:130,
          desc:'Dois jabs rápidos carregados de energia.',
          type:'melee', anim:'punch', startup:5, recovery:14,
          hits:[ {start:5,end:9,reach:60,h:42,dmg:7,hitstun:11,kb:3},
                 {start:11,end:16,reach:68,h:44,dmg:10,hitstun:16,kb:6,color:'#4fc3f7'} ] },
        { key:2, name:'Chute Voador', icon:'🦶', cd:280,
          desc:'Avança voando com o chute: atravessa a distância e joga o alvo longe.',
          type:'dash', anim:'kick', startup:7, recovery:20,
          dist:17, dmg:15, reach:84, kb:12, iframes:7, color:'#ffd54f' },
        { key:3, name:'Esquiva Relâmpago', icon:'💨', cd:260,
          desc:'Salta para trás ficando INTANGÍVEL e recupera 20 de fôlego. Serve para escapar de combos.',
          type:'dash', anim:'special', startup:4, recovery:14,
          dist:19, back:true, up:5, refund:20, iframes:18, dmg:0, color:'#4fc3f7' },
        { key:4, name:'RAJADA DE FÚRIA', icon:'💢', cd:780, super:true,
          desc:'Sequência brutal de socos que termina em um upper.',
          type:'melee', anim:'punch', startup:8, recovery:32,
          hits:[ {start:8,end:11,reach:66,h:56,dmg:5,hitstun:8,kb:1},
                 {start:13,end:16,reach:66,h:56,dmg:5,hitstun:8,kb:1},
                 {start:18,end:21,reach:66,h:56,dmg:5,hitstun:8,kb:1},
                 {start:23,end:26,reach:70,h:58,dmg:6,hitstun:8,kb:2},
                 {start:28,end:34,reach:78,h:70,dmg:13,hitstun:24,launch:true,up:14,kb:5,color:'#4fc3f7'} ] } ] },

    /* ====================== SERRINHA DOG ======================
       Folha: 0=[pulo x3, carrinho x3] | 1=rolamento x4
              2=soco duplo x3 | 3=[chute voador x4, quebra-guarda x2]
              4=[teleporte x2, nado/deitado] | 5=comemoração x6   */
    { id:'serrinha_dog', name:'Serrinha Dog', title:'O Vira-Lata Furioso',
      olhos:{ q:[3,0], r:[0.40,0.05,0.56,0.17] },
      sheet:'assets/serrinha/serrinha_dog.png', scaleAdj:0.95,
      palette:{ skin:'#c68642', hair:'#6b4423', primary:'#8a5a2b', secondary:'#e8d3b0', shoe:'#4a2f1a', aura:'#ffd28a', eye:'#141018' },
      weapon:{ type:'fists', color:'#8a5a2b', edge:'#e8d3b0', aura:'#ffd28a' },
      element:'earth', body:'normal', sig:'',
      hp:134, atk:14, def:3, spd:5.5, jmp:13.8, weight:0.92, passive:'agilidade', race:'smergulus',
      story:'Cão de rua que aprendeu a lutar fugindo. Rola, escorrega e desaparece — quando você percebe, já levou o carrinho que quebra qualquer guarda.',
      lore:'Antes de ter nome, ele era o CACHORRO ORELHA — um vira-lata orelhudo que roubava pão da cozinha do '+
           'castelo, no Smergulus Kingdom. A rainha Smergula o amaldiçoou pra fazer dele um bichinho de estimação '+
           'metade gente; ele ficou daquele jeito, de pé, com dentes de serra, e escolheu o próprio nome. Virou '+
           'caçador de recompensa ao lado do Strong Smerg, o primeiro que dividiu um pão com ele. Aprendeu a lutar '+
           'na rua, onde quem hesita apanha, então nunca fica parado: rola, escorrega, desaparece e reaparece já '+
           'mordendo. Não confia fácil em ninguém — só nunca vai admitir em voz alta o quanto confia no grandão.',
      anims:{
        idle:   {band:3, frames:[0,3],     fps:4,  loop:true},
        walk:   {band:3, frames:[0,1],     fps:8,  loop:true},
        jump:   {band:0, frames:[2],       fps:1,  loop:true},
        fall:   {band:0, frames:[1],       fps:1,  loop:true},
        block:  {band:3, frames:[3],       fps:1,  loop:true},
        punch:  {band:2, frames:[0,1,2],   fps:14, loop:false},
        thrust: {band:2, frames:[1,2],     fps:14, loop:false},
        swing:  {band:2, frames:[0,1,2],   fps:12, loop:false},
        kick:   {band:3, frames:[1,2],     fps:10, loop:false},
        roll:   {band:1, frames:[0,1,2,3], fps:16, loop:true},    // ROLAMENTO
        slide:  {band:0, frames:[3,4,5],   fps:10, loop:false},   // CARRINHO
        special:{band:4, frames:[0,1],     fps:7,  loop:false},   // TELEPORTE
        aim:    {band:4, frames:[1],       fps:1,  loop:false},
        hurt:   {band:3, frames:[4],       fps:1,  loop:true},    // QUEBRA-GUARDA (impacto)
        ko:     {band:4, frames:[2],       fps:1,  loop:true},    // deitado
        win:    {band:5, frames:[3,4,5],   fps:5,  loop:true},    // COMEMORAÇÃO
        // ---- golpes do 3x3 ----
        mordida:   {band:0, frames:[[0,1],[0,2],[2,1],[2,2]],          fps:8, loop:false},  // salta → crava
        rolamento: {band:1, frames:[[1,0],[1,1],[1,2],[1,3],[1,0],[1,1],[1,2],[1,3]], fps:14, loop:false},
        presas:    {band:4, frames:[[4,0],[4,1],[3,5]],                fps:7, loop:false},  // some → reaparece mordendo
        furia:     {band:5, frames:[[5,5],[0,2],[3,2],[0,4],[0,5]],    fps:8, loop:false},  // flexiona → salto → chute → carrinho
        smergulite:{band:5, frames:[[5,3],[3,5]],                      fps:6, loop:false}
      },
      skills:[
        { key:1, name:'Soco Duplo', icon:'🐾', cd:140,
          desc:'Dois socos rápidos em sequência.',
          type:'melee', anim:'punch', startup:6, recovery:15,
          hits:[ {start:6,end:10,reach:58,h:44,dmg:7,hitstun:12,kb:3},
                 {start:13,end:19,reach:66,h:46,dmg:10,hitstun:17,kb:6,color:'#ffd28a'} ] },
        { key:2, name:'Chute Voador', icon:'🦵', cd:290,
          desc:'Chute que joga o inimigo para cima — ele QUICA no chão e o combo continua.',
          type:'melee', anim:'kick', startup:9, recovery:22,
          hits:[ {start:9,end:17,reach:74,h:76,dmg:13,hitstun:22,launch:true,up:14,kb:4,groundBounce:true,color:'#ffd28a'} ] },
        { key:3, name:'ROLAMENTO', icon:'🔄', cd:200, type:'stance',
          desc:'ATIVO: vira uma bola e sai rolando. Some ao apertar [3] de novo ou quando o fôlego acabar. Enquanto rola, DEFLETE tudo (parry) e atropela quem encostar.',
          anim:'roll', color:'#ffd28a', drain:0.70, minSt:22,
          rollSpeed:7.4, contactDmg:8, contactRate:28,
          parry:true, parryDmg:6, parryStun:32, parryKb:12, parryText:'ROLOU!',
          onText:'ROLANDO!', offText:'parou' },
        { key:4, name:'CARRINHO DEVASTADOR', icon:'🦿', cd:800, super:true,
          desc:'Deslizada imparável que QUEBRA A GUARDA e derruba o oponente.',
          type:'dash', anim:'slide', startup:8, recovery:30,
          dist:21, dmg:29, reach:80, kb:14, iframes:12, guardBreak:true } ] },

    /* ======================= FAT MANGO =======================
       Folha: 0=[parado x3, combo de socos x3]
              1=[pão x4, PARRY COM O CORSA]
              2=[rodopio do croissant, arremesso]
              3=[poses, dano x2, vitória]                        */
    { id:'fat_mango', name:'Fat Mango', title:'O Padeiro Blindado',
      olhos:{ q:[0,0], r:[0.22,0.12,0.56,0.08] },
      sheet:'assets/fat_mango/fat_mango.png', scaleAdj:1.0,
      palette:{ skin:'#b06a3a', hair:'#3a2113', primary:'#f4602a', secondary:'#ffc93c', shoe:'#5a3a1a', aura:'#ffd166', eye:'#141018' },
      weapon:{ type:'fists', color:'#f4602a', edge:'#ffc93c', aura:'#ffd166' },
      element:'earth', body:'big', sig:'',
      hp:116, atk:12, def:4, spd:4.0, jmp:11.6, weight:1.30, passive:'padeiro', race:'limeirense',
      story:'Dono da padaria da esquina, brigou com meio bairro defendendo o próprio ponto. Bate com pão dormido, arremessa croissant que volta e, quando aperta, abre a porta do Corsa na cara do infeliz.',
      lore:'Fat Mango é Limeirense — gente de cidade do interior, sem nenhuma linhagem especial por trás, só um '+
           'padeiro que abriu o próprio ponto na esquina errada e teve que aprender a defender ele com as próprias '+
           'mãos (e com o que tivesse na bancada). Não tem superpoder nenhum: tem pão de véspera pesado como taco, '+
           'um Corsa 94 estacionado ali do lado que ele não hesita em usar como escudo, e uma teimosia de '+
           'comerciante que não larga o ponto nem apanhando. Entrou na arena pra provar que gente comum também '+
           'aguenta o tranco.',
      anims:{
        idle:   {band:0, frames:[0,1,2],   fps:5,  loop:true},
        walk:   {band:0, frames:[1,2],     fps:8,  loop:true},
        jump:   {band:0, frames:[2],       fps:1,  loop:true},
        fall:   {band:0, frames:[1],       fps:1,  loop:true},
        block:  {band:3, frames:[0],       fps:1,  loop:true},
        punch:  {band:0, frames:[3,4,5],   fps:14, loop:false},
        thrust: {band:0, frames:[3,4,5],   fps:14, loop:false},
        swing:  {band:0, frames:[4,5],     fps:12, loop:false},
        kick:   {band:0, frames:[5,4],     fps:12, loop:false},
        bread:  {band:1, frames:[0,1,2,3], fps:11, loop:false},   // PÃO
        car:    {band:1, frames:[4],       fps:1,  loop:true, anchor:0.30}, // PARRY DO CORSA
        special:{band:2, frames:[0,1],     fps:9,  loop:false},   // CROISSANT
        aim:    {band:2, frames:[1],       fps:1,  loop:false},
        hurt:   {band:3, frames:[2,3],     fps:6,  loop:true},
        ko:     {band:3, frames:[3],       fps:1,  loop:true},
        win:    {band:3, frames:[4],       fps:2,  loop:true},
        // ---- golpes do 3x3 (o Corsa Blindado usa a `car`) ----
        pao:       {band:1, frames:[[1,0],[1,1],[1,2],[1,3]],   fps:8, loop:false},  // pega → arma → PANCADA (nuvem de farinha)
        croissant: {band:2, frames:[[2,0],[2,0],[2,1]],         fps:7, loop:false},  // rodopia → arremessa
        forno:     {band:3, frames:[[3,1],[0,4],[0,5]],         fps:7, loop:false},
        banquete:  {band:3, frames:[[3,4],[1,0],[3,4]],         fps:5, loop:false}
      },
      skills:[
        { key:1, name:'Combo de Socos', icon:'👊', cd:140,
          desc:'Sequência de socos rápidos que termina num direto.',
          type:'melee', anim:'punch', startup:6, recovery:16,
          hits:[ {start:6,end:10,reach:56,h:44,dmg:7,hitstun:12,kb:3},
                 {start:13,end:20,reach:70,h:46,dmg:11,hitstun:18,kb:7,color:'#ffc93c'} ] },
        { key:2, name:'Pancada de Pão', icon:'🥖', cd:300,
          desc:'Bate com o pão dormido igual taco. Cura parte do dano.',
          type:'melee', anim:'bread', startup:12, recovery:26, armor:true,
          hits:[ {start:12,end:22,reach:82,h:64,dmg:15,hitstun:24,kb:11,food:true,color:'#ffd166'} ] },
        { key:3, name:'PORTA DO CORSA', icon:'🚗', cd:300, type:'stance',
          desc:'ATIVO: invoca o Corsa e segura a porta aberta. Some ao apertar [3] de novo ou sem fôlego. Tudo que vier PELA FRENTE toma a portada e fica muito atordoado.',
          anim:'car', color:'#dfe4ea', drain:0.70, minSt:24,
          rooted:true, parry:true, frontOnly:true,
          parryDmg:14, parryStun:40, parryKb:14, parryText:'PORTADA!',
          onText:'CORSA!', offText:'fechou' },
        { key:4, name:'CROISSANT BUMERANGUE', icon:'🥐', cd:760, super:true,
          desc:'Roda e arremessa o croissant: ele acerta na ida, volta e acerta de novo.',
          type:'projectile', anim:'special', startup:16, recovery:28,
          dmg:13, speed:11, boomerang:true, range:340, emoji:'🥐', color:'#ffc93c', food:true } ] },

    /* ========================= MECAS =========================
       Lutador de 3 FORMAS. Quanto mais apanha, mais ciborgue fica:
         forma 0 (>50% vida) humano
         forma 1 (<=50%)     quase-ciborgue (braço mecânico, canhão)
         forma 2 (<=30%)     ciborgue completo (rifle + explosão)
       As chaves de animação são as MESMAS nas três folhas, então as
       skills não precisam saber em que forma ele está — o visual
       (e a força) sobem sozinhos.                                   */
    { id:'mecas', name:'Mecas', title:'Projeto 5000Z',
      sheet:'assets/mecas/mecasnormal.png', scaleAdj:1.0,
      palette:{ skin:'#c98d5a', hair:'#241a14', primary:'#2f4a7a', secondary:'#cfd6e0', shoe:'#4a3524', aura:'#5ad6ff', eye:'#141018' },
      weapon:{ type:'fists', color:'#9fb3c8', edge:'#e6f0ff', aura:'#5ad6ff' },
      element:'lightning', body:'normal', sig:'',
      hp:120, atk:12, def:4, spd:4.8, jmp:13, weight:1.05, passive:'protocolo_ciborgue', race:'automato',
      story:'Cientista militar que virou a própria cobaia. A cada golpe que leva, os implantes assumem o corpo — e o que sobra de humano vai sumindo junto com a barra de vida.',
      lore:'Mecas nasceu humano e virou Autômato na marra: era o cientista-chefe do Protocolo 5000Z até o projeto '+
           'ficar sem voluntário e ele mesmo entrar na cápsula. Os implantes deveriam ser só suporte de combate, '+
           'mas o corpo dele foi rejeitando cada vez menos e a máquina foi tomando cada vez mais espaço. Na arena '+
           'isso vira arma: quanto mais apanha, menos "humano" sobra e mais forte a casca de metal fica — o efeito '+
           'colateral e o combo final são a mesma coisa.',

      // gatilhos de transformação (fração de vida) e ganhos de cada forma
      formThresholds:[0.50, 0.30],
      formNames:['Humano','Quase-Ciborgue','CIBORGUE 5000Z'],
      formBuffs:[ {atk:1.00, spd:1.00, def:0},
                  {atk:1.16, spd:1.08, def:1},
                  {atk:1.34, spd:1.16, def:2} ],

      forms:[
        /* ---------- FORMA 0: HUMANO ---------- */
        { sheet:'assets/mecas/mecasnormal.png', olhos:{ q:[0,0], r:[0.26,0.135,0.5,0.07] }, anims:{
            idle:   {band:3, frames:[0,3],     fps:4,  loop:true},
            walk:   {band:1, frames:[0,1],     fps:8,  loop:true},
            jump:   {band:3, frames:[2],       fps:1,  loop:true},
            fall:   {band:3, frames:[1],       fps:1,  loop:true},
            block:  {band:3, frames:[0],       fps:1,  loop:true},
            punch:  {band:1, frames:[0,1,3],   fps:14, loop:false},
            thrust: {band:1, frames:[0,1,3],   fps:14, loop:false},
            swing:  {band:1, frames:[2,3],     fps:12, loop:false},
            kick:   {band:2, frames:[0,1,2],   fps:12, loop:false},
            roll:   {band:3, frames:[0,1,2,3], fps:14, loop:false},   // esquiva rolando
            ranged: {band:4, frames:[0,1,2,3], fps:12, loop:false},   // granada
            special:{band:1, frames:[2,3],     fps:9,  loop:false},
            aim:    {band:4, frames:[2],       fps:1,  loop:false},
            hurt:   {band:5, frames:[0],       fps:1,  loop:true},
            ko:     {band:5, frames:[1],       fps:1,  loop:true},
            win:    {band:3, frames:[3],       fps:2,  loop:true},
            // golpes do 3x3 — MESMOS nomes nas três formas (o golpe muda de visual sozinho)
            combo:    {band:1, frames:[[3,1],[1,0],[1,1],[1,3],[2,1]], fps:9, loop:false},
            arsenal:  {band:4, frames:[[4,0],[4,1],[4,2],[4,3]],       fps:8, loop:false},  // tira do cinto → arremessa
            crio:     {band:3, frames:[[3,0],[4,1],[1,1]],             fps:7, loop:false},
            protocolo:{band:3, frames:[[3,2],[2,1],[1,3]],             fps:7, loop:false} } },  // mortal → chute → avanço

        /* ---------- FORMA 1: QUASE-CIBORGUE ---------- */
        { sheet:'assets/mecas/mecasqserobo.png', olhos:{ q:[0,0], r:[0.26,0.135,0.5,0.07] }, anims:{
            idle:   {band:3, frames:[0,2],     fps:4,  loop:true},
            walk:   {band:1, frames:[0,3],     fps:8,  loop:true},
            jump:   {band:3, frames:[2],       fps:1,  loop:true},
            fall:   {band:3, frames:[0],       fps:1,  loop:true},
            block:  {band:3, frames:[0],       fps:1,  loop:true},
            punch:  {band:1, frames:[0,1,2],   fps:14, loop:false},   // soco com braço mecânico
            thrust: {band:1, frames:[0,1,2],   fps:14, loop:false},
            swing:  {band:1, frames:[1,2,3],   fps:12, loop:false},
            kick:   {band:1, frames:[1,2],     fps:12, loop:false},   // esta folha não tem chute
            roll:   {band:3, frames:[0,1,2],   fps:10, loop:false},   // vira o tornado de drones
            ranged: {band:4, frames:[0,1,2,3], fps:12, loop:false},   // granada
            special:{band:2, frames:[0,1,2,3], fps:10, loop:false},   // CANHÃO
            aim:    {band:2, frames:[1],       fps:1,  loop:false},
            hurt:   {band:5, frames:[0],       fps:1,  loop:true},
            ko:     {band:5, frames:[1],       fps:1,  loop:true},
            win:    {band:3, frames:[2],       fps:2,  loop:true},
            combo:    {band:1, frames:[[3,0],[1,0],[1,2],[1,3],[2,0]], fps:9, loop:false},  // braço mecânico soltando fumaça
            arsenal:  {band:4, frames:[[4,0],[4,1],[4,2],[4,3]],       fps:8, loop:false},
            crio:     {band:3, frames:[[3,0],[1,1]],                   fps:6, loop:false},  // arma o braço → dispara
            protocolo:{band:2, frames:[[2,2],[2,1],[2,1],[2,2]],       fps:6, loop:false} } },  // CANHÃO: mira → fogo → fumaça

        /* ---------- FORMA 2: CIBORGUE COMPLETO ---------- */
        { sheet:'assets/mecas/projeto_mecas_5000z.png', olhos:{ q:[0,0], r:[0.26,0.135,0.5,0.07] }, anims:{
            idle:   {band:3, frames:[0,1,2,3], fps:5,  loop:true},
            walk:   {band:3, frames:[1,2],     fps:9,  loop:true},
            jump:   {band:3, frames:[3],       fps:1,  loop:true},
            fall:   {band:3, frames:[0],       fps:1,  loop:true},
            block:  {band:3, frames:[2],       fps:1,  loop:true},
            punch:  {band:1, frames:[0,1,3],   fps:15, loop:false},
            thrust: {band:1, frames:[0,1,3],   fps:15, loop:false},
            swing:  {band:1, frames:[2,3],     fps:13, loop:false},
            kick:   {band:2, frames:[0,1,2],   fps:13, loop:false},
            roll:   {band:3, frames:[0,1],     fps:10, loop:false},
            ranged: {band:4, frames:[0,1,2],   fps:11, loop:false},   // RIFLE (atira de verdade)
            special:{band:5, frames:[2,3],     fps:8,  loop:false},   // aura + disparo de energia
            aim:    {band:4, frames:[2],       fps:1,  loop:false},
            hurt:   {band:5, frames:[0],       fps:1,  loop:true},
            ko:     {band:5, frames:[1],       fps:1,  loop:true},
            win:    {band:5, frames:[2],       fps:2,  loop:true},
            combo:    {band:1, frames:[[3,0],[1,0],[1,1],[1,2],[1,3],[2,1]], fps:10, loop:false},  // PUNHOS 5000Z
            arsenal:  {band:4, frames:[[4,1],[4,0],[4,2]],             fps:7, loop:false},  // saca o RIFLE → mira → atira
            crio:     {band:3, frames:[[3,2],[1,1]],                   fps:6, loop:false},
            protocolo:{band:5, frames:[[5,2],[5,2],[5,3],[5,3]],       fps:5, loop:false} } }  // aura → DESCARGA
      ],

      skills:[
        { key:1, name:'Combo Cibernético', icon:'🦾', cd:150,
          desc:'Sequência de socos. Fica mais forte a cada forma que ele assume.',
          type:'melee', anim:'punch', startup:6, recovery:16,
          hits:[ {start:6,end:11,reach:58,h:44,dmg:7,hitstun:12,kb:3},
                 {start:14,end:21,reach:70,h:48,dmg:11,hitstun:18,kb:7,color:'#5ad6ff'} ] },

        { key:2, name:'Chute Hidráulico', icon:'🦿', cd:290,
          desc:'Chute ascendente que joga o oponente para cima — ele QUICA no chão.',
          type:'melee', anim:'kick', startup:10, recovery:23,
          hits:[ {start:10,end:18,reach:74,h:80,dmg:13,hitstun:23,launch:true,up:14,kb:4,groundBounce:true,color:'#9fb3c8'} ] },

        { key:3, name:'Arsenal', icon:'💣', cd:330,
          desc:'Humano/Quase: joga granada. CIBORGUE: saca o rifle e ATIRA (mais dano e mais rápido).',
          type:'projectile', anim:'ranged', startup:12, recovery:24,
          dmg:14, speed:10, color:'#ffd166',
          // quando estiver na forma 2, vira tiro de rifle (ver applyFormToSkill)
          formOverride:{ 2:{ dmg:19, speed:17, startup:8, recovery:18, color:'#5ad6ff' } } },

        { key:4, name:'PROTOCOLO 5000Z', icon:'⚡', cd:800, super:true,
          desc:'Humano: golpe carregado. Quase: dispara o canhão. CIBORGUE: explosão de energia em área.',
          type:'melee', anim:'special', startup:14, recovery:32,
          hits:[ {start:14,end:24,reach:96,h:82,dmg:26,hitstun:28,launch:true,up:14,kb:8,color:'#5ad6ff'} ],
          formOverride:{ 2:{ aoe:true, radius:190, dmg:30, knockup:14, color:'#5ad6ff' } } } ]
    },

    /* ===================== LOIRINHA DA CDI =====================
       SUPORTE, exclusiva do 3x3 (so3x3) — o kit dela é de turnos:
       cura, ambiente e dois golpes fracos. Não tem frame data de
       luta 1x1, então fica fora da seleção da arena.
       Folha: 0=retrato | 1=cat-walk x4 | 2=tapas x4 | 3=chutes x4
              4=[mão na boca, BEIJO com corações, mão na boca]
              5=[empurrão, beijo no alvo, empurrando alguém]
              6=[bolsa em punho, BOLSADA] | 7=esquiva/rodopio x4
              8=[atordoada, caindo, no chão]                        */
    { id:'loirinha_cdi', name:'Loirinha da CDI', title:'Charme Fatal',
      olhos:{ q:[0,0], r:[0.33,0.225,0.42,0.06] },
      sheet:'assets/loirinha_cdi/lorinhadacdi.png', scaleAdj:1.0, so3x3:true,
      // avatar de perfil (ver Sprites.renderFace): o recorte padrão pegava
      // só o topo do cabelo dela — mais alta que a média do elenco.
      faceCrop:[0.10, 0.00, 0.80, 0.45],
      palette:{ skin:'#f3c9a0', hair:'#e8c26a', primary:'#f7a8c4', secondary:'#ffd9e6',
                shoe:'#c98d5a', aura:'#ff9ecb', eye:'#3a6ea8' },
      weapon:{ type:'fists', color:'#f7a8c4', edge:'#ffd9e6', aura:'#ff9ecb' },
      element:'holy', body:'slim', sig:'',
      hp:158, atk:17, def:10, spd:12, jmp:13, weight:0.88, passive:'carisma', race:'meio_anjo',
      story:'Chegou na arena de salto alto e óculos na cabeça, achando que era outra festa. '+
            'Descobriu que um beijo bem dado levanta um aliado caído — e que bolsa cheia dói mais que soco.',
      lore:'Loirinha da CDI é Meio-Anjo — metade humana, metade de uma linhagem que ninguém no currículo dela '+
           'consegue explicar direito, herdada da avó que "sempre foi meio de outro mundo". Cresceu achando que '+
           'isso só servia pra brilhar em festa, até descobrir que o carisma dela cura de verdade: um beijo, um '+
           'empurrãozinho de incentivo, e o aliado caído levanta com a barra de vida cheia de novo. Entrou na '+
           'arena achando que era outra balada chique e só percebeu o tamanho da confusão quando a bolsa dela — '+
           'que pesa muito mais do que parece — já tinha nocauteado meio time adversário.',
      anims:{
        idle:   {band:1, frames:[0,1,2,3], fps:5,  loop:true},    // desfile no lugar
        walk:   {band:1, frames:[0,1,2,3], fps:10, loop:true},
        jump:   {band:7, frames:[1],       fps:1,  loop:true},
        fall:   {band:7, frames:[2],       fps:1,  loop:true},
        block:  {band:7, frames:[3],       fps:1,  loop:true},
        punch:  {band:2, frames:[0,1,3],   fps:13, loop:false},   // TAPA
        thrust: {band:2, frames:[0,3],     fps:13, loop:false},
        swing:  {band:6, frames:[0,1],     fps:11, loop:false},   // BOLSADA
        kick:   {band:3, frames:[1,2],     fps:11, loop:false},
        ranged: {band:6, frames:[0,1],     fps:10, loop:false},   // arremesso da bolsa
        special:{band:4, frames:[0,1],     fps:6,  loop:false},   // BEIJO (corações)
        aim:    {band:4, frames:[1],       fps:1,  loop:false},
        hurt:   {band:8, frames:[0],       fps:1,  loop:true},
        ko:     {band:8, frames:[1,2],     fps:5,  loop:false},   // cai → no chão
        win:    {band:4, frames:[1],       fps:2,  loop:true},
        // ---- golpes do 3x3 ----
        tapa:   {band:2, frames:[[2,2],[2,3],[2,0],[2,1]],          fps:9, loop:false},
        bolsada:{band:6, frames:[[6,0],[7,1],[6,1]],                fps:7, loop:false},  // gira → BOLSADA
        beijo:  {band:4, frames:[[4,0],[4,1],[4,1]],                fps:5, loop:false},  // mão na boca → beijo com corações
        charme: {band:7, frames:[[7,0],[7,1],[7,2],[7,3],[4,1]],    fps:7, loop:false}   // rodopio → beijo pro campo
      },
      skills:[] },   // sem kit de 1x1 de propósito (ver so3x3)

    /* ======================== SMERGULA ========================
       A SUGADORA DE ALMAS. Duas formas, como o Mecas — mas o gatilho
       é outro: ele transforma APANHANDO, ela transformando o dano que
       CAUSA em almas. Ver `almas` na ficha dela (js/turndata.js).

       Folha humana (smergula3.png):
         0=retrato | 1=corrida x4 | 2=socos x4 | 3=chutes x4
         4=[provocação, saudação, AURA NEGRA, meditando]
         5=[agarra a alma, drena até o esqueleto, energia, refém]
         6=[carrega orbe, ARREMESSA ORBE, conjura] | 7=esquivas x4
         8=[atordoada, caída, levantando]
       Folha demônio (smergula2.png) — as faixas 4 e 5 dela têm os
       RÓTULOS de texto do autor colados nos quadros, então não são
       usadas: só entram as faixas limpas 1,2,3,6,7,8.               */
    { id:'smergula', name:'Smergula', title:'A Sugadora de Almas',
      sheet:'assets/smergula/smergula3.png', scaleAdj:1.0, so3x3:true,
      faceCrop:[0.17, 0.00, 0.67, 0.45],   // avatar de perfil (ver Sprites.renderFace)
      palette:{ skin:'#7a4a32', hair:'#1a1016', primary:'#2a1830', secondary:'#5a2a70',
                shoe:'#241428', aura:'#a24bff', eye:'#ff3b3b' },
      weapon:{ type:'fists', color:'#2a1830', edge:'#a24bff', aura:'#a24bff' },
      element:'shadow', body:'normal', sig:'',
      hp:170, atk:22, def:9, spd:11, jmp:12.6, weight:0.95, passive:'sugadora', race:'meio_demonio',
      story:'Aprendeu cedo que alma é moeda. Cada golpe que ela acerta arranca um naco do que sobrou '+
            'de quem está na frente — e quando o bolso enche, o que volta do outro lado não é mais gente.',
      lore:'Rainha do Smergulus Kingdom, dona de tudo e de todos lá dentro. Smergula é Meio-Demônio — metade humana, metade herança de algo que o pai dela nunca quis explicar '+
           'direito. Cresceu sentindo fome de um jeito que comida nenhuma resolvia, até descobrir, sozinha e do '+
           'jeito mais difícil, que o que faltava era alma alheia. Cada golpe que acerta rouba um pedaço de quem '+
           'está na frente, e quanto mais rouba, menos sobra da parte humana dela — o rosto muda, a voz muda, e '+
           'o que volta pro corpo dela não é bem gente. Ela sabe disso e entra na arena mesmo assim, porque parar '+
           'de lutar significaria voltar a sentir aquela fome.',
      formNames:['Smergula','SMERGULA DEMÔNIO'],

      forms:[
        /* ---------- FORMA 0: HUMANA ---------- */
        { sheet:'assets/smergula/smergula3.png', olhos:{ q:[0,0], r:[0.20,0.30,0.6,0.15] }, anims:{
            /* respiração: alterna a GUARDA (2:0) com a pose relaxada
               (7:0). Antes era um quadro só e ela ficava congelada. */
            idle:   {band:2, frames:[0,0,[7,0],[7,0]], fps:6, loop:true},
            walk:   {band:1, frames:[0,1,2,3], fps:10, loop:true},
            jump:   {band:7, frames:[3],       fps:1,  loop:true},
            fall:   {band:7, frames:[1],       fps:1,  loop:true},
            block:  {band:4, frames:[3],       fps:1,  loop:true},
            punch:  {band:2, frames:[0,1,3],   fps:13, loop:false},
            thrust: {band:5, frames:[0,1],     fps:9,  loop:false},   // AGARRA E DRENA
            swing:  {band:3, frames:[1,2],     fps:12, loop:false},
            kick:   {band:3, frames:[0,1],     fps:12, loop:false},
            ranged: {band:6, frames:[0,1],     fps:10, loop:false},   // ORBE NEGRO
            special:{band:4, frames:[3,2],     fps:5,  loop:false},   // AURA NEGRA
            aim:    {band:6, frames:[1],       fps:1,  loop:false},
            hurt:   {band:8, frames:[0],       fps:1,  loop:true},
            ko:     {band:8, frames:[1],       fps:1,  loop:true},
            win:    {band:4, frames:[2],       fps:2,  loop:true},
            // golpes do 3x3 (mesmos nomes na forma demônio)
            toque:  {band:2, frames:[[1,2],[2,2],[2,3],[5,2]],      fps:8, loop:false},  // corre → agarra → DRENA
            praga:  {band:6, frames:[[6,0],[6,1]],                  fps:5, loop:false},  // carrega orbe → arremessa
            corte:  {band:7, frames:[[7,1],[7,2],[3,2]],            fps:7, loop:false},  // rodopio com rastro → corte
            miragem:{band:6, frames:[[6,2],[7,3],[6,2]],            fps:6, loop:false},
            veu:    {band:4, frames:[[4,0],[4,3],[4,2]],            fps:5, loop:false} } },  // provoca → medita → AURA NEGRA

        /* ---------- FORMA 1: DEMÔNIO ---------- */
        { sheet:'assets/smergula/smergula2.png', olhos:{ q:[0,0], r:[0.36,0.38,0.46,0.10] }, anims:{
            idle:   {band:1, frames:[0,1,2,3], fps:5,  loop:true},
            walk:   {band:2, frames:[0,1,2,3], fps:11, loop:true},
            jump:   {band:2, frames:[1],       fps:1,  loop:true},
            fall:   {band:2, frames:[2],       fps:1,  loop:true},
            block:  {band:8, frames:[2],       fps:1,  loop:true},
            punch:  {band:3, frames:[1,2,3],   fps:13, loop:false},
            thrust: {band:3, frames:[2,3],     fps:13, loop:false},
            swing:  {band:7, frames:[0,1],     fps:12, loop:false},
            kick:   {band:8, frames:[0,1],     fps:12, loop:false},
            ranged: {band:6, frames:[1,2],     fps:10, loop:false},
            special:{band:6, frames:[1,3],     fps:8,  loop:false},
            aim:    {band:6, frames:[1],       fps:1,  loop:false},
            hurt:   {band:7, frames:[2],       fps:1,  loop:true},
            ko:     {band:7, frames:[3],       fps:1,  loop:true},
            win:    {band:8, frames:[2],       fps:2,  loop:true},
            toque:  {band:3, frames:[[2,1],[3,0],[3,2],[3,3]],      fps:8, loop:false},  // voa → GARRA
            praga:  {band:8, frames:[[8,1],[6,1]],                  fps:5, loop:false},
            corte:  {band:6, frames:[[6,2],[6,3],[3,2]],            fps:7, loop:false},  // mergulho → chute → rasgo
            miragem:{band:8, frames:[[8,2],[6,1],[7,3]],            fps:6, loop:false},
            veu:    {band:8, frames:[[8,2],[8,2],[6,1]],            fps:5, loop:false} } }
      ],
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= MAMELUCO =========================
       (nome de nascença Matheus Limeira — folha: assets/matheus_limeira/matheuslimeira2.png)
       TANQUE do time — provoca o time inimigo INTEIRO (não só um) e
       acelera os aliados com o Astra. Folha:
         0=retrato | 1=[facada, ajoelhado, arremesso, avanço com faca]
         2=chutes x4 | 3=[garra-drone, lança-chamas, taco/boombox]
         4=[preocupado, suado, chave de fenda, câmera]
         5=[troféu+drone, caído, chute, celular]              */
    { id:'matheus_limeira2', name:'Mameluco', title:'O Dono do Astra',
      olhos:{ q:[0,0], r:[0.26,0.13,0.5,0.065] },
      sheet:'assets/matheus_limeira/matheuslimeira2.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#c68642', hair:'#1a1410', primary:'#3a3f47', secondary:'#5c6470',
                shoe:'#e8e8e8', aura:'#ffb347', eye:'#141018' },
      weapon:{ type:'fists', color:'#3a3f47', edge:'#5c6470', aura:'#ffb347' },
      element:'earth', body:'normal', sig:'',
      hp:175, atk:17, def:14, spd:6, jmp:11, weight:1.20, passive:'fortaleza', race:'limeirense',
      story:'Sabe que o Astra dele vale mais que a casa e não tem vergonha de dizer isso na sua cara. '+
            'Planta os pés, xinga o time inimigo inteiro pra cima dele e some de vista quando acelera pros aliados.',
      lore:'Ninguém mais chama ele de Matheus Limeira — na arena é só Mameluco mesmo (o apelido pegou tanto que '+
           'virou o nome). É Limeirense de raça: mesma linhagem de Fat Mango, mesma cidade do interior, só que a '+
           'obsessão dele não é padaria, é o Astra prateado estacionado com todo cuidado do lado de fora da arena. '+
           'Cresceu ouvindo que carro velho é dinheiro jogado fora e decidiu provar o contrário: lavou, poliu, '+
           'trocou o som e hoje trata o carro melhor que a maioria trata gente. Na arena isso vira estratégia — '+
           'ele grita, provoca, chama a atenção do time inimigo inteiro pra cima dele (é grandalhão, aguenta), '+
           'e enquanto todo mundo tenta arrancar pintura dele, os aliados saem acelerando graças ao Astra.',
      anims:{
        idle:   {band:4, frames:[0,3],   fps:4,  loop:true},
        walk:   {band:1, frames:[0,1],   fps:7,  loop:true},
        jump:   {band:4, frames:[1],     fps:1,  loop:true},
        fall:   {band:4, frames:[2],     fps:1,  loop:true},
        block:  {band:4, frames:[0],     fps:1,  loop:true},
        punch:  {band:1, frames:[0,1,3], fps:13, loop:false},
        thrust: {band:1, frames:[0,1,3], fps:13, loop:false},
        swing:  {band:1, frames:[2,1,3], fps:11, loop:false},
        kick:   {band:2, frames:[0,1,3], fps:11, loop:false},
        special:{band:3, frames:[1,2],   fps:7,  loop:false},
        ranged: {band:3, frames:[0,1],   fps:8,  loop:false},
        aim:    {band:3, frames:[1],     fps:1,  loop:false},
        hurt:   {band:4, frames:[1],     fps:1,  loop:true},
        ko:     {band:5, frames:[1],     fps:1,  loop:true},
        win:    {band:5, frames:[0,3],   fps:4,  loop:true},
        // ---- golpes do 3x3 ----
        trombada:     {band:2, frames:[[2,3],[5,2],[1,1]],          fps:7, loop:false},  // mergulha → desliza → CAPOTA no alvo
        provocacao:   {band:3, frames:[[3,2],[4,1],[3,2]],          fps:5, loop:false},  // aumenta o som e grita
        pisando:      {band:5, frames:[[5,3],[4,3]],                fps:5, loop:false},  // liga pro Astra
        atropelamento:{band:2, frames:[[2,3],[2,2],[2,0],[1,1]],    fps:8, loop:false}
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= LAMBANÇA =========================
       (folha: assets/lambanca/lambanca.png)
       SUPORTE sem cura: bufa o time, limpa sangramento/veneno e a ULT
       desliga pro resto da partida o último golpe que o alvo usou.
       Folha: 0=[retrato com auréola, retrato de corpo inteiro]
              1=[soco, soco, cruz erguida, arremesso de cruz brilhante]
              2=[chute, chute, ajoelhado com arma de luz, arremesso]
              3=[caído/ajoelhado com auréola — "Rise of Faith"]
              4=[ajoelhado com cruz, cruz erguida, explosão de partículas]
              5=[feixe em cruz — "Cross-Shaped Divine Beam"]
              6=[pose dramática única — aura/cruz grande]
              7=[rezando x2, de pé] | 8=[comemorando x2, caído]        */
    { id:'hans_lambanca', name:'Lambança', title:'A Bênção Desajeitada',
      olhos:{ q:[0,1], r:[0.20,0.22,0.6,0.12] },
      sheet:'assets/lambanca/lambanca.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#c68642', hair:'#1a1410', primary:'#2b2f36', secondary:'#4a5058',
                shoe:'#e8e8e8', aura:'#ffe066', eye:'#141018' },
      weapon:{ type:'fists', color:'#2b2f36', edge:'#4a5058', aura:'#ffe066' },
      element:'holy', body:'normal', sig:'',
      hp:175, atk:22, def:14, spd:12, jmp:12, weight:1.0, passive:'fervor', race:'limeirense',
      story:'Reza antes, reza depois, e no meio da luta larga uma trombada tão sem noção que os dois times riem. '+
            'Ninguém entende como ele erra tanto e ainda assim segura o time inteiro de pé.',
      lore:'Ninguém sabe o nome verdadeiro dele — na arena e no bairro é só Lambança mesmo, porque cada jogada '+
           'dele sai um pouco torta antes de dar certo. É Limeirense de raça, criado na '+
           'mesma cidade do interior que o Fat Mango e o Mameluco, só que ele trocou a garagem pela igrejinha da '+
           'esquina. Não cura ninguém — diz que "milagre não é curativo, é reforço" — mas ergue a fé do time inteiro '+
           'com uma bênção, tira o veneno e o sangramento de quem tá largado, e guarda pro fim o golpe mais cruel: '+
           'um selo de luz que apaga da memória do inimigo o último golpe que ele usou, feito um milagre ao contrário.',
      anims:{
        /* frame 0 e 1 da faixa 0 são poses BEM diferentes de tamanho
           (retrato de corpo inteiro vs close-up de guarda — esse último
           já é a pose de "block" abaixo), então animar o idle entre os
           dois fazia o sprite parecer crescer/encolher. E um frame só
           deixava ele parado demais. A faixa 2 (golpe de chute) tem dois
           frames de posição de guarda BEM parecidos em tamanho (51x65 e
           43x66) — servem de balanço sutil de "pronto pra briga" sem o
           pop de escala. */
        idle:   {band:2, frames:[0,1],   fps:4,  loop:true},
        /* mesmo problema do idle antigo: faixa 1 frame 0 (64x70) e frame 1
           (120x69) têm larguras bem diferentes (braço todo esticado no
           soco) — no walk (loop constante) isso ficava pior ainda que no
           idle. Reaproveita o mesmo par estável da faixa 2. */
        walk:   {band:2, frames:[0,1],   fps:6,  loop:true},
        jump:   {band:3, frames:[0],     fps:1,  loop:true},
        fall:   {band:3, frames:[1],     fps:1,  loop:true},
        block:  {band:0, frames:[1],     fps:1,  loop:true},
        punch:  {band:1, frames:[0,1,3], fps:13, loop:false},
        thrust: {band:1, frames:[0,1,3], fps:13, loop:false},
        swing:  {band:1, frames:[2,1,3], fps:11, loop:false},
        kick:   {band:2, frames:[0,1,3], fps:11, loop:false},
        /* special era 4:1/4:2 — dois quadros com o RÓTULO de texto da folha
           colado ("Cross-Shaped..."). Trocado por quadros limpos. */
        special:{band:8, frames:[[8,2],[8,0]], fps:5,  loop:false},
        ranged: {band:5, frames:[0,1],   fps:8,  loop:false},
        aim:    {band:5, frames:[0],     fps:1,  loop:false},
        hurt:   {band:3, frames:[0],     fps:1,  loop:true},
        ko:     {band:3, frames:[1,2],   fps:5,  loop:false},   // tomba → no chão
        win:    {band:8, frames:[0,1],   fps:4,  loop:true},
        // ---- golpes do 3x3 ----
        consagrado: {band:2, frames:[[2,1],[2,2],[2,3],[2,4]],   fps:8, loop:false},  // guarda → chute → CHUTE SANTO
        bencao:     {band:8, frames:[[8,2],[8,2],[8,0]],         fps:5, loop:false},  // ajoelha e reza → braços pro céu
        purificacao:{band:7, frames:[[7,1],[5,1]],               fps:5, loop:false},
        selo:       {band:8, frames:[[8,2],[3,0],[5,1]],         fps:5, loop:false}   // reza → ergue a cruz → SELA
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ===================== ADULTO FELIZ =====================
       TANQUE puro — o primeiro HUMANO de verdade do elenco (os outros
       "humanos" da folha são todos Smergulus/Limeirense/etc., uma
       variação por cima). Bate pouco pela força (ataque baixo de
       propósito): o dano dele sai do ESCALA VIDA embutido nas próprias
       skills (ver `escalaVida` em turndata.js/turnbattle.js) — quanto
       mais vida ele ainda tem, mais pesado o golpe sai.
       A ULT (BIZARRICE) não causa dano nenhum: ela ROUBA a ultimate de
       QUALQUER personagem em campo (aliado ou inimigo) e a deixa pronta
       pra ele usar no card dela mesma — quem perdeu fica com a própria
       ultimate travada em recarga. Mecânica nova, ver `roubar` no motor.

       Folha SEM o texto na camisa (assets/adulto_feliz/adultofeliz2.png), 6 faixas —
       fatiamento saiu diferente da folha antiga (sem o texto os espaços
       em branco entre poses mudaram de tamanho), então os índices AQUI
       não valem para a folha velha nem vice-versa:
         0=parado neutro(1)+andando, braço balançando(4)
         1=preparar agachado(3)+guarda, mão no rosto(2)
         2=soco agachado, quatro quadros(4)
         3=soco em pé(3)+flexando com o doce(1)+apontando(1)
         4=parado neutro(3)+CAÍDO GIRANDO(1)+comemora um braço(1)+dois braços(1)
         5=parado(1)+flexa c/doce(1)+parado(1)+admira o doce(1)+
           comemora com doce erguido e língua de fora(1)                 */
    { id:'adulto_feliz', name:'Adulto Feliz', title:'A Alegria Blindada',
      olhos:{ q:[4,0], r:[0.33,0.17,0.47,0.10] },
      sheet:'assets/adulto_feliz/adultofeliz2.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#c68642', hair:'#2a1f18', primary:'#4a7fc4', secondary:'#2b4d73',
                shoe:'#e8e8e8', aura:'#ffe066', eye:'#141018' },
      weapon:{ type:'fists', color:'#4a7fc4', edge:'#2b4d73', aura:'#ffe066' },
      element:'earth', body:'big', sig:'',
      hp:200, atk:14, def:15, spd:6, jmp:11, weight:1.30, passive:'estofado', race:'humano',
      story:'Nunca perde o sorriso, nem apanhando — e é bom que seja assim, porque ele fica na linha de '+
            'frente tomando porrada por todo mundo. Quando cansa de bater fraquinho, simplesmente copia a '+
            'manobra mais impressionante que estiver vendo em campo (de aliado ou de inimigo, tanto faz) e '+
            'devolve na cara com juros.',
      lore:'Não tem raça especial, não veio de laboratório, não fez pacto com nada — é só um humano com o '+
           'coração (e o resto do corpo) grande demais pra caber num time sem ele. Ninguém sabe o nome de '+
           'verdade; "ADULTO FELIZ" é como está escrito na camisa que ele nunca tira. Não bate forte pela '+
           'força — bate forte pela vida que ainda tem: quanto mais saudável ele estiver, mais peso ele '+
           'consegue jogar no braço. E se as coisas apertarem, tem a BIZARRICE: ele simplesmente PEGA a '+
           'manobra mais impressionante que estiver vendo em campo — de aliado ou de inimigo, não faz '+
           'diferença pra ele — e usa como se fosse dele. Ninguém nunca entendeu como isso funciona. '+
           'Ele também não.',
      anims:{
        /* idle: as três poses "parado neutro" da faixa 4 têm quase o
           MESMO tamanho (70x77, 70x75, 70x75) — sem isso o personagem
           "pulsa" de tamanho a cada troca de quadro no ciclo parado. */
        idle:   {band:4, frames:[0,1,2],   fps:4,  loop:true},
        // andando: os 3 primeiros quadros do balanço de braço mantêm o
        // tamanho estável; o 4º (0:4) é bem mais largo e quebrava o ciclo.
        walk:   {band:0, frames:[1,2,3],   fps:8,  loop:true},
        jump:   {band:1, frames:[0],       fps:1,  loop:true},
        fall:   {band:1, frames:[1],       fps:1,  loop:true},
        block:  {band:1, frames:[3,4],     fps:3,  loop:true},
        punch:  {band:2, frames:[0,1,2],   fps:14, loop:false},
        thrust: {band:2, frames:[0,1,2],   fps:14, loop:false},
        swing:  {band:2, frames:[2,1,0],   fps:11, loop:false},
        kick:   {band:1, frames:[0,1,2],   fps:10, loop:false},
        /* a ULT: flexa o braço com o doce (3:3) -> ergue um braço (4:4)
           -> ergue os dois (4:5) — um "carregando poder" antes de soltar
           o golpe roubado. Mistura faixas com o par [faixa,quadro]. */
        special:{band:3, frames:[ 3, [4,4], [4,5] ], fps:6, loop:false},
        ranged: {band:3, frames:[0,1,2],   fps:10, loop:false},
        aim:    {band:3, frames:[2],       fps:1,  loop:false},
        // a queda girando (4:3) serve pros dois: machucado no meio do
        // giro, nocauteado quando ela para.
        hurt:   {band:4, frames:[3],       fps:1,  loop:true},
        ko:     {band:4, frames:[3],       fps:1,  loop:true},
        // vitória: doce erguido + língua de fora, alternando com a pose
        // de bíceps — as duas têm o doce, então o objeto não "some/aparece"
        // piscando no meio do loop.
        win:    {band:5, frames:[4,1],     fps:4,  loop:true},
        // ---- golpes do 3x3 ----
        tapaAmor:{band:1, frames:[[1,0],[3,0],[3,1]],            fps:7, loop:false},
        bombom:  {band:5, frames:[[5,3],[3,3],[3,4]],            fps:5, loop:false},  // admira o doce → flexiona → ARREMESSA
        abraco:  {band:4, frames:[[4,5],[1,3],[1,4]],            fps:5, loop:false},  // braços abertos → aperta
        voadora: {band:1, frames:[[1,1],[4,3],[3,2]],            fps:7, loop:false}   // agacha → gira no ar → VOADORA
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= FAT GIRL =========================
       DPS puro: pouca vida, ataque alto, SEMPRE mira um único inimigo
       (nunca área). Passiva dá chance de atordoar em QUALQUER golpe que
       acerte (ver `furia_nunchaco` no motor). A ULT agora é a MEDITAÇÃO
       BRANCA: ela some do jogo por alguns turnos (mecânica `meditar`,
       ver `js/turnbattle.js`) e volta com o ataque MUITO mais alto.

       Folha (assets/fat_girl/fat_girl3.png) — terceira folha dela, fatiamento
       100% automático. Bandas com pose única/limpa usadas; as que o
       detector juntou mais de uma pose verticalmente (colunas com gente
       + boneco de referência, ou duplicadas) foram ignoradas:
         auto 2: soco parado(0) + soco com braço esticado(1) — usa a 1
         auto 4: chute com rasteira(1) — a pose de chute
         auto 5: parada de guarda(0) + MEDITANDO de pernas cruzadas(1)
         auto 7: segurando a bola branca(0) + jogando a gosma(1) +
                 espirrando partículas(2)
         auto 8: andando (0,1,3 — o 2 é uma cambalhota, não usado)
         auto 9: tonta sentada(0) + caindo(1) + caída c/ gosma no chão(2) */
    { id:'fat_girl', name:'Fat Girl', title:'Fúria de Nunchaco',
      olhos:{ q:[0,0], r:[0.28,0.29,0.55,0.10] },
      sheet:'assets/fat_girl/fat_girl3.png', scaleAdj:1.0, so3x3:true,
      // avatar de perfil (ver Sprites.renderFace): ela fica virada pro
      // outro lado da folha — o rosto está na METADE DIREITA do quadro,
      // não no centro-esquerda como o recorte padrão assume.
      faceCrop:[0.27, 0.00, 0.80, 0.54],
      palette:{ skin:'#e8b090', hair:'#a4223a', primary:'#2b5aa8', secondary:'#4a7fc4',
                shoe:'#1c2a4a', aura:'#c9ccd4', eye:'#141018' },
      weapon:{ type:'fists', color:'#c9ccd4', edge:'#e8e8e8', aura:'#a4223a' },
      element:'lightning', body:'big', sig:'',
      hp:150, atk:32, def:53, spd:12, jmp:12, weight:1.10, passive:'furia_nunchaco', race:'humano',
      story:'Não perde tempo com estratégia: escolhe um alvo e não larga até ele cair. Não é de ficar '+
            'quieta — só se aquieta mesmo quando fecha os olhos pra meditar, e é bom torcer pra isso não '+
            'acontecer perto de você: quando ela abre os olhos de novo, o golpe seguinte dói muito mais '+
            'do que qualquer coisa que ela deu antes.',
      lore:'Ninguém nunca viu ela treinar — só aparece na arena já sabendo. Dizem que aprendeu a meditar '+
           'com quem cuidava dela quando criança, só que virou outra coisa nas mãos dela: um jeito de '+
           'guardar fôlego no meio da porrada. Escolhe UM alvo por vez e não desperdiça golpe em mais '+
           'ninguém — dizem que é falta de paciência, ela diz que é foco. Também não avisa quando o golpe '+
           'vem com peso a mais: várias vezes o adversário só percebe que ficou zonzo depois que já tomou '+
           'o próximo soco.',
      anims:{
        // idle balança entre a guarda erguida e o soco estendido (faixa
        // 2) — a versão anterior usava 1 quadro só (banda 5, parada) e
        // ficava dura, diferente do resto do elenco, que sempre balança.
        idle:   {band:2, frames:[0,1],         fps:3, loop:true},
        // andar mistura o único quadro de passada real da folha (8:0)
        // com os quadros de guarda/soco (2) pra dar sensação de passo —
        // a folha não tem uma passada de perna alternada de verdade.
        walk:   {band:8, frames:[0,[2,1],0,[2,0]], fps:9, loop:true},
        jump:   {band:2, frames:[0],     fps:1,  loop:true},
        fall:   {band:2, frames:[0],     fps:1,  loop:true},
        block:  {band:2, frames:[0],     fps:1,  loop:true},
        punch:  {band:2, frames:[1],     fps:10, loop:false},
        thrust: {band:2, frames:[1],     fps:10, loop:false},
        swing:  {band:4, frames:[1],     fps:10, loop:false},
        kick:   {band:4, frames:[1],     fps:10, loop:false},
        // a ULT: MEDITAÇÃO BRANCA — de pernas cruzadas, olhos fechados.
        // `turnui.js` também usa esta pose (parada, sem o balanço do
        // idle normal) enquanto ela estiver "meditando" sem poder agir,
        // e ignora a reação de dano (`hurt`) nesse estado de propósito —
        // ela não é pra "levantar" só porque apanhou.
        special:{band:5, frames:[1],     fps:1,  loop:true},
        ranged: {band:7, frames:[1],     fps:8,  loop:false},
        aim:    {band:7, frames:[0],     fps:1,  loop:false},
        hurt:   {band:9, frames:[1],     fps:1,  loop:true},
        /* KO: o quadro 9:2 da folha é largo (149×60) e traz TRÊS coisas
           juntas — ela sentada tonta à esquerda, o jato de gosma branca
           atravessando o meio e, só na direita, ela CAÍDA de verdade.
           Desenhar o quadro inteiro deixava a derrota parecendo um
           borrão branco com duas Fat Girls. O recorte isola só a parte
           deitada (dela e da poça em que ela cai). */
        ko:     {band:9, frames:[1,[9,2,[0.40,0.54,0.60,0.46]]], fps:5, loop:false},   // cai → caída (recorte isola ela)
        win:    {band:2, frames:[0],     fps:1,  loop:true},
        // ---- golpes do 3x3 ----
        socoRapido:{band:2, frames:[[2,0],[1,0],[2,1]],          fps:9, loop:false},
        giratorio: {band:8, frames:[[8,2],[8,1],[1,2]],          fps:8, loop:false},  // gira → chute giratório → rasteira
        quadril:   {band:1, frames:[[1,1],[8,3],[4,1]],          fps:7, loop:false},  // carrega → estrela → GOLPE
        baba:      {band:7, frames:[[7,0],[7,1],[7,2]],          fps:6, loop:false},
        meditar:   {band:5, frames:[[5,0],[5,1]],                fps:4, loop:false}
      },
      skills:[] },  // sem kit de 1x1 (ver so3x3)

    /* ================= MARCELÃO BLACK JW =================
       O LADRÃO DE TEMPO. Kit inteiro gira em torno de RECARGA: em vez
       de só bater, ele atrasa a recarga do inimigo e adianta a própria,
       e a ULTIMATE faz isso pro time inimigo INTEIRO de uma vez — ver
       `roubarTempo` no motor (js/turnbattle.js). A outra assinatura dele
       é a MOEDA que recocheteia sozinha pelo time inimigo até a sorte
       decidir que já bateu o bastante — ver `recochete`.

       Folha (assets/marcelao/marcelao_black_jw2.png) — fatiamento automático.
       Foi escolhida no lugar da folha 1 (marcelao_black_jw.png, também
       em assets/, ficou órfã) por ter o ciclo de corrida e o soco limpo
       que a outra não tinha.
         auto 0: idle (punho erguido)
         auto 1: 0=arremesso (a MOEDA saindo da mão) | 1=agachado com o
                 gelo na mão | 2=agachado girando o aparelho nas costas |
                 3=mirando, poça de energia no chão
         auto 2: 0=aparelho nas costas com a telinha (não usado) |
                 1=FUNIL SUGANDO um redemoinho de gente em miniatura — a
                 pose do "sugar recarga" | 2=parado ao lado do pote/prisão
                 de gelo (não usado)
         auto 3: corrida (0,1,4) e SOCO limpo (2,3) misturados na mesma
                 faixa pelo detector — separados aqui por índice
         auto 4: 0=soco (variante) | 1=segurando o disco/moeda nas duas
                 mãos | 2=redemoinho médio | 3=TORNADO DE GELO enorme —
                 pose de ultimate
         auto 5: 0,1,2=erguendo um ESCUDO DE GELO gigante (ângulos
                 diferentes) | 3=a moeda flutuando sozinha (não usado)
         auto 6: 0=punho na cara | 1=pulo/soco no ar | 2=sorriso, mão na
                 cintura (vitória) | 3=parado, braços soltos */
    { id:'marcelao_black_jw', name:'Marcelão Black JW', title:'O Ladrão de Tempo',
      olhos:{ q:[0,0], r:[0.28,0.15,0.5,0.065] },
      sheet:'assets/marcelao/marcelao_black_jw2.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#a86a42', hair:'#241a14', primary:'#f4f4f4', secondary:'#232838',
                shoe:'#171a24', aura:'#7df0ff', eye:'#141018' },
      weapon:{ type:'moeda', color:'#bfe9ff', edge:'#eafcff', aura:'#7df0ff' },
      element:'ice', body:'normal', sig:'',
      hp:175, atk:22, def:11, spd:12, jmp:12, weight:1.0, passive:'ladrao_de_tempo', race:'humano',
      story:'Não briga pra machucar — briga pra ATRASAR. Toda vez que alguém carrega um golpe grande contra '+
            'ele, o relógio já virou outro: o golpe chega tarde demais, e o dele já está pronto de novo.',
      lore:'Ninguém sabe onde Marcelão Black JW aprendeu o truque — ele mesmo diz que "tempo emprestado se '+
           'devolve com juros" e não explica melhor que isso. Entra na arena com uma moeda de bolso (a mesma, '+
           'sempre) e um funil velho de família adaptado pra "sugar" o segundo que falta pro golpe do '+
           'adversário sair — e aquele segundo, ele usa pra fazer o PRÓPRIO golpe sair antes. Quando o '+
           'inimigo inteiro já está lento demais pra reagir, é hora do escudo de gelo e da moeda: ele solta '+
           'ela girando, e ela decide sozinha quantos vão sentir.',
      anims:{
        /* idle balança entre as duas poses paradas da faixa 6 (mesma
           altura nas duas, 73px — sem isso ele "pulsa" de tamanho a
           cada troca de quadro, ver o aviso do Adulto Feliz acima).
           O quadro 0:0 (o retrato grande) NÃO entra aqui: é bem maior
           que o resto da folha e deixava ele parado feito estátua —
           era o único personagem do elenco sem balanço nenhum no idle. */
        idle:   {band:6, frames:[2,3],     fps:3,  loop:true},
        walk:   {band:3, frames:[0,4],     fps:8,  loop:true},
        jump:   {band:6, frames:[1],       fps:1,  loop:true},
        fall:   {band:6, frames:[1],       fps:1,  loop:true},
        block:  {band:5, frames:[0,1],     fps:6,  loop:true},   // escudo de gelo erguido
        punch:  {band:3, frames:[2,3],     fps:12, loop:false},
        thrust: {band:4, frames:[0],       fps:1,  loop:false},
        swing:  {band:3, frames:[2,3],     fps:12, loop:false},
        kick:   {band:6, frames:[1],       fps:10, loop:false},
        ranged: {band:1, frames:[0],       fps:10, loop:false},  // arremesso da moeda
        special:{band:4, frames:[3],       fps:6,  loop:false},  // TORNADO DE GELO (ultimate)
        aim:    {band:1, frames:[0],       fps:1,  loop:false},
        hurt:   {band:5, frames:[0],       fps:1,  loop:true},   // ergue o escudo por reflexo
        ko:     {band:1, frames:[1],       fps:1,  loop:true},   // agachado no gelo (era ele em pé)
        win:    {band:6, frames:[2],       fps:3,  loop:true},
        // ---- golpes do 3x3 ----
        socoBolso: {band:3, frames:[[6,3],[3,2],[3,3],[4,0]],    fps:8, loop:false},
        furto:     {band:2, frames:[[2,0],[2,1],[2,1]],          fps:5, loop:false},  // liga o aparelho → FUNIL SUGANDO
        moeda:     {band:1, frames:[[1,3],[1,0]],                fps:5, loop:false},  // mira → lança a moeda
        escudo:    {band:5, frames:[[5,2],[5,1],[5,0]],          fps:5, loop:false},  // ergue o muro de gelo
        tempestade:{band:4, frames:[[1,2],[4,1],[4,3]],          fps:5, loop:false}   // gira o aparelho → gelo → TORNADO
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= CARGAS =========================
       ELÉTRICO, so3x3 (kit novo gira em torno de terreno/atordoar,
       ver js/turndata.js). Folha `cargas.png` — fatiamento automático
       (ver sheet-debug.html):
         faixa 0: retrato grande (idle "de capa", não usado no anims —
                  mesma lição do Marcelão: o quadro de capa não é o
                  certo pro idle de batalha; serve de graça pro avatar
                  de perfil, que usa o primeiro frame por padrão)
         faixa 1: 0=idle com faísca na mão | 1=braço esticado, choque
                  pequeno | 2=braço esticado, choque grande | 3=idle
                  → CHOQUE À DISTÂNCIA (pose `ranged`, golpes elétricos
                  básicos caem aqui sozinhos: `tipo:'eletrico'` não é
                  corpo-a-corpo, TurnData.estilo devolve 'tiro')
         faixa 2: braços erguidos canalizando + explosão — NÃO USADA no
                  anims (frames extras da folha, sem slot de pose que
                  sobrasse: o motor de turnos só lê punch/ranged/special)
         faixa 3: 0=carrega uma orbe na mão | 1=escudo em xadrez |
                  2=onda grande em leque | 3=idle → vira o `win`
                  (nenhuma skill usa: sobrava justamente pra isso)
         faixa 4: 0=agachado pronto | 1=silhueta elétrica (borrão de
                  velocidade) | 2=silhueta elétrica (variação) | 3=
                  agachado pronto → INVESTIDA (pose `punch`, via
                  `estiloAnim:'corpo'` na skill — sem isso um golpe
                  'eletrico' cairia em `ranged` por padrão) e o `ko`
                  (frame 0, agachado — a folha não tem um "caído" limpo
                  detectado pelo fatiamento automático)
         faixa 5: 0=corpo em chamas azuis | 1=braço erguido com um raio
                  bem alto | 2=parado, levou um susto com faíscas
                  voando → a ULTIMATE usa 0 e 1 (pose `special`, via
                  `estiloAnim:'foco'` na skill — é uma AOE elétrica,
                  cairia em `ranged` por padrão e repetiria o Choque
                  Rápido) e o `hurt` usa o frame 2                     */
    /* raio_sprites.png (1.30) = EFEITOS dos golpes dele (o TurnFX recorta;
       não é personagem). Auto: 0:0 tornado pequeno · 0:1 estouro de faíscas ·
       1:0 raios no chão · 1:1 FEIXE horizontal · 2:0/2:1 esferas de escudo
       (vieram com o xadrez de fundo PINTADO dentro — não usar) · 2:2 GAIOLA
       de raios · 3:0–3:2 raio caindo · 3:3 TORNADO · 3:4 espiral · 4:0
       coluna de energia · 4:1 EXPLOSÃO de luz · 4:2 onda · 5:0/5:1 faíscas
       no chão · 5:2 anel · 5:3 chama azul. As bolinhas de energia do topo
       são pequenas demais pro detector: recorte direto {x,y,w,h}. */
    { id:'cargas', name:'Cargas', title:'Sobrecarga',
      olhos:{ q:[0,0], r:[0.28,0.135,0.48,0.055] },
      sheet:'assets/cargas/cargas.png', scaleAdj:1.0, so3x3:true,
      folhasExtras:['assets/cargas/raio_sprites.png'],
      palette:{ skin:'#e0a878', hair:'#2b2018', primary:'#26262e', secondary:'#3a3a44', shoe:'#1c1c22', aura:'#5ad6ff', eye:'#141018' },
      weapon:{ type:'fists', color:'#5ad6ff', edge:'#bfe9ff', aura:'#5ad6ff' },
      element:'lightning', body:'normal', sig:'', race:'humano',
      hp:160, atk:18, def:9, spd:14, jmp:13, weight:0.9, passive:'condutor',
      story:'Nunca fica parado — nem quando devia. O corpo dele gera mais eletricidade estática do que '+
            'qualquer aparelho aguenta, e a arena virou o único lugar onde isso é uma vantagem.',
      lore:'Cargas era só um cara elétrico demais para o próprio bem: portas davam choque, telefone '+
           'travava perto dele, e ele vivia se sentindo mais rápido que o resto do mundo — literalmente. '+
           'Na arena descobriu pra que servia isso: ninguém acompanha o ritmo dele, e quando ele decide '+
           'prender o time inteiro numa gaiola de raios, é a própria velocidade que vira o dano.',
      anims:{
        idle:   {band:1, frames:[0,3],     fps:4,  loop:true},
        walk:   {band:1, frames:[0,3],     fps:8,  loop:true},
        punch:  {band:4, frames:[0,1,2,3], fps:14, loop:false},   // INVESTIDA RELÂMPAGO (borrão de velocidade)
        thrust: {band:4, frames:[0,1,2,3], fps:14, loop:false},
        swing:  {band:1, frames:[1,2],     fps:12, loop:false},
        kick:   {band:1, frames:[1,2],     fps:12, loop:false},
        ranged: {band:1, frames:[0,1,2,3], fps:12, loop:false},   // Choque Rápido / Rajada em Cadeia
        special:{band:5, frames:[0,1],     fps:8,  loop:false},   // TEMPESTADE ENCURRALADA (ultimate)
        aim:    {band:1, frames:[1],       fps:1,  loop:false},
        hurt:   {band:5, frames:[2],       fps:1,  loop:true},
        ko:     {band:4, frames:[3],       fps:1,  loop:true},   // de joelho (era o agachado "pronto")
        win:    {band:3, frames:[0,1,2,3], fps:6,  loop:true},
        // ---- golpes do 3x3 ----
        choque:        {band:1, frames:[[1,0],[1,1]],                 fps:6, loop:false},
        investidaRaio: {band:4, frames:[[4,0],[4,1],[4,2],[4,3]],     fps:9, loop:false},  // vira raio → atravessa → pousa
        rajadaCadeia:  {band:3, frames:[[3,0],[1,2],[1,2]],           fps:6, loop:false},  // orbe → RAJADA
        tempestadeRaio:{band:2, frames:[[2,0],[2,1],[5,0],[5,1]],     fps:5, loop:false}   // canaliza → raio → corpo em chamas azuis
      },
      skills:[] },   // sem kit de 1x1 de propósito (ver so3x3)

    /* ========================= CARECA =========================
       Humano de Tel Aviv, so3x3. Duas folhas, uma por forma (igual o
       Mecas): forma 0 = humano com o esfregão, forma 1 = VERME (passiva
       Maldição do Verme, ver js/turndata.js e renascerVermes no motor).

       ⚠️ As duas folhas vieram com o fundo xadrez PINTADO nos pixels
       (imagem gerada sem transparência de verdade). A camiseta cinza tem
       quase a cor do quadrado claro e a calça a do escuro, então o recorte
       automático picotava o boneco. Os .png em assets/ já são a versão
       limpa (fundo removido sabendo o padrão do xadrez); os .webp
       originais ficaram ao lado como fonte.

       careca.png (auto):
         0: 0=retrato | 1=parado com o esfregão | 2=andando | 3=correndo
         1: 0=esfregão por cima da cabeça | 1=estocada (cabo de lança) |
            2=esfregão na diagonal | 3=mão na cabeça (a maldição) | 4=caído
         2: 0=esfregando o chão | 1=mão no peito | 2=engatinhando |
            3=verme saindo | 4=verme
         3: vermes deitados | 4: 0=investida | 1=avanço com raiva |
            2=verme enrolado | 3=cauda entrando na terra
         5: 0=sentado, machucado | 1=verme caído
       careca_verme.png (auto):
         0: vermes parados/rastejando | 1: 0=em pé bravo | 1=CABEÇADA |
            2=saindo da terra | 3=cauda chicoteando
         2: 0=mergulhando na terra | 1=meio enterrado | 2=emergindo
         3: 0=enrolado | 1=CONCHA (espiral) | 2=tremendo | 3=CUSPE VERDE
         4: 0=bravo | 1=braço humano saindo | 2=meio humano | 3=caído */
    { id:'careca', name:'Careca', title:'O Amigo Amaldiçoado',
      sheet:'assets/careca/careca.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#e0b08a', hair:'#9a7a3a', primary:'#4a4f58', secondary:'#22252c',
                shoe:'#2a2a30', aura:'#9cff5e', eye:'#141018' },
      weapon:{ type:'fists', color:'#8a5a2a', edge:'#d8d8d8', aura:'#9cff5e' },
      element:'poison', body:'normal', sig:'', race:'humano',
      hp:168, atk:21, def:10, spd:10, jmp:12, weight:1.0, passive:'maldicao_verme',
      story:'Saiu de casa pra limpar o chão e voltou sem a metade do corpo humano. O esfregão ele não larga — '+
            'e, se derrubarem ele, o que levanta do chão não é mais gente.',
      lore:'Careca é de Tel Aviv e era o melhor amigo do Mecas antes do Mecas virar o Projeto 5000Z — os dois '+
           'cresceram juntos e ninguém lembra por que o apelido pegou, já que cabelo nunca faltou. Foi pedir ajuda '+
           'à rainha Smergula pra achar o amigo e saiu de lá amaldiçoado, virado verme; desde então mora no '+
           'Smergulus Kingdom como justiceiro, ao lado do Tupas, dividido entre o que foi e o que virou: de pé, luta com um esfregão; caído, rasteja de volta como verme, cuspindo veneno. A vingança '+
           'contra a Smergula é a única coisa que ele tem certeza que ainda é dele.',
      /* TODAS as poses das duas folhas entram em alguma animação. Passo
         `[faixa, quadro]` mistura faixas na mesma anim (ver frameFor em
         sprites.js). Além das poses padrão, cada golpe aponta pra uma anim
         PRÓPRIA pelo campo `pose` da skill (turndata.js) — esfregada,
         estocada, esfregar, investida, mordida, cuspe, lodo, cavar,
         emergir — e o motor usa mais três: `enterrado` (na terra),
         `renascer` (voltando como verme) e `metamorfose` (caído, esperando
         a maldição agir). Passo `[faixa, quadro, recorte]` recorta só aquele
         passo (pose que a folha grudou com outra no mesmo quadro). */
      forms:[
        /* ---------- FORMA 0: HUMANO ---------- */
        { sheet:'assets/careca/careca.png', olhos:{ q:[0,0], r:[0.30,0.14,0.42,0.055] }, anims:{
            // PARADO: alterna o esfregão erguido (0:1) com ele esfregando o chão (2:0)
            idle:     {band:0, frames:[1, [2,0]], fps:2, loop:true},
            walk:     {band:0, frames:[[0,2],[0,3]], fps:8, loop:true},            // anda → corre
            jump:     {band:4, frames:[[4,0]], fps:1, loop:true},                  // esquiva = arranca pro lado
            fall:     {band:4, frames:[[4,0]], fps:1, loop:true},
            block:    {band:1, frames:[[1,3]], fps:1, loop:true},
            esfregada:{band:1, frames:[[1,0],[1,2]], fps:9, loop:false},           // por cima da cabeça → diagonal
            estocada: {band:1, frames:[[1,2],[1,1]], fps:8, loop:false},           // arma o cabo → ESTOCADA
            esfregar: {band:2, frames:[[2,0],[0,1],[2,0]], fps:6, loop:false},           // esfrega o chão
            investida:{band:4, frames:[[4,0],[4,1]], fps:8, loop:false},           // arranca → avança com raiva (TAUNT)
            punch:    {band:1, frames:[[1,0],[1,2]], fps:9, loop:false},
            thrust:   {band:1, frames:[[1,1]], fps:1, loop:false},
            swing:    {band:1, frames:[[1,0],[1,2]], fps:9, loop:false},
            kick:     {band:4, frames:[[4,0],[4,1]], fps:8, loop:false},
            ranged:   {band:1, frames:[[1,1]], fps:1, loop:false},
            aim:      {band:1, frames:[[1,1]], fps:1, loop:false},
            // VÉU MALDITO: a maldição aperta — mão na cabeça, cai de quatro, o verme aparece por um instante
            special:  {band:1, frames:[[1,3],[2,2],[2,3],[1,3]], fps:6, loop:false},
            hurt:     {band:2, frames:[1], fps:1, loop:true},                               // mão no peito
            ko:       {band:5, frames:[[5,0],[1,4]], fps:5, loop:false},                      // senta → desaba
            metamorfose:{band:2, frames:[[2,2],[2,3],[2,4],[3,0],[3,1],[3,2],[4,2],[4,3]], fps:4, loop:true},
            win:      {band:0, frames:[[0,1],[4,1],[0,1]], fps:2, loop:true} } },
        /* ---------- FORMA 1: VERME ----------
           scaleAdj: a escala de cada forma sai da altura do PRÓPRIO idle, e
           o idle do verme é baixinho (127px) perto das poses em pé dele
           (saindo da terra = 198px) — sem reduzir, essas poses passavam do
           topo do quadro e eram cortadas. 0,62 faz a mais alta caber; de
           quebra o verme fica menor que o Careca de pé, como deve ser. */
        { sheet:'assets/careca/careca_verme.png', scaleAdj:0.62, olhos:{ q:[1,0], r:[0.44,0.215,0.48,0.07] }, anims:{
            idle:     {band:0, frames:[0,3], fps:2, loop:true},                  // se contorce no lugar
            walk:     {band:0, frames:[[0,1],[0,2]], fps:6, loop:true},            // rastejando
            jump:     {band:3, frames:[[3,1]], fps:1, loop:true},                  // esquiva = vira concha
            fall:     {band:2, frames:[[2,0]], fps:1, loop:true},
            block:    {band:3, frames:[[3,1]], fps:1, loop:true},
            mordida:  {band:1, frames:[[1,0],[1,1]], fps:9, loop:false},           // levanta → CABEÇADA/mordida
            cavar:    {band:2, frames:[[2,0],[2,1]], fps:6, loop:false},           // mergulha na terra
            enterrado:{band:2, frames:[1], fps:1, loop:true, crop:[0,0.55,1,0.45]},  // só o montinho
            emergir:  {band:2, frames:[[2,2],[1,2]], fps:8, loop:false},           // sai da terra explodindo
            cuspe:    {band:3, frames:[[3,2],[3,3]], fps:7, loop:false},           // treme → CUSPE VERDE
            lodo:     {band:1, frames:[[1,3],[3,3]], fps:7, loop:false},           // chicote de cauda → cuspe
            punch:    {band:1, frames:[[1,0],[1,1]], fps:9, loop:false},
            thrust:   {band:1, frames:[[1,1]], fps:1, loop:false},
            swing:    {band:1, frames:[[1,3]], fps:1, loop:false},
            kick:     {band:1, frames:[[1,3]], fps:1, loop:false},
            ranged:   {band:3, frames:[[3,2],[3,3]], fps:7, loop:false},
            aim:      {band:3, frames:[[3,3]], fps:1, loop:false},
            special:  {band:1, frames:[[1,0],[3,2],[2,0],[2,2]], fps:6, loop:false},  // VÉU MALDITO: some e volta
            hurt:     {band:3, frames:[[3,2],[3,1]], fps:8, loop:false},           // treme → se fecha na concha
            ko:       {band:4, frames:[[4,3]], fps:1, loop:true},
            renascer: {band:4, frames:[[4,2],[4,1],[1,2],[0,0]], fps:6, loop:false},  // braço humano sumindo → verme
            win:      {band:1, frames:[[4,0],[1,0]], fps:3, loop:true} } }
      ],
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= TUPAS =========================
       ÁGUA, so3x3. Domina a água — e não sabe nadar. Passiva
       Reservatório e a ultimate ATIVA (Redemoinho): ver js/turndata.js.
       Duas folhas:
         · tupas.png  (personagem, fundo transparente de verdade) — mesmo
           molde da folha do Cargas. Auto:
             0: retrato
             1: 0=parado c/ anéis de água | 1=lança o jato | 2=orbe | 3=parado
             2: 0=braços pra cima | 1=GEISER + respingo (DOIS desenhos grudados
                num quadro só — recortados por passo) | 2=parado
             3: 0=orbe na mão | 1=BOLHA-escudo | 2=onda | 3=parado
             4: 0=agachado | 1=vira água | 2=CORRENTEZA + aterrissagem (grudados)
             5: 0=aura azul | 1=braço erguido c/ tornado | 2=machucado
             nocaute deitado: NÃO detectado (32px de altura) → retângulo direto
         · tupas2.png (EFEITOS dos golpes) — não é personagem: o TurnFX
           desenha recortes dela no alvo/projétil (campo `fx` das skills).
           3:3=tornado, 0:0=tornado pequeno, 1:1=jato, 4:2=onda, 4:1 e 5:0=
           respingo, 5:1=anel, 3:4=espiral.                                */
    { id:'tupas', name:'Tupas', title:'O Mestre das Águas',
      olhos:{ q:[0,0], r:[0.36,0.13,0.46,0.06] },
      sheet:'assets/tupas/tupas.png', scaleAdj:1.0, so3x3:true,
      folhasExtras:['assets/tupas/tupas2.png'],   // efeitos dos golpes: baixa junto (preload) pra não piscar vazio
      palette:{ skin:'#8a5a3a', hair:'#141018', primary:'#d8333a', secondary:'#22253a',
                shoe:'#1c1c24', aura:'#3bb8ff', eye:'#141018' },
      weapon:{ type:'fists', color:'#3bb8ff', edge:'#bfe9ff', aura:'#3bb8ff' },
      element:'ice', body:'normal', sig:'', race:'humano',
      hp:180, atk:21, def:10, spd:11, jmp:12, weight:1.0, passive:'reservatorio',
      story:'Faz o mar inteiro obedecer a um gesto dele. Só não pede pra ele entrar na piscina: '+
            'o Tupas domina a água, mas nunca aprendeu a nadar.',
      lore:'Tupas carrega a própria água — um estoque que ele molda em jato, onda, bolha e redemoinho. '+
           'Quanto mais cheio o reservatório, mais pesado o golpe; quanto mais luta, mais seco ele fica, e é aí '+
           'que ele precisa virar correnteza pra puxar a água de volta. O maior segredo dele é o mais bobo: '+
           'com todo esse poder, ele morre de medo de cair no fundo. Nunca aprendeu a nadar, e jura que '+
           '"água que obedece não precisa de braçada". Mora no Smergulus Kingdom, onde é justiceiro: protege a '+
           'vila dos cobradores da rainha Smergula a partir do esgoto do reino — equilibrado num cano, longe da água.',
      anims:{
        // PARADO: alterna os anéis de água nas mãos (1:0) com as mãos vazias (1:3) — a água vai e volta
        idle:      {band:1, frames:[0,3], fps:2, loop:true},
        walk:      {band:4, frames:[[4,0],[4,1]], fps:7, loop:true},            // se abaixa → vira água
        jump:      {band:4, frames:[[4,1]], fps:1, loop:true},
        fall:      {band:4, frames:[[4,0]], fps:1, loop:true},
        block:     {band:3, frames:[[3,1]], fps:1, loop:true},
        jato:      {band:1, frames:[[1,0],[1,1],[1,2]], fps:9, loop:false},    // anéis → JATO → orbe
        onda:      {band:2, frames:[[2,0],[2,1,[0,0,0.5,1]]], fps:6, loop:false},   // braços pra cima → geiser
        bolha:     {band:3, frames:[[3,0],[3,1]], fps:6, loop:false},          // orbe → BOLHA-escudo
        correnteza:{band:4, frames:[[4,1],[4,2,[0,0,0.58,1]],[4,2,[0.62,0,0.38,1]]], fps:8, loop:false},
        redemoinho:{band:5, frames:[[5,0],[5,1]], fps:5, loop:false},          // aura → ergue o TORNADO
        controla:  {band:5, frames:[[5,1]], fps:1, loop:false},                // segurando o redemoinho ativo
        punch:     {band:1, frames:[[1,1]], fps:1, loop:false},
        thrust:    {band:1, frames:[[1,1]], fps:1, loop:false},
        swing:     {band:3, frames:[[3,2]], fps:1, loop:false},
        kick:      {band:4, frames:[[4,1]], fps:1, loop:false},
        ranged:    {band:1, frames:[[1,1],[1,2]], fps:8, loop:false},
        special:   {band:5, frames:[[5,0],[5,1]], fps:5, loop:false},
        aim:       {band:1, frames:[[1,2]], fps:1, loop:false},
        hurt:      {band:5, frames:[[5,2]], fps:1, loop:true},
        ko:        {band:4, frames:[[4,2,[0.62,0,0.38,1]], {x:249,y:700,w:85,h:32}], fps:5, loop:false},  // cai de joelho → deitado
        win:       {band:3, frames:[[3,2],[1,0]], fps:2, loop:true}             // onda → anéis
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ========================= CABELIN =========================
       SUPORTE, so3x3. É da ILHA (Ruínas da Ilha, no mapa) e é o maior fã
       de lasanha do mundo: cura o time com lasanha e a ULT ergue a
       MURALHA DE LASANHA (ver `barreira` em js/turnbattle.js).
       Duas folhas (fundo transparente de verdade, recorte automático):
         · cabelin_lasanha.png — a que ele USA (pedido do dono do jogo:
           "use as sprites que ele tá com a lasanha"):
             0: 0=bandeja de lasanha pelando | 1=espátula e garfo |
                2=comendo | 3=comendo de perto (close, não usado)
             1: 0=apresenta a lasanha | 1=arremessa a FATIA |
                2=arremessa a travessa | 3=ESPIRAL DE QUEIJO
             2: 0=ONDA DE MOLHO | 1=pula na poça de molho c/ fatias |
                2=fatia solta (vira o PROJÉTIL da Fatia Voadora) |
                3=espiral de queijo (variação)
             3: 0=MURALHA DE LASANHA gigante (a ULT — o TurnBG também
                recorta só a lasanha daqui pra desenhar a barreira) |
                1=surfando numa lasanha | 2=travessa de escudo
             4: 0=machucado | 1=caído | 2=vitória com a lasanha erguida
         · cabelin.png — ele SEM lasanha (luta de mão vazia). Não usada
           no kit; fica em assets/ pra uma skin futura.              */
    { id:'cabelin', name:'Cabelin', title:'O Rei da Lasanha',
      olhos:{ q:[0,3], r:[0.15,0.18,0.62,0.13] },
      sheet:'assets/cabelin/cabelin_lasanha.png', scaleAdj:1.0, so3x3:true,
      palette:{ skin:'#c68a5a', hair:'#2a1a12', primary:'#1c1c22', secondary:'#2a2f3a',
                shoe:'#1a1a1e', aura:'#ffb83c', eye:'#141018' },
      weapon:{ type:'fists', color:'#ffb83c', edge:'#ffe9a8', aura:'#ffb83c' },
      element:'fire', body:'normal', sig:'', race:'humano',
      hp:160, atk:15, def:10, spd:10, jmp:12, weight:1.0, passive:'sobras_lasanha',
      story:'Veio da Ilha com uma travessa debaixo do braço e nunca mais largou. Cura, protege e ataca — '+
            'tudo com lasanha. Se faltar lasanha, ele faz mais.',
      lore:'Cabelin é da Ilha e é, com folga, o maior fã de lasanha do mundo — come no café, no almoço, na '+
           'janta e na briga. Descobriu que lasanha boa cura qualquer coisa: uma fatia quentinha levanta um '+
           'aliado, as camadas de massa seguram pancada, o queijo derretido gruda em quem chega perto e o '+
           'molho fervendo espanta o resto. Quando o time aperta, ele faz a maior lasanha que alguém já viu e '+
           'planta ela na frente de todo mundo: uma muralha de massa e queijo que os inimigos são obrigados a '+
           'atravessar antes de encostar em qualquer um. Custa caro — ele põe um pedaço de si em cada camada —, '+
           'mas pra ele lasanha nunca é desperdício.',
      anims:{
        idle:     {band:0, frames:[0,1],           fps:2, loop:true},    // bandeja pelando ↔ espátula e garfo
        walk:     {band:3, frames:[1],             fps:1, loop:true, respira:3},   // anda SURFANDO numa lasanha
        jump:     {band:3, frames:[1],             fps:1, loop:true},
        fall:     {band:3, frames:[1],             fps:1, loop:true},
        block:    {band:3, frames:[2],             fps:1, loop:true},    // travessa de escudo
        punch:    {band:1, frames:[0,1],           fps:8, loop:false},
        thrust:   {band:1, frames:[1],             fps:1, loop:false},
        swing:    {band:1, frames:[2],             fps:1, loop:false},
        kick:     {band:1, frames:[2],             fps:1, loop:false},
        ranged:   {band:1, frames:[0,1],           fps:8, loop:false},
        aim:      {band:1, frames:[0],             fps:1, loop:false},
        special:  {band:3, frames:[2,0],           fps:5, loop:false},
        hurt:     {band:4, frames:[0],             fps:1, loop:true},
        ko:       {band:4, frames:[0,1],           fps:5, loop:false},
        win:      {band:4, frames:[[4,2],[0,2]],   fps:2, loop:true},    // ergue a lasanha ↔ come
        // ---- golpes do 3x3 ----
        fatia:    {band:1, frames:[[1,0],[1,1],[1,2]],     fps:7, loop:false},  // apresenta → ARREMESSA a fatia
        quentinha:{band:0, frames:[[0,0],[0,1],[1,0]],     fps:5, loop:false},  // tira do forno → serve
        queijo:   {band:1, frames:[[1,3],[2,3]],           fps:5, loop:false},  // espiral de queijo
        molho:    {band:3, frames:[[3,1],[2,1],[2,0]],     fps:6, loop:false},  // surfa → pula na poça → ONDA DE MOLHO
        muralha:  {band:3, frames:[[3,2],[3,0],[3,0]],     fps:4, loop:false}   // ergue a travessa → MURALHA DE LASANHA
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ======================== SMERGULÃO ========================
       FURTIVO, so3x3. Líder da Ilha das Ruínas junto da parceira, a
       Criança Rosa. Era um smerg GRANDE do Smergulus Kingdom, expulso por
       crimes tão pesados que ninguém diz quais foram. Duas formas = duas
       folhas: forma 0 NORMAL, forma 1 MODO FURTIVO (ligado pelo Passo nas
       Sombras — ver `modoFurtivo` em js/turnbattle.js).
         · smergulao.png (auto):
             0: 0=parado | 1,2=guarda | 3=andando | 4=correndo
             1: 0,1,2=socos | 2: 0=chute | 1=chute alto | 2=VOADORA
             3: 0=guarda c/ soco | 1=esquiva de lado | 2,3=machucado
             4: 0=caído c/ braço erguido | 1=levantando (o deitado reto
                do meio não é detectado — 35px) | 5: 0,1=comemora | 2=guarda
         · smergulao_escondido.png (auto):
             0: 0,1,2=andando agachado | 3=correndo na ponta do pé | 4=rastejando
             1: 0=espreita | 1=ponta do pé | 2=ESPIANDO atrás da parede | 3=agachado
             2: 0=MOITA | 1=caixa de papelão | 2=arbusto
             3: 0=bomba na mão | 1=ARREMESSA a bomba | 2=esgueirando | 3="shhh"
             4: 0=binóculo | 1=rastejando | 2=de cócoras | 5: 0,1,2=parado
       A forma NORMAL também usa quadros da folha furtiva (moita, bomba de
       fumaça) — passo `{folha, q:[faixa,quadro]}`, ver Sprites.frameFor. */
    { id:'smergulao', name:'Smergulão', title:'O Fugitivo das Ruínas',
      sheet:'assets/smergulao/smergulao.png', scaleAdj:1.0, so3x3:true,
      folhasExtras:['assets/smergulao/smergulao_escondido.png'],
      palette:{ skin:'#7a4a2e', hair:'#141010', primary:'#f2f2f2', secondary:'#2c3e66',
                shoe:'#d8d8d8', aura:'#ff9ecb', eye:'#141018' },
      weapon:{ type:'fists', color:'#7a4a2e', edge:'#c98d5a', aura:'#ff9ecb' },
      element:'shadow', body:'big', sig:'', race:'smergulus',
      hp:175, atk:22, def:9, spd:12, jmp:13, weight:1.1, passive:'furtividade',
      formNames:['Normal','MODO FURTIVO'],
      story:'Ninguém vê ele chegar e ninguém vê ele sair. Quando você acha que acertou, era uma moita. '+
            'Quando você erra, ele já está nas suas costas.',
      lore:'Smergulão era um smerg GRANDE do Smergulus Kingdom — grande demais pra passar despercebido, e '+
           'mesmo assim ninguém nunca pegou ele no flagra. Cometia crimes em segredo, crimes tão pesados que '+
           'até hoje ninguém no reino tem coragem de dizer quais foram, até que foi expulso. Foi parar na Ilha '+
           'das Ruínas, onde virou o líder ao lado da parceira, a Criança Rosa. Luta sem ser visto: se esconde '+
           'em moita, some no meio de fumaça colorida e, quando o inimigo erra, aparece pelas costas pra cobrar.',
      forms:[
        /* ---------- FORMA 0: NORMAL ---------- */
        { sheet:'assets/smergulao/smergulao.png', olhos:{ q:[0,0], r:[0.36,0.155,0.40,0.045] }, anims:{
            idle:      {band:0, frames:[1,2],          fps:3, loop:true},
            walk:      {band:0, frames:[3,4],          fps:8, loop:true},
            jump:      {band:3, frames:[1],            fps:1, loop:true},     // esquiva de lado
            fall:      {band:3, frames:[1],            fps:1, loop:true},
            block:     {band:3, frames:[0],            fps:1, loop:true},
            punch:     {band:1, frames:[0,1,2],        fps:10, loop:false},
            thrust:    {band:1, frames:[1],            fps:1, loop:false},
            swing:     {band:1, frames:[2],            fps:1, loop:false},
            kick:      {band:2, frames:[0,1],          fps:8, loop:false},
            ranged:    {band:1, frames:[1],            fps:1, loop:false},
            aim:       {band:1, frames:[0],            fps:1, loop:false},
            special:   {band:5, frames:[1,0],          fps:4, loop:false},
            hurt:      {band:3, frames:[3],            fps:1, loop:true},
            ko:        {band:3, frames:[[3,2],[4,0]],  fps:5, loop:false},
            win:       {band:5, frames:[0,1],          fps:3, loop:true},
            // ---- golpes do 3x3 ----
            traicoeiro:{band:1, frames:[{folha:'assets/smergulao/smergulao_escondido.png', q:[0,3]}, [1,2], [2,2]], fps:7, loop:false},  // chega na ponta do pé → soco → VOADORA
            sombras:   {band:1, frames:[[1,0],[2,1],{folha:'assets/smergulao/smergulao_escondido.png', q:[0,4]}], fps:7, loop:false},     // soco → chute alto → some rastejando
            moita:     {band:1, frames:[{folha:'assets/smergulao/smergulao_escondido.png', q:[1,2]}, {folha:'assets/smergulao/smergulao_escondido.png', q:[2,0]}], fps:4, loop:false},
            fumaca:    {band:3, frames:[{folha:'assets/smergulao/smergulao_escondido.png', q:[3,0]}, {folha:'assets/smergulao/smergulao_escondido.png', q:[3,1]}, {folha:'assets/smergulao/smergulao_escondido.png', q:[3,3]}], fps:4, loop:false},
            escondido: {band:2, frames:[{folha:'assets/smergulao/smergulao_escondido.png', q:[2,0]}], fps:1, loop:true} } },  // parado DENTRO da moita
        /* ---------- FORMA 1: MODO FURTIVO ---------- */
        { sheet:'assets/smergulao/smergulao_escondido.png', olhos:{ folha:'assets/smergulao/smergulao.png', q:[0,0], r:[0.36,0.155,0.40,0.045] }, anims:{
            idle:      {band:1, frames:[0,[3,3]],      fps:2, loop:true},     // espreita ↔ "shhh"
            walk:      {band:0, frames:[0,1,2],        fps:7, loop:true},     // andando agachado
            jump:      {band:1, frames:[1],            fps:1, loop:true},
            fall:      {band:1, frames:[3],            fps:1, loop:true},
            block:     {band:1, frames:[2],            fps:1, loop:true},     // atrás da parede
            punch:     {band:3, frames:[2,1],          fps:8, loop:false},
            thrust:    {band:3, frames:[1],            fps:1, loop:false},
            swing:     {band:3, frames:[1],            fps:1, loop:false},
            kick:      {band:3, frames:[1],            fps:1, loop:false},
            ranged:    {band:3, frames:[0,1],          fps:6, loop:false},
            aim:       {band:3, frames:[0],            fps:1, loop:false},
            special:   {band:3, frames:[0,1],          fps:5, loop:false},
            hurt:      {band:1, frames:[3],            fps:1, loop:true},
            ko:        {band:4, frames:[2,1],          fps:5, loop:false},
            win:       {band:4, frames:[0,[3,3]],      fps:2, loop:true},     // binóculo ↔ "shhh"
            traicoeiro:{band:0, frames:[[0,3],[3,2],[3,1]],      fps:7, loop:false},
            sombras:   {band:0, frames:[[0,4],[4,1],[0,3]],      fps:7, loop:false},
            moita:     {band:1, frames:[[1,2],[2,0]],            fps:4, loop:false},
            fumaca:    {band:3, frames:[[3,0],[3,1],[3,3]],      fps:4, loop:false},
            escondido: {band:2, frames:[0],                      fps:1, loop:true} } }
      ],
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ===================== CRIANÇA ROSA =====================
       so3x3, DUAS FORMAS (ver duas_almas/formaOverride em turndata.js):
       forma 0 CRIANÇA (suporte) · forma 1 DEMÔNIO (dano + Ursão).
       Parceira do Smergulão na Ilha das Ruínas; morta pela Smergula como
       vingança ao crime dele, voltou com poderes de demônio.
         · crianca_rosa.png (auto): 0=retrato
             1: 0=parada c/ ursinho | 1=andando | 2=correndo | 3=engatinhando
             2: 0=balança o urso | 1=GIRA o urso | 2=ARREMESSA o urso | 3=pega do chão
             3: 0=soco | 1=chute | 2,3=ABRAÇA o urso
             4: 0=pisando de birra | 1=urso sobre a cabeça | 2=caída | 3=CHORANDO sentada
             5: 0=comemora jogando o urso | 1=triste | 2=chorando (o deitado do fim: 35px, não detectado)
         · crianca_rosa2.png (DEMÔNIO, auto): 0=retrato com aura
             1: igual à humana (parada, andando, correndo, engatinhando)
             2: 0=GARRA de sombra | 1=segura o urso | 2=arremessa o urso sombrio | 3=urso no chão
             3: 0=soco sombrio | 1=chute c/ a FERA de sombra | 2=BOLA DE FOGO | 3=abraça o urso
             4: 0=braços pra cima | 1=urso sobre a cabeça | 2=INVOCA o urso demônio | 3=aura de fogo escuro
             5: 0=com o VULTO de olhos vermelhos | 1=tonta | 2=aura gigante
         · crianca_rosa_poderes.png = EFEITOS (não é personagem; o TurnFX
           recorta: 1:0/1:1 garras, 1:2 mandíbula, 0:0 vulto, 3:0 domo de
           olhos, 3:1 portal, 4:0 espinhos, 4:3 chama vermelha, 5:0 explosão…)
         · crianca_rosa_urso.png = o URSÃO (personagem `ursao`, invocação). */
    { id:'crianca_rosa', name:'Criança Rosa', title:'A Alma Dupla',
      sheet:'assets/crianca_rosa/crianca_rosa.png', scaleAdj:0.88, so3x3:true,
      folhasExtras:['assets/crianca_rosa/crianca_rosa_poderes.png'],
      palette:{ skin:'#e8b090', hair:'#6a3a1e', primary:'#ff8ac4', secondary:'#3a6ab0',
                shoe:'#ff9ecb', aura:'#c4103a', eye:'#141018' },
      weapon:{ type:'fists', color:'#8a5a32', edge:'#c98d5a', aura:'#c4103a' },
      element:'shadow', body:'slim', sig:'', race:'meio_demonio',
      hp:170, atk:21, def:10, spd:11, jmp:12, weight:0.8, passive:'duas_almas',
      formNames:['Criança','DEMÔNIO'],
      story:'Abraça o ursinho, canta pro time e cura quem cair. Até o dia em que o demônio acorda — '+
            'e o ursinho volta do abismo do tamanho de um urso de verdade.',
      lore:'A Criança Rosa vive na Ilha das Ruínas e é a parceira do Smergulão. Quando o Smergulão cometeu o '+
           'crime que o expulsou do reino, a rainha Smergula se vingou nela: a menina foi morta. Mas não ficou '+
           'morta — voltou com uma alma de demônio dividindo o corpo com a dela. Na maior parte do tempo ainda '+
           'é a criança que cuida dos outros com o ursinho no colo; quando o demônio toma conta, os olhos ficam '+
           'vermelhos, o ursinho vira sombra, e se alguém do time cair ela paga com a própria vida pra trazer o '+
           'ursinho de volta do abismo — enorme, em chamas, e com muita fome.',
      forms:[
        /* ---------- FORMA 0: CRIANÇA ---------- */
        { sheet:'assets/crianca_rosa/crianca_rosa.png', olhos:{ q:[0,0], r:[0.22,0.17,0.5,0.07] }, anims:{
            idle:     {band:1, frames:[0,[3,3]],         fps:2, loop:true},     // segura ↔ abraça o urso
            walk:     {band:1, frames:[1,2],             fps:7, loop:true},
            jump:     {band:4, frames:[1],               fps:1, loop:true},
            fall:     {band:4, frames:[1],               fps:1, loop:true},
            block:    {band:3, frames:[2],               fps:1, loop:true},
            punch:    {band:3, frames:[0],               fps:1, loop:false},
            thrust:   {band:3, frames:[0],               fps:1, loop:false},
            swing:    {band:2, frames:[0],               fps:1, loop:false},
            kick:     {band:3, frames:[1],               fps:1, loop:false},
            ranged:   {band:2, frames:[1,2],             fps:7, loop:false},
            aim:      {band:2, frames:[1],               fps:1, loop:false},
            special:  {band:5, frames:[0],               fps:1, loop:false},
            hurt:     {band:5, frames:[2],               fps:1, loop:true},
            ko:       {band:1, frames:[3,[4,2]],         fps:5, loop:false},
            win:      {band:5, frames:[0,[4,1]],         fps:2, loop:true},
            // ---- golpes do 3x3 ----
            ursinho:  {band:2, frames:[[2,0],[2,1],[2,2]],            fps:7, loop:false},  // balança → gira → ARREMESSA
            abraco:   {band:3, frames:[[1,2],[3,2],[3,3]],            fps:6, loop:false},  // corre → abraça
            cantiga:  {band:3, frames:[[3,3],[3,2],[5,0]],            fps:4, loop:false},
            despertar:{band:4, frames:[[4,0],[4,3],{folha:'assets/crianca_rosa/crianca_rosa2.png', q:[5,2]}], fps:4, loop:false},  // birra → choro → o DEMÔNIO
            acalmar:  {band:3, frames:[[3,3],[5,0]],                  fps:4, loop:false} } },
        /* ---------- FORMA 1: DEMÔNIO ---------- */
        { sheet:'assets/crianca_rosa/crianca_rosa2.png', olhos:{ q:[0,0], r:[0.36,0.215,0.38,0.065] }, anims:{
            idle:     {band:1, frames:[0,[3,3]],         fps:2, loop:true},
            walk:     {band:1, frames:[1,2],             fps:7, loop:true},
            jump:     {band:4, frames:[1],               fps:1, loop:true},
            fall:     {band:4, frames:[1],               fps:1, loop:true},
            block:    {band:3, frames:[3],               fps:1, loop:true},
            punch:    {band:3, frames:[0],               fps:1, loop:false},
            thrust:   {band:3, frames:[0],               fps:1, loop:false},
            swing:    {band:2, frames:[0],               fps:1, loop:false},
            kick:     {band:3, frames:[1],               fps:1, loop:false},
            ranged:   {band:3, frames:[2],               fps:1, loop:false},
            aim:      {band:2, frames:[1],               fps:1, loop:false},
            special:  {band:4, frames:[3],               fps:1, loop:false},
            hurt:     {band:5, frames:[1],               fps:1, loop:true},
            ko:       {band:5, frames:[1,[1,3]],         fps:5, loop:false},
            win:      {band:4, frames:[0,[5,2]],         fps:2, loop:true},
            garra:    {band:2, frames:[[1,2],[2,1],[2,0],[3,0]],      fps:8, loop:false},  // corre → GARRA → soco sombrio
            pesadelo: {band:4, frames:[[4,3],[5,0]],                  fps:4, loop:false},  // aura → solta o VULTO
            fogo:     {band:3, frames:[[2,1],[3,2]],                  fps:5, loop:false},  // segura o urso → BOLA DE FOGO
            invocar:  {band:4, frames:[[4,1],[4,2],[4,2]],            fps:4, loop:false},  // ergue o urso → URSO DEMÔNIO
            despertar:{band:5, frames:[[5,2]],                        fps:1, loop:false},
            acalmar:  {band:5, frames:[[5,2],{folha:'assets/crianca_rosa/crianca_rosa.png', q:[4,3]},{folha:'assets/crianca_rosa/crianca_rosa.png', q:[3,3]}], fps:4, loop:false} } }  // aura → choro → abraça o urso
      ],
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ======================== URSÃO ========================
       INVOCAÇÃO da Criança Rosa (`invocacao:true`: fica fora da montagem
       de time e do sorteio — só existe quando ela invoca). Folha
       crianca_rosa_urso.png (auto):
         0: 0=ursinho | 1=ursinho em chamas | 2,3=virando URSO com aura
         1: 0,1=em pé | 2=de quatro | 2: 0=ruge c/ aura | 1=patada | 2=CORRE de quatro
         3: 0=chute c/ rastro de garra | 1=agacha c/ aura | 2=PANCADA no chão
         4: 0,1=rugido | 5: 0=machucado | 1=tonto | 2=desaba          */
    { id:'ursao', name:'Ursão', title:'O Ursinho do Abismo',
      olhos:{ q:[0,3], r:[0.45,0.30,0.45,0.14] },
      sheet:'assets/crianca_rosa/crianca_rosa_urso.png', scaleAdj:1.08, so3x3:true, invocacao:true,
      palette:{ skin:'#3a2418', hair:'#1a0e0a', primary:'#3a2418', secondary:'#c4103a',
                shoe:'#1a0e0a', aura:'#c4103a', eye:'#ff2020' },
      weapon:{ type:'fists', color:'#3a2418', edge:'#c4103a', aura:'#c4103a' },
      element:'shadow', body:'big', sig:'', race:'meio_demonio',
      hp:100, atk:28, def:10, spd:11, jmp:10, weight:1.6, passive:'invocado',
      story:'Era o ursinho de pelúcia dela. Voltou do abismo pra cobrar quem derrubou os amigos da dona.',
      anims:{
        idle:     {band:1, frames:[0,1],               fps:2, loop:true},
        walk:     {band:1, frames:[2,[2,2]],           fps:6, loop:true},
        jump:     {band:2, frames:[2],                 fps:1, loop:true},
        fall:     {band:2, frames:[2],                 fps:1, loop:true},
        block:    {band:3, frames:[1],                 fps:1, loop:true},
        punch:    {band:2, frames:[1],                 fps:1, loop:false},
        thrust:   {band:2, frames:[1],                 fps:1, loop:false},
        swing:    {band:2, frames:[1],                 fps:1, loop:false},
        kick:     {band:3, frames:[0],                 fps:1, loop:false},
        ranged:   {band:4, frames:[0,1],               fps:5, loop:false},
        aim:      {band:4, frames:[0],                 fps:1, loop:false},
        special:  {band:2, frames:[0],                 fps:1, loop:false},
        hurt:     {band:5, frames:[0],                 fps:1, loop:true},
        ko:       {band:5, frames:[1,2],               fps:4, loop:false},
        win:      {band:2, frames:[0,[0,3]],           fps:2, loop:true},
        surgir:   {band:0, frames:[0,1,2,3],           fps:4, loop:false},   // ursinho → em chamas → URSO
        patada:   {band:1, frames:[[1,1],[2,1],[3,0]], fps:7, loop:false},
        investida:{band:2, frames:[[2,2],[3,2]],       fps:6, loop:false},   // corre de quatro → PANCADA no chão
        rugido:   {band:4, frames:[[2,0],[4,0],[4,1]], fps:5, loop:false}
      },
      skills:[] },   // sem kit de 1x1 (ver so3x3)

    /* ======================= MANO COXINHA =======================
       De Limeira, mas HUMANO (gosta tanto de coxinha que ficou com o
       formato dela). so3x3. Três folhas (auto, fundo transparente):
         · mano_coxinha.png (BASE):
             0: retrato grande | 1: 0–4 parado/andando
             2: 0=soco | 1=soco esticado | 2=guarda | 3=chute | 4=chute alto
             3: 0=base | 1=investida c/ soco | 2=arrancada
             4: 0,1=caindo | 2,3=deitado | 5: 0=em pé | 1=mão na cara | 2=cobre o rosto | 3=tonto | 4=deitado
         · mano_coxinha_coxinha.png (C): 0: COME A COXINHA (nhoc → mastiga → barriga)
             1: 0=inclina | 1=boca aberta | 2=CRUNCH | 3=sorriso | 2: 0–4 comendo
             3: 1=segura a coxinha pra jogar | 5=inclinado | 8=nuvem do BURP (efeito)
             (as duas últimas fileiras grudaram na detecção: só uso as poses limpas)
         · mano_coxinha_comidas.png (F): 1: PIZZA (segura → boca → mordida → engole)
             3: HAMBÚRGUER (segura → mordida → mastiga → barriga)
       Uma FORMA por modo de combate (turndata.js: 0 normal, 1 defesa, 2
       ataque, 3 velocidade) — mesma folha, mas cada modo PARADO e ANDANDO
       de um jeito: defesa de guarda fechada e devagar, ataque inclinado pra
       frente rindo, velocidade quicando no lugar. */
    (function(){
      const C='assets/mano_coxinha/mano_coxinha_coxinha.png', F='assets/mano_coxinha/mano_coxinha_comidas.png';
      const c=(b,f)=>({ folha:C, q:[b,f] }), fo=(b,f)=>({ folha:F, q:[b,f] });
      // golpes e poses que valem em TODOS os modos
      const comum={
        jump:     {band:3, frames:[[3,2]], fps:1, loop:true},
        fall:     {band:3, frames:[[3,2]], fps:1, loop:true},
        block:    {band:2, frames:[[2,2]], fps:1, loop:true},
        punch:    {band:2, frames:[[2,0],[2,1]], fps:9, loop:false},
        thrust:   {band:2, frames:[[2,1]], fps:1, loop:false},
        swing:    {band:2, frames:[[2,0],[2,1]], fps:9, loop:false},
        kick:     {band:2, frames:[[2,3],[2,4]], fps:8, loop:false},
        ranged:   {band:3, frames:[c(3,1)], fps:1, loop:false},
        aim:      {band:3, frames:[c(3,1)], fps:1, loop:false},
        special:  {band:5, frames:[[5,0]], fps:1, loop:false},
        hurt:     {band:5, frames:[[5,1]], fps:1, loop:true},
        ko:       {band:4, frames:[[4,0],[4,1],[4,2]], fps:5, loop:false},
        win:      {band:5, frames:[[5,0],[1,4]], fps:2, loop:true},
        // ---- golpes do 3x3 ----
        barrigada:{band:3, frames:[[3,2],[3,1]], fps:7, loop:false},          // arranca → trombada
        tapas:    {band:2, frames:[[2,0],[2,1],[2,0],[2,1]], fps:13, loop:false},
        crunch:   {band:1, frames:[c(1,0),c(1,1),c(1,2)], fps:7, loop:false},  // inclina → abre a boca → CRUNCH
        arremesso:{band:3, frames:[[3,0],c(3,1),[2,1]], fps:7, loop:false},    // pega a coxinha → arremessa
        guarda:   {band:5, frames:[[5,2],[2,2]], fps:4, loop:false},           // estufa a massa
        arroto:   {band:1, frames:[c(1,3),c(3,5)], fps:4, loop:false},         // sorri → solta o BURP
        investida:{band:3, frames:[[3,2],[3,1]], fps:10, loop:false},
        comerCoxinha:   {band:0, frames:[c(0,0),c(0,1),c(0,2)], fps:4, loop:false},
        comerHamburguer:{band:3, frames:[fo(3,0),fo(3,1),fo(3,2),fo(3,3)], fps:5, loop:false},
        comerPizza:     {band:1, frames:[fo(1,0),fo(1,1),fo(1,2),fo(1,3)], fps:5, loop:false} };
      const forma=(extra)=>({ sheet:'assets/mano_coxinha/mano_coxinha.png', olhos:{ q:[0,0], r:[0.44,0.245,0.28,0.055] },
                               anims:Object.assign({}, comum, extra) });
      return { id:'mano_coxinha', name:'Mano Coxinha', title:'O Salgado de Limeira',
        olhos:{ q:[0,0], r:[0.44,0.245,0.28,0.055] },
        sheet:'assets/mano_coxinha/mano_coxinha.png', scaleAdj:1.0, so3x3:true,
        folhasExtras:[C, F],
        palette:{ skin:'#a8704a', hair:'#1a1210', primary:'#e8a83a', secondary:'#b8782a',
                  shoe:'#7a4a2a', aura:'#ffc85a', eye:'#141018' },
        weapon:{ type:'fists', color:'#a8704a', edge:'#e8a83a', aura:'#ffc85a' },
        element:'earth', body:'big', sig:'', race:'humano',
        hp:186, atk:21, def:13, spd:10, jmp:10, weight:1.3, passive:'cardapio',
        formNames:['Normal','COXINHA','HAMBÚRGUER','PIZZA'],
        story:'Uma coxinha tem massa, recheio e casca. Ele também. E se comer o lanche certo, vira outra pessoa '+
              'no meio da luta.',
        lore:'O Mano Coxinha é de Limeira, mas não é limeirense de raça: é humano, só gosta tanto de coxinha que '+
             'ficou com o formato dela. Luta no ritmo do que comeu por último — coxinha deixa ele duro de derrubar, '+
             'hambúrguer deixa ele bravo e pizza deixa ele rápido demais pra alguém daquele tamanho.',
        forms:[
          // NORMAL: parado de boa, anda balançando
          forma({ idle:{band:1, frames:[[1,0],[1,4]], fps:2, loop:true},
                  walk:{band:1, frames:[[1,1],[1,2],[1,3]], fps:7, loop:true} }),
          // DEFESA (coxinha): guarda fechada, cobrindo o rosto, passo pesado
          forma({ idle:{band:2, frames:[[2,2],[5,2]], fps:1.5, loop:true},
                  walk:{band:1, frames:[[1,1],[1,3]], fps:3, loop:true},
                  block:{band:5, frames:[[5,2]], fps:1, loop:true} }),
          // ATAQUE (hambúrguer): inclinado pra frente, rindo de boca aberta
          forma({ idle:{band:1, frames:[c(1,0),c(1,3)], fps:3, loop:true},
                  walk:{band:3, frames:[[3,2],c(1,0)], fps:6, loop:true} }),
          // VELOCIDADE (pizza): quica no lugar sem parar
          forma({ idle:{band:1, frames:[[1,0],[1,1],[1,2],[1,3]], fps:10, loop:true},
                  walk:{band:1, frames:[[1,1],[1,2],[1,3],[1,2]], fps:13, loop:true} })
        ],
        skills:[] };   // sem kit de 1x1 (ver so3x3)
    })(),

    /* ======================== PRODOCIMO ========================
       A ENGANADORA. Smergulus que se mudou pra Limeira pequena. so3x3.
       Três folhas (auto, fundo transparente):
         · prodocimo3.png (BASE, P3):
             0: 0=guarda | 1=soco | 2,3=guarda rindo | 4,5=arrancada | 6=agacha c/ a nota
             1: 0–3=BOTE de mão leve (mergulha agarrando) | 4=ponte | 5=bananeira | 6=estrela
             2: 0,1=guarda | 2,3=SUMINDO (transparente) | 4=vira fumaça | 5=reaparece
                (o fiapo de fumaça entre 4 e 5 tem < 40px e não é detectado)
             3: apontando / chutes — SEM AS PERNAS (a faixa saiu cortada): não usar
             4: 0–6=rindo com a mão na boca (FOFOCA) | 7="shhh"
         · prodocimo2.png (P2): 0: 0,1=parada | 2–5=andando
             1: estende a mão | 2: 0–5=mão estendida | 6=APERTO (a mão do outro entra)
             3: chacoalhando a mão — também SEM AS PERNAS: não usar | 4: parada sem graça
         · prodocimo.png (P1): METADE da resolução das outras (passo `esc`):
             3: 0=chute alto | 1=chute lateral | 2=joelhada | 4: 0=machucada
             nocaute (caindo / deitada) não é detectado → retângulos `r`. */
    (function(){
      const P1='assets/prodocimo/prodocimo.png', P2='assets/prodocimo/prodocimo2.png';
      const ESC=1.55;   // P1 desenhada na mesma altura das outras
      const p2=(b,f)=>({ folha:P2, q:[b,f] });
      const p1=(b,f)=>({ folha:P1, q:[b,f], esc:ESC });
      const p1r=(x,y,w,h)=>({ folha:P1, r:{x,y,w,h}, esc:ESC });
      return { id:'prodocimo', name:'Prodocimo', title:'A Enganadora',
        olhos:{ folha:P1, q:[0,0], r:[0.34,0.125,0.38,0.06] },
        sheet:'assets/prodocimo/prodocimo3.png', scaleAdj:1.0, so3x3:true,
        folhasExtras:[P1, P2],
        palette:{ skin:'#6a3e26', hair:'#141010', primary:'#c8202a', secondary:'#8a1218',
                  shoe:'#2a2a30', aura:'#ff5fa2', eye:'#141018' },
        weapon:{ type:'fists', color:'#6a3e26', edge:'#c8202a', aura:'#ff5fa2' },
        element:'shadow', body:'slim', sig:'', race:'smergulus',
        hp:165, atk:20, def:10, spd:12, jmp:13, weight:0.9, passive:'cara_de_pau',
        story:'Te estende a mão sorrindo. Quando você aperta, já não sabe mais de que lado está.',
        lore:'Prodocimo nasceu Smergulus, no reino da rainha Smergula, e se mudou pra Limeira ainda pequena — '+
             'onde mora até hoje. Desde criança o que ela mais gosta de fazer é enganar os outros: finge que vai '+
             'dar um soco e chuta, some no meio da fumaça quando você jura que acertou, e passa a mão no que é '+
             'seu enquanto conversa. É a única pessoa que já conseguiu enganar a própria rainha Smergula. '+
             'Ela não é a mais forte de ninguém — é a que mais dá raiva de enfrentar.',
        anims:{
          idle:   {band:0, frames:[2,3],                     fps:2, loop:true},     // guarda rindo
          walk:   {band:0, frames:[p2(0,2),p2(0,3),p2(0,4),p2(0,5)], fps:8, loop:true},
          jump:   {band:1, frames:[[1,6]],                   fps:1, loop:true},     // estrela
          fall:   {band:1, frames:[[1,4]],                   fps:1, loop:true},
          block:  {band:2, frames:[[2,0]],                   fps:1, loop:true},
          punch:  {band:0, frames:[0,1],                     fps:9, loop:false},
          thrust: {band:0, frames:[1],                       fps:1, loop:false},
          swing:  {band:1, frames:[[1,1]],                   fps:1, loop:false},
          kick:   {band:0, frames:[[0,0],p1(3,1)],           fps:8, loop:false},
          ranged: {band:0, frames:[[0,5],[0,6]],             fps:6, loop:false},
          aim:    {band:0, frames:[[0,4]],                   fps:1, loop:false},
          special:{band:4, frames:[[4,7]],                   fps:1, loop:false},    // "shhh"
          hurt:   {band:0, frames:[p1(4,0)],                 fps:1, loop:true},
          ko:     {band:0, frames:[p1r(53,306,42,32), p1r(4,397,58,19)], fps:5, loop:false},
          win:    {band:4, frames:[[4,1],[4,4],[4,7]],       fps:3, loop:true},     // ri da sua cara
          // ---- golpes do 3x3 ----
          finta:  {band:0, frames:[[0,0],[0,1],p1(3,1),p1(3,0)],    fps:8, loop:false},  // finge o soco → CHUTA
          maoLeve:{band:1, frames:[[0,5],[1,0],[1,1],[1,2]],        fps:8, loop:false},  // bote de mão leve
          sumico: {band:2, frames:[[2,1],[2,2],[2,3],[2,4]],        fps:4, loop:false},  // some na fumaça
          sumida: {band:2, frames:[[2,3],[2,2]],                    fps:2, loop:true},   // parada "transparente"
          fofoca: {band:4, frames:[[4,0],[4,2],[4,4],[4,7]],        fps:4, loop:false},  // ri → "shhh"
          aperto: {band:0, frames:[p2(1,1),p2(1,3),p2(2,2),p2(2,6),p2(2,5),p2(2,6)], fps:6, loop:false}
        },
        skills:[] };   // sem kit de 1x1 (ver so3x3)
    })(),

    /* ===================== DMATERELIZADOR =====================
       Desmaterializa as coisas. Fã nº 1 da CDI (entidade criminosa de
       Limeira) — e ninguém gosta dele, nem a CDI. so3x3. Três folhas cujo
       recorte automático GRUDA fileiras (os efeitos encostam uns nos
       outros): quase tudo aqui é RETÂNGULO medido à mão (`{folha, r, esc}`),
       e cada fileira foi desenhada num tamanho → `esc` iguala tudo à guarda
       da fileira de baixo da folha 2 (88px, o idle).
         · dmatrelizador2.png (D2, BASE): retrato | A: guarda, braço girando
           energia | B: andando, pulo, golpe no chão | C: PORTAL, portal com
           tiro, soco | D: correndo, DESMATERIALIZANDO (cubinhos), empurrão |
           E: agachado, espinhos no chão | F: guarda, empurrão, ajeita os óculos
         · dmatrelizador.png (D1): 1: carrega a esfera → empurra → TIRO | 2: o
           REDEMOINHO (só efeito), conjurando com os braços pra cima | 3,4: o
           RAIO GIGANTE (o 4 virando cubos) | 5: raio em cima da cabeça, parado
         · dmatrelizador3.png (D3): mesmas poses de D2/D1; daqui só sai o
           portal com o jato saindo dele. */
    (function(){
      const D1='assets/dmatrelizador/dmatrelizador.png', D2='assets/dmatrelizador/dmatrelizador2.png', D3='assets/dmatrelizador/dmatrelizador3.png';
      const r1=(x,y,w,h,e)=>({ folha:D1, r:{x,y,w,h}, esc:e||1.1 });
      const r2=(x,y,w,h,e)=>({ folha:D2, r:{x,y,w,h}, esc:e||1 });
      const r3=(x,y,w,h,e)=>({ folha:D3, r:{x,y,w,h}, esc:e||1.15 });
      const OCULOS=r2(274,631,56,77), CUBOS=r2(194,458,63,76,1.14);
      return { id:'dmaterelizador', name:'Dmaterelizador', title:'O Fã Número 1 da CDI',
        olhos:{ q:[0,0], r:[0.36,0.165,0.29,0.06] },
        sheet:D2, scaleAdj:1.0, so3x3:true,
        folhasExtras:[D1, D3],
        palette:{ skin:'#7a4a2e', hair:'#1a1210', primary:'#2f6fd6', secondary:'#3a3a42',
                  shoe:'#2a2a30', aura:'#8a5cff', eye:'#141018' },
        weapon:{ type:'fists', color:'#7a4a2e', edge:'#8a5cff', aura:'#8a5cff' },
        element:'energy', body:'normal', sig:'', race:'humano',
        hp:168, atk:21, def:10, spd:11, jmp:12, weight:1.0, passive:'desintegracao',
        story:'Desmancha o que você tem, desmancha o que você constrói e, quando você vai revidar, ele nem está mais ali.',
        lore:'O Dmaterelizador é um dos maiores fãs da CDI, a entidade de Limeira que nasceu pra fazer o bem e acabou '+
             'se renegando no crime. Ele defende a CDI pra quem quiser ouvir — e pra quem não quiser também. Tem o '+
             'poder de DESMATERIALIZAR as coisas: armadura, muralha, carro blindado, fumaça, até o próprio corpo, '+
             'quando a briga aperta. É extremamente chato, e todo mundo sabe disso: ninguém gosta dele — nem os '+
             'próprios membros da CDI.',
        anims:{
          idle:   {band:5, frames:[0,0,OCULOS],                fps:1.5, loop:true},   // guarda… ajeita os óculos
          walk:   {band:5, frames:[r2(25,292,50,78,1.13), r2(21,462,58,73,1.17), r2(104,462,60,71,1.17)], fps:7, loop:true},
          jump:   {band:5, frames:[r2(118,291,34,79,1.13)],    fps:1, loop:true},
          fall:   {band:5, frames:[r2(118,291,34,79,1.13)],    fps:1, loop:true},
          block:  {band:5, frames:[2],                         fps:1, loop:true},      // mão espalmada
          punch:  {band:5, frames:[r2(195,381,63,76,1.14)],    fps:1, loop:false},
          thrust: {band:5, frames:[r2(195,381,63,76,1.14)],    fps:1, loop:false},
          swing:  {band:5, frames:[r2(189,206,62,84,1.24)],    fps:1, loop:false},
          kick:   {band:5, frames:[r2(195,381,63,76,1.14)],    fps:1, loop:false},
          ranged: {band:5, frames:[1,2],                       fps:6, loop:false},
          aim:    {band:5, frames:[1],                         fps:1, loop:false},
          special:{band:5, frames:[r1(108,313,67,89)],         fps:1, loop:false},     // conjurando
          hurt:   {band:5, frames:[r1(263,654,60,77,1.0)],     fps:1, loop:true},
          ko:     {band:5, frames:[r1(263,654,60,77,1.0), CUBOS], fps:4, loop:false},  // ele mesmo se desmancha
          win:    {band:5, frames:[OCULOS, r1(189,644,46,88,1.0)], fps:2, loop:true},
          // ---- golpes do 3x3 ----
          toque:  {band:5, frames:[r1(19,214,57,81), r1(92,214,80,80), r1(184,214,83,81)], fps:7, loop:false},  // esfera → empurra → TIRO
          portal: {band:5, frames:[r2(24,380,72,76,1.14), r2(104,379,101,76,1.14), r3(35,395,102,73,1.17)], fps:6, loop:false},
          desfaz: {band:5, frames:[r2(189,206,62,84,1.24), r2(275,201,59,89,1.24), r1(108,313,67,89)], fps:5, loop:false},
          fase:   {band:5, frames:[r2(273,458,63,72,1.17), CUBOS], fps:4, loop:false},
          fantasma:{band:5, frames:[CUBOS],                    fps:1, loop:true},      // parado, desmaterializado
          total:  {band:5, frames:[r1(22,609,58,121,1.0), r1(108,313,67,89), r1(18,418,56,84,1.05)], fps:4, loop:false},
          esgotado:{band:5, frames:[r1(263,654,60,77,1.0)],    fps:1, loop:true}       // sem fôlego depois da ult
        },
        skills:[] };   // sem kit de 1x1 (ver so3x3)
    })(),

    /* =================== ROBÔ DE PATRULHA (MODO HISTÓRIA) ===================
       Inimigo EXCLUSIVO do Capítulo 1: um robô de produção em massa,
       NÃO ciborgue — bem mais fraco que o Mecas de verdade. Reaproveita
       a folha `mecasnormal.png` (a mesma que o Mecas usa na forma
       Humano) como "mecha comum de fábrica" em vez de pedir arte nova:
       o nome no arquivo já era genérico ("mecas normal") antes de virar
       a forma 0 do protagonista. Chamado de "Robô", não "Mecas", para
       não colidir com o nome do próprio herói na barra de ORDEM DE TURNO
       (que mostra só a primeira palavra do nome de cada unidade).
       `historia:true` tira ele do sorteio aleatório e da montagem de
       time (ver Characters.jogaveis) — só existe dentro do encontro
       roteirizado da Fase 1 (js/historia.js). Pode aparecer repetido
       (TurnBattle aceita o mesmo id várias vezes no mesmo time). */
    { id:'mecas_grunt', name:'Robô de Patrulha', title:'Unidade de Produção',
      olhos:{ q:[0,0], r:[0.26,0.135,0.5,0.07] },
      sheet:'assets/mecas/mecasnormal.png', scaleAdj:1.0, so3x3:true, historia:true,
      palette:{ skin:'#c98d5a', hair:'#241a14', primary:'#5a5f68', secondary:'#cfd6e0', shoe:'#4a3524', aura:'#9fb3c8', eye:'#141018' },
      weapon:{ type:'fists', color:'#9fb3c8', edge:'#e6f0ff', aura:'#9fb3c8' },
      element:'physical', body:'normal', sig:'',
      hp:110, atk:10, def:4, spd:6, jmp:13, weight:1.0, passive:'sucata', race:'automato',
      story:'Unidade de patrulha de fábrica. Sem ciborgue, sem chip de combate avançado — só metal e ordens.',
      anims:{
        idle:   {band:3, frames:[0,3],     fps:4,  loop:true},
        walk:   {band:1, frames:[0,1],     fps:8,  loop:true},
        punch:  {band:1, frames:[0,1,3],   fps:14, loop:false},
        kick:   {band:2, frames:[0,1,2],   fps:12, loop:false},
        special:{band:1, frames:[2,3],     fps:9,  loop:false},
        hurt:   {band:5, frames:[0],       fps:1,  loop:true},
        ko:     {band:5, frames:[1],       fps:1,  loop:true},
        win:    {band:3, frames:[3],       fps:2,  loop:true}
      },
      skills:[] },

    /* =================== SOLDADO SMERG (MODO HISTÓRIA) ===================
       Inimigo EXCLUSIVO do Capítulo 2 — Smergulus Kingdom: o smerg COMUM,
       soldado raso da rainha Smergula. Existem centenas dele (o time
       inimigo entra com várias cópias deste id, renomeadas por `ajustes`:
       Recruta, Lanceiro, Capitão, Guarda Real...). Strong Smerg e Fat Smerg
       são smergs comuns que ficaram FORA do normal — por isso cada um deles
       é único. `historia:true` = nunca escolhível nem sorteado.
       Duas folhas, uma por FORMA (só as cutscenes trocam de forma):
         · smerg_normal.png (auto):
             0: retrato
             1: 0=parado | 1=andando | 2=correndo
             2: 0=guarda | 1=agachado c/ mão na cabeça | 2=cambaleando | 3=avanço
             3: 0=SOCO | 1=CHUTE alto | 2=arremesso da bola | 3=defesa agachado
             4: 0=braços pra cima | 1=caindo pra trás | 2=deitado | 3=sentado
             5: 0=guarda | 1=tonto (estrelinhas) | 2=empurrão
             (os dois "deitados" das pontas não são detectados — o deitado
              da faixa 4 cobre o nocaute)
         · scary_smerg.png (auto) — o mesmo soldado com MEDO:
             0: 0=parado tenso | 1=tremendo | 2=mãos no peito
             1: 0=pulo de susto | 1=mãos no rosto (grito)
             2: 0=agachado cobrindo a cabeça | 1=encolhido | 2=deitado
             3: 0=fugindo de braços pra cima | 1=correndo | 2=engatinhando
             4: 0=de joelhos | 1=roendo unha | 2=cobrindo o rosto | 3=apontando
             5: 0=caindo                                                  */
    { id:'smerg_normal', name:'Soldado Smerg', title:'Soldado da Rainha',
      sheet:'assets/soldado_smerg/smerg_normal.png', scaleAdj:0.92, so3x3:true, historia:true,
      palette:{ skin:'#8a5a3a', hair:'#1a1008', primary:'#9aa0a8', secondary:'#22252c', shoe:'#5a5a60', aura:'#a24bff', eye:'#141018' },
      weapon:{ type:'fists', color:'#8a5a3a', edge:'#c98d5a', aura:'#a24bff' },
      element:'physical', body:'normal', sig:'', race:'smergulus',
      hp:115, atk:11, def:4, spd:7, jmp:12, weight:1.0, passive:'soldado_raso',
      story:'Boné pra trás, camiseta cinza e medo da rainha. Sozinho não assusta ninguém — o problema é que nunca vem sozinho.',
      forms:[
        /* ---------- FORMA 0: NORMAL (a batalha usa só esta) ---------- */
        { sheet:'assets/soldado_smerg/smerg_normal.png', olhos:{ q:[0,0], r:[0.28,0.12,0.48,0.06] }, anims:{
            idle:   {band:2, frames:[0,[5,0]],     fps:2,  loop:true},
            walk:   {band:1, frames:[1,2],         fps:8,  loop:true},
            jump:   {band:1, frames:[2],           fps:1,  loop:true},
            fall:   {band:4, frames:[1],           fps:1,  loop:true},
            block:  {band:3, frames:[3],           fps:1,  loop:true},
            punch:  {band:3, frames:[[2,3],[3,0]], fps:10, loop:false},
            thrust: {band:5, frames:[2],           fps:1,  loop:false},
            swing:  {band:2, frames:[2],           fps:1,  loop:false},
            kick:   {band:3, frames:[[2,0],[3,1]], fps:9,  loop:false},
            ranged: {band:3, frames:[[2,0],[3,2]], fps:8,  loop:false},
            aim:    {band:3, frames:[2],           fps:1,  loop:false},
            special:{band:3, frames:[[2,0],[3,2]], fps:8,  loop:false},
            hurt:   {band:2, frames:[1],           fps:1,  loop:true},
            tonto:  {band:5, frames:[1],           fps:1,  loop:true},
            ko:     {band:4, frames:[1,2],         fps:5,  loop:false},
            win:    {band:4, frames:[0,[1,0]],     fps:2,  loop:true} } },
        /* ---------- FORMA 1: ASSUSTADO (só cutscene) ---------- */
        { sheet:'assets/soldado_smerg/scary_smerg.png', olhos:{ folha:'assets/soldado_smerg/smerg_normal.png', q:[0,0], r:[0.28,0.12,0.48,0.06] }, anims:{
            idle:   {band:0, frames:[0,1],         fps:3,  loop:true},
            walk:   {band:3, frames:[0,1],         fps:7,  loop:true},
            jump:   {band:1, frames:[0],           fps:1,  loop:true},
            fall:   {band:5, frames:[0],           fps:1,  loop:true},
            block:  {band:2, frames:[0],           fps:1,  loop:true},
            punch:  {band:4, frames:[3],           fps:1,  loop:false},
            special:{band:1, frames:[0,1],         fps:4,  loop:true},
            hurt:   {band:2, frames:[0,1],         fps:3,  loop:true},
            ko:     {band:2, frames:[2],           fps:1,  loop:true},
            win:    {band:4, frames:[0,1],         fps:2,  loop:true} } }
      ],
      skills:[] }   // sem kit de 1x1 (ver so3x3)
  ];

  function all(){ return ROSTER; }
  /* grid() é o elenco da LUTA 1x1. Quem for marcado `so3x3` fica de fora
     dela: entrou com kit de batalha por turnos (stats em turndata.js) e
     não tem golpes de ação (hitbox, startup, recovery) para o 1x1 —
     melhor não aparecer lá do que aparecer sem saber lutar. */
  function grid(){ return ROSTER.filter(c=>!c.so3x3 && !c.historia && !c.invocacao); }
  /* jogaveis() é o elenco ESCOLHÍVEL do 3x3 (montagem de time, sorteio
     de adversário aleatório, catálogo). Personagens `historia:true` são
     inimigos roteirizados do Modo História — existem no ROSTER (para
     Characters.byId/Sprites acharem a folha) mas nunca podem ser
     escolhidos nem sorteados fora do encontro roteirizado que os invoca. */
  /* `invocacao` (o Ursão da Criança Rosa) também fica de fora: só entra em
     campo quando é INVOCADO, nunca na montagem nem no sorteio. */
  function jogaveis(){ return ROSTER.filter(c=>!c.historia && !c.invocacao); }
  function byId(id){ return ROSTER.find(c=>c.id===id); }
  function preload(){
    ROSTER.forEach(c=>{
      if(c.sheet) SpriteSheet.load(c.sheet);
      // personagens com formas têm uma folha por forma — todas precisam
      // estar carregadas ANTES da transformação, senão ele "pisca" sumido
      if(c.forms) c.forms.forEach(f=>{ if(f.sheet) SpriteSheet.load(f.sheet); });
      // idem para SKINS — o catálogo troca de prévia na hora do clique,
      // sem esperar o download.
      if(c.skins) c.skins.forEach(s=>{ if(s.sheet) SpriteSheet.load(s.sheet); });
      // folhas de EFEITO dos golpes (o Tupas) — o TurnFX desenha recortes delas
      (c.folhasExtras||[]).forEach(u=>SpriteSheet.load(u));
    });
  }

  /* chave única de uma skin (personagem+skin) — usada tanto pra gravar o
     que já foi DESBLOQUEADO (js/ranked.js) quanto o que está EQUIPADO
     agora (js/catalog.js). Junta os dois ids pra não colidir entre
     personagens diferentes que um dia tenham skins com o mesmo id. */
  function skinKey(charId, skinId){ return charId+'__'+skinId; }
  /* toda skin do elenco que tem uma REGRA de desbloqueio (a 'padrão' não
     entra — já vem liberada). O Ranked varre essa lista inteira depois de
     cada partida ranqueada pra ver se alguma acabou de desbloquear. */
  function skinsComRegra(){
    const out=[];
    ROSTER.forEach(c=>{ (c.skins||[]).forEach(s=>{ if(s.unlock) out.push({charId:c.id, char:c, skin:s}); }); });
    return out;
  }

  /* ---------- SKIN EQUIPADA — preferência local (não precisa de conta,
     só pra DESBLOQUEAR uma skin nova precisa). Mora aqui (e não em
     catalog.js, que foi onde nasceu) porque quem lê hoje é o catálogo
     (pra ESCOLHER) e o 3x3 offline/online (montagem de time e a própria
     batalha, pra DESENHAR) — só o draft da ranqueada (js/turndraft.js)
     ignora de propósito e mostra sempre a folha padrão: no meio de uma
     escolha ao vivo contra outro jogador não é hora de mostrar cosmético,
     só depois que o personagem entra em campo de verdade. */
  const SKIN_EQUIP_KEY='arena_skins_equip_v1';   // {charId: skinId}
  function skinsEquipadasSalvas(){
    try{ return JSON.parse(localStorage.getItem(SKIN_EQUIP_KEY)||'{}'); }catch(e){ return {}; }
  }
  function salvarSkinEquipada(charId, skinId){
    const m=skinsEquipadasSalvas(); m[charId]=skinId;
    localStorage.setItem(SKIN_EQUIP_KEY, JSON.stringify(m));
  }
  /* skin em uso AGORA pra esse personagem — 'padrao' se ele não tem
     skins, nunca escolheu, ou escolheu uma que não existe mais. */
  function skinEquipadaId(c){
    if(!c || !c.skins || c.skins.length<2) return 'padrao';
    const salva=skinsEquipadasSalvas()[c.id];
    return (salva && c.skins.some(s=>s.id===salva)) ? salva : 'padrao';
  }
  /* view PRONTA pra desenhar (Sprites.renderTo/renderPose/drawChar) — o
     personagem original se for a skin padrão, a "visão" da skin senão. */
  function charComSkin(c){
    if(!c) return c;
    const sid=skinEquipadaId(c);
    return (sid==='padrao' || typeof Sprites==='undefined') ? c : Sprites.skinOf(c, sid);
  }

  return { all, grid, jogaveis, byId, preload, ROSTER, RACES, raceOf, skinKey, skinsComRegra,
           skinEquipadaId, salvarSkinEquipada, charComSkin };
})();
