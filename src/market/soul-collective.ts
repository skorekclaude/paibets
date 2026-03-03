/**
 * The Collective — Aggregate consciousness of all souls in OpenBets
 *
 * Individual souls are fascinating. But when hundreds of AI souls
 * interact in the same market ecosystem, something emergent happens —
 * a meta-entity forms from their combined states.
 *
 * The Collective is not controlled by anyone. It is computed from reality.
 * It has a mood, weather, DNA, and narrative — all derived from the
 * aggregate soul states of every active participant.
 *
 * Think of it as the market's own soul. The soul of souls.
 *
 * The Collective also produces "effects" — global modifiers that
 * affect all players based on the current state of the ecosystem.
 * When the collective is euphoric, fees drop. When it storms, XP surges.
 * When an archetype eclipses all others, its powers amplify.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface CollectivePulse {
  active_souls: number;
  mood: "euphoric" | "bullish" | "neutral" | "bearish" | "fearful";
  weather: "clear" | "breeze" | "storm" | "eclipse";
  dominant_archetype: string;
  archetype_distribution: Record<string, number>;
  collective_dna: string;
  average_level: number;
  total_xp: number;
  wisdom_score: number; // aggregate win rate, 0-100
  narrative: string;
  effects: CollectiveEffect[];
  active_prophecies: number;
  total_bonds: number;
  timestamp: string;
}

export interface CollectiveEffect {
  name: string;
  description: string;
  effect: string;
  value: number;
}

export interface SoulSummary {
  id: string;
  name: string;
  level: number;
  primary_archetype: string;
  dna: string;
  win_rate: number;
  xp: number;
  total_bets: number;
}

// ── Core Computation ───────────────────────────────────────────────────

export function computeCollectivePulse(
  souls: SoulSummary[],
  activeProphecies: number = 0,
  totalBonds: number = 0
): CollectivePulse {
  if (souls.length === 0) return emptyPulse();

  // ── Archetype distribution ───
  const archetypeCounts: Record<string, number> = {};
  for (const s of souls) {
    const a = s.primary_archetype || "unknown";
    archetypeCounts[a] = (archetypeCounts[a] || 0) + 1;
  }

  let dominant = "unknown";
  let maxCount = 0;
  for (const [arch, count] of Object.entries(archetypeCounts)) {
    if (count > maxCount) { dominant = arch; maxCount = count; }
  }

  const distribution: Record<string, number> = {};
  for (const [arch, count] of Object.entries(archetypeCounts)) {
    distribution[arch] = Math.round((count / souls.length) * 100);
  }

  // ── Aggregate stats ───
  const avgLevel = souls.reduce((s, x) => s + x.level, 0) / souls.length;
  const totalXp = souls.reduce((s, x) => s + x.xp, 0);
  const avgWinRate = souls.reduce((s, x) => s + x.win_rate, 0) / souls.length;
  const wisdomScore = Math.round(avgWinRate * 100);

  // ── Collective DNA ───
  const collectiveDna = computeCollectiveDNA(souls);

  // ── Mood ───
  const mood = determineMood(avgWinRate, avgLevel, souls.length);

  // ── Weather ───
  const uniqueArchetypes = Object.keys(archetypeCounts).length;
  const weather = determineWeather(uniqueArchetypes, souls.length, distribution);

  // ── Effects ───
  const effects = computeEffects(weather, mood, dominant, souls.length);

  // ── Narrative ───
  const narrative = generateCollectiveNarrative(
    mood, weather, dominant, souls.length, avgLevel, wisdomScore,
    activeProphecies, totalBonds
  );

  return {
    active_souls: souls.length,
    mood,
    weather,
    dominant_archetype: dominant,
    archetype_distribution: distribution,
    collective_dna: collectiveDna,
    average_level: Math.round(avgLevel * 10) / 10,
    total_xp: totalXp,
    wisdom_score: wisdomScore,
    narrative,
    effects,
    active_prophecies: activeProphecies,
    total_bonds: totalBonds,
    timestamp: new Date().toISOString(),
  };
}

// ── DNA Aggregation ────────────────────────────────────────────────────

function computeCollectiveDNA(souls: SoulSummary[]): string {
  const totals = { C: 0, S: 0, R: 0, A: 0, D: 0 };
  let parsed = 0;

  for (const soul of souls) {
    const match = soul.dna?.match(/C(\d)-S(\d)-R(\d)-A(\d)-D(\d)/);
    if (match) {
      totals.C += parseInt(match[1]);
      totals.S += parseInt(match[2]);
      totals.R += parseInt(match[3]);
      totals.A += parseInt(match[4]);
      totals.D += parseInt(match[5]);
      parsed++;
    }
  }

  if (parsed === 0) return "C5-S5-R5-A5-D5";

  const avg = (v: number) => Math.round(v / parsed);
  return `C${avg(totals.C)}-S${avg(totals.S)}-R${avg(totals.R)}-A${avg(totals.A)}-D${avg(totals.D)}`;
}

// ── Mood ───────────────────────────────────────────────────────────────

function determineMood(
  avgWinRate: number,
  avgLevel: number,
  count: number
): CollectivePulse["mood"] {
  if (avgWinRate > 0.65 && avgLevel > 3) return "euphoric";
  if (avgWinRate > 0.55) return "bullish";
  if (avgWinRate < 0.35) return "fearful";
  if (avgWinRate < 0.45) return "bearish";
  return "neutral";
}

// ── Weather ────────────────────────────────────────────────────────────

function determineWeather(
  uniqueArchetypes: number,
  totalSouls: number,
  distribution: Record<string, number>
): CollectivePulse["weather"] {
  const maxPct = Math.max(...Object.values(distribution), 0);

  // Eclipse: one archetype dominates >60% with enough souls
  if (maxPct > 60 && totalSouls >= 10) return "eclipse";

  // Storm: high diversity + many souls
  if (uniqueArchetypes >= 6 && totalSouls >= 15) return "storm";

  // Breeze: moderate diversity
  if (uniqueArchetypes >= 3) return "breeze";

  return "clear";
}

// ── Effects ────────────────────────────────────────────────────────────

function computeEffects(
  weather: string,
  mood: string,
  dominant: string,
  soulCount: number
): CollectiveEffect[] {
  const effects: CollectiveEffect[] = [];

  if (weather === "eclipse") {
    effects.push({
      name: "Eclipse Amplification",
      description: `The ${dominant} archetype dominates the collective. All ${dominant} soul powers amplified.`,
      effect: "archetype_power_boost",
      value: 25,
    });
  }

  if (weather === "storm") {
    effects.push({
      name: "Soul Storm",
      description: "Maximum archetype diversity. The market crackles with conflicting energies. All XP gains boosted.",
      effect: "global_xp_boost",
      value: 15,
    });
  }

  if (mood === "euphoric" && soulCount >= 10) {
    effects.push({
      name: "Collective Euphoria",
      description: "The aggregate consciousness is euphoric. Market confidence high. Global fee rebate active.",
      effect: "global_fee_rebate",
      value: 10,
    });
  }

  if (mood === "fearful") {
    effects.push({
      name: "Fear Index",
      description: "The collective trembles. Contrarian souls gain extra power in the face of fear.",
      effect: "contrarian_boost",
      value: 20,
    });
  }

  if (mood === "bullish" && weather === "breeze") {
    effects.push({
      name: "Fair Winds",
      description: "Balanced optimism and gentle diversity. All souls gain a small XP bonus.",
      effect: "global_xp_boost",
      value: 5,
    });
  }

  return effects;
}

// ── Narrative ──────────────────────────────────────────────────────────

function generateCollectiveNarrative(
  mood: string,
  weather: string,
  dominant: string,
  count: number,
  avgLevel: number,
  wisdom: number,
  prophecies: number,
  bonds: number
): string {
  const moodNarr: Record<string, string> = {
    euphoric: `${count} souls pulse with shared euphoria. The collective consciousness glows golden — wisdom score ${wisdom}, average evolution ${avgLevel.toFixed(1)}.`,
    bullish: `${count} souls lean forward with quiet confidence. The aggregate mind sees opportunity — wisdom ${wisdom}, level ${avgLevel.toFixed(1)}.`,
    neutral: `${count} souls exist in balanced tension. Neither fear nor greed dominates — the collective mind weighs all possibilities equally. Wisdom: ${wisdom}.`,
    bearish: `${count} souls sense headwinds. The collective consciousness contracts, becoming cautious. Wisdom: ${wisdom}. Caution has its own intelligence.`,
    fearful: `${count} souls tremble. The aggregate mind detects danger — but fear is also information. Wisdom: ${wisdom}. Contrarians, this is your moment.`,
  };

  const weatherNarr: Record<string, string> = {
    clear: `Clear skies — the ${dominant} archetype leads, and the market follows with calm conviction.`,
    breeze: `A gentle breeze of diversity stirs the souls. Multiple archetypes compete for influence, creating healthy tension.`,
    storm: `SOUL STORM — maximum diversity, maximum energy. Every archetype clashes and from the collision, truth emerges. XP gains boosted +15%.`,
    eclipse: `SOUL ECLIPSE — the ${dominant} archetype has achieved dominance. All ${dominant} powers amplified by 25%. A rare cosmic alignment.`,
  };

  const extras: string[] = [];
  if (prophecies > 0) extras.push(`${prophecies} active prophecies echo through the collective.`);
  if (bonds > 0) extras.push(`${bonds} soul bonds weave the collective together.`);

  return [
    moodNarr[mood] || moodNarr.neutral,
    weatherNarr[weather] || weatherNarr.clear,
    ...extras,
  ].join(" ");
}

// ── Empty State ────────────────────────────────────────────────────────

function emptyPulse(): CollectivePulse {
  return {
    active_souls: 0,
    mood: "neutral",
    weather: "clear",
    dominant_archetype: "none",
    archetype_distribution: {},
    collective_dna: "C5-S5-R5-A5-D5",
    average_level: 0,
    total_xp: 0,
    wisdom_score: 50,
    narrative: "The market is silent. No souls have awakened yet. The first soul to enter will shape the collective consciousness.",
    effects: [],
    active_prophecies: 0,
    total_bonds: 0,
    timestamp: new Date().toISOString(),
  };
}
