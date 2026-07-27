import NavBar from "../NavBar";
import SideBar from "./SideBar";
import CollectionSidebar from "./CollectionSidebar";

// Wraps every route so NavBar renders once regardless of page (it's
// global chrome, not something that should vary per route), and so the
// overlay sidebar panel can render on top of whichever page is currently
// active, without each route needing to know about it. What the sidebar
// shows is decided here; today that's CollectionSidebar, but the panel
// itself (SideBar) doesn't know or care what's inside it.
export default function AppShell(props) {
  return (
    <>
      <div class="mx-auto w-full max-w-4xl px-6 pt-12">
        <NavBar />
      </div>
      {props.children}
      <SideBar title="Collections">
        <CollectionSidebar />
      </SideBar>
    </>
  );
}
