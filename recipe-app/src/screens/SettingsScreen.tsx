import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../hooks/useSettings';
import { FONTS } from '../constants/fonts';

export default function SettingsScreen() {
  const { apiKey, setApiKeyAndSave, apiMode, setApiModeAndSave } = useSettings();
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    if (!inputKey.trim()) {
      Alert.alert('エラー', 'APIキーを入力してください');
      return;
    }
    try {
      await setApiKeyAndSave(inputKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      Alert.alert('保存エラー', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ヘッダー */}
      <LinearGradient
        colors={['#BF360C', '#E65100']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>⚙️ 設定</Text>
        <Text style={styles.headerSub}>APIモードの切り替えと設定</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            {/* モード切替カード */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔄 APIモード</Text>
              <Text style={styles.cardDesc}>
                レシピ検索に使用するAPIを切り替えられます。
              </Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, apiMode === 'claude' && styles.modeBtnActive]}
                  onPress={() => setApiModeAndSave('claude')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modeBtnText, apiMode === 'claude' && styles.modeBtnTextActive]}>
                    🤖 Claude API
                  </Text>
                  <Text style={[styles.modeBtnSub, apiMode === 'claude' && styles.modeBtnSubActive]}>
                    AI + Web検索
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, apiMode === 'other' && styles.modeBtnActive]}
                  onPress={() => setApiModeAndSave('other')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modeBtnText, apiMode === 'other' && styles.modeBtnTextActive]}>
                    🔗 カスタムAPI
                  </Text>
                  <Text style={[styles.modeBtnSub, apiMode === 'other' && styles.modeBtnSubActive]}>
                    独自サーバー
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Claude APIキー入力カード */}
            {apiMode === 'claude' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔑 Claude APIキー</Text>
                <Text style={styles.cardDesc}>
                  Anthropic Console（console.anthropic.com）からAPIキーを取得し、以下に入力してください。
                  キーはデバイスに安全に保存されます。
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={inputKey}
                    onChangeText={setInputKey}
                    placeholder="sk-ant-api03-..."
                    placeholderTextColor="#BCAAA4"
                    secureTextEntry={!showKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowKey(!showKey)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.eyeIcon}>{showKey ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>
                    {saved ? '✓ 保存しました' : '保存する'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* カスタムAPIモードの説明 */}
            {apiMode === 'other' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🔗 カスタムAPIモード</Text>
                <Text style={styles.infoText}>
                  {'独自のレシピ生成サーバーを使用します。\n'}
                  {'APIキーの設定は不要です。'}
                </Text>
              </View>
            )}

            {/* アプリ概要 */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📌 このアプリについて</Text>
              {apiMode === 'claude' ? (
                <Text style={styles.infoText}>
                  {'• AIレシピ: Claude APIで季節・ジャンルに合ったオリジナルレシピを生成\n'}
                  {'• Webレシピ: Claude + Web Searchで実在のレシピを検索\n'}
                  {'• APIキーはデバイスのSecureStoreに安全に保存されます\n'}
                  {'• API利用料はAnthropicアカウントに課金されます'}
                </Text>
              ) : (
                <Text style={styles.infoText}>
                  {'• AIレシピ: カスタムAPIサーバーでオリジナルレシピを生成\n'}
                  {'• Webレシピ: カスタムAPIサーバーで実在のレシピを検索\n'}
                  {'• APIキー不要で利用できます'}
                </Text>
              )}
            </View>

            {/* Claude APIキー取得方法 */}
            {apiMode === 'claude' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🔗 APIキー取得方法</Text>
                <Text style={styles.infoText}>
                  {'1. console.anthropic.com にアクセス\n'}
                  {'2. ログイン → API Keys を選択\n'}
                  {'3. 「Create Key」でキーを生成\n'}
                  {'4. 上の入力欄に貼り付けて「保存する」'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F0' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: { padding: 20, paddingTop: 18, paddingBottom: 18 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: 'white', fontFamily: FONTS.serifBold },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontFamily: FONTS.sans,
  },

  section: { padding: 20, gap: 16 },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: FONTS.sans,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: FONTS.sans,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0D5CC',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
    fontFamily: FONTS.sans,
  },
  eyeBtn: { padding: 10, marginLeft: 8 },
  eyeIcon: { fontSize: 20 },

  saveBtn: {
    backgroundColor: '#E65100',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: '#2E7D32' },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans },

  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0D5CC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  modeBtnActive: {
    borderColor: '#E65100',
    backgroundColor: '#FFF3E0',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    fontFamily: FONTS.sans,
  },
  modeBtnTextActive: {
    color: '#E65100',
  },
  modeBtnSub: {
    fontSize: 11,
    color: '#BBB',
    marginTop: 4,
    fontFamily: FONTS.sans,
  },
  modeBtnSubActive: {
    color: '#BF360C',
  },

  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 10,
    fontFamily: FONTS.sans,
  },
  infoText: { fontSize: 13, color: '#666', lineHeight: 22, fontFamily: FONTS.sans },
});
