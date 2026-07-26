import { A } from "@solidjs/router";
import { Button } from "@kobalte/core/button";
import { Image } from "@kobalte/core/image";
import pb from "../lib/pb";

export default function NavBar(props) {
  const handleLogout = () => pb.authStore.clear();

  return (
    <div class="mb-10 flex w-full flex-wrap items-center justify-between gap-y-3">
      <A href="/" class="flex items-center gap-2">
        <Image class="h-12 w-12">
          <Image.Img src="/favicon.svg" alt="" />
          <Image.Fallback>📖</Image.Fallback>
        </Image>
        <h1>folio2</h1>
      </A>
      <nav class="flex flex-wrap items-center gap-3">
        <A href="/stats">Stats</A>
        <A href="/settings">Settings</A>
        <Button onClick={handleLogout}>Log out</Button>
      </nav>
    </div>
  );
}
