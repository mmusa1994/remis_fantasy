// Helper za boju monohromnih liga logo-a (pl-logo.png, cl-logo.png).
// Ti PNG-ovi su crne siluete — koriste se sa CSS filterom da dobiju brand boju.
// Isti filteri kao na home stranici (src/app/page.tsx).

export function getLogoFilter(
  logoUrl: string | null | undefined,
  accent: string | null | undefined,
): string | undefined {
  if (!logoUrl) return undefined;

  // Primjenjuj filter samo na poznate monohromne logoe
  const isMonochrome =
    logoUrl.includes("pl-logo.png") ||
    logoUrl.includes("cl-logo.png") ||
    logoUrl.includes("f1.png");

  if (!isMonochrome) return undefined;

  switch (accent) {
    case "purple":
      return "brightness(0) invert(22%) sepia(97%) saturate(4729%) hue-rotate(264deg) brightness(87%) contrast(96%)";
    case "blue":
      return "brightness(0) invert(29%) sepia(92%) saturate(2475%) hue-rotate(213deg) brightness(97%) contrast(92%)";
    case "red":
      return "brightness(0) invert(15%) sepia(85%) saturate(4500%) hue-rotate(350deg) brightness(95%) contrast(96%)";
    case "green":
      return "brightness(0) invert(45%) sepia(80%) saturate(2000%) hue-rotate(130deg) brightness(95%)";
    case "amber":
    case "gold":
      return "brightness(0) invert(70%) sepia(95%) saturate(1200%) hue-rotate(0deg) brightness(105%) contrast(98%)";
    default:
      return undefined;
  }
}
