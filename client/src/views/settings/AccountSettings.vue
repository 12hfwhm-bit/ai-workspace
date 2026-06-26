<template>
  <div class="settings-page-inner">
    <h3 class="content-title">账号信息</h3>
    <div class="info-card">
      <el-form label-width="100px">
        <el-form-item label="用户名">
          <span class="info-text">{{ userStore.userInfo?.username || '-' }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-tag size="small" :type="userStore.isAdmin?'danger':'primary'" effect="plain">{{ userStore.isAdmin?'管理员':'普通用户' }}</el-tag>
        </el-form-item>
      </el-form>
    </div>

    <h3 class="content-title" style="margin-top:28px">修改密码</h3>
    <div class="info-card">
      <el-form label-width="100px">
        <el-form-item label="当前密码">
          <el-input v-model="pwdForm.currentPassword" type="password" show-password placeholder="请输入当前密码" style="max-width:320px" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位" style="max-width:320px" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" style="max-width:320px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleChangePwd">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>

    <h3 class="content-title" style="margin-top:28px">退出登录</h3>
    <div class="info-card">
      <p class="logout-desc">退出后将需要重新登录</p>
      <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { changePassword } from '@/api/settings'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)
const pwdForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

async function handleChangePwd() {
  if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) return ElMessage.warning('请填写完整信息')
  if (pwdForm.newPassword.length < 6) return ElMessage.warning('密码长度不能少于 6 位')
  if (pwdForm.newPassword !== pwdForm.confirmPassword) return ElMessage.warning('两次密码不一致')
  saving.value = true
  try { await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }); ElMessage.success('密码修改成功'); pwdForm.currentPassword = ''; pwdForm.newPassword = ''; pwdForm.confirmPassword = '' }
  catch (err: any) { ElMessage.error(err?.response?.data?.message || '修改失败') }
  finally { saving.value = false }
}

function handleLogout() { userStore.logout(); router.push('/login') }
</script>

<style scoped>
.settings-page-inner { max-width: 600px; }
.content-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.info-card { margin-bottom: 24px; }
.info-text { font-size: 14px; color: #606266; }
.logout-desc { font-size: 13px; color: #909399; margin: 0 0 12px; }
</style>
