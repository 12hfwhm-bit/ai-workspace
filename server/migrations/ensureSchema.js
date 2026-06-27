/**
 * 启动时校验并补齐 user 表缺失字段（status、create_time）
 */
const { getPool } = require('../config/db')

async function ensureUserSchema() {
  const pool = getPool()
  const conn = await pool.getConnection()
  try {
    const [columns] = await conn.query('SHOW COLUMNS FROM `user`')
    const names = columns.map(c => c.Field)

    if (!names.includes('status')) {
      await conn.query(
        "ALTER TABLE `user` ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1:启用 0:禁用' AFTER `role`"
      )
      console.log('[Schema] 已添加 user.status 列')
    }

    if (!names.includes('create_time')) {
      await conn.query(
        'ALTER TABLE `user` ADD COLUMN `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `status`'
      )
      console.log('[Schema] 已添加 user.create_time 列')
    }

    await conn.query('UPDATE `user` SET `status` = 1 WHERE `status` IS NULL')
  } finally {
    conn.release()
  }
}

module.exports = { ensureUserSchema }
