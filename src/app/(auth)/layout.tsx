import { SiteFonts } from "../site-fonts";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteFonts>{children}</SiteFonts>;
}
