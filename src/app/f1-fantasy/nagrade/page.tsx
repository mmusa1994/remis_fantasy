import PrizesGallery from "@/components/shared/PrizesGallery";
import { f1FantasyPrizes, f1FantasyConstruction } from "@/data/f1-fantasy";

export const metadata = {
  title: "F1 Fantasy — Nagrade",
  description:
    "Otkrijte F1 Fantasy Nagrade — nagrade, pravila i kako učestvovati u najbržoj racing ligi na svijetu.",
};

export default function F1FantasyNagradePage() {
  const prizes = f1FantasyPrizes;
  const content = f1FantasyConstruction;

  return (
    <div className="min-h-screen">
      <PrizesGallery
        prizes={prizes}
        leagueFilter="f1"
        title={content?.pageContent?.sections?.prizes?.title || "F1 Fantasy Nagrade"}
        subtitle="Osvojite brzinske nagrade u najuzbudljivijoj racing ligi!"
      />
    </div>
  );
}
