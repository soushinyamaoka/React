# 5. モバイル UI 仕様

実装は [apps/mobile/src/navigation/index.tsx](../../apps/mobile/src/navigation/index.tsx) と [apps/mobile/src/screens/](../../apps/mobile/src/screens) を正とする。

## 5.1 認証状態と画面ルート分岐

`useAuth()` の `user` の有無で `RootNavigator` がトップを切り替える。

```
未ログイン: AuthNavigator (Native Stack)
  Login
  Register

ログイン済: MainNavigator (Bottom Tab)
  DashboardTab  - Dashboard
  DevicesTab    - DeviceList → Detail → Form / 子テーブル各種
  AddTab        - タブタップで DevicesTab/DeviceForm へ即遷移（画面自体はダミー）
  AiImportTab   - AiImport
  SettingsTab   - Settings → CategoryManage / LocationManage / Export
```

JWT は SecureStore（Web は localStorage）に保存。API 通信は `apps/mobile/src/api/client.ts` の axios インスタンスが Bearer ヘッダーを自動付与。

## 5.2 タブ構成（Bottom Tab）

| タブ | 名前 | アイコン (Ionicons) | 内容 |
|---|---|---|---|
| ホーム | DashboardTab | home | DashboardScreen |
| 機器 | DevicesTab | list | DeviceListScreen → Detail / Form / 子テーブル各種 |
| 追加 | AddTab | add-circle | タップで DeviceForm に直接遷移するダミー |
| AI 取込 | AiImportTab | sparkles | AiImportScreen |
| 設定 | SettingsTab | settings | SettingsScreen 系 |

ヘッダーカラーはプロジェクトの primary 色（`COLORS.primary`、theme.ts 参照）。

## 5.3 ログイン / 新規登録

### LoginScreen

- email / password の入力欄
- 初期値: `demo@example.com` / `demo1234`（seed で投入されている）
- 「ログイン」ボタン → `POST /api/auth/login` → 成功で JWT を保存 → ナビゲーション切替
- 「新規登録はこちら」リンクで Register へ遷移

### RegisterScreen

- name / email / password（8 文字以上）/ householdName（任意）
- 「アカウント作成」ボタン → `POST /api/auth/register` → 成功で同じく JWT を保存

両画面ともキーボードでフォームが隠れないよう `KeyboardAvoidingView` を使用。

## 5.4 ダッシュボード（DashboardScreen）

`GET /api/dashboard` の結果を縦スクロールのカードで表示。表示優先順:

1. 登録機器数 + 「機器を追加」ショートカット
2. 修理中・故障中（`brokenDevices`）
3. 保証期限が近い（`warrantyExpiringSoonDevices`）
4. メンテナンス予定が近い（`upcomingMaintenanceDevices`）
5. 保証期限切れ（`warrantyExpiredDevices`）
6. 情報不足の機器（`incompleteDevices`）
7. 最近更新した機器（`recentDevices`）

各カードのデバイス行タップで DeviceDetail に遷移。

## 5.5 機器一覧（DeviceListScreen）

- 上部に検索バー（`search` クエリ）
- ChipSelector 3 つ: カテゴリ / 設置場所 / ステータス
- 並べ替えメニュー: 作成日 / 更新日 / 名前 / 保証期限 / 購入日 / **次回メンテ予定 (next_maintenance_asc)**
- 廃棄済みの表示切替（`includeDisposed`）
- カード: 機器名 / カテゴリ / 場所 / メーカー・型番 / 保証期限 / `StatusBadge`
- 右下 FAB（+）→ DeviceForm

## 5.6 機器登録 / 編集（DeviceFormScreen）

セクション分けで入力負荷を下げる:

| セクション | 入力項目 |
|---|---|
| 基本情報 | 機器名（**必須**） / カテゴリ / メーカー / 型番 / シリアル / 設置場所 / ステータス / 優先度 |
| 購入情報 | 購入日 / 店舗 / 価格 / 購入 URL / 注文番号 |
| 保証情報 | 保証開始日 / 保証終了日 / 延長保証スイッチ / 保証メモ |
| リンク・写真 | 取扱説明書 URL / 公式 URL / サポート URL / 機器写真 URL / 銘板写真 URL / 設置写真 URL |
| メモ | 自由記述 |

- 機器名のみ必須。日付は `YYYY-MM-DD` 文字列で手入力
- 編集モードでは初期値を機器詳細から読み込む
- 新規作成成功後は DeviceDetail に `replace` 遷移

## 5.7 機器詳細（DeviceDetailScreen）

### ヘッダーカード

- 機器名 / `StatusBadge` / カテゴリ・場所
- アクションボタン 3 つ:
  - **編集** → DeviceForm
  - **AI 取込** → AiImportFromDevice（deviceId 付き）
  - **廃棄** → 確認ダイアログ → `POST /dispose`

### セクション（カード形式・上から）

