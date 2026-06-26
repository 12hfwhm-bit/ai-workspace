/**
 * 数据库配置与连接池
 * 从环境变量读取 MySQL / MariaDB 连接参数，不在此文件写入任何硬编码值
 */
const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
}

function validate() {
  const required = ['host', 'name', 'user', 'password']
  for (const key of required) {
    if (!dbConfig[key]) {
      throw new Error('缺少必要环境变量: DB_' + key.toUpperCase())
    }
  }
}

function getConnectionOptions() {
  return {
    host: dbConfig.host,
    port: dbConfig.port || 3306,
    database: dbConfig.name,
    user: dbConfig.user,
    password: dbConfig.password,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }
}

/** 连接池单例 */
let pool = null

function getPool() {
  if (pool) return pool
  const opts = getConnectionOptions()
  pool = mysql.createPool(opts)
  return pool
}

async function testConnection() {
  const p = getPool()
  const conn = await p.getConnection()
  conn.release()
  return true
}

module.exports = {
  dbConfig,
  validate,
  getConnectionOptions,
  getPool,
  testConnection,
}
