const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');

const createBot = async (config, messageHandler, reactionHandler, readyHandler, commandHandler) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
  });

  client.once(Events.ClientReady, async (c) => {
    await readyHandler.handle({ client });
  });

  client.on(Events.MessageCreate, async (message) => {
    const isAllowed = config.allowedChannels[message.channelId];
    if (config.restrictChannels && !isAllowed) return;
    await messageHandler.handle({ message, client, config });
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    const isAllowed = config.allowedChannels[reaction.message.channelId];
    if (config.restrictChannels && !isAllowed) return;
    await reactionHandler.handle({ reaction, user, client, config });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    const isAllowed = config.allowedChannels[interaction.channelId];
    if (config.restrictChannels && !isAllowed) return;
    await commandHandler.handle({ interaction, client, config });
  });

  await client.login(config.token);
  return client;
};

module.exports = { createBot };