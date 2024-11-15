const { logger } = require("../utils/logger");

const createMessageUtils = (config) => {
  const isDirectMention = (content, botId) => {
    const mentionPatterns = [
      new RegExp(`<@${botId}>`, 'i'),  // Discord mention format
      new RegExp(`@${config.botName}\\b`, 'i'),
      new RegExp(`\\b${config.botName}\\b`, 'i')
    ];
    const isDirect = mentionPatterns.some(pattern => pattern.test(content));
    logger.debug(`mention patterns: ${mentionPatterns}, is direct mention: ${isDirect}`);
    return isDirect;
  };

  const isQuestion = (content) => {
    const questionPatterns = [
      /\?$/,
      /^(what|who|where|when|why|how|can|could|would|should|is|are|do|does|did)/i,
      /\b(anyone|anybody)\b/i
    ];
    const isQuestion = questionPatterns.some(pattern => pattern.test(content));
    logger.debug(`question patterns: ${questionPatterns}, is question: ${isQuestion}`);
    return isQuestion;
  };

  const formatMessageForPrompt = (message) => {
    return `${message.metadata.username} (${message.metadata.userId}): ${message.content}`;
  };

  const calculateMessageSimilarity = (message1, message2) => {
    const words1 = new Set(message1.toLowerCase().split(/\s+/));
    const words2 = new Set(message2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  return {
    isDirectMention,
    isQuestion,
    formatMessageForPrompt,
    calculateMessageSimilarity
  };
};

module.exports = { createMessageUtils };