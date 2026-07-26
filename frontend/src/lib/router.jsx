import { Router, Route } from "@solidjs/router";

import Home from "../routes/Home";
import ManifestViewer from "../routes/ManifestViewer";
import Collections from "../routes/Collections";
import CollectionViewer from "../routes/CollectionViewer";
import Settings from "../routes/Settings";
import Stats from "../routes/Stats";

// All top-level routes in one place, so adding or removing a page never
// requires touching main.jsx.
export default function AppRouter() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/manifests/:id" component={ManifestViewer} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionViewer} />
      <Route path="/settings" component={Settings} />
      <Route path="/stats" component={Stats} />
    </Router>
  );
}
