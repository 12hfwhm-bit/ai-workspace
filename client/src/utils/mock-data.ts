/** 共享类型定义 */

export interface DashboardStats {
  totalCustomers: number
  totalProjects: number
  aiCalls: number
  newCustomersThisMonth: number
}

export interface CustomerGrowthItem {
  month: string
  count: number
}

export interface ProjectStatusItem {
  status: 'pending' | 'in_progress' | 'completed'
  statusLabel: string
  count: number
}

export interface RecentActivity {
  id: number
  type: string
  typeLabel: string
  description: string
  time: string
  icon: string
  color: string
}

export interface PendingTask {
  id: number
  title: string
  count: number
  iconName: string
  color: string
  description: string
}
