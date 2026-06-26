<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getProjectList, createProject, updateProject, deleteProject,
  getProjectUsers, getProjectLogs,
  PROJECT_STATUS, PROJECT_PRIORITY,
  type ProjectItem, type ProjectFormData, type ProjectLog, type ProjectUser,
} from '@/api/project'
import { getCustomerList } from '@/api/customer'
import { useUserStore } from '@/store/user'
import type { CustomerItem } from '@/api/customer'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)

// ── 映射 ──
const statusMap = PROJECT_STATUS
const priorityMap = PROJECT_PRIORITY

// ── 表格数据 ──
const tableData = ref<ProjectItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

// ── 选项数据 ──
const customers = ref<CustomerItem[]>([])
const users = ref<ProjectUser[]>([])

async function fetchOptions() {
  try {
    const [cRes, uRes] = await Promise.all([
      getCustomerList({ page: 1, size: 999 }),
      getProjectUsers(),
    ])
    customers.value = cRes.data.list
    users.value = uRes.data
  } catch { /* ignore */ }
}

// ── 搜索 ──
function handleSearch() {
  currentPage.value = 1
  fetchData()
}

// ── 获取列表 ──
async function fetchData() {
  loading.value = true
  try {
    const res = await getProjectList({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value || undefined,
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch {
    ElMessage.error('获取项目列表失败')
  } finally {
    loading.value = false
  }
}

// ── 格式化 ──
function formatDate(d: string | null): string {
  if (!d) return '-'
  return d.slice(0, 10)
}

function formatTime(t: string): string {
  if (!t) return '-'
  return t.replace('T', ' ').slice(0, 19)
}

// ── Dialog ──
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defaultForm: ProjectFormData = {
  name: '', description: '', customer_id: null, manager_id: null,
  priority: 'medium', progress: 0, status: 'pending', start_time: '', end_time: '',
}
const formData = reactive<ProjectFormData>({ ...defaultForm })

const formRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

function resetForm() {
  Object.assign(formData, defaultForm)
  formRef.value?.clearValidate()
}

function openCreate() {
  if (!isAdmin.value) {
    ElMessage.warning('仅管理员可创建项目')
    return
  }
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: ProjectItem) {
  if (!isAdmin.value && row.manager_id !== (userStore.userInfo?.id || 0)) {
    ElMessage.warning('仅负责人可编辑该项目')
    return
  }
  isEditing.value = true
  editingId.value = row.id
  formData.name = row.name
  formData.description = row.description || ''
  formData.customer_id = row.customer_id
  formData.manager_id = row.manager_id
  formData.priority = row.priority
  formData.progress = row.progress
  formData.status = row.status
  formData.start_time = row.start_time ? row.start_time.slice(0, 10) : ''
  formData.end_time = row.end_time ? row.end_time.slice(0, 10) : ''
  dialogVisible.value = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      const payload = isAdmin.value
        ? formData
        : { progress: formData.progress }
      await updateProject(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createProject(formData)
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
async function handleDelete(row: ProjectItem) {
  if (!isAdmin.value) {
    ElMessage.warning('仅管理员可删除项目')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除项目「${row.name}」吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteProject(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* 取消 */ }
}

// ── Drawer ──
const drawerVisible = ref(false)
const detailData = ref<ProjectItem | null>(null)
const logs = ref<ProjectLog[]>([])
const logsLoading = ref(false)

async function openDetail(row: ProjectItem) {
  detailData.value = row
  drawerVisible.value = true
  logsLoading.value = true
  logs.value = []
  try {
    const res = await getProjectLogs(row.id)
    logs.value = res.data
  } catch {
    ElMessage.error('获取项目动态失败')
  } finally {
    logsLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchOptions()
})
</script>

<template>
  <div class="project-list">
    <div class="page-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <h2 class="toolbar__title">项目列表</h2>
        <div class="toolbar__actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索项目名称"
            clearable
            :prefix-icon="Search"
            style="width: 260px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="openCreate">
            新增项目
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
        <el-table-column prop="name" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.customer_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="manager_name" label="负责人" width="120" />
        <el-table-column prop="priority" label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="priorityMap[row.priority]?.tagType" size="small" effect="dark">
              {{ priorityMap[row.priority]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.tagType" size="small" effect="plain">
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="170">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="row.progress"
                :status="row.progress >= 100 ? 'success' : undefined"
                :stroke-width="8"
                style="flex: 1; margin-right: 8px"
              />
              <span class="progress-text">{{ row.progress }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="isAdmin || (userStore.userInfo?.id === row.manager_id)"
              text type="primary" size="small" @click="openEdit(row)"
            >编辑</el-button>
            <el-button
              v-if="isAdmin"
              text type="danger" size="small" @click="handleDelete(row)"
            >删除</el-button>
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
      :title="isEditing ? '编辑项目' : '新增项目'"
      width="620px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
        @keyup.enter="submitForm"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入" maxlength="200" :disabled="!isAdmin && isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联客户">
              <el-select v-model="formData.customer_id" placeholder="请选择" clearable filterable style="width: 100%" :disabled="!isAdmin && isEditing">
                <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入项目描述" maxlength="500" :disabled="!isAdmin && isEditing" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="formData.manager_id" placeholder="请选择" clearable filterable style="width: 100%" :disabled="!isAdmin">
                <el-option v-for="u in users" :key="u.id" :label="u.username + (u.role === 'admin' ? '(管理员)' : '')" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="formData.priority" placeholder="请选择" style="width: 100%" :disabled="!isAdmin && isEditing">
                <el-option v-for="(cfg, key) in priorityMap" :key="key" :label="cfg.label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择" style="width: 100%" :disabled="!isAdmin && isEditing">
                <el-option v-for="(cfg, key) in statusMap" :key="key" :label="cfg.label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="进度">
              <el-slider v-model="formData.progress" :min="0" :max="100" show-input style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker v-model="formData.start_time" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" :disabled="!isAdmin && isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker v-model="formData.end_time" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" :disabled="!isAdmin && isEditing" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="detailData?.name || ''"
      size="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="detailData">
        <!-- 基础信息 -->
        <div class="drawer-section">
          <h4 class="drawer-section__title">基础信息</h4>
          <div class="drawer-info-grid">
            <div class="drawer-info-row">
              <span class="drawer-info-label">状态</span>
              <el-tag :type="statusMap[detailData.status]?.tagType" size="small" effect="plain">
                {{ statusMap[detailData.status]?.label }}
              </el-tag>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">优先级</span>
              <el-tag :type="priorityMap[detailData.priority]?.tagType" size="small" effect="dark">
                {{ priorityMap[detailData.priority]?.label }}
              </el-tag>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">负责人</span>
              <span>{{ detailData.manager_name || '-' }}</span>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">关联客户</span>
              <span>{{ detailData.customer_name || '-' }}</span>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">进度</span>
              <div class="drawer-info-progress">
                <el-progress :percentage="detailData.progress" :stroke-width="10" style="flex: 1" />
                <span style="margin-left: 8px; color:#909399">{{ detailData.progress }}%</span>
              </div>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">时间</span>
              <span>{{ formatDate(detailData.start_time) }} ~ {{ formatDate(detailData.end_time) }}</span>
            </div>
            <div class="drawer-info-row">
              <span class="drawer-info-label">创建时间</span>
              <span>{{ formatTime(detailData.create_time) }}</span>
            </div>
          </div>
        </div>

        <!-- 项目描述 -->
        <div class="drawer-section" v-if="detailData.description">
          <h4 class="drawer-section__title">项目描述</h4>
          <p class="drawer-desc-text">{{ detailData.description }}</p>
        </div>

        <!-- 项目动态时间线 -->
        <div class="drawer-section">
          <h4 class="drawer-section__title">项目动态</h4>
          <div v-loading="logsLoading" class="timeline-wrap">
            <el-empty v-if="!logsLoading && logs.length === 0" description="暂无动态" />
            <div v-for="log in logs" :key="log.id" class="timeline-item">
              <div class="timeline-dot" />
              <div class="timeline-content">
                <p class="timeline-text">{{ log.content }}</p>
                <span class="timeline-time">{{ formatTime(log.create_time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.project-list { max-width: 1400px; margin: 0 auto; }
.page-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 0; }

.toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 24px 0; }
.toolbar__title { font-size: 16px; font-weight: 600; color: #303133; white-space: nowrap; }
.toolbar__actions { display: flex; align-items: center; gap: 12px; }

.el-table { margin-top: 16px; }
.progress-cell { display: flex; align-items: center; }
.progress-text { font-size: 13px; color: #909399; white-space: nowrap; }

.pagination-wrap { display: flex; justify-content: flex-end; padding: 16px 24px 20px; }

/* Drawer 详情 */
.drawer-section { padding: 0 4px 20px; }
.drawer-section__title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }

.drawer-info-grid { display: flex; flex-direction: column; gap: 0; }
.drawer-info-row { display: flex; align-items: center; gap: 16px; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f8f8f8; }
.drawer-info-label { width: 80px; flex-shrink: 0; color: #909399; }
.drawer-info-progress { display: flex; align-items: center; flex: 1; }

.drawer-desc-text { font-size: 14px; line-height: 1.6; color: #606266; margin: 0; white-space: pre-wrap; }

/* 时间线 */
.timeline-wrap { position: relative; padding-left: 20px; }
.timeline-item { position: relative; padding: 0 0 20px 12px; border-left: 2px solid #e8e8e8; margin-left: 4px; }
.timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
.timeline-dot { position: absolute; left: -7px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #409eff; border: 2px solid #fff; }
.timeline-text { font-size: 13px; color: #303133; margin: 0 0 4px; }
.timeline-time { font-size: 12px; color: #c0c4cc; }
</style>
