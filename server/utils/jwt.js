const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn } = require('../config')

function sign(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
}

function verify(token) {
  return jwt.verify(token, jwtSecret)
}

module.exports = { sign, verify }
