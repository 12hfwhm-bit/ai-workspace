const { getPool } = require('./config/db')

async function test() {
  console.log('[Test] 测试数据库连接...')
  try {
    const pool = getPool()
    console.log('[Test] 获取连接池成功')
    
    const conn = await pool.getConnection()
    console.log('[Test] 获取连接成功')
    
    const [rows] = await conn.query('SELECT 1 + 1 AS solution')
    console.log('[Test] 查询测试成功:', rows[0].solution)
    
    console.log('[Test] 检查 user 表...')
    try {
      const [users] = await conn.query('SELECT * FROM user LIMIT 5')
      console.log('[Test] user 表存在，有', users.length, '个用户')
      users.forEach(u => console.log('  -', u.id, u.username, u.role))
    } catch (tableErr) {
      console.log('[Test] user 表可能不存在，错误:', tableErr.message)
    }
    
    conn.release()
    console.log('[Test] 连接已释放')
  } catch (err) {
    console.error('[Test] 错误:', err.message)
    console.error(err.stack)
  }
}

test()
