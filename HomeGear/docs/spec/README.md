# HomeGear 仕様書

家庭内機器管理スマホアプリ「HomeGear」の MVP 仕様書（開発引き継ぎ用）。

本書は実装済みのコードを基準に作成しています。仕様書はリポジトリ内のコードが正であり、両者に齟齬が出た場合はコードを正とします。

## 目次

| # | ファイル | 内容 |
|---|---|---|
| 1 | [01-overview.md](01-overview.md) | アプリ概要・目的・想定利用者・MVP の範囲と未実装機能 |
| 2 | [02-architecture.md](02-architecture.md) | 技術スタック・モノレポ構成・ディレクトリ構造 |
| 3 | [03-data-model.md](03-data-model.md) | PostgreSQL スキーマ詳細（全 14 テーブル） |
| 4 | [04-api.md](04-api.md) | REST API 全エンドポイント仕様（リクエスト・レスポンス例付） |
| 5 | [05-mobile-ui.md](05-mobile-ui.md) | 画面構成・ナビゲーション・各画面の操作仕様 |
| 6 | [06-security.md](06-security.md) | 認証・認可・データ分離・パスワード等の取扱方針 |
| 7 | [07-non-functional.md](07-non-functional.md) | 非機能要件・運用上の注意・既知の制限 |
| 8 | [08-development.md](08-development.md) | 開発環境構築・ビルド・テスト・配布 |

## 主要参照ドキュメント（リポジトリ内）

| パス | 役割 |
|---|---|
| [CLAUDE.md](../../CLAUDE.md) | プロジェクト指示文（実装ルール・データ層ルール・技術スタック・コミット時の注意） |
| [README.md](../../README.md) | クイックスタート |
| [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma) | DB スキーマ（権威） |
| [packages/shared/src/](../../packages/shared/src) | API・モバイル共有の Zod スキーマと定数（権威） |
| [scripts/scenario-test.mjs](../../scripts/scenario-test.mjs) | API シナリオテストスクリプト |

## 用語

| 用語 | 意味 |
|---|---|
| 家庭 (household) | データ分離の単位。1 家庭 = 1 セット（機器・カテゴリ・設置場所・履歴） |
| メンバー (household_member) | 家庭に所属するユーザー。`owner` / `member` ロール |
| 機器 (device) | 管理対象の家電・IT 機器・ネットワーク機器など |
| 子テーブル | 機器に従属するリソース。specs / links / maintenance_records / repair_records / consumables / accessories / network_infos の 7 種 |
| AI 取込 | 機器情報を AI（Claude / ChatGPT 等）で調査して JSON を貼り付けて反映する機能 |
