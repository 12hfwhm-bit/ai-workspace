/**
 * 数据库初始化脚本
 * 读取 migrations/init.sql 并整体执行（支持多语句）
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

async function run() {
  console.log('[Seed] 开始初始化数据库...')

  // 先连接到 MySQL（不指定 database）
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
    multipleStatements: true,
  })

  const fs = require('fs')
  const path = require('path')
  const sqlPath = path.join(__dirname, 'init.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    await conn.query(sql)
    console.log('  ✓ 建库建表 + 种子数据完成')
  } catch (err) {
    console.error('  ✗ SQL 执行失败:', err.message.substring(0, 200))
    throw err
  }

  await conn.end()
  console.log('[Seed] 数据库初始化完成')
  process.exit(0)
}

run().catch((err) => {
  console.error('[Seed] 初始化失败:', err.message)
  process.exit(1)
})
