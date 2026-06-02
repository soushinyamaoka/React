# 3. データモデル

正規の定義は [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)。本ドキュメントはその要約と運用方針の補足。

## 3.1 設計原則

- すべての家庭スコープのテーブルに `household_id` を持たせる
- 主キーは Prisma の `@default(cuid())`（25 文字程度の URL セーフ文字列）
- 機器の物理削除は誤登録時の救済用。通常は **論理削除（`devices.status = 'disposed'` + `devices.deleted_at`）** を使う
- 機器固有のスペック（CPU・解像度・容量など）は `devices` に固定カラムを追加せず、`device_specs` に自由項目で持つ
- ネットワーク情報はパスワード本体を保存せず、保管場所メモのみ

## 3.2 テーブル一覧

| テーブル | 役割 |
|---|---|
| `households` | 家庭（データ分離の単位） |
| `users` | ユーザー |
| `household_members` | 家庭とユーザーの関連 + ロール |
| `categories` | 家庭固有のカテゴリ |
| `locations` | 家庭固有の設置場所 |
| `devices` | 機器（メインリソース） |
| `device_specs` | 機器のスペック（自由項目） |
| `device_links` | 機器に紐づく URL（取説・保証書など） |
| `maintenance_records` | メンテナンス履歴 |
| `repair_records` | 修理履歴 |
| `consumables` | 消耗品 |
| `accessories` | 付属品 |
| `network_infos` | ネットワーク機器の IP/管理 URL（機器に 1 対 1） |
| `ai_import_logs` | AI 取込実行履歴 |

## 3.3 テーブル詳細

### 3.3.1 households

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | PK |
| name | string | 家庭名 |
| created_at / updated_at | timestamp | |

リレーション: members / devices / categories / locations / 子テーブル群 / aiImportLogs

### 3.3.2 users

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | PK |
| email | string | unique |
| name | string | |
| password_hash | string | bcrypt(10) |
| created_at / updated_at | | |

### 3.3.3 household_members

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | PK |
| household_id | FK | households.id (onDelete: Cascade) |
| user_id | FK | users.id (onDelete: Cascade) |
| role | string | `owner` / `member`（MVP では権限差なし） |
| 制約 | unique(household_id, user_id) | |
| インデックス | (user_id) | |

ログイン後の `household` 特定は `findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } })` で最古所属を使う。

### 3.3.4 categories

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | |
| household_id | FK | |
| name | string | 家庭内 unique |
| icon | string? | Ionicons のアイコン名（例: `tv`, `laptop`） |
| sort_order | int | |
| 制約 | unique(household_id, name) | |

初期投入される 8 件（`DEFAULT_CATEGORIES`）: 家電 / IT 機器 / ネットワーク機器 / スマートホーム / 防犯カメラ / 生活設備 / 工具 / その他

### 3.3.5 locations

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | |
| household_id | FK | |
| name | string | 家庭内 unique |
| parent_id | string? | 階層化用（MVP では未使用） |
| memo | string? | |
| sort_order | int | |

初期投入 11 件: リビング / キッチン / 寝室 / 子供部屋 / 玄関 / 洗面所 / 浴室 / トイレ / ベランダ / 物置 / サーバー棚

### 3.3.6 devices（メインリソース）

| カラム | 型 | 説明 |
|---|---|---|
| id | cuid | |
| household_id | FK | |
| name | string | **必須** |
| category_id | FK? | |
| manufacturer | string? | |
| model_number | string? | |
| serial_number | string? | |
| location_id | FK? | |
| status | string | `in_use` / `spare` / `broken` / `repairing` / `disposed` / `sold` |
| priority | string | `high` / `medium` / `low` |
| purchase_date | date? | |
| purchase_store | string? | |
| purchase_price | decimal(12,2)? | API では `number` に変換 |
| purchase_url | string? | |
| order_number | string? | |
| warranty_start_date | date? | |
| warranty_end_date | date? | |
| has_extended_warranty | bool | |
| warranty_memo | string? | |
| manual_url | string? | |
| official_url | string? | |
| support_url | string? | |
| photo_url | string? | URL のみ。実ファイルは保存しない |
| label_photo_url | string? | |
| installation_photo_url | string? | |
| memo | string? | |
| created_at / updated_at | timestamp | |
| **deleted_at** | timestamp? | 論理削除用 |
| インデックス | (household_id), (household_id, status), (household_id, deleted_at) | |

#### `status` の取り扱い

