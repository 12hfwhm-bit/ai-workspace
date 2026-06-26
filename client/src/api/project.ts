/**
 * 企业项目管理 API
 */
import request from './request'

export interface ProjectItem {
  id: number
  name: string
  description: string | null
  customer_id: number | null
  customer_name: string | null
  manager_id: number
  manager_name: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  status: 'pending' | 'in_progress' | 'completed'
  start_time: string | null
  end_time: string | null
  create_time: string
}

export interface ProjectListParams {
  page?: number
  size?: number
  keyword?: string
}

export interface ProjectListResult {
  list: ProjectItem[]
  total: number
  page: number
  size: number
}

export interface ProjectLog {
  id: number
  project_id: number
  action: string
  content: string
  operator_id: number
  operator_name: string | null
  create_time: string
}

export interface ProjectUser {
  id: number
  username: string
  role: string
}

/** 状态映射 */
export const PROJECT_STATUS: Record<string, { label: string; tagType: 'warning' | 'primary' | 'success' }> = {
  pending: { label: '未开始', tagType: 'warning' },
  in_progress: { label: '进行中', tagType: 'primary' },
  completed: { label: '已完成', tagType: 'success' },
}

/** 优先级映射 */
export const PROJECT_PRIORITY: Record<string, { label: string; color: string; tagType: 'info' | 'warning' | 'danger' | 'danger' }> = {
  low: { label: '低', color: '#909399', tagType: 'info' },
  medium: { label: '中', color: '#e6a23c', tagType: 'warning' },
  high: { label: '高', color: '#f56c6c', tagType: 'danger' },
  urgent: { label: '紧急', color: '#c03636', tagType: 'danger' },
}

/** 项目表单数据（创建/编辑） */
export interface ProjectFormData {
  name: string
  description: string
  customer_id: number | null
  manager_id: number | null
  priority: string
  progress: number
  status: string
  start_time: string
  end_time: string
}

export function getProjectList(params?: ProjectListParams): Promise<{ code: number; data: ProjectListResult; message: string }> {
  return request.get('/project/list', { params })
}

export function createProject(data: ProjectFormData): Promise<{ code: number; data: null; message: string }> {
  return request.post('/project/create', data)
}

export function updateProject(id: number, data: Partial<ProjectFormData>): Promise<{ code: number; data: null; message: string }> {
  return request.put('/project/update/' + id, data)
}

export function deleteProject(id: number): Promise<{ code: number; data: null; message: string }> {
  return request.delete('/project/delete/' + id)
}

export function getProjectUsers(): Promise<{ code: number; data: ProjectUser[]; message: string }> {
  return request.get('/project/users')
}

export function getProjectLogs(id: number): Promise<{ code: number; data: ProjectLog[]; message: string }> {
  return request.get('/project/log/' + id)
}
