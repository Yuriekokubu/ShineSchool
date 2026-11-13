"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FileText, LoaderCircle, Mail, Phone, RefreshCw, Search, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ApplicationStatus = "pending" | "contacted" | "reviewing" | "accepted" | "rejected";
type Application = {
  id: string; student_first_name: string; student_last_name: string; age: number;
  applying_level: string; current_school: string | null; parent_first_name: string;
  parent_last_name: string; relationship: string; phone: string; email: string | null;
  notes: string | null; student_photo_path: string | null; status: ApplicationStatus;
  is_read: boolean; created_at: string;
};

const statusOptions: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "ทุกสถานะ" }, { value: "pending", label: "รอติดต่อ" },
  { value: "contacted", label: "ติดต่อแล้ว" }, { value: "reviewing", label: "กำลังพิจารณา" },
  { value: "accepted", label: "รับเข้าเรียน" }, { value: "rejected", label: "ไม่ผ่านการพิจารณา" },
];
const statusStyle: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  contacted: "bg-sky-50 text-sky-700 ring-sky-200",
  reviewing: "bg-violet-50 text-violet-700 ring-violet-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};
const statusLabel: Record<ApplicationStatus, string> = {
  pending: "รอติดต่อ", contacted: "ติดต่อแล้ว", reviewing: "กำลังพิจารณา",
  accepted: "รับเข้าเรียน", rejected: "ไม่ผ่านการพิจารณา",
};
const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

