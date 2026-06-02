# 4. API 仕様

ベース URL: `http://<host>:4000`（既定）

- 認証は JWT（Bearer）。ヘッダーに `Authorization: Bearer <token>` を付与する
- 認証必須ルートはすべて `household_id` で自動フィルタされる。他家庭のリソースを id 指定しても 404 を返す
- リクエスト・レスポンスはすべて JSON（UTF-8）
- 日付は `'YYYY-MM-DD'` 文字列
- 入力 Zod スキーマは [packages/shared/src/schemas](../../packages/shared/src/schemas) を参照

## 4.1 エンドポイント一覧

### 認証不要

| Method | Path | 内容 |
|---|---|---|
| GET | /health | ヘルスチェック |
| POST | /api/auth/register | 新規登録 + 家庭自動作成 |
| POST | /api/auth/login | ログイン → JWT 発行 |
| POST | /api/auth/logout | クライアント側でトークン破棄するだけの no-op |

### 認証必須（要 Bearer JWT）

| Method | Path | 内容 |
|---|---|---|
| GET | /api/auth/me | 現在ユーザー情報 |
| GET | /api/households/current | 現在の家庭 |
| GET | /api/households/current/members | 家族メンバー一覧 |
| GET | /api/devices | 機器一覧（クエリ多数） |
| GET | /api/devices/:id | 機器詳細（子テーブル全て含む） |
| POST | /api/devices | 機器新規作成 |
| PUT | /api/devices/:id | 機器更新 |
| DELETE | /api/devices/:id | 機器物理削除（誤登録用） |
| POST | /api/devices/:id/dispose | 機器を廃棄済みに変更（論理削除） |
| GET / POST | /api/devices/:id/specs | スペック一覧・新規 |
| PUT / DELETE | /api/device-specs/:id | スペック更新・削除 |
| GET / POST | /api/devices/:id/links | リンク一覧・新規 |
| PUT / DELETE | /api/device-links/:id | リンク更新・削除 |
| GET / POST | /api/devices/:id/maintenance-records | メンテ履歴一覧・新規 |
| PUT / DELETE | /api/maintenance-records/:id | メンテ履歴更新・削除 |
| GET / POST | /api/devices/:id/repair-records | 修理履歴一覧・新規（**機器ステータス同期**） |
| PUT / DELETE | /api/repair-records/:id | 修理履歴更新（**機器ステータス同期**）・削除 |
| GET / POST | /api/devices/:id/consumables | 消耗品一覧・新規 |
| PUT / DELETE | /api/consumables/:id | 消耗品更新・削除 |
| GET / POST | /api/devices/:id/accessories | 付属品一覧・新規 |
| PUT / DELETE | /api/accessories/:id | 付属品更新・削除 |
| GET | /api/devices/:id/network-info | ネット情報取得（無ければ null） |
| POST | /api/devices/:id/network-info | ネット情報 **upsert** |
| PUT | /api/network-infos/:id | ネット情報更新 |
| DELETE | /api/network-infos/:id | ネット情報削除 |
| GET / POST | /api/categories | カテゴリ一覧・新規 |
| PUT / DELETE | /api/categories/:id | カテゴリ更新・削除 |
| GET / POST | /api/locations | 設置場所一覧・新規 |
| PUT / DELETE | /api/locations/:id | 設置場所更新・削除 |
| POST | /api/ai-import/parse | AI 回答 JSON のパース + Zod 検証 |
| POST | /api/devices/:id/ai-import/apply | パース済み payload を機器に反映 |
| GET | /api/dashboard | ダッシュボード集計 |
| GET | /api/export/json | 家庭内全データ JSON エクスポート |

---

## 4.2 認証

### 4.2.1 POST /api/auth/register

新規ユーザー登録 + 家庭の自動作成 + 初期カテゴリ／設置場所の投入 + JWT 発行。

#### リクエスト

```json
{
  "email": "alice@example.com",
  "password": "secret123",
  "name": "Alice",
  "householdName": "Smith家"
}
```

- `password` は 8 文字以上
- `householdName` 省略時は `"${name}の家"` が使われる

#### レスポンス (201)

```json
{
  "token": "<JWT>",
  "user": {
    "id": "cm...",
    "email": "alice@example.com",
    "name": "Alice",
    "householdId": "cm...",
    "householdName": "Smith家",
    "role": "owner"
  }
}
```

#### エラー

