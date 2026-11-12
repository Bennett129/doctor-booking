import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin · ${CLINIC.name}` },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-1">
            <span className="mr-3 font-semibold">{CLINIC.name} · Admin</span>
            <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
              Appointments
            </Link>
            <Link
              href="/admin/availability"
              className={buttonVariants({ variant: "ghost" })}
            >
              Availability
            </Link>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
