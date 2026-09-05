// teste-local.js — NÃO faz parte do deploy. Simula um Firestore em memória
// (via mock do módulo _lib/firebaseAdmin) só pra validar a lógica de
// validação e as respostas HTTP dos endpoints, sem precisar de credenciais
// reais do Firebase.

const assert = require('assert');
const path = require('path');
const Module = require('module');

// ---------- Firestore falso, só o suficiente pro que session.js/progress.js usam ----------
const bancoFalso = new Map(); // token -> { ...dados, resultados: [] }

function criarDocRef(token) {
  return {
    async set(dados, opcoes) {
      const atual = bancoFalso.get(token) || { resultados: [] };
      const mesclado = opcoes && opcoes.merge ? { ...atual, ...dados } : { ...dados, resultados: atual.resultados };
      bancoFalso.set(token, mesclado);
    },
    async get() {
      const dados = bancoFalso.get(token);
      return { exists: !!dados, data: () => dados };
    },
    collection(nome) {
      assert.strictEqual(nome, 'resultados');
      return {
        async add(resultado) {
          const atual = bancoFalso.get(token) || { resultados: [] };
          atual.resultados.push(resultado);
          bancoFalso.set(token, atual);
          return { id: 'resultado-fake-' + atual.resultados.length };
        },
      };
    },
  };
}

const firestoreFalso = {
  collection(nome) {
    assert.strictEqual(nome, 'jogadores');
    return { doc: (token) => criarDocRef(token) };
  },
};

// ---------- injeta o mock no lugar de ./_lib/firebaseAdmin ----------
const caminhoReal = path.join(__dirname, '..', 'api', '_lib', 'firebaseAdmin.js');
require.cache[caminhoReal] = {
  id: caminhoReal,
  filename: caminhoReal,
  loaded: true,
  exports: { getFirestore: () => firestoreFalso },
};

const sessionHandler = require('../api/session.js');
const progressHandler = require('../api/progress.js');

// ---------- helper pra simular req/res do Vercel ----------
function criarRes() {
  const res = {
    _status: null,
    _json: null,
    statusCode: 200,
    status(codigo) { this._status = codigo; return this; },
    json(corpo) { this._json = corpo; return this; },
    setHeader() {},
  };
  return res;
}

async function rodarTestes() {
  console.log('== POST /api/session ==');
  const resSession = criarRes();
  await sessionHandler({ method: 'POST' }, resSession);
  console.log('status:', resSession._status, 'corpo:', resSession._json);
  assert.strictEqual(resSession._status, 201);
  assert.ok(resSession._json.token, 'deveria devolver um token');
  const token = resSession._json.token;

  console.log('\n== GET /api/session com método errado ==');
  const resSessionErrada = criarRes();
  await sessionHandler({ method: 'GET' }, resSessionErrada);
  console.log('status:', resSessionErrada._status, 'corpo:', resSessionErrada._json);
  assert.strictEqual(resSessionErrada._status, 405);

  console.log('\n== POST /api/progress com token inexistente ==');
  const resTokenFalso = criarRes();
  await progressHandler({ method: 'POST', body: { token: 'token-que-nao-existe', apelido: 'Fera Tigre', selecaoId: 'brasil', dificuldadeId: 'facil', gols: 2 } }, resTokenFalso);
  console.log('status:', resTokenFalso._status, 'corpo:', resTokenFalso._json);
  assert.strictEqual(resTokenFalso._status, 404);

  console.log('\n== POST /api/progress com seleção inválida ==');
  const resSelecaoInvalida = criarRes();
  await progressHandler({ method: 'POST', body: { token, apelido: 'Fera Tigre', selecaoId: 'atlantida', dificuldadeId: 'facil', gols: 2 } }, resSelecaoInvalida);
  console.log('status:', resSelecaoInvalida._status, 'corpo:', resSelecaoInvalida._json);
  assert.strictEqual(resSelecaoInvalida._status, 400);

  console.log('\n== POST /api/progress com gols fora do intervalo ==');
  const resGolsInvalidos = criarRes();
  await progressHandler({ method: 'POST', body: { token, apelido: 'Fera Tigre', selecaoId: 'brasil', dificuldadeId: 'facil', gols: 99 } }, resGolsInvalidos);
  console.log('status:', resGolsInvalidos._status, 'corpo:', resGolsInvalidos._json);
  assert.strictEqual(resGolsInvalidos._status, 400);

  console.log('\n== POST /api/progress válido ==');
  const resProgressoValido = criarRes();
  await progressHandler({ method: 'POST', body: { token, apelido: 'Fera Tigre', selecaoId: 'brasil', dificuldadeId: 'facil', gols: 3 } }, resProgressoValido);
  console.log('status:', resProgressoValido._status, 'corpo:', resProgressoValido._json);
  assert.strictEqual(resProgressoValido._status, 201);
  assert.ok(resProgressoValido._json.resultadoId);

  console.log('\n== GET /api/progress ==');
  const resGet = criarRes();
  await progressHandler({ method: 'GET', query: { token } }, resGet);
  console.log('status:', resGet._status, 'corpo:', JSON.stringify(resGet._json));
  assert.strictEqual(resGet._status, 200);
  assert.strictEqual(resGet._json.ultimoResultado.gols, 3);
  assert.strictEqual(resGet._json.ultimoResultado.selecaoId, 'brasil');

  console.log('\n== GET /api/progress com token ausente ==');
  const resGetSemToken = criarRes();
  await progressHandler({ method: 'GET', query: {} }, resGetSemToken);
  console.log('status:', resGetSemToken._status, 'corpo:', resGetSemToken._json);
  assert.strictEqual(resGetSemToken._status, 400);

  console.log('\n✅ Todos os testes passaram.');
}

rodarTestes().catch((erro) => {
  console.error('\n❌ Teste falhou:', erro);
  process.exit(1);
});
