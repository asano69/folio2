import { render } from "solid-js/web";

// Order matters: tokens.css defines the CSS custom properties every other
// stylesheet consumes via var().
import "./style.css";
import AppRouter from "./lib/router";
import AuthGate from "./lib/auth";
import { ToastRegion } from "./lib/toast";

// AppShell (desktop overlay panels like the Collections sidebar) is
// mounted via AppRouter's <Router root={AppShell}>, not here -- it needs
// to live inside the router context (see router.jsx).
render(
  () => (
    <>
      <AuthGate>
        <AppRouter />
      </AuthGate>
      <ToastRegion />
    </>
  ),
  document.getElementById("app"),
);
