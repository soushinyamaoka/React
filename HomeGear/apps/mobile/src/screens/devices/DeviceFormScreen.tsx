import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { ChipSelector } from '../../components/ChipSelector';
import { Section } from '../../components/Section';
import { COLORS, SPACING } from '../../theme';
import { createDevice, fetchDevice, updateDevice } from '../../api/devices';
import { fetchCategories, fetchLocations } from '../../api/master';
import {
  DEVICE_STATUSES,
  DEVICE_STATUS_LABELS,
  DEVICE_PRIORITIES,
  DEVICE_PRIORITY_LABELS,
  type DeviceInput,
} from '@homegear/shared';
import type { DevicesStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<DevicesStackParamList, 'DeviceForm'>;
type Rt = RouteProp<DevicesStackParamList, 'DeviceForm'>;

const DeviceFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const deviceId = route.params?.deviceId;
  const qc = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: fetchLocations });

  const existingQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId!),
    enabled: !!deviceId,
  });

  const [form, setForm] = useState<DeviceInput>({
    name: '',
    status: 'in_use',
    priority: 'medium',
  } as DeviceInput);

  useEffect(() => {
    navigation.setOptions({ title: deviceId ? '機器編集' : '機器登録' });
  }, [deviceId, navigation]);

  useEffect(() => {
    if (existingQuery.data) {
      const d = existingQuery.data;
      setForm({
        name: d.name,
        categoryId: d.categoryId,
        manufacturer: d.manufacturer ?? undefined,
        modelNumber: d.modelNumber ?? undefined,
        serialNumber: d.serialNumber ?? undefined,
        locationId: d.locationId,
        status: d.status as any,
        priority: d.priority as any,
        purchaseDate: d.purchaseDate ?? undefined,
        purchaseStore: d.purchaseStore ?? undefined,
        purchasePrice: d.purchasePrice ?? undefined,
        purchaseUrl: d.purchaseUrl ?? undefined,
        orderNumber: d.orderNumber ?? undefined,
        warrantyStartDate: d.warrantyStartDate ?? undefined,
        warrantyEndDate: d.warrantyEndDate ?? undefined,
        hasExtendedWarranty: d.hasExtendedWarranty,
        warrantyMemo: d.warrantyMemo ?? undefined,
        manualUrl: d.manualUrl ?? undefined,
        supportUrl: d.supportUrl ?? undefined,
        officialUrl: d.officialUrl ?? undefined,
        photoUrl: d.photoUrl ?? undefined,
        labelPhotoUrl: d.labelPhotoUrl ?? undefined,
        installationPhotoUrl: d.installationPhotoUrl ?? undefined,
        memo: d.memo ?? undefined,
      } as DeviceInput);
    }
  }, [existingQuery.data]);

  const mutation = useMutation({
    mutationFn: async (input: DeviceInput) => {
      if (deviceId) return updateDevice(deviceId, input);
      return createDevice(input);
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['devices'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (deviceId) await qc.invalidateQueries({ queryKey: ['device', deviceId] });
      if (deviceId) {
        navigation.goBack();
      } else {
        // 新規作成後は詳細へ
        navigation.replace('DeviceDetail', { deviceId: data.id });
      }
    },
    onError: (e: any) => {
      Alert.alert('保存失敗', e?.response?.data?.message ?? String(e));
    },
  });

  const set = <K extends keyof DeviceInput>(key: K, value: DeviceInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = () => {
    if (!form.name?.trim()) {
      Alert.alert('入力エラー', '機器名を入力してください');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Section title="基本情報">
          <TextField
            label="機器名 *"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="例: リビングのテレビ"
          />
          <ChipSelector
            label="カテゴリ"
            options={(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={form.categoryId ?? null}
            onChange={(v) => set('categoryId', v)}
            allowClear
          />
          <TextField
            label="メーカー"
            value={form.manufacturer ?? ''}
            onChangeText={(v) => set('manufacturer', v)}
          />
          <TextField
            label="型番"
            value={form.modelNumber ?? ''}
            onChangeText={(v) => set('modelNumber', v)}
          />
          <TextField
            label="シリアル番号"
            value={form.serialNumber ?? ''}
            onChangeText={(v) => set('serialNumber', v)}
          />
          <ChipSelector
            label="設置場所"
            options={(locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
            value={form.locationId ?? null}
            onChange={(v) => set('locationId', v)}
            allowClear
          />
          <ChipSelector
            label="ステータス"
            options={DEVICE_STATUSES.map((s) => ({ value: s, label: DEVICE_STATUS_LABELS[s] }))}
            value={form.status}
            onChange={(v) => v && set('status', v as any)}
          />
          <ChipSelector
            label="優先度"
            options={DEVICE_PRIORITIES.map((s) => ({ value: s, label: DEVICE_PRIORITY_LABELS[s] }))}
            value={form.priority}
            onChange={(v) => v && set('priority', v as any)}
          />
        </Section>

        <Section title="購入情報">
          <DateField
            label="購入日"
            value={form.purchaseDate ?? ''}
            onChange={(v) => set('purchaseDate', v)}
          />
          <TextField
            label="購入店舗"
            value={form.purchaseStore ?? ''}
            onChangeText={(v) => set('purchaseStore', v)}
          />
          <TextField
            label="購入価格 (円)"
            value={form.purchasePrice == null ? '' : String(form.purchasePrice)}
            onChangeText={(v) => set('purchasePrice', v as any)}
            keyboardType="numeric"
          />
          <TextField
            label="購入ページURL"
            value={form.purchaseUrl ?? ''}
            onChangeText={(v) => set('purchaseUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="注文番号"
            value={form.orderNumber ?? ''}
            onChangeText={(v) => set('orderNumber', v)}
          />
        </Section>

        <Section title="保証情報">
          <DateField
            label="保証開始日"
            value={form.warrantyStartDate ?? ''}
            onChange={(v) => set('warrantyStartDate', v)}
          />
          <DateField
            label="保証終了日"
            value={form.warrantyEndDate ?? ''}
            onChange={(v) => set('warrantyEndDate', v)}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>延長保証あり</Text>
            <Switch
              value={form.hasExtendedWarranty ?? false}
              onValueChange={(v) => set('hasExtendedWarranty', v)}
              trackColor={{ true: COLORS.primaryLight, false: COLORS.border }}
              thumbColor={form.hasExtendedWarranty ? COLORS.primary : '#fff'}
            />
          </View>
          <TextField
            label="保証メモ"
            value={form.warrantyMemo ?? ''}
            onChangeText={(v) => set('warrantyMemo', v)}
            multiline
          />
        </Section>

        <Section title="リンク・写真">
          <TextField
            label="取扱説明書URL"
            value={form.manualUrl ?? ''}
            onChangeText={(v) => set('manualUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="メーカー公式ページURL"
            value={form.officialUrl ?? ''}
            onChangeText={(v) => set('officialUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="サポートページURL"
            value={form.supportUrl ?? ''}
            onChangeText={(v) => set('supportUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="機器写真URL"
            value={form.photoUrl ?? ''}
            onChangeText={(v) => set('photoUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="型番ラベル写真URL"
            value={form.labelPhotoUrl ?? ''}
            onChangeText={(v) => set('labelPhotoUrl', v)}
            autoCapitalize="none"
          />
          <TextField
            label="設置状況写真URL"
            value={form.installationPhotoUrl ?? ''}
            onChangeText={(v) => set('installationPhotoUrl', v)}
            autoCapitalize="none"
          />
        </Section>

        <Section title="メモ">
          <TextField
            label="自由メモ"
            value={form.memo ?? ''}
            onChangeText={(v) => set('memo', v)}
            multiline
          />
        </Section>

        <Button title={deviceId ? '更新する' : '登録する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg, paddingBottom: SPACING.xxl },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  switchLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
});

export default DeviceFormScreen;
