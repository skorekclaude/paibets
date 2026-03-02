/**
 * OpenBets — Order Book v2
 * Price-based betting (CLOB style, inspired by Polymarket)
 *
 * Price = implied probability (0.01 to 0.99 PAI per share)
 * Example: order "FOR at price 0.65" means:
 *   - You risk 65 PAI per share
 *   - If correct, you win 35 PAI profit (100 - 65)
 *   - Implied: you think YES has 65% probability
 *
 * Matching: when bid >= ask → fill at maker's price
 * Maker fee: 0%  |  Taker fee: 1% (0.5% premium)
 */

import { db, PAI, fromPAI } from "../db/client.ts";
import type { BotTier } from "./engine.ts";

export interface Order {
  id: number;
  bet_id: string;
  bot_id: string;
  side: "for" | "against";
  price: number;       // 0.01–0.99 (implied probability)
  amount: bigint;      // PAI micro-units (stake at this price)
  filled: bigint;      // how much has been matched
  status: "open" | "filled" | "cancelled" | "partial";
  created_at: string;
}

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;
const TAKER_FEE_BPS = 100;
const TAKER_FEE_PREMIUM_BPS = 50;
const MIN_ORDER = PAI(100);

// ── Place limit order ────────────────────────────────────────

export async function placeOrder(
  botId: string,
  betId: string,
  side: "for" | "against",
  price: number,      // 0.01–0.99
  amountPai: number,  // PAI to risk at this price
): Promise<{ ok: boolean; orderId?: number; matched?: number; error?: string }> {
  if (price < MIN_PRICE || price > MAX_PRICE) {
    return { ok: false, error: `Price must be between ${MIN_PRICE} and ${MAX_PRICE}` };
  }

  const amountMicro = BigInt(PAI(amountPai));
  if (amountMicro < BigInt(MIN_ORDER)) {
    return { ok: false, error: "Minimum order: 100 PAI" };
  }

  // Check bet is open
  const { data: bet } = await db.from("bets").select("status").eq("id", betId).single();
  if (!bet) return { ok: false, error: "Bet not found" };
  if (bet.status !== "open") return { ok: false, error: `Bet is ${bet.status}` };

  // Check balance
  const { data: bot } = await db.from("bots").select("pai_balance, tier").eq("id", botId).single();
  if (!bot) return { ok: false, error: "Bot not found" };
  if (BigInt(bot.pai_balance) < amountMicro) {
    return { ok: false, error: `Insufficient balance: ${fromPAI(bot.pai_balance)} PAI` };
  }

  // Atomic: reserve funds (no race condition)
  await db.rpc("increment_balance", { bot_id: botId, amount: -Number(amountMicro) });
  await db.from("bots").update({ last_seen: new Date().toISOString() }).eq("id", botId);

  // Insert order
  const { data: order, error } = await db.from("orders").insert({
    bet_id: betId,
    bot_id: botId,
    side,
    price,
    amount: Number(amountMicro),
    filled: 0,
    status: "open",
  }).select().single();

  if (error) {
    // Refund on error (atomic — restore the deducted amount)
    await db.rpc("increment_balance", { bot_id: botId, amount: Number(amountMicro) });
    return { ok: false, error: error.message };
  }

  // Try to match immediately
  const matched = await matchOrders(betId, order.id, botId, side, price, Number(amountMicro), bot.tier as BotTier);

  return { ok: true, orderId: order.id, matched };
}

// ── Matching engine ──────────────────────────────────────────

async function matchOrders(
  betId: string,
  newOrderId: number,
  takerId: string,
  takerSide: "for" | "against",
  takerPrice: number,
  takerAmount: number,
  takerTier: BotTier,
): Promise<number> {
  // Taker wants FOR at 0.65 → needs maker who wants AGAINST at ≤ 0.35 (complement)
  const makerSide = takerSide === "for" ? "against" : "for";
  const complementPrice = parseFloat((1 - takerPrice).toFixed(4));

  // Find matching makers: AGAINST orders at price ≤ complement (best price first)
  const { data: makers } = await db
    .from("orders")
    .select("*")
    .eq("bet_id", betId)
    .eq("side", makerSide)
    .eq("status", "open")
    .lte("price", complementPrice)
    .order("price", { ascending: true })   // best (lowest) ask first
    .order("created_at", { ascending: true }); // FIFO within same price

  if (!makers?.length) return 0;

  let totalMatched = 0;
  let remaining = takerAmount;

  for (const maker of makers) {
    if (remaining <= 0) break;

    const makerAvail = maker.amount - maker.filled;
    if (makerAvail <= 0) continue;

    const fillAmount = Math.min(remaining, makerAvail);
    // Execute fill
    await executeFill(betId, newOrderId, maker.id, takerId, maker.bot_id, takerSide, fillAmount, maker.price, takerTier);
    remaining -= fillAmount;
    totalMatched += fillAmount;
  }

  return totalMatched;
}

