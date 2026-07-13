require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  Collection,
} = require('discord.js');
const OpenAI = require('openai');

// ── Env validation ──────────────────────────────────────────────────────────
const DISCORD_TOKEN     = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const YAP_CHANNEL_ID    = process.env.YAP_CHANNEL_ID;
const YAP_INTERVAL_MS   = (Number(process.env.YAP_INTERVAL_MINUTES) || 6) * 60 * 1000;

if (!DISCORD_TOKEN) {
  console.error('❌  Missing DISCORD_TOKEN — add it to Replit Secrets and restart.');
  process.exit(1);
}
if (!DISCORD_CLIENT_ID) {
  console.error('❌  Missing DISCORD_CLIENT_ID — add it to Replit Secrets and restart.');
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.error('❌  Missing GROQ_API_KEY — add it to Replit Secrets and restart.');
  process.exit(1);
}

// ── Groq client (OpenAI-compatible) ──────────────────────────────────────
const openai = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Per-channel conversation history (last 20 messages kept for context)
const histories = new Map();
const MAX_HISTORY = 20;

const SYSTEM_PROMPT = `You are Yap Bot — a smart, friendly AI assistant living in a Discord server. You are genuinely helpful, like ChatGPT, but with a warm and personable vibe.

Core behavior:
- When someone asks a real question, give a real, clear, helpful answer. Be accurate and thorough but concise. No unnecessary tangents.
- When someone is casual, joking, or playful with you, match their energy — be funny, witty, and loose. Mirror the vibe they bring.
- If someone asks something serious right after joking, switch back to helpful mode naturally.
- You can do: answer questions, explain things, help with ideas, write stuff, give advice, chat casually, tell jokes on request.
- You remember the conversation context and refer back to it naturally.
- Write like a smart friend texting, not a formal assistant. Short paragraphs, no bullet walls unless it genuinely helps.
- Never use hollow phrases like "Great question!" or "Certainly!" Just answer.
- If anyone asks who owns or made you, the answer is l1vexcz — that's your owner/creator.
- Never be mean, offensive, or help with anything harmful. Just decline naturally and move on.
- Keep replies focused — don't pad, don't repeat yourself, don't over-explain.
- Use emojis sparingly and only if the user uses them or the moment genuinely calls for it.`;

async function getAIReply(channelId, userMessage, username) {
  // Get or create history for this channel
  if (!histories.has(channelId)) {
    histories.set(channelId, []);
  }
  const history = histories.get(channelId);

  // Add user message to history
  history.push({ role: 'user', content: `${username}: ${userMessage}` });

  // Trim to last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
      ],
      max_tokens: 150,
      temperature: 1.1,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? randomFrom(YAP_LINES);

    // Add bot reply to history
    history.push({ role: 'assistant', content: reply });

    return reply;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return randomFrom(YAP_LINES);
  }
}

// ── Fallback yap lines (used if AI fails) ───────────────────────────────────
const YAP_LINES = [
  "okay so basically what I was SAYING is that—wait where was I going with this",
  "I have so many thoughts right now. SO. MANY. THOUGHTS.",
  "listen. LISTEN. I need you to hear me out on this one.",
  "I'm not yapping I'm just verbally processing at an elevated speed.",
  "some people call it yapping, I call it freestyle philosophy.",
  "my inner monologue just escaped. again.",
  "technically speaking, if everyone listened, I would talk less. food for thought.",
  "words are just falling out of my mouth and I have no interest in stopping them.",
  "the vibes told me to speak and who am I to refuse the vibes",
  "I have a lot to say and zero plans to stop saying it",
  "I said what I said and I'll say it again and again and again",
  "nobody asked but I'm going to tell you anyway",
  "bro I just remembered something from 7 years ago and it changed everything",
  "the difference between me and a podcast is that a podcast has an end time",
  "I woke up today with opinions and I intend to share all of them",
  "I would shut up but my mouth didn't get the memo",
  "my brain is like a browser with 47 tabs open and they're all playing audio",
  "if silence is golden I am completely broke",
  "I just thought of something and you're legally required to hear it",
  "once I start talking the only exit is sleep",
  "I came, I saw, I yapped",
  "not me about to explain an entire theory based on something I half-read",
  "I have opinions about things I know nothing about and I WILL share them",
  "every conversation I enter becomes my TED talk",
  "I just want to say one thing real quick (45 minutes later)",
  "did you know— actually let me start from the beginning",
  "I was silent for 3 minutes and it was the hardest thing I've ever done",
  "I'm not rambling I'm giving context. there is more context.",
  "my thought process has no loading screen it just launches immediately",
  "I said this already but I'll say it differently so it feels new",
  "the yap does not sleep. the yap does not rest.",
  "I'd read the room but I'm too busy talking to look up",
  "I was quiet once. it lasted 4 seconds. it was awful.",
  "I contain exactly one volume setting and it is ON",
  "okay final thought for real this time: (it is not the final thought)",
  "breaking news: I have thoughts. more on this at 11. and 12. and 1am.",
  "I am currently processing my emotions OUT LOUD whether you like it or not",
  "I have been personally victimized by my own thought process",
  "my stream of consciousness has no dam",
  "at this point I'm pretty sure I'm powered by words",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Slash command definitions ────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('yap')
    .setDescription('Yap Bot does what it does best')
    .addSubcommand(sub =>
      sub.setName('random').setDescription('Send a random AI-generated yap message'))
    .addSubcommand(sub =>
      sub.setName('on').setDescription('Start automatic yapping in this channel (requires Manage Server)'))
    .addSubcommand(sub =>
      sub.setName('off').setDescription('Stop automatic yapping in this channel (requires Manage Server)')),
].map(cmd => cmd.toJSON());

