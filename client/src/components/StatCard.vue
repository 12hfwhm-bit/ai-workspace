 <template>
   <div class="stat-card" :style="{ borderLeftColor: color }">
     <div class="stat-card__header">
       <el-icon :size="20" :color="color">
         <component :is="icon" />
       </el-icon>
       <span class="stat-card__title">{{ title }}</span>
     </div>
     <div class="stat-card__value" :style="{ color }">{{ value }}</div>
     <div v-if="trend !== undefined" class="stat-card__trend" :class="trend >= 0 ? 'up' : 'down'">
       <el-icon :size="12">
         <Top v-if="trend >= 0" />
         <Bottom v-else />
       </el-icon>
       <span>{{ Math.abs(trend) }}% 较上月</span>
     </div>
   </div>
 </template>
 
 <script setup lang="ts">
 import type { Component } from 'vue'
 
 defineProps<{
   title: string
   value: string | number
   icon: string | Component
   color: string
   trend?: number
 }>()
 </script>
 
 <style scoped>
 .stat-card {
   background: #fff;
   border-radius: 12px;
   padding: 20px 24px;
   border-left: 4px solid;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
   transition: box-shadow 0.25s ease, transform 0.25s ease;
 }
 
 .stat-card:hover {
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
   transform: translateY(-2px);
 }
 
 .stat-card__header {
   display: flex;
   align-items: center;
   gap: 8px;
   margin-bottom: 12px;
 }
 
 .stat-card__title {
   font-size: 14px;
   color: #606266;
 }
 
 .stat-card__value {
   font-size: 28px;
   font-weight: 700;
   line-height: 1.2;
   margin-bottom: 8px;
 }
 
 .stat-card__trend {
   display: flex;
   align-items: center;
   gap: 4px;
   font-size: 12px;
 }
 
 .stat-card__trend.up {
   color: #67c23a;
 }
 
 .stat-card__trend.down {
   color: #f56c6c;
 }
 </style>
