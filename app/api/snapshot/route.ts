import { NextResponse } from "next/server";
import { getSnapshot } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/snapshot — full programme state (project, phases, tasks, team).
export async function GET() {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await getSnapshot();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load snapshot" }, { status: 500 });
  }
}
