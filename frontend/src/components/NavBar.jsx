import { createSignal, Show } from "solid-js";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { ToggleGroup } from "@kobalte/core/toggle-group";
import { Progress } from "@kobalte/core/progress";
import EllipsisVertical from "lucide-solid/icons/ellipsis-vertical";
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

// Icon-only style shared by the settings trigger and the
// Manifests/Collections/Libraries ToggleGroup items, matching
// SideBar.jsx's collapsed-rail NavIconLink so the same entry points look
// identical whether reached from NavBar or the collapsed sidebar rail.
const iconLinkClass =
  "icon-btn flex items-center justify-center rounded-md p-1.5 text-[var(--color-text)] transition-colors duration-150 hover:bg-[var(--color-hover-bg)]";

export default function NavBar() {
  const handleLogout = () => pb.authStore.clear();

  const location = useLocation();
  const navigate = useNavigate();

  // Derives which ToggleGroup item (if any) should show as pressed from
  // the current route, since the "selected" state lives in the router,
  // not in the ToggleGroup itself.
  const activeSection = () => {
    if (location.pathname.startsWith("/manifests")) return "manifests";
    if (location.pathname.startsWith("/collections")) return "collections";
    if (location.pathname.startsWith("/libraries")) return "libraries";
    return null;
  };

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
    <nav class="mb-10 flex w-full items-center justify-between">
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
            <Menu size={28} />
          </button>
        </Show>
        <Logo linkable size={isDesktop() ? "lg" : "md"} />
      </div>

      <div class="flex items-center gap-3">
        {/* Manifests/Collections/Libraries entry points as a single
            ToggleGroup instead of three independent links: they're
            mutually exclusive destinations, so a tab-like control fits
            the role better than plain nav buttons. Navigation itself
            still goes through useNavigate rather than ToggleGroup's own
            state, since the "selected" section is derived from the
            current route (see activeSection above), not tracked
            separately. */}
        <ToggleGroup
          value={activeSection()}
          onChange={(value) => {
            if (!value) return;
            if (value === "manifests") bumpManifestsShuffle();
            navigate(`/${value}`);
          }}
          class="flex items-center gap-1"
        >
          <ToggleGroup.Item
            value="manifests"
            aria-label="Manifests"
            class={iconLinkClass}
          >
            <BookOpen size={28} />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="collections"
            aria-label="Collections"
            class={iconLinkClass}
          >
            <LibraryIcon size={28} />
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="libraries"
            aria-label="Libraries"
            class={iconLinkClass}
          >
            <LandmarkIcon size={28} />
          </ToggleGroup.Item>
        </ToggleGroup>

        {/* Settings dropdown: the admin actions previously on their own
            /settings page (PocketBase link, folder import), plus
            logout, grouped into one dropdown instead of a separate
            page/top-level control. DropdownMenu (not NavigationMenu) is
            used here since there's only a single trigger: Content is
            positioned relative to the trigger automatically via
            floating-ui, so no manual top/left coordinates are needed. */}
        <DropdownMenu placement="bottom-end">
          <DropdownMenu.Trigger aria-label="Settings" class={iconLinkClass}>
            <EllipsisVertical size={28} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content class="z-50 flex min-w-52 flex-col gap-1 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-field)] p-2 shadow-md">
              <DropdownMenu.Item
                as="a"
                href="/_/"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-link"
              >
                PocketBase↗
              </DropdownMenu.Item>
              <DropdownMenu.Item
                as="button"
                type="button"
                onSelect={startImport}
                class="rounded px-3 py-1.5 text-left text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Import Folders
              </DropdownMenu.Item>
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
              <DropdownMenu.Item
                as="button"
                type="button"
                onSelect={handleLogout}
                class="rounded px-3 py-1.5 text-left text-sm data-[highlighted]:bg-[var(--color-hover-bg)]"
              >
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>
    </nav>
  );
}
