import type { Story, StoryMeta, StoryPage } from '../types/story'

const BASE_URL = 'http://localhost:5000'

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
