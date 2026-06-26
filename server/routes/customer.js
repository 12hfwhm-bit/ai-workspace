const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')
const authMiddleware = require('../middleware/auth')

router.get('/list', authMiddleware, customerController.list)
router.post('/create', authMiddleware, customerController.create)
router.put('/update/:id', authMiddleware, customerController.update)
router.delete('/delete/:id', authMiddleware, customerController.del)

module.exports = router
