import { useCallback, useEffect } from 'react'
import type { Language } from '../types/story'

export function useTextToSpeech() {
  const speak = useCallback((text: string, language: Language) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = language === 'zh' ? 0.85 : 0.9
    utterance.pitch = 1.1

    // On some browsers Chinese voices need a small delay to load
    setTimeout(() => window.speechSynthesis.speak(utterance), 100)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  return { speak, stop }
}
