import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer, mergeConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 4170
const HOST = process.env.HOST || '0.0.0.0'
const MOCKS_DIR = path.join(__dirname, 'mocks')
const GALLERY_DIR = path.join(__dirname, 'gallery')
const SKIP = new Set(['node_modules', 'dist', '.git'])
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function isViteApp(dir) {
  return ['vite.config.js', 'vite.config.mjs', 'vite.config.ts'].some((name) =>
    fs.existsSync(path.join(dir, name)),
  )
}

function humanize(slug) {
  return slug.replace(/[-_]+/g, ' ')
}

export function discoverMocks(mocksDir = MOCKS_DIR) {
  if (!fs.existsSync(mocksDir)) return []
  return fs
    .readdirSync(mocksDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) return false
      if (SKIP.has(entry.name)) return false
      return true
    })
    .map((entry) => {
      const dir = path.join(mocksDir, entry.name)
      const meta = readJson(path.join(dir, 'prototype.json'), {})
      const hasIndex = fs.existsSync(path.join(dir, 'index.html'))
      const vite = isViteApp(dir)
      return {
        slug: entry.name,
        dir,
        title: meta.title || humanize(entry.name),
        summary: meta.summary || '',
        status: meta.status || '',
        hidden: Boolean(meta.hidden),
        kind: vite ? 'vite' : 'static',
        servable: hasIndex || vite,
        href: `/mocks/${encodeURIComponent(entry.name)}/`,
      }
    })
    .filter((mock) => mock.servable && !mock.hidden)
    .sort((a, b) => a.slug.localeCompare(b.slug, 'en', { numeric: true }))
}

function listMarkup(mocks) {
  if (!mocks.length) {
    return `<li class="rail__empty">Nenhum protótipo em <code>mocks/</code>. Crie uma pasta <code>mockup-04</code> com um <code>index.html</code>.</li>`
  }
  return mocks
    .map((mock, index) => {
      const num = String(index + 1).padStart(2, '0')
      const status = mock.status
        ? `<span class="rail__status">${esc(mock.status)}</span>`
        : ''
      const summary = mock.summary
        ? `<span class="rail__summary">${esc(mock.summary)}</span>`
        : ''
      return `<li>
  <a class="rail__row" href="${esc(mock.href)}">
    <span class="rail__num">${num}</span>
    <span class="rail__id">${esc(mock.slug)}</span>
    <span class="rail__copy">
      <span class="rail__title">${esc(mock.title)}</span>
      ${summary}
    </span>
    ${status}
    <span class="rail__go">Abrir <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg></span>
  </a>
</li>`
    })
    .join('\n')
}

function renderGallery() {
  const client = readJson(path.join(__dirname, 'client.json'), {
    studio: 'VITROLA',
    trade: 'Fábrica de software web',
    client: 'Cliente',
    heading: 'Protótipos para avaliação',
    lede: '',
  })
  const mocks = discoverMocks()
  const template = fs.readFileSync(path.join(GALLERY_DIR, 'index.html'), 'utf8')
  return template
    .replaceAll('{{studio}}', esc(client.studio))
    .replaceAll('{{trade}}', esc(client.trade))
    .replaceAll('{{client}}', esc(client.client))
    .replaceAll('{{heading}}', esc(client.heading))
    .replaceAll('{{lede}}', esc(client.lede))
    .replace('<!-- @prototypes -->', listMarkup(mocks))
}

function injectOverlay(html) {
  if (!html || html.includes('vitrola-home')) return html
  let out = html
  if (out.includes('</head>')) {
    out = out.replace('</head>', `<link rel="stylesheet" href="/overlay.css" />\n</head>`)
  }
  const button = `<a class="vitrola-home" href="/" aria-label="Voltar à sala VITROLA"><img src="/vitrola-mark.png" alt="" width="56" height="56" /></a>`
  if (out.includes('</body>')) {
    out = out.replace('</body>', `${button}\n</body>`)
  } else {
    out += button
  }
  return out
}

function vitrolaHomePlugin() {
  return {
    name: 'vitrola-home',
    transformIndexHtml(html) {
      return injectOverlay(html)
    },
  }
}

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function safeFile(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/')
  const resolved = path.resolve(root, `.${clean}`)
  const rootResolved = path.resolve(root)
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return null
  }
  return resolved
}

function serveFile(res, file) {
  const ext = path.extname(file).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  fs.createReadStream(file)
    .on('error', () => {
      if (!res.writableEnded) res.end()
    })
    .pipe(res)
}

