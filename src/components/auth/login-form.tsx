"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      if (data.user?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        setErrorMessage("บัญชีนี้ยังไม่มีสิทธิ์ผู้ดูแลระบบ กรุณาติดต่อผู้ดูแล ShineSchool");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.backLink}><ArrowLeft size={16} /> กลับสู่หน้าเว็บไซต์</Link>
        <div className={styles.brandMark}><GraduationCap size={29} /></div>
        <p className={styles.eyebrow}>SHINESCHOOL ADMINISTRATION</p>
        <h1>ยินดีต้อนรับกลับ</h1>
        <p className={styles.description}>เข้าสู่ระบบเพื่อจัดการข้อมูล ShineSchool</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="email">อีเมล</label>
          <input id="email" type="email" autoComplete="username" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <div className={styles.passwordLabel}><label htmlFor="password">รหัสผ่าน</label></div>
          <div className={styles.passwordWrap}>
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="กรอกรหัสผ่าน" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
          <button className={styles.submit} type="submit" disabled={loading}>{loading ? "กำลังเข้าสู่ระบบ..." : <><LockKeyhole size={17} /> เข้าสู่ระบบ</>}</button>
        </form>
        <p className={styles.securityNote}>ระบบนี้สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น</p>
      </section>
    </main>
  );
}
