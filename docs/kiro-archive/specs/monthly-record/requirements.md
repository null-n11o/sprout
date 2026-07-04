# Requirements Document

## Project Description (Input)
月の記録機能 - 月単位で子どもの写真・成長記録・成長メモを一覧できる新しいページ。ナビゲーションに「月の記録」タブを追加し、左右矢印で月を切り替え、メイン写真（ランダム）と小さいサムネイル群、身長・体重記録、箇条書きの成長メモ（できるようになったこと）を表示。写真タップでその月のギャラリーに遷移。新規テーブル growth_milestones を追加。

---

## Introduction

「月の記録」は、Sproutアプリに月単位の成長ビューを追加する機能です。既存のタイムライン（投稿順）や成長記録（グラフ）とは異なり、特定の月にフォーカスして写真・身体データ・発達マイルストーンを一覧表示します。これにより、「あの月はどんな様子だったか」を直感的に振り返ることができます。

---

## Requirements

### Requirement 1: ナビゲーション拡張

**Objective:** 家族ユーザーとして、下部ナビゲーションから「月の記録」に素早くアクセスしたい。そうすれば、月単位の成長ビューにワンタップで移動できる。

#### Acceptance Criteria
1. The BottomNav shall 「月の記録」タブを「投稿」と「成長記録」の間に表示する
2. When ユーザーが「月の記録」タブをタップしたとき, the App shall `/monthly` ページに遷移する
3. While 月の記録ページが表示されているとき, the BottomNav shall 「月の記録」タブをアクティブ状態で表示する
4. The 月の記録タブ shall カレンダーアイコンを使用する

---

### Requirement 2: 月選択ナビゲーション

**Objective:** 家族ユーザーとして、左右矢印で月を切り替えたい。そうすれば、過去の特定の月を簡単に振り返ることができる。

#### Acceptance Criteria
1. The MonthlyRecordPage shall 現在選択中の月を「YYYY年M月」形式で表示する
2. When ユーザーが左矢印をタップしたとき, the MonthlyRecordPage shall 前月のデータを表示する
3. When ユーザーが右矢印をタップしたとき, the MonthlyRecordPage shall 翌月のデータを表示する
4. If 選択中の月が最新月のとき, the 右矢印 shall 非活性状態で表示される
5. If 選択中の月にデータがある最古の月のとき, the 左矢印 shall それより前の月への遷移を許可しない
6. When ページを初回表示したとき, the MonthlyRecordPage shall 現在の月（または最新の投稿がある月）を表示する

---

### Requirement 3: 子どもフィルター

**Objective:** 家族ユーザーとして、特定の子どもの月の記録だけを見たい。そうすれば、一人ひとりの成長を集中して振り返ることができる。

#### Acceptance Criteria
1. The MonthlyRecordPage shall 子どもフィルタータブ（全員/マレ/カイリ）を表示する
2. When ユーザーが特定の子どもタブを選択したとき, the MonthlyRecordPage shall その子どもの写真・成長記録・成長メモのみを表示する
3. When 「全員」タブが選択されているとき, the MonthlyRecordPage shall すべての子どもの情報を統合して表示する
4. The 選択中のタブ shall ハイライト表示される

---

### Requirement 4: 写真表示

**Objective:** 家族ユーザーとして、その月の写真をメインとサムネイルで見たい。そうすれば、月の雰囲気を一目で把握できる。

#### Acceptance Criteria
1. The MonthlyRecordPage shall その月の投稿写真から1枚をメイン写真として大きく表示する
2. The メイン写真 shall ページ読み込み時にランダムで選ばれる
3. The MonthlyRecordPage shall メイン写真以外の写真を最大4枚までサムネイルとして表示する
4. If その月に写真がない場合, the MonthlyRecordPage shall 「写真がありません」というメッセージを表示する
5. If その月に写真が1枚のみの場合, the MonthlyRecordPage shall その写真をメイン写真として表示し、サムネイルエリアは非表示にする
6. When ユーザーがメイン写真またはサムネイルをタップしたとき, the App shall その月の写真一覧ページ（ギャラリー）に遷移する

---