- `409` メール重複: `{ "message": "このメールアドレスは既に登録されています" }`
- `400` バリデーション: `{ "message": "入力内容にエラーがあります", "errors": { ... } }`

### 4.2.2 POST /api/auth/login

```json
{ "email": "alice@example.com", "password": "secret123" }
```

`200`: 上記 register と同形式のレスポンス。
`401`: `{ "message": "メールアドレスかパスワードが違います" }`

### 4.2.3 POST /api/auth/logout

クライアント側でトークンを破棄するだけの no-op。`200`: `{ "ok": true }`

### 4.2.4 GET /api/auth/me

```json
{
  "user": {
    "id": "cm...",
    "email": "alice@example.com",
    "name": "Alice",
    "householdId": "cm...",
    "householdName": "Smith家",
    "role": "owner"
  }
}
```

`401`: 未認証 / トークン期限切れ。

---

## 4.3 家庭

### 4.3.1 GET /api/households/current

```json
{ "id": "cm...", "name": "Smith家", "createdAt": "...", "updatedAt": "..." }
```

### 4.3.2 GET /api/households/current/members

```json
[
  { "id": "cm...", "userId": "cm...", "email": "alice@example.com", "name": "Alice", "role": "owner" }
]
```

---

## 4.4 機器

### 4.4.1 GET /api/devices

#### クエリパラメータ

| 名前 | 型 | 説明 |
|---|---|---|
| search | string | 機器名 / メーカー / 型番 / シリアル / メモを横断検索（大文字小文字無視） |
| categoryId | string | カテゴリ絞り込み |
| locationId | string | 設置場所絞り込み |
| status | string | デバイスステータス絞り込み |
| warrantyFilter | enum | `expiring_soon`（今日〜30 日後） / `expired`（過去） / `none`（未設定） |
| sort | enum | `created_desc` / `updated_desc`（既定） / `name_asc` / `warranty_asc` / `purchase_desc` / `next_maintenance_asc` |
| includeDisposed | bool | `true` で論理削除済みも含む |

#### `sort=next_maintenance_asc` の挙動

- 各機器の `maintenanceRecords` のうち `next_due_date IS NOT NULL` のもの最古 1 件を取得
- それで昇順ソート
- `next_due_date` を持たない機器は末尾
- レスポンスには内部利用の `maintenanceRecords` フィールドは含めない

#### レスポンス（一覧の配列）

```json
[
  {
    "id": "cm...",
    "householdId": "cm...",
    "name": "リビング テレビ",
    "categoryId": "cm...",
    "category": { "id": "cm...", "name": "家電", "icon": "tv", "sortOrder": 0, ... },
    "locationId": "cm...",
    "location": { "id": "cm...", "name": "リビング", ... },
    "status": "in_use",
    "priority": "medium",
    "manufacturer": "SHARP",
    "modelNumber": "4T-C50FN1",
    "serialNumber": null,
    "purchaseDate": "2024-03-15",
    "purchasePrice": 89800,
    "warrantyEndDate": "2026-03-15",
    "hasExtendedWarranty": false,
    ...,
    "createdAt": "...",
    "updatedAt": "...",
    "deletedAt": null
  }
]
```

- 最大 500 件
- `purchasePrice` は number、各日付は `'YYYY-MM-DD'` 文字列

### 4.4.2 GET /api/devices/:id

詳細。基本情報に加えて以下を含む:

```json
{
  ...,
  "specs": [ { "id": "...", "specName": "CPU", "specValue": "M2", "unit": null, ... } ],
  "links": [ { "id": "...", "linkType": "manual", "url": "https://...", ... } ],
  "maintenanceRecords": [ ... ],
  "repairRecords": [ ... ],
  "consumables": [ ... ],
  "accessories": [ ... ],
  "networkInfo": { "ipAddress": "192.168.1.10", "port": 8080, ... } | null
}
```

- 子テーブルはそれぞれの自然順（`sortOrder`、または `createdAt`、または `maintenanceDate` 降順）
- 他家庭のリソースは 404

### 4.4.3 POST /api/devices

入力スキーマ: `deviceInputSchema`（[packages/shared/src/schemas/device.ts](../../packages/shared/src/schemas/device.ts)）。

