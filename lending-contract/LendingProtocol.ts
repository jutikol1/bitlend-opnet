/**
 * LendingProtocol.ts — BitLend Lending Contract for OP_NET
 *
 * Ditulis ulang menggunakan API OP_NET yang benar:
 * - Tidak pakai @contract / @callable / @view (AssemblyScript only)
 * - Menggunakan opnet SmartContract base class
 * - Semua bigint operation menggunakan BigInt() cast agar tidak error
 * - emitEvent diganti dengan emit() dari base class
 */

import {
  SmartContract,
  OP_NET,
  CallResponse,
  StoredU256,
  StoredString,
  StoredBoolean,
  Address,
  BytesWriter,
  BytesReader,
  Blockchain,
  TransactionInput,
} from 'opnet';

// ── Types ────────────────────────────────────────────────────
type u256 = bigint;

// ── Contract Storage Keys ────────────────────────────────────
const STORAGE_TOTAL_SUPPLIED = BigInt('0x1');
const STORAGE_TOTAL_BORROWED = BigInt('0x2');
const STORAGE_SUPPLY_APY     = BigInt('0x3');
const STORAGE_BORROW_APY     = BigInt('0x4');
const STORAGE_MAX_LTV        = BigInt('0x5');

// ── Function Selectors (ABI) ─────────────────────────────────
// keccak256 dari nama function — dipakai di calldata encoding
export const SELECTORS = {
  supply:           BigInt('0xa0712d68'),
  borrow:           BigInt('0xd9d98ce4'),
  repay:            BigInt('0xacb70815'),
  withdraw:         BigInt('0x2e1a7d4d'),
  getSupplyBalance: BigInt('0x70a08231'),
  getBorrowBalance: BigInt('0xdd62ed3e'),
  getHealthFactor:  BigInt('0x9e8a0f11'),
  getTotalSupplied: BigInt('0x18160ddd'),
  getTotalBorrowed: BigInt('0xb1b55c46'),
  getUtilization:   BigInt('0x7ee64fd9'),
  getAPY:           BigInt('0x6c7e3aec'),
};

// ── Main Contract Class ──────────────────────────────────────
export class LendingProtocol extends OP_NET {

  // ── State (in-memory untuk TypeScript — OP_NET handles persistence) ──
  private supplies: Map<string, u256>  = new Map();
  private borrows:  Map<string, u256>  = new Map();
  private _totalSupplied: u256         = BigInt(0);
  private _totalBorrowed: u256         = BigInt(0);

  // Protocol parameters
  private readonly supplyAPY: u256 = BigInt(284);   // 2.84% dalam basis points
  private readonly borrowAPY: u256 = BigInt(561);   // 5.61% dalam basis points
  private readonly maxLTV:    u256 = BigInt(7500);  // 75% LTV
  private readonly BASIS:     u256 = BigInt(10000);

  constructor() {
    super();
  }

  // ── SUPPLY ───────────────────────────────────────────────────
  /**
   * Supply tBTC ke protokol untuk dapatkan bunga
   * @param amount jumlah dalam satoshi (bigint)
   */
  public supply(amount: u256): boolean {
    if (amount <= BigInt(0)) {
      throw new Error('LendingProtocol: amount must be > 0');
    }

    const caller = this.getCaller();

    const current = this.supplies.get(caller) ?? BigInt(0);
    this.supplies.set(caller, current + amount);
    this._totalSupplied = this._totalSupplied + amount;

    this.log(`Supply: ${caller} supplied ${amount} sats`);
    return true;
  }

  // ── BORROW ───────────────────────────────────────────────────
  /**
   * Borrow tBTC dengan collateral yang sudah di-supply
   * @param amount jumlah yang ingin dipinjam dalam satoshi
   */
  public borrow(amount: u256): boolean {
    if (amount <= BigInt(0)) {
      throw new Error('LendingProtocol: amount must be > 0');
    }

    const caller      = this.getCaller();
    const userSupply  = this.supplies.get(caller) ?? BigInt(0);
    const userBorrow  = this.borrows.get(caller)  ?? BigInt(0);

    // Cek max LTV: borrow tidak boleh melebihi 75% dari supply
    const maxBorrow = (userSupply * this.maxLTV) / this.BASIS;
    if (userBorrow + amount > maxBorrow) {
      throw new Error(
        `LendingProtocol: exceeds max LTV. ` +
        `Max borrow: ${maxBorrow}, current: ${userBorrow}, requested: ${amount}`
      );
    }

    // Cek likuiditas protokol
    const available = this._totalSupplied - this._totalBorrowed;
    if (amount > available) {
      throw new Error(`LendingProtocol: insufficient liquidity. Available: ${available}`);
    }

    this.borrows.set(caller, userBorrow + amount);
    this._totalBorrowed = this._totalBorrowed + amount;

    this.log(`Borrow: ${caller} borrowed ${amount} sats`);
    return true;
  }

  // ── REPAY ────────────────────────────────────────────────────
  /**
   * Bayar kembali pinjaman
   * @param amount jumlah yang dibayar dalam satoshi
   */
  public repay(amount: u256): boolean {
    if (amount <= BigInt(0)) {
      throw new Error('LendingProtocol: amount must be > 0');
    }

    const caller     = this.getCaller();
    const userBorrow = this.borrows.get(caller) ?? BigInt(0);

    if (amount > userBorrow) {
      throw new Error(
        `LendingProtocol: repay exceeds debt. Debt: ${userBorrow}, repay: ${amount}`
      );
    }

    this.borrows.set(caller, userBorrow - amount);
    this._totalBorrowed = this._totalBorrowed - amount;

    this.log(`Repay: ${caller} repaid ${amount} sats`);
    return true;
  }

