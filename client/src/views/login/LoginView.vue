<template>
  <div class="login-page">
    <div class="login-left">
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
        <p class="copyright">© 2026 AI Enterprise Solutions. All rights reserved.</p>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <div class="card-header">
          <h2 class="card-title">欢迎回来</h2>
          <p class="card-subtitle">请登录您的账号以继续访问工作台</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <div class="form-field">
              <label class="field-label">账号</label>
              <div class="input-box">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
                    stroke="#8F959E" stroke-width="1.2" />
                  <circle cx="8" cy="7" r="2" stroke="#8F959E" stroke-width="1.2" />
                  <path d="M5 11C5.5 10 6.66667 9.33333 8 9.33333C9.33333 9.33333 10.5 10 11 11" stroke="#8F959E"
                    stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <el-input v-model="form.username" placeholder="请输入企业邮箱或用户名" class="custom-input" />
              </div>
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="form-field">
              <div class="field-label-row">
                <label class="field-label">密码</label>
                <span class="forgot-link">忘记密码？</span>
              </div>
              <div class="input-box">
                <svg class="field-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 7H13C13.5523 7 14 7.44772 14 8V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V8C2 7.44772 2.44772 7 3 7Z"
                    stroke="#8F959E" stroke-width="1.2" />
                  <path
                    d="M5 7V5C5 4.20435 5.31607 3.44129 5.87868 2.87868C6.44129 2.31607 7.20435 2 8 2C8.79565 2 9.55871 2.31607 10.1213 2.87868C10.6839 3.44129 11 4.20435 11 5V7"
                    stroke="#8F959E" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password
                  class="custom-input" />
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="card-footer">
          <p class="demo-tip">演示账号提示：admin / 123456</p>
          <p class="register-tip">
            没有账号？<router-link to="/register" class="reg-link">立即注册</router-link>
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
import { useUserStore } from '@/store/user'
import { loginApi } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await loginApi({ username: form.username, password: form.password })
    const { token, userInfo } = res.data
    userStore.setLogin({ token, userInfo })
    ElMessage.success(`欢迎回来，${userInfo.username}`)
    router.push('/dashboard')
  } catch {
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

/* ========== 左侧区域 ========== */
.login-left {
  flex: 0 0 55%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 48px;
  background: #F5F7FA;
  position: relative;
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  margin-top: 50px;
  flex-shrink: 0;
}

.brand-text {
  margin-top: 50px;
  font-size: 18px;
  font-weight: 550;
  color: #1D2129;
}

.brand-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 420px;
}

.brand-title {
  font-size: 60px;
  font-weight: 700;
  color: #1D2129;
  line-height: 1.25;
  margin: 0 0 16px 0;
  width: 650px;

}

.brand-desc {
  font-size: 19px;
  color: #86909C;
  line-height: 1.6;
  margin: 0;
}

.brand-bottom {
  padding-top: 20px;
}

.copyright {
  font-size: 17px;
  color: #86909C;
  margin: 0;
}

/* ========== 右侧区域 ========== */
.login-right {
  flex: 0 0 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: #FFFFFF;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border: 1px solid #E5E6EB;
  border-radius: 12px;
  padding: 40px 36px;
}

.card-header {
  margin-bottom: 32px;
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  color: #1D2129;
  margin: 0 0 8px 0;
}

.card-subtitle {
  font-size: 13px;
  color: #86909C;
  margin: 0;
}

/* ========== 表单样式 ========== */
.form-field {
  width: 100%;
}

.field-label {
  display: block;
  font-size: 20px;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 6px;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.forgot-link {
  font-size: 13px;
  font-weight: 500;
  color: #3370FF;
  cursor: pointer;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #2557CC;
  text-decoration: underline;
}

.input-box {
  position: relative;
  width: 100%;
}

.field-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}

.custom-input :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 6px;
  border: 1px solid #E5E6EB;
  box-shadow: none !important;
  padding: 0 12px 0 36px;
  background: #FFFFFF;
  transition: all 0.2s ease;
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: #C9CDD4;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3370FF;
  box-shadow: 0 0 0 3px rgba(51, 112, 255, 0.1) !important;
}

.custom-input :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
  color: #1D2129;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #C9CDD4;
  font-size: 14px;
}

.custom-input :deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  height: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* ========== 登录按钮 ========== */
.login-btn {
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

.login-btn:hover {
  background: #2557CC;
}

.login-btn:active {
  background: #1F49AD;
}

:deep(.el-button--primary.is-loading) {
  background: #3370FF;
}

.card-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F2F3F5;
}

.demo-tip {
  text-align: center;
  font-size: 12px;
  color: #86909C;
  margin: 0;
}
.register-tip {
  text-align: center;
  font-size: 13px;
  color: #86909C;
  margin: 8px 0 0;
}
.reg-link {
  color: #3370FF;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}
.reg-link:hover { text-decoration: underline; }

/* ========== 响应式 ========== */
@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
  }

  .login-left {
    display: none;
  }

  .login-right {
    flex: 1;
    width: 100%;
    padding: 40px 24px;
  }

  .login-card {
    padding: 32px 24px;
  }

  .brand-title {
    font-size: 28px;
  }
}
</style>
