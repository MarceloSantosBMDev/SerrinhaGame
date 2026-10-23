/* ============================================================
   HUB — a tela inicial no estilo "vila" (Naruto Shippuden).

   Em vez de uma lista de botões, o menu virou um LUGAR: você está
   parado na frente de um personagem, e é FALANDO com ele que o jogo
   começa. As setas ◀ ▶ trocam de ponto da vila (cada ponto tem seu
   cenário e seu personagem), e cada personagem tem uma árvore de
   diálogo — é ele que pergunta o que você quer jogar.

     🌲 DOJO DA MATA      · Strong Smerg    → 3x3 OFFLINE (contra a IA)
     🌃 PORTÃO DA ARENA   · Loirinha da CDI → ONLINE (ranqueada / casual)
     🔬 LABORATÓRIO 5000Z · Mecas           → catálogo e patch notes

   O sprite é o MESMO da batalha (js/sprites.js): fica em `idle`
   animado parado e passa para `walk` enquanto entra em cena, então o
   personagem realmente se mexe enquanto você lê o que ele fala.

   O cenário é o mesmo motor dos palcos do 3x3 (js/turnbg.js): ele
   aceita qualquer canvas em `ligar()`, então o hub reaproveita os seis
   ambientes já desenhados em vez de ter um fundo próprio. Quando a
   batalha começa, o TurnUI chama `ligar()` de novo no canvas dela.
   ============================================================ */
