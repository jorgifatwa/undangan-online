/**
 * Penyimpanan browser untuk pemesanan website (isian sebelum bayar & kunci
 * pesanan). Semua akses dibungkus try/catch (mode privat / penyimpanan penuh).
 */
export interface OrderDraft {
  v: 1;
  themeId: string;
  variantId: string | null;
  data: Record<string, unknown>;
  step: number;
  savedAt: number;
}

const draftKey = (eventType: string) => `undangku:pesan:${eventType}`;
const ORDERS_KEY = "undangku:pesanan";

export function readOrderDraft(eventType: string): OrderDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(draftKey(eventType)) ?? "null") as OrderDraft | null;
    return d && d.v === 1 && d.data && typeof d.themeId === "string" ? d : null;
  } catch {
    return null;
  }
}

export function writeOrderDraft(eventType: string, d: OrderDraft) {
  try {
    localStorage.setItem(draftKey(eventType), JSON.stringify(d));
  } catch {
    /* abaikan */
  }
}

export function clearOrderDraft(eventType: string) {
  try {
    localStorage.removeItem(draftKey(eventType));
  } catch {
    /* abaikan */
  }
}

/** Kunci halaman hasil per pesanan: { [orderId]: { key, eventType } }. */
type Saved = Record<string, { key: string; eventType: string; at: number }>;

export function rememberOrder(orderId: string, key: string, eventType: string) {
  try {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "{}") as Saved;
    all[orderId] = { key, eventType, at: Date.now() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  } catch {
    /* abaikan */
  }
}

export function orderKey(orderId: string): { key: string; eventType: string } | null {
  try {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "{}") as Saved;
    return all[orderId] ?? null;
  } catch {
    return null;
  }
}
