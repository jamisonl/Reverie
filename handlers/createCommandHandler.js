const { logger } = require('../utils/logger');

const createCommandHandler = (commands, vectorHandler) => ({
    eventType: 'interactionCreate',
    
    handle: async ({ interaction, client, config }) => {
        logger.debug(`handling interaction ${interaction}`);
      if (!interaction.isChatInputCommand()) return; 
      
      logger.info(`Received command: ${interaction.commandName}`); 
      
      const command = commands.get(interaction.commandName);
      if (!command) {
        logger.info(`Command not found: ${interaction.commandName}`);
        return;
      }
  
      try {
        await command.execute({ 
          interaction, 
          queries: vectorHandler,
          config,
          client
        });
      } catch (error) {
        logger.error(`Error executing command: ${error}`);
        const reply = { 
          content: 'There was an error executing this command!',
          ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  });
  
  module.exports = { createCommandHandler };