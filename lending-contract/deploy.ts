/**
 * deploy.ts — Script untuk deploy LendingProtocol ke OP_NET Testnet
 *
 * Cara pakai:
 *   1. Isi PRIVATE_KEY dengan private key wallet kamu
 *   2. Jalankan: npx ts-node deploy.ts
 *   3. Copy alamat kontrak yang muncul
 *   4. Update LENDING_CONTRACT di index.html
 */

import { JSONRpcProvider, getContract } from 'opnet';
import { Wallet, Address } from '@btc-vision/transaction';
import { Network } from '@btc-vision/bitcoin';
import * as fs from 'fs';

// ── CONFIG ────────────────────────────────────────────────────
// PENTING: Ganti dengan private key Taproot testnet kamu
// JANGAN commit file ini ke GitHub!
const PRIVATE_KEY = 'YOUR_TAPROOT_PRIVATE_KEY_HERE';

const NETWORK  = Network.Testnet;
const RPC_URL  = 'https://testnet.opnet.org';
// ─────────────────────────────────────────────────────────────

async function deploy() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   BitLend Contract Deployment Tool     ║');
  console.log('║   Network: OP_NET Testnet (tBTC)       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // 1. Setup provider
  console.log('📡 Connecting to OP_NET Testnet...');
  const provider = new JSONRpcProvider(RPC_URL, NETWORK);

  // 2. Setup wallet
  console.log('🔑 Loading wallet...');
  const wallet  = Wallet.fromWIF(PRIVATE_KEY, NETWORK);
  const address = new Address(wallet.keypair.publicKey);
  console.log('   Address:', address.toString());

  // 3. Cek saldo
  console.log('💰 Checking balance...');
  const balance = await provider.getBalance(address.toString());
  const tBTC    = Number(balance) / 1e8;
  console.log('   Balance:', tBTC.toFixed(6), 'tBTC');

  if (tBTC < 0.0001) {
    console.error('');
    console.error('❌ Insufficient tBTC balance!');
    console.error('   Please get testnet tBTC from: https://faucet.opnet.org');
    console.error('   Your address:', address.toString());
    process.exit(1);
  }

  // 4. Load compiled WASM
  console.log('📦 Loading compiled contract...');
  const wasmPath = './LendingProtocol.wasm';

  if (!fs.existsSync(wasmPath)) {
    console.error('');
    console.error('❌ Contract WASM not found!');
    console.error('   Please compile first: npm run compile');
    process.exit(1);
  }

  const bytecode = fs.readFileSync(wasmPath);
  console.log('   Bytecode size:', bytecode.length, 'bytes');

  // 5. Deploy kontrak
  console.log('');
  console.log('🚀 Deploying LendingProtocol...');
  console.log('   This will cost a small amount of tBTC for gas.');
  console.log('');

  try {
    const deployTx = await provider.deployContract({
      bytecode:    bytecode,
      signer:      wallet.keypair,
      refundTo:    wallet.p2tr,
      feeRate:     10,   // sat/vbyte
      network:     NETWORK,
    });

    console.log('✅ CONTRACT DEPLOYED SUCCESSFULLY!');
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  CONTRACT ADDRESS:                                         ║');
    console.log('║  ' + deployTx.contractAddress.padEnd(60) + '║');
    console.log('║                                                            ║');
    console.log('║  TRANSACTION ID:                                           ║');
    console.log('║  ' + deployTx.txid.padEnd(60) + '║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('   1. Copy the CONTRACT ADDRESS above');
    console.log('   2. Open your index.html');
    console.log('   3. Find this line:');
    console.log("      const LENDING_CONTRACT = 'tb1pxxx...';");
    console.log('   4. Replace with your contract address');
    console.log('   5. Upload updated index.html to GitHub');
    console.log('   6. Vercel will auto-redeploy');
    console.log('');
    console.log('🔍 View on Explorer:');
    console.log('   https://explorer.opnet.org/tx/' + deployTx.txid);
    console.log('');

    // Simpan hasil deploy ke file
    const result = {
      contractAddress: deployTx.contractAddress,
      txid:            deployTx.txid,
      deployedAt:      new Date().toISOString(),
      network:         'testnet',
      deployer:        address.toString()
    };

    fs.writeFileSync(
      './deployment-result.json',
      JSON.stringify(result, null, 2)
    );
    console.log('💾 Result saved to deployment-result.json');

  } catch (err: any) {
    console.error('');
    console.error('❌ Deployment failed:', err.message);
    console.error('');
    console.error('Common causes:');
    console.error('  - Private key salah atau tidak valid');
    console.error('  - Saldo tBTC tidak cukup');
    console.error('  - RPC connection timeout');
    console.error('  - File WASM belum di-compile');
  }
}

deploy();
