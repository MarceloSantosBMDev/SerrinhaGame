/* ============================================================
   CONFIG DO FIREBASE  ←←← COLE A SUA CONFIG AQUI

   Onde achar:
     Console do Firebase → ⚙ Configurações do projeto
     → role até "Seus apps" → app da Web (</>)
     → "Configuração do SDK" → copie o objeto firebaseConfig

   Se ainda não existir um app da Web, clique em "Adicionar app" (</>),
   dê um apelido (ex.: "arena-web") e copie o que aparecer.

   É seguro deixar essa config no código: ela identifica o projeto,
   não é senha. Quem protege os dados são as REGRAS (firestore.rules).
   ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA5Tdn3ldOISm5L4Wxt0elC0tvsa65iZK4",
  authDomain:        "serrinha-1-game.firebaseapp.com",
  projectId:         "serrinha-1-game",
  storageBucket:     "serrinha-1-game.firebasestorage.app",
  messagingSenderId: "30818334846",
  appId:             "1:30818334846:web:5b60b18a6a5675ddc0402f",
  // Realtime Database (partidas online). Declarada explicitamente para o
  // SDK conectar direto, sem precisar descobrir a URL primeiro.
  databaseURL:       "https://serrinha-1-game-default-rtdb.firebaseio.com"
};

/* Enquanto o apiKey/appId estiverem como "COLE_AQUI", o jogo roda
   normalmente com perfil LOCAL (sem nuvem). Assim que você colar os
   valores reais, o login vira Firebase e a ranqueada sobe pro banco. */
window.FIREBASE_READY = Object.values(window.FIREBASE_CONFIG)
  .every(v => v && String(v).indexOf('COLE_AQUI') === -1);
