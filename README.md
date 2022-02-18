## Teratail Logs Plus

[teratail](https://teratail.com/)にログ閲覧の機能を追加するユーザースクリプトです。

### スクリーンショット

質問ページのスクリーンショットです。ログボタンを押すと投稿や回答などのログの一覧をポップアップで表示します。

![screenshot](screenshot.png)

### 機能

- ログの一覧表示（更新日時の新しい順に表示）とログの行をクリックしたときにログの場所へ移動
- ログの作者名をホバーしたとき他のログの作者名もハイライト
- 質問を投稿後１時間以内のとき警告を表示
- 質問者のスコアが0以下のとき警告を表示
- 質問の評価が0未満のとき警告を表示

### 動作環境

- Google Chrome
- Firefox

### インストール

1. 拡張機能Tampermonkeyをインストール

- [Google Chrome の Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox の Tampermonkey](https://addons.mozilla.org/ja/firefox/addon/tampermonkey/)

2. ユーザースクリプトの[Teratail_Logs_Plus.user.js](https://github.com/querykuma/Teratail_Logs_Plus/raw/master/Teratail_Logs_Plus.user.js)をTampermonkeyにインストール

### 使い方

1. teratailで質問ページのURLを開きます。

2. ヘッダーにある**ログ**のボタンをクリックします。

3. ポップアップが出てログ一覧を表示します。

4. ログの行をクリックするとログの場所に移動します。

### ライセンス

このソフトウェアはMITライセンスのもとで配布されています。

## Teratail Hide Feeds

teratailのtagsページでタグやタイトルで指定した質問（フィード）を非表示にするユーザースクリプトです。

### 動作環境

- Google Chrome
- Firefox

### インストール

1. 拡張機能Tampermonkeyをインストール

- [Google Chrome の Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox の Tampermonkey](https://addons.mozilla.org/ja/firefox/addon/tampermonkey/)

2. ユーザースクリプトの[Teratail_Hide_Feeds.user.js](https://github.com/querykuma/Teratail_Logs_Plus/raw/master/Teratail_Hide_Feeds.user.js)をTampermonkeyにインストール

### 使い方

1. Tampermonkey内でユーザースクリプト「Teratail Hide Feeds」を開き、フィードを非表示にしたいタグ名（変数HIDE_TAGS_RE）とフィードを非表示にしたいタイトル名（変数HIDE_TITLES_RE）を正規表現で編集します。
2. tagsページを開くと、1で設定したタグ名とタイトル名に適合する質問（フィード）が非表示になります。

### ライセンス

このソフトウェアはMITライセンスのもとで配布されています。
