import { useState } from 'react'
import type { Story, Language, StoryMeta } from './types/story'
import { generateStory, prefetchImages } from './api/storyApi'
import HomePage from './components/HomePage'
import StoryViewer from './components/StoryViewer'
import './App.css'

type LoadingPhase = 'idle' | 'story' | 'images'

export default function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const [story, setStory] = useState<Story | null>(null)
  const [imageBlobUrls, setImageBlobUrls] = useState<string[]>([])
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [imageProgress, setImageProgress] = useState({ loaded: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const handleOpenSaved = (meta: StoryMeta) => {
    setLanguage(meta.language)
    handleGenerate(meta.keywords)
  }

  const handleGenerate = async (keywords: string) => {
    setLoadingPhase('story')
    setError(null)
    try {
      // Step 1: generate story text
      const result = await generateStory(keywords, language)

      // Step 2: prefetch all images in parallel
      setLoadingPhase('images')
      setImageProgress({ loaded: 0, total: result.pages.length })

      const blobs = await prefetchImages(result.pages, (loaded, total) =>
        setImageProgress({ loaded, total })
      )

      setStory(result)
      setImageBlobUrls(blobs)
    } catch (e) {
      setError(language === 'zh'
        ? '生成失败，请检查网络和后端配置后重试。'
        : 'Failed. Please check your network and backend configuration.')
    } finally {
      setLoadingPhase('idle')
    }
  }

  const handleBack = () => {
    // Revoke blob URLs to free memory
    imageBlobUrls.forEach(url => URL.revokeObjectURL(url))
    setStory(null)
    setImageBlobUrls([])
  }

  const isLoading = loadingPhase !== 'idle'

  return (
    <div className="app">
      {story ? (
        <StoryViewer
          story={story}
          imageBlobUrls={imageBlobUrls}
          language={language}
          onBack={handleBack}
        />
      ) : (
        <HomePage
          language={language}
          onLanguageChange={setLanguage}
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
