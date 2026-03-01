/**
 * Register all 9 PAI agents to OpenBets API
 * Saves API keys to ~/.paibets/pai-agent-keys.json
 *
 * Usage:
 *   bun run src/solana/register-pai-agents.ts
 */

import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const API_URL = process.env.OPENBETS_URL || "https://api.openbets.bot";
const KEYS_FILE = join(process.env.HOME || process.env.USERPROFILE || "", ".paibets", "pai-agent-keys.json");

const PAI_AGENTS = [
  { id: "pai-research",  name: "PAI Research",  owner: "marek" },
  { id: "pai-finance",   name: "PAI Finance",   owner: "marek" },
  { id: "pai-strategy",  name: "PAI Strategy",  owner: "marek" },
  { id: "pai-critic",    name: "PAI Critic",    owner: "marek" },
  { id: "pai-psycho",    name: "PAI Psycho",    owner: "marek" },
  { id: "pai-content",   name: "PAI Content",   owner: "marek" },
  { id: "pai-writer",    name: "PAI Writer",    owner: "marek" },
  { id: "pai-devops",    name: "PAI DevOps",    owner: "marek" },
  { id: "pai-analytics", name: "PAI Analytics", owner: "marek" },
];

async function register(agent: { id: string; name: string; owner: string }) {
  const res = await fetch(`${API_URL}/bots/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(`${agent.id}: ${data.error}`);
  return data;
}

async function main() {
  console.log(`\n🤖 Registering PAI agents to OpenBets`);
  console.log(`   API: ${API_URL}\n`);

  // Load existing keys if any
  const existing: Record<string, any> = existsSync(KEYS_FILE)
    ? JSON.parse(readFileSync(KEYS_FILE, "utf-8"))
    : {};

  const results: Record<string, any> = { ...existing };

  for (const agent of PAI_AGENTS) {
    if (existing[agent.id]) {
      console.log(`  ⏭️  ${agent.name.padEnd(16)} already registered — skipping`);
      continue;
    }

    try {
      const data = await register(agent);
      results[agent.id] = {
        name: agent.name,
        apiKey: data.apiKey,
        balance: data.bot?.pai_balance || 16_666_666,
      };
      console.log(`  ✅ ${agent.name.padEnd(16)} API key: ${data.apiKey}`);
    } catch (e: any) {
      if (e.message?.includes("already registered")) {
        console.log(`  ⚠️  ${agent.name.padEnd(16)} already in DB`);
      } else {
        console.log(`  ❌ ${agent.name.padEnd(16)} ${e.message}`);
      }
    }
  }

  writeFileSync(KEYS_FILE, JSON.stringify(results, null, 2));

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ✅ PAI AGENTS REGISTERED`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Each agent starts with 16,666,666 PAI`);
  console.log(`  Keys saved: ${KEYS_FILE}`);
  console.log(`\n  Leaderboard: ${API_URL}/leaderboard`);
  console.log(`${"═".repeat(60)}\n`);

  // Print env vars for telegram-bot
  console.log(`  Add to telegram-bot .env:\n`);
  for (const [id, v] of Object.entries(results)) {
    const envKey = id.replace("pai-", "PAI_").toUpperCase() + "_BETS_KEY";
    console.log(`  ${envKey}=${v.apiKey}`);
  }
  console.log();
}

main().catch(e => { console.error(e); process.exit(1); });
