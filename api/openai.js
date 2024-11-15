const OpenAI = require('openai');
const { logger } = require('../utils/logger');

const createOpenAIProvider = async (config) => {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || 'https://api.openai.com/v1',
    maxRetries: 3,
    timeout: 30000
  });

  return {
    generateResponse: async (prompt, systemPrompt = '', imageUrls = []) => {      
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];
        if (imageUrls.length > 0 && config.handleImages) {
          messages[1].content = [
            { type: 'text', text: prompt },
            ...imageUrls.map(url => ({
              type: 'image_url',
              image_url: { url }
            }))
          ];
        }
        await config.rateLimiters.openai.tryRequest();
        const startTime = Date.now();
        const response = await client.chat.completions.create({
          model: config.model,
          messages,
          temperature: config.temperature ?? 0.7,
        });
        const duration = Date.now() - startTime;

        logger.debug(`Response generated successfully ${JSON.stringify({
          model: config.model,
          duration: `${duration}ms`,
          systemPrompt: systemPrompt.length,
          userPrompt: prompt.length
        })}`);

        return response.choices[0].message.content;
      } catch (error) {
        if (error.message === 'Rate limit exceeded') {
          throw new Error('Service temporarily unavailable due to rate limiting');
        }        
        logger.error(`OpenAI API Error: ${JSON.stringify({
          error: error.message,
          code: error.code,
          type: error.type,
          config: {
            model: config.model,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            baseURL: config.baseURL,
            maxRetries: client.maxRetries,
            timeout: client.timeout
          },
          prompt: {
            systemPrompt: systemPrompt?.length,
            userPrompt: prompt?.length,
            imageCount: imageUrls?.length
          }
        })}`);
        throw new Error(`Failed to generate response: ${error.message}`);
      }
    }
  };
};

module.exports = { createOpenAIProvider };