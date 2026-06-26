const express = require('express')
const router = express.Router()

const authRoutes = require('./auth')
const customerRoutes = require('./customer')
const projectRoutes = require('./project')
const aiRoutes = require('./ai')
const formRequestRoutes = require('./formRequest')
const dashboardRoutes = require('./dashboard')
const settingsRoutes = require('./settings')

router.use('/auth', authRoutes)
router.use('/customer', customerRoutes)
router.use('/project', projectRoutes)
router.use('/ai', aiRoutes)
router.use('/form-request', formRequestRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/settings', settingsRoutes)

module.exports = router
