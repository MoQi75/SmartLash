<template>
  <section class="result-page">
    <article class="hero-panel result-hero soft-hero-panel">
      <p class="eyebrow">Result</p>
      <h3>{{ analysis?.profile.label ?? '暂无识别结果' }}</h3>
      <p class="muted">{{ analysis?.profile.description ?? '先完成一次图片识别，即可在这里查看结果与建议。' }}</p>

      <div class="summary-grid" v-if="analysis">
        <div class="summary-card">
          <span>结果来源</span>
          <strong>{{ analysis.source }}</strong>
        </div>
        <div class="summary-card">
          <span>后端分类</span>
          <strong>{{ analysis.backend.className }}</strong>
        </div>
        <div class="summary-card">
          <span>可信度</span>
          <strong>{{ Math.round(analysis.confidence * 100) }}%</strong>
        </div>
        <div class="summary-card">
          <span>识别备注</span>
          <strong>{{ formattedNotes }}</strong>
        </div>
      </div>
    </article>

    <section class="result-middle">
      <article class="panel soft-panel result-focus-card">
        <p class="eyebrow">Makeup Advice</p>
        <h3>眼妆建议</h3>
        <p class="result-highlight-text">{{ analysis?.profile.aiAdvice ?? '完成分析后会自动生成眼妆建议。' }}</p>
        <ul class="simple-list result-highlight-list">
          <li v-for="tip in analysis?.profile.careTips ?? []" :key="tip">{{ tip }}</li>
        </ul>
      </article>

      <article class="panel soft-panel result-focus-card">
        <p class="eyebrow">Style Direction</p>
        <h3>推荐妆效方向</h3>
        <ul class="simple-list result-highlight-list" v-if="analysis">
          <li><strong>眼型档案：</strong>{{ analysis.profile.label }}</li>
          <li><strong>风格标签：</strong>{{ styleTagText }}</li>
          <li><strong>推荐重点：</strong>{{ analysis.profile.productFocus }}</li>
          <li><strong>妆效目标：</strong>{{ analysis.styleGoalLabel }}</li>
          <li><strong>当前顾虑：</strong>{{ analysis.concernLabel }}</li>
          <li><strong>使用场景：</strong>{{ analysis.occasionLabel }}</li>
        </ul>
        <p v-else class="result-highlight-text">识别完成后，这里会同步展示本次眼妆辅助建议。</p>
      </article>
    </section>

    <article class="panel result-products soft-panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Recommended Solutions</p>
          <h3>与本次结果联动的眼妆方案</h3>
        </div>
      </div>

      <div class="scheme-grid">
        <article v-for="item in analysis?.products ?? []" :key="item.id" class="scheme-card scheme-card-rich">
          <div class="scheme-head">
            <span class="soft-pill soft-pill-accent">{{ item.tag }}</span>
            <span class="soft-pill">{{ item.typeLabel }}</span>
          </div>
          <div class="scheme-copy">
            <h4>{{ item.name }}</h4>
            <p class="muted">{{ item.summary }}</p>
          </div>
          <div class="scheme-detail-list">
            <span>推荐原因：{{ analysis?.profile.tone ?? '根据识别结果联动生成' }}</span>
            <span>眼妆方向：{{ styleTagText }}</span>
            <span>场景关联：{{ analysis?.occasionLabel ?? '场景待补充' }}</span>
          </div>
          <div class="scheme-footer">
            <strong>¥{{ item.price }}</strong>
            <RouterLink class="secondary-btn" to="/goods">查看完整方案</RouterLink>
          </div>
        </article>
      </div>

      <div class="action-row" v-if="analysis">
        <RouterLink class="primary-btn" to="/ai">查看 AI 建议</RouterLink>
        <RouterLink class="secondary-btn" to="/goods">查看商品推荐</RouterLink>
        <RouterLink class="secondary-btn" to="/analysis">重新识别</RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSmartlashState } from '../composables/useSmartlashState'

const { state } = useSmartlashState()
const analysis = computed(() => state.currentAnalysis)
const formattedNotes = computed(() => {
  const raw = analysis.value?.notes?.trim()
  if (!raw) return '已完成识别'
  return raw.replace(/\s*\n+\s*/g, ' ')
})
const styleTagText = computed(() => {
  const tags = analysis.value?.profile?.styleTags ?? []
  return tags.length ? tags.join(' / ') : '风格待生成'
})
</script>
