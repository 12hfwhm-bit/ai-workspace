/**
 * AI 动态表单 API
 */
import request from './request'

export interface FormField {
  type: 'input' | 'textarea' | 'select' | 'date' | 'number'
  label: string
  prop: string
  placeholder?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

export interface FormSchema {
  title: string
  fields: FormField[]
}

export interface AnalysisResult {
  summary: string
  suggestions: string[]
  chartType: 'bar' | 'line' | 'pie'
  chartTitle: string
  chartLabels: string[]
  chartValues: number[]
}

export type HistoryResult = FormSchema | AnalysisResult | string

export interface HistoryItem {
  id: number; user_id: number; user_name: string | null
  type: string; input: string; result: HistoryResult
  create_time: string
}

/** 业务数据分析 */
export interface DocumentResult {
  summary: string
  keywords: string[]
  risks: string[]
  suggestions: string[]
  pages?: number
}

export function analyzeData(type: string): Promise<{ code: number; data: AnalysisResult; message: string }> {
  return request.post('/ai/analyze', { type })
}

/** 上传 PDF 并分析文档 */
export function analyzeDocument(file: File): Promise<{ code: number; data: DocumentResult; message: string }> {
  const fd = new FormData()
  fd.append('file', file)
  return request.post('/ai/document', fd)
}

/** 生成表单 Schema */
export function generateForm(input: string): Promise<{ code: number; data: { schema: FormSchema }; message: string }> {
  return request.post('/ai/form', { input })
}

/** 获取历史记录列表 */
export function getHistoryList(params?: { page?: number; size?: number; type?: string }): Promise<{
  code: number; data: { list: HistoryItem[]; total: number; page: number; size: number }; message: string
}> {
  return request.get('/ai/history', { params })
}

/** 获取单条历史记录详情 */
export function getHistoryDetail(id: number): Promise<{ code: number; data: HistoryItem; message: string }> {
  return request.get('/ai/history/' + id)
}
