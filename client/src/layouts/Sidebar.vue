﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="logo-area">
      <el-icon :size="24" color="#409eff">
        <MagicStick />
      </el-icon>
      <span v-show="!appStore.sidebarCollapsed" class="logo-text">AI 工作台</span>
    </div>
    <el-menu :default-active="route.path" :collapse="appStore.sidebarCollapsed" :router="true"
      background-color="#001529" text-color="rgba(255,255,255,0.65)" active-text-color="#fff">
      <!-- Dashboard — 所有角色 -->
      <el-menu-item index="/dashboard">
        <el-icon>
          <Odometer />
        </el-icon>
        <template #title>数据看板</template>
      </el-menu-item>

      <!-- 客户管理 — 所有角色 -->
      <el-sub-menu index="customer">
        <template #title>
          <el-icon>
            <User />
          </el-icon>
          <span>客户管理</span>
        </template>
        <el-menu-item index="/customer">客户列表</el-menu-item>
      </el-sub-menu>

      <!-- 项目管理 — 所有角色 -->
      <el-sub-menu index="project">
        <template #title>
          <el-icon>
            <List />
          </el-icon>
          <span>项目管理</span>
        </template>
        <el-menu-item index="/project">项目列表</el-menu-item>
        <el-menu-item v-if="userStore.isAdmin" index="/form-request">审批管理</el-menu-item>
      </el-sub-menu>

      <!-- AI 工作台 — 所有角色 -->
      <el-sub-menu index="ai">
        <template #title>
          <el-icon>
            <Monitor />
          </el-icon>
          <span>AI 工作台</span>
        </template>
        <el-menu-item v-if="!userStore.isAdmin" index="/ai/form">表单生成</el-menu-item>
        <el-menu-item index="/ai/analyze">数据分析</el-menu-item>
        <el-menu-item index="/ai/document">文档助手</el-menu-item>
      </el-sub-menu>

      <!-- AI 历史记录 — 仅 admin -->
      <el-menu-item v-if="userStore.isAdmin" index="/ai/history">
        <el-icon>
          <Clock />
        </el-icon>
        <template #title>AI 历史记录</template>
      </el-menu-item>

      <!-- 系统设置 — admin全部，user仅账号设置 -->
      <el-sub-menu v-if="userStore.isAdmin" index="settings">
        <template #title>
          <el-icon>
            <Setting />
          </el-icon>
          <span>系统设置</span>
        </template>
        <el-menu-item index="/settings/users">用户管理</el-menu-item>
        <el-menu-item index="/settings/ai">AI 配置</el-menu-item>
        <el-menu-item index="/settings/account">账号设置</el-menu-item>
      </el-sub-menu>
      <el-menu-item v-if="!userStore.isAdmin" index="/settings/account">
        <el-icon>
          <Setting />
        </el-icon>
        <template #title>账号设置</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100%;
  background-color: #001529;
  transition: width 0.25s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.logo-area {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.el-menu-item.is-active {
  background-color: #409eff !important;
}
</style>

