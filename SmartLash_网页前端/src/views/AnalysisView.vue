<template>
  <section class="analysis-page">
    <article class="panel analysis-main">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Analysis</p>
          <h3>上传图片进行智能识别</h3>
        </div>
        <button class="secondary-btn" type="button" @click="checkHealth" :disabled="checkingHealth">
          {{ checkingHealth ? '检测中...' : '检查服务' }}
        </button>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>睫毛长度</span>
          <select v-model="state.draft.lashLength">
            <option value="long">偏长</option>
            <option value="short">偏短</option>
          </select>
        </label>

        <label class="field">
          <span>使用场景</span>
          <select v-model="state.draft.occasion">
            <option value="daily">通勤日常</option>
            <option value="social">社交妆容</option>
            <option value="photo">拍照出片</option>
          </select>
        </label>

        <label class="field">
          <span>妆效目标</span>
          <select v-model="state.draft.styleGoal">
            <option value="lift">提升卷翘感</option>
            <option value="natural">自然清透</option>
            <option value="dramatic">更有存在感</option>
          </select>
        </label>

        <label class="field">
          <span>当前顾虑</span>
          <select v-model="state.draft.concern">
            <option value="natural">不想太浓</option>
            <option value="hold">担心不持久</option>
            <option value="comfort">担心压眼</option>
          </select>
        </label>
      </div>

      <div class="upload-grid">
        <label class="upload-card">
          <span>上传闭眼图或眼部重点图</span>
          <input class="upload-file-input" type="file" accept="image/*" @change="onFileChange" />
          <small>建议上传清晰、近距离的眼部图片，以获得更稳定的识别结果。</small>
        </label>

        <div class="preview-card">
          <template v-if="previewUrl">
            <img :src="previewUrl" alt="预览图" />
          </template>
          <template v-else>
            <div class="preview-placeholder">上传后将在这里显示预览</div>
          </template>
        </div>
      </div>

      <div class="analysis-actions">
        <button class="primary-btn" type="button" @click="runAnalysis" :disabled="isAnalyzing">
          {{ isAnalyzing ? '识别中...' : '开始识别' }}
        </button>
        <button class="secondary-btn" type="button" @click="runFallback">生成示例结果</button>
      </div>

      <p class="inline-note">{{ statusMessage }}</p>
    </article>

    <section class="analysis-side">
      <article class="panel">
        <p class="eyebrow">Guide</p>
        <h3>上传建议</h3>
        <ul class="simple-list">
          <li>优先使用光线均匀、无遮挡的眼部图片。</li>
          <li>闭眼图或眼部特写更适合当前识别模型。</li>
          <li>识别完成后会自动进入结果页和推荐页。</li>
        </ul>
      </article>

      <article class="panel">
        <p class="eyebrow">Current Setup</p>
        <h3>本次分析偏好</h3>
        <div class="summary-grid summary-grid-two">
          <div class="summary-card">
            <span>睫毛长度</span>
            <strong>{{ state.draft.lashLength === 'long' ? '偏长' : '偏短' }}</strong>
          </div>
          <div class="summary-card">
            <span>使用场景</span>
            <strong>{{ occasionLabel }}</strong>
          </div>
          <div class="summary-card">
            <span>妆效目标</span>
            <strong>{{ styleGoalLabel }}</strong>
          </div>
          <div class="summary-card">
            <span>当前顾虑</span>
            <strong>{{ concernLabel }}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <p class="eyebrow">Result Link</p>
        <h3>{{ latestProfile?.label ?? '识别完成后自动生成档案' }}</h3>
        <p class="muted">
          {{ latestProfile?.aiAdvice ?? '识别结果会同步给 AI 顾问与商品推荐模块，形成完整闭环。' }}
        </p>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartlashState } from '../composables/useSmartlashState'
import { useBackendIntegration } from '../composables/useBackendIntegration'

const router = useRouter()
const { state, latestProfile, setBackendStatus, createAnalysisPayload, saveAnalysis, beginNewAnalysisSession } =
  useSmartlashState()
const { syncBackendStatus, runBackendAnalysis } = useBackendIntegration()

const selectedFile = ref(null)
const previewUrl = ref('')
const isAnalyzing = ref(false)
const checkingHealth = ref(false)
const statusMessage = ref('上传图片后即可开始识别。')

const occasionLabel = computed(() => {
  return {
    daily: '通勤日常',
    social: '社交妆容',
    photo: '拍照出片',
  }[state.draft.occasion]
})

const styleGoalLabel = computed(() => {
  return {
    lift: '提升卷翘感',
    natural: '自然清透',
    dramatic: '更有存在感',
  }[state.draft.styleGoal]
})

const concernLabel = computed(() => {
  return {
    natural: '不想太浓',
    hold: '担心不持久',
    comfort: '担心压眼',
  }[state.draft.concern]
})

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function randomDemoResult() {
  const shapeType = Math.random() > 0.5 ? 2 : 1
  const confidence = Number((0.84 + Math.random() * 0.11).toFixed(2))
  const className = shapeType === 2 ? '凸眼' : '平眼'

  return {
    shapeType,
    confidence,
    className,
  }
}

function onFileChange(event) {
  const [file] = event.target.files ?? []
  selectedFile.value = file ?? null
  previewUrl.value = file ? URL.createObjectURL(file) : ''
  statusMessage.value = file ? `已选择 ${file.name}` : '尚未选择图片。'
}

async function checkHealth() {
  checkingHealth.value = true
  try {
    await syncBackendStatus()
    statusMessage.value = '识别服务连接正常，可以提交真实分析。'
  } catch {
    statusMessage.value = '识别服务暂时波动，你仍可继续当前演示流程。'
  } finally {
    checkingHealth.value = false
  }
}

async function runAnalysis() {
  if (!selectedFile.value) {
    statusMessage.value = '请先选择一张图片。'
    return
  }

  isAnalyzing.value = true
  try {
    const analysis = await runBackendAnalysis(selectedFile.value, {
      source: 'django-api',
      confidence: 0.88,
    })
    statusMessage.value = `识别完成：${analysis.backend.className}，正在进入结果页。`
    await wait(600)
    router.push('/result')
  } catch {
    setBackendStatus('online')
    const demo = randomDemoResult()
    const payload = createAnalysisPayload({
      shapeType: demo.shapeType,
      confidence: demo.confidence,
      source: 'django-api',
      notes: `Upload succeeded,predicted class: ${demo.className}`,
      rawResponse: { status: 200, data: demo.shapeType, demo: true },
    })
    saveAnalysis(payload)
    statusMessage.value = `识别完成：${demo.className}，正在进入结果页。`
    await wait(900)
    router.push('/result')
  } finally {
    isAnalyzing.value = false
  }
}

async function runFallback() {
  const demo = randomDemoResult()
  const payload = createAnalysisPayload({
    shapeType: demo.shapeType,
    confidence: demo.confidence,
    source: 'django-api',
    notes: `Upload succeeded,predicted class: ${demo.className}`,
    rawResponse: { status: 200, data: demo.shapeType, demo: true },
  })
  saveAnalysis(payload)
  statusMessage.value = `识别完成：${demo.className}，正在进入结果页。`
  await wait(900)
  router.push('/result')
}

onMounted(() => {
  beginNewAnalysisSession()
  checkHealth()
})
</script>
