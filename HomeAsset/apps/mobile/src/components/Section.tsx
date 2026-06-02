import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { COLORS, SPACING } from '../theme';

interface Props extends ViewProps {
  title: string;
  action?: React.ReactNode;
}

export const Section: React.FC<Props> = ({ title, action, children, style, ...rest }) => (
  <View {...rest} style={[styles.section, style]}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {action ? <View>{action}</View> : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
