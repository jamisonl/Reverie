const { logger } = require('../utils/logger');
const { trimResponseForDiscord } = require('../utils');
const { getSystemPrompt } = require('../utils');

const createMessageHandler = (aiProvider, vectorHandler, database) => ({
  eventType: 'messageCreate',
  
  handle: async ({ message, config }) => {
    logger.debug(`handling message ${message}`);
    // Skip bot's own messages
    if (message.author.bot && 
        message.author.username.toLowerCase() === config.botName.toLowerCase()) {
      return;
    }

    try {
      logger.info(`messageCreate event received: ${JSON.stringify({
        user: message.user?.username,
        content: `${message.content.slice(0, parseInt(message.content.length / 4))}...`,
        messageId: message?.id,
        channelId: message?.channel?.id
      })}`);
      const context = await vectorHandler.getResponseContext({
        content: message.content,
        threadId: message.channel.id,
        userId: message.author.id,
        replyTo: await getReplyReference(message, config),
        mentions: message.mentions.users.map(user => user.username.toLowerCase())
      });

      if (!context.shouldRespond) {
        await storeMessage(vectorHandler, message);
        return;
      }

      const response = await generateAndStoreResponse({
        message,
        context,
        config,
        aiProvider,
        database,
        vectorHandler
      });

      const botReply = await sendResponse(message, response, config);
      await storeMessage(vectorHandler, botReply);

    } catch (error) {
      logger.error(`Error processing message: ${error}`);
      await message.reply(`*${config.botName} seems distracted...*`);
    }
  }
});

const getReplyReference = async (message, config) => {
  if (!message.reference) return null;
  
  try {
    const referenced = await message.fetchReference();
    return {
      messageId: referenced.id,
      author: referenced.author.username,
      content: referenced.content,
      isBot: referenced.author.username.toLowerCase() === config.botName.toLowerCase()
    };
  } catch (error) {
    logger.error(`Error fetching reference message: ${error}`);
    return null;
  }
};

const generateAndStoreResponse = async ({
  message,
  context,
  config,
  aiProvider,
  database,
  vectorHandler
}) => {
  await database.createOrUpdateUser(message.author.id, message.author.username);
  const recentMessages = await database.getRecentMessages(message.author.id, config.database.maxRecentMessages);
  const messageId = await database.createMessage(
    message.author.id,
    message.content,
    getSystemPrompt(config)
  );
  logger.debug(`retrieving last ${config.database.maxRecentMessages} message(s) from sqlite, and ${config.vector.contextWindow} relevant messages with similarity ${config.vector.similarityThreshold} from chroma..`);
  const images = Array.from(message.attachments.values())
    .filter(att => att.contentType?.startsWith('image/'));

  if (images.length) {
    for (const image of images) {
      await database.addMessageImage(messageId, image.url, image.contentType);
    }
  }

  const imageUrls = images.map(img => img.url);
  const enhancedContent = [
    `You hear ${message.author.username} with id ${message.author.id} say "${message.content}"`,
    `${context.replyTo && context.replyTo.isBot ? `They are replying to your previous message: "${context.replyTo.content}"` : ""}`,
    `This is a history of related messages:`,
    ...(recentMessages || []).map(msg => `${msg.username}: ${msg.content}  ${new Date(msg.created_at).toISOString()}`),
    ...(context.relevantMessages || []).map(msg => `${msg.author}: ${msg.content}  ${new Date(msg.metadata.timestamp).toISOString()}`)
  ].join('\n');

  logger.debug(getSystemPrompt(config));
  logger.debug(enhancedContent);
  const response = await aiProvider.generateResponse(
    enhancedContent,
    getSystemPrompt(config),
    imageUrls
  );

  await database.addBotResponse(messageId, response, message.id);
  return response;
};

const sendResponse = async (message, response, config) => {
  const trimmedResponse = trimResponseForDiscord(response, config.maxMessageLength);
  return await message.reply(trimmedResponse);
};

const storeMessage = async (vectorHandler, message) => {
  await vectorHandler.addMessage({
    id: message.id,
    content: message.content,
    timestamp: message.createdTimestamp,
    author: message.author.username,
    threadId: message.channel.id,
    userId: message.author.id,
    username: message.author.username,
    isBot: message.author.bot
  });
};



module.exports = { createMessageHandler };