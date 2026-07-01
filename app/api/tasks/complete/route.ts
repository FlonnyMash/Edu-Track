import { NextResponse } from "next/server";
import { completeTask } from "@/lib/tasks/complete-task";
import { completeTaskSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = completeTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await completeTask(
      user.id,
      parsed.data.taskId,
      parsed.data.reflectionNotes
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete task";
    const status =
      message === "Task not found"
        ? 404
        : message === "Task already completed"
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
