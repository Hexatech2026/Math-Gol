// main.js — orquestra a navegação entre telas e o estado do jogador.
// Persistência real via Firebase (firebase-config.js) + fallback localStorage.

const estado = {
  apelido: '',
  avatarEstilo: AVATAR_PADRAO.estilo,
  avatarSeed: AVATAR_PADRAO.seed,
  selecaoId: null,
  dificuldadeId: null,
  cobrancaAtual: 0,
  gols: 0,
  resultadosCobrancas: [], // 'gol' ou 'defesa' por cobrança, pra colorir bolinha verde/vermelha
  historicoCobrancas: [], // true = gol, false = defesa
  perguntaAtual: null,
  zonaCorreta: null,
  jogoPenalti: null,
  token: null
};

const TOTAL_COBRANCAS = 3;
let categoriaAvatarAtiva = CATEGORIAS_AVATAR[0].id;

// Constrói a URL do avatar a partir do estilo+seed escolhidos na galeria,
// usando o proxy /api/avatar (com fallback direto pro DiceBear se o proxy
// não estiver disponível, ex.: rodando o front sem o back-end da Vercel).
function gerarUrlAvatarProxy(estilo, seed) {
  return `/api/avatar?estilo=${encodeURIComponent(estilo)}&seed=${encodeURIComponent(seed)}`;
}

function gerarUrlAvatarDireta(estilo, seed) {
  return `https://api.dicebear.com/10.x/${estilo}/svg?seed=${encodeURIComponent(seed)}&animationVariant=medium&backgroundColor=transparent`;
}

// ---------- Navegação ----------

function mostrarTela(idTela) {
  document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
  document.getElementById(idTela).classList.add('tela-ativa');

  const logoMini = document.getElementById('logo-mini');
  if (logoMini) logoMini.classList.toggle('escondido', idTela === 'tela-menu');
}

/* ---------------------------- Menu ---------------------------- */

function initMenu() {
  document.getElementById('botao-jogar').addEventListener('click', () => {
    irParaApelido();
  });
}

/* ---------------------------- Personalizar (apelido + avatar) ---------------------------- */

// Só letras, números, espaço e alguns acentos comuns em português — evita
// que a criança cole algo indevido no campo de texto livre.
const REGEX_APELIDO_VALIDO = /[^a-zA-Z0-9À-ÿ ]/g;

function irParaApelido() {
  if (!estado.apelido) {
    estado.apelido = sortearApelido();
  }
  document.getElementById('input-apelido').value = estado.apelido;
  renderizarAbasAvatar();
  renderizarGradeAvatares();
  atualizarPreviewAvatar();
  mostrarTela('tela-apelido');
}

function sortearNovoApelido() {
  estado.apelido = sortearApelido();
  document.getElementById('input-apelido').value = estado.apelido;
  pulsarAvatar();
}

function pulsarAvatar() {
  const avatar = document.getElementById('avatar-apelido');
  avatar.classList.remove('pulo');
  void avatar.offsetWidth;
  avatar.classList.add('pulo');
}

function atualizarPreviewAvatar() {
  const avatarImg = document.getElementById('avatar-img');
  avatarImg.onerror = function() {
    this.onerror = null;
    this.src = gerarUrlAvatarDireta(estado.avatarEstilo, estado.avatarSeed);
  };
  avatarImg.src = gerarUrlAvatarProxy(estado.avatarEstilo, estado.avatarSeed);
}

function renderizarAbasAvatar() {
  const container = document.getElementById('abas-avatar');
  container.innerHTML = '';
  CATEGORIAS_AVATAR.forEach(categoria => {
    const aba = document.createElement('button');
    aba.type = 'button';
    aba.className = 'aba-avatar';
    aba.textContent = categoria.nome;
    aba.setAttribute('data-categoria', categoria.id);
    if (categoria.id === categoriaAvatarAtiva) aba.classList.add('aba-avatar-ativa');
    aba.addEventListener('click', () => {
      categoriaAvatarAtiva = categoria.id;
      container.querySelectorAll('.aba-avatar').forEach(a => a.classList.remove('aba-avatar-ativa'));
      aba.classList.add('aba-avatar-ativa');
      renderizarGradeAvatares();
    });
    container.appendChild(aba);
  });
}

