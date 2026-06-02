import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { fetchAssets, type AssetSummary } from '../../api/assets';
import { fetchCategories, fetchLocations } from '../../api/master';
import { Card } from '../../components/Card';
import { ChipSelector } from '../../components/ChipSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { AssetTypeBadge } from '../../components/AssetTypeBadge';
import { COLORS, RADIUS, SPACING } from '../../theme';
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
} from '@homeasset/shared';
import type { AssetsStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AssetsStackParamList, 'AssetList'>;

const AssetListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount =
    (assetType ? 1 : 0) + (categoryId ? 1 : 0) + (locationId ? 1 : 0) + (status ? 1 : 0);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: fetchLocations });

  const assetsQuery = useQuery({
    queryKey: ['assets', search, assetType, categoryId, locationId, status],
    queryFn: () =>
      fetchAssets({
        search: search || undefined,
        assetType: (assetType as any) || undefined,
        categoryId: categoryId || undefined,
        locationId: locationId || undefined,
        status: (status as any) || undefined,
      }),
  });

  const assetTypeOptions = ASSET_TYPES.map((t) => ({ value: t, label: ASSET_TYPE_LABELS[t] }));
  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesQuery.data]
  );
  const locationOptions = useMemo(
    () => (locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.name })),
    [locationsQuery.data]
  );
  const statusOptions = ASSET_STATUSES.map((s) => ({ value: s, label: ASSET_STATUS_LABELS[s] }));

  const renderItem = ({ item }: { item: AssetSummary }) => (
    <TouchableOpacity onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })}>
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <AssetTypeBadge assetType={item.assetType} />
              <View style={{ width: 4 }} />
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.meta}>
              {item.category?.name ?? '未分類'} / {item.location?.name ?? '場所未設定'}
            </Text>
            <Text style={styles.meta}>
              {[item.manufacturer, item.modelNumber].filter(Boolean).join(' / ') ||
                '型番情報なし'}
            </Text>
            {item.warrantyEndDate ? (
              <Text style={styles.meta}>保証期限: {item.warrantyEndDate}</Text>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="名称・メーカー・型番・施工業者で検索"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setFilterOpen((v) => !v)}
          accessibilityLabel={filterOpen ? '絞り込みを閉じる' : '絞り込みを開く'}
        >
          <Ionicons
            name={filterOpen ? 'close' : 'options-outline'}
            size={20}
            color={activeFilterCount > 0 ? COLORS.primary : COLORS.textMuted}
          />
          {activeFilterCount > 0 && !filterOpen ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      {filterOpen ? (
        <View style={{ paddingHorizontal: SPACING.md }}>
          <ChipSelector
            label="管理対象種別"
            options={assetTypeOptions}
            value={assetType}
            onChange={setAssetType}
            allowClear
          />
          <ChipSelector
            label="カテゴリ"
            options={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            allowClear
          />
          <ChipSelector
            label="設置場所"
            options={locationOptions}
            value={locationId}
            onChange={setLocationId}
            allowClear
          />
          <ChipSelector
            label="ステータス"
            options={statusOptions}
            value={status}
            onChange={setStatus}
            allowClear
          />
        </View>
      ) : null}

      {assetsQuery.isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
      ) : (
        <FlatList
          data={assetsQuery.data ?? []}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={assetsQuery.isRefetching}
              onRefresh={() => assetsQuery.refetch()}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>該当する資産がありません</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AssetForm', {})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  filterToggle: { marginLeft: 6, padding: 4, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  badgeRow: { flexDirection: 'row', marginTop: 4, marginBottom: 2 },
  meta: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xxl },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AssetListScreen;
