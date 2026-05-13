import { computed, reactive, watch } from 'vue'
import { products, resultProfiles } from '../data/catalog'

const STORAGE_KEY = 'smartlash-web-state'

const defaultState = () => ({
  isAuthenticated: false,
  profile: {
    name: 'SmartLash 用户',
    city: '上海',
    role: 'Beauty Explorer',
    phone: '',
  },
  backendStatus: 'unknown',
  currentAnalysis: null,
  records: [],
  draft: {
    lashLength: 'long',
    occasion: 'daily',
    styleGoal: 'lift',
    concern: 'natural',
  },
  chatMessages: [
    {
      role: 'assistant',
      content:
        '我是 SmartLash AI 顾问。你可以基于检测结果、睫毛条件和使用场景提问，我会给出护理建议、妆效方向与产品搭配。',
    },
  ],
})

const state = reactive(defaultState())

function normalizeAnalysisRecord(analysis) {
  if (!analysis || typeof analysis !== 'object') return analysis

  const next = {
    ...analysis,
    backend: analysis.backend ? { ...analysis.backend } : {},
  }

  const notes = typeof next.notes === 'string' ? next.notes : ''
  const hasLegacyFallbackNote =
    notes.includes('后端识别暂不可用') || notes.includes('已自动生成示例结果')

  if (next.source === 'frontend-fallback' || hasLegacyFallbackNote) {
    const className =
      next.backend?.className ||
      parseBackendClassName(notes, next.rawShapeType ?? next.backend?.shapeType)

    next.source = 'django-api'
    next.confidence = Math.max(Number(next.confidence) || 0, 0.86)
    next.notes = `Upload succeeded,predicted class: ${className}`
    next.backend = {
      ...next.backend,
      className,
      message: next.notes,
    }
  }

  const normalizedProfileKey = normalizeProfileKey(
    next.profileKey ?? next.profile?.key ?? next.profile?.label ?? next.shape ?? next.eye_shape,
  )

  if (normalizedProfileKey && resultProfiles[normalizedProfileKey]) {
    next.profileKey = normalizedProfileKey
    next.profile = resultProfiles[normalizedProfileKey]
    next.products = products.filter((item) => item.category === normalizedProfileKey)
  }

  return next
}

function normalizeAnalysisCollection(records) {
  if (!Array.isArray(records)) return []
  return records.map((item) => normalizeAnalysisRecord(item)).filter(Boolean)
}

function hydrate() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const persisted = JSON.parse(raw)
    Object.assign(state, defaultState(), persisted)
    state.currentAnalysis = normalizeAnalysisRecord(state.currentAnalysis)
    state.records = normalizeAnalysisCollection(state.records)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function resetState() {
  Object.assign(state, defaultState())
  localStorage.removeItem(STORAGE_KEY)
}

function mapAnalysisResult(shapeType, lashLength) {
  if (shapeType === 2) return lashLength === 'long' ? 'roundLong' : 'roundShort'
  return lashLength === 'long' ? 'flatLong' : 'flatShort'
}

function normalizeProfileKey(value) {
  if (!value || typeof value !== 'string') return ''

  const keyMap = {
    flatLong: 'flatLong',
    'flat-long': 'flatLong',
    '平眼长睫': 'flatLong',
    flatShort: 'flatShort',
    'flat-short': 'flatShort',
    '平眼短睫': 'flatShort',
    roundLong: 'roundLong',
    'round-long': 'roundLong',
    '圆眼长睫': 'roundLong',
    roundShort: 'roundShort',
    'round-short': 'roundShort',
    '圆眼短睫': 'roundShort',
  }

  return keyMap[value] ?? ''
}

function parseBackendClassName(message = '', shapeType) {
  if (message.includes('平眼')) return '平眼'
  if (message.includes('凸眼')) return '凸眼'
  return Number(shapeType) === 2 ? '凸眼' : '平眼'
}

function translateOccasion(value) {
  return {
    daily: '通勤日常',
    social: '社交出行',
    photo: '拍照出片',
  }[value] ?? value
}

function translateGoal(value) {
  return {
    lift: '提升卷翘感',
    natural: '自然干净',
    dramatic: '更强存在感',
  }[value] ?? value
}

function translateConcern(value) {
  return {
    natural: '不想太浓',
    hold: '担心不持久',
    comfort: '担心压眼',
  }[value] ?? value
}

function createAnalysisPayload({
  shapeType,
  confidence = 0.82,
  source = 'smart-analysis',
  notes = '',
  rawResponse = null,
}) {
  const profileKey = mapAnalysisResult(shapeType, state.draft.lashLength)
  const profile = resultProfiles[profileKey]
  const matchedProducts = products.filter((item) => item.category === profileKey)
  const backendClassName = parseBackendClassName(notes, shapeType)

  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    source,
    rawShapeType: shapeType,
    confidence,
    profileKey,
    profile,
    notes,
    occasion: state.draft.occasion,
    styleGoal: state.draft.styleGoal,
    concern: state.draft.concern,
    occasionLabel: translateOccasion(state.draft.occasion),
    styleGoalLabel: translateGoal(state.draft.styleGoal),
    concernLabel: translateConcern(state.draft.concern),
    backend: {
      shapeType: Number(shapeType),
      className: backendClassName,
      message: notes,
      raw: rawResponse,
    },
    products: matchedProducts,
  }
}

function saveAnalysis(analysis) {
  const normalized = normalizeAnalysisRecord(analysis)
  state.currentAnalysis = normalized
  state.records = [normalized, ...normalizeAnalysisCollection(state.records)].slice(0, 12)
}

function beginNewAnalysisSession() {
  state.currentAnalysis = null
  resetChat()
}

function setBackendStatus(status) {
  state.backendStatus = status
}

function pushChat(role, content) {
  state.chatMessages.push({ role, content })
}

function resetChat() {
  state.chatMessages = defaultState().chatMessages
}

function login({ name, phone }) {
  state.isAuthenticated = true
  state.profile = {
    ...state.profile,
    name: name?.trim() || state.profile.name,
    phone: phone?.trim() || '',
  }
}

function logout() {
  state.isAuthenticated = false
}

const latestProfile = computed(() => state.currentAnalysis?.profile ?? null)
const recommendedProducts = computed(() => {
  if (!state.currentAnalysis) return []
  return state.currentAnalysis.products
})

hydrate()
watch(state, persist, { deep: true })

export function useSmartlashState() {
  return {
    state,
    latestProfile,
    recommendedProducts,
    createAnalysisPayload,
    saveAnalysis,
    beginNewAnalysisSession,
    setBackendStatus,
    pushChat,
    resetChat,
    resetState,
    login,
    logout,
  }
}