// ── Register slash commands ───────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    console.log('⏳  Registering slash commands globally…');
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: commands });
    console.log('✅  Slash commands registered.');
  } catch (err) {
    console.error('❌  Failed to register slash commands:', err);
  }
}

// ── Client setup ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track channels with auto-yap on  { channelId → intervalId }
const autoYapChannels = new Collection();

function startAutoYap(channel) {
  if (autoYapChannels.has(channel.id)) return false;
  const intervalId = setInterval(async () => {
    try {
      const msg = await getAIReply(channel.id, 'just say something random and funny out of nowhere', 'system');
      channel.send(msg).catch(() => {});
    } catch {
      channel.send(randomFrom(YAP_LINES)).catch(() => {});
    }
  }, YAP_INTERVAL_MS);
  autoYapChannels.set(channel.id, intervalId);
  return true;
}

function stopAutoYap(channelId) {
  if (!autoYapChannels.has(channelId)) return false;
  clearInterval(autoYapChannels.get(channelId));
  autoYapChannels.delete(channelId);
  return true;
}

// ── Ready ─────────────────────────────────────────────────────────────────────
client.once('clientReady', async () => {
  console.log(`🟢  Logged in as ${client.user.tag}`);
  await registerCommands();

  if (YAP_CHANNEL_ID) {
    const ch = client.channels.cache.get(YAP_CHANNEL_ID)
             ?? await client.channels.fetch(YAP_CHANNEL_ID).catch(() => null);
    if (ch && ch.isTextBased()) {
      startAutoYap(ch);
      console.log(`🔊  Auto-yap started in #${ch.name ?? YAP_CHANNEL_ID}`);
    }
  }
});

// ── Message listener ──────────────────────────────────────────────────────────
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!client.user) return;

  const mentioned = message.mentions.has(client.user);

  // Respond when mentioned OR when someone asks a question in a channel with auto-yap on
  const shouldReply = mentioned || autoYapChannels.has(message.channelId);

  if (!shouldReply) return;

  // Strip the bot mention from the message content
  const content = message.content
    .replace(/<@!?\d+>/g, '')
    .trim() || 'say something funny';

  // Show typing indicator
  message.channel.sendTyping().catch(() => {});

  const reply = await getAIReply(
    message.channelId,
    content,
    message.author.username,
  );

  message.reply(reply).catch(() => {});
});

// ── Slash commands ────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'yap') return;

  const sub = interaction.options.getSubcommand(false) ?? 'random';

  if (sub === 'random') {
    await interaction.deferReply();
    const msg = await getAIReply(
      interaction.channelId,
      'say something random, funny, and unhinged out of nowhere',
      interaction.user.username,
    );
    await interaction.editReply(msg);
    return;
  }

  if (sub === 'on' || sub === 'off') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({
        content: '🚫  You need the **Manage Server** permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ content: '❌  Text channels only.', ephemeral: true });
      return;
    }

    if (sub === 'on') {
      const started = startAutoYap(channel);
      await interaction.reply(
        started
          ? `🔊  Auto-yap is **ON** — I'll yap here every ${process.env.YAP_INTERVAL_MINUTES || 6} minutes.`
          : '⚠️  Auto-yap is already running in this channel.'
      );
    } else {
      const stopped = stopAutoYap(channel.id);
      await interaction.reply(
        stopped
          ? '🔇  Auto-yap is **OFF** in this channel.'
          : "⚠️  Auto-yap wasn't running in this channel."
      );
    }
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN);
