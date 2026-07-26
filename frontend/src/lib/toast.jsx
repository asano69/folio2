import { Toast, toaster } from "@kobalte/core/toast";

// Single global error toast used across the app, so components that can
// fail (Login, Admin, NoteEditor, ...) don't each need their own
// createSignal + inline <p> error display.
export function showError(message) {
  toaster.show((props) => (
    <Toast toastId={props.toastId} class="rounded-md border p-4">
      <Toast.Description>{message}</Toast.Description>
      <Toast.CloseButton>×</Toast.CloseButton>
    </Toast>
  ));
}

// Mounted once near the root of the app (see main.jsx); renders whatever
// toasts are currently active via showError() above.
export function ToastRegion() {
  return (
    <Toast.Region>
      <Toast.List class="fixed right-4 bottom-4 z-[100002] flex flex-col gap-2" />
    </Toast.Region>
  );
}
