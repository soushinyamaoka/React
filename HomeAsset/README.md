# HomeAsset

家庭内資産・住宅設備管理スマホアプリ。家電、IT機器、ネットワーク機器、住宅設備（給湯器・キッチン・浴室など）、建物部位（外壁・屋根・窓など）、家具、工具を「家庭内資産台帳」として一元管理します。

- **モバイル**: Expo (SDK 54) + React Native + TypeScript + React Navigation v7 + TanStack Query
- **API**: Node.js + Fastify + TypeScript + Prisma
- **DB**: PostgreSQL 16 (Docker Compose、ポート5433)
- **モノレポ**: npm workspaces

正式データはサーバ側PostgreSQLに保存し、家族間で `household` 単位で共有します。

## よく使うコマンド（起動・停止）

DB・API・Expo をまとめて操作できます。ルート（`HomeAsset/`）で実行してください。

```powershell
npm run app:start     # 起動    : DB(Docker) + API + Expo を一括起動（API/Expoは別ウィンドウ）
npm run app:stop      # 停止    : API・Expo を終了し DB を停止
npm run app:restart   # 再起動  : stop → start
npm run app:status    # 状態確認: 各サービスの稼働状況を表示
```

- 初回のみ別途セットアップが必要です（下記「セットアップ手順」を参照）。
- `app:start` は Docker Desktop の起動が前提です。
- 実機で動かすときは `apps/mobile/app.json` の `expo.extra.apiBaseUrl` をPCのLAN IPに設定し、スマホとPCを同じWi-Fiに接続してください。

## 仕様書

詳細な仕様は [`docs/`](docs/README.md) を参照してください。

| ドキュメント | 内容 |
| --- | --- |
| [docs/01-overview.md](docs/01-overview.md) | システム概要・アーキテクチャ・技術スタック |
| [docs/02-data-model.md](docs/02-data-model.md) | DB（Prisma）全テーブル定義・リレーション・列挙値 |
| [docs/03-api.md](docs/03-api.md) | REST API 全エンドポイント・認証・バリデーション |
| [docs/04-screens.md](docs/04-screens.md) | モバイル画面・ナビゲーション・ユースケース |
| [docs/05-non-functional.md](docs/05-non-functional.md) | セキュリティ・非機能要件・運用・MVP制約 |

## 中心概念: home_assets

機器も住宅設備も建物部位も `home_assets` で統一管理し、`asset_type` で次の6種別を区別します。

- `device` 機器（家電・IT・スマートホーム・防犯カメラ等）
- `housing_equipment` 住宅設備（給湯器・キッチン・浴室・トイレ等）
- `building_part` 建物部位（外壁・屋根・窓・玄関ドア等）
- `furniture` 家具
- `tool` 工具
- `other` その他

PCのCPUやNASのRAID構成、外壁の塗料名、給湯器の号数など、カテゴリで異なる仕様項目は `home_assets` の固定カラムにせず、`asset_specs` テーブルに自由項目として保持します。

## ディレクトリ構成

```
HomeAsset/
├── apps/
│   ├── api/          Fastify + Prisma サーバー
│   └── mobile/       Expo + React Native アプリ
├── packages/
│   └── shared/       Zodスキーマ・型・定数（API/Mobile 共有）
├── docs/             仕様書
└── docker-compose.yml
```

## セットアップ手順

### 1. 依存パッケージインストール

ルートで実行:

```powershell
npm install
```

#### 依存解決をやり直す場合

`@expo/vector-icons` や `expo-font` のバージョン警告が出る場合は、既存の `package-lock.json` と `node_modules` を完全に削除してから入れ直してください。`overrides` を効かせるには lock の再生成が必要です。

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
cd apps\mobile
npm ls expo-font           # 14.0.11 単一に揃っていることを確認
npx expo-doctor            # 警告が出ないことを確認
```

### 2. PostgreSQL を起動

```powershell
npm run db:up
```

`localhost:5433` で起動します（DB名 `homeasset`, user `homeasset`, password `homeasset_dev_password`）。
HomeGearと併用してもポート衝突しないよう、HomeAssetは **5433** を使用します。

### 3. Prisma マイグレーション・シード実行

```powershell
cd apps\api
copy .env.example .env   # 既に .env がある場合はスキップ
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

