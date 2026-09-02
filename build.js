import fs from 'node:fs'
import path from 'node:path'
import { build as viteBuild, mergeConfig } from 'vite'
import {
  GALLERY_DIR,
  OVERLAY_ASSETS,
  ROOT,
  SKIP,
  discoverMocks,
  injectOverlay,
  publicPrototypeList,
  renderGallery,
  vitrolaHomePlugin,
} from './sala.js'

const DIST = path.join(ROOT, 'dist')
const COPY_SKIP = new Set([...SKIP, 'package.json', 'package-lock.json', 'prototype.json'])

function viteConfigFile(dir) {
  return ['vite.config.js', 'vite.config.mjs', 'vite.config.ts']
    .map((name) => path.join(dir, name))
    .find((file) => fs.existsSync(file))
}

function copyGalleryAssets() {
  for (const url of OVERLAY_ASSETS) {
    const name = path.basename(url)
    const src = path.join(GALLERY_DIR, name)
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, name))
  }
}

function copyStaticMock(mock) {
  const dest = path.join(DIST, 'mocks', mock.slug)
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(mock.dir, dest, {
    recursive: true,
    filter(src) {
      const name = path.basename(src)
      if (COPY_SKIP.has(name)) return false
      if (name.startsWith('.')) return false
      if (name.startsWith('vite.config.')) return false
      return true
    },
  })
  injectHtmlTree(dest)
}

function injectHtmlTree(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue
      injectHtmlTree(full)
      continue
    }
    if (path.extname(entry.name).toLowerCase() !== '.html') continue
    const html = fs.readFileSync(full, 'utf8')
    const next = injectOverlay(html)
    if (next !== html) fs.writeFileSync(full, next)
  }
}

async function buildViteMock(mock) {
  const outDir = path.join(DIST, 'mocks', mock.slug)
  await viteBuild(
    mergeConfig(
      {
        configFile: viteConfigFile(mock.dir),
        root: mock.dir,
      },
      {
        base: `/mocks/${mock.slug}/`,
        appType: 'spa',
        plugins: [vitrolaHomePlugin()],
        logLevel: 'warn',
        build: {
          outDir,
          emptyOutDir: true,
        },
      },
    ),
  )
  injectHtmlTree(outDir)
}

async function main() {
  fs.rmSync(DIST, { recursive: true, force: true })
  fs.mkdirSync(path.join(DIST, 'api'), { recursive: true })
  fs.mkdirSync(path.join(DIST, 'mocks'), { recursive: true })

  fs.writeFileSync(path.join(DIST, 'index.html'), renderGallery())
  copyGalleryAssets()
  fs.writeFileSync(
    path.join(DIST, 'api', 'prototypes.json'),
    `${JSON.stringify(publicPrototypeList(), null, 2)}\n`,
  )

  const mocks = discoverMocks()
  if (!mocks.length) console.log('Nenhum mockup em mocks/')

  for (const mock of mocks) {
    process.stdout.write(`  ${mock.href.padEnd(28)} ${mock.title}\n`)
    if (mock.kind === 'vite') {
      try {
        await buildViteMock(mock)
      } catch (error) {
        console.error(`[${mock.slug}] Vite não buildou: ${error.message}`)
        console.error(`Na pasta mocks/${mock.slug} rode npm install e tente de novo.`)
        process.exit(1)
      }
    } else {
      copyStaticMock(mock)
    }
  }

  console.log(`\nBuild em ${path.relative(ROOT, DIST) || 'dist'}/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
