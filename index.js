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

// ======= Webhook =======
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
  const pullText = ["(hands together)", "(拜託)", "pray"];
  if (pullText.some(word => text.includes(word))) {
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

  // ======= 今日吃什麼（日式版） =======
  const triggerJapanese = ["jpfood", "食べ", "日本料理"];
  if (triggerJapanese.some(word => text.includes(word))) {
    const foods = [
      "すき焼き / 壽喜燒",
      "うな重 / 鰻魚飯",
      "おにぎり / 飯糰",
      "おでん / 關東煮",
      "しゃぶしゃぶ / 涮涮鍋",
      "懐石料理 / 懷石料理",
      "焼肉 / 燒肉",
      "弁当 / 便當",
      "オムライス / 蛋包飯",
      "丼物 / 飯丼",
      "素麺 / 素麵",
      "ちゃんこ鍋 / 相撲火鍋",
      "うなぎの蒲焼き / 日式蒲燒鰻",
      "焼きそば / 日式炒麵",
      "パスタ / 義大利麵",
      "卵かけご飯 / 生蛋拌飯",
      "お茶漬け / 茶泡飯",
      "日本のパン / 日式麵包",
      "ラーメン / 拉麵",
      "寿司 / 壽司",
      "お好み焼き / 大阪燒",
      "たこ焼き / 章魚燒",
      "カレーライス / 咖哩飯",
      "うどん / 烏龍麵",
      "焼き鳥 / 烤雞肉串",
      "天ぷら / 天婦羅",
      "餃子 / 餃子"
    ];
    const pick = foods[Math.floor(Math.random() * foods.length)];

    try {
      await client.pushMessage(groupId, {
        type: "text",
        text: `今日のおすすめは…「${pick}」です！`
      });
    } catch (err) {
      console.error("吃什麼（日式） pushMessage 失敗：", err);
    }
  }

  // ======= 今日吃什麼 v2（台灣版） =======
  const triggerTW = ["twfood", "吃什麼", "台灣美食"];
  if (triggerTW.some(word => text.includes(word))) {
    const foodsTW = [
      "牛肉麵 / 牛肉麺",
      "滷肉飯 / 魯肉飯",
      "鹽酥雞 / 塩酥鶏",
      "珍珠奶茶 / タピオカミルクティー",
      "雞排 / 鶏排",
      "小籠包 / 小籠包",
      "擔仔麵 / 担仔麺",
      "蚵仔煎 / 牡蠣オムレツ",
      "臭豆腐 / 臭豆腐",
      "刈包 / 割包",
      "滷味 / 魯味",
      "炒米粉 / ビーフン",
      "碗粿 / 碗粿",
      "豆花 / 豆花",
      "剉冰 / かき氷",
      "花生捲冰淇淋 / ピーナッツアイス春巻き",
      "米糕 / 米糕",
      "鹹酥蝦 / 塩酥蝦",
      "紅燒獅子頭 / 獅子頭煮込み"
    ];
    const pick = foodsTW[Math.floor(Math.random() * foodsTW.length)];

    try {
      await client.pushMessage(groupId, {
        type: "text",
        text: `今天推薦…「${pick}」！`
      });
    } catch (err) {
      console.error("吃什麼（台灣版） pushMessage 失敗：", err);
    }
  }
}

// ======= 測試用 GET =======
app.get("/", (req, res) => {
  res.send("LINE 群組抽籤 Bot 正常運作！");
});

// 監聽 Railway 自動分配 port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
