import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { createSignal, onCleanup, Show } from "solid-js";

// Order matters: tokens.css defines the CSS custom properties every other
// stylesheet consumes via var().
import "./style.css";
import Home from "./routes/Home";
import ManifestViewer from "./routes/ManifestViewer";
import Settings from "./routes/Settings";
import Stats from "./routes/Stats";
import Login from "./routes/Login";

import pb from "./lib/pb";
import { ToastRegion } from "./lib/toast";

// AuthGate blocks the whole app behind Login until a valid superuser
// session exists, tracking pb.authStore so it reacts immediately to
// both login and logout.
function AuthGate(props) {
  const [authed, setAuthed] = createSignal(pb.authStore.isValid);
  const unsubscribe = pb.authStore.onChange(() =>
    setAuthed(pb.authStore.isValid),
  );
  onCleanup(unsubscribe);

  // pb.authStore.isValid already accounts for token expiry, but nothing
  // re-checks it while the tab stays open with no login/logout activity.
  // Poll periodically so an expired token falls back to Login on its own,
  // instead of waiting for a page reload or a failed API call.
  const expiryCheck = setInterval(
    () => setAuthed(pb.authStore.isValid),
    30_000,
  );
  onCleanup(() => clearInterval(expiryCheck));

  return (
    <Show when={authed()} fallback={<Login />}>
      {props.children}
    </Show>
  );
}

render(
  () => (
    <>
      <AuthGate>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/manifests/:id" component={ManifestViewer} />
          <Route path="/settings" component={Settings} />
          <Route path="/stats" component={Stats} />
        </Router>
      </AuthGate>
      <ToastRegion />
    </>
  ),
  document.getElementById("app"),
);
