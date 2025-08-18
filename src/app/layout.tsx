import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export const metadata: Metadata = {
  title: "REMIS Fantasy",
  description: "Fantasy mini leagues",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <body
        className="font-russo antialiased w-full"
        suppressHydrationWarning={true}
      >
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
