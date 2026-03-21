import { logError } from '../utils/log.js';

export class DB {
  constructor(env) {
    this.kv = env.DB;
  }

  async get(key) {
    try {
      return await this.kv.get(key);
    } catch (err) {
      logError('KV get failed', { key, error: err.message });
      throw err;
    }
  }

  async put(key, value, options = {}) {
    try {
      await this.kv.put(key, value, options);
    } catch (err) {
      logError('KV put failed', { key, error: err.message });
      throw err;
    }
  }

  async delete(key) {
    try {
      await this.kv.delete(key);
    } catch (err) {
      logError('KV delete failed', { key, error: err.message });
      throw err;
    }
  }

  async list(options) {
    try {
      return await this.kv.list(options);
    } catch (err) {
      logError('KV list failed', { options, error: err.message });
      throw err;
    }
  }
}