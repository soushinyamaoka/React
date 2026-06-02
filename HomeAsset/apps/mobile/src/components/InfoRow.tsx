import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING } from '../theme';

interface Props {
  label: string;
  value?: string | number | null;
}

export const InfoRow: React.FC<Props> = ({ label, value }) => {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={3}>
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    width: 110,
    color: COLORS.textSub,
    fontSize: 13,
    paddingTop: 2,
  },
  value: { flex: 1, color: COLORS.text, fontSize: 14 },
});
