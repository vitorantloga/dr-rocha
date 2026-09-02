const PAPER = '#e8e7e2'
const INK = '#141414'
const PENCIL = '#d21f2b'
const STICKY = '#ffe566'
const STICKY_PAD = 12
const STICKY_MIN_W = 168
const STICKY_MAX_W = 240
const STICKY_LINE = 22
const STICKY_FONT = '600 16px "Schibsted Grotesk", system-ui, sans-serif'
const DB_NAME = 'vitrola-feedback'
const DB_STORE = 'notes'
const MARK = '/vitrola-mark.png'
const CSS = '/overlay.css'
const H2C = '/html2canvas.min.js'
const SHOT = '/modern-screenshot.js'

const ICONS = {
  pencil: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5l5 5-11 11H3.5v-5zM13 6l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>`,
  text: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M12 6v13M8 19h8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/></svg>`,
  save: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 3.5h11.5L19.5 7v13.5h-15z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/><path d="M8.5 3.5V9h8V3.5M8 14.5h8v6.5H8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>`,
  undo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H4v4M4.5 9.5C7 5.5 14 5 18 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>`,
  redo: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8h4v4M19.5 9.5C17 5.5 10 5 6 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/></svg>`,
}

const LABELS = {
  closed: 'Abrir menu VITROLA',
  menu: 'Fechar menu VITROLA',
  annotate: 'Voltar ao menu VITROLA',
  session: 'Voltar ao menu VITROLA',
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function dosDateTime(date) {
  return {
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  }
}

function zipStore(files) {
  const enc = new TextEncoder()
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const name = enc.encode(file.name)
    const data = file.data
    const crc = crc32(data)
    const { date, time } = dosDateTime(file.date)
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)
    locals.push(local, data)
    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    central.set(name, 46)
    centrals.push(central)
    offset += local.length + data.length
  }
  const centralSize = centrals.reduce((sum, chunk) => sum + chunk.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  return new Blob([...locals, ...centrals, eocd], { type: 'application/zip' })
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function stamp(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}

function formatWhen(ms) {
  const date = new Date(ms)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mockSlug() {
  const match = location.pathname.match(/\/mocks\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : 'sala'
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode, start) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, mode)
      const req = start(tx.objectStore(DB_STORE))
      let value
      if (req) {
        req.onsuccess = () => {
          value = req.result
        }
        req.onerror = () => reject(req.error)
      }
      tx.oncomplete = () => resolve(value)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

async function allNotes() {
  const rows = (await withStore('readonly', (store) => store.getAll())) || []
  rows.sort((a, b) => a.createdAt - b.createdAt)
  return rows
}

function putNote(note) {
  return withStore('readwrite', (store) => store.put(note))
}

function deleteNote(id) {
  return withStore('readwrite', (store) => store.delete(id))
}

function clearNotes() {
  return withStore('readwrite', (store) => store.clear())
}

function loadScript(src, isReady) {
  if (isReady()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if (isReady()) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('captura')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('captura'))
    document.head.appendChild(script)
  })
}

function isHomePath() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  return path === '/' || path === '/index.html'
}

function goHome() {
  location.assign('/')
}

function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })
}

function blobToBytes(blob) {
  return blob.arrayBuffer().then((buf) => new Uint8Array(buf))
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.documentElement.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function drawStroke(ctx, points) {
  if (!points.length) return
  ctx.strokeStyle = PENCIL
  ctx.fillStyle = PENCIL
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (points.length < 2) {
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, 1.25, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i].x + points[i + 1].x) / 2
    const my = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my)
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.stroke()
}

function wrapStickyLines(ctx, body, maxWidth) {
  ctx.font = STICKY_FONT
  const lines = []
  for (const paragraph of body.split('\n')) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    if (line) lines.push(line)
  }
  return lines.length ? lines : ['']
}

function stickySize(ctx, mark) {
  if (mark.w && mark.h) return { w: mark.w, h: mark.h }
  const innerMax = STICKY_MAX_W - STICKY_PAD * 2
  const lines = wrapStickyLines(ctx, mark.body, innerMax)
  const textW = Math.max(...lines.map((line) => ctx.measureText(line).width), 0)
  return {
    w: Math.min(STICKY_MAX_W, Math.max(STICKY_MIN_W, Math.ceil(textW) + STICKY_PAD * 2)),
    h: Math.max(96, STICKY_PAD * 2 + lines.length * STICKY_LINE + 6),
  }
}