function renderizarGradeAvatares() {
  const categoria = CATEGORIAS_AVATAR.find(c => c.id === categoriaAvatarAtiva) || CATEGORIAS_AVATAR[0];
  const grade = document.getElementById('grade-avatares');
  grade.innerHTML = '';
  categoria.seeds.forEach(seed => {
    const opcao = document.createElement('button');
    opcao.type = 'button';
    opcao.className = 'opcao-avatar';
    if (categoria.estilo === estado.avatarEstilo && seed === estado.avatarSeed) {
      opcao.classList.add('opcao-avatar-selecionada');
    }
    const img = document.createElement('img');
    img.className = 'opcao-avatar-img';
    img.alt = `Avatar ${categoria.nome}`;
    img.onerror = function() {
      this.onerror = null;
      this.src = gerarUrlAvatarDireta(categoria.estilo, seed);
    };
    img.src = gerarUrlAvatarProxy(categoria.estilo, seed);
    opcao.appendChild(img);
    opcao.addEventListener('click', () => {
      estado.avatarEstilo = categoria.estilo;
      estado.avatarSeed = seed;
      grade.querySelectorAll('.opcao-avatar').forEach(o => o.classList.remove('opcao-avatar-selecionada'));
      opcao.classList.add('opcao-avatar-selecionada');
      atualizarPreviewAvatar();
      pulsarAvatar();
    });
    grade.appendChild(opcao);
  });
}

function initApelido() {
  const inputApelido = document.getElementById('input-apelido');
  inputApelido.addEventListener('input', () => {
    inputApelido.value = inputApelido.value.replace(REGEX_APELIDO_VALIDO, '');
  });
  inputApelido.addEventListener('change', () => {
    const valor = inputApelido.value.trim();
    estado.apelido = valor || sortearApelido();
    inputApelido.value = estado.apelido;
  });

  document.getElementById('botao-sortear-apelido').addEventListener('click', () => {
    sortearNovoApelido();
    Narracao.falar(`Novo apelido sorteado: ${estado.apelido}`);
  });

  document.getElementById('botao-confirmar-apelido').addEventListener('click', () => {
    const valor = inputApelido.value.trim();
    estado.apelido = valor || sortearApelido();

    if (window.FirebaseMathGol && estado.token) {
      window.FirebaseMathGol.salvarPerfil(estado.token, {
        apelido: estado.apelido,
        avatarEstilo: estado.avatarEstilo,
        avatarSeed: estado.avatarSeed
      });
    }

    irParaSelecao();
  });
}

/* ---------------------------- Seleção ---------------------------- */

function irParaSelecao() {
  const grade = document.getElementById('grade-selecoes');
  grade.innerHTML = '';
  SELECOES.forEach(selecao => {
    const cartao = document.createElement('button');
    cartao.className = 'cartao';
    cartao.type = 'button';
    cartao.setAttribute('data-id', selecao.id);
    cartao.innerHTML = `
      <span class="cartao-emblema" style="background: linear-gradient(135deg, ${selecao.corPrimaria} 50%, ${selecao.corSecundaria} 50%);"></span>
      <span class="cartao-titulo">${selecao.nome}</span>
    `;
    cartao.addEventListener('click', () => {
      grade.querySelectorAll('.cartao').forEach(c => c.classList.remove('cartao-selecionado'));
      cartao.classList.add('cartao-selecionado');
      estado.selecaoId = selecao.id;
      document.getElementById('botao-confirmar-selecao').disabled = false;
      Narracao.falar(`Seleção ${selecao.nome} escolhida`);
    });
    grade.appendChild(cartao);
  });
  document.getElementById('botao-confirmar-selecao').disabled = true;
  mostrarTela('tela-selecao');
}

function initSelecao() {
  document.getElementById('botao-confirmar-selecao').addEventListener('click', () => {
    irParaDificuldade();
  });
}

/* ---------------------------- Dificuldade ---------------------------- */

function irParaDificuldade() {
  const grade = document.getElementById('grade-dificuldades');
  grade.innerHTML = '';
  DIFICULDADES.forEach(dificuldade => {
    const cartao = document.createElement('button');
    cartao.className = 'cartao';
    cartao.type = 'button';
    cartao.innerHTML = `
      <span class="cartao-icone-dificuldade">${dificuldade.icone}</span>
      <span class="cartao-titulo">${dificuldade.nome}</span>
      <span class="cartao-descricao">${dificuldade.descricao}</span>
    `;
    cartao.addEventListener('click', () => {
      grade.querySelectorAll('.cartao').forEach(c => c.classList.remove('cartao-selecionado'));
      cartao.classList.add('cartao-selecionado');
      estado.dificuldadeId = dificuldade.id;
      document.getElementById('botao-confirmar-dificuldade').disabled = false;
      Narracao.falar(`Dificuldade ${dificuldade.nome} escolhida`);
    });
    grade.appendChild(cartao);
  });
  document.getElementById('botao-confirmar-dificuldade').disabled = true;
  mostrarTela('tela-dificuldade');
}

