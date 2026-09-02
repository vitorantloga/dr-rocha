import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const ROOT = __dirname
export const MOCKS_DIR = path.join(__dirname, 'mocks')
export const GALLERY_DIR = path.join(__dirname, 'gallery')
export const SKIP = new Set(['node_modules', 'dist', '.git'])

export const OVERLAY_ASSETS = new Set([
  '/styles.css',
  '/overlay.css',
  '/overlay.js',
  '/html2canvas.min.js',
  '/modern-screenshot.js',
  '/vitrola-mark.png',
])

export const OVERLAY_HEAD = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" />
<script type="module" src="/overlay.js"></script>`

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function isViteApp(dir) {
  return ['vite.config.js', 'vite.config.mjs', 'vite.config.ts'].some((name) =>
    fs.existsSync(path.join(dir, name)),
  )
}

function humanize(slug) {
  return slug.replace(/[-_]+/g, ' ')
}

export function listMockFolders(mocksDir = MOCKS_DIR) {
  if (!fs.existsSync(mocksDir)) return []
  return fs
    .readdirSync(mocksDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) return false
      if (SKIP.has(entry.name)) return false
      return true
    })
    .map((entry) => ({ slug: entry.name, dir: path.join(mocksDir, entry.name) }))
}

export function discoverMocks(mocksDir = MOCKS_DIR) {
  return listMockFolders(mocksDir)
    .map(({ slug, dir }) => {
      const meta = readJson(path.join(dir, 'prototype.json'), {})
      const hasIndex = fs.existsSync(path.join(dir, 'index.html'))
      const vite = isViteApp(dir)
      return {
        slug,
        dir,
        title: meta.title || humanize(slug),
        summary: meta.summary || '',
        status: meta.status || '',
        hidden: Boolean(meta.hidden),
        kind: vite ? 'vite' : 'static',
        servable: hasIndex || vite,
        href: `/mocks/${encodeURIComponent(slug)}/`,
      }
    })
    .filter((mock) => mock.servable && !mock.hidden)
    .sort((a, b) => a.slug.localeCompare(b.slug, 'en', { numeric: true }))
}

export function listMarkup(mocks) {
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

export function injectOverlay(html) {
  if (!html || html.includes('/overlay.js')) return html
  if (html.includes('</head>')) {
    return html.replace('</head>', `${OVERLAY_HEAD}\n</head>`)
  }
  return `${OVERLAY_HEAD}\n${html}`
}

export function vitrolaHomePlugin() {
  return {
    name: 'vitrola-overlay',
    transformIndexHtml(html) {
      return injectOverlay(html)
    },
  }
}

export function renderGallery() {
  const client = readJson(path.join(__dirname, 'client.json'), {
    studio: 'VITROLA',
    trade: 'Fábrica de software web',
    client: 'Cliente',
    heading: 'Protótipos para avaliação',
    lede: '',
  })
  const mocks = discoverMocks()
  const template = fs.readFileSync(path.join(GALLERY_DIR, 'index.html'), 'utf8')
  return injectOverlay(
    template
      .replaceAll('{{studio}}', esc(client.studio))
      .replaceAll('{{trade}}', esc(client.trade))
      .replaceAll('{{client}}', esc(client.client))
      .replaceAll('{{heading}}', esc(client.heading))
      .replaceAll('{{lede}}', esc(client.lede))
      .replace('<!-- @prototypes -->', listMarkup(mocks)),
  )
}

export function publicPrototypeList() {
  return discoverMocks().map(({ dir, ...mock }) => mock)
}