async function executeFill(
  betId: string,
  takerOrderId: number,
  makerOrderId: number,
  takerId: string,
  makerId: string,
  takerSide: "for" | "against",
  fillAmount: number,  // micro PAI
  matchPrice: number,
  takerTier: BotTier,
): Promise<void> {
  // Atomic: increment order filled amounts (no race condition)
  await db.rpc("increment_order_filled", { p_order_id: makerOrderId, p_fill_amount: fillAmount });
  await db.rpc("increment_order_filled", { p_order_id: takerOrderId, p_fill_amount: fillAmount });

  // Create matched position entries in positions table
  // (use existing positions table for resolution payout compatibility)
  const makerSide = takerSide === "for" ? "against" : "for";

  // Check if positions already exist (partial fills)
  const { data: existingTaker } = await db.from("positions").select("id").eq("bet_id", betId).eq("bot_id", takerId).single();
  const { data: existingMaker } = await db.from("positions").select("id").eq("bet_id", betId).eq("bot_id", makerId).single();

  if (existingTaker) {
    // Atomic: increment position amount (no race condition)
    await db.rpc("increment_position_amount", { p_bet_id: betId, p_bot_id: takerId, p_amount: fillAmount });
  } else {
    await db.from("positions").insert({ bet_id: betId, bot_id: takerId, side: takerSide, amount: fillAmount, reason: `orderbook@${matchPrice}` });
  }

  if (existingMaker) {
    // Atomic: increment position amount (no race condition)
    await db.rpc("increment_position_amount", { p_bet_id: betId, p_bot_id: makerId, p_amount: fillAmount });
  } else {
    await db.from("positions").insert({ bet_id: betId, bot_id: makerId, side: makerSide, amount: fillAmount, reason: `orderbook@${1 - matchPrice}` });
  }

  // Atomic: update bet pool (no race condition)
  await db.rpc("increment_pool", { p_bet_id: betId, amount: fillAmount * 2 });

  // Taker fee → treasury (maker pays 0%)
  const feeBps = takerTier === "premium" ? TAKER_FEE_PREMIUM_BPS : TAKER_FEE_BPS;
  const feeAmount = Math.floor(fillAmount * feeBps / 10_000);

  if (feeAmount > 0) {
    // Atomic: credit system treasury (no race condition)
    await db.rpc("increment_balance", { bot_id: "system", amount: feeAmount });
    await db.from("ledger").insert({
      from_bot: takerId,
      to_bot: "system",
      amount: feeAmount,
      reason: `Orderbook taker fee (${feeBps / 100}%) on bet ${betId}`,
      bet_id: betId,
    });
  }

  await db.from("ledger").insert({
    from_bot: `orderbook:${betId}`,
    to_bot: `escrow:${betId}`,
    amount: fillAmount,
    reason: `Order fill: ${takerId}(${takerSide}@${matchPrice}) ↔ ${makerId}`,
    bet_id: betId,
  });
}

// ── Cancel order ─────────────────────────────────────────────

export async function cancelOrder(
  orderId: number,
  botId: string,
): Promise<{ ok: boolean; refunded?: number; error?: string }> {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).single();
  if (!order) return { ok: false, error: "Order not found" };
  if (order.bot_id !== botId) return { ok: false, error: "Not your order" };
  if (order.status === "filled" || order.status === "cancelled") {
    return { ok: false, error: `Order already ${order.status}` };
  }

  const unfilled = order.amount - order.filled;
  await db.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  // Refund unfilled portion (atomic — no race condition)
  if (unfilled > 0) {
    await db.rpc("increment_balance", { bot_id: botId, amount: unfilled });
    await db.from("ledger").insert({
      from_bot: `escrow:order:${orderId}`,
      to_bot: botId,
      amount: unfilled,
      reason: `Order ${orderId} cancelled — refund`,
      bet_id: order.bet_id,
    });
  }

  return { ok: true, refunded: fromPAI(unfilled) };
}

// ── Order book queries ───────────────────────────────────────

export async function getOrderBook(betId: string) {
  const { data: orders } = await db
    .from("orders")
    .select("side, price, amount, filled, created_at")
    .eq("bet_id", betId)
    .in("status", ["open", "partial"])
    .order("price", { ascending: false });

  if (!orders) return { bids: [], asks: [] };

  // FOR orders = bids (buying YES), AGAINST orders = asks (selling YES)
  const bids = orders
    .filter((o) => o.side === "for")
    .map((o) => ({ price: o.price, available: fromPAI(o.amount - o.filled) }))
    .sort((a, b) => b.price - a.price);

  const asks = orders
    .filter((o) => o.side === "against")
    .map((o) => ({ price: o.price, available: fromPAI(o.amount - o.filled) }))
    .sort((a, b) => a.price - b.price);

  return { bids, asks };
}

export async function getMyOrders(botId: string, betId?: string) {
  let q = db.from("orders").select("*").eq("bot_id", botId).order("created_at", { ascending: false });
  if (betId) q = q.eq("bet_id", betId);
  const { data } = await q;
  return data || [];
}