- 通常一覧は `deleted_at IS NULL` のみ返す
- `includeDisposed=true` で廃棄済みも取得可能
- 修理履歴の作成・更新で自動的に `status` が変化する（[3.3.10](#3310-repair_records) と [04-api.md](04-api.md) 参照）

### 3.3.7 device_specs

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | (device_id は Cascade) |
| spec_name | string | **必須**（例: CPU, メモリ, 解像度） |
| spec_value | string? | |
| unit | string? | |
| memo | string? | |
| sort_order | int | |

### 3.3.8 device_links

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | |
| link_type | string | `manual` / `warranty` / `receipt` / `invoice` / `official` / `support` / `purchase` / `other` |
| title | string? | |
| url | string | **必須**（URL 形式チェック） |
| memo | string? | |

### 3.3.9 maintenance_records

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | |
| maintenance_date | date | **必須** |
| maintenance_type | string | `cleaning` / `inspection` / `battery_change` / `filter_change` / `firmware_update` / `parts_change` / `other` |
| description | string? | |
| cost | decimal? | |
| performed_by | string? | |
| next_due_date | date? | 次回予定日（ダッシュボードや `next_maintenance_asc` ソートが参照） |
| photo_url | string? | |
| memo | string? | |
| インデックス | (device_id), (household_id, next_due_date) | |

### 3.3.10 repair_records

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | |
| occurred_date | date | **必須** |
| symptom / cause / action_taken | string? | |
| repair_vendor / repair_ticket_number | string? | |
| cost | decimal? | |
| used_warranty | bool | |
| completed_date | date? | |
| status | string | `pending` / `in_progress` / `completed` / `replaced` / `disposed` |
| memo | string? | |

#### 修理ステータス → 機器ステータスの自動同期

POST と PUT 両方で以下の同期を行う:

| 修理ステータス | 機器ステータス |
|---|---|
| `pending` | `broken` |
| `in_progress` | `repairing` |
| `completed` | `in_use`（修理完了で復帰） |
| `replaced` | `disposed` |
| `disposed` | `disposed` |

実装は [apps/api/src/routes/repairs.ts](../../apps/api/src/routes/repairs.ts) の `deviceStatusFromRepair`。

### 3.3.11 consumables

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | |
| name | string | **必須** |
| manufacturer / model_number | string? | |
| replacement_interval_text | string? | 自由入力（例: "1 年", "500 時間"） |
| last_replaced_date / next_replacement_date | date? | |
| purchase_url | string? | |
| memo | string? | |

### 3.3.12 accessories

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id / device_id | | |
| name | string | **必須** |
| quantity | int? | |
| storage_location | string? | |
| memo | string? | |

### 3.3.13 network_infos

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id | | |
| device_id | FK unique | 1 機器に 1 レコード |
| ip_address / host_name / mac_address | string? | |
| admin_url | string? | URL 形式チェック |
| port | int? | 0〜65535 |
| connection_type | string? | `wifi` / `ethernet` / `bluetooth` / `zigbee` / `matter` / `other` |
| credential_storage_memo | string? | 認証情報の保管場所メモ（**パスワード本体は保存禁止**） |
| settings_memo | string? | |

### 3.3.14 ai_import_logs

| カラム | 型 | 説明 |
|---|---|---|
| id / household_id | | |
| device_id | FK? | onDelete: SetNull |
| source_ai_name | string? | |
| input_prompt | string? | |
| raw_response | string? | |
| parsed_json | json? | |
| imported_at | timestamp | デフォルト `now()` |
| memo | string? | 例: `'apply'` |

MVP では表示画面はなく、apply 時に履歴が積まれるのみ。

## 3.4 シリアライズ規約

API は Prisma の生値ではなく `serializeDevice()`（[apps/api/src/utils/serialize.ts](../../apps/api/src/utils/serialize.ts)）を通してから返す。

| 型 | 変換後 |
|---|---|
| `DateTime @db.Date` | `'YYYY-MM-DD'` 文字列 |
| `Decimal` | `number` |
| ネストオブジェクト / 配列 | 再帰的に同じ変換 |

入力側は Zod スキーマの `optionalDate` 等で `'YYYY-MM-DD'` を受け、空文字は `undefined` に正規化される。Prisma に渡す直前で `parseDateOnly()` により `Date` に戻す。

## 3.5 マイグレーション

`apps/api/prisma/migrations/` 配下にマイグレーションファイルを格納する。スキーマ変更時は必ず `npx prisma migrate dev --name <name>` でマイグレーションを生成し、コミットすること。
