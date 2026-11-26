import { SiteFonts } from "@/app/site-fonts";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteFonts>{children}</SiteFonts>;
}
