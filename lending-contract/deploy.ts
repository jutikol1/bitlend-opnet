// @ts-nocheck
import * as fs     from 'fs';
import * as txLib  from '@btc-vision/transaction';
import * as btcLib from '@btc-vision/bitcoin';
import * as opnet  from 'opnet';

const SEED_PHRASE   = String(fs.readFileSync('./seed.txt', 'utf8')).trim();
const RPC_URL       = 'https://testnet.opnet.org';
const WASM_FILE     = './LendingProtocol.wasm';
const OPNET_ADDRESS = 'opt1p7azsyckx893grspzm04sztfxenu4av5985e3635lhjtjewvs244syjyh2p';

async function main() {
  console.log('BitLend Deployer — OP_NET Testnet');
  console.log('==================================');

  const bytecode = fs.readFileSync(WASM_FILE);
  console.log('Bytecode:', bytecode.length, 'bytes');

  const network     = btcLib.networks.testnet;
  const mnemonic    = new txLib.Mnemonic(SEED_PHRASE, '', network);
  const wallet      = mnemonic.deriveOPWallet();
  const keypair     = wallet.keypair;
  const mldsaSigner = wallet._mldsaKeypair;

  console.log('p2tr  :', wallet.p2tr);
  console.log('mldsa :', mldsaSigner ? 'OK ✅' : 'null ❌');

  const provider = new opnet.JSONRpcProvider({
    url:     RPC_URL,
    network: opnet.NetworkName.Testnet,
  });
  console.log('Connected:', RPC_URL);

  console.log('Fetching UTXOs...');
  const mgr   = new opnet.UTXOsManager(provider);
  const utxos = await mgr.getUTXOs({ address: OPNET_ADDRESS, optimize: true });
  console.log('UTXOs:', utxos.length);

  if (!utxos || utxos.length === 0) {
    console.log('Tidak ada UTXO!');
    process.exit(1);
  }

  console.log('Fetching challenge...');
  const challenge = await provider.getChallenge();
  console.log('Challenge epoch:', challenge.epochNumber);

  console.log('Building & signing...');
  const factory = new txLib.TransactionFactory();
  const result  = await factory.signDeployment({
    signer:                   keypair,
    mldsaSigner,
    challenge,
    network,
    feeRate:                  10,
    priorityFee:              BigInt(0),
    gasSatFee:                BigInt(0),
    bytecode,
    utxos,
    maximumAllowedSatToSpend: BigInt(1000000),
    from:                     wallet.p2tr,
  });

  const contractAddr = (result as any).contractAddress?.toString() || 'unknown';
  console.log('Contract Address:', contractAddr);

  // transaction adalah Array [fundingTx, deployTx]
  const txArray = (result as any).transaction;
  console.log('TX count:', txArray.length);

  const toHex = (tx: any): string => {
    if (typeof tx === 'string') return tx;
    if (tx?.toHex)              return tx.toHex();
    if (tx?.extractTransaction) return tx.extractTransaction().toHex();
    if (tx instanceof Uint8Array || Buffer.isBuffer(tx)) return Buffer.from(tx).toString('hex');
    // Psbt object
    if (tx?.data)               return tx.extractTransaction().toHex();
    return Buffer.from(Object.values(tx)).toString('hex');
  };

  // Kirim funding tx dulu (index 0)
  if (txArray.length >= 1) {
    console.log('Broadcasting funding tx...');
    const hex1 = toHex(txArray[0]);
    console.log('Funding hex preview:', hex1.slice(0, 40) + '...');
    try {
      const r1 = await provider.sendRawTransaction(hex1, false);
      console.log('Funding result:', JSON.stringify(r1).slice(0, 100));
    } catch(e: any) {
      console.log('Funding error:', e.message);
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  // Kirim deploy tx (index 1)
  if (txArray.length >= 2) {
    console.log('Broadcasting deploy tx...');
    const hex2 = toHex(txArray[1]);
    console.log('Deploy hex preview:', hex2.slice(0, 40) + '...');
    try {
      const r2   = await provider.sendRawTransaction(hex2, false);
      const txid = (r2 as any).transactionId || (r2 as any).txId || JSON.stringify(r2).slice(0, 80);

      console.log('');
      console.log('CONTRACT DEPLOYED! ✅');
      console.log('Contract Address:', contractAddr);
      console.log('TxID            :', txid);
      console.log('Explorer        : https://explorer.opnet.org/tx/' + txid);
      console.log('');
      console.log("Buka index.html → ganti:");
      console.log("  const LENDING_CONTRACT = '" + contractAddr + "';");

      fs.writeFileSync('deployment-result.json', JSON.stringify({
        contractAddress: contractAddr, txid,
        deployer: wallet.p2tr,
        deployedAt: new Date().toISOString(),
      }, null, 2));
      console.log('Saved: deployment-result.json ✅');
    } catch(e: any) {
      console.log('Deploy tx error:', e.message);
      console.log('Hex length:', toHex(txArray[1]).length);
    }
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  if (e.stack) console.error(e.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
});