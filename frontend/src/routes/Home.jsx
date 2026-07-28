import Catalog from "../components/Catalog";
import CreateEntityButton from "../components/CreateEntityButton";

export default function Home() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <div class="flex w-full justify-end">
        <CreateEntityButton
          collection="collections"
          basePath="/collections"
          triggerLabel="New Collection"
        />
      </div>
      <Catalog />
    </div>
  );
}
