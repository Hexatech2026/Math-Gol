// _lib/firebaseAdmin.js — inicializa o Firebase Admin SDK uma única vez por
// instância de função serverless (evita reinicializar em cada invocação
// "quente" da mesma lambda). Só o back-end tem acesso a este módulo: o
// front-end nunca fala diretamente com o Firestore.

const admin = require('firebase-admin');

function getFirestore() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // No painel da Vercel (e em .env), quebras de linha da chave privada
    // costumam vir escapadas como "\n" literal — precisamos convertê-las
    // de volta para quebras de linha reais antes de passar pro SDK.
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Variáveis de ambiente do Firebase ausentes (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  return admin.firestore();
}

module.exports = { getFirestore };
