"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { AddButton, CheckField, ItemCard, SelectField, TextField, grid2 } from "./fields";

const MAX_EVENTS = 5;
const newId = () => `acara-${Math.random().toString(36).slice(2, 8)}`;

function EventItem({ index }: { index: number }) {
  const { control } = useFormContext();
  const untilFinished = useWatch({ control, name: `events.${index}.untilFinished` });
  const p = (k: string) => `events.${index}.${k}`;
  return (
    <>
      <TextField name={p("name")} label="Nama acara" placeholder="Akad Nikah" maxLength={60} />
      <div className={grid2}>
        <TextField name={p("date")} label="Tanggal" type="date" />
        <SelectField
          name={p("timezone")}
          label="Zona waktu"
          options={[
            ["WIB", "WIB"],
            ["WITA", "WITA"],
            ["WIT", "WIT"],
          ]}
        />
        <TextField name={p("startTime")} label="Jam mulai" type="time" />
        {!untilFinished && <TextField name={p("endTime")} label="Jam selesai" type="time" />}
      </div>
      <CheckField name={p("untilFinished")} label='Jam selesai ditulis "selesai"' />
      <TextField
        name={p("venueName")}
        label="Nama tempat"
        placeholder="Gedung Serbaguna"
        maxLength={120}
      />
      <TextField name={p("address")} label="Alamat lengkap" rows={2} maxLength={400} />
      <div className={grid2}>
        <TextField name={p("city")} label="Kota" maxLength={80} />
        <TextField
          name={p("mapsUrl")}
          label="Link Google Maps"
          type="url"
          placeholder="https://maps.app.goo.gl/…"
        />
      </div>
    </>
  );
}

export function EventsForm({ defaultName }: { defaultName: string }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: "events" });
  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <ItemCard
          key={f.id}
          title={`Acara ${i + 1}`}
          onRemove={fields.length > 1 ? () => remove(i) : undefined}
          onUp={i > 0 ? () => move(i, i - 1) : undefined}
          onDown={i < fields.length - 1 ? () => move(i, i + 1) : undefined}
        >
          <EventItem index={i} />
        </ItemCard>
      ))}
      {fields.length < MAX_EVENTS && (
        <AddButton
          onClick={() =>
            append(
              { id: newId(), name: defaultName, date: "", timezone: "WIB" },
              { shouldFocus: false },
            )
          }
        >
          Tambah acara
        </AddButton>
      )}
    </div>
  );
}
