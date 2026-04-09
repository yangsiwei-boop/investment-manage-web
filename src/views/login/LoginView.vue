<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loginForm = reactive({
  phone: '',
  password: '',
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不少于6位', trigger: 'blur' },
  ],
}

const formRef = ref()

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const { data } = await loginApi(loginForm)
    userStore.setAuth(data.data.token, data.data.refreshToken, data.data.user)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="login-brand">
          <h1>投融资对接平台</h1>
          <p>连接资本与机遇的专业投融资平台</p>
          <div class="login-features">
            <div class="feature-item">
              <el-icon :size="24"><TrendCharts /></el-icon>
              <span>智能项目匹配</span>
            </div>
            <div class="feature-item">
              <el-icon :size="24"><DataAnalysis /></el-icon>
              <span>AI投资分析</span>
            </div>
            <div class="feature-item">
              <el-icon :size="24"><Lock /></el-icon>
              <span>安全可靠</span>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2>后台管理系统</h2>
          <p class="login-subtitle">请使用管理员账号登录</p>
          <el-form ref="formRef" :model="loginForm" :rules="rules" size="large" @keyup.enter="handleLogin">
            <el-form-item prop="phone">
              <el-input v-model="loginForm.phone" placeholder="请输入手机号" prefix-icon="Iphone" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-tip">管理员账号：13800138000 / Test1234</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  display: flex;
  width: 900px;
  min-height: 500px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-brand h1 {
  color: #ffffff;
  font-size: 28px;
  margin-bottom: 12px;
}

.login-brand p {
  color: #94a3b8;
  font-size: 16px;
  margin-bottom: 40px;
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #cbd5e1;
  font-size: 15px;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 360px;
}

.login-form-wrapper h2 {
  font-size: 24px;
  color: #1e293b;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 32px;
}

.login-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
}

.login-tip {
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  margin-top: 16px;
}
</style>