function initDificuldade() {
  document.getElementById('botao-confirmar-dificuldade').addEventListener('click', () => {
    iniciarFase1();
  });
}

/* ---------------------------- Fase 1 ---------------------------- */

const ORDEM_ZONAS = ['topo-esquerda', 'topo-direita', 'meio', 'baixo-esquerda', 'baixo-direita'];

function iniciarFase1() {
  estado.cobrancaAtual = 0;
  estado.gols = 0;
  estado.resultadosCobrancas = [];
  estado.historicoCobrancas = [];
  mostrarTela('tela-fase1');
  atualizarBolinhasProgresso();

  if (estado.jogoPenalti) {
    estado.jogoPenalti.destruir();
    estado.jogoPenalti = null;
  }
  document.getElementById('jogo-penalti').innerHTML = '';

  try {
    if (typeof Phaser === 'undefined') throw new Error('Phaser não carregou');
    estado.jogoPenalti = criarJogoPenalti('jogo-penalti');
  } catch (erro) {
    console.warn('Cena do pênalti indisponível, seguindo só com as perguntas:', erro);
    estado.jogoPenalti = null;
  }

  carregarProximaPergunta();
}

function atualizarBolinhasProgresso() {
  const container = document.getElementById('cabecalho-fase');
  container.innerHTML = '';
  for (let i = 0; i < TOTAL_COBRANCAS; i++) {
    const bolinha = document.createElement('span');
    bolinha.className = 'bolinha-cobranca';
    if (i < estado.resultadosCobrancas.length) {
      // Cobrança já feita: verde se gol, vermelha se defesa
      bolinha.classList.add(estado.resultadosCobrancas[i] === 'gol' ? 'acerto' : 'erro');
    } else if (i === estado.cobrancaAtual) {
      bolinha.classList.add('atual');
    }
    container.appendChild(bolinha);
  }
}

function carregarProximaPergunta() {
  estado.perguntaAtual = gerarPergunta(estado.dificuldadeId);
  document.getElementById('mensagem-feedback').textContent = '';
  document.getElementById('pergunta-texto').textContent = estado.perguntaAtual.texto;

  estado.zonaCorreta = null;
  ORDEM_ZONAS.forEach((zonaId, indice) => {
    const alternativa = estado.perguntaAtual.alternativas[indice];
    const botao = document.querySelector(`.botao-zona[data-zona="${zonaId}"]`);
    botao.textContent = alternativa.valor;
    botao.disabled = false;
    botao.classList.remove('acertou', 'errou');
    if (alternativa.correta) estado.zonaCorreta = zonaId;
  });

  Narracao.falar(estado.perguntaAtual.textoFalado);
}

function initFase1() {
  document.getElementById('zonas-gol').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.botao-zona');
    if (!botao || botao.disabled) return;
    chutarZona(botao);
  });
}

function chutarZona(botaoClicado) {
  const zonaId = botaoClicado.getAttribute('data-zona');
  const acertou = zonaId === estado.zonaCorreta;

  document.querySelectorAll('.botao-zona').forEach(b => (b.disabled = true));
  botaoClicado.classList.add(acertou ? 'acertou' : 'errou');

  if (estado.jogoPenalti) {
    estado.jogoPenalti.chutar(zonaId, acertou, resultado => {
      finalizarCobranca(resultado.gol);
    });
  } else {
    setTimeout(() => finalizarCobranca(acertou), 500);
  }
}

function finalizarCobranca(foiGol) {
  if (foiGol) {
    estado.gols++;
    estado.resultadosCobrancas.push('gol');
    document.getElementById('mensagem-feedback').textContent = 'GOOOL! Conta certa! 🎉';
    Narracao.falar('Gol! Conta certa!');
  } else {
    estado.resultadosCobrancas.push('defesa');
    document.getElementById('mensagem-feedback').textContent = 'O goleiro defendeu! Vamos pra próxima. 💪';
    Narracao.falar('O goleiro defendeu! Vamos para a próxima cobrança.');
  }

  estado.cobrancaAtual++;
  atualizarBolinhasProgresso();

  setTimeout(() => {
    if (estado.cobrancaAtual >= TOTAL_COBRANCAS) {
      irParaResultado();
    } else {
      carregarProximaPergunta();
    }
  }, 1500);
}