シードで作成される初期ユーザー:

- email: `demo@example.com`
- password: `demo1234`

家庭名「デモ家庭」、owner として登録、初期カテゴリ・初期設置場所（階層あり）が投入されます。

### 4. API サーバー起動

```powershell
npm run api:dev
```

`http://localhost:4001/health` でヘルスチェックできます。

### 5. モバイルアプリ起動

別ターミナルで:

```powershell
npm run mobile:start
```

Expo の QR コードを Expo Go で読み取って開きます。

**実機から API に接続する場合**: `apps/mobile/app.json` の `expo.extra.apiBaseUrl` を PC の LAN IP に書き換えてください（例: `http://192.168.1.10:4001`）。

## API エンドポイント概要

### 認証不要

- `POST /api/auth/register` ユーザー＋家庭新規作成
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### 認証必須（Bearer JWT）

- `GET/POST/PUT/DELETE /api/assets` 資産CRUD
- `POST /api/assets/:id/dispose` 廃棄済みに変更
- `POST /api/assets/:id/replace` 交換済みに変更
- `GET/POST/PUT/DELETE /api/assets/:id/specs`, `/api/asset-specs/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/links`, `/api/asset-links/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/maintenance-records`, `/api/maintenance-records/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/repair-records`, `/api/repair-records/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/consumables`, `/api/consumables/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/accessories`, `/api/accessories/:id`
- `GET/POST/PUT/DELETE /api/assets/:id/network-info`, `/api/network-infos/:id`
- `GET/POST/PUT/DELETE /api/categories`, `/api/locations`
- `POST /api/ai-import/parse`, `POST /api/assets/:id/ai-import/apply`, `POST /api/ai-import/create-and-apply`
- `GET /api/dashboard`
- `GET /api/export/json`

## モバイル画面構成

5タブ構成:

1. **ホーム** ダッシュボード（保証期限・修理中・メンテ予定・交換予定・情報不足）
2. **資産** 資産一覧 → 詳細 → 各種子情報（スペック・履歴等）
3. **追加** タップで資産登録画面を起動
4. **AI取込** AI調査用プロンプト生成 → JSON貼り付け → プレビュー → 反映
5. **設定** カテゴリ／設置場所管理・JSONエクスポート・ログアウト

## AI取り込みの使い方

1. AI取込タブで「新規作成」か「既存資産に反映」を選択
2. 名称・管理対象種別・メーカー・型番・カテゴリを入力すると、プロンプトが自動生成される
3. 「プロンプトをコピー」を押して ChatGPT / Claude / Gemini 等に貼り付ける
4. AI の JSON 回答をアプリの「AI回答JSON」欄に貼り付ける
5. 「解析してプレビュー」で内容を確認
6. 「既存値を上書きする」のスイッチで挙動を制御し、反映ボタンで適用

デフォルトでは空欄項目のみ反映、URLは形式チェック、specs/links/consumables/accessories は重複を回避して追加されます。

## セキュリティ方針

- パスワードは bcrypt でハッシュ化
- パスワード・APIキー・秘密鍵そのものは資産情報として保存しない（保管場所のメモのみ）
- 全APIは JWT による認証必須（auth系を除く）
- `household_id` によりデータを家庭単位で分離

## 既知の制限事項（MVP）

- QRコード／プッシュ通知／OCR／ファイルアップロードは未実装（URL保存のみ）
- AI API直接利用は未実装（コピペ方式のみ）
- 端末内SQLiteオフライン同期は未実装
- 家族の招待機能は未実装（複数ユーザーで使う場合は手動で `household_members` に追加するか、招待機能の将来実装が必要）
- `npm audit` で Expo SDK 54 系の間接依存（postcss / uuid 経由）に moderate 11 件出ます。`npm audit fix --force` は `expo@56` への破壊的アップグレードを提示するため適用しないこと。Expo SDK 全体のアップグレード時にまとめて解消します。

## 開発スクリプト

ルート `package.json`:

```
npm run db:up           PostgreSQL起動
npm run db:down         PostgreSQL停止
npm run api:dev         API開発サーバ起動
npm run api:migrate     Prismaマイグレーション
npm run api:seed        Prismaシード
npm run mobile:start    Expo起動
```
