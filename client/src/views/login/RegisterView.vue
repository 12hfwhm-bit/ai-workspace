<template>
  <div class="register-page">
    <div class="register-left">
      <div class="brand-top">
        <svg class="brand-logo" width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="#3370FF" />
          <path d="M8 16L12 20L20 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="brand-text">AI WorkSpace</span>
      </div>
      <div class="brand-center">
        <h1 class="brand-title">AI 企业数字化工作台</h1>
        <p class="brand-desc">智能化驱动，重塑企业协同效率。为未来组织打造的下一代工作平台，无缝连接人、业务与数据。</p>
      </div>
      <div class="brand-bottom">
        <p class="copyright">&copy; 2026 AI Enterprise Solutions. All rights reserved.</p>
      </div>
    </div>

    <div class="register-right">
      <div class="register-card">
        <div class="card-header">
          <h2 class="card-title">创建账号</h2>
          <p class="card-subtitle">注册一个新账号以使用工作台</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleRegister">
          <el-form-item prop="username">
            <div class="form-field">
              <label class="field-label">用户名</label>
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="form-field">
              <label class="field-label">密码</label>
              <el-input v-model="form.password" type="password" placeholder="至少 6 位密码" show-password />
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="form-field">
              <label class="field-label">确认密码</label>
              <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="register-btn" :loading="loading" @click="handleRegister">
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="card-footer">
          <p class="login-link">
            已有账号？
            <router-link to="/login" class="link">去登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { registerApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const validateConfirm = (_rule: any, value: string, callback: (e?: Error) => void) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为 2-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await registerApi({
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err: any) {
    const msg = err?.response?.data?.message || '注册失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  min-height: 100vh;
  background: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.register-left {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 48px;
  background: #F5F7FA;
}

.brand-top { display: flex; align-items: center; gap: 8px; }
.brand-logo { margin-top: 50px; flex-shrink: 0; }
.brand-text { margin-top: 50px; font-size: 18px; font-weight: 550; color: #1D2129; }

.brand-center { flex: 1; display: flex; flex-direction: column; justify-content: center; max-width: 420px; }
.brand-title { font-size: 60px; font-weight: 700; color: #1D2129; line-height: 1.25; margin: 0 0 16px; width: 650px; }
.brand-desc { font-size: 19px; color: #86909C; line-height: 1.6; margin: 0; }
.brand-bottom { padding-top: 20px; }
.copyright { font-size: 17px; color: #86909C; margin: 0; }

.register-right {
  flex: 0 0 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #FFFFFF;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 12px;
  padding: 40px 36px;
}

.card-header { margin-bottom: 32px; }
.card-title { font-size: 28px; font-weight: 700; color: #1D2129; margin: 0 0 8px; }
.card-subtitle { font-size: 13px; color: #86909C; margin: 0; }

.form-field { width: 100%; }
.field-label { display: block; font-size: 14px; font-weight: 500; color: #1D2129; margin-bottom: 6px; }

.register-card :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 6px;
  border: 1px solid #E5E6EB;
  box-shadow: none !important;
  padding: 0 12px;
  background: #FFFFFF;
  transition: all 0.2s ease;
}

.register-card :deep(.el-input__wrapper:hover) { border-color: #C9CDD4; }
.register-card :deep(.el-input__wrapper.is-focus) { border-color: #3370FF; box-shadow: 0 0 0 3px rgba(51,112,255,0.1) !important; }
.register-card :deep(.el-input__inner) { height: 40px; font-size: 14px; color: #1D2129; }
.register-card :deep(.el-input__inner::placeholder) { color: #C9CDD4; font-size: 14px; }
:deep(.el-form-item) { margin-bottom: 20px; }

.register-btn {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  background: #3370FF;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  transition: background 0.2s ease;
}

.register-btn:hover { background: #2557CC; }
.register-btn:active { background: #1F49AD; }
:deep(.el-button--primary.is-loading) { background: #3370FF; }

.card-footer { margin-top: 16px; padding-top: 16px; border-top: 1px solid #F2F3F5; text-align: center; }
.login-link { font-size: 13px; color: #86909C; margin: 0; }
.link { color: #3370FF; text-decoration: none; font-weight: 500; }
.link:hover { text-decoration: underline; }

@media (max-width: 900px) {
  .register-page { flex-direction: column; }
  .register-left { display: none; }
  .register-right { flex: 1; width: 100%; padding: 40px 24px; }
  .register-card { padding: 32px 24px; }
  .brand-title { font-size: 28px; }
}
</style>
