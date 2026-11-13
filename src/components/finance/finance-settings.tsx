"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type SettingsForm = {
  academicYear: string;
  termNumber: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  tuitionAmount: string;
};

const initialForm = (): SettingsForm => ({
  academicYear: String(new Date().getFullYear() + 543),
  termNumber: "1",
  startDate: "",
  endDate: "",
  dueDate: "",
  tuitionAmount: "",
});

export function FinanceSettings() {
  const [form, setForm] = useState<SettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    async function loadCurrent() {
      const { data, error: queryError } = await supabase
        .from("academic_terms")
        .select("id,academic_year,term_number,start_date,end_date,due_date,tuition_settings(tuition_amount)")
        .eq("status", "active")
        .maybeSingle();

      if (!active) return;
      if (queryError) {
        setError(queryError.message);
      } else if (data) {
        const row = data as {
          academic_year: number;
          term_number: number;
          start_date: string;
          end_date: string;
          due_date: string;
          tuition_settings: { tuition_amount: number | string }[] | { tuition_amount: number | string } | null;
        };
        const tuition = Array.isArray(row.tuition_settings) ? row.tuition_settings[0] : row.tuition_settings;
        setForm({
          academicYear: String(row.academic_year),
          termNumber: String(row.term_number),
          startDate: row.start_date,
          endDate: row.end_date,
          dueDate: row.due_date,
          tuitionAmount: tuition ? String(tuition.tuition_amount) : "",
        });
      }
      setLoading(false);
    }
    void loadCurrent();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");

    const amount = Number(form.tuitionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("กรุณาระบุค่าเล่าเรียนให้มากกว่า 0 บาท");
      setSaving(false);
      return;
    }

    const { data, error: saveError } = await supabase.rpc("admin_configure_academic_term", {
      p_academic_year: Number(form.academicYear),
      p_term_number: Number(form.termNumber),
      p_start_date: form.startDate,
      p_end_date: form.endDate,
      p_due_date: form.dueDate,
      p_tuition_amount: amount,
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      const result = data as { academic_year?: number; term_number?: number } | null;
      setSuccess(
        "บันทึกภาคเรียนและค่าเล่าเรียนเรียบร้อย" +
        (result ? ` · ภาคเรียนที่ ${result.term_number} / ปีการศึกษา ${result.academic_year}` : ""),
      );
    }
    setSaving(false);
  }

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finance" aria-label="กลับภาพรวมการเงิน" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft size={18}/></Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">FINANCE SETTINGS</p>
          <h1 className="mt-1 text-2xl font-extrabold text-shine-ink">ภาคเรียนและค่าเล่าเรียน</h1>
          <p className="mt-1 text-sm text-slate-500">กำหนดภาคเรียนที่ใช้งานและราคากลางเดียวสำหรับนักเรียนทุกกลุ่ม</p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-900">
        <strong>นโยบายค่าเล่าเรียน</strong>
        <p className="mt-1">กำหนดราคาเดียวต่อภาคเรียน ไม่มีค่าใช้จ่ายเพิ่มเติม และระบบจะใช้ราคานี้สร้างใบแจ้งหนี้ให้นักเรียนที่รับเข้าใหม่</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4"><CalendarDays size={19} className="text-emerald-700"/><h2 className="font-extrabold text-shine-ink">ข้อมูลภาคเรียน</h2></div>
        {loading ? <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin"/> กำลังโหลดข้อมูล...</div> : <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">ปีการศึกษา<input required type="number" min="2400" max="2700" value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-emerald-400"/></label>
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">ภาคเรียน<select value={form.termNumber} onChange={(e) => update("termNumber", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-400"><option value="1">ภาคเรียนที่ 1</option><option value="2">ภาคเรียนที่ 2</option><option value="3">ภาคเรียนที่ 3</option></select></label>
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">วันเริ่มต้น<input required type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-emerald-400"/></label>
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">วันสิ้นสุด<input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-emerald-400"/></label>
            <label className="space-y-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">วันครบกำหนดชำระ<input required type="date" min={form.startDate || undefined} value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-emerald-400"/></label>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <h2 className="font-extrabold text-shine-ink">ค่าเล่าเรียนต่อคน</h2>
            <p className="mt-1 text-xs text-slate-500">ราคาเดียวกันทุกกลุ่มเรียน ระบบบันทึกราคานี้เป็นยอดคงที่ในใบแจ้งหนี้ที่สร้างแล้ว</p>
            <label className="mt-4 block space-y-1.5 text-sm font-semibold text-slate-700">จำนวนเงิน (บาท)<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.tuitionAmount} onChange={(e) => update("tuitionAmount", e.target.value)} placeholder="เช่น 5000" className="h-12 w-full rounded-xl border border-slate-200 px-3 text-lg font-bold outline-none focus:border-emerald-400"/></label>
          </div>
        </>}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17}/>{success}</p>}
        <button type="submit" disabled={loading || saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-shine-navy px-5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {saving ? <LoaderCircle size={17} className="animate-spin"/> : <Save size={17}/>} {saving ? "กำลังบันทึก..." : "บันทึกและเปิดใช้งานภาคเรียน"}
        </button>
      </form>
    </div>
  );
}