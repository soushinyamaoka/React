import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { coopApi, CoopIngredientItem, CoopIngredientsResponse, MealPlanDay } from '../services/coopApi';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import RecipeCard from '../components/RecipeCard';
import { FONTS } from '../constants/fonts';
import { Recipe, WebRecipe } from '../types/recipe';
import { SEASONS, getCurrentSeason, FAMILY_SIZES } from '../constants';
import { useMealPlans, MyMealPlan, MyMealPlanDay } from '../hooks/useMealPlans';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import type { CoopStackParamList } from './CoopNavigator';

// ============================================================
// カテゴリ表示設定
// ============================================================

type CategoryKey = 'ingredients' | 'kits' | 'ready_to_eat' | 'baby_food' | 'seasonings';

interface CategoryConfig {
  title: string;
  selectable: boolean;
  color: string;
  borderColor: string;
}

const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  ingredients: {
    title: '🥩 食材（レシピに使える）',
    selectable: true,
    color: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  kits: {
    title: '🍱 調理キット',
    selectable: false,
    color: '#FFF3E0',
    borderColor: '#FF9800',
  },
  ready_to_eat: {
    title: '🍌 そのまま食べるもの',
    selectable: false,
    color: '#E3F2FD',
    borderColor: '#2196F3',
  },
  baby_food: {
    title: '👶 離乳食・幼児食',
    selectable: false,
    color: '#FCE4EC',
    borderColor: '#E91E63',
  },
  seasonings: {
    title: '🧂 調味料・日用品',
    selectable: false,
    color: '#F3E5F5',
    borderColor: '#9C27B0',
  },
};

type TabMode = 'ingredients' | 'results';

// ============================================================
// メインコンポーネント
// ============================================================

