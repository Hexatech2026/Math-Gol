// main.js - orquestra navegacao, timer de chute, pontuacao por velocidade.
// Apelido TRAVADO: crianca escolhe 1 personagem + 1 animal (sem digitar).
// v2: + efeitos sonoros (sfx.js), banco de questoes (banco-questoes.js),
//       sistema de progressao entre fases (progressao.js).

var estado = {
  personagemEscolhido: null,
  animalEscolhido: null,
  apelido: '',
  avatarSeed: AVATAR_PADRAO.seed,
  selecaoId: null,
  dificuldadeId: null,
  faseAtual: 'penaltis',
  cobrancaAtual: 0,
  gols: 0,
  pontuacao: 0,
  resultadosCobrancas: [],
  perguntaAtual: null,
  zonaCorreta: null,
  jogoPenalti: null,
  token: null,
  timerInicio: 0,
  timerInterval: null,
  timerSegundos: 15
};

var TOTAL_COBRANCAS = 3;
var TIMER_MAX = 15;
var categoriaAvatarAtiva = CATEGORIAS_AVATAR[0].id;

// URL SEMPRE com pixel-art, nunca outro estilo. Seed muda = rosto muda.
function gerarUrlAvatar(seed) {
  return 'https://api.dicebear.com/9.x/pixel-art/svg?seed=' + encodeURIComponent(seed);
}

function gerarAvatarFallbackLocal(seed) {
  var inicial = (seed || '?').charAt(0).toUpperCase();
  var cores = ['#2E9E5B', '#3AA9D6', '#FFC63B', '#E1493F', '#9B59B6'];
  var cor = cores[seed.length % cores.length];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="' + cor + '"/><text x="50" y="50" dy="0.35em" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="600" fill="#FFFDF6">' + inicial + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ---------- Navegacao ----------

function mostrarTela(idTela) {
  document.querySelectorAll('.tela').forEach(function(t) { t.classList.remove('tela-ativa'); });
  document.getElementById(idTela).classList.add('tela-ativa');
  var logo = document.getElementById('logo-mini');
  if (logo) logo.classList.toggle('escondido', idTela === 'tela-menu');
}

function initMenu() {
  document.getElementById('botao-jogar').addEventListener('click', function() {
    SFX.clique();
    irParaApelido();
  });
}

// ---------- Apelido: crianca ESCOLHE personagem + animal ----------

function irParaApelido() {
  renderizarListaPersonagens();
  renderizarListaAnimais();
  renderizarAbasAvatar();
  renderizarGradeAvatares();
  atualizarPreviewApelido();
  atualizarPreviewAvatar();
  mostrarTela('tela-apelido');
}

function renderizarListaPersonagens() {
  var container = document.getElementById('lista-personagens');
  container.innerHTML = '';
  PERSONAGENS.forEach(function(p) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-escolha';
    btn.textContent = p;
    if (estado.personagemEscolhido === p) btn.classList.add('chip-ativo');
    btn.addEventListener('click', function() {
      SFX.clique();
      estado.personagemEscolhido = p;
      container.querySelectorAll('.chip-escolha').forEach(function(c) { c.classList.remove('chip-ativo'); });
      btn.classList.add('chip-ativo');
      atualizarPreviewApelido();
    });
    container.appendChild(btn);
  });
}

function renderizarListaAnimais() {
  var container = document.getElementById('lista-animais');
  container.innerHTML = '';
  ANIMAIS.forEach(function(a) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-escolha';
    btn.textContent = a;
    if (estado.animalEscolhido === a) btn.classList.add('chip-ativo');
    btn.addEventListener('click', function() {
      SFX.clique();
      estado.animalEscolhido = a;
      container.querySelectorAll('.chip-escolha').forEach(function(c) { c.classList.remove('chip-ativo'); });
      btn.classList.add('chip-ativo');
      atualizarPreviewApelido();
    });
    container.appendChild(btn);
  });
}

