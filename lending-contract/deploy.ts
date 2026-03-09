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
const PRIVATE_KEY  = 'e8e51c17e0d9d6a323f90f3356c917437a7485e17d3b84ae9064cedcf1abd0af55f943c5f03e2057cc6592e02b51466630fd5d30cda475e11ff567112564e0a1a7c400517b3d240b3d7a1fe87eb287831be821ae7f5f353f6f8bf715341b412b059b5a5ad51edd0c7939bde8ef73837425f07bd17246ec427ec6fe70499fcda01434265b480163366524c324c810521c410a4a44268c467121124824346603404684a44d80b62424858c08474ce4848801a8442416119996409a8444e2b0288122265bb865c3980d52222103882c9100084ac28519054e0bc86ce0364a2488455a162ed9288a5b266ae1164692182a4cc091113604d2c82919b98cda14811926220b34821aa40403b20dc0a444c046120bc305004992040182e1344ca40049a00624dab2914c968d11217224152a833248c4c210e33489e4380c188325190845d0065014b66109c60c4b286de3c24080209000490e88a04cda9471d8160d12440a8434889b28648cb2601ab34c1b47709c423124a78d084780c0820142424d2092805338258c2868538249e2b28883062c5b06600b31400c3949d2368c4c928ca024894c30808b4882ccc2702022429b4289d994084c2828839041480644cc322948260520134599300960406da0966d911265140160e0466561c468014626d2944980328e0c0932a3c6902487204906721c292dc394288ca08d849488a4b644dc26208a2828e104819932862138605b928118010650060ad414864228814336624c284112840482080540a481a09861604620c820690c271143940c10b5805a482502b28950868511c06982a20404a56189466542c86d1c35020a18618310509a243058424810192e084848c400429c388c21304d4c940912800d9ba44598400802428411440491062550b48804036ca4b28dc322841a346853386c1a250d023364823240238321e04821da1861541232584228182231e1162a8984055c8230e41489e3368e108921c48440832404e286209b1806149308d1223161a60de02651d43292cc342d134681504825e4a460e3c424932805a018922104658b18505cb40c18a30944483208294e4ab68199c460ca906cd03644ca424221a1080bb86418204920474252c68cc4360d48280d1b046a99266d090330cb922ccb1402d83460d9388200a7211a382ec88029a3b090d9007019332d09230a84a86d1bc0105b226513130581460c141325c19861d3b845e1803124114424a45008a82c0bb3504c9bb2f2ef6b6f9be0d3007b08cbc7752c13549246aae9e2101b5a215b1d34b4a3b011601f902218234434bcbe5e1079e77808d6b11f48892aeefc0665274a77346d4a54ff22f74b8630c49ff70682f2ea3a73a99937083e2cba1418acd5fa4e7fd5925b85ded8e76a89ffa671c4692c2a89b657f35f9b63d86b7690dd2a34db615287cdc0bfb9a0a7dd6b1f3d135669cf9196cc628b8cf3ab198d553640e333c3bce10dee6b311fac17a6abb8decb7f6935596f32432e8b480d6e05321b72ead0e86a5ee3da5ae9f4f07845575f18ed5bb4a215c17279f402d9558d082d8acf839f643cb0736d96a3633102d50d507dbcbe8eb919bfcbe4f633313801778920a98bd5bd528ebf2481a380a3fcdcde4d9829c3aa7bafa2adba99803321668391381329aa5cf6f33f36180d19c627c02753b45f11b5c342576c29c526ef565f7e01098016c9ae97ce11566533e1486ef689fd758e86192cf86adf45afc1e375c061f0a79ac03b07ab1d4bc1a3f4d4b094ccdd5db53406504ae0d17dcdb4d01111a3d9c7db27f31fe6a181539e103e904731a901c50e894bdedaf5daa161236cbdecf7d9ad0859d5df6927f6d07f3df5c1441c3333033b4c96806f44c5a8d8b12460018e52269a573184543118650cc8837e8e78dfe2893b4c95eb670da25053b6bf1c7f95b489c78650e30f6f9a5f0d9c15b5a60855f1820d750f29866e2d84cd94303495e8182fccaaf956bec3c6887c238e8f446fb168b5fc0dc1a9aee9001d97195a7f1e85f34d189e9954f62224080bc12849c2fcef1a631a1b87cff0c212414c88692cba2387f87a49914ada5e8b4d2f64c8b1e189b8ec34ed69acf2501021f5d28c0a45bca10b2e497e34cd8adb4ec5a90c36669918ad8264646c69e979d6ebc51632abb494a7250ac206bba0dd6a074d79bd8a0bbf28f32dbd5485cbf45b6fe6ad9d4b813d0587bd64585fb706128c0810f138611b1337bff016a915615103b49a4b9be458797cdf20674aee1f496730869ed86775682830def9ef968cf6ec4f928b17e8ec71f638cc10fbd9098e9e6069ea639d6f7a2740efeae33bac5cdb616c364d05e91b47ccf5193437570ee4b67ed240e6fecbe6999bdd763b3a41be0656082ddd173ea071a802c1eb578a77b5d6b75674a25dde5bd0d6f13f3df700dcee66b79216921926d91200f1447d54525d34aa5105beb23f94cf645b45b49d61b4330a082eb8c8be4cab7325b8bae8b3b2f228f9536752e8130bb23efc44d5e844f0f41de5ccd254fc3972378173541a90122549766e42ea13ae8efc4e53abbd466456ff56b230ccccc7eb5e134dfb67aca67d5a0287fa6f2150c2fb34050d9984fcbb33cdd2614d673f0343ffad5ce6e6378ee6397232f1d039fdbb4fe73a6baa1fcc5b2bb7d581f20a3d24a6633352d3fca59daa16553ebcf4bf5f12b41c313b47d1bd33bb3f98faf5cc7394e0eac16165e89a57abd6b605c9eb5c90093a412d6b5813f981a8215f0201cd892461286c3346d1c56bcee72950f9938c6c370a9b1301abba8f883d615c7234fa98f9794c3b4f9fc4bc82ab9b274cb0f1e38ac72778e0bd8ff3f72f6d6ab51cce91926434453033bc089968233188637bd0d3ce3dfee4c1ad0156f0da9b2b217b42e221bb9dddd00c3448658f00437fc57594ba35cae85442d497603a0326519a01da3c4f3070c9631f3f0264ce0e1ebe7fd49891a61c8f811354781e8ace1f370d3f506747c0fc6f9c6c0fbfabfa1944916bc6d49ebd66d45ffbe810a4586adcec50aaa82b432fe3b5d00262384f0f2ef0042ed63686f185015914a226537ec56f408ab5a11800ebde95cd3875dd90f3ead77d890f22380a15acece5f1302cbc3f017a9d88ab2ea276ca8b38f1d0b9cc392c083f93aad1e8643b5cb38a13f8cbc01068ed37554c6907b1e41217537cc8e02e4a83735d344d349cd5be08ffe4fdc0f9afe51a643254e313b5c2ede9e0e013b53878162a2eb4db12679bf02a5d8f38e4f9b755765e0957dac2fad3686e32adf547cd0c7b0263bead1fabf1275a39a634dc813bfdb67f3eef07bcefa6574260eb857c50c60f4424ba00a45d545d2e5bb3184809daeac4759d4f864c3b90ce9c8d8be6a1d5b17393e9ff0b3b97de21774d6ba626574600deeffebc0787d8a199799f09757d96e17c809d2b7e842c8164b5323a8f9086d01a1629284fd90d0b18dcdfdd10e787a7a9c4315650943cd23fb43ad78dae630bec97bae50cd95e37205df9dffc968344428a067a937f5024420101b5e3f9bf5638f9d881bdd51b40d1aed8fee17da81747c1e0320c5410f38e4f99790e88847ba64cd86e3ff3ca68'; // ganti dengan WIF key kamu
const RPC_URL      = 'https://testnet.opnet.org';
const CONTRACT_FILE = './LendingProtocol.wasm';
// ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();

  // ── Guard: private key harus diisi ──
  if (PRIVATE_KEY === 'e8e51c17e0d9d6a323f90f3356c917437a7485e17d3b84ae9064cedcf1abd0af55f943c5f03e2057cc6592e02b51466630fd5d30cda475e11ff567112564e0a1a7c400517b3d240b3d7a1fe87eb287831be821ae7f5f353f6f8bf715341b412b059b5a5ad51edd0c7939bde8ef73837425f07bd17246ec427ec6fe70499fcda01434265b480163366524c324c810521c410a4a44268c467121124824346603404684a44d80b62424858c08474ce4848801a8442416119996409a8444e2b0288122265bb865c3980d52222103882c9100084ac28519054e0bc86ce0364a2488455a162ed9288a5b266ae1164692182a4cc091113604d2c82919b98cda14811926220b34821aa40403b20dc0a444c046120bc305004992040182e1344ca40049a00624dab2914c968d11217224152a833248c4c210e33489e4380c188325190845d0065014b66109c60c4b286de3c24080209000490e88a04cda9471d8160d12440a8434889b28648cb2601ab34c1b47709c423124a78d084780c0820142424d2092805338258c2868538249e2b28883062c5b06600b31400c3949d2368c4c928ca024894c30808b4882ccc2702022429b4289d994084c2828839041480644cc322948260520134599300960406da0966d911265140160e0466561c468014626d2944980328e0c0932a3c6902487204906721c292dc394288ca08d849488a4b644dc26208a2828e104819932862138605b928118010650060ad414864228814336624c284112840482080540a481a09861604620c820690c271143940c10b5805a482502b28950868511c06982a20404a56189466542c86d1c35020a18618310509a243058424810192e084848c400429c388c21304d4c940912800d9ba44598400802428411440491062550b48804036ca4b28dc322841a346853386c1a250d023364823240238321e04821da1861541232584228182231e1162a8984055c8230e41489e3368e108921c48440832404e286209b1806149308d1223161a60de02651d43292cc342d134681504825e4a460e3c424932805a018922104658b18505cb40c18a30944483208294e4ab68199c460ca906cd03644ca424221a1080bb86418204920474252c68cc4360d48280d1b046a99266d090330cb922ccb1402d83460d9388200a7211a382ec88029a3b090d9007019332d09230a84a86d1bc0105b226513130581460c141325c19861d3b845e1803124114424a45008a82c0bb3504c9bb2f2ef6b6f9be0d3007b08cbc7752c13549246aae9e2101b5a215b1d34b4a3b011601f902218234434bcbe5e1079e77808d6b11f48892aeefc0665274a77346d4a54ff22f74b8630c49ff70682f2ea3a73a99937083e2cba1418acd5fa4e7fd5925b85ded8e76a89ffa671c4692c2a89b657f35f9b63d86b7690dd2a34db615287cdc0bfb9a0a7dd6b1f3d135669cf9196cc628b8cf3ab198d553640e333c3bce10dee6b311fac17a6abb8decb7f6935596f32432e8b480d6e05321b72ead0e86a5ee3da5ae9f4f07845575f18ed5bb4a215c17279f402d9558d082d8acf839f643cb0736d96a3633102d50d507dbcbe8eb919bfcbe4f633313801778920a98bd5bd528ebf2481a380a3fcdcde4d9829c3aa7bafa2adba99803321668391381329aa5cf6f33f36180d19c627c02753b45f11b5c342576c29c526ef565f7e01098016c9ae97ce11566533e1486ef689fd758e86192cf86adf45afc1e375c061f0a79ac03b07ab1d4bc1a3f4d4b094ccdd5db53406504ae0d17dcdb4d01111a3d9c7db27f31fe6a181539e103e904731a901c50e894bdedaf5daa161236cbdecf7d9ad0859d5df6927f6d07f3df5c1441c3333033b4c96806f44c5a8d8b12460018e52269a573184543118650cc8837e8e78dfe2893b4c95eb670da25053b6bf1c7f95b489c78650e30f6f9a5f0d9c15b5a60855f1820d750f29866e2d84cd94303495e8182fccaaf956bec3c6887c238e8f446fb168b5fc0dc1a9aee9001d97195a7f1e85f34d189e9954f62224080bc12849c2fcef1a631a1b87cff0c212414c88692cba2387f87a49914ada5e8b4d2f64c8b1e189b8ec34ed69acf2501021f5d28c0a45bca10b2e497e34cd8adb4ec5a90c36669918ad8264646c69e979d6ebc51632abb494a7250ac206bba0dd6a074d79bd8a0bbf28f32dbd5485cbf45b6fe6ad9d4b813d0587bd64585fb706128c0810f138611b1337bff016a915615103b49a4b9be458797cdf20674aee1f496730869ed86775682830def9ef968cf6ec4f928b17e8ec71f638cc10fbd9098e9e6069ea639d6f7a2740efeae33bac5cdb616c364d05e91b47ccf5193437570ee4b67ed240e6fecbe6999bdd763b3a41be0656082ddd173ea071a802c1eb578a77b5d6b75674a25dde5bd0d6f13f3df700dcee66b79216921926d91200f1447d54525d34aa5105beb23f94cf645b45b49d61b4330a082eb8c8be4cab7325b8bae8b3b2f228f9536752e8130bb23efc44d5e844f0f41de5ccd254fc3972378173541a90122549766e42ea13ae8efc4e53abbd466456ff56b230ccccc7eb5e134dfb67aca67d5a0287fa6f2150c2fb34050d9984fcbb33cdd2614d673f0343ffad5ce6e6378ee6397232f1d039fdbb4fe73a6baa1fcc5b2bb7d581f20a3d24a6633352d3fca59daa16553ebcf4bf5f12b41c313b47d1bd33bb3f98faf5cc7394e0eac16165e89a57abd6b605c9eb5c90093a412d6b5813f981a8215f0201cd892461286c3346d1c56bcee72950f9938c6c370a9b1301abba8f883d615c7234fa98f9794c3b4f9fc4bc82ab9b274cb0f1e38ac72778e0bd8ff3f72f6d6ab51cce91926434453033bc089968233188637bd0d3ce3dfee4c1ad0156f0da9b2b217b42e221bb9dddd00c3448658f00437fc57594ba35cae85442d497603a0326519a01da3c4f3070c9631f3f0264ce0e1ebe7fd49891a61c8f811354781e8ace1f370d3f506747c0fc6f9c6c0fbfabfa1944916bc6d49ebd66d45ffbe810a4586adcec50aaa82b432fe3b5d00262384f0f2ef0042ed63686f185015914a226537ec56f408ab5a11800ebde95cd3875dd90f3ead77d890f22380a15acece5f1302cbc3f017a9d88ab2ea276ca8b38f1d0b9cc392c083f93aad1e8643b5cb38a13f8cbc01068ed37554c6907b1e41217537cc8e02e4a83735d344d349cd5be08ffe4fdc0f9afe51a643254e313b5c2ede9e0e013b53878162a2eb4db12679bf02a5d8f38e4f9b755765e0957dac2fad3686e32adf547cd0c7b0263bead1fabf1275a39a634dc813bfdb67f3eef07bcefa6574260eb857c50c60f4424ba00a45d545d2e5bb3184809daeac4759d4f864c3b90ce9c8d8be6a1d5b17393e9ff0b3b97de21774d6ba626574600deeffebc0787d8a199799f09757d96e17c809d2b7e842c8164b5323a8f9086d01a1629284fd90d0b18dcdfdd10e787a7a9c4315650943cd23fb43ad78dae630bec97bae50cd95e37205df9dffc968344428a067a937f5024420101b5e3f9bf5638f9d881bdd51b40d1aed8fee17da81747c1e0320c5410f38e4f99790e88847ba64cd86e3ff3ca68') {
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
