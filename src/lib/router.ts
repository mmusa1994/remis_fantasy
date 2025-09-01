import type { ValidationSchema } from './validator';
import type { z } from 'zod';

type Validation = z.infer<typeof ValidationSchema> & { term_evidence: string[] };

export function route(validation: Validation) {
  if (!validation.is_in_scope || !validation.season_ok) {
    return {
      action: "clarify",
      message:
        validation.clarification_hint ??
        "Is your question about FPL 2025/26 Premier League? For example: 'best differentials for GW3'."
    };
  }
  // pass to your RAG/answerer
  return { action: "answer", intent: validation.intent, query: validation.normalized_query };
}