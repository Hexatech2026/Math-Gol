// api/avatar.js
//   GET /api/avatar?apelido=Craque+Falcão              → estilo escolhido por hash do apelido (compatibilidade)
//   GET /api/avatar?estilo=bottts&seed=Bola1            → estilo e seed escolhidos direto (tela de personalizar)
//
// Gera um avatar animado usando a API pública do DiceBear
// (https://www.dicebear.com). Sem autenticação, sem custo, sem dado pessoal.
//
// O endpoint faz proxy do SVG em vez de redirecionar, porque:
//   1. Evita expor o apelido na barra de endereço (query string visível)
//   2. Permite cachear o resultado na própria Vercel (edge cache)
//   3. Se o DiceBear sair do ar, retorna um SVG fallback em vez de erro
//
// Estilos aceitos (pensados pra criança do fundamental, iguais aos
// mostrados na galeria da tela de personalizar — ver public/avatar-data.js):
//   - thumbs, fun-emoji, critters, bottts, croodles, big-smile,
//     pixel-art, notionists

const https = require('https');

// Usados no modo antigo (?apelido=...), onde o estilo é escolhido por hash.
const ESTILOS_HASH = [
  'thumbs',
  'fun-emoji',
  'critters',
  'bottts',
  'croodles',
  'big-smile'
];

// Todos os estilos que o endpoint aceita quando vêm explícitos via
// ?estilo=...&seed=... (inclui os da galeria de personalização).
const ESTILOS_PERMITIDOS = [
  'thumbs',
  'fun-emoji',
  'critters',
  'bottts',
  'croodles',
  'big-smile',
  'pixel-art',
  'notionists'
];

// Fallback SVG caso o DiceBear esteja fora do ar: um círculo colorido com
// a inicial do apelido dentro, igual ao avatar genérico de qualquer app.
function svgFallback(apelido) {
  const inicial = (apelido || '?').charAt(0).toUpperCase();
  const cores = ['#2E9E5B', '#3AA9D6', '#FFC63B', '#E1493F', '#9B59B6'];
  const indice = apelido.length % cores.length;
  const cor = cores[indice];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="${cor}"/>
  <text x="50" y="50" dy="0.35em" text-anchor="middle"
        font-family="sans-serif" font-size="42" font-weight="600"
        fill="#FFFDF6">${inicial}</text>
</svg>`;
}

function hashSimples(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buscarSvg(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 4000 }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`DiceBear retornou status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Use GET.' });
  }

  const query = req.query || {};
  const estiloPedido = (query.estilo || '').toString();
  const seedPedido = (query.seed || '').toString();
  const apelido = (query.apelido || '').toString();

  let estilo;
  let seed;
  let seedParaFallback;

  if (estiloPedido || seedPedido) {
    // Modo novo: tela de personalizar manda o estilo e a seed escolhidos.
    if (!ESTILOS_PERMITIDOS.includes(estiloPedido)) {
      return res.status(400).json({ erro: 'Parâmetro "estilo" inválido.' });
    }
    if (!seedPedido || seedPedido.length > 40) {
      return res.status(400).json({ erro: 'Parâmetro "seed" ausente ou muito longo.' });
    }
    estilo = estiloPedido;
    seed = encodeURIComponent(seedPedido);
    seedParaFallback = seedPedido;
  } else {
    // Modo antigo (compatibilidade): estilo escolhido por hash do apelido.
    if (!apelido || apelido.length > 40) {
      return res.status(400).json({ erro: 'Parâmetro "apelido" (ou "estilo"+"seed") ausente ou muito longo.' });
    }
    estilo = ESTILOS_HASH[hashSimples(apelido) % ESTILOS_HASH.length];
    seed = encodeURIComponent(apelido);
    seedParaFallback = apelido;
  }

  const url = `https://api.dicebear.com/10.x/${estilo}/svg?seed=${seed}&animationVariant=medium&backgroundColor=transparent`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // cache 24h

  try {
    const svg = await buscarSvg(url);
    return res.status(200).send(svg);
  } catch (erro) {
    console.warn('[avatar] DiceBear indisponível, usando fallback:', erro.message);
    return res.status(200).send(svgFallback(seedParaFallback));
  }
};
