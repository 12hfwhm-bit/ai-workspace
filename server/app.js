// 必须在任何模块加载之前加载 .env
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const config = require('./config')
const routes = require('./routes')
const errorHandler = require('./middleware/errorHandler')

// ─── 启动前校验 ─────────────────────────
const missing = config.validate()
if (missing.length > 0) {
  console.error('[Config] 缺少必要环境变量:')
  missing.forEach(msg => console.error(`  ⚠  ${msg}`))
  console.error('[Config] 请检查 .env 文件或系统环境变量后重试')
  process.exit(1)
}

const app = express()

// ─── 中间件 ─────────────────────────────
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── 路由 ───────────────────────────────
app.use('/api', routes)

// ─── 健康检查 ───────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 错误处理 ───────────────────────────
app.use(errorHandler)

// ─── 启动 ───────────────────────────────
const { ensureUserSchema } = require('./migrations/ensureSchema')

async function start() {
  try {
    await ensureUserSchema()
  } catch (err) {
    console.error('[Schema] 数据库结构校验失败:', err.message)
  }

  app.listen(config.port, () => {
    console.log(`[Server] 后端服务已启动 → http://localhost:${config.port}`)
    console.log(`[Server] API 基础路径 → http://localhost:${config.port}/api`)
  })
}

start()
