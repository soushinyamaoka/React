# HomeGear

家庭内機器管理スマホアプリ。家電・IT機器・ネットワーク機器・スマートホーム機器など、家庭内のあらゆる機器を「家庭内機器台帳」として一元管理します。

- **モバイル**: Expo (SDK 54) + React Native + TypeScript + React Navigation v7 + TanStack Query
- **API**: Node.js + Fastify + TypeScript + Prisma
- **DB**: PostgreSQL 16 (Docker Compose)
- **モノレポ**: npm workspaces

正式データはサーバ側PostgreSQLに保存し、家族間でhousehold単位で共有します。

## ディレクトリ構成

```
HomeGear/
├── apps/
│   ├── api/          Fastify + Prisma サーバー
│   └── mobile/       Expo + React Native アプリ
├── packages/
│   └── shared/       Zodスキーマ・型・定数（API/Mobile 共有）
└── docker-compose.yml
```

## セットアップ手順

### 1. 依存パッケージインストール

ルートで実行：

```powershell
npm install
```

### 2. PostgreSQL を起動

```powershell
npm run db:up
```

`localhost:5432` で起動します（DB名 `homegear`, user `homegear`, password `homegear_dev_password`）。

### 3. Prisma マイグレーション・シード実行

```powershell
cd apps\api
copy .env.example .env   # 既に .env はある場合スキップ
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

シードで作成される初期ユーザー：

- email: `demo@example.com`
- password: `demo1234`

家庭名「デモ家庭」、owner として登録、初期カテゴリ・初期設置場所が投入されます。

### 4. API サーバー起動

```powershell
npm run api:dev
```

`http://localhost:4000/health` でヘルスチェックできます。

### 5. モバイルアプリ起動

別のターミナルで：

```powershell
npm run mobile:start
```

Expo の QR コードをスマホで読み取って Expo Go で開きます。

**実機から API に接続する場合**：`apps/mobile/app.json` の `expo.extra.apiBaseUrl` を PC の LAN IP に書き換えてください（例：`http://192.168.1.10:4000`）。

## API エンドポイント概要

### 認証不要

- `POST /api/auth/register` – ユーザー＋家庭新規作成
- `POST /api/auth/login` – ログイン
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### 認証必須（Bearer JWT）

- `GET/POST/PUT/DELETE /api/devices` – 機器CRUD
- `POST /api/devices/:id/dispose` – 廃棄済みに変更
- `GET/POST/PUT/DELETE /api/devices/:id/specs`, `/api/device-specs/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/links`, `/api/device-links/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/maintenance-records`, `/api/maintenance-records/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/repair-records`, `/api/repair-records/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/consumables`, `/api/consumables/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/accessories`, `/api/accessories/:id`
- `GET/POST/PUT/DELETE /api/devices/:id/network-info`, `/api/network-infos/:id`
- `GET/POST/PUT/DELETE /api/categories`, `/api/locations`
- `POST /api/ai-import/parse`, `POST /api/devices/:id/ai-import/apply`
- `GET /api/dashboard`
- `GET /api/export/json`

## モバイル画面構成

5タブ構成：

1. **ホーム** — ダッシュボード（保証期限・修理中・メンテ予定・情報不足）
2. **機器** — 機器一覧 → 詳細 → 各種子情報（スペック・履歴等）
3. **追加** — タップで機器登録画面を起動
4. **AI取込** — AI調査用プロンプト生成→JSON貼り付け→プレビュー→反映
5. **設定** — カテゴリ／設置場所管理・JSONエクスポート・ログアウト

## AI取り込みの使い方

1. AI取込タブで反映先の機器を選択
2. 機器名・メーカー・型番・カテゴリを入力すると、プロンプトが自動生成される
3. 「プロンプトをコピー」を押して ChatGPT / Claude / Gemini 等に貼り付ける
4. AI の JSON 回答をアプリの「AI回答JSON」欄に貼り付ける
5. 「解析してプレビュー」で内容を確認
6. 「既存値を上書きする」のスイッチで挙動を制御し、「この内容で機器に反映」で反映

デフォルトでは空欄項目のみ反映、URLは形式チェック、specs/links/consumables/accessories は重複を回避して追加されます。

## セキュリティ方針

- パスワードは bcrypt でハッシュ化
- パスワード・APIキー・秘密鍵そのものは機器情報として保存しない（保管場所のメモのみ）
- 全APIは JWT による認証必須（auth系を除く）
- household_id によりデータを家庭単位で分離

## 既知の制限事項（MVP）

- QRコード／プッシュ通知／OCR／ファイルアップロードは未実装（URL保存のみ）
- AI API直接利用は未実装（コピペ方式のみ）
- 端末内SQLiteオフライン同期は未実装
- 家族の招待機能は未実装（複数ユーザーで使う場合は手動で `household_members` に追加するか、招待機能の将来実装が必要）
- 写真ピッカーは未実装（URLを手入力）

## 開発スクリプト

ルート package.json：

```
npm run db:up           # PostgreSQL起動
npm run db:down         # PostgreSQL停止
npm run api:dev         # API開発サーバ起動
npm run api:migrate     # Prismaマイグレーション
npm run api:seed        # Prismaシード
npm run mobile:start    # Expo起動
```
