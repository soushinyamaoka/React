import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, WebRecipe } from '../types/recipe';
import { COOP_BASE_URL, COOP_DEFAULT_TOKEN } from '../config.local';

// ============================================================
// 設定
// ============================================================

const DEFAULT_BASE_URL = COOP_BASE_URL;
const DEFAULT_TOKEN = COOP_DEFAULT_TOKEN;
const STORAGE_KEY_COOP_SERVER = 'coop_api_server_url';
const STORAGE_KEY_COOP_TOKEN = 'coop_api_token';

// ============================================================
// 型定義
// ============================================================

export interface CoopIngredientItem {
  name: string;
  original_name: string;
  quantity: number;
  category?: string;
}

export interface CoopExcludedItem {
  name: string;
  reason: string;
}

export interface CoopIngredientsResponse {
  order_date: string | null;
  ingredients: CoopIngredientItem[];
  kits: CoopIngredientItem[];
  ready_to_eat: CoopIngredientItem[];
  baby_food: CoopIngredientItem[];
  seasonings: CoopIngredientItem[];
  excluded: CoopExcludedItem[];
}

export interface CoopSuggestResult {
  recipes: Recipe[];
  web_recipes?: WebRecipe[];
}

export interface MealPlanDay {
  day: number;
  label: string;
  recipe?: Recipe;
  web_recipe?: WebRecipe | null;
  used_ingredients?: string[];
  remaining_ingredients?: string[];
}

export interface MealPlanResponse {
  plan: MealPlanDay[];
  unused_ingredients: string[];
}

// ============================================================
// APIクライアント
// ============================================================

class CoopApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = DEFAULT_BASE_URL;
    this.token = DEFAULT_TOKEN;
  }

  async init(): Promise<void> {
    try {
      const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_COOP_SERVER);
      if (savedUrl) this.baseUrl = savedUrl;
      const savedToken = await AsyncStorage.getItem(STORAGE_KEY_COOP_TOKEN);
      if (savedToken) this.token = savedToken;
    } catch {
      // デフォルト値を使用
    }
  }

  private async _fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { detail?: string }).detail || `APIエラー: ${response.status}`);
      }

      return await response.json() as T;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Network request failed')) {
        throw new Error('サーバーに接続できません。ネットワーク設定を確認してください。');
      }
      throw error;
    }
  }

  // ============================================================
  // API メソッド
  // ============================================================

  async getIngredients(): Promise<CoopIngredientsResponse> {
    return this._fetch<CoopIngredientsResponse>('/api/coop/ingredients');
  }

  async suggestRecipes(
    ingredients: string[],
    options: { season?: string; genre?: string; servings?: number; mode?: string } = {},
  ): Promise<CoopSuggestResult> {
    return this._fetch<CoopSuggestResult>('/api/coop/suggest-recipes', {
      method: 'POST',
      body: JSON.stringify({
        ingredients,
        season: options.season || '',
        genre: options.genre || '',
        servings: options.servings || 2,
        mode: options.mode || 'both',
      }),
    });
  }

  async updateCategory(originalName: string, category: string): Promise<void> {
    await this._fetch('/api/coop/classify', {
      method: 'PUT',
      body: JSON.stringify({
        original_name: originalName,
        category,
      }),
    });
  }

  async generateMealPlan(
    ingredients: string[],
    options: { season?: string; servings?: number; simpleMode?: boolean } = {},
  ): Promise<MealPlanResponse> {
    return this._fetch<MealPlanResponse>('/api/coop/meal-plan', {
      method: 'POST',
      body: JSON.stringify({
        ingredients,
        season: options.season || '',
        servings: options.servings || 2,
        simple_mode: options.simpleMode ?? false,
      }),
    });
  }

  async fetchEmails(daysBack: number = 14): Promise<{ message: string; count: number }> {
    return this._fetch<{ message: string; count: number }>(`/api/coop/fetch?days_back=${daysBack}`, {
      method: 'POST',
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this._fetch<{ service?: string }>('/');
      return data?.service === 'COOP連携API';
    } catch {
      return false;
    }
  }
}

export const coopApi = new CoopApiClient();
