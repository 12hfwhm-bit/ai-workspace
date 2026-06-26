const { getPool } = require('../config/db')
const { success, fail } = require('../utils/response')
const { getRequestOptions } = require('../config/ai')
const OpenAI = require('openai')
const { PDFParse } = require('pdf-parse')

const FORM_PROMPT = `你是一个表单生成助手。根据用户的自然语言需求，生成对应的表单 JSON Schema。
支持的字段类型：input（文本框）、textarea（多行文本）、select（下拉选择框，需提供 options）、date（日期）、number（数字）。
只返回纯 JSON，不要 markdown 代码块标记，不要任何解释说明。字段数量控制在 3-8 个之间。
{"title":"表单标题","fields":[{"type":"input","label":"字段标签","prop":"fieldName","placeholder":"提示","required":true}]}`

const ANALYZE_PROMPT = `你是一位企业数据分析师。根据提供的业务数据，给出专业的分析结论和可执行的改进建议。
只返回纯 JSON，不要 markdown。chartType 支持 bar（柱状图）、line（折线图）、pie（饼图）。
{
  "summary": "2-3句话的综合分析结论",
  "suggestions": ["建议1","建议2","建议3"],
  "chartType": "bar",
  "chartTitle": "图表标题",
  "chartLabels": ["标签1","标签2"],
  "chartValues": [数值1, 数值2]
}`

const DOCUMENT_PROMPT = `你是一位企业文档分析师。分析以下文档内容，提取关键信息。
只返回纯 JSON，不要 markdown 代码块。
{
  "summary": "文档摘要，2-3句话概括核心内容",
  "keywords": ["关键点1","关键点2","关键点3"],
  "risks": ["风险提示1","风险提示2"],
  "suggestions": ["行动建议1","行动建议2","行动建议3"]
}`

async function generateForm(req, res, next) {
  try {
    const { input } = req.body
    if (!input || !input.trim()) return res.status(400).json(fail(40002, '请输入表单需求'))
    const opts = getRequestOptions()
    const openai = new OpenAI({ baseURL: opts.baseURL, apiKey: opts.apiKey })
    const msg = await openai.chat.completions.create({
      model: opts.model, temperature: 0.3,
      messages: [{ role: 'system', content: FORM_PROMPT }, { role: 'user', content: input.trim() }],
    })
    const cleaned = msg.choices[0].message.content.replace(/```json?\n?/g,'').replace(/```\n?/g,'').trim()
    let schema; try { schema = JSON.parse(cleaned) } catch { return res.status(500).json(fail(50001, 'AI返回格式异常')) }
    if (!schema.title || !Array.isArray(schema.fields)) return res.status(500).json(fail(50002, 'Schema结构不完整'))
    const pool = getPool()
    await pool.query('INSERT INTO ai_history (user_id,type,input,result) VALUES (?,?,?,?)', [req.user.id, 'form', input.trim(), JSON.stringify(schema)])
    res.json(success({ schema }))
  } catch (err) {
    if (err.status === 401 || err.code === 'insufficient_quota') return res.status(500).json(fail(50003, 'AI服务调用失败'))
    next(err)
  }
}

async function analyzeData(req, res, next) {
  try {
    const pool = getPool()
    const { type } = req.body
    if (!type || !['customer','project'].includes(type)) return res.status(400).json(fail(40002, '请选择分析类型'))
    let dataText = ''
    if (type === 'customer') {
      const [t] = await pool.query('SELECT COUNT(*) AS c FROM customer')
      const [s] = await pool.query('SELECT status,COUNT(*) AS c FROM customer GROUP BY status')
      const [m] = await pool.query("SELECT DATE_FORMAT(create_time,'%Y-%m') AS m,COUNT(*) AS c FROM customer WHERE create_time>=DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY m ORDER BY m")
      dataText = '客户数据：总数=' + t[0].c + '\n状态分布：' + s.map(r=>r.status+':'+r.c).join(',') + '\n近6月新增：' + m.map(r=>r.m+':'+r.c).join(',')
    } else {
      const [t] = await pool.query('SELECT COUNT(*) AS c FROM project')
      const [s] = await pool.query('SELECT status,COUNT(*) AS c FROM project GROUP BY status')
      const [p] = await pool.query('SELECT priority,COUNT(*) AS c FROM project GROUP BY priority')
      const [a] = await pool.query('SELECT AVG(progress) AS ap FROM project')
      dataText = '项目数据：总数=' + t[0].c + '\n状态分布：' + s.map(r=>r.status+':'+r.c).join(',') + '\n优先级分布：' + p.map(r=>r.priority+':'+r.c).join(',') + '\n平均进度=' + Math.round(a[0].ap||0) + '%'
    }
    const opts = getRequestOptions()
    const openai = new OpenAI({ baseURL: opts.baseURL, apiKey: opts.apiKey })
    const msg = await openai.chat.completions.create({
      model: opts.model, temperature: 0.3,
      messages: [{ role: 'system', content: ANALYZE_PROMPT }, { role: 'user', content: dataText }],
    })
    const cleaned = msg.choices[0].message.content.replace(/```json?\n?/g,'').replace(/```\n?/g,'').trim()
    let result; try { result = JSON.parse(cleaned) } catch { return res.status(500).json(fail(50001, 'AI返回格式异常')) }
    await pool.query('INSERT INTO ai_history (user_id,type,input,result) VALUES (?,?,?,?)', [req.user.id, 'analyze', type==='customer'?'客户数据分析':'项目数据分析', JSON.stringify(result)])
    res.json(success(result))
  } catch (err) {
    if (err.status === 401 || err.code === 'insufficient_quota') return res.status(500).json(fail(50003, 'AI服务调用失败'))
    next(err)
  }
}

