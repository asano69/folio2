import Catalog from "../components/Catalog";

import { addCollection } from "../lib/collections";

export default function Home() {
  return (
    <div class="mx-auto flex min-h-screen w-full flex-col items-center gap-8 px-24 py-12">
      <div class="flex w-full justify-end">

      </div>
      <Catalog />
    </div>
  );
}
