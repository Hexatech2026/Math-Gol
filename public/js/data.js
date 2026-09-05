// data.js — listas fixas usadas para gerar o apelido genérico, as seleções
// disponíveis e os níveis de dificuldade. Nenhum campo de texto livre existe
// no app: o "apelido" é sempre uma combinação de um item de PERSONAGENS
// com um item de ANIMAIS.

const PERSONAGENS = [
  // Neutros / masculinos
  'Capitão', 'Fera', 'Relâmpago', 'Craque', 'Foguete',
  'Furacão', 'Campeão', 'Guerreiro', 'Fenômeno', 'Trovão',
  'Meteoro', 'Torpedo', 'Escudo', 'Cometa', 'Raio',
  // Femininos
  'Capitã', 'Estrela', 'Campeã', 'Guerreira', 'Fênix',
  'Centelha', 'Valente', 'Coragem', 'Vitória', 'Aurora',
  'Heroína', 'Lenda', 'Chama', 'Brilho', 'Medalha'
];

const ANIMAIS = [
  'Tigre', 'Águia', 'Onça', 'Leão', 'Gavião',
  'Puma', 'Lobo', 'Falcão', 'Pantera', 'Tubarão',
  'Golfinho', 'Coruja', 'Raposa', 'Jaguar', 'Fênix',
  'Coelho', 'Lince', 'Arara', 'Borboleta', 'Flamingo'
];

const SELECOES = [
  { id: 'brasil',    nome: 'Brasil',    corPrimaria: '#2E9E5B', corSecundaria: '#FFC63B' },
  { id: 'argentina', nome: 'Argentina', corPrimaria: '#6EC1E4', corSecundaria: '#FFFDF6' },
  { id: 'alemanha',  nome: 'Alemanha',  corPrimaria: '#21303B', corSecundaria: '#E0343B' },
  { id: 'franca',    nome: 'França',    corPrimaria: '#3A5FCD', corSecundaria: '#E0343B' },
  { id: 'japao',     nome: 'Japão',     corPrimaria: '#FFFDF6', corSecundaria: '#E0343B' },
  { id: 'portugal',  nome: 'Portugal',  corPrimaria: '#2E9E5B', corSecundaria: '#E0343B' }
];

const DIFICULDADES = [
  { id: 'facil',    nome: 'Fácil',    descricao: '+ e − até 10', icone: '⭐' },
  { id: 'medio',    nome: 'Médio',    descricao: '+ − até 20 e tabuada', icone: '⭐⭐' },
  { id: 'dificil',  nome: 'Difícil',  descricao: '× e ÷', icone: '⭐⭐⭐' }
];

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
