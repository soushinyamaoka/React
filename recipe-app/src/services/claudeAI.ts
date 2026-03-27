import { Recipe, SeasonInfo } from '../types/recipe';
import { parseRecipes } from './parser';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

/**
 * Claude APIを使ってAIオリジナルレシピを3件生成する
 */
export async function fetchAIRecipes(
  apiKey: string,
  seasonInfo: SeasonInfo,
  catLabels: string,
  sizeLabel: string,
  freeText: string,
): Promise<Recipe[]> {
  const prompt = `あなたは料理の献立提案の専門家です。以下の条件で今晩の夕食のレシピを3つ提案してください。

条件:
- 季節: ${seasonInfo.label}（旬の食材を活かして）
- ジャンル: ${catLabels || '指定なし（バランスよく）'}
- 人数: ${sizeLabel}
${freeText ? `- 追加の要望: ${freeText}` : ''}

以下の形式で正確に回答してください。各レシピは --- で区切ります。

例:
---
「鶏もも肉の照り焼き」
⏱ 20分
難易度: ★★☆
カロリー: 約350kcal
材料:
- 鶏もも肉 300g
- 醤油 大さじ2
- みりん 大さじ2
作り方:
1. 鶏もも肉を一口大に切る
2. 醤油・みりんで下味をつける
3. フライパンで中火で焼く
ポイント:
- 片栗粉をまぶすとジューシーに仕上がる
---

上記はあくまで形式の例です。条件に合った具体的で実用的なレシピ3つを提案してください。`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`AI APIエラー (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.content || !Array.isArray(data.content)) {
    throw new Error('AI APIから予期しないレスポンスが返されました');
  }

  return parseRecipes(
    data.content
      .map((c: { type: string; text?: string }) => (c.type === 'text' ? (c.text ?? '') : ''))
      .join(''),
  );
}
