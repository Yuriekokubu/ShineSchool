import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FinanceSettings } from "@/components/finance/finance-settings";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "ภาคเรียนและค่าเล่าเรียน | ShineSchool" };

export default async function FinanceSettingsPage() {
  await requireAdmin();
  return <DashboardShell><FinanceSettings /></DashboardShell>;
}
