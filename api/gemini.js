const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { logger } = require('../utils/logger');

const createGeminiProvider = async (config) => {
  if (!config.apiKey) {
    throw new Error('Gemini API key is required');
  }
  const safetySettings = [
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
  ];
  const client = new GoogleGenerativeAI(config.apiKey);
  const model = client.getGenerativeModel({ 
    model: config.model,
    safetySettings: safetySettings,
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 1000,

    }
  });

  return {
    generateResponse: async (prompt, systemPrompt = '', imageUrls = []) => {
      try {
        await config.rateLimiters.gemini.tryRequest();
        if (imageUrls.length > 0 && config.handleImages) {
          const imageParts = await Promise.all(
            imageUrls.map(async (url) => {
              const response = await axios.get(url, { responseType: 'arraybuffer' });
              return {
                inlineData: {
                  data: Buffer.from(response.data).toString('base64'),
                  mimeType: response.headers['content-type']
                }
              };
            })
          );

          const result = await model.generateContent([
            { text: `${systemPrompt}\n${prompt}` },
            ...imageParts
          ]);

          logger.debug(`Response generated successfully ${JSON.stringify({
            model: config.model,
            systemPrompt: systemPrompt.length,
            userPrompt: prompt.length
          })}`);
     
          return result.response.text();
        } else {
          const result = await model.generateContent(`${systemPrompt}\n${prompt}`);

          logger.debug(`Response generated successfully ${JSON.stringify({
            model: config.model,
            systemPrompt: systemPrompt.length,
            userPrompt: prompt.length
          })}`);

          return result.response.text();
        }
      } catch (error) {
        if (error.message === 'Rate limit exceeded') {
          throw new Error('Service temporarily unavailable due to rate limiting');
        }
        logger.error(`Gemini API Error: ${error}`);
        throw new Error(`Failed to generate response: ${error.message}`);
      }
    }
  };
};

module.exports = { createGeminiProvider };