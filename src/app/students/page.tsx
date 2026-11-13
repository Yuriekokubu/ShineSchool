import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentManagement } from "@/components/students/student-management";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function StudentsPage() {
  await requireAdmin();

  return (
    <DashboardShell>
      <StudentManagement />
    </DashboardShell>
  );
}
