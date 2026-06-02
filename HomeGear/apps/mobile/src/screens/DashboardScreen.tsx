import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchDashboard } from '../api/dashboard';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { COLORS, SPACING } from '../theme';
import type { DashboardDeviceSummary } from '@homegear/shared';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const goDevice = useCallback(
    (id: string) => {
      navigation.navigate('DevicesTab', { screen: 'DeviceDetail', params: { deviceId: id } });
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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={COLORS.primary} />}
    >
      <Card>
        <Text style={styles.totalLabel}>登録機器数</Text>
        <Text style={styles.totalValue}>{data?.deviceCount ?? 0}</Text>
        <TouchableOpacity
          style={styles.quickAdd}
          onPress={() =>
            navigation.navigate('DevicesTab', { screen: 'DeviceForm', params: {} })
          }
        >
          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
          <Text style={styles.quickAddText}>機器を追加</Text>
        </TouchableOpacity>
      </Card>

      <DeviceSection
        title="🛠️ 修理中・故障中"
        emptyText="修理中・故障中の機器はありません"
        devices={data?.brokenDevices ?? []}
        onPress={goDevice}
      />
      <DeviceSection
        title="⚠️ 保証期限が近い（30日以内）"
        emptyText="該当機器はありません"
        devices={data?.warrantyExpiringSoonDevices ?? []}
        onPress={goDevice}
      />
      <DeviceSection
        title="🔧 メンテナンス予定が近い"
        emptyText="予定はありません"
        devices={data?.upcomingMaintenanceDevices ?? []}
        onPress={goDevice}
        showNext
      />
      <DeviceSection
        title="❌ 保証期限切れ"
        emptyText="期限切れの機器はありません"
        devices={data?.warrantyExpiredDevices ?? []}
        onPress={goDevice}
      />
      <DeviceSection
        title="ℹ️ 情報不足の機器"
        emptyText="情報不足の機器はありません"
        devices={data?.incompleteDevices ?? []}
        onPress={goDevice}
      />
      <DeviceSection
        title="🆕 最近更新した機器"
        emptyText="まだ機器が登録されていません"
        devices={data?.recentDevices ?? []}
        onPress={goDevice}
      />
    </ScrollView>
  );
};

const DeviceSection: React.FC<{
  title: string;
  emptyText: string;
  devices: DashboardDeviceSummary[];
  onPress: (id: string) => void;
  showNext?: boolean;
}> = ({ title, emptyText, devices, onPress, showNext }) => (
  <View style={{ marginBottom: SPACING.md }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {devices.length === 0 ? (
      <Card>
        <Text style={styles.empty}>{emptyText}</Text>
      </Card>
    ) : (
      devices.map((d) => (
        <TouchableOpacity key={d.id + (showNext ? '_' + d.nextMaintenanceDate : '')} onPress={() => onPress(d.id)}>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Text style={styles.deviceMeta}>
                  {d.categoryName ?? '未分類'} / {d.locationName ?? '場所未設定'}
                </Text>
                {d.warrantyEndDate ? (
                  <Text style={styles.deviceMeta}>保証期限: {d.warrantyEndDate}</Text>
                ) : null}
                {showNext && d.nextMaintenanceDate ? (
                  <Text style={styles.deviceMeta}>次回予定: {d.nextMaintenanceDate}</Text>
                ) : null}
              </View>
              <StatusBadge status={d.status} />
            </View>
          </Card>
        </TouchableOpacity>
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  totalLabel: { fontSize: 13, color: COLORS.textSub },
  totalValue: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  quickAdd: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  quickAddText: { color: COLORS.primary, marginLeft: 4, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm, color: COLORS.text },
  empty: { color: COLORS.textMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  deviceName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  deviceMeta: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
});

export default DashboardScreen;
