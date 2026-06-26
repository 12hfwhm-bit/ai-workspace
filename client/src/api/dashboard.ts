import request from './request'

export interface DashboardSummary {
  customerCount: number
  projectCount: number
  aiCount: number
  newCustomerThisMonth: number
  projectStatusStats: Array<{ status: string; count: number }>
  customerTrend: Array<{ month: string; count: number }>
  recentActivity: Array<{
    id: number; type: string; typeLabel: string; description: string; time: string; icon: string; color: string
  }>
  todoItems: Array<{
    id: number; title: string; count: number; color: string; iconName: string; link: string
  }>
}

export function getDashboardSummary() {
  return request.get<{ code: number; data: DashboardSummary; message: string }>('/dashboard/summary')
}
