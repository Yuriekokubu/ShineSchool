import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Admin Dashboard | ShineSchool" };

export default async function AdminPage() {
  await requireAdmin();
  return <DashboardShell />;
}
