import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings, RECIPE_LIMIT_OPTIONS, RecipeLimit } from '../hooks/useSettings';
import RecipeCard from '../components/RecipeCard';
import CategorySelector from '../components/CategorySelector';
import FamilySizeSelector from '../components/FamilySizeSelector';
import { fetchAIRecipes } from '../services/claudeAI';
import { fetchWebRecipes } from '../services/webSearch';
import { fetchCustomRecipes, fetchCustomWebRecipes } from '../services/customAPI';
import { SEASONS, getCurrentSeason, FAMILY_SIZES } from '../constants';
import { FONTS } from '../constants/fonts';
import { Recipe, WebRecipe } from '../types/recipe';

type SourceTab = 'all' | 'ai' | 'web';

export default function HomeScreen() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { apiKey, apiMode, recipeLimit, setRecipeLimitAndSave } = useSettings();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [familySize, setFamilySize] = useState('2');
  const [freeText, setFreeText] = useState('');
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [webRecipes, setWebRecipes] = useState<WebRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeSource, setActiveSource] = useState<SourceTab>('all');
  const [error, setError] = useState<string | null>(null);
  const [webTotal, setWebTotal] = useState(0);
  const [webOffset, setWebOffset] = useState(0);
  const [simpleMode, setSimpleMode] = useState(false);

  const season = getCurrentSeason();
  const seasonInfo = SEASONS[season];

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length >= 3 ? prev : [...prev, id],
    );
  };

  const getCatLabels = () =>
    selectedCategories
      .map((id) => ({ japanese: '日本食', chinese: '中華', western: '洋食', korean: '韓国料理', quick: '時短', healthy: 'ヘルシー' }[id]))
      .filter(Boolean)
      .join('・');

  const handleSearch = async () => {
    if (apiMode === 'claude' && !apiKey) {
      Alert.alert('APIキー未設定', '「設定」タブからClaude APIキーを入力してください');
      return;
    }
    setLoading(true);
    setError(null);
    setAiRecipes([]);
    setWebRecipes([]);
    setActiveSource('all');
    setWebTotal(0);
    setWebOffset(0);

    const catLabels = getCatLabels();
    const sizeLabel = FAMILY_SIZES.find((s) => s.id === familySize)?.label ?? '2人分';

    try {
      if (apiMode === 'other') {
        const [ai, web] = await Promise.allSettled([
          fetchCustomRecipes(seasonInfo.label, catLabels, sizeLabel, freeText, recipeLimit),
          fetchCustomWebRecipes(seasonInfo.label, catLabels, freeText, recipeLimit, 0, simpleMode),
        ]);

        const aiResult = ai.status === 'fulfilled' ? ai.value : [];
        const webResult = web.status === 'fulfilled' ? web.value.recipes : [];
        setAiRecipes(aiResult);
        setWebRecipes(webResult);
        if (web.status === 'fulfilled') {
          setWebTotal(web.value.total ?? 0);
          setWebOffset((web.value.offset ?? 0) + web.value.recipes.length);
        }

        if (ai.status === 'rejected' && web.status === 'rejected') {
          setError(`レシピの取得に失敗しました。${(ai.reason as Error)?.message ?? ''}`);
        } else if (aiResult.length === 0 && webResult.length === 0) {
          setError('レシピが見つかりませんでした。条件を変えてもう一度お試しください。');
        }
      } else {
        const [ai, web] = await Promise.allSettled([
          fetchAIRecipes(apiKey, seasonInfo, catLabels, sizeLabel, freeText),
          fetchWebRecipes(apiKey, seasonInfo, catLabels, freeText),
        ]);

        const aiResult = ai.status === 'fulfilled' ? ai.value : [];
        const webResult = web.status === 'fulfilled' ? web.value : [];
        setAiRecipes(aiResult);
        setWebRecipes(webResult);

        if (ai.status === 'rejected' && web.status === 'rejected') {
          setError(`レシピの取得に失敗しました。${(ai.reason as Error)?.message ?? ''}`);
        } else if (aiResult.length === 0 && webResult.length === 0) {
          setError('レシピが見つかりませんでした。条件を変えてもう一度お試しください。');
        }
      }
    } catch (e: unknown) {
      setError('エラーが発生しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (apiMode !== 'other' || loadingMore) return;
    setLoadingMore(true);

    const catLabels = getCatLabels();

    try {
      const result = await fetchCustomWebRecipes(seasonInfo.label, catLabels, freeText, recipeLimit, webOffset, simpleMode);
      setWebRecipes((prev) => [...prev, ...result.recipes]);
      setWebTotal(result.total);
      setWebOffset(result.offset + result.recipes.length);
    } catch (e: unknown) {
      Alert.alert('エラー', e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const hasResults = aiRecipes.length > 0 || webRecipes.length > 0;
  const hasMoreWeb = apiMode === 'other' && webOffset < webTotal;

  const sourceTabs: { id: SourceTab; label: string }[] = [
    { id: 'all', label: `すべて (${aiRecipes.length + webRecipes.length})` },
    { id: 'ai', label: `🤖 AI (${aiRecipes.length})` },
    { id: 'web', label: `🌐 Web (${webRecipes.length}${webTotal > 0 ? `/${webTotal}` : ''})` },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ヘッダー */}
          <LinearGradient
            colors={['#BF360C', '#E65100', '#FF8F00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerDecor}>🍳</Text>
            <Text style={styles.headerTitle}>今晩なに食べる？</Text>
            <Text style={styles.headerSub}>
              {seasonInfo.emoji} {seasonInfo.label}の旬を活かした献立を{apiMode === 'claude' ? ' AI + Web から' : ' カスタムAPIで'}ご提案
            </Text>
            {apiMode === 'other' && (
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>🔗 カスタムAPIモード</Text>
              </View>
            )}
          </LinearGradient>

          {/* フォーム */}
          <View style={styles.form}>
            <CategorySelector
              selected={selectedCategories}
              onToggle={toggleCategory}
            />
            <FamilySizeSelector
              selected={familySize}
              onSelect={setFamilySize}
            />

            {/* 表示件数 */}
            {apiMode === 'other' && (
              <>
                <Text style={styles.label}>表示件数</Text>
                <View style={styles.limitRow}>
                  {RECIPE_LIMIT_OPTIONS.map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.limitChip, recipeLimit === n && styles.limitChipActive]}
                      onPress={() => setRecipeLimitAndSave(n)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.limitChipText, recipeLimit === n && styles.limitChipTextActive]}>
                        {n}件
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* かんたんレシピ優先 */}
            {apiMode === 'other' && (
              <View style={styles.simpleModeRow}>
                <View style={styles.simpleModeInfo}>
                  <Text style={styles.label}>かんたんレシピ優先</Text>
                  <Text style={styles.simpleModeHint}>ONにすると少し時間がかかります</Text>
                </View>
                <Switch
                  value={simpleMode}
                  onValueChange={setSimpleMode}
                  trackColor={{ false: '#E0D5CC', true: '#FFCC80' }}
                  thumbColor={simpleMode ? '#E65100' : '#f4f3f4'}
                />
              </View>
            )}

            {/* 自由テキスト */}
            <Text style={styles.label}>その他の要望（任意）</Text>
            <TextInput
              style={styles.textInput}
              value={freeText}
              onChangeText={setFreeText}
              placeholder="例: 冷蔵庫に鶏肉がある、子どもが食べられるもの..."
              placeholderTextColor="#BCAAA4"
            />

            {/* 検索ボタン */}
            <TouchableOpacity
              style={[styles.searchBtn, loading && styles.searchBtnLoading]}
              onPress={handleSearch}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.searchBtnInner}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={[styles.searchBtnText, { marginLeft: 8 }]}>
                    レシピを探しています...
                  </Text>
                </View>
              ) : (
                <Text style={styles.searchBtnText}>今日の献立を提案してもらう</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* エラー */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 検索結果 */}
          {hasResults && (
            <View style={styles.results}>
              {/* ソース切替タブ */}
              <View style={styles.sourceTabBar}>
                {sourceTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveSource(tab.id)}
                    style={[styles.sourceTab, activeSource === tab.id && styles.sourceTabActive]}
                  >
                    <Text
                      style={[
                        styles.sourceTabText,
                        activeSource === tab.id && styles.sourceTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeSource !== 'web' &&
                aiRecipes.map((r, i) => (
                  <RecipeCard
                    key={`ai-${i}`}
                    recipe={r as unknown as Record<string, unknown> & { name: string }}
                    index={i}
                    isWeb={false}
                    isFav={isFavorite(r)}
                    onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, false)}
                  />
                ))}

              {activeSource !== 'ai' &&
                webRecipes.map((r, i) => (
                  <RecipeCard
                    key={`web-${i}`}
                    recipe={r as unknown as Record<string, unknown> & { name: string }}
                    index={activeSource === 'all' ? i + aiRecipes.length : i}
                    isWeb={true}
                    isFav={isFavorite(r)}
                    onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, true)}
                  />
                ))}

              {/* もっと見る */}
              {hasMoreWeb && activeSource !== 'ai' && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  activeOpacity={0.85}
                >
                  {loadingMore ? (
                    <View style={styles.searchBtnInner}>
                      <ActivityIndicator color="#E65100" size="small" />
                      <Text style={[styles.loadMoreText, { marginLeft: 8 }]}>読み込み中...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loadMoreText}>
                      🌐 Webレシピをもっと見る（残り{webTotal - webOffset}件）
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 空の状態 */}
          {!loading && !hasResults && !error && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🥘</Text>
              <Text style={styles.emptyText}>
                ジャンルや人数を選んで{'\n'}「今日の献立を提案してもらう」を押してください
              </Text>
            </View>
          )}

          <Text style={styles.footer}>
            {apiMode === 'claude'
              ? '🤖 AI提案 = Claude APIによるオリジナルレシピ ／ 🌐 Web = Web検索による実在レシピ'
              : '🔗 カスタムAPIによるレシピ提案'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: { padding: 28, paddingTop: 24, paddingBottom: 24, overflow: 'hidden' },
  headerDecor: { fontSize: 100, position: 'absolute', right: -10, top: -10, opacity: 0.12 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6, fontFamily: FONTS.serifBold },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FONTS.sans },
  modeBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  modeBadgeText: { color: 'white', fontSize: 11, fontWeight: '600', fontFamily: FONTS.sans },

  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#5D4037', marginBottom: 10, fontFamily: FONTS.sans },
  textInput: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0D5CC',
    fontSize: 14,
    backgroundColor: 'white',
    color: '#333',
    marginBottom: 20,
    fontFamily: FONTS.sans,
  },

  limitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  limitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0D5CC',
    backgroundColor: 'white',
  },
  limitChipActive: {
    borderColor: '#E65100',
    backgroundColor: '#FFF3E0',
  },
  limitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    fontFamily: FONTS.sans,
  },
  limitChipTextActive: {
    color: '#E65100',
  },

  simpleModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  simpleModeInfo: {
    flex: 1,
  },
  simpleModeHint: {
    fontSize: 11,
    color: '#BCAAA4',
    marginTop: 2,
    fontFamily: FONTS.sans,
  },

  searchBtn: {
    backgroundColor: '#E65100',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  searchBtnLoading: { backgroundColor: '#FF9800' },
  searchBtnInner: { flexDirection: 'row', alignItems: 'center' },
  searchBtnText: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, fontFamily: FONTS.sans },

  errorBox: {
    margin: 20,
    marginTop: 0,
    padding: 14,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  errorText: { color: '#C62828', fontSize: 14, fontFamily: FONTS.sans },

  results: { padding: 20, paddingTop: 0 },
  sourceTabBar: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  sourceTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center' },
  sourceTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sourceTabText: { fontSize: 12, fontWeight: '500', color: '#888', fontFamily: FONTS.sans },
  sourceTabTextActive: { color: '#E65100', fontWeight: '700', fontFamily: FONTS.sans },

  loadMoreBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E65100',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },

  emptyState: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#A1887F', textAlign: 'center', lineHeight: 26, fontFamily: FONTS.sans },

  footer: { textAlign: 'center', padding: 20, color: '#BCAAA4', fontSize: 11, fontFamily: FONTS.sans },
});
