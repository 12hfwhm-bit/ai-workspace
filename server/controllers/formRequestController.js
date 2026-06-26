const { getPool } = require('../config/db')
const { success, fail } = require('../utils/response')

async function submit(req, res, next) {
  try {
    const { formSchema, formData } = req.body
    if (!formSchema || !formData) return res.status(400).json(fail(40002, '缺少表单数据'))
    const pool = getPool()
    const [r] = await pool.query('INSERT INTO form_request (user_id,form_type,form_schema,form_data,status) VALUES (?,?,?,?,?)', [req.user.id, formSchema.title||'表单申请', JSON.stringify(formSchema), JSON.stringify(formData), 'pending'])
    res.json(success({ id: r.insertId }, '申请已提交'))
  } catch (err) { next(err) }
}

async function list(req, res, next) {
  try {
    const pool = getPool()
    const isAdmin = req.user.role === 'admin', uid = req.user.id
    const { page = 1, size = 20, status = '' } = req.query
    const offset = (Math.max(1, Number(page)) - 1) * Number(size)
    let w = '', p = []
    if (!isAdmin) { w += 'WHERE r.user_id = ?'; p.push(uid) }
    if (status) { w += w?' AND':'WHERE'; w += ' r.status = ?'; p.push(status) }
    const [{ total }] = (await pool.query('SELECT COUNT(*) AS total FROM form_request r ' + w, p))[0]
    const [rows] = await pool.query('SELECT r.*,u.username FROM form_request r LEFT JOIN user u ON r.user_id=u.id '+w+' ORDER BY r.create_time DESC LIMIT ? OFFSET ?', [...p, Number(size), offset])
    res.json(success({ list: rows, total, page: Number(page), size: Number(size) }))
  } catch (err) { next(err) }
}

async function detail(req, res, next) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT r.*,u.username FROM form_request r LEFT JOIN user u ON r.user_id=u.id WHERE r.id=?', [req.params.id])
    if (!rows.length) return res.status(404).json(fail(40003, '申请不存在'))
    try { rows[0].form_schema = JSON.parse(rows[0].form_schema) } catch {}
    try { rows[0].form_data = JSON.parse(rows[0].form_data) } catch {}
    res.json(success(rows[0]))
  } catch (err) { next(err) }
}

async function approve(req, res, next) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(fail(40004, '仅管理员可操作'))
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM form_request WHERE id=?', [req.params.id])
    if (!rows.length) return res.status(404).json(fail(40003, '申请不存在'))
    if (rows[0].status !== 'pending') return res.status(400).json(fail(40002, '申请已处理'))
    await pool.query("UPDATE form_request SET status='approved' WHERE id=?", [req.params.id])
    res.json(success(null, '已通过'))
  } catch (err) { next(err) }
}

async function reject(req, res, next) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(fail(40004, '仅管理员可操作'))
    const { reason } = req.body
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM form_request WHERE id=?', [req.params.id])
    if (!rows.length) return res.status(404).json(fail(40003, '申请不存在'))
    if (rows[0].status !== 'pending') return res.status(400).json(fail(40002, '申请已处理'))
    await pool.query("UPDATE form_request SET status='rejected',reason=? WHERE id=?", [reason||'未通过', req.params.id])
    res.json(success(null, '已拒绝'))
  } catch (err) { next(err) }
}

async function createProject(req, res, next) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(fail(40004, '仅管理员可操作'))
    const pool = getPool()
    const [rows] = await pool.query('SELECT * FROM form_request WHERE id=?', [req.params.id])
    if (!rows.length) return res.status(404).json(fail(40003, '申请不存在'))
    if (rows[0].status !== 'approved') return res.status(400).json(fail(40002, '请先通过审批'))
    if (rows[0].project_id) return res.status(400).json(fail(40002, '项目已创建'))
    const formData = typeof rows[0].form_data === 'string' ? JSON.parse(rows[0].form_data) : rows[0].form_data
    const name = rows[0].form_type + ' #' + req.params.id
    const [pr] = await pool.query('INSERT INTO project (name,manager_id,status) VALUES (?,?,?)', [name, req.user.id, 'pending'])
    await pool.query('UPDATE form_request SET project_id=? WHERE id=?', [pr.insertId, req.params.id])
    res.json(success({ id: pr.insertId, name }, '项目已创建'))
  } catch (err) { next(err) }
}

module.exports = { submit, list, detail, approve, reject, createProject }
