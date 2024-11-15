const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const { logger } = require('../utils/logger');

const createAnthropicProvider = async (config) => {
  if (!config.apiKey) {
    throw new Error('Anthropic API key is required');
  }

  const client = new Anthropic({
    apiKey: config.apiKey
  });

  return {
    generateResponse: async (prompt, systemPrompt = '', imageUrls = []) => {
      try {
        await config.rateLimiters.anthropic.tryRequest();
        if (imageUrls.length > 0 && config.handleImages) {
          const imageParts = await Promise.all(
            imageUrls.map(async (url) => {
              const response = await axios.get(url, { responseType: 'arraybuffer' });
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: response.headers['content-type'],
                  data: Buffer.from(response.data).toString('base64')
                }
              };
            })
          );
    
        const messages = [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageParts
          ]
        }];
    
        const response = await client.messages.create({
          model: config.model,
          system: systemPrompt,
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxOutputTokens ?? 1000
        });

        logger.debug(`Response generated successfully ${JSON.stringify({
          model: config.model,
          systemPrompt: systemPrompt.length,
          userPrompt: messages.length
        })}`);
    
        return response.content[0].text;
      } else {
        const messages = [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
          ]
        }];
        const response = await client.messages.create({
          model: config.model,
          system: systemPrompt,
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxOutputTokens ?? 1000
        }); 
        
        logger.debug(`Response generated successfully ${JSON.stringify({
          model: config.model,
          systemPrompt: systemPrompt.length,
          userPrompt: messages.length
        })}`);
        
        return response.content[0].text;
      }
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new Error('Service temporarily unavailable due to rate limiting');
      }      
      logger.error(`Anthropic API Error: ${error}`);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
    }
  };
};

module.exports = { createAnthropicProvider };