1. 基本情報（メーカー・型番・シリアル・優先度）
2. 購入情報（購入 URL は外部ブラウザ起動）
3. 保証情報
4. **スペック**（一覧 + 追加ボタン + 各行に編集／削除）
5. **関連リンク**（タップで外部ブラウザを開く）
6. **メンテナンス履歴**
7. **修理履歴**（ステータス変更が機器ステータスにも反映される旨を表示）
8. **消耗品**
9. **付属品**
10. **ネットワーク情報**（1 件まで・なければ「追加」ボタン）
11. メモ

### フッター

「完全削除」ボタン。確認ダイアログを挟んで `DELETE /api/devices/:id`。誤登録の救済用。通常運用は廃棄を使うようコピーで誘導。

## 5.8 子テーブルフォーム

| 画面 | 必須項目 | 備考 |
|---|---|---|
| SpecFormScreen | spec_name | 単位は任意 |
| LinkFormScreen | url（URL 形式） | link_type で種類を選択 |
| MaintenanceFormScreen | maintenance_date | next_due_date は実施日以降 |
| RepairFormScreen | occurred_date | status で機器ステータスが自動同期 |
| ConsumableFormScreen | name | 日付は YYYY-MM-DD |
| AccessoryFormScreen | name | quantity 任意 |
| NetworkInfoFormScreen | （全て任意） | upsert。port は 0〜65535 |

すべてのフォーム共通:

- `KeyboardAvoidingView` で入力欄がキーボードに隠れない
- 保存ボタンタップで該当 API を呼び、成功時は直前画面に戻る
- バリデーションは `shared` の Zod を `safeParse` で利用（モバイル側で先に検証）

## 5.9 AI 取込（AiImportScreen）

ステップ別 UI で、AI で機器情報を調べた結果を取り込む。

| ステップ | 内容 |
|---|---|
| 1. 反映対象選択 | 機器一覧から選ぶ。DeviceDetail から起動された場合は固定 |
| 2. プロンプト生成 | 機器名 / メーカー / 型番 / カテゴリを入力。`buildAiResearchPrompt`（shared）で自動生成 → コピーボタンでクリップボードへ |
| 3. AI 回答 JSON 貼付 | 複数行 TextArea（`expo-clipboard` 経由のペーストも対応） |
| 4. 解析 | `POST /api/ai-import/parse` を呼び、Zod 検証エラーがあれば表示 |
| 5. プレビュー | 既存値との比較表示。「既存値を上書きする」スイッチ（既定 OFF）と各リソース（specs / links / consumables / accessories）の反映スイッチ |
| 6. 反映 | `POST /api/devices/:id/ai-import/apply` |

ポイント:

- **既存値の温存がデフォルト**（CLAUDE.md のルール準拠）
- specs / links / consumables / accessories は重複判定で追加のみ。spec_name / url / name でユニーク化

## 5.10 設定（SettingsScreen 系）

### SettingsScreen

- 表示: アカウント情報（名前・メール・家庭名）
- メニュー: カテゴリ管理 / 設置場所管理 / データエクスポート / ログアウト

### CategoryManageScreen / LocationManageScreen

- 一覧表示（並び順は sortOrder）
- 追加・編集・削除ボタン
- 削除時は確認ダイアログ
- カテゴリは Ionicons のアイコン名を選択（候補リストから選ぶか手入力）

### ExportScreen

- 「JSON を取得」ボタン → `GET /api/export/json`
- 取得後は内容を表示してコピー可能（共有先は OS 標準）

## 5.11 共通コンポーネント

[apps/mobile/src/components](../../apps/mobile/src/components):

| コンポーネント | 用途 |
|---|---|
| Button | プライマリ / セカンダリのボタン |
| TextField | 単行 / 複数行のテキスト入力 |
| Card | 角丸・影付きのカードコンテナ |
| Section | カード内のセクションヘッダー + コンテンツ枠 |
| ChipSelector | 横スクロールのチップ選択 |
| StatusBadge | デバイスステータスの色付きバッジ |
| InfoRow | ラベル + 値の 2 カラム行（詳細画面で多用） |

## 5.12 テーマ

[apps/mobile/src/theme.ts](../../apps/mobile/src/theme.ts) に `COLORS` / `SPACING` / `RADIUS` を定義。

- プライマリカラーは深いグリーン系（splash 背景 `#1B5E20`）
- 余白は基準 4 / 8 / 16
- 角丸は基準 8 / 12 / 16

## 5.13 状態管理

- **サーバーステート**: TanStack Query v5 (`apps/mobile/src/lib/queryClient.ts`)
  - 既定 `staleTime: 30s`
  - mutate 後は関連クエリを `invalidateQueries` で再取得
- **認証状態**: `useAuth()`（Context + SecureStore）
- **設定**: 必要に応じて Context（現状は AuthProvider のみ）
- **フォーム状態**: 各画面のローカル `useState` で十分。`react-hook-form` も導入済みで必要に応じ使用可
