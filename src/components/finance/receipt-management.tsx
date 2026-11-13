"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Receipt, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ReceiptRow = {
  id: string;
  receipt_number: string;
  total_amount: number | string;
  issued_at: string;
  student_invoices: {
    invoice_number: string;
    students: { student_code: string; first_name: string; last_name: string } | null;
    academic_terms: { academic_year: number; term_number: number } | null;
    payment_allocations: { allocated_amount: number | string; payments: { payment_method: "cash" | "transfer"; paid_at: string; reference: string | null } | null }[];
  } | null;
};

const money=(n:number)=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:2}).format(n);

export function ReceiptManagement(){
  const supabase=useMemo(()=>createClient(),[]);
  const [rows,setRows]=useState<ReceiptRow[]>([]);
  const [selected,setSelected]=useState<ReceiptRow|null>(null);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");

  const load=useCallback(async(quiet=false)=>{
    if(quiet)setRefreshing(true);else setLoading(true);
    setError("");
    const {data,error:queryError}=await supabase.from("receipts")
      .select("id,receipt_number,total_amount,issued_at,student_invoices(invoice_number,students(student_code,first_name,last_name),academic_terms(academic_year,term_number),payment_allocations(allocated_amount,payments(payment_method,paid_at,reference)))")
      .order("issued_at",{ascending:false});
    if(queryError)setError(queryError.message);
    else setRows((data??[]) as unknown as ReceiptRow[]);
    setLoading(false);setRefreshing(false);
  },[supabase]);

  useEffect(()=>{
    void load();
    const channel=supabase.channel("finance-receipts-live")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"receipts"},()=>void load(true))
      .subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[load,supabase]);

  return <div className="w-full space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 no-print">
      <div className="flex items-center gap-3"><Link href="/finance" aria-label="กลับภาพรวม" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"><ArrowLeft size={18}/></Link><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">RECEIPTS</p><h1 className="mt-1 text-2xl font-extrabold text-shine-ink">ใบเสร็จรับเงิน</h1><p className="mt-1 text-sm text-slate-500">ใบเสร็จจะถูกออกโดยอัตโนมัติเมื่อชำระค่าเล่าเรียนครบ</p></div></div>
      <button onClick={()=>void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"><RefreshCw size={16} className={refreshing?"animate-spin":""}/> รีเฟรช</button>
    </div>
    {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {selected? <section className="receipt-print-area rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="no-print mb-5 flex flex-wrap justify-between gap-2"><button onClick={()=>setSelected(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">กลับรายการใบเสร็จ</button><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg bg-shine-navy px-4 py-2 text-sm font-bold text-white"><Printer size={16}/> พิมพ์ใบเสร็จ</button></div>
      <div className="mx-auto max-w-2xl text-slate-800">
        <div className="border-b-2 border-slate-800 pb-5 text-center"><h2 className="text-2xl font-extrabold">ShineSchool</h2><p className="mt-1 text-sm">ใบเสร็จรับเงิน</p><p className="mt-2 text-xs text-slate-500">RECEIPT</p></div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-slate-500">เลขที่ใบเสร็จ</p><strong>{selected.receipt_number}</strong></div><div className="text-right"><p className="text-xs text-slate-500">วันที่ออกใบเสร็จ</p><strong>{new Date(selected.issued_at).toLocaleString("th-TH")}</strong></div></div>
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm"><p className="text-xs text-slate-500">ได้รับเงินจาก</p><p className="mt-1 font-bold">{selected.student_invoices?.students?.first_name} {selected.student_invoices?.students?.last_name}</p><p className="mt-1 text-xs text-slate-500">รหัสนักเรียน {selected.student_invoices?.students?.student_code??"—"}</p><p className="mt-2 text-xs text-slate-500">ใบแจ้งหนี้ {selected.student_invoices?.invoice_number??"—"} · ภาคเรียนที่ {selected.student_invoices?.academic_terms?.term_number??"—"} / {selected.student_invoices?.academic_terms?.academic_year??"—"}</p></div>
        <table className="mt-6 w-full text-sm"><thead><tr className="border-b border-slate-300 text-left"><th className="py-3">รายการ</th><th className="py-3 text-right">จำนวนเงิน</th></tr></thead><tbody><tr className="border-b border-slate-200"><td className="py-4">ค่าเล่าเรียน (ชำระครบแล้ว)</td><td className="py-4 text-right font-bold">{money(Number(selected.total_amount))}</td></tr></tbody><tfoot><tr><td className="py-4 font-extrabold">รวมทั้งสิ้น</td><td className="py-4 text-right text-lg font-extrabold">{money(Number(selected.total_amount))}</td></tr></tfoot></table>
        <div className="mt-7 border-t border-slate-200 pt-4"><p className="mb-2 text-xs font-bold text-slate-600">รายละเอียดการรับชำระ</p>{(selected.student_invoices?.payment_allocations??[]).map((allocation,index)=><div key={index} className="flex justify-between gap-3 py-1 text-xs text-slate-600"><span>{allocation.payments?.payment_method==="cash"?"เงินสด":"โอนเงิน"} · {allocation.payments?.paid_at?new Date(allocation.payments.paid_at).toLocaleDateString("th-TH"):"—"}{allocation.payments?.reference?" · "+allocation.payments.reference:""}</span><strong>{money(Number(allocation.allocated_amount))}</strong></div>)}</div>
        <p className="mt-12 text-center text-xs text-slate-500">เอกสารนี้ออกโดยระบบ ShineSchool</p>
      </div>
    </section>:<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4"><p className="text-sm font-extrabold text-shine-ink">รายการใบเสร็จที่ออกแล้ว</p><p className="mt-1 text-xs text-slate-400">{rows.length.toLocaleString("th-TH")} รายการ</p></div>
      {loading?<p className="p-10 text-center text-sm text-slate-500">กำลังโหลดใบเสร็จ...</p>:rows.length===0?<div className="p-10 text-center"><Receipt size={28} className="mx-auto text-slate-300"/><p className="mt-2 font-bold text-slate-600">ยังไม่มีใบเสร็จรับเงิน</p><p className="mt-1 text-xs text-slate-400">ใบเสร็จจะปรากฏที่นี่เมื่อมีการชำระครบ</p></div>:<div className="divide-y divide-slate-100">{rows.map(row=><button key={row.id} onClick={()=>setSelected(row)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"><span><strong className="block text-sm text-shine-navy">{row.receipt_number}</strong><span className="mt-1 block text-xs text-slate-500">{row.student_invoices?.students?.first_name} {row.student_invoices?.students?.last_name} · {row.student_invoices?.invoice_number}</span><span className="mt-1 block text-xs text-slate-400">{new Date(row.issued_at).toLocaleString("th-TH")}</span></span><span className="text-right"><strong className="block text-sm text-shine-ink">{money(Number(row.total_amount))}</strong><span className="mt-1 block text-xs font-bold text-emerald-700">ชำระครบ · ดูใบเสร็จ</span></span></button>)}</div>}
    </section>}
    <style jsx global>{`@media print { body * { visibility: hidden !important; } .receipt-print-area, .receipt-print-area * { visibility: visible !important; } .receipt-print-area { position: absolute !important; inset: 0 !important; width: 100% !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; } .no-print { display: none !important; } }`}</style>
  </div>;
}