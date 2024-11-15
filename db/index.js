const sqlite3 = require('sqlite3').verbose();

const createDatabase = async (dbPath) => {
  const db = new sqlite3.Database(dbPath);
  
  await initializeTables(db);
  
  return {
    createOrUpdateUser: (userId, username) => createOrUpdateUser(db, userId, username),
    createMessage: (userId, content, systemPrompt) => createMessage(db, userId, content, systemPrompt),
    addMessageImage: (messageId, imageUrl, contentType) => addMessageImage(db, messageId, imageUrl, contentType),
    addBotResponse: (messageId, response, replyToId) => addBotResponse(db, messageId, response, replyToId),
    getRecentMessages: (userId, maxRecentMessages) => getRecentMessages(db, userId, maxRecentMessages),
    close: () => closeDatabase(db)
  };
};

const initializeTables = (db) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Messages table
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        system_prompt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Images table
      db.run(`CREATE TABLE IF NOT EXISTS message_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        content_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(message_id) REFERENCES messages(id)
      )`);

      // Bot responses table
      db.run(`CREATE TABLE IF NOT EXISTS bot_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        reply_to_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(message_id) REFERENCES messages(id)
      )`);
    });

    resolve();
  });
};

const createOrUpdateUser = (db, userId, username) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO users (id, username) 
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        username = excluded.username,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    db.run(query, [userId, username], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const createMessage = (db, userId, content, systemPrompt) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO messages (user_id, content, system_prompt)
      VALUES (?, ?, ?)
    `;
    
    db.run(query, [userId, content, systemPrompt], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const addMessageImage = (db, messageId, imageUrl, contentType) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO message_images (message_id, url, content_type)
      VALUES (?, ?, ?)
    `;
    
    db.run(query, [messageId, imageUrl, contentType], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const addBotResponse = (db, messageId, content, replyToId) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO bot_responses (message_id, content, reply_to_id)
      VALUES (?, ?, ?)
    `;
    
    db.run(query, [messageId, content, replyToId], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const getRecentMessages = (db, userId, maxRecentMessages) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.user_id, u.username, m.content, m.created_at
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `;
    
    db.all(query, [userId, maxRecentMessages], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const closeDatabase = (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = { createDatabase };