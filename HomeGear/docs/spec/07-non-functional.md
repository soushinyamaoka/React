# 7. 非機能要件

## 7.1 性能・容量

| 項目 | 目安 |
|---|---|
| 想定登録機器数 | 〜 500 件程度 |
| `GET /api/devices` の最大件数 | `take: 500` でハードリミット |
| `dashboard` の各リスト | 10〜30 件で `take` |
| TanStack Query の `staleTime` | 30 秒（既定） |
| API レスポンスタイム（目安） | 100ms 以下を想定（PostgreSQL ローカル + Prisma） |

> 上記を超える規模が想定される場合、ページネーション・カーソル方式 / 検索インデックス追加を検討する。

## 7.2 可用性

- MVP は単一ノード運用（API + DB を同一サーバー）
- バックアップは Postgres のダンプを想定（運用手順は別途整備）
- `docker compose up -d` で常駐させる前提

## 7.3 互換性・対象端末

| 対象 | バージョン |
|---|---|
| iOS | Expo SDK 54 がサポートする iOS（最低 iOS 15） |
| Android | Expo SDK 54 がサポートする Android（API 24+） |
| Web | テスト用途のみ（Chromium 系 / Safari 最新版） |

## 7.4 ユーザビリティ

CLAUDE.md にも記載のルール:

- スマホでの片手操作を最重視
- フォームは長すぎないよう `Section` でセクション分け
- 必須入力は最小限
- 入力欄は `KeyboardAvoidingView` でキーボードに隠れないようにする

確認ダイアログを必須にする操作:

- 機器の物理削除（`DELETE /api/devices/:id`）→ コピーで「完全削除」と明示
- 機器の廃棄（`POST /api/devices/:id/dispose`）
- カテゴリ / 設置場所の削除（紐付く機器がある場合は影響を表示）

## 7.5 国際化（i18n）

- MVP では日本語固定
- 将来的に i18n が必要になる場合は `react-i18next` 系を検討

## 7.6 ログ・観測性

| 種別 | 取り扱い |
|---|---|
| API のリクエストログ | Fastify 標準 logger（dev: debug、prod: info） |
| DB アクセス | Prisma のクエリログ（必要時に有効化） |
| AI 取込履歴 | `ai_import_logs` テーブルに永続化 |
| エラー集約 | MVP では未導入。本番運用時に Sentry 等の導入を検討 |

## 7.7 配布方針

| 段階 | 方法 |
|---|---|
| 開発中 | Expo Go / Development Build |
| 家族長期利用 | EAS Build の Internal Distribution / TestFlight |

EAS 設定は MVP では未実施。`apps/mobile/app.json` に `bundleIdentifier` / `package` は仮値（`com.example.homegear`）で入れてある。

## 7.8 ストレージ

- 機器の画像はサーバーで持たない（**URL のみ**保存）
- 端末内 SQLite はオフラインキャッシュ目的でも未使用（必要に応じて将来導入）
- JSON エクスポートは API レスポンスとして取得 → 端末/ブラウザのコピー機能で保存

## 7.9 運用上の注意

### 7.9.1 マイグレーション

- スキーマ変更は必ず `prisma migrate dev --name <name>` でマイグレーションを生成し commit する
- `apps/api/prisma/migrations/` を一覧で確認できる状態を保つ
- 既存環境の更新は `prisma migrate deploy` を使う

### 7.9.2 環境変数

| 変数 | 役割 |
|---|---|
| DATABASE_URL | Postgres 接続文字列 |
| JWT_SECRET | JWT 署名鍵（本番は 32 文字以上のランダム） |
| PORT | API ポート（既定 4000） |
| HOST | API バインドホスト（既定 0.0.0.0） |
| NODE_ENV | `development` / `production` |

### 7.9.3 既知の制限

- **日付入力は YYYY-MM-DD 手入力**（DatePicker なし）
- **写真は URL 文字列のみ**（カメラ・アップロードなし）
- **家族の招待機能なし**（手動で `household_members` を追加）
- **AI API の直接呼び出しなし**（コピペ運用）
- **Expo Web はテスト用途のみ**を想定。SecureStore は localStorage に退避するため、Web で複数家庭管理する用途には不向き
- **`@xmldom/xmldom` 等の Expo 内部 transitive 依存に moderate vulnerabilities** が残存。Expo SDK アップデート待ち

## 7.10 受け入れ条件チェックリスト

| 項目 | 状況 |
|---|---|
| Expo で Android / iPhone 向けに起動できる | ✅ |
| スマホ画面で操作しやすい | ✅（Section 分け / FAB / Bottom Tab） |
| ログインできる | ✅ |
| `household_id` でデータ分離 | ✅（シナリオテストで検証済） |
| 機器名だけで登録できる | ✅ |
| キーワード検索 / カテゴリ・場所・ステータス絞り込み | ✅ |
| 並び替え（更新 / 名前 / 保証 / 購入 / **次回メンテ**） | ✅ |
| 保証期限が近い機器を把握 | ✅（ダッシュボード + 一覧フィルタ） |
| 詳細画面で購入・保証・スペック・リンク・履歴を 1 画面確認 | ✅ |
| スペックを複数登録（device_specs に自由項目で保持） | ✅ |
| メンテナンス / 修理履歴を追加 | ✅ |
| **修理ステータスが機器ステータスに同期（POST / PUT 両方）** | ✅ |
| AI 調査用プロンプト生成 | ✅ |
| AI 回答 JSON を貼り付け / 解析エラー表示 | ✅ |
| プレビュー / 既存値を上書きしないデフォルト | ✅ |
| ダッシュボード（保証 / メンテ / 故障 / 情報不足） | ✅ |
| パスワードや秘密鍵を機器情報として保存しない | ✅ |
| 自家庭以外のデータにアクセスできない | ✅（シナリオテストで検証済） |
| JSON エクスポート | ✅ |
| API 自動テスト（シナリオ 45 件） | ✅ |
| Expo Web で起動 | ✅（テスト用途） |
| 実機 / Android エミュレータからの自動 API ホスト解決 | ✅ |