const Hub = (function(){

  /* ---------- os pontos da vila ---------- */
  const PONTOS = [
    {
      id:'dojo', local:'DOJO DA MATA', icone:'🌲', cenario:'mata',
      charId:'strong_smerg', cor:'#ffe066',
      tag:'⚔ 3x3 OFFLINE',
      raiz(){ return {
        fala:'Chegou. Aqui a gente treina de verdade: três de cada lado, '+
             'por turnos, sem pressa e sem desculpa. O que tu vai querer?',
        opcoes:[
          { txt:'⚔ Montar meu time e lutar', faz:()=>TurnUI.abrirMontagem() },
          { txt:'🎲 Time sorteado — luta agora', faz:()=>TurnUI.lutarComTime(sorteioDeTime()) },
          { txt:'🏕 Modo Sobrevivência', ir:'survival' },
          { txt:'❓ Me explica como funciona', ir:'regras' },
          { txt:'Depois eu volto.', fechar:true }
        ] };
      },
      nos:{
        survival:{
          fala:'Aqui é diferente: eu sorteio SEU time também, e você enfrenta '+
               'um time sorteado atrás do outro, sem parar, até perder. Quantos '+
               'você consegue derrubar seguido? O seu recorde fica salvo no perfil.',
          opcoes:[
            { txt:'🏕 Bora, sorteia meu time!', faz:()=>TurnUI.iniciarSurvival() },
            { txt:'Não hoje.', voltar:true }
          ]
        },
        regras:{
          fala:'Cada um dos três tem cinco golpes e uma passiva. A ordem do '+
               'turno sai da velocidade, e quem for bem mais rápido que a média '+
               'joga duas vezes na rodada. Quer saber de mais o quê?',
          opcoes:[
            { txt:'E os status? (veneno, sangue…)', ir:'status' },
            { txt:'E o terreno e o ambiente?', ir:'terreno' },
            { txt:'Entendi. Bora montar o time.', faz:()=>TurnUI.abrirMontagem() },
            { txt:'Entendi.', voltar:true }
          ]
        },
        status:{
          fala:'Queimadura, veneno e sangramento tiram vida no fim do turno — '+
               'o sangramento dói MAIS conforme o alvo vai ficando fraco. '+
               'Atordoado perde a vez, e confuso pode bater em qualquer um do campo.',
          opcoes:[ { txt:'Boa saber.', voltar:true } ]
        },
        terreno:{
          fala:'Terreno é do time e machuca o time inteiro no fim da rodada. '+
               'Ambiente é da ARENA: vale para os dois lados. Se a Loirinha '+
               'enche isso de pétala, eu curo mais — mas o inimigo também.',
          opcoes:[ { txt:'Anotado.', voltar:true } ]
        }
      }
    },
    {
      id:'portao', local:'PORTÃO DA ARENA', icone:'🌃', cenario:'arena',
      charId:'loirinha_cdi', cor:'#3bf0ff',
      tag:'🌐 ONLINE',
      raiz(){ return {
        fala:'Oi, meu bem! Daqui pra frente é gente de verdade do outro lado. '+
             'Me diz: você veio jogar por diversão ou por ponto?',
        opcoes:[
          { txt:'🏆 Ranqueada (vale rating)', ir:'ranked' },
          { txt:'🎲 Casual (só pelo prazer)', ir:'casual' },
          { txt:'📊 Ver o ranking', faz:()=>Menu.showLeaderboard() },
          { txt:'👁 Assistir ranqueadas ao vivo', faz:()=>Espectador.abrirLista() },
          { txt:'❓ Qual a diferença?', ir:'diferenca' },
          { txt:'Só passei pra dar oi.', fechar:true }
        ] };
      },
      nos:{
        ranked:{
          fala:'Ranqueada é com DRAFT ao vivo: vocês dois escolhem um personagem '+
               'por vez, alternando, e quem escolhe primeiro tira a opção do outro. '+
               'Ganhou sobe rating, perdeu desce. Coragem?',
          opcoes:[
            { txt:'Bora. Procura adversário.', faz:()=>Online.escolherModo('ranked') },
            { txt:'Peraí, ainda não.', voltar:true }
          ]
        },
        casual:{
          fala:'Casual é mais tranquilo: você monta seu time do jeito que quiser '+
               '(pode até repetir o que o outro escolheu) e o rating nem encosta. '+
               'Vamos?',
          opcoes:[
            { txt:'Vamos! Monta que eu procuro.', faz:()=>Online.escolherModo('casual') },
            { txt:'Deixa eu pensar.', voltar:true }
          ]
        },
        diferenca:{
          fala:'Casual: time montado antes, sem rating, entra e sai quando quiser. '+
               'Ranqueada: draft ao vivo, adversário de rating parecido e ponto em jogo. '+
               'Se a fila demorar, ela vai aceitando gente mais longe do seu rating.',
          opcoes:[ { txt:'Faz sentido.', voltar:true } ]
        }
      }
    },
    {
      /* MODO CONDENAÇÃO (js/condenacao.js): draft igual à ranqueada contra
         um BOT que estuda você. A rainha é a juíza — o bot é ela. */
      id:'tribunal', local:'TRIBUNAL DA RAINHA', icone:'⚖', cenario:'castelo',
      charId:'smergula', cor:'#c46bff',
      tag:'⚖ CONDENAÇÃO',
      raiz(){ return {
        fala:'Mais um réu. Aqui ninguém escolhe time em paz: eu BANO quem você mais usa, '+
             'escolho quem te vence e tiro de você o que te ajudaria. Draft e banimento, '+
             'igual à ranqueada — só que contra MIM. Sem pontos. Só a sentença.',
        opcoes:[
          { txt:'⚖ Quero ser julgado', faz:()=>Condenacao.abrir() },
          { txt:'📖 A história sob julgamento', ir:'campanha' },
          { txt:'🔎 O que você sabe de mim?', ir:'ficha' },
          { txt:'❓ Como funciona o julgamento?', ir:'regras' },
          { txt:'Hoje não, majestade.', fechar:true }
        ] };
      },
      nos:{
        /* CAMPANHA DA CONDENAÇÃO (js/historia.js): o modo história inteiro,
           só que com o bot dela do outro lado e ela narrando do trono. */
        campanha:{
          fala:'Eu guardo a sua história inteira, réu — Tel Aviv, o meu reino, cada luta. Quer reviver? '+
               'Pois reviva... com o MEU bot do julgamento jogando contra você. Sem draft, sem ban: os '+
               'times são os da história. E o seu progresso aqui é outro — começa do zero.',
          opcoes:[
            { txt:'⚖ Abrir a campanha da Condenação', faz:()=>Historia.abrirMapa('condenacao') },
            { txt:'Ainda não.', voltar:true }
          ]
        },
        ficha:{
          get fala(){ return (typeof Condenacao!=='undefined') ? Condenacao.resumoFicha() : '...'; },
          opcoes:[
            { txt:'⚖ Então me julga', faz:()=>Condenacao.abrir() },
            { txt:'Tá bom...', voltar:true }
          ]
        },
        regras:{
          fala:'Cada um BANE um personagem às cegas — eu bano o seu favorito, aquele com que você '+
               'mais joga e mais ganha. Depois escolhemos um por vez, sem repetir. Eu olho o seu time '+
               'e pego quem vence ele, quem combina com o meu, e quem seria bom PRA VOCÊ. E na luta eu '+
               'não erro alvo à toa. Toda luta 3x3 que você joga me ensina mais sobre você.',
          opcoes:[
            { txt:'⚖ Pode começar', faz:()=>Condenacao.abrir() },
            { txt:'Entendi.', voltar:true }
          ]
        }
      }
    },
    {
      id:'lab', local:'LABORATÓRIO 5000Z', icone:'🔬', cenario:'laboratorio',
      charId:'mecas', cor:'#ff3bd0',
      tag:'📖 ARQUIVO',
      raiz(){ return {
        fala:'REGISTRO ABERTO. Tenho a ficha de todo mundo do elenco, o '+
             'histórico de cada versão do jogo e até um LIVRO inteiro sobre '+
             'como tudo funciona. O que você quer consultar?',
        opcoes:[
          { txt:'📖 Catálogo de personagens', faz:()=>goto('catalogo') },
          { txt:'📜 Patch notes', faz:()=>goto('patchnotes') },
          /* livro.html é uma página PRÓPRIA (fora do app de telas do
             index.html, mesmo padrão de admin.html) — não dá pra abrir
             com goto(), então sai de vez mesmo, trocando a página. */
          { txt:'📘 Livro do jogo (manual completo)', faz:()=>{ location.href='livro.html'; } },
          { txt:'FECHAR REGISTRO.', fechar:true }
        ] };
      },
      nos:{}
    }
  ];

  function sorteioDeTime(){
    const pool=Characters.jogaveis().map(c=>c.id).sort(()=>Math.random()-0.5);
    return pool.slice(0,3);
  }

  /* ---------- estado ---------- */
  let idx=0, animId=null, t=0, ligado=false;
  let entrada=0, entradaDir=1;          // animação de "entrar em cena"
  let dial=null;                        // {pilha:[no], texto, revelado, sel}
  let cv=null, bg=null;

  const ponto = ()=>PONTOS[idx];
  const charAtual = ()=>Characters.byId(ponto().charId);

  /* ---------- abrir / fechar ---------- */
  function abrir(){
    cv = document.getElementById('hub-char');
    bg = document.getElementById('hub-bg');
    if(!cv || !bg) return;
    ligado=true;
    TurnBG.ligar(bg);
    TurnBG.usar(ponto().cenario);
    entrada=0; dial=null;
    render();
    if(!animId) laco();
    document.addEventListener('keydown', tecla);
    ligarToque();
  }

  /* ---------- ARRASTAR para andar pela vila (celular) ----------
     As setas continuam lá, mas arrastar é o gesto que a pessoa tenta
     primeiro numa tela cheia — e ela está segurando o telefone no
     meio, longe das bordas onde as setas ficam. */
  function ligarToque(){
    const cx=document.querySelector('.hub');
    if(!cx || cx._toqueLigado) return;
    cx._toqueLigado=true;
    let x0=0, y0=0, t0=0, seguindo=false;

    cx.addEventListener('touchstart', e=>{
      if(e.touches.length!==1 || dial) { seguindo=false; return; }
      x0=e.touches[0].clientX; y0=e.touches[0].clientY; t0=Date.now(); seguindo=true;
    }, {passive:true});

    cx.addEventListener('touchend', e=>{
      if(!seguindo) return; seguindo=false;
      const t=e.changedTouches[0];
      const dx=t.clientX-x0, dy=t.clientY-y0;
      if(Date.now()-t0 > 700) return;                       // arrastou devagar: não é gesto
      /* exige 48px na horizontal E que o movimento seja claramente mais
         horizontal que vertical — senão uma rolagem qualquer trocaria o
         ponto da vila sem querer. */
      if(Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)*1.4) return;
      mover(dx < 0 ? 1 : -1);
    }, {passive:true});
  }
  function fechar(){
    ligado=false;
    if(animId){ cancelAnimationFrame(animId); animId=null; }
    document.removeEventListener('keydown', tecla);
  }

  /* ---------- troca de ponto ---------- */
  function mover(d){
    if(dial) return;                       // conversando: seta é para escolher opção
    idx = (idx + d + PONTOS.length) % PONTOS.length;
    TurnBG.usar(ponto().cenario);
    entrada = 26; entradaDir = d>=0 ? 1 : -1;   // ele ENTRA andando pelo lado certo
    render();
  }

  /* ---------- diálogo ---------- */
  function falar(){
    if(dial){ avancar(); return; }
    const p=ponto();
    dial={ pilha:[p.raiz()], texto:'', revelado:0, sel:0, inicio:performance.now() };
    dial.texto = dial.pilha[0].fala;
    render();
  }
  function no(){ return dial.pilha[dial.pilha.length-1]; }

  function irPara(chave){
    const n=ponto().nos[chave];
    if(!n) return;
    dial.pilha.push(n); dial.texto=n.fala; dial.revelado=0; dial.sel=0; dial.inicio=performance.now();
    render();
  }
  function voltar(){
    if(dial.pilha.length>1) dial.pilha.pop();
    const n=no(); dial.texto=n.fala; dial.revelado=0; dial.sel=0; dial.inicio=performance.now();
    render();
  }
  function sair(){ dial=null; render(); }

  /* Enter/clique no meio do texto: primeiro COMPLETA a fala, só depois
     confirma a opção. Sem isso, quem aperta rápido escolhe sem ler. */
  function avancar(){
    if(dial.revelado < dial.texto.length){ dial.revelado = dial.texto.length; render(); return; }
    escolher(dial.sel);
  }

  function escolher(i){
    if(!dial) return;
    if(dial.revelado < dial.texto.length){ dial.revelado=dial.texto.length; dial.sel=i; render(); return; }
    const o=(no().opcoes||[])[i];
    if(!o) return;
    if(o.ir){ irPara(o.ir); return; }
    if(o.voltar){ voltar(); return; }
    if(o.fechar){ sair(); return; }
    if(o.faz){ const f=o.faz; dial=null; f(); }
  }

  function tecla(e){
    if(!ligado) return;
    const ativa=document.querySelector('.screen.active');
    if(!ativa || ativa.id!=='screen-menu') return;
    // e.code entra junto porque em teclado ABNT/AZERTY o `key` da barra
    // de espaço nem sempre chega como ' '
    const k=e.key, c=e.code;
    if(k==='ArrowRight'||c==='ArrowRight'){ if(dial) return; mover(1);  e.preventDefault(); return; }
    if(k==='ArrowLeft' ||c==='ArrowLeft'){  if(dial) return; mover(-1); e.preventDefault(); return; }
    if((k==='ArrowDown'||c==='ArrowDown') && dial){ dial.sel=(dial.sel+1)%(no().opcoes||[1]).length; render(); e.preventDefault(); return; }
    if((k==='ArrowUp'  ||c==='ArrowUp')   && dial){ const n=(no().opcoes||[1]).length; dial.sel=(dial.sel-1+n)%n; render(); e.preventDefault(); return; }
    if(k==='Enter'||k===' '||c==='Enter'||c==='Space'){ falar(); e.preventDefault(); return; }
    if((k==='Escape'||c==='Escape') && dial){ sair(); e.preventDefault(); }
  }

  /* ---------- desenho ---------- */
  function render(){
    const p=ponto();
    const set=(id,txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt; };
    set('hub-local', p.icone+' '+p.local);
    set('hub-tag', p.tag);
    const nome=document.getElementById('hub-nome');
    if(nome){ const c=charAtual();
      nome.innerHTML = `<b style="color:${p.cor}">${c?c.name:''}</b><i>${c?c.title:''}</i>`; }
    const pontos=document.getElementById('hub-pontos');
    if(pontos) pontos.innerHTML = PONTOS.map((x,i)=>
      `<span class="hub-dot${i===idx?' on':''}" style="${i===idx?'background:'+p.cor:''}"></span>`).join('');

    const cx=document.getElementById('hub-dialogo');
    if(!cx) return;
    const caixa=document.querySelector('.hub');
    const dica=document.getElementById('hub-dica');
    if(caixa) caixa.classList.toggle('conversa', !!dial);
    if(dica) dica.hidden=!!dial;
    if(!dial){
      cx.hidden=true;
      const cena=document.querySelector('.hub-cena');
      if(cena) cena.style.paddingBottom='';      // volta ao valor do CSS
      return;
    }
    cx.hidden=false;
    const c=charAtual();
    const n=no();
    cx.innerHTML =
      `<div class="hub-di-topo"><canvas id="hub-retrato" width="72" height="72"></canvas>`+
      `<span class="hub-di-nome" style="color:${p.cor}">${c?c.name:''}</span></div>`+
      `<div class="hub-di-txt" id="hub-di-txt"></div>`+
      `<div class="hub-di-opts">`+
        (n.opcoes||[]).map((o,i)=>
          `<button class="hub-opt${i===dial.sel?' sel':''}" data-i="${i}">${o.txt}</button>`).join('')+
      `</div>`;
    // clicar no texto corrido completa a fala (não confirma nada)
    const txt=cx.querySelector('.hub-di-txt');
    if(txt) txt.onclick=()=>{ if(dial && dial.revelado<dial.texto.length){ dial.revelado=dial.texto.length; pintarTexto(); } };
    cx.querySelectorAll('.hub-opt').forEach(b=>{
      b.onclick=()=>escolher(+b.dataset.i);
      b.onmouseenter=()=>{ dial.sel=+b.dataset.i;
        cx.querySelectorAll('.hub-opt').forEach(x=>x.classList.toggle('sel', x===b)); };
    });
    pintarTexto();
    /* a caixa cresce com o número de opções (o Dojo tem 4, o Portão tem
       5): em vez de chutar um valor no CSS, o personagem sobe exatamente
       a altura que a caixa ocupou. Assim ninguém fica escondido atrás
       dela em nenhum ponto da vila. */
    requestAnimationFrame(()=>{
      const cena=document.querySelector('.hub-cena');
      if(cena && dial) cena.style.paddingBottom = (cx.offsetHeight + 52)+'px';
    });
  }

  function pintarTexto(){
    const el=document.getElementById('hub-di-txt');
    if(el && dial) el.textContent = dial.texto.slice(0, dial.revelado);
  }

  function laco(){
    animId=requestAnimationFrame(laco);
    if(!ligado) return;
    const ativa=document.querySelector('.screen.active');
    if(!ativa || ativa.id!=='screen-menu') return;     // menu escondido: não gasta quadro
    t++;

    TurnBG.passo(null, null);

    /* máquina de escrever por TEMPO, não por quadro: se a aba perde o
       foco (ou a máquina engasga) o requestAnimationFrame cai para
       pouquíssimos quadros por segundo e o texto levaria um minuto para
       aparecer. Por tempo, ele sempre sai a ~80 letras por segundo. */
    if(dial && dial.revelado < dial.texto.length){
      const alvo=Math.floor((performance.now()-dial.inicio)/12);
      const novo=Math.max(dial.revelado, Math.min(dial.texto.length, alvo));
      if(novo!==dial.revelado){ dial.revelado=novo; pintarTexto(); }
    }

    // o personagem
    const c=charAtual();
    if(c && cv){
      let dx=0, pose='idle';
      if(entrada>0){
        entrada--;
        dx = entradaDir * entrada * 7;      // vem andando de fora da tela
        pose = 'walk';
      } else if(dial){
        /* falando: uma balançadinha no lugar, para ele não parecer um
           poster colado na tela enquanto o texto corre. */
        dx = Math.sin(t*0.12)*2;
      }
      const respira = entrada>0 ? 0 : Math.sin(t*0.06)*2;
      Sprites.renderPose(cv, c, {
        pose, t, dir: entrada>0 ? (entradaDir>0?-1:1) : 1,
        targetH: cv.height-40, dx, dy: respira
      });
    }
  }

  return { abrir, fechar, falar, mover, PONTOS };
})();
