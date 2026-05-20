import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GhanaCarSpecs — Vehicle intelligence & history for Ghana",
    template: "%s · GhanaCarSpecs",
  },
  description:
    "Look up vehicles in Ghana by VIN, plate, or chassis. Demo platform combining local GhanaCarSpecs sample records with public NHTSA VIN decoding.",
  openGraph: {
    title: "GhanaCarSpecs — Vehicle intelligence for Ghana",
    description:
      "Demo vehicle lookup: local sample history and intelligence plus external VIN specifications when not on file.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
