import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import AnalysisView from '../views/AnalysisView.vue'
import AiView from '../views/AiView.vue'
import GoodsView from '../views/GoodsView.vue'
import ProfileView from '../views/ProfileView.vue'
import CameraView from '../views/CameraView.vue'
import ResultView from '../views/ResultView.vue'
import LoginView from '../views/LoginView.vue'
import { useSmartlashState } from '../composables/useSmartlashState'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/', component: HomeView },
    { path: '/analysis', component: AnalysisView },
    { path: '/ai', component: AiView },
    { path: '/goods', component: GoodsView },
    { path: '/profile', component: ProfileView },
    { path: '/camera', component: CameraView },
    { path: '/result', component: ResultView },
  ],
})

router.beforeEach((to) => {
  const { state, resetState } = useSmartlashState()
  if (to.path === '/login' && to.query.fresh === '1') {
    resetState()
    return true
  }
  if (!state.isAuthenticated && to.path !== '/login') {
    return '/login'
  }
  if (state.isAuthenticated && to.path === '/login') {
    return '/'
  }
  return true
})

export default router
