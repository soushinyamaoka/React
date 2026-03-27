export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonInfo {
  label: string;
  emoji: string;
  months: number[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface FamilySizeOption {
  id: string;
  label: string;
}

export interface Recipe {
  name: string;
  time: string;
  difficulty: string;
  calories: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
}

export interface WebRecipe {
  name: string;
  url: string | null;
  source: string;
  description: string;
}

export interface FavoriteRecipe {
  id: string;
  name: string;
  isWeb: boolean;
  savedAt: string;
  // AI recipe fields
  time?: string;
  difficulty?: string;
  calories?: string;
  ingredients?: string[];
  steps?: string[];
  tips?: string[];
  // Web recipe fields
  url?: string | null;
  source?: string;
  description?: string;
}
