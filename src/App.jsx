import { useEffect, useState } from 'react'
import Booth from './Booth.jsx'
import FrameCard from './FrameCard.jsx'
import { THEMES, FRAMES } from './compose.js'
import { STR, getSavedLang, saveLang } from './i18n.js'

export default function App() {
  // session = { mode: 'solo' | 'host' | 'guest', code?: string, max?: number, frameId: string }
  // เปิดจากลิงก์ชวน (?room=CODE) → เข้าห้องนั้นเป็น guest ทันที
  const [session, setSession] = useState(() => {
    const code = new URLSearchParams(window.location.search).get('room')
    if (code && /^[a-z0-9]{5}$/i.test(code)) {
      return { mode: 'guest', code: code.toUpperCase(), frameId: FRAMES[0].id }
    }
    return null
  })

  // ล้าง ?room= ออกจาก URL หลังอ่านแล้ว กันรีเฟรชแล้วพยายามจอยซ้ำ
  useEffect(() => {
    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])
  const [joinCode, setJoinCode] = useState('')
  const [maxPeople, setMaxPeople] = useState(2)
  const [frameId, setFrameId] = useState(FRAMES[0].id)
  const [lang, setLang] = useState(getSavedLang())
  const t = STR[lang]

  const switchLang = (l) => {
    setLang(l)
    saveLang(l)
  }

  if (session) {
    return <Booth session={session} lang={lang} onExit={() => setSession(null)} />
  }

  const canJoin = joinCode.trim().length === 5

  return (
    <div className="landing">
      <div className="lang-toggle">
        <button className={lang === 'th' ? 'active' : ''} onClick={() => switchLang('th')}>ไทย</button>
        <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
      </div>

      <header className="hero">
        <div className="logo">📸 SnapTogether</div>
        <h1>
          {t.tagline1}
          <span className="accent">{t.tagline2}</span>
        </h1>
        <p className="sub">
          {t.sub1}
          <br />
          {t.sub2}
        </p>

        <div className="actions">
          <button className="btn big primary" onClick={() => setSession({ mode: 'solo', frameId })}>
            {t.solo}
          </button>
          <div className="create-card">
            <div className="size-pick">
              <span>{t.roomSize}</span>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`size-btn ${maxPeople === n ? 'active' : ''}`}
                  onClick={() => setMaxPeople(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className="btn big secondary"
              onClick={() => setSession({ mode: 'host', max: maxPeople, frameId })}
            >
              {t.createRoom(maxPeople)}
            </button>
          </div>
          <div className="join-row">
            <input
              value={joinCode}
              maxLength={5}
              placeholder={t.joinPlaceholder}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canJoin) setSession({ mode: 'guest', code: joinCode, frameId })
              }}
            />
            <button
              className="btn secondary"
              disabled={!canJoin}
              onClick={() => setSession({ mode: 'guest', code: joinCode, frameId })}
            >
              {t.join}
            </button>
          </div>
        </div>
      </header>

      <section className="frame-pick">
        <h2>{t.framesHeading}</h2>
        <div className="frame-grid">
          {FRAMES.map((fr) => (
            <FrameCard
              key={fr.id}
              frame={fr}
              lang={lang}
              active={frameId === fr.id}
              onClick={() => setFrameId(fr.id)}
            />
          ))}
        </div>
      </section>

      <section className="theme-teaser">
        <h2>{t.themesHeading}</h2>
        <div className="theme-chips">
          {THEMES.map((th) => (
            <span
              key={th.id}
              className="chip"
              style={{ background: `linear-gradient(135deg, ${th.bg[0]}, ${th.bg[1]})`, color: th.text }}
            >
              {th.emoji} {th.name[lang]}
            </span>
          ))}
        </div>
      </section>

      <section className="how">
        <h2>{t.howHeading}</h2>
        <ol>
          {t.how.map((step, i) => (
            <li key={i}>
              <b>{step.b}</b>
              {step.rest}
            </li>
          ))}
        </ol>
      </section>

      <footer className="foot">{t.foot}</footer>
    </div>
  )
}
import { useState } from 'react'
import Booth from './Booth.jsx'
import FrameCard from './FrameCard.jsx'
import { THEMES, FRAMES } from './compose.js'
import { STR, getSavedLang, saveLang } from './i18n.js'

export default function App() {
  // session = { mode: 'solo' | 'host' | 'guest', code?: string, max?: number, frameId: string }
  const [session, setSession] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [maxPeople, setMaxPeople] = useState(2)
  const [frameId, setFrameId] = useState(FRAMES[0].id)
  const [lang, setLang] = useState(getSavedLang())
  const t = STR[lang]

  const switchLang = (l) => {
    setLang(l)
    saveLang(l)
  }

  if (session) {
    return <Booth session={session} lang={lang} onExit={() => setSession(null)} />
  }

  const canJoin = joinCode.trim().length === 5

  return (
    <div className="landing">
      <div className="lang-toggle">
        <button className={lang === 'th' ? 'active' : ''} onClick={() => switchLang('th')}>ไทย</button>
        <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
      </div>

      <header className="hero">
        <div className="logo">📸 SnapTogether</div>
        <h1>
          {t.tagline1}
          <span className="accent">{t.tagline2}</span>
        </h1>
        <p className="sub">
          {t.sub1}
          <br />
          {t.sub2}
        </p>

        <div className="actions">
          <button className="btn big primary" onClick={() => setSession({ mode: 'solo', frameId })}>
            {t.solo}
          </button>
          <div className="create-card">
            <div className="size-pick">
              <span>{t.roomSize}</span>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`size-btn ${maxPeople === n ? 'active' : ''}`}
                  onClick={() => setMaxPeople(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              className="btn big secondary"
              onClick={() => setSession({ mode: 'host', max: maxPeople, frameId })}
            >
              {t.createRoom(maxPeople)}
            </button>
          </div>
          <div className="join-row">
            <input
              value={joinCode}
              maxLength={5}
              placeholder={t.joinPlaceholder}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canJoin) setSession({ mode: 'guest', code: joinCode, frameId })
              }}
            />
            <button
              className="btn secondary"
              disabled={!canJoin}
              onClick={() => setSession({ mode: 'guest', code: joinCode, frameId })}
            >
              {t.join}
            </button>
          </div>
        </div>
      </header>

      <section className="frame-pick">
        <h2>{t.framesHeading}</h2>
        <div className="frame-grid">
          {FRAMES.map((fr) => (
            <FrameCard
              key={fr.id}
              frame={fr}
              lang={lang}
              active={frameId === fr.id}
              onClick={() => setFrameId(fr.id)}
            />
          ))}
        </div>
      </section>

      <section className="theme-teaser">
        <h2>{t.themesHeading}</h2>
        <div className="theme-chips">
          {THEMES.map((th) => (
            <span
              key={th.id}
              className="chip"
              style={{ background: `linear-gradient(135deg, ${th.bg[0]}, ${th.bg[1]})`, color: th.text }}
            >
              {th.emoji} {th.name[lang]}
            </span>
          ))}
        </div>
      </section>

      <section className="how">
        <h2>{t.howHeading}</h2>
        <ol>
          {t.how.map((step, i) => (
            <li key={i}>
              <b>{step.b}</b>
              {step.rest}
            </li>
          ))}
        </ol>
      </section>

      <footer className="foot">{t.foot}</footer>
    </div>
  )
}
