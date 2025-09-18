import express from "express";
import line from "@line/bot-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LINE Channel 設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

app.use(express.json());

// 靜態圖片目錄
app.use("/images", express.static(path.join(__dirname, "images")));

// Webhook
app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).send("OK"); // LINE 必須收到 200
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const text = event.message.text;
  const groupId = event.source.groupId || event.source.roomId;

  if (!groupId) return; // 個人聊天不處理

  if (text.includes("抽籤")) {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const pick = fortunes[Math.floor(Math.random() * fortunes.length)];

    // 圖片 URL，這裡使用 Railway 的 Public URL
    const imageUrl = `https://你的專案名.up.railway.app/images/${pick}.png`;

    // 直接用 pushMessage 發送給群組
    await client.pushMessage(groupId, {
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    });
  }
}

// 測試用 GET
app.get("/", (req, res) => {
  res.send("LINE 群組抽籤 Bot 正常運作！");
});

// 監聽 Railway 自動分配的 port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
