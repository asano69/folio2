# レスポンシブUIの基盤 (Desktop / Mobile の切り分け)

## 目的
モバイルとPCで「同じ情報を単に大小変える」のではなく、UIの構造そのものを変える
（例: Collectionsは PC ではサイドバーパネル、モバイルでは通常のページ遷移）
ための基盤。

## ブレークポイント
- 唯一の判定基準は `frontend/src/lib/viewport.js` の `DESKTOP_QUERY`
  (`(min-width: 1024px)`, Tailwindの `lg` と揃えてある)。
- 見た目だけ変える場合は Tailwind の `lg:` を使う。
- レイアウト構造自体を変える場合（サイドバー vs ページ遷移 など）は
  `isDesktop()` を使ってJS側で分岐する。
- 二つの判定基準がずれると壊れるので、ブレークポイントを変える場合は
  必ず両方（Tailwind設定と viewport.js）を同時に変更すること。

## 状態管理
- デスクトップ限定のオーバーレイパネル（サイドバーなど）の開閉状態は
  `frontend/src/lib/uiState.js` にシグナルとして持つ。
- これらのシグナルは `AppShell`
  (`frontend/src/components/layout/AppShell.jsx`) が購読し、
  `isDesktop()` が真のときだけオーバーレイを描画する。
- ルート (`frontend/src/routes/*`) 自体はPC/モバイルを意識しない。
  分岐は NavBar などの「入り口」側と AppShell に閉じ込める。

## 新しいデスクトップ限定パネルを追加する手順
1. `uiState.js` に `xxxOpen` シグナルを追加する。
2. `AppShell.jsx` に `<Show when={isDesktop() && xxxOpen()}>` を追加する。
3. 開くトリガー（NavBarのリンクなど）で、`isDesktop()` が真のときだけ
   `e.preventDefault()` してシグナルを立てる。モバイルでは通常の
   `<A href>` によるページ遷移のままにする。
