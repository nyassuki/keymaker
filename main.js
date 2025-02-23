require("dotenv").config();
const { Buffer } = require("buffer");
const CoinKey = require("coinkey");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const request = require('sync-request');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "YOUR_CHAT_ID";

if (!TOKEN || !CHAT_ID) {
  console.error("❌ Missing Telegram Bot Token or Chat ID in .env file.");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
bot.on("polling_error", console.error); // Log bot errors

// Read last progress
const PROGRESS_FILE = "progress.log";
const FOUND_FILE = "found/rns_found_balance2.txt";
const START_FROM = fs.existsSync(PROGRESS_FILE) ? fs.readFileSync(PROGRESS_FILE, "utf8").trim() : "0";

console.log("🤖 Telegram bot is running...");
console.log("Starting from:", START_FROM);

bot.sendMessage(CHAT_ID, "✅ Bot Started & Scanning...");

function startBot() {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎉 Welcome! The bot is running.");
  });

  bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, `📊 Bot is running. Last scanned: ${START_FROM}`);
  });

  bot.onText(/\/stop/, (msg) => {
    bot.sendMessage(msg.chat.id, "🛑 Stopping bot...");
    process.exit(0);
  });
}

function mainStart(startFrom) {
  try {
    let count = BigInt(startFrom);
    const step = BigInt(1);
    const padded = Buffer.alloc(32);

    const targetAddresses = new Set([
      "1KTvsW5tg5gkJf9fyT2xsvjkv7dzuZNTpW",
      "15ANYzzCp5BFHcCnVFzXqyibpzgPLWaD8b",
      "1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF",
      "1LdRcdxfbSnmCYYNdeYpUnztiYzVfBEQeC",
      "1AC4fMwgY8j9onSbXEWeH6Zan8QGMSdmtA",
      "1LruNZjwamWJXThX2Y8C2d47QqhAkkc5os",
      "12ib7dApVFvg82TXKycWBNpN8kFyiAN1dr",
      "12tkqA9xSoowkzoERHMWNKsTey55YEBqkv",
      "17rm2dvb439dZqyMe2d4D6AQJSgg6yeNRn",
      "1PeizMg76Cf96nUQrYg8xuoZWLQozU5zGW",
      "1GR9qNz7zgtaW5HwwVpEJWMnGWhsbsieCG",
      "1F34duy2eeMz5mSrvFepVzy7Y1rBsnAyWC",
      "1CmN5TcT7FF7H1DotF2ZKqYs1zKNncsHiS",
      "1P8Fbsd4YFd5TYpkK9Aij393T7dBvXLzYs",
      "1KSA4GFxSKdQkDA9ii8cy6ECBFPBGx9QKq",
    ]);

    let iteration = 0;
    while (true) {
      try {
        count += step;
        iteration++;

        // Update progress every 1000 iterations
        if (iteration % 1000 === 0) {
          fs.writeFileSync(PROGRESS_FILE, count.toString());
        }

        const countHex = count.toString(16);
        const countBytes = Buffer.from(countHex.padStart(64, "0"), "hex");
        countBytes.copy(padded);

        const key1 = new CoinKey(padded);
        const PrivateKey = key1.privateKey.toString("hex");
        const PublicAddress = key1.publicAddress;
		let rBalance = getBalance(PublicAddress);
        console.log(`🔍  ${PrivateKey}, ${PublicAddress} -> ${rBalance[0]},${rBalance[1]},${rBalance[2]}`);
		
		if(rBalance > 0) {
			fs.appendFileSync(FOUND_FILE, `🚀 BTC Key Found: ${count} -> ${PrivateKey} -> ${PublicAddress} ->  ${rBalance[0]},${rBalance[1]},${rBalance[2]}\n`, { encoding: "utf8" });
		}
        if (targetAddresses.has(PublicAddress)) {
          const resultKey = `🚀 BTC Key Found: ${count} -> ${PrivateKey} -> ${PublicAddress}\n`;
          fs.appendFileSync(FOUND_FILE, resultKey, { encoding: "utf8" });

          bot.sendMessage(CHAT_ID, `🔥 Jackpot! Private Key Found!\n${resultKey}`);
        }
      } catch (innerError) {
        console.error("⚠️ Error inside loop:", innerError);
      }
    }
  } catch (error) {
    console.error("❌ Critical Error in main loop:", error);
  }
}
function getBalance(addr) {
	try {
		let url = 'https://blockstream.info/api/address/' + addr;
		var res = request('GET', url);
		var bd = res.getBody('utf8');
		var bd_s = JSON.parse(bd);
		var funded_txo_sum = bd_s.chain_stats.funded_txo_sum;
		var spent_txo_sum = bd_s.chain_stats.spent_txo_sum;
		return [parseInt(funded_txo_sum) - parseInt(spent_txo_sum),funded_txo_sum,spent_txo_sum];
	} catch(error) {
		return [0,0,0];
	}
}
startBot();
mainStart(START_FROM);
