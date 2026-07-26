import { A } from "@solidjs/router";
import { Button } from "@kobalte/core/button";
import pb from "../lib/pb";
import Logo from "./Logo";

export default function NavBar(props) {
  const handleLogout = () => pb.authStore.clear();

  return (
    <div class="mb-10 flex w-full flex-wrap items-center justify-between gap-y-3">
      <Logo linkable />
      <nav class="flex flex-wrap items-center gap-3">
        <A href="/collections" class="btn-link">Collections</A>
        <A href="/stats" class="btn-link">Stats</A>
        <A href="/settings" class="btn-link">Settings</A>
        <Button onClick={handleLogout}>Log out</Button>
      </nav>
    </div>
  );
}
