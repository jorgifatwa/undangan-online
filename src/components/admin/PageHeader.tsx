/** Judul halaman panel (admin & pembeli): judul serif, deskripsi, aksi di kanan. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-3xl tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
