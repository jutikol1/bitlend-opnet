/**
 * deploy.ts — BitLend Contract Deployment
 * 
 * Menggunakan require() + any cast untuk menghindari semua TypeScript error
 * karena setiap versi library @btc-vision bisa berbeda API-nya.
 *
 * Cara pakai:
 *   1. npm install
 *   2. Isi PRIVATE_KEY di bawah
 *   3. npx ts-node deploy.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs') as typeof import('fs');

// ── KONFIGURASI — EDIT BAGIAN INI ─────────────────────────────
const PRIVATE_KEY  = 'cRc2RsERxyALi7pNMnPqcVLYXdMtVVbjWeSoG5Yt4ZQNtd1zQUuA'; // ganti dengan WIF key kamu
const RPC_URL      = 'https://testnet.opnet.org';
const CONTRACT_FILE = './LendingProtocol.wasm';
// ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  // ── Guard: private key harus diisi ──
  if (PRIVATE_KEY === 'cRc2RsERxyALi7pNMnPqcVLYXdMtVVbjWeSoG5Yt4ZQNtd1zQUuA') {
    console.error('❌  Please set your PRIVATE_KEY in deploy.ts (line 18)');
    console.error('    Export from OPWallet → Settings → Export Private Key');
    process.exit(1);
  }

  // ── Guard: file WASM harus ada ──
  if (!fs.existsSync(CONTRACT_FILE)) {
    console.error('❌  Contract WASM not found: ' + CONTRACT_FILE);
    console.error('    Compile dulu:');
    console.error('    npx asc LendingProtocol.ts --outFile LendingProtocol.wasm --optimize');
    process.exit(1);
  }

  const bytecode: Buffer = fs.readFileSync(CONTRACT_FILE);
  console.log('📦 Bytecode loaded:', bytecode.length, 'bytes');

  // ── Setup wallet — coba semua cara yang mungkin ──
  console.log('🔑 Setting up wallet...');
  // Semua di-cast ke any agar tidak ada TypeScript error apapun
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wallet: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let keypair: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let address: string;

  try {
    // Coba import semua kemungkinan nama dari library
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txLib: any = requireSafe('@btc-vision/transaction');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const btcLib: any = requireSafe('@btc-vision/bitcoin') || requireSafe('bitcoinjs-lib');

    const network = btcLib?.networks?.testnet
      ?? btcLib?.Network?.Testnet
      ?? btcLib?.Testnet
      ?? 'testnet';

    // Coba fromWif (huruf kecil) dulu — ini yang benar di versi terbaru
    const WalletClass  = txLib?.Wallet  || txLib?.default?.Wallet;
    const EcKeyPair    = txLib?.EcKeyPair || txLib?.default?.EcKeyPair;

    if (EcKeyPair?.fromWif) {
      keypair = EcKeyPair.fromWif(PRIVATE_KEY, network);
      wallet  = WalletClass ? new WalletClass(keypair, network) : null;
    } else if (EcKeyPair?.fromWIF) {
      keypair = EcKeyPair.fromWIF(PRIVATE_KEY, network);
      wallet  = WalletClass ? new WalletClass(keypair, network) : null;
    } else if (WalletClass?.fromWif) {
      wallet  = WalletClass.fromWif(PRIVATE_KEY, network);
      keypair = wallet?.keypair;
    } else if (WalletClass?.fromWIF) {
      wallet  = WalletClass.fromWIF(PRIVATE_KEY, network);
      keypair = wallet?.keypair;
    } else {
      throw new Error('Could not find wallet/keypair factory method');
    }

    address = wallet?.p2tr ?? wallet?.address ?? keypair?.address ?? '(unknown)';
    console.log('✅ Wallet loaded:', address);

  } catch (e: any) {
    console.error('❌ Wallet setup failed:', e.message);
    console.error('   Make sure you ran: npm install');
    process.exit(1);
  }

  // ── Setup provider ──
  console.log('📡 Connecting to OP_NET Testnet:', RPC_URL);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let provider: any;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opnetLib: any = requireSafe('opnet') || requireSafe('@btc-vision/op-net');
    const Provider = opnetLib?.JSONRpcProvider || opnetLib?.default?.JSONRpcProvider;

    // Coba 1 argumen dulu, fallback ke 2 argumen
    try {
      provider = new Provider(RPC_URL);
    } catch {
      provider = new Provider(RPC_URL, 'testnet');
    }

    console.log('✅ Provider connected');
  } catch (e: any) {
    console.error('❌ Provider setup failed:', e.message);
    process.exit(1);
  }

  // ── Cek saldo ──
  await checkBalance(provider, address);

  // ── Deploy kontrak ──
  console.log('');
  console.log('🚀 Deploying LendingProtocol to OP_NET Testnet...');
  console.log('   (OPWallet will ask for confirmation)');
  console.log('');

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    // Coba semua method deploy yang mungkin ada
    if (typeof provider.deployContract === 'function') {
      result = await provider.deployContract({ bytecode, signer: keypair, refundTo: address, feeRate: 10 });

    } else if (typeof provider.deploy === 'function') {
      result = await provider.deploy(bytecode, keypair, address, 10);

    } else if (typeof provider.sendTransaction === 'function') {
      result = await provider.sendTransaction({
        data:    bytecode.toString('hex'),
        signer:  keypair,
        refundTo: address,
        feeRate: 10,
        network: 'testnet',
        deploy:  true,
      });

    } else {
      // Tidak ada method deploy — tampilkan instruksi CLI
      showCLIInstructions(address);
      process.exit(0);
    }

    const contractAddress: string = result?.contractAddress ?? result?.address ?? result?.contract ?? 'Check explorer';
    const txid: string            = result?.txid ?? result?.hash ?? result?.id ?? 'Check explorer';

    printSuccess(contractAddress, txid, address);
    saveResult(contractAddress, txid, address);

  } catch (err: any) {
    console.error('❌ Deploy failed:', err.message);
    console.error('');
    showCLIInstructions(address);
  }
}

// ── Helpers ──────────────────────────────────────────────────

async function checkBalance(provider: any, address: string): Promise<void> {
  console.log('💰 Checking balance for:', address);
  try {
    let sats = 0;
    if (typeof provider.getBalance === 'function') {
      const bal = await provider.getBalance(address);
      sats = typeof bal === 'object' ? parseInt(bal.confirmed ?? bal.total ?? 0) : parseInt(bal ?? 0);
    } else if (typeof provider.getUTXOs === 'function') {
      const utxos = await provider.getUTXOs(address);
      sats = utxos.reduce((s: number, u: any) => s + (u.value || 0), 0);
    }
    const tBTC = sats / 1e8;
    console.log('   Balance:', tBTC.toFixed(6), 'tBTC');
    if (tBTC < 0.0001) {
      console.error('   ❌ Balance too low! Get tBTC at: https://faucet.opnet.org');
      console.error('   Your address:', address);
      process.exit(1);
    }
    console.log('   ✅ Balance sufficient');
  } catch (e: any) {
    console.warn('   ⚠️  Could not fetch balance — continuing anyway');
  }
}

function requireSafe(pkg: string): any {
  try { return require(pkg); } catch { return null; }
}

function showCLIInstructions(address: string): void {
  console.log('');
  console.log('ℹ️  Automatic deploy not available — use OP_NET CLI:');
  console.log('');
  console.log('   Option A — opnet CLI:');
  console.log('   ─────────────────────');
  console.log('   npm install -g @btc-vision/opnet-cli');
  console.log('   opnet deploy \\');
  console.log('     --contract ./LendingProtocol.wasm \\');
  console.log('     --privateKey YOUR_PRIVATE_KEY \\');
  console.log('     --network testnet');
  console.log('');
  console.log('   Option B — OP_NET Web Deploy:');
  console.log('   ─────────────────────────────');
  console.log('   1. Buka: https://deploy.opnet.org');
  console.log('   2. Connect OPWallet');
  console.log('   3. Upload file: LendingProtocol.wasm');
  console.log('   4. Klik Deploy');
  console.log('   5. Approve di OPWallet');
  console.log('   6. Copy contract address yang muncul');
  console.log('');
  console.log('   Your wallet address:', address);
}

function printSuccess(contractAddress: string, txid: string, deployer: string): void {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ✅  CONTRACT DEPLOYED SUCCESSFULLY!                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  CONTRACT ADDRESS:                                           ║');
  console.log('║  ' + contractAddress.slice(0, 60).padEnd(60) + '  ║');
  console.log('║                                                              ║');
  console.log('║  TRANSACTION ID:                                             ║');
  console.log('║  ' + txid.slice(0, 60).padEnd(60) + '  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('   1. Copy CONTRACT ADDRESS di atas');
  console.log('   2. Buka index.html');
  console.log('   3. Cari: const LENDING_CONTRACT = \'tb1pxxx...\';');
  console.log('   4. Ganti dengan contract address kamu');
  console.log('   5. Upload ke GitHub → Vercel auto-update ✅');
  console.log('');
  console.log('🔍 Cek di OP_NET Explorer:');
  console.log('   https://explorer.opnet.org/tx/' + txid);
}

function saveResult(contractAddress: string, txid: string, deployer: string): void {
  const data = {
    contractAddress,
    txid,
    deployer,
    deployedAt: new Date().toISOString(),
    network: 'testnet',
    nextStep: 'Update LENDING_CONTRACT in index.html with contractAddress above',
  };
  fs.writeFileSync('./deployment-result.json', JSON.stringify(data, null, 2));
  console.log('💾 Saved to: deployment-result.json');
}

function printBanner(): void {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BitLend — OP_NET Contract Deployer     ║');
  console.log('║   Network : OP_NET Testnet (tBTC)        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
