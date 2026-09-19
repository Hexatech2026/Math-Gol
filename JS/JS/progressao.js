// progressao.js — sistema de progressao entre fases.
// Fase 1: Penaltis (3 cobrancas) — ja existe
// Fase 2: Falta (5 cobrancas, timer menor, dificuldade sobe)
// Fase 3: Final (7 cobrancas, timer curto, dificuldade maxima)
//
// Desbloqueia a proxima fase ao fazer >= 2 gols na fase atual.
// Progresso salvo em localStorage (e Firebase quando disponivel).

var Progressao = (function() {

  var FASES = [
    {
      id: 'penaltis',
      nome: 'Pênaltis',
      icone: '⚽',
      descricao: '3 cobranças — aqueça o pé!',
      cobrancas: 3,
      timerMax: 15,
      golsParaDesbloquear: 2, // gols minimos para desbloquear a proxima
      dificuldadeForcar: null  // usa a dificuldade escolhida pelo jogador
    },
    {
      id: 'falta',
      nome: 'Falta',
      icone: '🥅',
      descricao: '5 cobranças — goleiro mais esperto!',
      cobrancas: 5,
      timerMax: 12,
      golsParaDesbloquear: 3,
      dificuldadeForcar: null // sobe 1 nivel automaticamente
    },
    {
      id: 'final',
      nome: 'Final',
      icone: '🏆',
      descricao: '7 cobranças — vale o título!',
      cobrancas: 7,
      timerMax: 10,
      golsParaDesbloquear: null, // ultima fase
      dificuldadeForcar: null
    }
  ];

  // Mapa: dificuldade escolhida -> dificuldade efetiva por fase
  var ESCALAR_DIFICULDADE = {
    'facil':   ['facil', 'medio', 'dificil'],
    'medio':   ['medio', 'dificil', 'dificil'],
    'dificil': ['dificil', 'dificil', 'dificil']
  };

  var progresso = {
    fasesDesbloqueadas: ['penaltis'], // sempre comeca com a primeira
    melhorPontuacao: {},              // { faseId: pontos }
    melhorGols: {}                    // { faseId: gols }
  };

  function carregar() {
    try {
      var salvo = JSON.parse(localStorage.getItem('mathgol_progressao') || '{}');
      if (Array.isArray(salvo.fasesDesbloqueadas) && salvo.fasesDesbloqueadas.length) {
        progresso.fasesDesbloqueadas = salvo.fasesDesbloqueadas;
      }
      if (salvo.melhorPontuacao) progresso.melhorPontuacao = salvo.melhorPontuacao;
      if (salvo.melhorGols) progresso.melhorGols = salvo.melhorGols;
    } catch(e) {}
  }

  function salvar() {
    try {
      localStorage.setItem('mathgol_progressao', JSON.stringify(progresso));
    } catch(e) {}
  }

  function obterFases() {
    return FASES;
  }

  function faseDesbloqueada(faseId) {
    return progresso.fasesDesbloqueadas.indexOf(faseId) !== -1;
  }

  function obterFase(faseId) {
    return FASES.find(function(f) { return f.id === faseId; }) || FASES[0];
  }

  function indiceFase(faseId) {
    for (var i = 0; i < FASES.length; i++) {
      if (FASES[i].id === faseId) return i;
    }
    return 0;
  }

  function dificuldadeEfetiva(dificuldadeEscolhida, faseId) {
    var idx = indiceFase(faseId);
    var escala = ESCALAR_DIFICULDADE[dificuldadeEscolhida] || ESCALAR_DIFICULDADE['facil'];
    return escala[Math.min(idx, escala.length - 1)];
  }

  // Registra resultado de uma fase. Retorna { desbloqueou: bool, proximaFase: string|null }
  function registrarResultado(faseId, gols, pontuacao) {
    var fase = obterFase(faseId);
    var idx = indiceFase(faseId);

    // Atualiza melhores
    if (!progresso.melhorPontuacao[faseId] || pontuacao > progresso.melhorPontuacao[faseId]) {
      progresso.melhorPontuacao[faseId] = pontuacao;
    }
    if (!progresso.melhorGols[faseId] || gols > progresso.melhorGols[faseId]) {
      progresso.melhorGols[faseId] = gols;
    }

    // Verifica desbloqueio
    var desbloqueou = false;
    var proximaFase = null;
    if (fase.golsParaDesbloquear !== null && gols >= fase.golsParaDesbloquear) {
      var proxIdx = idx + 1;
      if (proxIdx < FASES.length) {
        proximaFase = FASES[proxIdx].id;
        if (progresso.fasesDesbloqueadas.indexOf(proximaFase) === -1) {
          progresso.fasesDesbloqueadas.push(proximaFase);
          desbloqueou = true;
        }
      }
    }

    salvar();
    return { desbloqueou: desbloqueou, proximaFase: proximaFase };
  }

  function melhorPontuacao(faseId) {
    return progresso.melhorPontuacao[faseId] || 0;
  }

  function melhorGols(faseId) {
    return progresso.melhorGols[faseId] || 0;
  }

  // Inicializa ao carregar
  carregar();

  return {
    obterFases: obterFases,
    obterFase: obterFase,
    faseDesbloqueada: faseDesbloqueada,
    dificuldadeEfetiva: dificuldadeEfetiva,
    registrarResultado: registrarResultado,
    melhorPontuacao: melhorPontuacao,
    melhorGols: melhorGols
  };
})();
