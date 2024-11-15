const { logger } = require('../utils/logger');

const createMessageQueries = (collection) => {
  const addMessage = async (message) => {
    if (!collection) {
      throw new Error('Collection not initialized');
    }

    try {
      await collection.add({
        ids: [message.id],
        documents: [message.content],
        metadatas: [{
          timestamp: message.timestamp,
          author: message.author,
          threadId: message.threadId,
          userId: message.userId,
          username: message.username,
          isBot: message.isBot || false
        }]
      });
      return true;
    } catch (error) {
      logger.error(`Failed to add message: ${error}`);
      return false;
    }
  };

  const getLastMessage = async (threadId) => {
    try {
      const results = await collection.query({
        queryTexts: [''],
        nResults: 1,
        where: {
          threadId: threadId
        }
      });

      if (results?.metadatas[0]?.length > 0) {
        return {
          content: results.documents[0][0],
          metadata: results.metadatas[0][0]
        };
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get last message: ${error}`);
      return null;
    }
  };

  const clearHistory = async (threadId) => {
    try {
      await collection.delete({
        where: {
          threadId: threadId
        }
      });
      return true;
    } catch (error) {
      logger.error(`Failed to clear history: ${error}`);
      return false;
    }
  };

  const queryMessages = async (queryText, threadId, config) => {
    try {
      const results = await collection.query({
        queryTexts: [queryText],
        nResults: config.contextWindow,
        where: {
          threadId: threadId
        },
        minScore: config.similarityThreshold
      });

      if (!results?.distances[0]) {
        return [];
      }

      return results.distances[0].map((distance, index) => ({
        content: results.documents[0][index],
        metadata: {
          ...results.metadatas[0][index],
          isBot: results.metadatas[0][index].author.toLowerCase() === config.botName.toLowerCase()
        },
        similarity: 1 - (distance/2)
      })).sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
    } catch (error) {
      logger.error(`Failed to query messages: ${error}`);
      return [];
    }
  };

  return {
    addMessage,
    getLastMessage,
    clearHistory,
    queryMessages
  };
};

module.exports = { createMessageQueries };