import { Recipe, WebRecipe } from '../types/recipe';
import { AI_BASE_URL, WEB_BASE_URL } from '../config.local';

/** Web検索APIのレスポンス型 */
export interface WebSearchResponse {
  recipes: WebRecipe[];
  total: number;
  offset: number;
  limit: number;
  simple_mode: boolean;
}

/**
 * カスタムAPIを使ってレシピを生成する
 */
export async function fetchCustomRecipes(
  season: string,
  category: string,
  servings: string,
  freeText: string,
  limit: number = 3,
): Promise<Recipe[]> {
  const response = await fetch(`${AI_BASE_URL}/api/recipes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      season: season || '',
      category: category || '',
      servings: servings || '',
      freeText: freeText || '',
      limit,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: `HTTPエラー (${response.status})` }));
    throw new Error(errBody.error || `APIエラー (${response.status})`);
  }

  const data = await response.json();
  if (!data.recipes || !Array.isArray(data.recipes)) {
    throw new Error('APIから予期しないレスポンスが返されました');
  }

  return data.recipes as Recipe[];
}

/**
 * カスタムAPIを使ってWebレシピを検索する
 */
export async function fetchCustomWebRecipes(
  season: string,
  category: string,
  freeText: string,
  limit: number = 3,
  offset: number = 0,
  simpleMode: boolean = false,
): Promise<WebSearchResponse> {
  const response = await fetch(`${WEB_BASE_URL}/api/recipes/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      season: season || '',
      category: category || '',
      freeText: freeText || '',
      limit,
      offset,
      simple_mode: simpleMode,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: `HTTPエラー (${response.status})` }));
    throw new Error(errBody.error || `Web検索APIエラー (${response.status})`);
  }

  const data = await response.json();
  if (!data.recipes || !Array.isArray(data.recipes)) {
    throw new Error('Web検索APIから予期しないレスポンスが返されました');
  }

  return data as WebSearchResponse;
}
