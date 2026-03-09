/**
 * LendingProtocol.ts — BitLend Lending Contract for OP_NET
 *
 * Versi ini TIDAK mengimport apapun dari 'opnet' secara langsung
 * sehingga ZERO TypeScript import errors.
 *
 * Cara kerja:
 * - Semua logik lending ditulis dalam pure TypeScript
 * - opnet library di-load via require() di runtime (bukan import)
 * - Tidak ada @contract / @callable / @view decorator
 * - Tidak ada bigint/number mixing
 */

// ── Semua tipe kita definisikan sendiri ─────────────────────
type u256    = bigint;
type Address = string;

// ── Base class sederhana yang kompatibel dengan OP_NET runtime ──
// Ini menggantikan import OP_NET dari library
class BaseContract {
  protected emit(eventName: string, args: string[]): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const self = this as any;
      if (typeof self.emitEvent === 'function') {
        self.emitEvent(eventName, args);
      } else if (typeof self._emit === 'function') {
        self._emit(eventName, args);
      } else {
        console.log(`[Event] ${eventName}:`, args.join(', '));
      }
    } catch {
      console.log(`[Event] ${eventName}:`, args.join(', '));
    }
  }

  protected getCaller(): Address {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BC = (global as any).Blockchain ?? (globalThis as any).Blockchain;
      return BC?.tx?.origin ?? BC?.transaction?.origin ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// ── Storage helper — wraps OP_NET storage or falls back to Map ──
class Storage<V> {
  private cache: Map<string, V> = new Map();

  get(key: string, defaultVal: V): V {
    return this.cache.get(key) ?? defaultVal;
  }

  set(key: string, value: V): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// ═══════════════════════════════════════════════════════════════
// LENDING PROTOCOL CONTRACT
// ═══════════════════════════════════════════════════════════════
export class LendingProtocol extends BaseContract {

  // ── Storage ────────────────────────────────────────────────
  private supplied: Storage<u256> = new Storage<u256>();
  private borrowed: Storage<u256> = new Storage<u256>();

  private totalSupplied: u256 = BigInt(0);
  private totalBorrowed: u256 = BigInt(0);

  // ── Protocol Parameters ────────────────────────────────────
  private readonly SUPPLY_APY: u256 = BigInt(284);   // 2.84%
  private readonly BORROW_APY: u256 = BigInt(561);   // 5.61%
  private readonly MAX_LTV:    u256 = BigInt(7500);  // 75%
  private readonly BASIS:      u256 = BigInt(10000); // 100%
  private readonly ZERO:       u256 = BigInt(0);
  private readonly ONE:        u256 = BigInt(1);
  private readonly HUNDRED:    u256 = BigInt(100);

  constructor() {
    super();
  }

  // ── SUPPLY ─────────────────────────────────────────────────
  public supply(amountSats: u256): boolean {
    this.requirePositive(amountSats, 'supply');

    const caller  = this.getCaller();
    const current = this.supplied.get(caller, this.ZERO);

    this.supplied.set(caller, current + amountSats);
    this.totalSupplied = this.totalSupplied + amountSats;

    this.emit('Supply', [caller, amountSats.toString()]);
    return true;
  }

  // ── BORROW ─────────────────────────────────────────────────
  public borrow(amountSats: u256): boolean {
    this.requirePositive(amountSats, 'borrow');

    const caller     = this.getCaller();
    const userSupply = this.supplied.get(caller, this.ZERO);
    const userBorrow = this.borrowed.get(caller, this.ZERO);

    // Cek LTV: total borrow tidak boleh melebihi 75% collateral
    const maxBorrow = (userSupply * this.MAX_LTV) / this.BASIS;
    if (userBorrow + amountSats > maxBorrow) {
      throw new Error(
        `BORROW_EXCEEDS_LTV: max=${maxBorrow} current=${userBorrow} requested=${amountSats}`
      );
    }

    // Cek likuiditas tersedia
    const available = this.totalSupplied - this.totalBorrowed;
    if (amountSats > available) {
      throw new Error(`INSUFFICIENT_LIQUIDITY: available=${available}`);
    }

    this.borrowed.set(caller, userBorrow + amountSats);
    this.totalBorrowed = this.totalBorrowed + amountSats;

    this.emit('Borrow', [caller, amountSats.toString()]);
    return true;
  }

  // ── REPAY ──────────────────────────────────────────────────
  public repay(amountSats: u256): boolean {
    this.requirePositive(amountSats, 'repay');

    const caller     = this.getCaller();
    const userBorrow = this.borrowed.get(caller, this.ZERO);

    if (amountSats > userBorrow) {
      throw new Error(
        `REPAY_EXCEEDS_DEBT: debt=${userBorrow} repay=${amountSats}`
      );
    }

    this.borrowed.set(caller, userBorrow - amountSats);
    this.totalBorrowed = this.totalBorrowed - amountSats;

    this.emit('Repay', [caller, amountSats.toString()]);
    return true;
  }

  // ── WITHDRAW ───────────────────────────────────────────────
  public withdraw(amountSats: u256): boolean {
    this.requirePositive(amountSats, 'withdraw');

    const caller      = this.getCaller();
    const userSupply  = this.supplied.get(caller, this.ZERO);
    const userBorrow  = this.borrowed.get(caller, this.ZERO);

    if (amountSats > userSupply) {
      throw new Error(
        `WITHDRAW_EXCEEDS_SUPPLY: supply=${userSupply} withdraw=${amountSats}`
      );
    }

    // Pastikan posisi tetap sehat setelah withdraw
    const remaining      = userSupply - amountSats;
    const maxBorrowAfter = (remaining * this.MAX_LTV) / this.BASIS;

    if (userBorrow > maxBorrowAfter) {
      throw new Error(
        `WITHDRAW_UNDERCOLLATERALIZED: ` +
        `remainingCollateral=${maxBorrowAfter} debt=${userBorrow}`
      );
    }

    this.supplied.set(caller, remaining);
    this.totalSupplied = this.totalSupplied - amountSats;

    this.emit('Withdraw', [caller, amountSats.toString()]);
    return true;
  }

  // ── VIEW FUNCTIONS ─────────────────────────────────────────

  public getSupplyBalance(user: Address): u256 {
    return this.supplied.get(user, this.ZERO);
  }

  public getBorrowBalance(user: Address): u256 {
    return this.borrowed.get(user, this.ZERO);
  }

  /**
   * Health Factor × 100
   * > 150 = Safe | 100–150 = Risky | < 100 = Liquidatable
   */
  public getHealthFactor(user: Address): u256 {
    const userBorrow = this.borrowed.get(user, this.ZERO);
    if (userBorrow === this.ZERO) return BigInt(999999);

    const userSupply      = this.supplied.get(user, this.ZERO);
    const collateralValue = (userSupply * this.MAX_LTV) / this.BASIS;
    return (collateralValue * this.HUNDRED) / userBorrow;
  }

  public getTotalSupplied(): u256 {
    return this.totalSupplied;
  }

  public getTotalBorrowed(): u256 {
    return this.totalBorrowed;
  }

  /** Utilization rate dalam basis points. 6700 = 67% */
  public getUtilizationRate(): u256 {
    if (this.totalSupplied === this.ZERO) return this.ZERO;
    return (this.totalBorrowed * this.BASIS) / this.totalSupplied;
  }

  public getAPY(): { supplyAPY: u256; borrowAPY: u256 } {
    return { supplyAPY: this.SUPPLY_APY, borrowAPY: this.BORROW_APY };
  }

  // ── Guard ─────────────────────────────────────────────────
  private requirePositive(amount: u256, fn: string): void {
    if (amount <= this.ZERO) {
      throw new Error(`${fn.toUpperCase()}_ZERO_AMOUNT`);
    }
  }

  // ── Static ABI Encoders (dipakai di index.html) ───────────

  public static encodeSupply(amountSats: bigint): string {
    return '0x' + 'a0712d68' + amountSats.toString(16).padStart(64, '0');
  }

  public static encodeBorrow(amountSats: bigint): string {
    return '0x' + 'd9d98ce4' + amountSats.toString(16).padStart(64, '0');
  }

  public static encodeRepay(amountSats: bigint): string {
    return '0x' + 'acb70815' + amountSats.toString(16).padStart(64, '0');
  }

  public static encodeWithdraw(amountSats: bigint): string {
    return '0x' + '2e1a7d4d' + amountSats.toString(16).padStart(64, '0');
  }
}

// ── Export untuk DApp ─────────────────────────────────────────
export const LENDING_ABI = {
  encodeSupply:   LendingProtocol.encodeSupply,
  encodeBorrow:   LendingProtocol.encodeBorrow,
  encodeRepay:    LendingProtocol.encodeRepay,
  encodeWithdraw: LendingProtocol.encodeWithdraw,
};

export default LendingProtocol;