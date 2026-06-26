<template>
  <div class="settings-page-inner">
    <h3 class="content-title">用户管理</h3>
    <el-table :data="users" stripe :header-cell-style="{background:'#fafafa',color:'#606266'}">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{row}">
          <el-select :model-value="row.role" size="small" @change="(v:string)=>changeRole(row.id,v)" style="width:100px">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{row}">
          <el-tag :type="row.status===1?'success':'danger'" size="small" effect="plain">{{ row.status===1?'启用':'禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="100">
        <template #default="{row}">
          <el-button text size="small" :type="row.status===1?'warning':'success'" @click="toggleStatus(row)">{{ row.status===1?'禁用':'启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, updateUserRole, toggleUserStatus } from '@/api/settings'
import type { UserItem } from '@/api/settings'

const users = ref<UserItem[]>([])
onMounted(() => fetchUsers())

async function fetchUsers() { try { const r = await getUsers(); users.value = r.data } catch {} }
async function changeRole(id: number, role: string) {
  try { await updateUserRole(id, role); ElMessage.success('角色已更新'); fetchUsers() } catch { ElMessage.error('更新失败') }
}
async function toggleStatus(row: UserItem) {
  const ns = row.status === 1 ? 0 : 1
  const act = ns === 0 ? '禁用' : '启用'
  try { await ElMessageBox.confirm('确定' + act + '用户「' + row.username + '」吗？', '确认'); await toggleUserStatus(row.id, ns); ElMessage.success('用户已' + act); fetchUsers() } catch {}
}
</script>

<style scoped>
.settings-page-inner { max-width: 900px; }
.content-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 20px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
</style>
