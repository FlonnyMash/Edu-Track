import { NextResponse } from "next/server";
import { getActiveLearningItemCount } from "@/lib/supabase/learningItemsService";
import { getDueSrsStack } from "@/lib/supabase/srsService";
import { mergeSrsReviewItems } from "@/lib/srs/merge-review-items";
import type { SrsReviewItemMeta } from "@/lib/srs/types";
import { parseSrsReviewFromMetadata } from "@/lib/srs/parse-srs-metadata";
import { getLocalDateString } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone || "UTC";
  const localToday = getLocalDateString(timezone);

  try {
    const [{ items: dueItems, totalCount: dueCount }, activeLearningCount] =
      await Promise.all([
        getDueSrsStack(user.id, localToday),
        getActiveLearningItemCount(user.id),
      ]);

    let taskReviewItems: SrsReviewItemMeta[] = [];
    if (taskId) {
      const { data: task } = await supabase
        .from("daily_tasks")
        .select("ai_metadata")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .maybeSingle();

      taskReviewItems = parseSrsReviewFromMetadata(task?.ai_metadata);
    }

    const items = mergeSrsReviewItems(taskReviewItems, dueItems);

    return NextResponse.json({
      items,
      totalCount: Math.max(dueCount, items.length),
      dueCount,
      taskReviewCount: taskReviewItems.length,
      activeLearningCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load SRS stack" },
      { status: 500 }
    );
  }
}
