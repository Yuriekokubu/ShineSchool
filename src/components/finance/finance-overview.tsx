"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowDownLeft, ArrowUpRight, CalendarDays, CreditCard,
  FileText, Receipt, RefreshCw, Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InvoiceRow = {
  status: "pending" | "partial" | "paid" | "cancelled";
  total_amount: number | string;
  due_date: string;
};
type PaymentRow = {
  amount: number | string;
  payment_method: "cash" | "transfer";
  paid_at: string;
  status: "posted" | "void";
};
type ActiveTerm = {
  academic_year: number;
  term_number: number;
  due_date: string;
} | null;

const localDateKey = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

const money = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);

export function FinanceOverview() {
  const supabase = useMemo(() => createClient(), []);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    const [invoiceResult, paymentResult, termResult] = await Promise.all([
      supabase.from("student_invoices")
        .select("status,total_amount,due_date")
        .neq("status", "cancelled"),
      supabase.from("payments")
        .select("amount,payment_method,paid_at,status")
        .eq("status", "posted"),
      supabase.from("academic_terms")
        .select("academic_year,term_number,due_date")
        .eq("status", "active")
        .maybeSingle(),
    ]);

    const firstError = invoiceResult.error || paymentResult.error || termResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setInvoices((invoiceResult.data ?? []) as InvoiceRow[]);
      setPayments((paymentResult.data ?? []) as PaymentRow[]);
      setActiveTerm(termResult.data as ActiveTerm);
    }

    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
    const channel = supabase.channel("finance-overview-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_invoices" }, () => void loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => void loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "academic_terms" }, () => void loadData(true))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadData, supabase]);

  const summary = useMemo(() => {
    const today = localDateKey();
    const invoiced = invoices.reduce((sum, row) => sum + Number(row.total_amount), 0);
    const collected = payments.reduce((sum, row) => sum + Number(row.amount), 0);
    const outstanding = Math.max(0, invoiced - collected);
    const unpaid = invoices.filter((row) => row.status === "pending").length;
    const partial = invoices.filter((row) => row.status === "partial").length;
    const overdue = invoices.filter((row) =>
      (row.status === "pending" || row.status === "partial") && row.due_date < today
    ).length;
    const cash = payments.filter((row) => row.payment_method === "cash")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const transfer = payments.filter((row) => row.payment_method === "transfer")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    return { invoiced, collected, outstanding, unpaid, partial, overdue, cash, transfer };
  }, [invoices, payments]);

  const cards = [
    { label: "ยอดเรียกเก็บ", value: money(summary.invoiced), note: "รวมใบแจ้งหนี้ที่ยังไม่ยกเลิก", icon: FileText, tone: "bg-blue-50 text-blue-700" },
    { label: "รับชำระแล้ว", value: money(summary.collected), note: "รวมรายการรับเงินที่บันทึกแล้ว", icon: ArrowDownLeft, tone: "bg-emerald-50 text-emerald-700" },
    { label: "ยอดค้างชำระ", value: money(summary.outstanding), note: "ยอดเรียกเก็บหักยอดรับชำระ", icon: Wallet, tone: "bg-amber-50 text-amber-700" },
    { label: "เกินกำหนด", value: summary.overdue.toLocaleString("th-TH") + " ใบ", note: "เลยกำหนดและยังมียอดค้าง", icon: AlertCircle, tone: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="w-full space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Wallet size={23}/></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">SHINESCHOOL FINANCE</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-shine-ink sm:text-3xl">ภาพรวมการเงิน</h1>
            <p className="mt-1 text-sm text-slate-500">ติดตามค่าเล่าเรียน ยอดรับชำระ และยอดค้างของโรงเรียน</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Link href="/finance/payments" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-200">ประวัติชำระเงิน</Link><Link href="/finance/receipts" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-200">ใบเสร็จ</Link><Link href="/finance/invoices" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-200">ใบแจ้งค่าเล่าเรียน</Link><Link href="/finance/settings" className="inline-flex h-10 items-center gap-2 rounded-xl bg-shine-navy px-4 text-sm font-bold text-white hover:bg-blue-900">ตั้งค่าภาคเรียนและค่าเล่าเรียน</Link><button type="button" onClick={() => void loadData(true)} disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm hover:border-emerald-200 disabled:opacity-60">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> รีเฟรช
        </button></div>
      </div>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900"><CalendarDays size={18}/> ภาคเรียนที่กำลังใช้งาน</div>
          {activeTerm ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">กำลังใช้งาน</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">ยังไม่ได้ตั้งค่า</span>}
        </div>
        <p className="mt-2 text-lg font-extrabold text-shine-ink">
          {activeTerm ? `ภาคเรียนที่ ${activeTerm.term_number} / ปีการศึกษา ${activeTerm.academic_year}` : "ยังไม่มีภาคเรียนที่เปิดใช้งาน"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {activeTerm ? `วันครบกำหนดชำระ ${new Date(activeTerm.due_date + "T00:00:00").toLocaleDateString("th-TH")}` : "ต้องกำหนดภาคเรียนและค่าเล่าเรียนก่อนรับนักเรียนใหม่"}
        </p>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">โหลดข้อมูลการเงินไม่สำเร็จ: {error}<p className="mt-1 text-xs">ตรวจสอบว่ารัน Migration 006 แล้ว และบัญชีนี้มีสิทธิ์ผู้ดูแลระบบ</p></div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <span className={"grid size-10 place-items-center rounded-xl " + tone}><Icon size={19}/></span>
            <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 break-words text-xl font-extrabold tracking-tight text-shine-ink">{loading ? "—" : value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><CreditCard size={19} className="text-sky-700"/><h2 className="font-extrabold text-shine-ink">สถานะใบแจ้งค่าเล่าเรียน</h2></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-semibold text-rose-700">ยังไม่ชำระ</p><p className="mt-1 text-2xl font-extrabold text-rose-800">{loading ? "—" : summary.unpaid}</p></div>
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">ชำระบางส่วน</p><p className="mt-1 text-2xl font-extrabold text-amber-800">{loading ? "—" : summary.partial}</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">ระบบไม่มีค่าปรับเมื่อชำระล่าช้า โดยจะแสดงสถานะเกินกำหนดเมื่อเลยวันครบกำหนดและยังมียอดค้าง</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><ArrowUpRight size={19} className="text-emerald-700"/><h2 className="font-extrabold text-shine-ink">ช่องทางรับชำระ</h2></div>
          <div className="mt-5 space-y-4">
            <div><div className="flex justify-between text-sm"><span className="font-semibold text-slate-600">เงินสด</span><strong className="text-shine-ink">{loading ? "—" : money(summary.cash)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: summary.collected ? (summary.cash / summary.collected * 100) + "%" : "0%" }}/></div></div>
            <div><div className="flex justify-between text-sm"><span className="font-semibold text-slate-600">โอนเงิน</span><strong className="text-shine-ink">{loading ? "—" : money(summary.transfer)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: summary.collected ? (summary.transfer / summary.collected * 100) + "%" : "0%" }}/></div></div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500"><Receipt size={15}/> ใบเสร็จรับเงินจะออกเมื่อชำระครบเท่านั้น</div>
        </article>
      </section>

      {!loading && !error && invoices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
          <FileText size={28} className="mx-auto text-slate-300"/>
          <h2 className="mt-3 font-extrabold text-shine-ink">เริ่มต้นตั้งค่าระบบการเงิน</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">หลังจากรัน Migration 006 แล้ว ให้สร้างภาคเรียนที่ใช้งานและกำหนดค่าเล่าเรียนก่อนอนุมัติรับนักเรียน เพื่อให้ระบบออกใบแจ้งหนี้อัตโนมัติ</p>
        </div>
      )}
    </div>
  );
}