async function analyzeDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json(fail(40002, '请上传PDF文件'))
    const parser = new PDFParse({ data: req.file.buffer })
    const pdfResult = await parser.getText()
    const text = pdfResult.text
    if (!text || !text.trim()) return res.status(400).json(fail(40002, 'PDF内容为空'))
    const truncated = text.substring(0, 8000)
    const opts = getRequestOptions()
    const openai = new OpenAI({ baseURL: opts.baseURL, apiKey: opts.apiKey })
    const msg = await openai.chat.completions.create({
      model: opts.model, temperature: 0.3,
      messages: [{ role: 'system', content: DOCUMENT_PROMPT }, { role: 'user', content: truncated }],
    })
    const cleaned = msg.choices[0].message.content.replace(/```json?\n?/g,'').replace(/```\n?/g,'').trim()
    let result; try { result = JSON.parse(cleaned) } catch { return res.status(500).json(fail(50001, 'AI返回格式异常')) }
      const pool = getPool()
    await pool.query('INSERT INTO ai_history (user_id,type,input,result) VALUES (?,?,?,?)', [req.user.id, 'document', req.file.originalname, JSON.stringify(result)])
      res.json(success({ ...result, pages: pdfResult.total }))
  } catch (err) {
    if (err.status === 401 || err.code === 'insufficient_quota') return res.status(500).json(fail(50003, 'AI服务调用失败'))
    next(err)
  }
}

async function getHistory(req, res, next) {
  try {
    const pool = getPool()
    const isAdmin = req.user.role === 'admin'
    const userId = req.user.id
    const { page = 1, size = 20, type = '' } = req.query
    const offset = (Math.max(1, Number(page)) - 1) * Number(size)
    const limit = Number(size)
    let whereSql = ''
    const params = []
    if (type) { whereSql += 'WHERE h.type = ?'; params.push(type) }
    if (!isAdmin) { whereSql += whereSql ? ' AND' : 'WHERE'; whereSql += ' h.user_id = ?'; params.push(userId) }
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM ai_history h ' + whereSql, params)
    const total = countRows[0].total
    const [rows] = await pool.query('SELECT h.*, u.username AS user_name FROM ai_history h LEFT JOIN user u ON h.user_id = u.id ' + whereSql + ' ORDER BY h.create_time DESC LIMIT ? OFFSET ?', [...params, limit, offset])
    res.json(success({ list: rows, total, page: Number(page), size: limit }))
  } catch (err) { next(err) }
}

async function getHistoryDetail(req, res, next) {
  try {
    const pool = getPool()
    const { id } = req.params
    const [rows] = await pool.query('SELECT h.*, u.username AS user_name FROM ai_history h LEFT JOIN user u ON h.user_id = u.id WHERE h.id = ?', [id])
    if (rows.length === 0) return res.status(404).json(fail(40003, '记录不存在'))
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) return res.status(403).json(fail(40004, '无权限查看'))
    try { rows[0].result = JSON.parse(rows[0].result) } catch {}
    res.json(success(rows[0]))
  } catch (err) { next(err) }
}

module.exports = { generateForm, analyzeData, analyzeDocument, getHistory, getHistoryDetail }
