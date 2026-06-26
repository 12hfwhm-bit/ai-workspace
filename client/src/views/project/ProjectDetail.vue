<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getProjectList, getProjectLogs, PROJECT_STATUS, PROJECT_PRIORITY } from '@/api/project'
import type { ProjectItem, ProjectLog } from '@/api/project'

const route = useRoute()
const router = useRouter()
const project = ref<ProjectItem | null>(null)
const logs = ref<ProjectLog[]>([])
const loading = ref(true)

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getProjectList({ page: 1, size: 999 })
    project.value = res.data.list.find((p: ProjectItem) => p.id === Number(route.params.id)) || null
    if (project.value) {
      const logRes = await getProjectLogs(project.value.id)
      logs.value = logRes.data
    }
  } catch {
    ElMessage.error('获取项目详情失败')
  } finally {
    loading.value = false
  }
}

function formatDate(d: string | null): string {
  if (!d) return '-'
  return d.slice(0, 10)
}

onMounted(fetchDetail)
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <el-button text @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>返回
    </el-button>

    <template v-if="project">
      <h2 class="page-title" style="margin-top: 12px">{{ project.name }}</h2>

      <!-- 基础信息 -->
      <div class="detail-card">
        <h4 class="section-title">基础信息</h4>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">状态</span><el-tag :type="PROJECT_STATUS[project.status]?.tagType" size="small" effect="plain">{{ PROJECT_STATUS[project.status]?.label }}</el-tag></div>
          <div class="info-item"><span class="info-label">优先级</span><el-tag :type="PROJECT_PRIORITY[project.priority]?.tagType" size="small" effect="dark">{{ PROJECT_PRIORITY[project.priority]?.label }}</el-tag></div>
          <div class="info-item"><span class="info-label">负责人</span><span>{{ project.manager_name || '-' }}</span></div>
          <div class="info-item"><span class="info-label">关联客户</span><span>{{ project.customer_name || '-' }}</span></div>
          <div class="info-item"><span class="info-label">进度</span><div class="info-progress"><el-progress :percentage="project.progress" :stroke-width="10" style="flex:1;max-width:300px" /><span style="margin-left:8px;color:#909399">{{ project.progress }}%</span></div></div>
          <div class="info-item"><span class="info-label">开始时间</span><span>{{ formatDate(project.start_time) }}</span></div>
          <div class="info-item"><span class="info-label">结束时间</span><span>{{ formatDate(project.end_time) }}</span></div>
          <div class="info-item"><span class="info-label">创建时间</span><span>{{ (project.create_time||'').replace('T',' ').slice(0,19) || '-' }}</span></div>
        </div>
      </div>

      <!-- 项目描述 -->
      <div class="detail-card" v-if="project.description">
        <h4 class="section-title">项目描述</h4>
        <p class="desc-text">{{ project.description }}</p>
      </div>

      <!-- 项目动态 -->
      <div class="detail-card">
        <h4 class="section-title">项目动态</h4>
        <div class="timeline-wrap">
          <div v-for="log in logs" :key="log.id" class="timeline-item">
            <div class="timeline-dot" />
            <div class="timeline-content">
              <p class="timeline-text">{{ log.content }}</p>
              <span class="timeline-time">{{ log.create_time?.replace('T',' ').slice(0,19) || '-' }}</span>
            </div>
          </div>
          <el-empty v-if="logs.length === 0" description="暂无动态" />
        </div>
      </div>
    </template>

    <el-empty v-else description="项目不存在" />
  </div>
</template>

<style scoped>
.detail-page { max-width: 1000px; margin: 0 auto; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #303133; }
.detail-card { background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: #303133; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.info-grid { display: flex; flex-direction: column; gap: 0; }
.info-item { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f8f8f8; font-size: 14px; }
.info-item:last-child { border-bottom: none; }
.info-label { width: 80px; flex-shrink: 0; color: #909399; }
.info-progress { display: flex; align-items: center; flex: 1; }
.desc-text { font-size: 14px; line-height: 1.6; color: #606266; margin: 0; white-space: pre-wrap; }
.timeline-wrap { position: relative; padding-left: 20px; }
.timeline-item { position: relative; padding: 0 0 20px 12px; border-left: 2px solid #e8e8e8; margin-left: 4px; }
.timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
.timeline-dot { position: absolute; left: -7px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: #409eff; border: 2px solid #fff; }
.timeline-text { font-size: 13px; color: #303133; margin: 0 0 4px; }
.timeline-time { font-size: 12px; color: #c0c4cc; }
</style>
