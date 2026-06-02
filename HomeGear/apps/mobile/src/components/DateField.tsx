import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme';

interface Props {
  label?: string;
  value?: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
}

// 'YYYY-MM-DD' <-> Date 変換は **ローカル時刻** で行う。
// new Date('YYYY-MM-DD') は UTC として解釈されるため、JST 環境で日付がズレるのを防ぐ。
function parseDateOnly(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 数字のみの文字列にハイフンを自動補完: 20150103 -> 2015-01-03
function autoFormatDateText(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DateField: React.FC<Props> = ({ label, value, onChange, placeholder, error, helper }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [draft, setDraft] = useState<string>(value ?? '');

  // 親から value が更新されたら draft も同期
  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const commitText = (text: string) => {
    if (!text) {
      // 空入力は許容（任意項目）
      onChange('');
      return;
    }
    if (!DATE_REGEX.test(text)) return; // 不完全なら親には伝えない
    const date = parseDateOnly(text);
    if (!date) return; // 例: 2025-13-99 のような不正値
    onChange(text);
  };

  const handleTextChange = (raw: string) => {
    const formatted = autoFormatDateText(raw);
    setDraft(formatted);
    commitText(formatted);
  };

  const handleBlur = () => {
    // 不完全なまま離れた場合、value に戻す
    if (draft && !DATE_REGEX.test(draft)) {
      setDraft(value ?? '');
    }
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const formatted = formatDateOnly(selectedDate);
      setDraft(formatted);
      onChange(formatted);
    }
  };

  const currentDate = parseDateOnly(value) ?? new Date();

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? { borderColor: COLORS.danger } : null]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder ?? 'YYYY-MM-DD'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
          maxLength={10}
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setShowPicker(true)}
          accessibilityLabel="カレンダーを開く"
        >
          <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}

      {showPicker && (
        <>
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.iosDoneBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.iosDoneText}>完了</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { fontSize: 14, color: COLORS.textSub, marginBottom: SPACING.xs, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  iconBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  error: { color: COLORS.danger, marginTop: SPACING.xs, fontSize: 12 },
  helper: { color: COLORS.textMuted, marginTop: SPACING.xs, fontSize: 12 },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iosDoneText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
});
