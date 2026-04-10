import { useCallback, useEffect, useRef } from 'react'
import type { Language } from '../types/story'

function webSpeechFallback(text: string, language: Language) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = language === 'zh' ? 'zh-CN' : 'en-US'
  utt.rate = language === 'zh' ? 0.85 : 0.9
  setTimeout(() => window.speechSynthesis.speak(utt), 100)
}

export function useTextToSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // cache key: "{voice}:{text}" → blob URL
  const cacheRef = useRef<Map<string, string>>(new Map())

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }, [])

  const speak = useCallback(async (text: string, language: Language, voice: string) => {
    stop()

    const cacheKey = `${voice}:${text}`
    let url = cacheRef.current.get(cacheKey)

    if (!url) {
      try {
        const res = await fetch(
          `/api/tts?text=${encodeURIComponent(text)}&lang=${language}&voice=${voice}`
        )
        if (!res.ok) throw new Error(`TTS ${res.status}`)
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        cacheRef.current.set(cacheKey, url)
      } catch {
        webSpeechFallback(text, language)
        return
      }
    }

    const audio = new Audio(url)
    audioRef.current = audio
    audio.play()
  }, [stop])

  useEffect(() => {
    return () => {
      stop()
      cacheRef.current.forEach(u => URL.revokeObjectURL(u))
    }
  }, [stop])

  return { speak, stop }
}
