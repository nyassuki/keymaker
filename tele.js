require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Initialize Telegram bot
const bot = new TelegramBot(TOKEN);
//bot.setWebHook(`${WEBHOOK_URL}`);

app.use(bodyParser.json());

// Webhook endpoint
app.post("/webhook", (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.sendStatus(400);
  }

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();

  console.log("Received message:", text);

  let reply = "I didn't understand that command.";

  if (text === "/start") {
    reply = "🤖 Welcome to the Telegram Bot!";
  } else if (text === "/gotest") {
    reply = "✅ Bot is working!";
  }

  bot.sendMessage(chatId, reply);
  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Webhook set at: ${WEBHOOK_URL}`);
});
