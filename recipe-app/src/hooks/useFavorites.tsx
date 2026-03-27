import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteRecipe } from '../types/recipe';
import { generateRecipeId } from '../constants';

// ── ストレージ ────────────────────────────────────────
const FAVORITES_KEY = 'recipe-favorites-v1';

async function loadFromStorage(): Promise<FavoriteRecipe[]> {
  try {
    const value = await AsyncStorage.getItem(FAVORITES_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

async function saveToStorage(favorites: FavoriteRecipe[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

// ── Context ───────────────────────────────────────────
interface FavoritesContextType {
  favorites: FavoriteRecipe[];
  favLoaded: boolean;
  toggleFavorite: (recipe: Record<string, unknown>, isWeb: boolean) => void;
  isFavorite: (recipe: { name: string }) => boolean;
  clearAllFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [favLoaded, setFavLoaded] = useState(false);

  useEffect(() => {
    loadFromStorage().then((favs) => {
      setFavorites(favs);
      setFavLoaded(true);
    });
  }, []);

  const toggleFavorite = useCallback((recipe: Record<string, unknown>, isWeb: boolean) => {
    setFavorites((prev) => {
      const name = recipe.name as string;
      const id = generateRecipeId(name);
      const exists = prev.find((f) => f.id === id);
      let next: FavoriteRecipe[];

      if (exists) {
        next = prev.filter((f) => f.id !== id);
      } else {
        const savedAt = new Date().toLocaleDateString('ja-JP');
        next = [{ ...(recipe as unknown as FavoriteRecipe), id, isWeb, savedAt }, ...prev];
      }

      saveToStorage(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (recipe: { name: string }) => favorites.some((f) => f.id === generateRecipeId(recipe.name)),
    [favorites],
  );

  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    saveToStorage([]);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, favLoaded, toggleFavorite, isFavorite, clearAllFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
