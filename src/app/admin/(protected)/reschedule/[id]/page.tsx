import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RescheduleForm } from "@/components/forms";
import { requireAdmin } from "@/lib/admin-auth";
import { getAppointmentById } from "@/lib/appointments";
import { formatWhen } from "@/lib/clinic";
import { getPickerConfig } from "@/lib/picker-config";

export const metadata: Metadata = { title: "Reschedule" };

export default function ReschedulePage(
  props: PageProps<"/admin/reschedule/[id]">,
) {
  return (
    <>
      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Appointments
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold tracking-tight">
        Reschedule appointment
      </h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Reschedule params={props.params} />
      </Suspense>
    </>
  );
}

async function Reschedule({
  params,
}: Pick<PageProps<"/admin/reschedule/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const appointment = await getAppointmentById(id);
  if (!appointment || appointment.status !== "confirmed") notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <span className="font-medium">{appointment.patientName}</span> is
        currently booked for{" "}
        <span className="font-medium">{formatWhen(appointment.startsAt)}</span>.
        They will be emailed the new time.
      </p>
      <RescheduleForm config={await getPickerConfig()} appointmentId={id} />
    </div>
  );
}
