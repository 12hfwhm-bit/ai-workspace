const { getPool } = require('../config/db')
const { success, fail } = require('../utils/response')

/** 插入项目动态日志 */
async function addLog(pool, projectId, action, content, operatorId) {
  await pool.query(
    'INSERT INTO project_log (project_id, action, content, operator_id) VALUES (?, ?, ?, ?)',
    [projectId, action, content, operatorId]
  )
}

/**
 * GET /api/project/list
 * 分页查询项目列表，支持关键词搜索 name
 * Admin 查看全部，User 仅查看 manager_id = 自己
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
      whereSql += 'WHERE p.manager_id = ?'
      params.push(userId)
    }

    if (keyword) {
      whereSql += whereSql ? ' AND' : 'WHERE'
      whereSql += ' p.name LIKE ?'
      params.push('%' + keyword + '%')
    }

    const countSql = 'SELECT COUNT(*) AS total FROM project p ' + whereSql
    const [countRows] = await pool.query(countSql, params)
    const total = countRows[0].total

    const dataSql = `SELECT p.*, c.name AS customer_name, u.username AS manager_name
      FROM project p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN user u ON p.manager_id = u.id
      ${whereSql}
      ORDER BY p.create_time DESC LIMIT ? OFFSET ?`
    const [rows] = await pool.query(dataSql, [...params, limit, offset])

    res.json(success({ list: rows, total, page: Number(page), size: limit }))
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/project/create
 * 新增项目（仅 Admin）
 */
async function create(req, res, next) {
  try {
    const pool = getPool()
    const { name, description, customer_id, manager_id, priority, progress, status, start_time, end_time } = req.body

    if (req.user.role !== 'admin') {
      return res.status(403).json(fail(40004, '无权限创建项目'))
    }

    if (!name || !name.trim()) {
      return res.status(400).json(fail(40002, '项目名称不能为空'))
    }

    const sql = `INSERT INTO project (name, description, customer_id, manager_id, priority, progress, status, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [result] = await pool.query(sql, [
      name.trim(),
      description || null,
      customer_id || null,
      manager_id || req.user.id,
      priority || 'medium',
      progress != null ? Math.min(100, Math.max(0, Number(progress))) : 0,
      status || 'pending',
      start_time || null,
      end_time || null,
    ])

    // 记录日志
    await addLog(pool, result.insertId, 'create', req.user.username + ' 创建了项目「' + name.trim() + '」', req.user.id)

    res.json(success(null, '创建成功'))
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/project/update/:id
 * 编辑项目
 * Admin：编辑全部字段；User：仅更新进度
 */
async function update(req, res, next) {
  try {
    const pool = getPool()
    const { id } = req.params
    const { name, description, customer_id, manager_id, priority, progress, status, start_time, end_time } = req.body
    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id
    const username = req.user.username

    const [rows] = await pool.query('SELECT * FROM project WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json(fail(40003, '项目不存在'))
    }
    const oldProject = rows[0]

    if (!isAdmin && oldProject.manager_id !== userId) {
      return res.status(403).json(fail(40004, '无权限编辑该项目'))
    }

    if (!isAdmin && (name !== undefined || description !== undefined || customer_id !== undefined || manager_id !== undefined || priority !== undefined || status !== undefined)) {
      return res.status(403).json(fail(40004, '仅管理员可修改项目信息'))
    }

    if (isAdmin) {
      if (!name || !name.trim()) {
        return res.status(400).json(fail(40002, '项目名称不能为空'))
      }
      const sql = `UPDATE project SET name=?, description=?, customer_id=?, manager_id=?, priority=?, progress=?, status=?, start_time=?, end_time=? WHERE id=?`
      await pool.query(sql, [
        name.trim(), description || null, customer_id || null, manager_id || userId,
        priority || 'medium',
        progress != null ? Math.min(100, Math.max(0, Number(progress))) : 0,
        status || 'pending', start_time || null, end_time || null, id,
      ])

      // 记录状态变化
      if (status && status !== oldProject.status) {
        const labels = { pending: '未开始', in_progress: '进行中', completed: '已完成' }
        await addLog(pool, id, 'update_status', username + ' 变更状态为「' + (labels[status] || status) + '」', userId)
      }
    } else {
      // User：仅更新进度
      const newProgress = progress != null ? Math.min(100, Math.max(0, Number(progress))) : oldProject.progress
      await pool.query('UPDATE project SET progress = ? WHERE id = ?', [newProgress, id])

      if (newProgress !== oldProject.progress) {
        await addLog(pool, id, 'update_progress', username + ' 更新进度至 ' + newProgress + '%', userId)
      }
    }

    // 日志：更新项目信息
    if (isAdmin) {
      await addLog(pool, id, 'update', username + ' 更新了项目信息', userId)
    }

    res.json(success(null, '更新成功'))
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/project/delete/:id
 * 删除项目（仅 Admin）
 */
async function del(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(fail(40004, '无权限删除项目'))
    }

    const pool = getPool()
    const { id } = req.params

    const [rows] = await pool.query('SELECT * FROM project WHERE id = ?', [id])
    if (rows.length === 0) {
      return res.status(404).json(fail(40003, '项目不存在'))
    }

    await pool.query('DELETE FROM project_log WHERE project_id = ?', [id])
    await pool.query('DELETE FROM project WHERE id = ?', [id])
    res.json(success(null, '删除成功'))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/project/users
 * 获取用户列表（用于负责人选择）
 */
async function getUsers(req, res, next) {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT id, username, role FROM user ORDER BY id')
    res.json(success(rows))
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/project/log/:id
 * 获取项目动态日志
 */
async function getLogs(req, res, next) {
  try {
    const pool = getPool()
    const { id } = req.params
    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id

    // 权限校验
    const [projects] = await pool.query('SELECT * FROM project WHERE id = ?', [id])
    if (projects.length === 0) {
      return res.status(404).json(fail(40003, '项目不存在'))
    }
    if (!isAdmin && projects[0].manager_id !== userId) {
      return res.status(403).json(fail(40004, '无权限查看'))
    }

    const [rows] = await pool.query(
      `SELECT pl.*, u.username AS operator_name
      FROM project_log pl
      LEFT JOIN user u ON pl.operator_id = u.id
      WHERE pl.project_id = ?
      ORDER BY pl.create_time ASC`,
      [id]
    )

    res.json(success(rows))
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, del, getUsers, getLogs }
