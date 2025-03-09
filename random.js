const bitcoin = require("bitcoinjs-lib");
const axios = require("axios");
const { ECPairFactory } = require("ecpair"); // Use ECPairFactory
const tinysecp = require("tiny-secp256k1"); // Required for ECPair

// Initialize ECPair with the elliptic curve library
const ECPair = ECPairFactory(tinysecp); // Create ECPair instance

const NETWORK = bitcoin.networks.bitcoin; // Use mainnet Bitcoin

// Convert private key to Bitcoin address
function privateKeyToAddress(privateKeyHex) {
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKeyHex, "hex")); // Use ECPair instance
    const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey, // Ensure this is a valid public key
        network: NETWORK,
    });
    return address;
}

// Check Bitcoin balance from a block explorer
async function getBitcoinBalance(address) {
    try {
        const response = await axios.get(`https://blockstream.info/api/address/${address}`);
        const data = response.data;
        return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
    } catch (error) {
        console.error(`Error fetching balance for ${address}:`, error.message);
        return null;
    }
}

// Add a delay to avoid rate limiting
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Brute-force through small private keys
async function checkPuzzleKeys(start, end) {
    for (let i = BigInt(start); i <= BigInt(end); i++) {
        const privateKeyHex = i.toString(16).padStart(64, "0"); // Convert to 64-character hex
        const address = privateKeyToAddress(privateKeyHex);
        const balance = await getBitcoinBalance(address);

        console.log(`🔍 Checking key ${i} (${privateKeyHex}): ${address} -> Balance: ${balance} satoshis`);

        if (balance > 0) {
            console.log(`🚀 FOUND! Private Key: ${privateKeyHex}, Address: ${address}, Balance: ${balance} satoshis`);
            break;
        }

        // Add a delay to avoid being rate-limited
        await delay(1000); // 1 second delay between requests
    }
}

// Start checking from private key 1 to 100
checkPuzzleKeys(1, 100);