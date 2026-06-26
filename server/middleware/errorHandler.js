const { fail } = require('../utils/response')

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err)

  const status = err.status || 500
  const code = err.code || 50000
  const message = err.message || '服务器内部错误'

  res.status(status).json(fail(code, message))
}

module.exports = errorHandler