function atualizarPreviewApelido() {
  var texto = '';
  if (estado.personagemEscolhido && estado.animalEscolhido) {
    texto = estado.personagemEscolhido + ' ' + estado.animalEscolhido;
  } else if (estado.personagemEscolhido) {
    texto = estado.personagemEscolhido + ' ???';
  } else if (estado.animalEscolhido) {
    texto = '??? ' + estado.animalEscolhido;
  } else {
    texto = 'Escolha acima';
  }
  estado.apelido = (estado.personagemEscolhido && estado.animalEscolhido)
    ? estado.personagemEscolhido + ' ' + estado.animalEscolhido : '';
  document.getElementById('texto-apelido').textContent = texto;

  var botao = document.getElementById('botao-confirmar-apelido');
  botao.disabled = !estado.apelido;
}

// ---------- Avatar ----------

function atualizarPreviewAvatar() {
  var img = document.getElementById('avatar-img');
  var url = gerarUrlAvatar(estado.avatarSeed);
  img.onerror = function() { this.onerror = null; this.src = gerarAvatarFallbackLocal(estado.avatarSeed); };
  img.src = url;
}

function renderizarAbasAvatar() {
  var container = document.getElementById('abas-avatar');
  container.innerHTML = '';
  CATEGORIAS_AVATAR.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'aba-avatar';
    if (cat.id === categoriaAvatarAtiva) btn.classList.add('aba-ativa');
    btn.textContent = cat.nome;
    btn.addEventListener('click', function() {
      SFX.clique();
      categoriaAvatarAtiva = cat.id;
      container.querySelectorAll('.aba-avatar').forEach(function(a) { a.classList.remove('aba-ativa'); });
      btn.classList.add('aba-ativa');
      renderizarGradeAvatares();
    });
    container.appendChild(btn);
  });
}

function renderizarGradeAvatares() {
  var container = document.getElementById('grade-avatares');
  container.innerHTML = '';
  var cat = CATEGORIAS_AVATAR.find(function(c) { return c.id === categoriaAvatarAtiva; });
  if (!cat) return;
  cat.seeds.forEach(function(seed) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item-avatar';
    if (estado.avatarSeed === seed) btn.classList.add('avatar-selecionado');
    var img = document.createElement('img');
    img.src = gerarUrlAvatar(seed);
    img.alt = seed;
    img.loading = 'lazy';
    img.onerror = function() { this.onerror = null; this.src = gerarAvatarFallbackLocal(seed); };
    btn.appendChild(img);
    btn.addEventListener('click', function() {
      SFX.clique();
      estado.avatarSeed = seed;
      container.querySelectorAll('.item-avatar').forEach(function(i) { i.classList.remove('avatar-selecionado'); });
      btn.classList.add('avatar-selecionado');
      atualizarPreviewAvatar();
    });
    container.appendChild(btn);
  });
}

function initApelido() {
  document.getElementById('botao-confirmar-apelido').addEventListener('click', function() {
    if (!estado.apelido) return;
    SFX.selecionar();
    if (window.FirebaseMathGol && estado.token) {
      window.FirebaseMathGol.salvarPerfil(estado.token, {
        apelido: estado.apelido,
        avatarSeed: estado.avatarSeed
      });
    }
    irParaSelecao();
  });
}

// ---------- Selecao ----------

function irParaSelecao() {
  var grade = document.getElementById('grade-selecoes');
  grade.innerHTML = '';

  var BANDEIRAS_POR_ID = {
    brasil:'br', argentina:'ar', alemanha:'de', franca:'fr', japao:'jp',
    portugal:'pt', espanha:'es', italia:'it', inglaterra:'gb-eng',
    colombia:'co', mexico:'mx', coreia:'kr'
  };

  SELECOES.forEach(function(sel) {
    var codigo = sel.bandeira || BANDEIRAS_POR_ID[sel.id] || '';
    var cartao = document.createElement('button');
    cartao.className = 'cartao';
    cartao.type = 'button';

    var conteudo = '';
    if (codigo) {
      conteudo += '<img class="cartao-bandeira" src="https://flagcdn.com/w80/' + codigo + '.png"';
      conteudo += ' srcset="https://flagcdn.com/w160/' + codigo + '.png 2x"';
      conteudo += ' alt="' + sel.nome + '"';
      conteudo += ' onerror="this.onerror=null;this.src=\'\';">';
    }
    conteudo += '<span class="cartao-titulo">' + sel.nome + '</span>';
    cartao.innerHTML = conteudo;

    cartao.addEventListener('click', function() {
      SFX.clique();
      grade.querySelectorAll('.cartao').forEach(function(c) { c.classList.remove('cartao-selecionado'); });
      cartao.classList.add('cartao-selecionado');
      estado.selecaoId = sel.id;
      document.getElementById('botao-confirmar-selecao').disabled = false;
    });
    grade.appendChild(cartao);
  });
  document.getElementById('botao-confirmar-selecao').disabled = true;
  mostrarTela('tela-selecao');
}

