export const metadata = {
  title: "F1 Fantasy Nagrade - REMIS Fantasy",
  description:
    "F1 Fantasy nagrade - osvojite brzinske nagrade u najuzbudljivijoj racing ligi!",
};

export default function F1FantasyGalerijaPage() {
  return (
    <div className="min-h-screen bg-theme-card theme-transition">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme-foreground mb-4 theme-transition">
            F1 Fantasy Nagrade
          </h1>
          <p className="text-base sm:text-lg text-theme-text-secondary theme-transition">
            Osvojite brzinske nagrade u najuzbudljivijoj racing ligi!
          </p>
        </div>

        <div className="bg-theme-card rounded-lg border-theme-border p-6 sm:p-8 theme-transition">
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-6 text-white">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                🏁 Prva nagrada
              </h2>
              <div className="text-3xl sm:text-4xl font-bold mb-2">
                1000 KM
              </div>
              <p className="text-lg font-semibold">
                F1 Racing Champion
              </p>
            </div>
            
            <div className="text-center py-4">
              <p className="text-theme-text-secondary text-sm sm:text-base">
                Osvojite glavnu nagradu i postanite prvak najbrže motorsport fantazi lige!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
