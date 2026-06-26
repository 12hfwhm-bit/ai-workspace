 /**
  * 客户管理 API
  */
 import request from './request'
 
 export interface CustomerItem {
   id: number
   name: string
   phone: string | null
   company: string | null
   status: 'new' | 'following' | 'closed' | 'lost'
   owner_id: number
   create_time: string
 }
 
 export interface CustomerListParams {
   page?: number
   size?: number
   keyword?: string
 }
 
 export interface CustomerListResult {
   list: CustomerItem[]
   total: number
   page: number
   size: number
 }
 
 /** 状态映射 */
 export const CUSTOMER_STATUS: Record<string, { label: string; color: string; tagType: 'primary' | 'warning' | 'success' | 'info' }> = {
   new: { label: '新客户', color: '#409eff', tagType: 'primary' },
   following: { label: '跟进中', color: '#e6a23c', tagType: 'warning' },
   closed: { label: '已成交', color: '#67c23a', tagType: 'success' },
   lost: { label: '已流失', color: '#909399', tagType: 'info' },
 }
 
 /** 客户表单数据（创建/编辑） */
 export interface CustomerFormData {
   name: string
   phone: string
   company: string
   status: string
 }
 
 export function getCustomerList(params?: CustomerListParams): Promise<{ code: number; data: CustomerListResult; message: string }> {
   return request.get('/customer/list', { params })
 }
 
 export function createCustomer(data: CustomerFormData): Promise<{ code: number; data: { id: number }; message: string }> {
   return request.post('/customer/create', data)
 }
 
 export function updateCustomer(id: number, data: CustomerFormData): Promise<{ code: number; data: null; message: string }> {
   return request.put('/customer/update/' + id, data)
 }
 
 export function deleteCustomer(id: number): Promise<{ code: number; data: null; message: string }> {
   return request.delete('/customer/delete/' + id)
 }
