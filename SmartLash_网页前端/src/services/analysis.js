const DEV_PROXY_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/api'
const API_PREFIX = import.meta.env.DEV ? DEV_PROXY_PREFIX : ''

const BACKEND_HEALTH = `${API_PREFIX}/img/hello/`
const ANALYZE_URL = `${API_PREFIX}/img/get_main_b/`
const CHAT_URL = `${API_PREFIX}/img/chat/`

function ensureJsonResponse(response, fallbackLabel) {
  if (!response.ok) {
    throw new Error(`${fallbackLabel}-${response.status}`)
  }
  return response.json()
}

function ensureApiSuccess(payload, fallbackLabel) {
  const status = Number(payload?.status ?? 200)
  if (status >= 400) {
    const message = payload?.message?.trim?.() || fallbackLabel
    throw new Error(message)
  }
  return payload
}

function parseAnalyzePayload(payload) {
  ensureApiSuccess(payload, 'analyze-failed')
  const shapeType = Number(payload?.data)
  if (!Number.isFinite(shapeType)) {
    throw new Error('analyze-invalid-shape-type')
  }

  return {
    shapeType,
    message: payload?.message ?? '',
    status: payload?.status ?? 200,
    raw: payload,
  }
}

export async function pingBackend() {
  const response = await fetch(BACKEND_HEALTH)
  return ensureJsonResponse(response, 'health-check-failed')
}

export async function analyzeImage(file, fieldName = 'main_b') {
  const formData = new FormData()
  formData.append(fieldName, file)

  const response = await fetch(ANALYZE_URL, {
    method: 'POST',
    body: formData,
  })

  const payload = await ensureJsonResponse(response, 'analyze-failed')
  return parseAnalyzePayload(payload)
}

export async function chatWithAdvisor({ question, analysis, history }) {
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      analysis,
      history,
    }),
  })

  const payload = ensureApiSuccess(await ensureJsonResponse(response, 'chat-failed'), 'chat-failed')
  const reply = payload?.data?.reply?.trim()

  if (!reply) {
    throw new Error('chat-empty-reply')
  }

  return {
    reply,
    usage: payload?.data?.usage ?? null,
    model: payload?.data?.model ?? '',
    raw: payload,
  }
}
