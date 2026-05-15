import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Recipe, Menus, RecipeCategory, MenuItem } from "../types";
import { defaultRecipeCategories } from "../data/sampleData";
import { ARCHIVE_DAYS, getDateKey } from "../utils/helpers";

/** Firestoreに書き込む前に undefined のフィールドを除去する */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Firestoreとmenus・recipes・categoriesをリアルタイム同期するHook
 *
 * setMenus / setRecipes / setCategories は React.Dispatch と同じシグネチャで
 * ローカル状態の即時更新 + Firestoreへの非同期書き込みを同時に行う。
 */
export function useFirestore(householdId: string | null) {
  const [menus, setMenusLocal] = useState<Menus>({});
  const [recipes, setRecipesLocal] = useState<Recipe[]>([]);
  const [categories, setCategoriesLocal] = useState<RecipeCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const cleanupDoneRef = useRef(false);

  // ─── Firestoreリスナー ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!householdId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    const base = `households/${householdId}`;

    const unsubMenus = onSnapshot(collection(db, `${base}/menus`), (snap) => {
      const data: Menus = {};
      snap.docs.forEach((d) => { data[d.id] = (d.data().items ?? []) as MenuItem[]; });
      setMenusLocal((prev) => {
        // Firestoreにまだ反映されていないローカル追加分を保持してマージ
        const merged: Menus = { ...data };
        Object.keys(prev).forEach((dateKey) => {
          if (!(dateKey in data)) merged[dateKey] = prev[dateKey];
        });
        return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
      });
    });

    const unsubRecipes = onSnapshot(collection(db, `${base}/recipes`), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe));
      setRecipesLocal((prev) => {
        // Firestoreにまだ反映されていないローカル追加分を保持してマージ
        const pending = prev.filter((p) => !data.find((d) => d.id === p.id));
        const merged = [...data, ...pending];
        return JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged;
      });
    });

    const unsubCategories = onSnapshot(collection(db, `${base}/categories`), async (snap) => {
      if (snap.empty) {
        await initDefaultCategories(householdId);
      } else {
        const data = snap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
        setCategoriesLocal((prev) =>
          JSON.stringify(prev) === JSON.stringify(data) ? prev : data
        );
        setLoadingData(false);
      }
    });

    return () => {
      unsubMenus(); unsubRecipes(); unsubCategories();
      cleanupDoneRef.current = false;
    };
  }, [householdId]);

  // ─── 献立専用レシピの自動削除（アーカイブ期間外になったら削除） ──────────────
  useEffect(() => {
    if (loadingData || cleanupDoneRef.current || !householdId) return;
    cleanupDoneRef.current = true;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const archiveCutoff = new Date(today);
    archiveCutoff.setDate(archiveCutoff.getDate() - ARCHIVE_DAYS);

    const staleRecipes = recipes.filter((r) => r.showInList === false);
    staleRecipes.forEach((recipe) => {
      // このレシピを参照しているメニュー日付をすべて取得
      const refDates = Object.entries(menus)
        .filter(([, items]) => items.some((item) => item.recipeId === recipe.id))
        .map(([dateKey]) => new Date(dateKey));

      // 参照が1件もない、または全参照がアーカイブ期間より古い場合は削除
      const allExpired =
        refDates.length === 0 ||
        refDates.every((d) => d < archiveCutoff);

      if (allExpired) {
        deleteDoc(doc(db, `households/${householdId}/recipes`, recipe.id)).catch(console.error);
        setRecipesLocal((prev) => prev.filter((r) => r.id !== recipe.id));
      }
    });
  }, [loadingData, householdId]);

  // ─── デフォルトカテゴリ初期書き込み ────────────────────────────────────────
  const initDefaultCategories = async (hid: string): Promise<void> => {
    const batch = writeBatch(db);
    defaultRecipeCategories.forEach((cat) => {
      batch.set(doc(db, `households/${hid}/categories`, cat.id), { name: cat.name });
    });
    await batch.commit();
  };

  // ─── Firestore書き込みヘルパー ──────────────────────────────────────────────
  const writeMenuDate = (hid: string, dateKey: string, items: MenuItem[]): void => {
    const ref = doc(db, `households/${hid}/menus`, dateKey);
    if (items.length === 0) {
      deleteDoc(ref).catch(console.error);
    } else {
      setDoc(ref, { items }).catch(console.error);
    }
  };

  // ─── setMenus（React.Dispatch互換） ─────────────────────────────────────────
  const setMenus = useCallback(
    (updater: React.SetStateAction<Menus>): void => {
      setMenusLocal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (householdId) {
          const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
          allKeys.forEach((dateKey) => {
            if (JSON.stringify(prev[dateKey]) !== JSON.stringify(next[dateKey])) {
              writeMenuDate(householdId, dateKey, next[dateKey] ?? []);
            }
          });
        }
        return next;
      });
    },
    [householdId]
  );

  // ─── setRecipes（React.Dispatch互換） ────────────────────────────────────────
  const setRecipes = useCallback(
    (updater: React.SetStateAction<Recipe[]>): void => {
      setRecipesLocal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (householdId) {
          // 追加・更新
          next.forEach((recipe) => {
            const old = prev.find((r) => r.id === recipe.id);
            if (!old || JSON.stringify(old) !== JSON.stringify(recipe)) {
              const { id, ...data } = recipe;
              setDoc(doc(db, `households/${householdId}/recipes`, id), stripUndefined(data)).catch(console.error);
            }
          });
          // 削除
          prev.forEach((recipe) => {
            if (!next.find((r) => r.id === recipe.id)) {
              deleteDoc(doc(db, `households/${householdId}/recipes`, recipe.id)).catch(console.error);
            }
          });
        }
        return next;
      });
    },
    [householdId]
  );

  // ─── setCategories（React.Dispatch互換） ─────────────────────────────────────
  const setCategories = useCallback(
    (updater: React.SetStateAction<RecipeCategory[]>): void => {
      setCategoriesLocal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (householdId) {
          const batch = writeBatch(db);
          // 削除されたカテゴリ
          prev.forEach((cat) => {
            if (!next.find((c) => c.id === cat.id)) {
              batch.delete(doc(db, `households/${householdId}/categories`, cat.id));
            }
          });
          // 追加・更新されたカテゴリ
          next.forEach((cat) => {
            const old = prev.find((c) => c.id === cat.id);
            if (!old || old.name !== cat.name) {
              batch.set(doc(db, `households/${householdId}/categories`, cat.id), { name: cat.name });
            }
          });
          batch.commit().catch(console.error);
        }
        return next;
      });
    },
    [householdId]
  );

  return {
    menus,
    recipes,
    categories,
    loadingData,
    setMenus,
    setRecipes,
    setCategories,
  };
}
