# 📸 SnapTogether

ตู้ถ่ายรูป 4-cut ออนไลน์ — ถ่ายพร้อมกันได้สูงสุด 5 คนจากคนละที่ ผ่านห้องโค้ด 5 ตัว
เห็นหน้ากันสด คุยผ่านไมค์ได้ นับถอยหลัง sync กัน แล้วดาวน์โหลดแถบรูปพร้อมกรอบ 7 สไตล์
รองรับไทย/อังกฤษ ใช้บนมือถือได้ ไม่ต้องลงแอป

## สแต็ก

- **Frontend**: React + Vite (canvas ประกอบแถบรูป)
- **Backend**: Node.js + Express + Socket.IO (จัดการห้อง + WebRTC signaling)
- **วิดีโอ/เสียง**: WebRTC mesh วิ่งตรงระหว่างผู้ใช้ ไม่ผ่านเซิร์ฟเวอร์

## รันในเครื่อง

```bash
npm install
npm run dev        # Vite :5173 + signaling server :3001
```

## รันโปรดักชัน

```bash
npm run build
npm start          # Node ตัวเดียวเสิร์ฟทั้งเว็บและ signaling (พอร์ตจาก $PORT, ค่าเริ่มต้น 3001)
```

## Deploy บน Render (ฟรี)

โปรเจกต์มี `render.yaml` พร้อมแล้ว:

1. push โค้ดขึ้น GitHub
2. เข้า [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → เลือก repo นี้ → Apply
3. เสร็จแล้วได้ URL แบบ `https://snaptogether.onrender.com`

> ⚠️ free tier จะหลับหลังไม่มีคนใช้ ~15 นาที เปิดครั้งแรกอาจรอ ~1 นาที

หมายเหตุ: กล้อง/ไมค์ใช้ได้เฉพาะบน `localhost` หรือ HTTPS (Render เป็น HTTPS ให้อยู่แล้ว)
