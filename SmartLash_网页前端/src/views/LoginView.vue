<template>
  <section class="login-page">
    <div class="login-stage">
      <div class="login-browser-bar">
        <div class="login-browser-left">
          <span class="login-browser-dot"></span>
          <span class="login-browser-dot"></span>
        </div>
        <div class="login-browser-address">smartlash beauty lab</div>
        <div class="login-browser-right">
          <span class="login-browser-icon"></span>
          <span class="login-browser-icon"></span>
          <span class="login-browser-icon"></span>
        </div>
      </div>

      <div class="login-shell">
        <article class="login-hero">
          <div class="login-hero-frame">
            <div class="login-hero-content">
              <div class="login-hero-copy">
                <div class="login-copy-top">
                  <p class="eyebrow login-eyebrow">SMARTLASH BEAUTY LAB</p>
                </div>

                <div class="login-copy-body">
                  <h1>
                    <span class="login-title-line">让分析、建议与搭配</span>
                    <span class="login-title-line">回到更自然的节奏</span>
                  </h1>
                  <p class="login-hero-text">
                    从识别结果到护理建议，再到产品联动推荐，SmartLash 以 AI 分析与智能体协同，为你提供更完整的一站式体验。
                  </p>

                  <div class="hero-cta-stack"></div>

                  <div class="analysis-flow">
                    <p class="analysis-flow-title">AI Analysis Flow</p>
                    <div class="analysis-flow-track">
                      <button
                        v-for="(step, index) in analysisSteps"
                        :key="step"
                        class="analysis-flow-step"
                        :class="{ active: activeAnalysisStep === index }"
                        type="button"
                        @click="setActiveAnalysisStep(index)"
                      >
                        {{ step }}
                      </button>
                    </div>
                  </div>

                  <div class="hero-capability-tags" aria-label="能力标签">
                    <span class="hero-capability-tag">识别</span>
                    <span class="hero-capability-tag">建议</span>
                    <span class="hero-capability-tag">推荐</span>
                  </div>
                </div>

                <div class="login-copy-bottom">
                  <span class="login-hero-caption">BEAUTY INTELLIGENCE FOR DAILY MAKEUP</span>
                </div>
              </div>

              <div class="login-hero-visual">
                <div class="login-visual-glass">
                  <img class="login-hero-image" src="/login-visual-v2.png" alt="SmartLash model visual" />
                </div>
              </div>
            </div>

            <div class="login-feature-strip">
              <div class="login-feature-card">
                <span>智能识别</span>
                <strong>上传图片后生成专属分析结果</strong>
              </div>
              <div class="login-feature-card">
                <span>AI 顾问</span>
                <strong>结合结果与场景给出护理建议</strong>
              </div>
              <div class="login-feature-card">
                <span>产品方案</span>
                <strong>让推荐商品与本次结果自动联动</strong>
              </div>
            </div>
          </div>
        </article>

        <article class="login-card">
          <div class="login-card-head" :class="{ 'login-card-head-register': isRegisterMode }">
            <p class="eyebrow">{{ isRegisterMode ? 'Member Register' : 'Member Sign In' }}</p>
            <h2>{{ isRegisterMode ? '创建 SmartLash 演示账号' : '欢迎进入 SmartLash' }}</h2>
            <p class="muted">
              {{ isRegisterMode ? '当前为演示注册模式，点击按钮即可直接进入平台。' : '当前为演示登录模式，点击按钮即可直接进入平台。' }}
            </p>
          </div>

          <div class="login-form login-form-soft">
            <label class="login-soft-field">
              <span>姓名</span>
              <input v-model="form.name" placeholder="请输入你的姓名" />
            </label>

            <label class="login-soft-field">
              <span>手机号</span>
              <input v-model="form.phone" placeholder="请输入手机号" />
            </label>

            <label class="login-soft-field">
              <span>密码</span>
              <input
                v-model="form.password"
                type="password"
                :placeholder="isRegisterMode ? '请设置登录密码' : '请输入登录密码'"
              />
            </label>

            <label v-if="isRegisterMode" class="login-soft-field">
              <span>确认密码</span>
              <input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
            </label>
          </div>

          <div class="login-inline-links">
            <label class="login-checkline">
              <input v-model="rememberLogin" type="checkbox" />
              <span>记住本次登录</span>
            </label>
            <label class="login-checkline login-checkline-action">
              <input v-model="useDemoAccount" type="checkbox" @change="handleDemoToggle" />
              <span>填充演示账号</span>
            </label>
          </div>

          <div class="login-actions login-actions-wide">
            <button class="primary-btn login-btn login-btn-hero" type="button" @click="submitAuth">
              {{ isRegisterMode ? '注册并进入' : '登录进入' }}
            </button>
          </div>

          <div class="auth-switch auth-switch-bottom">
            <button
              class="auth-switch-btn"
              :class="{ active: !isRegisterMode }"
              type="button"
              @click="setMode('login')"
            >
              登录
            </button>
            <button
              class="auth-switch-btn"
              :class="{ active: isRegisterMode }"
              type="button"
              @click="setMode('register')"
            >
              注册
            </button>
          </div>

          <div class="login-meta">
            <p class="login-note">{{ notice }}</p>
            <div class="login-subtips">
              <span>品牌分析工作台</span>
              <span>结果与推荐同步</span>
              <span>结果与护理联动</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartlashState } from '../composables/useSmartlashState'

