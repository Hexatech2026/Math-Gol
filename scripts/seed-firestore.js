// scripts/seed-firestore.js — carga inicial (seed) do Firestore.
//
// Sobe as listas que hoje moram fixas em public/data.js pro Firestore de
// verdade, cada lista na sua PRÓPRIA coleção (pra não misturar tudo numa
// coleção só):
//   - personagens  → um doc por palavra usada no apelido sorteado (ex.: "Capitão")
//   - animais      → um doc por palavra usada no apelido sorteado (ex.: "Tigre")
//   - selecoes     → um doc por time (id = brasil, argentina, ...)
//   - dificuldades → um doc por nível (id = facil, medio, dificil)
//
// O jogo (public/firebase-config.js → carregarConfiguracoes()) só LÊ essas
// coleções; quem escreve é este script, usando o Admin SDK — por isso as
// regras do Firestore podem manter escrita bloqueada pro cliente
// (ver firestore.rules) sem quebrar o seed.
//
// Como rodar:
//   1. Preencha o .env (ou exporte as variáveis) com as credenciais do
//      Firebase Admin — ver .env.example.
//   2. node scripts/seed-firestore.js
//
// É seguro rodar mais de uma vez: usa setDoc (sobrescreve), não addDoc.

require('dotenv').config();
const { getFirestore } = require('../api/_lib/firebaseAdmin');

// Mesmas listas que hoje ficam fixas em public/data.js — servem de conteúdo
// inicial pro Firestore. Se você mudar algo aqui, rode o script de novo.
const PERSONAGENS = [
  'Capitão', 'Fera', 'Relâmpago', 'Craque', 'Foguete',
  'Furacão', 'Campeão', 'Guerreiro', 'Fenômeno', 'Trovão',
  'Meteoro', 'Torpedo', 'Escudo', 'Cometa', 'Raio',
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
  { id: 'facil',    nome: 'Fácil',    descricao: '+ e − até 10',      icone: '⭐' },
  { id: 'medio',    nome: 'Médio',    descricao: '+ − até 20 e tabuada', icone: '⭐⭐' },
  { id: 'dificil',  nome: 'Difícil',  descricao: '× e ÷',              icone: '⭐⭐⭐' }
];

// Vira slug (a-z0-9-) pra virar id de documento, mesmo com acento/espaço.
function slugificar(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function semearListaSimples(db, nomeColecao, itens) {
  console.log(`\n== ${nomeColecao} (${itens.length} itens) ==`);
  for (const texto of itens) {
    const id = slugificar(texto);
    await db.collection(nomeColecao).doc(id).set({ texto });
    console.log(`  ok: ${id} → "${texto}"`);
  }
}

async function semearListaComId(db, nomeColecao, itens) {
  console.log(`\n== ${nomeColecao} (${itens.length} itens) ==`);
  for (const { id, ...campos } of itens) {
    await db.collection(nomeColecao).doc(id).set(campos);
    console.log(`  ok: ${id} →`, campos);
  }
}

async function main() {
  const db = getFirestore();

  await semearListaSimples(db, 'personagens', PERSONAGENS);
  await semearListaSimples(db, 'animais', ANIMAIS);
  await semearListaComId(db, 'selecoes', SELECOES);
  await semearListaComId(db, 'dificuldades', DIFICULDADES);

  console.log('\n✅ Seed concluído.');
}

main().catch(erro => {
  console.error('\n❌ Seed falhou:', erro);
  process.exit(1);
});
