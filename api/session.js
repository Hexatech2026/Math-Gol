// api/session.js — POST /api/session
// Cria um "jogador" anônimo no Firestore e devolve um token opaco pro
// front-end guardar (localStorage) e reusar nas chamadas de /api/progress.
// Nenhum dado pessoal é solicitado ou aceito aqui — só a criação do registro.

const { getFirestore } = require('./_lib/firebaseAdmin');
const { gerarToken } = require('./_lib/token');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido. Use POST.' });
  }

  try {
    const db = getFirestore();
    const token = gerarToken();
    const agora = new Date();

    await db.collection('jogadores').doc(token).set({
      criadoEm: agora,
      ultimoAcessoEm: agora,
    });

    return res.status(201).json({ token });
  } catch (erro) {
    console.error('[session] erro ao criar sessão:', erro);
    return res.status(500).json({ erro: 'Não foi possível criar a sessão agora. Tente novamente.' });
  }
};
