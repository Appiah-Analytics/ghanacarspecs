import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhanaCarSpecs - Vehicle history & specs",
  description: "Check a vehicle's specs and recorded history (local MVP).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
