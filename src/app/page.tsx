import Link from "next/link";
import { CalendarCheck, Clock, MailCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";

const steps = [
  {
    icon: CalendarCheck,
    title: "Pick a time",
    body: "See every free appointment for the next two months and choose the one that suits you.",
  },
  {
    icon: MailCheck,
    title: "Get it in writing",
    body: "A confirmation email arrives straight away, with everything you need for the day.",
  },
  {
    icon: Clock,
    title: "Change it any time",
    body: "Plans changed? Reschedule or cancel from the link in your email. No phone queue.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-secondary">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
            <p className="text-sm font-semibold text-primary">{CLINIC.doctor}</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              See your GP without waiting on hold.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Book an appointment at {CLINIC.name} online in under a minute, at
              any time of day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className={buttonVariants({ size: "lg" })}>
                Book an appointment
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-6 text-primary" aria-hidden />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
