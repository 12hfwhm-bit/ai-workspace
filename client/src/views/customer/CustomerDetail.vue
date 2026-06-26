<template>
  <div class="page-placeholder">
    <el-button text @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon>返回
    </el-button>
    <h2 class="page-title" style="margin-top: 12px">客户详情</h2>
    <p class="page-desc">客户详情将在 Phase 2 开发。</p>
  </div>
</template>

<style scoped>
.page-placeholder { max-width: 1200px; }
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.page-desc { color: #909399; font-size: 14px; }
</style>
