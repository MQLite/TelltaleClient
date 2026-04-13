import type { Story, StoryMeta, StoryPage, Language, StorySentence } from '../types/story'

const BASE_URL = ''

export async function generateStory(keywords: string, language: string): Promise<Story> {
  const response = await fetch(`${BASE_URL}/api/story/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, language }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Failed to generate story')
  }
  return response.json()
}

function buildImageUrl(prompt: string, seed: number): string {
  return `${BASE_URL}/api/image?prompt=${encodeURIComponent(prompt)}&seed=${seed}`
}

export async function listStories(): Promise<StoryMeta[]> {
  const res = await fetch(`${BASE_URL}/api/story/list`)
  return res.ok ? res.json() : []
}

export async function deleteStory(keywords: string, language: string): Promise<void> {
  await fetch(
    `${BASE_URL}/api/story?keywords=${encodeURIComponent(keywords)}&language=${encodeURIComponent(language)}`,
    { method: 'DELETE' },
  )
}

export async function recordCachedVoice(keywords: string, language: string, voice: string): Promise<void> {
  await fetch(`${BASE_URL}/api/story/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, language, voice }),
  })
}

function buildTtsText(sentences: StorySentence[]): string {
  if (!sentences || sentences.length === 0) return ''
  return sentences.map(s => s.emotion ? `(${s.emotion}) ${s.text}` : s.text).join(' ')
}

/** Fetch all TTS in one batch request, return blob URLs. */
export async function prefetchTts(
  pages: StoryPage[],
  language: Language,
  voice: string,
): Promise<string[]> {
  const texts = pages.map(p => {
    const sentences = language === 'zh' ? p.sentencesZh : p.sentencesEn
    return sentences?.length ? buildTtsText(sentences) : (language === 'zh' ? p.contentZh : p.contentEn)
  })
  const res = await fetch('/api/tts/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, language, voice }),
  })
  if (!res.ok) throw new Error(`TTS batch failed: ${res.status}`)
  const data = await res.json() as { audios: string[] }
  return data.audios.map(b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  })
}

/** Fetch all page images in parallel, return blob URLs for instant canvas rendering. */
export async function prefetchImages(
  pages: StoryPage[],
  onProgress: (loaded: number, total: number) => void
): Promise<string[]> {
  let loaded = 0
  return Promise.all(
    pages.map(async (page, i) => {
      const url = buildImageUrl(page.imagePrompt, i * 7 + 13)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Image ${i + 1} failed: ${res.status}`)
      const blob = await res.blob()
      onProgress(++loaded, pages.length)
      return URL.createObjectURL(blob)
    })
  )
}
