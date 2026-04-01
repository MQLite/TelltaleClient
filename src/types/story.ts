export interface StoryPage {
  pageNumber: number
  contentEn: string
  contentZh: string
  imagePrompt: string
}

export interface Story {
  titleEn: string
  titleZh: string
  pages: StoryPage[]
}

export type Language = 'en' | 'zh'

export interface StoryMeta {
  titleEn: string
  titleZh: string
  keywords: string
  language: Language
  createdAt: string
}
