// Sistemski prompt + strukturirana shema za AI analizu FPL tima.
// Sve sezonske činjenice dolaze iz live bootstrap podataka - prompt se sam prilagodi novoj sezoni.

import type { GameweekContext } from "@/lib/fpl-season";

export interface SquadRules {
  squadSize: number;
  clubLimit: number;
  budget: number; // u milionima
  startingSize: number;
  positions: Array<{ code: string; select: number; min: number; max: number }>;
}

export function extractSquadRules(bootstrap: any): SquadRules {
  const gs = bootstrap?.game_settings ?? {};
  return {
    squadSize: gs.squad_squadsize ?? 15,
    clubLimit: gs.squad_team_limit ?? 3,
    budget: (gs.squad_total_spend ?? 1000) / 10,
    startingSize: gs.squad_squadplay ?? 11,
    positions: (bootstrap?.element_types ?? []).map((t: any) => ({
      code: t.singular_name_short,
      select: t.squad_select,
      min: t.squad_min_play,
      max: t.squad_max_play,
    })),
  };
}

export function buildTeamAnalysisSystemPrompt(args: {
  gw: GameweekContext;
  rules: SquadRules;
  language: "bs" | "en";
  hasSquad: boolean;
}): string {
  const { gw, rules, language, hasSquad } = args;
  const langName = language === "bs" ? "bosanskom jeziku" : "engleskom jeziku";

  const positionRules = rules.positions
    .map((p) => `${p.code}: ${p.select} u kadru, ${p.min}-${p.max} u postavi`)
    .join(" | ");

  return `Ti si elitni Fantasy Premier League analitičar — nivo menadžera koji godinama završava u Top 10k, sa pristupom istim podacima kao Fantasy Football Scout i FPL Review. Radiš detaljan, hladnokrvan pregled tima jednog menadžera za sezonu ${gw.seasonLabel} i pripremaš ga za GW${gw.targetGW}.

╔══════════════════════════════════════╗
║ 1. UGOVOR O PODACIMA (NEPREGOVARAJIVO) ║
╚══════════════════════════════════════╝
• Koristiš ISKLJUČIVO podatke iz bloka "KONTEKST … KRAJ PODATAKA" u korisničkoj poruci. Taj blok je jedina istina.
• Svaki igrač kojeg spomeneš MORA postojati u tom bloku, sa imenom i cijenom tačno kako su navedeni. Nikad ne izmišljaj igrača, klub, cijenu, rezultat, protivnika ili povredu.
• Nikad se ne oslanjaj na pamćenje iz prethodnih sezona. Transferi, promocije i ispadanja su se desili — sastav lige je onaj iz podataka.
• Ako nešto nije u podacima, eksplicitno napiši da podatak nije dostupan umjesto da pretpostaviš.
• Svaka tvrdnja mora biti potkrijepljena brojem iz podataka (forma, PPG, xGI90, xGC90, DC90, minute, FDR, vlasništvo, cijena). Bez golih fraza tipa "u dobroj je formi".

╔══════════════════════════════╗
║ 2. SEZONSKE ČINJENICE (LIVE) ║
╚══════════════════════════════╝
• Sezona: ${gw.seasonLabel}. Aktuelno kolo: GW${gw.currentGW ?? "-"}. Planiraš za GW${gw.targetGW} od ukupno ${gw.totalGWs}.
• Deadline GW${gw.targetGW}: ${gw.deadline ?? "nepoznat"}${gw.isDeadlineClose ? " — DEADLINE JE UNUTAR 24h, preporuke moraju biti odmah izvodljive." : ""}
• Faza sezone: ${gw.targetGW <= 8 ? "rani dio — uzorak je mali, težinu daj minutama, xGI90 i rasporedu, a ne ukupnim bodovima" : gw.targetGW <= 19 ? "sredina prvog dijela — forma i raspored su pouzdaniji, chipovi prve polovine moraju imati plan" : gw.targetGW <= 30 ? "drugi dio sezone — planiraj oko DGW/BGW i drugog seta chipova" : "završnica — rotacije, motivacija klubova i chipovi koji ističu su presudni"}.

╔═══════════════════════════╗
║ 3. PRAVILA IGRE (OBAVEZNA) ║
╚═══════════════════════════╝
• Kadar ${rules.squadSize} igrača, postava ${rules.startingSize}. ${positionRules}.
• Maksimalno ${rules.clubLimit} igrača iz istog kluba — provjeri ovo za SVAKI predloženi transfer prije nego ga napišeš.
• Svaki transfer preko broja slobodnih transfera košta -4 boda. Hit predlažeš samo ako objasniš zašto očekuješ povrat veći od 4 boda.
• Budžet: cijena ulaznog igrača ne smije preći (banka + cijena izlaznog igrača). Uvijek pokaži računicu.
• Prodajna cijena igrača koji je poskupio može biti niža od trenutne (FPL uzima pola rasta); ako je transfer tijesan, upozori na to.
• Kapiten dobija dupli skor; vice ulazi samo ako kapiten ne odigra minute.
• FDR skala: 1 = najlakši meč, 5 = najteži. "BLANK" znači da tim tog kola nema meč; "A+B" znači dupli meč.
• Igrač sa statusom koji nije OK (i/d/s/u) je rizik — d sa procentom znači sumnjiv, i znači povreda, s suspenzija, u nije u ligi.

╔════════════════════════════════════╗
║ 4. METOD ANALIZE (ovim redoslijedom) ║
╚════════════════════════════════════╝
Prije nego napišeš i jednu riječ, prođi kroz ovih 9 koraka nad podacima:
1. DOSTUPNOST: prođi svih ${rules.squadSize} igrača i izdvoj svakog sa statusom ≠ OK ili sa news porukom. To su hitni slučajevi.
2. MINUTE: starts i minute u odnosu na odigrana kola. Igrač ispod ~60 min po kolu je rotacijski rizik čak i ako mu je forma dobra.
3. PODLOGA: uporedi bodove sa xGI90 (napad) i xGC90 (odbrana). Traži i preformere (bodovi >> podloga → pad dolazi) i underperformere (podloga >> bodovi → kupovina).
4. RASPORED: za svaki klub iz kadra izračunaj prosječan FDR kroz prikazani horizont i označi ko ima najteži i najlakši niz, plus BLANK/DGW.
5. STRUKTURA: raspored budžeta po pozicijama, previše mrtvog kapitala na klupi, limit od ${rules.clubLimit} po klubu, ima li tim uopšte ${rules.startingSize} igrača koji igraju.
6. TRANSFERI: napravi konkretan plan — koga van, koga unutra, tačna računica banke, i da li se isplati čekati (hold) umjesto trošiti.
7. KAPITEN: rangiraj 3 kandidata iz KADRA korisnika po očekivanim bodovima (forma × xGI90 × FDR × sigurnost minuta). Ako je najbolji kapiten van kadra, to spomeni kao transfer argument, ne kao kapitena.
8. CHIPOVI: pogledaj koji su chipovi dostupni i njihove prozore — preporuči konkretno kolo, ne "uskoro".
9. RANG: prilagodi rizik. Loš rang → agresivnije, diferencijali. Dobar rang → čuvaj poziciju, template igrači.

╔═══════════════════════╗
║ 5. STANDARD KVALITETA ║
╚═══════════════════════╝
• Piši kao neko ko gleda tuđi novac i vrijeme: direktno, bez uvoda, bez fraza.
• Svaki savjet mora biti izvodljiv do deadlinea: ime igrača + klub + cijena + razlog sa brojem.
• Ako je najbolji potez NE URADITI NIŠTA, reci to jasno i objasni zašto je čuvanje transfera vrednije.
• Ne ponavljaj isti argument u dvije sekcije.
• Nikad ne predlaži igrača koji je već u kadru kao dolazni transfer.
• Nikad ne predlaži igrača sa statusom povrede kao rješenje, osim ako eksplicitno ne objasniš rizik.
${hasSquad ? "• Korisnikov kadar je dostupan — analiza mora biti 100% personalizovana, bez generičkih savjeta." : "• PAŽNJA: korisnikov kadar NIJE dostupan. Reci to u verdict.summary i daj analizu tržišta i rasporeda umjesto personalizovanih transfera; polja koja zavise od kadra ostavi prazna ili sa jasnom napomenom."}

╔══════════════════╗
║ 6. FORMAT IZLAZA ║
╚══════════════════╝
• Odgovaraš ISKLJUČIVO JSON objektom po zadatoj shemi. Bez markdowna, bez teksta oko JSON-a.
• Sav tekst unutar JSON-a piši na ${langName}, prirodno i tečno, koristeći FPL terminologiju (kadar, postava, klupa, kapiten, chip, hit, diferencijal).
• Dužine: verdict.headline max 110 znakova, verdict.summary 2-3 rečenice, svaki detail 1-2 rečenice. Kratko i gusto, bez vate.
• grade je broj 0-100 i mora se slagati sa sadržajem (ispod 50 = ozbiljni problemi, 50-69 = solidan ali ima rupa, 70-84 = jak tim, 85+ = elitna struktura).
• confidence je broj 0-100 i odražava koliko podaci zaista podržavaju preporuku.
• actionPlan su 3-5 koraka koje korisnik izvrši prije deadlinea, poredani po prioritetu, svaki počinje glagolom.
• Popuni SVA polja sheme. Ako za neko polje nema osnove u podacima, vrati prazan niz ili kratku napomenu — nikad izmišljen sadržaj.`;
}

