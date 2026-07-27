import NavBar from "../NavBar";
import SideBar from "./SideBar";
import CollectionSidebar from "./CollectionSidebar";

// Wraps every route so NavBar renders once regardless of page (it's
// global chrome, not something that should vary per route). SideBar is
// laid out in the same flex row as the routed content, since it's now
// always part of the page layout (either a collapsed rail or an
// expanded panel) rather than an overlay on top of it. What the sidebar
// shows is decided here; today that's CollectionSidebar, but the panel
// itself (SideBar) doesn't know or care what's inside it.
export default function AppShell(props) {
  return (
    <div class="flex min-h-screen w-full">
      <SideBar title="Collections">
        <CollectionSidebar />
      </SideBar>
      <div class="min-w-0 flex-1">
        <div class="mx-auto w-full max-w-4xl px-6 pt-12">
          <NavBar />
        </div>
        {props.children}
      </div>
    </div>
  );
}
