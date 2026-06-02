import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { ChipSelector } from '../../components/ChipSelector';
import { COLORS, SPACING } from '../../theme';
import { createLink, updateLink } from '../../api/children';
import { fetchDevice } from '../../api/devices';
import { LINK_TYPES, LINK_TYPE_LABELS } from '@homegear/shared';
import type { DevicesStackParamList } from '../../navigation/types';

type Rt = RouteProp<DevicesStackParamList, 'LinkForm'>;

const LinkFormScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const { deviceId, linkId } = route.params;

  const [linkType, setLinkType] = useState<string>('other');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');

  const deviceQuery = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => fetchDevice(deviceId),
    enabled: !!linkId,
  });

  useEffect(() => {
    navigation.setOptions({ title: linkId ? 'リンク編集' : 'リンク追加' });
  }, [linkId, navigation]);

  useEffect(() => {
    if (linkId && deviceQuery.data) {
      const l = deviceQuery.data.links.find((x) => x.id === linkId);
      if (l) {
        setLinkType(l.linkType);
        setTitle(l.title ?? '');
        setUrl(l.url);
        setMemo(l.memo ?? '');
      }
    }
  }, [linkId, deviceQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        linkType: linkType as any,
        title: title || null,
        url: url.trim(),
        memo: memo || null,
      };
      if (linkId) return updateLink(linkId, input as any);
      return createLink(deviceId, input as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device', deviceId] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('保存失敗', e?.response?.data?.message ?? String(e)),
  });

  const onSubmit = () => {
    if (!url.trim()) {
      Alert.alert('入力エラー', 'URLを入力してください');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ChipSelector
          label="リンク種別"
          options={LINK_TYPES.map((t) => ({ value: t, label: LINK_TYPE_LABELS[t] }))}
          value={linkType}
          onChange={(v) => v && setLinkType(v)}
        />
        <TextField label="表示名（任意）" value={title} onChangeText={setTitle} />
        <TextField label="URL *" value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://..." />
        <TextField label="メモ" value={memo} onChangeText={setMemo} multiline />
        <Button title={linkId ? '更新する' : '追加する'} onPress={onSubmit} loading={mutation.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
});

export default LinkFormScreen;
