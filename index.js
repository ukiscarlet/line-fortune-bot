import express from "express";
import line from "@line/bot-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  if (event.message.text.includes("抽籤")) {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const pick = fortunes[Math.floor(Math.random() * fortunes.length)];
    const imageUrl = `https://${process.env.RAILWAY_STATIC_URL}/images/${pick}.png`;

    return client.replyMessage(event.replyToken, {
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    });
  }

  return Promise.resolve(null);
}

app.use("/images", express.static(path.join(__dirname, "images")));

app.listen(3000, () => {
  console.log("Bot server is running on port 3000");
});
