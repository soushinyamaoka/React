# プロジェクト指示文

## 基本ルール

### 1. 実装前の確認プロセス

- 実装に入る前に、理解した仕様を箇条書きで整理して提示すること。
- 不明点や曖昧な点があれば、推測で進めず必ず質問すること。
- 仕様の確認が取れてから実装を開始すること。

### 2. 影響範囲の事前調査

- 機能の追加・変更を行う際は、実装前に影響を受ける既存の画面・コンポーネント・ロジックを洗い出し、リストとして提示すること。
- 横展開が必要な箇所がある場合は、対応漏れがないよう明示すること。
- 影響範囲の確認が取れてから実装を開始すること。
- **HomeGearはモノレポ構成（`apps/api` + `apps/mobile` + `packages/shared`）。** API・モバイル・shared のいずれにまたがる変更かを必ず先に整理すること。Zodスキーマや型を変更するときは `packages/shared` を起点に検討すること。
- **機器の子テーブル（specs / links / maintenance / repairs / consumables / accessories / network_infos）は同じ CRUD パターンで実装されている。** いずれかを変更する場合、他テーブルも同じ変更が必要か必ず確認すること。

### 3. UI/UX に関するルール

- UI の変更や新規作成を行う場合は、コードを書く前に画面構成とユーザーの操作フローを説明すること。
- 参考 UI やデザイン指示がある場合はそれに従い、ない場合はシンプルで直感的な操作を優先すること。
- スマホでの片手操作を最重視する。フォームは長すぎないようセクション分け（`Section` コンポーネント）し、必須入力は最小限にすること。
- 入力欄では `KeyboardAvoidingView` でキーボードに隠れないようにすること。

### 4. 段階的な進め方

- 大きな機能は一度に実装せず、以下のような段階に分けて進めること。
  1. データ構造・設計方針の提示 → 確認
  2. 主要ロジックの実装 → 確認
  3. UI の実装 → 確認
  4. 結合・仕上げ → 確認
- 各段階でユーザーの確認を取ってから次に進むこと。

### 5. その他

- 問題報告時は、まず原因を説明し、修正不要な場合はその旨を先に伝える。修正が必要な場合のみ対応方針を提示する。すぐに修正に飛びつかない。

---

## データ層ルール

### 1. household_id によるデータ分離

- 主要テーブルはすべて `household_id` を持ち、API は必ず `req.auth.householdId` で絞り込む。
- 新規ルートを追加する場合、`apps/api/src/utils/device-guard.ts` の `ensureDeviceInHousehold` か、`where: { id, householdId: req.auth.householdId }` パターンを必ず使用すること。
- 自家庭以外のデータにアクセスできないことを確認してからマージすること。

### 2. パスワード・秘密情報の扱い

- 機器情報としてパスワード・APIキー・秘密鍵・アクセストークンを **保存しない**。
- ネットワーク情報には保管場所メモ（例: "1Passwordに保存", "紙の保管場所"）のみ保存する。
- 新規フォーム・スキーマ追加時にこの方針を逸脱していないか必ず確認すること。
- ユーザーパスワードは `bcrypt` でハッシュ化（10ラウンド）してから保存する。

### 3. 日付・Decimal の取り扱い

PostgreSQL の `@db.Date` 型と `Decimal` 型は JSON 化で扱いに注意：

- DB → API: `apps/api/src/utils/serialize.ts` の `serializeDevice` を通して `'YYYY-MM-DD'` 文字列 / `number` に変換してから返す。
- API → DB: `'YYYY-MM-DD'` 文字列は `parseDateOnly` で `Date` に変換してから Prisma に渡す。
- shared の Zod スキーマは入力として `'YYYY-MM-DD'` を受け、空文字は `undefined` に正規化する。

### 4. 論理削除を基本にする

- `devices` は物理削除しない。原則として `POST /api/devices/:id/dispose` で `status = 'disposed'` + `deleted_at` 設定。
- `DELETE /api/devices/:id` は誤登録専用。UI上も「完全削除」と明示し、確認ダイアログを挟む。
- 一覧 API はデフォルトで `deleted_at IS NULL` のみ返す。`includeDisposed` フラグで例外的に取得可能。

### 5. AI取り込みのデフォルト挙動

- AI 回答 JSON を反映する `POST /api/devices/:id/ai-import/apply` は **空欄項目のみ反映** がデフォルト（`overwrite = false`）。
- specs / links / consumables / accessories は **重複を回避して追加**（spec_name / url / name で判定）。
- `maintenance_suggestions` は MVP では履歴に直接登録せず、プレビュー表示のみ。
- UI 側で「既存値を上書きする」スイッチを必ず提供し、デフォルトオフを維持すること。

---

## 技術スタック

### モバイル（apps/mobile）

- Expo SDK 54 / React Native 0.81 / React 19.1 / TypeScript
- React Navigation v7（Bottom Tab + Native Stack）
- TanStack Query v5（サーバーステート管理・キャッシュ）
- Axios（HTTPクライアント）
- expo-secure-store（JWT保存）
- expo-clipboard（AIプロンプト/JSONエクスポートのコピー）
- react-hook-form（必要に応じて）

### バックエンド（apps/api）

- Node.js + Fastify 4 + TypeScript
- Prisma 5 + PostgreSQL 16
- @fastify/jwt（JWT認証）
- bcryptjs（パスワードハッシュ）
- Zod（リクエスト検証、shared から import）
- tsx（開発時の TypeScript 実行）

### 共有（packages/shared）

- Zod スキーマと TypeScript 型定義
- 定数（ステータス・ラベル等）
- AI調査プロンプト生成関数 `buildAiResearchPrompt`

### DB / インフラ

