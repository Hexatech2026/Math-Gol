// firebase-config.js — inicializa o Firebase no navegador e expõe funções
// para criar sessão anônima e salvar/ler progresso diretamente no Firestore.
// Sem dado pessoal: o "jogador" é identificado por um token opaco (UUID)
// gerado no próprio browser e salvo em localStorage.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuXs5SDtMxjnIFxk_2NFE0pJhoF3D5agE",
  authDomain: "math-gol.firebaseapp.com",
  projectId: "math-gol",
  storageBucket: "math-gol.firebasestorage.app",
  messagingSenderId: "679250124585",
  appId: "1:679250124585:web:d394982f5ea1931def2138"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- Geração de token ----------

function gerarToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback pra navegadores que não têm randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ---------- Sessão ----------

async function obterOuCriarToken() {
  let token = null;
  try { token = localStorage.getItem('mathgol_token'); } catch (e) {}
  if (token) return token;

  token = gerarToken();

  try {
    await setDoc(doc(db, 'jogadores', token), {
      criadoEm: serverTimestamp(),
      ultimoAcessoEm: serverTimestamp()
    });
  } catch (erro) {
    console.warn('Firebase indisponível ao criar sessão; jogo segue offline:', erro);
  }

  try { localStorage.setItem('mathgol_token', token); } catch (e) {}
  return token;
}

// ---------- Perfil (apelido + avatar escolhidos na tela de personalizar) ----------

// Salva o apelido e o avatar escolhidos em DOIS lugares:
//   1. jogadores/{token}        → atalho, junto com o resto da conta do jogador
//   2. apelidos/{token}         → coleção própria, só com apelido + avatar
//      (pensada pra uma futura tela de "quem já jogou" ou moderação de apelidos,
//      sem precisar ler o documento inteiro do jogador)
async function salvarPerfil(token, dados) {
  if (!token) return;

  const perfil = {
    apelido: dados.apelido,
    avatarEstilo: dados.avatarEstilo,
    avatarSeed: dados.avatarSeed,
    atualizadoEm: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'jogadores', token), {
      ...perfil,
      ultimoAcessoEm: serverTimestamp()
    }, { merge: true });

    await setDoc(doc(db, 'apelidos', token), perfil, { merge: true });
  } catch (erro) {
    console.warn('Perfil salvo só localmente (Firebase indisponível):', erro);
  }
}

// ---------- Progresso ----------

async function salvarProgresso(token, dados) {
  if (!token) return;

  try {
    const resultado = {
      apelido: dados.apelido,
      selecaoId: dados.selecaoId,
      dificuldadeId: dados.dificuldadeId,
      gols: dados.gols,
      criadoEm: serverTimestamp()
    };

    // Salva no histórico (subcoleção) e atualiza o atalho no documento do jogador
    const jogadorRef = doc(db, 'jogadores', token);
    await addDoc(collection(jogadorRef, 'resultados'), resultado);
    await setDoc(jogadorRef, {
      ultimoAcessoEm: serverTimestamp(),
      ultimoResultado: {
        apelido: dados.apelido,
        selecaoId: dados.selecaoId,
        dificuldadeId: dados.dificuldadeId,
        gols: dados.gols,
        criadoEm: new Date().toISOString()
      }
    }, { merge: true });
  } catch (erro) {
    console.warn('Progresso salvo só localmente (Firebase indisponível):', erro);
  }
}

async function buscarProgresso(token) {
  if (!token) return null;

  try {
    const snap = await getDoc(doc(db, 'jogadores', token));
    if (!snap.exists()) return null;
    return snap.data().ultimoResultado || null;
  } catch (erro) {
    console.warn('Não foi possível buscar progresso do Firebase:', erro);
    return null;
  }
}

// Exporta pro escopo global pra ser usado pelo main.js (que não é módulo ES)
window.FirebaseMathGol = {
  obterOuCriarToken,
  salvarPerfil,
  salvarProgresso,
  buscarProgresso
};
