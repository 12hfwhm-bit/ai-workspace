const { getPool } = require('../config/db')
const { success, fail } = require('../utils/response')
const bcrypt = require('bcryptjs')
const OpenAI = require('openai')
const { getRequestOptions } = require('../config/ai')

/** 检查管理员权限 */
function checkAdmin(req) {
  return req.user.role === 'admin'
}
function deny(res) { return res.status(403).json(fail(40004, '仅管理员可操作')) }

/** 1. 用户管理 ============================================ */
async function getUsers(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const pool = getPool()
    const [rows] = await pool.query('SELECT id, username, role, status, create_time FROM `user` ORDER BY id')
    res.json(success(rows))
  } catch (err) {
    next(err)
  }
}

async function updateUserRole(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const { id } = req.params
    const { role } = req.body
    if (!role || !['admin','user'].includes(role)) return res.status(400).json(fail(40002, '角色无效'))
    const pool = getPool()
    await pool.query('UPDATE `user` SET role = ? WHERE id = ?', [role, id])
    res.json(success(null, '角色更新成功'))
  } catch (err) { next(err) }
}

async function toggleUserStatus(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const { id } = req.params
    const { status } = req.body
    if (status !== 0 && status !== 1) return res.status(400).json(fail(40002, '状态值无效'))
    const pool = getPool()
    await pool.query('UPDATE `user` SET status = ? WHERE id = ?', [status, id])
    res.json(success(null, status === 1 ? '用户已启用' : '用户已禁用'))
  } catch (err) { next(err) }
}

/** 2. 系统配置 ============================================ */
async function getSystemConfig(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const pool = getPool()
    const [rows] = await pool.query('SELECT `key`, `value` FROM system_config')
    const config = {}
    rows.forEach(r => { config[r.key] = r.value })
    res.json(success(config))
  } catch (err) { next(err) }
}

async function updateSystemConfig(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const { system_name, primary_color } = req.body
    const pool = getPool()
    if (system_name !== undefined) await pool.query('INSERT INTO system_config (`key`,`value`) VALUES (\'system_name\',?) ON DUPLICATE KEY UPDATE `value`=?', [system_name, system_name])
    if (primary_color !== undefined) await pool.query('INSERT INTO system_config (`key`,`value`) VALUES (\'primary_color\',?) ON DUPLICATE KEY UPDATE `value`=?', [primary_color, primary_color])
    res.json(success(null, '系统配置已更新'))
  } catch (err) { next(err) }
}

/** 3. AI 配置 ============================================ */
async function getAiConfig(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const pool = getPool()
    const [rows] = await pool.query("SELECT `value` FROM system_config WHERE `key`='ai_api_key'")
    const fullKey = rows[0]?.value || ''
    const masked = fullKey.length > 8 ? fullKey.substring(0,4) + '****' + fullKey.substring(fullKey.length-4) : fullKey ? '****' : ''
    const [modelRows] = await pool.query("SELECT `value` FROM system_config WHERE `key`='ai_model'")
    res.json(success({ apiKey: fullKey, apiKeyMasked: masked, model: modelRows[0]?.value || 'deepseek-chat' }))
  } catch (err) { next(err) }
}

async function updateAiConfig(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const { apiKey } = req.body
    if (!apiKey) return res.status(400).json(fail(40002, 'API Key 不能为空'))
    const pool = getPool()
    await pool.query("INSERT INTO system_config (`key`,`value`) VALUES ('ai_api_key',?) ON DUPLICATE KEY UPDATE `value`=?", [apiKey, apiKey])
    res.json(success(null, 'AI 配置已更新'))
  } catch (err) { next(err) }
}

/** 4. 系统统计 ============================================ */
async function getStats(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const pool = getPool()
    const [[row]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM user) AS user_count,
      (SELECT COUNT(*) FROM customer) AS customer_count,
      (SELECT COUNT(*) FROM project) AS project_count,
      (SELECT COUNT(*) FROM ai_history) AS ai_calls`)
    res.json(success(row))
  } catch (err) { next(err) }
}

/** 5. 操作日志 ============================================ */
async function getLogs(req, res, next) {
  try {
    if (!checkAdmin(req)) return deny(res)
    const pool = getPool()
    const [loginLogs] = await pool.query('SELECT id, user_id, username, ip, create_time FROM login_log ORDER BY create_time DESC LIMIT 50')
    const [aiLogs] = await pool.query(`SELECT h.id, h.user_id, u.username, h.type, h.input, h.create_time FROM ai_history h LEFT JOIN user u ON h.user_id = u.id ORDER BY h.create_time DESC LIMIT 50`)
    res.json(success({ loginLogs, aiLogs }))
  } catch (err) { next(err) }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) return res.status(400).json(fail(40002, '请填写完整信息'))
    if (newPassword.length < 6) return res.status(400).json(fail(40002, '密码长度不能少于6位'))
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM user WHERE id = ?', [req.user.id])
    if (rows.length === 0) return res.status(400).json(fail(40002, '演示账号不支持修改密码'))
    if (!bcrypt.compareSync(currentPassword, rows[0].password)) return res.status(400).json(fail(40002, '当前密码错误'))
    const hashed = bcrypt.hashSync(newPassword, 10)
    await pool.query('UPDATE user SET password = ? WHERE id = ?', [hashed, req.user.id])
    res.json(success(null, '密码修改成功'))
  } catch (err) { next(err) }
}

async function testAiConnection(req, res, next) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(fail(40004, '仅管理员可操作'))
    const pool = getPool()
    const [rows] = await pool.query("SELECT value FROM system_config WHERE `key`='ai_api_key'")
    const apiKey = rows[0]?.value || process.env.DEEPSEEK_API_KEY
    if (!apiKey) return res.status(400).json(fail(40002, '请先配置 API Key'))
    const baseURL = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com'
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    const openai = new OpenAI({ baseURL, apiKey })
    const msg = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: '回复ok表示连接正常' }], max_tokens: 10 })
    res.json(success({ status: 'ok', reply: msg.choices[0].message.content, model }))
  } catch (err) {
    res.status(500).json(fail(50003, '连接失败：' + (err.message?.substring(0, 100) || '未知错误')))
  }
}

module.exports = { getUsers, updateUserRole, toggleUserStatus, getSystemConfig, updateSystemConfig, getAiConfig, updateAiConfig, getStats, getLogs, changePassword, testAiConnection }
