import { Show } from "solid-js";
import Loading from "./Loading";

// Shared page shell for the "detail" routes (ManifestViewer,
// CollectionViewer, LibraryViewer): each of them loads a single resource
// via createResource, shows a spinner until it resolves, then renders
// route-specific content inside the same outer layout. This component
// only owns that shared skeleton; what's inside is entirely up to the
// caller via children.
export default function ViewerPage(props) {
  // props.resource: the accessor returned by createResource (or any
  //   signal-like function) that resolves to the page's data, or
  //   undefined/null while still loading.
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <Show when={props.resource()} fallback={<Loading />}>
        {props.children}
      </Show>
    </div>
  );
}
