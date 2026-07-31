import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { Image } from "@kobalte/core/image";
// Bundled copy of public/favicon.svg. Importing from src/ lets Vite inline
// it with the JS bundle instead of fetching it separately at runtime,
// which otherwise causes the logo to visibly pop in after Home renders.
import logoUrl from "../assets/logo.svg";

// Shared icon + app name, used by NavBar (post-login, links back to Home),
// Login (pre-login, where there's nowhere to navigate to yet, so it
// renders as plain text/icon instead of a link), and SideBar's expanded
// header (smaller, via size="sm").
const SIZES = {
  lg: { icon: "h-12 w-12", text: "text-4xl" },
  md: { icon: "h-8 w-8", text: "text-2xl" },
  sm: { icon: "h-6 w-6", text: "text-xl" },
};

export default function Logo(props) {
  const size = () => SIZES[props.size ?? "lg"];

  const content = (
    <>
      <Image class={size().icon}>
        <Image.Img src={logoUrl} alt="" />
      </Image>
      <div class={`logo font-serif ${size().text}`}>folio</div>
    </>
  );

  return (
    <Show
      when={props.linkable}
      fallback={<div class="flex items-center gap-2">{content}</div>}
    >
      <A
        href="/"
        class="group flex items-center gap-2 transition-opacity hover:opacity-60 hover:scale-[1.02]"
      >
        {content}
      </A>
    </Show>
  );
}
