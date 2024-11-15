const { createMessageHandler } = require('./createMessageHandler');
const { createReactionHandler } = require('./createReactionHandler');
const { createCommandHandler } = require('./createCommandHandler');
const commands = require('../commands');

const createHandlers = ({ aiProvider, vectorHandler, database }) => {
  return [
    createMessageHandler(aiProvider, vectorHandler, database),
    createReactionHandler(aiProvider),
    createCommandHandler(commands, vectorHandler)
  ];
};

module.exports = { createHandlers };