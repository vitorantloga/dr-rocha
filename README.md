# Como rodar os protótipos

Este repositório é a **sala de avaliação** da VITROLA para o cliente Dr. Rocha. Um único comando sobe a galeria e os três mockups na mesma porta.

## O que você precisa

- [Node.js 24](https://nodejs.org/) (a Vercel exige `24.x`)
- Um terminal (PowerShell no Windows serve)

Confira a versão:

```bash
node -v
```

Deve aparecer `v24` (por exemplo `v24.11.0`).

## Primeira vez: instalar dependências

Na pasta deste projeto (`prototypes/`), instale o servidor da sala:

```bash
npm install
```

Cada mockup é um app Vite independente e precisa do próprio `npm install` **dentro da pasta**:

```bash
cd mocks/mockup-01
npm install

cd ../mockup-02
npm install

cd ../mockup-03
npm install
```

No PowerShell, a partir da raiz `prototypes/`:

```powershell
npm install
npm run install:mocks
```

Isso só precisa ser feito de novo se alguém adicionar um mockup novo ou mudar o `package.json`.

## Subir a sala

Na raiz `prototypes/`:

```bash
npm start
```

O terminal imprime algo assim:

```
VITROLA · sala de protótipos
  local   http://127.0.0.1:4170
  rede    http://192.168.x.x:4170

  /mocks/mockup-01/          Totem clínico
  /mocks/mockup-02/          Landing ilustrada
  /mocks/mockup-03/          Sala hospitalar
```

Abra o endereço **local** no navegador:

[http://127.0.0.1:4170](http://127.0.0.1:4170)

Para mostrar no celular ou para outra pessoa na mesma Wi-Fi, use o endereço **rede**.

Para parar o servidor, volte ao terminal e pressione `Ctrl+C`.

### Porta diferente

Se a `4170` já estiver ocupada:

```powershell
$env:PORT=4171; npm start
```

No bash:

```bash
PORT=4171 npm start
```

## O que você vê no navegador

1. A página inicial lista os mockups (`Totem clínico`, `Landing ilustrada`, `Sala hospitalar`).
2. Clique em **Abrir** para entrar no mockup.
3. No canto inferior direito aparece o **selo** da VITROLA. Ele abre:
   - **Home** — volta para a lista
   - **Anotar** — lápis e texto sobre a tela
   - **Anotações da sessão** — prints gravados; dá para gerar um zip

O selo aparece com `npm start` (local) e no site publicado. Se abrir um mockup isolado (`npm run dev` na pasta dele), o selo não entra.

## Publicar (GitHub + Vercel)

O **build** roda no GitHub, na `master`. A Vercel **não reconstrói**: só recebe o `dist/` já pronto.

### 1. Secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions**. Crie:

| Secret | Onde pegar |
|--------|------------|
| `VERCEL_TOKEN` | [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel → Project → Settings → General → **Team ID** (ou o `orgId` em `.vercel/project.json` depois de `npx vercel link`) |
| `VERCEL_PROJECT_ID` | A mesma tela, **Project ID** (ou `projectId` no `.vercel/project.json`) |

### 2. Projeto na Vercel

Framework: **Other**. O `vercel.json` já define `outputDirectory: dist`.

Em **Settings → Git**, no **Ignored Build Step**, use `exit 0` (ou deixe o `ignoreCommand` do `vercel.json`). Assim um `git push` **não** dispara build na Vercel. Quem publica é o workflow `.github/workflows/deploy.yml`.

### 3. Conferir

Depois do push na `master`, abra **Actions** no GitHub. O job **Deploy** instala, gera o `dist/` e manda para a Vercel com `vercel deploy --prebuilt`.

Para gerar o site estático na sua máquina:

```bash
npm run build
```

A pasta `dist/` é o que a Vercel publica.

## Trabalhar num mockup sozinho

Útil para editar React/CSS sem subir a sala inteira. Entre na pasta e rode o Vite:

```bash
cd mocks/mockup-01
npm run dev
```

- `mockup-01` — porta `5173` (padrão do Vite)
- `mockup-02` — porta `5174`
- `mockup-03` — porta `5175`

Para mostrar ao cliente, volte a usar `npm start` na raiz.

## Se algo não abrir

| Sintoma | O que fazer |
|---------|-------------|
| `node` não é reconhecido | Instale o Node 24 e abra um terminal novo |
| Página da sala abre, mas o mockup dá erro | Falta `npm install` **dentro** de `mocks/mockup-0X` |
| Porta em uso | Use outra porta com `PORT=4171 npm start` |
| Lista vazia | Confirme que existe `mocks/mockup-0X/index.html` |

## Mockups neste projeto

| Pasta | Título | O quê |
|-------|--------|-------|
| `mocks/mockup-01` | Totem clínico | Jornada do paciente em painel ambulatorial |
| `mocks/mockup-02` | Landing ilustrada | A mesma jornada, com headline e ilustração |
| `mocks/mockup-03` | Sala hospitalar | A mesma jornada, paleta de clínica |

Detalhes de estrutura, `prototype.json` e como adicionar um mockup novo estão em [SPEC.md](SPEC.md).
