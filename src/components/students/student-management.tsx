"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import {
  Download, GraduationCap, ImagePlus, MoreHorizontal, Plus, Search,
  SlidersHorizontal, Users, UserCheck, UserRoundX, X,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import styles from "./student-management.module.css";

type StudentStatus = "กำลังศึกษา" | "พักการเรียน";
type Student = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  className: string;
  room: string;
  status: StudentStatus;
  photoUrl: string | null;
  photoPath: string | null;
};

type StudentForm = Omit<Student, "id">;

const classOptions = [
  "อนุบาล 1", "อนุบาล 2", "อนุบาล 3",
  "ประถมศึกษาปีที่ 1", "ประถมศึกษาปีที่ 2", "ประถมศึกษาปีที่ 3",
  "ประถมศึกษาปีที่ 4", "ประถมศึกษาปีที่ 5", "ประถมศึกษาปีที่ 6",
  "มัธยมศึกษาปีที่ 1", "มัธยมศึกษาปีที่ 2", "มัธยมศึกษาปีที่ 3",
];

const emptyForm: StudentForm = {
  code: "", firstName: "", lastName: "", className: "ประถมศึกษาปีที่ 1",
  room: "1/1", status: "กำลังศึกษา", photoUrl: null, photoPath: null,
};

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const refreshStudents = useCallback(async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_code, first_name, last_name, class_name, room, status, photo_path")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = await Promise.all((data ?? []).map(async (row) => {
      let photoUrl: string | null = null;
      if (row.photo_path) {
        const { data: signed } = await supabase.storage
          .from("student-photos")
          .createSignedUrl(row.photo_path, 60 * 60);
        photoUrl = signed?.signedUrl ?? null;
      }
      return {
        id: row.id as string,
        code: row.student_code as string,
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        className: row.class_name as string,
        room: (row.room as string | null) ?? "",
        status: row.status as StudentStatus,
        photoUrl,
        photoPath: (row.photo_path as string | null) ?? null,
      };
    }));

    setStudents(mapped);
  }, [supabase]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setPageError("");
        await refreshStudents();
      } catch (error) {
        console.error("Failed to load students:", error);
        if (mounted) setPageError(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลนักเรียนได้");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [refreshStudents]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const activeCount = students.filter((student) => student.status === "กำลังศึกษา").length;
  const pausedCount = students.length - activeCount;

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return students.filter((student) => {
      const matchesSearch = !keyword || [
        student.code, student.firstName, student.lastName,
        `${student.firstName} ${student.lastName}`,
      ].some((value) => value.toLocaleLowerCase().includes(keyword));
      const matchesClass = classFilter === "ทั้งหมด" || student.className === classFilter;
      const matchesStatus = statusFilter === "ทั้งหมด" || student.status === statusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, classFilter, statusFilter]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoError("");
    setModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingId(student.id);
    setForm({
      code: student.code,
      firstName: student.firstName,
      lastName: student.lastName,
      className: student.className,
      room: student.room,
      status: student.status,
      photoUrl: student.photoUrl,
      photoPath: student.photoPath,
    });
    setPhotoFile(null);
    setPhotoPreview(student.photoUrl);
    setPhotoError("");
    setModalOpen(true);
  }

  function handlePhotoFile(file?: File) {
    if (!file) return;
    setPhotoError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoPreview(reader.result);
        setForm((current) => ({ ...current, photoUrl: reader.result as string }));
      } else {
        setPhotoError("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้");
      }
    };
    reader.onerror = () => setPhotoError("เกิดข้อผิดพลาดขณะอ่านไฟล์รูปภาพ");
    reader.readAsDataURL(file);
  }

  function handlePhotoInputChange(event: ChangeEvent<HTMLInputElement>) {
    handlePhotoFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handlePhotoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingPhoto(false);
    handlePhotoFile(event.dataTransfer.files?.[0]);
  }

  function removePhoto() {
    setPhotoPreview(null);
    setForm((current) => ({ ...current, photoUrl: null, photoPath: null }));
    setPhotoFile(null);
    setPhotoError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const normalized = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      room: form.room.trim(),
    };
    if (!normalized.firstName || !normalized.lastName) return;

    setSaving(true);
    setPageError("");
    let uploadedPath: string | null = null;
    const previousPhotoPath = editingId
      ? students.find((student) => student.id === editingId)?.photoPath ?? null
      : null;

    try {
      let photoPath = normalized.photoPath;
      if (photoFile) {
        const extension = photoFile.type === "image/png" ? "png" : photoFile.type === "image/webp" ? "webp" : "jpg";
        uploadedPath = `${crypto.randomUUID()}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("student-photos")
          .upload(uploadedPath, photoFile, { contentType: photoFile.type, upsert: false });
        if (uploadError) throw uploadError;
        photoPath = uploadedPath;
      }

      const payload = {
        first_name: normalized.firstName,
        last_name: normalized.lastName,
        class_name: normalized.className,
        room: normalized.room || null,
        status: normalized.status,
        photo_path: photoPath,
      };

      const result = editingId
        ? await supabase.from("students").update(payload).eq("id", editingId)
        : await supabase.from("students").insert(payload);

      if (result.error) throw result.error;

      if (previousPhotoPath && previousPhotoPath !== photoPath) {
        await supabase.storage.from("student-photos").remove([previousPhotoPath]);
      }

      await refreshStudents();
      setModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Failed to save student:", error);
      if (uploadedPath) await supabase.storage.from("student-photos").remove([uploadedPath]);
      const message = error instanceof Error ? error.message : "บันทึกข้อมูลนักเรียนไม่สำเร็จ";
      setPageError(message.includes("students_student_code_key") || message.includes("duplicate key")
        ? "รหัสนักเรียนนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น"
        : message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setPageError("");

    const { error } = await supabase.from("students").delete().eq("id", deleteTarget.id);
    if (error) {
      console.error("Failed to delete student:", error);
      setPageError(error.message);
      return;
    }
    if (deleteTarget.photoPath) {
      await supabase.storage.from("student-photos").remove([deleteTarget.photoPath]);
    }
    setDeleteTarget(null);
    try {
      await refreshStudents();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "โหลดข้อมูลล่าสุดไม่สำเร็จ");
    }
  }

  function exportCsv() {
    const header = ["รหัสนักเรียน", "ชื่อ", "นามสกุล", "ระดับชั้น", "ห้อง", "สถานะ"];
    const rows = filteredStudents.map((student) => [
      student.code, student.firstName, student.lastName, student.className,
      student.room, student.status,
    ]);
    const csv = [header, ...rows].map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    ).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shineschool-students.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {pageError && <div role="alert" className={styles.photoError}>{pageError}</div>}
        <div className={styles.pageIntro}>
          <div>
            <div className={styles.eyebrow}>STUDENT DIRECTORY</div>
            <h1>จัดการนักเรียน <span>✦</span></h1>
            <p>จัดการข้อมูลประจำตัว ระดับชั้น และสถานะของนักเรียนในโรงเรียน</p>
          </div>
          <button className={styles.primaryButton} onClick={openCreateModal}><Plus size={18} /> เพิ่มนักเรียน</button>
        </div>

        <section className={styles.summary} aria-label="สรุปข้อมูลนักเรียน">
          <article className={styles.summaryCard}>
            <span className={styles.summaryIconBlue}><Users size={20} /></span>
            <div><p>นักเรียนทั้งหมด</p><strong>{students.length.toLocaleString("th-TH")} <small>คน</small></strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIconGreen}><UserCheck size={20} /></span>
            <div><p>กำลังศึกษา</p><strong>{activeCount.toLocaleString("th-TH")} <small>คน</small></strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIconYellow}><UserRoundX size={20} /></span>
            <div><p>พักการเรียน</p><strong>{pausedCount.toLocaleString("th-TH")} <small>คน</small></strong></div>
          </article>
        </section>

        <section className={styles.listPanel}>
          <div className={styles.listHeading}>
            <div><h2>รายชื่อนักเรียน</h2><p>พบ {filteredStudents.length.toLocaleString("th-TH")} รายการ</p></div>
            <button className={styles.exportButton} onClick={exportCsv}><Download size={16} /> ส่งออก CSV</button>
          </div>

          <div className={styles.filters}>
            <label className={styles.searchBox}><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสนักเรียน..." /></label>
            <label className={styles.selectWrap}><SlidersHorizontal size={16} /><select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="ทั้งหมด">ทุกระดับชั้น</option>{classOptions.map((className) => <option key={className} value={className}>{className}</option>)}</select></label>
            <select className={styles.statusSelect} aria-label="กรองตามสถานะ" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ทั้งหมด">ทุกสถานะ</option><option value="กำลังศึกษา">กำลังศึกษา</option><option value="พักการเรียน">พักการเรียน</option></select>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>นักเรียน</th><th>รหัสนักเรียน</th><th>ระดับชั้น</th><th>ห้อง</th><th>สถานะ</th><th><span className={styles.srOnly}>จัดการ</span></th></tr></thead>
              <tbody>
                {!loading && filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td><div className={styles.studentCell}><span className={`${styles.studentAvatar} ${styles[`avatar${(index % 5) + 1}`]}`}>{student.photoUrl ? <Image src={student.photoUrl} alt={`รูป${student.firstName} ${student.lastName}`} width={70} height={70} unoptimized /> : student.firstName.slice(0, 1)}</span><div><strong>{student.firstName} {student.lastName}</strong><small>นักเรียน</small></div></div></td>
                    <td><span className={styles.studentCode}>{student.code}</span></td>
                    <td>{student.className}</td>
                    <td>{student.room}</td>
                    <td><span className={student.status === "กำลังศึกษา" ? styles.statusActive : styles.statusPaused}><i />{student.status}</span></td>
                    <td><div className={styles.rowActions}><button aria-label={`แก้ไข ${student.firstName}`} onClick={() => openEditModal(student)}>แก้ไข</button><button className={styles.moreButton} aria-label={`ลบ ${student.firstName}`} onClick={() => setDeleteTarget(student)}><MoreHorizontal size={18} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className={styles.emptyState}>กำลังโหลดข้อมูลนักเรียน...</div>}
            {!loading && filteredStudents.length === 0 && <div className={styles.emptyState}><GraduationCap size={30} /><strong>ไม่พบข้อมูลนักเรียน</strong><span>ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง</span></div>}
          </div>
          <div className={styles.tableFooter}>แสดง {filteredStudents.length} จาก {students.length} รายการ</div>
        </section>
        <footer className={styles.footer}>© 2026 ShineSchool <span>พื้นที่แห่งการเรียนรู้และการเติบโต</span></footer>
      </div>

      {modalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
            <div className={styles.modalHeading}><div><h2 id="student-modal-title">{editingId ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}</h2><p>กรอกข้อมูลพื้นฐานของนักเรียนให้ครบถ้วน</p></div><button className={styles.closeButton} onClick={() => setModalOpen(false)} aria-label="ปิด"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className={styles.studentForm}>
              <div className={styles.photoField}>
                <span className={styles.fieldLabel}>รูปถ่ายนักเรียน</span>
                <div
                  className={`${styles.photoDropzone} ${isDraggingPhoto ? styles.photoDropzoneActive : ""} ${photoPreview ? styles.photoDropzoneHasImage : ""}`}
                  onDragOver={(event) => { event.preventDefault(); setIsDraggingPhoto(true); }}
                  onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDraggingPhoto(false); }}
                  onDrop={handlePhotoDrop}
                >
                  {photoPreview ? (
                    <div className={styles.photoPreviewWrap}>
                      <Image className={styles.photoPreview} src={photoPreview} alt="ตัวอย่างรูปนักเรียน" width={208} height={240} unoptimized />
                      <div className={styles.photoPreviewActions}>
                        <button type="button" className={styles.photoActionButton} onClick={() => photoInputRef.current?.click()}>เปลี่ยนรูป</button>
                        <button type="button" className={styles.photoRemoveButton} onClick={removePhoto}>ลบรูป</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className={styles.photoChooseButton} onClick={() => photoInputRef.current?.click()}>
                      <span className={styles.photoUploadIcon}><ImagePlus size={23} /></span>
                      <strong>ลากรูปภาพมาวางที่นี่</strong>
                      <span>หรือคลิกเพื่อเลือกไฟล์จากอุปกรณ์</span>
                      <small>JPG, PNG หรือ WebP · ไม่เกิน 5 MB</small>
                    </button>
                  )}
                </div>
                <input ref={photoInputRef} className={styles.hiddenFileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoInputChange} />
                {photoError && <span className={styles.photoError} role="alert">{photoError}</span>}
              </div>
              {editingId ? (
                <label>รหัสนักเรียน<input value={form.code} readOnly aria-readonly="true" /></label>
              ) : (
                <div className={styles.photoField}>
                  <span className={styles.fieldLabel}>รหัสนักเรียน</span>
                  <div className={styles.studentCode}>ระบบจะกำหนดรหัสให้อัตโนมัติ เช่น sh00001, sh00002, sh00003...</div>
                </div>
              )}
              <div className={styles.formRow}><label>ชื่อ<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} placeholder="ชื่อจริง" /></label><label>นามสกุล<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} placeholder="นามสกุล" /></label></div>
              <div className={styles.formRow}><label>ระดับชั้น<select value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })}>{classOptions.map((className) => <option key={className}>{className}</option>)}</select></label><label>ห้อง<input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="เช่น 1/1" /></label></div>
              <label>สถานะ<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StudentStatus })}><option value="กำลังศึกษา">กำลังศึกษา</option><option value="พักการเรียน">พักการเรียน</option></select></label>
              <div className={styles.modalActions}><button type="button" className={styles.cancelButton} onClick={() => setModalOpen(false)}>ยกเลิก</button><button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มนักเรียน"}</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <span className={styles.deleteIcon}><UserRoundX size={23} /></span><h2 id="delete-title">ยืนยันการลบนักเรียน?</h2><p>ต้องการลบข้อมูลของ <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> ใช่หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className={styles.modalActions}><button className={styles.cancelButton} onClick={() => setDeleteTarget(null)}>ยกเลิก</button><button className={styles.deleteButton} onClick={confirmDelete}>ยืนยันการลบ</button></div>
          </section>
        </div>
      )}
    </div>
  );
}