import { Recipe, WebRecipe } from '../types/recipe';

export function parseRecipes(text: string): Recipe[] {
  const recipes: Recipe[] = [];
  const blocks = text.split(/---/).filter((b) => b.trim());

  for (const block of blocks) {
    const nameMatch       = block.match(/「(.+?)」/);
    const timeMatch       = block.match(/⏱\s*(.+)/);
    const diffMatch       = block.match(/難易度[：:]\s*(.+)/);
    const calMatch        = block.match(/カロリー[：:]\s*(.+)/);
    const ingredientMatch = block.match(/材料[：:]([\s\S]*?)(?=作り方|手順|ポイント|コツ|$)/);
    const stepsMatch      = block.match(/(?:作り方|手順)[：:]([\s\S]*?)(?=ポイント|コツ|$)/);
    const tipsMatch       = block.match(/(?:ポイント|コツ)[：:]([\s\S]*?)$/);

    if (nameMatch) {
      recipes.push({
        name:       nameMatch[1],
        time:       timeMatch  ? timeMatch[1].trim()  : '約30分',
        difficulty: diffMatch  ? diffMatch[1].trim()  : '★★☆',
        calories:   calMatch   ? calMatch[1].trim()   : '',
        ingredients: ingredientMatch
          ? ingredientMatch[1].trim().split('\n').filter((l) => l.trim()).map((l) => l.replace(/^[-・•]\s*/, '').trim())
          : [],
        steps: stepsMatch
          ? stepsMatch[1].trim().split('\n').filter((l) => l.trim()).map((l) => l.replace(/^\d+[.)．]\s*/, '').trim())
          : [],
        tips: tipsMatch
          ? tipsMatch[1].trim().split('\n').filter((l) => l.trim()).map((l) => l.replace(/^[-・•]\s*/, '').trim())
          : [],
      });
    }
  }
  return recipes;
}

export function parseWebRecipes(text: string): WebRecipe[] {
  const recipes: WebRecipe[] = [];
  const blocks = text.split(/---/).filter((b) => b.trim());

  for (const block of blocks) {
    const nameMatch   = block.match(/「(.+?)」/);
    const urlMatch    = block.match(/URL[：:]\s*(https?:\/\/\S+)/);
    const sourceMatch = block.match(/出典[：:]\s*(.+)/);
    const descMatch   = block.match(/概要[：:]([\s\S]*?)(?=URL|出典|材料|$)/);

    if (nameMatch) {
      recipes.push({
        name:        nameMatch[1],
        url:         urlMatch    ? urlMatch[1].trim()    : null,
        source:      sourceMatch ? sourceMatch[1].trim() : 'Web',
        description: descMatch   ? descMatch[1].trim()   : '',
      });
    }
  }
  return recipes;
}
