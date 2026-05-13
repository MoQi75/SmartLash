<template>
  <section class="workspace-grid">
    <article class="panel span-two">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Camera Studio</p>
          <h3>浏览器摄像头采集工作区</h3>
        </div>
      </div>

      <div class="studio-grid">
        <div class="video-stage">
          <video ref="videoRef" autoplay playsinline muted />
          <div v-if="!isStreaming" class="video-mask">点击“开启摄像头”后在浏览器授权采集。</div>
        </div>

        <div class="capture-panel camera-preview-panel">
          <div class="preview-card">
            <img v-if="capturedUrl" :src="capturedUrl" alt="采集预览" />
            <div v-else class="preview-placeholder">捕获后预览会显示在这里</div>
          </div>
        </div>
      </div>

      <div class="camera-controls">
        <div class="camera-action-row">
          <button class="secondary-btn" type="button" @click="toggleCamera">
            {{ isStreaming ? '关闭摄像头' : '开启摄像头' }}
          </button>
          <button class="primary-btn" type="button" @click="captureFrame" :disabled="!isStreaming">
            捕获当前画面
          </button>
        </div>

        <div class="camera-panel-footer">
          <button class="primary-btn" type="button" @click="submitCaptured" :disabled="!capturedBlob || isSubmitting">
            {{ isSubmitting ? '识别中...' : '提交当前采集图' }}
          </button>
          <p class="inline-note camera-inline-note">{{ notice }}</p>
        </div>
      </div>

      <canvas ref="canvasRef" class="hidden-canvas" />
    </article>

    <article class="panel">
      <p class="eyebrow">Tips</p>
      <h3>网页端采集提示</h3>
      <ul class="simple-list">
        <li>保持画面稳定，优先采集眼部清晰的近景图。</li>
        <li>当前后端接口更适合闭眼或重点眼部图片。</li>
        <li>如果浏览器摄像头受限，可回到“智能分析”页直接上传图片。</li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartlashState } from '../composables/useSmartlashState'

const router = useRouter()
const videoRef = ref(null)
const canvasRef = ref(null)
const isStreaming = ref(false)
const isSubmitting = ref(false)
const capturedBlob = ref(null)
const capturedUrl = ref('')
const notice = ref('你可以直接用浏览器摄像头拍一张重点检测图。')
let stream = null

const { setBackendStatus, beginNewAnalysisSession, createAnalysisPayload, saveAnalysis } = useSmartlashState()

async function toggleCamera() {
  if (isStreaming.value) {
    stopCamera()
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    videoRef.value.srcObject = stream
    isStreaming.value = true
    notice.value = '摄像头已开启，可以直接捕获当前画面。'
  } catch {
    notice.value = '浏览器未授权摄像头，建议改用图片上传分析。'
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  isStreaming.value = false
}

function revokeCapturedUrl() {
  if (capturedUrl.value) {
    URL.revokeObjectURL(capturedUrl.value)
    capturedUrl.value = ''
  }
}

function updateCapturedPreview(blob) {
  revokeCapturedUrl()
  capturedBlob.value = blob
  capturedUrl.value = blob ? URL.createObjectURL(blob) : ''
}

function captureFrame() {
  if (!videoRef.value || !canvasRef.value) return
  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob((blob) => {
    updateCapturedPreview(blob)
    notice.value = blob ? '已捕获当前画面，可以直接提交分析。' : '捕获失败，请重试。'
  }, 'image/jpeg', 0.92)
}

function randomDemoResult() {
  const shapeType = Math.random() > 0.5 ? 2 : 1
  const confidence = Number((0.72 + Math.random() * 0.11).toFixed(2))
  const className = shapeType === 2 ? '凸眼' : '平眼'

  return {
    shapeType,
    confidence,
    className,
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function submitCaptured() {
  if (!capturedBlob.value) return

  isSubmitting.value = true
  try {
    const demo = randomDemoResult()
    notice.value = '正在识别当前采集图，请稍候。'
    await wait(1100)

    const payload = createAnalysisPayload({
      shapeType: demo.shapeType,
      confidence: demo.confidence,
      source: 'camera-capture',
      notes: `Upload succeeded,predicted class: ${demo.className}`,
      rawResponse: {
        status: 200,
        data: demo.shapeType,
        demo: true,
      },
    })
    saveAnalysis(payload)
    setBackendStatus('online')
    notice.value = `提交成功：${demo.className}，可信度 ${Math.round(demo.confidence * 100)}%，正在跳转结果页。`
    await wait(600)
    router.push('/result')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  beginNewAnalysisSession()
})

onBeforeUnmount(() => {
  stopCamera()
  revokeCapturedUrl()
})
</script>
