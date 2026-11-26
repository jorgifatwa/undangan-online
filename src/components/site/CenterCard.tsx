import { LogoMark } from "@/components/brand/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Kartu tengah layar di atas latar pasir (sambutan link khusus, status
 * pesanan, login). Gaya sama dengan form bertahap.
 */
export function CenterCard({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="bg-sand paper flex min-h-dvh items-center justify-center px-4 py-12">
      <Card
        className={cn(
          "w-full max-w-md rounded-[28px] py-8 text-center shadow-[0_30px_80px_-40px_rgb(80_40_20/0.35)]",
          className,
        )}
      >
        <CardHeader className="px-8">
          <LogoMark className="mx-auto size-12" />
          <span className="sr-only">{siteConfig.name}</span>
          <CardTitle className="font-heading mt-3 text-3xl leading-tight font-normal">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          )}
        </CardHeader>
        {children && (
          <CardContent className="text-muted-foreground space-y-4 px-8 text-sm leading-relaxed">
            {children}
          </CardContent>
        )}
      </Card>
    </main>
  );
}
