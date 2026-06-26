<template>
  <div class="settings-page-inner">
    <h3 class="content-title">AI 配置</h3>
    <div class="form-card" v-loading="loading">
      <el-form label-width="100px">
        <el-form-item label="当前 Key">
          <span class="ai-masked">{{ form.apiKeyMasked || '未配置' }}</span>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.apiKey" type="password" show-password placeholder="输入 DeepSeek API Key" />
        </el-form-item>
        <el-form-item label="模型选择">
          <el-select v-model="form.model" style="width:220px">
            <el-option v-for="m in models" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button :loading="testing" @click="handleTest">测试连接</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiConfig, updateAiConfig, testAiConnection } from '@/api/settings'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const models = ['deepseek-chat', 'deepseek-reasoner']
const form = reactive({ apiKey: '', apiKeyMasked: '', model: 'deepseek-chat' })

onMounted(() => fetchConfig())
async function fetchConfig() {
  loading.value = true
  try { const r = await getAiConfig(); Object.assign(form, r.data) } catch {}
  finally { loading.value = false }
}
async function handleSave() {
  if (!form.apiKey) return ElMessage.warning('请输入 API Key')
  saving.value = true
  try { await updateAiConfig(form.apiKey); ElMessage.success('保存成功'); fetchConfig() } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}
async function handleTest() {
  testing.value = true
  try { const r = await testAiConnection(); ElMessage.success('连接成功') } catch (err: any) { ElMessage.error(err?.response?.data?.message || '连接失败') }
  finally { testing.value = false }
}
</script>

<style scoped>
.settings-page-inner { max-width: 600px; }
.content-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 20px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.form-card { margin-bottom: 24px; }
.ai-masked { font-size: 14px; color: #606266; font-family: monospace; }
</style>
