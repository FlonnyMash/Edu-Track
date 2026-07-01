import { NextResponse } from "next/server";
import { getTaskByDayNumber } from "@/lib/tasks/get-task-by-day";
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
  const dayParam = searchParams.get("day");
  const dayNumber = dayParam ? Number.parseInt(dayParam, 10) : NaN;

  if (!Number.isFinite(dayNumber) || dayNumber < 1) {
    return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
  }

  const { task, error } = await getTaskByDayNumber(user.id, dayNumber);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
