require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const DISCORD_TOKEN    = process.env.KREEK_DISCORD_TOKEN;
const ALERT_CHANNEL_ID = process.env.KREEK_CHANNEL_ID || '1524844003961471079';
const POLL_MINUTES     = Number(process.env.POLL_MINUTES) || 5;
const KREEK_LIVE_URL   = 'https://www.youtube.com/@kreekcraft/live';

if (!DISCORD_TOKEN) {
  console.error('❌ Missing KREEK_DISCORD_TOKEN');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastNotifiedVideoId = null;

async function checkKreekCraft() {
  try {
    const res = await fetch(KREEK_LIVE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = await res.text();
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveNow":true');

    if (!isLive) {
      console.log(`[${new Date().toLocaleTimeString()}] KreekCraft is not live.`);
      return;
    }

    // Extract video ID
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const videoId = videoIdMatch?.[1];

    // Only notify once per stream
    if (!videoId || videoId === lastNotifiedVideoId) return;
    lastNotifiedVideoId = videoId;

    // Extract stream title
    const titleMatch = html.match(/"text":"([^"]{3,120})"/);
    const title = titleMatch?.[1]?.replace(/\\u0026/g, '&') || 'Live Stream';

    const channel = await client.channels.fetch(ALERT_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.error('❌ Could not find alert channel:', ALERT_CHANNEL_ID);
      return;
    }

    await channel.send(
      `🔴 **KreekCraft just went LIVE!**\n**${title}**\nhttps://youtube.com/watch?v=${videoId}`
    );

    console.log(`✅ Alert sent! Stream: ${videoId} — "${title}"`);
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

client.once('ready', () => {
  console.log(`🟢 Kreek Bot online as ${client.user.tag}`);
  console.log(`👀 Watching KreekCraft every ${POLL_MINUTES} minutes`);
  checkKreekCraft();
  setInterval(checkKreekCraft, POLL_MINUTES * 60 * 1000);
});

client.login(DISCORD_TOKEN);
