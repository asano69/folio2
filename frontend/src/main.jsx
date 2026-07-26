import { render } from "solid-js/web";

// Order matters: tokens.css defines the CSS custom properties every other
// stylesheet consumes via var().
import "./style.css";
import AppRouter from "./lib/router";
import AuthGate from "./lib/auth";
import { ToastRegion } from "./lib/toast";

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
