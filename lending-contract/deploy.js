// @ts-nocheck
const fs = require('fs');
const txLib = require('@btc-vision/transaction');
const btcLib = require('@btc-vision/bitcoin');
const opnetLib = require('opnet');
const RPC_URL = 'https://testnet.opnet.org';
const CONTRACT_FILE = './LendingProtocol.wasm';
async function main() {
    console.log('BitLend Contract Deployer — OP_NET Testnet');
    console.log('==========================================');
    if (!fs.existsSync(CONTRACT_FILE)) {
        console.error('ERROR: LendingProtocol.wasm tidak ditemukan! Jalankan: npm run compile');
        process.exit(1);
    }
    const bytecode = fs.readFileSync(CONTRACT_FILE);
    console.log('Bytecode loaded:', bytecode.length, 'bytes');
    const network = btcLib.networks.testnet;
    const keypair = txLib.EcKeyPair.fromWIF('cRtEjqNXJ23Hst6r6cM7BQPJfzL113hNLcukpxXwCSQmGcRbAied', network);
    const wallet = new txLib.Wallet(keypair, network);
    const address = wallet.p2tr;
    console.log('Wallet loaded:', address);
    const Provider = opnetLib.JSONRpcProvider || opnetLib.JsonRpcProvider;
    const provider = new Provider(RPC_URL);
    console.log('Connected to:', RPC_URL);
    console.log('');
    console.log('Deploying...');
    try {
        let result;
        if (typeof provider.deployContract === 'function') {
            result = await provider.deployContract({ bytecode, signer: keypair, refundTo: address, feeRate: 10, network });
        }
        else if (typeof provider.deploy === 'function') {
            result = await provider.deploy(bytecode, keypair, address, 10);
        }
        else {
            console.log('Provider methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(provider)).join(', '));
            console.log('Auto-deploy tidak tersedia. Gunakan:');
            console.log('npm install -g @btc-vision/opnet-cli');
            console.log('opnet deploy --contract LendingProtocol.wasm --network testnet');
            process.exit(0);
        }
        const contractAddress = result.contractAddress || result.address || 'check explorer';
        const txid = result.txid || result.hash || 'check explorer';
        console.log('');
        console.log('CONTRACT DEPLOYED!');
        console.log('Contract Address:', contractAddress);
        console.log('Transaction ID  :', txid);
        console.log('Explorer        : https://explorer.opnet.org/tx/' + txid);
        console.log('');
        console.log('Buka index.html, ganti:');
        console.log("const LENDING_CONTRACT = '" + contractAddress + "';");
        fs.writeFileSync('deployment-result.json', JSON.stringify({ contractAddress, txid, deployer: address, deployedAt: new Date().toISOString() }, null, 2));
        console.log('Saved: deployment-result.json');
    }
    catch (e) {
        console.error('Deploy failed:', e.message);
        console.log('Coba: npx opnet deploy --contract LendingProtocol.wasm --network testnet');
    }
}
main().catch(e => { console.error(e.message); process.exit(1); });
