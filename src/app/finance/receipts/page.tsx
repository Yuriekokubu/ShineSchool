import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReceiptManagement } from "@/components/finance/receipt-management";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "ใบเสร็จรับเงิน | ShineSchool" };

export default async function FinanceReceiptsPage() {
  await requireAdmin();
  return <DashboardShell><ReceiptManagement /></DashboardShell>;
}
