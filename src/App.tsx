import { useState } from 'react'
import type { Story, Language, StoryMeta } from './types/story'
import { generateStory, prefetchImages, prefetchTts } from './api/storyApi'
import HomePage from './components/HomePage'
import StoryViewer from './components/StoryViewer'
import './App.css'

export type LoadingPhase = 'idle' | 'story' | 'images' | 'tts'

export default function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const [voice, setVoice] = useState('')
  const [story, setStory] = useState<Story | null>(null)
  const [imageBlobUrls, setImageBlobUrls] = useState<string[]>([])
  const [ttsBlobUrls, setTtsBlobUrls] = useState<string[]>([])
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [imageProgress, setImageProgress] = useState({ loaded: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const handleOpenSaved = (meta: StoryMeta) => {
    const lang = meta.language as Language
    setLanguage(lang)
    handleGenerate(meta.keywords, lang)
  }

  const handleGenerate = async (keywords: string, lang?: Language) => {
    const activeLang = lang ?? language
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
      if (voice) {
        try {
          ttsBlobs = await prefetchTts(result.pages, activeLang, voice)
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
    </div>
  )
}
