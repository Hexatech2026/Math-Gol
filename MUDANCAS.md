# O que foi mudado

## 1. Erros do console

- **`favicon.ico` 404** → adicionado `public/favicon.ico` + `<link rel="icon">` no `index.html`.
- **`Firebase indisponível ao criar sessão: Missing or insufficient permissions`** → isso **não é erro de código**, é porque as regras do `firestore.rules` deste projeto (que já liberam leitura/escrita) nunca foram *publicadas* no Firebase de verdade. Pra corrigir, no [Console do Firebase](https://console.firebase.google.com/) do projeto `math-gol`:
  1. Abra **Firestore Database** → verifique se o banco já foi criado (modo *produção*).
  2. Vá em **Regras**, cole o conteúdo de `firestore.rules` (já está pronto neste projeto) e clique em **Publicar**.
  3. Recarregue o jogo — o aviso some.
  
  Se preferir a CLI: `firebase deploy --only firestore:rules` (precisa do Firebase CLI logado no projeto).

## 2. Estrutura de pastas

`public/css/` e `public/js/` foram removidos — todos os arquivos (`styles.css`, `main.js`, `data.js`, etc.) agora ficam direto dentro de `public/`. O `index.html` já foi atualizado pra apontar pros novos caminhos.

`api/_lib/` foi mantido de propósito: no Vercel, todo arquivo dentro de `api/` vira uma rota, exceto os que começam com `_` — por isso os helpers (`firebaseAdmin.js`, `token.js`) precisam ficar numa subpasta com underscore, senão o Vercel tentaria criar rotas `/api/_lib/firebaseAdmin` e `/api/_lib/token` que não fazem sentido.

## 3. Tela de personalizar (apelido + avatar)

A antiga tela "sortear apelido" virou uma tela de **Personalizar**:
- Campo de texto pra digitar o apelido (com sorteio ⚄ ainda disponível), até 20 caracteres, filtrando símbolos indevidos.
- Galeria de avatares com abas por categoria (Mãozinhas, Emojis, Bichinhos, Robôs, Rabiscados, Sorridentes, Pixel Art, Modernos — mesmos estilos do DiceBear vistos no repositório de referência), cada uma com 4 opções fixas pra escolher.
- Ao confirmar, apelido + avatar escolhidos são salvos no Firebase.

Arquivos novos/alterados: `public/avatar-data.js` (categorias), `public/main.js`, `public/index.html`, `public/styles.css`, `api/avatar.js` (agora aceita `?estilo=&seed=` além do modo antigo `?apelido=`).

## 4. Banco de dados no Firestore

Duas coleções (documentadas em `firestore.rules` e `public/firebase-config.js`):

- **`jogadores/{token}`** — conta do jogador: apelido, avatar, e no campo `ultimoResultado` o placar da última partida. Subcoleção `resultados/{id}` guarda o histórico completo de cada fase jogada (as "contas matemáticas").
- **`apelidos/{token}`** — coleção separada só com apelido + avatar, pensada pra facilitar uma futura tela de ranking/moderação sem precisar ler o documento inteiro do jogador.

Tudo continua **anônimo**: sem nome real, sem e-mail, identificado só por um token aleatório salvo no navegador.
