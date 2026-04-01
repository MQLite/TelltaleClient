import { useEffect, useState } from 'react'
import type { Language, StoryMeta } from '../types/story'
import { listStories } from '../api/storyApi'

interface Props {
  language: Language
  onOpen: (meta: StoryMeta) => void
}

export default function StoryList({ language, onOpen }: Props) {
  const [stories, setStories] = useState<StoryMeta[]>([])

  useEffect(() => {
    listStories().then(setStories)
  }, [])

  if (stories.length === 0) return null

  const label = language === 'zh' ? '已保存的故事' : 'Saved Stories'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  return (
    <div className="story-list">
      <h2 className="story-list-title">{label}</h2>
      <div className="story-list-grid">
        {stories.map((meta, i) => (
          <button key={i} className="story-card" onClick={() => onOpen(meta)}>
            <span className="story-card-title">
              {language === 'zh' ? meta.titleZh : meta.titleEn}
            </span>
            <span className="story-card-keywords">{meta.keywords}</span>
            <span className="story-card-date">{formatDate(meta.createdAt)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
