import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createServer as createViteServer, mergeConfig } from 'vite'
import {
  GALLERY_DIR,
  OVERLAY_ASSETS,
  discoverMocks,
  injectOverlay,
  publicPrototypeList,
  renderGallery,
  vitrolaHomePlugin,
} from './sala.js'

const PORT = Number(process.env.PORT) || 4170
const HOST = process.env.HOST || '0.0.0.0'
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
  return `<!doctype html><meta charset="utf-8"><title>${escHtml(slug)}</title>
<body style="font:16px/1.45 system-ui;max-width:40rem;margin:3rem auto;padding:0 1.25rem">
<p><a href="/">VITROLA</a></p>
<h1>${escHtml(slug)}</h1>
<p>Este mockup não subiu. Na pasta <code>mocks/${escHtml(slug)}</code> rode <code>npm install</code> e tente de novo.</p>
<pre>${escHtml(message)}</pre>
</body>`
}

function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
      send(res, 200, JSON.stringify(publicPrototypeList(), null, 2), 'application/json; charset=utf-8')
      return
    }

    if (url === '/' || url === '/index.html') {
      send(res, 200, renderGallery())
      return
    }

    if (OVERLAY_ASSETS.has(url)) {
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
