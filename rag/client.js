const { ChromaClient } = require('chromadb');
const { logger } = require('../utils/logger');

const createChromaClient = async (config) => {
  const url = `${config.clientConfig.protocol}://${config.clientConfig.host}:${config.clientConfig.port}`;
  logger.info(`Connecting to ChromaDB at: ${url}`);

  const client = new ChromaClient({
    path: url,
    fetchOptions: {
      keepalive: true,
      timeout: 30000,
    }
  });

  let collection = null;

  const initialize = async () => {
    try {
      collection = await client.getOrCreateCollection({
        name: config.collectionName,
        metadata: { 
          "hnsw:space": "cosine"
        }
      });
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ChromaDB collection: ${error}`);
      return false;
    }
  };

  const withErrorHandling = (fn) => async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`ChromaDB operation failed: ${error.message}`);
      throw error;
    }
  };

  const withRetry = (fn, maxRetries = 3) => async (...args) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          logger.info(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };

  const checkConnection = async () => {
    try {
      await client.heartbeat();
      return true;
    } catch (error) {
      logger.error(`ChromaDB connection check failed: ${error}`);
      return false;
    }
  };

  const startHealthCheck = (intervalMs = 30000) => {
    const interval = setInterval(async () => {
      const isHealthy = await checkConnection();
      if (!isHealthy) {
        logger.warn('ChromaDB connection unhealthy, attempting to reconnect...');
        await initialize();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  };

  await initialize();
  const stopHealthCheck = startHealthCheck();

  return {
    collection,
    initialize,
    checkConnection,
    stopHealthCheck,
    client
  };
};

module.exports = { createChromaClient };