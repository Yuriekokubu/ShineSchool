"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, ChevronRight, LoaderCircle, Phone, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  student_first_name: string;
  student_last_name: string;
  age: number;
  applying_level: string;
  current_school: string | null;
  parent_first_name: string;
  parent_last_name: string;
  relationship: string;
  phone: string;
  email: string | null;
  notes: string | null;
  student_photo_path: string | null;
  status: string;
  is_read: boolean;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdmissionNotifications() {
  const [open, setOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newApplication, setNewApplication] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("admission_applications")
      .select("id,student_first_name,student_last_name,age,applying_level,current_school,parent_first_name,parent_last_name,relationship,phone,email,notes,student_photo_path,status,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (queryError) {
      console.error("Admission notification query failed:", {
        code: queryError.code,
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
      });
      setError(`${queryError.message}${queryError.code ? ` (รหัส ${queryError.code})` : ""}${queryError.hint ? ` — ${queryError.hint}` : ""}`);
    } else {
      setApplications((data ?? []) as Application[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApplications();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-admission-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "admission_applications",
      }, (payload) => {
        const incoming = payload.new as Application;
        setApplications((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 30));
        setNewApplication(true);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadApplications]);

  useEffect(() => {
    if (!selected?.student_photo_path) {
      setPhotoUrl(null);
      return;
    }

    let active = true;
    const supabase = createClient();
    void supabase.storage.from("admission-photos")
      .createSignedUrl(selected.student_photo_path, 60 * 10)
      .then(({ data }) => {
        if (active) setPhotoUrl(data?.signedUrl ?? null);
      });

    return () => { active = false; };
  }, [selected]);

  const openApplication = async (application: Application) => {
    setSelected(application);
    if (!application.is_read) {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("admission_applications")
        .update({ is_read: true })
        .eq("id", application.id);

      if (!updateError) {
        setApplications((current) => current.map((item) =>
          item.id === application.id ? { ...item, is_read: true } : item
        ));
      }
    }
  };

  const unreadCount = applications.filter((item) => !item.is_read).length;

  return (
    <div className="relative">
      {newApplication && !open && <button type="button" onClick={() => { setOpen(true); setNewApplication(false); }} className="fixed right-5 top-24 z-40 flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-left shadow-xl transition hover:-translate-y-0.5 sm:right-8"><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700"><Bell size={19}/></span><span><strong className="block text-sm text-shine-ink">มีใบสมัครใหม่เข้ามา</strong><small className="text-xs text-slate-500">กดเพื่อดูรายละเอียด</small></span></button>}
      <button
        type="button"
        aria-label={unreadCount ? `การแจ้งเตือน ใบสมัครใหม่ ${unreadCount} รายการ` : "การแจ้งเตือน"}
        aria-expanded={open}
        onClick={() => { setOpen((value) => !value); setNewApplication(false); setSelected(null); }}
        className="relative grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-shine-navy"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-extrabold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        {newApplication && <span className="absolute right-1 top-1 size-2 animate-ping rounded-full bg-rose-400" />}
      </button>

      {open && (
        <>
          <button aria-label="ปิดการแจ้งเตือน" className="fixed inset-0 z-40 cursor-default" onClick={() => { setOpen(false); setSelected(null); }} />
          <section className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,30,70,.2)]">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div><h2 className="font-extrabold text-shine-ink">ใบสมัครเรียน</h2><p className="mt-0.5 text-xs text-slate-500">{unreadCount} รายการที่ยังไม่ได้อ่าน</p></div>
              <button type="button" aria-label="ปิด" onClick={() => { setOpen(false); setSelected(null); }} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={17}/></button>
            </header>

            {selected ? (
              <div className="max-h-[min(70vh,620px)] overflow-y-auto p-4">
                <button type="button" onClick={() => setSelected(null)} className="mb-4 text-sm font-bold text-shine-navy hover:underline">← กลับไปยังรายการ</button>
                <div className="flex items-start gap-3">
                  {photoUrl ? <img src={photoUrl} alt="รูปนักเรียน" className="size-20 rounded-2xl object-cover"/> : <div className="grid size-20 place-items-center rounded-2xl bg-amber-50 text-amber-500"><UserRound size={30}/></div>}
                  <div className="min-w-0"><h3 className="font-extrabold text-shine-ink">{selected.student_first_name} {selected.student_last_name}</h3><p className="mt-1 text-sm text-slate-500">อายุ {selected.age} ปี · {selected.applying_level}</p><p className="mt-1 text-xs text-slate-400">{dateFormatter.format(new Date(selected.created_at))}</p></div>
                </div>
                <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                  <div><p className="text-xs text-slate-400">โรงเรียนเดิม</p><p className="mt-1 font-semibold text-slate-700">{selected.current_school || "ไม่ได้ระบุ"}</p></div>
                  <div><p className="text-xs text-slate-400">ผู้ปกครอง</p><p className="mt-1 font-semibold text-slate-700">{selected.parent_first_name} {selected.parent_last_name} ({selected.relationship})</p></div>
                  <div><p className="text-xs text-slate-400">เบอร์ติดต่อ</p><a href={`tel:${selected.phone}`} className="mt-1 inline-flex items-center gap-2 font-bold text-shine-navy"><Phone size={15}/>{selected.phone}</a></div>
                  {selected.email && <div><p className="text-xs text-slate-400">อีเมล</p><a href={`mailto:${selected.email}`} className="mt-1 break-all font-semibold text-shine-navy">{selected.email}</a></div>}
                  {selected.notes && <div><p className="text-xs text-slate-400">ข้อมูลเพิ่มเติม</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.notes}</p></div>}
                  <div><p className="text-xs text-slate-400">สถานะใบสมัคร</p><p className="mt-1 font-semibold text-slate-700">{selected.status === "pending" ? "รอติดต่อ" : selected.status}</p></div>
                </div>
              </div>
            ) : (
              <div className="max-h-[min(65vh,520px)] overflow-y-auto">
                {loading && applications.length === 0 ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin"/> กำลังโหลดใบสมัคร</div>
                : error ? <div className="p-5 text-sm leading-6 text-rose-600">{error}</div>
                : applications.length === 0 ? <div className="p-8 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Bell size={22}/></div><p className="mt-3 font-bold text-slate-600">ยังไม่มีใบสมัคร</p><p className="mt-1 text-xs text-slate-400">เมื่อมีผู้ปกครองสมัครเรียน รายการจะแสดงที่นี่</p></div>
                : applications.map((application) => (
                  <button key={application.id} type="button" onClick={() => void openApplication(application)} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-blue-50/60">
                    <span className={`mt-1 size-2.5 shrink-0 rounded-full ${application.is_read ? "bg-slate-200" : "bg-rose-500"}`}/>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-shine-ink">{application.student_first_name} {application.student_last_name}</span><span className="mt-1 block text-xs text-slate-500">สมัคร {application.applying_level} · ผู้ปกครอง {application.parent_first_name}</span><span className="mt-1 block text-[11px] text-slate-400">{dateFormatter.format(new Date(application.created_at))}</span></span>
                    <ChevronRight size={17} className="mt-2 shrink-0 text-slate-400"/>
                  </button>
                ))}
              </div>
            )}
            <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-[11px] text-slate-400">อัปเดตแบบเรียลไทม์</span>
              <button type="button" onClick={() => void loadApplications()} className="inline-flex items-center gap-1 text-xs font-bold text-shine-navy hover:underline"><Check size={14}/> รีเฟรชรายการ</button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}