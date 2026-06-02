import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { COLORS, SPACING } from '../../theme';
import { createSpec, updateSpec } from '../../api/children';
import { fetchDevice } from '../../api/devices';
import type { DevicesStackParamList } from '../../navigation/types';

type Rt = RouteProp<DevicesStackParamList, 'SpecForm'>;

const SpecFormScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { deviceId, specId } = route.params;

  const [specName, setSpecName] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [unit, setUnit] = useState('');
  const [memo, setMemo] = useState('');

  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    enabled: !!specId,
  });

  useEffect(() => {
    navigation.setOptions({ title: specId ? 'スペック編集' : 'スペック追加' });
  }, [specId, navigation]);

  useEffect(() => {
    if (specId && deviceQuery.data) {
      const s = deviceQuery.data.specs.find((x) => x.id === specId);
      if (s) {
        setSpecName(s.specName);
        setSpecValue(s.specValue ?? '');
        setUnit(s.unit ?? '');
        setMemo(s.memo ?? '');
      }
    }
  }, [specId, deviceQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        specName: specName.trim(),
        specValue: specValue || null,
        unit: unit || null,
        memo: memo || null,
      };
      if (specId) return updateSpec(specId, input as any);
      return createSpec(deviceId, input as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device', deviceId] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('保存失敗', e?.response?.data?.message ?? String(e)),
  });

  const onSubmit = () => {
    if (!specName.trim()) {
      Alert.alert('入力エラー', 'スペック項目名を入力してください');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextField
          label="項目名 *"
          value={specName}
          onChangeText={setSpecName}
          placeholder="例: CPU, メモリ, 解像度"
        />
        <TextField label="値" value={specValue} onChangeText={setSpecValue} placeholder="例: 16, 1920x1080" />
        <TextField label="単位" value={unit} onChangeText={setUnit} placeholder="例: GB, TB" />
        <TextField label="メモ" value={memo} onChangeText={setMemo} multiline />
        <Button title={specId ? '更新する' : '追加する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
});

export default SpecFormScreen;
