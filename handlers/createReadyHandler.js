const { ActivityType } = require('discord.js');
const commands = require('../commands');
const { logger } = require('../utils/logger');

const createReadyHandler = () => ({
  eventType: 'ready',
  
  handle: async ({ client }) => {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
    
    try {
      logger.info('Started refreshing application (/) commands.');
      const commandArray = [...commands.values()];
      
      const commandsToRegister = commandArray.map(c => {
        logger.info(`Processing command: ${c.data.name}`);
        const json = c.data.toJSON();
        return json;
      });
      
      
      if (!client.application) {
        throw new Error('Client application is not ready');
      }
      
      registeredCmds = await client.application.commands.set(commandsToRegister);
      
      logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
      logger.error(`Error registering slash commands: ${error}`);
      logger.error(`Full error: ${error.stack}`);
    }

    client.user.setActivity(`${client.user.username}`, {
      type: ActivityType.Playing,
      status: "online",
    });
  }
});

module.exports = { createReadyHandler };