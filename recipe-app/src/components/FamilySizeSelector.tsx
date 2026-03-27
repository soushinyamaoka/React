import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FAMILY_SIZES } from '../constants';

interface FamilySizeSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function FamilySizeSelector({ selected, onSelect }: FamilySizeSelectorProps) {
  return (
    <View>
      <Text style={styles.label}>何人分？</Text>
      <View style={styles.wrap}>
        {FAMILY_SIZES.map((size) => {
          const active = selected === size.id;
          return (
            <TouchableOpacity
              key={size.id}
              onPress={() => onSelect(size.id)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {size.label}
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5D4037',
  },
  chipTextActive: {
    color: 'white',
  },
});
