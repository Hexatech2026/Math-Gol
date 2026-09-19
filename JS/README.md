# MathGol

Jogo de pênaltis com matemática para crianças do fundamental. Cada zona do
gol é uma alternativa da pergunta: chutar na zona certa = gol; chutar na
zona errada = o goleiro defende ali mesmo.

100% anônimo: sem nome real, sem e-mail, sem cadastro — só um token
aleatório salvo no navegador (`localStorage`).

## Estrutura do projeto

Todos os arquivos ficam soltos na raiz do repositório — **sem pastas** — pra
ficar fácil de abrir, editar, remover ou sobrescrever qualquer arquivo
direto pelo GitHub, sem precisar navegar por subpastas:

| Arquivo | O que é |
|---|---|
| `index.html` | página principal |
| `styles.css` | todo o CSS |
| `data.js` | listas padrão (apelidos, seleções, dificuldades) + mensagens de resultado |
| `avatar-data.js` | categorias/estilos de avatar (DiceBear) da tela de personalizar |
| `questions.js` | gerador das perguntas de matemática por dificuldade |
| `narration.js` | narração por voz (Web Speech API) |
| `game.js` | cena do pênalti em Phaser 3 |
| `main.js` | navegação entre telas e orquestração do estado do jogo |
| `firebase-config.js` | inicializa o Firebase no navegador e fala com o Firestore |
| `favicon.ico`, `hexatech-logo.png`, `hexatech-logo-hero.png` | imagens |
| `firestore.rules` | regras de segurança do Firestore (publicar no Console) |
| `seed-firestore.js` | script Node que popula o Firestore com o conteúdo inicial (rodar 1x, localmente) |
| `.env.example` | modelo das variáveis de ambiente usadas só pelo `seed-firestore.js` |
| `package.json` | dependências do `seed-firestore.js` (`dotenv`, `firebase-admin`) |

**Não existe mais pasta `api/`.** O jogo fala direto com o Firestore pelo
navegador (via `firebase-config.js`); as antigas funções serverless
(`api/session.js`, `api/progress.js`) não eram mais usadas por nada — eram
sobra de uma versão anterior — então foram removidas. Isso também significa
que o site é **estático puro**: não precisa configurar nenhuma variável de
ambiente pra ele funcionar publicado (as variáveis do `.env` só existem pra
você rodar `npm run seed` na sua máquina).

## O que foi corrigido nesta rodada

1. **Avatares da aba "Bichinhos" quebrados (voltava o círculo com a letra
   "B").** A causa: `avatar-data.js` usava o estilo `critters` pra essa
   categoria, mas **esse estilo não existe** na API do DiceBear (a lista
   oficial de estilos não tem `critters`). Toda imagem dessa aba dava 404 e
   caía no fallback local (círculo colorido com a inicial da seed — e como
   todas as seeds começam com "Bola", sempre aparecia "B"). Troquei para
   `big-ears`, que é um estilo real e válido do DiceBear 10.x. As outras 7
   categorias (`thumbs`, `fun-emoji`, `bottts`, `croodles`, `big-smile`,
   `pixel-art`, `notionists`) já eram estilos válidos — conferi um por um.
2. **`<img id="avatar-img" src="">` na tela de personalizar.** Um `src`
   vazio faz o navegador disparar um evento de erro imediatamente ao
   carregar a página (antes de qualquer JS rodar), o que gera ruído
   desnecessário. Removi o atributo `src` do HTML — a imagem só recebe uma
   URL de verdade quando `main.js` monta o avatar.
3. **Código morto removido:** `api/session.js`, `api/progress.js`,
   `api/_lib/` e `scripts/teste-local.js`. Nenhum desses arquivos era mais
   chamado por nada — o jogo mudou pra falar direto com o Firestore há uma
   atualização, e esses arquivos ficaram pra trás (inclusive com comentário
   desatualizado dizendo "o front-end nunca fala direto com o Firestore",
   que já não é verdade). `scripts/seed-firestore.js` continua existindo
   (é usado de verdade), só que agora na raiz e sem depender de
   `api/_lib/firebaseAdmin.js` — a inicialização do Admin SDK foi
   incorporada nele mesmo.
4. **Pastas eliminadas.** `public/`, `api/`, `api/_lib/` e `scripts/` não
   existem mais — tudo na raiz (ver tabela acima).
5. **Conferido e OK (não eram bugs):** a versão do Firebase JS SDK
   (`12.18.0`) e a versão do Phaser (`3.80.1`) usadas via CDN são válidas e
   atuais; as coordenadas das 5 zonas do gol em `game.js` batem
   exatamente com as posições dos botões em `styles.css`; as regras do
   Firestore (`firestore.rules`) já liberam exatamente as leituras/escritas
   que o código faz.

Se depois de publicar isso você ainda ver algum erro específico no console,
me manda a mensagem exata (e em que tela aparece) que eu já reviso
direcionado.

## Firebase — checklist de configuração

1. **Firestore Database** criado no [Console do
   Firebase](https://console.firebase.google.com/) do projeto `math-gol`,
   em modo produção.
2. **Regras publicadas**: Firestore Database → Regras → cole o conteúdo de
   `firestore.rules` → Publicar. (Ou via CLI: `firebase deploy --only
   firestore:rules`.)
3. **Seed das listas de configuração** (`personagens`, `animais`,
   `selecoes`, `dificuldades`):
   ```bash
   npm install          # instala firebase-admin + dotenv
   cp .env.example .env # preencha com as credenciais (Configurações do
                         # projeto > Contas de serviço > Gerar nova chave privada)
   npm run seed
   ```
   Seguro rodar mais de uma vez — sobrescreve, não duplica. Se alguma
   coleção estiver vazia (antes do seed) ou o Firestore ficar indisponível,
   o jogo cai automaticamente nas listas fixas de `data.js` — nada quebra.

## Rodando localmente

Como `firebase-config.js` é carregado como módulo ES (`type="module"`),
**abrir o `index.html` direto com duplo clique não funciona** (o navegador
bloqueia módulos carregados via `file://`). Sirva a pasta por HTTP:

```bash
npx serve .
# ou
python3 -m http.server
```

## Deploy

Site 100% estático, sem passo de build e sem função serverless — qualquer
host de arquivos estáticos serve:

- **Vercel**: importe o repositório, Framework Preset "Other" (ou deixe em
  branco). Vercel detecta o `index.html` na raiz e publica direto, sem
  precisar de `vercel.json`.
- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / `/
  (root)`.

Em ambos os casos não é preciso configurar nenhuma variável de ambiente —
elas só são usadas pelo `seed-firestore.js`, que você roda localmente.
