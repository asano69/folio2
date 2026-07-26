# folio


[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/asano69/folio)

folioはローカルサーバのストレージに保存されたスキャン資料を有効活用することを目的として設計されたシステムです。 


<img src="frontend/public/favicon.svg" width="100" align="right" />

- Library / Collection / Manifestを単位としてスキャン資料を自由に整理できます。
- 書籍やページには永続性のある静的なURLが与えられ、Wikiなどから自由に参照できます。
- 各書籍には、BibTeXと互換性のある書誌情報の他、目次情報を保存できます。
- 各画像ページには、タグ・メモ・マーカーなどの注釈情報を保存できます。

## Purpose

Many existing open-source book viewers focus primarily on basic functions such as browsing and organizing books, but they often lack sufficient integration of annotation features—such as notes, highlights, and tagging—that are essential for research and inquiry activities. In addition, insufficient attention is often given to URI design for uniquely and persistently referencing individual pages, creating a risk that links to specific locations may become invalid in the future. As a result, challenges remain in ensuring the reproducibility, referenceability, and reliability required of an information infrastructure for research and inquiry activities. folio was developed with the aim of solving these problems. By integrating annotation features with a persistent referencing mechanism, it aims to realize a research support platform that enables users to continuously accumulate, share, and reuse knowledge.

## 旧folioとの変更点

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

## 要件

### モバイル重視
- モバイル端末からでも効率的に画像資料にアクセスできるようにしなければならない。

### 物理本との比較によるユーザー体験要件

- **安心感の継承**: 本棚の本は失われないという安心感を損ねない
- **アクセス性の向上**:
  - ブラウジング: 本をパラパラめくる体験をシミュレート
  - 目次: 情報構造の全体像を素早く把握
  - タグ・マーク: ページへのクイックアクセス
  - 書き込み: 記憶の想起トリガー
- **永続的リソースアクセス**: すべてのページにURIを割り当て
- **抽出可能性**: 内容を他のツールを関連付け可能に


## Entity
The schema was developed with reference to [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/).

### manifest
- 画像資料をグループ化する単位。本に相当する。
- 含まれている画像資料のリストと、それらのメタデータを宣言する

### collection
- manifestのリスト。あるテーマに基づいて収集されたマニフェストの目録。
- 調査は、このcollectionのなかのmanifestを系統的に分析することによって進行する。

### page
- 画像資料へのリンク、タグ属性、元のページ番号、マークアップ、機械整理用のdescriptionなどの情報をもつ。
- noteエンティティから1対多で参照される。
- ノートに参照されているページには、そのノートを表示する。（逆参照）

### range
- あるManifestのなかにふくまれるページを構造化しナビゲータを作成するためのエンティティ。
- 本のなかの目次と考えて良い。

### note
- 本の中にはさんでおくような注釈メモ、読書ノートを書くためのもの。
- あるnoteのスコープは、あるmanifestのなかに閉じている。（本質的に、ただのメモ。ここにナレッジベースを作るべきではない）


### tag
- Pageにつける属性。複数選択可能。ページの集成（コンピテーション）を作成するのに役立つ。
- 質的データ分析手法(Qualitative Data Analysis)におけるコードに相当。資料の中から、意味のある単位を切り出し、短いラベル（コード）を付けて分類・整理する。
- あるManifestの情報に、そのManifestに含まれているtagの一覧を表示するようにする。

### library
- collectionを分類するためのタグのようなもの。
- libraryは、collectionのリストをもつ
- カバー画像を設定できる。

## Tech Stack

### Frontend
- UI: Solid.js v1.9 + Kobalte v0.13
- Style: Tailwind v4
- Icon: Lucide
- NoteEditor: Slab/Quill v2
- ImageViewer: [PhotoSwipe](https://github.com/dimsemenov/photoswipe) v5.4+

### Backend
- Go
- PocketBase v0.39+

---

## References
- https://deepwiki.com/internetarchive/bookreader