export default function CoopIngredientsScreen() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { apiMode } = useSettings();
  const { savePlan } = useMealPlans();
  const navigation = useNavigation<NativeStackNavigationProp<CoopStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CoopIngredientsResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);

  // タブ切り替え
  const [activeTab, setActiveTab] = useState<TabMode>('ingredients');

  // レシピ結果
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [webRecipes, setWebRecipes] = useState<WebRecipe[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 献立
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [unusedIngredients, setUnusedIngredients] = useState<string[]>([]);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [simpleMode, setSimpleMode] = useState(false);
  const [mealPlanViewMode, setMealPlanViewMode] = useState<'ai' | 'web'>('ai');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(['kits', 'ready_to_eat', 'baby_food', 'seasonings', 'excluded'])
  );

  // 別レシピ検索
  const [altSearchDay, setAltSearchDay] = useState<number | null>(null);
  const [altSearching, setAltSearching] = useState(false);
  const [altRecipes, setAltRecipes] = useState<Record<number, { ai: Recipe[]; web: WebRecipe[]; mode: 'ai' | 'web' }>>({});

  // 食材差し替え: dayNumber → { excluded: Set<除外index>, added: Set<食材名> }
  const [ingredientEdits, setIngredientEdits] = useState<Record<number, { excluded: Set<number>; added: Set<string> }>>({});

  const season = getCurrentSeason();
  const seasonInfo = SEASONS[season];

  // ============================================================
  // データ取得
  // ============================================================

  const fetchIngredients = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      await coopApi.init();
      const result = await coopApi.getIngredients();
      setData(result);

      // 食材カテゴリを初期状態で全選択
      const initialSelection = new Set(
        (result.ingredients || []).map((item) => item.name)
      );
      setSelectedItems(initialSelection);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // ============================================================
  // メール取得
  // ============================================================

  const handleFetchEmails = async () => {
    setFetching(true);
    try {
      await coopApi.init();
      const result = await coopApi.fetchEmails();
      Alert.alert('取得完了', result.message || 'メールを取得しました');
      // 食材リストを再読み込み
      await fetchIngredients();
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setFetching(false);
    }
  };

  // ============================================================
  // 選択操作
  // ============================================================

  const toggleItem = (name: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (!data?.ingredients) return;
    setSelectedItems(new Set(data.ingredients.map((item) => item.name)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // ============================================================
  // カテゴリ修正（長押し）
  // ============================================================

  const handleLongPress = (item: CoopIngredientItem) => {
    const categories = ['食材', '調理キット', 'そのまま', '離乳食', '調味料・日用品'];
    const options = categories.filter((c) => c !== item.category);

    Alert.alert(
      'カテゴリ変更',
      `「${item.name}」のカテゴリを変更しますか？\n現在: ${item.category ?? '不明'}`,
      [
        ...options.map((cat) => ({
          text: cat,
          onPress: async () => {
            try {
              await coopApi.updateCategory(item.original_name, cat);
              fetchIngredients();
              Alert.alert('変更完了', `${item.name} → ${cat}`);
            } catch (err: unknown) {
              Alert.alert('エラー', err instanceof Error ? err.message : String(err));
            }
          },
        })),
        { text: 'キャンセル', style: 'cancel' as const },
      ]
    );
  };

  // ============================================================
  // レシピ検索実行
  // ============================================================

  const handleSuggestRecipes = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('食材を選択', 'レシピに使う食材を1つ以上選んでください');
      return;
    }

    setSubmitting(true);
    setAiRecipes([]);
    setWebRecipes([]);
    setShowResults(false);
    setShowMealPlan(false);

    try {
      const ingredients = Array.from(selectedItems);
      const result = await coopApi.suggestRecipes(ingredients, {
        season: seasonInfo.label,
        servings: 2,
        mode: 'both',
      });

      setAiRecipes(result.recipes || []);
      setWebRecipes(result.web_recipes || []);
      setShowResults(true);
      setActiveTab('results');

      if ((result.recipes?.length ?? 0) === 0 && (result.web_recipes?.length ?? 0) === 0) {
        Alert.alert('結果なし', 'レシピが見つかりませんでした。食材の選択を変えてお試しください。');
      }
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // 1週間の献立作成
  // ============================================================

  const handleGenerateMealPlan = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('食材を選択', '献立に使う食材を1つ以上選んでください');
      return;
    }

    setGeneratingPlan(true);
    setMealPlan([]);
    setUnusedIngredients([]);
    setShowMealPlan(false);
    setShowResults(false);

    try {
      const ingredients = Array.from(selectedItems);
      const result = await coopApi.generateMealPlan(ingredients, {
        season: seasonInfo.label,
        servings: 2,
        simpleMode,
      });

      setMealPlan(result.plan || []);
      setUnusedIngredients(result.unused_ingredients || []);
      setShowMealPlan(true);
      setActiveTab('results');
      setIngredientEdits({});
      // 初期状態で1日目を開く
      setExpandedDays(new Set(result.plan?.length ? [result.plan[0].day] : []));

      if (!result.plan?.length) {
        Alert.alert('結果なし', '献立を作成できませんでした。食材の選択を変えてお試しください。');
      }
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingPlan(false);
    }
  };

  // ============================================================
  // 食材差し替え
  // ============================================================

  // 食材名から分量を除去（例: "鶏もも肉 200g" → "鶏もも肉"）
  const stripQty = (s: string) => s.replace(/\s*[\d.\/]+\s*(g|kg|ml|L|本|個|枚|切|玉|束|袋|パック).*$/i, '').trim();

  // ある食材が他のどの日で使われているかを調べる
  const findUsageInOtherDays = (ingredientName: string, currentDay: number) => {
    const name = stripQty(ingredientName);
    const usages: { day: number; label: string; recipeName: string }[] = [];
    for (const d of mealPlan) {
      if (d.day === currentDay) continue;
      const used = d.used_ingredients || [];
      if (used.some((u) => stripQty(u) === name)) {
        usages.push({
          day: d.day,
          label: d.label,
          recipeName: d.recipe?.name || d.web_recipe?.name || '---',
        });
      }
    }
    return usages;
  };

  // 追加できる食材リスト（remaining + unused から、既に使用中のものを除く）
  const getAvailableIngredients = (day: MealPlanDay) => {
    const remaining = day.remaining_ingredients || [];
    const all = [...remaining, ...unusedIngredients];
    // 重複排除（名前ベース）
    const seen = new Set<string>();
    return all.filter((item) => {
      const name = stripQty(item);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };

  const getEditState = (dayNum: number) => {
    return ingredientEdits[dayNum] || { excluded: new Set<number>(), added: new Set<string>() };
  };

  const toggleExcludeIngredient = (dayNum: number, idx: number) => {
    setIngredientEdits((prev) => {
      const state = prev[dayNum] || { excluded: new Set<number>(), added: new Set<string>() };
      const next = new Set(state.excluded);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return { ...prev, [dayNum]: { ...state, excluded: next } };
    });
  };

  const handleAddIngredient = (dayNum: number, ingredientName: string) => {
    const usages = findUsageInOtherDays(ingredientName, dayNum);
    if (usages.length > 0) {
      const usageText = usages.map((u) => `${u.label}（${u.recipeName}）`).join('\n');
      Alert.alert(
        '他の日で使用中',
        `「${stripQty(ingredientName)}」は以下の日で使用されています:\n\n${usageText}\n\n追加しますか？`,
        [
          { text: 'やめる', style: 'cancel' },
          {
            text: '追加する',
            onPress: () => doAddIngredient(dayNum, ingredientName),
          },
        ]
      );
    } else {
      doAddIngredient(dayNum, ingredientName);
    }
  };

  const doAddIngredient = (dayNum: number, ingredientName: string) => {
    setIngredientEdits((prev) => {
      const state = prev[dayNum] || { excluded: new Set<number>(), added: new Set<string>() };
      const next = new Set(state.added);
      next.add(ingredientName);
      return { ...prev, [dayNum]: { ...state, added: next } };
    });
  };

  const removeAddedIngredient = (dayNum: number, ingredientName: string) => {
    setIngredientEdits((prev) => {
      const state = prev[dayNum];
      if (!state) return prev;
      const next = new Set(state.added);
      next.delete(ingredientName);
      return { ...prev, [dayNum]: { ...state, added: next } };
    });
  };

  // 差し替え後の食材で再検索
  const handleReSearchWithEdits = async (day: MealPlanDay) => {
    const editState = getEditState(day.day);
    const original = (day.used_ingredients || []).filter((_, i) => !editState.excluded.has(i));
    const added = Array.from(editState.added);
    const allIngredients = [...original, ...added].map(stripQty);

    if (allIngredients.length === 0) {
      Alert.alert('食材がありません', '少なくとも1つの食材を選んでください');
      return;
    }

    setAltSearchDay(day.day);
    setAltSearching(true);

    try {
      const mode = mealPlanViewMode === 'ai' ? 'ai' : 'web';
      const result = await coopApi.suggestRecipes(allIngredients, {
        season: seasonInfo.label,
        servings: 2,
        mode,
      });

      setAltRecipes((prev) => ({
        ...prev,
        [day.day]: {
          ai: result.recipes || [],
          web: result.web_recipes || [],
          mode: mealPlanViewMode,
        },
      }));

      const count = mealPlanViewMode === 'ai'
        ? (result.recipes?.length ?? 0)
        : (result.web_recipes?.length ?? 0);
      if (count === 0) {
        Alert.alert('結果なし', '別のレシピが見つかりませんでした');
      }
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setAltSearching(false);
      setAltSearchDay(null);
    }
  };

  // 食材に変更があるか
  const hasIngredientEdits = (dayNum: number) => {
    const state = ingredientEdits[dayNum];
    if (!state) return false;
    return state.excluded.size > 0 || state.added.size > 0;
  };

  // ============================================================
  // 別レシピ検索（既存・同じ食材で検索）
  // ============================================================

  const handleAltSearch = async (day: MealPlanDay) => {
    const ingredients = day.used_ingredients;
    if (!ingredients || ingredients.length === 0) {
      Alert.alert('検索できません', 'この日の使用食材情報がありません');
      return;
    }

    setAltSearchDay(day.day);
    setAltSearching(true);

    try {
      // 食材名から分量を除去（例: "鶏もも肉 200g" → "鶏もも肉"）
      const names = ingredients.map((s) => s.replace(/\s*[\d.\/]+\s*(g|kg|ml|L|本|個|枚|切|玉|束|袋|パック).*$/i, '').trim());
      const freeText = names.join(' ');

      const mode = mealPlanViewMode === 'ai' ? 'ai' : 'web';
      const result = await coopApi.suggestRecipes(names, {
        season: seasonInfo.label,
        servings: 2,
        mode,
      });

      setAltRecipes((prev) => ({
        ...prev,
        [day.day]: {
          ai: result.recipes || [],
          web: result.web_recipes || [],
          mode: mealPlanViewMode,
        },
      }));

      const count = mealPlanViewMode === 'ai'
        ? (result.recipes?.length ?? 0)
        : (result.web_recipes?.length ?? 0);
      if (count === 0) {
        Alert.alert('結果なし', '別のレシピが見つかりませんでした');
      }
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setAltSearching(false);
      setAltSearchDay(null);
    }
  };

  // ============================================================
  // マイ献立に保存
  // ============================================================

  const handleSaveAsMyPlan = async () => {
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    const days: MyMealPlanDay[] = mealPlan.map((day) => ({
      day: day.day,
      label: day.label,
      recipe: day.recipe || null,
      webRecipe: day.web_recipe || null,
    }));

    const newPlan: MyMealPlan = {
      id,
      title: `献立 ${new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}`,
      createdAt: now,
      updatedAt: now,
      days,
    };

    await savePlan(newPlan);
    Alert.alert('保存しました', 'マイ献立に保存しました。編集画面に移動しますか？', [
      { text: 'あとで', style: 'cancel' },
      {
        text: '編集する',
        onPress: () => {
          const parent = navigation.getParent<NavigationProp<Record<string, object>>>();
          if (parent) {
            parent.navigate('MealPlan', { screen: 'MealPlanEdit', params: { planId: id } });
          }
        },
      },
    ]);
  };

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  // ============================================================
  // 結果があるかどうか
  // ============================================================

  const hasRecipeResults = showResults && (aiRecipes.length > 0 || webRecipes.length > 0);
  const hasMealPlanResults = showMealPlan && mealPlan.length > 0;
  const hasAnyResults = hasRecipeResults || hasMealPlanResults;

  // 結果タブのバッジ数
  const resultCount = hasMealPlanResults
    ? mealPlan.length
    : aiRecipes.length + webRecipes.length;

  // ============================================================
  // 描画: ローディング
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient colors={['#2E7D32', '#43A047', '#66BB6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerDecor}>🛒</Text>
          <Text style={styles.headerTitle}>COOPの注文から探す</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>食材リストを取得中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 描画: エラー
  // ============================================================

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient colors={['#2E7D32', '#43A047', '#66BB6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerDecor}>🛒</Text>
          <Text style={styles.headerTitle}>COOPの注文から探す</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchIngredients()}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 描画: 空
  // ============================================================

  if (!data || !data.ingredients?.length) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient colors={['#2E7D32', '#43A047', '#66BB6A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerDecor}>🛒</Text>
          <Text style={styles.headerTitle}>COOPの注文から探す</Text>
        </LinearGradient>
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={styles.emptyTitle}>注文データがありません</Text>
          <Text style={styles.emptySubtext}>
            COOPの注文確認メールが届いてから{'\n'}もう一度お試しください
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { marginTop: 20 }]}
            onPress={handleFetchEmails}
            disabled={fetching}
          >
            {fetching ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.retryButtonText, { marginLeft: 8 }]}>取得中...</Text>
              </View>
            ) : (
              <Text style={styles.retryButtonText}>注文メールを取得</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryButton, { marginTop: 12, backgroundColor: '#66BB6A' }]} onPress={() => fetchIngredients()}>
            <Text style={styles.retryButtonText}>更新</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 描画: メイン
  // ============================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ヘッダー */}
      <LinearGradient
        colors={['#2E7D32', '#43A047', '#66BB6A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerDecor}>🛒</Text>
        <Text style={styles.headerTitle}>COOPの注文から探す</Text>
        <Text style={styles.headerSub}>
          {data.order_date ? `注文日: ${data.order_date}` : `${seasonInfo.emoji} ${seasonInfo.label}の食材でレシピ提案`}
        </Text>
      </LinearGradient>

      {/* タブ切り替え */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
          onPress={() => setActiveTab('ingredients')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
            食材一覧
          </Text>
          <Text style={[styles.tabCount, activeTab === 'ingredients' && styles.tabCountActive]}>
            {selectedItems.size}/{data.ingredients?.length ?? 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
            {hasMealPlanResults ? '献立' : 'レシピ'}
          </Text>
          {hasAnyResults && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{resultCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ===== 食材タブ ===== */}
      {activeTab === 'ingredients' && (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchIngredients(true)} />
            }
          >
            {/* メール取得ボタン */}
            <View style={styles.fetchEmailSection}>
              <TouchableOpacity
                style={styles.fetchEmailButton}
                onPress={handleFetchEmails}
                disabled={fetching}
                activeOpacity={0.85}
              >
                {fetching ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.fetchEmailButtonText, { marginLeft: 8 }]}>取得中...</Text>
                  </View>
                ) : (
                  <Text style={styles.fetchEmailButtonText}>注文メールを取得</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 食材カテゴリ別表示 */}
            {(Object.entries(CATEGORY_CONFIG) as [CategoryKey, CategoryConfig][]).map(([key, config]) => {
              const items = data[key];
              if (!items || items.length === 0) return null;
              const isCollapsed = collapsedCategories.has(key);

              // 食材カテゴリ（selectable）はチップ形式
              if (config.selectable) {
                return (
                  <View key={key} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{config.title}</Text>
                      <View style={styles.selectButtons}>
                        <TouchableOpacity style={styles.selectButton} onPress={selectAll}>
                          <Text style={styles.selectButtonText}>全選択</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.selectButton} onPress={deselectAll}>
                          <Text style={styles.selectButtonText}>解除</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.chipWrap}>
                      {items.map((item, index) => (
                        <TouchableOpacity
                          key={`${key}-${index}`}
                          style={[
                            styles.chip,
                            selectedItems.has(item.name) ? styles.chipSelected : styles.chipUnselected,
                          ]}
                          onPress={() => toggleItem(item.name)}
                          onLongPress={() => handleLongPress(item)}
                          activeOpacity={0.6}
                        >
                          <Text style={[
                            styles.chipText,
                            selectedItems.has(item.name) && styles.chipTextSelected,
                          ]}>
                            {item.name}
                          </Text>
                          {item.quantity > 1 && (
                            <Text style={styles.chipQty}>×{item.quantity}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }

              // 他カテゴリは折りたたみ式
              return (
                <View key={key} style={styles.categorySection}>
                  <TouchableOpacity
                    style={styles.categoryHeaderCollapsible}
                    onPress={() => toggleCategory(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryTitle}>
                      {config.title}
                      <Text style={styles.categoryCount}> ({items.length})</Text>
                    </Text>
                    <Text style={styles.categoryChevron}>{isCollapsed ? '▼' : '▲'}</Text>
                  </TouchableOpacity>
                  {!isCollapsed && (
                    <View style={styles.chipWrap}>
                      {items.map((item, index) => (
                        <View
                          key={`${key}-${index}`}
                          style={[styles.chipReadonly, { backgroundColor: config.color, borderColor: config.borderColor }]}
                        >
                          <Text style={styles.chipReadonlyText}>{item.name}</Text>
                          {item.quantity > 1 && (
                            <Text style={styles.chipQty}>×{item.quantity}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* 除外された商品（折りたたみ） */}
            {data.excluded && data.excluded.length > 0 && (
              <View style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeaderCollapsible}
                  onPress={() => toggleCategory('excluded')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryTitle}>
                    ❌ 除外された商品
                    <Text style={styles.categoryCount}> ({data.excluded.length})</Text>
                  </Text>
                  <Text style={styles.categoryChevron}>
                    {collapsedCategories.has('excluded') ? '▼' : '▲'}
                  </Text>
                </TouchableOpacity>
                {!collapsedCategories.has('excluded') && data.excluded.map((item, index) => (
                  <View key={`excluded-${index}`} style={styles.excludedRow}>
                    <Text style={styles.excludedName}>{item.name}</Text>
                    <Text style={styles.excludedReason}>{item.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 下部の余白 */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* フッター: 食材タブ */}
          <View style={styles.footer}>
            <View style={styles.simpleModeRow}>
              <View style={styles.simpleModeInfo}>
                <Text style={styles.simpleModeLabel}>かんたんレシピ優先</Text>
                <Text style={styles.simpleModeHint}>ONにすると少し時間がかかります</Text>
              </View>
              <Switch
                value={simpleMode}
                onValueChange={setSimpleMode}
                trackColor={{ false: '#E0D5CC', true: '#A5D6A7' }}
                thumbColor={simpleMode ? '#2E7D32' : '#f4f3f4'}
              />
            </View>
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  styles.footerButtonHalf,
                  selectedItems.size === 0 && styles.searchButtonDisabled,
                ]}
                onPress={handleSuggestRecipes}
                disabled={submitting || generatingPlan || selectedItems.size === 0}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.searchButtonText, { marginLeft: 6, fontSize: 13 }]}>検索中...</Text>
                  </View>
                ) : (
                  <Text style={[styles.searchButtonText, { fontSize: 13 }]}>
                    レシピを探す{'\n'}({selectedItems.size}品)
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mealPlanButton,
                  styles.footerButtonHalf,
                  selectedItems.size === 0 && styles.searchButtonDisabled,
                ]}
                onPress={handleGenerateMealPlan}
                disabled={generatingPlan || submitting || selectedItems.size === 0}
                activeOpacity={0.85}
              >
                {generatingPlan ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.searchButtonText, { marginLeft: 6, fontSize: 13 }]}>作成中...</Text>
                  </View>
                ) : (
                  <Text style={[styles.searchButtonText, { fontSize: 13 }]}>
                    1週間の献立{'\n'}を作成
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ===== レシピ・献立タブ ===== */}
      {activeTab === 'results' && (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
          >
            {!hasAnyResults ? (
              <View style={styles.centerContainer}>
                <Text style={{ fontSize: 48 }}>🍽️</Text>
                <Text style={styles.emptyTitle}>まだ結果がありません</Text>
                <Text style={styles.emptySubtext}>
                  「食材一覧」タブで食材を選んで{'\n'}レシピ検索や献立作成をしてください
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { marginTop: 20 }]}
                  onPress={() => setActiveTab('ingredients')}
                >
                  <Text style={styles.retryButtonText}>食材を選ぶ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultsPadding}>
                {/* レシピ結果（レシピを探す） */}
                {hasRecipeResults && (
                  <>
                    <Text style={styles.resultsTitle}>おすすめレシピ</Text>

                    {aiRecipes.length > 0 && (
                      <View style={styles.resultGroup}>
                        <Text style={styles.resultGroupLabel}>AIレシピ</Text>
                        {aiRecipes.map((r, i) => (
                          <RecipeCard
                            key={`coop-ai-${i}`}
                            recipe={r as unknown as Record<string, unknown> & { name: string }}
                            index={i}
                            isWeb={false}
                            isFav={isFavorite(r)}
                            onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, false)}
                          />
                        ))}
                      </View>
                    )}

                    {webRecipes.length > 0 && (
                      <View style={styles.resultGroup}>
                        <Text style={styles.resultGroupLabel}>Web検索レシピ</Text>
                        {webRecipes.map((r, i) => (
                          <RecipeCard
                            key={`coop-web-${i}`}
                            recipe={r as unknown as Record<string, unknown> & { name: string }}
                            index={i + aiRecipes.length}
                            isWeb={true}
                            isFav={isFavorite(r)}
                            onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, true)}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}

                {/* 献立結果（表形式） */}
                {hasMealPlanResults && (
                  <>
                    <Text style={styles.resultsTitle}>献立表（{mealPlan.length}日分）</Text>

                    {/* AI / Web 切り替え */}
                    <View style={styles.viewModeToggle}>
                      <TouchableOpacity
                        style={[styles.viewModeBtn, mealPlanViewMode === 'ai' && styles.viewModeBtnActive]}
                        onPress={() => { setMealPlanViewMode('ai'); setSelectedDay(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.viewModeBtnText, mealPlanViewMode === 'ai' && styles.viewModeBtnTextActive]}>
                          AIレシピ
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.viewModeBtn, mealPlanViewMode === 'web' && styles.viewModeBtnActive]}
                        onPress={() => { setMealPlanViewMode('web'); setSelectedDay(null); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.viewModeBtnText, mealPlanViewMode === 'web' && styles.viewModeBtnTextActive]}>
                          Webレシピ
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 献立表 */}
                    <View style={styles.table}>
                      {/* ヘッダー行 */}
                      <View style={styles.tableHeaderRow}>
                        <View style={styles.tableDayCell}>
                          <Text style={styles.tableHeaderText}>日</Text>
                        </View>
                        <View style={styles.tableRecipeCell}>
                          <Text style={styles.tableHeaderText}>メニュー</Text>
                        </View>
                      </View>

                      {/* データ行 */}
                      {mealPlan.map((day) => {
                        const isReadyMeal = !day.web_recipe
                          && day.recipe?.steps?.length === 1
                          && day.recipe?.difficulty === '簡単';
                        const recipe = mealPlanViewMode === 'ai' ? day.recipe : day.web_recipe;
                        // ready_mealの場合はWebレシピがないのでAIを常に表示
                        const displayRecipe = isReadyMeal ? day.recipe : recipe;
                        const recipeName = displayRecipe?.name || '---';
                        const isSelected = selectedDay === day.day;
                        const hasRecipe = !!displayRecipe;

                        return (
                          <View key={`day-${day.day}`}>
                            <TouchableOpacity
                              style={[
                                styles.tableRow,
                                day.day % 2 === 0 && styles.tableRowEven,
                                isSelected && styles.tableRowSelected,
                                isReadyMeal && styles.tableRowReadyMeal,
                              ]}
                              onPress={() => hasRecipe && setSelectedDay(isSelected ? null : day.day)}
                              activeOpacity={hasRecipe ? 0.6 : 1}
                            >
                              <View style={styles.tableDayCell}>
                                <Text style={styles.tableDayText}>{day.label}</Text>
                              </View>
                              <View style={styles.tableRecipeCell}>
                                {isReadyMeal && (
                                  <View style={styles.readyMealBadge}>
                                    <Text style={styles.readyMealBadgeText}>簡単</Text>
                                  </View>
                                )}
                                <Text
                                  style={[
                                    styles.tableRecipeText,
                                    !hasRecipe && styles.tableRecipeEmpty,
                                    isReadyMeal && styles.tableRecipeReadyMeal,
                                  ]}
                                  numberOfLines={isSelected ? undefined : 1}
                                >
                                  {recipeName}
                                </Text>
                                {hasRecipe && (
                                  <Text style={styles.tableChevron}>{isSelected ? '▲' : '▼'}</Text>
                                )}
                              </View>
                            </TouchableOpacity>

                            {/* 詳細展開 */}
                            {isSelected && hasRecipe && (
                              <View style={styles.tableDetailCard}>
                                {isReadyMeal && (
                                  <View style={styles.readyMealNotice}>
                                    <Text style={styles.readyMealNoticeText}>
                                      調理キット・加工食品のため、パッケージの表示に従って調理してください
                                    </Text>
                                  </View>
                                )}
                                {!isReadyMeal && (
                                  <RecipeCard
                                    recipe={displayRecipe as unknown as Record<string, unknown> & { name: string }}
                                    index={0}
                                    isWeb={mealPlanViewMode === 'web'}
                                    isFav={isFavorite(displayRecipe!)}
                                    onToggleFav={() => toggleFavorite(
                                      displayRecipe as unknown as Record<string, unknown>,
                                      mealPlanViewMode === 'web'
                                    )}
                                  />
                                )}

                                {/* 食材差し替えエリア */}
                                {!isReadyMeal && day.used_ingredients && day.used_ingredients.length > 0 && (() => {
                                  const editState = getEditState(day.day);
                                  const available = getAvailableIngredients(day);
                                  // 追加済みは追加候補から除外
                                  const addableItems = available.filter((item) => !editState.added.has(item));
                                  const hasEdits = hasIngredientEdits(day.day);

                                  return (
                                    <View style={styles.ingredientEditArea}>
                                      {/* 使った食材（チップ・タップで除外） */}
                                      <Text style={styles.ingredientEditLabel}>使った食材（タップで除外）</Text>
                                      <View style={styles.ieChipWrap}>
                                        {day.used_ingredients!.map((item, i) => {
                                          const excluded = editState.excluded.has(i);
                                          return (
                                            <TouchableOpacity
                                              key={`used-${i}`}
                                              style={[styles.ieChip, excluded && styles.ieChipExcluded]}
                                              onPress={() => toggleExcludeIngredient(day.day, i)}
                                              activeOpacity={0.6}
                                            >
                                              <Text style={[styles.ieChipText, excluded && styles.ieChipTextExcluded]}>
                                                {stripQty(item)}
                                              </Text>
                                              {excluded && <Text style={styles.ieChipX}> ✕</Text>}
                                            </TouchableOpacity>
                                          );
                                        })}
                                        {/* 追加された食材 */}
                                        {Array.from(editState.added).map((item) => (
                                          <TouchableOpacity
                                            key={`added-${item}`}
                                            style={[styles.ieChip, styles.ieChipAdded]}
                                            onPress={() => removeAddedIngredient(day.day, item)}
                                            activeOpacity={0.6}
                                          >
                                            <Text style={styles.ieChipTextAdded}>{stripQty(item)}</Text>
                                            <Text style={styles.ieChipX}> ✕</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </View>

                                      {/* 追加できる食材 */}
                                      {addableItems.length > 0 && (
                                        <>
                                          <Text style={[styles.ingredientEditLabel, { marginTop: 10 }]}>
                                            追加できる食材
                                          </Text>
                                          <View style={styles.ieChipWrap}>
                                            {addableItems.map((item) => {
                                              const usages = findUsageInOtherDays(item, day.day);
                                              const isUsed = usages.length > 0;
                                              return (
                                                <TouchableOpacity
                                                  key={`avail-${item}`}
                                                  style={[styles.ieChipAdd, isUsed && styles.ieChipAddUsed]}
                                                  onPress={() => handleAddIngredient(day.day, item)}
                                                  activeOpacity={0.6}
                                                >
                                                  <Text style={styles.ieChipAddText}>+ {stripQty(item)}</Text>
                                                  {isUsed && <View style={styles.ieUsedDot} />}
                                                </TouchableOpacity>
                                              );
                                            })}
                                          </View>
                                        </>
                                      )}

                                      {/* 検索ボタン */}
                                      <View style={styles.ieSearchButtons}>
                                        {hasEdits && (
                                          <TouchableOpacity
                                            style={styles.ieReSearchButton}
                                            onPress={() => handleReSearchWithEdits(day)}
                                            disabled={altSearching}
                                            activeOpacity={0.7}
                                          >
                                            {altSearching && altSearchDay === day.day ? (
                                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <ActivityIndicator color="#fff" size="small" />
                                                <Text style={[styles.altSearchButtonText, { marginLeft: 6 }]}>検索中...</Text>
                                              </View>
                                            ) : (
                                              <Text style={styles.altSearchButtonText}>この食材で再検索</Text>
                                            )}
                                          </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                          style={[styles.altSearchButton, hasEdits && { flex: 1 }]}
                                          onPress={() => handleAltSearch(day)}
                                          disabled={altSearching}
                                          activeOpacity={0.7}
                                        >
                                          {altSearching && altSearchDay === day.day && !hasEdits ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                              <ActivityIndicator color="#fff" size="small" />
                                              <Text style={[styles.altSearchButtonText, { marginLeft: 6 }]}>検索中...</Text>
                                            </View>
                                          ) : (
                                            <Text style={styles.altSearchButtonText}>同じ食材で別のレシピを検索</Text>
                                          )}
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  );
                                })()}

                                {/* 別レシピ検索結果 */}
                                {altRecipes[day.day] && (
                                  <View style={styles.altResultsSection}>
                                    <Text style={styles.altResultsTitle}>
                                      別のレシピ候補（{altRecipes[day.day].mode === 'ai' ? 'AI' : 'Web'}）
                                    </Text>
                                    {altRecipes[day.day].mode === 'ai' && altRecipes[day.day].ai.map((r, i) => (
                                      <RecipeCard
                                        key={`alt-ai-${day.day}-${i}`}
                                        recipe={r as unknown as Record<string, unknown> & { name: string }}
                                        index={i}
                                        isWeb={false}
                                        isFav={isFavorite(r)}
                                        onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, false)}
                                      />
                                    ))}
                                    {altRecipes[day.day].mode === 'web' && altRecipes[day.day].web.map((r, i) => (
                                      <RecipeCard
                                        key={`alt-web-${day.day}-${i}`}
                                        recipe={r as unknown as Record<string, unknown> & { name: string }}
                                        index={i}
                                        isWeb={true}
                                        isFav={isFavorite(r)}
                                        onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, true)}
                                      />
                                    ))}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {unusedIngredients.length > 0 && (
                      <View style={styles.unusedSection}>
                        <Text style={styles.unusedTitle}>余った食材</Text>
                        <Text style={styles.unusedText}>{unusedIngredients.join('、')}</Text>
                      </View>
                    )}

                    {/* この献立をベースにする */}
                    <TouchableOpacity
                      style={styles.saveAsPlanButton}
                      onPress={handleSaveAsMyPlan}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveAsPlanButtonText}>この献立をベースにする</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* 下部の余白 */}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* フッター: 結果タブ */}
          <View style={styles.footerSimple}>
            <View style={styles.footerButtons}>
              {hasAnyResults && (
                <TouchableOpacity
                  style={[styles.backToIngredientsButton, styles.footerButtonHalf]}
                  onPress={() => setActiveTab('ingredients')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.backToIngredientsText}>食材を選び直す</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.myPlanButton, hasAnyResults && styles.footerButtonHalf]}
                onPress={() => {
                  const parent = navigation.getParent<NavigationProp<Record<string, object>>>();
                  if (parent) parent.navigate('MealPlan', { screen: 'MealPlanList' });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.myPlanButtonText}>マイ献立</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ============================================================
// スタイル
// ============================================================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ヘッダー
  header: { padding: 28, paddingTop: 24, paddingBottom: 20, overflow: 'hidden' },
  headerDecor: { fontSize: 100, position: 'absolute', right: -10, top: -10, opacity: 0.12 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6, fontFamily: FONTS.serifBold },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FONTS.sans },

  // タブバー
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    fontFamily: FONTS.sans,
  },
  tabTextActive: {
    color: '#2E7D32',
  },
  tabCount: {
    fontSize: 12,
    color: '#BCAAA4',
    fontFamily: FONTS.sans,
  },
  tabCountActive: {
    color: '#43A047',
  },
  tabBadge: {
    backgroundColor: '#E65100',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // 中央コンテナ
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontFamily: FONTS.sans },
  errorText: { marginTop: 16, fontSize: 16, color: '#C62828', textAlign: 'center', fontFamily: FONTS.sans },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#666', fontFamily: FONTS.sans },
  emptySubtext: { marginTop: 8, fontSize: 14, color: '#999', textAlign: 'center', fontFamily: FONTS.sans },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#43A047',
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans },

  // メール取得ボタン
  fetchEmailSection: { paddingHorizontal: 20, paddingTop: 16 },
  fetchEmailButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  fetchEmailButtonText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans },

  // カテゴリセクション
  categorySection: { marginTop: 14, paddingHorizontal: 20 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryHeaderCollapsible: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  categoryTitle: { fontSize: 14, fontWeight: '700', color: '#5D4037', fontFamily: FONTS.sans },
  categoryCount: { fontSize: 12, fontWeight: '400', color: '#999' },
  categoryChevron: { fontSize: 12, color: '#999' },

  // 全選択/解除ボタン
  selectButtons: { flexDirection: 'row', gap: 6 },
  selectButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0D5CC',
  },
  selectButtonText: { fontSize: 11, color: '#5D4037', fontFamily: FONTS.sans },

  // チップ（食材選択用）
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: '#C8E6C9',
    borderColor: '#4CAF50',
  },
  chipUnselected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  chipText: {
    fontSize: 13,
    color: '#999',
    fontFamily: FONTS.sans,
  },
  chipTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  chipQty: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
    fontFamily: FONTS.sans,
  },
  // チップ（読み取り専用）
  chipReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipReadonlyText: {
    fontSize: 12,
    color: '#555',
    fontFamily: FONTS.sans,
  },

  // 除外商品
  excludedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  excludedName: { fontSize: 13, color: '#999', textDecorationLine: 'line-through', fontFamily: FONTS.sans },
  excludedReason: { fontSize: 11, color: '#999', fontFamily: FONTS.sans },

  // レシピ結果
  resultsPadding: { padding: 20 },
  resultsTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12, fontFamily: FONTS.serifBold },
  resultGroup: { marginBottom: 20 },
  resultGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: FONTS.sans,
  },

  // AI/Web 切り替えトグル
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  viewModeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#81C784',
    fontFamily: FONTS.sans,
  },
  viewModeBtnTextActive: {
    color: '#2E7D32',
  },

  // 献立表
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.sans,
  },
  tableDayCell: {
    width: 64,
    justifyContent: 'center',
  },
  tableRecipeCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  tableDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    fontFamily: FONTS.sans,
  },
  tableRecipeText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: FONTS.sans,
  },
  tableRecipeEmpty: {
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  tableChevron: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  tableDetailCard: {
    padding: 12,
    backgroundColor: '#F5FBF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  // ready_meal
  tableRowReadyMeal: {
    backgroundColor: '#FFF8E1',
  },
  readyMealBadge: {
    backgroundColor: '#FFB300',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  readyMealBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.sans,
  },
  tableRecipeReadyMeal: {
    color: '#795548',
  },
  readyMealNotice: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
    marginBottom: 8,
  },
  readyMealNoticeText: {
    fontSize: 13,
    color: '#795548',
    fontFamily: FONTS.sans,
  },
  // 食材情報
  ingredientInfo: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  ingredientInfoRow: {
    marginBottom: 6,
  },
  ingredientInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#43A047',
    marginBottom: 2,
    fontFamily: FONTS.sans,
  },
  ingredientInfoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontFamily: FONTS.sans,
  },
  // 食材差し替えエリア
  ingredientEditArea: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  ingredientEditLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#43A047',
    marginBottom: 6,
    fontFamily: FONTS.sans,
  },
  ieChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ieChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ieChipExcluded: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
  },
  ieChipText: {
    fontSize: 12,
    color: '#2E7D32',
    fontFamily: FONTS.sans,
  },
  ieChipTextExcluded: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ieChipAdded: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  ieChipTextAdded: {
    fontSize: 12,
    color: '#1565C0',
    fontFamily: FONTS.sans,
  },
  ieChipX: {
    fontSize: 11,
    color: '#999',
  },
  ieChipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ieChipAddUsed: {
    borderColor: '#FFB300',
  },
  ieChipAddText: {
    fontSize: 12,
    color: '#666',
    fontFamily: FONTS.sans,
  },
  ieUsedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFB300',
    marginLeft: 5,
  },
  ieSearchButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  ieReSearchButton: {
    flex: 1,
    backgroundColor: '#43A047',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  // 別レシピ検索
  altSearchButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  altSearchButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.sans,
  },
  altResultsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  altResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
    fontFamily: FONTS.sans,
  },
  unusedSection: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  unusedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
    fontFamily: FONTS.sans,
  },
  unusedText: {
    fontSize: 13,
    color: '#795548',
    fontFamily: FONTS.sans,
  },

  // フッター（食材タブ）
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  simpleModeInfo: {
    flex: 1,
  },
  simpleModeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    fontFamily: FONTS.sans,
  },
  simpleModeHint: {
    fontSize: 11,
    color: '#BCAAA4',
    marginTop: 2,
    fontFamily: FONTS.sans,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButtonHalf: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#43A047',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPlanButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: { backgroundColor: '#BDBDBD' },
  searchButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans, textAlign: 'center' },

  // フッター（結果タブ）
  footerSimple: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  backToIngredientsButton: {
    backgroundColor: '#43A047',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  backToIngredientsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },
  myPlanButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  myPlanButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },
  // この献立をベースにする
  saveAsPlanButton: {
    marginTop: 16,
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveAsPlanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },
});
