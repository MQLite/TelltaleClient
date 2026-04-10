import { useEffect, useState } from 'react'
import type { Story, Language } from '../types/story'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import PaintCanvas from './PaintCanvas'

interface Props {
  story: Story
  imageBlobUrls: string[]
  language: Language
  onBack: () => void
}

const i18n = {
  en: { back: '← Back', read: '🔊 Read Aloud', next: 'Next →', finish: 'The End ✦', prev: '← Prev' },
  zh: { back: '← 返回', read: '🔊 朗读', next: '下一页 →', finish: '故事结束 ✦', prev: '← 上一页' },
}

export default function StoryViewer({ story, imageBlobUrls, language, onBack }: Props) {
  const [page, setPage] = useState(0)
  const [textVisible, setTextVisible] = useState(false)
  const { speak, stop } = useTextToSpeech()
  const t = i18n[language]

  const current = story.pages[page]
  const content = language === 'zh' ? current.contentZh : current.contentEn
  const title = language === 'zh' ? story.titleZh : story.titleEn

  useEffect(() => {
    setTextVisible(false)
    stop()
  }, [page])

  const goTo = (n: number) => { stop(); setPage(n) }

  return (
    <div className="viewer">
      <header className="viewer-header">
        <button className="btn-back" onClick={() => { stop(); onBack() }}>{t.back}</button>
        <h1 className="viewer-title">{title}</h1>
        <span className="page-badge">{page + 1} / {story.pages.length}</span>
      </header>

      <div className="illustration-wrap">
        <PaintCanvas
          key={`page-${page}`}
          imageUrl={imageBlobUrls[page]}
          onPaintComplete={() => setTextVisible(true)}
        />
      </div>

      <div className={`story-text-block ${textVisible ? 'visible' : ''}`}>
        <p className="story-text">{content}</p>
      </div>

      <nav className="story-nav">
        <button className="btn-nav" onClick={() => goTo(page - 1)} disabled={page === 0}>
          {t.prev}
        </button>
        <button className="btn-speak" onClick={() => speak(content, language)} disabled={!textVisible}>
          {t.read}
        </button>
        {page < story.pages.length - 1 ? (
          <button className="btn-nav btn-primary" onClick={() => goTo(page + 1)}>{t.next}</button>
        ) : (
          <button className="btn-nav btn-finish" onClick={() => { stop(); onBack() }}>{t.finish}</button>
        )}
      </nav>
    </div>
  )
}
