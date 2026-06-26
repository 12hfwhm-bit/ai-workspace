<template>
  <div class="analyze-page">
    <!-- 顶部筛选 -->
    <div class="top-bar">
      <div class="top-bar__left">
        <h2 class="top-bar__title">AI 数据分析</h2>
        <span class="top-bar__hint">基于业务数据的智能分析</span>
      </div>
      <div class="top-bar__right">
        <el-radio-group v-model="analysisType" size="large">
          <el-radio-button value="customer">客户分析</el-radio-button>
          <el-radio-button value="project">项目分析</el-radio-button>
        </el-radio-group>
        <el-button type="primary" size="large" :loading="loading" @click="handleAnalyze">
          {{ loading ? '分析中...' : '开始分析' }}
        </el-button>
      </div>
    </div>

    <div v-if="!result && !loading" class="empty-state">
      <el-icon :size="56" color="#c0c4cc"><DataAnalysis /></el-icon>
      <p class="empty-text">选择分析类型，点击「开始分析」</p>
      <p class="empty-hint">AI 将读取业务数据并生成分析报告</p>
    </div>

    <template v-if="result">
      <!-- 分析结论 -->
      <div class="result-card">
        <h3 class="section-title">
          <el-icon><Trophy /></el-icon> 分析结论
        </h3>
        <p class="summary-text">{{ result.summary }}</p>
      </div>

      <!-- 优化建议 -->
      <div class="result-card">
        <h3 class="section-title">
          <el-icon><WarningFilled /></el-icon> 优化建议
        </h3>
        <ul class="suggestions-list">
          <li v-for="(s, i) in result.suggestions" :key="i" class="suggestion-item">
            <el-tag size="small" round :type="['warning','primary','success'][i % 3]">{{ i + 1 }}</el-tag>
            <span>{{ s }}</span>
          </li>
        </ul>
      </div>

      <!-- 图表 -->
      <div class="chart-card">
        <h3 class="section-title">
          <el-icon><Histogram /></el-icon> {{ result.chartTitle }}
        </h3>
        <VChart :option="chartOption" autoresize style="height: 350px" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Trophy, WarningFilled, Histogram } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { analyzeData } from '@/api/ai'
import type { AnalysisResult } from '@/api/ai'

use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const analysisType = ref<'customer' | 'project'>('customer')
const loading = ref(false)
const result = ref<AnalysisResult | null>(null)

async function handleAnalyze() {
  loading.value = true
  result.value = null
  try {
    const res = await analyzeData(analysisType.value)
    result.value = res.data
    ElMessage.success('分析完成')
  } catch (err: any) {
    const msg = err?.response?.data?.message || '分析失败，请重试'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

const chartOption = computed<EChartsOption>(() => {
  if (!result.value) return {}
  const r = result.value
  const base = {
    tooltip: { trigger: r.chartType === 'pie' ? 'item' : 'axis' as const },
    grid: r.chartType !== 'pie' ? { left: 50, right: 30, top: 20, bottom: 35 } : undefined,
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#b37feb'],
  }
  if (r.chartType === 'pie') {
    return {
      ...base,
      series: [{
        type: 'pie', radius: ['40%', '70%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', color: '#606266', fontSize: 12 },
        data: r.chartLabels.map((l, i) => ({ name: l, value: r.chartValues[i] })),
      }],
    }
  }
  return {
    ...base,
    xAxis: { type: 'category', data: r.chartLabels, axisLine: { lineStyle: { color: '#e0e0e0' } }, axisLabel: { color: '#909399' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' as const } }, axisLabel: { color: '#909399' } },
    series: [{
      type: r.chartType,
      data: r.chartValues,
      barWidth: '40%',
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    }],
  }
})
</script>

<style scoped>
.analyze-page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.top-bar__left { display: flex; flex-direction: column; gap: 2px; }
.top-bar__title { font-size: 18px; font-weight: 600; color: #303133; margin: 0; }
.top-bar__hint { font-size: 12px; color: #c0c4cc; }
.top-bar__right { display: flex; align-items: center; gap: 12px; }

.empty-state {
  background: #fff;
  border-radius: 12px;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.empty-text { font-size: 15px; color: #909399; margin: 16px 0 4px; }
.empty-hint { font-size: 13px; color: #c0c4cc; margin: 0; }

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
  margin: 0;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  padding: 8px 0;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
</style>
