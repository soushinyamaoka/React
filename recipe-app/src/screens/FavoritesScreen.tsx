import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '../hooks/useFavorites';
import { FONTS } from '../constants/fonts';
import RecipeCard from '../components/RecipeCard';

export default function FavoritesScreen() {
  const { favorites, favLoaded, toggleFavorite, clearAllFavorites } = useFavorites();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ヘッダー */}
      <LinearGradient
        colors={['#BF360C', '#E65100']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>❤️ お気に入り</Text>
        {favorites.length > 0 && (
          <Text style={styles.headerSub}>{favorites.length}件のレシピを保存中</Text>
        )}
      </LinearGradient>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
        {!favLoaded ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤍</Text>
            <Text style={styles.emptyText}>
              お気に入りはまだありません{'\n'}
              レシピカードの 🤍 をタップして保存できます
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* ツールバー */}
            <View style={styles.toolbar}>
              <Text style={styles.toolbarText}>{favorites.length}件のお気に入り</Text>
              {!showClearConfirm ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setShowClearConfirm(true)}
                >
                  <Text style={styles.clearBtnText}>すべて解除</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText}>本当に？</Text>
                  <TouchableOpacity
                    style={styles.confirmYes}
                    onPress={() => {
                      clearAllFavorites();
                      setShowClearConfirm(false);
                    }}
                  >
                    <Text style={styles.confirmYesText}>はい</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmNo}
                    onPress={() => setShowClearConfirm(false)}
                  >
                    <Text style={styles.confirmNoText}>いいえ</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* お気に入り一覧 */}
            {favorites.map((r, i) => (
              <View key={r.id}>
                {r.savedAt && (
                  <Text style={styles.savedAt}>📅 {r.savedAt} に保存</Text>
                )}
                <RecipeCard
                  recipe={r as unknown as Record<string, unknown> & { name: string }}
                  index={i}
                  isWeb={r.isWeb}
                  isFav={true}
                  onToggleFav={() => toggleFavorite(r as unknown as Record<string, unknown>, r.isWeb)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: { padding: 20, paddingTop: 18, paddingBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white', fontFamily: FONTS.serifBold },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontFamily: FONTS.sans,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  loadingText: { color: '#999', fontSize: 14, fontFamily: FONTS.sans },

  emptyState: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 15,
    color: '#A1887F',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: FONTS.sans,
  },

  content: { padding: 20 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toolbarText: { fontSize: 13, color: '#888', fontFamily: FONTS.sans },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#E0D5CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  clearBtnText: { fontSize: 12, color: '#999', fontFamily: FONTS.sans },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { fontSize: 12, color: '#C62828', fontFamily: FONTS.sans },
  confirmYes: {
    backgroundColor: '#C62828',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmYesText: { color: 'white', fontSize: 12, fontFamily: FONTS.sans },
  confirmNo: {
    borderWidth: 1,
    borderColor: '#E0D5CC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmNoText: { color: '#888', fontSize: 12, fontFamily: FONTS.sans },
  savedAt: { fontSize: 11, color: '#BCAAA4', marginBottom: 4, fontFamily: FONTS.sans },
});
