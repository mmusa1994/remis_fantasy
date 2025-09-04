"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import VisitorTracker from "./VisitorTracker";

const isAdminPath = (path: string) => {
  return path.includes("admin") || path.includes("dashboard");
};

const isLoginPanel = (path: string) => {
  return path.includes("login") || path.includes("signup") || path.includes("forgot-password");
};

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = isAdminPath(pathname);
  const isLoginPanelBool = isLoginPanel(pathname);

  if (isAdmin) {
    return <main>{children}</main>;
  } else if (isLoginPanelBool) {
    return (
      <main>
        <Navbar />
        {children}
      </main>
    );
  }

  return (
    <>
      <VisitorTracker />
      <Navbar />
      <main className="pt-16 md:pt-20">{children}</main>
      <Footer />
    </>
  );
}
