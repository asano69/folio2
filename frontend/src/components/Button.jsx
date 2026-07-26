import { Button as KobalteButton } from "@kobalte/core/button";

// A single reusable button, backed by Kobalte's unstyled Button
// primitive. Visual styling (colors, borders, shadows) has been removed
// as part of the Kobalte migration and will be reintroduced once the
// app's design system is rebuilt on top of Kobalte; only structural
// layout classes remain for now.
export default function Button(props) {
  return (
    <KobalteButton
      id={props.id}
      class="my-1.5 whitespace-nowrap md:mx-3 md:my-0"
      title={props.title}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.value}
    </KobalteButton>
  );
}
