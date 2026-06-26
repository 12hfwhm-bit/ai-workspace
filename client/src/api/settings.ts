/**
 * 系统设置 API
 */
import request from './request'

export interface UserItem {
  id: number; username: string; role: string; status: number; create_time: string
}
export interface SystemConfig { system_name?: string; primary_color?: string }
export interface AiConfig { apiKey: string; apiKeyMasked: string; model: string }
export interface SystemStats { user_count: number; customer_count: number; project_count: number; ai_calls: number }
export interface LogData { loginLogs: any[]; aiLogs: any[] }

export function getUsers() { return request.get('/settings/users') }
export function updateUserRole(id: number, role: string) { return request.put('/settings/users/' + id + '/role', { role }) }
export function toggleUserStatus(id: number, status: number) { return request.put('/settings/users/' + id + '/status', { status }) }
export function getSystemConfig() { return request.get('/settings/system') }
export function updateSystemConfig(data: SystemConfig) { return request.put('/settings/system', data) }
export function getAiConfig() { return request.get('/settings/ai') }
export function updateAiConfig(apiKey: string) { return request.put('/settings/ai', { apiKey }) }
export function getStats() { return request.get('/settings/stats') }
export function getLogs() { return request.get('/settings/logs') }
export function changePassword(data: { currentPassword: string; newPassword: string }) { return request.put('/settings/password', data) }
export function testAiConnection() { return request.post('/settings/ai/test') }