function initSelecao() {
  document.getElementById('botao-confirmar-selecao').addEventListener('click', function() {
    SFX.selecionar();
    irParaDificuldade();
  });
}

// ---------- Dificuldade ----------

function irParaDificuldade() {
  var grade = document.getElementById('grade-dificuldades');
  grade.innerHTML = '';
  DIFICULDADES.forEach(function(dif) {
    var cartao = document.createElement('button');
    cartao.className = 'cartao';
    cartao.type = 'button';
    cartao.innerHTML = '<span class="cartao-icone-dificuldade">' + dif.icone + '</span><span class="cartao-titulo">' + dif.nome + '</span><span class="cartao-descricao">' + dif.descricao + '</span>';
    cartao.addEventListener('click', function() {
      SFX.clique();
      grade.querySelectorAll('.cartao').forEach(function(c) { c.classList.remove('cartao-selecionado'); });
      cartao.classList.add('cartao-selecionado');
      estado.dificuldadeId = dif.id;
      document.getElementById('botao-confirmar-dificuldade').disabled = false;
    });
    grade.appendChild(cartao);
  });
  document.getElementById('botao-confirmar-dificuldade').disabled = true;
  mostrarTela('tela-dificuldade');
}

function initDificuldade() {
  document.getElementById('botao-confirmar-dificuldade').addEventListener('click', function() {
    SFX.selecionar();
    irParaFases();
  });
}

// ---------- Tela de Fases (NOVO) ----------

function irParaFases() {
  var grade = document.getElementById('grade-fases');
  grade.innerHTML = '';

  var fases = Progressao.obterFases();
  fases.forEach(function(fase) {
    var desbloqueada = Progressao.faseDesbloqueada(fase.id);
    var cartao = document.createElement('button');
    cartao.className = 'cartao cartao-fase';
    cartao.type = 'button';
    if (!desbloqueada) cartao.classList.add('cartao-bloqueado');

    var melhorPts = Progressao.melhorPontuacao(fase.id);
    var melhorG = Progressao.melhorGols(fase.id);
    var estrelas = '';
    if (melhorG > 0) {
      for (var i = 0; i < Math.min(melhorG, fase.cobrancas); i++) estrelas += '⭐';
    }

    var conteudo = '<span class="cartao-icone-dificuldade">' + (desbloqueada ? fase.icone : '🔒') + '</span>';
    conteudo += '<span class="cartao-titulo">' + fase.nome + '</span>';
    conteudo += '<span class="cartao-descricao">' + (desbloqueada ? fase.descricao : 'Complete a fase anterior!') + '</span>';
    if (estrelas) conteudo += '<span class="cartao-estrelas">' + estrelas + '</span>';
    if (melhorPts > 0) conteudo += '<span class="cartao-descricao">Recorde: ' + melhorPts + ' pts</span>';
    cartao.innerHTML = conteudo;

    cartao.addEventListener('click', function() {
      if (!desbloqueada) return;
      SFX.selecionar();
      grade.querySelectorAll('.cartao').forEach(function(c) { c.classList.remove('cartao-selecionado'); });
      cartao.classList.add('cartao-selecionado');
      estado.faseAtual = fase.id;
      document.getElementById('botao-confirmar-fase').disabled = false;
    });
    grade.appendChild(cartao);
  });
  document.getElementById('botao-confirmar-fase').disabled = true;
  mostrarTela('tela-fases');
}

function initFases() {
  document.getElementById('botao-confirmar-fase').addEventListener('click', function() {
    SFX.selecionar();
    iniciarFase1();
  });
}

// ---------- Fase 1: timer + pontuacao por velocidade ----------

var ORDEM_ZONAS = ['topo-esquerda', 'topo-direita', 'meio', 'baixo-esquerda', 'baixo-direita'];

