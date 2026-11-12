import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINIC } from "@/lib/clinic";

export const metadata: Metadata = { title: "Staff sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-secondary px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Staff sign in</CardTitle>
          <CardDescription>{CLINIC.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <Link href="/" className="block text-sm text-muted-foreground hover:underline">
            ← Back to the website
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
