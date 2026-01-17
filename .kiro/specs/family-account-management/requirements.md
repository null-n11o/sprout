# Requirements Document

## Introduction

家族SNSアプリ「Sprout」に家族アカウント管理機能を追加する。この機能により、家族メンバーを招待制で追加し、各メンバーの役割（母、父、祖父母など）を管理できるようにする。また、投稿された写真に写っている家族メンバーをタグ付けし、特定のメンバーが写っている写真を絞り込み表示できるようにする。

**前提**: シングルテナント（中野家専用）として設計。マルチテナント対応は将来の拡張として検討。

## Requirements

### Requirement 1: 家族メンバー招待

**Objective:** As a 家族メンバー, I want 他の家族を招待したい, so that 祖父母や叔父叔母も赤ちゃんの成長を見られる

#### Acceptance Criteria

1. When ユーザーが設定画面で招待ボタンを押した時、the Invitation System shall 8文字の招待コードと招待リンクを生成する
2. The Invitation System shall 招待コードに7日間の有効期限を設定する
3. When 招待コードの有効期限が切れた時、the Invitation System shall その招待コードを無効化する
4. When 招待コードの使用回数が上限に達した時、the Invitation System shall その招待コードを無効化する
5. If 無効な招待コードが入力された場合、the Invitation System shall エラーメッセージを表示する
6. When 有効な招待リンクにアクセスした時、the Invitation System shall ログイン/サインアップ画面を表示し、認証後に役割選択フローへ進める

### Requirement 2: 役割選択（オンボーディング）

**Objective:** As a 新規家族メンバー, I want 自分の役割を選択したい, so that 誰がどんな立場の人かわかる

#### Acceptance Criteria

1. When ユーザーが招待経由で認証を完了した時、the Onboarding System shall 役割選択画面を表示する
2. The Onboarding System shall 以下の役割選択肢を提供する：母、父、祖母（父方）、祖母（母方）、祖父（父方）、祖父（母方）、叔父/伯父、叔母/伯母、その他
3. When ユーザーが「その他」を選択した時、the Onboarding System shall 自由入力フィールドを表示する
4. When ユーザーが役割を選択して完了ボタンを押した時、the Onboarding System shall 家族メンバーとして登録し、ホーム画面へ遷移する
5. If 役割が選択されていない場合、the Onboarding System shall 完了ボタンを無効化する

### Requirement 3: 家族メンバー一覧表示

**Objective:** As a 家族メンバー, I want 家族メンバー一覧を見たい, so that 誰がどんな役割で参加しているかわかる

#### Acceptance Criteria

1. When ユーザーが設定画面で「家族メンバー」を選択した時、the Family Member System shall 家族メンバー一覧を表示する
2. The Family Member System shall 各メンバーの名前、役割、プロフィール画像を表示する
3. When ユーザーが自分の役割編集ボタンを押した時、the Family Member System shall 役割編集モーダルを表示する
4. When ユーザーが役割の変更を保存した時、the Family Member System shall 役割を更新する

### Requirement 4: 写真タグ付け

**Objective:** As a 家族メンバー, I want 写真に写っている人をタグ付けしたい, so that 誰と写っている写真か記録できる

#### Acceptance Criteria

1. When ユーザーが投稿作成画面でタグ付けボタンを押した時、the Photo Tagging System shall 家族メンバー選択リストを表示する
2. The Photo Tagging System shall 複数の家族メンバーを選択可能にする
3. When ユーザーがメンバーを選択して確定した時、the Photo Tagging System shall 選択されたメンバーをタグとして投稿に関連付ける
4. When 投稿詳細画面を表示した時、the Photo Tagging System shall タグ付けされたメンバーをバッジで表示する
5. When ユーザーが既存の投稿のタグを編集した時、the Photo Tagging System shall タグ情報を更新する

### Requirement 5: タグによる写真フィルタリング

**Objective:** As a 家族メンバー, I want 特定の人が写っている写真だけを見たい, so that おばあちゃんと赤ちゃんの写真だけを簡単に探せる

#### Acceptance Criteria

1. When ユーザーがタイムライン画面でフィルターボタンを押した時、the Photo Filtering System shall 家族メンバーフィルター選択UIを表示する
2. When ユーザーが特定のメンバーを選択した時、the Photo Filtering System shall そのメンバーがタグ付けされた投稿のみを表示する
3. When ユーザーがフィルターをクリアした時、the Photo Filtering System shall すべての投稿を表示する
4. The Photo Filtering System shall 子供フィルターとタグフィルターを組み合わせて使用可能にする
5. While フィルターが適用されている間、the Photo Filtering System shall フィルター状態を視覚的に示す

### Requirement 6: 既存ユーザーの移行

**Objective:** As a 既存ユーザー, I want 既存のデータを新しい家族機能でも使いたい, so that 過去の投稿が失われない

#### Acceptance Criteria

1. The Migration System shall 既存ユーザーを家族メンバーとして自動的に登録する（役割は「その他」をデフォルト設定）
2. The Migration System shall 既存の投稿・子供・成長記録を移行後も正常に表示する
3. When 既存ユーザーが初めてログインした時、the Migration System shall 役割選択画面を表示して役割を設定させる