function iniciarFase1() {
  // Configura parametros da fase selecionada
  var fase = Progressao.obterFase(estado.faseAtual);
  TOTAL_COBRANCAS = fase.cobrancas;
  TIMER_MAX = fase.timerMax;

  estado.cobrancaAtual = 0;
  estado.gols = 0;
  estado.pontuacao = 0;
  estado.resultadosCobrancas = [];

  // Reseta o banco de questoes pra essa sessao
  BancoQuestoes.resetarSessao();

  // Mostra nome da fase no cabecalho
  var tituloFase = document.getElementById('titulo-fase');
  if (tituloFase) tituloFase.textContent = fase.icone + ' ' + fase.nome;

  mostrarTela('tela-fase1');
  atualizarBolinhasProgresso();

  if (estado.jogoPenalti) { estado.jogoPenalti.destruir(); estado.jogoPenalti = null; }
  document.getElementById('jogo-penalti').innerHTML = '';

  try {
    if (typeof Phaser === 'undefined') throw new Error('Phaser nao carregou');
    estado.jogoPenalti = criarJogoPenalti('jogo-penalti');
  } catch (e) {
    console.warn('Phaser indisponivel:', e);
    estado.jogoPenalti = null;
  }

  SFX.apito();
  carregarProximaPergunta();
}

function atualizarBolinhasProgresso() {
  var container = document.getElementById('cabecalho-fase');
  container.innerHTML = '';
  for (var i = 0; i < TOTAL_COBRANCAS; i++) {
    var b = document.createElement('span');
    b.className = 'bolinha-cobranca';
    if (i < estado.resultadosCobrancas.length) {
      b.classList.add(estado.resultadosCobrancas[i] === 'gol' ? 'acerto' : 'erro');
    } else if (i === estado.cobrancaAtual) {
      b.classList.add('atual');
    }
    container.appendChild(b);
  }
}

function iniciarTimer() {
  estado.timerSegundos = TIMER_MAX;
  estado.timerInicio = Date.now();
  atualizarDisplayTimer();
  pararTimer();
  estado.timerInterval = setInterval(function() {
    var decorrido = Math.floor((Date.now() - estado.timerInicio) / 1000);
    estado.timerSegundos = Math.max(0, TIMER_MAX - decorrido);
    atualizarDisplayTimer();

    // SFX: tick de alerta nos ultimos 4 segundos
    if (estado.timerSegundos > 0 && estado.timerSegundos <= 4) {
      SFX.timerAlerta();
    }

    if (estado.timerSegundos <= 0) {
      pararTimer();
      tempoEsgotado();
    }
  }, 200);
}

function pararTimer() {
  if (estado.timerInterval) { clearInterval(estado.timerInterval); estado.timerInterval = null; }
}

function atualizarDisplayTimer() {
  var el = document.getElementById('timer-display');
  if (!el) return;
  el.textContent = estado.timerSegundos + 's';
  el.classList.remove('timer-verde', 'timer-amarelo', 'timer-vermelho');
  if (estado.timerSegundos > 8) el.classList.add('timer-verde');
  else if (estado.timerSegundos > 4) el.classList.add('timer-amarelo');
  else el.classList.add('timer-vermelho');
}

function calcularPontosPorVelocidade() {
  var tempo = Math.floor((Date.now() - estado.timerInicio) / 1000);
  // Max 100 pontos (resposta instantanea), min 10 (respondeu no limite)
  var pontos = Math.max(10, Math.round(100 * (1 - tempo / TIMER_MAX)));
  return pontos;
}

function tempoEsgotado() {
  SFX.tempoEsgotado();
  document.querySelectorAll('.botao-zona').forEach(function(b) { b.disabled = true; });
  if (estado.jogoPenalti) {
    estado.jogoPenalti.chutar('meio', false, function() { finalizarCobranca(false); });
  } else {
    setTimeout(function() { finalizarCobranca(false); }, 500);
  }
  document.getElementById('mensagem-feedback').textContent = 'Tempo esgotado!';
}

