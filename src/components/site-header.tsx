import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-4" aria-hidden />
          </span>
          {CLINIC.name}
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
            Staff
          </Link>
          <Link href="/book" className={buttonVariants()}>
            Book
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        {CLINIC.name} · {CLINIC.address} · {CLINIC.phone}
        <br />
        Demo project. Not a real medical practice.
      </div>
    </footer>
  );
}
