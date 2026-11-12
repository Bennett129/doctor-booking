import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cancelByToken } from "@/app/actions";
import { ConfirmSubmit, RescheduleForm } from "@/components/forms";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentByToken } from "@/lib/appointments";
import { CLINIC, formatWhen } from "@/lib/clinic";
import { getPickerConfig } from "@/lib/picker-config";

export const metadata: Metadata = {
  title: "Your appointment",
  robots: { index: false },
};

const banners: Record<string, string> = {
  booked: "You're booked in. We've emailed you a confirmation.",
  rescheduled: "Your appointment has been moved. We've emailed you the new time.",
  cancelled: "Your appointment has been cancelled.",
};

export default function ManagePage(props: PageProps<"/manage/[token]">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <Suspense
          fallback={<p className="text-muted-foreground">Loading appointment…</p>}
        >
          <Appointment params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Appointment({
  params,
  searchParams,
}: Pick<PageProps<"/manage/[token]">, "params" | "searchParams">) {
  await connection();
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const appointment = await getAppointmentByToken(token);
  if (!appointment) notFound();

  const status = typeof query.status === "string" ? query.status : "";
  const banner = banners[status];
  const upcoming =
    appointment.status === "confirmed" && appointment.startsAt > new Date();

  return (
    <div className="space-y-6">
      {banner && (
        <p
          role="status"
          className="rounded-lg border border-primary/30 bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
        >
          {banner}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-3 text-xl">
            Your appointment
            <Badge
              variant={appointment.status === "confirmed" ? "default" : "outline"}
            >
              {appointment.status === "confirmed" ? "Confirmed" : "Cancelled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">When</dt>
              <dd className="font-medium">{formatWhen(appointment.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">With</dt>
              <dd className="font-medium">{CLINIC.doctor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="font-medium">
                {CLINIC.name}, {CLINIC.address}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Booked for</dt>
              <dd className="font-medium">{appointment.patientName}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {upcoming ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Move to another time</CardTitle>
            </CardHeader>
            <CardContent>
              <RescheduleForm config={await getPickerConfig()} token={token} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancel appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This frees the time for another patient and cannot be undone.
              </p>
              <form action={cancelByToken.bind(null, token)}>
                <ConfirmSubmit message="Cancel this appointment?">
                  Cancel appointment
                </ConfirmSubmit>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Link href="/book" className={buttonVariants()}>
          Book a new appointment
        </Link>
      )}
    </div>
  );
}
