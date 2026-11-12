import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CLINIC } from "@/lib/clinic";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${CLINIC.name} — Book an appointment`,
    template: `%s · ${CLINIC.name}`,
  },
  description: `Book an appointment with ${CLINIC.doctor} online in under a minute.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