function carregarProximaPergunta() {
  // Usa o banco de questoes com dificuldade efetiva (escala com a fase)
  var dificuldadeEfetiva = Progressao.dificuldadeEfetiva(estado.dificuldadeId, estado.faseAtual);
  estado.perguntaAtual = BancoQuestoes.sortearPergunta(dificuldadeEfetiva);
  document.getElementById('mensagem-feedback').textContent = '';
  document.getElementById('pergunta-texto').textContent = estado.perguntaAtual.texto;

  estado.zonaCorreta = null;
  ORDEM_ZONAS.forEach(function(zonaId, indice) {
    var alt = estado.perguntaAtual.alternativas[indice];
    var botao = document.querySelector('.botao-zona[data-zona="' + zonaId + '"]');
    botao.textContent = alt.valor;
    botao.disabled = false;
    botao.classList.remove('acertou', 'errou');
    if (alt.correta) estado.zonaCorreta = zonaId;
  });

  Narracao.falar(estado.perguntaAtual.textoFalado);
  iniciarTimer();
}

function initFase1() {
  document.getElementById('zonas-gol').addEventListener('click', function(ev) {
    var botao = ev.target.closest('.botao-zona');
    if (!botao || botao.disabled) return;
    chutarZona(botao);
  });
}

function chutarZona(botaoClicado) {
  pararTimer();
  var zonaId = botaoClicado.getAttribute('data-zona');
  var acertou = zonaId === estado.zonaCorreta;

  document.querySelectorAll('.botao-zona').forEach(function(b) { b.disabled = true; });
  botaoClicado.classList.add(acertou ? 'acertou' : 'errou');

  if (estado.jogoPenalti) {
    estado.jogoPenalti.chutar(zonaId, acertou, function(r) { finalizarCobranca(r.gol); });
  } else {
    setTimeout(function() { finalizarCobranca(acertou); }, 500);
  }
}

function finalizarCobranca(foiGol) {
  if (foiGol) {
    SFX.gol();
    var pontos = calcularPontosPorVelocidade();
    estado.gols++;
    estado.pontuacao += pontos;
    estado.resultadosCobrancas.push('gol');
    document.getElementById('mensagem-feedback').textContent = 'GOOOL! +' + pontos + ' pontos!';
    Narracao.falar('Gol!');
  } else {
    SFX.defesa();
    estado.resultadosCobrancas.push('defesa');
    if (document.getElementById('mensagem-feedback').textContent !== 'Tempo esgotado!') {
      document.getElementById('mensagem-feedback').textContent = 'O goleiro defendeu!';
    }
    Narracao.falar('O goleiro defendeu!');
  }

  estado.cobrancaAtual++;
  atualizarBolinhasProgresso();
  atualizarDisplayPontuacao();

  setTimeout(function() {
    if (estado.cobrancaAtual >= TOTAL_COBRANCAS) { irParaResultado(); }
    else { carregarProximaPergunta(); }
  }, 1500);
}

function atualizarDisplayPontuacao() {
  var el = document.getElementById('pontuacao-display');
  if (el) el.textContent = estado.pontuacao + ' pts';
}

// ---------- Resultado ----------

function irParaResultado() {
  pararTimer();
  if (estado.jogoPenalti) { estado.jogoPenalti.destruir(); estado.jogoPenalti = null; }

  // Registra progressao
  var resultadoProgressao = Progressao.registrarResultado(estado.faseAtual, estado.gols, estado.pontuacao);

  document.getElementById('placar-final').textContent = estado.gols + ' / ' + TOTAL_COBRANCAS;
  document.getElementById('pontuacao-final').textContent = estado.pontuacao + ' pontos';

  var mensagem = sortearMensagemResultado(estado.gols);
  document.getElementById('resumo-resultado').textContent = mensagem;

  // Mostra/esconde mensagem de desbloqueio
  var elDesbloqueio = document.getElementById('mensagem-desbloqueio');
  if (elDesbloqueio) {
    if (resultadoProgressao.desbloqueou && resultadoProgressao.proximaFase) {
      var faseNova = Progressao.obterFase(resultadoProgressao.proximaFase);
      elDesbloqueio.textContent = '🔓 Fase "' + faseNova.nome + '" desbloqueada!';
      elDesbloqueio.classList.add('visivel');
      SFX.faseLiberada();
    } else {
      elDesbloqueio.textContent = '';
      elDesbloqueio.classList.remove('visivel');
      SFX.faseCompleta();
    }
  } else {
    SFX.faseCompleta();
  }

  try {
    localStorage.setItem('mathgol_ultimo_resultado', JSON.stringify({
      apelido: estado.apelido, selecaoId: estado.selecaoId,
      dificuldadeId: estado.dificuldadeId, faseId: estado.faseAtual,
      gols: estado.gols, pontuacao: estado.pontuacao,
      data: new Date().toISOString()
    }));
  } catch (e) {}

  if (window.FirebaseMathGol && estado.token) {
    window.FirebaseMathGol.salvarProgresso(estado.token, {
      apelido: estado.apelido, selecaoId: estado.selecaoId,
      dificuldadeId: estado.dificuldadeId, faseId: estado.faseAtual,
      gols: estado.gols, pontuacao: estado.pontuacao
    });
  }

  Narracao.falar(mensagem);
  mostrarTela('tela-resultado');
}

