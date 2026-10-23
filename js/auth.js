/* ============================================================
   AUTENTICAÇÃO
   ------------------------------------------------------------
   Hoje: PERFIL LOCAL (salvo só neste navegador).
   Amanhã: é só chamar Auth.initFirebase(config) que as mesmas
   funções passam a usar o Firebase Auth — a interface não muda.

   ⚠️ IMPORTANTE: enquanto for local, isto NÃO é autenticação
   segura. A senha nunca é salva em texto puro (guardamos só um
   hash SHA-256), mas qualquer pessoa com acesso a este navegador
   pode ler os dados. Contas de verdade só com o Firebase ligado.
   ============================================================ */
const Auth = (function(){

  const KEY_USERS='arena_users_v1';
  const KEY_SESSION='arena_session_v1';

  let current=null;          // {uid, email, nick, provider}
  let firebase=null;         // preenchido por initFirebase()
  const listeners=[];

  /* ---------- espera o Firebase terminar de conectar ----------
     Os módulos do SDK são carregados por rede (import dinâmico em
     firebase-init.js) e podem levar um instante. Sem isto, um
     cadastro feito bem na hora em que a página abre corria o risco
     de cair no modo LOCAL de emergência mesmo com o Firebase
     disponível — a conta ficava presa só no navegador, sem existir
     de verdade no servidor, e o online dava "permission_denied"
     depois (porque não existe sessão real do Firebase Auth).      */
  let resolveReady;
  const readyPromise = new Promise(r=>{ resolveReady=r; });
  let decidido=false;
  function marcarPronto(){ if(!decidido){ decidido=true; resolveReady(); } }
  // rede de segurança: se em 8s nada chamar initFirebase (sem config,
  // SDK bloqueado, etc.), libera o modo local para não travar o jogo
  setTimeout(marcarPronto, 8000);
  function whenReady(){ return readyPromise; }

  /* ---------- utilidades ---------- */
  async function hash(txt){
    try{
      if(window.crypto && crypto.subtle && window.isSecureContext){
        const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode('arena::'+txt));
        return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      }
    }catch(e){}
    // fallback simples (só para ambientes sem crypto.subtle)
    let h=0; const s='arena::'+txt;
    for(let i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; }
    return 'fb'+(h>>>0).toString(16);
  }
  function readUsers(){ try{ return JSON.parse(localStorage.getItem(KEY_USERS)||'{}'); }catch(e){ return {}; } }
  function writeUsers(u){ localStorage.setItem(KEY_USERS, JSON.stringify(u)); }
  function emit(){ listeners.forEach(fn=>{ try{ fn(current); }catch(e){} }); }

  function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e||'').trim()); }

  /* ---------- API pública ---------- */
  function onChange(fn){ listeners.push(fn); fn(current); }
  function user(){ return current; }
  function isLogged(){ return !!current; }

  async function signUp(email, pass, nick){
    email=(email||'').trim().toLowerCase();
    nick=(nick||'').trim() || email.split('@')[0];
    if(!validEmail(email)) throw new Error('E-mail inválido.');
    if((pass||'').length<6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
    if(nick.length<2) throw new Error('Escolha um apelido com 2+ letras.');

    await whenReady();   // evita criar conta LOCAL por engano enquanto o Firebase ainda está conectando
    if(firebase){
      const u = await firebase.signUp(email, pass, nick);
      // não espera só o onAuthStateChanged: ele dispara ANTES do apelido
      // ser gravado no perfil e nunca mais atualiza depois — sem isto,
      // Auth.user() ficava preso no prefixo do e-mail como apelido.
      current = u; emit();
      return u;
    }

    const users=readUsers();
    if(users[email]) throw new Error('Já existe uma conta com esse e-mail.');
    users[email]={ uid:'local_'+Date.now().toString(36), email, nick, pass:await hash(pass), created:Date.now() };
    writeUsers(users);
    current={ uid:users[email].uid, email, nick, provider:'local' };
    localStorage.setItem(KEY_SESSION, JSON.stringify(current));
    emit(); return current;
  }

  async function signIn(email, pass){
    email=(email||'').trim().toLowerCase();
    if(!validEmail(email)) throw new Error('E-mail inválido.');
    if(!pass) throw new Error('Digite a senha.');

    await whenReady();   // mesma proteção do signUp
    if(firebase){
      const u = await firebase.signIn(email, pass);
      current = u; emit();
      return u;
    }

    const users=readUsers(), u=users[email];
    if(!u) throw new Error('Não achei uma conta com esse e-mail.');
    if(u.pass !== await hash(pass)) throw new Error('Senha incorreta.');
    current={ uid:u.uid, email:u.email, nick:u.nick, provider:'local' };
    localStorage.setItem(KEY_SESSION, JSON.stringify(current));
    emit(); return current;
  }

  async function signOut(){
    if(firebase){ await firebase.signOut(); }
    current=null; localStorage.removeItem(KEY_SESSION); emit();
  }

  function playAsGuest(){
    current={ uid:'guest', email:null, nick:'Convidado', provider:'guest' };
    emit(); return current;
  }

  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem(KEY_SESSION)||'null');
      if(s && s.uid){ current=s; }
    }catch(e){}
    emit();
  }

  /* ---------- ponto de entrada do Firebase (futuro) ----------
     Quando você me passar a config, é só implementar aqui usando
     firebase/auth (createUserWithEmailAndPassword, signInWithEmailAndPassword,
     onAuthStateChanged) e setar `firebase = {signUp, signIn, signOut}`.  */
  function initFirebase(impl){
    firebase=impl||null;
    if(firebase && firebase.onChange){
      firebase.onChange(u=>{
        // só deixa o listener de fundo sobrescrever quando NINGUÉM está
        // logado ainda (evita a corrida do apelido: onAuthStateChanged
        // dispara antes do updateProfile terminar de gravar o nick).
        if(!current || u===null) { current=u; emit(); }
      });
    }
    marcarPronto();      // liberou signUp/signIn: já sabemos se tem nuvem ou não
    return !!firebase;
  }

  return { onChange, user, isLogged, signUp, signIn, signOut, playAsGuest, restore, initFirebase, validEmail, whenReady };
})();
