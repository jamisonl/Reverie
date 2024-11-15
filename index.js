const { createBot } = require('./core/createBot');
const { createHandlers } = require('./handlers');
const { createReadyHandler } = require('./handlers/createReadyHandler');
const { createMessageHandler } = require('./handlers/createMessageHandler');
const { createReactionHandler } = require('./handlers/createReactionHandler');
const { createAIProvider } = require('./api');
const { createVectorHandler } = require('./rag');
const { createDatabase } = require('./db');
const commands = require('./commands');
const { config } = require('dotenv');
const { createCommandHandler } = require('./handlers/createCommandHandler');
const { createRateLimiter } = require('./utils/rateLimiter');
const { logger } = require('./utils/logger');

const loadConfig = () => {
  config();

  const requiredEnvVars = [
    'DISCORD_TOKEN',
    'BOT_NAME',
    'AI_MODEL_NAME',
    'AI_API_KEY',
    'VECTOR_DB_HOST'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  return {
    token: process.env.DISCORD_TOKEN,
    botName: process.env.BOT_NAME,
    systemPrompt: process.env.SYSTEM_PROMPT,
    messageResponseGuidelines: process.env.MESSAGE_RESPONSE_GUIDELINES,
    maxMessageLength: process.env.MAX_MESSAGE_LENGTH,
    adminUsers: process.env.ADMIN_USERS,
    restrictChannels: process.env.RESTRICT_CHANNELS === 'true',
    allowedChannels: process.env.ALLOWED_CHANNELS ? JSON.parse(process.env.ALLOWED_CHANNELS) : "",
    database: {
      path: process.env.DB_PATH || `${process.env.BOT_NAME}_conversations.db`,
      maxRecentMessages: process.env.MAX_RECENT_DB_MESSAGES || 2,
    },
    ai: {
      model: process.env.AI_MODEL_NAME,
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
      handleImages: process.env.HANDLE_IMAGES === 'true',
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
      maxOutputTokens: parseInt(process.env.MAX_TOKENS || '1000')
    },
    vector: {
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
      contextWindow: parseInt(process.env.MAX_HISTORY_MESSAGES || '10'),
      clientConfig: {
        collectionName: process.env.COLLECTION_NAME,
        protocol: process.env.VECTOR_DB_PROTOCOL || 'http',
        host: process.env.VECTOR_DB_HOST || '127.0.0.1',
        port: parseInt(process.env.VECTOR_DB_PORT || '8000'),
      }
    },
    rateLimits: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
      timeWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
    },
  };
};

const startBot = async () => {
  try {
    const config = loadConfig();
    logger.info(`Starting bot: ${config.botName}`);

    const rateLimiters = {
      anthropic: createRateLimiter(config.rateLimits.maxRequests, config.rateLimits.timeWindowMs),
      openai: createRateLimiter(config.rateLimits.maxRequests, config.rateLimits.timeWindowMs),
      gemini: createRateLimiter(config.rateLimits.maxRequests, config.rateLimits.timeWindowMs)
    };    

    const database = await createDatabase(config.database.path);
    const vectorHandler = await createVectorHandler(config.vector);
    const aiProvider = await createAIProvider({ ...config.ai, rateLimiters });

    const readyHandler = createReadyHandler();
    const messageHandler = createMessageHandler(aiProvider, vectorHandler, database);
    const reactionHandler = createReactionHandler(aiProvider);
    const commandHandler = createCommandHandler(commands, vectorHandler);

    const bot = await createBot(config, messageHandler, reactionHandler, readyHandler, commandHandler);
    await vectorHandler.setBotIdentity(bot.user);

    process.on('SIGINT', async () => {
      await database.close();
      vectorHandler.stopHealthCheck?.();
      logger.info('Gracefully shut down services');
      process.exit(0);
    });

    return bot;
  } catch (error) {
    logger.error(`Failed to start bot: ${error}`);
    throw error;
  }
};

startBot().catch(error => {
  logger.error(`Fatal error starting bot: ${error}`);
  process.exit(1);
});

