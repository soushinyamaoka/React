# 6. セキュリティ

## 6.1 認証方式

- メールアドレス + パスワード
- JWT を `@fastify/jwt` で発行
- 有効期限: 7 日（`sign: { expiresIn: '7d' }`）
- 秘密鍵: 環境変数 `JWT_SECRET`（dev フォールバック `dev-secret-please-change`）

### パスワードハッシュ

- bcrypt（コストファクタ 10）でハッシュ化して `users.password_hash` に保存
- 平文パスワードを DB / ログに残さない

### JWT の保管

| プラットフォーム | 保管場所 |
|---|---|
| iOS / Android | `expo-secure-store`（Keychain / Keystore） |
| Web | `window.localStorage`（テスト用途のみ想定） |

実装は [apps/mobile/src/api/client.ts](../../apps/mobile/src/api/client.ts) の `setStoredToken` / `getStoredToken` で Platform 分岐。

### Axios インターセプター

```ts
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 6.2 認証・認可フロー（API 側）

[apps/api/src/plugins/auth.ts](../../apps/api/src/plugins/auth.ts):

```
preHandler: authenticate
  1. req.jwtVerify() で JWT を検証
  2. payload から userId を取り出す
  3. household_members から該当ユーザーの最古所属を引く
  4. req.auth = { userId, householdId, role } を作る
```

各ルートはこの `req.auth.householdId` を必ず使ってクエリを絞り込む。

```ts
// 例: 他家庭の id を渡しても 404 を返す
const exists = await prisma.device.findFirst({
  where: { id, householdId: req.auth.householdId },
});
if (!exists) return reply.code(404).send({ message: '機器が見つかりません' });
```

ヘルパ:

- `ensureDeviceInHousehold(deviceId, householdId, reply)` 〜 `apps/api/src/utils/device-guard.ts`
- 子テーブルのルートはまずこれで親機器の所属を確認してから処理する

## 6.3 データ分離（household_id）

- すべての家庭スコープのテーブルに `household_id` 列を持たせる
- API は `WHERE household_id = req.auth.householdId` を必ず付ける
- 新規ルートを書く場合は **「`householdId` フィルタを書いたか」を必ず確認すること**（CLAUDE.md にも明記）
- シナリオテスト ([scripts/scenario-test.mjs](../../scripts/scenario-test.mjs)) の `household_id 分離` セクションで他家庭のリソースに 404 が返ることをカバー済

## 6.4 機密情報の取り扱い方針

| 種別 | 保存可否 |
|---|---|
| ユーザーパスワード | 〇 bcrypt(10) でハッシュ化のうえ保存 |
| 機器のパスワード（Wi-Fi・管理画面・API キー等） | **不可**。代わりに「保管場所メモ」のみ可（例: `"1Password に保存"`） |
| 秘密鍵・アクセストークン | **不可** |
| 機器の管理 URL | 〇（network_infos.admin_url） |
| 機器の IP アドレス・ホスト名・MAC | 〇 |

`network_infos.credential_storage_memo` がパスワード等の保管場所を示すフリーテキスト欄。値そのものは入れない運用を徹底する。

## 6.5 CORS

```ts
app.register(cors, { origin: true });
```

開発用に全許可。本番ではフロントのオリジンを絞ること。

## 6.6 トランスポート

- 本番では HTTPS を前提とする（リバースプロキシで TLS 終端する想定）
- JWT を含む通信は HTTPS で運用すること
- 開発時のローカル接続は HTTP（`http://<host>:4000`）

## 6.7 入力検証

- すべてのリクエストボディは Zod (`packages/shared`) で検証
- API ルート側は `parseBody(schema, req.body, reply)` を必ず通す
- 400 エラーは Zod の `error.flatten()` を返す

## 6.8 脆弱性対策

### 6.8.1 npm audit 状況

`npm audit --omit=dev` の結果（2026-05-26 時点）:

- critical: 0
- high: 0
- moderate: 11（すべて Expo の内部依存: postcss / uuid / xcode 系。Expo SDK アップデート待ち）

### 6.8.2 依存パッケージ

| パッケージ | バージョン | 注記 |
|---|---|---|
| fastify | ^5.8.5 | 4 → 5 移行済（fast-jwt critical 解消のため） |
| @fastify/jwt | ^10.1.0 | fastify 5 対応版 |
| @fastify/cors | ^10.0.1 | |
| @fastify/sensible | ^6.0.1 | |
| bcryptjs | ^2.4.3 | |

### 6.8.3 fastify@5 移行時の注意

- 標準 JSON パーサーが空 body を拒否するように変更された（`FST_ERR_CTP_EMPTY_JSON_BODY`）
- `POST /api/devices/:id/dispose` のような body 不要 POST が落ちる
- 対策として [apps/api/src/server.ts](../../apps/api/src/server.ts) で `application/json` の content-type parser を上書きし、空ボディは `{}` として扱う

## 6.9 個人情報の取り扱い

- ユーザー情報（email / name）は家庭メンバーの一覧 API でのみ参照可能
- 招待機能未実装のため、他家庭のメンバー情報には API 経由でアクセスできない

## 6.10 監査ログ

- AI 取込のみ `ai_import_logs` に履歴を残す（`parsed_json` を保存）
- それ以外のアクセスログは Fastify の logger（NODE_ENV=production なら info、それ以外は debug）にのみ出力
- 本番運用時はログ集約基盤を別途準備すること（MVP 範囲外）

## 6.11 開発時の注意

- `.env` はコミットしない（`.gitignore` 済）
- `.env.example` を更新したら README にも反映
- `JWT_SECRET` は最低 32 文字のランダム文字列を使用すること
- 本番デプロイ前に `dev-only-secret-change-me-please-make-it-at-least-32-chars` をローテーションすること
