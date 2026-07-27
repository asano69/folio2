import Catalog from "../components/Catalog";

export default function Home() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <Catalog />
    </div>
  );
}