- `name` のみ必須
- 日付は `'YYYY-MM-DD'`（空文字も許容、内部で undefined 化）
- URL 系（`manualUrl`, `supportUrl`, `officialUrl`, `photoUrl` 等）は URL 形式チェック
- `purchasePrice` は 0 以上の数値
- `warrantyEndDate` は `warrantyStartDate` 以降であること

レスポンス `201`: 作成後のデバイス（詳細形式）。

### 4.4.4 PUT /api/devices/:id

入力は POST と同一。`200` で更新後のデバイス。

### 4.4.5 DELETE /api/devices/:id

物理削除。`204 No Content`。**誤登録の救済用**。通常は dispose を使う。

### 4.4.6 POST /api/devices/:id/dispose

論理削除。`status = 'disposed'`、`deletedAt = now()` を設定。`200` で更新後のデバイス。

> **fastify@5 注意**: 本エンドポイントは body を取らないが、Axios のデフォルトで `Content-Type: application/json` が付与され、fastify@5 の標準パーサーは空ボディを拒否する。サーバーで `application/json` の content-type parser を上書きし、空ボディは `{}` として扱うことでこの問題を回避している（[apps/api/src/server.ts](../../apps/api/src/server.ts) 参照）。

---

## 4.5 子テーブル CRUD

7 つの子リソース（specs, links, maintenance, repairs, consumables, accessories, networkInfo）は同じ CRUD パターン:

```
GET    /api/devices/:deviceId/<children>          # 一覧
POST   /api/devices/:deviceId/<children>          # 新規（要 deviceId）
GET    （詳細は親機器の GET に含まれる）
PUT    /api/<resource-singular>/:id               # 更新
DELETE /api/<resource-singular>/:id               # 削除
```

| 親パス | 単数パス |
|---|---|
| /api/devices/:id/specs | /api/device-specs/:id |
| /api/devices/:id/links | /api/device-links/:id |
| /api/devices/:id/maintenance-records | /api/maintenance-records/:id |
| /api/devices/:id/repair-records | /api/repair-records/:id |
| /api/devices/:id/consumables | /api/consumables/:id |
| /api/devices/:id/accessories | /api/accessories/:id |
| /api/devices/:id/network-info | /api/network-infos/:id（PUT/DELETE） |

### 4.5.1 修理履歴（特殊）

