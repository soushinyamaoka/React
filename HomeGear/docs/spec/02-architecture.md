# 2. アーキテクチャ

## 2.1 全体構成

```
[ Expo Go / Expo Web ] <---- HTTPS/HTTP (JSON) ----> [ Fastify API ] <-- Prisma --> [ PostgreSQL 16 ]
       (apps/mobile)                                   (apps/api)                     (docker compose)
              \__________________ packages/shared ____________________/
                                  (Zod schemas + 定数)
```

- モバイル / API は型と検証ロジックを `packages/shared` 経由で共有する
- API は `household_id` でデータを家庭単位に分離（[06-security.md](06-security.md) 参照）
- 認証は JWT（モバイル側は SecureStore / Web 時は localStorage に格納）

## 2.2 技術スタック

### モバイル (`apps/mobile`)

| 種別 | パッケージ | バージョン |
|---|---|---|
| ランタイム | Expo SDK | ~54.0.0 |
| ランタイム | React Native | 0.81.5 |
| ランタイム | React | 19.1.0 |
| 言語 | TypeScript | ~5.9.2 |
| ナビゲーション | @react-navigation/native, native-stack, bottom-tabs | ^7.0.0 |
| サーバーステート | @tanstack/react-query | ^5.51.1 |
| HTTP | axios | ^1.7.2 |
| 認証保管 | expo-secure-store (Native) / localStorage (Web) | ~15.0.8 |
| クリップボード | expo-clipboard | ~8.0.8 |
| アイコン | @expo/vector-icons (Ionicons) | ^15.0.3 |
| Web | react-dom, react-native-web | 19.1.0 / ^0.21.0 |

### バックエンド (`apps/api`)

| 種別 | パッケージ | バージョン |
|---|---|---|
| ランタイム | Node.js | 18+ 推奨 |
| 言語 | TypeScript | ^5.5.3 |
| Web フレームワーク | fastify | ^5.8.5 |
| プラグイン | @fastify/cors, @fastify/sensible, @fastify/jwt | ^10.0.1 / ^6.0.1 / ^10.1.0 |
| プラグインヘルパ | fastify-plugin | ^5.0.1 |
| ORM | @prisma/client / prisma | ^5.22.0 |
| パスワードハッシュ | bcryptjs | ^2.4.3 |
| バリデーション | zod | ^3.23.8 |
| 開発実行 | tsx | ^4.16.2 |

### 共有 (`packages/shared`)

| 種別 | 内容 |
|---|---|
| 言語 | TypeScript |
| 用途 | Zod スキーマと TypeScript 型定義、定数（ステータス・ラベル）、AI 調査プロンプト生成関数 `buildAiResearchPrompt` |
| ビルド | `tsc -p tsconfig.json` で `dist/` に CommonJS + .d.ts を出力 |
| 参照方法 | API: `main` フィールド経由で `dist/index.js`<br>モバイル (Metro): `react-native` フィールド経由で `src/index.ts` をオンザフライ解決 |

### DB / インフラ

| 種別 | 内容 |
|---|---|
| RDBMS | PostgreSQL 16 (alpine) |
| 起動 | `docker compose up -d` |
| マイグレーション | Prisma Migrate |
| ボリューム | `homegear_pgdata` |

## 2.3 モノレポ構成

ルート `package.json` で npm workspaces を使用。

