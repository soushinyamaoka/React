// ─── Constants ───
export const DAYS_AFTER = 14;
export const ARCHIVE_DAYS = 7;

// ─── Date Utilities ───
export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayLabel(date: Date): string | null {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "今日";
  if (diff === 1) return "明日";
  if (diff === -1) return "昨日";
  return null;
}

export function formatDate(date: Date): { month: number; day: number; weekday: string } {
  const w = ["日", "月", "火", "水", "木", "金", "土"];
  return { month: date.getMonth() + 1, day: date.getDate(), weekday: w[date.getDay()] };
}

export function genFutureDates(): Date[] {
  const d: Date[] = [], t = new Date(); t.setHours(0, 0, 0, 0);
  for (let i = 0; i <= DAYS_AFTER; i++) {
    const x = new Date(t); x.setDate(x.getDate() + i); d.push(x);
  }
  return d;
}

export function genArchiveDates(): Date[] {
  const d: Date[] = [], t = new Date(); t.setHours(0, 0, 0, 0);
  for (let i = 1; i <= ARCHIVE_DAYS; i++) {
    const x = new Date(t); x.setDate(x.getDate() - i); d.push(x);
  }
  return d;
}

// ─── Food Emoji ───
const foodEmojis = ["🍛", "🍖", "🥗", "🍲", "🐟", "🥘", "🍳", "🍜", "🥩", "🍙", "🍤", "🥬", "🫕", "🥮", "🍣"];
export function getEmoji(t: string): string {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = t.charCodeAt(i) + ((h << 5) - h);
  return foodEmojis[Math.abs(h) % foodEmojis.length];
}

// ─── ID Generator ───
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Data Cleanup ───
export function cleanOldMenus<T>(menus: Record<string, T[]>): Record<string, T[]> {
  const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - ARCHIVE_DAYS);
  const r: Record<string, T[]> = {};
  for (const [k, v] of Object.entries(menus)) {
    if (new Date(k + "T00:00:00") >= cutoff) r[k] = v;
  }
  return r;
}
