import { Select } from "@kobalte/core/select";
import { sidebarView, setSidebarView } from "./sidebarView";

// Options shown in the switcher, keyed by the values lib/sidebarView.js
// stores and understands.
const OPTIONS = [
  { value: "collections", label: "Collections" },
  { value: "libraries", label: "Libraries" },
];

// Replaces SideBar's static heading with a Kobalte Select, letting the
// person switch which list (CollectionSidebar or LibrarySidebar) the
// panel shows. Passed into SideBar as `title` -- see AppShell.jsx.
export default function SidebarViewSelect() {
  const selectedOption = () => OPTIONS.find((o) => o.value === sidebarView());

  return (
    <Select
      options={OPTIONS}
      optionValue="value"
      optionTextValue="label"
      value={selectedOption()}
      onChange={(option) => option && setSidebarView(option.value)}
      itemComponent={(props) => (
        <Select.Item
          item={props.item}
          class="cursor-pointer rounded px-3 py-1.5 data-[highlighted]:bg-[var(--color-hover-bg)]"
        >
          <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
        </Select.Item>
      )}
    >
      <Select.Trigger
        aria-label="Sidebar view"
        class="w-32 my-1  justify-between font-medium border-none bg-transparent px-0 py-0 shadow-none text-xl hover:border-transparent hover:bg-transparent active:border-transparent active:bg-transparent active:shadow-none"
      >
        <Select.Value>{(state) => state.selectedOption()?.label}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="z-60 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] p-1 shadow-md">
          <Select.Listbox />
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
