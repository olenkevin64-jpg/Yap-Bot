# Yap Bot 🗣️

A Discord bot that cannot stop talking. Built with [discord.js v14](https://discord.js.org/).

---

## Features

| Feature | Description |
|---|---|
| Mention reply | Ping the bot and it fires back with a random funny message |
| `/yap` | Send a random yap message on demand |
| `/yap on` | Start automatic yapping in the current channel (Manage Server required) |
| `/yap off` | Stop automatic yapping in the current channel (Manage Server required) |
| Bot ignore | Never responds to other bots |
| Auto-command registration | Slash commands register on every startup |

---

## Environment Variables

All secrets and configuration live in environment variables — **never hardcoded**.

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | ✅ | Application / Client ID |
| `OWNER_DISCORD_ID` | — | Discord user ID of the bot owner |
| `YAP_CHANNEL_ID` | — | Channel to auto-yap in on startup |
| `YAP_INTERVAL_MINUTES` | — | Minutes between auto-yap messages (default: 360) |

### Adding secrets in Replit

1. Open the **Secrets** panel (🔒 icon in the left sidebar, or press the key icon).
2. Click **+ New Secret**.
3. Set **Key** to `DISCORD_TOKEN` and **Value** to your bot token.
4. Repeat for any other variables you want to set.
5. Restart the bot — it will pick them up automatically.

> ⚠️ Never paste your token into code or commit it to Git.

---

## Running on Replit

1. Add `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` to Replit Secrets (see above).
2. Open the Shell and run:
   ```
   cd yap-bot && npm install && node index.js
   ```
3. The bot logs in, registers slash commands globally, and starts listening.

---

## Discord Developer Portal setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) and open your app.
2. **Bot → Privileged Gateway Intents**: enable **Message Content Intent**.
3. **OAuth2 → URL Generator**: select `bot` + `applications.commands` scopes, then pick permissions (Send Messages, Read Message History, Use Slash Commands).
4. Use the generated URL to invite the bot to your server.

---

## Project structure

```
yap-bot/
├── index.js      # All bot logic
├── package.json  # Dependencies
├── .gitignore    # Keeps secrets out of Git
└── README.md     # This file
```
