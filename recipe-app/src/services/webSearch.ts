import { WebRecipe, SeasonInfo } from '../types/recipe';
import { parseWebRecipes } from './parser';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

/**
 * Claude API + web_search ツールを使って実在するWebレシピを3件検索する
 */
export async function fetchWebRecipes(
  apiKey: string,
  seasonInfo: SeasonInfo,
  catLabels: string,
  freeText: string,
): Promise<WebRecipe[]> {
  const searchQuery = `${seasonInfo.label}の夕食レシピ ${catLabels} ${freeText}`.trim();

  const prompt = `「${searchQuery}」で検索して、おすすめの夕食レシピを3つ見つけてください。

以下の形式で正確に回答してください。各レシピは --- で区切ります。

例:
---
「鶏もも肉の照り焼き」
概要: 定番の照り焼きレシピ。甘辛いタレで白ご飯にぴったりです。
URL: https://example.com/recipe/12345
出典: クックパッド
---

上記はあくまで形式の例です。実際にWeb検索で見つけた実在のレシピ3つを返してください。`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Web検索APIエラー (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.content || !Array.isArray(data.content)) {
    throw new Error('Web検索APIから予期しないレスポンスが返されました');
  }

  return parseWebRecipes(
    data.content
      .map((c: { type: string; text?: string }) => (c.type === 'text' ? (c.text ?? '') : ''))
      .join(''),
  );
}
