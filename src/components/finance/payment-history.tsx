"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, RefreshCw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Payment = {
  id:string; amount:number|string; payment_method:"cash"|"transfer"; paid_at:string;
  reference:string|null; notes:string|null; status:"posted"|"void";
  students:{student_code:string;first_name:string;last_name:string}|null;
  payment_allocations:{allocated_amount:number|string;student_invoices:{invoice_number:string}|null}[];
};
const money=(n:number)=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:2}).format(n);

export function PaymentHistory(){
  const supabase=useMemo(()=>createClient(),[]);
  const [rows,setRows]=useState<Payment[]>([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [search,setSearch]=useState("");
  const [method,setMethod]=useState("all");
  const [error,setError]=useState("");

  const load=useCallback(async(quiet=false)=>{
    if(quiet)setRefreshing(true);else setLoading(true);
    setError("");
    const {data,error:queryError}=await supabase.from("payments")
      .select("id,amount,payment_method,paid_at,reference,notes,status,students(student_code,first_name,last_name),payment_allocations(allocated_amount,student_invoices(invoice_number))")
      .order("paid_at",{ascending:false});
    if(queryError)setError(queryError.message);
    else setRows((data??[]) as unknown as Payment[]);
    setLoading(false);setRefreshing(false);
  },[supabase]);

  useEffect(()=>{
    void load();
    const channel=supabase.channel("finance-payment-history-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"payments"},()=>void load(true))
      .subscribe();
    return()=>{void supabase.removeChannel(channel);};
  },[load,supabase]);

  const visible=useMemo(()=>{
    const q=search.trim().toLocaleLowerCase("th-TH");
    return rows.filter(row=>{
      const name=row.students?row.students.first_name+" "+row.students.last_name:"";
      const invoice=row.payment_allocations.map(a=>a.student_invoices?.invoice_number??"").join(" ");
      const matches=!q||[name,row.students?.student_code??"",invoice,row.reference??""].join(" ").toLocaleLowerCase("th-TH").includes(q);
      return matches&&(method==="all"||row.payment_method===method);
    });
  },[rows,search,method]);

  return <div className="w-full space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Link href="/finance" aria-label="กลับภาพรวม" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"><ArrowLeft size={18}/></Link><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">PAYMENT HISTORY</p><h1 className="mt-1 text-2xl font-extrabold text-shine-ink">ประวัติการชำระเงิน</h1><p className="mt-1 text-sm text-slate-500">รายการรับเงินที่เจ้าหน้าที่บันทึกไว้ทั้งหมด</p></div></div>
      <button onClick={()=>void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"><RefreshCw size={16} className={refreshing?"animate-spin":""}/> รีเฟรช</button>
    </div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อนักเรียน รหัส หรือเลขที่ใบแจ้งหนี้..." className="w-full bg-transparent text-sm text-slate-700 outline-none"/></label>
      <select value={method} onChange={e=>setMethod(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">ทุกช่องทาง</option><option value="cash">เงินสด</option><option value="transfer">โอนเงิน</option></select>
    </div>
    {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4"><h2 className="font-extrabold text-shine-ink">รายการรับชำระ</h2><p className="mt-1 text-xs text-slate-400">พบ {visible.length.toLocaleString("th-TH")} รายการ · ประวัติการรับเงินเป็นข้อมูลตรวจสอบย้อนหลัง</p></div>
      {loading?<p className="p-10 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</p>:visible.length===0?<div className="p-10 text-center"><ArrowDownLeft size={28} className="mx-auto text-slate-300"/><p className="mt-2 font-bold text-slate-600">ยังไม่มีรายการรับชำระ</p></div>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">วันที่รับเงิน</th><th className="px-4 py-3">นักเรียน</th><th className="px-4 py-3">ใบแจ้งหนี้</th><th className="px-4 py-3">ช่องทาง</th><th className="px-4 py-3">จำนวนเงิน</th><th className="px-4 py-3">สถานะ</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map(row=><tr key={row.id} className="hover:bg-slate-50/70"><td className="px-4 py-4 text-xs text-slate-500">{new Date(row.paid_at).toLocaleString("th-TH")}</td><td className="px-4 py-4"><strong className="block text-slate-700">{row.students?.first_name} {row.students?.last_name}</strong><span className="text-xs text-slate-400">{row.students?.student_code}</span></td><td className="px-4 py-4 text-xs text-slate-600">{row.payment_allocations.map(a=>a.student_invoices?.invoice_number).filter(Boolean).join(", ")||"—"}</td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{row.payment_method==="cash"?"เงินสด":"โอนเงิน"}</span></td><td className="px-4 py-4 font-extrabold text-shine-ink">{money(Number(row.amount))}</td><td className="px-4 py-4"><span className={row.status==="posted"?"text-emerald-700":"text-rose-700"}>{row.status==="posted"?"บันทึกแล้ว":"ยกเลิก"}</span>{row.reference&&<span className="mt-1 block text-[11px] text-slate-400">อ้างอิง: {row.reference}</span>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
