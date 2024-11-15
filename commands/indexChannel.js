const { SlashCommandBuilder } = require('discord.js');
const { indexChannelMessages } = require('../utils');
const { logger } = require('../utils/logger');

const indexChannelHistoryCommand = {
    data: new SlashCommandBuilder()
      .setName('index-channel')
      .setDescription('Indexes the conversation history for the provided channel ID')
      .addStringOption(option =>
          option
            .setName('channelid')
            .setDescription('The ID of the channel to index')
            .setRequired(true)),
  
    async execute({ interaction, queries, config, client }) {
    if (!config.adminUsers?.includes(interaction.user.id)) {
      await interaction.reply({ 
        content: 'You do not have permission to use this command.',
        ephemeral: true 
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
    const success = await indexChannelMessages(config, client, queries, interaction);
      
      if (success) {
        await interaction.editReply('Successfully indexed this channel.');
      } else {
        await interaction.editReply('Failed to index! Please check if the channel ID is valid and the bot has proper permissions.');
      }
    } catch (error) {
      logger.error(`Error in index-channel command: ${error}`);
      await interaction.editReply('An error occurred while indexing.');
    }
  }
};

module.exports = indexChannelHistoryCommand;