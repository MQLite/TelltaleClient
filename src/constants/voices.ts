import type { Language } from '../types/story'

export const VOICE_LABELS: Record<string, { en: string; zh: string }> = {
  fable:   { en: 'Fable',   zh: '故事感' },
  nova:    { en: 'Nova',    zh: '明亮' },
  shimmer: { en: 'Shimmer', zh: '柔和' },
  alloy:   { en: 'Alloy',   zh: '中性' },
  echo:    { en: 'Echo',    zh: '低沉' },
  onyx:    { en: 'Onyx',    zh: '温暖' },
}

export function voiceLabel(id: string, lang: Language): string {
  return VOICE_LABELS[id]?.[lang] ?? id
}
