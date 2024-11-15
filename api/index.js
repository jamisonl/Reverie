const { createGeminiProvider } = require('./gemini');
const { createOpenAIProvider } = require('./openai');
const { createAnthropicProvider } = require('./anthropic');
const { logger } = require('../utils/logger');

const createAIProvider = async (config) => {
  const model = config.model.toLowerCase();
  logger.debug(`using model ${model}`);
  switch (true) {
    case model.includes('gemini'):
    case model.includes('tunedModels'):
      return await createGeminiProvider(config);
    case model.includes('claude'):
      return await createAnthropicProvider(config);
    default:
      return await createOpenAIProvider(config);
  }
};

module.exports = { createAIProvider };