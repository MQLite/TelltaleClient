import { useEffect, useState } from 'react'
import type { Language, StoryMeta } from '../types/story'
import { listStories, deleteStory, getStoredVoices, removeStoredVoice } from '../api/storyApi'

const VOICE_LABELS: Record<string, { en: string; zh: string }> = {
  fable:   { en: 'Fable',   zh: '故事感' },
  nova:    { en: 'Nova',    zh: '明亮' },
  shimmer: { en: 'Shimmer', zh: '柔和' },
  alloy:   { en: 'Alloy',   zh: '中性' },
  echo:    { en: 'Echo',    zh: '低沉' },
  onyx:    { en: 'Onyx',    zh: '温暖' },
}

interface Props {
  language: Language
  onOpen: (meta: StoryMeta, voice?: string) => void
}

export default function StoryList({ language, onOpen }: Props) {
  const [stories, setStories] = useState<StoryMeta[]>([])
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  useEffect(() => {
    listStories().then(setStories)
  }, [])

  if (stories.length === 0) return null

  const label = language === 'zh' ? '已保存的故事' : 'Saved Stories'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  const storyKey = (meta: StoryMeta) => `${meta.keywords}:${meta.language}`

  const handleDeleteClick = (e: React.MouseEvent, meta: StoryMeta) => {
    e.stopPropagation()
    setDeletingKey(storyKey(meta))
  }

  const handleConfirmDelete = async (e: React.MouseEvent, meta: StoryMeta) => {
    e.stopPropagation()
    await deleteStory(meta.keywords, meta.language)
    removeStoredVoice(meta.keywords, meta.language)
    setStories(prev => prev.filter(s => !(s.keywords === meta.keywords && s.language === meta.language)))
    setDeletingKey(null)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingKey(null)
  }

  return (
    <div className="story-list">
      <h2 className="story-list-title">{label}</h2>
      <div className="story-list-grid">
        {stories.map((meta, i) => {
          const key = storyKey(meta)
          const isConfirming = deletingKey === key
          const cachedVoices = getStoredVoices(meta.keywords, meta.language)

          return (
            <div key={i} className="story-card" onClick={() => !isConfirming && onOpen(meta)}>
              <span className="story-card-title">
                {language === 'zh' ? meta.titleZh : meta.titleEn}
              </span>
              <span className="story-card-keywords">{meta.keywords}</span>
              <span className="story-card-date">{formatDate(meta.createdAt)}</span>

              {cachedVoices.length > 0 && (
                <span className="story-card-voices">
                  {cachedVoices.map(v => (
                    <button
                      key={v}
                      className="voice-badge"
                      title={language === 'zh' ? `使用${VOICE_LABELS[v]?.zh ?? v}朗读` : `Open with ${VOICE_LABELS[v]?.en ?? v}`}
                      onClick={e => { e.stopPropagation(); onOpen(meta, v) }}
                    >
                      {VOICE_LABELS[v]?.[language] ?? v}
                    </button>
                  ))}
                </span>
              )}

              {isConfirming ? (
                <span className="story-card-confirm">
                  <button className="btn-delete-confirm" onClick={e => handleConfirmDelete(e, meta)}>
                    {language === 'zh' ? '删除' : 'Delete'}
                  </button>
                  <button className="btn-delete-cancel" onClick={handleCancelDelete}>
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </span>
              ) : (
                <button className="story-card-delete" onClick={e => handleDeleteClick(e, meta)} title="Delete">
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
