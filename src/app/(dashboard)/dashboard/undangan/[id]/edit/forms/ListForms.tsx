"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import { PhotoField } from "../media/PhotoField";
import { AddButton, ItemCard, TextField, grid2 } from "./fields";

export function LoveStoryForm() {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: "loveStory" });
  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <ItemCard
          key={f.id}
          title={`Cerita ${i + 1}`}
          onRemove={() => remove(i)}
          onUp={i > 0 ? () => move(i, i - 1) : undefined}
          onDown={i < fields.length - 1 ? () => move(i, i + 1) : undefined}
        >
          <div className={grid2}>
            <TextField
              name={`loveStory.${i}.date`}
              label="Waktu"
              placeholder="Maret 2022"
              maxLength={40}
            />
            <TextField
              name={`loveStory.${i}.title`}
              label="Judul"
              placeholder="Pertama bertemu"
              maxLength={80}
            />
          </div>
          <TextField name={`loveStory.${i}.text`} label="Cerita" rows={3} maxLength={800} />
          <PhotoField
            name={`loveStory.${i}.photo`}
            slot="loveStory"
            label="Foto (opsional)"
            aspect={4 / 5}
          />
        </ItemCard>
      ))}
      {fields.length < 12 && (
        <AddButton
          onClick={() => append({ date: "", title: "", text: "" }, { shouldFocus: false })}
        >
          Tambah cerita
        </AddButton>
      )}
    </div>
  );
}

export function GiftForm({ featureNote }: { featureNote?: string }) {
  const { control } = useFormContext();
  const accounts = useFieldArray({ control, name: "gift.accounts" });
  const contacts = useFieldArray({ control, name: "gift.confirmContacts" });
  return (
    <div className="space-y-4">
      {featureNote && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{featureNote}</p>
      )}
      <TextField
        name="gift.intro"
        label="Teks pengantar"
        rows={3}
        maxLength={600}
        hint="Kosongkan untuk memakai teks bawaan tema."
      />
      <PhotoField
        name="gift.qris"
        slot="qris"
        label="QRIS (opsional)"
        aspect={1}
        crop={false}
        hint="Gambar kode QRIS dari aplikasi bank/e-wallet."
      />
      <p className="text-sm font-medium">Rekening / e-wallet</p>
      {accounts.fields.map((f, i) => (
        <ItemCard key={f.id} title={`Rekening ${i + 1}`} onRemove={() => accounts.remove(i)}>
          <div className={grid2}>
            <TextField
              name={`gift.accounts.${i}.bank`}
              label="Bank / e-wallet"
              placeholder="BCA"
              maxLength={60}
            />
            <TextField
              name={`gift.accounts.${i}.number`}
              label="Nomor"
              inputMode="numeric"
              maxLength={40}
            />
          </div>
          <TextField name={`gift.accounts.${i}.holder`} label="Atas nama" maxLength={120} />
        </ItemCard>
      ))}
      {accounts.fields.length < 6 && (
        <AddButton
          onClick={() =>
            accounts.append({ bank: "", number: "", holder: "" }, { shouldFocus: false })
          }
        >
          Tambah rekening
        </AddButton>
      )}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Kirim hadiah fisik (opsional)</legend>
        <div className={grid2}>
          <TextField name="gift.physical.recipient" label="Penerima" maxLength={120} />
          <TextField
            name="gift.physical.phone"
            label="No. HP penerima"
            inputMode="tel"
            maxLength={20}
          />
        </div>
        <TextField
          name="gift.physical.address"
          label="Alamat pengiriman"
          rows={2}
          maxLength={400}
        />
      </fieldset>
      <p className="text-sm font-medium">Kontak konfirmasi (WhatsApp)</p>
      {contacts.fields.map((f, i) => (
        <ItemCard key={f.id} title={`Kontak ${i + 1}`} onRemove={() => contacts.remove(i)}>
          <div className={grid2}>
            <TextField name={`gift.confirmContacts.${i}.name`} label="Nama" maxLength={80} />
            <TextField
              name={`gift.confirmContacts.${i}.phone`}
              label="No. WhatsApp"
              inputMode="tel"
              maxLength={20}
            />
          </div>
        </ItemCard>
      ))}
      {contacts.fields.length < 4 && (
        <AddButton onClick={() => contacts.append({ name: "", phone: "" }, { shouldFocus: false })}>
          Tambah kontak
        </AddButton>
      )}
    </div>
  );
}

export function WishlistForm() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "wishlist" });
  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <ItemCard key={f.id} title={`Kado ${i + 1}`} onRemove={() => remove(i)}>
          <TextField name={`wishlist.${i}.name`} label="Nama barang" maxLength={100} />
          <div className={grid2}>
            <TextField
              name={`wishlist.${i}.url`}
              label="Link toko"
              type="url"
              placeholder="https://…"
            />
            <TextField name={`wishlist.${i}.note`} label="Catatan" maxLength={200} />
          </div>
        </ItemCard>
      ))}
      {fields.length < 20 && (
        <AddButton onClick={() => append({ name: "", url: "", note: "" }, { shouldFocus: false })}>
          Tambah kado
        </AddButton>
      )}
    </div>
  );
}
