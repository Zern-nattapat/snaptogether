// ธีมสีสำหรับกรอบแบบ "ธีมสี" (gradient)
export const THEMES = [
  { id: 'friends',  name: { th: 'เพื่อนซี้', en: 'Besties' },   emoji: '👯', bg: ['#FFD93D', '#FF8E3C'], text: '#4a2c00', label: 'BESTIES 4EVER' },
  { id: 'party',    name: { th: 'ปาร์ตี้', en: 'Party' },       emoji: '🎉', bg: ['#845EC2', '#FF6F91'], text: '#ffffff', label: 'PARTY TIME' },
  { id: 'birthday', name: { th: 'วันเกิด', en: 'Birthday' },    emoji: '🎂', bg: ['#FF9A8B', '#FF6A88'], text: '#ffffff', label: 'HAPPY BIRTHDAY!' },
  { id: 'family',   name: { th: 'ครอบครัว', en: 'Family' },     emoji: '🏡', bg: ['#A8E6CF', '#3EAF7C'], text: '#0b3d2e', label: 'FAMILY TIME' },
  { id: 'love',     name: { th: 'คู่รัก', en: 'Love' },          emoji: '💖', bg: ['#ffafbd', '#ff8fab'], text: '#7a1f3d', label: 'LOVE U' },
  { id: 'classic',  name: { th: 'คลาสสิก', en: 'Classic' },     emoji: '🖤', bg: ['#151515', '#333333'], text: '#ffffff', label: 'PHOTOBOOTH' },
]

export const FILTERS = [
  { id: 'none',  name: { th: 'ปกติ', en: 'Normal' },    css: 'none' },
  { id: 'warm',  name: { th: 'อบอุ่น', en: 'Warm' },    css: 'brightness(1.06) saturate(1.25) sepia(0.12)' },
  { id: 'soft',  name: { th: 'ซอฟต์', en: 'Soft' },     css: 'brightness(1.1) contrast(0.92) saturate(0.85)' },
  { id: 'vivid', name: { th: 'สดใส', en: 'Vivid' },     css: 'contrast(1.12) saturate(1.45)' },
  { id: 'bw',    name: { th: 'ขาวดำ', en: 'B&W' },      css: 'grayscale(1) contrast(1.08)' },
  { id: 'retro', name: { th: 'วินเทจ', en: 'Retro' },   css: 'sepia(0.45) contrast(0.95) brightness(1.05)' },
]

// กรอบรูป — 6 สไตล์วาดใหม่ตามภาพตัวอย่างในโฟลเดอร์ frame + ธีมสีแบบเดิม
export const FRAMES = [
  { id: 'gradient',  name: { th: 'ธีมสี', en: 'Color Theme' },          emoji: '🎨' },
  { id: 'birthday',  name: { th: 'เบิร์ธเดย์พาสเทล', en: 'Pastel Birthday' }, emoji: '🎀', defaultCaption: { th: 'Happy Birthday', en: 'Happy Birthday' } },
  { id: 'ticket',    name: { th: 'ตั๋วหนังวินเทจ', en: 'Vintage Ticket' },   emoji: '🎟️', defaultCaption: { th: 'Night Movie', en: 'Night Movie' } },
  { id: 'newspaper', name: { th: 'หนังสือพิมพ์', en: 'Newspaper' },      emoji: '📰', defaultCaption: { th: 'Our Memories', en: 'Our Memories' } },
  { id: 'stars',     name: { th: 'ดาวทอง', en: 'Gold Stars' },           emoji: '⭐', defaultCaption: { th: 'Superstars', en: 'Superstars' } },
  { id: 'scrapbook', name: { th: 'สแครปบุ๊ก', en: 'Scrapbook' },         emoji: '📎', defaultCaption: { th: 'Good Times', en: 'Good Times' } },
  { id: 'film',      name: { th: 'ฟิล์มเนกาทีฟ', en: 'Film Negative' },  emoji: '🎞️', defaultCaption: { th: 'TX 5063', en: 'TX 5063' } },
]

// ---------- ตัวช่วยวาด ----------

