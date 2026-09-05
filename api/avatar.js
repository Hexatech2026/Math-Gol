// api/avatar.js — GET /api/avatar?apelido=Craque+Falcão
//
// Gera um avatar animado único para cada apelido usando a API pública do
// DiceBear (https://www.dicebear.com). O apelido vira a "seed" do avatar,
// então o mesmo apelido sempre gera o mesmo boneco — determinístico, sem
// aleatoriedade. Sem autenticação, sem custo, sem dado pessoal.
//
// O endpoint faz proxy do SVG em vez de redirecionar, porque:
//   1. Evita expor o apelido na barra de endereço (query string visível)
//   2. Permite cachear o resultado na própria Vercel (edge cache)
//   3. Se o DiceBear sair do ar, retorna um SVG fallback em vez de erro
//
// Estilos escolhidos pensando em criança do fundamental:
//   - thumbs       → mãozinhas com carinhas, muito divertido
//   - fun-emoji    → emojis expressivos e coloridos
//   - critters     → bichinhos fofos
//   - bottts       → robôs bobos e simpáticos
//   - adventurer   → personagens estilo RPG, olhos grandes
//   - pixelbot     → robozinhos pixelados
//
// O estilo é escolhido deterministicamente a partir do apelido (não é
// aleatório — o mesmo apelido sempre cai no mesmo estilo), pra manter a
// consistência visual entre sessões.

const https = require('https');

const ESTILOS = [
  'thumbs',
  'fun-emoji',
  'critters',
  'bottts',
  'adventurer',
  'pixelbot'
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

  const apelido = (req.query && req.query.apelido) || '';
  if (!apelido || apelido.length > 40) {
    return res.status(400).json({ erro: 'Parâmetro "apelido" ausente ou muito longo.' });
  }

  // Escolhe o estilo deterministicamente a partir do apelido
  const estilo = ESTILOS[hashSimples(apelido) % ESTILOS.length];
  const seed = encodeURIComponent(apelido);
  const url = `https://api.dicebear.com/10.x/${estilo}/svg?seed=${seed}&animationVariant=medium&backgroundColor=transparent`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // cache 24h

  try {
    const svg = await buscarSvg(url);
    return res.status(200).send(svg);
  } catch (erro) {
    console.warn('[avatar] DiceBear indisponível, usando fallback:', erro.message);
    return res.status(200).send(svgFallback(apelido));
  }
};
