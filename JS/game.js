// game.js — cena Phaser 3 do pênalti. Cada zona do gol corresponde a uma
// alternativa da pergunta (ver main.js e o overlay de botões em
// #zonas-gol no HTML). Chutar em uma zona É responder a pergunta:
// zona certa = gol, zona errada = o goleiro defende ali mesmo.
//
// As coordenadas aqui (ZONAS) precisam bater com as porcentagens usadas
// nos botões .botao-zona do CSS — os dois lados representam a mesma grade
// de 640x360.
//
// HU-12 (animação de pênalti): tweens do goleiro/bola + giro da bola e
// pequenos efeitos de impacto (rede no gol, goleiro na defesa).
// HU-17 (torcida animada): NÃO fica dentro do canvas do Phaser — é a
// arquibancada em HTML/CSS (#stadium-crowd em index.html/styles.css),
// criada por initCrowd() e acionada por reacaoTorcida() logo abaixo.
// HU-18 (personagem para o chute): batedor atrás da bola que "chuta" antes
// da bola sair do lugar, vestindo a camisa da seleção escolhida (HU-16).

const LARGURA_JOGO = 640;
const ALTURA_JOGO = 360;

const ZONAS = {
  'topo-esquerda':   { x: 230, y: 55 },
  'topo-direita':    { x: 410, y: 55 },
  'meio':            { x: 320, y: 80 },
  'baixo-esquerda':  { x: 230, y: 110 },
  'baixo-direita':   { x: 410, y: 110 }
};

const POSICAO_INICIAL_BOLA = { x: 320, y: 300 };
const POSICAO_INICIAL_GOLEIRO = ZONAS.meio;
const POSICAO_INICIAL_BATEDOR = { x: 270, y: 322 };

const CAMISA_PRIMARIA_PADRAO = 0x3a5fcd;
const CAMISA_SECUNDARIA_PADRAO = 0xfffdf6;

// Converte "#RRGGBB" em número hex do Phaser. Retorna o fallback se o
// valor for invalido/ausente — nunca lança erro (mesma logica de
// tolerancia a dados incompletos usada em data.js).
function corHexParaNumero(hex, fallback) {
  if (typeof hex !== 'string') return fallback;
  const numero = parseInt(hex.replace('#', ''), 16);
  return isNaN(numero) ? fallback : numero;
}

// ---------- HU-17: Torcida animada (HTML/CSS, fora do canvas do Phaser) ----------
// Vive dentro de #stadium-crowd (ver .palco-penalti em index.html), então só
// aparece durante a fase de pênalti — as outras telas escondem essa section
// inteira, e o navegador pausa sozinho as animações de elementos ocultos.
// prefers-reduced-motion já é tratado de forma global em styles.css
// (`@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`).
function initCrowd() {
  const crowdContainer = document.getElementById('stadium-crowd');
  if (!crowdContainer || crowdContainer.childElementCount > 0) return;

  const NUMERO_DE_TORCEDORES = 90; // volume visual suficiente sem pesar no navegador
  const CORES_TORCIDA = ['#e0343b', '#3a5fcd', '#fffdf6', '#2e9e5b', '#ffc63b'];

  for (let i = 0; i < NUMERO_DE_TORCEDORES; i++) {
    const fan = document.createElement('div');
    fan.className = 'fan';
    fan.style.backgroundColor = CORES_TORCIDA[Math.floor(Math.random() * CORES_TORCIDA.length)];
    fan.style.animationDelay = (Math.random() * 2) + 's';
    crowdContainer.appendChild(fan);
  }
}

