"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, CalendarDays, ChevronDown, CircleHelp, FileText, GraduationCap,
  LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, Users, Wallet, X,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { AdmissionNotifications } from "@/components/dashboard/admission-notifications";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/dashboard/dashboard-shell.module.css";

const navigation = [
  { label: "ภาพรวม", href: "/admin", icon: LayoutDashboard },
  { label: "นักเรียน", href: "/students", icon: Users },
  { label: "จัดการใบสมัคร", href: "/admissions/manage", icon: FileText },
  { label: "ห้องเรียน", href: "#", icon: BookOpen },
  { label: "ตารางเรียน", href: "#", icon: CalendarDays },
  { label: "การเงิน", href: "/finance", icon: Wallet },
];

export function DashboardShell({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function loadStudentCount() {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Failed to load student count:", error);
        return;
      }

      if (mounted) setStudentCount(count ?? 0);
    }

    void loadStudentCount();

    const channel = supabase
      .channel("dashboard-student-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => { void loadStudentCount(); },
      )
      .subscribe();

    function handleWindowFocus() {
      void loadStudentCount();
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleWindowFocus);
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      window.alert("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={styles.layout}>
      {menuOpen && <button aria-label="ปิดเมนู" className={styles.backdrop} onClick={() => setMenuOpen(false)} />}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}><GraduationCap size={25} strokeWidth={2.4} /></div>
          <div><strong>Shine<span>School</span></strong><small>LEARN · GROW · SHINE</small></div>
          <button className={styles.closeMenu} aria-label="ปิดเมนู" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <div className={styles.schoolPicker}>
          <div className={styles.schoolAvatar}>S</div>
          <div className={styles.schoolText}><strong>Shine School</strong><small>ระบบจัดการโรงเรียน</small></div>
          <ChevronDown size={16} />
        </div>
        <p className={styles.navCaption}>เมนูหลัก</p>
        <nav className={styles.nav} aria-label="เมนูหลัก">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : href !== "#" && pathname.startsWith(href);
            const className = active ? styles.navActive : styles.navLink;
            if (href === "#") return <a key={label} href="#" onClick={(event) => event.preventDefault()} className={className}><Icon size={19}/><span>{label}</span></a>;
            return <Link key={label} href={href} onClick={() => setMenuOpen(false)} className={className} aria-current={active ? "page" : undefined}><Icon size={19}/><span>{label}</span>{label === "นักเรียน" && <span className={styles.navCount} aria-label={studentCount === null ? "กำลังโหลดจำนวนนักเรียน" : `นักเรียน ${studentCount} คน`}>{studentCount === null ? "…" : studentCount.toLocaleString("th-TH")}</span>}</Link>;
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <a href="#" className={styles.navLink} onClick={(event) => event.preventDefault()}><CircleHelp size={19} /><span>ศูนย์ช่วยเหลือ</span></a>
          <a href="#" className={styles.navLink} onClick={(event) => event.preventDefault()}><Settings size={19} /><span>ตั้งค่าระบบ</span></a>
          <div className={styles.profileMenuContainer}>
            <button
              type="button"
              className={styles.profile}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span className={styles.profileAvatar}>AD</span>
              <span className={styles.profileText}><strong>ผู้ดูแลระบบ</strong><small>School Administrator</small></span>
              <ChevronDown size={16} />
            </button>
            {profileMenuOpen && (
              <div className={styles.profileDropdown} role="menu">
                <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut}>
                  <LogOut size={17} />
                  <span>{loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuButton} aria-label="เปิดเมนู" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
          <button className={styles.collapseButton} type="button" aria-label={sidebarCollapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"} aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((current) => !current)}><span className={styles.collapseIcon}>{sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</span></button>
          <div className={styles.breadcrumb}>หน้าหลัก <span>/</span> <strong>{pathname.startsWith("/admissions/manage") ? "จัดการใบสมัคร" : pathname.startsWith("/finance") ? "การเงิน" : pathname === "/students" ? "นักเรียน" : "ภาพรวม"}</strong></div>
          <div className={styles.topActions}>
            <label className={styles.search}><Search size={17} /><input aria-label="ค้นหา" placeholder="ค้นหาข้อมูล..." /></label>
            <AdmissionNotifications />
            <div className={styles.topAvatar}>AD</div>
          </div>
        </header>

        <div className={styles.content}>{children ?? (<>

          <section className={styles.welcome}>
            <div>
              <div className={styles.eyebrow}>THURSDAY, 12 NOVEMBER 2026</div>
              <h1>สวัสดีครับ, ยินดีต้อนรับ! <span>✦</span></h1>
              <p>วันนี้มาเริ่มต้นวันดี ๆ และสร้างการเรียนรู้ที่สดใสไปด้วยกัน</p>
            </div>
            <div className={styles.welcomeArt} aria-hidden="true">
              <div className={styles.sun} />
              <div className={styles.book}><span /><span /></div>
              <div className={styles.sparkle}>✦</div>
            </div>
          </section>

          <div className={styles.sectionHeading}><div><h2>ภาพรวมโรงเรียน</h2><p>ข้อมูลสรุปสำหรับการบริหารจัดการ</p></div><button className={styles.dateButton}><CalendarDays size={16} /> ภาคเรียนที่ 2 / 2569 <ChevronDown size={15} /></button></div>

          <section className={styles.stats} aria-label="สถิติโรงเรียน">
            <StatCard label="นักเรียนทั้งหมด" value="248" unit="คน" note="ข้อมูลตัวอย่าง" icon="students" trend="+12 คน" />
            <StatCard label="คุณครูและบุคลากร" value="32" unit="คน" note="ข้อมูลตัวอย่าง" icon="teachers" trend="ประจำการ" />
            <StatCard label="ห้องเรียน" value="12" unit="ห้อง" note="ข้อมูลตัวอย่าง" icon="classes" trend="ครบทุกระดับ" />
            <StatCard label="การเข้าเรียนวันนี้" value="96.8" unit="%" note="ข้อมูลตัวอย่าง" icon="attendance" trend="+2.4%" />
          </section>

          <section className={styles.lowerGrid}>
            <ActivityPanel />
            <aside className={styles.quickPanel}>
              <div className={styles.panelHeading}><div><h3>ทางลัด</h3><p>เมนูที่ใช้งานบ่อย</p></div><span className={styles.quickIcon}>✦</span></div>
              <div className={styles.quickLinks}>
                <Link href="/students"><span className={styles.quickBlue}><Users size={19} /></span><span><strong>จัดการนักเรียน</strong><small>เพิ่มและแก้ไขข้อมูลนักเรียน</small></span><span className={styles.arrow}>↗</span></Link>
                <button><span className={styles.quickYellow}><BookOpen size={19} /></span><span><strong>จัดการห้องเรียน</strong><small>ดูแลชั้นเรียนและรายชื่อ</small></span><span className={styles.arrow}>↗</span></button>
                <button><span className={styles.quickMint}><CalendarDays size={19} /></span><span><strong>เช็กชื่อเข้าเรียน</strong><small>บันทึกการเข้าเรียนประจำวัน</small></span><span className={styles.arrow}>↗</span></button>
              </div>
              <div className={styles.tip}><span>💡</span><p><strong>เคล็ดลับประจำวัน</strong><br />เริ่มต้นวันด้วยรอยยิ้ม เพื่อส่งต่อพลังบวกให้กับนักเรียน</p></div>
            </aside>
          </section>
          <footer className={styles.footer}>© 2026 ShineSchool <span>พื้นที่แห่งการเรียนรู้และการเติบโต</span></footer>
        
        </>)}
        </div>
      </main>
    </div>
  );
}