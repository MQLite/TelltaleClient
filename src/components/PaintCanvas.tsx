import { useEffect, useRef, useState } from 'react'

interface Props {
  imageUrl: string
  onPaintComplete?: () => void
}

const CELL = 28        // brush stroke grid cell size
const PER_FRAME = 6    // strokes revealed per animation frame

export default function PaintCanvas({ imageUrl, onPaintComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const [phase, setPhase] = useState<'loading' | 'painting' | 'done'>('loading')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    cancelAnimationFrame(animRef.current)
    setPhase('loading')

    const ctx = canvas.getContext('2d')!
    const W = 800
    const H = 520
    canvas.width = W
    canvas.height = H

    // Warm parchment placeholder while image loads
    ctx.fillStyle = '#d4b896'
    ctx.fillRect(0, 0, W, H)

    const img = new Image()

    img.onload = () => {
      // Offscreen copy of the real image
      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      off.getContext('2d')!.drawImage(img, 0, 0, W, H)

      // Start with warm tinted blank
      ctx.fillStyle = '#c9a87c'
      ctx.fillRect(0, 0, W, H)

      // Build shuffled grid of brush-stroke centres
      const cols = Math.ceil(W / CELL)
      const rows = Math.ceil(H / CELL)
      const cells: { x: number; y: number }[] = []
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 })

      // Fisher-Yates shuffle
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]]
      }

      let idx = 0
      setPhase('painting')

      const paint = () => {
        for (let k = 0; k < PER_FRAME && idx < cells.length; k++, idx++) {
          const { x, y } = cells[idx]
          const rx = CELL * 0.95 + (Math.random() - 0.5) * 8
          const ry = CELL * 0.55 + (Math.random() - 0.5) * 6
          const angle = Math.random() * Math.PI

          ctx.save()
          ctx.beginPath()
          ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(off, 0, 0)
          ctx.restore()
        }

        if (idx < cells.length) {
          animRef.current = requestAnimationFrame(paint)
        } else {
          // Final clean pass to fill any gaps between strokes
          ctx.drawImage(off, 0, 0)
          setPhase('done')
          onPaintComplete?.()
        }
      }

      animRef.current = requestAnimationFrame(paint)
    }

    img.onerror = () => {
      // Fallback: draw a painterly placeholder
      ctx.fillStyle = '#b8956a'
      ctx.fillRect(0, 0, W, H)
      const grad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 280)
      grad.addColorStop(0, 'rgba(255,230,160,0.35)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(80,50,20,0.6)'
      ctx.font = 'italic 22px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.fillText('✦  Illustration  ✦', W / 2, H / 2)
      setPhase('done')
      onPaintComplete?.()
    }

    img.src = imageUrl

    return () => cancelAnimationFrame(animRef.current)
  }, [imageUrl])

  return (
    <div className="paint-wrap">
      {phase === 'loading' && (
        <div className="paint-placeholder">
          <div className="paint-spinner" />
          <span>Loading illustration…</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="paint-canvas"
        style={{ opacity: phase === 'loading' ? 0 : 1 }}
      />
    </div>
  )
}
