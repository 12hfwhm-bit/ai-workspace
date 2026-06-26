const { verify } = require('../utils/jwt')
const { fail } = require('../utils/response')

/**
 * JWT 认证中间件
 * 验证 Authorization Header 中的 Bearer Token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(fail(40001, '认证失败：缺少 Token'))
  }

  const token = authHeader.slice(7)
  try {
    const decoded = verify(token)
    req.user = decoded  // { id, username, role }
    next()
  } catch (err) {
    return res.status(401).json(fail(40001, '认证失败：Token 无效或已过期'))
  }
}

module.exports = authMiddleware
