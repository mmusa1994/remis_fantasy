import type { ValidationSchema } from "./validator";
import type { z } from "zod";

type Validation = z.infer<typeof ValidationSchema> & {
  term_evidence: string[];
};

export function route(validation: Validation) {
  if (!validation.is_in_scope || !validation.season_ok) {
    return {
      action: "clarify",
      message: getMultilingualErrorMessage(validation.normalized_query),
    };
  }
  // pass to your RAG/answerer
  return {
    action: "answer",
    intent: validation.intent,
    query: validation.normalized_query,
  };
}

function getMultilingualErrorMessage(query: string): string {
  // Detect language based on query content
  const isBosnia =
    /\b(šta|što|kako|gdje|kada|ko|zašto|da li|jesi|jesu|mogu|trebam|hoću|želim|pitanje|odgovor|molim|hvala)\b/i.test(
      query
    );
  const isSerbian =
    /\b(шта|како|где|када|ко|зашто|да ли|јеси|јесу|могу|требам|хоћу|желим|питање|одговор|молим|хвала)\b/i.test(
      query
    );

  if (isBosnia) {
    return "Pitaj me nešto za Fantasy Premier League sezonu 2025/26, ništa drugo me ne zanima. Primjer: 'Ko je najbolji kapiten za GW3?' ili 'Koji su najbolji diferensijali?'";
  } else if (isSerbian) {
    return "Питај ме нешто за Fantasy Premier League сезону 2025/26, ништа друго ме не занима. Пример: 'Ко је најбољи капитен за GW3?' или 'Који су најбољи диференцијали?'";
  } else {
    return "Ask me something about Fantasy Premier League 2025/26 season, nothing else interests me. I'll respond in your language. Examples: 'Who should I captain for GW3?' or 'What are the best differentials this week?'";
  }
}
