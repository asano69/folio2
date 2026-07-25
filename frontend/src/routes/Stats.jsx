import NavBar from "../components/NavBar";

// Placeholder stats page. NavBar already links here, so this needs to
// exist and be routed even before a real chart/data source is wired up.
// Swap the <p> below for an actual chart once there's data to show.
export default function Stats() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <p>Stats coming soon.</p>
    </div>
  );
}
