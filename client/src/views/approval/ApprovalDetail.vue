<template>
  <div class="detail-page" v-loading="loading">
    <el-button text @click="router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
    <h2 class="page-title" style="margin-top:12px">申请详情 #{{ id }}</h2>

    <div class="detail-card">
      <h4 class="section-title">基本信息</h4>
      <div class="info-grid">
        <div class="info-row"><span class="info-label">表单类型</span><span>{{ detail.form_type }}</span></div>
        <div class="info-row"><span class="info-label">提交人</span><span>{{ detail.username }}</span></div>
        <div class="info-row"><span class="info-label">状态</span><el-tag :type="statusTag[detail.status]" size="small" effect="plain">{{ statusLabel[detail.status] }}</el-tag></div>
        <div class="info-row" v-if="detail.reason"><span class="info-label">审批意见</span><span>{{ detail.reason }}</span></div>
        <div class="info-row"><span class="info-label">提交时间</span><span>{{ (detail.create_time||'').replace('T',' ').slice(0,19) }}</span></div>
        <div class="info-row" v-if="detail.project_id"><span class="info-label">关联项目</span><span>项目 #{{ detail.project_id }}</span></div>
      </div>
    </div>

    <div class="detail-card">
      <h4 class="section-title">表单数据</h4>
      <div class="data-list" v-if="detail.form_schema?.fields">
        <div v-for="f in detail.form_schema.fields" :key="f.prop" class="data-row">
          <span class="data-label">{{ f.label }}</span>
          <span class="data-value">{{ detail.form_data?.[f.prop] ?? '-' }}</span>
        </div>
      </div>
    </div>

    <div class="action-bar" v-if="detail.status === 'pending'">
      <el-button type="success" size="large" :loading="approving" @click="handleApprove">通过</el-button>
      <el-button type="danger" size="large" :loading="rejecting" @click="showReject = true">拒绝</el-button>
    </div>
    <div class="action-bar" v-if="detail.status === 'approved' && !detail.project_id">
      <el-button type="primary" size="large" :loading="creating" @click="handleCreateProject">创建项目</el-button>
    </div>

    <el-dialog v-model="showReject" title="拒绝申请" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="rejecting">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getFormRequestDetail, approveFormRequest, rejectFormRequest, createProjectFromRequest } from '@/api/formRequest'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const loading = ref(true)
const detail = ref<any>({ form_schema: null, form_data: null, status: '' })

const statusLabel: Record<string,string> = { pending:'待审批', approved:'已通过', rejected:'已拒绝' }
const statusTag: Record<string,string> = { pending:'warning', approved:'success', rejected:'danger' }

const approving = ref(false)
const rejecting = ref(false)
const creating = ref(false)
const showReject = ref(false)
const rejectReason = ref('')

onMounted(() => fetchDetail())

async function fetchDetail() {
  loading.value = true
  try { const r = await getFormRequestDetail(id); detail.value = r.data } catch { ElMessage.error('获取详情失败') }
  finally { loading.value = false }
}

async function handleApprove() {
  approving.value = true
  try { await approveFormRequest(id); ElMessage.success('已通过'); fetchDetail() } catch { ElMessage.error('操作失败') }
  finally { approving.value = false }
}

async function handleReject() {
  if (!rejectReason.value) return ElMessage.warning('请输入拒绝原因')
  rejecting.value = true
  try { await rejectFormRequest(id, rejectReason.value); ElMessage.success('已拒绝'); showReject.value = false; fetchDetail() } catch { ElMessage.error('操作失败') }
  finally { rejecting.value = false }
}

async function handleCreateProject() {
  creating.value = true
  try { const r = await createProjectFromRequest(id); ElMessage.success('项目已创建：' + r.data.name); fetchDetail() } catch (err: any) { ElMessage.error(err?.response?.data?.message || '创建失败') }
  finally { creating.value = false }
}
</script>

<style scoped>
.detail-page { max-width: 800px; margin: 0 auto; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #303133; }
.detail-card { background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.info-grid { display: flex; flex-direction: column; }
.info-row { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f8f8f8; font-size: 14px; }
.info-row:last-child { border-bottom: none; }
.info-label { width: 80px; flex-shrink: 0; color: #909399; }
.data-list { display: flex; flex-direction: column; gap: 8px; }
.data-row { display: flex; align-items: center; gap: 16px; padding: 8px 12px; background: #fafafa; border-radius: 6px; font-size: 14px; }
.data-label { width: 100px; flex-shrink: 0; color: #909399; }
.data-value { color: #303133; }
.action-bar { display: flex; gap: 12px; padding: 8px 0; }
</style>
