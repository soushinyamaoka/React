import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { ChipSelector } from '../../components/ChipSelector';
import { COLORS, SPACING } from '../../theme';
import { createMaintenance, updateMaintenance } from '../../api/children';
import { fetchDevice } from '../../api/devices';
import { MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABELS } from '@homegear/shared';
import type { DevicesStackParamList } from '../../navigation/types';

type Rt = RouteProp<DevicesStackParamList, 'MaintenanceForm'>;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MaintenanceFormScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { deviceId, recordId } = route.params;

  const [maintenanceDate, setMaintenanceDate] = useState(todayStr());
  const [maintenanceType, setMaintenanceType] = useState<string>('cleaning');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [memo, setMemo] = useState('');

  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    enabled: !!recordId,
  });

  useEffect(() => {
    navigation.setOptions({ title: recordId ? 'メンテナンス編集' : 'メンテナンス追加' });
  }, [recordId, navigation]);

  useEffect(() => {
    if (recordId && deviceQuery.data) {
      const r = deviceQuery.data.maintenanceRecords.find((x) => x.id === recordId);
      if (r) {
        setMaintenanceDate(r.maintenanceDate);
        setMaintenanceType(r.maintenanceType);
        setDescription(r.description ?? '');
        setCost(r.cost == null ? '' : String(r.cost));
        setPerformedBy(r.performedBy ?? '');
        setNextDueDate(r.nextDueDate ?? '');
        setPhotoUrl(r.photoUrl ?? '');
        setMemo(r.memo ?? '');
      }
    }
  }, [recordId, deviceQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        maintenanceDate,
        maintenanceType: maintenanceType as any,
        description: description || null,
        cost: cost || undefined,
        performedBy: performedBy || null,
        nextDueDate: nextDueDate || undefined,
        photoUrl: photoUrl || undefined,
        memo: memo || null,
      };
      if (recordId) return updateMaintenance(recordId, input as any);
      return createMaintenance(deviceId, input as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device', deviceId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('保存失敗', e?.response?.data?.message ?? String(e)),
  });

  const onSubmit = () => {
    if (!maintenanceDate) {
      Alert.alert('入力エラー', '実施日を入力してください');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <DateField
          label="実施日 *"
          value={maintenanceDate}
          onChange={setMaintenanceDate}
        />
        <ChipSelector
          label="種別"
          options={MAINTENANCE_TYPES.map((t) => ({ value: t, label: MAINTENANCE_TYPE_LABELS[t] }))}
          value={maintenanceType}
          onChange={(v) => v && setMaintenanceType(v)}
        />
        <TextField label="作業内容" value={description} onChangeText={setDescription} multiline />
        <TextField label="費用" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <TextField label="実施者" value={performedBy} onChangeText={setPerformedBy} />
        <DateField label="次回予定日" value={nextDueDate} onChange={setNextDueDate} />
        <TextField label="関連写真URL" value={photoUrl} onChangeText={setPhotoUrl} autoCapitalize="none" />
        <TextField label="メモ" value={memo} onChangeText={setMemo} multiline />
        <Button title={recordId ? '更新する' : '追加する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
});

export default MaintenanceFormScreen;
