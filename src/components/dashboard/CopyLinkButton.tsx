"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Salin link undangan; draf diberi catatan bahwa link baru aktif setelah terbit. */
export function CopyLinkButton({ url, draft }: { url: string; draft: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Salin link undangan:", url);
          return;
        }
        toast.success("Link disalin", {
          description: draft ? "Link baru bisa dibuka tamu setelah undangan diterbitkan." : url,
        });
      }}
    >
      Salin link
    </Button>
  );
}
