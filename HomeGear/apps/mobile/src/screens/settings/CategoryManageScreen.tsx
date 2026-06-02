import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { COLORS, SPACING } from '../../theme';
import { createCategory, deleteCategory, fetchCategories, updateCategory, type Category } from '../../api/master';

const CategoryManageScreen: React.FC = () => {
  const qc = useQueryClient();
  const { data, refetch, isLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const input = { name: name.trim() };
      if (editing) return updateCategory(editing.id, input);
      return createCategory(input);
    },
    onSuccess: () => {
      setName('');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e: any) => Alert.alert('エラー', e?.response?.data?.message ?? String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', 'カテゴリ名を入力してください');
      return;
    }
    submitMutation.mutate();
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: SPACING.lg }}>
      <Card>
        <TextField
          label={editing ? '編集' : '新規追加'}
          value={name}
          onChangeText={setName}
          placeholder="例: 趣味用機器"
        />
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {editing ? (
            <View style={{ flex: 1 }}>
              <Button
                title="キャンセル"
                onPress={() => {
                  setEditing(null);
                  setName('');
                }}
                variant="outline"
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              title={editing ? '更新' : '追加'}
              onPress={handleSubmit}
              loading={submitMutation.isPending}
            />
          </View>
        </View>
      </Card>

      <FlatList
        data={data ?? []}
        keyExtractor={(c) => c.id}
        refreshing={isLoading}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={20} color={COLORS.textSub} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('削除確認', `${item.name} を削除しますか？`, [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '削除', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
                    ])
                  }
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>カテゴリがありません</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  iconBtn: { padding: 4 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xl },
});

export default CategoryManageScreen;