/* ---------------------------- Resultado ---------------------------- */

function irParaResultado() {
  if (estado.jogoPenalti) {
    estado.jogoPenalti.destruir();
    estado.jogoPenalti = null;
  }

  document.getElementById('placar-final').textContent = `${estado.gols} / ${TOTAL_COBRANCAS}`;

  const mensagem = sortearMensagemResultado(estado.gols);
  document.getElementById('resumo-resultado').textContent = mensagem;

  // Salva local sempre (funciona sem internet)
  try {
    localStorage.setItem('mathgol_ultimo_resultado', JSON.stringify({
      apelido: estado.apelido,
      selecaoId: estado.selecaoId,
      dificuldadeId: estado.dificuldadeId,
      gols: estado.gols,
      data: new Date().toISOString()
    }));
  } catch (e) {}

  // Salva no Firebase (em paralelo, sem travar a tela)
  if (window.FirebaseMathGol && estado.token) {
    window.FirebaseMathGol.salvarProgresso(estado.token, {
      apelido: estado.apelido,
      selecaoId: estado.selecaoId,
      dificuldadeId: estado.dificuldadeId,
      gols: estado.gols
    });
  }

  Narracao.falar(mensagem);
  mostrarTela('tela-resultado');
}

function initResultado() {
  document.getElementById('botao-voltar-menu').addEventListener('click', () => {
    mostrarTela('tela-menu');
  });
}

/* ---------------------------- Acessibilidade ---------------------------- */

function carregarPreferenciasAcessibilidade() {
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('mathgol_acessibilidade') || '{}'); } catch (e) {}

  const altoContraste = !!prefs.altoContraste;
  const espacoDislexia = !!prefs.espacoDislexia;
  const narracaoAtiva = prefs.narracaoAtiva !== undefined ? prefs.narracaoAtiva : true;

  document.body.classList.toggle('alto-contraste', altoContraste);
  document.body.classList.toggle('espaco-dislexia', espacoDislexia);
  Narracao.alternar(narracaoAtiva);

  document.getElementById('opcao-alto-contraste').checked = altoContraste;
  document.getElementById('opcao-espaco-dislexia').checked = espacoDislexia;
  document.getElementById('opcao-narracao').checked = narracaoAtiva;
}

function salvarPreferenciasAcessibilidade() {
  const prefs = {
    altoContraste: document.getElementById('opcao-alto-contraste').checked,
    espacoDislexia: document.getElementById('opcao-espaco-dislexia').checked,
    narracaoAtiva: document.getElementById('opcao-narracao').checked
  };
  try { localStorage.setItem('mathgol_acessibilidade', JSON.stringify(prefs)); } catch (e) {}
  document.body.classList.toggle('alto-contraste', prefs.altoContraste);
  document.body.classList.toggle('espaco-dislexia', prefs.espacoDislexia);
  Narracao.alternar(prefs.narracaoAtiva);
}

function initAcessibilidade() {
  const sobreposicao = document.getElementById('sobreposicao-acessibilidade');
  document.getElementById('botao-acessibilidade').addEventListener('click', () => {
    sobreposicao.classList.add('aberta');
  });
  document.getElementById('botao-fechar-acessibilidade').addEventListener('click', () => {
    sobreposicao.classList.remove('aberta');
  });
  sobreposicao.addEventListener('click', (evento) => {
    if (evento.target === sobreposicao) sobreposicao.classList.remove('aberta');
  });

  ['opcao-alto-contraste', 'opcao-espaco-dislexia', 'opcao-narracao'].forEach(id => {
    document.getElementById(id).addEventListener('change', salvarPreferenciasAcessibilidade);
  });

  carregarPreferenciasAcessibilidade();
}

/* ---------------------------- Inicialização ---------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initAcessibilidade();
  initMenu();
  initApelido();
  initSelecao();
  initDificuldade();
  initFase1();
  initResultado();
  mostrarTela('tela-menu');

  // Cria sessão Firebase em paralelo — até a criança chegar no resultado
  // (vários toques depois), o token já vai estar pronto.
  if (window.FirebaseMathGol) {
    window.FirebaseMathGol.obterOuCriarToken().then(token => { estado.token = token; });
  }
});