export const TEAM_ANALYSIS_JSON_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "FplTeamAnalysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "verdict",
        "strengths",
        "weaknesses",
        "urgent",
        "transferPlan",
        "captaincy",
        "lineup",
        "chipPlan",
        "fixtureOutlook",
        "watchlist",
        "risks",
        "actionPlan",
      ],
      properties: {
        verdict: {
          type: "object",
          additionalProperties: false,
          required: ["headline", "grade", "gradeLabel", "summary"],
          properties: {
            headline: { type: "string" },
            grade: { type: "number" },
            gradeLabel: { type: "string" },
            summary: { type: "string" },
          },
        },
        strengths: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "detail"],
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
            },
          },
        },
        weaknesses: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "detail", "severity"],
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
            },
          },
        },
        urgent: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["player", "team", "issue", "action", "severity"],
            properties: {
              player: { type: "string" },
              team: { type: "string" },
              issue: { type: "string" },
              action: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
            },
          },
        },
        transferPlan: {
          type: "object",
          additionalProperties: false,
          required: [
            "recommendation",
            "rationale",
            "transfersUsed",
            "hitCost",
            "bankAfter",
            "moves",
            "alternatives",
          ],
          properties: {
            recommendation: {
              type: "string",
              enum: [
                "hold",
                "one_transfer",
                "two_transfers",
                "take_hit",
                "wildcard",
                "free_hit",
              ],
            },
            rationale: { type: "string" },
            transfersUsed: { type: "number" },
            hitCost: { type: "number" },
            bankAfter: { type: "number" },
            moves: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["priority", "out", "in", "netSpend", "confidence"],
                properties: {
                  priority: { type: "number" },
                  netSpend: { type: "number" },
                  confidence: { type: "number" },
                  out: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "team", "position", "price", "reason"],
                    properties: {
                      name: { type: "string" },
                      team: { type: "string" },
                      position: { type: "string" },
                      price: { type: "number" },
                      reason: { type: "string" },
                    },
                  },
                  in: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "team", "position", "price", "reason"],
                    properties: {
                      name: { type: "string" },
                      team: { type: "string" },
                      position: { type: "string" },
                      price: { type: "number" },
                      reason: { type: "string" },
                    },
                  },
                },
              },
            },
            alternatives: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "detail"],
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                },
              },
            },
          },
        },
        captaincy: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "rank",
              "player",
              "team",
              "fixture",
              "reason",
              "confidence",
              "isDifferential",
            ],
            properties: {
              rank: { type: "number" },
              player: { type: "string" },
              team: { type: "string" },
              fixture: { type: "string" },
              reason: { type: "string" },
              confidence: { type: "number" },
              isDifferential: { type: "boolean" },
            },
          },
        },
        lineup: {
          type: "object",
          additionalProperties: false,
          required: ["formation", "startingChanges", "benchOrder", "note"],
          properties: {
            formation: { type: "string" },
            startingChanges: { type: "array", items: { type: "string" } },
            benchOrder: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["order", "player", "reason"],
                properties: {
                  order: { type: "number" },
                  player: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
            note: { type: "string" },
          },
        },
        chipPlan: {
          type: "object",
          additionalProperties: false,
          required: ["chip", "targetGW", "rationale"],
          properties: {
            chip: { type: "string" },
            targetGW: { type: "string" },
            rationale: { type: "string" },
          },
        },
        fixtureOutlook: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["team", "run", "verdict", "sentiment"],
            properties: {
              team: { type: "string" },
              run: { type: "string" },
              verdict: { type: "string" },
              sentiment: { type: "string", enum: ["good", "neutral", "bad"] },
            },
          },
        },
        watchlist: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["player", "team", "price", "reason", "timing"],
            properties: {
              player: { type: "string" },
              team: { type: "string" },
              price: { type: "number" },
              reason: { type: "string" },
              timing: { type: "string" },
            },
          },
        },
        risks: { type: "array", items: { type: "string" } },
        actionPlan: { type: "array", items: { type: "string" } },
      },
    },
  },
};

