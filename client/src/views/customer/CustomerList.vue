 <template>
   <div class="customer-list">
     <!-- 页面主卡片 -->
     <div class="page-card">
       <!-- 工具栏 -->
       <div class="toolbar">
         <h2 class="toolbar__title">客户列表</h2>
         <div class="toolbar__actions">
           <el-input
             v-model="searchKeyword"
             placeholder="搜索客户名称 / 公司"
             clearable
             :prefix-icon="Search"
             style="width: 260px"
             @clear="handleSearch"
             @keyup.enter="handleSearch"
           />
           <el-button type="primary" :icon="Plus" @click="openCreate">
             新增客户
           </el-button>
         </div>
       </div>
 
       <!-- 表格 -->
       <el-table
         :data="tableData"
         v-loading="loading"
         stripe
         style="width: 100%"
         :header-cell-style="{ background: '#fafafa', color: '#606266' }"
       >
         <el-table-column prop="name" label="客户名称" min-width="140" />
         <el-table-column prop="phone" label="电话" min-width="130" />
         <el-table-column prop="company" label="公司" min-width="180" show-overflow-tooltip />
         <el-table-column prop="status" label="状态" width="110">
           <template #default="{ row }">
             <el-tag :type="statusMap[row.status]?.tagType" size="small" effect="plain">
               {{ statusMap[row.status]?.label }}
             </el-tag>
           </template>
         </el-table-column>
         <el-table-column prop="create_time" label="创建时间" width="180">
           <template #default="{ row }">
             {{ formatTime(row.create_time) }}
           </template>
         </el-table-column>
         <el-table-column label="操作" width="180" fixed="right">
           <template #default="{ row }">
             <el-button text type="primary" size="small" @click="openEdit(row)">
               编辑
             </el-button>
             <el-button text type="danger" size="small" @click="handleDelete(row)">
               删除
             </el-button>
           </template>
         </el-table-column>
       </el-table>
 
       <!-- 分页 -->
       <div class="pagination-wrap">
         <el-pagination
           v-model:current-page="currentPage"
           v-model:page-size="pageSize"
           :total="total"
           :page-sizes="[10, 20, 50]"
           layout="total, sizes, prev, pager, next, jumper"
           background
           @size-change="fetchData"
           @current-change="fetchData"
         />
       </div>
     </div>
 
     <!-- 新增 / 编辑 Dialog -->
     <el-dialog
       v-model="dialogVisible"
       :title="isEditing ? '编辑客户' : '新增客户'"
       width="520px"
       :close-on-click-modal="false"
       destroy-on-close
     >
       <el-form
         ref="formRef"
         :model="formData"
         :rules="formRules"
         label-width="80px"
         @keyup.enter="submitForm"
       >
         <el-form-item label="客户名称" prop="name">
           <el-input v-model="formData.name" placeholder="请输入客户名称" maxlength="100" />
         </el-form-item>
         <el-form-item label="电话" prop="phone">
           <el-input v-model="formData.phone" placeholder="请输入电话号码" maxlength="20" />
         </el-form-item>
         <el-form-item label="公司" prop="company">
           <el-input v-model="formData.company" placeholder="请输入公司名称" maxlength="200" />
         </el-form-item>
         <el-form-item label="状态" prop="status">
           <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
             <el-option
               v-for="(cfg, key) in statusMap"
               :key="key"
               :label="cfg.label"
               :value="key"
             />
           </el-select>
         </el-form-item>
       </el-form>
       <template #footer>
         <el-button @click="dialogVisible = false">取消</el-button>
         <el-button type="primary" :loading="submitting" @click="submitForm">
           {{ isEditing ? '保存' : '创建' }}
         </el-button>
       </template>
     </el-dialog>
   </div>
 </template>
 
 <script setup lang="ts">
 import { ref, reactive, computed, onMounted } from 'vue'
 import { ElMessage, ElMessageBox } from 'element-plus'
 import { Search, Plus } from '@element-plus/icons-vue'
 import type { FormInstance, FormRules } from 'element-plus'
 import {
   getCustomerList,
   createCustomer,
   updateCustomer,
   deleteCustomer,
   CUSTOMER_STATUS,
   type CustomerItem,
   type CustomerFormData,
 } from '@/api/customer'
 
 // ── 状态映射 ──
 const statusMap = CUSTOMER_STATUS
 
 // ── 表格数据 ──
 const tableData = ref<CustomerItem[]>([])
 const loading = ref(false)
 const currentPage = ref(1)
 const pageSize = ref(10)
 const total = ref(0)
 const searchKeyword = ref('')
 
 // ── 搜索 ──
 function handleSearch() {
   currentPage.value = 1
   fetchData()
 }
 
 // ── 获取列表 ──
 async function fetchData() {
   loading.value = true
   try {
     const res = await getCustomerList({
       page: currentPage.value,
       size: pageSize.value,
       keyword: searchKeyword.value || undefined,
     })
     tableData.value = res.data.list
     total.value = res.data.total
   } catch {
     ElMessage.error('获取客户列表失败')
   } finally {
     loading.value = false
   }
 }
 
 // ── 格式化时间 ──
 function formatTime(t: string): string {
   if (!t) return '-'
   // 截取到秒  "2026-06-25T12:00:00.000Z" → "2026-06-25 12:00:00"
   return t.replace('T', ' ').slice(0, 19)
 }
 
 // ── Dialog ──
 const dialogVisible = ref(false)
 const isEditing = ref(false)
 const editingId = ref<number | null>(null)
 const submitting = ref(false)
 const formRef = ref<FormInstance>()
 
 const defaultForm: CustomerFormData = { name: '', phone: '', company: '', status: 'new' }
 const formData = reactive<CustomerFormData>({ ...defaultForm })
 
 const formRules: FormRules = {
   name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
 }
 
 function resetForm() {
   Object.assign(formData, defaultForm)
   formRef.value?.clearValidate()
 }
 
 function openCreate() {
   isEditing.value = false
   editingId.value = null
   resetForm()
   dialogVisible.value = true
 }
 
 function openEdit(row: CustomerItem) {
   isEditing.value = true
   editingId.value = row.id
   formData.name = row.name
   formData.phone = row.phone || ''
   formData.company = row.company || ''
   formData.status = row.status
   dialogVisible.value = true
 }
 
 async function submitForm() {
   const valid = await formRef.value?.validate().catch(() => false)
   if (!valid) return
 
   submitting.value = true
   try {
     if (isEditing.value && editingId.value) {
       await updateCustomer(editingId.value, formData)
       ElMessage.success('更新成功')
     } else {
       await createCustomer(formData)
       ElMessage.success('创建成功')
     }
     dialogVisible.value = false
     fetchData()
   } catch {
     ElMessage.error(isEditing.value ? '更新失败' : '创建失败')
   } finally {
     submitting.value = false
   }
 }
 
 // ── 删除 ──
 async function handleDelete(row: CustomerItem) {
   try {
     await ElMessageBox.confirm(`确定删除客户「${row.name}」吗？此操作不可恢复。`, '确认删除', {
       confirmButtonText: '删除',
       cancelButtonText: '取消',
       type: 'warning',
     })
     await deleteCustomer(row.id)
     ElMessage.success('删除成功')
     fetchData()
   } catch {
     // 取消删除不做操作
   }
 }
 
 onMounted(fetchData)
 </script>
 
 <style scoped>
 .customer-list {
   max-width: 1400px;
   margin: 0 auto;
 }
 
 .page-card {
   background: #fff;
   border-radius: 12px;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
   padding: 0;
 }
 
 /* 工具栏 */
 .toolbar {
   display: flex;
   align-items: center;
   justify-content: space-between;
   flex-wrap: wrap;
   gap: 12px;
   padding: 20px 24px 0;
 }
 
 .toolbar__title {
   font-size: 16px;
   font-weight: 600;
   color: #303133;
   white-space: nowrap;
 }
 
 .toolbar__actions {
   display: flex;
   align-items: center;
   gap: 12px;
 }
 
 /* 表格 */
 .el-table {
   margin-top: 16px;
 }
 
 /* 分页 */
 .pagination-wrap {
   display: flex;
   justify-content: flex-end;
   padding: 16px 24px 20px;
 }
 </style>
