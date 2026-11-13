import { BookOpen, GraduationCap, TrendingUp, Users, UserCheck } from "lucide-react";
import styles from "@/components/dashboard/stat-card.module.css";

type StatCardProps = {
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: "students" | "teachers" | "classes" | "attendance";
  trend: string;
};

const iconMap = {
  students: { Icon: Users, className: styles.blue },
  teachers: { Icon: GraduationCap, className: styles.yellow },
  classes: { Icon: BookOpen, className: styles.purple },
  attendance: { Icon: UserCheck, className: styles.green },
};

export function StatCard({ label, value, unit, note, icon, trend }: StatCardProps) {
  const { Icon, className } = iconMap[icon];

  return (
    <article className={styles.card}>
      <div className={styles.top}><span className={className}><Icon size={19} /></span><span className={styles.trend}><TrendingUp size={12} /> {trend}</span></div>
      <p className={styles.label}>{label}</p>
      <div className={styles.value}>{value}<span>{unit}</span></div>
      <p className={styles.note}>{note}</p>
    </article>
  );
}
