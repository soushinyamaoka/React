import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMealPlans, MealEntry, MyMealPlan, MyMealPlanDay, formatDateLabel, generateEntryId } from '../hooks/useMealPlans';
import { FONTS } from '../constants/fonts';

type Props = {
  visible: boolean;
  entry: Omit<MealEntry, 'id'>;
  onClose: () => void;
  onAdded: () => void;
};

/** Date を "YYYY-MM-DD" に変換 */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MealPlanSelectorModal({ visible, entry, onClose, onAdded }: Props) {
  const { plans, savePlan, addDay, addEntryToPlan } = useMealPlans();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [adding, setAdding] = useState(false);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const recipeName =
    entry.customTitle ||
    entry.webRecipe?.name ||
    entry.recipe?.name ||
    'レシピ';

  const recipeUrl =
    entry.customUrl ||
    entry.webRecipe?.url ||
    null;

  const handleAdd = async () => {
    setAdding(true);
    try {
      const dateStr = toISODate(date);
      const newEntry: MealEntry = { ...entry, id: generateEntryId() };

      if (plans.length === 0) {
        // プランがなければ自動で新規作成
        const now = new Date().toISOString();
        const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const day: MyMealPlanDay = {
          day: 1,
          label: formatDateLabel(dateStr),
          date: dateStr,
          entries: [newEntry],
        };
        const newPlan: MyMealPlan = {
          id,
          title: `献立 ${formatDateLabel(dateStr)}`,
          startDate: dateStr,
          createdAt: now,
          updatedAt: now,
          days: [day],
        };
        await savePlan(newPlan);
      } else {
        const plan = plans[0];
        const existingDayIndex = plan.days.findIndex((d) => d.date === dateStr);
        if (existingDayIndex >= 0) {
          await addEntryToPlan(plan.id, existingDayIndex, entry);
        } else {
          await addDay(plan.id, dateStr, [newEntry]);
        }
      }
      onAdded();
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* ハンドル */}
        <View style={styles.handle} />

        <Text style={styles.title}>献立に追加</Text>

        {/* レシピ情報 */}
        <View style={styles.recipeCard}>
          <Ionicons name={recipeUrl ? 'link-outline' : 'restaurant-outline'} size={16} color="#E65100" />
          <Text style={styles.recipeName} numberOfLines={2}>{recipeName}</Text>
        </View>

        {/* 日付選択 */}
        <Text style={styles.sectionLabel}>追加する日付</Text>
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

        {/* 追加ボタン */}
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={adding}
          activeOpacity={0.85}
        >
          {adding
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="checkmark-circle" size={20} color="#fff" />
          }
          <Text style={styles.addBtnText}>この日に追加</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    fontFamily: FONTS.sans,
    marginBottom: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  recipeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    fontFamily: FONTS.sans,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 8,
    fontFamily: FONTS.sans,
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
    marginBottom: 12,
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
    marginBottom: 12,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E65100',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: { fontSize: 15, color: '#666', fontWeight: '600', fontFamily: FONTS.sans },
  noPlans: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  noPlansText: {
    fontSize: 14,
    color: '#999',
    fontFamily: FONTS.sans,
    textAlign: 'center',
  },
});
