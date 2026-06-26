const { getPool } = require('../config/db')
const { success } = require('../utils/response')

async function getSummary(req, res, next) {
  try {
    const pool = getPool()

    // 统计汇总
    const [[stats]] = await pool.query(`SELECT
      (SELECT COUNT(*) FROM customer) AS customerCount,
      (SELECT COUNT(*) FROM project) AS projectCount,
      (SELECT COUNT(*) FROM ai_history) AS aiCount,
      (SELECT COUNT(*) FROM customer WHERE DATE_FORMAT(create_time,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')) AS newCustomerThisMonth`)

    // 项目状态分布
    const [projectStatusStats] = await pool.query('SELECT status,COUNT(*) AS count FROM project GROUP BY status')

    // 客户增长趋势（近6个月）
    const [customerTrend] = await pool.query(
      "SELECT DATE_FORMAT(create_time,'%Y-%m') AS month,COUNT(*) AS count FROM customer WHERE create_time>=DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY month ORDER BY month")

    // 最近活动
    const [aiActs] = await pool.query("SELECT 'ai' AS t,h.type AS action,h.input AS descr,h.create_time FROM ai_history h ORDER BY h.create_time DESC LIMIT 10")
    const [pjActs] = await pool.query("SELECT 'project' AS t,pl.action,pl.content AS descr,pl.create_time FROM project_log pl ORDER BY pl.create_time DESC LIMIT 10")

    const allActs = [...aiActs, ...pjActs]
      .sort((a, b) => new Date(b.create_time) - new Date(a.create_time))
      .slice(0, 10)
      .map((item, i) => ({
        id: i + 1,
        typeLabel: item.t === 'ai' ? 'AI 调用' : item.action === 'create' ? '项目创建' : item.action === 'update_progress' ? '进度更新' : '状态变更',
        description: item.descr,
        time: item.create_time,
        icon: item.t === 'ai' ? 'Cpu' : 'List',
        color: item.t === 'ai' ? '#e6a23c' : item.action === 'create' ? '#409eff' : item.action === 'update_progress' ? '#67c23a' : '#409eff',
      }))

    // 待办事项
    const [[{ c: pendingC }]] = await pool.query("SELECT COUNT(*) AS c FROM customer WHERE status='following'")
    const [[{ c: activeP }]] = await pool.query("SELECT COUNT(*) AS c FROM project WHERE status='in_progress'")
    const [[{ c: idleP }]] = await pool.query("SELECT COUNT(*) AS c FROM project WHERE status='pending'")

    res.json(success({
      customerCount: stats.customerCount,
      projectCount: stats.projectCount,
      aiCount: stats.aiCount,
      newCustomerThisMonth: stats.newCustomerThisMonth,
      projectStatusStats,
      customerTrend,
      recentActivity: allActs,
      todoItems: [
        { id: 1, title: '待跟进客户', count: pendingC, color: '#409eff', iconName: 'UserFilled', link: '/customer' },
        { id: 2, title: '进行中项目', count: activeP, color: '#e6a23c', iconName: 'List', link: '/project' },
        { id: 3, title: '未开始项目', count: idleP, color: '#909399', iconName: 'List', link: '/project' },
      ],
    }))
  } catch (err) { next(err) }
}

module.exports = { getSummary }
