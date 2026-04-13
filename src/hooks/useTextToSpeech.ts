import { useCallback, useEffect, useRef } from 'react'

export function useTextToSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
  }, [])

  const play = useCallback((blobUrl: string) => {
    stop()
    const audio = new Audio(blobUrl)
    audioRef.current = audio
    audio.play().catch(() => {})
  }, [stop])

  useEffect(() => () => stop(), [stop])

  return { play, stop }
}
