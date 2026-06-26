<template>
  <div class="approval-page">
    <div class="page-card">
      <div class="toolbar">
        <h2 class="toolbar__title">审批管理</h2>
        <el-radio-group v-model="filterStatus" size="small">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待审批</el-radio-button>
          <el-radio-button value="approved">已通过</el-radio-button>
          <el-radio-button value="rejected">已拒绝</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="list" v-loading="loading" stripe @row-click="goDetail" style="cursor:pointer" :header-cell-style="{background:'#fafafa',color:'#606266'}">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="提交人" width="100" />
        <el-table-column prop="form_type" label="表单类型" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{row}"><el-tag :type="statusTag[row.status]" size="small" effect="plain">{{ statusLabel[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="create_time" label="提交时间" min-width="170" />
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total" layout="total,prev,pager,next" background @current-change="fetchData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getFormRequestList } from '@/api/formRequest'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const filterStatus = ref('')
const statusLabel: Record<string,string> = { pending:'待审批', approved:'已通过', rejected:'已拒绝' }
const statusTag: Record<string,string> = { pending:'warning', approved:'success', rejected:'danger' }

watch(filterStatus, () => { page.value = 1; fetchData() })

async function fetchData() {
  loading.value = true
  try { const r = await getFormRequestList({ page: page.value, size: size.value, status: filterStatus.value || undefined }); list.value = r.data.list; total.value = r.data.total } catch {}
  finally { loading.value = false }
}
function goDetail(row: any) { router.push('/form-request/' + row.id) }

fetchData()
</script>

<style scoped>
.approval-page { max-width: 1200px; margin: 0 auto; }
.page-card { background: #fff; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px 24px 0; }
.toolbar__title { font-size: 16px; font-weight: 600; color: #303133; margin: 0; }
.pagination-wrap { display: flex; justify-content: flex-end; padding: 16px 24px 20px; }
</style>
