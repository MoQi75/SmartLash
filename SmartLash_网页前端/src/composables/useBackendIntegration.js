import { pingBackend, analyzeImage } from '../services/analysis'
import { useSmartlashState } from './useSmartlashState'

export function useBackendIntegration() {
  const { createAnalysisPayload, saveAnalysis, setBackendStatus } = useSmartlashState()

  async function syncBackendStatus() {
    try {
      const payload = await pingBackend()
      setBackendStatus('online')
      return payload
    } catch (error) {
      setBackendStatus('offline')
      throw error
    }
  }

  async function runBackendAnalysis(file, options = {}) {
    const { source = 'django-api', confidence = 0.88, fieldName = 'main_b' } = options

    const payload = await analyzeImage(file, fieldName)
    setBackendStatus('online')

    const analysis = createAnalysisPayload({
      shapeType: payload.shapeType,
      confidence,
      source,
      notes: payload.message,
      rawResponse: payload.raw,
    })

    saveAnalysis(analysis)
    return analysis
  }

  return {
    syncBackendStatus,
    runBackendAnalysis,
  }
}
