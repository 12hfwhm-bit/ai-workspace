const { spawn } = require('child_process')
const path = require('path')

const ROOT = __dirname
const BACKEND_DIR = path.join(ROOT, 'ai-digital-workspace-server')
const FRONTEND_DIR = path.join(ROOT, 'ai-digital-workspace-client')

console.log('[Dev] Starting backend...')
const backend = spawn('node', ['app.js'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  shell: true,
})

setTimeout(() => {
  console.log('[Dev] Starting frontend...')
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: true,
  })

  process.on('SIGINT', () => {
    backend.kill()
    frontend.kill()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    backend.kill()
    frontend.kill()
    process.exit(0)
  })
}, 3000)

console.log('[Dev] Dev servers started. Press Ctrl+C to stop.')
console.log('[Dev] Backend: http://localhost:3001')
console.log('[Dev] Frontend: http://localhost:5173')
