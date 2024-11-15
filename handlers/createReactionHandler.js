const { getSystemPrompt } = require('../utils');
const { logger } = require('../utils/logger');

const createReactionHandler = (aiProvider) => ({
  eventType: 'messageReactionAdd',
  
  handle: async ({ reaction, user, config }) => {
    logger.debug(`handling reaction ${JSON.stringify(reaction)}`);
    try {
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          logger.error(`Error fetching reaction: ${error}`);
          return;
        }
      }

      logger.info(`MessageReactionAdd event received: ${JSON.stringify({
        emoji: reaction.emoji?.name,
        user: user?.username,
        messageId: reaction.message?.id,
        channelId: reaction.message?.channel?.id
      })}`);

      if (shouldRespondToReaction(config.reactionResponseChance)) {
        const response = await generateReactionResponse({
          reaction,
          user,
          config,
          aiProvider
        });
        
        await reaction.message.reply(response);
      } else {
        logger.info('Randomly chose to ignore emoji reaction');
      }
    } catch (error) {
      logger.error(`Error processing reaction: ${error}`);
    }
  }
});

const shouldRespondToReaction = (chance = 0.5) => {
  return Math.random() < chance;
};

const generateReactionResponse = async ({ reaction, user, config, aiProvider }) => {
  const body = {
    username: user.username,
    userId: user.id,
    emoji: reaction.emoji.name,
    messageContent: reaction.message.content
  };
  logger.debug(`reaction prompt: ${JSON.stringify(body)}`);
  const prompt = createReactionPrompt(body);

  return await aiProvider.generateResponse(
    prompt,
    getSystemPrompt(config)
  );
};

const createReactionPrompt = ({ username, userId, emoji, messageContent }) => {
  return `${username} with id ${userId} has reacted with the emoji ${emoji} to a message ${messageContent}.\n Respond to the emoji. Keep it brief.`;
};

module.exports = { createReactionHandler };