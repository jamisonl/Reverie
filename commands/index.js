const { Collection } = require('discord.js');
const clearHistoryCommand = require('./clearHistory');
const indexChannelHistoryCommand = require('./indexChannel');

const commands = new Collection();
commands.set(indexChannelHistoryCommand.data.name, indexChannelHistoryCommand);
commands.set(clearHistoryCommand.data.name, clearHistoryCommand);

module.exports = commands;