import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PaymentHistory } from "@/components/finance/payment-history";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "ประวัติการชำระเงิน | ShineSchool" };

export default async function FinancePaymentsPage() {
  await requireAdmin();
  return <DashboardShell><PaymentHistory /></DashboardShell>;
}