- PostgreSQL 16（Docker Compose）
- 将来的にさくらVPS / 自宅サーバー / 他VPS で運用可能な構成

---

## プロジェクト構成

```
HomeGear/
├── apps/
│   ├── api/                          ← Fastify + Prisma サーバー
│   │   ├── src/
│   │   │   ├── server.ts             ← Fastify エントリ
│   │   │   ├── lib/prisma.ts         ← Prisma クライアント
│   │   │   ├── plugins/auth.ts       ← JWT認証 plugin（fastify.authenticate）
│   │   │   ├── routes/               ← REST ルート群
│   │   │   │   ├── auth.ts
│   │   │   │   ├── households.ts
│   │   │   │   ├── devices.ts
│   │   │   │   ├── categories.ts / locations.ts
│   │   │   │   ├── specs.ts / links.ts / maintenance.ts / repairs.ts
│   │   │   │   ├── consumables.ts / accessories.ts / networkInfos.ts
│   │   │   │   ├── aiImport.ts / dashboard.ts / exportData.ts
│   │   │   └── utils/
│   │   │       ├── validate.ts       ← parseBody（Zod統合）
│   │   │       ├── date.ts           ← parseDateOnly / formatDateOnly
│   │   │       ├── serialize.ts      ← serializeDevice（Decimal/Date整形）
│   │   │       └── device-guard.ts   ← ensureDeviceInHousehold
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts               ← demo@example.com / demo1234 を作成
│   └── mobile/                       ← Expo + React Native
│       ├── App.tsx / index.js
│       ├── app.json                  ← extra.apiBaseUrl を環境別に書き換え
│       ├── metro.config.js           ← モノレポ用 watchFolders 設定
│       └── src/
│           ├── api/                  ← Axios + 各リソースAPI
│           ├── components/           ← Button / TextField / Card / Section / ChipSelector / StatusBadge / InfoRow
│           ├── hooks/useAuth.tsx     ← AuthProvider（JWT + SecureStore）
│           ├── lib/queryClient.ts    ← TanStack Query
│           ├── navigation/           ← Tab / Stack 定義
│           ├── screens/
│           │   ├── auth/             ← Login / Register
│           │   ├── DashboardScreen.tsx
│           │   ├── devices/          ← List / Detail / Form / 各子テーブルForm
│           │   ├── aiImport/         ← AiImportScreen
│           │   └── settings/         ← Settings / CategoryManage / LocationManage / Export
│           └── theme.ts              ← COLORS / SPACING / RADIUS
├── packages/
│   └── shared/
│       └── src/
│           ├── constants.ts          ← DEVICE_STATUSES, LINK_TYPES 等
│           └── schemas/              ← Zod schemas（auth/device/spec/link/...）
├── docker-compose.yml                ← PostgreSQL 16
├── package.json                      ← npm workspaces ルート
└── README.md
```

---

## API構成

実行時の baseURL は `apps/mobile/app.json` の `expo.extra.apiBaseUrl` で切替（デフォルト `http://localhost:4000`）。実機検証時は LAN IP に書き換える。

### 認証

| 機能 | エンドポイント | 認証 |
|------|--------------|------|
| 新規登録 | POST /api/auth/register | 不要 |
| ログイン | POST /api/auth/login | 不要 |
| 現在ユーザー | GET /api/auth/me | 必要 |

### 認証必須（Bearer JWT）

すべて `household_id` で自動フィルタリング。

| カテゴリ | エンドポイント |
|----------|--------------|
| 家庭 | GET /api/households/current, /current/members |
| 機器 | GET/POST/PUT/DELETE /api/devices, POST /api/devices/:id/dispose |
| スペック | /api/devices/:id/specs, /api/device-specs/:id |
| リンク | /api/devices/:id/links, /api/device-links/:id |
| メンテ履歴 | /api/devices/:id/maintenance-records, /api/maintenance-records/:id |
| 修理履歴 | /api/devices/:id/repair-records, /api/repair-records/:id |
| 消耗品 | /api/devices/:id/consumables, /api/consumables/:id |
| 付属品 | /api/devices/:id/accessories, /api/accessories/:id |
| ネット情報 | /api/devices/:id/network-info, /api/network-infos/:id |
| マスタ | /api/categories, /api/locations |
| AI取込 | POST /api/ai-import/parse, POST /api/devices/:id/ai-import/apply |
| ダッシュボード | GET /api/dashboard |
| エクスポート | GET /api/export/json |

- API client は `apps/mobile/src/api/client.ts` の axios インスタンス経由で呼び、JWT は interceptor で自動付与。
- shared の Zod スキーマを API でも mobile でも使う（API は `parseBody(schema, req.body, reply)`、mobile は必要に応じて `safeParse`）。

---

## 起動コマンド

ルートの `package.json` 経由：

```powershell
npm run db:up           # PostgreSQL（Docker）起動
npm run db:down         # PostgreSQL停止
npm run api:dev         # API 開発サーバ起動（tsx watch）
npm run api:migrate     # Prisma マイグレーション
npm run api:seed        # Prisma seed
npm run mobile:start    # Expo起動
```

初回セットアップは `README.md` を参照。

---

## コミット・PR時の注意

- `.env` はコミットしない（`.gitignore` 済み）。`.env.example` を更新したら README にも反映する。
- Prisma schema を変更したら必ず migration を生成し、`apps/api/prisma/migrations/` を commit する。
- shared の型/スキーマを変更した場合、API と mobile の両方で参照箇所を更新する（型エラーは shared 経由で出るはず）。
- 機器の子テーブル（specs/links/...）を増やす場合、shared schema → API route → mobile API client → mobile Form 画面 → DeviceDetail 表示 の 5箇所を漏れなく更新する。
