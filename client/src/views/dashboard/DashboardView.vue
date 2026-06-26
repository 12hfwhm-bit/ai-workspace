<template>
  <div class="dashboard" v-loading="loading">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <StatCard title="客户总数" :value="s.customerCount" :icon="UserFilled" color="#409eff" />
      <StatCard title="项目总数" :value="s.projectCount" :icon="List" color="#67c23a" />
      <StatCard title="AI 调用次数" :value="s.aiCount" :icon="Cpu" color="#e6a23c" />
      <StatCard title="本月新增客户" :value="s.newCustomerThisMonth" :icon="TrendCharts" color="#f56c6c" />
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-card__title">客户增长趋势</h3>
        <VChart :option="growthOption" autoresize style="height: 280px" />
      </div>
      <div class="chart-card">
        <h3 class="chart-card__title">项目状态分布</h3>
        <VChart :option="projectOption" autoresize style="height: 280px" />
      </div>
    </div>

    <!-- 底部区域 -->
    <div class="bottom-grid">
      <!-- 近期动态 -->
      <div class="page-card">
        <h3 class="section-title">近期动态</h3>
        <div class="activity-list">
          <template v-if="s.recentActivity?.length">
            <ActivityItem v-for="item in s.recentActivity" :key="item.id" :activity="item as any" />
          </template>
          <el-empty v-else description="暂无动态" :image-size="60" />
        </div>
      </div>

      <!-- 待办事项 + 快捷操作 -->
      <div class="page-card">
        <h3 class="section-title">待办事项</h3>
        <div class="task-grid">
          <div v-for="task in s.todoItems" :key="task.id" class="task-card" :style="{ borderLeftColor: task.color }" @click="router.push(task.link)">
            <div class="task-card__header">
              <el-icon :size="18" :color="task.color"><component :is="iconMap[task.iconName]" /></el-icon>
              <span class="task-card__title">{{ task.title }}</span>
            </div>
            <div class="task-card__value" :style="{ color: task.color }">{{ task.count }}</div>
          </div>
        </div>

        <h3 class="section-title" style="margin-top:20px">快捷操作</h3>
        <div class="quick-grid">
          <div v-for="act in quickActions" :key="act.label" class="quick-item" @click="router.push(act.link)">
            <el-icon :size="22" :color="act.color"><component :is="act.icon" /></el-icon>
            <span>{{ act.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserFilled, List, Cpu, TrendCharts, Plus, Document, DataAnalysis } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'

import StatCard from '@/components/StatCard.vue'
import ActivityItem from '@/components/ActivityItem.vue'
import { getDashboardSummary } from '@/api/dashboard'
import type { DashboardSummary } from '@/api/dashboard'
import type { Component } from 'vue'

use([LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const router = useRouter()
const loading = ref(true)
const s = reactive<DashboardSummary>({
  customerCount: 0, projectCount: 0, aiCount: 0, newCustomerThisMonth: 0,
  projectStatusStats: [], customerTrend: [], recentActivity: [], todoItems: [],
})

onMounted(async () => {
  try {
    const res = await getDashboardSummary()
    Object.assign(s, res.data)
  } catch {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
})

const iconMap: Record<string, Component> = { UserFilled, List, Document, Cpu }

const quickActions = [
  { label: '新增客户', link: '/customer', icon: Plus, color: '#409eff' },
  { label: '新建项目', link: '/project', icon: List, color: '#67c23a' },
  { label: 'AI 表单', link: '/ai/form', icon: Document, color: '#e6a23c' },
  { label: 'AI 分析', link: '/ai/analyze', icon: DataAnalysis, color: '#f56c6c' },
]

const statusLabel: Record<string,string> = { pending:'未开始', in_progress:'进行中', completed:'已完成' }
const statusColor: Record<string,string> = { pending:'#e6a23c', in_progress:'#409eff', completed:'#67c23a' }

const growthOption = computed<EChartsOption>(() => {
  const d = s.customerTrend
  if (!d.length) return {}
  return {
    tooltip:{trigger:'axis'}, grid:{left:40,right:20,top:20,bottom:30},
    xAxis:{type:'category',data:d.map(i=>i.month.slice(5)),axisLine:{lineStyle:{color:'#e0e0e0'}},axisLabel:{color:'#909399',fontSize:12}},
    yAxis:{type:'value',splitLine:{lineStyle:{color:'#f5f5f5',type:'dashed'}},axisLabel:{color:'#909399',fontSize:12}},
    series:[{type:'line',data:d.map(i=>i.count),smooth:true,symbol:'circle',symbolSize:8,lineStyle:{width:3,color:'#409eff'},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(64,158,255,0.25)'},{offset:1,color:'rgba(64,158,255,0.02)'}]}},itemStyle:{color:'#409eff'}}],
  }
})

const projectOption = computed<EChartsOption>(() => {
  const d = s.projectStatusStats
  if (!d.length) return {}
  return {
    tooltip:{trigger:'item',formatter:'{b}: {c} ({d}%)'},
    series:[{type:'pie',radius:['48%','70%'],itemStyle:{borderRadius:6,borderColor:'#fff',borderWidth:2},label:{show:true,position:'outside',formatter:'{b}\\n{d}%',color:'#606266',fontSize:12},data:d.map(i=>({name:statusLabel[i.status]||i.status,value:i.count})),color:d.map(i=>statusColor[i.status]||'#909399')}],
  }
})
</script>

<style scoped>
.dashboard { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.chart-card__title { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #303133; }
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.page-card { background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: #303133; }
.activity-list { margin-top: 4px; }

.task-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.task-card { background: #fafafa; border-radius: 10px; padding: 14px 16px; border-left: 3px solid; cursor: pointer; transition: box-shadow 0.2s; }
.task-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.task-card__header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.task-card__title { font-size: 13px; color: #606266; }
.task-card__value { font-size: 24px; font-weight: 700; line-height: 1.2; }

.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; background: #fafafa; border-radius: 10px; cursor: pointer; transition: box-shadow 0.2s; }
.quick-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.quick-item span { font-size: 12px; color: #606266; white-space: nowrap; }
</style>