function serveStaticDir(req, res, root, prefix) {
  let urlPath = req.url.split('?')[0]
  if (!urlPath.startsWith(prefix)) return false
  urlPath = urlPath.slice(prefix.length) || '/'
  if (!urlPath.startsWith('/')) urlPath = `/${urlPath}`
  let file = safeFile(root, urlPath)
  if (!file) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8')
    return true
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html')
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const fallback = path.join(root, 'index.html')
    if (fs.existsSync(fallback)) {
      send(res, 200, injectOverlay(fs.readFileSync(fallback, 'utf8')))
      return true
    }
    send(res, 404, 'Not found', 'text/plain; charset=utf-8')
    return true
  }
  if (path.extname(file).toLowerCase() === '.html') {
    send(res, 200, injectOverlay(fs.readFileSync(file, 'utf8')))
    return true
  }
  serveFile(res, file)
  return true
}

async function bootVite(mock, index) {
  try {
    const vite = await createViteServer(
      mergeConfig(
        {
          configFile: ['vite.config.js', 'vite.config.mjs', 'vite.config.ts']
            .map((name) => path.join(mock.dir, name))
            .find((file) => fs.existsSync(file)),
          root: mock.dir,
        },
        {
          base: `/mocks/${mock.slug}/`,
          appType: 'spa',
          plugins: [vitrolaHomePlugin()],
          server: {
            middlewareMode: true,
            hmr: { port: 24700 + index },
            fs: { allow: [mock.dir] },
          },
        },
      ),
    )
    return { slug: mock.slug, vite, error: null }
  } catch (error) {
    console.error(`[${mock.slug}] Vite não subiu: ${error.message}`)
    return { slug: mock.slug, vite: null, error: error.message, dir: mock.dir }
  }
}

function viteErrorPage(slug, message) {
  return `<!doctype html><meta charset="utf-8"><title>${esc(slug)}</title>
<body style="font:16px/1.45 system-ui;max-width:40rem;margin:3rem auto;padding:0 1.25rem">
<p><a href="/">VITROLA</a></p>
<h1>${esc(slug)}</h1>
<p>Este mockup não subiu. Na pasta <code>mocks/${esc(slug)}</code> rode <code>npm install</code> e tente de novo.</p>
<pre>${esc(message)}</pre>
</body>`
}

function lanAddresses() {
  const nets = os.networkInterfaces()
  const out = []
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.internal || (net.family !== 'IPv4' && net.family !== 4)) continue
      out.push(net.address)
    }
  }
  return out
}

async function main() {
  const mocks = discoverMocks()
  const viteApps = []
  for (const [index, mock] of mocks.filter((item) => item.kind === 'vite').entries()) {
    viteApps.push(await bootVite(mock, index))
  }

  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0]

    if (url === '/api/prototypes') {
      const publicList = discoverMocks().map(({ dir, ...mock }) => mock)
      send(res, 200, JSON.stringify(publicList, null, 2), 'application/json; charset=utf-8')
      return
    }

    if (url === '/' || url === '/index.html') {
      send(res, 200, renderGallery())
      return
    }

    if (url === '/styles.css' || url === '/overlay.css' || url === '/vitrola-mark.png') {
      const file = path.join(GALLERY_DIR, path.basename(url))
      if (fs.existsSync(file)) {
        serveFile(res, file)
        return
      }
    }

    if (url === '/favicon.ico') {
      res.writeHead(204)
      res.end()
      return
    }

    for (const app of viteApps) {
      const prefix = `/mocks/${app.slug}`
      if (url === prefix || url.startsWith(`${prefix}/`)) {
        if (!app.vite) {
          send(res, 503, viteErrorPage(app.slug, app.error || 'Vite indisponível'))
          return
        }
        app.vite.middlewares(req, res, () => {
          send(res, 404, 'Not found', 'text/plain; charset=utf-8')
        })
        return
      }
    }

    for (const mock of discoverMocks().filter((item) => item.kind === 'static')) {
      if (serveStaticDir(req, res, mock.dir, `/mocks/${mock.slug}`)) return
    }

    send(res, 404, 'Not found', 'text/plain; charset=utf-8')
  })

  server.listen(PORT, HOST, () => {
    const local = `http://127.0.0.1:${PORT}`
    console.log(`\nVITROLA · sala de protótipos`)
    console.log(`  local   ${local}`)
    for (const ip of lanAddresses()) {
      console.log(`  rede    http://${ip}:${PORT}`)
    }
    console.log('')
    if (!mocks.length) console.log('  (nenhum mockup em mocks/)')
    for (const mock of mocks) {
      console.log(`  ${mock.href.padEnd(28)} ${mock.title}`)
    }
    console.log('')
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
