import { ArrowUpRight, Clock3 } from "lucide-react";
import styles from "@/components/dashboard/activity-panel.module.css";

const activities = [
  { initials: "นภ", name: "น้องนภัสสร ใจดี", detail: "เข้าเรียน · ป.4/1", time: "08:12", status: "มาเรียน", tone: "green" },
  { initials: "ธน", name: "น้องธนกฤต แสงทอง", detail: "เข้าเรียน · ป.5/2", time: "08:09", status: "มาเรียน", tone: "green" },
  { initials: "พิม", name: "น้องพิมพ์ชนก สุขใจ", detail: "เข้าเรียน · ป.3/1", time: "08:02", status: "มาสาย", tone: "yellow" },
  { initials: "กฤ", name: "น้องกฤติน วัฒนะ", detail: "เข้าเรียน · ป.6/1", time: "07:58", status: "มาเรียน", tone: "green" },
];

export function ActivityPanel() {
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div><h3>กิจกรรมล่าสุด</h3><p>รายการเข้าเรียนของนักเรียนวันนี้</p></div>
        <button className={styles.viewAll}>ดูทั้งหมด <ArrowUpRight size={14} /></button>
      </div>
      <div className={styles.table}>
        <div className={styles.tableHead}><span>นักเรียน</span><span>เวลา</span><span>สถานะ</span></div>
        {activities.map((activity, index) => (
          <div className={styles.row} key={activity.initials}>
            <div className={styles.student}><span className={`${styles.avatar} ${index % 2 ? styles.avatarAlt : ""}`}>{activity.initials}</span><span><strong>{activity.name}</strong><small>{activity.detail}</small></span></div>
            <span className={styles.time}><Clock3 size={13} />{activity.time}</span>
            <span className={activity.tone === "green" ? styles.present : styles.late}>{activity.status}</span>
          </div>
        ))}
      </div>
      <p className={styles.disclaimer}>* ข้อมูลแสดงตัวอย่างสำหรับการออกแบบหน้าจอ</p>
    </section>
  );
}
