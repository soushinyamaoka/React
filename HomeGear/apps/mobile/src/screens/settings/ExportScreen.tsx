import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { api } from '../../api/client';

const ExportScreen: React.FC = () => {
  const [json, setJson] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const onExport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/export/json');
      const formatted = JSON.stringify(res.data, null, 2);
      setJson(formatted);
    } catch (e: any) {
      Alert.alert('エラー', e?.response?.data?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const onExportMigration = async () => {
    setMigrating(true);
    try {
      const res = await api.get('/api/export/migration');
      const formatted = JSON.stringify(res.data, null, 2);
      setJson(formatted);
    } catch (e: any) {
      Alert.alert('エラー', e?.response?.data?.message ?? String(e));
    } finally {
      setMigrating(false);
    }
  };

  const onCopy = async () => {
    if (!json) return;
    await Clipboard.setStringAsync(json);
    Alert.alert('コピーしました', 'JSONをクリップボードにコピーしました');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Text style={styles.helperText}>
          家庭内の全データ（機器・スペック・履歴など）をJSON形式で取得します。コピーして保存することでバックアップになります。
        </Text>
        <Button title="エクスポート実行" onPress={onExport} loading={loading} />
      </Card>

      <Card>
        <Text style={styles.helperText}>
          新アプリ「HomeAsset」へのデータ移行用JSONを出力します。移行仕様の形式（テーブル別）で、ユーザー・家庭メンバー情報も含みます。出力したJSONをHomeAsset側のインポート機能に取り込んでください。
        </Text>
        <Button
          title="移行用JSONを出力"
          onPress={onExportMigration}
          loading={migrating}
          variant="outline"
        />
      </Card>

      {json ? (
        <>
          <Button title="JSONをコピー" onPress={onCopy} variant="outline" />
          <View style={styles.preview}>
            <Text style={styles.previewText} selectable>
              {json.length > 5000 ? json.slice(0, 5000) + '\n...(省略)' : json}
            </Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, backgroundColor: COLORS.bg },
  helperText: { color: COLORS.textSub, marginBottom: SPACING.md, fontSize: 13, lineHeight: 18 },
  preview: {
    backgroundColor: '#FAFAFA',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  previewText: { fontSize: 11, color: COLORS.textSub, fontFamily: 'monospace' },
});

export default ExportScreen;
