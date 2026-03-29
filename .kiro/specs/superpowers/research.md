# Gap Analysis: 要求定義書 vs 実装 — TDD再構築計画

**分析日**: 2026-03-29
**対象**: 全既存spec（sprout-family-sns / new-home / family-account-management / monthly-record）
**目的**: 要求定義書と実装の乖離を特定し、テスト駆動で再構築できる状態にする

---

## 分析サマリー

- ✅ **new-home**: 完全実装済み。単体テスト・E2Eテストともに充実（最良の参照実装）
- ⚠️ **monthly-record**: **実装はほぼ完了しているが、tasks.md が全未チェック（乖離）**。ビジネスロジックのテストがゼロ
- ❌ **family-account-management**: タスク 5〜8（写真タグ付け・フィルタリング・移行・E2E）が未実装
- 📋 **sprout-family-sns**: 元祖コア仕様。主要機能は実装済み

**最大の課題**: Route Handler にビジネスロジックが混在しており、テストが書けない構造になっているAPIが複数存在する。

---

## 1. スペック別 実装状況マップ

### 1.1 new-home（基準ライン）

| 要件 | 実装 | テスト |
|------|------|--------|
| 代表画像選出アルゴリズム | ✅ `featured.ts` | ✅ `featured.test.ts` (5ケース) |
| 年別グループ化・サムネイル選出 | ✅ `years.ts` | ✅ `years.test.ts` (4ケース) |
| 月タブ状態管理・スワイプ判定 | ✅ `navigation.ts` | ✅ `navigation.test.ts` (10ケース) |
| HeroImage / YearlyArchive / HomeGallery | ✅ コンポーネント実装済 | ✅ E2E (home-mocked, home-gallery) |
| API: /api/featured, /api/years, /api/monthly | ✅ 実装済 | ✅ E2E (api/featured, api/years) |

**評価**: TDDパターンの模範。純粋関数を `lib/` に抽出 → `*.test.ts` で網羅的テスト → Route Handler は薄い構造。

---

### 1.2 monthly-record（tasks.md との最大乖離）

| 要件 | tasks.md | 実際の実装状態 | テスト |
|------|----------|---------------|--------|
| growth_milestones テーブル型定義 | `[ ]` 未チェック | ✅ `database.ts` に定義済 | — |
| /api/monthly/[year]/[month] | `[ ]` 未チェック | ✅ 実装済 | ❌ なし |
| /api/growth-milestones (GET/POST/DELETE) | `[ ]` 未チェック | ✅ 実装済（route.ts確認） | ❌ なし |
| MonthSelector コンポーネント | `[ ]` 未チェック | ✅ `components/monthly/MonthSelector.tsx` | ❌ なし |
| PhotoDisplay コンポーネント | `[ ]` 未チェック | ✅ `components/monthly/PhotoDisplay.tsx` | ❌ なし |
| GrowthStats コンポーネント | `[ ]` 未チェック | ✅ `components/monthly/GrowthStats.tsx` | ❌ なし |
| MilestoneList / MilestoneForm | `[ ]` 未チェック | ✅ 実装済 | ❌ なし |
| /monthly ページ | `[ ]` 未チェック | ✅ `app/monthly/page.tsx` 実装済 | ❌ なし |
| /monthly/[year] ページ | `[ ]` 未チェック | ✅ ディレクトリ存在 | ❌ なし |
| BottomNav 月の記録タブ | `[ ]` 未チェック | ✅ CalendarIcon 含め実装済 | ❌ なし |

**乖離の本質**: tasks.md が実装に追いついていない（実装者がタスクを更新しなかった）
**テストの空白**: `/api/monthly` のロジック、MonthSelector の状態管理 — 全てテスト未着手

**抽出すべき純粋関数（未存在）**:
- `monthlyRecord/dateRange.ts`: 月の日付範囲計算（`startDate` / `endDate` / `recordedAtMonth`）
- `monthlyRecord/photoSelector.ts`: メイン写真のランダム選択（ハイドレーション回避含む）
- `monthlyRecord/milestones.ts`: マイルストーン記録日フォーマット（YYYY-MM-01形式）

