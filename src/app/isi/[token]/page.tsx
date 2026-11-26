import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/auth";
import { CenterCard } from "@/components/site/CenterCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loadEditorProps } from "@/app/(dashboard)/dashboard/undangan/[id]/edit/editor-props";
import { findClaimByToken } from "@/lib/claims/service";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { themePrice } from "@/lib/pricing";
import { invitationUrl } from "@/lib/site";
import { getManifest } from "@/themes/registry";

import { ClaimEditor } from "./ClaimEditor";

export const metadata: Metadata = {
  title: "Isi undangan",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return <CenterCard title={title}>{children}</CenterCard>;
}

/**
 * LINK KHUSUS pembeli: /isi/{token}.
 *  - belum masuk sebagai pemilik → halaman sambutan + tombol (POST) yang membuat sesi
 *  - OPEN      → editor bertahap + konfirmasi
 *  - CONFIRMED → undangan sudah tayang (tautan ke undangan & akun)
 */
export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { state, claim } = await findClaimByToken(token);

  if (!claim)
    return (
      <Notice title="Link tidak ditemukan">
        <p>Periksa kembali link yang dikirim admin, atau hubungi admin untuk link baru.</p>
      </Notice>
    );
  if (state === "revoked")
    return (
      <Notice title="Link sudah tidak berlaku">
        <p>Link ini dicabut admin. Hubungi admin bila ada pertanyaan.</p>
      </Notice>
    );
  if (state === "expired")
    return (
      <Notice title="Link sudah kedaluwarsa">
        <p>
          Batas waktu pengisian berakhir {formatTanggal(claim.expiresAt)}. Hubungi admin bila masih
          ingin melanjutkan.
        </p>
      </Notice>
    );

  const inv = claim.invitation;
  const manifest = getManifest(inv.themeId);
  const session = await auth();
  const isOwner = session?.user?.role === "CUSTOMER" && session.user.id === inv.userId;

  if (!isOwner)
    return (
      <Notice
        title={state === "confirmed" ? "Undangan sudah tayang" : `Halo, ${claim.customerName}!`}
      >
        {state === "confirmed" ? (
          <p>
            Undangan ini sudah dikonfirmasi dan tayang di{" "}
            <a className="text-foreground underline" href={invitationUrl(inv.slug)}>
              {invitationUrl(inv.slug)}
            </a>
            .
          </p>
        ) : (
          <>
            <p>
              Terima kasih sudah memesan undangan tema{" "}
              <strong className="text-foreground">{manifest?.name ?? inv.themeId}</strong>. Isi data
              undangan langkah demi langkah sambil melihat pratinjaunya. Setiap pindah langkah,
              isian tersimpan otomatis — bisa dilanjutkan kapan saja lewat link ini.
            </p>
            <p>Link berlaku sampai {formatTanggal(claim.expiresAt)}.</p>
          </>
        )}
        {session?.user && (
          <Alert className="text-left">
            <AlertDescription>
              Kamu sedang masuk sebagai akun lain. Melanjutkan akan mengganti sesi di browser ini.
            </AlertDescription>
          </Alert>
        )}
        <form method="post" action={`/isi/${token}/masuk`} className="pt-2">
          <Button type="submit" size="lg" className="h-11 w-full">
            {state === "confirmed" ? "Kelola undangan" : "Mulai isi undangan"}
          </Button>
        </form>
      </Notice>
    );

  if (state === "confirmed")
    return (
      <Notice title="Undangan sudah tayang 🎉">
        <p>
          Undanganmu bisa dibuka di{" "}
          <a
            className="text-foreground font-medium underline"
            href={invitationUrl(inv.slug)}
            target="_blank"
            rel="noreferrer"
          >
            {invitationUrl(inv.slug)}
          </a>
        </p>
        <p>
          Tema sudah terkunci. Isi undangan masih bisa diubah
          {inv.activeUntil ? ` sampai ${formatTanggal(inv.activeUntil)}` : ""}, dan kamu bisa
          melihat ucapan, RSVP, serta mengirim undangan ke tamu.
        </p>
        <Button asChild size="lg" className="h-11 w-full">
          <Link href="/akun">Kelola undangan</Link>
        </Button>
      </Notice>
    );

  const props = await loadEditorProps(inv);
  if (!props)
    return (
      <Notice title="Data undangan tidak bisa dibaca">
        <p>Hubungi admin dengan menyertakan kode {claim.code}.</p>
      </Notice>
    );
  // ganti tema hanya ke tema berharga SAMA (dicek ulang di server)
  props.themes = props.themes.filter((t) => themePrice(t.id) === claim.price);
  props.title = `${props.title} · ${formatRupiah(claim.price)}`;
  return <ClaimEditor props={props} step={claim.step} expiresAt={claim.expiresAt.toISOString()} />;
}
