const express = require('express')
const router = express.Router()
const sc = require('../controllers/settingsController')
const auth = require('../middleware/auth')

router.get('/users', auth, sc.getUsers)
router.put('/users/:id/role', auth, sc.updateUserRole)
router.put('/users/:id/status', auth, sc.toggleUserStatus)
router.get('/system', auth, sc.getSystemConfig)
router.put('/system', auth, sc.updateSystemConfig)
router.get('/ai', auth, sc.getAiConfig)
router.put('/ai', auth, sc.updateAiConfig)
router.post('/ai/test', auth, sc.testAiConnection)
router.put('/password', auth, sc.changePassword)
router.get('/stats', auth, sc.getStats)
router.get('/logs', auth, sc.getLogs)

module.exports = router
