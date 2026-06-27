require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { ensureUserSchema } = require('./ensureSchema')
const { getPool } = require('../config/db')

async function run() {
  console.log('[Fix] 开始修复数据库...')
  try {
    await ensureUserSchema()
    const pool = getPool()
    const [users] = await pool.query('SELECT id, username, role, status FROM `user`')
    console.log('  当前用户列表:')
    users.forEach(u => console.log(`    - [${u.id}] ${u.username} (${u.role}, status=${u.status})`))
  } catch (err) {
    console.error('[Fix] 修复失败:', err.message)
    process.exit(1)
  }
  console.log('[Fix] 数据库修复完成！')
  process.exit(0)
}

run()
