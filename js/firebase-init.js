/* ============================================================
   LIGAÇÃO COM O FIREBASE (módulo ES)
   - Só roda se js/firebase-config.js estiver preenchido.
   - Conecta o Auth (e-mail/senha) e o Firestore (ranqueada).
   - Se algo falhar, o jogo continua no modo local sem quebrar.
   ============================================================ */
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

async function boot(){
  if(!window.FIREBASE_READY){
    console.info('[Arena] Firebase não configurado — usando perfil local. '+
                 'Cole a config em js/firebase-config.js para ativar a nuvem.');
    Auth.initFirebase(null);   // libera signUp/signIn (senão ficam presos até o timeout de segurança)
    window.dispatchEvent(new CustomEvent('arena-backend', {detail:{cloud:false}}));
    return;
  }
  try{
    const [{ initializeApp }, authMod, fsMod, rtMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
      import(`${SDK}/firebase-database.js`)
    ]);

    const app  = initializeApp(window.FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db   = fsMod.getFirestore(app);

    /* ---------------- AUTH ---------------- */
    function toUser(u){
      if(!u) return null;
      return { uid:u.uid, email:u.email, nick:u.displayName || (u.email||'').split('@')[0] || 'Lutador', provider:'firebase' };
    }
    function traduzErro(e){
      const c=(e && e.code)||'';
      if(c.includes('email-already-in-use')) return 'Já existe uma conta com esse e-mail.';
      if(c.includes('invalid-email'))        return 'E-mail inválido.';
      if(c.includes('weak-password'))        return 'Senha fraca: use 6+ caracteres.';
      if(c.includes('user-not-found'))       return 'Não achei uma conta com esse e-mail.';
      if(c.includes('wrong-password') || c.includes('invalid-credential')) return 'E-mail ou senha incorretos.';
      if(c.includes('too-many-requests'))    return 'Muitas tentativas. Tente de novo em instantes.';
      if(c.includes('network'))              return 'Sem conexão com o servidor.';
      if(c.includes('operation-not-allowed'))return 'Ative "E-mail/senha" em Authentication → Sign-in method.';
      return (e && e.message) || 'Não deu para completar agora.';
    }

    Auth.initFirebase({
      async signUp(email, pass, nick){
        try{
          const cred = await authMod.createUserWithEmailAndPassword(auth, email, pass);
          const apelido = (nick||'').trim() || (email||'').split('@')[0] || 'Lutador';
          if(nick) await authMod.updateProfile(cred.user, { displayName: apelido });
          // updateProfile às vezes não reflete no objeto cred.user na hora
          // (o SDK só garante isso depois de um reload) — usamos o apelido
          // que ACABAMOS de definir em vez de reler um campo que pode
          // ainda estar vazio. Sem isso, o nick "vazava" pro prefixo do
          // e-mail e passava a mudar o rating/ranking do jogador errado.
          return { uid:cred.user.uid, email:cred.user.email, nick:apelido, provider:'firebase' };
        }catch(e){ throw new Error(traduzErro(e)); }
      },
      async signIn(email, pass){
        try{
          const cred = await authMod.signInWithEmailAndPassword(auth, email, pass);
          return toUser(cred.user);
        }catch(e){ throw new Error(traduzErro(e)); }
      },
      async signOut(){ await authMod.signOut(auth); },
      onChange(cb){ authMod.onAuthStateChanged(auth, u=>cb(toUser(u))); }
    });

    /* ---------------- FIRESTORE (ranqueada) ---------------- */
    const { doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, limit, getDocs } = fsMod;

    Ranked.setBackend({
      async getPlayer(uid){
        const snap = await getDoc(doc(db,'players',uid));
        return snap.exists()? snap.data() : null;
      },
      async savePlayer(uid, p){
        await setDoc(doc(db,'players',uid), p, { merge:true });
        return p;
      },
      async addMatch(m){
        await addDoc(collection(db,'matches'), m);
      },
      /* histórico de UM jogador, pro perfil (personagem favorito). Sem
         `orderBy` de propósito: combinar `where` de igualdade com
         `orderBy` num campo DIFERENTE pede um índice composto que
         precisaria ser criado à mão no console — um filtro só (`uid`)
         não precisa de índice nenhum. */
      async matchesOf(uid, n){
        const q = query(collection(db,'matches'), where('uid','==',uid), limit(n||200));
        const snap = await getDocs(q);
        return snap.docs.map(d=>d.data());
      },
      async top(n){
        const q = query(collection(db,'players'), orderBy('rating','desc'), limit(n||20));
        const snap = await getDocs(q);
        return snap.docs.map(d=>d.data());
      }
    });

    /* ---------------- REALTIME DATABASE (partidas online) ----------------
       O online usa RTDB (não Firestore): luta manda muitas mensagens
       pequenas por segundo — no Firestore ficaria caro e mais lento. */
    let online=false;
    try{
      const rtdb = rtMod.getDatabase(app);
      Net.setTransport(Net.makeRtdbTransport(rtdb, rtMod));
      online=true;
    }catch(e){
      console.warn('[Arena] Realtime Database indisponível — online segue em modo local. '+
                   'Crie o Realtime Database no console e adicione "databaseURL" na config.', e);
    }

    console.info('[Arena] Firebase conectado ✓ (projeto '+window.FIREBASE_CONFIG.projectId+
                 ') · online: '+(online?'RTDB':'local'));
    window.dispatchEvent(new CustomEvent('arena-backend', {detail:{cloud:true, online}}));

  }catch(err){
    console.warn('[Arena] Falhou ao conectar no Firebase — seguindo em modo local.', err);
    Auth.initFirebase(null);   // idem: libera o cadastro/login local sem esperar o timeout
    window.dispatchEvent(new CustomEvent('arena-backend', {detail:{cloud:false, erro:String(err&&err.message||err)}}));
  }
}

boot();