export function AdmissionManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: queryError } = await supabase.from("admission_applications")
      .select("id,student_first_name,student_last_name,age,applying_level,current_school,parent_first_name,parent_last_name,relationship,phone,email,notes,student_photo_path,status,is_read,created_at")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message + (queryError.code ? " (รหัส " + queryError.code + ")" : ""));
    else setApplications((data ?? []) as Application[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("admission-management-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admission_applications" }, (payload) => {
        const incoming = payload.new as Application;
        setApplications((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admission_applications" }, (payload) => {
        const updated = payload.new as Application;
        setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
        setSelected((current) => current?.id === updated.id ? updated : current);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  useEffect(() => {
    if (!selected?.student_photo_path) { setPhotoUrl(null); return; }
    let active = true;
    const supabase = createClient();
    void supabase.storage.from("admission-photos").createSignedUrl(selected.student_photo_path, 600)
      .then(({ data, error: photoError }) => {
        if (active) setPhotoUrl(photoError ? null : data?.signedUrl ?? null);
      });
    return () => { active = false; };
  }, [selected]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("th-TH");
    return applications.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = [item.student_first_name, item.student_last_name, item.parent_first_name, item.parent_last_name, item.phone, item.applying_level].join(" ").toLocaleLowerCase("th-TH");
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [applications, search, statusFilter]);

  const counts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter((item) => item.status === "pending").length,
    reviewing: applications.filter((item) => item.status === "reviewing").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
  }), [applications]);

  async function updateStatus(nextStatus: ApplicationStatus) {
    if (!selected || selected.status === nextStatus || updating) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    const supabase = createClient();

    if (nextStatus === "accepted") {
      const { data, error: enrollmentError } = await supabase.rpc(
        "admin_accept_admission",
        { p_admission_id: selected.id },
      );

      if (enrollmentError) {
        setError("รับนักเรียนเข้าเรียนไม่สำเร็จ: " + enrollmentError.message);
        setUpdating(false);
        return;
      }

      const enrollment = data as {
        student_code?: string;
        invoice_number?: string;
      } | null;
      const updated = { ...selected, status: "accepted" as const };
      setSelected(updated);
      setApplications((current) =>
        current.map((item) => item.id === selected.id ? updated : item),
      );
      setSuccess(
        "รับเข้าเรียนเรียบร้อย" +
        (enrollment?.student_code ? " · รหัสนักเรียน " + enrollment.student_code : "") +
        (enrollment?.invoice_number ? " · สร้างใบแจ้งหนี้ " + enrollment.invoice_number + " แล้ว" : ""),
      );
      setUpdating(false);
      return;
    }

    const { error: updateError } = await supabase.from("admission_applications")
      .update({ status: nextStatus }).eq("id", selected.id);

    if (updateError) {
      setError("เปลี่ยนสถานะไม่สำเร็จ: " + updateError.message);
    } else {
      const updated = { ...selected, status: nextStatus };
      setSelected(updated);
      setApplications((current) => current.map((item) => item.id === selected.id ? updated : item));
      setSuccess("บันทึกสถานะใบสมัครเรียบร้อยแล้ว");
    }
    setUpdating(false);
  }

  async function openApplication(application: Application) {
    setSelected(application); setSuccess(""); setError("");
    if (application.is_read) return;
    const supabase = createClient();
    const { error: updateError } = await supabase.from("admission_applications")
      .update({ is_read: true }).eq("id", application.id);
    if (!updateError) {
      setApplications((current) => current.map((item) => item.id === application.id ? { ...item, is_read: true } : item));
      setSelected({ ...application, is_read: true });
    }
  }

  return (
    <div className="w-full">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><FileText size={23}/></span>
          <div><h1 className="text-2xl font-extrabold tracking-tight text-shine-ink sm:text-3xl">จัดการใบสมัคร</h1><p className="mt-1 text-sm text-slate-500">ตรวจสอบและติดตามใบสมัครที่ส่งมาจากเว็บไซต์</p></div>
        </div>
        <button type="button" onClick={() => void loadApplications(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-shine-navy disabled:opacity-60">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> รีเฟรชข้อมูล
        </button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-400">ใบสมัครทั้งหมด</p><p className="mt-2 text-3xl font-extrabold text-shine-ink">{counts.all}</p></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-xs font-semibold text-amber-700">รอติดต่อ</p><p className="mt-2 text-3xl font-extrabold text-amber-800">{counts.pending}</p></div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><p className="text-xs font-semibold text-violet-700">กำลังพิจารณา</p><p className="mt-2 text-3xl font-extrabold text-violet-800">{counts.reviewing}</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"><p className="text-xs font-semibold text-emerald-700">รับเข้าเรียนแล้ว</p><p className="mt-2 text-3xl font-extrabold text-emerald-800">{counts.accepted}</p></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-extrabold text-shine-ink">รายการใบสมัครเรียน</h2><p className="mt-1 text-xs text-slate-400">พบ {filteredApplications.length} รายการ</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400 sm:w-64"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อ เบอร์โทร..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/></label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "all")} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-300">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        {error && !selected && <div className="mx-4 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-5">{error}</div>}
        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={19} className="animate-spin"/> กำลังโหลดใบสมัคร...</div>
        : filteredApplications.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400"><FileText size={25}/></span><p className="mt-3 font-bold text-slate-600">{applications.length ? "ไม่พบใบสมัครที่ตรงกับการค้นหา" : "ยังไม่มีใบสมัครเข้ามา"}</p><p className="mt-1 text-xs text-slate-400">{applications.length ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" : "เมื่อมีผู้ปกครองส่งแบบฟอร์ม รายการจะแสดงที่หน้านี้"}</p></div>
        : <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400"><tr><th className="px-5 py-3">นักเรียน</th><th className="px-5 py-3">ระดับที่สมัคร</th><th className="px-5 py-3">ผู้ปกครอง / เบอร์โทร</th><th className="px-5 py-3">วันที่สมัคร</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-right">รายละเอียด</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filteredApplications.map((item) => <tr key={item.id} className="transition hover:bg-blue-50/40">
                <td className="px-5 py-4"><div className="flex items-center gap-2"><span className={"size-2 rounded-full " + (item.is_read ? "bg-slate-200" : "bg-rose-500")}/><div><p className="text-sm font-bold text-slate-700">{item.student_first_name} {item.student_last_name}</p><p className="mt-1 text-xs text-slate-400">อายุ {item.age} ปี</p></div></div></td>
                <td className="px-5 py-4 text-sm text-slate-600">{item.applying_level}</td>
                <td className="px-5 py-4"><p className="text-sm font-semibold text-slate-600">{item.parent_first_name} {item.parent_last_name}</p><a href={"tel:" + item.phone} className="mt-1 block text-xs text-slate-400 hover:text-shine-navy">{item.phone}</a></td>
                <td className="px-5 py-4 text-xs text-slate-500">{dateFormatter.format(new Date(item.created_at))}</td>
                <td className="px-5 py-4"><span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset " + statusStyle[item.status]}>{statusLabel[item.status]}</span></td>
                <td className="px-5 py-4 text-right"><button type="button" onClick={() => void openApplication(item)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-shine-navy hover:bg-blue-50"><Eye size={14}/> ดูข้อมูล</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">{filteredApplications.map((item) => <button key={item.id} type="button" onClick={() => void openApplication(item)} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-blue-50/40">
            <span className={"mt-2 size-2.5 shrink-0 rounded-full " + (item.is_read ? "bg-slate-200" : "bg-rose-500")}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-slate-700">{item.student_first_name} {item.student_last_name}</span><span className="mt-1 block text-xs text-slate-500">{item.applying_level} · อายุ {item.age} ปี</span><span className="mt-1 block text-xs text-slate-400">ผู้ปกครอง {item.parent_first_name} · {item.phone}</span><span className={"mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset " + statusStyle[item.status]}>{statusLabel[item.status]}</span></span><Eye size={16} className="mt-1 shrink-0 text-slate-400"/>
          </button>)}</div>
        </>}
      </section>

      {selected && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="application-detail-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6"><div><h2 id="application-detail-title" className="font-extrabold text-shine-ink">รายละเอียดใบสมัคร</h2><p className="mt-1 text-xs text-slate-400">สมัครเมื่อ {dateFormatter.format(new Date(selected.created_at))}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="ปิดรายละเอียด" className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={18}/></button></header>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-4">{photoUrl ? <img src={photoUrl} alt={"รูปของ " + selected.student_first_name} className="size-20 rounded-2xl object-cover"/> : <span className="grid size-20 place-items-center rounded-2xl bg-amber-50 text-amber-500"><UserRound size={30}/></span>}<div><h3 className="text-lg font-extrabold text-shine-ink">{selected.student_first_name} {selected.student_last_name}</h3><p className="mt-1 text-sm text-slate-500">อายุ {selected.age} ปี · {selected.applying_level}</p><p className="mt-1 text-xs text-slate-400">โรงเรียนเดิม: {selected.current_school || "ไม่ได้ระบุ"}</p></div></div>
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div><p className="text-xs text-slate-400">ชื่อผู้ปกครอง</p><p className="mt-1 text-sm font-bold text-slate-700">{selected.parent_first_name} {selected.parent_last_name}</p></div>
              <div><p className="text-xs text-slate-400">ความสัมพันธ์</p><p className="mt-1 text-sm font-bold text-slate-700">{selected.relationship}</p></div>
              <div><p className="text-xs text-slate-400">เบอร์โทรศัพท์</p><a href={"tel:" + selected.phone} className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-shine-navy"><Phone size={14}/>{selected.phone}</a></div>
              <div><p className="text-xs text-slate-400">อีเมล</p>{selected.email ? <a href={"mailto:" + selected.email} className="mt-1 inline-flex items-center gap-2 break-all text-sm font-bold text-shine-navy"><Mail size={14}/>{selected.email}</a> : <p className="mt-1 text-sm text-slate-500">ไม่ได้ระบุ</p>}</div>
            </div>
            <div><p className="text-xs font-bold text-slate-400">ข้อมูลเพิ่มเติม</p><p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-100 p-3 text-sm leading-6 text-slate-600">{selected.notes || "ไม่มีข้อมูลเพิ่มเติม"}</p></div>
            <div className="rounded-2xl border border-slate-200 p-4"><label htmlFor="application-status" className="text-sm font-extrabold text-slate-700">อัปเดตสถานะใบสมัคร</label><select id="application-status" value={selected.status} disabled={updating} onChange={(event) => void updateStatus(event.target.value as ApplicationStatus)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 disabled:opacity-60">{statusOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              {updating && <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400"><LoaderCircle size={14} className="animate-spin"/> กำลังบันทึก...</p>}
              {success && <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14}/>{success}</p>}
              {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            </div>
          </div>
          <footer className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6"><button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-shine-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900">ปิดหน้าต่าง</button></footer>
        </section>
      </div>}
    </div>
  );
}