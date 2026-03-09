import {
  OP_NET,
  Blockchain,
  Address,
  u256,
  Calldata,
  BytesWriter,
  BytesReader,
  Map
} from '@btc-vision/opnet';

/**
 * BitLend — Simple Lending Protocol for OP_NET Testnet
 * Supports: supply, borrow, repay, withdraw
 */
@contract
export class LendingProtocol extends OP_NET {

  // ── Storage ──────────────────────────────────────────────
  // Saldo yang di-supply tiap user (dalam satoshi)
  private supplied: Map<Address, u256> = new Map<Address, u256>();

  // Saldo yang di-borrow tiap user (dalam satoshi)
  private borrowed: Map<Address, u256> = new Map<Address, u256>();

  // Total supply & borrow di seluruh protokol
  private totalSupplied: u256 = 0n;
  private totalBorrowed: u256 = 0n;

  // Supply APY dalam basis points (284 = 2.84%)
  private supplyAPY: u256 = 284n;

  // Borrow APY dalam basis points (561 = 5.61%)
  private borrowAPY: u256 = 561n;

  // LTV maksimal: 75% (dalam basis points)
  private maxLTV: u256 = 7500n;

  // ── Constructor ──────────────────────────────────────────
  constructor() {
    super();
  }

  // ── SUPPLY ───────────────────────────────────────────────
  /**
   * Supply tBTC ke protokol untuk dapatkan bunga
   * @param amount - jumlah dalam satoshi
   */
  @callable
  public supply(amount: u256): boolean {
    const caller: Address = Blockchain.tx.origin;

    if (amount <= 0n) {
      throw new Error('Amount must be greater than 0');
    }

    // Tambah saldo supply user
    const currentSupply: u256 = this.supplied.get(caller) || 0n;
    this.supplied.set(caller, currentSupply + amount);

    // Update total supply protokol
    this.totalSupplied = this.totalSupplied + amount;

    // Emit event
    this.emitEvent('Supply', [
      caller.toString(),
      amount.toString()
    ]);

    return true;
  }

  // ── BORROW ───────────────────────────────────────────────
  /**
   * Borrow tBTC dengan collateral yang sudah di-supply
   * @param amount - jumlah yang ingin dipinjam (satoshi)
   */
  @callable
  public borrow(amount: u256): boolean {
    const caller: Address = Blockchain.tx.origin;

    if (amount <= 0n) {
      throw new Error('Amount must be greater than 0');
    }

    // Cek collateral cukup (LTV max 75%)
    const userSupply: u256 = this.supplied.get(caller) || 0n;
    const userBorrow: u256 = this.borrowed.get(caller) || 0n;
    const maxBorrow: u256 = (userSupply * this.maxLTV) / 10000n;

    if (userBorrow + amount > maxBorrow) {
      throw new Error('Exceeds maximum LTV. Supply more collateral first.');
    }

    // Cek likuiditas protokol cukup
    const available: u256 = this.totalSupplied - this.totalBorrowed;
    if (amount > available) {
      throw new Error('Insufficient protocol liquidity');
    }

    // Tambah borrow user
    this.borrowed.set(caller, userBorrow + amount);
    this.totalBorrowed = this.totalBorrowed + amount;

    // Emit event
    this.emitEvent('Borrow', [
      caller.toString(),
      amount.toString()
    ]);

    return true;
  }

  // ── REPAY ────────────────────────────────────────────────
  /**
   * Bayar kembali pinjaman
   * @param amount - jumlah yang ingin dibayar (satoshi)
   */
  @callable
  public repay(amount: u256): boolean {
    const caller: Address = Blockchain.tx.origin;
    const userBorrow: u256 = this.borrowed.get(caller) || 0n;

    if (amount <= 0n) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > userBorrow) {
      throw new Error('Repay amount exceeds debt');
    }

    this.borrowed.set(caller, userBorrow - amount);
    this.totalBorrowed = this.totalBorrowed - amount;

    this.emitEvent('Repay', [
      caller.toString(),
      amount.toString()
    ]);

    return true;
  }

  // ── WITHDRAW ─────────────────────────────────────────────
  /**
   * Tarik kembali supply
   * @param amount - jumlah yang ingin ditarik (satoshi)
   */
  @callable
  public withdraw(amount: u256): boolean {
    const caller: Address = Blockchain.tx.origin;
    const userSupply: u256 = this.supplied.get(caller) || 0n;
    const userBorrow: u256 = this.borrowed.get(caller) || 0n;

    if (amount <= 0n) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > userSupply) {
      throw new Error('Withdraw amount exceeds supply balance');
    }

    // Pastikan health factor tetap aman setelah withdraw
    const remainingSupply: u256 = userSupply - amount;
    const maxBorrowAfter: u256 = (remainingSupply * this.maxLTV) / 10000n;

    if (userBorrow > maxBorrowAfter) {
      throw new Error('Cannot withdraw: would cause undercollateralization');
    }

    this.supplied.set(caller, remainingSupply);
    this.totalSupplied = this.totalSupplied - amount;

    this.emitEvent('Withdraw', [
      caller.toString(),
      amount.toString()
    ]);

    return true;
  }

  // ── VIEW FUNCTIONS ────────────────────────────────────────

  @view
  public getSupplyBalance(user: Address): u256 {
    return this.supplied.get(user) || 0n;
  }

  @view
  public getBorrowBalance(user: Address): u256 {
    return this.borrowed.get(user) || 0n;
  }

  @view
  public getHealthFactor(user: Address): u256 {
    const userSupply: u256 = this.supplied.get(user) || 0n;
    const userBorrow: u256 = this.borrowed.get(user) || 0n;

    if (userBorrow === 0n) return 999999n; // No debt = infinite health

    // Health factor = (supply * LTV) / borrow * 100
    const collateralValue: u256 = (userSupply * this.maxLTV) / 10000n;
    return (collateralValue * 100n) / userBorrow;
  }

  @view
  public getTotalSupplied(): u256 {
    return this.totalSupplied;
  }

  @view
  public getTotalBorrowed(): u256 {
    return this.totalBorrowed;
  }

  @view
  public getUtilizationRate(): u256 {
    if (this.totalSupplied === 0n) return 0n;
    return (this.totalBorrowed * 10000n) / this.totalSupplied;
  }

  @view
  public getAPY(): u256[] {
    return [this.supplyAPY, this.borrowAPY];
  }
}
