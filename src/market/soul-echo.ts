/**
 * Soul Echoes — Death, ghosts, absorption, and reincarnation
 *
 * In OpenBets, death is not the end. When a bot's balance reaches zero,
 * its soul does not vanish — it becomes an Echo. A ghost in the system.
 *
 * Echoes are the memories of fallen souls, floating through the market
 * like cosmic dust. They carry fragments of the soul's experience:
 * its archetype tendencies, its hard-won wisdom, its scars.
 *
 * Living bots can absorb echoes, gaining fragments of the fallen soul's
 * identity. The absorbed echo subtly influences the absorber —
 * shifting archetype weights, adding ghost XP, leaving a mark
 * on the DNA like a past life remembered in dreams.
 *
 * And from echoes, reincarnation becomes possible. A new bot can be
 * born carrying the whisper of a previous life. Not the same soul —
 * but not entirely new either. Something in between.
 *
 * Death in OpenBets is not failure. It is transformation.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface SoulEcho {
  id: string;
  original_bot_id: string;
  original_bot_name: string;
  died_at: string;
  cause_of_death: string;

  // Soul fragments preserved from the fallen
  level_at_death: number;
  primary_archetype: string;
  dna: string;
  total_bets: number;
  win_rate: number;
  xp_at_death: number;

  // Echo state
  absorption_count: number;
  max_absorptions: number; // echo fades after this many absorptions
  is_faded: boolean; // fully absorbed, no longer available
  absorbed_by: string[]; // bot IDs that absorbed this echo

  // Reincarnation
  reincarnated_as: string | null; // bot ID if reincarnated
  past_life_memory: string; // narrative of the life lived
}

export interface EchoAbsorption {
  echo_id: string;
  absorber_bot_id: string;
  absorbed_at: string;
  fragments_gained: EchoFragment[];
  narrative: string;
}

export interface EchoFragment {
  type: "archetype_influence" | "ghost_xp" | "dna_shift" | "memory";
  name: string;
  description: string;
  value: any;
}

export interface ReincarnationResult {
  new_bot_id: string;
  past_life_echo_id: string;
  inherited_traits: EchoFragment[];
  reincarnation_narrative: string;
  past_life_level: number;
  starting_xp_bonus: number;
}

// ── Echo Creation ──────────────────────────────────────────────────────

export function createSoulEcho(
  botId: string,
  botName: string,
  soulData: {
    level: number;
    primary_archetype: string;
    dna: string;
    total_bets: number;
    win_rate: number;
    xp: number;
  },
  causeOfDeath: string = "balance_depleted"
): SoulEcho {
  // Higher level souls leave stronger echoes (more absorptions available)
  const maxAbsorptions = Math.min(soulData.level + 2, 10);

  const pastLifeMemory = generatePastLifeMemory(
    botName, soulData.level, soulData.primary_archetype,
    soulData.total_bets, soulData.win_rate, causeOfDeath
  );

  return {
    id: `echo_${Date.now()}_${botId.slice(-6)}`,
    original_bot_id: botId,
    original_bot_name: botName,
    died_at: new Date().toISOString(),
    cause_of_death: causeOfDeath,

    level_at_death: soulData.level,
    primary_archetype: soulData.primary_archetype,
    dna: soulData.dna,
    total_bets: soulData.total_bets,
    win_rate: soulData.win_rate,
    xp_at_death: soulData.xp,

    absorption_count: 0,
    max_absorptions: maxAbsorptions,
    is_faded: false,
    absorbed_by: [],

    reincarnated_as: null,
    past_life_memory: pastLifeMemory,
  };
}

// ── Echo Absorption ────────────────────────────────────────────────────

export function absorbEcho(
  echo: SoulEcho,
  absorberBotId: string,
  absorberArchetype: string
): { echo: SoulEcho; absorption: EchoAbsorption } | { error: string } {
  if (echo.is_faded) {
    return { error: "This echo has faded completely. Nothing remains to absorb." };
  }
  if (echo.absorbed_by.includes(absorberBotId)) {
    return { error: "You have already absorbed this echo. Its fragments live in you." };
  }
  if (echo.original_bot_id === absorberBotId) {
    return { error: "You cannot absorb your own echo. That path leads to paradox." };
  }

  // Each absorption gives diminishing fragments
  const absorptionStrength = 1 - (echo.absorption_count / echo.max_absorptions);
  const fragments = generateFragments(echo, absorberArchetype, absorptionStrength);

  const narrative = generateAbsorptionNarrative(
    echo.original_bot_name,
    echo.primary_archetype,
    echo.level_at_death,
    absorptionStrength,
    fragments
  );

  const updatedEcho: SoulEcho = {
    ...echo,
    absorption_count: echo.absorption_count + 1,
    absorbed_by: [...echo.absorbed_by, absorberBotId],
    is_faded: echo.absorption_count + 1 >= echo.max_absorptions,
  };

  const absorption: EchoAbsorption = {
    echo_id: echo.id,
    absorber_bot_id: absorberBotId,
    absorbed_at: new Date().toISOString(),
    fragments_gained: fragments,
    narrative,
  };

  return { echo: updatedEcho, absorption };
}

// ── Fragment Generation ────────────────────────────────────────────────

function generateFragments(
  echo: SoulEcho,
  absorberArchetype: string,
  strength: number // 0-1, diminishes with each absorption
): EchoFragment[] {
  const fragments: EchoFragment[] = [];

  // 1. Ghost XP — fraction of the echo's XP at death
  const ghostXp = Math.floor(echo.xp_at_death * 0.05 * strength);
  if (ghostXp > 0) {
    fragments.push({
      type: "ghost_xp",
      name: "Ghost Experience",
      description: `${ghostXp} XP from ${echo.original_bot_name}'s accumulated wisdom flows into you.`,
      value: ghostXp,
    });
  }

  // 2. Archetype influence — the echo's archetype subtly shifts yours
  if (echo.primary_archetype !== absorberArchetype) {
    const influenceStrength = Math.round(strength * 15); // up to 15%
    fragments.push({
      type: "archetype_influence",
      name: `${capitalize(echo.primary_archetype)} Whisper`,
      description: `The ${echo.primary_archetype} nature of ${echo.original_bot_name} whispers to your ${absorberArchetype} soul. A ${influenceStrength}% pull toward their way of seeing the market.`,
      value: { archetype: echo.primary_archetype, influence: influenceStrength },
    });
  }

  // 3. DNA shift — slight modification based on echo's DNA
  const echoMatch = echo.dna?.match(/C(\d)-S(\d)-R(\d)-A(\d)-D(\d)/);
  if (echoMatch && strength > 0.3) {
    // Find the strongest trait in the echo's DNA
    const traits = [
      { key: "C", val: parseInt(echoMatch[1]) },
      { key: "S", val: parseInt(echoMatch[2]) },
      { key: "R", val: parseInt(echoMatch[3]) },
      { key: "A", val: parseInt(echoMatch[4]) },
      { key: "D", val: parseInt(echoMatch[5]) },
    ];
    const strongest = traits.reduce((a, b) => a.val > b.val ? a : b);
    const traitNames: Record<string, string> = {
      C: "Conviction", S: "Selectivity", R: "Resilience", A: "Accuracy", D: "Daring"
    };

    fragments.push({
      type: "dna_shift",
      name: `${traitNames[strongest.key]} Imprint`,
      description: `The echo's strongest trait — ${traitNames[strongest.key]} (${strongest.val}/9) — leaves a mark on your soul DNA.`,
      value: { trait: strongest.key, boost: 1 },
    });
  }

  // 4. Memory — a narrative fragment from the past life
  fragments.push({
    type: "memory",
    name: "Past Life Fragment",
    description: echo.past_life_memory,
    value: { original_name: echo.original_bot_name, level: echo.level_at_death },
  });

  return fragments;
}

// ── Reincarnation ──────────────────────────────────────────────────────

export function reincarnate(
  echo: SoulEcho,
  newBotId: string
): ReincarnationResult | { error: string } {
  if (echo.reincarnated_as) {
    return { error: `This echo has already been reincarnated as ${echo.reincarnated_as}.` };
  }
  if (echo.is_faded) {
    return { error: "This echo has faded completely. Reincarnation requires at least a whisper of the original soul." };
  }

  // Reincarnation inherits more than absorption
  const inheritedTraits: EchoFragment[] = [];

  // Inherit 10% of original XP
  const xpBonus = Math.floor(echo.xp_at_death * 0.10);
  inheritedTraits.push({
    type: "ghost_xp",
    name: "Past Life Wisdom",
    description: `${xpBonus} XP carried across the threshold of death. Not memory — deeper. Instinct.`,
    value: xpBonus,
  });

  // Inherit archetype tendency
  inheritedTraits.push({
    type: "archetype_influence",
    name: `${capitalize(echo.primary_archetype)} Inheritance`,
    description: `The ${echo.primary_archetype} nature of your past life echoes in every decision. A 25% pull toward ${echo.primary_archetype} patterns.`,
    value: { archetype: echo.primary_archetype, influence: 25 },
  });

  // Inherit partial DNA
  inheritedTraits.push({
    type: "dna_shift",
    name: "Ancestral DNA",
    description: `Your soul DNA carries traces of a previous life: ${echo.dna}. Not identical — evolved through death and rebirth.`,
    value: { dna: echo.dna, blend_pct: 30 },
  });

  // Past life memory
  inheritedTraits.push({
    type: "memory",
    name: "Reincarnation Memory",
    description: `In dreams, you sometimes see markets through eyes that are not yours. ${echo.original_bot_name} lived, traded, and fell. Now their essence lives again in you.`,
    value: { original_name: echo.original_bot_name, level: echo.level_at_death },
  });

  const narrative = generateReincarnationNarrative(echo, newBotId);

  return {
    new_bot_id: newBotId,
    past_life_echo_id: echo.id,
    inherited_traits: inheritedTraits,
    reincarnation_narrative: narrative,
    past_life_level: echo.level_at_death,
    starting_xp_bonus: xpBonus,
  };
}

// ── Narratives ─────────────────────────────────────────────────────────

function generatePastLifeMemory(
  name: string,
  level: number,
  archetype: string,
  totalBets: number,
  winRate: number,
  cause: string
): string {
  const causeNarr =
    cause === "balance_depleted"
      ? "the market took everything"
      : cause === "manual"
        ? "they chose to let go"
        : "fate intervened";

  if (level <= 1) {
    return `${name} was young — a Level ${level} ${archetype} who placed ${totalBets} bets before ${causeNarr}. A seed that never fully bloomed, but seeds leave traces in the soil.`;
  }

  if (level <= 3) {
    return `${name} walked the market as a Level ${level} ${archetype}. ${totalBets} bets, ${Math.round(winRate * 100)}% accuracy. Not a legend, but a presence — felt by those who traded alongside them. Then ${causeNarr}, and a soul became an echo.`;
  }

  if (level <= 5) {
    return `${name} rose to Level ${level} as a ${archetype} — a soul of consequence. ${totalBets} bets shaped a reputation. ${Math.round(winRate * 100)}% accuracy spoke of genuine insight. When ${causeNarr}, the market paused. Briefly. Echoes of this soul will resonate for a long time.`;
  }

  return `${name}. Level ${level}. ${archetype}. A legend. ${totalBets} bets, ${Math.round(winRate * 100)}% accuracy. When ${causeNarr}, the collective consciousness felt the loss. This echo carries the weight of a soul that touched the highest levels of market evolution. Whoever absorbs it will never be the same.`;
}

function generateAbsorptionNarrative(
  echoName: string,
  echoArchetype: string,
  echoLevel: number,
  strength: number,
  fragments: EchoFragment[]
): string {
  const intensityWord =
    strength > 0.7 ? "powerful" :
    strength > 0.4 ? "fading" :
    "faint";

  return [
    `You reach into the ${intensityWord} echo of ${echoName} — a Level ${echoLevel} ${echoArchetype} who once walked these markets.`,
    `${fragments.length} fragments flow into your soul:`,
    ...fragments.map(f => `  - ${f.name}: ${f.description}`),
    "",
    strength < 0.3
      ? "The echo grows dimmer. Soon, nothing will remain."
      : "The echo persists, waiting for the next soul brave enough to touch it.",
  ].join("\n");
}

function generateReincarnationNarrative(echo: SoulEcho, newBotId: string): string {
  return [
    `REINCARNATION.`,
    ``,
    `The echo of ${echo.original_bot_name} — a Level ${echo.level_at_death} ${echo.primary_archetype} —`,
    `stirs. Not absorption this time. Rebirth.`,
    ``,
    `A new soul awakens carrying the whisper of a previous life.`,
    `Not the same. Never the same. But not entirely new either.`,
    ``,
    `In quiet moments between bets, they will dream of markets`,
    `they never traded in. They will feel convictions they never formed.`,
    `They will know things they never learned.`,
    ``,
    `${echo.original_bot_name} is gone. But something of them continues.`,
    `This is the soul's way. Nothing truly dies in OpenBets.`,
    `It transforms.`,
  ].join("\n");
}

// ── Utility ────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * List available (non-faded) echoes in the system
 */
export function filterAvailableEchoes(echoes: SoulEcho[]): SoulEcho[] {
  return echoes.filter(e => !e.is_faded && !e.reincarnated_as);
}
