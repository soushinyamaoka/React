import { Season, SeasonInfo, Category, FamilySizeOption } from '../types/recipe';

// ── 季節 ──────────────────────────────────────────────
export const SEASONS: Record<Season, SeasonInfo> = {
  spring: { label: '春', emoji: '🌸', months: [3, 4, 5] },
  summer: { label: '夏', emoji: '🌻', months: [6, 7, 8] },
  autumn: { label: '秋', emoji: '🍂', months: [9, 10, 11] },
  winter: { label: '冬', emoji: '⛄', months: [12, 1, 2] },
};

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  for (const [key, val] of Object.entries(SEASONS)) {
    if (val.months.includes(month)) return key as Season;
  }
  return 'spring';
}

// ── ジャンル ──────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'japanese', label: '日本食', icon: '🥢' },
  { id: 'chinese',  label: '中華',   icon: '🥡' },
  { id: 'western',  label: '洋食',   icon: '🍝' },
  { id: 'korean',   label: '韓国料理', icon: '🫕' },
  { id: 'quick',    label: '時短',   icon: '⚡' },
  { id: 'healthy',  label: 'ヘルシー', icon: '🥗' },
];

// ── 人数 ─────────────────────────────────────────────
export const FAMILY_SIZES: FamilySizeOption[] = [
  { id: '1', label: '1人分' },
  { id: '2', label: '2人分' },
  { id: '3', label: '3人分' },
  { id: '4', label: '4人分' },
  { id: '5', label: '5人分以上' },
];

// ── ユーティリティ ────────────────────────────────────
export function generateRecipeId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'r' + Math.abs(hash).toString(36);
}
