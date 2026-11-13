"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, FocusEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, CheckCircle2, FileImage, LoaderCircle, Trash2, UploadCloud } from "lucide-react";

type FormValues = {
  studentFirstName: string;
  studentLastName: string;
  age: string;
  applyingLevel: string;
  currentSchool: string;
  parentFirstName: string;
  parentLastName: string;
  relationship: string;
  phone: string;
  email: string;
  notes: string;
};

const initialValues: FormValues = {
  studentFirstName: "", studentLastName: "", age: "", applyingLevel: "",
  currentSchool: "", parentFirstName: "", parentLastName: "",
  relationship: "บิดา", phone: "", email: "", notes: "",
};

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-shine-ink outline-none transition placeholder:text-slate-400 focus:border-shine-navy focus:ring-4 focus:ring-blue-100";
const labelClass = "text-sm font-bold text-slate-700";

export function AdmissionForm() {
  const [values, setValues] = useState(initialValues);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type:"success"|"error"; text:string} | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const validateField = (field: keyof FormValues, value: string): string => {
    const trimmed = value.trim();
    if (["studentFirstName", "studentLastName", "age", "applyingLevel", "parentFirstName", "parentLastName", "phone"].includes(field) && !trimmed) {
      return "กรุณากรอกข้อมูลในช่องนี้";
    }
    if (field === "age" && (!/^\d+$/.test(trimmed) || Number(trimmed) < 1 || Number(trimmed) > 25)) {
      return "กรุณากรอกอายุเป็นตัวเลขระหว่าง 1–25 ปี";
    }
    if (field === "phone") {
      const normalized = trimmed.replace(/[\s()-]/g, "");
      if (!/^(0[0-9]{8,9}|\+?66[0-9]{8,9})$/.test(normalized)) {
        return "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 9–10 หลัก เช่น 0812345678";
      }
    }
    if (field === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    return "";
  };

  const validateAll = () => {
    const fields: (keyof FormValues)[] = ["studentFirstName", "studentLastName", "age", "applyingLevel", "parentFirstName", "parentLastName", "phone", "email"];
    const errors: Partial<Record<keyof FormValues, string>> = {};
    fields.forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) errors[field] = error;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) || undefined }));
    }
  };

  const inputClassFor = (field: keyof FormValues) =>
    `${inputClass} ${fieldErrors[field] ? "border-rose-500 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-100" : ""}`;

  const errorFor = (field: keyof FormValues) =>
    fieldErrors[field] ? <span id={`${field}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><span aria-hidden="true">!</span>{fieldErrors[field]}</span> : null;

  const fieldValidationProps = (field: keyof FormValues) => ({
    "aria-invalid": Boolean(fieldErrors[field]),
    "aria-describedby": fieldErrors[field] ? `${field}-error` : undefined,
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const error = validateField(field, event.target.value);
      setFieldErrors((current) => ({ ...current, [field]: error || undefined }));
    },
  });

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({type:"error", text:"กรุณาเลือกรูป JPG, PNG หรือ WebP เท่านั้น"});
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({type:"error", text:"รูปภาพต้องมีขนาดไม่เกิน 5 MB"});
      event.target.value = "";
      return;
    }
    setMessage(null);
    setPhoto(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!validateAll()) {
      setMessage({type:"error", text:"พบข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบช่องที่แสดงกรอบสีแดง"});
      return;
    }
    setSubmitting(true);

    try {
      const supabase = createClient();
      let photoPath: string | null = null;

      if (photo) {
        const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const uploadedPath = `applications/${crypto.randomUUID()}/student-photo.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("admission-photos")
          .upload(uploadedPath, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
        photoPath = uploadedPath;
      }

      const { error } = await supabase.from("admission_applications").insert({
        student_first_name: values.studentFirstName.trim(),
        student_last_name: values.studentLastName.trim(),
        age: Number(values.age),
        applying_level: values.applyingLevel,
        current_school: values.currentSchool.trim() || null,
        parent_first_name: values.parentFirstName.trim(),
        parent_last_name: values.parentLastName.trim(),
        relationship: values.relationship,
        phone: values.phone.trim(),
        email: values.email.trim() || null,
        notes: values.notes.trim() || null,
        student_photo_path: photoPath,
      });
      if (error) throw error;

      setValues(initialValues);
      setFieldErrors({});
      setPhoto(null);
      if (fileInput.current) fileInput.current.value = "";
      setMessage({type:"success", text:"ส่งใบสมัครเรียบร้อยแล้ว ทีมงาน ShineSchool จะติดต่อกลับตามเบอร์ที่แจ้งไว้"});
    } catch (error) {
      console.error("Admission submission failed:", error);
      setMessage({type:"error", text:"ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อโรงเรียนโดยตรง"});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_20px_60px_rgba(22,39,89,.08)] sm:p-8 lg:p-10">
      <div className="mb-8">
        <span className="text-xs font-extrabold tracking-[.18em] text-amber-600">STUDENT APPLICATION</span>
        <h2 className="mt-2 text-2xl font-extrabold text-shine-ink sm:text-3xl">แบบฟอร์มสมัครเรียน</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">กรอกข้อมูลนักเรียนและผู้ปกครองให้ครบถ้วน ทีมงานจะติดต่อกลับเพื่อดำเนินการในขั้นตอนถัดไป</p>
      </div>

      <section className="relative mb-8 pl-11 before:absolute before:left-[15px] before:top-10 before:-bottom-8 before:w-0.5 before:bg-gradient-to-b before:from-amber-300 before:to-slate-200">
        <h3 className="relative mb-4 flex min-h-8 items-center gap-3 font-extrabold text-shine-navy"><span className="absolute -left-11 z-10 grid size-8 place-items-center rounded-full border-[3px] border-white bg-shine-yellow text-xs font-extrabold text-shine-navy shadow-[0_0_0_2px_rgba(245,198,76,.35)]">01</span> ข้อมูลนักเรียน</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>ชื่อจริงนักเรียน <span className="text-rose-500">*</span>
            <input required maxLength={100} autoComplete="given-name" className={inputClassFor("studentFirstName")} {...fieldValidationProps("studentFirstName")} placeholder="ชื่อจริง" value={values.studentFirstName} onChange={e=>update("studentFirstName",e.target.value)} />
            {errorFor("studentFirstName")}
          </label>
          <label className={labelClass}>นามสกุลนักเรียน <span className="text-rose-500">*</span>
            <input required maxLength={100} autoComplete="family-name" className={inputClassFor("studentLastName")} {...fieldValidationProps("studentLastName")} placeholder="นามสกุล" value={values.studentLastName} onChange={e=>update("studentLastName",e.target.value)} />
            {errorFor("studentLastName")}
          </label>
          <label className={labelClass}>อายุ (ปี) <span className="text-rose-500">*</span>
            <input required type="number" min="1" max="25" step="1" className={inputClassFor("age")} {...fieldValidationProps("age")} placeholder="เช่น 7" value={values.age} onChange={e=>update("age",e.target.value)} />
            {errorFor("age")}
          </label>
          <label className={labelClass}>ระดับชั้นที่ต้องการสมัคร <span className="text-rose-500">*</span>
            <select required className={inputClassFor("applyingLevel")} {...fieldValidationProps("applyingLevel")} value={values.applyingLevel} onChange={e=>update("applyingLevel",e.target.value)}>
              <option value="">เลือกระดับชั้น</option>
              {["เตรียมอนุบาล","อนุบาล 1","อนุบาล 2","อนุบาล 3","ประถมศึกษาปีที่ 1","ประถมศึกษาปีที่ 2","ประถมศึกษาปีที่ 3","ประถมศึกษาปีที่ 4","ประถมศึกษาปีที่ 5","ประถมศึกษาปีที่ 6","มัธยมศึกษาปีที่ 1","มัธยมศึกษาปีที่ 2","มัธยมศึกษาปีที่ 3","มัธยมศึกษาปีที่ 4","มัธยมศึกษาปีที่ 5","มัธยมศึกษาปีที่ 6","ยังไม่แน่ใจ"].map(level=><option key={level} value={level}>{level}</option>)}
            </select>
            {errorFor("applyingLevel")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>ปัจจุบันศึกษาอยู่ที่โรงเรียน (ถ้ามี)
            <input maxLength={180} className={inputClass} placeholder="ชื่อโรงเรียนเดิม หรือสถานศึกษา" value={values.currentSchool} onChange={e=>update("currentSchool",e.target.value)} />
          </label>
        </div>
      </section>

      <section className="relative mb-8 border-t border-slate-100 pl-11 pt-7 before:absolute before:left-[15px] before:top-10 before:-bottom-8 before:w-0.5 before:bg-gradient-to-b before:from-amber-300 before:to-slate-200">
        <h3 className="relative mb-4 flex min-h-8 items-center gap-3 font-extrabold text-shine-navy"><span className="absolute -left-11 z-10 grid size-8 place-items-center rounded-full border-[3px] border-white bg-shine-yellow text-xs font-extrabold text-shine-navy shadow-[0_0_0_2px_rgba(245,198,76,.35)]">02</span> รูปถ่ายนักเรียน</h3>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="sr-only" id="student-photo" />
        <label htmlFor="student-photo" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center transition hover:border-shine-navy hover:bg-blue-50/50">
          {preview ? <img src={preview} alt="ตัวอย่างรูปนักเรียน" className="mb-4 size-32 rounded-2xl object-cover shadow-md" /> : <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-shine-yellow-soft text-shine-navy"><Camera size={27} /></span>}
          <span className="font-bold text-shine-navy">{preview ? "เปลี่ยนรูปภาพ" : "เพิ่มรูปถ่ายนักเรียน"}</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG หรือ WebP · ไม่เกิน 5 MB · ไม่บังคับ</span>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm"><UploadCloud size={15}/> เลือกรูปจากอุปกรณ์</span>
        </label>
        {photo && <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600"><span className="flex min-w-0 items-center gap-2"><FileImage size={16}/><span className="truncate">{photo.name}</span></span><button type="button" onClick={()=>{setPhoto(null);if(fileInput.current)fileInput.current.value="";}} className="ml-3 inline-flex shrink-0 items-center gap-1 font-bold text-rose-600"><Trash2 size={15}/> ลบรูป</button></div>}
      </section>

      <section className="relative mb-8 border-t border-slate-100 pl-11 pt-7">
        <h3 className="relative mb-4 flex min-h-8 items-center gap-3 font-extrabold text-shine-navy"><span className="absolute -left-11 z-10 grid size-8 place-items-center rounded-full border-[3px] border-white bg-shine-yellow text-xs font-extrabold text-shine-navy shadow-[0_0_0_2px_rgba(245,198,76,.35)]">03</span> ข้อมูลผู้ปกครอง</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>ชื่อจริงผู้ปกครอง <span className="text-rose-500">*</span>
            <input required maxLength={100} autoComplete="given-name" className={inputClassFor("parentFirstName")} {...fieldValidationProps("parentFirstName")} placeholder="ชื่อจริง" value={values.parentFirstName} onChange={e=>update("parentFirstName",e.target.value)} />
            {errorFor("parentFirstName")}
          </label>
          <label className={labelClass}>นามสกุลผู้ปกครอง <span className="text-rose-500">*</span>
            <input required maxLength={100} autoComplete="family-name" className={inputClassFor("parentLastName")} {...fieldValidationProps("parentLastName")} placeholder="นามสกุล" value={values.parentLastName} onChange={e=>update("parentLastName",e.target.value)} />
            {errorFor("parentLastName")}
          </label>
          <label className={labelClass}>ความสัมพันธ์กับนักเรียน
            <select className={inputClass} value={values.relationship} onChange={e=>update("relationship",e.target.value)}>
              <option>บิดา</option><option>มารดา</option><option>ผู้ปกครอง</option><option>ญาติ</option>
            </select>
          </label>
          <label className={labelClass}>เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
            <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} className={inputClassFor("phone")} {...fieldValidationProps("phone")} placeholder="081-234-5678" value={values.phone} onChange={e=>update("phone",e.target.value)} />
            {errorFor("phone")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>อีเมล (ถ้ามี)
            <input type="email" autoComplete="email" maxLength={180} className={inputClassFor("email")} {...fieldValidationProps("email")} placeholder="parent@example.com" value={values.email} onChange={e=>update("email",e.target.value)} />
            {errorFor("email")}
          </label>
          <label className={`${labelClass} sm:col-span-2`}>ข้อมูลเพิ่มเติม (ถ้ามี)
            <textarea rows={4} maxLength={1500} className={inputClass} placeholder="เช่น สิ่งที่อยากให้โรงเรียนทราบ หรือช่วงเวลาที่สะดวกให้ติดต่อกลับ" value={values.notes} onChange={e=>update("notes",e.target.value)} />
          </label>
        </div>
      </section>

      {message && <div role="status" className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-sm leading-6 ${message.type==="success"?"bg-emerald-50 text-emerald-800":"bg-rose-50 text-rose-700"}`}>{message.type==="success"?<CheckCircle2 size={20} className="mt-0.5 shrink-0"/>:null}{message.text}</div>}
      <p className="mb-5 text-xs leading-6 text-slate-400">ข้อมูลนี้ใช้เพื่อการติดต่อและดำเนินการสมัครเรียนเท่านั้น กรุณาตรวจสอบความถูกต้องก่อนส่งใบสมัคร</p>
      <button type="submit" disabled={submitting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-shine-navy px-7 font-bold text-white transition hover:bg-[#142657] disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <><LoaderCircle size={19} className="animate-spin"/> กำลังส่งใบสมัคร...</> : "ส่งใบสมัคร"}
      </button>
    </form>
  );
}