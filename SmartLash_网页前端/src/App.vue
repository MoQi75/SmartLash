<template>
  <RouterView v-if="isLoginPage" />

  <div v-else class="site-shell">
    <aside class="sidebar sidebar-light">
      <div class="brand-block brand-block-soft">
        <p class="eyebrow">SMARTLASH</p>
        <h1>眼妆智能工作台</h1>
        <p class="brand-subtitle">识别、建议、推荐一体化</p>
        <div class="brand-grid">
          <div class="brand-grid-item brand-grid-item-accent">
            <strong>眼型识别</strong>
          </div>
          <div class="brand-grid-item">
            <strong>眼妆分析</strong>
          </div>
          <div class="brand-grid-item">
            <strong>妆效建议</strong>
          </div>
          <div class="brand-grid-item">
            <strong>方案推荐</strong>
          </div>
        </div>
      </div>

      <nav class="side-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="side-link"
          :class="{ active: route.path === item.to }"
        >
          <span class="side-icon">
            <img :src="item.icon" :alt="item.label" />
          </span>
          <div>
            <strong>{{ item.label }}</strong>
            <small>{{ item.desc }}</small>
          </div>
        </RouterLink>
      </nav>

      <div class="profile-badge">
        <div class="profile-avatar">
          <img :src="avatarSrc" alt="用户头像" />
        </div>
        <div class="profile-copy">
          <strong>{{ state.profile.name || 'SmartLash 用户' }}</strong>
          <small>{{ aiHeadline }}</small>
        </div>
      </div>
    </aside>

    <div class="content-shell">
      <header class="topbar topbar-soft">
        <div class="topbar-copy">
          <h2>{{ currentPage?.label }}</h2>
        </div>
        <div class="topbar-actions">
          <span class="status-pill" :class="`status-${state.backendStatus}`">{{ backendLabel }}</span>
          <RouterLink class="primary-btn" to="/analysis">开始分析</RouterLink>
          <button class="secondary-btn" type="button" @click="handleLogout">退出登录</button>
        </div>
      </header>

      <main class="page-container">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useSmartlashState } from './composables/useSmartlashState'
import { useBackendIntegration } from './composables/useBackendIntegration'

const route = useRoute()
const router = useRouter()
const { state, latestProfile, logout } = useSmartlashState()
const { syncBackendStatus } = useBackendIntegration()
const baseUrl = import.meta.env.BASE_URL

const navItems = [
  { to: '/', label: '首页概览', desc: '分析总览', icon: `${baseUrl}sidebar-icons/home.png` },
  { to: '/analysis', label: '智能分析', desc: '上传识别', icon: `${baseUrl}sidebar-icons/analysis.png` },
  { to: '/camera', label: '拍照检测', desc: '拍照采集', icon: `${baseUrl}sidebar-icons/camera.png` },
  { to: '/ai', label: 'AI 顾问', desc: '结果问答', icon: `${baseUrl}sidebar-icons/ai.png` },
  { to: '/goods', label: '适配方案', desc: '眼妆推荐', icon: `${baseUrl}sidebar-icons/goods.png` },
  { to: '/profile', label: '个人中心', desc: '历史资料', icon: `${baseUrl}sidebar-icons/profile.png` },
]

const isLoginPage = computed(() => route.path === '/login')
const currentPage = computed(() => navItems.find((item) => item.to === route.path) ?? navItems[0])
const avatarSrc = `${baseUrl}sidebar-icons/user-avatar.png`

const backendLabel = computed(() => {
  if (state.backendStatus === 'online') return '识别服务在线'
  if (state.backendStatus === 'offline') return '识别服务离线'
  return '识别服务待检测'
})

const aiHeadline = computed(() => latestProfile.value?.label ?? '等待分析结果')

function handleLogout() {
  logout()
  router.push('/login')
}

async function refreshBackendStatus() {
  if (!state.isAuthenticated) return
  try {
    await syncBackendStatus()
  } catch {
    // 状态已在 composable 内同步
  }
}

watch(
  () => state.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      refreshBackendStatus()
    }
  },
  { immediate: true },
)

onMounted(refreshBackendStatus)
</script>
