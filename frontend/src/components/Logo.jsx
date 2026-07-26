import { A } from "@solidjs/router";
import { Image } from "@kobalte/core/image";
// Bundled copy of public/favicon.svg. Importing from src/ lets Vite inline
// it with the JS bundle instead of fetching it separately at runtime,
// which otherwise causes the logo to visibly pop in after Home renders.
import logoUrl from "../assets/logo.svg";

// Shared icon + app name, used by NavBar (post-login, links back to Home)
// and Login (pre-login, where there's nowhere to navigate to yet, so it
// renders as plain text/icon instead of a link).
export default function Logo(props) {
  const content = (
    <>
      <Image class="h-12 w-12">
        <Image.Img src={logoUrl} alt="" />
      </Image>
      <div class="logo text-4xl font-serif">folio</div>
    </>
  );

  return props.linkable ? (
    <A href="/" class="flex items-center gap-2">
      {content}
    </A>
  ) : (
    <div class="flex items-center gap-2">{content}</div>
  );
}

