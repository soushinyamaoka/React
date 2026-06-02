import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchDashboard, type DashboardAssetSummary } from '../api/dashboard';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { AssetTypeBadge } from '../components/AssetTypeBadge';
import { COLORS, SPACING } from '../theme';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const goAsset = useCallback(
    (id: string) => {
      navigation.navigate('AssetsTab', { screen: 'AssetDetail', params: { assetId: id } });
    },
    [navigation]
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={COLORS.primary}
        />
      }
    >
      <Card>
        <Text style={styles.totalLabel}>登録資産数</Text>
        <Text style={styles.totalValue}>{data?.assetCount ?? 0}</Text>
        <TouchableOpacity
          style={styles.quickAdd}
          onPress={() => navigation.navigate('AssetsTab', { screen: 'AssetForm', params: {} })}
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.quickAddText}>資産を追加</Text>
        </TouchableOpacity>
      </Card>

      <AssetSection
        title="🛠️ 修理中・故障中"
        emptyText="修理中・故障中の資産はありません"
        assets={data?.brokenAssets ?? []}
        onPress={goAsset}
      />
      <AssetSection
        title="⚠️ 保証期限が近い（30日以内）"
        emptyText="該当資産はありません"
        assets={data?.warrantyExpiringSoonAssets ?? []}
        onPress={goAsset}
      />
      <AssetSection
        title="🔧 メンテナンス予定が近い"
        emptyText="予定はありません"
        assets={data?.upcomingMaintenanceAssets ?? []}
        onPress={goAsset}
        showNext
      />
      <AssetSection
        title="🔁 交換予定の資産"
        emptyText="交換予定はありません"
        assets={data?.replacementPlannedAssets ?? []}
        onPress={goAsset}
      />
      <AssetSection
        title="❌ 保証期限切れ"
        emptyText="期限切れの資産はありません"
        assets={data?.warrantyExpiredAssets ?? []}
        onPress={goAsset}
      />
      <AssetSection
        title="ℹ️ 情報不足の資産"
        emptyText="情報不足の資産はありません"
        assets={data?.incompleteAssets ?? []}
        onPress={goAsset}
      />
      <AssetSection
        title="🆕 最近更新した資産"
        emptyText="まだ資産が登録されていません"
        assets={data?.recentAssets ?? []}
        onPress={goAsset}
      />
    </ScrollView>
  );
};

const AssetSection: React.FC<{
  title: string;
  emptyText: string;
  assets: DashboardAssetSummary[];
  onPress: (id: string) => void;
  showNext?: boolean;
}> = ({ title, emptyText, assets, onPress, showNext }) => (
  <View style={{ marginBottom: SPACING.md }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {assets.length === 0 ? (
      <Card>
        <Text style={styles.empty}>{emptyText}</Text>
      </Card>
    ) : (
      assets.map((d) => (
        <TouchableOpacity
          key={d.id + (showNext ? '_' + d.nextMaintenanceDate : '')}
          onPress={() => onPress(d.id)}
        >
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.assetName}>{d.name}</Text>
                <View style={styles.badgeRow}>
                  <AssetTypeBadge assetType={d.assetType} />
                  <View style={{ width: 4 }} />
                  <StatusBadge status={d.status} />
                </View>
                <Text style={styles.assetMeta}>
                  {d.categoryName ?? '未分類'} / {d.locationName ?? '場所未設定'}
                </Text>
                {d.warrantyEndDate ? (
                  <Text style={styles.assetMeta}>保証期限: {d.warrantyEndDate}</Text>
                ) : null}
                {showNext && d.nextMaintenanceDate ? (
                  <Text style={styles.assetMeta}>次回予定: {d.nextMaintenanceDate}</Text>
                ) : null}
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  totalLabel: { fontSize: 13, color: COLORS.textSub },
  totalValue: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  quickAdd: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  quickAddText: { color: COLORS.primary, marginLeft: 4, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm, color: COLORS.text },
  empty: { color: COLORS.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  assetName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  assetMeta: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
});

export default DashboardScreen;
