const express = require('express')
const router = express.Router()
const multer = require('multer')
const aiController = require('../controllers/aiController')
const authMiddleware = require('../middleware/auth')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('仅支持 PDF 文件'))
  },
})

router.post('/form', authMiddleware, aiController.generateForm)
router.post('/analyze', authMiddleware, aiController.analyzeData)
router.post('/document', authMiddleware, upload.single('file'), aiController.analyzeDocument)
router.get('/history', authMiddleware, aiController.getHistory)
router.get('/history/:id', authMiddleware, aiController.getHistoryDetail)

module.exports = router
