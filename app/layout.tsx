import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { CartProvider } from "@/components/cart";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "kurtis.photo";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: { default: "kurtis.photo", template: "%s — kurtis.photo" },
    description: "Travel, landscape, street, and portrait photography by Kurtis Schlepp.",
    openGraph: {
      title: "kurtis.photo",
      description: "Things Kurtis saw along the way—travel, landscape, street, and portrait photography.",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "kurtis.photo — photography by Kurtis Schlepp" }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
        {process.env.CF_ANALYTICS_TOKEN ? (
          <Script
            data-cf-beacon={JSON.stringify({ token: process.env.CF_ANALYTICS_TOKEN })}
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