---

### 1.3 family-account-management（部分実装）

| タスク | 状態 | テスト |
|--------|------|--------|
| 1. DBスキーマ（family_members, family_invitations, post_tags） | ✅ 完了 | — |
| 2. 招待システム（API + UI） | ✅ 完了 | ✅ `invitations.test.ts` (12ケース) |
| 3. 家族メンバー管理（API + UI） | ✅ 完了 | ✅ `family-members.test.ts` (10ケース) |
| 4. オンボーディング | ✅ 完了 | ✅ `onboarding.test.ts` (7ケース) |
| **5. 写真タグ付け** | ❌ 未実装 | ❌ なし |
| **6. タグフィルタリング** | ❌ 未実装 | ❌ なし（`filters.test.ts`は子どもフィルターのみ） |
| **7. 既存ユーザー移行** | ❌ 未実装 | ❌ なし |
| **8. 統合テスト（E2E）** | ❌ 未実装 | ❌ なし |

**タスク5の欠損機能詳細**:
- `GET /api/posts/[id]/tags` — エンドポイント未存在
- `PUT /api/posts/[id]/tags` — エンドポイント未存在
- UploadForm へのタグ選択UI追加 — 未実装
- PostCard へのタグバッジ表示 — 未実装

**タスク6の欠損機能詳細**:
- `GET /api/posts?memberIds=...` — フィルタリングパラメータ未対応
- タイムラインのメンバーフィルターUI — 未実装
- `filters.ts` の `filterPostsByChild` はあるが、タグフィルターロジックが未実装

**タスク7の欠損機能詳細**:
- Supabaseマイグレーションスクリプト（一括 family_members 作成）未作成
- `role_confirmed = false` ユーザーのログイン後リダイレクトロジック未実装

---

### 1.4 既存テストの品質問題

```
src/lib/api/family-members.test.ts:14
  it("9種類の家族役割を定義している", () => {
    expect(FAMILY_ROLES).toHaveLength(8);  // ← コメントと実装が不一致（8種類が正しい）
```

---

## 2. テストカバレッジの全体像

### 現状（2026-03-29時点）

| モジュール | 単体テスト | E2Eテスト | カバレッジ推定 |
|-----------|-----------|-----------|--------------|
| `lib/api/invitations.ts` | ✅ 12ケース | — | 高 |
| `lib/api/family-members.ts` | ✅ 10ケース | — | 高 |
| `lib/api/featured.ts` | ✅ 5ケース | ✅ | 高 |
| `lib/api/years.ts` | ✅ 4ケース | ✅ | 中〜高 |
| `lib/home/navigation.ts` | ✅ 10ケース | — | 高 |
| `lib/api/filters.ts` | ✅ 6ケース | — | 中（子どもフィルターのみ） |
| `lib/api/onboarding.ts` | ✅ 7ケース | — | 高 |
| `monthly-record` 全ロジック | ❌ 0ケース | ❌ | **ゼロ** |
| 写真タグ付けロジック | ❌ 未実装 | ❌ | **未実装** |
| タグフィルタリングロジック | ❌ 未実装 | ❌ | **未実装** |
| 既存ユーザー移行ロジック | ❌ 未実装 | ❌ | **未実装** |

---

## 3. TDD再構築のアプローチ選択肢

### Option A: monthly-record 優先 (Extend + Test-First)

**対象**: tasks.md を現実に合わせてチェックし、未テストのビジネスロジックを pure function に抽出してテストを追加

**具体的手順**:
1. `src/lib/monthly/` ディレクトリを作成
2. `/api/monthly/[year]/[month]` から日付計算ロジックを抽出 → `dateRange.ts`
3. `MonthSelector` の状態管理ロジックを抽出 → `navigation.ts`（`lib/home/navigation.ts` の月次記録版）
4. `PhotoDisplay` のランダム選択ロジックを抽出 → `photoSelector.ts`
5. それぞれに TDD でテストを追加

**Trade-offs**:
- ✅ 既存実装を壊さずテストを追加できる
- ✅ 即座に価値を生む（動いている機能の品質保証）
- ❌ Route Handler 内のロジックの分離が必要（リファクタリングリスク）

