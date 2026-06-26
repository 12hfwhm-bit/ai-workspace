<template>
  <div class="form-page">
    <div class="panel panel-left">
      <div class="panel-header">
        <h3 class="panel-title">需求描述</h3>
        <span class="panel-hint">用自然语言描述你需要的表单</span>
      </div>
      <el-input v-model="inputText" type="textarea" :rows="8" placeholder="例如：生成客户拜访审批单，包含客户名称、拜访类型（初次拜访/回访）、拜访日期、拜访内容、预计金额" maxlength="500" show-word-limit />
      <div class="examples">
        <span class="examples-label">试试：</span>
        <el-tag v-for="ex in examples" :key="ex" size="small" effect="plain" class="example-tag" @click="inputText = ex">{{ ex }}</el-tag>
      </div>
      <el-button type="primary" size="large" :loading="generating" :disabled="!inputText.trim()" @click="startGenerate" style="width:100%">{{ generating ? 'AI 生成中...' : '生成表单' }}</el-button>
      <el-divider />
      <div class="history-section">
        <div class="history-header"><span style="font-size:14px;font-weight:600;color:#303133">历史记录</span><el-button v-if="historyList.length" text type="primary" size="small" @click="$router.push('/ai/history')">查看全部</el-button></div>
        <div v-loading="historyLoading" class="history-list">
          <div v-for="item in historyList" :key="item.id" class="history-item" @click="loadFromHistory(item)">
            <div class="history-item__input">{{ item.input }}</div>
            <div class="history-item__time">{{ formatTime(item.create_time) }}</div>
          </div>
          <el-empty v-if="!historyLoading && !historyList.length" description="暂无历史记录" :image-size="60" />
        </div>
      </div>
    </div>

    <div class="panel panel-right" v-loading="generating">
      <div class="panel-header">
        <h3 class="panel-title">表单预览</h3>
        <span v-if="schema" class="panel-hint">{{ schema.fields.length }} 个字段</span>
      </div>
      <div v-if="!schema && !generating" class="empty-state">
        <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
        <p class="empty-text">在左侧输入需求，点击「生成表单」</p>
        <p class="empty-hint">AI 将自动生成对应的表单结构</p>
      </div>
      <template v-if="schema">
        <FormRenderer :schema="schema" @submit="handleFormSubmit" />
        <div v-if="formData" style="margin-top:16px">
          <el-button type="primary" size="large" :loading="submitting" @click="submitRequest" style="width:100%">提交申请</el-button>
        </div>
        <el-collapse style="margin-top:16px">
          <el-collapse-item title="查看 Schema (JSON)">
            <pre>{{ JSON.stringify(schema, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </template>
      <div v-if="myRequests.length" style="margin-top:20px">
        <h4 style="font-size:14px;font-weight:600;color:#303133;margin:0 0 8px">我的申请</h4>
        <div v-for="r in myRequests" :key="r.id" class="req-item" @click="$router.push('/form-request/'+r.id)">
          <div><div style="font-size:13px;color:#303133">{{ r.form_type }}</div><div style="font-size:11px;color:#c0c4cc;margin-top:2px">{{ (r.create_time||'').slice(0,16).replace('T',' ') }}</div></div>
          <el-tag :type="statusTag[r.status]||'info'" size="small" effect="plain">{{ statusLabel[r.status]||r.status }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { generateForm, getHistoryList } from '@/api/ai'
import { submitFormRequest, getFormRequestList } from '@/api/formRequest'
import type { FormSchema, HistoryItem } from '@/api/ai'
import FormRenderer from '@/components/FormRenderer.vue'

const inputText = ref('')
const generating = ref(false)
const schema = ref<FormSchema | null>(null)
const formData = ref<Record<string, any> | null>(null)
const submitting = ref(false)

const myRequests = ref<any[]>([])
const statusLabel: Record<string,string> = { pending:'待审批', approved:'已通过', rejected:'已拒绝' }
const statusTag: Record<string,string> = { pending:'warning', approved:'success', rejected:'danger' }
const examples = ['生成客户拜访审批单','生成请假申请表单','生成项目立项申请单','生成费用报销单']

const historyList = ref<HistoryItem[]>([])
const historyLoading = ref(false)

onMounted(() => { fetchHistory(); fetchMyRequests() })

async function startGenerate() {
  if (!inputText.value.trim()) return
  generating.value = true; schema.value = null; formData.value = null
  try {
    const res = await generateForm(inputText.value)
    schema.value = res.data.schema
    ElMessage.success('表单生成成功')
    fetchHistory()
  } catch (err: any) { ElMessage.error(err?.response?.data?.message || '生成失败') }
  finally { generating.value = false }
}

function handleFormSubmit(data: Record<string, any>) { formData.value = data }

async function submitRequest() {
  if (!schema.value || !formData.value) return
  submitting.value = true
  try {
    const res = await submitFormRequest({ formSchema: schema.value, formData: formData.value })
    ElMessage.success(res.message)
    formData.value = null; schema.value = null; inputText.value = ''
    fetchMyRequests()
  } catch { ElMessage.error('提交失败') }
  finally { submitting.value = false }
}

async function fetchHistory() {
  historyLoading.value = true
  try { const r = await getHistoryList({ page: 1, size: 10 }); historyList.value = r.data.list } catch {}
  finally { historyLoading.value = false }
}

function loadFromHistory(item: HistoryItem) {
  try { const r = typeof item.result === 'string' ? JSON.parse(item.result) : item.result; if (r?.title && r?.fields) schema.value = r as FormSchema } catch {}
}

async function fetchMyRequests() {
  try { const r = await getFormRequestList({ page: 1, size: 10 }); myRequests.value = r.data.list } catch {}
}

function formatTime(t: string): string { if (!t) return ''; return t.replace('T',' ').slice(0,16) }
</script>

<style scoped>
.form-page { display:grid; grid-template-columns:380px 1fr; gap:20px; max-width:1200px; margin:0 auto; min-height:calc(100vh - 100px) }
.panel { background:#fff; border-radius:12px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04) }
.panel-header { margin-bottom:16px }
.panel-title { font-size:16px; font-weight:600; color:#303133; margin:0 }
.panel-hint { font-size:12px; color:#c0c4cc; display:block; margin-top:2px }
.examples { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin:12px 0 }
.examples-label { font-size:12px; color:#909399; flex-shrink:0 }
.example-tag { cursor:pointer; transition:all 0.2s }
.example-tag:hover { color:#409eff; border-color:#409eff }
.history-section { flex:1; display:flex; flex-direction:column; min-height:0 }
.history-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
.history-list { max-height:240px; overflow-y:auto }
.history-item { padding:8px 12px; border-radius:8px; cursor:pointer; transition:background 0.2s; margin-bottom:2px }
.history-item:hover { background:#f0f7ff }
.history-item__input { font-size:13px; color:#303133; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px }
.history-item__time { font-size:11px; color:#c0c4cc }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; color:#c0c4cc }
.empty-text { font-size:14px; color:#909399; margin:12px 0 4px }
.empty-hint { font-size:12px; color:#c0c4cc; margin:0 }
.req-item { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:8px; cursor:pointer; transition:background 0.2s; margin-bottom:4px }
.req-item:hover { background:#f0f7ff }
</style>
