const express = require('express')
const router = express.Router()
const projectController = require('../controllers/projectController')
const authMiddleware = require('../middleware/auth')

router.get('/list', authMiddleware, projectController.list)
router.post('/create', authMiddleware, projectController.create)
router.put('/update/:id', authMiddleware, projectController.update)
router.delete('/delete/:id', authMiddleware, projectController.del)
router.get('/users', authMiddleware, projectController.getUsers)
router.get('/log/:id', authMiddleware, projectController.getLogs)

module.exports = router
