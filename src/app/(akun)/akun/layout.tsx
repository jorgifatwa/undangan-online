import { requireCustomer } from "@/lib/auth-guard";

/**
 * Area pembeli (role CUSTOMER). Header ada di (shell)/layout.tsx; editor &
 * pratinjau berada di luar (shell) supaya tampil layar penuh.
 */
export default async function AkunRootLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  return children;
}
