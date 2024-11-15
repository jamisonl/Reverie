const { SlashCommandBuilder } = require('discord.js');
const { logger } = require('../utils/logger');

const clearHistoryCommand = {
  data: new SlashCommandBuilder()
    .setName('clear-history')
    .setDescription('Clears the conversation history for the current thread'),

  async execute({ interaction, queries, config }) {
    if (!config.adminUsers?.includes(interaction.user.id)) {
      await interaction.reply({ 
        content: 'You do not have permission to use this command.',
        ephemeral: true 
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const success = await queries.clearHistory(interaction.channelId);
      
      if (success) {
        await interaction.editReply('Successfully cleared conversation history for this thread.');
      } else {
        await interaction.editReply('Failed to clear conversation history. Please try again.');
      }
    } catch (error) {
      logger.error(`Error in clear-history command: ${error}`);
      await interaction.editReply('An error occurred while clearing the history.');
    }
  }
};

module.exports = clearHistoryCommand;