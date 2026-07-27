import { Router, Route } from "@solidjs/router";

import Home from "../routes/Home";
import ManifestViewer from "../routes/ManifestViewer";
import Collections from "../routes/Collections";
import CollectionViewer from "../routes/CollectionViewer";
import Libraries from "../routes/Libraries";
import LibraryViewer from "../routes/LibraryViewer";
import Settings from "../routes/Settings";
import Stats from "../routes/Stats";
import AppShell from "../components/layout/AppShell";

// All top-level routes in one place, so adding or removing a page never
// requires touching main.jsx.
//
// AppShell is passed as `root` rather than wrapped around <Router> in
// main.jsx. Solid Router renders `root` *inside* the router context and
// fills its `props.children` with the matched route, so AppShell's
// desktop-only overlays (e.g. the Collections sidebar, which uses <A>)
// can use router primitives instead of erroring outside a Route.
export default function AppRouter() {
  return (
    <Router root={AppShell}>
      <Route path="/" component={Home} />
      <Route path="/manifests/:id" component={ManifestViewer} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionViewer} />
      <Route path="/libraries" component={Libraries} />
      <Route path="/libraries/:id" component={LibraryViewer} />
      <Route path="/settings" component={Settings} />
      <Route path="/stats" component={Stats} />
    </Router>
  );
}
