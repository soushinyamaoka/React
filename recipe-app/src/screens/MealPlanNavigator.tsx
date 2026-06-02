import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlans } from '../hooks/useMealPlans';
import { FONTS } from '../constants/fonts';
import MyMealPlanEditScreen from './MyMealPlanEditScreen';
import MealPlanCreateScreen from './MealPlanCreateScreen';

export default function MealPlanNavigator() {
  const { plans, loading, clearAllPlans } = useMealPlans();
  const [view, setView] = useState<'main' | 'create'>('main');

  const handleCreated = () => {
    setView('main');
  };

  const currentPlanId = plans.length > 0 ? plans[0].id : undefined;

  const handleClearAll = () => {
    Alert.alert(
      '献立を削除',
      'すべての献立データを削除しますか？\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: () => clearAllPlans() },
      ]
    );
  };

  // 作成画面
  if (view === 'create') {
    return (
      <MealPlanCreateScreen
        onBack={() => setView('main')}
        onCreated={handleCreated}
        existingPlanId={currentPlanId}
      />
    );

  }

  // ローディング
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

  // 献立がない場合
  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={['#BF360C', '#E65100', '#FF8A65']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>献立管理</Text>
        </LinearGradient>
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={64} color="#BCAAA4" />
          <Text style={styles.emptyTitle}>献立がまだありません</Text>
          <Text style={styles.emptySubtext}>
            新しい献立を作成して{'\n'}毎日のメニューを管理しましょう
          </Text>
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={() => setView('create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.emptyCreateButtonText}>新しい献立を作成</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlan = plans[0];

  // 献立がある場合 → グラデーションヘッダー + 直接編集画面
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#BF360C', '#E65100', '#FF8A65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>献立管理</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setView('create')} activeOpacity={0.8}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>追加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={15} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <MyMealPlanEditScreen planId={currentPlan.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: 'white', fontFamily: FONTS.serifBold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.sans },
  clearAllBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ローディング・空状態
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
});
