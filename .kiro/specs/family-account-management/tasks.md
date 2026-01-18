# Implementation Plan

## Tasks

- [x] 1. データベーススキーマのセットアップ
- [x] 1.1 家族メンバーテーブルの作成
  - family_role enum型を定義（mother, father, grandmother_paternal, grandmother_maternal, grandfather_paternal, grandfather_maternal, uncle_aunt, other）
  - family_membersテーブルを作成（user_id, role, custom_role_name, role_confirmed, joined_at）
  - role_confirmedフラグで移行ユーザーの初回ログイン検出に対応
  - user_idにUNIQUE制約を設定
  - _Requirements: 2.2, 6.1_

- [x] 1.2 (P) 招待コードテーブルの作成
  - family_invitationsテーブルを作成（code, created_by, expires_at, used_count, max_uses, is_active）
  - codeにUNIQUE制約とインデックスを設定
  - expires_atにインデックスを設定（有効期限チェック用）
  - _Requirements: 1.1, 1.2_

- [x] 1.3 (P) 投稿タグテーブルの作成
  - post_tagsテーブルを作成（post_id, member_id）
  - post_id + member_idにUNIQUE制約を設定
  - member_idにインデックスを設定（フィルタリング高速化）
  - _Requirements: 4.3_

- [x] 1.4 RLSポリシーの設定
  - family_members: 全メンバー閲覧可、自分のみ挿入・更新可
  - family_invitations: 全メンバー閲覧可、認証済みユーザーのみ作成可
  - post_tags: 全メンバー閲覧可、投稿者のみ編集可
  - 1.1〜1.3のマイグレーション完了後に実行
  - _Requirements: 1.1, 3.1, 4.3_

- [x] 2. 招待システムの実装
- [x] 2.1 招待コード生成・検証ロジックの実装
  - 8文字英数字コード生成（紛らわしい文字0,O,I,1,Lを除外）
  - 重複チェック付きでコードを生成
  - 有効期限（7日）と使用回数による検証ロジック
  - エラー型（EXPIRED, MAX_USES_REACHED, NOT_FOUND）の実装
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 招待APIエンドポイントの実装
  - POST /api/invitations: 招待コード生成、リンク作成、有効期限返却
  - GET /api/invitations/[code]: コード検証、有効/無効判定
  - 認証チェックと適切なエラーレスポンス（401, 404, 410）
  - _Requirements: 1.1, 1.5, 1.6_

- [x] 2.3 招待UI（設定画面）の実装
  - 設定画面に招待ボタンを追加
  - 招待モーダルでコードとリンクを表示
  - クリップボードコピー機能
  - 共有機能（LINEなど）への対応
  - _Requirements: 1.1, 1.6_

- [x] 3. 家族メンバー管理の実装
- [x] 3.1 家族メンバーAPIエンドポイントの実装
  - GET /api/family-members: メンバー一覧取得（プロフィール情報含む）
  - POST /api/family-members: 新規メンバー登録（招待コード検証、役割設定）
  - PUT /api/family-members/me: 自分の役割更新
  - 招待コード使用時のmarkAsUsed処理
  - _Requirements: 2.4, 3.1, 3.2, 3.4_

- [x] 3.2 (P) 家族メンバー一覧UIの実装
  - 設定画面に「家族メンバー」セクションを追加
  - メンバー一覧表示（名前、役割、プロフィール画像）
  - 自分の役割のみ編集ボタン表示
  - 役割編集モーダルの実装
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. 役割選択オンボーディングの実装
- [x] 4.1 オンボーディングページの作成
  - /onboarding/role ルートを作成
  - URLパラメータから招待コードを取得
  - 9種類の役割選択UI（母、父、祖父母×4、叔父叔母、その他）
  - 「その他」選択時の自由入力フィールド
  - 役割未選択時は完了ボタン無効化
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4.2 認証フローとの統合
  - 招待リンクアクセス時の認証フロー開始
  - 認証完了後のオンボーディングページへのリダイレクト
  - 役割登録完了後のホーム画面遷移
  - role_confirmedフラグの更新
  - _Requirements: 1.6, 2.1, 2.4_

- [ ] 5. 写真タグ付けの実装
- [ ] 5.1 タグ管理APIエンドポイントの実装
  - GET /api/posts/[id]/tags: 投稿のタグ取得
  - PUT /api/posts/[id]/tags: タグの設定・更新
  - 投稿者のみ編集可能な権限チェック
  - _Requirements: 4.3, 4.5_

- [ ] 5.2 投稿作成時のタグ選択UIの実装
  - 投稿作成画面にタグ付けボタンを追加
  - 家族メンバー選択モーダル（チェックボックス形式）
  - 複数選択対応
  - 選択済みメンバーをチップ形式で表示
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5.3 投稿詳細画面のタグ表示
  - タグ付けされたメンバーをバッジで表示
  - 投稿者の場合は編集ボタン表示
  - タグ編集モーダルの実装
  - _Requirements: 4.4, 4.5_

- [ ] 6. タグフィルタリングの実装
- [ ] 6.1 フィルタリングAPIの拡張
  - GET /api/posts のmemberIdsクエリパラメータ対応
  - childIdとmemberIdsの組み合わせフィルタリング
  - カーソルベースページネーションとの統合
  - _Requirements: 5.2, 5.4_

- [ ] 6.2 フィルターUIの実装
  - タイムライン画面にメンバーフィルターボタンを追加
  - 家族メンバー選択UI（既存のChildFilterと同様のパターン）
  - URLパラメータmemberIdsで状態管理
  - フィルター適用中のインジケーター表示
  - クリアボタンでフィルター解除
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 7. 既存ユーザーの移行
- [ ] 7.1 マイグレーションスクリプトの作成
  - 既存profilesに対応するfamily_membersレコードを一括作成
  - role = 'other'、role_confirmed = false で初期化
  - joined_at = profiles.created_at を設定
  - トランザクション内で実行、失敗時ロールバック
  - _Requirements: 6.1, 6.2_

- [ ] 7.2 移行ユーザーの初回ログイン対応
  - role_confirmed = false のユーザー検出
  - ログイン後にオンボーディングページへリダイレクト
  - 役割設定完了後にrole_confirmed = true に更新
  - _Requirements: 6.3_

- [ ] 8. 統合テストと最終確認
- [ ] 8.1 招待フローのE2Eテスト
  - 招待コード生成から新規ユーザー登録までの一連のフロー
  - 期限切れコード、使用済みコードのエラーハンドリング
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8.2 (P) タグ付け・フィルタリングのE2Eテスト
  - 投稿作成時のタグ付けフロー
  - 投稿詳細画面でのタグ表示・編集
  - タイムラインでのフィルタリング動作
  - 子供フィルターとの組み合わせ
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.3 (P) 移行フローのテスト
  - 既存ユーザーのfamily_members自動作成確認
  - 初回ログイン時のオンボーディング表示
  - 既存投稿・子供データの正常表示確認
  - _Requirements: 6.1, 6.2, 6.3_
