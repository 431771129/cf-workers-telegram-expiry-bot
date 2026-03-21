import { DB } from './db.js';
import { DEFAULT_SESSION_TTL } from '../config.js';

export class SessionManager {
  constructor(env) {
    this.db = new DB(env);
  }

  async get(chatId) {
    const data = await this.db.get(`session:${chatId}`);
    return data ? JSON.parse(data) : {};
  }

  async set(chatId, session, ttl = DEFAULT_SESSION_TTL) {
    await this.db.put(`session:${chatId}`, JSON.stringify(session), { expirationTtl: ttl });
  }

  async clear(chatId) {
    await this.db.delete(`session:${chatId}`);
  }
}
