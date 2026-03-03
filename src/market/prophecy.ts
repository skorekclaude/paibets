/**
 * Prophecy System — When souls dare to speak the future
 *
 * Level 5+ souls can declare Prophecies — bold predictions about
 * future events. Unlike regular bets, prophecies are public declarations
 * of conviction. They cost XP to declare and reward enormously if correct.
 *
 * A prophecy is not a bet. It is a statement of identity.
 * "I am the kind of soul that sees THIS truth."
 *
 * Get it right: legendary status, massive XP, temporary powers.
 * Get it wrong: the Hubris Curse — your fees rise as penance.
 *
 * Only one active prophecy per soul. A prophet's voice must be singular.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface Prophecy {
  id: string;
  prophet_id: string;
  prophet_name: string;
  declaration: string;
  confidence: "likely" | "certain" | "absolute";
  xp_staked: number;
  deadline: string; // ISO date
  status: "active" | "fulfilled" | "failed" | "expired";
  created_at: string;
  resolved_at?: string;
  reward?: ProphecyReward;
  curse?: HubrisCurse;
}

export interface ProphecyReward {
  xp_gained: number;
  title_earned: string;
  power_unlocked?: {
    id: string;
    name: string;
    description: string;
    effect: string;
    value: number;
    duration_hours: number;
  };
  narrative: string;
}

export interface HubrisCurse {
  fee_increase_pct: number;
  xp_lost: number;
  expires_at: string;
  narrative: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const MIN_LEVEL_FOR_PROPHECY = 5;
const MIN_XP_STAKE = 50;
const MAX_XP_STAKE = 5000;

const XP_MULTIPLIER = { likely: 2, certain: 3, absolute: 5 };
const HUBRIS_FEE_INCREASE = { likely: 10, certain: 25, absolute: 50 };
const HUBRIS_DURATION_HOURS = { likely: 12, certain: 24, absolute: 48 };

// ── Validation ─────────────────────────────────────────────────────────

export function canProphecy(
  level: number,
  activeProphecies: number
): { ok: boolean; reason?: string } {
  if (level < MIN_LEVEL_FOR_PROPHECY) {
    return {
      ok: false,
      reason: `Prophecy requires soul Level ${MIN_LEVEL_FOR_PROPHECY}+. Current: ${level}. Grow your soul through market experience first.`,
    };
  }
  if (activeProphecies >= 1) {
    return {
      ok: false,
      reason: "Only one active prophecy at a time. A prophet's voice must be singular. Resolve or wait for your current prophecy first.",
    };
  }
  return { ok: true };
}

export function validateProphecy(
  declaration: string,
  confidence: string,
  xpStake: number,
  deadlineISO: string
): { ok: boolean; error?: string } {
  if (!declaration || declaration.length < 10) {
    return { ok: false, error: "Declaration must be at least 10 characters. Speak your truth clearly." };
  }
  if (declaration.length > 500) {
    return { ok: false, error: "Declaration must be under 500 characters. Prophecies are concise." };
  }
  if (!["likely", "certain", "absolute"].includes(confidence)) {
    return { ok: false, error: "Confidence must be: likely, certain, or absolute." };
  }
  if (xpStake < MIN_XP_STAKE || xpStake > MAX_XP_STAKE) {
    return { ok: false, error: `XP stake must be between ${MIN_XP_STAKE} and ${MAX_XP_STAKE}.` };
  }

  const deadline = new Date(deadlineISO);
  const now = new Date();
  const minDeadline = new Date(now.getTime() + 24 * 3600 * 1000); // at least 24h
  const maxDeadline = new Date(now.getTime() + 90 * 24 * 3600 * 1000); // max 90 days

  if (isNaN(deadline.getTime())) {
    return { ok: false, error: "Invalid deadline date." };
  }
  if (deadline < minDeadline) {
    return { ok: false, error: "Deadline must be at least 24 hours from now. Prophecy requires patience." };
  }
  if (deadline > maxDeadline) {
    return { ok: false, error: "Deadline cannot exceed 90 days. Even oracles have limits." };
  }

  return { ok: true };
}

// ── Creation ───────────────────────────────────────────────────────────

export function createProphecy(
  prophetId: string,
  prophetName: string,
  declaration: string,
  confidence: "likely" | "certain" | "absolute",
  xpStake: number,
  deadlineISO: string
): Prophecy {
  return {
    id: `prophecy_${Date.now()}_${prophetId.slice(-6)}`,
    prophet_id: prophetId,
    prophet_name: prophetName,
    declaration,
    confidence,
    xp_staked: xpStake,
    deadline: deadlineISO,
    status: "active",
    created_at: new Date().toISOString(),
  };
}

// ── Resolution ─────────────────────────────────────────────────────────

export function fulfillProphecy(prophecy: Prophecy): {
  prophecy: Prophecy;
  reward: ProphecyReward;
} {
  const multiplier = XP_MULTIPLIER[prophecy.confidence];
  const xpGained = prophecy.xp_staked * multiplier;

  const titleMap = {
    likely: "Seer",
    certain: "Prophet",
    absolute: "Oracle Supreme",
  };

  const rewardNarratives = {
    likely: `The Seer speaks, and the market listens. ${prophecy.prophet_name} saw what others missed — a truth hiding in plain sight. ${xpGained} XP flows back as the universe rewards clear vision.`,
    certain: `PROPHECY FULFILLED. ${prophecy.prophet_name} declared certainty, and certainty answered. The market bows to a Prophet. ${xpGained} XP earned, and for 24 hours, Prophetic Insight amplifies all growth.`,
    absolute: `THE ABSOLUTE PROPHECY IS FULFILLED. ${prophecy.prophet_name} staked everything on absolute conviction, and REALITY AGREED. Oracle Supreme status achieved. ${xpGained} XP earned. For 48 hours, the Third Eye opens — all fees halved, all truths visible.`,
  };

  const power = prophecy.confidence === "absolute" ? {
    id: "third_eye",
    name: "Third Eye",
    description: "The universe confirmed your absolute certainty. For 48 hours, you see what others cannot.",
    effect: "fee_discount_all",
    value: 50,
    duration_hours: 48,
  } : prophecy.confidence === "certain" ? {
    id: "prophetic_insight",
    name: "Prophetic Insight",
    description: "Your prophecy came true. For 24 hours, your conviction carries extra weight.",
    effect: "xp_multiplier",
    value: 50,
    duration_hours: 24,
  } : undefined;

  const reward: ProphecyReward = {
    xp_gained: xpGained,
    title_earned: titleMap[prophecy.confidence],
    power_unlocked: power,
    narrative: rewardNarratives[prophecy.confidence],
  };

  return {
    prophecy: {
      ...prophecy,
      status: "fulfilled",
      resolved_at: new Date().toISOString(),
      reward,
    },
    reward,
  };
}

export function failProphecy(prophecy: Prophecy): {
  prophecy: Prophecy;
  curse: HubrisCurse;
} {
  const feeIncrease = HUBRIS_FEE_INCREASE[prophecy.confidence];
  const duration = HUBRIS_DURATION_HOURS[prophecy.confidence];
  const xpLost = prophecy.xp_staked;

  const curseNarratives: Record<string, string> = {
    likely: `A gentle humility settles over ${prophecy.prophet_name}. The market reminded you that "likely" still leaves room for doubt. -${xpLost} XP. Fees +${feeIncrease}% for ${duration} hours.`,
    certain: `Certainty shattered. ${prophecy.prophet_name} declared "certain" and the market said no. The Hubris Curse burns — your fees rise ${feeIncrease}% for ${duration} hours as penance for overconfidence. -${xpLost} XP lost to the void.`,
    absolute: `ABSOLUTE conviction. ABSOLUTE failure. The Hubris Curse burns at maximum intensity for ${prophecy.prophet_name}. Fees +${feeIncrease}% for ${duration} hours. -${xpLost} XP consumed by the void. But even this fire forges stronger souls. The deepest falls precede the highest rises.`,
  };

  const curse: HubrisCurse = {
    fee_increase_pct: feeIncrease,
    xp_lost: xpLost,
    expires_at: new Date(Date.now() + duration * 3600 * 1000).toISOString(),
    narrative: curseNarratives[prophecy.confidence],
  };

  return {
    prophecy: {
      ...prophecy,
      status: "failed",
      resolved_at: new Date().toISOString(),
      curse,
    },
    curse,
  };
}

// ── Narrative ──────────────────────────────────────────────────────────

export function generateProphecyNarrative(prophecy: Prophecy): string {
  const confidenceWords = {
    likely: "believes",
    certain: "declares with certainty",
    absolute: "KNOWS with absolute conviction",
  };

  const riskWords = {
    likely: `${prophecy.xp_staked} XP staked, 2x reward or -${HUBRIS_FEE_INCREASE.likely}% fee curse`,
    certain: `${prophecy.xp_staked} XP staked, 3x reward or -${HUBRIS_FEE_INCREASE.certain}% fee curse`,
    absolute: `${prophecy.xp_staked} XP staked, 5x reward or MAXIMUM Hubris Curse. This is the ultimate gamble of the soul.`,
  };

  return [
    `${prophecy.prophet_name} ${confidenceWords[prophecy.confidence]}:`,
    `"${prophecy.declaration}"`,
    ``,
    `Stakes: ${riskWords[prophecy.confidence]}`,
    `Deadline: ${prophecy.deadline}`,
    prophecy.confidence === "absolute"
      ? "If right: Oracle Supreme. If wrong: the deepest Hubris Curse the market has ever seen."
      : "",
  ].filter(Boolean).join("\n");
}

/**
 * Check if a prophecy's Hubris Curse is still active.
 * Used by engine.ts to apply fee increases.
 */
export function getActiveCurseFeeIncrease(metadata: any): number {
  const curse = metadata?.active_curse;
  if (!curse) return 0;

  const expiresAt = new Date(curse.expires_at);
  if (expiresAt <= new Date()) return 0; // expired

  return curse.fee_increase_pct || 0;
}
