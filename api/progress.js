// api/progress.js — GET/POST /api/progress
// POST: salva o resultado de uma Fase 1 (apelido, seleção, dificuldade, gols)
// GET:  devolve o último resultado salvo pra um token
//
// Validação: mesmo o jogo já restringindo essas escolhas a listas fixas no
// front-end (public/js/data.js), o back-end nunca confia cegamente no que
// chega do cliente — por isso os ids são revalidados aqui contra as mesmas
// listas permitidas.

const { getFirestore } = require('./_lib/firebaseAdmin');

// Precisam ficar em sincronia com as listas de public/js/data.js.
const SELECAO_IDS = ['brasil', 'argentina', 'alemanha', 'franca', 'japao', 'portugal'];
const DIFICULDADE_IDS = ['facil', 'medio', 'dificil'];
const TOTAL_COBRANCAS = 3;

module.exports = async function handler(req, res) {
  let db;
  try {
    db = getFirestore();
  } catch (erro) {
    console.error('[progress] erro ao conectar no Firestore:', erro);
    return res.status(500).json({ erro: 'Back-end indisponível no momento.' });
  }

  if (req.method === 'POST') {
    try {
      const { token, apelido, selecaoId, dificuldadeId, gols } = req.body || {};

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ erro: 'Token ausente ou inválido.' });
      }
      if (typeof apelido !== 'string' || apelido.trim().length === 0 || apelido.length > 40) {
        return res.status(400).json({ erro: 'Apelido inválido.' });
      }
      if (!SELECAO_IDS.includes(selecaoId)) {
        return res.status(400).json({ erro: 'Seleção inválida.' });
      }
      if (!DIFICULDADE_IDS.includes(dificuldadeId)) {
        return res.status(400).json({ erro: 'Dificuldade inválida.' });
      }
      const golsNumero = Number(gols);
      if (!Number.isInteger(golsNumero) || golsNumero < 0 || golsNumero > TOTAL_COBRANCAS) {
        return res.status(400).json({ erro: 'Placar de gols inválido.' });
      }

      const jogadorRef = db.collection('jogadores').doc(token);
      const jogadorSnap = await jogadorRef.get();
      if (!jogadorSnap.exists) {
        return res.status(404).json({ erro: 'Sessão não encontrada. Crie uma nova sessão em /api/session.' });
      }

      const agora = new Date();
      const resultado = {
        apelido: apelido.trim(),
        selecaoId,
        dificuldadeId,
        gols: golsNumero,
        criadoEm: agora,
      };

      // Guarda o histórico completo (base pra um futuro "histórico de
      // partidas") e também um atalho no próprio documento do jogador
      // pra leitura rápida do último resultado.
      const resultadoRef = await jogadorRef.collection('resultados').add(resultado);
      await jogadorRef.set({ ultimoAcessoEm: agora, ultimoResultado: resultado }, { merge: true });

      return res.status(201).json({ ok: true, resultadoId: resultadoRef.id });
    } catch (erro) {
      console.error('[progress] erro ao salvar progresso:', erro);
      return res.status(500).json({ erro: 'Não foi possível salvar o progresso agora.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const token = req.query && req.query.token;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ erro: 'Token ausente ou inválido.' });
      }

      const jogadorSnap = await db.collection('jogadores').doc(token).get();
      if (!jogadorSnap.exists) {
        return res.status(404).json({ erro: 'Sessão não encontrada.' });
      }

      const dados = jogadorSnap.data();
      return res.status(200).json({ ultimoResultado: dados.ultimoResultado || null });
    } catch (erro) {
      console.error('[progress] erro ao buscar progresso:', erro);
      return res.status(500).json({ erro: 'Não foi possível buscar o progresso agora.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ erro: 'Método não permitido. Use GET ou POST.' });
};
