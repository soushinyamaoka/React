import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  useMealPlans,
  MyMealPlan,
  MyMealPlanDay,
  MealEntry,
  formatDateLabel,
  generateEntryId,
} from '../hooks/useMealPlans';
import { FONTS } from '../constants/fonts';

type Props = {
  onBack: () => void;
  onCreated: () => void;
  /** 既存プランがある場合はそのIDを渡す。なければ新規プランを作成する。 */
  existingPlanId?: string;
};

/** Date を "YYYY-MM-DD" に変換 */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** URLからページタイトルを取得 */
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  } catch {
    return null;
  }
}

export default function MealPlanCreateScreen({ onBack, onCreated, existingPlanId }: Props) {
  const { savePlan, addDay } = useMealPlans();
  const [title, setTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleUrlBlur = async () => {
    const url = urlInput.trim();
    if (!url || title.trim()) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;
    setFetchingTitle(true);
    try {
      const pageTitle = await fetchPageTitle(url);
      if (pageTitle) setTitle(pageTitle);
    } finally {
      setFetchingTitle(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const dateStr = toISODate(date);
      const url = urlInput.trim();
      const entryTitle = title.trim() || (url ? url : '');

      const entries: MealEntry[] = url
        ? [{ id: generateEntryId(), customUrl: url, customTitle: entryTitle, isCustom: true }]
        : [];

      if (existingPlanId) {
        // 既存プランに1日追加
        await addDay(existingPlanId, dateStr, entries);
      } else {
        // 新規プランを作成（1日分）
        const now = new Date().toISOString();
        const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const day: MyMealPlanDay = {
          day: 1,
          label: formatDateLabel(dateStr),
          date: dateStr,
          entries,
        };
        const newPlan: MyMealPlan = {
          id,
          title: entryTitle || `献立 ${formatDateLabel(dateStr)}`,
          startDate: dateStr,
          createdAt: now,
          updatedAt: now,
          days: [day],
        };
        await savePlan(newPlan);
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#BF360C', '#E65100', '#FF8A65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>献立を追加</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>

        {/* 日付 */}
        <Text style={styles.sectionLabel}>日付</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={18} color="#E65100" />
          <Text style={styles.dateButtonText}>{formatDateLabel(toISODate(date))}</Text>
          <Text style={styles.dateButtonHint}>タップで変更</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <View style={styles.datePickerWrapper}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              locale="ja"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.datePickerDone}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>決定</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* URL添付 */}
        <Text style={styles.sectionLabel}>レシピURL（任意）</Text>
        <View style={styles.urlRow}>
          <Ionicons name="link-outline" size={18} color="#E65100" style={styles.urlIcon} />
          <TextInput
            style={styles.urlInput}
            value={urlInput}
            onChangeText={setUrlInput}
            onBlur={handleUrlBlur}
            placeholder="https://... レシピURLを貼り付け"
            placeholderTextColor="#BCAAA4"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {fetchingTitle && <ActivityIndicator size="small" color="#E65100" style={styles.urlSpinner} />}
        </View>

        {/* 献立名 */}
        <Text style={styles.sectionLabel}>献立名（任意）</Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="URLから自動入力、または直接入力"
          placeholderTextColor="#BCAAA4"
        />

        {/* 追加ボタン */}
        <TouchableOpacity
          style={[styles.createButton, saving && styles.createButtonDisabled]}
          onPress={handleCreate}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark-circle" size={22} color="#fff" />
          }
          <Text style={styles.createButtonText}>追加する</Text>
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
  contentInner: { padding: 24, gap: 10 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D4037',
    fontFamily: FONTS.sans,
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    fontFamily: FONTS.sans,
  },
  dateButtonHint: {
    fontSize: 12,
    color: '#BCAAA4',
    marginLeft: 'auto',
    fontFamily: FONTS.sans,
  },
  datePickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E65100',
    borderRadius: 8,
    marginTop: 8,
  },
  datePickerDoneText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: FONTS.sans },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E65100',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  urlIcon: { marginRight: 6 },
  urlInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.sans,
    color: '#333',
    paddingVertical: 10,
  },
  urlSpinner: { marginLeft: 6 },
  titleInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FONTS.sans,
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E65100',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: FONTS.sans },
});
