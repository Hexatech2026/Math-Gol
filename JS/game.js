// Importações (Ajuste conforme os arquivos reais do seu projeto)
// import { sfxGol, sfxErro, sfxTorcida } from './sfx.js';
// import { obterPerguntaAleatoria } from './banco-questoes.js';

let score = 0;
let respostaCorretaAtual = null;
let podeJogar = true;

// Elementos da DOM
const jogadorEl = document.getElementById('jogador');
const bolaEl = document.getElementById('bola');
const goleiroEl = document.getElementById('goleiro');
const crowdContainer = document.getElementById('stadium-crowd');
const txtPergunta = document.getElementById('pergunta-texto');
const containerOpcoes = document.getElementById('opcoes-container');
const placarEl = document.getElementById('score');

// 1. INICIALIZAÇÃO DA TORCIDA 
function initCrowd() {
    crowdContainer.innerHTML = '';
    const numberOfFans = 600; // Quantidade de bonequinhos
    
    // Cores da torcida do Cruzeiro
    const colors = ['#004488', '#ffffff', '#002244', '#0077cc']; 
    
    for (let i = 0; i < numberOfFans; i++) {
        const fan = document.createElement('div');
        fan.classList.add('fan');
        fan.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        // Atraso aleatório para parecer orgânico
        fan.style.animationDelay = `${Math.random() * 2}s`;
        crowdContainer.appendChild(fan);
    }
}

// 2. LÓGICA DO JOGO E MATEMÁTICA
function carregarNovaPergunta() {
    podeJogar = true;
    
    // Resetar posições 2.5D
    jogadorEl.classList.remove('chutando');
    bolaEl.classList.remove('chutada');
    goleiroEl.classList.remove('defendendo');
    
    // Exemplo de geração de pergunta (Substitua pela sua lógica do banco-questoes)
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    respostaCorretaAtual = num1 + num2;
    
    txtPergunta.textContent = `Quanto é ${num1} + ${num2}?`;
    
    // Gerar opções falsas
    const opcoes = [respostaCorretaAtual];
    while(opcoes.length < 3) {
        let opFalsa = respostaCorretaAtual + (Math.floor(Math.random() * 10) - 5);
        if(!opcoes.includes(opFalsa) && opFalsa > 0) opcoes.push(opFalsa);
    }
    
    // Embaralhar
    opcoes.sort(() => Math.random() - 0.5);
    
    // Renderizar botões
    containerOpcoes.innerHTML = '';
    opcoes.forEach(opcao => {
        const btn = document.createElement('button');
        btn.classList.add('btn-opcao');
        btn.textContent = opcao;
        btn.onclick = () => tentarChute(opcao);
        containerOpcoes.appendChild(btn);
    });
}

// 3. RESOLUÇÃO E ANIMAÇÕES 2.5D
function tentarChute(respostaMuda) {
    if (!podeJogar) return;
    podeJogar = false;

    // Inicia a animação do boneco
    jogadorEl.classList.add('chutando');
    
    // Atraso de milissegundos para a bola sair depois da perna bater nela
    setTimeout(() => {
        bolaEl.classList.add('chutada');

        if (respostaMuda === respostaCorretaAtual) {
            // GOL
            score++;
            placarEl.textContent = score;
            reacaoTorcida('gol');
            // Goleiro pula pro lado errado
            goleiroEl.classList.add('defendendo'); 
            
        } else {
            // ERRO
            reacaoTorcida('erro');
            // Goleiro não sai do lugar ou defende
            goleiroEl.style.transform = "rotateX(-60deg) translateX(0px)"; 
        }

        // Aguarda animação terminar para recarregar
        setTimeout(() => {
            carregarNovaPergunta();
        }, 2500);

    }, 200); // 200ms após o chute iniciar
}

// 4. REAÇÃO DA TORCIDA
function reacaoTorcida(resultado) {
    crowdContainer.classList.remove('cheering', 'disappointed');
    
    if (resultado === 'gol') {
        crowdContainer.classList.add('cheering');
        // if(sfxTorcida) sfxTorcida.play();
    } else if (resultado === 'erro') {
        crowdContainer.classList.add('disappointed');
        // if(sfxErro) sfxErro.play();
    }
    
    setTimeout(() => {
        crowdContainer.classList.remove('cheering', 'disappointed');
    }, 3000);
}

// Inicializar Jogo
window.onload = () => {
    initCrowd();
    carregarNovaPergunta();
};