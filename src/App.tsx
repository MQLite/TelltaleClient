import { useState } from 'react'
import type { Story, Language, StoryMeta } from './types/story'
import { generateStory, prefetchImages, prefetchTts, getStoredVoice, setStoredVoice } from './api/storyApi'
import HomePage from './components/HomePage'
import StoryViewer from './components/StoryViewer'
import './App.css'

export type LoadingPhase = 'idle' | 'story' | 'images' | 'tts'

const VOICE_LABELS: Record<string, { en: string; zh: string }> = {
  fable:   { en: 'Fable',   zh: '故事感' },
  nova:    { en: 'Nova',    zh: '明亮' },
  shimmer: { en: 'Shimmer', zh: '柔和' },
  alloy:   { en: 'Alloy',   zh: '中性' },
  echo:    { en: 'Echo',    zh: '低沉' },
  onyx:    { en: 'Onyx',    zh: '温暖' },
}

function voiceLabel(id: string, lang: Language): string {
  return VOICE_LABELS[id]?.[lang] ?? id
}

interface VoiceConflict {
  meta: StoryMeta
  cachedVoice: string
  selectedVoice: string
}

export default function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const [voice, setVoice] = useState('')
  const [story, setStory] = useState<Story | null>(null)
  const [imageBlobUrls, setImageBlobUrls] = useState<string[]>([])
  const [ttsBlobUrls, setTtsBlobUrls] = useState<string[]>([])
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [imageProgress, setImageProgress] = useState({ loaded: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [voiceConflict, setVoiceConflict] = useState<VoiceConflict | null>(null)

  const handleOpenSaved = (meta: StoryMeta) => {
    const lang = meta.language as Language
    const cachedVoice = getStoredVoice(meta.keywords, meta.language)
    if (cachedVoice && voice && cachedVoice !== voice) {
      setVoiceConflict({ meta, cachedVoice, selectedVoice: voice })
      return
    }
    setLanguage(lang)
    handleGenerate(meta.keywords, lang)
  }

  // voiceOverride:
  //   undefined → use `voice` state (default)
  //   null      → skip TTS (user chose "no narration")
  //   string    → use this specific voice
  const handleGenerate = async (keywords: string, lang?: Language, voiceOverride?: string | null) => {
    if (isLoading) return
    const activeLang = lang ?? language
    const activeVoice = voiceOverride === undefined ? voice : (voiceOverride ?? '')
    setLoadingPhase('story')
    setError(null)
    try {
      const result = await generateStory(keywords, activeLang)

      setLoadingPhase('images')
      setImageProgress({ loaded: 0, total: result.pages.length })
      const blobs = await prefetchImages(result.pages, (loaded, total) =>
        setImageProgress({ loaded, total })
      )

      setLoadingPhase('tts')
      let ttsBlobs: string[] = []
      if (activeVoice) {
        try {
          ttsBlobs = await prefetchTts(result.pages, activeLang, activeVoice)
          setStoredVoice(keywords, activeLang, activeVoice)
        } catch {
          // TTS failure is non-fatal — story still shows without narration
        }
      }

      setStory(result)
      setImageBlobUrls(blobs)
      setTtsBlobUrls(ttsBlobs)
    } catch (e) {
      setError(activeLang === 'zh'
        ? '生成失败，请检查网络和后端配置后重试。'
        : 'Failed. Please check your network and backend configuration.')
    } finally {
      setLoadingPhase('idle')
    }
  }

  const handleBack = () => {
    imageBlobUrls.forEach(url => URL.revokeObjectURL(url))
    ttsBlobUrls.forEach(url => URL.revokeObjectURL(url))
    setStory(null)
    setImageBlobUrls([])
    setTtsBlobUrls([])
  }

  const resolveConflict = (chosenVoice: string | null) => {
    if (!voiceConflict) return
    const { meta } = voiceConflict
    const lang = meta.language as Language
    setVoiceConflict(null)
    setLanguage(lang)
    handleGenerate(meta.keywords, lang, chosenVoice)
  }

  const isLoading = loadingPhase !== 'idle'

  return (
    <div className="app">
      {story ? (
        <StoryViewer
          story={story}
          imageBlobUrls={imageBlobUrls}
          ttsBlobUrls={ttsBlobUrls}
          language={language}
          onBack={handleBack}
        />
      ) : (
        <HomePage
          language={language}
          onLanguageChange={setLanguage}
          voice={voice}
          onVoiceChange={setVoice}
          onGenerate={handleGenerate}
          onOpenSaved={handleOpenSaved}
          isLoading={isLoading}
          loadingPhase={loadingPhase}
          imageProgress={imageProgress}
        />
      )}

      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {voiceConflict && (
        <div className="conflict-overlay" onClick={() => setVoiceConflict(null)}>
          <div className="conflict-dialog" onClick={e => e.stopPropagation()}>
            <p className="conflict-body">
              {language === 'zh'
                ? <>此故事已缓存「<b>{voiceLabel(voiceConflict.cachedVoice, 'zh')}</b>」朗读，当前选择的是「<b>{voiceLabel(voiceConflict.selectedVoice, 'zh')}</b>」。</>
                : <>This story has cached <b>{voiceLabel(voiceConflict.cachedVoice, 'en')}</b> narration, but you have <b>{voiceLabel(voiceConflict.selectedVoice, 'en')}</b> selected.</>
              }
            </p>
            <div className="conflict-actions">
              <button className="btn-conflict-cached" onClick={() => resolveConflict(voiceConflict.cachedVoice)}>
                {language === 'zh'
                  ? `使用「${voiceLabel(voiceConflict.cachedVoice, 'zh')}」（已缓存）`
                  : `Use ${voiceLabel(voiceConflict.cachedVoice, 'en')} (cached)`}
              </button>
              <button className="btn-conflict-regen" onClick={() => resolveConflict(voiceConflict.selectedVoice)}>
                {language === 'zh'
                  ? `使用「${voiceLabel(voiceConflict.selectedVoice, 'zh')}」（重新生成）`
                  : `Use ${voiceLabel(voiceConflict.selectedVoice, 'en')} (regenerate)`}
              </button>
              <button className="btn-conflict-none" onClick={() => resolveConflict(null)}>
                {language === 'zh' ? '无朗读' : 'No narration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
