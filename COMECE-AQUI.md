# Base para o repositório novo

Este é o **`MathGol-VSCode-v1.5`** — o código de vocês, íntegro — **com o patch
de níveis e Sala do Professor já aplicado**. É só subir inteiro no repositório
de teste novo.

## Como cheguei aqui

Analisei os 10 zips que vocês tinham. Só um continha o projeto completo:

| Zip | Veredito |
|---|---|
| **MathGol-VSCode-v1.5** | ✅ **a base** — único com `carteira.js`, `tutorial.js`, `regras-chute.js`, `game-2d.js` e a loja de vocês |
| MathGol-VSCode-v1.4 / v1.4_1 | parcial — sem carteira, tutorial e loja |
| MathGol-VSCode | meu, antigo |
| MathGol-v8-NIVEIS-SALA | meu — **foi daqui que saíram os arquivos que quebraram o repositório** |
| MathGol-PATCH-niveis-sala | meu — o patch, já aplicado aqui |
| mathgol-3d / -v3 | meus, antigos |
| mathgol-melhorado / -cruzeiro-atualizado | estrutura antiga, sem pasta `JS/` |

Confirmação de que o v1.5 é o estado certo: o `JS/main.js` dele é **byte a byte
igual** ao `main.js` que vocês me mandaram hoje, antes do acidente.

## O que foi aplicado em cima do v1.5

**Arquivos novos (2):**
```
JS/niveis.js   — a escada de 12 níveis
JS/sala.js     — a Sala do Professor
```

**Substituídos (5):**
```
JS/questions.js       JS/banco-questoes.js     ← banco por nível
JS/main.js            HTML/index.html          CSS/styles.css
```

**Editados cirurgicamente (3) — o resto do arquivo intacto:**
```
JS/progressao.js      ESCALAR_DIFICULDADE → PASSO_POR_FASE  (tituloResultado preservado)
JS/firebase-config.js + onSnapshot no import, + 5 funções de sala, + 5 exports
Config/firestore.rules + bloco match /salas/{codigo}
```

**Intocados:** `carteira.js`, `loja.js`, `tutorial.js`, `regras-chute.js`,
`game-2d.js`, `game.js`, `data.js`, `avatar-data.js`, `backup-validacao.js`,
`carregar-externos.js`, `narration.js`, `sfx.js`, `seed-firestore.js`.

## Teste que rodei neste pacote

Servidor local com **todos os arquivos reais** (desta vez sem nenhum stub):

| | |
|---|---|
| 404 locais | **nenhum** |
| Erros de JS | **nenhum** (só CDN, que o meu sandbox bloqueia) |
| Módulos carregados | `Sala`, `NIVEIS`, `Loja`, `Carteira`, `Progressao`, `RegrasChute`, `AVATARES_GRATIS`, `initTutorial` — todos |
| Tela inicial | `tela-menu` |
| Jogar | abre o tutorial (primeira vez) |
| Tutorial / Loja / Entrar na sala / Sou professor / Créditos / Backup | **os 6 respondem** |

O erro `AVATARES_GRATIS is not defined` que derrubava o repositório antigo
**não acontece aqui** — o `avatar-data.js` é o de vocês.

## Antes de subir

1. **Publique as regras** do `Config/firestore.rules` no Console do Firebase.
   Sem isso a coleção `salas` é negada e a sala não funciona.
2. **Apague os 10 zips** da pasta de downloads. Foi a confusão entre eles que
   quebrou o repositório anterior.

## Pendência conhecida

A regra de `salas` é aberta: quem souber o código muda o nível da turma e lê a
lista de alunos. O campo `dono` guarda o uid do professor mas **não é checado**.
A correção está comentada dentro do `firestore.rules`:

```
allow update: if request.auth != null
              && resource.data.dono == request.auth.uid;
```

Não apliquei porque muda comportamento e a decisão é de vocês. É o card **R03**.
