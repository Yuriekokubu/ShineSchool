import { AdmissionManagement } from "@/components/admissions/admission-management";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "จัดการใบสมัคร | ShineSchool" };

export default async function ManageAdmissionsPage() {
  await requireAdmin();
  return <DashboardShell><AdmissionManagement /></DashboardShell>;
}