```
HomeGear/
├── apps/
│   ├── api/                          Fastify + Prisma サーバー
│   │   ├── src/
│   │   │   ├── server.ts             Fastify エントリ
│   │   │   ├── lib/prisma.ts         Prisma クライアント
│   │   │   ├── plugins/auth.ts       JWT 認証 plugin (fastify.authenticate)
│   │   │   ├── routes/               REST ルート群
│   │   │   │   ├── auth.ts / households.ts
│   │   │   │   ├── devices.ts
│   │   │   │   ├── categories.ts / locations.ts
│   │   │   │   ├── specs.ts / links.ts / maintenance.ts / repairs.ts
│   │   │   │   ├── consumables.ts / accessories.ts / networkInfos.ts
│   │   │   │   ├── aiImport.ts / dashboard.ts / exportData.ts
│   │   │   └── utils/
│   │   │       ├── validate.ts       parseBody（Zod 統合・型推論修正済み）
│   │   │       ├── date.ts           parseDateOnly / formatDateOnly
│   │   │       ├── serialize.ts      serializeDevice（Decimal/Date 整形）
│   │   │       └── device-guard.ts   ensureDeviceInHousehold
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts               demo@example.com / demo1234
│   │   └── .env / .env.example
│   └── mobile/                       Expo + React Native
│       ├── App.tsx / index.js / app.json / metro.config.js
│       └── src/
│           ├── api/                  Axios + 各リソース API（base URL 自動推論）
│           ├── components/           Button / TextField / Card / Section / ChipSelector / StatusBadge / InfoRow
│           ├── hooks/useAuth.tsx     AuthProvider（JWT + SecureStore/localStorage）
│           ├── lib/queryClient.ts    TanStack Query
│           ├── navigation/           Tab + Stack 定義
│           ├── screens/              auth / Dashboard / devices / aiImport / settings
│           └── theme.ts              COLORS / SPACING / RADIUS
├── packages/
│   └── shared/
│       └── src/
│           ├── index.ts              全 export エントリ
│           ├── constants.ts          DEVICE_STATUSES / LINK_TYPES / MAINTENANCE_TYPES / REPAIR_STATUSES / CONNECTION_TYPES / DEFAULT_CATEGORIES / DEFAULT_LOCATIONS など
│           └── schemas/              auth / device / spec / link / maintenance / repair / consumable / accessory / network / aiImport / dashboard / master の各 Zod スキーマ
├── scripts/
│   └── scenario-test.mjs             API シナリオテスト（node 直実行）
├── docs/
│   └── spec/                         本仕様書
├── docker-compose.yml                PostgreSQL 16
├── package.json                      npm workspaces ルート
└── README.md
```

## 2.4 ビルド依存関係

API 本番ビルド時の依存:

```
packages/shared (tsc)            ← prebuild で先にビルド
        ↓ (dist/index.d.ts を tsconfig paths 経由で参照)
apps/api (tsc -p tsconfig.json)  ← apps/api/dist/server.js を生成
```

- `apps/api/package.json` の `prebuild` で `npm run build --workspace=@homegear/shared` を走らせる
- `dev` (tsx watch) もまず shared をビルドしてから API を watch する
- モバイル側は Metro が `react-native` フィールドを優先するため、shared の dist は不要（src を直接読む）

## 2.5 通信経路

| 経路 | 解決方法 |
|---|---|
| Expo Go 実機 → API | `apps/mobile/src/api/client.ts` で Expo の `hostUri` から開発 PC の IP を取り出し `http://<host>:4000` を組み立てる |
| Android エミュレータ → API | `Platform.OS === 'android'` で `10.0.2.2:4000` にフォールバック |
| iOS シミュレータ / Web → API | `localhost:4000` |
| 明示指定 | `app.json` の `extra.apiBaseUrl` を localhost 以外で設定すると最優先 |

## 2.6 重要な実装上のメモ

- **fastify@5 の空 body 拒否対策**: `apps/api/src/server.ts` で標準 JSON パーサーを差し替え登録し、空ボディは `{}` として扱う。これがないと `POST /api/devices/:id/dispose` などの body 不要な POST が `FST_ERR_CTP_EMPTY_JSON_BODY` で 400 になる
- **`parseBody` の型ジェネリクス**: `apps/api/src/utils/validate.ts` は `<S extends z.ZodTypeAny>` で実装。Zod の OUTPUT 型を正しく伝播させるための工夫
- **Date / Decimal の取り扱い**: Prisma の `@db.Date` / `Decimal` は `serializeDevice` で `'YYYY-MM-DD'` / `number` に整形してから返す。入力は `parseDateOnly` で `Date` に戻す
