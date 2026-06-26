<template>
  <div class="history-page">
    <div class="page-card">
      <div class="toolbar">
        <h2 class="toolbar__title">AI 表单历史</h2>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#fafafa', color: '#606266' }"
        @row-click="openDetail"
      >
        <el-table-column prop="input" label="需求" min-width="280" show-overflow-tooltip />
        <el-table-column label="字段数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ getFieldCount(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="创建人" width="120" />
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.create_time) }}
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 详情 Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="detailData?.input || ''"
      size="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="detailData">
        <div class="drawer-section">
          <h4 class="drawer-section__title">需求描述</h4>
          <p class="drawer-text">{{ detailData.input }}</p>
        </div>
        <div class="drawer-section">
          <h4 class="drawer-section__title">生成时间</h4>
          <p class="drawer-text">{{ formatTime(detailData.create_time) }}</p>
        </div>
        <div class="drawer-section" v-if="detailSchema">
          <h4 class="drawer-section__title">表单 Schema</h4>
          <div class="schema-meta">
            <span class="schema-meta__label">标题：</span>
            <span>{{ detailSchema.title }}</span>
          </div>
          <div class="schema-meta">
            <span class="schema-meta__label">字段数：</span>
            <span>{{ detailSchema.fields.length }}</span>
          </div>
          <el-table :data="detailSchema.fields" stripe size="small" style="margin-top: 12px">
            <el-table-column prop="label" label="字段名" min-width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ typeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="required" label="必填" width="60" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.required" color="#67c23a"><Check /></el-icon>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="options" label="选项" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.options">{{ row.options.map((o: any) => o.label).join('、') }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { getHistoryList } from '@/api/ai'
import type { HistoryItem, FormSchema } from '@/api/ai'

// ── 表格数据 ──
const tableData = ref<HistoryItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const res = await getHistoryList({ page: currentPage.value, size: pageSize.value })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch {
    // 静默
  } finally {
    loading.value = false
  }
}

function formatTime(t: string): string {
  if (!t) return '-'
  return t.replace('T', ' ').slice(0, 19)
}

function getFieldCount(row: HistoryItem): number {
  try {
    const result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
    return result?.fields?.length || 0
  } catch {
    return 0
  }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = { input: '文本框', textarea: '多行文本', select: '下拉框', date: '日期', number: '数字' }
  return map[type] || type
}

// ── Drawer ──
const drawerVisible = ref(false)
const detailData = ref<HistoryItem | null>(null)
const detailSchema = ref<FormSchema | null>(null)

function openDetail(row: HistoryItem) {
  detailData.value = row
  try {
    const result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
    detailSchema.value = result as FormSchema
  } catch {
    detailSchema.value = null
  }
  drawerVisible.value = true
}

onMounted(fetchData)
</script>

<style scoped>
.history-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 0;
}

.toolbar {
  padding: 20px 24px 0;
}

.toolbar__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 表格可点击行 */
.el-table :deep(.el-table__body tr) {
  cursor: pointer;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px 20px;
}

/* Drawer */
.drawer-section {
  padding: 0 4px 20px;
}

.drawer-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.schema-meta {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.schema-meta__label {
  color: #909399;
}
</style>
