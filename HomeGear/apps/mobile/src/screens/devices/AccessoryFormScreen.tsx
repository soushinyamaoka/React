import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { COLORS, SPACING } from '../../theme';
import { createAccessory, updateAccessory } from '../../api/children';
import { fetchDevice } from '../../api/devices';
import type { DevicesStackParamList } from '../../navigation/types';

type Rt = RouteProp<DevicesStackParamList, 'AccessoryForm'>;

const AccessoryFormScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { deviceId, accessoryId } = route.params;

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [memo, setMemo] = useState('');

  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    enabled: !!accessoryId,
  });

  useEffect(() => {
    navigation.setOptions({ title: accessoryId ? '付属品 編集' : '付属品 追加' });
  }, [accessoryId, navigation]);

  useEffect(() => {
    if (accessoryId && deviceQuery.data) {
      const a = deviceQuery.data.accessories.find((x) => x.id === accessoryId);
      if (a) {
        setName(a.name);
        setQuantity(a.quantity == null ? '' : String(a.quantity));
        setStorageLocation(a.storageLocation ?? '');
        setMemo(a.memo ?? '');
      }
    }
  }, [accessoryId, deviceQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        name: name.trim(),
        quantity: quantity || undefined,
        storageLocation: storageLocation || null,
        memo: memo || null,
      };
      if (accessoryId) return updateAccessory(accessoryId, input as any);
      return createAccessory(deviceId, input as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device', deviceId] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('保存失敗', e?.response?.data?.message ?? String(e)),
  });

  const onSubmit = () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', '付属品名を入力してください');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextField label="付属品名 *" value={name} onChangeText={setName} placeholder="例: リモコン" />
        <TextField label="数量" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        <TextField label="保管場所" value={storageLocation} onChangeText={setStorageLocation} />
        <TextField label="メモ" value={memo} onChangeText={setMemo} multiline />
        <Button title={accessoryId ? '更新する' : '追加する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
});

export default AccessoryFormScreen;
