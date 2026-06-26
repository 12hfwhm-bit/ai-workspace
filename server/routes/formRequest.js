const express = require('express')
const router = express.Router()
const fc = require('../controllers/formRequestController')
const auth = require('../middleware/auth')

router.post('/submit', auth, fc.submit)
router.get('/list', auth, fc.list)
router.get('/:id', auth, fc.detail)
router.put('/:id/approve', auth, fc.approve)
router.put('/:id/reject', auth, fc.reject)
router.post('/:id/create-project', auth, fc.createProject)

module.exports = router
