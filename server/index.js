import express from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// โปรดักชันใช้ PORT ปกติ ส่วนตอน dev ใช้ SIGNAL_PORT แยกไว้ ไม่ให้ชนพอร์ตของ Vite
const PORT =
  process.env.NODE_ENV === 'production'
    ? process.env.PORT || 3001
    : process.env.SIGNAL_PORT || 3001

const MIN_ROOM = 2
const MAX_ROOM = 5

const app = express()
const http = createServer(app)
const io = new Server(http)

// โปรดักชัน: เสิร์ฟไฟล์ที่ build แล้วจาก dist
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

// rooms: code -> { host: socketId, members: Set<socketId>, max: number }
const rooms = new Map()

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function randomCode(len = 5) {
  let s = ''
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return s
}

function emitRoomInfo(code) {
  const room = rooms.get(code)
  if (!room) return
  io.to(code).emit('room-info', { count: room.members.size, max: room.max })
}

io.on('connection', (socket) => {
  socket.on('create-room', (opts, cb) => {
    const max = Math.min(MAX_ROOM, Math.max(MIN_ROOM, Number(opts?.max) || MIN_ROOM))
    let code
    do {
      code = randomCode()
    } while (rooms.has(code))
    rooms.set(code, { host: socket.id, members: new Set([socket.id]), max })
    socket.data.code = code
    socket.join(code)
    cb({ code, max })
    emitRoomInfo(code)
  })

  socket.on('join-room', (code, cb) => {
    code = String(code).trim().toUpperCase()
    const room = rooms.get(code)
    if (!room) return cb({ error: 'not-found' })
    if (room.members.size >= room.max) return cb({ error: 'full' })
    // ส่งรายชื่อสมาชิกเดิมให้คนใหม่ เพื่อให้คนใหม่เป็นฝ่ายส่ง offer หาแต่ละคน
    const peers = [...room.members]
    room.members.add(socket.id)
    socket.data.code = code
    socket.join(code)
    cb({ ok: true, peers })
    socket.to(code).emit('peer-joined', { id: socket.id })
    emitRoomInfo(code)
  })

  // ส่งต่อ offer/answer/ICE candidate ถึงปลายทางที่ระบุ (mesh แบบระบุตัว)
  socket.on('signal', ({ to, data }) => {
    if (to && socket.data.code) io.to(to).emit('signal', { from: socket.id, data })
  })

  // สัญญาณเริ่มถ่าย ให้ทุกคนในห้องนับถอยหลังพร้อมกัน
  socket.on('start', () => {
    if (socket.data.code) socket.to(socket.data.code).emit('start')
  })

  // โหมดสำรอง: relay เฟรมภาพ JPEG ผ่านเซิร์ฟเวอร์ เมื่อ WebRTC เชื่อมตรงกันไม่ได้ (เช่น เน็ตมือถือ)
  // ใช้ volatile เพื่อทิ้งเฟรมที่ค้างคิว ไม่ให้ภาพหน่วงสะสม
  socket.on('frame', (data) => {
    if (typeof data === 'string' && data.length < 200000 && socket.data.code) {
      socket.to(socket.data.code).volatile.emit('frame', { from: socket.id, data })
    }
  })

  socket.on('disconnect', () => {
    const code = socket.data.code
    const room = rooms.get(code)
    if (!room) return
    room.members.delete(socket.id)
    if (room.host === socket.id) {
      rooms.delete(code)
      socket.to(code).emit('room-closed')
    } else {
      socket.to(code).emit('peer-left', { id: socket.id })
      emitRoomInfo(code)
    }
  })
})

http.listen(PORT, () => {
  console.log(`[snaptogether] server listening on http://localhost:${PORT}`)
})
