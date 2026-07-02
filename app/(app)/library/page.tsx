import { redirect } from "next/navigation";
import { LibraryClient } from "@/components/library/LibraryClient";
import { LIBRARY_SCRIPTS } from "@/lib/library/catalog";
import { getUserLearningItems } from "@/lib/supabase/learningItemsService";
import { createClient } from "@/lib/supabase/server";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const learningItems = await getUserLearningItems(user.id);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-1">
      <header className="space-y-1">
        <h1 className="bg-linear-to-r from-city-orange via-city-magenta to-city-teal bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Kana Library
        </h1>
        <p className="text-sm text-city-muted">
          Browse the reference catalog, activate items for SRS review, or add
          your own vocabulary in My Words.
        </p>
      </header>

      <LibraryClient scripts={LIBRARY_SCRIPTS} learningItems={learningItems} />
    </div>
  );
}
