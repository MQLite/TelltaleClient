import { useState } from 'react'
import type { Story, Language, StoryMeta } from './types/story'
import { generateStory, prefetchImages, prefetchTts, getStoredVoices, setStoredVoice } from './api/storyApi'
import { voiceLabel } from './constants/voices'
import HomePage from './components/HomePage'
import StoryViewer from './components/StoryViewer'
import './App.css'

export type LoadingPhase = 'idle' | 'story' | 'images' | 'tts'

interface VoiceConflict {
  meta: StoryMeta
  cachedVoices: string[]
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

  // voiceOverride: string → use that voice (badge click or dialog choice)
  //                undefined → use `voice` state, checking for conflict first
  //                null → skip TTS
  const handleOpenSaved = (meta: StoryMeta, voiceOverride?: string | null) => {
    const lang = meta.language as Language

    if (voiceOverride === undefined) {
      // Card body click — check for conflict
      const cachedVoices = getStoredVoices(meta.keywords, meta.language)
      if (voice && cachedVoices.length > 0 && !cachedVoices.includes(voice)) {
        setVoiceConflict({ meta, cachedVoices, selectedVoice: voice })
        return
      }
    }

    setLanguage(lang)
    handleGenerate(meta.keywords, lang, voiceOverride)
  }

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
    setVoiceConflict(null)
    setLanguage(meta.language as Language)
    handleGenerate(meta.keywords, meta.language as Language, chosenVoice)
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
                ? <>此故事已缓存以下朗读声音，当前选择的「<b>{voiceLabel(voiceConflict.selectedVoice, 'zh')}</b>」需重新生成：</>
                : <>This story has cached narrations below. Your selected <b>{voiceLabel(voiceConflict.selectedVoice, 'en')}</b> voice will require regeneration:</>
              }
            </p>
            <div className="conflict-actions">
              {voiceConflict.cachedVoices.map(v => (
                <button key={v} className="btn-conflict-cached" onClick={() => resolveConflict(v)}>
                  {language === 'zh'
                    ? `使用「${voiceLabel(v, 'zh')}」（已缓存）`
                    : `Use ${voiceLabel(v, 'en')} (cached)`}
                </button>
              ))}
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
