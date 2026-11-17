import { requireSuperUser } from "@/lib/auth/session";
import { BackOfficeDashboard } from "@/components/backoffice/BackOfficeDashboard";

export default async function BackOfficePage() {
  await requireSuperUser("/login?next=/backoffice");
  return <BackOfficeDashboard />;
}

