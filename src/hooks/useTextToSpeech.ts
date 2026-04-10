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
  // cache: text → blob URL, persists for the component's lifetime
  const cacheRef = useRef<Map<string, string>>(new Map())

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
  }, [])

  const speak = useCallback(async (text: string, language: Language) => {
    stop()

    let url = cacheRef.current.get(text)

    if (!url) {
      try {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${language}`)
        if (!res.ok) throw new Error(`TTS ${res.status}`)
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        cacheRef.current.set(text, url)
      } catch {
        // API key not set or network error — fall back to browser TTS
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
      cacheRef.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [stop])

  return { speak, stop }
}
