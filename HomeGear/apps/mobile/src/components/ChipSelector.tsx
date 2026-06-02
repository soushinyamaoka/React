import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

export interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: ChipOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  allowClear?: boolean;
}

export const ChipSelector: React.FC<Props> = ({ label, options, value, onChange, allowClear }) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {allowClear && (
          <TouchableOpacity
            style={[styles.chip, !value && styles.chipActive]}
            onPress={() => onChange(null)}
          >
            <Text style={[styles.chipText, !value && styles.chipTextActive]}>すべて</Text>
          </TouchableOpacity>
        )}
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { fontSize: 14, color: COLORS.textSub, marginBottom: SPACING.xs, fontWeight: '600' },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderColor: COLORS.border,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
});
