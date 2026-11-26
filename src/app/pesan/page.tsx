import { redirect } from "next/navigation";

/** /pesan → pilih tema dulu (coba tema → "Pesan tema ini"). */
export default function PesanIndex() {
  redirect("/tema");
}
