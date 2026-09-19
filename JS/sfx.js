// sfx.js — efeitos sonoros usando Web Audio API (zero arquivos externos).
// Cada som é sintetizado programaticamente. Respeita o toggle de áudio
// do painel de acessibilidade e so toca depois de interacao do usuario
// (politica de autoplay dos navegadores).

var SFX = (function() {
  var ctx = null;
  var ativo = true;

  function obterContexto() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // --- Utilitarios de sintese ---

  function tocarTom(freq, duracao, tipo, volume, rampDown) {
    var c = obterContexto();
    if (!c || !ativo) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = tipo || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.25, c.currentTime);
    if (rampDown !== false) {
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duracao);
    }
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duracao);
  }

  function tocarRuido(duracao, volume) {
    var c = obterContexto();
    if (!c || !ativo) return;
    var tamanho = c.sampleRate * duracao;
    var buffer = c.createBuffer(1, tamanho, c.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < tamanho; i++) {
      dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho);
    }
    var source = c.createBufferSource();
    source.buffer = buffer;
    var gain = c.createGain();
    gain.gain.setValueAtTime(volume || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duracao);
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
  }

  // --- Sons do jogo ---

  function apito() {
    // Apito de arbitro: tom agudo duplo
    tocarTom(1200, 0.15, 'square', 0.12);
    setTimeout(function() { tocarTom(1400, 0.3, 'square', 0.12); }, 160);
  }

  function gol() {
    // Sequencia ascendente alegre + ruido de torcida
    var notas = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notas.forEach(function(f, i) {
      setTimeout(function() { tocarTom(f, 0.25, 'square', 0.15); }, i * 100);
    });
    setTimeout(function() { tocarRuido(0.6, 0.12); }, 200); // torcida
  }

  function defesa() {
    // Tom descendente triste
    tocarTom(400, 0.15, 'triangle', 0.2);
    setTimeout(function() { tocarTom(280, 0.3, 'triangle', 0.18); }, 140);
  }

  function tempoEsgotado() {
    // Buzina curta
    tocarTom(220, 0.5, 'sawtooth', 0.12);
  }

  function clique() {
    // Click sutil de botao
    tocarTom(800, 0.06, 'sine', 0.1);
  }

  function selecionar() {
    // Pop de confirmacao
    tocarTom(600, 0.08, 'sine', 0.12);
    setTimeout(function() { tocarTom(900, 0.1, 'sine', 0.1); }, 60);
  }

  function timerAlerta() {
    // Tick de urgencia (usado quando timer < 5s)
    tocarTom(1000, 0.04, 'square', 0.08);
  }

  function faseCompleta() {
    // Fanfarra curta
    var notas = [523, 659, 784, 880, 1047];
    notas.forEach(function(f, i) {
      setTimeout(function() { tocarTom(f, 0.2, 'square', 0.12); }, i * 120);
    });
    setTimeout(function() { tocarRuido(0.4, 0.08); }, 400);
  }

  function faseLiberada() {
    // Som de desbloqueio: arpejo brilhante
    var notas = [440, 554, 659, 880];
    notas.forEach(function(f, i) {
      setTimeout(function() { tocarTom(f, 0.15, 'sine', 0.15); }, i * 80);
    });
  }

  function alternar(valor) {
    ativo = valor;
  }

  function estaAtivo() {
    return ativo;
  }

  return {
    apito: apito,
    gol: gol,
    defesa: defesa,
    tempoEsgotado: tempoEsgotado,
    clique: clique,
    selecionar: selecionar,
    timerAlerta: timerAlerta,
    faseCompleta: faseCompleta,
    faseLiberada: faseLiberada,
    alternar: alternar,
    estaAtivo: estaAtivo
  };
})();
