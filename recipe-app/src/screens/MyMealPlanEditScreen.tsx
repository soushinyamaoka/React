import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans, MyMealPlan, MyMealPlanDay } from '../hooks/useMealPlans';
import { useFavorites } from '../hooks/useFavorites';
import { coopApi } from '../services/coopApi';
import { SEASONS, getCurrentSeason } from '../constants';
import RecipeCard from '../components/RecipeCard';
import { FONTS } from '../constants/fonts';
import { Recipe, WebRecipe } from '../types/recipe';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { MealPlanStackParamList } from './MealPlanNavigator';

type Props = {
  navigation: NativeStackNavigationProp<MealPlanStackParamList, 'MealPlanEdit'>;
  route: RouteProp<MealPlanStackParamList, 'MealPlanEdit'>;
};

type InputMode = 'none' | 'text' | 'url' | 'search';

export default function MyMealPlanEditScreen({ navigation, route }: Props) {
  const { getPlan, updatePlan } = useMealPlans();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [plan, setPlan] = useState<MyMealPlan | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [altResults, setAltResults] = useState<{ ai: Recipe[]; web: WebRecipe[] } | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitleInput, setUrlTitleInput] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const season = getCurrentSeason();
  const seasonInfo = SEASONS[season];

  useEffect(() => {
    const p = getPlan(route.params.planId);
    if (p) setPlan(p);
  }, [route.params.planId, getPlan]);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E65100" />
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 操作
  // ============================================================

  const save = async (updated: MyMealPlan) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setPlan(withTimestamp);
    await updatePlan(withTimestamp);
  };

  const resetInputState = () => {
    setInputMode('none');
    setCustomInput('');
    setUrlInput('');
    setUrlTitleInput('');
    setAltResults(null);
  };

  const handleDeleteDay = (dayIndex: number) => {
    const day = plan.days[dayIndex];
    Alert.alert('削除確認', `${day.label}を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          const newDays = plan.days.filter((_, i) => i !== dayIndex);
          const renumbered = newDays.map((d, i) => ({
            ...d,
            day: i + 1,
            label: `${i + 1}日目`,
          }));
          save({ ...plan, days: renumbered });
          setEditingDay(null);
          resetInputState();
        },
      },
    ]);
  };

  const handleMoveDay = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= plan.days.length) return;
    const newDays = [...plan.days];
    [newDays[fromIndex], newDays[toIndex]] = [newDays[toIndex], newDays[fromIndex]];
    const renumbered = newDays.map((d, i) => ({
      ...d,
      day: i + 1,
      label: `${i + 1}日目`,
    }));
    save({ ...plan, days: renumbered });
    setEditingDay(toIndex);
  };

  const handleSearchAlt = async (day: MyMealPlanDay) => {
    const recipeName = day.customTitle || day.recipe?.name || day.webRecipe?.name || day.memo || '';
    if (!recipeName) {
      Alert.alert('検索できません', 'レシピ情報がありません');
      return;
    }

    setSearching(true);
    setAltResults(null);
    try {
      const result = await coopApi.suggestRecipes([recipeName], {
        season: seasonInfo.label,
        servings: 2,
        mode: 'both',
      });
      setAltResults({
        ai: result.recipes || [],
        web: result.web_recipes || [],
      });
      if ((result.recipes?.length ?? 0) === 0 && (result.web_recipes?.length ?? 0) === 0) {
        Alert.alert('結果なし', '代替レシピが見つかりませんでした');
      }
    } catch (err: unknown) {
      Alert.alert('エラー', err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const handleReplaceWithAi = (dayIndex: number, recipe: Recipe) => {
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      recipe,
      webRecipe: null,
      memo: undefined,
      customUrl: undefined,
      customTitle: undefined,
      isCustom: false,
    };
    save({ ...plan, days: newDays });
    setAltResults(null);
  };

  const handleReplaceWithWeb = (dayIndex: number, webRecipe: WebRecipe) => {
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      recipe: null,
      webRecipe,
      memo: undefined,
      customUrl: undefined,
      customTitle: undefined,
      isCustom: false,
    };
    save({ ...plan, days: newDays });
    setAltResults(null);
  };

  const handleReplaceWithCustom = (dayIndex: number) => {
    if (!customInput.trim()) return;
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      recipe: null,
      webRecipe: null,
      memo: customInput.trim(),
      customUrl: undefined,
      customTitle: undefined,
      isCustom: true,
    };
    save({ ...plan, days: newDays });
    resetInputState();
  };

  const handleReplaceWithUrl = (dayIndex: number) => {
    if (!urlInput.trim()) return;
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      recipe: null,
      webRecipe: null,
      memo: undefined,
      customUrl: urlInput.trim(),
      customTitle: urlTitleInput.trim() || urlInput.trim(),
      isCustom: true,
    };
    save({ ...plan, days: newDays });
    resetInputState();
  };

  const handleClearDay = (dayIndex: number) => {
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      recipe: null,
      webRecipe: null,
      memo: '',
      customUrl: undefined,
      customTitle: undefined,
      isCustom: true,
    };
    save({ ...plan, days: newDays });
    resetInputState();
  };

  const handleAddDay = () => {
    const newDay: MyMealPlanDay = {
      day: plan.days.length + 1,
      label: `${plan.days.length + 1}日目`,
      recipe: null,
      webRecipe: null,
      memo: '',
      isCustom: true,
    };
    save({ ...plan, days: [...plan.days, newDay] });
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      save({ ...plan, title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('エラー', 'URLを開けませんでした');
    });
  };

  const toggleInputMode = (mode: InputMode) => {
    if (inputMode === mode) {
      setInputMode('none');
    } else {
      setInputMode(mode);
      setCustomInput('');
      setUrlInput('');
      setUrlTitleInput('');
      setAltResults(null);
    }
  };

  const getDisplayName = (day: MyMealPlanDay) => {
    return day.customTitle || day.memo || day.recipe?.name || day.webRecipe?.name || '';
  };

  // ============================================================
  // 描画
  // ============================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#BF360C', '#E65100', '#FF8A65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>

        {editingTitle ? (
          <View style={styles.titleEditRow}>
            <TextInput
              style={styles.titleInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              autoFocus
              onSubmitEditing={handleSaveTitle}
              onBlur={handleSaveTitle}
              placeholder="献立名を入力"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setTitleDraft(plan.title); setEditingTitle(true); }}
            activeOpacity={0.7}
          >
            <Text style={styles.headerTitle}>{plan.title}</Text>
            <Text style={styles.headerHint}>タップで名前を変更</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {/* 献立表 */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableDayCell}>
              <Text style={styles.tableHeaderText}>日</Text>
            </View>
            <View style={styles.tableRecipeCell}>
              <Text style={styles.tableHeaderText}>メニュー</Text>
            </View>
            <View style={styles.tableActionCell}>
              <Text style={styles.tableHeaderText}>操作</Text>
            </View>
          </View>

          {plan.days.map((day, idx) => {
            const isEditing = editingDay === idx;
            const displayName = getDisplayName(day) || '未設定';
            const hasUrl = !!day.customUrl;
            const hasContent = !!(day.recipe || day.webRecipe || day.memo || day.customUrl);

            return (
              <View key={`day-${idx}`}>
                <TouchableOpacity
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && styles.tableRowEven,
                    isEditing && styles.tableRowSelected,
                  ]}
                  onPress={() => {
                    setEditingDay(isEditing ? null : idx);
                    if (isEditing) resetInputState();
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.tableDayCell}>
                    <Text style={styles.tableDayText}>{day.label}</Text>
                  </View>
                  <View style={styles.tableRecipeCell}>
                    {hasUrl && (
                      <View style={styles.urlBadge}>
                        <Text style={styles.urlBadgeText}>URL</Text>
                      </View>
                    )}
                    {!hasUrl && day.isCustom && hasContent && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>自作</Text>
                      </View>
                    )}
                    <Text
                      style={[styles.tableRecipeText, !hasContent && styles.tableRecipeEmpty]}
                      numberOfLines={isEditing ? undefined : 1}
                    >
                      {displayName}
                    </Text>
                  </View>
                  <View style={styles.tableActionCell}>
                    <Text style={styles.tableChevron}>{isEditing ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* 編集パネル */}
                {isEditing && (
                  <View style={styles.editPanel}>
                    {/* 現在のレシピ詳細 */}
                    {day.recipe && !day.isCustom && (
                      <RecipeCard
                        recipe={day.recipe as unknown as Record<string, unknown> & { name: string }}
                        index={0}
                        isWeb={false}
                        isFav={isFavorite(day.recipe)}
                        onToggleFav={() => toggleFavorite(day.recipe as unknown as Record<string, unknown>, false)}
                      />
                    )}
                    {day.webRecipe && !day.isCustom && (
                      <RecipeCard
                        recipe={day.webRecipe as unknown as Record<string, unknown> & { name: string }}
                        index={0}
                        isWeb={true}
                        isFav={isFavorite(day.webRecipe)}
                        onToggleFav={() => toggleFavorite(day.webRecipe as unknown as Record<string, unknown>, true)}
                      />
                    )}

                    {/* URL付きレシピ表示 */}
                    {day.customUrl && (
                      <TouchableOpacity
                        style={styles.urlCard}
                        onPress={() => handleOpenUrl(day.customUrl!)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.urlCardHeader}>
                          <Ionicons name="link" size={16} color="#E65100" />
                          <Text style={styles.urlCardTitle} numberOfLines={2}>
                            {day.customTitle || day.customUrl}
                          </Text>
                        </View>
                        <Text style={styles.urlCardUrl} numberOfLines={1}>{day.customUrl}</Text>
                        <Text style={styles.urlCardHint}>タップでブラウザで開く</Text>
                      </TouchableOpacity>
                    )}

                    {/* 自由入力メモ（URL無し） */}
                    {day.isCustom && day.memo && !day.customUrl && (
                      <View style={styles.customMemoCard}>
                        <Text style={styles.customMemoText}>{day.memo}</Text>
                      </View>
                    )}

                    {/* 操作ボタン */}
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editActionBtn, styles.editActionBtnUrl, inputMode === 'url' && styles.editActionBtnActive]}
                        onPress={() => toggleInputMode('url')}
                      >
                        <Ionicons name="link" size={14} color="#fff" />
                        <Text style={styles.editActionBtnText}>URLで追加</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionBtn, styles.editActionBtnCustom, inputMode === 'text' && styles.editActionBtnActive]}
                        onPress={() => toggleInputMode('text')}
                      >
                        <Ionicons name="create-outline" size={14} color="#fff" />
                        <Text style={styles.editActionBtnText}>自由入力</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionBtn, inputMode === 'search' && styles.editActionBtnActive]}
                        onPress={() => {
                          toggleInputMode('search');
                          if (inputMode !== 'search') handleSearchAlt(day);
                        }}
                        disabled={searching}
                      >
                        {searching ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="search" size={14} color="#fff" />
                            <Text style={styles.editActionBtnText}>検索</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* URL入力 */}
                    {inputMode === 'url' && (
                      <View style={styles.urlInputSection}>
                        <TextInput
                          style={styles.urlInputField}
                          value={urlTitleInput}
                          onChangeText={setUrlTitleInput}
                          placeholder="レシピ名（任意）"
                          placeholderTextColor="#BCAAA4"
                        />
                        <View style={styles.urlInputRow}>
                          <TextInput
                            style={[styles.urlInputField, styles.urlInputFieldUrl]}
                            value={urlInput}
                            onChangeText={setUrlInput}
                            placeholder="https://... レシピURLを貼り付け"
                            placeholderTextColor="#BCAAA4"
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        <TouchableOpacity
                          style={[styles.urlSubmitBtn, !urlInput.trim() && styles.btnDisabled]}
                          onPress={() => handleReplaceWithUrl(idx)}
                          disabled={!urlInput.trim()}
                        >
                          <Text style={styles.urlSubmitBtnText}>決定</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* テキスト入力 */}
                    {inputMode === 'text' && (
                      <View style={styles.customInputSection}>
                        <TextInput
                          style={styles.customInputField}
                          value={customInput}
                          onChangeText={setCustomInput}
                          placeholder="レシピ名やメモを入力"
                          placeholderTextColor="#BCAAA4"
                        />
                        <TouchableOpacity
                          style={[styles.customInputBtn, !customInput.trim() && styles.btnDisabled]}
                          onPress={() => handleReplaceWithCustom(idx)}
                          disabled={!customInput.trim()}
                        >
                          <Text style={styles.customInputBtnText}>決定</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* 検索結果 */}
                    {inputMode === 'search' && altResults && (
                      <View style={styles.altSection}>
                        <Text style={styles.altSectionTitle}>候補から選んでください</Text>
                        {altResults.ai.map((r, i) => (
                          <TouchableOpacity
                            key={`alt-ai-${i}`}
                            style={styles.altItem}
                            onPress={() => handleReplaceWithAi(idx, r)}
                            activeOpacity={0.6}
                          >
                            <View style={styles.altBadge}>
                              <Text style={styles.altBadgeText}>AI</Text>
                            </View>
                            <Text style={styles.altItemText} numberOfLines={2}>{r.name}</Text>
                            <Text style={styles.altSelectText}>選択</Text>
                          </TouchableOpacity>
                        ))}
                        {altResults.web.map((r, i) => (
                          <TouchableOpacity
                            key={`alt-web-${i}`}
                            style={styles.altItem}
                            onPress={() => handleReplaceWithWeb(idx, r)}
                            activeOpacity={0.6}
                          >
                            <View style={[styles.altBadge, styles.altBadgeWeb]}>
                              <Text style={styles.altBadgeText}>Web</Text>
                            </View>
                            <Text style={styles.altItemText} numberOfLines={2}>{r.name}</Text>
                            <Text style={styles.altSelectText}>選択</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* 並び替え・削除・クリア */}
                    <View style={styles.editBottomActions}>
                      <TouchableOpacity
                        style={[styles.moveBtn, idx === 0 && styles.btnDisabled]}
                        onPress={() => handleMoveDay(idx, 'up')}
                        disabled={idx === 0}
                      >
                        <Text style={styles.moveBtnText}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.moveBtn, idx === plan.days.length - 1 && styles.btnDisabled]}
                        onPress={() => handleMoveDay(idx, 'down')}
                        disabled={idx === plan.days.length - 1}
                      >
                        <Text style={styles.moveBtnText}>↓</Text>
                      </TouchableOpacity>
                      {hasContent && (
                        <TouchableOpacity
                          style={styles.clearBtn}
                          onPress={() => handleClearDay(idx)}
                        >
                          <Text style={styles.clearBtnText}>クリア</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteDay(idx)}
                      >
                        <Text style={styles.deleteBtnText}>削除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 日を追加 */}
        <TouchableOpacity
          style={styles.addDayButton}
          onPress={handleAddDay}
          activeOpacity={0.7}
        >
          <Text style={styles.addDayButtonText}>+ 日を追加</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// スタイル
// ============================================================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  flex: { flex: 1 },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ヘッダー
  header: { padding: 20, paddingTop: 16, paddingBottom: 16, overflow: 'hidden' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backButtonText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: FONTS.sans },
  headerTitle: { fontSize: 22, fontWeight: '700', color: 'white', fontFamily: FONTS.serifBold },
  headerHint: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: FONTS.sans },
  titleEditRow: { flexDirection: 'row', alignItems: 'center' },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 4,
    fontFamily: FONTS.serifBold,
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
    backgroundColor: '#E65100',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.sans,
  },
  tableDayCell: { width: 52, justifyContent: 'center' },
  tableRecipeCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    gap: 6,
  },
  tableActionCell: { width: 36, alignItems: 'center', justifyContent: 'center' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  tableRowEven: { backgroundColor: '#FAFAFA' },
  tableRowSelected: { backgroundColor: '#FFF3E0' },
  tableDayText: { fontSize: 13, fontWeight: '700', color: '#E65100', fontFamily: FONTS.sans },
  tableRecipeText: { fontSize: 14, color: '#333', flex: 1, fontFamily: FONTS.sans },
  tableRecipeEmpty: { color: '#BDBDBD', fontStyle: 'italic' },
  tableChevron: { fontSize: 11, color: '#999' },

  // バッジ
  customBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  customBadgeText: { fontSize: 9, fontWeight: '700', color: '#E65100', fontFamily: FONTS.sans },
  urlBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  urlBadgeText: { fontSize: 9, fontWeight: '700', color: '#1565C0', fontFamily: FONTS.sans },

  // 編集パネル
  editPanel: {
    padding: 14,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  editActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    borderRadius: 10,
  },
  editActionBtnUrl: {
    backgroundColor: '#E65100',
  },
  editActionBtnCustom: {
    backgroundColor: '#7B1FA2',
  },
  editActionBtnActive: {
    opacity: 0.7,
  },
  editActionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sans },

  // URL入力
  urlInputSection: {
    marginTop: 10,
    gap: 8,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInputField: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
  },
  urlInputFieldUrl: {
    flex: 1,
  },
  urlSubmitBtn: {
    backgroundColor: '#E65100',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  urlSubmitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: FONTS.sans },

  // URL表示カード
  urlCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1976D2',
    marginBottom: 4,
  },
  urlCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  urlCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    fontFamily: FONTS.sans,
  },
  urlCardUrl: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
    fontFamily: FONTS.sans,
  },
  urlCardHint: {
    fontSize: 10,
    color: '#BCAAA4',
    fontFamily: FONTS.sans,
  },

  // テキスト入力
  customInputSection: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  customInputField: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: FONTS.sans,
  },
  customInputBtn: {
    backgroundColor: '#7B1FA2',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  customInputBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sans },

  // 検索結果
  altSection: { marginTop: 12 },
  altSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
    fontFamily: FONTS.sans,
  },
  altItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8EAF6',
  },
  altBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  altBadgeWeb: { backgroundColor: '#E8F5E9' },
  altBadgeText: { fontSize: 10, fontWeight: '700', color: '#333', fontFamily: FONTS.sans },
  altItemText: { flex: 1, fontSize: 13, color: '#333', fontFamily: FONTS.sans },
  altSelectText: { fontSize: 12, fontWeight: '700', color: '#E65100', marginLeft: 8, fontFamily: FONTS.sans },

  // 並び替え・削除
  editBottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  moveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  moveBtnText: { fontSize: 14, fontWeight: '600', color: '#555', fontFamily: FONTS.sans },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: '#E65100', fontFamily: FONTS.sans },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFCDD2',
    marginLeft: 'auto',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#C62828', fontFamily: FONTS.sans },

  btnDisabled: { opacity: 0.4 },

  // カスタムメモ
  customMemoCard: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E65100',
  },
  customMemoText: { fontSize: 15, color: '#5D4037', fontFamily: FONTS.sans },

  // 日を追加
  addDayButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E65100',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addDayButtonText: { fontSize: 15, fontWeight: '700', color: '#E65100', fontFamily: FONTS.sans },
});
