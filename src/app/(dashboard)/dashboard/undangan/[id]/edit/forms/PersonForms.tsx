"use client";

import { PhotoField } from "../media/PhotoField";
import { CheckField, SelectField, TextField, grid2 } from "./fields";

/** Mempelai (bride / groom). Foto diunggah di tahap 3c. */
function PersonFields({ prefix, who }: { prefix: "bride" | "groom"; who: string }) {
  const lead = prefix === "bride" ? "Putri" : "Putra";
  return (
    <fieldset className="space-y-3">
      <legend className="font-heading text-lg">{who}</legend>
      <PhotoField name={`${prefix}.photo`} slot={prefix} label="Foto" aspect={4 / 5} />
      <TextField name={`${prefix}.fullName`} label="Nama lengkap" maxLength={120} />
      <div className={grid2}>
        <TextField
          name={`${prefix}.nickname`}
          label="Nama panggilan"
          hint="Dipakai di cover"
          maxLength={40}
        />
        <TextField name={`${prefix}.instagram`} label="Instagram" hint="Tanpa @" maxLength={40} />
        <TextField
          name={`${prefix}.titlePrefix`}
          label="Gelar depan"
          placeholder="dr."
          maxLength={20}
        />
        <TextField
          name={`${prefix}.title`}
          label="Gelar belakang"
          placeholder="S.T."
          maxLength={40}
        />
      </div>
      <TextField
        name={`${prefix}.childOrder`}
        label="Anak ke-"
        placeholder={`${lead} pertama`}
        maxLength={60}
      />
      <div className={grid2}>
        <div className="space-y-1.5">
          <TextField name={`${prefix}.father.name`} label="Nama ayah" maxLength={120} />
          <CheckField name={`${prefix}.father.deceased`} label="Almarhum" />
        </div>
        <div className="space-y-1.5">
          <TextField name={`${prefix}.mother.name`} label="Nama ibu" maxLength={120} />
          <CheckField name={`${prefix}.mother.deceased`} label="Almarhumah" />
        </div>
      </div>
    </fieldset>
  );
}

export function CoupleForm() {
  return (
    <div className="space-y-6">
      <SelectField
        name="order"
        label="Urutan penulisan"
        options={[
          ["bride-first", "Mempelai wanita dulu"],
          ["groom-first", "Mempelai pria dulu"],
        ]}
      />
      <PersonFields prefix="bride" who="Mempelai wanita" />
      <PersonFields prefix="groom" who="Mempelai pria" />
    </div>
  );
}

export function CelebrantForm() {
  return (
    <div className="space-y-3">
      <TextField name="celebrant.name" label="Nama lengkap" maxLength={120} />
      <div className={grid2}>
        <TextField name="celebrant.nickname" label="Nama panggilan" maxLength={40} />
        <TextField
          name="celebrant.age"
          label="Ulang tahun ke-"
          type="number"
          inputMode="numeric"
          number
        />
      </div>
      <TextField
        name="partyTheme"
        label="Tema pesta"
        placeholder="Unicorn & Pelangi"
        maxLength={80}
      />
      <div className={grid2}>
        <div className="space-y-1.5">
          <TextField name="celebrant.father.name" label="Nama ayah" maxLength={120} />
          <CheckField name="celebrant.father.deceased" label="Almarhum" />
        </div>
        <div className="space-y-1.5">
          <TextField name="celebrant.mother.name" label="Nama ibu" maxLength={120} />
          <CheckField name="celebrant.mother.deceased" label="Almarhumah" />
        </div>
      </div>
    </div>
  );
}
