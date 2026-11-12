import { Suspense } from "react";
import Link from "next/link";
import { adminCancel } from "@/app/actions";
import { ConfirmSubmit } from "@/components/forms";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin-auth";
import { listUpcomingAppointments } from "@/lib/appointments";
import { formatWhen } from "@/lib/clinic";

export default function AdminPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Upcoming appointments
      </h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Appointments />
      </Suspense>
    </>
  );
}

async function Appointments() {
  await requireAdmin();
  const appointments = await listUpcomingAppointments();

  if (appointments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-10 text-center text-muted-foreground">
        No upcoming appointments.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell className="font-medium">
                {formatWhen(appointment.startsAt)}
              </TableCell>
              <TableCell>{appointment.patientName}</TableCell>
              <TableCell>
                <a href={`mailto:${appointment.email}`} className="hover:underline">
                  {appointment.email}
                </a>
                <br />
                <span className="text-muted-foreground">{appointment.phone}</span>
              </TableCell>
              <TableCell className="max-w-56 whitespace-normal text-muted-foreground">
                {appointment.reason || "—"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/reschedule/${appointment.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Reschedule
                  </Link>
                  <form action={adminCancel}>
                    <input type="hidden" name="id" value={appointment.id} />
                    <ConfirmSubmit
                      message={`Cancel the appointment for ${appointment.patientName}? They will be emailed.`}
                    >
                      Cancel
                    </ConfirmSubmit>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
