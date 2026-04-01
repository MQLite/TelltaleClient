import { useState } from 'react'
import type { Language, StoryMeta } from '../types/story'
import StoryList from './StoryList'

interface Props {
  language: Language
  onLanguageChange: (lang: Language) => void
  onGenerate: (keywords: string) => void
  onOpenSaved: (meta: StoryMeta) => void
  isLoading: boolean
  loadingPhase: 'idle' | 'story' | 'images'
  imageProgress: { loaded: number; total: number }
}

const i18n = {
  en: {
    title: 'Story Nook',
    subtitle: 'Enter a few keywords and watch your magical story come to life',
    placeholder: 'e.g. little fox, snowy forest, lost lantern',
    button: '✨ Tell My Story',
    phaseStory: 'Writing your story…',
    phaseImages: (loaded: number, total: number) => `Painting illustrations… ${loaded} / ${total}`,
  },
  zh: {
    title: '故事小屋',
    subtitle: '输入几个关键词，让专属故事与插图魔法诞生',
    placeholder: '例如：小狐狸、雪夜森林、迷路的灯笼',
    button: '✨ 讲故事',
    phaseStory: '正在创作故事…',
    phaseImages: (loaded: number, total: number) => `正在绘制插图… ${loaded} / ${total}`,
  },
}

export default function HomePage({
  language, onLanguageChange, onGenerate, onOpenSaved, isLoading, loadingPhase, imageProgress
}: Props) {
  const [keywords, setKeywords] = useState('')
  const t = i18n[language]

  const loadingLabel = loadingPhase === 'images'
    ? t.phaseImages(imageProgress.loaded, imageProgress.total)
    : t.phaseStory

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (keywords.trim() && !isLoading) onGenerate(keywords.trim())
  }

  return (
    <>
      <div className="home-page">
        <div className="stars" aria-hidden="true">
          {Array.from({ length: 60 }, (_, i) => (
            <span key={i} className="star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }} />
          ))}
        </div>

        <div className="lang-selector">
          <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => onLanguageChange('en')}>EN</button>
          <button className={`lang-btn ${language === 'zh' ? 'active' : ''}`} onClick={() => onLanguageChange('zh')}>中文</button>
        </div>

        <div className="home-card">
          <div className="book-icon">📖</div>
          <h1 className="home-title">{t.title}</h1>
          <p className="home-subtitle">{t.subtitle}</p>

          <form className="keyword-form" onSubmit={handleSubmit}>
            <input
              className="keyword-input"
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              autoFocus
            />
            <button className="btn-generate" type="submit" disabled={!keywords.trim() || isLoading}>
              {isLoading ? loadingLabel : t.button}
            </button>
          </form>

          {isLoading && (
            <div className="loading-hint">
              <div className="loading-steps">
                <div className={`loading-step ${loadingPhase === 'story' ? 'active' : loadingPhase === 'images' ? 'done' : ''}`}>
                  <span className="step-icon">{loadingPhase === 'images' ? '✓' : '✦'}</span>
                  <span>{i18n[language].phaseStory.replace('…', '')}</span>
                </div>
                <div className={`loading-step ${loadingPhase === 'images' ? 'active' : ''}`}>
                  <span className="step-icon">✦</span>
                  <span>{t.phaseImages(imageProgress.loaded, imageProgress.total)}</span>
                </div>
              </div>

              {loadingPhase === 'images' && imageProgress.total > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(imageProgress.loaded / imageProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <StoryList language={language} onOpen={onOpenSaved} />
    </>
  )
}
