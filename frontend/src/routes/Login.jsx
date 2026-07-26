import { createSignal } from "solid-js";
import { Button } from "@kobalte/core/button";
import { TextField } from "@kobalte/core/text-field";
import pb from "../lib/pb";
import { showError } from "../lib/toast";

// Login screen shown by AuthGate when no valid superuser session exists.
// This app is single-user, so the PocketBase superuser account also
// serves as the app's only login; there is no separate "users" collection.
export default function Login() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [pending, setPending] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    try {
      await pb.collection("_superusers").authWithPassword(email(), password());
      // No further action needed here: AuthGate subscribes to
      // pb.authStore.onChange and swaps this screen for the app once the
      // token is stored.
    } catch {
      showError("Invalid email or password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div class="flex min-h-screen w-full items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        class="flex w-full max-w-sm flex-col gap-4 rounded-md border p-8"
      >
        <h1 class="text-center text-3xl">folio2</h1>
        <TextField
          value={email()}
          onChange={setEmail}
          required
        >
          <TextField.Input
            type="email"
            placeholder="Email"
            autofocus
            class="w-full rounded-md border px-3 py-2"
          />
        </TextField>
        <TextField
          value={password()}
          onChange={setPassword}
          required
        >
          <TextField.Input
            type="password"
            placeholder="Password"
            class="w-full rounded-md border px-3 py-2"
          />
        </TextField>
        <Button type="submit" disabled={pending()}>
          {pending() ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
