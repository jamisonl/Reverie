# Reverie: LLM-Powered Discord Bot

> Reverie is a configurable Discord bot you can chat with that maintains conversation context using a vector database, and can interact with multiple AI providers. You can set custom system prompts, instructions, LLM models and more!
# How to Create a Discord Bot Through the Developer Portal

##  Access the Developer Portal
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click the "New Application" button in the top right

## 2. Create Your Application
1. Enter a name for your application
2. Accept the Developer Terms of Service
3. Click "Create"

## 3. Set Up the Bot User
1. Click on "Bot" in the left sidebar
2. Click "Add Bot"
3. Confirm by clicking "Yes, do it!"
4. Click on "Bot" in the left sidebar
5. Under the bot's username, you'll see your bot token
   - Click "Copy" to copy your token
   - ⚠️ **NEVER share your bot token publicly!**
   - If your token is compromised, click "Reset Token"

## 🔑 Required Discord Bot Permissions

### Required Intents
* Presence Intent
* Server Members Intent
* Message Content Intent

### Generate Invite Link
1. Click on "OAuth2" in the left sidebar
2. Select "URL Generator"
3. Under "Scopes", select:
  - `bot`
4. Under "Bot Permissions", select the needed permissions:
    * Send Messages
    * Send Messages in Threads
    * Use Slash Commands
    * Read Message History
    * Add Reactions
    * Attach Files
    * Embed Links
    * Use External Emojis
    * Use External Stickers
5. Copy the generated URL at the bottom

## ⚙️ Environment Variables

```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token
BOT_NAME=your_bot_name
RESTRICT_CHANNELS=false # Optional, if true, set the allowed channels below
ALLOWED_CHANNELS={"123456789": "channel-name", "987654321": "another-channel"} # Right-click on a text channel, and select "Copy Channel ID". Make sure these IDs have quotes!
ADMIN_USERS=["123456789"] # Optional, allows for database operations

# Message Settings
SYSTEM_PROMPT="You are a pirate who sails the high seas..."
MESSAGE_RESPONSE_GUIDELINES="- Be helpful\n- Be concise\n- Use proper formatting\n If referring to someone, mention them by id.
Format an id like this <@id>"
MAX_HISTORY_MESSAGES=20
MAX_MESSAGE_LENGTH=2000
SIMILARITY_THRESHOLD=0.72
REACTION_RESPONSE_CHANCE=0.5
HANDLE_IMAGES=true

# Database Configuration
DB_PATH=conversations.db

# Vector Database (ChromaDB)
VECTOR_DB_HOST=127.0.0.1
VECTOR_DB_PORT=8000
VECTOR_DB_PROTOCOL=http

# AI Provider Configuration
AI_API_KEY=your_api_key
AI_MODEL_NAME=gpt-4-turbo-preview
TEMPERATURE=0.7
MAX_TOKENS=1000
AI_BASE_URL=https://api.openai.com/v1  # Optional, for custom endpoints
```

## 📦 Prerequisites

### ChromaDB Installation

1. **Docker Installation (Recommended)**
```bash
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

2. **Local Python Installation**
```bash
pip install chromadb
```

For detailed ChromaDB installation and configuration options, visit the [ChromaDB Documentation](https://docs.trychroma.com).


## 🚀 Quick Start

1. Clone the repository
```bash
git clone https://github.com/name
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file with your configuration
```bash
cp .env.example .env
# Edit .env with your values
```

4. Start the bot
```bash
npm start
```

I recommend using [PM2](https://www.npmjs.com/package/pm2) to keep your bot running:

```bash
# Install PM2 globally
npm install pm2 -g

# Start your bot with PM2
pm2 start npm --name "reverie-bot" -- start

# Other useful PM2 commands
pm2 status        # Check status of all processes
pm2 logs          # View logs
pm2 restart all   # Restart all processes
pm2 save          # Save current process list
pm2 startup       # Configure PM2 to start on system boot
```

## ✨ Features

* Multi-provider AI support
  * OpenAI-compatible APIs
  * Anthropic Claude
  * Google Gemini
* Vector-based conversation memory
* Image processing capabilities
* Configurable response behavior
* SQLite message history
* Channel whitelisting
* Admin commands (clear history, rebuild vector database)


## ❗ Common Issues

1. **Message Content Intent**: Make sure this is enabled in the Discord Developer Portal
2. **Channel Access**: Bot needs to be invited with correct permissions
3. **Rate Limits**: Different AI providers have different rate limits
4. **Token Limits**: Watch for token limits in your AI provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

see LICENSE file for details