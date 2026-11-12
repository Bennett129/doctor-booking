import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { BookingForm } from "@/components/forms";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CLINIC } from "@/lib/clinic";
import { getPickerConfig } from "@/lib/picker-config";

export const metadata: Metadata = { title: "Book an appointment" };

export default function BookPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Book an appointment
        </h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          With {CLINIC.doctor} at {CLINIC.name}.
        </p>
        <Suspense
          fallback={<p className="text-muted-foreground">Loading calendar…</p>}
        >
          <Booking />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Booking() {
  await connection();
  const config = await getPickerConfig();
  return <BookingForm config={config} />;
}
