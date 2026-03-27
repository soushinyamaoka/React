import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Easing,
} from 'react-native';
import FavButton from './FavButton';
import { FONTS } from '../constants/fonts';

type AnyRecipe = Record<string, any> & { name: string };

interface RecipeCardProps {
  recipe: AnyRecipe;
  index: number;
  isWeb: boolean;
  isFav: boolean;
  onToggleFav: () => void;
}

export default function RecipeCard({ recipe, index, isWeb, isFav, onToggleFav }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;

  // カード入場アニメーション
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // chevron 回転アニメーション（CSS transition の代替）
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const r = recipe;

  const handleOpenURL = async () => {
    const url = r.url as string | null;
    if (url) {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('エラー', 'URLを開けませんでした');
      }
    }
  };

  const ingredients = Array.isArray(r.ingredients) ? r.ingredients as string[] : [];
  const steps = Array.isArray(r.steps) ? r.steps as string[] : [];
  const tips = Array.isArray(r.tips) ? r.tips as string[] : [];

  return (
    <Animated.View
      style={[
        styles.card,
        isFav && styles.cardFav,
        { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
      ]}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.95}>
        {/* ヘッダー */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <View style={styles.badgeRow}>
              {isWeb ? (
                <View style={styles.badgeWeb}>
                  <Text style={styles.badgeWebText}>🌐 Web</Text>
                </View>
              ) : (
                <View style={styles.badgeAI}>
                  <Text style={styles.badgeAIText}>🤖 AI提案</Text>
                </View>
              )}
              {isFav && <Text style={styles.favLabel}>♥ お気に入り</Text>}
            </View>
            <Text style={styles.recipeName}>{recipe.name}</Text>
          </View>
          <View style={styles.rightControls}>
            <FavButton active={isFav} onPress={onToggleFav} />
            <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}>
              ⌄
            </Animated.Text>
          </View>
        </View>

        {/* AIレシピのメタ情報 */}
        {!isWeb && (r.time || r.difficulty || r.calories) && (
          <View style={styles.metaRow}>
            {r.time ? <Text style={styles.metaText}>⏱ {r.time as string}</Text> : null}
            {r.difficulty ? <Text style={styles.metaText}>{r.difficulty as string}</Text> : null}
            {r.calories ? <Text style={styles.metaText}>🔥 {r.calories as string}</Text> : null}
          </View>
        )}

        {/* Webレシピの説明 */}
        {isWeb && r.description ? (
          <Text style={styles.webDesc}>{r.description as string}</Text>
        ) : null}
      </TouchableOpacity>

      {/* 展開: AIレシピ詳細 */}
      {expanded && !isWeb && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>材料</Text>
              <View style={styles.ingredientWrap}>
                {ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientTag}>
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {steps.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>作り方</Text>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {tips.length > 0 && (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>💡 ポイント</Text>
              {tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>{tip}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 展開: Webレシピリンク */}
      {expanded && isWeb && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          {r.url ? (
            <View style={styles.webLinkRow}>
              <TouchableOpacity style={styles.webLinkBtn} onPress={handleOpenURL}>
                <Text style={styles.webLinkBtnText}>レシピを見る →</Text>
              </TouchableOpacity>
              {r.source ? <Text style={styles.webSourceText}>出典: {r.source as string}</Text> : null}
            </View>
          ) : (
            <Text style={styles.noLinkText}>
              {r.source
                ? `出典: ${r.source as string}（URLが取得できませんでした）`
                : '詳細なリンクが見つかりませんでした'}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  cardFav: {
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  cardTitleArea: { flex: 1 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeWeb: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeWebText: { color: '#2E7D32', fontSize: 11, fontWeight: '600', fontFamily: FONTS.sans },
  badgeAI: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeAIText: { color: '#E65100', fontSize: 11, fontWeight: '600', fontFamily: FONTS.sans },
  favLabel: { fontSize: 11, color: '#EF5350', fontWeight: '600', fontFamily: FONTS.sans },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    fontFamily: FONTS.serifBold,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  chevron: {
    fontSize: 20,
    color: '#999',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  metaText: { fontSize: 13, color: '#666', fontFamily: FONTS.sans },
  webDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontFamily: FONTS.sans,
  },
  expandedContent: { paddingHorizontal: 20, paddingBottom: 20 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: FONTS.sans,
  },
  ingredientWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientTag: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ingredientText: { fontSize: 13, color: '#5D4037', fontFamily: FONTS.sans },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { color: 'white', fontSize: 12, fontWeight: '700', fontFamily: FONTS.sans },
  stepText: { fontSize: 14, color: '#333', lineHeight: 22, flex: 1, fontFamily: FONTS.sans },
  tipsBox: {
    backgroundColor: '#FFFDE7',
    borderRadius: 10,
    padding: 12,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#F9A825', marginBottom: 6, fontFamily: FONTS.sans },
  tipText: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 2, fontFamily: FONTS.sans },
  webLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  webLinkBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  webLinkBtnText: { color: 'white', fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans },
  webSourceText: { fontSize: 12, color: '#999', fontFamily: FONTS.sans },
  noLinkText: { fontSize: 13, color: '#888', fontFamily: FONTS.sans },
});