POST と PUT の両方で機器ステータスを自動同期する。詳細は [03-data-model.md §3.3.10](03-data-model.md#3310-repair_records) 参照。

#### POST /api/devices/:id/repair-records

```json
{
  "occurredDate": "2026-05-01",
  "symptom": "電源が入らない",
  "cause": null,
  "actionTaken": null,
  "repairVendor": "メーカー修理",
  "cost": null,
  "usedWarranty": false,
  "completedDate": null,
  "status": "pending",
  "memo": null
}
```

`completedDate` を指定する場合は `occurredDate` 以降であること。

#### PUT /api/repair-records/:id

POST と同じ入力。`status` が変わると親機器の `devices.status` が同期される。

### 4.5.2 ネットワーク情報（特殊）

機器に 1 件しか存在しないため、`POST /api/devices/:id/network-info` は **upsert**（既存があれば更新、なければ作成）。

```json
{
  "ipAddress": "192.168.1.50",
  "hostName": "nas-01",
  "macAddress": "aa:bb:cc:dd:ee:ff",
  "adminUrl": "https://192.168.1.50",
  "port": 5000,
  "connectionType": "ethernet",
  "credentialStorageMemo": "1Password に保存",
  "settingsMemo": "DHCP リース外で固定"
}
```

- `port` は 0〜65535
- `adminUrl` は URL 形式
- **パスワードや API キー本体は保存しない**（保管場所のメモのみ）

---

## 4.6 マスタ

### 4.6.1 GET/POST/PUT/DELETE /api/categories

入力: `{ "name": "...", "icon": "tv", "sortOrder": 0 }`。`name` 必須。`(household_id, name)` が unique のため重複時は 409。

### 4.6.2 GET/POST/PUT/DELETE /api/locations

入力: `{ "name": "...", "memo": null, "sortOrder": 0 }`。`name` 必須。

---

## 4.7 AI 取込

### 4.7.1 POST /api/ai-import/parse

#### リクエスト

```json
{
  "rawJson": "{ \"device\": { \"name\": \"...\", ... }, \"specs\": [...], ... }",
  "deviceId": "cm..." // 任意。指定すると既存値を比較対象として返す
}
```

#### レスポンス

```json
{
  "payload": { ... 解析・正規化されたペイロード ... },
  "existingDevice": { ... deviceId 指定時のみ ... } | null
}
```

- パース失敗: `400` + `{ "message": "JSONとして解析できませんでした", "detail": "..." }`
- スキーマ違反: `400` + Zod の `errors.flatten()`

### 4.7.2 POST /api/devices/:id/ai-import/apply

#### リクエスト

```json
{
  "payload": { /* parse の結果 */ },
  "overwrite": false,
  "applySpecs": true,
  "applyLinks": true,
  "applyConsumables": true,
  "applyAccessories": true
}
```

- `overwrite=false`（既定）: **空欄項目のみ反映**。既存に値があるフィールドはスキップ
- `overwrite=true`: 既存値を上書き
- specs は `spec_name`、links は `url`、consumables / accessories は `name` で重複判定（重複は追加しない）
- `device.summary` は `device.memo` に既存とは別行で追記される
- 反映後、`ai_import_logs` に `parsed_json` と `memo: 'apply'` を保存

#### レスポンス

```json
{
  "ok": true,
  "counts": {
    "deviceFieldsUpdated": 2,
    "specsCreated": 5,
    "linksCreated": 1,
    "consumablesCreated": 0,
    "accessoriesCreated": 0
  }
}
```

---

## 4.8 ダッシュボード

### GET /api/dashboard

```json
{
  "deviceCount": 12,
  "warrantyExpiringSoonDevices": [ /* 30 日以内に保証切れ、保証期限 asc、最大 20 */ ],
  "warrantyExpiredDevices":      [ /* 保証期限が過去、保証期限 desc、最大 20 */ ],
  "upcomingMaintenanceDevices":  [ /* 30 日以内に次回メンテ予定（機器でユニーク） */ ],
  "brokenDevices":               [ /* status in ('broken', 'repairing') */ ],
  "recentDevices":               [ /* 最近更新 10 件 */ ],
  "incompleteDevices":           [ /* 型番・保証期限・設置場所いずれかが未登録、最大 20 */ ]
}
```

各要素のサマリ形式:

```json
{
  "id": "cm...",
  "name": "...",
  "manufacturer": "...",
  "modelNumber": "...",
  "status": "in_use",
  "categoryName": "家電",
  "locationName": "リビング",
  "warrantyEndDate": "2026-03-15",
  "nextMaintenanceDate": "2026-06-01" // upcomingMaintenanceDevices のみ
}
```

---

## 4.9 エクスポート

### GET /api/export/json

家庭内全データを JSON で返す。`Content-Disposition: attachment` 付き。

```json
{
  "exportedAt": "2026-05-26T02:31:12.000Z",
  "household": { ... },
  "categories": [ ... ],
  "locations": [ ... ],
  "devices": [
    {
      "id": "...",
      ...,
      "category": { ... },
      "location": { ... },
      "specs": [...],
      "links": [...],
      "maintenanceRecords": [...],
      "repairRecords": [...],
      "consumables": [...],
      "accessories": [...],
      "networkInfo": { ... } | null
    }
  ]
}
```

論理削除済みの機器も含む。

---

## 4.10 エラーレスポンス共通

| ステータス | 形式 | 発生条件 |
|---|---|---|
| 400 | `{ "message": "入力内容にエラーがあります", "errors": { ... } }` | Zod 検証失敗 |
| 401 | `{ "message": "認証が必要です" }` | JWT なし / 期限切れ |
| 403 | `{ "message": "所属している家庭が見つかりません" }` | ユーザーは存在するが household_members に行がない |
| 404 | `{ "message": "<リソース>が見つかりません" }` | id 不一致 or 他家庭のリソース |
| 409 | `{ "message": "..." }` | unique 制約違反（メール重複・カテゴリ名重複など） |
| 500 | （Fastify 標準） | 想定外の例外 |

## 4.11 シナリオテスト

[scripts/scenario-test.mjs](../../scripts/scenario-test.mjs) に 45 件の自動テストがあり、API 起動後 `node scripts/scenario-test.mjs` で全シナリオを実行できる。テスト対象:

- 認証フロー
- デバイス CRUD（dispose 含む）
- 修理ステータス同期（POST / PUT 両方）
- `next_maintenance_asc` ソート
- 家庭分離（B の token で A のリソースにアクセスできないこと）
- 子テーブル CRUD
- ダッシュボード・マスタ・エクスポート
