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
// pequenos efeitos de impacto (rede no gol, goleiro na defesa), com uma
// leve variação de escala na bola em voo pra sugerir profundidade.
// HU-17 (torcida animada): arquibancada com balanço contínuo, comemoração
// no gol e lamento na defesa/tempo esgotado; respeita prefers-reduced-motion.
// HU-18 (personagem para o chute): batedor atrás da bola que "chuta" antes
// da bola sair do lugar, vestindo a camisa da seleção escolhida (HU-16).
//
// prefers-reduced-motion: a torcida (idle) já ficava parada; agora as
// animações "de ação" (perna do batedor, mergulho do goleiro, trajetória e
// giro da bola, vibração da rede) também usam duração praticamente zero
// quando o usuário pede menos movimento — a lógica e a ordem dos eventos
// (contato -> resultado -> finalização) continuam as mesmas, só o efeito
// visual contínuo é removido.

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

function criarJogoPenalti(containerId, selecaoId) {
  let cena = null;
  let bola = null;
  let goleiro = null;
  let rede = null;
  let batedor = null;
  let quadrilChute = null;
  let torcida = null;
  let tweenIdleTorcida = null;
  let emAnimacao = false;

  const reduzMovimento = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Duração efetiva de uma animação de ação: quase instantânea (mas ainda
  // assíncrona, pra não quebrar a cadeia de onComplete) quando o usuário
  // pediu menos movimento; a duração normal caso contrário.
  function d(duracaoNormal) {
    return reduzMovimento ? 1 : duracaoNormal;
  }

  // Seleção escolhida (HU-02/HU-16) define a camisa do batedor. Se a
  // seleção não for encontrada, usa uma camisa neutra sem erro (CA-16.7).
  let selecaoEscolhida = null;
  if (typeof SELECOES !== 'undefined' && Array.isArray(SELECOES)) {
    selecaoEscolhida = SELECOES.find(function(s) { return s.id === selecaoId; }) || null;
  }
  const corCamisaPrimaria = corHexParaNumero(selecaoEscolhida && selecaoEscolhida.corPrimaria, CAMISA_PRIMARIA_PADRAO);
  const corCamisaSecundaria = corHexParaNumero(selecaoEscolhida && selecaoEscolhida.corSecundaria, CAMISA_SECUNDARIA_PADRAO);

  // Funções de reação da torcida — atribuídas dentro de create(), chamadas
  // a partir de chutar(). Ficam aqui embaixo para o closure de chutar()
  // enxergar a versão mais recente.
  let comemorarTorcida = function() {};
  let lamentarTorcida = function() {};

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

      // ---------- HU-17: Torcida animada (arquibancada atrás do gol) ----------
      const elementosTorcida = [];
      elementosTorcida.push(this.add.rectangle(LARGURA_JOGO / 2, 9, LARGURA_JOGO, 20, 0x1c2b3a, 1));
      const CORES_TORCIDA = [0xe0343b, 0xffc63b, 0x3a5fcd, 0xfffdf6, 0x2e9e5b];
      for (let i = 0; i < 46; i++) {
        const x = 6 + i * 14;
        elementosTorcida.push(this.add.circle(x, 5, 2.6, CORES_TORCIDA[i % CORES_TORCIDA.length]));
        if (i % 2 === 0) {
          elementosTorcida.push(this.add.circle(x + 7, 13, 2.6, CORES_TORCIDA[(i + 2) % CORES_TORCIDA.length]));
        }
      }
      torcida = this.add.container(0, 0, elementosTorcida);

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

      // Balanço contínuo e leve da torcida (CA-17.2). Em prefers-reduced-motion
      // a torcida fica parada, só reagindo (bem discretamente) a gol/defesa.
      if (!reduzMovimento) {
        tweenIdleTorcida = this.tweens.add({
          targets: torcida,
          y: -3,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      comemorarTorcida = function() {
        if (!torcida || !cena) return;
        if (tweenIdleTorcida) tweenIdleTorcida.pause();
        cena.tweens.add({
          targets: torcida,
          y: -10,
          scaleY: 1.15,
          duration: reduzMovimento ? 0 : 160,
          yoyo: true,
          repeat: reduzMovimento ? 0 : 2,
          ease: 'Sine.easeOut',
          onComplete: function() {
            torcida.setScale(1, 1);
            torcida.y = 0;
            if (tweenIdleTorcida) tweenIdleTorcida.resume();
          }
        });
      };

      lamentarTorcida = function() {
        if (!torcida || !cena) return;
        if (tweenIdleTorcida) tweenIdleTorcida.pause();
        cena.tweens.add({
          targets: torcida,
          y: 4,
          scaleY: 0.92,
          duration: reduzMovimento ? 0 : 220,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: function() {
            torcida.setScale(1, 1);
            torcida.y = 0;
            if (tweenIdleTorcida) tweenIdleTorcida.resume();
          }
        });
      };
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
    bola.setScale(1, 1);
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
      duration: d(90),
      ease: 'Sine.easeOut',
      onComplete: function() {
        cena.tweens.add({
          targets: quadrilChute,
          angle: -55,
          duration: d(130),
          ease: 'Cubic.easeIn',
          onComplete: function() {
            // HU-09: som de chute no instante exato do contato com a bola.
            if (typeof SFX !== 'undefined' && SFX.chute) SFX.chute();
            aoContato();
            cena.tweens.add({
              targets: quadrilChute,
              angle: 0,
              duration: d(260),
              delay: reduzMovimento ? 0 : 80,
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
        duration: d(420),
        ease: 'Sine.easeOut',
        onComplete: function() {
          if (!correta) {
            // Pequeno "impacto" de defesa (HU-12): o goleiro encolhe ao
            // segurar a bola, sem alterar resultado nem pontuação (CA-18.4).
            cena.tweens.add({ targets: goleiro, scaleX: 1.12, scaleY: 0.85, duration: d(130), yoyo: true });
          }
        }
      });

      // Giro da bola em voo — reforça a sensação de chute real (HU-12).
      cena.tweens.add({
        targets: bola,
        angle: bola.angle + 720,
        duration: d(480),
        ease: 'Linear'
      });

      // Pequena sensação de profundidade: a bola "encolhe" levemente ao se
      // afastar do batedor rumo ao gol, como se ganhasse distância da
      // câmera (HU-12).
      cena.tweens.add({
        targets: bola,
        scaleX: 0.78,
        scaleY: 0.78,
        duration: d(480),
        ease: 'Sine.easeIn'
      });

      cena.tweens.add({
        targets: bola,
        x: destinoBola.x,
        y: destinoBola.y,
        duration: d(480),
        ease: 'Cubic.easeOut',
        onComplete: () => {
          emAnimacao = false;
          if (correta) {
            // Pequena "vibração" da rede ao balançar com o gol (HU-12).
            cena.tweens.add({ targets: rede, scaleX: 1.05, scaleY: 1.05, duration: d(130), yoyo: true });
            comemorarTorcida();
          } else {
            lamentarTorcida();
          }
          if (aoFinalizar) aoFinalizar({ gol: correta });
          cena.time.delayedCall(reduzMovimento ? 60 : 950, resetarBola);
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
