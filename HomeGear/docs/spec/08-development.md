# 8. 開発ガイド

## 8.1 必要環境

| ツール | バージョン目安 |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Docker / Docker Compose | 最新 |
| Expo CLI | npx で都度実行（インストール不要） |
| iOS / Android 実機検証 | Xcode / Android Studio または Expo Go アプリ |

## 8.2 初回セットアップ

```powershell
# 1. リポジトリ取得後、ルートで依存解決
npm install

# 2. .env を準備（apps/api/.env.example をコピー）
cp apps/api/.env.example apps/api/.env

# 3. PostgreSQL を起動
npm run db:up

# 4. Prisma マイグレーション + seed
cd apps/api
npx prisma generate
npx prisma migrate dev --name init   # 初回のみ
npx tsx prisma/seed.ts                # demo@example.com / demo1234 を作成
cd ../..
```

## 8.3 起動コマンド（日常開発）

すべてリポジトリルートから実行する。

```powershell
npm run db:up                # PostgreSQL 起動
npm run db:down              # PostgreSQL 停止
npm run db:logs              # PostgreSQL ログ追跡

npm run api:dev              # API 開発サーバ（tsx watch）
npm run api:migrate          # Prisma migrate dev
npm run api:seed             # Prisma seed

npm run mobile:start         # Expo Dev Server
npm run mobile:android       # Expo を Android で起動
npm run mobile:ios           # Expo を iOS で起動
```

`api:dev` は自動的に `packages/shared` を先にビルドしてから tsx watch を立ち上げる。

## 8.4 ワークスペース別コマンド

```powershell
# shared だけビルド
npm run build --workspace=@homegear/shared

# api を本番ビルド（dist/server.js を生成）
npm run build --workspace=@homegear/api

# api を本番起動
npm run start --workspace=@homegear/api

# mobile を Web で起動
npm run web --workspace=@homegear/mobile
```

## 8.5 ディレクトリ別の役割（再掲）

| ディレクトリ | 内容 |
|---|---|
| `apps/api` | Fastify + Prisma サーバー |
| `apps/mobile` | Expo + React Native アプリ |
| `packages/shared` | Zod / 型 / 定数の共有パッケージ |
| `scripts` | シナリオテスト等のスタンドアロンスクリプト |
| `docs` | 本仕様書 |
| `docker-compose.yml` | PostgreSQL 16 |

## 8.6 子テーブルを追加するときの手順

CLAUDE.md にもある通り、機器の子テーブル（specs / links / maintenance / repairs / consumables / accessories / network_infos）は同じ CRUD パターンで実装されているため、何か変更する際は **横展開漏れに注意**。

新しい子テーブルを追加する場合の更新箇所:

1. `apps/api/prisma/schema.prisma` にモデル追加 → `prisma migrate dev`
2. `packages/shared/src/schemas/<name>.ts` に Zod スキーマ追加 → `src/index.ts` で re-export
3. `packages/shared/src/constants.ts` に列挙型がある場合は追加
4. `apps/api/src/routes/<name>.ts` に CRUD ルートを実装 → `apps/api/src/server.ts` で register
5. `apps/mobile/src/api/<name>.ts` に axios クライアント関数を追加
6. `apps/mobile/src/screens/devices/<Name>FormScreen.tsx` を追加 → `navigation/types.ts` と `navigation/index.tsx` にも登録
7. `apps/mobile/src/screens/devices/DeviceDetailScreen.tsx` に表示セクションを追加
8. `scripts/scenario-test.mjs` にテスト追加

## 8.7 テスト

### 8.7.1 API シナリオテスト

```powershell
# 事前に API を起動しておくこと
node scripts/scenario-test.mjs
```

カバー対象:

- 認証フロー（register / login / me / 認証チェック）
- デバイス CRUD（dispose / includeDisposed フィルタ含む）
- 修理ステータス → 機器ステータス同期（POST と PUT 両方）
- `next_maintenance_asc` ソート
- 家庭分離（B の token で A のリソースが見えない）
- 子テーブル CRUD と詳細含有確認
- ダッシュボード / マスタ / エクスポート

