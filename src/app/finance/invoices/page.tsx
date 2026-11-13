import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InvoiceManagement } from "@/components/finance/invoice-management";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "ใบแจ้งค่าเล่าเรียน | ShineSchool" };

export default async function FinanceInvoicesPage() {
  await requireAdmin();
  return <DashboardShell><InvoiceManagement /></DashboardShell>;
}
