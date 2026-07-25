# folio2


[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/asano69/folio2)

folio2はローカルサーバのストレージに保存されたスキャン資料を有効活用することを目的として設計されたシステムです。 


<img src="frontend/public/favicon.svg" width="100" align="right" />

- Library / Collection / Bookを単位としてスキャン資料を自由に整理できます。
- 書籍やページには永続性のある静的なURLが与えられ、Wikiなどから自由に参照できます。
- 各書籍には、BibTeXと互換性のある書誌情報の他、目次情報を保存できます。
- 各画像ページには、タグ・メモ・マーカーなどの注釈情報を保存できます。

## Design

### CBZ形式を使用しない
- PocketBaseをバックエンドにつかう場合は、CBZファイル形式を使うメリットがほとんどない。
- あらかじめ圧縮などの前処理をしたページをアプリからインポートするとS3互換ストレージにデータが保存されるようにする。
- S3に保存することでPocketBaseのサムネイル自動生成などの機能を活用することができ、しかもスケールすることができる。
- 画像はあらかじめ圧縮されていることが前提なため、ZIPで再圧縮しても効果はない。単一ファイルにすることもPocketBaseを使うならば大きな意味はない。
- デフォルトではファイルシステムを使い、ユーザが必要に感じたらS3に移行してもらうようにすればよい。

### folio.jsonを使用しない
- folio v1では、本のメタデータはCBZのなかのfolio.jsonに保存することになっていた。
- 新しい設計ではCBZファイルをつかわないので、folio.jsonを使う意味もない。DBを真実の源泉にする必要がある。

## Scope

### Non-goals

- 永続的に保存したいノートをここに保存してナレッジベースとして使う。（folioはナレッジベースではない）


## Entity
### note
- 本の中にはさんでおくような注釈メモ、読書ノートを書くためのもの。
- あるManifestに関連付けて、そのなかのimageに言及する。manifest_idは必須だがimage_idは任意。
### tag
- Pageにつける属性。複数選択可能。ページの集成（コンピテーション）を作成するのに役立つ。
- 質的データ分析手法(Qualitative Data Analysis)におけるコードに相当。資料の中から、意味のある単位を切り出し、短いラベル（コード）を付けて分類・整理する。
- あるManifestの情報に、そのManifestに含まれているtagの一覧を表示するようにする。

## Tech Stack
- backend: Go+PocketBase v0.39+
- frontend: solid.js + tailwind v4