全 45 件。失敗時は赤色 FAIL + 詳細を表示する。

### 8.7.2 型チェック

```powershell
# shared + api
npm run build --workspace=@homegear/api

# mobile
cd apps/mobile && npx tsc --noEmit
```

### 8.7.3 ユニットテスト

MVP では未導入。追加する場合は API 側は `vitest`、モバイルは `@testing-library/react-native` を推奨。

## 8.8 デバッグ

### 8.8.1 API

- `tsx watch` でファイル変更時に自動再起動
- Fastify の logger は dev で debug レベル
- Prisma クエリは必要時に `log: ['query']` を `apps/api/src/lib/prisma.ts` に追加して有効化

### 8.8.2 モバイル

- Expo Dev Server（`npm run mobile:start`）で QR コードを Expo Go で読み取る
- ブラウザの React Native Debugger（dev menu の「Debug」）でログ確認
- API 接続先の自動推論は `apps/mobile/src/api/client.ts` の `resolveBaseUrl()` 参照

### 8.8.3 DB

```powershell
npx prisma studio --workspace=@homegear/api
# あるいは
cd apps/api && npx prisma studio
```

ブラウザの Prisma Studio で各テーブルを参照できる。

## 8.9 コミット規約

CLAUDE.md より:

- `.env` はコミットしない
- スキーマ変更したらマイグレーションも commit する
- shared の型/スキーマを変更したら API・mobile の両方で参照箇所を更新する
- 子テーブルの修正時は **shared schema → API route → mobile API client → mobile Form 画面 → DeviceDetail 表示** の 5 箇所を漏れなく更新する

## 8.10 リリース手順（想定）

> MVP では EAS 設定未実施。下記は将来のリファレンス。

### API

1. `npm run build --workspace=@homegear/api`
2. サーバーに `apps/api/dist`、`apps/api/package.json`、`packages/shared/dist`、`prisma/`、`.env` を配置
3. `npm ci --omit=dev --workspaces=false` で依存解決（または `node_modules` 同梱）
4. `npx prisma migrate deploy`
5. `npm run start --workspace=@homegear/api`

### モバイル

1. `apps/mobile/app.json` の `extra.apiBaseUrl` を本番 URL に書き換え
2. EAS Build（Internal Distribution / TestFlight）
3. 受入後にストア提出または家庭内配布

## 8.11 トラブルシューティング

| 症状 | 対処 |
|---|---|
| `npm install` で ERESOLVE | `react-native-screens` などのバージョン整合性を確認。`npx expo install --fix` で SDK 推奨版に揃える |
| `npm run build --workspace=@homegear/api` で TS6059 | `packages/shared` が未ビルド。`npm run build --workspace=@homegear/shared` を先に実行（`prebuild` で自動化済） |
| Expo Web で `ExpoSecureStore.default.deleteValueWithKeyAsync is not a function` | Platform 分岐の漏れ。`apps/mobile/src/api/client.ts` を参照 |
| `POST /dispose` が 400（FST_ERR_CTP_EMPTY_JSON_BODY） | `apps/api/src/server.ts` の content-type parser が登録されているか確認 |
| 実機 Expo Go で `localhost` に繋がらない | `apps/mobile/src/api/client.ts` の `resolveBaseUrl()` が `hostUri` から自動取得するため通常は自動解決。`app.json` の `extra.apiBaseUrl` を localhost 以外で明示している場合はそれが最優先される |
| Android エミュレータで API に接続できない | 自動推論で `10.0.2.2:4000` にフォールバックする。それでも繋がらない場合は API の `HOST=0.0.0.0` を確認 |

## 8.12 参照リンク

- Expo monorepo guide: <https://docs.expo.dev/guides/monorepos/>
- Fastify v5 migration: <https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/>
- Prisma docs: <https://www.prisma.io/docs>
- TanStack Query v5: <https://tanstack.com/query/v5>
- React Navigation v7: <https://reactnavigation.org/docs/getting-started>
