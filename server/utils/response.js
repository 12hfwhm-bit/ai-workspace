/**
 * 统一响应格式
 */
function success(data = null, message = 'success') {
  return { code: 0, data, message }
}

function fail(code = 50000, message = '服务器内部错误') {
  return { code, data: null, message }
}

module.exports = { success, fail }
