<template>
  <section class="home-page">
    <article class="hero-panel home-hero home-hero-flat">
      <div class="hero-showcase-body">
        <div class="hero-copy-panel">
          <div class="hero-story-panel">
            <div class="hero-story-card hero-story-card-highlight">
              <span>本周亮点</span>
              <strong>本周热门眼妆方案</strong>
              <p>汇总近期更受欢迎的妆效方向，便于查看当前推荐趋势与搭配重点。</p>
            </div>
            <div class="hero-story-card hero-story-card-ad">
              <span>精选推荐</span>
              <strong>轻感纤长系列推荐</strong>
              <p>适合自然眼妆与日常通勤场景，可结合分析结果查看更合适的推荐内容。</p>
            </div>
          </div>

          <div class="hero-note-grid">
            <div class="hero-note-card">
              <span>当前进度</span>
              <strong>个人眼妆档案生成中</strong>
              <small>完成识别后，将自动整理当前分析结果，并生成本次妆效建议摘要。</small>
            </div>
            <div class="hero-note-card">
              <span>服务状态</span>
              <strong>分析结果待查看</strong>
              <small>识别完成后可查看护理建议、妆效方向与相关产品推荐。</small>
            </div>
          </div>

          <div class="hero-promo-strip">
            <div class="hero-promo-item">
              <span>联动推荐</span>
              <strong>底妆与睫毛方案搭配参考</strong>
              <small>基于当前分析结果，提供更贴近日常妆容场景的搭配建议。</small>
            </div>
            <div class="hero-promo-item">
              <span>AI 建议</span>
              <strong>识别结果可延展为个性化建议</strong>
              <small>系统将结合本次识别信息，生成护理建议、妆效参考与产品搭配内容。</small>
            </div>
          </div>
        </div>

        <div class="hero-visual-panel">
          <div class="hero-orbit">
            <div class="hero-orbit-core">
              <span>本次分析</span>
              <strong>{{ state.currentAnalysis?.backend.className ?? '待识别' }}</strong>
              <small>{{ latestProfile?.label ?? '等待生成档案' }}</small>
            </div>
            <div class="hero-orbit-track">
              <div class="hero-floating-card hero-floating-card-top">
                <div class="hero-floating-card-inner">
                  <span>最近记录</span>
                  <strong>{{ state.records.length }}</strong>
                </div>
              </div>
              <div class="hero-floating-card hero-floating-card-left">
                <div class="hero-floating-card-inner">
                  <span>妆效方向</span>
                  <strong>{{ latestProfile?.styleTags?.[0] ?? '准备中' }}</strong>
                </div>
              </div>
              <div class="hero-floating-card hero-floating-card-right">
                <div class="hero-floating-card-inner">
                  <span>场景联动</span>
                  <strong>{{ state.currentAnalysis?.occasionLabel ?? '待生成' }}</strong>
                </div>
              </div>
              <div class="hero-floating-card hero-floating-card-bottom">
                <div class="hero-floating-card-inner">
                  <span>结果来源</span>
                  <strong>{{ sourceLabel }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>

    <section class="home-bottom home-bottom-flat">
      <article class="panel home-report soft-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Result Chain</p>
            <h3>联动状态</h3>
          </div>
          <RouterLink class="text-link" to="/result">查看结果页</RouterLink>
        </div>

        <div class="journey-list journey-list-flat">
          <article v-for="step in journeyCards" :key="step.title" class="journey-card journey-card-flat">
            <span class="soft-pill" :class="{ 'soft-pill-accent': step.active }">{{ step.tag }}</span>
            <h4>{{ step.title }}</h4>
            <p class="muted">{{ step.desc }}</p>
            <div class="journey-line"></div>
          </article>
        </div>
      </article>

      <article class="panel home-products soft-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Linked Solution</p>
            <h3>眼妆适配方案</h3>
          </div>
          <RouterLink class="text-link" to="/goods">查看全部方案</RouterLink>
        </div>

        <div class="scheme-list scheme-list-flat">
          <article v-for="item in recommendedSchemes" :key="item.id" class="scheme-card scheme-card-flat">
            <span class="soft-pill soft-pill-accent">{{ item.tag }}</span>
            <h4>{{ item.name }}</h4>
            <p class="muted">{{ item.reason }}</p>
            <div class="scheme-footnote">{{ item.typeLabel }} / {{ latestProfile?.label ?? '结果联动中' }}</div>
          </article>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSmartlashState } from '../composables/useSmartlashState'

const { state, latestProfile, recommendedProducts } = useSmartlashState()

const recommendedSchemes = computed(() => {
  return recommendedProducts.value.slice(0, 2).map((item, index) => ({
    ...item,
    reason: ['本轮眼妆重点产品', '适合同场景联动搭配'][index] ?? '结果联动',
  }))
})

const sourceLabel = computed(() => {
  const source = state.currentAnalysis?.source
  if (source === 'django-api') return '接口识别'
  if (source === 'camera-capture') return '拍照采集'
  if (source === 'frontend-fallback') return '演示模式'
  if (source === 'smart-analysis') return '智能分析'
  return '未开始'
})

const journeyCards = computed(() => {
  const analysis = state.currentAnalysis
  return [
    {
      tag: analysis ? '已生成' : '待开始',
      title: analysis ? analysis.profile.label : '识别眼型',
      desc: analysis ? analysis.profile.tone : '上传后生成结果',
      active: Boolean(analysis),
    },
    {
      tag: analysis ? analysis.occasionLabel : '流程占位',
      title: '分析眼妆方向',
      desc: analysis ? `${analysis.styleGoalLabel} / ${analysis.concernLabel}` : '生成妆效方向',
      active: Boolean(analysis),
    },
    {
      tag: latestProfile.value ? '建议生成中' : '待联动',
      title: '生成眼妆建议',
      desc: latestProfile.value?.label ?? '同步到 AI 与推荐方案',
      active: Boolean(latestProfile.value),
    },
  ]
})
</script>
