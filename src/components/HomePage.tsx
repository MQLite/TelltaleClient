import { useState } from 'react'
import type { Language, StoryMeta } from '../types/story'
import type { LoadingPhase } from '../App'
import StoryList from './StoryList'

interface Props {
  language: Language
  onLanguageChange: (lang: Language) => void
  voice: string
  onVoiceChange: (voice: string) => void
  onGenerate: (keywords: string) => void
  onOpenSaved: (meta: StoryMeta, voice?: string) => void
  isLoading: boolean
  loadingPhase: LoadingPhase
  imageProgress: { loaded: number; total: number }
}

const VOICES = [
  { id: '',        en: 'None',    zh: '无' },
  { id: 'fable',   en: 'Fable',   zh: '故事感' },
  { id: 'nova',    en: 'Nova',    zh: '明亮' },
  { id: 'shimmer', en: 'Shimmer', zh: '柔和' },
  { id: 'alloy',   en: 'Alloy',   zh: '中性' },
  { id: 'echo',    en: 'Echo',    zh: '低沉' },
  { id: 'onyx',    en: 'Onyx',    zh: '温暖' },
]

const i18n = {
  en: {
    title: 'Story Nook',
    subtitle: 'Enter a few keywords and watch your magical story come to life',
    placeholder: 'e.g. little fox, snowy forest, lost lantern',
    button: '✨ Tell My Story',
    voice: 'Narrator voice',
    phaseStory: 'Writing your story…',
    phaseImages: (loaded: number, total: number) => `Painting illustrations… ${loaded} / ${total}`,
    phaseTts: 'Preparing narration…',
  },
  zh: {
    title: '故事小屋',
    subtitle: '输入几个关键词，让专属故事与插图魔法诞生',
    placeholder: '例如：小狐狸、雪夜森林、迷路的灯笼',
    button: '✨ 讲故事',
    voice: '朗读声音',
    phaseStory: '正在创作故事…',
    phaseImages: (loaded: number, total: number) => `正在绘制插图… ${loaded} / ${total}`,
    phaseTts: '正在准备朗读…',
  },
}

export default function HomePage({
  language, onLanguageChange, voice, onVoiceChange,
  onGenerate, onOpenSaved, isLoading, loadingPhase, imageProgress
}: Props) {
  const [keywords, setKeywords] = useState('')
  const t = i18n[language]

  const loadingLabel =
    loadingPhase === 'images' ? t.phaseImages(imageProgress.loaded, imageProgress.total) :
    loadingPhase === 'tts'    ? t.phaseTts :
    t.phaseStory

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

          <div className="voice-selector">
            <span className="voice-label">{t.voice}:</span>
            {VOICES.map(v => (
              <button
                key={v.id}
                className={`btn-voice ${voice === v.id ? 'active' : ''}`}
                onClick={() => onVoiceChange(v.id)}
                disabled={isLoading}
              >
                {language === 'zh' ? v.zh : v.en}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="loading-hint">
              <div className="loading-steps">
                <div className={`loading-step ${loadingPhase === 'story' ? 'active' : (loadingPhase === 'images' || loadingPhase === 'tts') ? 'done' : ''}`}>
                  <span className="step-icon">{(loadingPhase === 'images' || loadingPhase === 'tts') ? '✓' : '✦'}</span>
                  <span>{i18n[language].phaseStory.replace('…', '')}</span>
                </div>
                <div className={`loading-step ${loadingPhase === 'images' ? 'active' : loadingPhase === 'tts' ? 'done' : ''}`}>
                  <span className="step-icon">{loadingPhase === 'tts' ? '✓' : '✦'}</span>
                  <span>{t.phaseImages(imageProgress.loaded, imageProgress.total)}</span>
                </div>
                {voice && (
                  <div className={`loading-step ${loadingPhase === 'tts' ? 'active' : ''}`}>
                    <span className="step-icon">✦</span>
                    <span>{t.phaseTts.replace('…', '')}</span>
                  </div>
                )}
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
