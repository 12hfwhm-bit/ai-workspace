 <template>
   <div class="activity-item">
     <div class="activity-item__dot" :style="{ backgroundColor: activity.color }" />
     <div class="activity-item__body">
       <div class="activity-item__header">
         <el-tag :color="activity.color" :style="{ color: '#fff', border: 'none' }" size="small" round>
           {{ activity.typeLabel }}
         </el-tag>
         <span class="activity-item__time">{{ activity.time }}</span>
       </div>
       <p class="activity-item__desc">{{ activity.description }}</p>
     </div>
   </div>
 </template>
 
 <script setup lang="ts">
 import type { RecentActivity } from '@/utils/mock-data'
 
 defineProps<{
   activity: RecentActivity
 }>()
 </script>
 
 <style scoped>
 .activity-item {
   display: flex;
   gap: 14px;
   padding: 14px 0;
 }
 
 .activity-item + .activity-item {
   border-top: 1px solid #f0f0f0;
 }
 
 .activity-item__dot {
   width: 10px;
   height: 10px;
   border-radius: 50%;
   flex-shrink: 0;
   margin-top: 5px;
 }
 
 .activity-item__body {
   flex: 1;
   min-width: 0;
 }
 
 .activity-item__header {
   display: flex;
   align-items: center;
   gap: 10px;
   margin-bottom: 4px;
 }
 
 .activity-item__time {
   font-size: 12px;
   color: #c0c4cc;
 }
 
 .activity-item__desc {
   font-size: 14px;
   color: #303133;
   line-height: 1.5;
 }
 </style>
