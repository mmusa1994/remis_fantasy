import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REMIS Fantasy 2025/26",
  description: "Prijavi se za novu sezonu REMIS Fantasy football lige",
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
