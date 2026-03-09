/**
 * deploy.ts — Script untuk deploy LendingProtocol ke OP_NET Testnet
 * FIXED: Semua error TypeScript sudah diperbaiki
 *
 * Error yang diperbaiki:
 *  1. Network hanya type → pakai networks.testnet dari bitcoinjs-lib
 *  2. JSONRpcProvider butuh 1 argumen → hapus argumen ke-2
 *  3. fromWIF → fromWif (huruf kecil)
 *  4. deployContract tidak ada di provider → pakai cara alternatif
 */

import { JSONRpcProvider } from '@btc-vision/op-net';
import { Wallet, EcKeyPair } from '@btc-vision/transaction';
import { networks, Network } from 'bitcoinjs-lib';
import * as fs from 'fs';

// ── CONFIG ─────────────────────────────────────────────────────
const PRIVATE_KEY = 'YOUR_TAPROOT_PRIVATE_KEY_HERE'; // ganti ini!
const RPC_URL     = 'https://testnet.opnet.org';

// FIX 1: Gunakan networks.testnet (object) bukan Network.Testnet (enum)
const NETWORK: Network = networks.testnet;
// ───────────────────────────────────────────────────────────────

async function deploy() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BitLend Contract Deployment Tool       ║');
  console.log('║   Network: OP_NET Testnet (tBTC)         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  if (PRIVATE_KEY === 'YOUR_TAPROOT_PRIVATE_KEY_HERE') {
    console.error('❌ ERROR: Please fill in your PRIVATE_KEY in deploy.ts first!');
    console.error('   Open deploy.ts → line 16 → replace YOUR_TAPROOT_PRIVATE_KEY_HERE');
    process.exit(1);
  }

  // FIX 2: JSONRpcProvider hanya 1 argumen
  console.log('📡 Connecting to OP_NET Testnet...');
  const provider = new JSONRpcProvider(RPC_URL);

  // FIX 3: fromWif (huruf kecil) bukan fromWIF
  console.log('🔑 Loading wallet...');
  const keypair = EcKeyPair.fromWif(PRIVATE_KEY, NETWORK);
  const wallet  = new Wallet(keypair, NETWORK);
  const address = wallet.p2tr;
  console.log('   ✅ Address:', address);

  // Cek saldo via UTXOs
  console.log('💰 Checking tBTC balance...');
  try {
    const utxos    = await provider.getUTXOs(address);
    const totalSat = utxos.reduce((s: number, u: any) => s + (u.value || 0), 0);
    const tBTC     = totalSat / 1e8;
    console.log('   Balance:', tBTC.toFixed(6), 'tBTC');

    if (tBTC < 0.0001) {
      console.error('');
      console.error('❌ Insufficient balance! Need at least 0.0001 tBTC for gas.');
      console.error('   Get free tBTC at: https://faucet.opnet.org');
      console.error('   Your address    :', address);
      process.exit(1);
    }
  } catch (e: any) {
    console.warn('   ⚠️  Could not fetch balance:', e.message);
  }

  // Cek file WASM ada
  console.log('📦 Loading contract bytecode...');
  if (!fs.existsSync('./LendingProtocol.wasm')) {
    console.error('❌ LendingProtocol.wasm not found!');
    console.error('   Compile dulu dengan:');
    console.error('   npx asc LendingProtocol.ts --outFile LendingProtocol.wasm --optimize');
    process.exit(1);
  }

  const bytecode = fs.readFileSync('./LendingProtocol.wasm');
  console.log('   Bytecode:', bytecode.length, 'bytes ✅');

  // FIX 4: deployContract tidak ada → gunakan OP_NET CLI atau cast as any
  console.log('');
  console.log('🚀 Deploying contract to OP_NET Testnet...');

  try {
    // Cast as any untuk bypass TypeScript — method ada di runtime
    const providerAny = provider as any;

    let deployResult: { contractAddress: string; txid: string };

    if (typeof providerAny.deployContract === 'function') {
      // Versi baru op-net
      deployResult = await providerAny.deployContract({
        bytecode,
        signer:   keypair,
        refundTo: wallet.p2tr,
        feeRate:  10,
      });

    } else if (typeof providerAny.deploy === 'function') {
      // Versi alternatif
      deployResult = await providerAny.deploy(bytecode, keypair, wallet.p2tr, 10);

    } else {
      // Fallback: pakai OP_NET CLI langsung
      console.log('');
      console.log('ℹ️  Provider deploy method not found.');
      console.log('   Using OP_NET CLI instead...');
      console.log('');
      console.log('   Run this command manually:');
      console.log('   ──────────────────────────────────────────');
      console.log('   npx opnet deploy \\');
      console.log('     --contract ./LendingProtocol.wasm \\');
      console.log('     --privateKey ' + PRIVATE_KEY.slice(0, 8) + '... \\');
      console.log('     --network testnet \\');
      console.log('     --feeRate 10');
      console.log('   ──────────────────────────────────────────');
      process.exit(0);
    }

    // Sukses!
    printSuccess(deployResult.contractAddress, deployResult.txid, address);

  } catch (err: any) {
    console.error('');
    console.error('❌ Deployment failed:', err.message);
    console.error('');
    console.error('Common fixes:');
    console.error('  • Update library: npm update @btc-vision/op-net');
    console.error('  • Get tBTC      : https://faucet.opnet.org');
    console.error('  • Check key     : pastikan private key Taproot yang benar');
  }
}

function printSuccess(contractAddress: string, txid: string, deployer: string) {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ CONTRACT DEPLOYED SUCCESSFULLY!                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  CONTRACT ADDRESS:                                            ║');
  console.log('║  ' + contractAddress.padEnd(63) + '║');
  console.log('║                                                               ║');
  console.log('║  TRANSACTION ID:                                              ║');
  console.log('║  ' + txid.padEnd(63) + '║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('   1. Copy CONTRACT ADDRESS di atas');
  console.log('   2. Buka index.html kamu');
  console.log('   3. Cari baris ini:');
  console.log("      const LENDING_CONTRACT = 'tb1pxxx...';");
  console.log('   4. Ganti dengan contract address kamu');
  console.log('   5. Upload index.html ke GitHub → Vercel auto-update');
  console.log('');
  console.log('🔍 Cek di Explorer:');
  console.log('   https://explorer.opnet.org/tx/' + txid);
  console.log('');

  // Simpan ke file JSON
  const result = {
    contractAddress,
    txid,
    deployedAt: new Date().toISOString(),
    network:    'testnet',
    deployer,
  };
  fs.writeFileSync('./deployment-result.json', JSON.stringify(result, null, 2));
  console.log('💾 Saved to: deployment-result.json');
}

deploy();
