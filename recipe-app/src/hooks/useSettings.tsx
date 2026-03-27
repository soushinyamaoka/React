import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── 定数 ─────────────────────────────────────────────
const API_KEY_STORE = 'claude-api-key';
const API_MODE_STORE = 'api-mode';
const RECIPE_LIMIT_STORE = 'recipe-limit';

export const RECIPE_LIMIT_OPTIONS = [3, 5, 10, 20] as const;
export type RecipeLimit = typeof RECIPE_LIMIT_OPTIONS[number];

// ── 型定義 ──────────────────────────────────────────
export type ApiMode = 'claude' | 'other';

// ── Context ───────────────────────────────────────────
interface SettingsContextType {
  apiKey: string;
  apiKeyLoaded: boolean;
  setApiKeyAndSave: (key: string) => Promise<void>;
  apiMode: ApiMode;
  setApiModeAndSave: (mode: ApiMode) => Promise<void>;
  recipeLimit: RecipeLimit;
  setRecipeLimitAndSave: (limit: RecipeLimit) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [apiMode, setApiMode] = useState<ApiMode>('claude');
  const [recipeLimit, setRecipeLimit] = useState<RecipeLimit>(3);

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(API_KEY_STORE),
      AsyncStorage.getItem(API_MODE_STORE),
      AsyncStorage.getItem(RECIPE_LIMIT_STORE),
    ])
      .then(([key, mode, limit]) => {
        setApiKey(key ?? '');
        if (mode === 'claude' || mode === 'other') setApiMode(mode);
        const parsed = Number(limit);
        if (RECIPE_LIMIT_OPTIONS.includes(parsed as RecipeLimit)) setRecipeLimit(parsed as RecipeLimit);
      })
      .catch(() => {})
      .finally(() => setApiKeyLoaded(true));
  }, []);

  const setApiKeyAndSave = useCallback(async (key: string) => {
    setApiKey(key);
    await SecureStore.setItemAsync(API_KEY_STORE, key);
  }, []);

  const setApiModeAndSave = useCallback(async (mode: ApiMode) => {
    setApiMode(mode);
    await AsyncStorage.setItem(API_MODE_STORE, mode);
  }, []);

  const setRecipeLimitAndSave = useCallback(async (limit: RecipeLimit) => {
    setRecipeLimit(limit);
    await AsyncStorage.setItem(RECIPE_LIMIT_STORE, String(limit));
  }, []);

  return (
    <SettingsContext.Provider value={{ apiKey, apiKeyLoaded, setApiKeyAndSave, apiMode, setApiModeAndSave, recipeLimit, setRecipeLimitAndSave }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
