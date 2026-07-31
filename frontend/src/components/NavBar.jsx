import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import { NavigationMenu } from "@kobalte/core/navigation-menu";
import { Progress } from "@kobalte/core/progress";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Menu from "lucide-solid/icons/menu";
import BookOpen from "lucide-solid/icons/book-open";
import LibraryIcon from "lucide-solid/icons/library";
import LandmarkIcon from "lucide-solid/icons/landmark";
import pb from "../lib/pb";
import Logo from "./Logo";
import { bumpManifestsShuffle } from "../lib/manifests";
import { setSidebarOpen } from "./layout/uiState";
import { isDesktop } from "../lib/viewport";
import { showError } from "../lib/toast";

// Shared look for every top-level entry, matching the previous <A>/<Button>
// style (see style.css's .btn-link rule).
const itemClass = "btn-link";

// Icon-only style shared by the Manifests/Collections/Libraries buttons,
// matching SideBar.jsx's collapsed-rail NavIconLink so the same three
// entry points look identical whether reached from NavBar or the
// collapsed sidebar rail.
const iconLinkClass =
  "icon-btn flex items-center justify-center rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]";

export default function NavBar() {
  const handleLogout = () => pb.authStore.clear();

  // Import-folders job state, moved here from the now-removed Settings
  // page (see routes/Settings/Admin.jsx) since both admin actions live
  // in this dropdown instead of a separate page.
  const [job, setJob] = createSignal(null);

  // Applies a jobs record (from realtime or a plain fetch) to local state,
  // and stops listening once the job has reached a terminal status.
  const applyJob = (record) => {
    setJob({
      status: record.status,
      message: record.message,
      processed: record.processed,
      total: record.total,
    });
    if (record.status === "completed" || record.status === "failed") {
      pb.collection("jobs").unsubscribe(record.id);
    }
  };

  const startImport = async () => {
    try {
      const { id } = await pb.send("/api/admin/jobs/import-folders", {
        method: "POST",
      });
      setJob({ status: "queued", message: "", processed: 0, total: 0 });

      // Subscribe first, then fetch the current record once the
      // subscription is active. The import can finish (even fully
      // complete) between job creation and this point, so without this
      // catch-up fetch a fast job's progress/completion would never
      // reach the UI and the progress bar would be stuck on "queued".
      await pb.collection("jobs").subscribe(id, (e) => applyJob(e.record));
      applyJob(await pb.collection("jobs").getOne(id));
    } catch (err) {
      showError(err?.message || "Failed to start import.");
    }
  };

  return (
    <div class="mb-10 flex w-full flex-wrap items-center justify-between gap-y-3">
      <div class="flex items-center gap-2">
        {/* Mobile-only: opens the sidebar overlay. On desktop the
            sidebar is always visible as a rail/panel, so this toggle
            is unnecessary there (see SideBar.jsx). */}
        <Show when={!isDesktop()}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            class="icon-btn cursor-pointer rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]"
          >
            <Menu size={20} />
          </button>
        </Show>
        <Logo linkable />
      </div>
      <NavigationMenu class="flex flex-wrap items-center gap-3">
        {/* Plain page links: Kobalte's "link trigger" pattern (a Trigger
            with no surrounding NavigationMenu.Menu) navigates immediately
            instead of opening a dropdown. `as={A}` keeps navigation
            client-side, like the rest of the app. */}
        <NavigationMenu.Trigger
          as={A}
          href="/manifests"
          aria-label="Manifests"
          class={iconLinkClass}
          onClick={bumpManifestsShuffle}
        >
          <BookOpen size={35} />
        </NavigationMenu.Trigger>
        <NavigationMenu.Trigger
          as={A}
          href="/collections"
          aria-label="Collections"
          class={iconLinkClass}
        >
          <LibraryIcon size={35} />
        </NavigationMenu.Trigger>
        <NavigationMenu.Trigger
          as={A}
          href="/libraries"
          aria-label="Libraries"
          class={iconLinkClass}
        >
          <LandmarkIcon size={35} />
        </NavigationMenu.Trigger>

        {/* Settings dropdown: the admin actions previously on their own
            /settings page (PocketBase link, folder import), plus
            logout, grouped into one dropdown instead of a separate
            page/top-level control. */}
        <NavigationMenu.Menu>
          <NavigationMenu.Trigger class={`${itemClass} gap-1`}>
            Settings
            <NavigationMenu.Icon>
              <ChevronDown size={14} />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Portal>
            <NavigationMenu.Content class="absolute top-0 left-0 z-50 flex min-w-52 flex-col gap-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-2 shadow-md">
              <NavigationMenu.Item
                as="a"
                href="/_/"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-link"
              >
                PocketBase↗
              </NavigationMenu.Item>
              <NavigationMenu.Item
                as="button"
                type="button"
                onSelect={startImport}
                class="rounded px-3 py-1.5 text-left text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Import Folders
              </NavigationMenu.Item>
              <Show when={job()}>
                <Progress
                  value={job().processed}
                  minValue={0}
                  maxValue={job().total || 1}
                  indeterminate={!job().total}
                  class="flex flex-col gap-1 px-3 py-1.5"
                >
                  <div class="flex justify-between text-sm">
                    <Progress.Label>{job().status}</Progress.Label>
                    <Progress.ValueLabel>
                      {job().processed}/{job().total}
                    </Progress.ValueLabel>
                  </div>
                  <Progress.Track class="h-2 w-full rounded-full border">
                    <Progress.Fill class="h-full rounded-full" />
                  </Progress.Track>
                  <p class="text-sm">{job().message}</p>
                </Progress>
              </Show>
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
