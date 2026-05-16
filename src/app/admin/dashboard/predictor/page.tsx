"use client";

import AdminPredictorManager from "@/components/admin/AdminPredictorManager";
import WCBackground from "@/components/shared/WCBackground";

export default function AdminPredictorPage() {
  return (
    <div className="relative min-h-screen">
      <WCBackground variant="hero" opacity={0.08} fixed />
      <div className="relative z-10">
        <AdminPredictorManager />
      </div>
    </div>
  );
}
