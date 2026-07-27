import { A } from "@solidjs/router";
import { Button } from "@kobalte/core/button";
import pb from "../lib/pb";
import Logo from "./Logo";
import { isDesktop } from "../lib/viewport";
import { setCollectionsSidebarOpen } from "./layout/uiState";

export default function NavBar() {
  const handleLogout = () => pb.authStore.clear();

  // On desktop, Collections opens as an overlay sidebar (see AppShell)
  // instead of navigating away. On mobile the href is left to work
  // normally, since there is no sidebar there. Middle-click/new-tab/direct
  // URL access to /collections still work either way, since href stays set.
  const handleCollectionsClick = (e) => {
    if (!isDesktop()) return;
    e.preventDefault();
    setCollectionsSidebarOpen(true);
  };

  return (
    <div class="mb-10 flex w-full flex-wrap items-center justify-between gap-y-3">
      <Logo linkable />
      <nav class="flex flex-wrap items-center gap-3">
        <A href="/collections" class="btn-link" onClick={handleCollectionsClick}>
          Collections
        </A>
        <A href="/stats" class="btn-link">
          Stats
        </A>
        <A href="/settings" class="btn-link">
          Settings
        </A>
        <Button onClick={handleLogout}>Log out</Button>
      </nav>
    </div>
  );
}
