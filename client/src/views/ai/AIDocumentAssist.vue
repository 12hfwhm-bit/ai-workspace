<template>
  <div class="doc-page">
    <!-- 左侧：上传区 -->
    <div class="panel panel-left">
      <div class="panel-header">
        <h3 class="panel-title">上传文档</h3>
        <span class="panel-hint">支持 PDF 格式</span>
      </div>

      <div v-if="!currentFile" class="upload-area">
        <el-upload
          ref="uploadRef"
          drag
          accept=".pdf"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          :limit="1"
        >
          <el-icon class="upload-icon" :size="48"><UploadFilled /></el-icon>
          <div class="upload-text">将 PDF 文件拖到此处</div>
          <template #tip>
            <div class="upload-tip">或点击选择文件 · 最大 10MB</div>
          </template>
        </el-upload>
      </div>

      <div v-else class="file-info">
        <div class="file-info__icon">
          <el-icon :size="36" color="#409eff"><Document /></el-icon>
        </div>
        <div class="file-info__body">
          <p class="file-info__name">{{ currentFile.name }}</p>
          <p class="file-info__meta">
            {{ formatSize(currentFile.size) }}
            <template v-if="result?.pages"> · {{ result.pages }} 页</template>
          </p>
        </div>
        <el-button text type="danger" size="small" @click="resetUpload" :disabled="analyzing">
          移除
        </el-button>
      </div>

      <el-button
        v-if="currentFile && !result"
        type="primary"
        size="large"
        :loading="analyzing"
        @click="startAnalyze"
        style="width:100%; margin-top: 16px"
      >
        {{ analyzing ? 'AI 分析中...' : '开始分析' }}
      </el-button>
    </div>

    <!-- 右侧：分析结果 -->
    <div class="panel panel-right" v-loading="analyzing">
      <div class="panel-header">
        <h3 class="panel-title">AI 分析结果</h3>
      </div>

      <div v-if="!result && !analyzing" class="empty-state">
        <el-icon :size="48" color="#c0c4cc"><Reading /></el-icon>
        <p class="empty-text">上传 PDF 文档开始分析</p>
        <p class="empty-hint">AI 将提取摘要、关键点、风险和建议</p>
      </div>

      <template v-if="result">
        <!-- 摘要 -->
        <div class="result-card">
          <h4 class="result-card__title">
            <el-icon color="#409eff"><List /></el-icon> 文档摘要
          </h4>
          <p class="summary-text">{{ result.summary }}</p>
        </div>

        <!-- 关键点 -->
        <div class="result-card">
          <h4 class="result-card__title">
            <el-icon color="#67c23a"><CircleCheck /></el-icon> 关键要点
          </h4>
          <div class="tags-wrap">
            <el-tag v-for="(kw, i) in result.keywords" :key="i" type="success" size="small" effect="plain" class="kw-tag">
              {{ kw }}
            </el-tag>
          </div>
        </div>

        <!-- 风险提示 -->
        <div class="result-card" v-if="result.risks?.length">
          <h4 class="result-card__title">
            <el-icon color="#e6a23c"><WarningFilled /></el-icon> 风险提示
          </h4>
          <ul class="list-items">
            <li v-for="(r, i) in result.risks" :key="i" class="list-item list-item--warning">
              <el-tag size="small" round type="warning">{{ i + 1 }}</el-tag>
              <span>{{ r }}</span>
            </li>
          </ul>
        </div>

        <!-- 行动建议 -->
        <div class="result-card">
          <h4 class="result-card__title">
            <el-icon color="#409eff"><Pointer /></el-icon> 行动建议
          </h4>
          <ul class="list-items">
            <li v-for="(s, i) in result.suggestions" :key="i" class="list-item list-item--primary">
              <el-tag size="small" round type="primary">{{ i + 1 }}</el-tag>
              <span>{{ s }}</span>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Reading, List, CircleCheck, WarningFilled, Pointer } from '@element-plus/icons-vue'
import { analyzeDocument } from '@/api/ai'
import type { DocumentResult } from '@/api/ai'
import type { UploadInstance, UploadRawFile } from 'element-plus'

const uploadRef = ref<UploadInstance>()
const currentFile = ref<File | null>(null)
const analyzing = ref(false)
const result = ref<DocumentResult | null>(null)

function handleFileChange(uploadFile: { raw?: File; status?: string }) {
  if (uploadFile.status === 'ready' && uploadFile.raw) {
    currentFile.value = uploadFile.raw
    // 自动开始分析
    startAnalyze()
  }
}

async function startAnalyze() {
  if (!currentFile.value) return
  analyzing.value = true
  result.value = null
  try {
    const res = await analyzeDocument(currentFile.value)
    result.value = res.data
    ElMessage.success('文档分析完成')
  } catch (err: any) {
    const msg = err?.response?.data?.message || '分析失败，请重试'
    ElMessage.error(msg)
  } finally {
    analyzing.value = false
  }
}

function resetUpload() {
  currentFile.value = null
  result.value = null
  uploadRef.value?.clearFiles()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.doc-page {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 100px);
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.panel-header { margin-bottom: 16px; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0; }
.panel-hint { font-size: 12px; color: #c0c4cc; display: block; margin-top: 2px; }

/* 上传区 */
.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 20px;
}

.upload-icon { margin-bottom: 12px; }
.upload-text { font-size: 14px; color: #606266; margin-bottom: 4px; }
.upload-tip { font-size: 12px; color: #c0c4cc; }

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 10px;
}

.file-info__body { flex: 1; min-width: 0; }
.file-info__name { font-size: 14px; font-weight: 500; color: #303133; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-info__meta { font-size: 12px; color: #909399; margin: 0; }

/* 右侧空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #c0c4cc;
}

.empty-text { font-size: 14px; color: #909399; margin: 12px 0 4px; }
.empty-hint { font-size: 12px; color: #c0c4cc; margin: 0; }

/* 结果卡片 */
.result-card {
  margin-bottom: 16px;
}

.result-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  margin: 0;
  padding: 12px 16px;
  background: #f0f7ff;
  border-radius: 8px;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kw-tag {
  font-size: 13px;
  padding: 6px 12px;
}

.list-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: 8px;
}

.list-item--warning { background: #fdf6ec; }
.list-item--primary { background: #f0f7ff; }
</style>
