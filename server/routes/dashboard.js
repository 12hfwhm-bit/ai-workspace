const express = require('express')
const router = express.Router()
const dc = require('../controllers/dashboardController')
const auth = require('../middleware/auth')

router.get('/summary', auth, dc.getSummary)

module.exports = router
