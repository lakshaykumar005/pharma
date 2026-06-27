import { NextResponse } from "next/server";
import { getAllTasks } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/tasks — every task/milestone, flat.
export async function GET() {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const tasks = await getAllTasks();
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
