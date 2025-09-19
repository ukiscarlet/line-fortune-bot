import express from "express";
import line from "@line/bot-sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LINE 設定
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
    res.status(200).send("OK");
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

  // ======= 抽籤功能 =======
  const pullText = ["(hands together)","(拜託)","pray"]
  if (pullText.some(word => text.includes(pullText))) {
    const fortunes = ["大吉", "中吉", "小吉", "吉", "末吉", "凶", "大凶"];
    const pick = fortunes[Math.floor(Math.random() * fortunes.length)];

    const imageUrl = `https://${process.env.RAILWAY_STATIC_URL}/images/${encodeURIComponent(pick)}.jpg`;

    try {
      await client.pushMessage(groupId, {
        type: "image",
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      });
    } catch (err) {
      console.error("抽籤 pushMessage 失敗：", err);
    }
  }

  // ======= 今日吃什麼功能 =======
  if (text.includes("meat")) {
    const foods = [
      "すき焼き",
      "うな重",
      "おにぎり",
      "おでん",
      "しゃぶしゃぶ",
      "懐石料理",
      "焼肉",
      "弁当",
      "オムライス",
      "丼物",
      "素麺",
      "ちゃんこ鍋",
      "うなぎの蒲焼き",
      "焼きそば",
      "パスタ",
      "卵かけご飯",
      "お茶漬け",
      "日本のパン",
	  "ラーメン",
	  "寿司",         
      "お好み焼き",   
      "たこ焼き",     
      "カレーライス",  
      "うどん",                  
      "焼き鳥",       
      "天ぷら",        
      "餃子"  
    ];
    const pick = foods[Math.floor(Math.random() * foods.length)];

    try {
      await client.pushMessage(groupId, {
        type: "text",
        text: `今日のおすすめは…「${pick}」です！`
      });
    } catch (err) {
      console.error("吃什麼 pushMessage 失敗：", err);
    }
  }
}

// 測試用 GET
app.get("/", (req, res) => {
  res.send("LINE 群組抽籤 Bot 正常運作！");
});

// 監聽 Railway 自動分配 port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
