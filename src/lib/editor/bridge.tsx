"use client";

import { createContext, useContext } from "react";

import type { HatPos } from "@/schemas/birthday";

/**
 * Jembatan pratinjau EDITOR → tema (hanya ada di iframe pratinjau editor;
 * halaman tamu & preview tema tidak menyediakannya → null). Tema memakainya
 * untuk interaksi khusus editor, mis. menggeser topi pesta.
 */
export type HatSection = "cover" | "hero";

export interface EditorBridge {
  /** Posisi topi baru (persen relatif foto) setelah digeser di pratinjau. */
  moveHat: (section: HatSection, pos: Omit<HatPos, "show" | "src">) => void;
}

const Ctx = createContext<EditorBridge | null>(null);
export const EditorBridgeProvider = Ctx.Provider;
export const useEditorBridge = () => useContext(Ctx);
