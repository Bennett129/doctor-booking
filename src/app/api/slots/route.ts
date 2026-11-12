import type { NextRequest } from "next/server";
import { getOpenSlots } from "@/lib/appointments";
import { formatTime } from "@/lib/clinic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date" }, { status: 400 });
  }

  const slots = await getOpenSlots(date);
  return Response.json({
    slots: slots.map((slot) => ({
      startsAt: slot.startsAt.toISOString(),
      label: formatTime(slot.startsAt),
    })),
  });
}
