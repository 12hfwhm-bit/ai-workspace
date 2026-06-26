const { getPool } = require('../config/db')
const { success, fail } = require('../utils/response')

/**
 * GET /api/customer/list
 * 分页查询客户列表，支持关键词搜索 name/company
 * Admin 查看全部，User 仅查看 owner_id = 自己
 */
async function list(req, res, next) {
  try {
    const pool = getPool()
    const { page = 1, size = 10, keyword = '' } = req.query
    const offset = (Math.max(1, Number(page)) - 1) * Number(size)
    const limit = Number(size)

    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id

    let whereSql = ''
    const params = []

    if (!isAdmin) {
      whereSql += 'WHERE owner_id = ?'
      params.push(userId)
    }

    if (keyword) {
      whereSql += whereSql ? ' AND' : 'WHERE'
      whereSql += ' (name LIKE ? OR company LIKE ?)'
      const kw = '%' + keyword + '%'
      params.push(kw, kw)
    }

    const countSql = 'SELECT COUNT(*) AS total FROM customer ' + whereSql
    const [countRows] = await pool.query(countSql, params)
    const total = countRows[0].total

    const dataSql = 'SELECT * FROM customer ' + whereSql + ' ORDER BY create_time DESC LIMIT ? OFFSET ?'
    const [rows] = await pool.query(dataSql, [...params, limit, offset])

    res.json(success({ list: rows, total, page: Number(page), size: limit }))
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/customer/create
 * 新增客户，owner_id 设为当前用户
 */
async function create(req, res, next) {
  try {
    const pool = getPool()
    const { name, phone, company, status } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json(fail(40002, '客户名称不能为空'))
    }

    const sql = 'INSERT INTO customer (name, phone, company, status, owner_id) VALUES (?, ?, ?, ?, ?)'
    const [result] = await pool.query(sql, [name.trim(), phone || null, company || null, status || 'new', req.user.id])

    res.json(success({ id: result.insertId }, '创建成功'))
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/customer/update/:id
 * 编辑客户
 */
async function update(req, res, next) {
  try {
    const pool = getPool()
    const { id } = req.params
    const { name, phone, company, status } = req.body
    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id

    // 先用 id 查这条记录
    const [rows] = await pool.query('SELECT * FROM customer WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json(fail(40003, '客户不存在'))
    }

    // 权限校验：非 admin 只能编辑自己的客户
    if (!isAdmin && rows[0].owner_id !== userId) {
      return res.status(403).json(fail(40004, '无权限编辑该客户'))
    }

    if (!name || !name.trim()) {
      return res.status(400).json(fail(40002, '客户名称不能为空'))
    }

    const sql = 'UPDATE customer SET name = ?, phone = ?, company = ?, status = ? WHERE id = ?'
    await pool.query(sql, [name.trim(), phone || null, company || null, status || 'new', id])

    res.json(success(null, '更新成功'))
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/customer/delete/:id
 * 删除客户
 */
async function del(req, res, next) {
  try {
    const pool = getPool()
    const { id } = req.params
    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id

    const [rows] = await pool.query('SELECT * FROM customer WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json(fail(40003, '客户不存在'))
    }

    // 权限校验：非 admin 只能删除自己的客户
    if (!isAdmin && rows[0].owner_id !== userId) {
      return res.status(403).json(fail(40004, '无权限删除该客户'))
    }

    await pool.query('DELETE FROM customer WHERE id = ?', [id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, del }
