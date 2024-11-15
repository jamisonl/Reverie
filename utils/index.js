const { logger } = require("./logger");

const trimResponseForDiscord = (response, maxLength = 2000) => {
    if (response.length <= maxLength) return response;
    
    const breakPoints = [
        response.lastIndexOf('. ', maxLength - 7),
        response.lastIndexOf('! ', maxLength - 7),
        response.lastIndexOf('? ', maxLength - 7),
        response.lastIndexOf('\n', maxLength - 7)
    ].filter(point => point !== -1);
  
    const breakPoint = Math.max(...breakPoints, maxLength - 3);
    return response.substring(0, breakPoint + 1) + '...';
  };

  const getSystemPrompt = (config) => 
    `${config.systemPrompt || ''}\n Your name is ${config.botName}.
    ${config.messageResponseGuidelines || ''}`;

  async function indexChannelMessages(config, client, vectorHandler, interaction) {
    const channelId = interaction.options.getString('channelid');
    if (!config.allowedChannels[channelId]) return;
    const channel = await client.channels.fetch(channelId);
    logger.info(`Starting to index messages from channel: ${channel.name}`);
    let indexed = 0;
    let lastMessageId = null;
  
    while (true) {
      const options = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }
  
      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) break;
  
      for (const message of messages.values()) {
        if (message.author.bot) continue; // Skip bot messages
        const formattedMessage = {
            id: message.id,
            content: message.content,
            timestamp: message.createdTimestamp,
            author: message.author.username,
            threadId: message.channel.id,
            userId: message.author.id,
            username: message.author.username,
            isBot: message.author.bot || false

        }
        await vectorHandler.addMessage(formattedMessage);
        indexed++;
      }
  
      lastMessageId = messages.last().id;
      logger.info(`Indexed ${indexed} messages so far...`);
    }
  
    logger.info(`Finished indexing ${indexed} messages from ${channel.name}`);
    return indexed;
  }
  module.exports = { trimResponseForDiscord, indexChannelMessages, getSystemPrompt };