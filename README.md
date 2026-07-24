# folio2


[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/asano69/folio2)

folio2はローカルサーバのストレージに保存されたスキャン資料を有効活用することを目的として設計されたシステムです。 


<img src="frontend/public/favicon.svg" width="100" align="right" />

- Library / Collection / Bookを単位としてスキャン資料を自由に整理できます。
- 書籍やページには永続性のある静的なURLが与えられ、Wikiなどから自由に参照できます。
- 各書籍には、BibTeXと互換性のある書誌情報の他、目次情報を保存できます。
- 各画像ページには、タグ・メモ・マーカーなどの注釈情報を保存できます。



## Scope

### Non-goals

- Folioは探究心のある個人のために作られたセルフホスティングアプリであり一般公開やコラボレーションを想定していない。


### Tech Stack
- backend: Go+PocketBase v0.39+
- frontend: solid.js + tailwind v4





