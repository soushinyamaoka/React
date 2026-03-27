import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans, MyMealPlan, MyMealPlanDay } from '../hooks/useMealPlans';
import { FONTS } from '../constants/fonts';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MealPlanStackParamList } from './MealPlanNavigator';

type Props = {
  navigation: NativeStackNavigationProp<MealPlanStackParamList, 'MealPlanCreate'>;
};

const DAY_OPTIONS = [1, 3, 5, 7, 10, 14];

export default function MealPlanCreateScreen({ navigation }: Props) {
  const { savePlan } = useMealPlans();
  const [title, setTitle] = useState('');
  const [dayCount, setDayCount] = useState(7);

  const handleCreate = async () => {
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const days: MyMealPlanDay[] = Array.from({ length: dayCount }, (_, i) => ({
      day: i + 1,
      label: `${i + 1}日目`,
      recipe: null,
      webRecipe: null,
      memo: '',
      isCustom: true,
    }));

    const newPlan: MyMealPlan = {
      id,
      title: title.trim() || `献立 ${new Date().toLocaleDateString('ja-JP')}`,
      createdAt: now,
      updatedAt: now,
      days,
    };

    await savePlan(newPlan);
    navigation.replace('MealPlanEdit', { planId: id });
  };

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
        <Text style={styles.headerTitle}>新しい献立を作成</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* 献立名 */}
        <Text style={styles.sectionLabel}>献立名</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="例: 今週の献立、来客用メニュー"
          placeholderTextColor="#BCAAA4"
        />

        {/* 日数選択 */}
        <Text style={styles.sectionLabel}>日数</Text>
        <View style={styles.dayOptions}>
          {DAY_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayOption, dayCount === d && styles.dayOptionSelected]}
              onPress={() => setDayCount(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayOptionText, dayCount === d && styles.dayOptionTextSelected]}>
                {d}日
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* プレビュー */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="calendar-outline" size={18} color="#E65100" />
            <Text style={styles.previewTitle}>
              {title.trim() || `献立 ${new Date().toLocaleDateString('ja-JP')}`}
            </Text>
          </View>
          <Text style={styles.previewSub}>{dayCount}日分の空の献立が作成されます</Text>
          <Text style={styles.previewHint}>
            作成後、各日にレシピURLの貼り付けや自由入力で{'\n'}メニューを設定できます
          </Text>
        </View>

        {/* 作成ボタン */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.createButtonText}>作成する</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { padding: 20, paddingTop: 16, paddingBottom: 16, overflow: 'hidden' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backButtonText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: FONTS.sans },
  headerTitle: { fontSize: 22, fontWeight: '700', color: 'white', fontFamily: FONTS.serifBold },
  content: { flex: 1 },
  contentInner: { padding: 24 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 10,
    fontFamily: FONTS.sans,
  },
  titleInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FONTS.sans,
    color: '#333',
    marginBottom: 28,
  },
  dayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  dayOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  dayOptionSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#E65100',
  },
  dayOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
    fontFamily: FONTS.sans,
  },
  dayOptionTextSelected: {
    color: '#E65100',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 28,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    fontFamily: FONTS.serifBold,
  },
  previewSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: FONTS.sans,
  },
  previewHint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    fontFamily: FONTS.sans,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E65100',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },
});
