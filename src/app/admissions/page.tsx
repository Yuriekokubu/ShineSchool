import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { AdmissionForm } from "@/components/admissions/admission-form";
import { StudentIllustration } from "@/components/admissions/student-illustration";

export const metadata = {
  title: "สมัครเรียน | ShineSchool",
  description: "แบบฟอร์มสมัครเรียน ShineSchool สำหรับผู้ปกครอง",
};

export default function AdmissionsPage() {
  return (
    <main className="min-h-screen bg-[#f8faff] text-shine-ink">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-shine-ink">
            <span className="grid size-11 place-items-center rounded-full bg-shine-yellow text-shine-navy"><Star size={27} fill="currentColor" /></span>
            <span className="text-2xl">ShineSchool</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-shine-navy hover:text-amber-600">
            <ArrowLeft size={17} /> กลับหน้าแรก
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-white">
        <div className="pointer-events-none absolute -right-24 -top-28 -z-10 size-[420px] rounded-full bg-shine-yellow/65" />
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_.8fr] lg:py-16">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-shine-yellow-soft px-5 py-2.5 text-sm font-bold text-[#654d08]"><Star size={16}/> ADMISSIONS · SHINESCHOOL</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-shine-ink sm:text-5xl lg:text-6xl">ทุกการเติบโต<br/><span className="mt-2 inline-block rounded-2xl bg-shine-yellow px-4 py-2 text-shine-navy">เริ่มต้นที่นี่</span></h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">กรอกข้อมูลนักเรียนและผู้ปกครอง เพื่อให้ทีมงาน ShineSchool ติดต่อกลับและแนะนำขั้นตอนการสมัครเรียน</p>
          </div>
          <div className="mx-auto w-full max-w-[430px]"><StudentIllustration/></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:pb-24">
        <AdmissionForm />
      </section>
    </main>
  );
}
