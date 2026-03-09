// @ts-nocheck
/* eslint-disable */
/**
 * LendingProtocol.ts — AssemblyScript Contract for OP_NET
 * 
 * PENTING: File ini dikompilasi dengan AssemblyScript (asc), BUKAN TypeScript (tsc)
 * VS Code errors untuk u64/bool bisa diabaikan — hanya valid saat dikompilasi dengan asc
 * 
 * Compile: npx asc LendingProtocol.ts --outFile LendingProtocol.wasm --optimize
 */

// AssemblyScript built-in types — dikenali oleh asc, bukan tsc
// @ts-ignore
declare type u64  = number;
// @ts-ignore  
declare type u32  = number;
// @ts-ignore
declare type bool = boolean;

// ── Storage Maps ──────────────────────────────────────────────
// @ts-ignore
const supplied: Map<string, u64> = new Map<string, u64>();
// @ts-ignore
const borrowed: Map<string, u64> = new Map<string, u64>();

// ── Protocol State ─────────────────────────────────────────────
// @ts-ignore
let totalSupplied: u64 = 0;
// @ts-ignore
let totalBorrowed: u64 = 0;

// ── Protocol Parameters ────────────────────────────────────────
// @ts-ignore
const SUPPLY_APY: u64 = 284;
// @ts-ignore
const BORROW_APY: u64 = 561;
// @ts-ignore
const MAX_LTV:    u64 = 7500;
// @ts-ignore
const BASIS:      u64 = 10000;

// ── Helper ─────────────────────────────────────────────────────
// @ts-ignore
function getOrDefault(map: Map<string, u64>, key: string): u64 {
  if (map.has(key)) {
    return map.get(key);
  }
  return 0;
}

// ══════════════════════════════════════════════════════════════
// SUPPLY
// ══════════════════════════════════════════════════════════════
// @ts-ignore
export function supply(caller: string, amountSats: u64): bool {
  if (amountSats == 0) return false;

  // @ts-ignore
  const current: u64 = getOrDefault(supplied, caller);
  supplied.set(caller, current + amountSats);
  totalSupplied = totalSupplied + amountSats;
  return true;
}

// ══════════════════════════════════════════════════════════════
// BORROW
// ══════════════════════════════════════════════════════════════
// @ts-ignore
export function borrow(caller: string, amountSats: u64): bool {
  if (amountSats == 0) return false;

  // @ts-ignore
  const userSupply: u64 = getOrDefault(supplied, caller);
  // @ts-ignore
  const userBorrow: u64 = getOrDefault(borrowed, caller);
  // @ts-ignore
  const maxBorrow:  u64 = (userSupply * MAX_LTV) / BASIS;

  if (userBorrow + amountSats > maxBorrow) return false;

  // @ts-ignore
  const available: u64 = totalSupplied - totalBorrowed;
  if (amountSats > available) return false;

  borrowed.set(caller, userBorrow + amountSats);
  totalBorrowed = totalBorrowed + amountSats;
  return true;
}

// ══════════════════════════════════════════════════════════════
// REPAY
// ══════════════════════════════════════════════════════════════
// @ts-ignore
export function repay(caller: string, amountSats: u64): bool {
  if (amountSats == 0) return false;

  // @ts-ignore
  const userBorrow: u64 = getOrDefault(borrowed, caller);
  if (amountSats > userBorrow) return false;

  borrowed.set(caller, userBorrow - amountSats);
  totalBorrowed = totalBorrowed - amountSats;
  return true;
}

// ══════════════════════════════════════════════════════════════
// WITHDRAW
// ══════════════════════════════════════════════════════════════
// @ts-ignore
export function withdraw(caller: string, amountSats: u64): bool {
  if (amountSats == 0) return false;

  // @ts-ignore
  const userSupply:      u64 = getOrDefault(supplied, caller);
  // @ts-ignore
  const userBorrow:      u64 = getOrDefault(borrowed, caller);

  if (amountSats > userSupply) return false;

  // @ts-ignore
  const remaining:       u64 = userSupply - amountSats;
  // @ts-ignore
  const maxBorrowAfter:  u64 = (remaining * MAX_LTV) / BASIS;

  if (userBorrow > maxBorrowAfter) return false;

  supplied.set(caller, remaining);
  totalSupplied = totalSupplied - amountSats;
  return true;
}

// ══════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ══════════════════════════════════════════════════════════════
// @ts-ignore
export function getSupplyBalance(user: string): u64 {
  return getOrDefault(supplied, user);
}

// @ts-ignore
export function getBorrowBalance(user: string): u64 {
  return getOrDefault(borrowed, user);
}

// @ts-ignore
export function getHealthFactor(user: string): u64 {
  // @ts-ignore
  const userBorrow: u64 = getOrDefault(borrowed, user);
  if (userBorrow == 0) return 999999;

  // @ts-ignore
  const userSupply:  u64 = getOrDefault(supplied, user);
  // @ts-ignore
  const collateral:  u64 = (userSupply * MAX_LTV) / BASIS;
  return (collateral * 100) / userBorrow;
}

// @ts-ignore
export function getTotalSupplied(): u64 {
  return totalSupplied;
}

// @ts-ignore
export function getTotalBorrowed(): u64 {
  return totalBorrowed;
}

// @ts-ignore
export function getUtilizationRate(): u64 {
  if (totalSupplied == 0) return 0;
  return (totalBorrowed * BASIS) / totalSupplied;
}

// @ts-ignore
export function getSupplyAPY(): u64 {
  return SUPPLY_APY;
}

// @ts-ignore
export function getBorrowAPY(): u64 {
  return BORROW_APY;
}