function drawText(ctx, mark) {
  const { w, h } = stickySize(ctx, mark)
  const lines = wrapStickyLines(ctx, mark.body, w - STICKY_PAD * 2)
  ctx.save()
  ctx.translate(mark.x, mark.y)
  ctx.shadowColor = 'rgba(20, 20, 20, 0.18)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 3
  ctx.fillStyle = STICKY
  ctx.fillRect(0, 0, w, h)
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = INK
  ctx.font = STICKY_FONT
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, STICKY_PAD, STICKY_PAD + i * STICKY_LINE)
  })
  ctx.restore()
}

function boot() {
  if (document.getElementById('vitrola-root')) return

  const host = document.createElement('div')
  host.id = 'vitrola-root'
  const shadow = host.attachShadow({ mode: 'open' })

  shadow.innerHTML = `
    <link rel="stylesheet" href="${CSS}" />
    <button class="disc" type="button" aria-expanded="false" aria-controls="vitrola-panel">
      <img src="${MARK}" alt="" width="56" height="56" />
    </button>
    <div class="tools" role="toolbar" aria-label="Ferramentas de anotação" aria-hidden="true">
      <button class="tool" type="button" data-tool="pencil" aria-pressed="true" aria-label="Lápis" tabindex="-1">${ICONS.pencil}</button>
      <button class="tool" type="button" data-tool="text" aria-pressed="false" aria-label="Texto" tabindex="-1">${ICONS.text}</button>
      <button class="tool" type="button" data-act="save" aria-label="Salvar" tabindex="-1">${ICONS.save}</button>
      <button class="tool" type="button" data-act="undo" aria-label="Desfazer" tabindex="-1">${ICONS.undo}</button>
      <button class="tool" type="button" data-act="redo" aria-label="Refazer" tabindex="-1">${ICONS.redo}</button>
    </div>
    <aside class="panel" id="vitrola-panel" role="dialog" aria-labelledby="vitrola-title">
      <h2 id="vitrola-title" class="live">Menu VITROLA</h2>
      <nav class="menu" aria-label="VITROLA">
        <a class="row" href="/">Home</a>
        <button class="row" type="button" data-go="annotate">Anotar</button>
        <button class="row" type="button" data-go="session">Anotações da sessão <span class="count" hidden></span></button>
      </nav>
      <section class="session" hidden>
        <h2>Anotações da sessão</h2>
        <p class="lede">Prints gravados neste navegador enquanto você avalia os mockups. Ficam na sessão até gerar o zip.</p>
        <p class="empty" hidden></p>
        <ul class="notes"></ul>
        <div class="export">
          <p>As imagens serão baixadas neste computador. A sessão será limpa e você volta para a home da VITROLA.</p>
          <button class="act" type="button" data-act="zip">Gerar zip</button>
        </div>
      </section>
    </aside>
    <canvas class="board" hidden></canvas>
    <div class="live" aria-live="polite"></div>
  `

  const isHome = isHomePath()
  host.dataset.mode = 'closed'
  if (isHome) host.dataset.home = ''
  host.setAttribute('data-html2canvas-ignore', '')
  document.body.appendChild(host)

  const disc = shadow.querySelector('.disc')
  const panel = shadow.querySelector('.panel')
  const menu = shadow.querySelector('.menu')
  const tools = shadow.querySelector('.tools')
  const session = shadow.querySelector('.session')
  const board = shadow.querySelector('.board')
  const notesEl = shadow.querySelector('.notes')
  const emptyEl = shadow.querySelector('.empty')
  const countEl = shadow.querySelector('.count')
  const zipBtn = shadow.querySelector('[data-act="zip"]')
  const live = shadow.querySelector('div.live')
  const ctx = board.getContext('2d')

  let mode = 'closed'
  let tool = 'pencil'
  let marks = []
  let undone = []
  let draft = null
  let composer = null
  let drawing = false
  let notesCache = []
  let objectUrls = []
  let saving = false
  let zipping = false

  panel.inert = true

  function say(message) {
    live.textContent = ''
    live.textContent = message
  }

  function syncCount() {
    const n = notesCache.length
    countEl.hidden = n === 0
    countEl.textContent = n ? String(n) : ''
    const homeCount = document.querySelector('[data-vitrola-count]')
    if (homeCount) {
      homeCount.hidden = n === 0
      homeCount.textContent = n ? String(n) : ''
    }
    zipBtn.disabled = n === 0 || zipping
  }

  function syncHistory() {
    const undoBtn = tools.querySelector('[data-act="undo"]')
    const redoBtn = tools.querySelector('[data-act="redo"]')
    undoBtn.disabled = marks.length === 0
    redoBtn.disabled = undone.length === 0
    undoBtn.setAttribute('aria-disabled', undoBtn.disabled ? 'true' : 'false')
    redoBtn.setAttribute('aria-disabled', redoBtn.disabled ? 'true' : 'false')
  }

  function fitBoard() {
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    board.width = Math.round(w * dpr)
    board.height = Math.round(h * dpr)
    board.style.width = `${w}px`
    board.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, board.width, board.height)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const mark of marks) {
      if (mark.type === 'stroke') drawStroke(ctx, mark.points)
      if (mark.type === 'text') drawText(ctx, mark)
    }
    if (draft?.type === 'stroke') drawStroke(ctx, draft.points)
  }

  function closeComposer(commit) {
    if (!composer) return
    const body = composer.value.replace(/\s+$/g, '')
    const x = Number(composer.dataset.x)
    const y = Number(composer.dataset.y)
    const w = composer.offsetWidth
    const h = composer.offsetHeight
    composer.remove()
    composer = null
    if (commit && body) {
      marks.push({ type: 'text', x, y, body, w, h })
      undone = []
      redraw()
      syncHistory()
    }
  }

  function openComposer(x, y) {
    closeComposer(true)
    const width = STICKY_MIN_W
    const height = 96
    const left = Math.min(Math.max(12, x), Math.max(12, window.innerWidth - width - 12))
    const top = Math.min(Math.max(12, y), Math.max(12, window.innerHeight - height - 12))
    composer = document.createElement('textarea')
    composer.className = 'composer'
    composer.dataset.x = String(left)
    composer.dataset.y = String(top)
    composer.rows = 3
    composer.setAttribute('aria-label', 'Texto do post-it')
    composer.style.left = `${left}px`
    composer.style.top = `${top}px`
    shadow.appendChild(composer)
    composer.focus()
    composer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeComposer(false)
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        closeComposer(true)
      }
    })
    composer.addEventListener('blur', () => closeComposer(true))
  }

  function setTool(next) {
    tool = next
    host.dataset.tool = next
    tools.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.tool === next ? 'true' : 'false')
    })
    if (next !== 'text') closeComposer(true)
  }

  function setMode(next) {
    if (next !== 'annotate') closeComposer(true)
    if (isHome && next === 'annotate') next = 'closed'
    mode = next
    host.dataset.mode = next
    disc.setAttribute('aria-expanded', next === 'closed' ? 'false' : 'true')
    disc.setAttribute('aria-label', LABELS[next])
    panel.inert = next === 'closed'
    menu.hidden = next !== 'menu'
    session.hidden = next !== 'session'
    board.hidden = next !== 'annotate'
    tools.setAttribute('aria-hidden', next === 'annotate' ? 'false' : 'true')
    tools.querySelectorAll('button').forEach((btn) => {
      btn.tabIndex = next === 'annotate' ? 0 : -1
    })
    if (next === 'annotate') {
      fitBoard()
      redraw()
      syncHistory()
      setTool(tool)
    }
    if (next === 'session') renderSession()
  }

  function toggleDisc() {
    if (mode === 'closed') setMode('menu')
    else if (mode === 'menu') setMode('closed')
    else if (isHome) setMode('closed')
    else setMode('menu')
  }

  async function refreshNotes() {
    try {
      notesCache = await allNotes()
    } catch {
      notesCache = []
      say('Não foi possível ler as anotações gravadas neste navegador.')
    }
    syncCount()
  }

  function revokeUrls() {
    for (const url of objectUrls) URL.revokeObjectURL(url)
    objectUrls = []
  }

  function renderSession() {
    revokeUrls()
    notesEl.replaceChildren()
    emptyEl.hidden = notesCache.length > 0
    emptyEl.textContent =
      'Ainda não há anotações nesta sessão. Em Anotar, desenhe ou escreva sobre o mockup e grave.'
    zipBtn.disabled = notesCache.length === 0 || zipping
    notesCache.forEach((note, index) => {
      const url = URL.createObjectURL(note.blob)
      objectUrls.push(url)
      const item = document.createElement('li')
      item.className = 'note'
      const img = document.createElement('img')
      img.src = url
      img.alt = `Anotação ${index + 1} de ${note.slug || 'mockup'}`
      const footer = document.createElement('footer')
      const meta = document.createElement('p')
      meta.className = 'meta'
      meta.textContent = `${note.slug || 'mockup'} · ${formatWhen(note.createdAt)}`
      const remove = document.createElement('button')
      remove.className = 'ghost'
      remove.type = 'button'
      remove.textContent = 'Remover'
      remove.addEventListener('click', async () => {
        await deleteNote(note.id)
        await refreshNotes()
        renderSession()
        say('Anotação removida.')
      })
      footer.append(meta, remove)
      item.append(img, footer)
      notesEl.append(item)
    })
  }

  function paintNotes(pageCanvas) {
    const out = document.createElement('canvas')
    out.width = pageCanvas.width
    out.height = pageCanvas.height
    const outCtx = out.getContext('2d')
    outCtx.imageSmoothingEnabled = true
    outCtx.imageSmoothingQuality = 'high'
    outCtx.drawImage(pageCanvas, 0, 0)
    outCtx.drawImage(board, 0, 0, out.width, out.height)
    return new Promise((resolve, reject) => {
      out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/png')
    })
  }

  async function captureWithHtml2Canvas(viewW, viewH, scale, bg) {
    await loadScript(H2C, () => typeof window.html2canvas === 'function')
    return window.html2canvas(document.documentElement, {
      backgroundColor: bg,
      scale,
      width: viewW,
      height: viewH,
      windowWidth: viewW,
      windowHeight: viewH,
      x: window.scrollX,
      y: window.scrollY,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false,
      imageTimeout: 8000,
      ignoreElements: (el) => el === host || el.id === 'vitrola-root',
      onclone: (doc) => {
        doc.getElementById('vitrola-root')?.remove()
      },
    })
  }

  async function captureWithModernScreenshot(viewW, viewH, scale, bg) {
    await loadScript(SHOT, () => Boolean(window.modernScreenshot))
    const layoutW = document.documentElement.clientWidth || viewW
    const scrollH = Math.max(document.documentElement.scrollHeight, viewH, 1)
    const full = await window.modernScreenshot.domToCanvas(document.documentElement, {
      width: layoutW,
      height: scrollH,
      scale,
      backgroundColor: bg,
      filter: (node) => node !== host && node.id !== 'vitrola-root',
    })
    const rx = full.width / layoutW
    const ry = full.height / scrollH
    const sx = Math.max(0, Math.round(window.scrollX * rx))
    const sy = Math.max(0, Math.round(window.scrollY * ry))
    const sw = Math.max(1, Math.min(full.width - sx, Math.round(viewW * rx)))
    const sh = Math.max(1, Math.min(full.height - sy, Math.round(viewH * ry)))
    const cropped = document.createElement('canvas')
    cropped.width = Math.max(1, Math.round(viewW * scale))
    cropped.height = Math.max(1, Math.round(viewH * scale))
    const ctx2 = cropped.getContext('2d')
    ctx2.fillStyle = bg
    ctx2.fillRect(0, 0, cropped.width, cropped.height)
    ctx2.drawImage(full, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height)
    return cropped
  }

  async function capturePage() {
    host.setAttribute('data-capturing', '')
    const viewW = window.innerWidth
    const viewH = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const scale = Math.min(2, dpr)
    const bg = getComputedStyle(document.body).backgroundColor || '#ffffff'
    try {
      try {
        if (document.fonts?.ready) await document.fonts.ready
      } catch {
        /* ignore */
      }
      await waitTwoFrames()
      let page
      try {
        page = await captureWithHtml2Canvas(viewW, viewH, scale, bg)
      } catch {
        page = await captureWithModernScreenshot(viewW, viewH, scale, bg)
      }
      return await paintNotes(page)
    } finally {
      host.removeAttribute('data-capturing')
    }
  }

  async function captureFallback() {
    const out = document.createElement('canvas')
    out.width = board.width
    out.height = board.height
    const outCtx = out.getContext('2d')
    outCtx.fillStyle = PAPER
    outCtx.fillRect(0, 0, out.width, out.height)
    outCtx.drawImage(board, 0, 0)
    return new Promise((resolve, reject) => {
      out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/png')
    })
  }

  async function saveNote() {
    if (saving) return
    closeComposer(true)
    if (!marks.length) {
      say('Desenhe ou escreva alguma coisa antes de gravar.')
      return
    }
    saving = true
    const saveBtn = tools.querySelector('[data-act="save"]')
    saveBtn.disabled = true
    say('A gravar…')
    try {
      let blob
      try {
        blob = await capturePage()
      } catch {
        blob = await captureFallback()
      }
      await putNote({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        href: location.pathname,
        slug: mockSlug(),
        blob,
      })
      marks = []
      undone = []
      draft = null
      redraw()
      syncHistory()
      await refreshNotes()
      say('Anotação gravada nesta sessão.')
      setMode('menu')
    } catch {
      say('Não foi possível gravar a tela. Tente de novo.')
    } finally {
      saving = false
      saveBtn.disabled = false
    }
  }

  async function exportZip() {
    if (zipping || !notesCache.length) return
    zipping = true
    zipBtn.disabled = true
    zipBtn.textContent = 'A gerar zip…'
    say('A gerar zip…')
    try {
      const files = []
      for (const [index, note] of notesCache.entries()) {
        files.push({
          name: `${note.slug || 'mockup'}-${pad(index + 1)}.png`,
          data: await blobToBytes(note.blob),
          date: new Date(note.createdAt),
        })
      }
      const zip = zipStore(files)
      downloadBlob(zip, `feedback-vitrola-mockups[${stamp()}].zip`)
      await clearNotes()
      await refreshNotes()
      say('Zip baixado. A sessão está limpa.')
      await new Promise((resolve) => setTimeout(resolve, 400))
      goHome()
    } catch {
      say('Não foi possível gerar o zip. As anotações continuam nesta sessão.')
    } finally {
      zipping = false
      zipBtn.textContent = 'Gerar zip'
      syncCount()
    }
  }

  function pointFromEvent(event) {
    return { x: event.clientX, y: event.clientY }
  }

  board.addEventListener('pointerdown', (event) => {
    if (mode !== 'annotate' || event.button !== 0) return
    if (tool === 'text') {
      event.preventDefault()
      openComposer(event.clientX, event.clientY)
      return
    }
    event.preventDefault()
    try {
      board.setPointerCapture(event.pointerId)
    } catch {
      /* untrusted events and already-captured pointers */
    }
    drawing = true
    draft = { type: 'stroke', points: [pointFromEvent(event)] }
    redraw()
  })

  board.addEventListener('pointermove', (event) => {
    if (!drawing || !draft) return
    const last = draft.points[draft.points.length - 1]
    const next = pointFromEvent(event)
    if (Math.hypot(next.x - last.x, next.y - last.y) < 0.8) return
    draft.points.push(next)
    redraw()
  })

  function endStroke(event) {
    if (!drawing) return
    drawing = false
    try {
      board.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    if (draft?.points?.length) {
      marks.push(draft)
      undone = []
    }
    draft = null
    redraw()
    syncHistory()
  }

  board.addEventListener('pointerup', endStroke)
  board.addEventListener('pointercancel', endStroke)

  disc.addEventListener('click', toggleDisc)

  menu.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]')
    if (!go) return
    setMode(go.dataset.go)
  })

  tools.addEventListener('click', (event) => {
    const btn = event.target.closest('button')
    if (!btn || btn.disabled) return
    if (btn.dataset.tool) setTool(btn.dataset.tool)
    if (btn.dataset.act === 'save') saveNote()
    if (btn.dataset.act === 'undo' && marks.length) {
      closeComposer(false)
      undone.push(marks.pop())
      redraw()
      syncHistory()
    }
    if (btn.dataset.act === 'redo' && undone.length) {
      marks.push(undone.pop())
      redraw()
      syncHistory()
    }
  })

  zipBtn.addEventListener('click', exportZip)

  document.querySelector('[data-vitrola="session"]')?.addEventListener('click', () => {
    setMode('session')
  })

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (mode !== 'menu') return
      if (event.composedPath().includes(host)) return
      setMode('closed')
    },
    true,
  )

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (composer) return
      if (mode === 'annotate' || mode === 'session') setMode(isHome ? 'closed' : 'menu')
      else if (mode === 'menu') setMode('closed')
      return
    }
    if (mode !== 'annotate') return
    const key = event.key.toLowerCase()
    const meta = event.ctrlKey || event.metaKey
    if (meta && key === 's') {
      event.preventDefault()
      saveNote()
    }
    if (meta && key === 'z' && !event.shiftKey) {
      event.preventDefault()
      if (marks.length) {
        undone.push(marks.pop())
        redraw()
        syncHistory()
      }
    }
    if (meta && (key === 'y' || (key === 'z' && event.shiftKey))) {
      event.preventDefault()
      if (undone.length) {
        marks.push(undone.pop())
        redraw()
        syncHistory()
      }
    }
  })

  window.addEventListener('resize', () => {
    if (mode !== 'annotate') return
    fitBoard()
    redraw()
  })

  refreshNotes()
  setMode('closed')
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()
