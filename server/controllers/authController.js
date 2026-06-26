const bcrypt = require('bcryptjs')
const { sign } = require('../utils/jwt')
const { success, fail } = require('../utils/response')
const { getPool } = require('../config/db')

// Mock 用户数据（开发阶段使用，后续接入 MySQL）
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('123456', 10),
    role: 'admin',
    avatar: null,
  },
  {
    id: 2,
    username: 'user',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: null,
  },
]

/**
 * POST /api/auth/register
 * 用户注册
 */
async function register(req, res) {
  try {
    const { username, password, confirmPassword } = req.body

    if (!username || !password || !confirmPassword) {
      return res.status(400).json(fail(40002, '请填写完整信息'))
    }
    if (password !== confirmPassword) {
      return res.status(400).json(fail(40002, '两次密码不一致'))
    }
    if (username.length < 2 || username.length > 50) {
      return res.status(400).json(fail(40002, '用户名长度为 2-50 个字符'))
    }
    if (password.length < 6) {
      return res.status(400).json(fail(40002, '密码长度不能少于 6 位'))
    }

    // 检查 mock 用户
    if (mockUsers.find(u => u.username === username)) {
      return res.status(409).json(fail(40006, '用户名已存在'))
    }

    // 检查数据库用户
    const pool = getPool()
    const [existing] = await pool.query('SELECT id FROM user WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.status(409).json(fail(40006, '用户名已存在'))
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const [result] = await pool.query(
      'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'user']
    )

    res.json(success({ id: result.insertId }, '注册成功'))
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json(fail(40006, '用户名已存在'))
    }
    res.status(500).json(fail(50000, '注册失败'))
  }
}

/**
 * POST /api/auth/login
 * 用户登录（支持 mock + DB 用户）
 */
async function login(req, res) {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json(fail(40002, '用户名和密码不能为空'))
  }

  // 优先查 mock 用户（快路径）
  const user = mockUsers.find((u) => u.username === username)
  if (user) {
    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json(fail(40005, '账号或密码错误'))
    }
      const payload = { id: user.id, username: user.username, role: user.role }
    try { getPool().query('INSERT INTO login_log (user_id,username) VALUES (?,?)', [user.id, user.username]) } catch {}
      return res.json(success({
      token: sign(payload),
      userInfo: { id: user.id, username: user.username, role: user.role },
    }))
  }

  // 再查数据库用户
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username])
    if (rows.length === 0) {
      return res.status(401).json(fail(40005, '账号或密码错误'))
    }
    const dbUser = rows[0]
    const isPasswordValid = bcrypt.compareSync(password, dbUser.password)
    if (!isPasswordValid) {
      return res.status(401).json(fail(40005, '账号或密码错误'))
    }
      const payload = { id: dbUser.id, username: dbUser.username, role: dbUser.role }
    try { pool.query('INSERT INTO login_log (user_id,username) VALUES (?,?)', [dbUser.id, dbUser.username]) } catch {}
      res.json(success({
      token: sign(payload),
      userInfo: { id: dbUser.id, username: dbUser.username, role: dbUser.role },
    }))
  } catch {
    return res.status(500).json(fail(50000, '服务器内部错误'))
  }

}

/**
 * GET /api/auth/profile
 * 获取当前用户信息（支持 mock + DB 用户）
 */
async function getProfile(req, res) {
  // 优先查 mock
  const user = mockUsers.find((u) => u.id === req.user.id)
  if (user) {
    return res.json(success({
      id: user.id, username: user.username, role: user.role, avatar: user.avatar,
    }))
  }

  // 再查 DB
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT id, username, role, avatar FROM user WHERE id = ?', [req.user.id])
    if (rows.length === 0) {
      return res.status(404).json(fail(40003, '用户不存在'))
    }
    res.json(success(rows[0]))
  } catch {
    return res.status(500).json(fail(50000, '服务器内部错误'))
  }
}

module.exports = { register, login, getProfile }
