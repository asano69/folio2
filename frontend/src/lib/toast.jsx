import { Toast, toaster } from "@kobalte/core/toast";

// Shared rendering for both toast variants. A colored left border marks
// the outcome (green = success, red = error) instead of a title, so the
// toast stays compact. No close button: toasts auto-dismiss on their own
// (duration below), so a manual close control is unnecessary.
function showToast(message, variant) {
  const accent =
    variant === "success" ? "border-l-green-500" : "border-l-red-500";

  toaster.show(
    (props) => (
      <Toast
        toastId={props.toastId}
        class={`animate-[toast-in_0.2s_ease-out] rounded-md border border-l-4 bg-[var(--color-field)] p-4 shadow-md ${accent}`}
      >
        <Toast.Description>{message}</Toast.Description>
      </Toast>
    ),
    { duration: 2500 },
  );
}

export function showError(message) {
  showToast(message, "error");
}

export function showSuccess(message) {
  showToast(message, "success");
}

// Mounted once near the root of the app (see main.jsx); renders whatever
// toasts are currently active. Positioned top-right, with swipeDirection
// matching that corner.
export function ToastRegion() {
  return (
    <Toast.Region swipeDirection="right">
      <Toast.List class="fixed top-4 right-4 z-[100002] flex flex-col gap-2" />
    </Toast.Region>
  );
}
