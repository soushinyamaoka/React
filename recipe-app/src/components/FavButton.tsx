import React, { useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

interface FavButtonProps {
  active: boolean;
  onPress: () => void;
}

export default function FavButton({ active, onPress }: FavButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.4, duration: 175, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 175, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel={active ? 'お気に入り解除' : 'お気に入り登録'}
    >
      <Animated.Text style={[styles.emoji, { transform: [{ scale }], opacity: active ? 1 : 0.35 }]}>
        {active ? '❤️' : '🤍'}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 22,
  },
});