const DEMO_FORM = {
  name: '演示用户',
  phone: '13800000000',
  password: 'demo123',
}

const analysisSteps = ['识别眼型', '分析睫毛状态', '生成护理建议', '联动推荐产品', '输出专属方案']

const router = useRouter()
const { login } = useSmartlashState()

const authMode = ref('login')
const rememberLogin = ref(false)
const useDemoAccount = ref(false)
const notice = ref('填写基础信息后即可进入平台。')
const activeAnalysisStep = ref(0)

const form = reactive({
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const isRegisterMode = computed(() => authMode.value === 'register')

let analysisStepTimer = null

function fillDemoForm() {
  form.name = DEMO_FORM.name
  form.phone = DEMO_FORM.phone
  form.password = DEMO_FORM.password
  form.confirmPassword = DEMO_FORM.password
}

function resetForm() {
  form.name = ''
  form.phone = ''
  form.password = ''
  form.confirmPassword = ''
}

function setMode(mode) {
  authMode.value = mode
  useDemoAccount.value = false
  resetForm()
  notice.value = mode === 'register' ? '填写注册信息后即可进入平台。' : '填写基础信息后即可进入平台。'
}

function handleDemoToggle() {
  if (useDemoAccount.value) {
    fillDemoForm()
    notice.value = '演示账号已填充。'
    return
  }

  resetForm()
  notice.value = '已清空演示账号信息。'
}

function submitAuth() {
  if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
    fillDemoForm()
  }

  if (isRegisterMode.value && !form.confirmPassword.trim()) {
    form.confirmPassword = form.password
  }

  notice.value = isRegisterMode.value ? '注册成功，正在进入平台。' : '登录成功，正在进入平台。'
  login({ name: form.name, phone: form.phone })
  router.push('/')
}

function startAnalysisStepLoop() {
  stopAnalysisStepLoop()
  analysisStepTimer = window.setInterval(() => {
    activeAnalysisStep.value = (activeAnalysisStep.value + 1) % analysisSteps.length
  }, 2200)
}

function stopAnalysisStepLoop() {
  if (analysisStepTimer) {
    window.clearInterval(analysisStepTimer)
    analysisStepTimer = null
  }
}

function setActiveAnalysisStep(index) {
  activeAnalysisStep.value = index
  startAnalysisStepLoop()
}

onMounted(() => {
  startAnalysisStepLoop()
})

onBeforeUnmount(() => {
  stopAnalysisStepLoop()
})
</script>

