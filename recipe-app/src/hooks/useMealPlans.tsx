import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, WebRecipe } from '../types/recipe';

// ============================================================
// 型定義
// ============================================================

export interface MyMealPlanDay {
  day: number;
  label: string;
  recipe?: Recipe | null;
  webRecipe?: WebRecipe | null;
  memo?: string;            // ユーザーの自由メモ
  isCustom?: boolean;       // ユーザーが手入力したレシピか
  customUrl?: string;       // ユーザーが貼り付けたレシピURL
  customTitle?: string;     // URL用の表示名
}

export interface MyMealPlan {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  days: MyMealPlanDay[];
}

interface MealPlansContextValue {
  plans: MyMealPlan[];
  loading: boolean;
  savePlan: (plan: MyMealPlan) => Promise<void>;
  updatePlan: (plan: MyMealPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getPlan: (id: string) => MyMealPlan | undefined;
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
        if (raw) setPlans(JSON.parse(raw));
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

  const getPlan = useCallback((id: string) => {
    return plans.find((p) => p.id === id);
  }, [plans]);

  return (
    <MealPlansContext.Provider value={{ plans, loading, savePlan, updatePlan, deletePlan, getPlan }}>
      {children}
    </MealPlansContext.Provider>
  );
}

export function useMealPlans() {
  const ctx = useContext(MealPlansContext);
  if (!ctx) throw new Error('useMealPlans must be used within MealPlansProvider');
  return ctx;
}
