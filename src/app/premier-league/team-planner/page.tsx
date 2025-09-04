"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import FantasyPlanner from "@/components/fpl/FantasyPlanner";

export default function TeamPlannerPage() {
  const searchParams = useSearchParams();
  const initialManagerId = searchParams?.get("managerId") || null;
  
  const [managerId, setManagerId] = useState<string | null>(initialManagerId);

  return (
    <div className="container mx-auto px-4 py-8">
      <FantasyPlanner managerId={managerId} />
    </div>
  );
}