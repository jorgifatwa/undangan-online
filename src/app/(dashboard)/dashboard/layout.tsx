import { requireUser } from "@/lib/auth-guard";

/**
 * Semua /dashboard/* wajib login. Header dashboard ada di (shell)/layout.tsx;
 * editor & pratinjau undangan berada di luar (shell) supaya tampil layar penuh.
 */
export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
