// data.js — listas usadas para gerar o apelido genérico, as seleções
// disponíveis e os níveis de dificuldade. Nenhum campo de texto livre
// obrigatório existe no app: por padrão o "apelido" é sempre uma combinação
// de um item de PERSONAGENS com um item de ANIMAIS (a criança também pode
// digitar o próprio apelido na tela de personalizar).
//
// Essas listas moraram só aqui antes; agora cada uma pode, opcionalmente,
// vir do Firestore — uma coleção por lista (personagens, animais, selecoes,
// dificuldades — ver seed-firestore.js e firebase-config.js), pra
// não misturar tudo numa coleção só. As constantes abaixo continuam
// existindo como PADRÃO/fallback: se o Firestore estiver vazio, offline ou
// as regras ainda não tiverem sido publicadas, o jogo funciona igual, só
// que com essas listas fixas.

let PERSONAGENS = [
  // Neutros / masculinos
  'Capitão', 'Fera', 'Relâmpago', 'Craque', 'Foguete',
  'Furacão', 'Campeão', 'Guerreiro', 'Fenômeno', 'Trovão',
  'Meteoro', 'Torpedo', 'Escudo', 'Cometa', 'Raio',
  // Femininos
  'Capitã', 'Estrela', 'Campeã', 'Guerreira', 'Fênix',
  'Centelha', 'Valente', 'Coragem', 'Vitória', 'Aurora',
  'Heroína', 'Lenda', 'Chama', 'Brilho', 'Medalha'
];

let ANIMAIS = [
  'Tigre', 'Águia', 'Onça', 'Leão', 'Gavião',
  'Puma', 'Lobo', 'Falcão', 'Pantera', 'Tubarão',
  'Golfinho', 'Coruja', 'Raposa', 'Jaguar', 'Fênix',
  'Coelho', 'Lince', 'Arara', 'Borboleta', 'Flamingo'
];

let SELECOES = [
  { id: 'brasil',    nome: 'Brasil',    corPrimaria: '#2E9E5B', corSecundaria: '#FFC63B' },
  { id: 'argentina', nome: 'Argentina', corPrimaria: '#6EC1E4', corSecundaria: '#FFFDF6' },
  { id: 'alemanha',  nome: 'Alemanha',  corPrimaria: '#21303B', corSecundaria: '#E0343B' },
  { id: 'franca',    nome: 'França',    corPrimaria: '#3A5FCD', corSecundaria: '#E0343B' },
  { id: 'japao',     nome: 'Japão',     corPrimaria: '#FFFDF6', corSecundaria: '#E0343B' },
  { id: 'portugal',  nome: 'Portugal',  corPrimaria: '#2E9E5B', corSecundaria: '#E0343B' }
];

let DIFICULDADES = [
  { id: 'facil',    nome: 'Fácil',    descricao: '+ e − até 10', icone: '⭐' },
  { id: 'medio',    nome: 'Médio',    descricao: '+ − até 20 e tabuada', icone: '⭐⭐' },
  { id: 'dificil',  nome: 'Difícil',  descricao: '× e ÷', icone: '⭐⭐⭐' }
];

// Aplica listas vindas do Firestore por cima dos valores padrão acima.
// Cada chave é opcional — só sobrescreve a lista que veio com conteúdo.
// Chamado pelo main.js depois de firebase-config.js:carregarConfiguracoes().
function aplicarConfiguracoesRemotas(config) {
  if (!config) return;
  if (Array.isArray(config.personagens) && config.personagens.length) PERSONAGENS = config.personagens;
  if (Array.isArray(config.animais) && config.animais.length) ANIMAIS = config.animais;
  if (Array.isArray(config.selecoes) && config.selecoes.length) SELECOES = config.selecoes;
  if (Array.isArray(config.dificuldades) && config.dificuldades.length) DIFICULDADES = config.dificuldades;
}

// Mensagens de resultado — sorteadas aleatoriamente por faixa de gols,
// sempre motivacionais e nunca punitivas.
const MENSAGENS_RESULTADO = {
  0: [
    'Valeu por jogar! Bora treinar mais e voltar pra fazer gol! 🙂',
    'Hoje o goleiro tava inspirado! Tenta de novo, você consegue! 💪',
    'Não desiste! Cada tentativa te deixa mais craque! ⚽',
    'O importante é tentar! Vamos de novo? 🔥'
  ],
  1: [
    'Bom começo! Você já fez um gol, bora buscar mais! 💪',
    'Um gol é só o aquecimento! Tenta de novo pra fazer mais! ⚽',
    'Já tá no caminho certo! Mais uma rodada e você arrebenta! 🌟',
    'Boa! Um gol já é vitória! Quer tentar fazer dois agora? 🎯'
  ],
  2: [
    'Quase perfeito! Faltou só um golzinho! Tenta de novo! ⭐',
    'Dois gols! Tá quase lá, falta só um pra fase perfeita! 🔥',
    'Impressionante! Mais uma tentativa e você fecha com 3! 💪',
    'Show! Dois de três! Bora buscar a fase perfeita? 🏅'
  ],
  3: [
    'FASE PERFEITA! Você é o Craque das Contas! 🏆',
    'Três de três! Ninguém segura você! Bora pro próximo desafio! 🌟',
    'Perfeito! Acho que esse nível tá fácil demais pra você! 😎',
    'Goleada! Manda bem assim no próximo nível também! 🔥',
    'Hat-trick de contas certas! Você é fera demais! ⚽🏆'
  ]
};

function sortearApelido() {
  const personagem = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
  const animal = ANIMAIS[Math.floor(Math.random() * ANIMAIS.length)];
  return `${personagem} ${animal}`;
}

function sortearMensagemResultado(gols) {
  const lista = MENSAGENS_RESULTADO[gols] || MENSAGENS_RESULTADO[0];
  return lista[Math.floor(Math.random() * lista.length)];
}