function initResultado() {
  document.getElementById('botao-voltar-menu').addEventListener('click', function() {
    SFX.clique();
    mostrarTela('tela-menu');
  });
  var botaoProxFase = document.getElementById('botao-proxima-fase');
  if (botaoProxFase) {
    botaoProxFase.addEventListener('click', function() {
      SFX.selecionar();
      irParaFases();
    });
  }
}

// ---------- Acessibilidade ----------

function carregarPreferenciasAcessibilidade() {
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('mathgol_acessibilidade') || '{}'); } catch(e) {}
  document.body.classList.toggle('alto-contraste', !!prefs.altoContraste);
  document.body.classList.toggle('espaco-dislexia', !!prefs.espacoDislexia);
  Narracao.alternar(prefs.narracaoAtiva !== undefined ? prefs.narracaoAtiva : true);
  SFX.alternar(prefs.sfxAtivo !== undefined ? prefs.sfxAtivo : true);
  document.getElementById('opcao-alto-contraste').checked = !!prefs.altoContraste;
  document.getElementById('opcao-espaco-dislexia').checked = !!prefs.espacoDislexia;
  document.getElementById('opcao-narracao').checked = prefs.narracaoAtiva !== false;
  var opcaoSfx = document.getElementById('opcao-sfx');
  if (opcaoSfx) opcaoSfx.checked = prefs.sfxAtivo !== false;
}

function salvarPreferenciasAcessibilidade() {
  var opcaoSfx = document.getElementById('opcao-sfx');
  var prefs = {
    altoContraste: document.getElementById('opcao-alto-contraste').checked,
    espacoDislexia: document.getElementById('opcao-espaco-dislexia').checked,
    narracaoAtiva: document.getElementById('opcao-narracao').checked,
    sfxAtivo: opcaoSfx ? opcaoSfx.checked : true
  };
  try { localStorage.setItem('mathgol_acessibilidade', JSON.stringify(prefs)); } catch(e) {}
  document.body.classList.toggle('alto-contraste', prefs.altoContraste);
  document.body.classList.toggle('espaco-dislexia', prefs.espacoDislexia);
  Narracao.alternar(prefs.narracaoAtiva);
  SFX.alternar(prefs.sfxAtivo);
}

function initAcessibilidade() {
  var sobreposicao = document.getElementById('sobreposicao-acessibilidade');
  document.getElementById('botao-acessibilidade').addEventListener('click', function() { sobreposicao.classList.add('aberta'); });
  document.getElementById('botao-fechar-acessibilidade').addEventListener('click', function() { sobreposicao.classList.remove('aberta'); });
  sobreposicao.addEventListener('click', function(ev) { if (ev.target === sobreposicao) sobreposicao.classList.remove('aberta'); });
  ['opcao-alto-contraste', 'opcao-espaco-dislexia', 'opcao-narracao', 'opcao-sfx'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', salvarPreferenciasAcessibilidade);
  });
  carregarPreferenciasAcessibilidade();
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', function() {
  initAcessibilidade();
  initMenu();
  initApelido();
  initSelecao();
  initDificuldade();
  initFases();
  initFase1();
  initResultado();
  mostrarTela('tela-menu');

  if (window.FirebaseMathGol) {
    window.FirebaseMathGol.obterOuCriarToken().then(function(t) { estado.token = t; });
    window.FirebaseMathGol.carregarConfiguracoes().then(function(config) {
      aplicarConfiguracoesRemotas(config);
    });
  }
});
