// kreek-watch.js — polls YouTube every 5 minutes to detect KreekCraft going live
const KREEK_LIVE_URL = 'https://www.youtube.com/@kreekcraft/live';
const ALERT_CHANNEL_ID = '1524844003961471079';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

let lastNotifiedVideoId = null;

async function checkKreekCraft(client) {
  try {
    const res = await fetch(KREEK_LIVE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = await res.text();

    // YouTube embeds stream state in the page's JSON data
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveNow":true');

    if (!isLive) {
      console.log(`[KreekWatch] Not live (${new Date().toLocaleTimeString()})`);
      return;
    }

    // Extract the video ID (11-char YouTube ID)
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const videoId = videoIdMatch?.[1];

    // Don't spam — only notify once per stream
    if (!videoId || videoId === lastNotifiedVideoId) return;
    lastNotifiedVideoId = videoId;

    // Extract stream title
    const titleMatch = html.match(/"text":"([^"]{3,100})"/);
    const title = titleMatch?.[1]?.replace(/\\u0026/g, '&') || 'KreekCraft is LIVE!';

    const channel = await client.channels.fetch(ALERT_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.error('[KreekWatch] Could not fetch alert channel:', ALERT_CHANNEL_ID);
      return;
    }

    await channel.send(
      `🔴 **KreekCraft just went LIVE!**\n**${title}**\nhttps://youtube.com/watch?v=${videoId}`
    );

    console.log(`[KreekWatch] 📺 Alert sent! Stream: ${videoId} — "${title}"`);
  } catch (err) {
    console.error('[KreekWatch] Check failed:', err.message);
  }
}

function startKreekWatch(client) {
  console.log('[KreekWatch] 👀 Watching KreekCraft — checking every 5 minutes');
  checkKreekCraft(client);                            // immediate check on startup
  setInterval(() => checkKreekCraft(client), POLL_INTERVAL);
}

module.exports = { startKreekWatch };
