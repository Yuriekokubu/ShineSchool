import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FinanceOverview } from "@/components/finance/finance-overview";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "ภาพรวมการเงิน | ShineSchool" };

export default async function FinancePage() {
  await requireAdmin();
  return <DashboardShell><FinanceOverview /></DashboardShell>;
}
