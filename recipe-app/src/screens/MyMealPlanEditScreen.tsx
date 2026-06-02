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
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans, MyMealPlan, MyMealPlanDay, MealEntry, getDayLabel, calcDate, formatDateLabel, generateEntryId } from '../hooks/useMealPlans';
import { useFavorites } from '../hooks/useFavorites';
import { coopApi } from '../services/coopApi';
import { SEASONS, getCurrentSeason } from '../constants';
import RecipeCard from '../components/RecipeCard';
import { FONTS } from '../constants/fonts';
import { Recipe, WebRecipe } from '../types/recipe';

type Props = {
  planId: string;
};

type InputMode = 'none' | 'text' | 'url' | 'search';

export default function MyMealPlanEditScreen({ planId }: Props) {
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

  const season = getCurrentSeason();
  const seasonInfo = SEASONS[season];

  useEffect(() => {
    const p = getPlan(planId);
    if (p) setPlan(p);
  }, [planId, getPlan]);

  if (!plan) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E65100" />
        </View>
      </View>
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
          const renumbered = newDays.map((d, i) => {
            const date = plan.startDate ? calcDate(plan.startDate, i) : undefined;
            return {
              ...d,
              day: i + 1,
              label: date ? formatDateLabel(date) : `${i + 1}日目`,
              date,
            };
          });
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
    const renumbered = newDays.map((d, i) => {
      const date = plan.startDate ? calcDate(plan.startDate, i) : undefined;
      return {
        ...d,
        day: i + 1,
        label: date ? formatDateLabel(date) : `${i + 1}日目`,
        date,
      };
    });
    save({ ...plan, days: renumbered });
    setEditingDay(toIndex);
  };

  // --- エントリ操作 ---

  const addEntry = (dayIndex: number, entry: Omit<MealEntry, 'id'>) => {
    const newDays = [...plan.days];
    const newEntry: MealEntry = { ...entry, id: generateEntryId() };
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      entries: [...(newDays[dayIndex].entries || []), newEntry],
    };
    save({ ...plan, days: newDays });
  };

  const removeEntry = (dayIndex: number, entryId: string) => {
    const newDays = [...plan.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      entries: newDays[dayIndex].entries.filter((e) => e.id !== entryId),
    };
    save({ ...plan, days: newDays });
  };

  const handleSearchAlt = async (day: MyMealPlanDay) => {
    const names = day.entries.map((e) => e.customTitle || e.recipe?.name || e.webRecipe?.name || e.memo || '').filter(Boolean);
    const recipeName = names[0] || '';
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

  const handleAddAiEntry = (dayIndex: number, recipe: Recipe) => {
    addEntry(dayIndex, { recipe, webRecipe: null, isCustom: false });
    setAltResults(null);
  };

  const handleAddWebEntry = (dayIndex: number, webRecipe: WebRecipe) => {
    addEntry(dayIndex, { webRecipe, recipe: null, isCustom: false });
    setAltResults(null);
  };

  const handleAddCustomEntry = (dayIndex: number) => {
    if (!customInput.trim()) return;
    addEntry(dayIndex, { memo: customInput.trim(), isCustom: true });
    resetInputState();
  };

  const handleAddUrlEntry = (dayIndex: number) => {
    if (!urlInput.trim()) return;
    addEntry(dayIndex, {
      customUrl: urlInput.trim(),
      customTitle: urlTitleInput.trim() || urlInput.trim(),
      isCustom: true,
    });
    resetInputState();
  };

  const handleClearDay = (dayIndex: number) => {
    const newDays = [...plan.days];
    newDays[dayIndex] = { ...newDays[dayIndex], entries: [] };
    save({ ...plan, days: newDays });
    resetInputState();
  };

  const handleAddDay = () => {
    const newIndex = plan.days.length;
    const date = plan.startDate ? calcDate(plan.startDate, newIndex) : undefined;
    const newDay: MyMealPlanDay = {
      day: newIndex + 1,
      label: date ? formatDateLabel(date) : `${newIndex + 1}日目`,
      date,
      entries: [],
    };
    save({ ...plan, days: [...plan.days, newDay] });
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

  const getEntryName = (entry: MealEntry) => {
    return entry.customTitle || entry.memo || entry.recipe?.name || entry.webRecipe?.name || '';
  };

  // ============================================================
  // 描画
  // ============================================================

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {plan.days.map((day, idx) => {
          const isEditing = editingDay === idx;
          const entries = day.entries || [];
          const hasContent = entries.length > 0;

          return (
            <View key={`day-${idx}`} style={styles.dayCard}>
              {/* 日付ヘッダー */}
              <View style={styles.dayCardHeader}>
                <Text style={styles.dayCardDate}>{getDayLabel(day)}</Text>
                <TouchableOpacity
                  style={[styles.editToggleBtn, isEditing && styles.editToggleBtnActive]}
                  onPress={() => {
                    setEditingDay(isEditing ? null : idx);
                    if (isEditing) resetInputState();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isEditing ? 'close' : 'add'} size={16} color={isEditing ? '#fff' : '#E65100'} />
                  <Text style={[styles.editToggleBtnText, isEditing && styles.editToggleBtnTextActive]}>
                    {isEditing ? '閉じる' : '編集'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* レシピ一覧（料理名のみ表示） */}
              {entries.map((entry) => {
                const name = getEntryName(entry);
                const url = entry.customUrl || entry.webRecipe?.url || null;
                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <Text style={styles.entryBullet}>・</Text>
                    {url ? (
                      <TouchableOpacity
                        style={styles.entryNameTouchable}
                        onPress={() => handleOpenUrl(url)}
                        activeOpacity={0.6}
                      >
                        <Ionicons name="link-outline" size={13} color="#1976D2" />
                        <Text style={[styles.entryName, styles.entryNameUrl]} numberOfLines={1}>{name}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.entryName} numberOfLines={1}>{name}</Text>
                    )}
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.entryRemoveBtn}
                        onPress={() => removeEntry(idx, entry.id)}
                      >
                        <Ionicons name="close-circle" size={18} color="#BCAAA4" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {!hasContent && (
                <Text style={styles.emptyDayText}>未設定</Text>
              )}

              {/* 編集パネル（タップで展開） */}
              {isEditing && (
                <View style={styles.editPanel}>
                    {/* 操作ボタン */}
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editActionBtn, styles.editActionBtnUrl, inputMode === 'url' && styles.editActionBtnActive]}
                        onPress={() => toggleInputMode('url')}
                      >
                        <Ionicons name="link" size={14} color="#fff" />
                        <Text style={styles.editActionBtnText}>URL追加</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionBtn, styles.editActionBtnCustom, inputMode === 'text' && styles.editActionBtnActive]}
                        onPress={() => toggleInputMode('text')}
                      >
                        <Ionicons name="create-outline" size={14} color="#fff" />
                        <Text style={styles.editActionBtnText}>入力追加</Text>
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
                          onPress={() => handleAddUrlEntry(idx)}
                          disabled={!urlInput.trim()}
                        >
                          <Text style={styles.urlSubmitBtnText}>追加</Text>
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
                          placeholder="料理名を入力"
                          placeholderTextColor="#BCAAA4"
                        />
                        <TouchableOpacity
                          style={[styles.customInputBtn, !customInput.trim() && styles.btnDisabled]}
                          onPress={() => handleAddCustomEntry(idx)}
                          disabled={!customInput.trim()}
                        >
                          <Text style={styles.customInputBtnText}>追加</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* 検索結果 */}
                    {inputMode === 'search' && altResults && (
                      <View style={styles.altSection}>
                        <Text style={styles.altSectionTitle}>タップで追加</Text>
                        {altResults.ai.map((r, i) => (
                          <TouchableOpacity
                            key={`alt-ai-${i}`}
                            style={styles.altItem}
                            onPress={() => handleAddAiEntry(idx, r)}
                            activeOpacity={0.6}
                          >
                            <View style={styles.altBadge}>
                              <Text style={styles.altBadgeText}>AI</Text>
                            </View>
                            <Text style={styles.altItemText} numberOfLines={2}>{r.name}</Text>
                            <Text style={styles.altSelectText}>追加</Text>
                          </TouchableOpacity>
                        ))}
                        {altResults.web.map((r, i) => (
                          <TouchableOpacity
                            key={`alt-web-${i}`}
                            style={styles.altItem}
                            onPress={() => handleAddWebEntry(idx, r)}
                            activeOpacity={0.6}
                          >
                            <View style={[styles.altBadge, styles.altBadgeWeb]}>
                              <Text style={styles.altBadgeText}>Web</Text>
                            </View>
                            <Text style={styles.altItemText} numberOfLines={2}>{r.name}</Text>
                            <Text style={styles.altSelectText}>追加</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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

  // 日カード
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dayCardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    fontFamily: FONTS.serifBold,
  },
  editToggleBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editToggleBtnActive: {
    backgroundColor: '#E65100',
  },
  editToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
    fontFamily: FONTS.sans,
  },
  editToggleBtnTextActive: {
    color: '#fff',
  },
  emptyDayText: {
    fontSize: 14,
    color: '#BDBDBD',
    fontStyle: 'italic',
    fontFamily: FONTS.sans,
  },

  // エントリ行
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  entryBullet: {
    fontSize: 14,
    color: '#E65100',
    fontFamily: FONTS.sans,
  },
  entryName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    fontFamily: FONTS.sans,
  },
  entryNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  entryNameUrl: {
    color: '#1976D2',
  },
  entryRemoveBtn: {
    padding: 4,
  },

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
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
