import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { listMockFolders } from './sala.js'

for (const mock of listMockFolders()) {
  const pkg = path.join(mock.dir, 'package.json')
  if (!fs.existsSync(pkg)) continue
  const lock = fs.existsSync(path.join(mock.dir, 'package-lock.json'))
  const cmd = lock ? 'npm ci' : 'npm install'
  console.log(`${cmd} · mocks/${mock.slug}`)
  execSync(cmd, { cwd: mock.dir, stdio: 'inherit' })
}
