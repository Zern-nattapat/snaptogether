import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import FrameCard from './FrameCard.jsx'
import { THEMES, FILTERS, FRAMES, composeStrip, snapVideo } from './compose.js'
import { STR } from './i18n.js'

const SHOTS = 4
const COUNTDOWN = 3
// STUN อย่างเดียวไม่พอสำหรับเน็ตมือถือ (CGNAT) — ต้องมี TURN relay เป็นทางสำรอง
// ใช้ Open Relay ของ metered.ca (ฟรี, username/credential เป็นค่าสาธารณะของบริการ)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Booth({ session, lang, onExit }) {
  const { mode } = session
  const isDuo = mode !== 'solo'
  const t = STR[lang]

  const localVideoRef = useRef(null)
  const remoteVideoElsRef = useRef({}) // peerId -> <video>
  const previewCanvasRef = useRef(null)
  const socketRef = useRef(null)
  const peersRef = useRef(new Map()) // peerId -> { pc, pending: [candidate] }
  const streamRef = useRef(null)
  const shootingRef = useRef(false)
  const statusRef = useRef('init')

  // init | waiting | ready | shooting | preview | error
  const [status, setStatus] = useState('init')
  const [error, setError] = useState('')
  const [roomCode, setRoomCode] = useState(session.code || '')
  const [roomInfo, setRoomInfo] = useState(null) // { count, max }
  const [remotePeers, setRemotePeers] = useState({}) // peerId -> MediaStream
  const [micOn, setMicOn] = useState(true)
  const [count, setCount] = useState(null)
  const [flash, setFlash] = useState(false)
  const [shotNum, setShotNum] = useState(0)
  const [shots, setShots] = useState([])
  const [frame, setFrame] = useState(FRAMES.find((f) => f.id === session.frameId) || FRAMES[0])
  // หน้าเลือกกรอบก่อนเข้าหน้ากล้อง — กล้อง/ห้องเชื่อมต่อรอไว้เบื้องหลังระหว่างเลือก
  const [framePicked, setFramePicked] = useState(false)
  const [theme, setTheme] = useState(THEMES[0])
  const [filter, setFilter] = useState(FILTERS[0])
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // iOS Safari บล็อก autoplay ของวิดีโอ/เสียง — ปลดล็อกด้วยการแตะหน้าจอครั้งแรกของผู้ใช้
  useEffect(() => {
    const unlock = () => {
      document.querySelectorAll('.booth video, .booth audio').forEach((m) => {
        if (m.paused) m.play().catch(() => {})
      })
    }
    document.addEventListener('touchend', unlock)
    document.addEventListener('click', unlock)
    return () => {
      document.removeEventListener('touchend', unlock)
      document.removeEventListener('click', unlock)
    }
  }, [])

  const peerIds = Object.keys(remotePeers).sort()
  const canShoot = !isDuo || peerIds.length > 0

  const runSequence = useCallback(async () => {
    if (shootingRef.current || statusRef.current === 'preview') return
    shootingRef.current = true
    // ถ้าอีกฝั่งกดเริ่มตอนเรายังเลือกกรอบอยู่ ให้เด้งเข้าหน้ากล้องทันที (กล้องจะ mount ทันช่วงนับถอยหลัง)
    setFramePicked(true)
    setShots([])
    setStatus('shooting')
    const taken = []
    for (let i = 0; i < SHOTS; i++) {
      setShotNum(i + 1)
      for (let c = COUNTDOWN; c > 0; c--) {
        setCount(c)
        await sleep(1000)
      }
      setCount(null)
      setFlash(true)
      // จับภาพตัวเองก่อน แล้วตามด้วยเพื่อนทุกคน (เรียงตาม id ให้ลำดับคงที่ทุกช็อต)
      const ids = Object.keys(remoteVideoElsRef.current)
        .filter((id) => remoteVideoElsRef.current[id])
        .sort()
      taken.push({
        panels: [
          snapVideo(localVideoRef.current, true),
          ...ids.map((id) => snapVideo(remoteVideoElsRef.current[id], false)),
        ].filter(Boolean),
      })
      await sleep(160)
      setFlash(false)
      if (i < SHOTS - 1) await sleep(900)
    }
    setShots(taken)
    setStatus('preview')
    shootingRef.current = false
  }, [])

  // ตั้งค่ากล้อง + Socket.IO + WebRTC mesh
  useEffect(() => {
    let cancelled = false

    async function setup() {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
          audio: isDuo,
        })
      } catch {
        setError(t.errCam)
        setStatus('error')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((tr) => tr.stop())
        return
      }
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      if (!isDuo) {
        setStatus('ready')
        return
      }

      setStatus('waiting')
      const socket = io()
      socketRef.current = socket

      // สร้างการเชื่อมต่อกับเพื่อนหนึ่งคนใน mesh
      function createPeer(peerId, initiator) {
        const entry = { pc: new RTCPeerConnection({ iceServers: ICE_SERVERS }), pending: [] }
        peersRef.current.set(peerId, entry)
        stream.getTracks().forEach((tr) => entry.pc.addTrack(tr, stream))
        entry.pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('signal', { to: peerId, data: { candidate: e.candidate } })
        }
        entry.pc.ontrack = (e) => {
          setRemotePeers((prev) => ({ ...prev, [peerId]: e.streams[0] }))
          if (statusRef.current === 'waiting') setStatus('ready')
        }
        if (initiator) {
          entry.pc
            .createOffer()
            .then((offer) => entry.pc.setLocalDescription(offer))
            .then(() => socket.emit('signal', { to: peerId, data: { desc: entry.pc.localDescription } }))
            .catch((e) => console.error('offer error', e))
        }
        return entry
      }

      function removePeer(peerId) {
        peersRef.current.get(peerId)?.pc.close()
        peersRef.current.delete(peerId)
        delete remoteVideoElsRef.current[peerId]
        setRemotePeers((prev) => {
          const next = { ...prev }
          delete next[peerId]
          return next
        })
      }

      socket.on('connect_error', () => {
        setError(t.errServer)
        setStatus('error')
      })

      socket.on('signal', async ({ from, data }) => {
        // คนที่มาทีหลังเป็นฝ่ายส่ง offer ดังนั้นถ้ายังไม่รู้จัก from แปลว่าเป็นเพื่อนใหม่
        const entry = peersRef.current.get(from) || createPeer(from, false)
        const pc = entry.pc
        try {
          if (data.desc) {
            await pc.setRemoteDescription(data.desc)
            for (const c of entry.pending) await pc.addIceCandidate(c)
            entry.pending = []
            if (data.desc.type === 'offer') {
              await pc.setLocalDescription(await pc.createAnswer())
              socket.emit('signal', { to: from, data: { desc: pc.localDescription } })
            }
          } else if (data.candidate) {
            if (pc.remoteDescription) await pc.addIceCandidate(data.candidate)
            else entry.pending.push(data.candidate)
          }
        } catch (e) {
          console.error('signal error', e)
        }
      })

      socket.on('start', runSequence)
      socket.on('room-info', setRoomInfo)
      socket.on('peer-left', ({ id }) => removePeer(id))
      socket.on('room-closed', () => {
        setError(t.errClosed)
        setStatus('error')
      })

      if (mode === 'host') {
        socket.emit('create-room', { max: session.max }, ({ code }) => setRoomCode(code))
        // host แค่รอ — คนที่เข้ามาใหม่จะเป็นฝ่ายส่ง offer มาเอง
      } else {
        socket.emit('join-room', session.code, ({ ok, peers, error: err }) => {
          if (!ok) {
            setError(err === 'not-found' ? t.errNotFound(session.code) : t.errFull)
            setStatus('error')
            return
          }
          setRoomCode(session.code)
          // คนใหม่ส่ง offer หาสมาชิกเดิมทุกคน
          peers.forEach((id) => createPeer(id, true))
        })
      }
    }

    setup()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      peersRef.current.forEach((entry) => entry.pc.close())
      peersRef.current.clear()
      socketRef.current?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = () => {
    socketRef.current?.emit('start')
    runSequence()
  }

  const toggleMic = () => {
    const on = !micOn
    streamRef.current?.getAudioTracks().forEach((tr) => (tr.enabled = on))
    setMicOn(on)
  }

  // ประกอบแถบรูปตัวอย่างใหม่ทุกครั้งที่แต่งรูป
  useEffect(() => {
    if (status === 'preview' && shots.length && previewCanvasRef.current) {
      composeStrip({ canvas: previewCanvasRef.current, shots, theme, filter, frame, caption, showDate, lang })
    }
  }, [status, shots, theme, filter, frame, caption, showDate, lang])

  const download = () => {
    previewCanvasRef.current.toBlob((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `snaptogether-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }

  // คัดลอกเป็นลิงก์จอยตรง เพื่อนกดแล้วเข้าห้องเลยไม่ต้องพิมพ์โค้ด
  const copyLink = () => {
    if (!roomCode) return
    navigator.clipboard?.writeText(`${window.location.origin}/?room=${roomCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (status === 'error') {
    return (
      <div className="booth center-page">
        <div className="panel">
          <h2>{t.oops}</h2>
          <p>{error}</p>
          <button className="btn primary" onClick={onExit}>{t.backHome}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="booth">
      {/* เสียงเพื่อนแยกเป็น <audio> ต่างหาก จะได้ยังคุยกันได้แม้อยู่หน้าแต่งรูป */}
      {isDuo &&
        Object.entries(remotePeers).map(([id, s]) => (
          <audio
            key={id}
            autoPlay
            ref={(el) => {
              if (el && el.srcObject !== s) {
                el.srcObject = s
                el.play?.().catch(() => {})
              }
            }}
          />
        ))}

      <div className="booth-top">
        <button className="btn ghost" onClick={onExit}>{t.exit}</button>
        {isDuo && (
          <div className="top-badges">
            <button className={`mic-btn ${micOn ? '' : 'off'}`} onClick={toggleMic}>
              {micOn ? t.micOn : t.micOff}
            </button>
            {roomInfo && (
              <span className="members-badge">👥 {roomInfo.count}/{roomInfo.max}</span>
            )}
            <div className="room-badge" onClick={copyLink} title="copy invite link">
              {copied ? t.copied : (
                <>{t.room}: <b>{roomCode || '…'}</b> 🔗</>
              )}
            </div>
          </div>
        )}
      </div>

      {!framePicked && status !== 'preview' ? (
        <div className="pick-page">
          <h2>{t.pickTitle}</h2>
          <div className="frame-grid big">
            {FRAMES.map((fr) => (
              <FrameCard
                key={fr.id}
                frame={fr}
                lang={lang}
                active={frame.id === fr.id}
                onClick={() => setFrame(fr)}
              />
            ))}
          </div>
          <button className="btn shutter" onClick={() => setFramePicked(true)}>
            {t.pickGo}
          </button>
          {isDuo && <p className="hint">{t.pickHint}</p>}
        </div>
      ) : status === 'preview' ? (
        <div className="preview-wrap">
          <div className="strip-holder">
            <canvas ref={previewCanvasRef} className="strip-canvas" />
          </div>
          <div className="editor">
            <h3>{t.edit}</h3>
            <div className="opt-group">
              <label>{t.frameLabel}</label>
              <div className="opt-row">
                {FRAMES.map((fr) => (
                  <button
                    key={fr.id}
                    className={`chip clickable plain ${frame.id === fr.id ? 'active' : ''}`}
                    onClick={() => setFrame(fr)}
                  >
                    {fr.emoji} {fr.name[lang]}
                  </button>
                ))}
              </div>
            </div>
            {frame.id === 'gradient' && (
              <div className="opt-group">
                <label>{t.themeLabel}</label>
                <div className="opt-row">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      className={`chip clickable ${theme.id === th.id ? 'active' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${th.bg[0]}, ${th.bg[1]})`, color: th.text }}
                      onClick={() => setTheme(th)}
                    >
                      {th.emoji} {th.name[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="opt-group">
              <label>{t.filterLabel}</label>
              <div className="opt-row">
                {FILTERS.map((fl) => (
                  <button
                    key={fl.id}
                    className={`chip clickable plain ${filter.id === fl.id ? 'active' : ''}`}
                    onClick={() => setFilter(fl)}
                  >
                    {fl.name[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="opt-group">
              <label>{t.captionLabel}</label>
              <input
                className="caption-input"
                value={caption}
                placeholder={frame.id === 'gradient' ? theme.label : frame.defaultCaption?.[lang]}
                maxLength={28}
                onChange={(e) => setCaption(e.target.value)}
              />
              <label className="check">
                <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} />
                {t.showDate}
              </label>
            </div>
            <div className="editor-actions">
              <button className="btn big primary" onClick={download}>{t.download}</button>
              <button className="btn secondary" onClick={() => { setShots([]); setStatus('ready') }}>
                {t.retake}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`stage ${isDuo ? 'multi' : ''}`}>
            <div className="cam">
              <video
                autoPlay
                playsInline
                muted
                className="mirror"
                style={{ filter: filter.css }}
                ref={(el) => {
                  localVideoRef.current = el
                  // ผูก stream ใหม่ทุกครั้งที่ element ถูก mount (เช่น กลับมาจากหน้าแต่งรูป)
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current
                    el.play?.().catch(() => {})
                  }
                }}
              />
              <span className="cam-tag">{t.you}</span>
            </div>
            {peerIds.map((id, i) => (
              <div className="cam" key={id}>
                <video
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: filter.css }}
                  ref={(el) => {
                    remoteVideoElsRef.current[id] = el
                    if (el && el.srcObject !== remotePeers[id]) {
                      el.srcObject = remotePeers[id]
                      el.play?.().catch(() => {})
                    }
                  }}
                />
                <span className="cam-tag">{t.friend} {i + 1}</span>
              </div>
            ))}
            {isDuo && peerIds.length === 0 && (
              <div className="cam">
                <div className="cam-placeholder">
                  {mode === 'host' ? (
                    <>
                      <div className="pulse">⏳</div>
                      <p>{t.waitFriend}</p>
                      <p className="code-share">
                        {t.sendCodePre}<b>{roomCode || '…'}</b>{t.sendCodePost}
                      </p>
                      <button className="share-btn" onClick={copyLink}>
                        {copied ? t.copied : t.shareLink}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="pulse">🔗</div>
                      <p>{t.connecting(session.code)}</p>
                    </>
                  )}
                </div>
              </div>
            )}
            {count !== null && <div className="countdown">{count}</div>}
            {flash && <div className="flash" />}
            {status === 'shooting' && count === null && !flash && (
              <div className="shot-indicator">{t.shotLabel(shotNum, SHOTS)}</div>
            )}
          </div>

          <div className="controls">
            {status === 'shooting' ? (
              <div className="shooting-note">{t.smile(shotNum, SHOTS)}</div>
            ) : (
              <>
                <div className="pre-opt">
                  <span className="opt-label">{t.frameLabel}</span>
                  <div className="opt-row center">
                    {FRAMES.map((fr) => (
                      <button
                        key={fr.id}
                        className={`chip clickable plain ${frame.id === fr.id ? 'active' : ''}`}
                        onClick={() => setFrame(fr)}
                      >
                        {fr.emoji} {fr.name[lang]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pre-opt">
                  <span className="opt-label">{t.filterLabel}</span>
                  <div className="opt-row center">
                    {FILTERS.map((fl) => (
                      <button
                        key={fl.id}
                        className={`chip clickable plain ${filter.id === fl.id ? 'active' : ''}`}
                        onClick={() => setFilter(fl)}
                      >
                        {fl.name[lang]}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn shutter" disabled={!canShoot} onClick={start}>
                  {!canShoot ? t.waitOne : t.start(SHOTS)}
                </button>
                {isDuo && canShoot && (
                  <p className="hint">
                    {t.hintSync}
                    {roomInfo && roomInfo.count < roomInfo.max && t.hintMore}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
