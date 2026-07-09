import { useEffect, useRef } from 'react'
import { THEMES, FILTERS, composeStrip } from './compose.js'

// รูป dummy สำหรับภาพตัวอย่างกรอบ
function makeDummyPanel() {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 240
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 320, 240)
  g.addColorStop(0, '#c9c2d4')
  g.addColorStop(1, '#a79fb5')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 320, 240)
  ctx.font = '90px serif'
  ctx.textAlign = 'center'
  ctx.fillText('😊', 160, 150)
  return c
}

// การ์ดกรอบพร้อมภาพตัวอย่าง — วาดด้วยโค้ดประกอบแถบรูปตัวจริง
export default function FrameCard({ frame, active, onClick, lang }) {
  const ref = useRef(null)
  useEffect(() => {
    const draw = () => {
      if (!ref.current) return
      const dummy = makeDummyPanel()
      composeStrip({
        canvas: ref.current,
        shots: Array.from({ length: 4 }, () => ({ panels: [dummy] })),
        theme: THEMES[0],
        filter: FILTERS[0],
        frame,
        caption: '',
        showDate: false,
        lang,
      })
    }
    draw()
    // วาดซ้ำอีกรอบเมื่อฟอนต์ตกแต่งโหลดเสร็จ
    document.fonts?.ready.then(draw)
  }, [frame, lang])
  return (
    <button className={`frame-card ${active ? 'active' : ''}`} onClick={onClick}>
      <canvas ref={ref} className="frame-thumb" />
      <span>
        {frame.emoji} {frame.name[lang]}
      </span>
    </button>
  )
}
