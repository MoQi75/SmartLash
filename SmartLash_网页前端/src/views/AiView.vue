<template>
  <section class="ai-page">
    <article class="panel ai-main">
      <div class="panel-head">
        <div>
          <p class="eyebrow">AI Advisor</p>
          <h3>围绕识别结果继续咨询</h3>
        </div>
        <button class="secondary-btn" type="button" :disabled="isSending" @click="handleResetChat">清空对话</button>
      </div>

      <div class="ai-main-scroll">
        <div class="chat-log">
          <div
            v-for="(message, index) in state.chatMessages"
            :key="`${message.role}-${index}`"
            class="chat-bubble"
            :class="message.role"
          >
            <strong>{{ message.role === 'assistant' ? 'AI 顾问' : '你' }}</strong>
            <p>{{ message.content }}</p>
          </div>
          <div v-if="isSending" class="chat-bubble assistant chat-bubble-thinking">
            <strong>AI 顾问</strong>
            <p>正在思考中，请稍候...</p>
          </div>
        </div>

        <div class="prompt-cluster ai-prompts">
          <button
            v-for="preset in presets"
            :key="preset"
            class="tag-btn"
            type="button"
            :disabled="isSending"
            @click="sendPreset(preset)"
          >
            {{ preset }}
          </button>
        </div>

        <div class="ai-composer">
          <textarea
            v-model="input"
            rows="3"
            :disabled="isSending"
            placeholder="输入你想了解的妆效、护理或选品问题"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button class="primary-btn ai-send-btn" type="button" :disabled="isSending" @click="sendMessage">
            {{ isSending ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </article>

    <section class="ai-side">
      <article class="panel">
        <p class="eyebrow">Current Context</p>
        <h3>{{ latestProfile?.label ?? '等待识别结果' }}</h3>
        <p class="muted">{{ latestProfile?.description ?? '完成识别后，AI 会自动引用当前结果来给出建议。' }}</p>
      </article>

      <article class="panel">
        <p class="eyebrow">Care Tips</p>
        <h3>当前护理提示</h3>
        <ul class="simple-list">
          <li v-for="tip in tips" :key="tip">{{ tip }}</li>
        </ul>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { presets } from '../data/catalog'
import { useSmartlashState } from '../composables/useSmartlashState'
import { chatWithAdvisor } from '../services/analysis'

const input = ref('')
const isSending = ref(false)
const { state, latestProfile, pushChat, resetChat } = useSmartlashState()

const currentAnalysis = computed(() => state.currentAnalysis ?? state.records[0] ?? null)
const tips = computed(() => latestProfile.value?.careTips ?? ['完成一次识别后，这里会显示更具体的护理提示。'])

function normalizeAdvisorReply(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/#+\s*/g, '')
    .replace(/[•·▪■◆]+/g, '•')
    .replace(/\?{2,}/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      if (/^\d+[.、]/.test(line) || /^[-•]/.test(line)) return line.replace(/^[-•]\s*/, '• ')
      if (index === 0) return line
      return `• ${line}`
    })
    .join('\n')
}

function sendPreset(text) {
  input.value = text
  sendMessage()
}

function handleResetChat() {
  if (isSending.value) return
  resetChat()
}

function buildLocalAdvisorReply(question) {
  const analysis = currentAnalysis.value
  if (!analysis) {
    return '当前还没有可用的识别结果。你可以先去分析页上传图片，或者直接告诉我你更在意卷翘、纤长、自然还是持久，我先给你通用建议。'
  }

  const profile = analysis.profile ?? {}
  const products = analysis.products ?? []
  const firstProduct = products[0]?.name ?? '当前适配方案'
  const lines = [
    `结合你这次的识别结果，当前更适合围绕“${profile.label ?? '当前眼型'}”做自然优化。`,
    `优先建议：${profile.aiAdvice ?? '先保持根部清晰，再加强卷翘和纤长度。'}。`,
    `护理重点：${(profile.careTips ?? []).slice(0, 2).join('，') || '避免一次叠加过多产品，保持根根分明。'}`,
    `如果你现在想直接落到产品，建议先看“${firstProduct}”这一类方案。`,
  ]

  if (/浓|自然|清淡|日常/.test(question)) {
    lines[1] = `如果你更在意妆感控制，建议把重点放在${analysis.concernLabel ?? '自然感'}，先做局部提拉，不要中段堆叠过重。`
  } else if (/持久|掉|晕|脱/.test(question)) {
    lines[1] = '如果你更在意持久度，建议先处理定型和根部贴合，再考虑额外加密。'
  } else if (/推荐|产品|买/.test(question)) {
    lines[3] = `产品上建议优先看“${firstProduct}”，它和你这次的${profile.label ?? '识别结果'}更匹配。`
  }

  return lines.join('\n')
}

async function sendMessage() {
  const question = input.value.trim()
  if (!question || isSending.value) return

  pushChat('user', question)
  input.value = ''

  isSending.value = true
  try {
    const response = await chatWithAdvisor({
      question,
      analysis: currentAnalysis.value,
      history: state.chatMessages,
    })
    pushChat('assistant', normalizeAdvisorReply(response.reply))
  } catch {
    pushChat('assistant', normalizeAdvisorReply(buildLocalAdvisorReply(question)))
  } finally {
    isSending.value = false
  }
}
</script>
