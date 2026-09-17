# SPARTAX + Firebase

Banco de dados: **Cloud Firestore** (plano gratuito Spark — sem cartão).
Fotos: salvas **dentro do Firestore** (galeria e notícias em subcoleções,
cada foto num documento — sem limite de 1 MB e sem precisar do Storage pago).

## 1. Criar o projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto** (ex: `spartax-app`).
2. Desative o Google Analytics (opcional) → **Criar projeto**.

## 2. Firestore (banco) — obrigatório

1. Menu **Firestore Database** → **Criar banco de dados** → **Iniciar no modo de produção** → região `southamerica-east1` (São Paulo).
2. Aba **Regras** → apague tudo e cole o conteúdo de `firestore.rules` → **Publicar**.
3. O documento `spartax/site` (+ subcoleções `galeria` e `noticias`) é criado sozinho no primeiro acesso do app.

## 3. Storage (fotos) — OPCIONAL, só com plano Blaze pago

Sem Storage o app funciona normal: as fotos são comprimidas e salvas no
Firestore. Se um dia assinar o Blaze: menu **Storage** → **Começar** → aba
**Regras** → cole `storage.rules` → **Publicar**. O app passa a subir as
fotos pra lá sozinho (com fallback automático se falhar).

## 4. Conectar o app

1. Console → ⚙️ **Configurações do projeto** → **Seus apps** → `</>` (Web) → apelido `spartax-web` → **Registrar**.
2. Copie os valores de `firebaseConfig` e crie o arquivo `.env` na raiz (use `.env.example` de modelo):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Rode `npm run dev`. No painel ADM o selo muda de **MODO LOCAL** para **NUVEM FIREBASE**.

> ⚠️ O `.env` tem as chaves do projeto e **não vai pro git** (está no `.gitignore`).
> No deploy (Vercel/Netlify/Firebase Hosting), cadastre as mesmas variáveis `VITE_FIREBASE_*` no painel do provedor.

## Como funciona no código

- `src/lib/firebase.ts` — inicializa App/Firestore/Storage a partir do `.env`. Sem config, tudo é `null` e o app cai no modo local.
- `src/store/site.tsx` — `SiteProvider` assina o doc `spartax/site` + subcoleções `galeria` e `noticias` em tempo real; escalares salvam com debounce de 800 ms, listas por diff (adicionados/removidos). `localStorage` segue como cache offline.
- `src/store/image.ts` — `processImageFile()` tenta o Storage e, se indisponível (plano gratuito), devolve dataURL comprimido (~800px) salvo no Firestore.
- `firestore.rules` / `storage.rules` — regras prontas pra colar no console.

## Próximo passo sugerido

Proteger a escrita com login: Firebase Authentication (e-mail/senha do diretor) + trocar as regras para `request.auth != null`. O PIN atual continua valendo como trava local.
