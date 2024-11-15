const { logger } = require('../utils/logger');
const { createChromaClient } = require('./client');
const { createMessageQueries } = require('./queries');
const { createMessageUtils } = require('./utils');

const createVectorHandler = async (config = {}) => {
  const defaultConfig = {
    botName: config.botName || 'assistant',
    similarityThreshold: config.similarityThreshold || 0.75,
    contextWindow: config.contextWindow || 10,
    collectionName: config.collectionName || 'chat_messages',
    clientConfig: config.clientConfig || {}
  };

  const { collection, initialize } = await createChromaClient(defaultConfig);
  const { addMessage, clearHistory } = createMessageQueries(collection);
  const { 
    isDirectMention,
    isQuestion,
  } = createMessageUtils(defaultConfig);

  let botId = null;

  return {
    initialize: async () => {
      try {
        await initialize();
        logger.info('Vector database initialized');
        return true;
      } catch (error) {
        logger.error(`Failed to initialize vector database: ${error}`);
        return false;
      }
    },

    addMessage,
    clearHistory,

    setBotIdentity: async (user) => {
      botId = user.id;
      defaultConfig.botName = user.username.toLowerCase();
      logger.info(`Bot identity set: ${defaultConfig.botName} (${botId})`);
    },

    getResponseContext: async (newMessage) => {
      if (!collection) {
        throw new Error('Database not initialized');
      }

      try {
        let shouldRespond = isDirectMention(newMessage.content, botId) || 
                          newMessage.mentions?.includes(defaultConfig.botName) ||
                          (newMessage.replyTo?.author === defaultConfig.botName);

        const results = await collection.query({
          queryTexts: [newMessage.content],
          nResults: defaultConfig.contextWindow,
          where: {
            threadId: newMessage.threadId
          },
          minScore: defaultConfig.similarityThreshold
        });

        if (!results || !results.distances[0]) {
          return { 
            shouldRespond: shouldRespond || isQuestion(newMessage.content),
            relevantMessages: [],
            avgSimilarity: 0,
            replyTo: newMessage.replyTo
          };
        }
        logger.debug(`Query results: ${JSON.stringify({
          metadatas: results.metadatas,
          distances: results.distances,
          documents: results.documents
        })}`);
        const relevantMessages = results.distances[0]
          .map((distance, index) => ({
            content: results.documents[0][index],
            author: results.metadatas[0][index].author,
            metadata: {
              ...results.metadatas[0][index],
              isBot: results.metadatas[0][index].author.toLowerCase() === defaultConfig.botName.toLowerCase()
            },
            similarity: 1 - (distance/2),
          }))
          .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

        const avgSimilarity = relevantMessages.length ?
          relevantMessages.reduce((acc, msg) => acc + msg.similarity, 0) / relevantMessages.length :
          0;
          
          if (!shouldRespond) {
            shouldRespond = isQuestion(newMessage.content) || 
            (relevantMessages.length > 0 && avgSimilarity >= defaultConfig.similarityThreshold);
          }
          logger.info(`msg length: ${newMessage.content.length} user: ${newMessage.userId} avg similarity: ${avgSimilarity} should respond: ${shouldRespond}`);

        return {
          shouldRespond,
          relevantMessages,
          avgSimilarity,
          replyTo: newMessage.replyTo
        };

      } catch (error) {
        logger.error(`Error in getResponseContext: ${error}`);
        return {
          shouldRespond: false,
          relevantMessages: [],
          avgSimilarity: 0,
          replyTo: newMessage.replyTo
        };
      }
    }
  };
};

module.exports = { createVectorHandler };