### Requirement 5: 月のギャラリーページ

**Objective:** 家族ユーザーとして、その月の全写真をギャラリー形式で眺めたい。そうすれば、月の思い出を写真でじっくり振り返ることができる。

#### Acceptance Criteria
1. The MonthlyGalleryPage shall その月のすべての写真をグリッド形式で表示する
2. The MonthlyGalleryPage shall `/monthly/[year]/[month]/photos` のパスでアクセス可能とする
3. When ユーザーが写真をタップしたとき, the MonthlyGalleryPage shall 写真を拡大表示する
4. The MonthlyGalleryPage shall 戻るボタンを表示し、タップで月の記録ページに戻る
5. The 写真グリッド shall 投稿日時の新しい順で表示する

---

### Requirement 6: 成長記録表示

**Objective:** 家族ユーザーとして、その月の身長・体重を確認したい。そうすれば、身体の成長を月単位で把握できる。

#### Acceptance Criteria
1. The MonthlyRecordPage shall その月に記録された身長（cm）と体重（kg）を表示する
2. If その月に複数の成長記録がある場合, the MonthlyRecordPage shall 最新の記録を表示する
3. If その月に成長記録がない場合, the MonthlyRecordPage shall 「記録なし」と表示する
4. The 成長記録 shall 身長と体重をそれぞれアイコン付きで表示する

---

### Requirement 7: 成長メモ（マイルストーン）

**Objective:** 家族ユーザーとして、その月にできるようになったことを箇条書きで記録・閲覧したい。そうすれば、発達のマイルストーンを記録として残せる。

#### Acceptance Criteria
1. The MonthlyRecordPage shall その月の成長メモを表示する
2. When ユーザーが成長メモ追加ボタンをタップしたとき, the App shall 成長メモ入力フォームを表示する
3. When ユーザーが成長メモを入力して保存したとき, the App shall 成長メモをデータベースに保存し、一覧に追加表示する
4. If その月に成長メモがない場合, the MonthlyRecordPage shall 「まだメモがありません」と追加ボタンを表示する
5. The 成長メモ shall 「できるようになったこと」セクションとして表示する
6. When ユーザーが成長メモを長押ししたとき, the App shall 削除オプションを表示する

---

### Requirement 8: 成長メモデータモデル

**Objective:** システムとして、成長メモを永続的に保存したい。そうすれば、月単位でマイルストーンを管理できる。

#### Acceptance Criteria
1. The Database shall `growth_milestones` テーブルを持つ
2. The `growth_milestones` テーブル shall 以下のカラムを持つ: id (UUID), child_id (FK), content (text), recorded_at (date), created_at (timestamp)
3. The `recorded_at` shall 月を表すために YYYY-MM-01 形式で保存する
4. The API shall GET `/api/growth-milestones?child_id={id}&month={YYYY-MM}` で月の成長メモを取得できる
5. The API shall POST `/api/growth-milestones` で新規成長メモを作成できる
6. The API shall DELETE `/api/growth-milestones/{id}` で成長メモを削除できる

---

### Requirement 9: 月別データ取得API

**Objective:** システムとして、月のデータを効率的に取得したい。そうすれば、1回のリクエストで必要な情報を揃えられる。

#### Acceptance Criteria
1. The API shall GET `/api/monthly/{year}/{month}` エンドポイントを提供する
2. The API レスポンス shall 以下を含む: 写真一覧、成長記録（身長・体重）、成長メモ一覧
3. The API shall `child_id` クエリパラメータでフィルタリングをサポートする
4. If 指定月にデータがない場合, the API shall 空のデータ構造を返す（エラーではない）

---

## Non-Functional Requirements

### Performance
- 月のデータ取得は2秒以内に完了すること
- 画像はサムネイル表示時に適切なサイズで配信すること

### Usability
- 月の切り替えはスムーズなアニメーションを伴うこと
- 写真がない月でも操作に迷わないよう、空状態を明確に表示すること

### Consistency
- 既存のデザインシステム（カラーパレット、フォント、アニメーション）に従うこと
- 子どもフィルターは既存の ChildFilter コンポーネントを再利用すること