// Chamada por chutar() (abaixo) no instante em que a cobrança termina.
// resultado: 'gol' | 'erro'.
let reacaoTorcidaTimeoutId = null;
function reacaoTorcida(resultado) {
  const crowdContainer = document.getElementById('stadium-crowd');
  if (!crowdContainer) return;

  crowdContainer.classList.remove('cheering', 'disappointed');
  if (resultado === 'gol') {
    crowdContainer.classList.add('cheering');
  } else if (resultado === 'erro') {
    crowdContainer.classList.add('disappointed');
  }

  clearTimeout(reacaoTorcidaTimeoutId);
  reacaoTorcidaTimeoutId = setTimeout(function() {
    crowdContainer.classList.remove('cheering', 'disappointed');
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrowd);
} else {
  initCrowd();
}

function criarJogoPenalti(containerId, selecaoId) {
  let cena = null;
  let bola = null;
  let goleiro = null;
  let rede = null;
  let batedor = null;
  let quadrilChute = null;
  let emAnimacao = false;

  // Seleção escolhida (HU-02/HU-16) define a camisa do batedor. Se a
  // seleção não for encontrada, usa uma camisa neutra sem erro (CA-16.7).
  let selecaoEscolhida = null;
  if (typeof SELECOES !== 'undefined' && Array.isArray(SELECOES)) {
    selecaoEscolhida = SELECOES.find(function(s) { return s.id === selecaoId; }) || null;
  }
  const corCamisaPrimaria = corHexParaNumero(selecaoEscolhida && selecaoEscolhida.corPrimaria, CAMISA_PRIMARIA_PADRAO);
  const corCamisaSecundaria = corHexParaNumero(selecaoEscolhida && selecaoEscolhida.corSecundaria, CAMISA_SECUNDARIA_PADRAO);

  class CenaPenalti extends Phaser.Scene {
    constructor() {
      super('CenaPenalti');
    }

    create() {
      cena = this;

      // Campo
      this.add.rectangle(LARGURA_JOGO / 2, ALTURA_JOGO / 2, LARGURA_JOGO, ALTURA_JOGO, 0x2e9e5b);
      for (let i = 0; i < 5; i++) {
        this.add.rectangle(LARGURA_JOGO / 2, 40 + i * 70, LARGURA_JOGO, 6, 0x000000, 0.05);
      }

      // Trave (gol) — de x160 a x480, y20 a y140
      const golX = LARGURA_JOGO / 2;
      const golY = 80;
      this.add.rectangle(golX, golY, 320, 120, 0xfffdf6, 0.12).setStrokeStyle(6, 0xfffdf6);

      // Rede
      rede = this.add.graphics();
      rede.lineStyle(1, 0xfffdf6, 0.4);
      for (let x = golX - 160; x <= golX + 160; x += 20) {
        rede.lineBetween(x, golY - 60, x, golY + 60);
      }
      for (let y = golY - 60; y <= golY + 60; y += 15) {
        rede.lineBetween(golX - 160, y, golX + 160, y);
      }
      rede.setPosition(0, 0);

      // Marca do pênalti
      this.add.circle(POSICAO_INICIAL_BOLA.x, POSICAO_INICIAL_BOLA.y, 4, 0xfffdf6);

      // Goleiro
      goleiro = this.add.container(POSICAO_INICIAL_GOLEIRO.x, POSICAO_INICIAL_GOLEIRO.y);
      const corpoGoleiro = this.add.rectangle(0, 0, 34, 46, 0x21303b, 1).setStrokeStyle(3, 0xfffdf6);
      const cabecaGoleiro = this.add.circle(0, -32, 14, 0xe8b98c);
      goleiro.add([corpoGoleiro, cabecaGoleiro]);

      // ---------- HU-18: Personagem batedor (veste a camisa da seleção) ----------
      // Fica mais perto da "câmera" que o goleiro, então é desenhado maior.
      batedor = this.add.container(POSICAO_INICIAL_BATEDOR.x, POSICAO_INICIAL_BATEDOR.y);
      const pernaApoio = this.add.rectangle(6, 10, 9, 22, 0xe8b98c).setOrigin(0.5, 0);
      quadrilChute = this.add.container(-6, 8);
      const pernaChute = this.add.rectangle(0, 0, 9, 22, 0xe8b98c).setOrigin(0.5, 0);
      quadrilChute.add(pernaChute);
      const calcao = this.add.rectangle(0, 2, 28, 10, corCamisaSecundaria).setOrigin(0.5, 0);
      const corpoBatedor = this.add.rectangle(0, -18, 26, 30, corCamisaPrimaria, 1).setStrokeStyle(2, corCamisaSecundaria);
      const cabecaBatedor = this.add.circle(0, -38, 10, 0xe8b98c);
      batedor.add([pernaApoio, quadrilChute, calcao, corpoBatedor, cabecaBatedor]);

      // Bola — um container com uma marca escura fora do centro, para o
      // giro em voo (HU-12) ficar visível em vez de invisível numa bola lisa.
      bola = this.add.container(POSICAO_INICIAL_BOLA.x, POSICAO_INICIAL_BOLA.y);
      const baseBola = this.add.circle(0, 0, 12, 0xfffdf6).setStrokeStyle(2, 0x21303b);
      const marcaBola = this.add.circle(4, -4, 3, 0x21303b);
      bola.add([baseBola, marcaBola]);
    }
  }

  const config = {
    type: Phaser.AUTO,
    width: LARGURA_JOGO,
    height: ALTURA_JOGO,
    parent: containerId,
    backgroundColor: '#2e9e5b',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
    },
    scene: [CenaPenalti]
  };

  const jogo = new Phaser.Game(config);

  function resetarBola() {
    if (!bola || !goleiro) return;
    bola.setPosition(POSICAO_INICIAL_BOLA.x, POSICAO_INICIAL_BOLA.y);
    bola.angle = 0;
    goleiro.setPosition(POSICAO_INICIAL_GOLEIRO.x, POSICAO_INICIAL_GOLEIRO.y);
    goleiro.setScale(1, 1);
    if (quadrilChute) quadrilChute.angle = 0;
  }

  // Anima a "perna de chute" do batedor (HU-18) e só chama `aoContato`
  // (que dispara o movimento da bola/goleiro) no instante em que o pé
  // encosta na bola — a bola nunca sai do lugar antes disso (CA-18.3).
  function animarChuteBatedor(aoContato) {
    if (!cena || !quadrilChute) { aoContato(); return; }
    cena.tweens.add({
      targets: quadrilChute,
      angle: 16,
      duration: 90,
      ease: 'Sine.easeOut',
      onComplete: function() {
        cena.tweens.add({
          targets: quadrilChute,
          angle: -55,
          duration: 130,
          ease: 'Cubic.easeIn',
          onComplete: function() {
            aoContato();
            cena.tweens.add({
              targets: quadrilChute,
              angle: 0,
              duration: 260,
              delay: 80,
              ease: 'Sine.easeOut'
            });
          }
        });
      }
    });
  }

  // Chuta a bola na zona escolhida. `correta` decide o resultado:
  // certa -> o goleiro pula para outra zona (gol); errada -> o goleiro
  // pula exatamente para a zona chutada (defesa). Sem sorteio: o resultado
  // sempre reflete se a criança acertou a conta.
  function chutar(zonaId, correta, aoFinalizar) {
    if (emAnimacao || !cena || !bola || !goleiro) return;
    const destinoBola = ZONAS[zonaId];
    if (!destinoBola) return;
    emAnimacao = true;

    let destinoGoleiro;
    if (correta) {
      const outrasZonas = Object.keys(ZONAS).filter(id => id !== zonaId);
      const zonaEscolhida = outrasZonas[Math.floor(Math.random() * outrasZonas.length)];
      destinoGoleiro = ZONAS[zonaEscolhida];
    } else {
      destinoGoleiro = destinoBola;
    }

    function iniciarMovimentoBolaEGoleiro() {
      cena.tweens.add({
        targets: goleiro,
        x: destinoGoleiro.x,
        y: destinoGoleiro.y,
        duration: 420,
        ease: 'Sine.easeOut',
        onComplete: function() {
          if (!correta) {
            // Pequeno "impacto" de defesa (HU-12): o goleiro encolhe ao
            // segurar a bola, sem alterar resultado nem pontuação (CA-18.4).
            cena.tweens.add({ targets: goleiro, scaleX: 1.12, scaleY: 0.85, duration: 130, yoyo: true });
          }
        }
      });

      // Giro da bola em voo — reforça a sensação de chute real (HU-12).
      cena.tweens.add({
        targets: bola,
        angle: bola.angle + 720,
        duration: 480,
        ease: 'Linear'
      });

      cena.tweens.add({
        targets: bola,
        x: destinoBola.x,
        y: destinoBola.y,
        duration: 480,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          emAnimacao = false;
          if (correta) {
            // Pequena "vibração" da rede ao balançar com o gol (HU-12).
            cena.tweens.add({ targets: rede, scaleX: 1.05, scaleY: 1.05, duration: 130, yoyo: true });
          }
          reacaoTorcida(correta ? 'gol' : 'erro');
          if (aoFinalizar) aoFinalizar({ gol: correta });
          cena.time.delayedCall(950, resetarBola);
        }
      });
    }

    animarChuteBatedor(iniciarMovimentoBolaEGoleiro);
  }

  function destruir() {
    if (jogo) jogo.destroy(true);
  }

  return { chutar, destruir };
}
