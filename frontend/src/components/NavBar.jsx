import { A } from "@solidjs/router";
import { NavigationMenu } from "@kobalte/core/navigation-menu";
import ChevronDown from "lucide-solid/icons/chevron-down";
import pb from "../lib/pb";
import Logo from "./Logo";
import { setSidebarOpen } from "./layout/uiState";

// Shared look for every top-level entry, matching the previous <A>/<Button>
// style (see style.css's .btn-link rule).
const itemClass = "btn-link";

export default function NavBar() {
  const handleLogout = () => pb.authStore.clear();

  return (
    <div class="mb-10 flex w-full flex-wrap items-center justify-between gap-y-3">
      <Logo linkable />
      <NavigationMenu class="flex flex-wrap items-center gap-3">
        {/* Plain page links: Kobalte's "link trigger" pattern (a Trigger
            with no surrounding NavigationMenu.Menu) navigates immediately
            instead of opening a dropdown. `as={A}` keeps navigation
            client-side, like the rest of the app. */}
        <NavigationMenu.Trigger as={A} href="/stats" class={itemClass}>
          Stats
        </NavigationMenu.Trigger>

        {/* Settings-related entries (the Settings page, the sidebar
            toggle, and logout) grouped into one dropdown instead of each
            being its own top-level control. */}
        <NavigationMenu.Menu>
          <NavigationMenu.Trigger class={`${itemClass} gap-1`}>
            Settings
            <NavigationMenu.Icon>
              <ChevronDown size={14} />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Portal>
            <NavigationMenu.Content class="absolute top-0 left-0 z-50 flex min-w-40 flex-col gap-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-2 shadow-md">
              <NavigationMenu.Item
                as={A}
                href="/settings"
                class="rounded px-3 py-1.5 text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Settings
              </NavigationMenu.Item>
              {/* Not a link, so it's rendered as a button rather than
                  NavigationMenu.Item's default <a> element. */}
              <NavigationMenu.Item
                as="button"
                type="button"
                onSelect={() => setSidebarOpen(true)}
                class="rounded px-3 py-1.5 text-left text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Sidebar
              </NavigationMenu.Item>
              <NavigationMenu.Item
                as="button"
                type="button"
                onSelect={handleLogout}
                class="rounded px-3 py-1.5 text-left text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Log out
              </NavigationMenu.Item>
            </NavigationMenu.Content>
          </NavigationMenu.Portal>
        </NavigationMenu.Menu>

        <NavigationMenu.Viewport class="relative" />
      </NavigationMenu>
    </div>
  );
}
