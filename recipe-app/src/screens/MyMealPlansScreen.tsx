import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useMealPlans, MyMealPlan, getDayLabel } from '../hooks/useMealPlans';
import { FONTS } from '../constants/fonts';

type Props = {
  onSelect: (planId: string) => void;
  onCreate: () => void;
};

export default function MyMealPlansScreen({ onSelect, onCreate }: Props) {
  const { plans, loading, deletePlan } = useMealPlans();
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const handleDelete = (plan: MyMealPlan) => {
    Alert.alert(
      '削除確認',
      `「${plan.title}」を削除しますか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
          onPress: () => swipeableRefs.current.get(plan.id)?.close(),
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deletePlan(plan.id),
        },
      ]
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    plan: MyMealPlan,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [-100, -20, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.swipeAction, { opacity }]}>
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDelete(plan)}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 4 }}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Text style={styles.swipeDeleteText}>削除</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: MyMealPlan }) => {
    const dayCount = item.days.length;
    const filledCount = item.days.filter(
      (d) => d.recipe || d.webRecipe || d.memo || d.customUrl
    ).length;
    const recipeNames = item.days
      .slice(0, 3)
      .map((d) => d.customTitle || d.recipe?.name || d.webRecipe?.name || d.memo || '---')
      .join('、');

    const firstDay = item.days[0];
    const lastDay = item.days[item.days.length - 1];
    const dateRange = firstDay?.date && lastDay?.date
      ? `${getDayLabel(firstDay)} 〜 ${getDayLabel(lastDay)}`
      : null;

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        overshootRight={false}
        rightThreshold={60}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{filledCount}/{dayCount}日</Text>
            </View>
          </View>
          {dateRange && (
            <View style={styles.dateRangeRow}>
              <Ionicons name="calendar-outline" size={13} color="#E65100" />
              <Text style={styles.dateRangeText}>{dateRange}</Text>
            </View>
          )}
          <Text style={styles.cardPreview} numberOfLines={1}>{recipeNames}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardDate}>作成: {formatDate(item.createdAt)}</Text>
            {item.updatedAt !== item.createdAt && (
              <Text style={styles.cardDate}>更新: {formatDate(item.updatedAt)}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient colors={['#BF360C', '#E65100', '#FF8A65']} style={styles.header}>
          <Text style={styles.headerTitle}>献立管理</Text>
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E65100" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#BF360C', '#E65100', '#FF8A65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextArea}>
            <Text style={styles.headerTitle}>献立管理</Text>
            <Text style={styles.headerSub}>あなたの献立を作成・管理</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreate}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#E65100" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {plans.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color="#BCAAA4" />
          <Text style={styles.emptyTitle}>献立がまだありません</Text>
          <Text style={styles.emptySubtext}>
            新しい献立を作成して{'\n'}毎日のメニューを管理しましょう
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={onCreate}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.emptyCreateButtonText}>新しい献立を作成</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { padding: 28, paddingTop: 24, paddingBottom: 20, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextArea: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: 'white', marginBottom: 6, fontFamily: FONTS.serifBold },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FONTS.sans },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#666', fontFamily: FONTS.sans },
  emptySubtext: { marginTop: 8, fontSize: 14, color: '#999', textAlign: 'center', fontFamily: FONTS.sans },
  emptyCreateButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E65100',
  },
  emptyCreateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans },
  list: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    fontFamily: FONTS.serifBold,
  },
  dayBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E65100',
    fontFamily: FONTS.sans,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    fontFamily: FONTS.sans,
  },
  cardPreview: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontFamily: FONTS.sans,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  cardDate: {
    fontSize: 11,
    color: '#BCAAA4',
    fontFamily: FONTS.sans,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  swipeDeleteButton: {
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 14,
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.sans,
  },
});
