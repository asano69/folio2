import NavBar from "../components/NavBar";
import CollectionList from "../components/CollectionList";

export default function Collections() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 px-6 py-12">
      <NavBar />
      <CollectionList />
    </div>
  );
}
