import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { ChipSelector } from '../../components/ChipSelector';
import { COLORS, SPACING } from '../../theme';
import { createRepair, updateRepair } from '../../api/children';
import { fetchDevice } from '../../api/devices';
import { REPAIR_STATUSES, REPAIR_STATUS_LABELS } from '@homegear/shared';
import type { DevicesStackParamList } from '../../navigation/types';

type Rt = RouteProp<DevicesStackParamList, 'RepairForm'>;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const RepairFormScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { deviceId, recordId } = route.params;

  const [occurredDate, setOccurredDate] = useState(todayStr());
  const [symptom, setSymptom] = useState('');
  const [cause, setCause] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [repairVendor, setRepairVendor] = useState('');
  const [repairTicketNumber, setRepairTicketNumber] = useState('');
  const [cost, setCost] = useState('');
  const [usedWarranty, setUsedWarranty] = useState(false);
  const [completedDate, setCompletedDate] = useState('');
  const [status, setStatus] = useState<string>('pending');
  const [memo, setMemo] = useState('');

  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    enabled: !!recordId,
  });

  useEffect(() => {
    navigation.setOptions({ title: recordId ? '修理履歴 編集' : '修理履歴 追加' });
  }, [recordId, navigation]);

  useEffect(() => {
    if (recordId && deviceQuery.data) {
      const r = deviceQuery.data.repairRecords.find((x) => x.id === recordId);
      if (r) {
        setOccurredDate(r.occurredDate);
        setSymptom(r.symptom ?? '');
        setCause(r.cause ?? '');
        setActionTaken(r.actionTaken ?? '');
        setRepairVendor(r.repairVendor ?? '');
        setRepairTicketNumber(r.repairTicketNumber ?? '');
        setCost(r.cost == null ? '' : String(r.cost));
        setUsedWarranty(r.usedWarranty);
        setCompletedDate(r.completedDate ?? '');
        setStatus(r.status);
        setMemo(r.memo ?? '');
      }
    }
  }, [recordId, deviceQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        occurredDate,
        symptom: symptom || null,
        cause: cause || null,
        actionTaken: actionTaken || null,
        repairVendor: repairVendor || null,
        repairTicketNumber: repairTicketNumber || null,
        cost: cost || undefined,
        usedWarranty,
        completedDate: completedDate || undefined,
        status: status as any,
        memo: memo || null,
      };
      if (recordId) return updateRepair(recordId, input as any);
      return createRepair(deviceId, input as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device', deviceId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('保存失敗', e?.response?.data?.message ?? String(e)),
  });

  const onSubmit = () => {
    if (!occurredDate) {
      Alert.alert('入力エラー', '発生日を入力してください');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <DateField label="発生日 *" value={occurredDate} onChange={setOccurredDate} />
        <ChipSelector
          label="ステータス"
          options={REPAIR_STATUSES.map((s) => ({ value: s, label: REPAIR_STATUS_LABELS[s] }))}
          value={status}
          onChange={(v) => v && setStatus(v)}
        />
        <TextField label="症状" value={symptom} onChangeText={setSymptom} multiline />
        <TextField label="原因" value={cause} onChangeText={setCause} multiline />
        <TextField label="対応内容" value={actionTaken} onChangeText={setActionTaken} multiline />
        <TextField label="修理依頼先" value={repairVendor} onChangeText={setRepairVendor} />
        <TextField label="修理受付番号" value={repairTicketNumber} onChangeText={setRepairTicketNumber} />
        <TextField label="修理費用" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>保証利用</Text>
          <Switch
            value={usedWarranty}
            onValueChange={setUsedWarranty}
            trackColor={{ true: COLORS.primaryLight, false: COLORS.border }}
            thumbColor={usedWarranty ? COLORS.primary : '#fff'}
          />
        </View>
        <DateField label="完了日" value={completedDate} onChange={setCompletedDate} />
        <TextField label="メモ" value={memo} onChangeText={setMemo} multiline />
        <Button title={recordId ? '更新する' : '追加する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  switchLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
});

export default RepairFormScreen;
