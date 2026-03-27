import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORIES } from '../constants';

interface CategorySelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export default function CategorySelector({ selected, onToggle }: CategorySelectorProps) {
  return (
    <View>
      <Text style={styles.label}>ジャンル（最大3つ）</Text>
      <View style={styles.wrap}>
        {CATEGORIES.map((cat) => {
          const active = selected.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onToggle(cat.id)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 10,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E0D5CC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5D4037',
  },
  chipTextActive: {
    color: 'white',
  },
});
