import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REMIS Fantasy",
  description: "Fantasy mini leagues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <body className="font-russo antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
