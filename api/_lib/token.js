// _lib/token.js — gera o token opaco que identifica o jogador anônimo.
// É só um identificador aleatório: não carrega nome, e-mail ou qualquer
// outro dado pessoal, por isso pode transitar e ser salvo com tranquilidade.

const crypto = require('crypto');

function gerarToken() {
  return crypto.randomUUID();
}

module.exports = { gerarToken };
