import React from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { deleteDevice, disposeDevice, fetchDevice } from '../../api/devices';
import { deleteSpec, deleteLink, deleteMaintenance, deleteRepair, deleteConsumable, deleteAccessory } from '../../api/children';
import { Card } from '../../components/Card';
import { Section } from '../../components/Section';
import { InfoRow } from '../../components/InfoRow';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { COLORS, RADIUS, SPACING } from '../../theme';
import {
  LINK_TYPE_LABELS,
  MAINTENANCE_TYPE_LABELS,
  REPAIR_STATUS_LABELS,
  CONNECTION_TYPE_LABELS,
} from '@homegear/shared';
import type { DevicesStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DevicesStackParamList, 'DeviceDetail'>;
type Rt = RouteProp<DevicesStackParamList, 'DeviceDetail'>;

const DeviceDetailScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { deviceId } = route.params;

  const query = useQuery({ queryKey: ['device', deviceId], queryFn: () => fetchDevice(deviceId) });
  const d = query.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['device', deviceId] });
    qc.invalidateQueries({ queryKey: ['devices'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const disposeMutation = useMutation({
    mutationFn: () => disposeDevice(deviceId),
    onSuccess: () => {
      invalidate();
      Alert.alert('完了', '廃棄済みに変更しました');
    },
    onError: (e: any) => Alert.alert('エラー', e?.response?.data?.message ?? String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDevice(deviceId),
    onSuccess: () => {
      invalidate();
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('エラー', e?.response?.data?.message ?? String(e)),
  });

  const childDeleteMutation = useMutation({
    mutationFn: async (op: { kind: 'spec' | 'link' | 'maintenance' | 'repair' | 'consumable' | 'accessory'; id: string }) => {
      switch (op.kind) {
        case 'spec':
          return deleteSpec(op.id);
        case 'link':
          return deleteLink(op.id);
        case 'maintenance':
          return deleteMaintenance(op.id);
        case 'repair':
          return deleteRepair(op.id);
        case 'consumable':
          return deleteConsumable(op.id);
        case 'accessory':
          return deleteAccessory(op.id);
      }
    },
    onSuccess: () => invalidate(),
  });

  const confirmDispose = () => {
    Alert.alert('廃棄済みに変更', 'この機器を廃棄済みに変更します。よろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '廃棄済みにする', style: 'destructive', onPress: () => disposeMutation.mutate() },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert('完全削除', 'この機器を物理削除します（履歴も含めて消えます）。よろしいですか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (query.isLoading || !d) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const openUrl = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('エラー', 'URLを開けませんでした'));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={COLORS.primary} />}
    >
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{d.name}</Text>
          <StatusBadge status={d.status} />
        </View>
        <Text style={styles.meta}>
          {d.category?.name ?? '未分類'} / {d.location?.name ?? '場所未設定'}
        </Text>
        <View style={styles.actionsRow}>
          <ActionButton icon="create" label="編集" onPress={() => navigation.navigate('DeviceForm', { deviceId })} />
          <ActionButton icon="sparkles" label="AI取込" onPress={() => navigation.navigate('AiImportFromDevice', { deviceId })} />
          <ActionButton icon="trash" label="廃棄" onPress={confirmDispose} />
        </View>
      </Card>

      <Section title="基本情報">
        <Card>
          <InfoRow label="メーカー" value={d.manufacturer} />
          <InfoRow label="型番" value={d.modelNumber} />
          <InfoRow label="シリアル番号" value={d.serialNumber} />
          <InfoRow label="優先度" value={d.priority} />
        </Card>
      </Section>

      <Section title="購入情報">
        <Card>
          <InfoRow label="購入日" value={d.purchaseDate} />
          <InfoRow label="購入店舗" value={d.purchaseStore} />
          <InfoRow label="購入価格" value={d.purchasePrice != null ? `¥${d.purchasePrice.toLocaleString()}` : null} />
          <InfoRow label="注文番号" value={d.orderNumber} />
          {d.purchaseUrl ? (
            <TouchableOpacity onPress={() => openUrl(d.purchaseUrl)}>
              <Text style={styles.linkText}>購入ページを開く</Text>
            </TouchableOpacity>
          ) : null}
        </Card>
      </Section>

      <Section title="保証情報">
        <Card>
          <InfoRow label="保証開始日" value={d.warrantyStartDate} />
          <InfoRow label="保証終了日" value={d.warrantyEndDate} />
          <InfoRow label="延長保証" value={d.hasExtendedWarranty ? 'あり' : 'なし'} />
          <InfoRow label="保証メモ" value={d.warrantyMemo} />
        </Card>
      </Section>

      <Section
        title="スペック"
        action={
          <SmallAddButton onPress={() => navigation.navigate('SpecForm', { deviceId })} />
        }
      >
        {d.specs.length === 0 ? (
          <Card>
            <Text style={styles.empty}>スペック情報はまだ登録されていません</Text>
          </Card>
        ) : (
          d.specs.map((s) => (
            <Card key={s.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{s.specName}</Text>
                  <Text style={styles.itemValue}>
                    {[s.specValue, s.unit].filter(Boolean).join(' ') || '—'}
                  </Text>
                  {s.memo ? <Text style={styles.itemMemo}>{s.memo}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('SpecForm', { deviceId, specId: s.id })}
                  onDelete={() =>
                    Alert.alert('削除確認', `${s.specName} を削除しますか？`, [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '削除', style: 'destructive', onPress: () => childDeleteMutation.mutate({ kind: 'spec', id: s.id }) },
                    ])
                  }
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="関連リンク"
        action={<SmallAddButton onPress={() => navigation.navigate('LinkForm', { deviceId })} />}
      >
        {d.links.length === 0 ? (
          <Card>
            <Text style={styles.empty}>リンクはまだ登録されていません</Text>
          </Card>
        ) : (
          d.links.map((l) => (
            <Card key={l.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{LINK_TYPE_LABELS[l.linkType as keyof typeof LINK_TYPE_LABELS] ?? l.linkType}</Text>
                  {l.title ? <Text style={styles.itemValue}>{l.title}</Text> : null}
                  <TouchableOpacity onPress={() => openUrl(l.url)}>
                    <Text style={styles.linkText} numberOfLines={2}>
                      {l.url}
                    </Text>
                  </TouchableOpacity>
                  {l.memo ? <Text style={styles.itemMemo}>{l.memo}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('LinkForm', { deviceId, linkId: l.id })}
                  onDelete={() => childDeleteMutation.mutate({ kind: 'link', id: l.id })}
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="メンテナンス履歴"
        action={<SmallAddButton onPress={() => navigation.navigate('MaintenanceForm', { deviceId })} />}
      >
        {d.maintenanceRecords.length === 0 ? (
          <Card>
            <Text style={styles.empty}>履歴はまだありません</Text>
          </Card>
        ) : (
          d.maintenanceRecords.map((r) => (
            <Card key={r.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {r.maintenanceDate} ・ {MAINTENANCE_TYPE_LABELS[r.maintenanceType as keyof typeof MAINTENANCE_TYPE_LABELS] ?? r.maintenanceType}
                  </Text>
                  {r.description ? <Text style={styles.itemValue}>{r.description}</Text> : null}
                  {r.nextDueDate ? <Text style={styles.itemMemo}>次回予定: {r.nextDueDate}</Text> : null}
                  {r.cost != null ? <Text style={styles.itemMemo}>費用: ¥{r.cost.toLocaleString()}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('MaintenanceForm', { deviceId, recordId: r.id })}
                  onDelete={() => childDeleteMutation.mutate({ kind: 'maintenance', id: r.id })}
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="修理履歴"
        action={<SmallAddButton onPress={() => navigation.navigate('RepairForm', { deviceId })} />}
      >
        {d.repairRecords.length === 0 ? (
          <Card>
            <Text style={styles.empty}>履歴はまだありません</Text>
          </Card>
        ) : (
          d.repairRecords.map((r) => (
            <Card key={r.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {r.occurredDate} ・ {REPAIR_STATUS_LABELS[r.status as keyof typeof REPAIR_STATUS_LABELS] ?? r.status}
                  </Text>
                  {r.symptom ? <Text style={styles.itemValue}>症状: {r.symptom}</Text> : null}
                  {r.actionTaken ? <Text style={styles.itemMemo}>対応: {r.actionTaken}</Text> : null}
                  {r.cost != null ? <Text style={styles.itemMemo}>費用: ¥{r.cost.toLocaleString()}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('RepairForm', { deviceId, recordId: r.id })}
                  onDelete={() => childDeleteMutation.mutate({ kind: 'repair', id: r.id })}
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="消耗品"
        action={<SmallAddButton onPress={() => navigation.navigate('ConsumableForm', { deviceId })} />}
      >
        {d.consumables.length === 0 ? (
          <Card>
            <Text style={styles.empty}>消耗品はまだ登録されていません</Text>
          </Card>
        ) : (
          d.consumables.map((c) => (
            <Card key={c.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{c.name}</Text>
                  <Text style={styles.itemValue}>
                    {[c.manufacturer, c.modelNumber].filter(Boolean).join(' / ') || '—'}
                  </Text>
                  {c.replacementIntervalText ? <Text style={styles.itemMemo}>交換目安: {c.replacementIntervalText}</Text> : null}
                  {c.nextReplacementDate ? <Text style={styles.itemMemo}>次回交換: {c.nextReplacementDate}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('ConsumableForm', { deviceId, consumableId: c.id })}
                  onDelete={() => childDeleteMutation.mutate({ kind: 'consumable', id: c.id })}
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="付属品"
        action={<SmallAddButton onPress={() => navigation.navigate('AccessoryForm', { deviceId })} />}
      >
        {d.accessories.length === 0 ? (
          <Card>
            <Text style={styles.empty}>付属品はまだ登録されていません</Text>
          </Card>
        ) : (
          d.accessories.map((a) => (
            <Card key={a.id}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {a.name}
                    {a.quantity != null ? ` × ${a.quantity}` : ''}
                  </Text>
                  {a.storageLocation ? <Text style={styles.itemMemo}>保管場所: {a.storageLocation}</Text> : null}
                  {a.memo ? <Text style={styles.itemMemo}>{a.memo}</Text> : null}
                </View>
                <RowActions
                  onEdit={() => navigation.navigate('AccessoryForm', { deviceId, accessoryId: a.id })}
                  onDelete={() => childDeleteMutation.mutate({ kind: 'accessory', id: a.id })}
                />
              </View>
            </Card>
          ))
        )}
      </Section>

      <Section
        title="ネットワーク情報"
        action={<SmallAddButton onPress={() => navigation.navigate('NetworkInfoForm', { deviceId })} />}
      >
        <Card>
          {d.networkInfo ? (
            <>
              <InfoRow label="IPアドレス" value={d.networkInfo.ipAddress} />
              <InfoRow label="ホスト名" value={d.networkInfo.hostName} />
              <InfoRow label="MACアドレス" value={d.networkInfo.macAddress} />
              <InfoRow label="管理URL" value={d.networkInfo.adminUrl} />
              <InfoRow label="ポート" value={d.networkInfo.port} />
              <InfoRow
                label="接続方式"
                value={
                  d.networkInfo.connectionType
                    ? CONNECTION_TYPE_LABELS[d.networkInfo.connectionType as keyof typeof CONNECTION_TYPE_LABELS] ?? d.networkInfo.connectionType
                    : null
                }
              />
              <InfoRow label="認証情報の保管先" value={d.networkInfo.credentialStorageMemo} />
              <InfoRow label="設定メモ" value={d.networkInfo.settingsMemo} />
            </>
          ) : (
            <Text style={styles.empty}>ネットワーク情報は未登録です</Text>
          )}
        </Card>
      </Section>

      <Section title="メモ">
        <Card>
          <Text style={{ color: COLORS.text }}>{d.memo || '—'}</Text>
        </Card>
      </Section>

      <Button title="この機器を完全削除（誤登録用）" onPress={confirmDelete} variant="danger" />
      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

const SmallAddButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.smallAdd}>
    <Ionicons name="add" size={16} color="#fff" />
    <Text style={styles.smallAddText}>追加</Text>
  </TouchableOpacity>
);

const ActionButton: React.FC<{ icon: any; label: string; onPress: () => void }> = ({ icon, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const RowActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <View style={{ flexDirection: 'row', marginLeft: SPACING.sm }}>
    <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
      <Ionicons name="create-outline" size={20} color={COLORS.textSub} />
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  meta: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },
  actionsRow: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.md },
  actionBtn: { alignItems: 'center', padding: SPACING.sm },
  actionLabel: { color: COLORS.primary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  smallAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  smallAddText: { color: '#fff', marginLeft: 2, fontSize: 12, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemValue: { fontSize: 13, color: COLORS.text, marginTop: 2 },
  itemMemo: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  iconBtn: { padding: 4 },
  empty: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.sm },
  linkText: { color: COLORS.primary, fontSize: 13, marginTop: 4, textDecorationLine: 'underline' },
});

export default DeviceDetailScreen;
