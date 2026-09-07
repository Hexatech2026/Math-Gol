// avatar-data.js — categorias de avatar (estilos do DiceBear) usadas na tela
// de personalização. Cada categoria tem uma lista de "seeds" fixas (não
// depende do apelido digitado), então a galeria é sempre igual pra qualquer
// criança navegar entre as opções e escolher a que mais gostar.

const CATEGORIAS_AVATAR = [
  { id: 'thumbs',      nome: 'Mãozinhas',    estilo: 'thumbs',      seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'fun-emoji',   nome: 'Emojis',       estilo: 'fun-emoji',   seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'critters',    nome: 'Bichinhos',    estilo: 'critters',    seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'bottts',      nome: 'Robôs',        estilo: 'bottts',      seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'croodles',    nome: 'Rabiscados',   estilo: 'croodles',    seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'big-smile',   nome: 'Sorridentes',  estilo: 'big-smile',   seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'pixel-art',   nome: 'Pixel Art',    estilo: 'pixel-art',   seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
  { id: 'notionists',  nome: 'Modernos',     estilo: 'notionists',  seeds: ['Bola1', 'Bola2', 'Bola3', 'Bola4'] },
];

// Todos os estilos aceitos pelo back-end (api/avatar.js) quando o front pede
// um avatar específico por estilo+seed. Precisa ficar em sincronia com a
// lista ESTILOS_PERMITIDOS de lá.
const ESTILOS_AVATAR_PERMITIDOS = CATEGORIAS_AVATAR.map(categoria => categoria.estilo);

// Categoria/seed padrão pra quando ainda não existe escolha salva.
const AVATAR_PADRAO = { estilo: 'thumbs', seed: 'Bola1' };