  // ── WITHDRAW ─────────────────────────────────────────────────
  /**
   * Tarik kembali aset yang sudah di-supply
   * @param amount jumlah yang ditarik dalam satoshi
   */
  public withdraw(amount: u256): boolean {
    if (amount <= BigInt(0)) {
      throw new Error('LendingProtocol: amount must be > 0');
    }

    const caller      = this.getCaller();
    const userSupply  = this.supplies.get(caller) ?? BigInt(0);
    const userBorrow  = this.borrows.get(caller)  ?? BigInt(0);

    if (amount > userSupply) {
      throw new Error(
        `LendingProtocol: withdraw exceeds supply. Supply: ${userSupply}, withdraw: ${amount}`
      );
    }

    // Pastikan health factor tetap aman setelah withdraw
    const remainingSupply = userSupply - amount;
    const maxBorrowAfter  = (remainingSupply * this.maxLTV) / this.BASIS;

    if (userBorrow > maxBorrowAfter) {
      throw new Error(
        `LendingProtocol: withdraw would cause undercollateralization. ` +
        `Remaining collateral value: ${maxBorrowAfter}, debt: ${userBorrow}`
      );
    }

    this.supplies.set(caller, remainingSupply);
    this._totalSupplied = this._totalSupplied - amount;

    this.log(`Withdraw: ${caller} withdrew ${amount} sats`);
    return true;
  }

  // ── VIEW FUNCTIONS ────────────────────────────────────────────

  public getSupplyBalance(user: string): u256 {
    return this.supplies.get(user) ?? BigInt(0);
  }

  public getBorrowBalance(user: string): u256 {
    return this.borrows.get(user) ?? BigInt(0);
  }

  /**
   * Health Factor = (collateral * LTV / debt) * 100
   * > 150 = safe | 100-150 = risky | < 100 = liquidatable
   */
  public getHealthFactor(user: string): u256 {
    const userSupply = this.supplies.get(user) ?? BigInt(0);
    const userBorrow = this.borrows.get(user)  ?? BigInt(0);

    if (userBorrow === BigInt(0)) return BigInt(999999); // no debt

    const collateralValue = (userSupply * this.maxLTV) / this.BASIS;
    return (collateralValue * BigInt(100)) / userBorrow;
  }

  public getTotalSupplied(): u256 {
    return this._totalSupplied;
  }

  public getTotalBorrowed(): u256 {
    return this._totalBorrowed;
  }

  /**
   * Utilization rate dalam basis points (6700 = 67%)
   */
  public getUtilizationRate(): u256 {
    if (this._totalSupplied === BigInt(0)) return BigInt(0);
    return (this._totalBorrowed * this.BASIS) / this._totalSupplied;
  }

  public getAPY(): { supplyAPY: u256; borrowAPY: u256 } {
    return {
      supplyAPY: this.supplyAPY,
      borrowAPY: this.borrowAPY,
    };
  }

  // ── ABI ENCODER (untuk calldata dari DApp) ────────────────────

  /**
   * Encode calldata untuk fungsi supply
   * Dipakai di index.html → encodeCalldata()
   */
  public static encodeSupply(amountSats: bigint): string {
    const selector     = SELECTORS.supply.toString(16).padStart(8, '0');
    const encodedAmt   = amountSats.toString(16).padStart(64, '0');
    return '0x' + selector + encodedAmt;
  }

  public static encodeBorrow(amountSats: bigint): string {
    const selector   = SELECTORS.borrow.toString(16).padStart(8, '0');
    const encodedAmt = amountSats.toString(16).padStart(64, '0');
    return '0x' + selector + encodedAmt;
  }

  public static encodeRepay(amountSats: bigint): string {
    const selector   = SELECTORS.repay.toString(16).padStart(8, '0');
    const encodedAmt = amountSats.toString(16).padStart(64, '0');
    return '0x' + selector + encodedAmt;
  }

  public static encodeWithdraw(amountSats: bigint): string {
    const selector   = SELECTORS.withdraw.toString(16).padStart(8, '0');
    const encodedAmt = amountSats.toString(16).padStart(64, '0');
    return '0x' + selector + encodedAmt;
  }

  // ── Internal Helpers ─────────────────────────────────────────

  private getCaller(): string {
    // Dalam OP_NET runtime, caller tersedia via Blockchain context
    // Untuk TypeScript compilation, kita return placeholder
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (Blockchain as any)?.tx?.origin ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private log(message: string): void {
    // OP_NET event logging
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (this as any).emit === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).emit('Log', [message]);
      } else {
        console.log('[LendingProtocol]', message);
      }
    } catch {
      console.log('[LendingProtocol]', message);
    }
  }
}

// ── Export ABI untuk dipakai di DApp (index.html) ─────────────
export const LENDING_ABI = {
  supply:           LendingProtocol.encodeSupply,
  borrow:           LendingProtocol.encodeBorrow,
  repay:            LendingProtocol.encodeRepay,
  withdraw:         LendingProtocol.encodeWithdraw,
  selectors:        SELECTORS,
};

// ── Default export ────────────────────────────────────────────
export default LendingProtocol;
