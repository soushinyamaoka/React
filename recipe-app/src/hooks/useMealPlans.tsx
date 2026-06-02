import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, WebRecipe } from '../types/recipe';

// ============================================================
// 型定義
// ============================================================

/** 1日内の個別レシピエントリ */
export interface MealEntry {
  id: string;               // エントリ固有ID
  recipe?: Recipe | null;
  webRecipe?: WebRecipe | null;
  memo?: string;
  isCustom?: boolean;
  customUrl?: string;
  customTitle?: string;
}

export interface MyMealPlanDay {
  day: number;
  label: string;
  date?: string;            // ISO日付文字列 (例: "2026-03-27")
  entries: MealEntry[];      // 複数レシピ
  // 後方互換: 旧データからの移行用（既存フィールド）
  recipe?: Recipe | null;
  webRecipe?: WebRecipe | null;
  memo?: string;
  isCustom?: boolean;
  customUrl?: string;
  customTitle?: string;
}

/** エントリIDを生成 */
export function generateEntryId(): string {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** 旧データ → entries に移行（entries が空で旧フィールドにデータがある場合） */
export function migrateDay(day: MyMealPlanDay): MyMealPlanDay {
  if (day.entries && day.entries.length > 0) return day;
  const hasOld = !!(day.recipe || day.webRecipe || day.memo || day.customUrl);
  if (!hasOld) return { ...day, entries: [] };
  return {
    ...day,
    entries: [{
      id: generateEntryId(),
      recipe: day.recipe,
      webRecipe: day.webRecipe,
      memo: day.memo,
      isCustom: day.isCustom,
      customUrl: day.customUrl,
      customTitle: day.customTitle,
    }],
  };
}

export interface MyMealPlan {
  id: string;
  title: string;
  startDate?: string;       // 開始日 ISO日付文字列
  createdAt: string;
  updatedAt: string;
  days: MyMealPlanDay[];
}

// 曜日ラベル
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 日付文字列から "3月27日(木)" 形式のラベルを生成 */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}月${day}日(${weekday})`;
}

/** 短縮形 "3/27(木)" */
export function formatDateLabelShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}/${day}(${weekday})`;
}

/** 開始日とインデックスから日付文字列を計算 */
export function calcDate(startDate: string, offsetDays: number): string {
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 日付付きのラベルを生成（dateがあれば日付表示、なければ従来の「X日目」） */
export function getDayLabel(day: MyMealPlanDay): string {
  if (day.date) {
    return formatDateLabel(day.date);
  }
  return day.label;
}

interface MealPlansContextValue {
  plans: MyMealPlan[];
  loading: boolean;
  savePlan: (plan: MyMealPlan) => Promise<void>;
  updatePlan: (plan: MyMealPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  clearAllPlans: () => Promise<void>;
  getPlan: (id: string) => MyMealPlan | undefined;
  addEntryToPlan: (planId: string, dayIndex: number, entry: Omit<MealEntry, 'id'>) => Promise<void>;
  addDay: (planId: string, date: string, entries: MealEntry[]) => Promise<void>;
}

// ============================================================
// ストレージキー
// ============================================================

const STORAGE_KEY = 'my_meal_plans';

// ============================================================
// Context
// ============================================================

const MealPlansContext = createContext<MealPlansContextValue | null>(null);

export function MealPlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<MyMealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // 読み込み
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: MyMealPlan[] = JSON.parse(raw);
          // 旧データのマイグレーション（startDateなしはcreatedAtから補完）
          const migrated = parsed.map((p) => {
            const startDate = p.startDate ?? p.createdAt.split('T')[0];
            return {
              ...p,
              startDate,
              days: p.days.map((d, i) => {
                const date = d.date ?? calcDate(startDate, i);
                return migrateDay({
                  ...d,
                  date,
                  label: formatDateLabel(date),
                });
              }),
            };
          });
          setPlans(migrated);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 永続化
  const persist = useCallback(async (updated: MyMealPlan[]) => {
    setPlans(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const savePlan = useCallback(async (plan: MyMealPlan) => {
    const updated = [plan, ...plans];
    await persist(updated);
  }, [plans, persist]);

  const updatePlan = useCallback(async (plan: MyMealPlan) => {
    const updated = plans.map((p) => (p.id === plan.id ? plan : p));
    await persist(updated);
  }, [plans, persist]);

  const deletePlan = useCallback(async (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    await persist(updated);
  }, [plans, persist]);

  const clearAllPlans = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const getPlan = useCallback((id: string) => {
    return plans.find((p) => p.id === id);
  }, [plans]);

  const addDay = useCallback(async (planId: string, date: string, entries: MealEntry[]) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const newDay: MyMealPlanDay = {
      day: plan.days.length + 1,
      label: formatDateLabel(date),
      date,
      entries,
    };
    const updatedPlan: MyMealPlan = {
      ...plan,
      days: [...plan.days, newDay],
      updatedAt: new Date().toISOString(),
    };
    await persist(plans.map((p) => (p.id === planId ? updatedPlan : p)));
  }, [plans, persist]);

  const addEntryToPlan = useCallback(async (planId: string, dayIndex: number, entry: Omit<MealEntry, 'id'>) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const newEntry: MealEntry = { ...entry, id: generateEntryId() };
    const updatedDays = plan.days.map((d, i) =>
      i === dayIndex ? { ...d, entries: [...d.entries, newEntry] } : d
    );
    const updatedPlan: MyMealPlan = { ...plan, days: updatedDays, updatedAt: new Date().toISOString() };
    await persist(plans.map((p) => (p.id === planId ? updatedPlan : p)));
  }, [plans, persist]);

  return (
    <MealPlansContext.Provider value={{ plans, loading, savePlan, updatePlan, deletePlan, clearAllPlans, getPlan, addEntryToPlan, addDay }}>
      {children}
    </MealPlansContext.Provider>
  );
}

export function useMealPlans() {
  const ctx = useContext(MealPlansContext);
  if (!ctx) throw new Error('useMealPlans must be used within MealPlansProvider');
  return ctx;
}