function drawCover(ctx, src, x, y, w, h) {
  const sr = src.width / src.height
  const dr = w / h
  let sx = 0, sy = 0, sw = src.width, sh = src.height
  if (sr > dr) {
    sw = src.height * dr
    sx = (src.width - sw) / 2
  } else {
    sh = src.width / dr
    sy = (src.height - sh) / 2
  }
  ctx.drawImage(src, sx, sy, sw, sh, x, y, w, h)
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function starPath(ctx, cx, cy, outer, inner, rot = 0) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = rot + (Math.PI / 5) * i - Math.PI / 2
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// สุ่มแบบกำหนด seed ได้ ให้ลายเส้น "สุ่ม" เหมือนเดิมทุกครั้งที่วาดซ้ำ
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function speckles(ctx, w, h, count, color, alpha, seed = 7) {
  const rnd = seeded(seed)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    ctx.beginPath()
    ctx.arc(rnd() * w, rnd() * h, rnd() * 1.6 + 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function goldStar(ctx, cx, cy, size, rot) {
  const grad = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size)
  grad.addColorStop(0, '#f9e08a')
  grad.addColorStop(0.5, '#e8b83a')
  grad.addColorStop(1, '#b8860b')
  starPath(ctx, cx, cy, size, size * 0.42, rot)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#8a6510'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function crayonStar(ctx, cx, cy, size, color, seed) {
  const rnd = seeded(seed)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let pass = 0; pass < 3; pass++) {
    ctx.lineWidth = 5 - pass
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    for (let i = 0; i <= 10; i++) {
      const r = (i % 2 === 0 ? size : size * 0.45) * (0.9 + rnd() * 0.2)
      const a = (Math.PI / 5) * i - Math.PI / 2
      const px = cx + Math.cos(a) * r + (rnd() - 0.5) * 4
      const py = cy + Math.sin(a) * r + (rnd() - 0.5) * 4
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// ระยะขอบรอบกริดรูปของแต่ละกรอบ
const MARGINS = {
  gradient:  { top: 26,  side: 26,  bottom: 110 },
  birthday:  { top: 104, side: 78,  bottom: 190 },
  ticket:    { top: 196, side: 60,  bottom: 170 },
  newspaper: { top: 218, side: 56,  bottom: 150 },
  stars:     { top: 116, side: 116, bottom: 130 },
  scrapbook: { top: 130, side: 92,  bottom: 140 },
  film:      { top: 72,  side: 112, bottom: 100 },
}

const PANEL_RADIUS = {
  gradient: 14, birthday: 4, ticket: 18, newspaper: 0, stars: 0, scrapbook: 0, film: 6,
}

/**
 * ประกอบแถบรูปลงบน canvas
 * shots: [{ panels: [canvas|null, ...] }]
 */
export function composeStrip({ canvas, shots, theme, filter, frame, caption, showDate, lang = 'th' }) {
  const f = frame?.id || 'gradient'
  const rows = shots.length
  const n = Math.max(1, ...shots.map((s) => s.panels.length))
  const PW = n >= 3 ? 300 : 400
  const PH = PW * 0.75
  const GAP = 16
  const gridW = n * PW + (n - 1) * GAP
  const gridH = rows * PH + (rows - 1) * GAP
  const M = MARGINS[f]
  const width = gridW + M.side * 2
  const height = gridH + M.top + M.bottom
  const gx = M.side
  const gy = M.top
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const locale = lang === 'th' ? 'th-TH' : 'en-GB'
  const now = new Date()
  const dateStr = now.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const frameDef = FRAMES.find((x) => x.id === f)
  const cap = caption || (f === 'gradient' ? theme.label : frameDef.defaultCaption?.[lang] || '')

  // ---------- พื้นหลัง (ก่อนวางรูป) ----------

  if (f === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, theme.bg[0])
    grad.addColorStop(1, theme.bg[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }

  if (f === 'birthday') {
    // ลายทางฟ้าพาสเทล + แผ่นรองสีชมพูขอบดำ
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#cfe9f8'
    for (let x = 0; x < width; x += 30) ctx.fillRect(x, 0, 15, height)
    const mat = 28
    ctx.fillStyle = '#fbd3e2'
    ctx.fillRect(gx - mat, gy - mat, gridW + mat * 2, gridH + mat * 2)
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 4
    ctx.strokeRect(gx - mat, gy - mat, gridW + mat * 2, gridH + mat * 2)
    ctx.fillStyle = '#333'
    ctx.font = `italic 700 ${Math.max(40, width * 0.045)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText('Hey, You!', width / 2, 66)
    // ดาวขาวขอบดำประดับ
    ;[
      [width - 52, gy - 6, 30, 0.3],
      [46, gy + gridH * 0.5, 26, -0.2],
      [width - 46, gy + gridH - 40, 24, 0.5],
    ].forEach(([cx, cy, s, rot]) => {
      starPath(ctx, cx, cy, s, s * 0.42, rot)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 2.5
      ctx.stroke()
    })
  }

  if (f === 'ticket') {
    ctx.fillStyle = '#f2ead8'
    ctx.fillRect(0, 0, width, height)
    speckles(ctx, width, height, 250, '#7a6a4f', 0.08, 11)
    // ขอบตั๋วโค้งมน
    ctx.strokeStyle = '#3f2a18'
    ctx.lineWidth = 7
    rr(ctx, 20, 20, width - 40, height - 40, 34)
    ctx.stroke()
    // หัวตั๋ว
    ctx.lineWidth = 4
    rr(ctx, gx, 42, gridW, 126, 16)
    ctx.stroke()
    ctx.fillStyle = '#a3242d'
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.max(46, gridW * 0.09)}px 'Dancing Script', 'Prompt', cursive`
    ctx.fillText(cap, width / 2, 104)
    ctx.fillStyle = '#1d3557'
    ctx.font = `700 ${Math.max(19, gridW * 0.028)}px Prompt, sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText(dateStr, gx + 26, 148)
    ctx.textAlign = 'right'
    ctx.fillText(`${timeStr} · ${rows} SHOTS`, gx + gridW - 26, 148)
  }

  if (f === 'newspaper') {
    ctx.fillStyle = '#e9e7e1'
    ctx.fillRect(0, 0, width, height)
    speckles(ctx, width, height, 500, '#555', 0.07, 23)
    ctx.fillStyle = '#111'
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.max(20, width * 0.024)}px Georgia, serif`
    ctx.fillText('— Special Edition —', width / 2, 52)
    ctx.font = `400 ${Math.max(52, width * 0.075)}px 'UnifrakturMaguntia', 'Prompt', serif`
    ctx.fillText(`★ ${cap} ★`, width / 2, 132)
    if (showDate) {
      ctx.font = `700 ${Math.max(22, width * 0.026)}px Georgia, serif`
      ctx.fillText(dateStr, width / 2, 176)
    }
    ctx.fillRect(gx, 190, gridW, 3)
    ctx.fillRect(gx, 197, gridW, 1.5)
  }

  if (f === 'stars') {
    // ลายทางกระดาษห่อโทนฟ้าเทา
    ctx.fillStyle = '#dfe7ee'
    ctx.fillRect(0, 0, width, height)
    const rnd = seeded(41)
    let x = 0
    while (x < width) {
      const w1 = 6 + rnd() * 20
      ctx.globalAlpha = 0.25 + rnd() * 0.45
      ctx.fillStyle = '#8ba3ba'
      if (rnd() > 0.45) ctx.fillRect(x, 0, w1, height)
      x += w1 + 6 + rnd() * 16
    }
    ctx.globalAlpha = 1
    // บล็อกดำหลังรูป
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(gx - 18, gy - 18, gridW + 36, gridH + 36)
  }

  if (f === 'scrapbook') {
    ctx.fillStyle = '#161512'
    ctx.fillRect(0, 0, width, height)
    speckles(ctx, width, height, 350, '#fff', 0.05, 5)
    // กระดาษฟ้าฉีกขอบ วางเฉียงหลังรูป
    const rnd = seeded(17)
    ctx.save()
    ctx.translate(width / 2, gy + gridH / 2)
    ctx.rotate(-0.025)
    ctx.fillStyle = '#3f7fd6'
    ctx.beginPath()
    const pw = gridW + 90
    const ph = gridH * 0.78
    // เดินรอบสี่เหลี่ยมพร้อมขยับขอบสุ่มๆ ให้ดูเหมือนรอยฉีก
    const steps = 14
    for (let s = 0; s < steps; s++) {
      const x = -pw / 2 + (s / steps) * pw
      ctx.lineTo(x, -ph / 2 + (rnd() - 0.5) * 20)
    }
    for (let s = 0; s < steps; s++) {
      const y = -ph / 2 + (s / steps) * ph
      ctx.lineTo(pw / 2 + (rnd() - 0.5) * 20, y)
    }
    for (let s = 0; s < steps; s++) {
      const x = pw / 2 - (s / steps) * pw
      ctx.lineTo(x, ph / 2 + (rnd() - 0.5) * 20)
    }
    for (let s = 0; s < steps; s++) {
      const y = ph / 2 - (s / steps) * ph
      ctx.lineTo(-pw / 2 + (rnd() - 0.5) * 20, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    // แผ่นขาวรองกริดรูป
    ctx.fillStyle = '#f6f4ef'
    ctx.fillRect(gx - 14, gy - 14, gridW + 28, gridH + 28)
    // คลิปหนีบกระดาษ
    const clipW = 150
    const clipX = width / 2 - clipW / 2
    const clipY = gy - 14 - 52
    const grad = ctx.createLinearGradient(clipX, clipY, clipX, clipY + 64)
    grad.addColorStop(0, '#e6e6e6')
    grad.addColorStop(0.5, '#9c9c9c')
    grad.addColorStop(1, '#d5d5d5')
    ctx.fillStyle = grad
    rr(ctx, clipX, clipY, clipW, 64, 10)
    ctx.fill()
    ctx.fillStyle = '#161512'
    ctx.beginPath()
    ctx.arc(width / 2, clipY + 26, 13, 0, Math.PI * 2)
    ctx.fill()
    // ดาวสีเทียน
    crayonStar(ctx, 58, height - 190, 46, '#7ea8d8', 3)
    crayonStar(ctx, width - 52, gy + gridH * 0.4, 30, '#e8c53a', 9)
  }

  if (f === 'film') {
    ctx.fillStyle = '#f6f5f1'
    ctx.fillRect(0, 0, width, height)
    speckles(ctx, width, height, 300, '#d8d5cc', 0.5, 31)
    // แผ่นฟิล์มดำ
    ctx.fillStyle = '#0d0d0d'
    rr(ctx, gx - 76, gy - 40, gridW + 152, gridH + 80, 8)
    ctx.fill()
    // ตัวหนังสือข้างฟิล์ม
    ctx.fillStyle = '#e8e6df'
    ctx.font = '700 22px "Courier New", monospace'
    const vtext = (tx, x, y) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText(tx, 0, 0)
      ctx.restore()
    }
    shots.forEach((_, i) => {
      const cy = gy + i * (PH + GAP) + PH / 2
      const frameNo = `${28 + Math.floor(i / 2) + (i % 2)}${i % 2 === 0 ? 'A' : ''}`
      vtext(`▸ ${frameNo}`, gx - 44, cy)
    })
    vtext('TX 5063', gx + gridW + 46, gy + gridH * 0.25)
    vtext('TX 5063', gx + gridW + 46, gy + gridH * 0.8)
  }

  // ---------- วางรูปแต่ละช็อต ----------

  const radius = PANEL_RADIUS[f]
  const extraFilter = f === 'newspaper' ? 'grayscale(1) contrast(1.05)' : null
  const fcss = [filter.css !== 'none' ? filter.css : null, extraFilter].filter(Boolean).join(' ') || 'none'

  shots.forEach((shot, i) => {
    const y = gy + i * (PH + GAP)
    shot.panels.forEach((src, j) => {
      const x = gx + j * (PW + GAP)
      ctx.save()
      rr(ctx, x, y, PW, PH, radius)
      ctx.clip()
      if (src) {
        ctx.filter = fcss
        drawCover(ctx, src, x, y, PW, PH)
        ctx.filter = 'none'
      } else {
        ctx.fillStyle = '#222'
        ctx.fillRect(x, y, PW, PH)
      }
      ctx.restore()
      if (f === 'ticket') {
        ctx.strokeStyle = '#3f2a18'
        ctx.lineWidth = 3
        rr(ctx, x, y, PW, PH, radius)
        ctx.stroke()
      }
      if (f === 'newspaper') {
        ctx.strokeStyle = '#111'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, PW, PH)
      }
    })
  })

  // ---------- ส่วนท้าย / ของตกแต่งทับด้านหน้า ----------

  ctx.textAlign = 'center'

  if (f === 'gradient') {
    const fy = height - M.bottom
    const titleSize = Math.max(34, Math.round(width * 0.032))
    ctx.fillStyle = theme.text
    ctx.font = `800 ${titleSize}px Prompt, sans-serif`
    ctx.fillText(`${theme.emoji}  ${cap}  ${theme.emoji}`, width / 2, fy + 52)
    if (showDate) {
      ctx.font = `500 ${Math.round(titleSize * 0.6)}px Prompt, sans-serif`
      ctx.globalAlpha = 0.8
      ctx.fillText(dateStr, width / 2, fy + 86)
      ctx.globalAlpha = 1
    }
  }

  if (f === 'birthday') {
    const boxW = Math.min(width * 0.74, 620)
    const boxY = height - M.bottom + 62
    ctx.fillStyle = '#fbd3e2'
    ctx.fillRect(width / 2 - boxW / 2, boxY, boxW, 86)
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 3
    ctx.strokeRect(width / 2 - boxW / 2, boxY, boxW, 86)
    ctx.fillStyle = '#111'
    ctx.font = `700 ${Math.max(44, boxW * 0.1)}px 'Dancing Script', 'Prompt', cursive`
    ctx.fillText(cap, width / 2, boxY + 60)
    if (showDate) {
      ctx.fillStyle = '#666'
      ctx.font = '500 20px Prompt, sans-serif'
      ctx.fillText(dateStr, width / 2, boxY + 116)
    }
  }

  if (f === 'ticket') {
    const fy = height - M.bottom
    // ป้ายชื่อ + บาร์โค้ด
    ctx.fillStyle = '#a3242d'
    rr(ctx, width / 2 - 160, fy + 26, 320, 46, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 26px Prompt, sans-serif'
    ctx.fillText('SnapTogether', width / 2, fy + 58)
    starPath(ctx, width / 2 - 195, fy + 49, 14, 6, 0.2)
    ctx.fillStyle = '#1d3557'
    ctx.fill()
    starPath(ctx, width / 2 + 195, fy + 49, 14, 6, -0.2)
    ctx.fill()
    const rnd = seeded(3)
    const bcW = gridW * 0.66
    let bx = width / 2 - bcW / 2
    ctx.fillStyle = '#2a1a0d'
    while (bx < width / 2 + bcW / 2) {
      const bw = 2 + rnd() * 6
      if (rnd() > 0.35) ctx.fillRect(bx, fy + 92, bw, 44)
      bx += bw + 2
    }
  }

  if (f === 'newspaper') {
    const fy = height - M.bottom
    ctx.fillStyle = '#111'
    ctx.fillRect(gx, fy + 26, gridW * 0.46, 92)
    ctx.fillStyle = '#fff'
    ctx.font = `400 ${Math.max(34, gridW * 0.05)}px 'UnifrakturMaguntia', 'Prompt', serif`
    ctx.fillText('SnapTogether', gx + gridW * 0.23, fy + 86)
    ctx.fillStyle = '#111'
    ctx.textAlign = 'left'
    ctx.font = `700 ${Math.max(20, gridW * 0.028)}px Georgia, serif`
    ctx.fillText(lang === 'th' ? 'ความทรงจำฉบับพิเศษ' : 'On This Page of Ours', gx + gridW * 0.52, fy + 62)
    ctx.font = `italic 400 ${Math.max(17, gridW * 0.022)}px Georgia, serif`
    ctx.fillText(
      lang === 'th' ? 'เก็บเสียงหัวเราะของวันนี้ไว้ตรงนี้' : 'Best stories come from random laughs.',
      gx + gridW * 0.52,
      fy + 94,
    )
    ctx.textAlign = 'center'
  }

  if (f === 'stars') {
    const rnd = seeded(77)
    const spots = [
      [gx * 0.45, gy - 30, 34], [width / 2 - 60, gy - 62, 26], [width - gx * 0.4, gy + 40, 40],
      [42, gy + gridH * 0.35, 24], [width - 40, gy + gridH * 0.55, 30],
      [gx * 0.5, gy + gridH - 20, 38], [width - gx * 0.5, gy + gridH + 46, 32],
      [width / 2 + 90, height - 46, 24],
    ]
    spots.forEach(([cx, cy, s]) => goldStar(ctx, cx, cy, s, rnd() * Math.PI))
    // สไมลี่
    ctx.fillStyle = '#d9e63b'
    ctx.beginPath()
    ctx.arc(gx + gridW + 40, gy - 34, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.arc(gx + gridW + 28, gy - 42, 4.5, 0, Math.PI * 2)
    ctx.arc(gx + gridW + 52, gy - 42, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(gx + gridW + 40, gy - 34, 18, 0.2, Math.PI - 0.2)
    ctx.stroke()
    ctx.fillStyle = '#1d2f44'
    ctx.font = `800 ${Math.max(30, width * 0.03)}px Prompt, sans-serif`
    ctx.fillText(cap, width / 2, height - 62)
    if (showDate) {
      ctx.font = '500 20px Prompt, sans-serif'
      ctx.globalAlpha = 0.75
      ctx.fillText(dateStr, width / 2, height - 30)
      ctx.globalAlpha = 1
    }
  }

  if (f === 'scrapbook') {
    // แถบกระดาษฟ้าเขียนแคปชั่น มุมล่างขวา
    const stripW = Math.max(300, width * 0.42)
    const sx = width - stripW - 44
    const sy = height - M.bottom + 44
    ctx.save()
    ctx.translate(sx + stripW / 2, sy + 30)
    ctx.rotate(-0.015)
    ctx.fillStyle = '#3f7fd6'
    ctx.fillRect(-stripW / 2, -30, stripW, 60)
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${Math.max(26, stripW * 0.09)}px Prompt, sans-serif`
    ctx.fillText(cap, 0, 10)
    ctx.restore()
    if (showDate) {
      ctx.fillStyle = '#9a968c'
      ctx.textAlign = 'left'
      ctx.font = 'italic 400 22px Georgia, serif'
      ctx.fillText(dateStr, 48, height - M.bottom + 80)
      ctx.textAlign = 'center'
    }
  }

  if (f === 'film') {
    ctx.fillStyle = '#7c7a72'
    ctx.font = 'italic 400 24px Georgia, serif'
    const foot = [cap, showDate ? dateStr : null].filter(Boolean).join(' · ')
    if (foot) ctx.fillText(foot, width / 2, height - 34)
  }
}

// จับภาพนิ่งจาก <video> ณ ตอนนั้นเป็น canvas (mirror สำหรับกล้องตัวเอง)
export function snapVideo(video, mirror = false) {
  if (!video) return null
  let w = video.videoWidth
  let h = video.videoHeight
  if (!w || !h) {
    // iOS Safari บางเวอร์ชันรายงาน videoWidth=0 สำหรับสตรีม WebRTC ของเพื่อน
    // ทั้งที่ภาพแสดงปกติ — ดึงขนาดจริงจาก video track แทน
    const track = video.srcObject?.getVideoTracks?.()[0]
    const s = track?.getSettings?.() || {}
    w = s.width || 640
    h = s.height || 480
  }
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  try {
    ctx.drawImage(video, 0, 0, w, h)
  } catch {
    return null
  }
  return c
}
