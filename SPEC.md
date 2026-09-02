# Sala de protótipos VITROLA

Este diretório é um repositório próprio. O projeto do cliente (`dr-rocha`) o ignora no `.gitignore`. O padrão se repete em outros clientes: copiar esta estrutura, ajustar `client.json` e soltar mockups em `mocks/`.

## Arranque

```bash
cd prototypes
npm install
node start
```

Um único serviço sobe a sala e todos os mockups, na mesma porta (padrão `4170`, ou `PORT`). No terminal aparecem o endereço local e o endereço na rede, para enviar ao cliente.

Não é preciso subir cada mockup numa porta. Cada um continua com HTML, CSS, dados e dependências independentes.

## Árvore

```
prototypes/
  start.js            # npm start (dev)
  build.js            # npm run build → dist/
  vercel.json         # Vercel só publica dist/; o build é no GitHub
  client.json         # nome da casa, cliente, textos da sala
  gallery/            # índice VITROLA (esta página)
  mocks/
    mockup-01/
    mockup-02/
    mockup-XX/        # basta existir para entrar na lista
```

## Como entra na lista

O `node start` lê as pastas de `mocks/` a cada pedido da página inicial.

Entra na lista qualquer diretório que:

- não comece com `.` ou `_`
- não se chame `node_modules` ou `dist`
- contenha `index.html` (app Vite, pasta estática, ou os dois)

Ordem: nome da pasta, numérico (`mockup-01`, `mockup-02`, `mockup-10`).

Para ocultar um mockup sem apagar: `"hidden": true` no `prototype.json`. A URL direta ainda funciona.

## `prototype.json` (opcional)

Se o arquivo não existir, o índice usa o nome da pasta.

```json
{
  "title": "Totem clínico",
  "summary": "Uma linha sobre o que o cliente vai avaliar.",
  "status": "em revisão",
  "hidden": false
}
```

| Campo     | Obrigatório | Uso                                      |
|-----------|-------------|------------------------------------------|
| `title`   | não         | Título na lista                          |
| `summary` | não         | Frase de apoio                           |
| `status`  | não         | Marca à margem (`em revisão`, `aprovado`)|
| `hidden`  | não         | `true` tira da lista                     |

O identificador visível é sempre o nome da pasta (`mockup-01`). Não renomeie pastas já enviadas ao cliente sem avisar: a URL muda.

## Dois tipos de mockup

### App Vite (React ou outro)

Como os atuais `mockup-01` … `mockup-03`:

```
mocks/mockup-04/
  index.html
  package.json
  vite.config.js
  prototype.json      # opcional
  src/                # o que o mockup precisar
  public/             # opcional
```

O serviço inicia o Vite desse diretório com `base` `/mocks/<pasta>/`. CSS, JS, imagens em `public/` e dados ficam só daquele mockup.

Na primeira vez, instale as dependências **dentro** da pasta:

```bash
cd mocks/mockup-04
npm install
```

Cada mockup tem o próprio `node_modules`. Não compartilhe CSS ou dados entre pastas.

### Pasta estática

```
mocks/mockup-05/
  index.html
  styles.css
  prototype.json      # opcional
```

Qualquer arquivo da pasta é servido em `/mocks/mockup-05/`. Sem `package.json`, sem build.

## URLs

| Caminho              | O quê                         |
|----------------------|-------------------------------|
| `/`                  | Índice VITROLA                |
| `/mocks/mockup-01/`  | Mockup 01                     |
| `/api/prototypes`    | JSON da lista (descoberta)    |

Em cada mockup o serviço injeta o overlay da VITROLA (`/overlay.js`), o mesmo módulo em todos eles, com a mesma sessão no navegador. O selo redondo abre um painel da casa: Home (volta a `/`), Anotar (lápis, texto, gravar, desfazer, refazer) e Anotações da sessão (ver, remover, gerar zip). A home da galeria também tem o link para as anotações da sessão. Gravar tira um print da tela com o desenho e guarda a imagem no IndexedDB do browser. Gerar zip baixa `feedback-vitrola-mockups[ano-mes-dia-hora-min-seg].zip`, limpa a sessão e volta para `/`. Não é preciso colocar o overlay no HTML do mockup — pastas novas recebem-no automaticamente. `npm run dev` dentro da pasta do mockup, isolado, não mostra o selo.

## `client.json`

Textos da página inicial. Em outro cliente, mude `client`, `lede` e o que mais for específico. A mecânica (`start.js`, `mocks/`) permanece.

## Independência

- HTML, CSS, JS e dados de um mockup não vazam para outro.
- O índice não pinta o mockup com o tema da VITROLA. Só o overlay da casa (selo, menu, anotações) é injetado pelo `node start`.
- Portas individuais (`npm run dev` dentro da pasta) continuam válidas para trabalho isolado. Para mostrar ao cliente, use `node start`.

## Disponibilizar

1. `node start` nesta máquina, com o cliente na mesma rede: use o URL `http://<ip>:4170` impresso no terminal.
2. Produção: `npm run build` gera `dist/`. O workflow em `.github/workflows/deploy.yml` faz isso na `master` e envia o resultado pronto para a Vercel (`vercel deploy --prebuilt`). A Vercel não rebuilda.

O `node start` escuta em `0.0.0.0`, de propósito.

## Git

Este diretório tem git próprio. O repositório do produto ignora `prototypes/`. Commits de mockup ficam aqui, não no código do cliente.
