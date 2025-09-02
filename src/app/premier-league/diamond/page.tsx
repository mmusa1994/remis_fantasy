import BestDifferentials from "@/components/fpl/BestDifferentials";
import TeamNews from "@/components/fpl/TeamNews";

export default function DiamondPage() {
  return (
    <div className="min-h-screen bg-theme-background py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <BestDifferentials />
        <TeamNews />
      </div>
    </div>
  );
}
