"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, FileText, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Invoice = {
  id: string;
  invoice_number: string;
  due_date: string;
  total_amount: number | string;
  status: "pending" | "partial" | "paid" | "cancelled";
  students: { student_code: string; first_name: string; last_name: string } | null;
  academic_terms: { academic_year: number; term_number: number } | null;
  payment_allocations: { allocated_amount: number | string; payments: { status: "posted" | "void" } | null }[];
};
type PaymentForm = { amount: string; method: "cash" | "transfer"; paidAt: string; reference: string; notes: string };
const localDateKey = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const formatMoney = (n: number) => new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:2}).format(n);
const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
};

export function InvoiceManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [invoices,setInvoices] = useState<Invoice[]>([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("all");
  const [selected,setSelected] = useState<Invoice|null>(null);
  const [form,setForm] = useState<PaymentForm>({amount:"",method:"cash",paidAt:localDateTime(),reference:"",notes:""});
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");

  const loadInvoices = useCallback(async (quiet=false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    const {data,error:queryError}=await supabase.from("student_invoices")
      .select("id,invoice_number,due_date,total_amount,status,students(student_code,first_name,last_name),academic_terms(academic_year,term_number),payment_allocations(allocated_amount,payments(status))")
      .order("created_at",{ascending:false});
    if(queryError) setError(queryError.message);
    else setInvoices((data??[]) as unknown as Invoice[]);
    setLoading(false); setRefreshing(false);
  },[supabase]);

  useEffect(()=>{
    void loadInvoices();
    const channel=supabase.channel("finance-invoices-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"student_invoices"},()=>void loadInvoices(true))
      .on("postgres_changes",{event:"*",schema:"public",table:"payments"},()=>void loadInvoices(true))
      .subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[loadInvoices,supabase]);

  const visible=useMemo(()=>{
    const today=localDateKey();
    const keyword=search.trim().toLocaleLowerCase("th-TH");
    return invoices.filter(row=>{
      const overdue=(row.status==="pending"||row.status==="partial")&&row.due_date<today;
      const status=overdue?"overdue":row.status;
      const name=row.students?row.students.first_name+" "+row.students.last_name:"";
      const matches= !keyword || [row.invoice_number,row.students?.student_code??"",name].join(" ").toLocaleLowerCase("th-TH").includes(keyword);
      return matches && (filter==="all"||filter===status);
    });
  },[invoices,search,filter]);

  async function submitPayment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected||saving) return;
    setSaving(true);setError("");setSuccess("");
    const amount=Number(form.amount);
    if(!Number.isFinite(amount)||amount<=0){setError("กรุณาระบุจำนวนเงินให้ถูกต้อง");setSaving(false);return;}
    const {data,error:rpcError}=await supabase.rpc("admin_record_payment",{
      p_invoice_id:selected.id,
      p_amount:amount,
      p_payment_method:form.method,
      p_paid_at:new Date(form.paidAt).toISOString(),
      p_reference:form.reference.trim()||null,
      p_notes:form.notes.trim()||null,
    });
    if(rpcError){setError(rpcError.message);setSaving(false);return;}
    const result=data as {receipt_number?:string;balance?:number}|null;
    setSuccess(result?.receipt_number
      ? "บันทึกการชำระสำเร็จ และออกใบเสร็จ "+result.receipt_number+" แล้ว"
      : "บันทึกการชำระสำเร็จ · ยอดคงเหลือ "+formatMoney(Number(result?.balance??0)));
    await loadInvoices(true);
    setSaving(false);
    setSelected(null);
  }

  function openPayment(invoice:Invoice){
    setSelected(invoice);
    setForm({amount:"",method:"cash",paidAt:localDateTime(),reference:"",notes:""});
    setError("");setSuccess("");
  }

  return <div className="w-full space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link href="/finance" aria-label="กลับภาพรวม" className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"><ArrowLeft size={18}/></Link>
        <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">INVOICES</p><h1 className="mt-1 text-2xl font-extrabold text-shine-ink">ใบแจ้งค่าเล่าเรียน</h1><p className="mt-1 text-sm text-slate-500">ตรวจสอบยอดเรียกเก็บและบันทึกการรับชำระ</p></div>
      </div>
      <button onClick={()=>void loadInvoices(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"><RefreshCw size={16} className={refreshing?"animate-spin":""}/> รีเฟรช</button>
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเลขที่ใบแจ้งหนี้ ชื่อนักเรียน หรือรหัส..." className="w-full bg-transparent text-sm text-slate-700 outline-none"/></label>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"><option value="all">ทุกสถานะ</option><option value="pending">ยังไม่ชำระ</option><option value="partial">ชำระบางส่วน</option><option value="overdue">เกินกำหนด</option><option value="paid">ชำระครบ</option></select>
    </div>

    {error&&!selected&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4"><h2 className="font-extrabold text-shine-ink">รายการใบแจ้งหนี้</h2><p className="mt-1 text-xs text-slate-400">พบ {visible.length.toLocaleString("th-TH")} รายการ</p></div>
      {loading?<div className="p-10 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>:visible.length===0?<div className="p-10 text-center"><FileText size={28} className="mx-auto text-slate-300"/><p className="mt-2 font-bold text-slate-600">ยังไม่มีใบแจ้งหนี้</p><p className="mt-1 text-xs text-slate-400">ใบแจ้งหนี้จะถูกสร้างเมื่ออนุมัติรับนักเรียนเข้าเรียน</p></div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">เลขที่เอกสาร</th><th className="px-4 py-3">นักเรียน</th><th className="px-4 py-3">ภาคเรียน</th><th className="px-4 py-3">ยอดเรียกเก็บ</th><th className="px-4 py-3">ครบกำหนด</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3"></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{visible.map(row=>{
          const paidAmount=row.payment_allocations.reduce((sum,item)=>sum+(item.payments?.status==="posted"?Number(item.allocated_amount):0),0);
          const remaining=Math.max(0,Number(row.total_amount)-paidAmount);
          const overdue=(row.status==="pending"||row.status==="partial")&&row.due_date<localDateKey();
          const label=overdue?"เกินกำหนด":row.status==="pending"?"ยังไม่ชำระ":row.status==="partial"?"ชำระบางส่วน":row.status==="paid"?"ชำระครบ":"ยกเลิก";
          const color=overdue||row.status==="cancelled"?"bg-rose-50 text-rose-700":row.status==="paid"?"bg-emerald-50 text-emerald-700":row.status==="partial"?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-600";
          return <tr key={row.id} className="hover:bg-slate-50/70"><td className="px-4 py-4 font-bold text-shine-navy">{row.invoice_number}</td><td className="px-4 py-4"><p className="font-bold text-slate-700">{row.students?row.students.first_name+" "+row.students.last_name:"—"}</p><p className="mt-1 text-xs text-slate-400">{row.students?.student_code??""}</p></td><td className="px-4 py-4 text-slate-600">{row.academic_terms?` ${row.academic_terms.term_number}/${row.academic_terms.academic_year}`:"—"}</td><td className="px-4 py-4"><strong className="block text-slate-700">{formatMoney(Number(row.total_amount))}</strong><span className="mt-1 block text-[11px] text-emerald-700">ชำระแล้ว {formatMoney(paidAmount)}</span>{remaining>0&&<span className="mt-1 block text-[11px] text-rose-600">คงเหลือ {formatMoney(remaining)}</span>}</td><td className="px-4 py-4 text-slate-500">{new Date(row.due_date+"T00:00:00").toLocaleDateString("th-TH")}</td><td className="px-4 py-4"><span className={"rounded-full px-2.5 py-1 text-xs font-bold "+color}>{label}</span></td><td className="px-4 py-4 text-right">{row.status!=="paid"&&row.status!=="cancelled"&&<button onClick={()=>openPayment(row)} className="inline-flex items-center gap-1 rounded-lg bg-shine-navy px-3 py-2 text-xs font-bold text-white hover:bg-blue-900"><CreditCard size={14}/> รับชำระ</button>}</td></tr>;
        })}</tbody>
      </table></div>}
    </section>

    {selected&&<div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      <section role="dialog" aria-modal="true" aria-labelledby="payment-dialog-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between"><div><h2 id="payment-dialog-title" className="text-lg font-extrabold text-shine-ink">บันทึกการรับชำระ</h2><p className="mt-1 text-xs text-slate-500">{selected.invoice_number} · {selected.students?.first_name} {selected.students?.last_name}</p></div><button onClick={()=>setSelected(null)} aria-label="ปิด" className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={18}/></button></div>
        <form onSubmit={submitPayment} className="mt-5 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">ยอดใบแจ้งหนี้</span><strong>{formatMoney(Number(selected.total_amount))}</strong></div><p className="mt-1 text-xs text-slate-400">กรอกจำนวนเงินที่ได้รับจริง ระบบจะป้องกันการรับเกินยอดคงเหลือ</p></div>
          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">จำนวนเงินที่รับ (บาท)<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={e=>setForm(v=>({...v,amount:e.target.value}))} className="h-12 w-full rounded-xl border border-slate-200 px-3 text-lg font-bold outline-none focus:border-emerald-400"/></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="block space-y-1.5 text-sm font-semibold text-slate-700">ช่องทาง<select value={form.method} onChange={e=>setForm(v=>({...v,method:e.target.value as PaymentForm["method"]}))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3"><option value="cash">เงินสด</option><option value="transfer">โอนเงิน</option></select></label><label className="block space-y-1.5 text-sm font-semibold text-slate-700">วันที่และเวลารับเงิน<input required type="datetime-local" value={form.paidAt} onChange={e=>setForm(v=>({...v,paidAt:e.target.value}))} className="h-11 w-full rounded-xl border border-slate-200 px-3"/></label></div>
          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">เลขอ้างอิง (ถ้ามี)<input value={form.reference} onChange={e=>setForm(v=>({...v,reference:e.target.value}))} className="h-11 w-full rounded-xl border border-slate-200 px-3"/></label>
          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">หมายเหตุ (ถ้ามี)<textarea value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))} rows={2} className="w-full rounded-xl border border-slate-200 p-3"/></label>
          {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={()=>setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">ยกเลิก</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-shine-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving&&<LoaderCircle size={16} className="animate-spin"/>}{saving?"กำลังบันทึก...":"ยืนยันรับชำระ"}</button></div>
        </form>
      </section>
    </div>}
    {success&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
  </div>;
}