**工数**: M（3〜7日）/ リスク: Low

---

### Option B: family-account-management タグ付け (New Components + TDD)

**対象**: tasks 5〜8 を TDD で新規実装

**具体的手順（TDD順）**:
1. `src/lib/api/tags.ts` + `tags.test.ts` — タグ管理純粋関数のテスト先行実装
2. `GET/PUT /api/posts/[id]/tags` Route Handler 実装
3. `src/lib/api/filters.ts` にメンバーIDフィルターを追加（既存テストを維持）
4. タグ付けUI（UploadForm 拡張）の実装
5. E2E テスト追加

**Trade-offs**:
- ✅ 完全な TDD が適用できる（既存コードへの影響最小）
- ✅ 要求定義書の未実装機能を完全に満たす
- ❌ post_tags テーブルは DB に存在するが、動作確認が必要
- ❌ 複数コンポーネントにわたる変更

**工数**: L（1〜2週間）/ リスク: Medium

---

### Option C: ハイブリッド（推奨）— 2フェーズ

**フェーズ1**: monthly-record のテスト整備（Option A）
→ tasks.md 更新 + 純粋関数抽出 + 単体テスト + E2Eテスト追加

**フェーズ2**: family-account-management タスク5〜8 のTDD実装（Option B）
→ tags.ts の純粋関数から始めてアウトサイドインで実装

**Trade-offs**:
- ✅ 短期（フェーズ1）・中期（フェーズ2）で段階的な品質向上
- ✅ フェーズ1で TDD プロセスを確立してからフェーズ2に進める
- ❌ 計画コストが高い

**工数**: XL（2週間超）/ リスク: Medium

---

## 4. 要求-実装マップ（ギャップタグ付き）

| 要件 | spec | 実装状態 | テスト | ギャップ種別 |
|------|------|----------|--------|-------------|
| 写真タグ付け（R4） | family-account-management | ❌ 未実装 | ❌ | **Missing** |
| タグフィルタリング（R5） | family-account-management | ❌ 未実装 | ❌ | **Missing** |
| 既存ユーザー移行（R6） | family-account-management | ❌ 未実装 | ❌ | **Missing** |
| 月記録ビジネスロジック | monthly-record | ✅ 実装済（route内） | ❌ | **Constraint**（テスト不可） |
| tasks.md の最新化 | monthly-record | ✅ 実装済 | — | **Unknown**（tasks不一致） |
| タグフィルター（メンバー軸） | family-account-management | ❌ 部分（子どものみ） | ⚠️ 部分的 | **Missing** |

---

## 5. 設計フェーズへの推奨事項

### TDD再構築の原則（new-home を参照実装として）

```
Route Handler（薄い）
    ↓ 呼び出す
lib/[domain]/[feature].ts（純粋関数 — テスト可能）
    ↓ 参照される
[feature].test.ts（Vitest — Red→Green→Refactor）
```

### 優先度順 研究事項

1. **monthly-record ロジック抽出可能性**: `/api/monthly/[year]/[month]` の日付計算・データ集約ロジックを `lib/monthly/` に移す際のインターフェース設計
2. **post_tags テーブルの実DB状態確認**: 型定義はあるが Supabase 上でテーブルが実際に作成されているか未確認
3. **既存ユーザー移行の安全な実行方法**: トランザクション戦略と `role_confirmed` 検出のミドルウェア設計
4. **タグフィルターとページネーション**: カーソルベースページネーションとの統合設計

---

## 次のステップ

```
# 推奨ルート（Option C / ハイブリッド）

# フェーズ1: monthly-record テスト整備
/kiro:spec-impl monthly-record [tasks: 1.1, 1.2, 2.1, 3.1-3.3]
# → tasks.md 更新 + lib/monthly/ 純粋関数抽出 + テスト追加

# フェーズ2: family-account-management タスク5〜8
/kiro:spec-design family-account-management  # タグ付け設計レビュー
/kiro:spec-impl family-account-management [tasks: 5, 6, 7, 8]
# → TDD でタグ付け・フィルタリング・移行を実装
```
