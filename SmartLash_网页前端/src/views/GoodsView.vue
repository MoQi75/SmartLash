<template>
  <section class="goods-page goods-page-redesign">
    <article class="panel goods-main soft-panel goods-main-redesign">
      <div class="goods-summary-grid">
        <article class="summary-card goods-summary-card">
          <span>当前匹配</span>
          <strong>{{ summaryProfileLabel }}</strong>
          <p class="muted">{{ summaryProfileSubline }}</p>
        </article>
        <article class="summary-card goods-summary-card">
          <span>使用场景</span>
          <strong>{{ currentAnalysis?.occasionLabel ?? '场景待联动' }}</strong>
          <p class="muted">方案会优先贴近当前识别场景输出。</p>
        </article>
        <article class="summary-card goods-summary-card">
          <span>推荐依据</span>
          <strong>{{ recommendationHeadline }}</strong>
          <p class="muted">{{ recommendationSubline }}</p>
        </article>
      </div>

      <div class="filter-row">
        <button
          v-for="item in filters"
          :key="item.value"
          class="tag-btn"
          type="button"
          :class="{ active: item.value === activeFilter }"
          @click="activeFilter = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-if="visibleProducts.length" class="scheme-grid">
        <article v-for="item in visibleProducts" :key="item.id" class="scheme-card scheme-card-rich">
          <div class="scheme-head">
            <span class="soft-pill soft-pill-accent">{{ item.tag }}</span>
            <span class="soft-pill">{{ item.typeLabel }}</span>
          </div>
          <div class="scheme-copy">
            <h4>{{ item.name }}</h4>
            <p class="muted">{{ item.summary }}</p>
          </div>
          <div class="scheme-detail-list">
            <span>{{ schemeReason(item) }}</span>
            <span>{{ schemeFeature(item) }}</span>
            <span>{{ schemeScene(item) }}</span>
          </div>
          <div class="scheme-footer">
            <strong>¥{{ item.price }}</strong>
            <button class="secondary-btn" type="button">加入本次方案</button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <strong>暂无推荐方案</strong>
        <p class="muted">{{ emptyStateText }}</p>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { products, resultProfiles } from '../data/catalog'
import { useSmartlashState } from '../composables/useSmartlashState'

const { latestProfile, state } = useSmartlashState()
const currentAnalysis = computed(() => state.currentAnalysis)
const activeFilter = ref('all')
const currentProfileKey = computed(() => latestProfile.value?.key ?? '')

const selectedProfile = computed(() => {
  if (currentProfileKey.value && resultProfiles[currentProfileKey.value]) return resultProfiles[currentProfileKey.value]
  if (activeFilter.value !== 'all' && resultProfiles[activeFilter.value]) return resultProfiles[activeFilter.value]
  return null
})

const filters = computed(() => {
  const base = currentProfileKey.value ? [{ label: '本次推荐', value: currentProfileKey.value }] : []
  return base.concat(Object.values(resultProfiles).map((item) => ({ label: item.label, value: item.key })))
})

const summaryProfileLabel = computed(() => {
  if (latestProfile.value) return latestProfile.value.label
  if (selectedProfile.value) return selectedProfile.value.label
  return '等待识别结果'
})

const summaryProfileSubline = computed(() => {
  if (currentAnalysis.value) return currentAnalysis.value.backend.className
  if (selectedProfile.value) return selectedProfile.value.tone
  return '后端判断待生成'
})

const recommendationHeadline = computed(() => {
  if (!currentAnalysis.value) return selectedProfile.value?.label ?? '等待联动'
  return `${currentAnalysis.value.styleGoalLabel} / ${currentAnalysis.value.concernLabel}`
})

const recommendationSubline = computed(() => {
  if (!currentAnalysis.value) {
    return selectedProfile.value?.description ?? '识别完成后自动补齐当前方案的适配依据。'
  }
  return '当前页优先展示与本次识别结果直接匹配的眼妆产品与推荐原因。'
})

const emptyStateText = computed(() => {
  if (selectedProfile.value) {
    return `当前展示的是 ${selectedProfile.value.label} 的预设状态。点击上方按钮可查看这类眼型的预设方案；完成识别后会自动切换到本次结果联动方案。`
  }
  return '请先上传图片或拍照完成识别，或先点击上方四种类型按钮查看对应的预设方案。'
})

const visibleProducts = computed(() => {
  const currentKey = currentProfileKey.value
  const targetFilter = activeFilter.value === 'all' && currentKey ? currentKey : activeFilter.value
  if (targetFilter === 'all') return []

  return products
    .filter((item) => item.category === targetFilter)
    .map((item) => ({
      ...item,
      linked: item.category === currentKey,
    }))
})

function profileLabel(key) {
  return resultProfiles[key]?.label ?? key
}

function schemeReason(item) {
  return item.reason || `推荐原因：${profileLabel(item.category)} 的典型眼妆适配路线`
}

function schemeFeature(item) {
  return item.feature || `适配特征：${resultProfiles[item.category]?.productFocus ?? '当前类型的常见眼妆方向'}`
}

function schemeScene(item) {
  return item.scene || `场景关联：${currentAnalysis.value?.occasionLabel ?? '通勤日常 / 社交出行 / 拍照出片'}`
}

watch(
  currentProfileKey,
  (key) => {
    activeFilter.value = key || 'all'
  },
  { immediate: true },
)
</script>
