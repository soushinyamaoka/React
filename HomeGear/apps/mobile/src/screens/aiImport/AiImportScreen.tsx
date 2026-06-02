import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Card } from '../../components/Card';
import { Section } from '../../components/Section';
import { ChipSelector } from '../../components/ChipSelector';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { applyAiImport, createAndApplyAiImport, parseAiImport } from '../../api/aiImport';
import { fetchDevices, fetchDevice } from '../../api/devices';
import { fetchCategories, fetchLocations } from '../../api/master';
import { buildAiResearchPrompt, type AiImportPayload } from '@homegear/shared';
import type { DevicesStackParamList, AiImportStackParamList } from '../../navigation/types';

type Mode = 'create' | 'apply';

type Rt = RouteProp<DevicesStackParamList & AiImportStackParamList, any>;

const AiImportScreen: React.FC = () => {
  const route = useRoute<Rt>();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const initialDeviceId =
    (route.params as any)?.deviceId ?? null;

  // 初期モード：deviceId が渡って来ていれば既存反映、無ければ新規作成
  const [mode, setMode] = useState<Mode>(initialDeviceId ? 'apply' : 'create');
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(initialDeviceId);

  // プロンプト生成用（モード共通）
  const [deviceName, setDeviceName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [category, setCategory] = useState('');
  const [rawJson, setRawJson] = useState('');

  // 新規モード用：作成時の属性
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newLocationId, setNewLocationId] = useState<string | null>(null);

  const [previewPayload, setPreviewPayload] = useState<AiImportPayload | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [applySpecs, setApplySpecs] = useState(true);
  const [applyLinks, setApplyLinks] = useState(true);
  const [applyConsumables, setApplyConsumables] = useState(true);
  const [applyAccessories, setApplyAccessories] = useState(true);

  const devicesQuery = useQuery({ queryKey: ['devices', 'all'], queryFn: () => fetchDevices() });
  const deviceQuery = useQuery({
    queryKey: ['device', targetDeviceId],
    queryFn: () => fetchDevice(targetDeviceId!),
    enabled: !!targetDeviceId,
  });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: fetchLocations });

  useEffect(() => {
    if (deviceQuery.data) {
      setDeviceName(deviceQuery.data.name);
      setManufacturer(deviceQuery.data.manufacturer ?? '');
      setModelNumber(deviceQuery.data.modelNumber ?? '');
      setCategory(deviceQuery.data.category?.name ?? '');
    }
  }, [deviceQuery.data]);

  const prompt = useMemo(
    () =>
      buildAiResearchPrompt({
        deviceName: deviceName || '【ここに機器名】',
        manufacturer,
        modelNumber,
        category,
      }),
    [deviceName, manufacturer, modelNumber, category]
  );

  const copyPrompt = async () => {
    await Clipboard.setStringAsync(prompt);
    Alert.alert('コピーしました', 'ChatGPTやClaudeに貼り付けてください');
  };

  // 取り込み成功後に入力欄をリセット（スイッチ類はユーザー設定を維持）
  const resetForm = () => {
    setRawJson('');
    setPreviewPayload(null);
    setDeviceName('');
    setManufacturer('');
    setModelNumber('');
    setCategory('');
    setTargetDeviceId(null);
    setNewCategoryId(null);
    setNewLocationId(null);
  };

  const parseMutation = useMutation({
    mutationFn: () => parseAiImport(rawJson, targetDeviceId ?? undefined),
    onSuccess: (data) => setPreviewPayload(data.payload),
    onError: (e: any) => Alert.alert('解析失敗', e?.response?.data?.message ?? String(e)),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!targetDeviceId) throw new Error('反映対象の機器を選択してください');
      if (!previewPayload) throw new Error('AI回答を解析してください');
      return applyAiImport(targetDeviceId, previewPayload, {
        overwrite,
        applySpecs,
        applyLinks,
        applyConsumables,
        applyAccessories,
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['device', targetDeviceId] });
      qc.invalidateQueries({ queryKey: ['devices'] });
      Alert.alert(
        '反映しました',
        `基本情報: ${data.counts.deviceFieldsUpdated}項目\nスペック: ${data.counts.specsCreated}件\nリンク: ${data.counts.linksCreated}件\n消耗品: ${data.counts.consumablesCreated}件\n付属品: ${data.counts.accessoriesCreated}件`
      );
      resetForm();
      navigation.goBack();
    },
    onError: (e: any) =>
      Alert.alert('反映失敗', e?.response?.data?.message ?? e?.message ?? String(e)),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!previewPayload) throw new Error('AI回答を解析してください');
      const finalName = deviceName.trim() || previewPayload.device?.name?.trim();
      if (!finalName) throw new Error('機器名を入力してください');
      return createAndApplyAiImport(
        {
          name: finalName,
          categoryId: newCategoryId,
          locationId: newLocationId,
        },
        previewPayload,
        { applySpecs, applyLinks, applyConsumables, applyAccessories }
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['devices'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
      Alert.alert(
        '作成しました',
        `スペック: ${data.counts.specsCreated}件\nリンク: ${data.counts.linksCreated}件\n消耗品: ${data.counts.consumablesCreated}件\n付属品: ${data.counts.accessoriesCreated}件`,
        [
          {
            text: '詳細を見る',
            onPress: () => {
              navigation.navigate('DevicesTab', {
                screen: 'DeviceDetail',
                params: { deviceId: data.device.id },
              } as any);
            },
          },
        ]
      );
    },
    onError: (e: any) =>
      Alert.alert('作成失敗', e?.response?.data?.message ?? e?.message ?? String(e)),
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Section title="1. 取り込み先">
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'create' && styles.modeChipActive]}
              onPress={() => {
                setMode('create');
                setTargetDeviceId(null);
              }}
            >
              <Text style={[styles.modeChipText, mode === 'create' && styles.modeChipTextActive]}>
                新規作成
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeChip, mode === 'apply' && styles.modeChipActive]}
              onPress={() => setMode('apply')}
            >
              <Text style={[styles.modeChipText, mode === 'apply' && styles.modeChipTextActive]}>
                既存機器に反映
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'apply' ? (
            <Card>
              {targetDeviceId ? (
                <View>
                  <Text style={styles.targetName}>{deviceQuery.data?.name ?? '...'}</Text>
                  <TouchableOpacity onPress={() => setTargetDeviceId(null)}>
                    <Text style={styles.changeText}>変更</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.helperText}>反映先の機器を選択してください（タップ）</Text>
                  {(devicesQuery.data ?? []).slice(0, 30).map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.deviceRow}
                      onPress={() => setTargetDeviceId(d.id)}
                    >
                      <Text style={styles.deviceRowName}>{d.name}</Text>
                      <Text style={styles.deviceRowMeta}>
                        {d.category?.name ?? '未分類'} / {d.manufacturer ?? '—'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          ) : (
            <Card>
              <Text style={styles.helperText}>
                AI回答の内容で新しい機器を作成します。機器名のみ必須です。
              </Text>
              <ChipSelector
                label="カテゴリ（任意）"
                value={newCategoryId}
                onChange={setNewCategoryId}
                allowClear
                options={(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
              <ChipSelector
                label="設置場所（任意）"
                value={newLocationId}
                onChange={setNewLocationId}
                allowClear
                options={(locationsQuery.data ?? []).map((l) => ({ value: l.id, label: l.name }))}
              />
            </Card>
          )}
        </Section>

        <Section title="2. AI調査用プロンプト生成">
          <TextField label="機器名" value={deviceName} onChangeText={setDeviceName} />
          <TextField label="メーカー" value={manufacturer} onChangeText={setManufacturer} />
          <TextField label="型番" value={modelNumber} onChangeText={setModelNumber} />
          <TextField label="カテゴリ" value={category} onChangeText={setCategory} />
          <Card>
            <Text style={styles.promptText} numberOfLines={10}>
              {prompt}
            </Text>
            <Button title="プロンプトをコピー" onPress={copyPrompt} icon={<Ionicons name="copy" size={16} color="#fff" />} />
          </Card>
        </Section>

        <Section title="3. AI回答JSONを貼り付け">
          <TextField
            label="AIからの回答（JSON）"
            value={rawJson}
            onChangeText={setRawJson}
            multiline
            style={{ minHeight: 200 }}
            placeholder='{"device": {...}, "specs": [...], ...}'
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title="解析してプレビュー"
            onPress={() => parseMutation.mutate()}
            loading={parseMutation.isPending}
            variant="outline"
          />
        </Section>

        {previewPayload ? (
          <Section title="4. 取り込みプレビュー">
            <Card>
              {mode === 'apply' && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>既存値を上書きする</Text>
                  <Switch value={overwrite} onValueChange={setOverwrite} />
                </View>
              )}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>スペックを反映 ({previewPayload.specs?.length ?? 0}件)</Text>
                <Switch value={applySpecs} onValueChange={setApplySpecs} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>リンクを反映 ({previewPayload.links?.length ?? 0}件)</Text>
                <Switch value={applyLinks} onValueChange={setApplyLinks} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>消耗品を反映 ({previewPayload.consumables?.length ?? 0}件)</Text>
                <Switch value={applyConsumables} onValueChange={setApplyConsumables} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>付属品を反映 ({previewPayload.accessories?.length ?? 0}件)</Text>
                <Switch value={applyAccessories} onValueChange={setApplyAccessories} />
              </View>
            </Card>

            {previewPayload.device && (
              <Card>
                <Text style={styles.previewTitle}>基本情報</Text>
                {previewPayload.device.name ? <Text>名称: {previewPayload.device.name}</Text> : null}
                {previewPayload.device.manufacturer ? <Text>メーカー: {previewPayload.device.manufacturer}</Text> : null}
                {previewPayload.device.model_number ? <Text>型番: {previewPayload.device.model_number}</Text> : null}
                {previewPayload.device.summary ? <Text style={{ color: COLORS.textSub, marginTop: 4 }}>{previewPayload.device.summary}</Text> : null}
              </Card>
            )}

            {(previewPayload.specs ?? []).length > 0 && (
              <Card>
                <Text style={styles.previewTitle}>スペック</Text>
                {previewPayload.specs!.map((s, i) => (
                  <Text key={i}>
                    ・ {s.spec_name}: {s.spec_value ?? '—'} {s.unit ?? ''}
                  </Text>
                ))}
              </Card>
            )}

            {(previewPayload.links ?? []).length > 0 && (
              <Card>
                <Text style={styles.previewTitle}>関連リンク</Text>
                {previewPayload.links!.map((l, i) => (
                  <Text key={i} numberOfLines={2}>
                    ・ [{l.link_type}] {l.title ?? l.url}
                  </Text>
                ))}
              </Card>
            )}

            {(previewPayload.consumables ?? []).length > 0 && (
              <Card>
                <Text style={styles.previewTitle}>消耗品</Text>
                {previewPayload.consumables!.map((c, i) => (
                  <Text key={i}>・ {c.name}</Text>
                ))}
              </Card>
            )}

            {(previewPayload.accessories ?? []).length > 0 && (
              <Card>
                <Text style={styles.previewTitle}>付属品</Text>
                {previewPayload.accessories!.map((a, i) => (
                  <Text key={i}>
                    ・ {a.name} {a.quantity != null ? `× ${a.quantity}` : ''}
                  </Text>
                ))}
              </Card>
            )}

            {(previewPayload.notes ?? []).length > 0 && (
              <Card>
                <Text style={styles.previewTitle}>注意事項</Text>
                {previewPayload.notes!.map((n, i) => (
                  <Text key={i}>・ {n}</Text>
                ))}
              </Card>
            )}

            {mode === 'apply' ? (
              <Button
                title="この内容で機器に反映"
                onPress={() => applyMutation.mutate()}
                loading={applyMutation.isPending}
                disabled={!targetDeviceId}
              />
            ) : (
              <Button
                title="この内容で新しい機器を作成"
                onPress={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!deviceName.trim() && !previewPayload.device?.name?.trim()}
              />
            )}
          </Section>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg, paddingBottom: SPACING.xxl },
  targetName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  changeText: { color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  helperText: { color: COLORS.textSub, marginBottom: SPACING.sm },
  deviceRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  deviceRowName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  deviceRowMeta: { fontSize: 12, color: COLORS.textSub },
  promptText: {
    backgroundColor: '#FAFAFA',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    fontSize: 12,
    color: COLORS.textSub,
    marginBottom: SPACING.sm,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { fontSize: 13, color: COLORS.text },
  previewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  modeChipTextActive: { color: '#fff' },
});

export default AiImportScreen;
