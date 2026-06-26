const { dbConfig, validate: validateDb } = require('./db')
const { aiConfig, validate: validateAi } = require('./ai')

const config = {
  // ─── 服务 ───────────────────────────────
  port: parseInt(process.env.PORT, 10) || 3001,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // ─── 数据库（MySQL） ────────────────────
  db: dbConfig,

  // ─── AI（DeepSeek） ─────────────────────
  ai: aiConfig,
}

/**
 * 启动前校验——确保关键密钥已配置
 * 在 app.js 入口处调用
 */
function validate() {
  const missing = []

  if (!config.jwtSecret) {
    missing.push('缺少 JWT_SECRET')
  }

  try { validateDb() } catch (e) { missing.push(e.message) }
  try { validateAi() } catch (e) { missing.push(e.message) }

  return missing
}

config.validate = validate

module.exports = config