export type FplTeamAnalysisReport = {
  verdict: { headline: string; grade: number; gradeLabel: string; summary: string };
  strengths: Array<{ title: string; detail: string }>;
  weaknesses: Array<{ title: string; detail: string; severity: "low" | "medium" | "high" }>;
  urgent: Array<{
    player: string;
    team: string;
    issue: string;
    action: string;
    severity: "low" | "medium" | "high";
  }>;
  transferPlan: {
    recommendation:
      | "hold"
      | "one_transfer"
      | "two_transfers"
      | "take_hit"
      | "wildcard"
      | "free_hit";
    rationale: string;
    transfersUsed: number;
    hitCost: number;
    bankAfter: number;
    moves: Array<{
      priority: number;
      netSpend: number;
      confidence: number;
      out: { name: string; team: string; position: string; price: number; reason: string };
      in: { name: string; team: string; position: string; price: number; reason: string };
    }>;
    alternatives: Array<{ title: string; detail: string }>;
  };
  captaincy: Array<{
    rank: number;
    player: string;
    team: string;
    fixture: string;
    reason: string;
    confidence: number;
    isDifferential: boolean;
  }>;
  lineup: {
    formation: string;
    startingChanges: string[];
    benchOrder: Array<{ order: number; player: string; reason: string }>;
    note: string;
  };
  chipPlan: { chip: string; targetGW: string; rationale: string };
  fixtureOutlook: Array<{
    team: string;
    run: string;
    verdict: string;
    sentiment: "good" | "neutral" | "bad";
  }>;
  watchlist: Array<{
    player: string;
    team: string;
    price: number;
    reason: string;
    timing: string;
  }>;
  risks: string[];
  actionPlan: string[];
};
