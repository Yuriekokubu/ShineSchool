# ShineSchool

ระบบจัดการโรงเรียน พัฒนาด้วย Next.js App Router, TypeScript, Supabase และ Vercel

## Tech stack

- Next.js App Router
- React + TypeScript (strict mode)
- CSS Modules แยกตาม component
- Supabase SSR client สำหรับ Server Components และ Browser Client
- ESLint

## เริ่มต้นใช้งาน

ต้องใช้ Node.js รุ่นที่ Next.js 16 รองรับ และ pnpm

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

เปิด http://localhost:3000

## ตั้งค่า Supabase

1. สร้าง Supabase project
2. เปิด Project Settings → API
3. นำ Project URL และ Publishable key มาใส่ใน `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

ห้ามใส่ `service_role` key ในตัวแปร `NEXT_PUBLIC_*` หรือส่ง key ดังกล่าวไปยัง Browser เด็ดขาด

Supabase client helpers อยู่ที่:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

หน้าจอ Dashboard ในเวอร์ชันเริ่มต้นใช้ข้อมูลตัวอย่าง ยังไม่ได้อ่านหรือเขียนข้อมูลจริงจากฐานข้อมูล จนกว่าจะกำหนด schema และ Row Level Security (RLS) ของโรงเรียน

## ตรวจสอบก่อน deploy

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

## Deploy บน Vercel

1. Push repository ขึ้น GitHub
2. Import repository ใน Vercel
3. เพิ่ม `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ใน Project Settings → Environment Variables
4. Deploy

Vercel จะตรวจจับ Next.js และกำหนด build command ให้อัตโนมัติ
